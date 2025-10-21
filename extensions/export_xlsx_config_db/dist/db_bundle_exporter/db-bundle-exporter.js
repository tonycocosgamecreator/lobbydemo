"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const db_bundle_data_base_1 = require("./db-bundle-data-base");
const fs_extra_1 = __importDefault(require("fs-extra"));
const tools_1 = __importDefault(require("../utils/tools"));
const db_bundle_config_1 = require("./db-bundle-config");
const asset_db_utils_1 = require("../utils/asset-db-utils");
const jszip_1 = __importDefault(require("jszip"));
const db_bundle_datas_1 = require("./db-bundle-datas");
/**
 * 对某一个指定名字的bundle的配置表进行导出
 */
class DbBundleExporter {
    get bundleName() {
        return this._bundleName;
    }
    constructor(bundleName) {
        /**
         * 解析厚得配置表数据
         */
        this.dbName_2_db = {};
        this._bundleName = bundleName;
        this.srcDbRootDir = path_1.default.join(Editor.Project.path, "_config", bundleName);
        this.previewDbDir = path_1.default.join(Editor.Project.path, "_config", bundleName, '_preview_db');
    }
    async exportBundle() {
        tools_1.default.foreachDir(this.srcDbRootDir, (filePath) => {
            if (db_bundle_datas_1.DbBundleDatas.Instance.loadedDbFilePaths[filePath]) {
                return false;
            }
            //如果filePath不是以xlsx结尾，返回
            if (!filePath.endsWith(".xlsx")) {
                return false;
            }
            let dbs = [];
            db_bundle_data_base_1.DbBundleDataBase.loadFromXlsxAsync(filePath, (_dbs) => {
                dbs = _dbs;
                for (let i = 0; i < dbs.length; i++) {
                    const db = dbs[i];
                    db_bundle_datas_1.DbBundleDatas.Instance.dbFilePath_2_dbNameMap[filePath] = (db_bundle_datas_1.DbBundleDatas.Instance.dbFilePath_2_dbNameMap[filePath] || {});
                    db_bundle_datas_1.DbBundleDatas.Instance.dbFilePath_2_dbNameMap[filePath][db.name] = true;
                    db_bundle_datas_1.DbBundleDatas.Instance.dbNames_2_dbFilePathMap[db.name] = (db_bundle_datas_1.DbBundleDatas.Instance.dbNames_2_dbFilePathMap[db.name] || {});
                    db_bundle_datas_1.DbBundleDatas.Instance.dbNames_2_dbFilePathMap[db.name][filePath] = true;
                    if (!db.canExport()) {
                        console.warn("配置表不可导出：", db.name);
                        for (let j = 0; j < db.warnLog.length; j++) {
                            const text = db.warnLog[j];
                            console.warn(text);
                        }
                        continue;
                    }
                    let oldDb = this.dbName_2_db[db.name];
                    if (!oldDb) {
                        this.dbName_2_db[db.name] = db;
                        db_bundle_datas_1.DbBundleDatas.Instance.dbName_2_db[db.name] = db;
                    }
                    else {
                        let msg = oldDb.canMerge(db);
                        if (msg) {
                            console.error(tools_1.default.format("配置表[%s]合并失败：file1=[%s] file2=[%s] 失败理由=[%s]", db.name, oldDb.originFilePath, db.originFilePath, msg));
                            continue;
                        }
                        else {
                            // 合并数据
                            oldDb.mergeDb(db);
                            db_bundle_datas_1.DbBundleDatas.Instance.dbName_2_db[oldDb.name] = oldDb;
                        }
                    }
                }
                db_bundle_datas_1.DbBundleDatas.Instance.loadedDbFilePaths[filePath] = true;
            });
        });
    }
    /**
     * 导出当前bundle的json文件
     */
    exportPreviewDb() {
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
        console.log(tools_1.default.format("预览配置表preivew_db导出完毕，已导出%d个json文件。", count));
    }
    mergeDbField() {
        tools_1.default.forEachMap(this.dbName_2_db, (dbName, db) => {
            db.processMergeToArr();
        });
    }
    /**
     * 导出描述文件
     */
    exportDtsFile() {
        let text = '';
        let moduleName = this._bundleName + 'Db';
        text += '/** 配置表数据结构描述文件，本文件由导出器自动生成，请勿手动修改 */\n';
        text += 'declare module ' + moduleName + ' {\n';
        text += '    function getDataBase(dbName: string): any;\n';
        tools_1.default.forEachMap(this.dbName_2_db, (dbName, db) => {
            text += db.generateDbdtsText(moduleName);
            text += db.generateDbdtsConstsText(moduleName);
            // console.log(dbName)
            // console.log(text)
        });
        text += '}';
        // console.log(text);
        let dtsFilePath = path_1.default.join(Editor.Project.path, "declare", this._bundleName + "Db.d.ts");
        if (!fs_extra_1.default.existsSync(path_1.default.dirname(dtsFilePath))) {
            fs_extra_1.default.mkdirSync(path_1.default.dirname(dtsFilePath), { recursive: true });
        }
        fs_extra_1.default.writeFileSync(dtsFilePath, text, { encoding: "utf-8" });
    }
    /**
     * 导出数据文件，asset资源
     */
    async exportDataFile() {
        let jsonData = {};
        const exportMode = db_bundle_config_1.DbBundleConfig.Instance.exportMode;
        console.log("配置表导出模式: ", exportMode);
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
        let jsonDataFilePath = path_1.default.join(Editor.Project.path, "assets", this._bundleName, "cfg", "db.json");
        let binDataFilePath = path_1.default.join(Editor.Project.path, "assets", this._bundleName, "cfg", "db.bin");
        let assetJsonPath = "db://assets/resources/cfg/db.json";
        let assetBinPath = "db://assets/resources/cfg/db.bin";
        if (this._bundleName != 'resources') {
            jsonDataFilePath = path_1.default.join(Editor.Project.path, "assets", "bundles", this._bundleName, "cfg", "db.json");
            binDataFilePath = path_1.default.join(Editor.Project.path, "assets", "bundles", this._bundleName, "cfg", "db.bin");
            assetJsonPath = "db://assets/bundles/" + this._bundleName + "/cfg/db.json";
            assetBinPath = "db://assets/bundles/" + this._bundleName + "/cfg/db.bin";
        }
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
        switch (exportMode) {
            case db_bundle_config_1.ExportMode.PRETTY_JSON: {
                // 美化json
                let text = JSON.stringify(jsonData, null, 4);
                //fs.writeFileSync(jsonDataFilePath, text, { encoding: "utf-8" });
                await asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset(assetJsonPath, text, true);
                break;
            }
            case db_bundle_config_1.ExportMode.ZIP_JSON: {
                const zip = new jszip_1.default();
                // 压缩json
                let text = JSON.stringify(jsonData);
                //const content = pako.deflate(text,{level:0});
                // 文件头，'pako'
                let headChunk = this.stringToUint8Array("zip-json");
                zip.file("database", text);
                // 压缩后的数据
                const content = await zip.generateAsync({
                    type: "uint8array",
                    compression: "DEFLATE"
                });
                console.log("获取到长度：", content.length);
                // 输出的二进制，文件头+压缩后的数据
                await asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset(assetBinPath, content, true);
                break;
            }
            case db_bundle_config_1.ExportMode.JSON:
            default: {
                // 默认使用标准json
                let text = JSON.stringify(jsonData);
                //fs.writeFileSync(jsonDataFilePath, text, { encoding: "utf-8" });
                await asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset(assetJsonPath, text, true);
                break;
            }
        }
        console.log(tools_1.default.format("已导出配置表：%d个", exportCount));
    }
    /**
     * 导出 _AutoExportDb.ts（resources)
     * 其他bundle会导出属于自己的_Auto{bundleName}ExportDb.ts,bundleName首字母大写
     */
    exportAutoExportDbTs() {
        let dir = '';
        if (this._bundleName == 'resources') {
            dir = path_1.default.join(Editor.Project.path, "assets", "resources", "scripts", "auto");
        }
        else {
            dir = path_1.default.join(Editor.Project.path, "assets", "bundles", this._bundleName, "scripts", "auto");
        }
        let filePath = '';
        let tsFilePath = 'db://assets/';
        if (this._bundleName == 'resources') {
            filePath = path_1.default.join(dir, "_AutoResourcesExportDb.ts");
            tsFilePath += "resources/scripts/auto/_AutoResourcesExportDb.ts";
        }
        else {
            filePath = path_1.default.join(dir, "_Auto" + tools_1.default.upperFirstLetter(this._bundleName) + "ExportDb.ts");
            tsFilePath += "bundles/" + this._bundleName + "/scripts/auto/_Auto" + tools_1.default.upperFirstLetter(this._bundleName) + "ExportDb.ts";
        }
        let text = '';
        text += "import DataBase from 'db://assets/resources/scripts/core/struct/data-base';\n";
        text += "import DbManager from 'db://assets/resources/scripts/core/manager/db-manager';\n";
        text += "\n";
        text += "/**\n";
        text += " * 此文件由dbExporter脚本自动生成！请勿手动修改本文件！\n";
        text += " * \n";
        text += " * 封装配置表的各项getter函数\n";
        text += " */\n";
        let moduleName = this._bundleName + "Db";
        let initFuncName = "_Auto" + tools_1.default.upperFirstLetter(this._bundleName) + "ExportDb_init";
        text += "let " + moduleName + " = {} as any;\n";
        text += "window['" + moduleName + "'] = " + moduleName + ";\n";
        text += "\n";
        // 先放置keys
        tools_1.default.forEachMap(this.dbName_2_db, (dbName, db) => {
            console.log('导出配置表得keys：', dbName);
            let keysText = db.generateAutoExportDbTsConstsText(moduleName);
            if (keysText) {
                text += keysText + "\n";
            }
        });
        text += "\n";
        //放初始化函数
        text += "export function " + initFuncName + "(){\n";
        text += "    " + moduleName + ".getDataBase = (dbName: string): DataBase => { return DbManager.getDataBase(dbName); }\n";
        text += "\n";
        // 再放置getters
        tools_1.default.forEachMap(this.dbName_2_db, (dbName, db) => {
            let gettersText = db.generateAutoExportDbTsGettersText(moduleName);
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
        text += "        " + initFuncName + "();\n";
        text += "    }\n";
        text += "}, 1);\n";
        text += "\n";
        text += "window['" + initFuncName + "'] = " + initFuncName + ";\n";
        // 预先检查内容是否改变
        if (fs_extra_1.default.existsSync(filePath)) {
            let originText = fs_extra_1.default.readFileSync(filePath, { encoding: "utf-8" });
            if (originText == text) {
                // console.log("文件未发生改动，不需要重新写入：", filePath);
                return;
            }
        }
        //生成autoExportDb.ts文件
        asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset(tsFilePath, text, true);
        console.warn('导出配置表d.ts描述文件：', tsFilePath);
    }
    exportI18NDefineFile() {
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
    /**
     * 根据配置表的名字获取一个配置表的数据，可能返回null
     * @param dbName
     */
    getDatabase(dbName) {
        if (!this.dbName_2_db[dbName]) {
            return null;
        }
        return this.dbName_2_db[dbName];
    }
    stringToUint8Array(str) {
        var arr = [];
        for (var i = 0, j = str.length; i < j; ++i) {
            arr.push(str.charCodeAt(i));
        }
        var tmpUint8Array = new Uint8Array(arr);
        return tmpUint8Array;
    }
}
exports.default = DbBundleExporter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGItYnVuZGxlLWV4cG9ydGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2RiX2J1bmRsZV9leHBvcnRlci9kYi1idW5kbGUtZXhwb3J0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsK0RBQXlEO0FBQ3pELHdEQUEwQjtBQUMxQiwyREFBbUM7QUFDbkMseURBQWdFO0FBQ2hFLDREQUF1RDtBQUN2RCxrREFBMEI7QUFDMUIsdURBQWtEO0FBQ2xEOztHQUVHO0FBQ0gsTUFBcUIsZ0JBQWdCO0lBTWpDLElBQVcsVUFBVTtRQUNqQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDNUIsQ0FBQztJQWNELFlBQVksVUFBbUI7UUFML0I7O1dBRUc7UUFDSSxnQkFBVyxHQUEwQyxFQUFFLENBQUM7UUFHM0QsSUFBSSxDQUFDLFdBQVcsR0FBTSxVQUFVLENBQUM7UUFDakMsSUFBSSxDQUFDLFlBQVksR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsWUFBWSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBQyxhQUFhLENBQUMsQ0FBQztJQUM1RixDQUFDO0lBRU0sS0FBSyxDQUFDLFlBQVk7UUFDckIsZUFBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsUUFBaUIsRUFBRSxFQUFFO1lBQ3RELElBQUcsK0JBQWEsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLEVBQUM7Z0JBQ2xELE9BQU8sS0FBSyxDQUFDO2FBQ2hCO1lBQ0Qsd0JBQXdCO1lBQ3hCLElBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFDO2dCQUMzQixPQUFPLEtBQUssQ0FBQzthQUNoQjtZQUNELElBQUksR0FBRyxHQUF3QixFQUFFLENBQUM7WUFDbEMsc0NBQWdCLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFDLENBQUMsSUFBSSxFQUFDLEVBQUU7Z0JBQ2hELEdBQUcsR0FBRyxJQUFJLENBQUM7Z0JBQ1gsS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLEVBQUM7b0JBQzNCLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEIsK0JBQWEsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBYSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztvQkFDMUgsK0JBQWEsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztvQkFFeEUsK0JBQWEsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsK0JBQWEsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUMxSCwrQkFBYSxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDO29CQUV6RSxJQUFHLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFDO3dCQUNmLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDakMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOzRCQUN4QyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUN0Qjt3QkFDRCxTQUFTO3FCQUNaO29CQUNELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN0QyxJQUFHLENBQUMsS0FBSyxFQUFDO3dCQUNOLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFLLEVBQUUsQ0FBQzt3QkFDakMsK0JBQWEsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7cUJBQ3BEO3lCQUFJO3dCQUNELElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQzdCLElBQUksR0FBRyxFQUFFOzRCQUNMLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBSyxDQUFDLE1BQU0sQ0FBQyw2Q0FBNkMsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDOzRCQUNsSSxTQUFTO3lCQUNaOzZCQUFNOzRCQUNILE9BQU87NEJBQ1AsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQzs0QkFDbEIsK0JBQWEsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBSSxLQUFLLENBQUM7eUJBQzNEO3FCQUNKO2lCQUNKO2dCQUNELCtCQUFhLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxHQUFJLElBQUksQ0FBQztZQUMvRCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOztPQUVHO0lBQ0ksZUFBZTtRQUNsQixJQUFJLEtBQUssR0FBSyxDQUFDLENBQUM7UUFDaEIsbUJBQW1CO1FBQ25CLElBQUksQ0FBQyxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDbkMsa0JBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBQyxFQUFDLFNBQVMsRUFBRyxJQUFJLEVBQUMsQ0FBQyxDQUFDO1NBQ3REO1FBQ0QsaUJBQWlCO1FBQ2pCLGVBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFO1lBQzdDLGtCQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzNCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsYUFBYTtRQUNiLGVBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRTtZQUM5QyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUMseUJBQXlCLEVBQUUsQ0FBQztZQUMxQyxJQUFJLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDO1lBQzlELGtCQUFFLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN4RCxLQUFLLEVBQUUsQ0FBQztRQUNaLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFLLENBQUMsTUFBTSxDQUFDLG1DQUFtQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUdNLFlBQVk7UUFDZixlQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDOUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBQ0Q7O09BRUc7SUFDSSxhQUFhO1FBQ2hCLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNkLElBQUksVUFBVSxHQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQzFDLElBQUksSUFBSSx5Q0FBeUMsQ0FBQztRQUNsRCxJQUFJLElBQUksaUJBQWlCLEdBQUcsVUFBVSxHQUFHLE1BQU0sQ0FBQztRQUVoRCxJQUFJLElBQUksa0RBQWtELENBQUM7UUFFM0QsZUFBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFO1lBRTlDLElBQUksSUFBSSxFQUFFLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFekMsSUFBSSxJQUFJLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUUvQyxzQkFBc0I7WUFDdEIsb0JBQW9CO1FBQ3hCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxJQUFJLEdBQUcsQ0FBQztRQUVaLHFCQUFxQjtRQUVyQixJQUFJLFdBQVcsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQyxDQUFDO1FBQzFGLElBQUksQ0FBQyxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUU7WUFDM0Msa0JBQUUsQ0FBQyxTQUFTLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBQyxFQUFDLFNBQVMsRUFBRyxJQUFJLEVBQUMsQ0FBQyxDQUFDO1NBQzlEO1FBQ0Qsa0JBQUUsQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFDRDs7T0FFRztJQUNJLEtBQUssQ0FBQyxjQUFjO1FBQ3ZCLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUVsQixNQUFNLFVBQVUsR0FBRyxpQ0FBYyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUM7UUFDdEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDckMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLGVBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRTtZQUM5QyxpQ0FBaUM7WUFDakMsV0FBVyxFQUFFLENBQUM7WUFFZCxJQUFJLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztZQUMxQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3ZDLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNCLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO2FBQzdDO1lBRUQsSUFBSSxNQUFNLEdBQUc7Z0JBQ1QsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJO2dCQUNiLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSTtnQkFDYixLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUs7Z0JBQ2YsZ0JBQWdCLEVBQUUsZ0JBQWdCO2FBQ3JDLENBQUM7WUFDRixRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxnQkFBZ0IsR0FBTSxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFHLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN4RyxJQUFJLGVBQWUsR0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFHLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2RyxJQUFJLGFBQWEsR0FBUyxtQ0FBbUMsQ0FBQztRQUM5RCxJQUFJLFlBQVksR0FBVSxrQ0FBa0MsQ0FBQztRQUM3RCxJQUFHLElBQUksQ0FBQyxXQUFXLElBQUksV0FBVyxFQUFDO1lBQy9CLGdCQUFnQixHQUFNLGNBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFHLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMvRyxlQUFlLEdBQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUcsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzlHLGFBQWEsR0FBUyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsV0FBVyxHQUFHLGNBQWMsQ0FBQztZQUNqRixZQUFZLEdBQVUsc0JBQXNCLEdBQUcsSUFBSSxDQUFDLFdBQVcsR0FBRyxhQUFhLENBQUM7U0FDbkY7UUFDRCxJQUFJLENBQUMsa0JBQUUsQ0FBQyxVQUFVLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUU7WUFDaEQsa0JBQUUsQ0FBQyxTQUFTLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFDLEVBQUMsU0FBUyxFQUFHLElBQUksRUFBQyxDQUFDLENBQUM7U0FDbkU7UUFDRCxJQUFJLGtCQUFFLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7WUFDakMsa0JBQUUsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtTQUM5QjtRQUNELElBQUksa0JBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDaEMsa0JBQUUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUE7U0FDN0I7UUFFRCxNQUFNO1FBQ04sUUFBUSxVQUFVLEVBQUU7WUFDaEIsS0FBSyw2QkFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUN6QixTQUFTO2dCQUNULElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDN0Msa0VBQWtFO2dCQUNsRSxNQUFNLDZCQUFZLENBQUMscUJBQXFCLENBQUMsYUFBYSxFQUFDLElBQVcsRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDekUsTUFBTTthQUNUO1lBRUQsS0FBSyw2QkFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN0QixNQUFNLEdBQUcsR0FBRyxJQUFJLGVBQUssRUFBRSxDQUFDO2dCQUN4QixTQUFTO2dCQUNULElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3BDLCtDQUErQztnQkFDL0MsYUFBYTtnQkFDYixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3BELEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxQixTQUFTO2dCQUNULE1BQU0sT0FBTyxHQUFHLE1BQU0sR0FBRyxDQUFDLGFBQWEsQ0FBQztvQkFDcEMsSUFBSSxFQUFFLFlBQVk7b0JBQ2xCLFdBQVcsRUFBRSxTQUFTO2lCQUN6QixDQUFDLENBQUM7Z0JBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNyQyxvQkFBb0I7Z0JBQ3BCLE1BQU0sNkJBQVksQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLEVBQUMsT0FBYyxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMzRSxNQUFNO2FBQ1Q7WUFFRCxLQUFLLDZCQUFVLENBQUMsSUFBSSxDQUFDO1lBQ3JCLE9BQU8sQ0FBQyxDQUFDO2dCQUNMLGFBQWE7Z0JBQ2IsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDcEMsa0VBQWtFO2dCQUNsRSxNQUFNLDZCQUFZLENBQUMscUJBQXFCLENBQUMsYUFBYSxFQUFDLElBQVcsRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDekUsTUFBTTthQUNUO1NBQ0o7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVEOzs7T0FHRztJQUNJLG9CQUFvQjtRQUN2QixJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFHLElBQUksQ0FBQyxXQUFXLElBQUksV0FBVyxFQUFDO1lBQy9CLEdBQUcsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQ2pGO2FBQUk7WUFDRCxHQUFHLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQ2xHO1FBRUQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLElBQUksVUFBVSxHQUFHLGNBQWMsQ0FBQztRQUNoQyxJQUFHLElBQUksQ0FBQyxXQUFXLElBQUksV0FBVyxFQUFDO1lBQy9CLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO1lBQ3ZELFVBQVUsSUFBSSxrREFBa0QsQ0FBQztTQUNwRTthQUFJO1lBQ0QsUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sR0FBRyxlQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDO1lBQzlGLFVBQVUsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsR0FBRyxxQkFBcUIsR0FBRyxlQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLGFBQWEsQ0FBQztTQUNsSTtRQUNELElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNkLElBQUksSUFBSSwrRUFBK0UsQ0FBQztRQUN4RixJQUFJLElBQUksa0ZBQWtGLENBQUM7UUFDM0YsSUFBSSxJQUFJLElBQUksQ0FBQTtRQUNaLElBQUksSUFBSSxPQUFPLENBQUM7UUFDaEIsSUFBSSxJQUFJLHNDQUFzQyxDQUFDO1FBQy9DLElBQUksSUFBSSxPQUFPLENBQUM7UUFDaEIsSUFBSSxJQUFJLHVCQUF1QixDQUFDO1FBQ2hDLElBQUksSUFBSSxPQUFPLENBQUM7UUFFaEIsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDekMsSUFBSSxZQUFZLEdBQUcsT0FBTyxHQUFHLGVBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsZUFBZSxDQUFDO1FBRXhGLElBQUksSUFBSSxNQUFNLEdBQUcsVUFBVSxHQUFHLGlCQUFpQixDQUFDO1FBQ2hELElBQUksSUFBSSxVQUFVLEdBQUcsVUFBVSxHQUFHLE9BQU8sR0FBRyxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBQy9ELElBQUksSUFBSSxJQUFJLENBQUM7UUFFYixVQUFVO1FBQ1YsZUFBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFO1lBQzlDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xDLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQyxnQ0FBZ0MsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMvRCxJQUFJLFFBQVEsRUFBRTtnQkFDVixJQUFJLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQzthQUMzQjtRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxJQUFJLElBQUksQ0FBQztRQUViLFFBQVE7UUFDUixJQUFJLElBQUksa0JBQWtCLEdBQUcsWUFBWSxHQUFHLE9BQU8sQ0FBQztRQUNwRCxJQUFJLElBQUksTUFBTSxHQUFHLFVBQVUsR0FBRywwRkFBMEYsQ0FBQztRQUN6SCxJQUFJLElBQUksSUFBSSxDQUFDO1FBQ2IsYUFBYTtRQUNiLGVBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRTtZQUM5QyxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUMsaUNBQWlDLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbkUsSUFBSSxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLElBQUksS0FBSyxDQUFDO1FBQ2QsSUFBSSxJQUFJLElBQUksQ0FBQztRQUNiLElBQUksSUFBSSxPQUFPLENBQUM7UUFDaEIsSUFBSSxJQUFJLGlCQUFpQixDQUFDO1FBQzFCLElBQUksSUFBSSxPQUFPLENBQUM7UUFDaEIsSUFBSSxJQUFJLE9BQU8sQ0FBQztRQUNoQixJQUFJLElBQUksc0JBQXNCLENBQUM7UUFDL0IsSUFBSSxJQUFJLDBFQUEwRSxDQUFDO1FBQ25GLElBQUksSUFBSSxnQ0FBZ0MsQ0FBQztRQUN6QyxJQUFJLElBQUksb0VBQW9FLENBQUM7UUFDN0UsSUFBSSxJQUFJLFVBQVUsR0FBRyxZQUFZLEdBQUcsT0FBTyxDQUFDO1FBQzVDLElBQUksSUFBSSxTQUFTLENBQUM7UUFDbEIsSUFBSSxJQUFJLFVBQVUsQ0FBQztRQUNuQixJQUFJLElBQUksSUFBSSxDQUFDO1FBQ2IsSUFBSSxJQUFJLFVBQVUsR0FBRyxZQUFZLEdBQUcsT0FBTyxHQUFHLFlBQVksR0FBRyxLQUFLLENBQUM7UUFFbEUsYUFBYTtRQUNiLElBQUksa0JBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDMUIsSUFBSSxVQUFVLEdBQUcsa0JBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDbEUsSUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO2dCQUNwQiw2Q0FBNkM7Z0JBQzdDLE9BQU87YUFDVjtTQUNKO1FBQ0QscUJBQXFCO1FBQ3JCLDZCQUFZLENBQUMscUJBQXFCLENBQUMsVUFBVSxFQUFDLElBQUksRUFBQyxJQUFJLENBQUMsQ0FBQztRQUN6RCxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFTSxvQkFBb0I7UUFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzNELElBQUcsQ0FBQyxNQUFNLEVBQUM7WUFDUCxPQUFPO1NBQ1Y7UUFDRCxNQUFNLElBQUksR0FBSSxNQUFNLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUM1QyxJQUFHLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFLEVBQUM7WUFDbkIsT0FBTztTQUNWO1FBQ0QsTUFBTSxHQUFHLEdBQUcsbURBQW1ELENBQUM7UUFFaEUsNkJBQVksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRDs7O09BR0c7SUFDSSxXQUFXLENBQUMsTUFBZTtRQUM5QixJQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBQztZQUN6QixPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFTyxrQkFBa0IsQ0FBQyxHQUFHO1FBQzFCLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNiLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7WUFDeEMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDL0I7UUFDRCxJQUFJLGFBQWEsR0FBRyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN4QyxPQUFPLGFBQWEsQ0FBQTtJQUN4QixDQUFDO0NBQ0o7QUExVkQsbUNBMFZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgRGJCdW5kbGVEYXRhQmFzZSB9IGZyb20gXCIuL2RiLWJ1bmRsZS1kYXRhLWJhc2VcIjtcclxuaW1wb3J0IGZzIGZyb20gJ2ZzLWV4dHJhJztcclxuaW1wb3J0IFRvb2xzIGZyb20gXCIuLi91dGlscy90b29sc1wiO1xyXG5pbXBvcnQgeyBEYkJ1bmRsZUNvbmZpZywgRXhwb3J0TW9kZSB9IGZyb20gXCIuL2RiLWJ1bmRsZS1jb25maWdcIjtcclxuaW1wb3J0IHsgQXNzZXREYlV0aWxzIH0gZnJvbSBcIi4uL3V0aWxzL2Fzc2V0LWRiLXV0aWxzXCI7XHJcbmltcG9ydCBKU1ppcCBmcm9tIFwianN6aXBcIjtcclxuaW1wb3J0IHsgRGJCdW5kbGVEYXRhcyB9IGZyb20gXCIuL2RiLWJ1bmRsZS1kYXRhc1wiO1xyXG4vKipcclxuICog5a+55p+Q5LiA5Liq5oyH5a6a5ZCN5a2X55qEYnVuZGxl55qE6YWN572u6KGo6L+b6KGM5a+85Ye6XHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEYkJ1bmRsZUV4cG9ydGVye1xyXG4gICAgLyoqXHJcbiAgICAgKiDlr7zlh7rmjIflrprlkI3lrZfnmoRidW5kbGXnmoTphY3nva7ooahcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBfYnVuZGxlTmFtZSA6IHN0cmluZztcclxuXHJcbiAgICBwdWJsaWMgZ2V0IGJ1bmRsZU5hbWUoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYnVuZGxlTmFtZTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog6YWN572u6KGo55qE5paH5Lu25aS56Lev5b6EXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgc3JjRGJSb290RGlyIDogc3RyaW5nO1xyXG4gICAgLyoqXHJcbiAgICAgKiDpooTop4hqc29u5paH5Lu255qE5paH5Lu25aS56Lev5b6EXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgcHJldmlld0RiRGlyIDogc3RyaW5nO1xyXG4gICAgLyoqXHJcbiAgICAgKiDop6PmnpDljprlvpfphY3nva7ooajmlbDmja5cclxuICAgICAqL1xyXG4gICAgcHVibGljIGRiTmFtZV8yX2RiIDoge1tuYW1lIDogc3RyaW5nXSA6IERiQnVuZGxlRGF0YUJhc2V9ID0ge307XHJcblxyXG4gICAgY29uc3RydWN0b3IoYnVuZGxlTmFtZSA6IHN0cmluZyl7XHJcbiAgICAgICAgdGhpcy5fYnVuZGxlTmFtZSAgICA9IGJ1bmRsZU5hbWU7XHJcbiAgICAgICAgdGhpcy5zcmNEYlJvb3REaXIgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgXCJfY29uZmlnXCIsIGJ1bmRsZU5hbWUpO1xyXG4gICAgICAgIHRoaXMucHJldmlld0RiRGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiX2NvbmZpZ1wiLCBidW5kbGVOYW1lLCdfcHJldmlld19kYicpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhc3luYyBleHBvcnRCdW5kbGUoKXtcclxuICAgICAgICBUb29scy5mb3JlYWNoRGlyKHRoaXMuc3JjRGJSb290RGlyLCAoZmlsZVBhdGggOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgaWYoRGJCdW5kbGVEYXRhcy5JbnN0YW5jZS5sb2FkZWREYkZpbGVQYXRoc1tmaWxlUGF0aF0pe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8v5aaC5p6cZmlsZVBhdGjkuI3mmK/ku6V4bHN457uT5bC+77yM6L+U5ZueXHJcbiAgICAgICAgICAgIGlmKCFmaWxlUGF0aC5lbmRzV2l0aChcIi54bHN4XCIpKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgZGJzIDogRGJCdW5kbGVEYXRhQmFzZVtdID0gW107XHJcbiAgICAgICAgICAgIERiQnVuZGxlRGF0YUJhc2UubG9hZEZyb21YbHN4QXN5bmMoZmlsZVBhdGgsKF9kYnMpPT57XHJcbiAgICAgICAgICAgICAgICBkYnMgPSBfZGJzO1xyXG4gICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDtpPGRicy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYiA9IGRic1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBEYkJ1bmRsZURhdGFzLkluc3RhbmNlLmRiRmlsZVBhdGhfMl9kYk5hbWVNYXBbZmlsZVBhdGhdID0gKERiQnVuZGxlRGF0YXMuSW5zdGFuY2UuZGJGaWxlUGF0aF8yX2RiTmFtZU1hcFtmaWxlUGF0aF0gfHwge30pO1xyXG4gICAgICAgICAgICAgICAgICAgIERiQnVuZGxlRGF0YXMuSW5zdGFuY2UuZGJGaWxlUGF0aF8yX2RiTmFtZU1hcFtmaWxlUGF0aF1bZGIubmFtZV0gPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBEYkJ1bmRsZURhdGFzLkluc3RhbmNlLmRiTmFtZXNfMl9kYkZpbGVQYXRoTWFwW2RiLm5hbWVdID0gKERiQnVuZGxlRGF0YXMuSW5zdGFuY2UuZGJOYW1lc18yX2RiRmlsZVBhdGhNYXBbZGIubmFtZV0gfHwge30pO1xyXG4gICAgICAgICAgICAgICAgICAgIERiQnVuZGxlRGF0YXMuSW5zdGFuY2UuZGJOYW1lc18yX2RiRmlsZVBhdGhNYXBbZGIubmFtZV1bZmlsZVBhdGhdID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIWRiLmNhbkV4cG9ydCgpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi6YWN572u6KGo5LiN5Y+v5a+85Ye677yaXCIsZGIubmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZGIud2FybkxvZy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IGRiLndhcm5Mb2dbal07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4odGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBvbGREYiA9IHRoaXMuZGJOYW1lXzJfZGJbZGIubmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIW9sZERiKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYk5hbWVfMl9kYltkYi5uYW1lXSAgID0gZGI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIERiQnVuZGxlRGF0YXMuSW5zdGFuY2UuZGJOYW1lXzJfZGJbZGIubmFtZV0gPSBkYjtcclxuICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG1zZyA9IG9sZERiLmNhbk1lcmdlKGRiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1zZykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5ZCI5bm25aSx6LSl77yaZmlsZTE9WyVzXSBmaWxlMj1bJXNdIOWksei0peeQhueUsT1bJXNdXCIsIGRiLm5hbWUsIG9sZERiLm9yaWdpbkZpbGVQYXRoLCBkYi5vcmlnaW5GaWxlUGF0aCwgbXNnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWQiOW5tuaVsOaNrlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkRGIubWVyZ2VEYihkYik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYkJ1bmRsZURhdGFzLkluc3RhbmNlLmRiTmFtZV8yX2RiW29sZERiLm5hbWVdICA9IG9sZERiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgRGJCdW5kbGVEYXRhcy5JbnN0YW5jZS5sb2FkZWREYkZpbGVQYXRoc1tmaWxlUGF0aF0gID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlr7zlh7rlvZPliY1idW5kbGXnmoRqc29u5paH5Lu2XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBleHBvcnRQcmV2aWV3RGIoKXtcclxuICAgICAgICBsZXQgY291bnQgICA9IDA7XHJcbiAgICAgICAgLy8gMS4g5bCd6K+V5Yib5bu6X3Jhd19kYuebruW9lVxyXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyh0aGlzLnByZXZpZXdEYkRpcikpIHtcclxuICAgICAgICAgICAgZnMubWtkaXJTeW5jKHRoaXMucHJldmlld0RiRGlyLHtyZWN1cnNpdmUgOiB0cnVlfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIDIuIOa4heeQhl9yYXdfZGLnm67lvZVcclxuICAgICAgICBUb29scy5mb3JlYWNoRGlyKHRoaXMucHJldmlld0RiRGlyLCAoZmlsZVBhdGgpID0+IHtcclxuICAgICAgICAgICAgZnMudW5saW5rU3luYyhmaWxlUGF0aClcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyAzLiDnlJ/miJDljp/lp4vphY3nva7ooahcclxuICAgICAgICBUb29scy5mb3JFYWNoTWFwKHRoaXMuZGJOYW1lXzJfZGIsIChkYk5hbWUsIGRiKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0ZXh0ID0gZGIuZ2VuZXJhdGVQcmV2aWV3RGJKc29uVGV4dCgpO1xyXG4gICAgICAgICAgICBsZXQgZmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5wcmV2aWV3RGJEaXIsIGRiTmFtZSArIFwiLmpzb25cIik7XHJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIHRleHQsIHsgZW5jb2Rpbmc6IFwidXRmLThcIiB9KTtcclxuICAgICAgICAgICAgY291bnQrKztcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhUb29scy5mb3JtYXQoXCLpooTop4jphY3nva7ooahwcmVpdmV3X2Ri5a+85Ye65a6M5q+V77yM5bey5a+85Ye6JWTkuKpqc29u5paH5Lu244CCXCIsIGNvdW50KSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyBtZXJnZURiRmllbGQoKXtcclxuICAgICAgICBUb29scy5mb3JFYWNoTWFwKHRoaXMuZGJOYW1lXzJfZGIsIChkYk5hbWUsIGRiKSA9PiB7XHJcbiAgICAgICAgICAgIGRiLnByb2Nlc3NNZXJnZVRvQXJyKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOWvvOWHuuaPj+i/sOaWh+S7tlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZXhwb3J0RHRzRmlsZSgpe1xyXG4gICAgICAgIGxldCB0ZXh0ID0gJyc7XHJcbiAgICAgICAgbGV0IG1vZHVsZU5hbWUgID0gdGhpcy5fYnVuZGxlTmFtZSArICdEYic7XHJcbiAgICAgICAgdGV4dCArPSAnLyoqIOmFjee9ruihqOaVsOaNrue7k+aehOaPj+i/sOaWh+S7tu+8jOacrOaWh+S7tueUseWvvOWHuuWZqOiHquWKqOeUn+aIkO+8jOivt+WLv+aJi+WKqOS/ruaUuSAqL1xcbic7XHJcbiAgICAgICAgdGV4dCArPSAnZGVjbGFyZSBtb2R1bGUgJyArIG1vZHVsZU5hbWUgKyAnIHtcXG4nO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRleHQgKz0gJyAgICBmdW5jdGlvbiBnZXREYXRhQmFzZShkYk5hbWU6IHN0cmluZyk6IGFueTtcXG4nO1xyXG5cclxuICAgICAgICBUb29scy5mb3JFYWNoTWFwKHRoaXMuZGJOYW1lXzJfZGIsIChkYk5hbWUsIGRiKSA9PiB7XHJcblxyXG4gICAgICAgICAgICB0ZXh0ICs9IGRiLmdlbmVyYXRlRGJkdHNUZXh0KG1vZHVsZU5hbWUpO1xyXG5cclxuICAgICAgICAgICAgdGV4dCArPSBkYi5nZW5lcmF0ZURiZHRzQ29uc3RzVGV4dChtb2R1bGVOYW1lKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGRiTmFtZSlcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2codGV4dClcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGV4dCArPSAnfSc7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRleHQpO1xyXG5cclxuICAgICAgICBsZXQgZHRzRmlsZVBhdGggPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgXCJkZWNsYXJlXCIsIHRoaXMuX2J1bmRsZU5hbWUgKyBcIkRiLmQudHNcIik7XHJcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGguZGlybmFtZShkdHNGaWxlUGF0aCkpKSB7XHJcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhwYXRoLmRpcm5hbWUoZHRzRmlsZVBhdGgpLHtyZWN1cnNpdmUgOiB0cnVlfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZHRzRmlsZVBhdGgsIHRleHQsIHsgZW5jb2Rpbmc6IFwidXRmLThcIiB9KTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog5a+85Ye65pWw5o2u5paH5Lu277yMYXNzZXTotYTmupBcclxuICAgICAqL1xyXG4gICAgcHVibGljIGFzeW5jIGV4cG9ydERhdGFGaWxlKCkge1xyXG4gICAgICAgIGxldCBqc29uRGF0YSA9IHt9O1xyXG5cclxuICAgICAgICBjb25zdCBleHBvcnRNb2RlID0gRGJCdW5kbGVDb25maWcuSW5zdGFuY2UuZXhwb3J0TW9kZTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIumFjee9ruihqOWvvOWHuuaooeW8jzogXCIsIGV4cG9ydE1vZGUpO1xyXG4gICAgICAgIGxldCBleHBvcnRDb3VudCA9IDA7XHJcbiAgICAgICAgVG9vbHMuZm9yRWFjaE1hcCh0aGlzLmRiTmFtZV8yX2RiLCAoZGJOYW1lLCBkYikgPT4ge1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIuW3suWvvOWHuumFjee9ruihqO+8mlwiLCBkYk5hbWUpXHJcbiAgICAgICAgICAgIGV4cG9ydENvdW50Kys7XHJcblxyXG4gICAgICAgICAgICBsZXQgZmllbGROYW1lXzJfdHlwZSA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRiLmZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBkYi5maWVsZHNbaV07XHJcbiAgICAgICAgICAgICAgICBmaWVsZE5hbWVfMl90eXBlW2ZpZWxkLm5hbWVdID0gZmllbGQudHlwZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGRiRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IGRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBydWxlOiBkYi5ydWxlLFxyXG4gICAgICAgICAgICAgICAgZGF0YXM6IGRiLmRhdGFzLFxyXG4gICAgICAgICAgICAgICAgZmllbGROYW1lXzJfdHlwZTogZmllbGROYW1lXzJfdHlwZSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAganNvbkRhdGFbZGJOYW1lXSA9IGRiRGF0YTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IGpzb25EYXRhRmlsZVBhdGggICAgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgXCJhc3NldHNcIiwgdGhpcy5fYnVuZGxlTmFtZSwgIFwiY2ZnXCIsIFwiZGIuanNvblwiKTtcclxuICAgICAgICBsZXQgYmluRGF0YUZpbGVQYXRoICAgICA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcImFzc2V0c1wiLCB0aGlzLl9idW5kbGVOYW1lLCAgXCJjZmdcIiwgXCJkYi5iaW5cIik7XHJcbiAgICAgICAgbGV0IGFzc2V0SnNvblBhdGggICAgICAgPSBcImRiOi8vYXNzZXRzL3Jlc291cmNlcy9jZmcvZGIuanNvblwiO1xyXG4gICAgICAgIGxldCBhc3NldEJpblBhdGggICAgICAgID0gXCJkYjovL2Fzc2V0cy9yZXNvdXJjZXMvY2ZnL2RiLmJpblwiO1xyXG4gICAgICAgIGlmKHRoaXMuX2J1bmRsZU5hbWUgIT0gJ3Jlc291cmNlcycpe1xyXG4gICAgICAgICAgICBqc29uRGF0YUZpbGVQYXRoICAgID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiYXNzZXRzXCIsIFwiYnVuZGxlc1wiLCB0aGlzLl9idW5kbGVOYW1lLCAgXCJjZmdcIiwgXCJkYi5qc29uXCIpO1xyXG4gICAgICAgICAgICBiaW5EYXRhRmlsZVBhdGggICAgID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiYXNzZXRzXCIsIFwiYnVuZGxlc1wiLCB0aGlzLl9idW5kbGVOYW1lLCAgXCJjZmdcIiwgXCJkYi5iaW5cIik7XHJcbiAgICAgICAgICAgIGFzc2V0SnNvblBhdGggICAgICAgPSBcImRiOi8vYXNzZXRzL2J1bmRsZXMvXCIgKyB0aGlzLl9idW5kbGVOYW1lICsgXCIvY2ZnL2RiLmpzb25cIjtcclxuICAgICAgICAgICAgYXNzZXRCaW5QYXRoICAgICAgICA9IFwiZGI6Ly9hc3NldHMvYnVuZGxlcy9cIiArIHRoaXMuX2J1bmRsZU5hbWUgKyBcIi9jZmcvZGIuYmluXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwYXRoLmRpcm5hbWUoanNvbkRhdGFGaWxlUGF0aCkpKSB7XHJcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhwYXRoLmRpcm5hbWUoanNvbkRhdGFGaWxlUGF0aCkse3JlY3Vyc2l2ZSA6IHRydWV9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoanNvbkRhdGFGaWxlUGF0aCkpIHtcclxuICAgICAgICAgICAgZnMucm1TeW5jKGpzb25EYXRhRmlsZVBhdGgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGJpbkRhdGFGaWxlUGF0aCkpIHtcclxuICAgICAgICAgICAgZnMucm1TeW5jKGJpbkRhdGFGaWxlUGF0aClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIOagvOW8j+WMllxyXG4gICAgICAgIHN3aXRjaCAoZXhwb3J0TW9kZSkge1xyXG4gICAgICAgICAgICBjYXNlIEV4cG9ydE1vZGUuUFJFVFRZX0pTT046IHtcclxuICAgICAgICAgICAgICAgIC8vIOe+juWMlmpzb25cclxuICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkoanNvbkRhdGEsIG51bGwsIDQpO1xyXG4gICAgICAgICAgICAgICAgLy9mcy53cml0ZUZpbGVTeW5jKGpzb25EYXRhRmlsZVBhdGgsIHRleHQsIHsgZW5jb2Rpbmc6IFwidXRmLThcIiB9KTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IEFzc2V0RGJVdGlscy5SZXF1ZXN0Q3JlYXRlTmV3QXNzZXQoYXNzZXRKc29uUGF0aCx0ZXh0IGFzIGFueSx0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjYXNlIEV4cG9ydE1vZGUuWklQX0pTT046IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHppcCA9IG5ldyBKU1ppcCgpO1xyXG4gICAgICAgICAgICAgICAgLy8g5Y6L57ypanNvblxyXG4gICAgICAgICAgICAgICAgbGV0IHRleHQgPSBKU09OLnN0cmluZ2lmeShqc29uRGF0YSk7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnN0IGNvbnRlbnQgPSBwYWtvLmRlZmxhdGUodGV4dCx7bGV2ZWw6MH0pO1xyXG4gICAgICAgICAgICAgICAgLy8g5paH5Lu25aS077yMJ3Bha28nXHJcbiAgICAgICAgICAgICAgICBsZXQgaGVhZENodW5rID0gdGhpcy5zdHJpbmdUb1VpbnQ4QXJyYXkoXCJ6aXAtanNvblwiKTtcclxuICAgICAgICAgICAgICAgIHppcC5maWxlKFwiZGF0YWJhc2VcIix0ZXh0KTtcclxuICAgICAgICAgICAgICAgIC8vIOWOi+e8qeWQjueahOaVsOaNrlxyXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHppcC5nZW5lcmF0ZUFzeW5jKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInVpbnQ4YXJyYXlcIiwvL25vZGVqc+eUqFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbXByZXNzaW9uOiBcIkRFRkxBVEVcIlxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuiOt+WPluWIsOmVv+W6pu+8mlwiLGNvbnRlbnQubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIC8vIOi+k+WHuueahOS6jOi/m+WItu+8jOaWh+S7tuWktCvljovnvKnlkI7nmoTmlbDmja5cclxuICAgICAgICAgICAgICAgIGF3YWl0IEFzc2V0RGJVdGlscy5SZXF1ZXN0Q3JlYXRlTmV3QXNzZXQoYXNzZXRCaW5QYXRoLGNvbnRlbnQgYXMgYW55LHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNhc2UgRXhwb3J0TW9kZS5KU09OOlxyXG4gICAgICAgICAgICBkZWZhdWx0OiB7XHJcbiAgICAgICAgICAgICAgICAvLyDpu5jorqTkvb/nlKjmoIflh4Zqc29uXHJcbiAgICAgICAgICAgICAgICBsZXQgdGV4dCA9IEpTT04uc3RyaW5naWZ5KGpzb25EYXRhKTtcclxuICAgICAgICAgICAgICAgIC8vZnMud3JpdGVGaWxlU3luYyhqc29uRGF0YUZpbGVQYXRoLCB0ZXh0LCB7IGVuY29kaW5nOiBcInV0Zi04XCIgfSk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBBc3NldERiVXRpbHMuUmVxdWVzdENyZWF0ZU5ld0Fzc2V0KGFzc2V0SnNvblBhdGgsdGV4dCBhcyBhbnksdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coVG9vbHMuZm9ybWF0KFwi5bey5a+85Ye66YWN572u6KGo77yaJWTkuKpcIiwgZXhwb3J0Q291bnQpKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOWvvOWHuiBfQXV0b0V4cG9ydERiLnRz77yIcmVzb3VyY2VzKVxyXG4gICAgICog5YW25LuWYnVuZGxl5Lya5a+85Ye65bGe5LqO6Ieq5bex55qEX0F1dG97YnVuZGxlTmFtZX1FeHBvcnREYi50cyxidW5kbGVOYW1l6aaW5a2X5q+N5aSn5YaZXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBleHBvcnRBdXRvRXhwb3J0RGJUcygpe1xyXG4gICAgICAgIGxldCBkaXIgPSAnJztcclxuICAgICAgICBpZih0aGlzLl9idW5kbGVOYW1lID09ICdyZXNvdXJjZXMnKXtcclxuICAgICAgICAgICAgZGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiYXNzZXRzXCIsIFwicmVzb3VyY2VzXCIsXCJzY3JpcHRzXCIsIFwiYXV0b1wiKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgZGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiYXNzZXRzXCIsIFwiYnVuZGxlc1wiLCB0aGlzLl9idW5kbGVOYW1lLCBcInNjcmlwdHNcIiwgXCJhdXRvXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGZpbGVQYXRoID0gJyc7XHJcbiAgICAgICAgbGV0IHRzRmlsZVBhdGggPSAnZGI6Ly9hc3NldHMvJztcclxuICAgICAgICBpZih0aGlzLl9idW5kbGVOYW1lID09ICdyZXNvdXJjZXMnKXtcclxuICAgICAgICAgICAgZmlsZVBhdGggPSBwYXRoLmpvaW4oZGlyLCBcIl9BdXRvUmVzb3VyY2VzRXhwb3J0RGIudHNcIik7XHJcbiAgICAgICAgICAgIHRzRmlsZVBhdGggKz0gXCJyZXNvdXJjZXMvc2NyaXB0cy9hdXRvL19BdXRvUmVzb3VyY2VzRXhwb3J0RGIudHNcIjtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgZmlsZVBhdGggPSBwYXRoLmpvaW4oZGlyLCBcIl9BdXRvXCIgKyBUb29scy51cHBlckZpcnN0TGV0dGVyKHRoaXMuX2J1bmRsZU5hbWUpICsgXCJFeHBvcnREYi50c1wiKTtcclxuICAgICAgICAgICAgdHNGaWxlUGF0aCArPSBcImJ1bmRsZXMvXCIgKyB0aGlzLl9idW5kbGVOYW1lICsgXCIvc2NyaXB0cy9hdXRvL19BdXRvXCIgKyBUb29scy51cHBlckZpcnN0TGV0dGVyKHRoaXMuX2J1bmRsZU5hbWUpICsgXCJFeHBvcnREYi50c1wiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgdGV4dCA9ICcnO1xyXG4gICAgICAgIHRleHQgKz0gXCJpbXBvcnQgRGF0YUJhc2UgZnJvbSAnZGI6Ly9hc3NldHMvcmVzb3VyY2VzL3NjcmlwdHMvY29yZS9zdHJ1Y3QvZGF0YS1iYXNlJztcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiaW1wb3J0IERiTWFuYWdlciBmcm9tICdkYjovL2Fzc2V0cy9yZXNvdXJjZXMvc2NyaXB0cy9jb3JlL21hbmFnZXIvZGItbWFuYWdlcic7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIlxcblwiXHJcbiAgICAgICAgdGV4dCArPSBcIi8qKlxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgKiDmraTmlofku7bnlLFkYkV4cG9ydGVy6ISa5pys6Ieq5Yqo55Sf5oiQ77yB6K+35Yu/5omL5Yqo5L+u5pS55pys5paH5Lu277yBXFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIiAqIFxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgKiDlsIHoo4XphY3nva7ooajnmoTlkITpoblnZXR0ZXLlh73mlbBcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICovXFxuXCI7ICAgIFxyXG5cclxuICAgICAgICBsZXQgbW9kdWxlTmFtZSA9IHRoaXMuX2J1bmRsZU5hbWUgKyBcIkRiXCI7XHJcbiAgICAgICAgbGV0IGluaXRGdW5jTmFtZSA9IFwiX0F1dG9cIiArIFRvb2xzLnVwcGVyRmlyc3RMZXR0ZXIodGhpcy5fYnVuZGxlTmFtZSkgKyBcIkV4cG9ydERiX2luaXRcIjtcclxuXHJcbiAgICAgICAgdGV4dCArPSBcImxldCBcIiArIG1vZHVsZU5hbWUgKyBcIiA9IHt9IGFzIGFueTtcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwid2luZG93WydcIiArIG1vZHVsZU5hbWUgKyBcIiddID0gXCIgKyBtb2R1bGVOYW1lICsgXCI7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIlxcblwiO1xyXG5cclxuICAgICAgICAvLyDlhYjmlL7nva5rZXlzXHJcbiAgICAgICAgVG9vbHMuZm9yRWFjaE1hcCh0aGlzLmRiTmFtZV8yX2RiLCAoZGJOYW1lLCBkYikgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygn5a+85Ye66YWN572u6KGo5b6Xa2V5c++8micsZGJOYW1lKTtcclxuICAgICAgICAgICAgbGV0IGtleXNUZXh0ID0gZGIuZ2VuZXJhdGVBdXRvRXhwb3J0RGJUc0NvbnN0c1RleHQobW9kdWxlTmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChrZXlzVGV4dCkge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBrZXlzVGV4dCArIFwiXFxuXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0ZXh0ICs9IFwiXFxuXCI7XHJcblxyXG4gICAgICAgIC8v5pS+5Yid5aeL5YyW5Ye95pWwXHJcbiAgICAgICAgdGV4dCArPSBcImV4cG9ydCBmdW5jdGlvbiBcIiArIGluaXRGdW5jTmFtZSArIFwiKCl7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIiAgICBcIiArIG1vZHVsZU5hbWUgKyBcIi5nZXREYXRhQmFzZSA9IChkYk5hbWU6IHN0cmluZyk6IERhdGFCYXNlID0+IHsgcmV0dXJuIERiTWFuYWdlci5nZXREYXRhQmFzZShkYk5hbWUpOyB9XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIlxcblwiO1xyXG4gICAgICAgIC8vIOWGjeaUvue9rmdldHRlcnNcclxuICAgICAgICBUb29scy5mb3JFYWNoTWFwKHRoaXMuZGJOYW1lXzJfZGIsIChkYk5hbWUsIGRiKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBnZXR0ZXJzVGV4dCA9IGRiLmdlbmVyYXRlQXV0b0V4cG9ydERiVHNHZXR0ZXJzVGV4dChtb2R1bGVOYW1lKTtcclxuICAgICAgICAgICAgdGV4dCArPSBnZXR0ZXJzVGV4dCArIFwiXFxuXCI7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGV4dCArPSBcIn1cXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiXFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIi8qKlxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgKiDlu7bov58xbXPlkI7oh6rliqjms6jlhoxcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICogXFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIiAqL1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCJzZXRUaW1lb3V0KCgpID0+IHtcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICAgIGxldCBiRGlzYWJsZUF1dG9Jbml0ID0gISF3aW5kb3dbJ19BdXRvRXhwb3J0RGJfYkRpc2FibGVBdXRvSW5pdCddO1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgICAgaWYgKCFiRGlzYWJsZUF1dG9Jbml0KSB7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIiAgICAgICAgLy8gY29uc29sZS5sb2coJ19BdXRvRXhwb3J0RGIudHMg5YW85a655Luj56CB5ZCv5Yqo77yM5Yid5aeL5YyW5omA5pyJZ2V0dGVy5o6l5Y+jJyk7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIiAgICAgICAgXCIgKyBpbml0RnVuY05hbWUgKyBcIigpO1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgICAgfVxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCJ9LCAxKTtcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiXFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIndpbmRvd1snXCIgKyBpbml0RnVuY05hbWUgKyBcIiddID0gXCIgKyBpbml0RnVuY05hbWUgKyBcIjtcXG5cIjtcclxuXHJcbiAgICAgICAgIC8vIOmihOWFiOajgOafpeWGheWuueaYr+WQpuaUueWPmFxyXG4gICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpIHtcclxuICAgICAgICAgICAgbGV0IG9yaWdpblRleHQgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsIHsgZW5jb2Rpbmc6IFwidXRmLThcIiB9KTtcclxuICAgICAgICAgICAgaWYgKG9yaWdpblRleHQgPT0gdGV4dCkge1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCLmlofku7bmnKrlj5HnlJ/mlLnliqjvvIzkuI3pnIDopoHph43mlrDlhpnlhaXvvJpcIiwgZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8v55Sf5oiQYXV0b0V4cG9ydERiLnRz5paH5Lu2XHJcbiAgICAgICAgQXNzZXREYlV0aWxzLlJlcXVlc3RDcmVhdGVOZXdBc3NldCh0c0ZpbGVQYXRoLHRleHQsdHJ1ZSk7XHJcbiAgICAgICAgY29uc29sZS53YXJuKCflr7zlh7rphY3nva7ooahkLnRz5o+P6L+w5paH5Lu277yaJyx0c0ZpbGVQYXRoKTtcclxuICAgIH0gICBcclxuXHJcbiAgICBwdWJsaWMgZXhwb3J0STE4TkRlZmluZUZpbGUoKXtcclxuICAgICAgICBjb25zdCBkYkJhc2UgPSB0aGlzLmdldERhdGFiYXNlKCdpMThuX2xhbmd1YWdlX2NvbmZpZ19kYicpO1xyXG4gICAgICAgIGlmKCFkYkJhc2Upe1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHRleHQgID0gZGJCYXNlLmdlbmVyYXRlSTE4bkVudW1UZXh0KCk7XHJcbiAgICAgICAgaWYoIXRleHQgfHwgdGV4dCA9PSBcIlwiKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB1cmwgPSBcImRiOi8vYXNzZXRzL3Jlc291cmNlcy9zY3JpcHRzL2F1dG8vaTE4bi1kZWZpbmUudHNcIjtcclxuXHJcbiAgICAgICAgQXNzZXREYlV0aWxzLlJlcXVlc3RDcmVhdGVOZXdBc3NldCh1cmwsdGV4dCx0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOagueaNrumFjee9ruihqOeahOWQjeWtl+iOt+WPluS4gOS4qumFjee9ruihqOeahOaVsOaNru+8jOWPr+iDvei/lOWbnm51bGxcclxuICAgICAqIEBwYXJhbSBkYk5hbWUgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXREYXRhYmFzZShkYk5hbWUgOiBzdHJpbmcpIDogRGJCdW5kbGVEYXRhQmFzZSB8IG51bGx7XHJcbiAgICAgICAgaWYoIXRoaXMuZGJOYW1lXzJfZGJbZGJOYW1lXSl7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5kYk5hbWVfMl9kYltkYk5hbWVdO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RyaW5nVG9VaW50OEFycmF5KHN0cikge1xyXG4gICAgICAgIHZhciBhcnIgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IHN0ci5sZW5ndGg7IGkgPCBqOyArK2kpIHtcclxuICAgICAgICAgICAgYXJyLnB1c2goc3RyLmNoYXJDb2RlQXQoaSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdG1wVWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KGFycik7XHJcbiAgICAgICAgcmV0dXJuIHRtcFVpbnQ4QXJyYXlcclxuICAgIH1cclxufSJdfQ==