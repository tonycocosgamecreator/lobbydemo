
import path from "path";
import fs from "fs-extra";
import json5 from "json5";
import { TaskManager } from "../utils/task-manager";
import Tools from "../utils/tools";
import DataBase from "./data-base";
import { AssetDbUtils } from "../utils/asset-db-utils";
import JSZip from "jszip";
import pako from "pako";
export default class DbExporter {
    static prjRootDir;

    /**
     * 配置表数据源根目录
     */
    static srcDbRootDir;

    /**
     * 预览数据库目录
     */
    static previewDbDir;

    /**
     * 导出模式
     */
    static exportMode = "json";

    /**
     * MERGE_FLD_NAME 将多个字段合并为数组功能，是否保留空白数据。
     */
    static mergeFieldToArrayKeepEmptyValue = false;

    /**
     * 解析后的配置表数据
     */
    static dbName_2_db : {[name : string] : DataBase} = {};

    static dbFilePath_2_dbNameMap : {[key : string] : {[dbName : string] : boolean}} = {};
    static dbNames_2_dbFilePathMap : {[dbName : string] : {[fileName : string] : boolean}} = {};

    /**
     * 已加载过的配置表
     */
    static loadedDbFilePaths : {[key : string] : boolean}   = {};
    static dbFilePath_2_dirty : {[key : string] : boolean}  = {};

    static init(prjRootDir, fOnCompleted) {
        this.dbName_2_db                = {};
        this.dbFilePath_2_dbNameMap     = {};
        this.dbNames_2_dbFilePathMap    = {};
        this.loadedDbFilePaths          = {};
        this.dbFilePath_2_dirty         = {};
        this.prjRootDir = prjRootDir;

        // console.log("Exporter.init");
        // console.log("prjRootDir:", prjRootDir);

        this.srcDbRootDir = path.join(prjRootDir, "_config");
        // console.log("srcDbRootDir:", this.srcDbRootDir);

        let tm = new TaskManager("Exporter.init", false);

        tm.addCall((fNext) => {
            let dbConfigJson5FilePath = path.join(this.srcDbRootDir, "db.config.json5");
            if (fs.existsSync(dbConfigJson5FilePath)) {
                try {
                    let text = fs.readFileSync(dbConfigJson5FilePath, { encoding: "utf-8" });
                    let data = json5.parse(text);
                    if (data) {
                        // console.log("检测到db.config.json5:", dbConfigJson5FilePath);
                        if (data.exportMode) {
                            this.exportMode = data.exportMode;
                        }

                        // if (data.mergeFieldToArrayKeepEmptyValue == true) {
                        //     this.mergeFieldToArrayKeepEmptyValue = true;
                        // }
                    }
                } catch (error) {
                    console.log("[警告] db.config.json5 解析失败", error);
                }
            }

            fNext();
        });

        if (!this.mergeFieldToArrayKeepEmptyValue) {
            console.log("");
            console.log("[提示] db.config.json5 中未配置 mergeFieldToArrayKeepEmptyValue");
            console.log("配置表导出器在处理MERGE_FLD_NAME功能时，会默认忽略所有的空白数据，在使用中会出现歧义：");
            console.log("如以下案例：")
            console.log("MERGE_FLD_NAME  strs    strs    strs");
            console.log("FLD_NAME        str1    str2    str3");
            console.log("DATA            a       b       c                  strs=['a', 'b', 'c']");
            console.log("DATA            a               c                  strs=['a', 'c']");
            console.log("DATA            a       b                          strs=['a', 'b'");
            console.log("")
            console.log("第二条数据中，按照预期c应该是属于第三个字段，实际导出的strs中，strs[1]为'c'不符合预期");
            console.log("修复后，输出的strs依次为：['a', 'b', 'c'], ['a', '', 'c'], ['a', 'b', '']")
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
            this.previewDbDir = path.join(this.srcDbRootDir, "_preview_db");
            // console.log("previewDbDir:", this.previewDbDir);

            if (!this.dbName_2_db) {
                this.dbName_2_db = {};
            } else {
                // 清理dirty的配置表
                Tools.forEachMap(this.dbFilePath_2_dirty, (dbFilePath) => {
                    let dbNameMap = this.dbFilePath_2_dbNameMap[dbFilePath];
                    Tools.forEachMap(dbNameMap, (dbName) => {
                        delete this.dbName_2_db[dbName];

                        // 清理所有关联的配置表缓存
                        let referenceFilePathMap = this.dbNames_2_dbFilePathMap[dbName];
                        Tools.forEachMap(referenceFilePathMap, (k, v) => {
                            delete this.loadedDbFilePaths[k];
                        });
                    });
                });
            }

            fNext();
        });

        tm.addCall((fNext) => {
            let subTm = new TaskManager();

            Tools.foreachDir(this.srcDbRootDir, (filePath : string) => {
                if (DbExporter.loadedDbFilePaths[filePath]) return false;



                if (filePath.endsWith(".xlsx") || filePath.endsWith(".xls")) {
                    // 打点统计映射表不导出
                    if (filePath.endsWith("打点统计映射.xlsx")) return false;

                    let t0 = Date.now();

                    // excel配置文件
                    let dbs = [];

                    subTm.addCall((subTm_fNext) => {
                        DataBase.loadFromXlsxAsync(filePath, (_dbs) => {
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
                                            console.error(Tools.format("配置表[%s]合并失败：file1=[%s] file2=[%s] 失败理由=[%s]", db.name, oldDb.originFilePath, db.originFilePath, msg));
                                            continue;
                                        } else {
                                            // 合并数据
                                            oldDb.mergeDb(db);
                                        }
                                    } else {
                                        // 保存新db
                                        this.dbName_2_db[db.name] = db;
                                    }
                                } else {
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

                } else if (filePath.endsWith(".csv")) {
                    // csv配置文件
                    console.log("TODO 暂未实现csv加载功能，已忽略当前文件：", filePath);
                }

            });


            subTm.start(fNext);
        });

        tm.addCall((fNext) => {
            Tools.forEachMap(this.dbName_2_db, (dbName, db) => {
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
        if (!fs.existsSync(this.previewDbDir)) {
            fs.mkdirSync(this.previewDbDir,{recursive : true});
        }

        // 2. 清理_raw_db目录
        Tools.foreachDir(this.previewDbDir, (filePath) => {
            fs.unlinkSync(filePath)
        });

        // 3. 生成原始配置表
        Tools.forEachMap(this.dbName_2_db, (dbName, db) => {
            let text = db.generatePreviewDbJsonText();
            let filePath = path.join(this.previewDbDir, dbName + ".json");
            fs.writeFileSync(filePath, text, { encoding: "utf-8" });

            count++;
        });

        // console.log(Tools.format("预览配置表preivew_db导出完毕，已导出%d个json文件。", count));
    }

    static mergeDbField() {
        Tools.forEachMap(this.dbName_2_db, (dbName, db) => {
            db.processMergeToArr();
        });
    }

    static exportDtsFile() {
        let text = '';

        text += '/** 配置表数据结构描述文件，本文件由导出器自动生成，请勿手动修改 */\n';
        text += 'declare module db {\n';

        text += '    function getDataBase(dbName: string): any;\n';

        Tools.forEachMap(this.dbName_2_db, (dbName, db) => {

            text += db.generateDbdtsText();

            text += db.generateDbdtsConstsText();

            // console.log(dbName)
            // console.log(text)
        });

        text += '}';

        // console.log(text);

        let dtsFilePath = path.join(this.prjRootDir, "declare", "db.d.ts");
        if (!fs.existsSync(path.dirname(dtsFilePath))) {
            fs.mkdirSync(path.dirname(dtsFilePath),{recursive : true});
        }
        fs.writeFileSync(dtsFilePath, text, { encoding: "utf-8" });
    }

    static stringToUint8Array(str) {
        var arr = [];
        for (var i = 0, j = str.length; i < j; ++i) {
            arr.push(str.charCodeAt(i));
        }
        var tmpUint8Array = new Uint8Array(arr);
        return tmpUint8Array
    }

    static async exportDataFile() {
        let jsonData = {};


        console.log("配置表导出模式: ", this.exportMode);
        let exportCount = 0;
        Tools.forEachMap(this.dbName_2_db, (dbName, db) => {
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

        let jsonDataFilePath = path.join(this.prjRootDir, "assets", "resources",  "cfg", "db.json");
        let binDataFilePath = path.join(this.prjRootDir, "assets", "resources",  "cfg", "db.bin");
        if (!fs.existsSync(path.dirname(jsonDataFilePath))) {
            fs.mkdirSync(path.dirname(jsonDataFilePath),{recursive : true});
        }
        if (fs.existsSync(jsonDataFilePath)) {
            fs.rmSync(jsonDataFilePath)
        }
        if (fs.existsSync(binDataFilePath)) {
            fs.rmSync(binDataFilePath)
        }

        // 格式化
        switch (this.exportMode) {
            case "pretty-json": {
                // 美化json
                let text = JSON.stringify(jsonData, null, 4);
                //fs.writeFileSync(jsonDataFilePath, text, { encoding: "utf-8" });
                await AssetDbUtils.RequestCreateNewAsset("db://assets/resources/cfg/db.json",text as any,true);
                break;
            }

            case "zip-json": {
                //const zip = new JSZip();
                // 压缩json
                let text = JSON.stringify(jsonData);
                const content = pako.deflate(text, { level:0 });
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
                console.log("获取到长度：",content.length);
                // 输出的二进制，文件头+压缩后的数据
                await AssetDbUtils.RequestCreateNewAsset("db://assets/resources/cfg/db.bin",content as any,true);
                break;
            }

            case "json":
            default: {
                // 默认使用标准json
                let text = JSON.stringify(jsonData);
                //fs.writeFileSync(jsonDataFilePath, text, { encoding: "utf-8" });
                await AssetDbUtils.RequestCreateNewAsset("db://assets/resources/cfg/db.json",text as any,true);
                break;
            }
        }

        console.log(Tools.format("已导出配置表：%d个", exportCount));
    }

    static exportLibraryFile() {
        // 热更新library
        // console.log("exportLibraryFile");

        let libraryRootDir = path.join(this.prjRootDir, "library");
        if (!fs.existsSync(libraryRootDir)) return;

        try {
            // 区分json模式和bin模式
            if (this.exportMode == "zip-json") {
                // console.log("bin模式")
                let metaFilePath = path.join(this.prjRootDir, "assets", "resources", "cfg", "db.bin.meta");
                if (!fs.existsSync(metaFilePath)) {
                    // console.log("meta文件未找到，无法热更新library", metaFilePath);
                    return;
                }
                let metaText = fs.readFileSync(metaFilePath, { encoding: "utf-8" });
                let metaData = JSON.parse(metaText);
                // console.log("metaData", metaData)
                let uuid = metaData.uuid;
                // console.log('uuid', uuid);

                let resourcesBinFilePath = path.join(this.prjRootDir, "assets", "resources", "cfg", "db.bin");
                let libraryBinFilePath = path.join(this.prjRootDir, "library", uuid.substring(0, 2), uuid + ".bin");


                // console.log('resourcesBinFilePath', resourcesBinFilePath);
                // console.log('libraryBinFilePath', libraryBinFilePath);

                if (!fs.existsSync(path.dirname(libraryBinFilePath))) {
                    // library目录未找到，不需要进行热更新
                    return;
                }

                if (fs.existsSync(libraryBinFilePath)) {
                    fs.unlinkSync(libraryBinFilePath);
                }

                fs.copyFileSync(resourcesBinFilePath, libraryBinFilePath);

            } else {
                // console.log("json模式")
                let metaFilePath = path.join(this.prjRootDir, "assets", "resources", "cfg", "db.json.meta");
                if (!fs.existsSync(metaFilePath)) {
                    // console.log("meta文件未找到，无法热更新library", metaFilePath);
                    return;
                }
                let metaText = fs.readFileSync(metaFilePath, { encoding: "utf-8" });
                let metaData = JSON.parse(metaText);
                // console.log("metaData", metaData)
                let uuid = metaData.uuid;
                // console.log('uuid', uuid);

                let resourcesJsonFilePath = path.join(this.prjRootDir, "assets", "resources","cfg", "db.json");
                let libraryJsonAssetsFilePath = path.join(this.prjRootDir, "library", uuid.substring(0, 2), uuid + ".json");
                // console.log('resourcesJsonFilePath', resourcesJsonFilePath);
                // console.log('libraryJsonAssetsFilePath', libraryJsonAssetsFilePath);

                if (!fs.existsSync(libraryJsonAssetsFilePath)) {
                    // console.log("jsonAssets文件未找到，无法热更新library", libraryJsonAssetsFilePath);
                    return;
                }

                let jsonAssetsText = fs.readFileSync(libraryJsonAssetsFilePath, { encoding: "utf-8" });
                let jsonAssetsData = JSON.parse(jsonAssetsText);
                // console.log(jsonAssetsData);

                let jsonText = fs.readFileSync(resourcesJsonFilePath);
                let jsonData = JSON.parse(jsonText.toString());

                jsonAssetsData.json = jsonData;

                jsonAssetsText = JSON.stringify(jsonAssetsData, null, 4);
                fs.writeFileSync(libraryJsonAssetsFilePath, jsonAssetsText, { encoding: "utf-8" });
            }

            // console.log("library热更新成功")

        } catch (error) {
            console.log("library热更新失败：", error);
        }

    }

    static exportAutoExportDbTs() {

        const dir   = path.join(this.prjRootDir, "assets", "resources","scripts", "auto");
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir,{recursive : true});
        }

        let filePath = path.join(dir,"_AutoExportDb.ts");

        let text = "";

        text += "import DataBase from '../core/struct/data-base';\n";
        text += "import DbManager from '../core/manager/db-manager';\n";
        text += "\n"
        text += "/**\n";
        text += " * 此文件由dbExporter脚本自动生成！请勿手动修改本文件！\n";
        text += " * \n";
        text += " * 封装配置表的各项getter函数\n";
        text += " */\n";

        text += 'let db = {} as any;\n';
        text += "window['db'] = db;\n";
        text += "\n"

        // 先放置keys
        Tools.forEachMap(this.dbName_2_db, (dbName, db) => {
            console.log('导出配置表得keys：',dbName);
            let keysText = db.generateAutoExportDbTsConstsText();
            if (keysText) {
                text += keysText + "\n";
            }
        });

        text += "\n";
        text += 'export function _AutoExportDb_init() {\n';

        text += "    db.getDataBase = (dbName: string): DataBase => { return DbManager.getDataBase(dbName); }\n"
        text += "\n"

        // 再放置getters
        Tools.forEachMap(this.dbName_2_db, (dbName, db) => {
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
        if (fs.existsSync(filePath)) {
            let originText = fs.readFileSync(filePath, { encoding: "utf-8" });
            if (originText == text) {
                // console.log("文件未发生改动，不需要重新写入：", filePath);
                return;
            }
        }
        const url = "db://assets/resources/scripts/auto/_AutoExportDb.ts";

        AssetDbUtils.RequestCreateNewAsset(url,text,true);
    }

    /**
     * 根据配置表的名字获取一个配置表的数据，可能返回null
     * @param dbName 
     */
    public static getDatabase(dbName : string) : DataBase | null{
        if(!this.dbName_2_db[dbName]){
            return null;
        }
        return this.dbName_2_db[dbName];
    }

    /**
     * 导出i18n配置
     */
    public static async exportI18NDefineFile(){
        const dbBase = this.getDatabase('i18n_language_config_db');
        if(!dbBase){
            return;
        }
        const text  = dbBase.generateI18nEnumText();
        if(!text || text == ""){
            return;
        }
        const url = "db://assets/resources/scripts/auto/i18n-define.ts";

        AssetDbUtils.RequestCreateNewAsset(url,text,true);
    }
}

