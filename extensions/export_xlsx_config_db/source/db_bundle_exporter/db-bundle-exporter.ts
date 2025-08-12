import path from "path";
import { DbBundleDataBase } from "./db-bundle-data-base";
import fs from 'fs-extra';
import Tools from "../utils/tools";
import { DbBundleConfig, ExportMode } from "./db-bundle-config";
import { AssetDbUtils } from "../utils/asset-db-utils";
import JSZip from "jszip";
import { DbBundleDatas } from "./db-bundle-datas";
/**
 * 对某一个指定名字的bundle的配置表进行导出
 */
export default class DbBundleExporter{
    /**
     * 导出指定名字的bundle的配置表
     */
    private _bundleName : string;

    public get bundleName(){
        return this._bundleName;
    }
    /**
     * 配置表的文件夹路径
     */
    private srcDbRootDir : string;
    /**
     * 预览json文件的文件夹路径
     */
    private previewDbDir : string;
    /**
     * 解析厚得配置表数据
     */
    public dbName_2_db : {[name : string] : DbBundleDataBase} = {};

    constructor(bundleName : string){
        this._bundleName    = bundleName;
        this.srcDbRootDir = path.join(Editor.Project.path, "_config", bundleName);
        this.previewDbDir = path.join(Editor.Project.path, "_config", bundleName,'_preview_db');
    }

    public async exportBundle(){
        Tools.foreachDir(this.srcDbRootDir, (filePath : string) => {
            if(DbBundleDatas.Instance.loadedDbFilePaths[filePath]){
                return false;
            }
            //如果filePath不是以xlsx结尾，返回
            if(!filePath.endsWith(".xlsx")){
                return false;
            }
            let dbs : DbBundleDataBase[] = [];
            DbBundleDataBase.loadFromXlsxAsync(filePath,(_dbs)=>{
                dbs = _dbs;
                for(let i = 0;i<dbs.length;i++){
                    const db = dbs[i];
                    DbBundleDatas.Instance.dbFilePath_2_dbNameMap[filePath] = (DbBundleDatas.Instance.dbFilePath_2_dbNameMap[filePath] || {});
                    DbBundleDatas.Instance.dbFilePath_2_dbNameMap[filePath][db.name] = true;

                    DbBundleDatas.Instance.dbNames_2_dbFilePathMap[db.name] = (DbBundleDatas.Instance.dbNames_2_dbFilePathMap[db.name] || {});
                    DbBundleDatas.Instance.dbNames_2_dbFilePathMap[db.name][filePath] = true;

                    if(!db.canExport()){
                        console.warn("配置表不可导出：",db.name);
                        for (let j = 0; j < db.warnLog.length; j++) {
                            const text = db.warnLog[j];
                            console.warn(text);
                        }
                        continue;
                    }
                    let oldDb = this.dbName_2_db[db.name];
                    if(!oldDb){
                        this.dbName_2_db[db.name]   = db;
                        DbBundleDatas.Instance.dbName_2_db[db.name] = db;
                    }else{
                        let msg = oldDb.canMerge(db);
                        if (msg) {
                            console.error(Tools.format("配置表[%s]合并失败：file1=[%s] file2=[%s] 失败理由=[%s]", db.name, oldDb.originFilePath, db.originFilePath, msg));
                            continue;
                        } else {
                            // 合并数据
                            oldDb.mergeDb(db);
                            DbBundleDatas.Instance.dbName_2_db[oldDb.name]  = oldDb;
                        }
                    }
                }
                DbBundleDatas.Instance.loadedDbFilePaths[filePath]  = true;
            });
        });
    }

    /**
     * 导出当前bundle的json文件
     */
    public exportPreviewDb(){
        let count   = 0;
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
        console.log(Tools.format("预览配置表preivew_db导出完毕，已导出%d个json文件。", count));
    }


    public mergeDbField(){
        Tools.forEachMap(this.dbName_2_db, (dbName, db) => {
            db.processMergeToArr();
        });
    }
    /**
     * 导出描述文件
     */
    public exportDtsFile(){
        let text = '';
        let moduleName  = this._bundleName + 'Db';
        text += '/** 配置表数据结构描述文件，本文件由导出器自动生成，请勿手动修改 */\n';
        text += 'declare module ' + moduleName + ' {\n';
        
        text += '    function getDataBase(dbName: string): any;\n';

        Tools.forEachMap(this.dbName_2_db, (dbName, db) => {

            text += db.generateDbdtsText(moduleName);

            text += db.generateDbdtsConstsText(moduleName);

            // console.log(dbName)
            // console.log(text)
        });

        text += '}';

        // console.log(text);

        let dtsFilePath = path.join(Editor.Project.path, "declare", this._bundleName + "Db.d.ts");
        if (!fs.existsSync(path.dirname(dtsFilePath))) {
            fs.mkdirSync(path.dirname(dtsFilePath),{recursive : true});
        }
        fs.writeFileSync(dtsFilePath, text, { encoding: "utf-8" });
    }
    /**
     * 导出数据文件，asset资源
     */
    public async exportDataFile() {
        let jsonData = {};

        const exportMode = DbBundleConfig.Instance.exportMode;
        console.log("配置表导出模式: ", exportMode);
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

        let jsonDataFilePath    = path.join(Editor.Project.path, "assets", this._bundleName,  "cfg", "db.json");
        let binDataFilePath     = path.join(Editor.Project.path, "assets", this._bundleName,  "cfg", "db.bin");
        let assetJsonPath       = "db://assets/resources/cfg/db.json";
        let assetBinPath        = "db://assets/resources/cfg/db.bin";
        if(this._bundleName != 'resources'){
            jsonDataFilePath    = path.join(Editor.Project.path, "assets", "bundles", this._bundleName,  "cfg", "db.json");
            binDataFilePath     = path.join(Editor.Project.path, "assets", "bundles", this._bundleName,  "cfg", "db.bin");
            assetJsonPath       = "db://assets/bundles/" + this._bundleName + "/cfg/db.json";
            assetBinPath        = "db://assets/bundles/" + this._bundleName + "/cfg/db.bin";
        }
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
        switch (exportMode) {
            case ExportMode.PRETTY_JSON: {
                // 美化json
                let text = JSON.stringify(jsonData, null, 4);
                //fs.writeFileSync(jsonDataFilePath, text, { encoding: "utf-8" });
                await AssetDbUtils.RequestCreateNewAsset(assetJsonPath,text as any,true);
                break;
            }

            case ExportMode.ZIP_JSON: {
                const zip = new JSZip();
                // 压缩json
                let text = JSON.stringify(jsonData);
                //const content = pako.deflate(text,{level:0});
                // 文件头，'pako'
                let headChunk = this.stringToUint8Array("zip-json");
                zip.file("database",text);
                // 压缩后的数据
                const content = await zip.generateAsync({
                    type: "uint8array",//nodejs用
                    compression: "DEFLATE"
                });
                console.log("获取到长度：",content.length);
                // 输出的二进制，文件头+压缩后的数据
                await AssetDbUtils.RequestCreateNewAsset(assetBinPath,content as any,true);
                break;
            }

            case ExportMode.JSON:
            default: {
                // 默认使用标准json
                let text = JSON.stringify(jsonData);
                //fs.writeFileSync(jsonDataFilePath, text, { encoding: "utf-8" });
                await AssetDbUtils.RequestCreateNewAsset(assetJsonPath,text as any,true);
                break;
            }
        }

        console.log(Tools.format("已导出配置表：%d个", exportCount));
    }

    /**
     * 导出 _AutoExportDb.ts（resources)
     * 其他bundle会导出属于自己的_Auto{bundleName}ExportDb.ts,bundleName首字母大写
     */
    public exportAutoExportDbTs(){
        let dir = '';
        if(this._bundleName == 'resources'){
            dir = path.join(Editor.Project.path, "assets", "resources","scripts", "auto");
        }else{
            dir = path.join(Editor.Project.path, "assets", "bundles", this._bundleName, "scripts", "auto");
        }

        let filePath = '';
        let tsFilePath = 'db://assets/';
        if(this._bundleName == 'resources'){
            filePath = path.join(dir, "_AutoResourcesExportDb.ts");
            tsFilePath += "resources/scripts/auto/_AutoResourcesExportDb.ts";
        }else{
            filePath = path.join(dir, "_Auto" + Tools.upperFirstLetter(this._bundleName) + "ExportDb.ts");
            tsFilePath += "bundles/" + this._bundleName + "/scripts/auto/_Auto" + Tools.upperFirstLetter(this._bundleName) + "ExportDb.ts";
        }
        let text = '';
        text += "import DataBase from 'db://assets/resources/scripts/core/struct/data-base';\n";
        text += "import DbManager from 'db://assets/resources/scripts/core/manager/db-manager';\n";
        text += "\n"
        text += "/**\n";
        text += " * 此文件由dbExporter脚本自动生成！请勿手动修改本文件！\n";
        text += " * \n";
        text += " * 封装配置表的各项getter函数\n";
        text += " */\n";    

        let moduleName = this._bundleName + "Db";
        let initFuncName = "_Auto" + Tools.upperFirstLetter(this._bundleName) + "ExportDb_init";

        text += "let " + moduleName + " = {} as any;\n";
        text += "window['" + moduleName + "'] = " + moduleName + ";\n";
        text += "\n";

        // 先放置keys
        Tools.forEachMap(this.dbName_2_db, (dbName, db) => {
            console.log('导出配置表得keys：',dbName);
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
        Tools.forEachMap(this.dbName_2_db, (dbName, db) => {
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
         if (fs.existsSync(filePath)) {
            let originText = fs.readFileSync(filePath, { encoding: "utf-8" });
            if (originText == text) {
                // console.log("文件未发生改动，不需要重新写入：", filePath);
                return;
            }
        }
        //生成autoExportDb.ts文件
        AssetDbUtils.RequestCreateNewAsset(tsFilePath,text,true);
        console.warn('导出配置表d.ts描述文件：',tsFilePath);
    }   

    public exportI18NDefineFile(){
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

    /**
     * 根据配置表的名字获取一个配置表的数据，可能返回null
     * @param dbName 
     */
    public getDatabase(dbName : string) : DbBundleDataBase | null{
        if(!this.dbName_2_db[dbName]){
            return null;
        }
        return this.dbName_2_db[dbName];
    }

    private stringToUint8Array(str) {
        var arr = [];
        for (var i = 0, j = str.length; i < j; ++i) {
            arr.push(str.charCodeAt(i));
        }
        var tmpUint8Array = new Uint8Array(arr);
        return tmpUint8Array
    }
}