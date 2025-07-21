"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const json5_1 = __importDefault(require("json5"));
const task_manager_1 = require("../utils/task-manager");
const tools_1 = __importDefault(require("../utils/tools"));
const data_base_1 = __importDefault(require("./data-base"));
const asset_db_utils_1 = require("../utils/asset-db-utils");
const pako_1 = __importDefault(require("pako"));
class DbExporter {
    static init(prjRootDir, fOnCompleted) {
        this.dbName_2_db = {};
        this.dbFilePath_2_dbNameMap = {};
        this.dbNames_2_dbFilePathMap = {};
        this.loadedDbFilePaths = {};
        this.dbFilePath_2_dirty = {};
        this.prjRootDir = prjRootDir;
        // console.log("Exporter.init");
        // console.log("prjRootDir:", prjRootDir);
        this.srcDbRootDir = path_1.default.join(prjRootDir, "_config");
        // console.log("srcDbRootDir:", this.srcDbRootDir);
        let tm = new task_manager_1.TaskManager("Exporter.init", false);
        tm.addCall((fNext) => {
            let dbConfigJson5FilePath = path_1.default.join(this.srcDbRootDir, "db.config.json5");
            if (fs_extra_1.default.existsSync(dbConfigJson5FilePath)) {
                try {
                    let text = fs_extra_1.default.readFileSync(dbConfigJson5FilePath, { encoding: "utf-8" });
                    let data = json5_1.default.parse(text);
                    if (data) {
                        // console.log("检测到db.config.json5:", dbConfigJson5FilePath);
                        if (data.exportMode) {
                            this.exportMode = data.exportMode;
                        }
                        // if (data.mergeFieldToArrayKeepEmptyValue == true) {
                        //     this.mergeFieldToArrayKeepEmptyValue = true;
                        // }
                    }
                }
                catch (error) {
                    console.log("[警告] db.config.json5 解析失败", error);
                }
            }
            fNext();
        });
        if (!this.mergeFieldToArrayKeepEmptyValue) {
            console.log("");
            console.log("[提示] db.config.json5 中未配置 mergeFieldToArrayKeepEmptyValue");
            console.log("配置表导出器在处理MERGE_FLD_NAME功能时，会默认忽略所有的空白数据，在使用中会出现歧义：");
            console.log("如以下案例：");
            console.log("MERGE_FLD_NAME  strs    strs    strs");
            console.log("FLD_NAME        str1    str2    str3");
            console.log("DATA            a       b       c                  strs=['a', 'b', 'c']");
            console.log("DATA            a               c                  strs=['a', 'c']");
            console.log("DATA            a       b                          strs=['a', 'b'");
            console.log("");
            console.log("第二条数据中，按照预期c应该是属于第三个字段，实际导出的strs中，strs[1]为'c'不符合预期");
            console.log("修复后，输出的strs依次为：['a', 'b', 'c'], ['a', '', 'c'], ['a', 'b', '']");
            console.log("");
            console.log("由于此功能会改变导出逻辑，可能影响项目中已有数据的导出，修改后请仔细核对preview-db中的文件改动。");
            console.log("");
            console.log("修复方式：");
            console.log("1. 打开项目库中_config/db.config.json5");
            console.log("2. 在exportMode字段后，新增配置 mergeFieldToArrayKeepEmptyValue: true     (注意，true是布尔值，不是字符串）");
            console.log("3. 重新导出配置表，检查preview_db中json文件的改动，确保现有数据不受影响");
            console.log("");
        }
        tm.addCall((fNext) => {
            this.previewDbDir = path_1.default.join(this.srcDbRootDir, "_preview_db");
            // console.log("previewDbDir:", this.previewDbDir);
            if (!this.dbName_2_db) {
                this.dbName_2_db = {};
            }
            else {
                // 清理dirty的配置表
                tools_1.default.forEachMap(this.dbFilePath_2_dirty, (dbFilePath) => {
                    let dbNameMap = this.dbFilePath_2_dbNameMap[dbFilePath];
                    tools_1.default.forEachMap(dbNameMap, (dbName) => {
                        delete this.dbName_2_db[dbName];
                        // 清理所有关联的配置表缓存
                        let referenceFilePathMap = this.dbNames_2_dbFilePathMap[dbName];
                        tools_1.default.forEachMap(referenceFilePathMap, (k, v) => {
                            delete this.loadedDbFilePaths[k];
                        });
                    });
                });
            }
            fNext();
        });
        tm.addCall((fNext) => {
            let subTm = new task_manager_1.TaskManager();
            tools_1.default.foreachDir(this.srcDbRootDir, (filePath) => {
                if (DbExporter.loadedDbFilePaths[filePath])
                    return false;
                if (filePath.endsWith(".xlsx") || filePath.endsWith(".xls")) {
                    // 打点统计映射表不导出
                    if (filePath.endsWith("打点统计映射.xlsx"))
                        return false;
                    let t0 = Date.now();
                    // excel配置文件
                    let dbs = [];
                    subTm.addCall((subTm_fNext) => {
                        data_base_1.default.loadFromXlsxAsync(filePath, (_dbs) => {
                            dbs = _dbs;
                            for (let i = 0; i < dbs.length; i++) {
                                const db = dbs[i];
                                this.dbFilePath_2_dbNameMap[filePath] = (this.dbFilePath_2_dbNameMap[filePath] || {});
                                this.dbFilePath_2_dbNameMap[filePath][db.name] = true;
                                this.dbNames_2_dbFilePathMap[db.name] = (this.dbNames_2_dbFilePathMap[db.name] || {});
                                this.dbNames_2_dbFilePathMap[db.name][filePath] = true;
                                // if (this.dbName_2_db[db.name]) {
                                //     let oldDb = this.dbName_2_db[db.name];
                                //     // 尝试进行合并
                                //     // db.warnLog.push("尝试进行合并：" + db.name)
                                //     db.warnLog.push(Tools.format("发现重名配置表：[%s] 来自文件：[%s]和[%s]", db.name, this.dbName_2_db[db.name].originFilePath, filePath));
                                // }
                                if (db.canExport()) {
                                    // 尝试进行合并
                                    let oldDb = this.dbName_2_db[db.name];
                                    if (oldDb) {
                                        // console.log("尝试合并", oldDb.originFilePath, db.originFilePath);
                                        let msg = oldDb.canMerge(db);
                                        if (msg) {
                                            console.error(tools_1.default.format("配置表[%s]合并失败：file1=[%s] file2=[%s] 失败理由=[%s]", db.name, oldDb.originFilePath, db.originFilePath, msg));
                                            continue;
                                        }
                                        else {
                                            // 合并数据
                                            oldDb.mergeDb(db);
                                        }
                                    }
                                    else {
                                        // 保存新db
                                        this.dbName_2_db[db.name] = db;
                                    }
                                }
                                else {
                                    for (let i = 0; i < db.warnLog.length; i++) {
                                        const text = db.warnLog[i];
                                        console.warn(text);
                                    }
                                }
                            }
                            // console.log("load", filePath, Date.now() - t0)
                            DbExporter.loadedDbFilePaths[filePath] = true;
                            subTm_fNext();
                        });
                    });
                }
                else if (filePath.endsWith(".csv")) {
                    // csv配置文件
                    console.log("TODO 暂未实现csv加载功能，已忽略当前文件：", filePath);
                }
            });
            subTm.start(fNext);
        });
        tm.addCall((fNext) => {
            tools_1.default.forEachMap(this.dbName_2_db, (dbName, db) => {
                // console.dir(db, { depth: null });
                // console.log("已加载配置表：", dbName);
                db.forDb((data) => {
                    // console.dir(data, { depth: null });
                    // console.log(db.generatePreviewDbJsonText());
                });
            });
            fNext();
        });
        // console.log("dbFilePath_2_dbNameMap", this.dbFilePath_2_dbNameMap);
        // console.log("dbNames_2_dbFilePathMap", this.dbNames_2_dbFilePathMap);
        tm.start(fOnCompleted);
    }
    static markDbFileDirty(filePath) {
        this.dbFilePath_2_dirty[filePath] = true;
    }
    static exportPreviewDb() {
        // console.log("生成raw_db")
        let count = 0;
        // 1. 尝试创建_raw_db目录
        if (!fs_extra_1.default.existsSync(this.previewDbDir)) {
            fs_extra_1.default.mkdirSync(this.previewDbDir, { recursive: true });
        }
        // 2. 清理_raw_db目录
        tools_1.default.foreachDir(this.previewDbDir, (filePath) => {
            fs_extra_1.default.unlinkSync(filePath);
        });
        // 3. 生成原始配置表
        tools_1.default.forEachMap(this.dbName_2_db, (dbName, db) => {
            let text = db.generatePreviewDbJsonText();
            let filePath = path_1.default.join(this.previewDbDir, dbName + ".json");
            fs_extra_1.default.writeFileSync(filePath, text, { encoding: "utf-8" });
            count++;
        });
        // console.log(Tools.format("预览配置表preivew_db导出完毕，已导出%d个json文件。", count));
    }
    static mergeDbField() {
        tools_1.default.forEachMap(this.dbName_2_db, (dbName, db) => {
            db.processMergeToArr();
        });
    }
    static exportDtsFile() {
        let text = '';
        text += '/** 配置表数据结构描述文件，本文件由导出器自动生成，请勿手动修改 */\n';
        text += 'declare module db {\n';
        text += '    function getDataBase(dbName: string): any;\n';
        tools_1.default.forEachMap(this.dbName_2_db, (dbName, db) => {
            text += db.generateDbdtsText();
            text += db.generateDbdtsConstsText();
            // console.log(dbName)
            // console.log(text)
        });
        text += '}';
        // console.log(text);
        let dtsFilePath = path_1.default.join(this.prjRootDir, "declare", "db.d.ts");
        if (!fs_extra_1.default.existsSync(path_1.default.dirname(dtsFilePath))) {
            fs_extra_1.default.mkdirSync(path_1.default.dirname(dtsFilePath), { recursive: true });
        }
        fs_extra_1.default.writeFileSync(dtsFilePath, text, { encoding: "utf-8" });
    }
    static stringToUint8Array(str) {
        var arr = [];
        for (var i = 0, j = str.length; i < j; ++i) {
            arr.push(str.charCodeAt(i));
        }
        var tmpUint8Array = new Uint8Array(arr);
        return tmpUint8Array;
    }
    static async exportDataFile() {
        let jsonData = {};
        console.log("配置表导出模式: ", this.exportMode);
        let exportCount = 0;
        tools_1.default.forEachMap(this.dbName_2_db, (dbName, db) => {
            // console.log("已导出配置表：", dbName)
            exportCount++;
            let fieldName_2_type = {};
            for (let i = 0; i < db.fields.length; i++) {
                const field = db.fields[i];
                fieldName_2_type[field.name] = field.type;
            }
            let dbData = {
                name: db.name,
                rule: db.rule,
                datas: db.datas,
                fieldName_2_type: fieldName_2_type,
            };
            jsonData[dbName] = dbData;
        });
        let jsonDataFilePath = path_1.default.join(this.prjRootDir, "assets", "resources", "cfg", "db.json");
        let binDataFilePath = path_1.default.join(this.prjRootDir, "assets", "resources", "cfg", "db.bin");
        if (!fs_extra_1.default.existsSync(path_1.default.dirname(jsonDataFilePath))) {
            fs_extra_1.default.mkdirSync(path_1.default.dirname(jsonDataFilePath), { recursive: true });
        }
        if (fs_extra_1.default.existsSync(jsonDataFilePath)) {
            fs_extra_1.default.rmSync(jsonDataFilePath);
        }
        if (fs_extra_1.default.existsSync(binDataFilePath)) {
            fs_extra_1.default.rmSync(binDataFilePath);
        }
        // 格式化
        switch (this.exportMode) {
            case "pretty-json": {
                // 美化json
                let text = JSON.stringify(jsonData, null, 4);
                //fs.writeFileSync(jsonDataFilePath, text, { encoding: "utf-8" });
                await asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset("db://assets/resources/cfg/db.json", text, true);
                break;
            }
            case "zip-json": {
                //const zip = new JSZip();
                // 压缩json
                let text = JSON.stringify(jsonData);
                const content = pako_1.default.deflate(text, { level: 0 });
                // 文件头，'pako'
                //let headChunk = this.stringToUint8Array("zip-json");
                // zip.file("database",text);
                // // 压缩后的数据
                // const content = await zip.generateAsync({
                //     type: "uint8array",//nodejs用
                //     compression: "DEFLATE",
                //     compressionOptions: {
                //         level : 9,
                //     }
                // });
                console.log("获取到长度：", content.length);
                // 输出的二进制，文件头+压缩后的数据
                await asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset("db://assets/resources/cfg/db.bin", content, true);
                break;
            }
            case "json":
            default: {
                // 默认使用标准json
                let text = JSON.stringify(jsonData);
                //fs.writeFileSync(jsonDataFilePath, text, { encoding: "utf-8" });
                await asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset("db://assets/resources/cfg/db.json", text, true);
                break;
            }
        }
        console.log(tools_1.default.format("已导出配置表：%d个", exportCount));
    }
    static exportLibraryFile() {
        // 热更新library
        // console.log("exportLibraryFile");
        let libraryRootDir = path_1.default.join(this.prjRootDir, "library");
        if (!fs_extra_1.default.existsSync(libraryRootDir))
            return;
        try {
            // 区分json模式和bin模式
            if (this.exportMode == "zip-json") {
                // console.log("bin模式")
                let metaFilePath = path_1.default.join(this.prjRootDir, "assets", "resources", "cfg", "db.bin.meta");
                if (!fs_extra_1.default.existsSync(metaFilePath)) {
                    // console.log("meta文件未找到，无法热更新library", metaFilePath);
                    return;
                }
                let metaText = fs_extra_1.default.readFileSync(metaFilePath, { encoding: "utf-8" });
                let metaData = JSON.parse(metaText);
                // console.log("metaData", metaData)
                let uuid = metaData.uuid;
                // console.log('uuid', uuid);
                let resourcesBinFilePath = path_1.default.join(this.prjRootDir, "assets", "resources", "cfg", "db.bin");
                let libraryBinFilePath = path_1.default.join(this.prjRootDir, "library", uuid.substring(0, 2), uuid + ".bin");
                // console.log('resourcesBinFilePath', resourcesBinFilePath);
                // console.log('libraryBinFilePath', libraryBinFilePath);
                if (!fs_extra_1.default.existsSync(path_1.default.dirname(libraryBinFilePath))) {
                    // library目录未找到，不需要进行热更新
                    return;
                }
                if (fs_extra_1.default.existsSync(libraryBinFilePath)) {
                    fs_extra_1.default.unlinkSync(libraryBinFilePath);
                }
                fs_extra_1.default.copyFileSync(resourcesBinFilePath, libraryBinFilePath);
            }
            else {
                // console.log("json模式")
                let metaFilePath = path_1.default.join(this.prjRootDir, "assets", "resources", "cfg", "db.json.meta");
                if (!fs_extra_1.default.existsSync(metaFilePath)) {
                    // console.log("meta文件未找到，无法热更新library", metaFilePath);
                    return;
                }
                let metaText = fs_extra_1.default.readFileSync(metaFilePath, { encoding: "utf-8" });
                let metaData = JSON.parse(metaText);
                // console.log("metaData", metaData)
                let uuid = metaData.uuid;
                // console.log('uuid', uuid);
                let resourcesJsonFilePath = path_1.default.join(this.prjRootDir, "assets", "resources", "cfg", "db.json");
                let libraryJsonAssetsFilePath = path_1.default.join(this.prjRootDir, "library", uuid.substring(0, 2), uuid + ".json");
                // console.log('resourcesJsonFilePath', resourcesJsonFilePath);
                // console.log('libraryJsonAssetsFilePath', libraryJsonAssetsFilePath);
                if (!fs_extra_1.default.existsSync(libraryJsonAssetsFilePath)) {
                    // console.log("jsonAssets文件未找到，无法热更新library", libraryJsonAssetsFilePath);
                    return;
                }
                let jsonAssetsText = fs_extra_1.default.readFileSync(libraryJsonAssetsFilePath, { encoding: "utf-8" });
                let jsonAssetsData = JSON.parse(jsonAssetsText);
                // console.log(jsonAssetsData);
                let jsonText = fs_extra_1.default.readFileSync(resourcesJsonFilePath);
                let jsonData = JSON.parse(jsonText.toString());
                jsonAssetsData.json = jsonData;
                jsonAssetsText = JSON.stringify(jsonAssetsData, null, 4);
                fs_extra_1.default.writeFileSync(libraryJsonAssetsFilePath, jsonAssetsText, { encoding: "utf-8" });
            }
            // console.log("library热更新成功")
        }
        catch (error) {
            console.log("library热更新失败：", error);
        }
    }
    static exportAutoExportDbTs() {
        const dir = path_1.default.join(this.prjRootDir, "assets", "resources", "scripts", "auto");
        if (!fs_extra_1.default.existsSync(dir)) {
            fs_extra_1.default.mkdirSync(dir, { recursive: true });
        }
        let filePath = path_1.default.join(dir, "_AutoExportDb.ts");
        let text = "";
        text += "import DataBase from '../core/struct/data-base';\n";
        text += "import DbManager from '../core/manager/db-manager';\n";
        text += "\n";
        text += "/**\n";
        text += " * 此文件由dbExporter脚本自动生成！请勿手动修改本文件！\n";
        text += " * \n";
        text += " * 封装配置表的各项getter函数\n";
        text += " */\n";
        text += 'let db = {} as any;\n';
        text += "window['db'] = db;\n";
        text += "\n";
        // 先放置keys
        tools_1.default.forEachMap(this.dbName_2_db, (dbName, db) => {
            console.log('导出配置表得keys：', dbName);
            let keysText = db.generateAutoExportDbTsConstsText();
            if (keysText) {
                text += keysText + "\n";
            }
        });
        text += "\n";
        text += 'export function _AutoExportDb_init() {\n';
        text += "    db.getDataBase = (dbName: string): DataBase => { return DbManager.getDataBase(dbName); }\n";
        text += "\n";
        // 再放置getters
        tools_1.default.forEachMap(this.dbName_2_db, (dbName, db) => {
            let gettersText = db.generateAutoExportDbTsGettersText();
            text += gettersText + "\n";
        });
        text += "}\n";
        text += "\n";
        text += "/**\n";
        text += " * 延迟1ms后自动注册\n";
        text += " * \n";
        text += " */\n";
        text += "setTimeout(() => {\n";
        text += "    let bDisableAutoInit = !!window['_AutoExportDb_bDisableAutoInit'];\n";
        text += "    if (!bDisableAutoInit) {\n";
        text += "        // console.log('_AutoExportDb.ts 兼容代码启动，初始化所有getter接口');\n";
        text += "        _AutoExportDb_init();\n";
        text += "    }\n";
        text += "}, 1);\n";
        text += "\n";
        text += "window['_AutoExportDb_init'] = _AutoExportDb_init;\n";
        // 预先检查内容是否改变
        if (fs_extra_1.default.existsSync(filePath)) {
            let originText = fs_extra_1.default.readFileSync(filePath, { encoding: "utf-8" });
            if (originText == text) {
                // console.log("文件未发生改动，不需要重新写入：", filePath);
                return;
            }
        }
        const url = "db://assets/resources/scripts/auto/_AutoExportDb.ts";
        asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset(url, text, true);
    }
    /**
     * 根据配置表的名字获取一个配置表的数据，可能返回null
     * @param dbName
     */
    static getDatabase(dbName) {
        if (!this.dbName_2_db[dbName]) {
            return null;
        }
        return this.dbName_2_db[dbName];
    }
    /**
     * 导出i18n配置
     */
    static async exportI18NDefineFile() {
        const dbBase = this.getDatabase('i18n_language_config_db');
        if (!dbBase) {
            return;
        }
        const text = dbBase.generateI18nEnumText();
        if (!text || text == "") {
            return;
        }
        const url = "db://assets/resources/scripts/auto/i18n-define.ts";
        asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset(url, text, true);
    }
}
exports.default = DbExporter;
/**
 * 导出模式
 */
DbExporter.exportMode = "json";
/**
 * MERGE_FLD_NAME 将多个字段合并为数组功能，是否保留空白数据。
 */
DbExporter.mergeFieldToArrayKeepEmptyValue = false;
/**
 * 解析后的配置表数据
 */
DbExporter.dbName_2_db = {};
DbExporter.dbFilePath_2_dbNameMap = {};
DbExporter.dbNames_2_dbFilePathMap = {};
/**
 * 已加载过的配置表
 */
DbExporter.loadedDbFilePaths = {};
DbExporter.dbFilePath_2_dirty = {};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGItZXhwb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvZGJleHBvcnQvZGItZXhwb3J0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFDQSxnREFBd0I7QUFDeEIsd0RBQTBCO0FBQzFCLGtEQUEwQjtBQUMxQix3REFBb0Q7QUFDcEQsMkRBQW1DO0FBQ25DLDREQUFtQztBQUNuQyw0REFBdUQ7QUFFdkQsZ0RBQXdCO0FBQ3hCLE1BQXFCLFVBQVU7SUFxQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFlBQVk7UUFDaEMsSUFBSSxDQUFDLFdBQVcsR0FBa0IsRUFBRSxDQUFDO1FBQ3JDLElBQUksQ0FBQyxzQkFBc0IsR0FBTyxFQUFFLENBQUM7UUFDckMsSUFBSSxDQUFDLHVCQUF1QixHQUFNLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsaUJBQWlCLEdBQVksRUFBRSxDQUFDO1FBQ3JDLElBQUksQ0FBQyxrQkFBa0IsR0FBVyxFQUFFLENBQUM7UUFDckMsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFFN0IsZ0NBQWdDO1FBQ2hDLDBDQUEwQztRQUUxQyxJQUFJLENBQUMsWUFBWSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3JELG1EQUFtRDtRQUVuRCxJQUFJLEVBQUUsR0FBRyxJQUFJLDBCQUFXLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWpELEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUNqQixJQUFJLHFCQUFxQixHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQzVFLElBQUksa0JBQUUsQ0FBQyxVQUFVLENBQUMscUJBQXFCLENBQUMsRUFBRTtnQkFDdEMsSUFBSTtvQkFDQSxJQUFJLElBQUksR0FBRyxr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LEdBQTJELEVBQUUsQ0FBQztBQUU1Rjs7R0FFRztBQUNJLDRCQUFpQixHQUFrQyxFQUFFLENBQUM7QUFDdEQsNkJBQWtCLEdBQWlDLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgZnMgZnJvbSBcImZzLWV4dHJhXCI7XHJcbmltcG9ydCBqc29uNSBmcm9tIFwianNvbjVcIjtcclxuaW1wb3J0IHsgVGFza01hbmFnZXIgfSBmcm9tIFwiLi4vdXRpbHMvdGFzay1tYW5hZ2VyXCI7XHJcbmltcG9ydCBUb29scyBmcm9tIFwiLi4vdXRpbHMvdG9vbHNcIjtcclxuaW1wb3J0IERhdGFCYXNlIGZyb20gXCIuL2RhdGEtYmFzZVwiO1xyXG5pbXBvcnQgeyBBc3NldERiVXRpbHMgfSBmcm9tIFwiLi4vdXRpbHMvYXNzZXQtZGItdXRpbHNcIjtcclxuaW1wb3J0IEpTWmlwIGZyb20gXCJqc3ppcFwiO1xyXG5pbXBvcnQgcGFrbyBmcm9tIFwicGFrb1wiO1xyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEYkV4cG9ydGVyIHtcclxuICAgIHN0YXRpYyBwcmpSb290RGlyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog6YWN572u6KGo5pWw5o2u5rqQ5qC555uu5b2VXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBzcmNEYlJvb3REaXI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDpooTop4jmlbDmja7lupPnm67lvZVcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHByZXZpZXdEYkRpcjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOWvvOWHuuaooeW8j1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZXhwb3J0TW9kZSA9IFwianNvblwiO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTUVSR0VfRkxEX05BTUUg5bCG5aSa5Liq5a2X5q615ZCI5bm25Li65pWw57uE5Yqf6IO977yM5piv5ZCm5L+d55WZ56m655m95pWw5o2u44CCXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBtZXJnZUZpZWxkVG9BcnJheUtlZXBFbXB0eVZhbHVlID0gZmFsc2U7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDop6PmnpDlkI7nmoTphY3nva7ooajmlbDmja5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGRiTmFtZV8yX2RiIDoge1tuYW1lIDogc3RyaW5nXSA6IERhdGFCYXNlfSA9IHt9O1xyXG5cclxuICAgIHN0YXRpYyBkYkZpbGVQYXRoXzJfZGJOYW1lTWFwIDoge1trZXkgOiBzdHJpbmddIDoge1tkYk5hbWUgOiBzdHJpbmddIDogYm9vbGVhbn19ID0ge307XHJcbiAgICBzdGF0aWMgZGJOYW1lc18yX2RiRmlsZVBhdGhNYXAgOiB7W2RiTmFtZSA6IHN0cmluZ10gOiB7W2ZpbGVOYW1lIDogc3RyaW5nXSA6IGJvb2xlYW59fSA9IHt9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5bey5Yqg6L296L+H55qE6YWN572u6KGoXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBsb2FkZWREYkZpbGVQYXRocyA6IHtba2V5IDogc3RyaW5nXSA6IGJvb2xlYW59ICAgPSB7fTtcclxuICAgIHN0YXRpYyBkYkZpbGVQYXRoXzJfZGlydHkgOiB7W2tleSA6IHN0cmluZ10gOiBib29sZWFufSAgPSB7fTtcclxuXHJcbiAgICBzdGF0aWMgaW5pdChwcmpSb290RGlyLCBmT25Db21wbGV0ZWQpIHtcclxuICAgICAgICB0aGlzLmRiTmFtZV8yX2RiICAgICAgICAgICAgICAgID0ge307XHJcbiAgICAgICAgdGhpcy5kYkZpbGVQYXRoXzJfZGJOYW1lTWFwICAgICA9IHt9O1xyXG4gICAgICAgIHRoaXMuZGJOYW1lc18yX2RiRmlsZVBhdGhNYXAgICAgPSB7fTtcclxuICAgICAgICB0aGlzLmxvYWRlZERiRmlsZVBhdGhzICAgICAgICAgID0ge307XHJcbiAgICAgICAgdGhpcy5kYkZpbGVQYXRoXzJfZGlydHkgICAgICAgICA9IHt9O1xyXG4gICAgICAgIHRoaXMucHJqUm9vdERpciA9IHByalJvb3REaXI7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiRXhwb3J0ZXIuaW5pdFwiKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInByalJvb3REaXI6XCIsIHByalJvb3REaXIpO1xyXG5cclxuICAgICAgICB0aGlzLnNyY0RiUm9vdERpciA9IHBhdGguam9pbihwcmpSb290RGlyLCBcIl9jb25maWdcIik7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJzcmNEYlJvb3REaXI6XCIsIHRoaXMuc3JjRGJSb290RGlyKTtcclxuXHJcbiAgICAgICAgbGV0IHRtID0gbmV3IFRhc2tNYW5hZ2VyKFwiRXhwb3J0ZXIuaW5pdFwiLCBmYWxzZSk7XHJcblxyXG4gICAgICAgIHRtLmFkZENhbGwoKGZOZXh0KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBkYkNvbmZpZ0pzb241RmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5zcmNEYlJvb3REaXIsIFwiZGIuY29uZmlnLmpzb241XCIpO1xyXG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhkYkNvbmZpZ0pzb241RmlsZVBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gZnMucmVhZEZpbGVTeW5jKGRiQ29uZmlnSnNvbjVGaWxlUGF0aCwgeyBlbmNvZGluZzogXCJ1dGYtOFwiIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBkYXRhID0ganNvbjUucGFyc2UodGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCLmo4DmtYvliLBkYi5jb25maWcuanNvbjU6XCIsIGRiQ29uZmlnSnNvbjVGaWxlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmV4cG9ydE1vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwb3J0TW9kZSA9IGRhdGEuZXhwb3J0TW9kZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKGRhdGEubWVyZ2VGaWVsZFRvQXJyYXlLZWVwRW1wdHlWYWx1ZSA9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB0aGlzLm1lcmdlRmllbGRUb0FycmF5S2VlcEVtcHR5VmFsdWUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlvorablkYpdIGRiLmNvbmZpZy5qc29uNSDop6PmnpDlpLHotKVcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmTmV4dCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMubWVyZ2VGaWVsZFRvQXJyYXlLZWVwRW1wdHlWYWx1ZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlwiKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJb5o+Q56S6XSBkYi5jb25maWcuanNvbjUg5Lit5pyq6YWN572uIG1lcmdlRmllbGRUb0FycmF5S2VlcEVtcHR5VmFsdWVcIik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi6YWN572u6KGo5a+85Ye65Zmo5Zyo5aSE55CGTUVSR0VfRkxEX05BTUXlip/og73ml7bvvIzkvJrpu5jorqTlv73nlaXmiYDmnInnmoTnqbrnmb3mlbDmja7vvIzlnKjkvb/nlKjkuK3kvJrlh7rnjrDmrafkuYnvvJpcIik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5aaC5Lul5LiL5qGI5L6L77yaXCIpXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTUVSR0VfRkxEX05BTUUgIHN0cnMgICAgc3RycyAgICBzdHJzXCIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZMRF9OQU1FICAgICAgICBzdHIxICAgIHN0cjIgICAgc3RyM1wiKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJEQVRBICAgICAgICAgICAgYSAgICAgICBiICAgICAgIGMgICAgICAgICAgICAgICAgICBzdHJzPVsnYScsICdiJywgJ2MnXVwiKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJEQVRBICAgICAgICAgICAgYSAgICAgICAgICAgICAgIGMgICAgICAgICAgICAgICAgICBzdHJzPVsnYScsICdjJ11cIik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiREFUQSAgICAgICAgICAgIGEgICAgICAgYiAgICAgICAgICAgICAgICAgICAgICAgICAgc3Rycz1bJ2EnLCAnYidcIik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXCIpXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi56ys5LqM5p2h5pWw5o2u5Lit77yM5oyJ54Wn6aKE5pyfY+W6lOivpeaYr+WxnuS6juesrOS4ieS4quWtl+aute+8jOWunumZheWvvOWHuueahHN0cnPkuK3vvIxzdHJzWzFd5Li6J2Mn5LiN56ym5ZCI6aKE5pyfXCIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuS/ruWkjeWQju+8jOi+k+WHuueahHN0cnPkvp3mrKHkuLrvvJpbJ2EnLCAnYicsICdjJ10sIFsnYScsICcnLCAnYyddLCBbJ2EnLCAnYicsICcnXVwiKVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlwiKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLnlLHkuo7mraTlip/og73kvJrmlLnlj5jlr7zlh7rpgLvovpHvvIzlj6/og73lvbHlk43pobnnm67kuK3lt7LmnInmlbDmja7nmoTlr7zlh7rvvIzkv67mlLnlkI7or7fku5Tnu4bmoLjlr7lwcmV2aWV3LWRi5Lit55qE5paH5Lu25pS55Yqo44CCXCIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlwiKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLkv67lpI3mlrnlvI/vvJpcIik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiMS4g5omT5byA6aG555uu5bqT5LitX2NvbmZpZy9kYi5jb25maWcuanNvbjVcIik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiMi4g5ZyoZXhwb3J0TW9kZeWtl+auteWQju+8jOaWsOWinumFjee9riBtZXJnZUZpZWxkVG9BcnJheUtlZXBFbXB0eVZhbHVlOiB0cnVlICAgICAo5rOo5oSP77yMdHJ1ZeaYr+W4g+WwlOWAvO+8jOS4jeaYr+Wtl+espuS4su+8iVwiKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCIzLiDph43mlrDlr7zlh7rphY3nva7ooajvvIzmo4Dmn6VwcmV2aWV3X2Ri5LitanNvbuaWh+S7tueahOaUueWKqO+8jOehruS/neeOsOacieaVsOaNruS4jeWPl+W9seWTjVwiKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0bS5hZGRDYWxsKChmTmV4dCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByZXZpZXdEYkRpciA9IHBhdGguam9pbih0aGlzLnNyY0RiUm9vdERpciwgXCJfcHJldmlld19kYlwiKTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJwcmV2aWV3RGJEaXI6XCIsIHRoaXMucHJldmlld0RiRGlyKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5kYk5hbWVfMl9kYikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYk5hbWVfMl9kYiA9IHt9O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8g5riF55CGZGlydHnnmoTphY3nva7ooahcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAodGhpcy5kYkZpbGVQYXRoXzJfZGlydHksIChkYkZpbGVQYXRoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRiTmFtZU1hcCA9IHRoaXMuZGJGaWxlUGF0aF8yX2RiTmFtZU1hcFtkYkZpbGVQYXRoXTtcclxuICAgICAgICAgICAgICAgICAgICBUb29scy5mb3JFYWNoTWFwKGRiTmFtZU1hcCwgKGRiTmFtZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5kYk5hbWVfMl9kYltkYk5hbWVdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5riF55CG5omA5pyJ5YWz6IGU55qE6YWN572u6KGo57yT5a2YXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZWZlcmVuY2VGaWxlUGF0aE1hcCA9IHRoaXMuZGJOYW1lc18yX2RiRmlsZVBhdGhNYXBbZGJOYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgVG9vbHMuZm9yRWFjaE1hcChyZWZlcmVuY2VGaWxlUGF0aE1hcCwgKGssIHYpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmxvYWRlZERiRmlsZVBhdGhzW2tdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmTmV4dCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0bS5hZGRDYWxsKChmTmV4dCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgc3ViVG0gPSBuZXcgVGFza01hbmFnZXIoKTtcclxuXHJcbiAgICAgICAgICAgIFRvb2xzLmZvcmVhY2hEaXIodGhpcy5zcmNEYlJvb3REaXIsIChmaWxlUGF0aCA6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKERiRXhwb3J0ZXIubG9hZGVkRGJGaWxlUGF0aHNbZmlsZVBhdGhdKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZmlsZVBhdGguZW5kc1dpdGgoXCIueGxzeFwiKSB8fCBmaWxlUGF0aC5lbmRzV2l0aChcIi54bHNcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDmiZPngrnnu5/orqHmmKDlsITooajkuI3lr7zlh7pcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZVBhdGguZW5kc1dpdGgoXCLmiZPngrnnu5/orqHmmKDlsIQueGxzeFwiKSkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgdDAgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBleGNlbOmFjee9ruaWh+S7tlxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBkYnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc3ViVG0uYWRkQ2FsbCgoc3ViVG1fZk5leHQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgRGF0YUJhc2UubG9hZEZyb21YbHN4QXN5bmMoZmlsZVBhdGgsIChfZGJzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYnMgPSBfZGJzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYiA9IGRic1tpXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYkZpbGVQYXRoXzJfZGJOYW1lTWFwW2ZpbGVQYXRoXSA9ICh0aGlzLmRiRmlsZVBhdGhfMl9kYk5hbWVNYXBbZmlsZVBhdGhdIHx8IHt9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRiRmlsZVBhdGhfMl9kYk5hbWVNYXBbZmlsZVBhdGhdW2RiLm5hbWVdID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYk5hbWVzXzJfZGJGaWxlUGF0aE1hcFtkYi5uYW1lXSA9ICh0aGlzLmRiTmFtZXNfMl9kYkZpbGVQYXRoTWFwW2RiLm5hbWVdIHx8IHt9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRiTmFtZXNfMl9kYkZpbGVQYXRoTWFwW2RiLm5hbWVdW2ZpbGVQYXRoXSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmICh0aGlzLmRiTmFtZV8yX2RiW2RiLm5hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGxldCBvbGREYiA9IHRoaXMuZGJOYW1lXzJfZGJbZGIubmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIC8vIOWwneivlei/m+ihjOWQiOW5tlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAvLyBkYi53YXJuTG9nLnB1c2goXCLlsJ3or5Xov5vooYzlkIjlubbvvJpcIiArIGRiLm5hbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLlj5HnjrDph43lkI3phY3nva7ooajvvJpbJXNdIOadpeiHquaWh+S7tu+8mlslc13lkoxbJXNdXCIsIGRiLm5hbWUsIHRoaXMuZGJOYW1lXzJfZGJbZGIubmFtZV0ub3JpZ2luRmlsZVBhdGgsIGZpbGVQYXRoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGIuY2FuRXhwb3J0KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5bCd6K+V6L+b6KGM5ZCI5bm2XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBvbGREYiA9IHRoaXMuZGJOYW1lXzJfZGJbZGIubmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbGREYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCLlsJ3or5XlkIjlubZcIiwgb2xkRGIub3JpZ2luRmlsZVBhdGgsIGRiLm9yaWdpbkZpbGVQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtc2cgPSBvbGREYi5jYW5NZXJnZShkYik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobXNnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5ZCI5bm25aSx6LSl77yaZmlsZTE9WyVzXSBmaWxlMj1bJXNdIOWksei0peeQhueUsT1bJXNdXCIsIGRiLm5hbWUsIG9sZERiLm9yaWdpbkZpbGVQYXRoLCBkYi5vcmlnaW5GaWxlUGF0aCwgbXNnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWQiOW5tuaVsOaNrlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZERiLm1lcmdlRGIoZGIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5L+d5a2Y5pawZGJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGJOYW1lXzJfZGJbZGIubmFtZV0gPSBkYjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGIud2FybkxvZy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IGRiLndhcm5Mb2dbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4odGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJsb2FkXCIsIGZpbGVQYXRoLCBEYXRlLm5vdygpIC0gdDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYkV4cG9ydGVyLmxvYWRlZERiRmlsZVBhdGhzW2ZpbGVQYXRoXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJUbV9mTmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpbGVQYXRoLmVuZHNXaXRoKFwiLmNzdlwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNzdumFjee9ruaWh+S7tlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVE9ETyDmmoLmnKrlrp7njrBjc3bliqDovb3lip/og73vvIzlt7Llv73nlaXlvZPliY3mlofku7bvvJpcIiwgZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgc3ViVG0uc3RhcnQoZk5leHQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0bS5hZGRDYWxsKChmTmV4dCkgPT4ge1xyXG4gICAgICAgICAgICBUb29scy5mb3JFYWNoTWFwKHRoaXMuZGJOYW1lXzJfZGIsIChkYk5hbWUsIGRiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpcihkYiwgeyBkZXB0aDogbnVsbCB9KTtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwi5bey5Yqg6L296YWN572u6KGo77yaXCIsIGRiTmFtZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZGIuZm9yRGIoKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpcihkYXRhLCB7IGRlcHRoOiBudWxsIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGRiLmdlbmVyYXRlUHJldmlld0RiSnNvblRleHQoKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBmTmV4dCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImRiRmlsZVBhdGhfMl9kYk5hbWVNYXBcIiwgdGhpcy5kYkZpbGVQYXRoXzJfZGJOYW1lTWFwKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImRiTmFtZXNfMl9kYkZpbGVQYXRoTWFwXCIsIHRoaXMuZGJOYW1lc18yX2RiRmlsZVBhdGhNYXApO1xyXG5cclxuXHJcbiAgICAgICAgdG0uc3RhcnQoZk9uQ29tcGxldGVkKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgbWFya0RiRmlsZURpcnR5KGZpbGVQYXRoKSB7XHJcbiAgICAgICAgdGhpcy5kYkZpbGVQYXRoXzJfZGlydHlbZmlsZVBhdGhdID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZXhwb3J0UHJldmlld0RiKCkge1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwi55Sf5oiQcmF3X2RiXCIpXHJcblxyXG4gICAgICAgIGxldCBjb3VudCA9IDA7XHJcblxyXG4gICAgICAgIC8vIDEuIOWwneivleWIm+W7ul9yYXdfZGLnm67lvZVcclxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmModGhpcy5wcmV2aWV3RGJEaXIpKSB7XHJcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLnByZXZpZXdEYkRpcix7cmVjdXJzaXZlIDogdHJ1ZX0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gMi4g5riF55CGX3Jhd19kYuebruW9lVxyXG4gICAgICAgIFRvb2xzLmZvcmVhY2hEaXIodGhpcy5wcmV2aWV3RGJEaXIsIChmaWxlUGF0aCkgPT4ge1xyXG4gICAgICAgICAgICBmcy51bmxpbmtTeW5jKGZpbGVQYXRoKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyAzLiDnlJ/miJDljp/lp4vphY3nva7ooahcclxuICAgICAgICBUb29scy5mb3JFYWNoTWFwKHRoaXMuZGJOYW1lXzJfZGIsIChkYk5hbWUsIGRiKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0ZXh0ID0gZGIuZ2VuZXJhdGVQcmV2aWV3RGJKc29uVGV4dCgpO1xyXG4gICAgICAgICAgICBsZXQgZmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5wcmV2aWV3RGJEaXIsIGRiTmFtZSArIFwiLmpzb25cIik7XHJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIHRleHQsIHsgZW5jb2Rpbmc6IFwidXRmLThcIiB9KTtcclxuXHJcbiAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFRvb2xzLmZvcm1hdChcIumihOiniOmFjee9ruihqHByZWl2ZXdfZGLlr7zlh7rlrozmr5XvvIzlt7Llr7zlh7olZOS4qmpzb27mlofku7bjgIJcIiwgY291bnQpKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgbWVyZ2VEYkZpZWxkKCkge1xyXG4gICAgICAgIFRvb2xzLmZvckVhY2hNYXAodGhpcy5kYk5hbWVfMl9kYiwgKGRiTmFtZSwgZGIpID0+IHtcclxuICAgICAgICAgICAgZGIucHJvY2Vzc01lcmdlVG9BcnIoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZXhwb3J0RHRzRmlsZSgpIHtcclxuICAgICAgICBsZXQgdGV4dCA9ICcnO1xyXG5cclxuICAgICAgICB0ZXh0ICs9ICcvKiog6YWN572u6KGo5pWw5o2u57uT5p6E5o+P6L+w5paH5Lu277yM5pys5paH5Lu255Sx5a+85Ye65Zmo6Ieq5Yqo55Sf5oiQ77yM6K+35Yu/5omL5Yqo5L+u5pS5ICovXFxuJztcclxuICAgICAgICB0ZXh0ICs9ICdkZWNsYXJlIG1vZHVsZSBkYiB7XFxuJztcclxuXHJcbiAgICAgICAgdGV4dCArPSAnICAgIGZ1bmN0aW9uIGdldERhdGFCYXNlKGRiTmFtZTogc3RyaW5nKTogYW55O1xcbic7XHJcblxyXG4gICAgICAgIFRvb2xzLmZvckVhY2hNYXAodGhpcy5kYk5hbWVfMl9kYiwgKGRiTmFtZSwgZGIpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHRleHQgKz0gZGIuZ2VuZXJhdGVEYmR0c1RleHQoKTtcclxuXHJcbiAgICAgICAgICAgIHRleHQgKz0gZGIuZ2VuZXJhdGVEYmR0c0NvbnN0c1RleHQoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGRiTmFtZSlcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2codGV4dClcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGV4dCArPSAnfSc7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRleHQpO1xyXG5cclxuICAgICAgICBsZXQgZHRzRmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5wcmpSb290RGlyLCBcImRlY2xhcmVcIiwgXCJkYi5kLnRzXCIpO1xyXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwYXRoLmRpcm5hbWUoZHRzRmlsZVBhdGgpKSkge1xyXG4gICAgICAgICAgICBmcy5ta2RpclN5bmMocGF0aC5kaXJuYW1lKGR0c0ZpbGVQYXRoKSx7cmVjdXJzaXZlIDogdHJ1ZX0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGR0c0ZpbGVQYXRoLCB0ZXh0LCB7IGVuY29kaW5nOiBcInV0Zi04XCIgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHN0cmluZ1RvVWludDhBcnJheShzdHIpIHtcclxuICAgICAgICB2YXIgYXJyID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBzdHIubGVuZ3RoOyBpIDwgajsgKytpKSB7XHJcbiAgICAgICAgICAgIGFyci5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRtcFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShhcnIpO1xyXG4gICAgICAgIHJldHVybiB0bXBVaW50OEFycmF5XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGV4cG9ydERhdGFGaWxlKCkge1xyXG4gICAgICAgIGxldCBqc29uRGF0YSA9IHt9O1xyXG5cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coXCLphY3nva7ooajlr7zlh7rmqKHlvI86IFwiLCB0aGlzLmV4cG9ydE1vZGUpO1xyXG4gICAgICAgIGxldCBleHBvcnRDb3VudCA9IDA7XHJcbiAgICAgICAgVG9vbHMuZm9yRWFjaE1hcCh0aGlzLmRiTmFtZV8yX2RiLCAoZGJOYW1lLCBkYikgPT4ge1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIuW3suWvvOWHuumFjee9ruihqO+8mlwiLCBkYk5hbWUpXHJcbiAgICAgICAgICAgIGV4cG9ydENvdW50Kys7XHJcblxyXG4gICAgICAgICAgICBsZXQgZmllbGROYW1lXzJfdHlwZSA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRiLmZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBkYi5maWVsZHNbaV07XHJcbiAgICAgICAgICAgICAgICBmaWVsZE5hbWVfMl90eXBlW2ZpZWxkLm5hbWVdID0gZmllbGQudHlwZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGRiRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IGRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBydWxlOiBkYi5ydWxlLFxyXG4gICAgICAgICAgICAgICAgZGF0YXM6IGRiLmRhdGFzLFxyXG4gICAgICAgICAgICAgICAgZmllbGROYW1lXzJfdHlwZTogZmllbGROYW1lXzJfdHlwZSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAganNvbkRhdGFbZGJOYW1lXSA9IGRiRGF0YTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IGpzb25EYXRhRmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5wcmpSb290RGlyLCBcImFzc2V0c1wiLCBcInJlc291cmNlc1wiLCAgXCJjZmdcIiwgXCJkYi5qc29uXCIpO1xyXG4gICAgICAgIGxldCBiaW5EYXRhRmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5wcmpSb290RGlyLCBcImFzc2V0c1wiLCBcInJlc291cmNlc1wiLCAgXCJjZmdcIiwgXCJkYi5iaW5cIik7XHJcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGguZGlybmFtZShqc29uRGF0YUZpbGVQYXRoKSkpIHtcclxuICAgICAgICAgICAgZnMubWtkaXJTeW5jKHBhdGguZGlybmFtZShqc29uRGF0YUZpbGVQYXRoKSx7cmVjdXJzaXZlIDogdHJ1ZX0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhqc29uRGF0YUZpbGVQYXRoKSkge1xyXG4gICAgICAgICAgICBmcy5ybVN5bmMoanNvbkRhdGFGaWxlUGF0aClcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoYmluRGF0YUZpbGVQYXRoKSkge1xyXG4gICAgICAgICAgICBmcy5ybVN5bmMoYmluRGF0YUZpbGVQYXRoKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g5qC85byP5YyWXHJcbiAgICAgICAgc3dpdGNoICh0aGlzLmV4cG9ydE1vZGUpIHtcclxuICAgICAgICAgICAgY2FzZSBcInByZXR0eS1qc29uXCI6IHtcclxuICAgICAgICAgICAgICAgIC8vIOe+juWMlmpzb25cclxuICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkoanNvbkRhdGEsIG51bGwsIDQpO1xyXG4gICAgICAgICAgICAgICAgLy9mcy53cml0ZUZpbGVTeW5jKGpzb25EYXRhRmlsZVBhdGgsIHRleHQsIHsgZW5jb2Rpbmc6IFwidXRmLThcIiB9KTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IEFzc2V0RGJVdGlscy5SZXF1ZXN0Q3JlYXRlTmV3QXNzZXQoXCJkYjovL2Fzc2V0cy9yZXNvdXJjZXMvY2ZnL2RiLmpzb25cIix0ZXh0IGFzIGFueSx0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiemlwLWpzb25cIjoge1xyXG4gICAgICAgICAgICAgICAgLy9jb25zdCB6aXAgPSBuZXcgSlNaaXAoKTtcclxuICAgICAgICAgICAgICAgIC8vIOWOi+e8qWpzb25cclxuICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkoanNvbkRhdGEpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHBha28uZGVmbGF0ZSh0ZXh0LCB7IGxldmVsOjAgfSk7XHJcbiAgICAgICAgICAgICAgICAvLyDmlofku7blpLTvvIwncGFrbydcclxuICAgICAgICAgICAgICAgIC8vbGV0IGhlYWRDaHVuayA9IHRoaXMuc3RyaW5nVG9VaW50OEFycmF5KFwiemlwLWpzb25cIik7XHJcbiAgICAgICAgICAgICAgICAvLyB6aXAuZmlsZShcImRhdGFiYXNlXCIsdGV4dCk7XHJcbiAgICAgICAgICAgICAgICAvLyAvLyDljovnvKnlkI7nmoTmlbDmja5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB6aXAuZ2VuZXJhdGVBc3luYyh7XHJcbiAgICAgICAgICAgICAgICAvLyAgICAgdHlwZTogXCJ1aW50OGFycmF5XCIsLy9ub2RlanPnlKhcclxuICAgICAgICAgICAgICAgIC8vICAgICBjb21wcmVzc2lvbjogXCJERUZMQVRFXCIsXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgY29tcHJlc3Npb25PcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIGxldmVsIDogOSxcclxuICAgICAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi6I635Y+W5Yiw6ZW/5bqm77yaXCIsY29udGVudC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgLy8g6L6T5Ye655qE5LqM6L+b5Yi277yM5paH5Lu25aS0K+WOi+e8qeWQjueahOaVsOaNrlxyXG4gICAgICAgICAgICAgICAgYXdhaXQgQXNzZXREYlV0aWxzLlJlcXVlc3RDcmVhdGVOZXdBc3NldChcImRiOi8vYXNzZXRzL3Jlc291cmNlcy9jZmcvZGIuYmluXCIsY29udGVudCBhcyBhbnksdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY2FzZSBcImpzb25cIjpcclxuICAgICAgICAgICAgZGVmYXVsdDoge1xyXG4gICAgICAgICAgICAgICAgLy8g6buY6K6k5L2/55So5qCH5YeGanNvblxyXG4gICAgICAgICAgICAgICAgbGV0IHRleHQgPSBKU09OLnN0cmluZ2lmeShqc29uRGF0YSk7XHJcbiAgICAgICAgICAgICAgICAvL2ZzLndyaXRlRmlsZVN5bmMoanNvbkRhdGFGaWxlUGF0aCwgdGV4dCwgeyBlbmNvZGluZzogXCJ1dGYtOFwiIH0pO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgQXNzZXREYlV0aWxzLlJlcXVlc3RDcmVhdGVOZXdBc3NldChcImRiOi8vYXNzZXRzL3Jlc291cmNlcy9jZmcvZGIuanNvblwiLHRleHQgYXMgYW55LHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKFRvb2xzLmZvcm1hdChcIuW3suWvvOWHuumFjee9ruihqO+8miVk5LiqXCIsIGV4cG9ydENvdW50KSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGV4cG9ydExpYnJhcnlGaWxlKCkge1xyXG4gICAgICAgIC8vIOeDreabtOaWsGxpYnJhcnlcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImV4cG9ydExpYnJhcnlGaWxlXCIpO1xyXG5cclxuICAgICAgICBsZXQgbGlicmFyeVJvb3REaXIgPSBwYXRoLmpvaW4odGhpcy5wcmpSb290RGlyLCBcImxpYnJhcnlcIik7XHJcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGxpYnJhcnlSb290RGlyKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyDljLrliIZqc29u5qih5byP5ZKMYmlu5qih5byPXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmV4cG9ydE1vZGUgPT0gXCJ6aXAtanNvblwiKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImJpbuaooeW8j1wiKVxyXG4gICAgICAgICAgICAgICAgbGV0IG1ldGFGaWxlUGF0aCA9IHBhdGguam9pbih0aGlzLnByalJvb3REaXIsIFwiYXNzZXRzXCIsIFwicmVzb3VyY2VzXCIsIFwiY2ZnXCIsIFwiZGIuYmluLm1ldGFcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobWV0YUZpbGVQYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwibWV0YeaWh+S7tuacquaJvuWIsO+8jOaXoOazleeDreabtOaWsGxpYnJhcnlcIiwgbWV0YUZpbGVQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsZXQgbWV0YVRleHQgPSBmcy5yZWFkRmlsZVN5bmMobWV0YUZpbGVQYXRoLCB7IGVuY29kaW5nOiBcInV0Zi04XCIgfSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWV0YURhdGEgPSBKU09OLnBhcnNlKG1ldGFUZXh0KTtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwibWV0YURhdGFcIiwgbWV0YURhdGEpXHJcbiAgICAgICAgICAgICAgICBsZXQgdXVpZCA9IG1ldGFEYXRhLnV1aWQ7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndXVpZCcsIHV1aWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCByZXNvdXJjZXNCaW5GaWxlUGF0aCA9IHBhdGguam9pbih0aGlzLnByalJvb3REaXIsIFwiYXNzZXRzXCIsIFwicmVzb3VyY2VzXCIsIFwiY2ZnXCIsIFwiZGIuYmluXCIpO1xyXG4gICAgICAgICAgICAgICAgbGV0IGxpYnJhcnlCaW5GaWxlUGF0aCA9IHBhdGguam9pbih0aGlzLnByalJvb3REaXIsIFwibGlicmFyeVwiLCB1dWlkLnN1YnN0cmluZygwLCAyKSwgdXVpZCArIFwiLmJpblwiKTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3Jlc291cmNlc0JpbkZpbGVQYXRoJywgcmVzb3VyY2VzQmluRmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2xpYnJhcnlCaW5GaWxlUGF0aCcsIGxpYnJhcnlCaW5GaWxlUGF0aCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGguZGlybmFtZShsaWJyYXJ5QmluRmlsZVBhdGgpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGxpYnJhcnnnm67lvZXmnKrmib7liLDvvIzkuI3pnIDopoHov5vooYzng63mm7TmlrBcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMobGlicmFyeUJpbkZpbGVQYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmMobGlicmFyeUJpbkZpbGVQYXRoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmcy5jb3B5RmlsZVN5bmMocmVzb3VyY2VzQmluRmlsZVBhdGgsIGxpYnJhcnlCaW5GaWxlUGF0aCk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJqc29u5qih5byPXCIpXHJcbiAgICAgICAgICAgICAgICBsZXQgbWV0YUZpbGVQYXRoID0gcGF0aC5qb2luKHRoaXMucHJqUm9vdERpciwgXCJhc3NldHNcIiwgXCJyZXNvdXJjZXNcIiwgXCJjZmdcIiwgXCJkYi5qc29uLm1ldGFcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobWV0YUZpbGVQYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwibWV0YeaWh+S7tuacquaJvuWIsO+8jOaXoOazleeDreabtOaWsGxpYnJhcnlcIiwgbWV0YUZpbGVQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsZXQgbWV0YVRleHQgPSBmcy5yZWFkRmlsZVN5bmMobWV0YUZpbGVQYXRoLCB7IGVuY29kaW5nOiBcInV0Zi04XCIgfSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWV0YURhdGEgPSBKU09OLnBhcnNlKG1ldGFUZXh0KTtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwibWV0YURhdGFcIiwgbWV0YURhdGEpXHJcbiAgICAgICAgICAgICAgICBsZXQgdXVpZCA9IG1ldGFEYXRhLnV1aWQ7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygndXVpZCcsIHV1aWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCByZXNvdXJjZXNKc29uRmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5wcmpSb290RGlyLCBcImFzc2V0c1wiLCBcInJlc291cmNlc1wiLFwiY2ZnXCIsIFwiZGIuanNvblwiKTtcclxuICAgICAgICAgICAgICAgIGxldCBsaWJyYXJ5SnNvbkFzc2V0c0ZpbGVQYXRoID0gcGF0aC5qb2luKHRoaXMucHJqUm9vdERpciwgXCJsaWJyYXJ5XCIsIHV1aWQuc3Vic3RyaW5nKDAsIDIpLCB1dWlkICsgXCIuanNvblwiKTtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdyZXNvdXJjZXNKc29uRmlsZVBhdGgnLCByZXNvdXJjZXNKc29uRmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2xpYnJhcnlKc29uQXNzZXRzRmlsZVBhdGgnLCBsaWJyYXJ5SnNvbkFzc2V0c0ZpbGVQYXRoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMobGlicmFyeUpzb25Bc3NldHNGaWxlUGF0aCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImpzb25Bc3NldHPmlofku7bmnKrmib7liLDvvIzml6Dms5Xng63mm7TmlrBsaWJyYXJ5XCIsIGxpYnJhcnlKc29uQXNzZXRzRmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQganNvbkFzc2V0c1RleHQgPSBmcy5yZWFkRmlsZVN5bmMobGlicmFyeUpzb25Bc3NldHNGaWxlUGF0aCwgeyBlbmNvZGluZzogXCJ1dGYtOFwiIH0pO1xyXG4gICAgICAgICAgICAgICAgbGV0IGpzb25Bc3NldHNEYXRhID0gSlNPTi5wYXJzZShqc29uQXNzZXRzVGV4dCk7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhqc29uQXNzZXRzRGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGpzb25UZXh0ID0gZnMucmVhZEZpbGVTeW5jKHJlc291cmNlc0pzb25GaWxlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICBsZXQganNvbkRhdGEgPSBKU09OLnBhcnNlKGpzb25UZXh0LnRvU3RyaW5nKCkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGpzb25Bc3NldHNEYXRhLmpzb24gPSBqc29uRGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICBqc29uQXNzZXRzVGV4dCA9IEpTT04uc3RyaW5naWZ5KGpzb25Bc3NldHNEYXRhLCBudWxsLCA0KTtcclxuICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMobGlicmFyeUpzb25Bc3NldHNGaWxlUGF0aCwganNvbkFzc2V0c1RleHQsIHsgZW5jb2Rpbmc6IFwidXRmLThcIiB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJsaWJyYXJ554Ot5pu05paw5oiQ5YqfXCIpXHJcblxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibGlicmFyeeeDreabtOaWsOWksei0pe+8mlwiLCBlcnJvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZXhwb3J0QXV0b0V4cG9ydERiVHMoKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IGRpciAgID0gcGF0aC5qb2luKHRoaXMucHJqUm9vdERpciwgXCJhc3NldHNcIiwgXCJyZXNvdXJjZXNcIixcInNjcmlwdHNcIiwgXCJhdXRvXCIpO1xyXG4gICAgICAgIGlmKCFmcy5leGlzdHNTeW5jKGRpcikpe1xyXG4gICAgICAgICAgICBmcy5ta2RpclN5bmMoZGlyLHtyZWN1cnNpdmUgOiB0cnVlfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZmlsZVBhdGggPSBwYXRoLmpvaW4oZGlyLFwiX0F1dG9FeHBvcnREYi50c1wiKTtcclxuXHJcbiAgICAgICAgbGV0IHRleHQgPSBcIlwiO1xyXG5cclxuICAgICAgICB0ZXh0ICs9IFwiaW1wb3J0IERhdGFCYXNlIGZyb20gJy4uL2NvcmUvc3RydWN0L2RhdGEtYmFzZSc7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcImltcG9ydCBEYk1hbmFnZXIgZnJvbSAnLi4vY29yZS9tYW5hZ2VyL2RiLW1hbmFnZXInO1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCJcXG5cIlxyXG4gICAgICAgIHRleHQgKz0gXCIvKipcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICog5q2k5paH5Lu255SxZGJFeHBvcnRlcuiEmuacrOiHquWKqOeUn+aIkO+8geivt+WLv+aJi+WKqOS/ruaUueacrOaWh+S7tu+8gVxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgKiBcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICog5bCB6KOF6YWN572u6KGo55qE5ZCE6aG5Z2V0dGVy5Ye95pWwXFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIiAqL1xcblwiO1xyXG5cclxuICAgICAgICB0ZXh0ICs9ICdsZXQgZGIgPSB7fSBhcyBhbnk7XFxuJztcclxuICAgICAgICB0ZXh0ICs9IFwid2luZG93WydkYiddID0gZGI7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIlxcblwiXHJcblxyXG4gICAgICAgIC8vIOWFiOaUvue9rmtleXNcclxuICAgICAgICBUb29scy5mb3JFYWNoTWFwKHRoaXMuZGJOYW1lXzJfZGIsIChkYk5hbWUsIGRiKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCflr7zlh7rphY3nva7ooajlvpdrZXlz77yaJyxkYk5hbWUpO1xyXG4gICAgICAgICAgICBsZXQga2V5c1RleHQgPSBkYi5nZW5lcmF0ZUF1dG9FeHBvcnREYlRzQ29uc3RzVGV4dCgpO1xyXG4gICAgICAgICAgICBpZiAoa2V5c1RleHQpIHtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0ga2V5c1RleHQgKyBcIlxcblwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRleHQgKz0gXCJcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9ICdleHBvcnQgZnVuY3Rpb24gX0F1dG9FeHBvcnREYl9pbml0KCkge1xcbic7XHJcblxyXG4gICAgICAgIHRleHQgKz0gXCIgICAgZGIuZ2V0RGF0YUJhc2UgPSAoZGJOYW1lOiBzdHJpbmcpOiBEYXRhQmFzZSA9PiB7IHJldHVybiBEYk1hbmFnZXIuZ2V0RGF0YUJhc2UoZGJOYW1lKTsgfVxcblwiXHJcbiAgICAgICAgdGV4dCArPSBcIlxcblwiXHJcblxyXG4gICAgICAgIC8vIOWGjeaUvue9rmdldHRlcnNcclxuICAgICAgICBUb29scy5mb3JFYWNoTWFwKHRoaXMuZGJOYW1lXzJfZGIsIChkYk5hbWUsIGRiKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBnZXR0ZXJzVGV4dCA9IGRiLmdlbmVyYXRlQXV0b0V4cG9ydERiVHNHZXR0ZXJzVGV4dCgpO1xyXG4gICAgICAgICAgICB0ZXh0ICs9IGdldHRlcnNUZXh0ICsgXCJcXG5cIjtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGV4dCArPSBcIn1cXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiXFxuXCI7XHJcblxyXG4gICAgICAgIHRleHQgKz0gXCIvKipcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICog5bu26L+fMW1z5ZCO6Ieq5Yqo5rOo5YaMXFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIiAqIFxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgKi9cXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwic2V0VGltZW91dCgoKSA9PiB7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIiAgICBsZXQgYkRpc2FibGVBdXRvSW5pdCA9ICEhd2luZG93WydfQXV0b0V4cG9ydERiX2JEaXNhYmxlQXV0b0luaXQnXTtcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICAgIGlmICghYkRpc2FibGVBdXRvSW5pdCkge1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgICAgICAgIC8vIGNvbnNvbGUubG9nKCdfQXV0b0V4cG9ydERiLnRzIOWFvOWuueS7o+eggeWQr+WKqO+8jOWIneWni+WMluaJgOaciWdldHRlcuaOpeWPoycpO1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgICAgICAgIF9BdXRvRXhwb3J0RGJfaW5pdCgpO1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgICAgfVxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCJ9LCAxKTtcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiXFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIndpbmRvd1snX0F1dG9FeHBvcnREYl9pbml0J10gPSBfQXV0b0V4cG9ydERiX2luaXQ7XFxuXCI7XHJcblxyXG5cclxuICAgICAgICAvLyDpooTlhYjmo4Dmn6XlhoXlrrnmmK/lkKbmlLnlj5hcclxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpIHtcclxuICAgICAgICAgICAgbGV0IG9yaWdpblRleHQgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsIHsgZW5jb2Rpbmc6IFwidXRmLThcIiB9KTtcclxuICAgICAgICAgICAgaWYgKG9yaWdpblRleHQgPT0gdGV4dCkge1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCLmlofku7bmnKrlj5HnlJ/mlLnliqjvvIzkuI3pnIDopoHph43mlrDlhpnlhaXvvJpcIiwgZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHVybCA9IFwiZGI6Ly9hc3NldHMvcmVzb3VyY2VzL3NjcmlwdHMvYXV0by9fQXV0b0V4cG9ydERiLnRzXCI7XHJcblxyXG4gICAgICAgIEFzc2V0RGJVdGlscy5SZXF1ZXN0Q3JlYXRlTmV3QXNzZXQodXJsLHRleHQsdHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmoLnmja7phY3nva7ooajnmoTlkI3lrZfojrflj5bkuIDkuKrphY3nva7ooajnmoTmlbDmja7vvIzlj6/og73ov5Tlm55udWxsXHJcbiAgICAgKiBAcGFyYW0gZGJOYW1lIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGdldERhdGFiYXNlKGRiTmFtZSA6IHN0cmluZykgOiBEYXRhQmFzZSB8IG51bGx7XHJcbiAgICAgICAgaWYoIXRoaXMuZGJOYW1lXzJfZGJbZGJOYW1lXSl7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5kYk5hbWVfMl9kYltkYk5hbWVdO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5a+85Ye6aTE4bumFjee9rlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIGV4cG9ydEkxOE5EZWZpbmVGaWxlKCl7XHJcbiAgICAgICAgY29uc3QgZGJCYXNlID0gdGhpcy5nZXREYXRhYmFzZSgnaTE4bl9sYW5ndWFnZV9jb25maWdfZGInKTtcclxuICAgICAgICBpZighZGJCYXNlKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB0ZXh0ICA9IGRiQmFzZS5nZW5lcmF0ZUkxOG5FbnVtVGV4dCgpO1xyXG4gICAgICAgIGlmKCF0ZXh0IHx8IHRleHQgPT0gXCJcIil7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdXJsID0gXCJkYjovL2Fzc2V0cy9yZXNvdXJjZXMvc2NyaXB0cy9hdXRvL2kxOG4tZGVmaW5lLnRzXCI7XHJcblxyXG4gICAgICAgIEFzc2V0RGJVdGlscy5SZXF1ZXN0Q3JlYXRlTmV3QXNzZXQodXJsLHRleHQsdHJ1ZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbiJdfQ==