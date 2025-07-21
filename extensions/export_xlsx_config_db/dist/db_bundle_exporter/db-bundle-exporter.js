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
const pako_1 = __importDefault(require("pako"));
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
        text += 'declare namespace ' + moduleName + ' {\n';
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
                //const zip = new JSZip();
                // 压缩json
                let text = JSON.stringify(jsonData);
                const content = pako_1.default.deflate(text, { level: 0 });
                // 文件头，'pako'
                // let headChunk = this.stringToUint8Array("zip-json");
                // zip.file("database",text);
                // // 压缩后的数据
                // const content = await zip.generateAsync({
                //     type: "uint8array",//nodejs用
                //     compression: "DEFLATE"
                // });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGItYnVuZGxlLWV4cG9ydGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2RiX2J1bmRsZV9leHBvcnRlci9kYi1idW5kbGUtZXhwb3J0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsK0RBQXlEO0FBQ3pELHdEQUEwQjtBQUMxQiwyREFBbUM7QUFDbkMseURBQWdFO0FBQ2hFLDREQUF1RDtBQUV2RCxnREFBd0I7QUFDeEIsdURBQWtEO0FBQ2xEOztHQUVHO0FBQ0gsTUFBcUIsZ0JBQWdCO0lBTWpDLElBQVcsVUFBVTtRQUNqQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDNUIsQ0FBQztJQWNELFlBQVksVUFBbUI7UUFML0I7O1dBRUc7UUFDSSxnQkFBVyxHQUEwQyxFQUFFLENBQUM7UUFHM0QsSUFBSSxDQUFDLFdBQVcsR0FBTSxVQUFVLENBQUM7UUFDakMsSUFBSSxDQUFDLFlBQVksR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsWUFBWSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBQyxhQUFhLENBQUMsQ0FBQztJQUM1RixDQUFDO0lBRU0sS0FBSyxDQUFDLFlBQVk7UUFDckIsZUFBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsUUFBaUIsRUFBRSxFQUFFO1lBQ3RELElBQUcsK0JBQWEsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLEVBQUM7Z0JBQ2xELE9BQU8sS0FBSyxDQUFDO2FBQ2hCO1lBQ0Qsd0JBQXdCO1lBQ3hCLElBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFDO2dC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Q3hDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQy9CO1FBQ0QsSUFBSSxhQUFhLEdBQUcsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEMsT0FBTyxhQUFhLENBQUE7SUFDeEIsQ0FBQztDQUNKO0FBMVZELG1DQTBWQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IERiQnVuZGxlRGF0YUJhc2UgfSBmcm9tIFwiLi9kYi1idW5kbGUtZGF0YS1iYXNlXCI7XHJcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XHJcbmltcG9ydCBUb29scyBmcm9tIFwiLi4vdXRpbHMvdG9vbHNcIjtcclxuaW1wb3J0IHsgRGJCdW5kbGVDb25maWcsIEV4cG9ydE1vZGUgfSBmcm9tIFwiLi9kYi1idW5kbGUtY29uZmlnXCI7XHJcbmltcG9ydCB7IEFzc2V0RGJVdGlscyB9IGZyb20gXCIuLi91dGlscy9hc3NldC1kYi11dGlsc1wiO1xyXG5pbXBvcnQgSlNaaXAgZnJvbSBcImpzemlwXCI7XHJcbmltcG9ydCBwYWtvIGZyb20gXCJwYWtvXCI7XHJcbmltcG9ydCB7IERiQnVuZGxlRGF0YXMgfSBmcm9tIFwiLi9kYi1idW5kbGUtZGF0YXNcIjtcclxuLyoqXHJcbiAqIOWvueafkOS4gOS4quaMh+WumuWQjeWtl+eahGJ1bmRsZeeahOmFjee9ruihqOi/m+ihjOWvvOWHulxyXG4gKi9cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGJCdW5kbGVFeHBvcnRlcntcclxuICAgIC8qKlxyXG4gICAgICog5a+85Ye65oyH5a6a5ZCN5a2X55qEYnVuZGxl55qE6YWN572u6KGoXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgX2J1bmRsZU5hbWUgOiBzdHJpbmc7XHJcblxyXG4gICAgcHVibGljIGdldCBidW5kbGVOYW1lKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2J1bmRsZU5hbWU7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOmFjee9ruihqOeahOaWh+S7tuWkuei3r+W+hFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHNyY0RiUm9vdERpciA6IHN0cmluZztcclxuICAgIC8qKlxyXG4gICAgICog6aKE6KeIanNvbuaWh+S7tueahOaWh+S7tuWkuei3r+W+hFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHByZXZpZXdEYkRpciA6IHN0cmluZztcclxuICAgIC8qKlxyXG4gICAgICog6Kej5p6Q5Y6a5b6X6YWN572u6KGo5pWw5o2uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBkYk5hbWVfMl9kYiA6IHtbbmFtZSA6IHN0cmluZ10gOiBEYkJ1bmRsZURhdGFCYXNlfSA9IHt9O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGJ1bmRsZU5hbWUgOiBzdHJpbmcpe1xyXG4gICAgICAgIHRoaXMuX2J1bmRsZU5hbWUgICAgPSBidW5kbGVOYW1lO1xyXG4gICAgICAgIHRoaXMuc3JjRGJSb290RGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiX2NvbmZpZ1wiLCBidW5kbGVOYW1lKTtcclxuICAgICAgICB0aGlzLnByZXZpZXdEYkRpciA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcIl9jb25maWdcIiwgYnVuZGxlTmFtZSwnX3ByZXZpZXdfZGInKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXN5bmMgZXhwb3J0QnVuZGxlKCl7XHJcbiAgICAgICAgVG9vbHMuZm9yZWFjaERpcih0aGlzLnNyY0RiUm9vdERpciwgKGZpbGVQYXRoIDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKERiQnVuZGxlRGF0YXMuSW5zdGFuY2UubG9hZGVkRGJGaWxlUGF0aHNbZmlsZVBhdGhdKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL+WmguaenGZpbGVQYXRo5LiN5piv5LuleGxzeOe7k+Wwvu+8jOi/lOWbnlxyXG4gICAgICAgICAgICBpZighZmlsZVBhdGguZW5kc1dpdGgoXCIueGxzeFwiKSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IGRicyA6IERiQnVuZGxlRGF0YUJhc2VbXSA9IFtdO1xyXG4gICAgICAgICAgICBEYkJ1bmRsZURhdGFCYXNlLmxvYWRGcm9tWGxzeEFzeW5jKGZpbGVQYXRoLChfZGJzKT0+e1xyXG4gICAgICAgICAgICAgICAgZGJzID0gX2RicztcclxuICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7aTxkYnMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGIgPSBkYnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgRGJCdW5kbGVEYXRhcy5JbnN0YW5jZS5kYkZpbGVQYXRoXzJfZGJOYW1lTWFwW2ZpbGVQYXRoXSA9IChEYkJ1bmRsZURhdGFzLkluc3RhbmNlLmRiRmlsZVBhdGhfMl9kYk5hbWVNYXBbZmlsZVBhdGhdIHx8IHt9KTtcclxuICAgICAgICAgICAgICAgICAgICBEYkJ1bmRsZURhdGFzLkluc3RhbmNlLmRiRmlsZVBhdGhfMl9kYk5hbWVNYXBbZmlsZVBhdGhdW2RiLm5hbWVdID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgRGJCdW5kbGVEYXRhcy5JbnN0YW5jZS5kYk5hbWVzXzJfZGJGaWxlUGF0aE1hcFtkYi5uYW1lXSA9IChEYkJ1bmRsZURhdGFzLkluc3RhbmNlLmRiTmFtZXNfMl9kYkZpbGVQYXRoTWFwW2RiLm5hbWVdIHx8IHt9KTtcclxuICAgICAgICAgICAgICAgICAgICBEYkJ1bmRsZURhdGFzLkluc3RhbmNlLmRiTmFtZXNfMl9kYkZpbGVQYXRoTWFwW2RiLm5hbWVdW2ZpbGVQYXRoXSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmKCFkYi5jYW5FeHBvcnQoKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIumFjee9ruihqOS4jeWPr+WvvOWHuu+8mlwiLGRiLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGRiLndhcm5Mb2cubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBkYi53YXJuTG9nW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKHRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsZXQgb2xkRGIgPSB0aGlzLmRiTmFtZV8yX2RiW2RiLm5hbWVdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCFvbGREYil7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGJOYW1lXzJfZGJbZGIubmFtZV0gICA9IGRiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBEYkJ1bmRsZURhdGFzLkluc3RhbmNlLmRiTmFtZV8yX2RiW2RiLm5hbWVdID0gZGI7XHJcbiAgICAgICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtc2cgPSBvbGREYi5jYW5NZXJnZShkYik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtc2cpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeWQiOW5tuWksei0pe+8mmZpbGUxPVslc10gZmlsZTI9WyVzXSDlpLHotKXnkIbnlLE9WyVzXVwiLCBkYi5uYW1lLCBvbGREYi5vcmlnaW5GaWxlUGF0aCwgZGIub3JpZ2luRmlsZVBhdGgsIG1zZykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlkIjlubbmlbDmja5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZERiLm1lcmdlRGIoZGIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRGJCdW5kbGVEYXRhcy5JbnN0YW5jZS5kYk5hbWVfMl9kYltvbGREYi5uYW1lXSAgPSBvbGREYjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIERiQnVuZGxlRGF0YXMuSW5zdGFuY2UubG9hZGVkRGJGaWxlUGF0aHNbZmlsZVBhdGhdICA9IHRydWU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5a+85Ye65b2T5YmNYnVuZGxl55qEanNvbuaWh+S7tlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZXhwb3J0UHJldmlld0RiKCl7XHJcbiAgICAgICAgbGV0IGNvdW50ICAgPSAwO1xyXG4gICAgICAgIC8vIDEuIOWwneivleWIm+W7ul9yYXdfZGLnm67lvZVcclxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmModGhpcy5wcmV2aWV3RGJEaXIpKSB7XHJcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLnByZXZpZXdEYkRpcix7cmVjdXJzaXZlIDogdHJ1ZX0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyAyLiDmuIXnkIZfcmF3X2Ri55uu5b2VXHJcbiAgICAgICAgVG9vbHMuZm9yZWFjaERpcih0aGlzLnByZXZpZXdEYkRpciwgKGZpbGVQYXRoKSA9PiB7XHJcbiAgICAgICAgICAgIGZzLnVubGlua1N5bmMoZmlsZVBhdGgpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gMy4g55Sf5oiQ5Y6f5aeL6YWN572u6KGoXHJcbiAgICAgICAgVG9vbHMuZm9yRWFjaE1hcCh0aGlzLmRiTmFtZV8yX2RiLCAoZGJOYW1lLCBkYikgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdGV4dCA9IGRiLmdlbmVyYXRlUHJldmlld0RiSnNvblRleHQoKTtcclxuICAgICAgICAgICAgbGV0IGZpbGVQYXRoID0gcGF0aC5qb2luKHRoaXMucHJldmlld0RiRGlyLCBkYk5hbWUgKyBcIi5qc29uXCIpO1xyXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZpbGVQYXRoLCB0ZXh0LCB7IGVuY29kaW5nOiBcInV0Zi04XCIgfSk7XHJcbiAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coVG9vbHMuZm9ybWF0KFwi6aKE6KeI6YWN572u6KGocHJlaXZld19kYuWvvOWHuuWujOavle+8jOW3suWvvOWHuiVk5LiqanNvbuaWh+S7tuOAglwiLCBjb3VudCkpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgbWVyZ2VEYkZpZWxkKCl7XHJcbiAgICAgICAgVG9vbHMuZm9yRWFjaE1hcCh0aGlzLmRiTmFtZV8yX2RiLCAoZGJOYW1lLCBkYikgPT4ge1xyXG4gICAgICAgICAgICBkYi5wcm9jZXNzTWVyZ2VUb0FycigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDlr7zlh7rmj4/ov7Dmlofku7ZcclxuICAgICAqL1xyXG4gICAgcHVibGljIGV4cG9ydER0c0ZpbGUoKXtcclxuICAgICAgICBsZXQgdGV4dCA9ICcnO1xyXG4gICAgICAgIGxldCBtb2R1bGVOYW1lICA9IHRoaXMuX2J1bmRsZU5hbWUgKyAnRGInO1xyXG4gICAgICAgIHRleHQgKz0gJy8qKiDphY3nva7ooajmlbDmja7nu5PmnoTmj4/ov7Dmlofku7bvvIzmnKzmlofku7bnlLHlr7zlh7rlmajoh6rliqjnlJ/miJDvvIzor7fli7/miYvliqjkv67mlLkgKi9cXG4nO1xyXG4gICAgICAgIHRleHQgKz0gJ2RlY2xhcmUgbmFtZXNwYWNlICcgKyBtb2R1bGVOYW1lICsgJyB7XFxuJztcclxuICAgICAgICBcclxuICAgICAgICB0ZXh0ICs9ICcgICAgZnVuY3Rpb24gZ2V0RGF0YUJhc2UoZGJOYW1lOiBzdHJpbmcpOiBhbnk7XFxuJztcclxuXHJcbiAgICAgICAgVG9vbHMuZm9yRWFjaE1hcCh0aGlzLmRiTmFtZV8yX2RiLCAoZGJOYW1lLCBkYikgPT4ge1xyXG5cclxuICAgICAgICAgICAgdGV4dCArPSBkYi5nZW5lcmF0ZURiZHRzVGV4dChtb2R1bGVOYW1lKTtcclxuXHJcbiAgICAgICAgICAgIHRleHQgKz0gZGIuZ2VuZXJhdGVEYmR0c0NvbnN0c1RleHQobW9kdWxlTmFtZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkYk5hbWUpXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHRleHQpXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRleHQgKz0gJ30nO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0ZXh0KTtcclxuXHJcbiAgICAgICAgbGV0IGR0c0ZpbGVQYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiZGVjbGFyZVwiLCB0aGlzLl9idW5kbGVOYW1lICsgXCJEYi5kLnRzXCIpO1xyXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwYXRoLmRpcm5hbWUoZHRzRmlsZVBhdGgpKSkge1xyXG4gICAgICAgICAgICBmcy5ta2RpclN5bmMocGF0aC5kaXJuYW1lKGR0c0ZpbGVQYXRoKSx7cmVjdXJzaXZlIDogdHJ1ZX0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGR0c0ZpbGVQYXRoLCB0ZXh0LCB7IGVuY29kaW5nOiBcInV0Zi04XCIgfSk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOWvvOWHuuaVsOaNruaWh+S7tu+8jGFzc2V06LWE5rqQXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBhc3luYyBleHBvcnREYXRhRmlsZSgpIHtcclxuICAgICAgICBsZXQganNvbkRhdGEgPSB7fTtcclxuXHJcbiAgICAgICAgY29uc3QgZXhwb3J0TW9kZSA9IERiQnVuZGxlQ29uZmlnLkluc3RhbmNlLmV4cG9ydE1vZGU7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCLphY3nva7ooajlr7zlh7rmqKHlvI86IFwiLCBleHBvcnRNb2RlKTtcclxuICAgICAgICBsZXQgZXhwb3J0Q291bnQgPSAwO1xyXG4gICAgICAgIFRvb2xzLmZvckVhY2hNYXAodGhpcy5kYk5hbWVfMl9kYiwgKGRiTmFtZSwgZGIpID0+IHtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCLlt7Llr7zlh7rphY3nva7ooajvvJpcIiwgZGJOYW1lKVxyXG4gICAgICAgICAgICBleHBvcnRDb3VudCsrO1xyXG5cclxuICAgICAgICAgICAgbGV0IGZpZWxkTmFtZV8yX3R5cGUgPSB7fTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYi5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZGIuZmllbGRzW2ldO1xyXG4gICAgICAgICAgICAgICAgZmllbGROYW1lXzJfdHlwZVtmaWVsZC5uYW1lXSA9IGZpZWxkLnR5cGU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBkYkRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBkYi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgcnVsZTogZGIucnVsZSxcclxuICAgICAgICAgICAgICAgIGRhdGFzOiBkYi5kYXRhcyxcclxuICAgICAgICAgICAgICAgIGZpZWxkTmFtZV8yX3R5cGU6IGZpZWxkTmFtZV8yX3R5cGUsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGpzb25EYXRhW2RiTmFtZV0gPSBkYkRhdGE7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBqc29uRGF0YUZpbGVQYXRoICAgID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiYXNzZXRzXCIsIHRoaXMuX2J1bmRsZU5hbWUsICBcImNmZ1wiLCBcImRiLmpzb25cIik7XHJcbiAgICAgICAgbGV0IGJpbkRhdGFGaWxlUGF0aCAgICAgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgXCJhc3NldHNcIiwgdGhpcy5fYnVuZGxlTmFtZSwgIFwiY2ZnXCIsIFwiZGIuYmluXCIpO1xyXG4gICAgICAgIGxldCBhc3NldEpzb25QYXRoICAgICAgID0gXCJkYjovL2Fzc2V0cy9yZXNvdXJjZXMvY2ZnL2RiLmpzb25cIjtcclxuICAgICAgICBsZXQgYXNzZXRCaW5QYXRoICAgICAgICA9IFwiZGI6Ly9hc3NldHMvcmVzb3VyY2VzL2NmZy9kYi5iaW5cIjtcclxuICAgICAgICBpZih0aGlzLl9idW5kbGVOYW1lICE9ICdyZXNvdXJjZXMnKXtcclxuICAgICAgICAgICAganNvbkRhdGFGaWxlUGF0aCAgICA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcImFzc2V0c1wiLCBcImJ1bmRsZXNcIiwgdGhpcy5fYnVuZGxlTmFtZSwgIFwiY2ZnXCIsIFwiZGIuanNvblwiKTtcclxuICAgICAgICAgICAgYmluRGF0YUZpbGVQYXRoICAgICA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcImFzc2V0c1wiLCBcImJ1bmRsZXNcIiwgdGhpcy5fYnVuZGxlTmFtZSwgIFwiY2ZnXCIsIFwiZGIuYmluXCIpO1xyXG4gICAgICAgICAgICBhc3NldEpzb25QYXRoICAgICAgID0gXCJkYjovL2Fzc2V0cy9idW5kbGVzL1wiICsgdGhpcy5fYnVuZGxlTmFtZSArIFwiL2NmZy9kYi5qc29uXCI7XHJcbiAgICAgICAgICAgIGFzc2V0QmluUGF0aCAgICAgICAgPSBcImRiOi8vYXNzZXRzL2J1bmRsZXMvXCIgKyB0aGlzLl9idW5kbGVOYW1lICsgXCIvY2ZnL2RiLmJpblwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGF0aC5kaXJuYW1lKGpzb25EYXRhRmlsZVBhdGgpKSkge1xyXG4gICAgICAgICAgICBmcy5ta2RpclN5bmMocGF0aC5kaXJuYW1lKGpzb25EYXRhRmlsZVBhdGgpLHtyZWN1cnNpdmUgOiB0cnVlfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGpzb25EYXRhRmlsZVBhdGgpKSB7XHJcbiAgICAgICAgICAgIGZzLnJtU3luYyhqc29uRGF0YUZpbGVQYXRoKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhiaW5EYXRhRmlsZVBhdGgpKSB7XHJcbiAgICAgICAgICAgIGZzLnJtU3luYyhiaW5EYXRhRmlsZVBhdGgpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyDmoLzlvI/ljJZcclxuICAgICAgICBzd2l0Y2ggKGV4cG9ydE1vZGUpIHtcclxuICAgICAgICAgICAgY2FzZSBFeHBvcnRNb2RlLlBSRVRUWV9KU09OOiB7XHJcbiAgICAgICAgICAgICAgICAvLyDnvo7ljJZqc29uXHJcbiAgICAgICAgICAgICAgICBsZXQgdGV4dCA9IEpTT04uc3RyaW5naWZ5KGpzb25EYXRhLCBudWxsLCA0KTtcclxuICAgICAgICAgICAgICAgIC8vZnMud3JpdGVGaWxlU3luYyhqc29uRGF0YUZpbGVQYXRoLCB0ZXh0LCB7IGVuY29kaW5nOiBcInV0Zi04XCIgfSk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBBc3NldERiVXRpbHMuUmVxdWVzdENyZWF0ZU5ld0Fzc2V0KGFzc2V0SnNvblBhdGgsdGV4dCBhcyBhbnksdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY2FzZSBFeHBvcnRNb2RlLlpJUF9KU09OOiB7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHppcCA9IG5ldyBKU1ppcCgpO1xyXG4gICAgICAgICAgICAgICAgLy8g5Y6L57ypanNvblxyXG4gICAgICAgICAgICAgICAgbGV0IHRleHQgPSBKU09OLnN0cmluZ2lmeShqc29uRGF0YSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gcGFrby5kZWZsYXRlKHRleHQse2xldmVsOjB9KTtcclxuICAgICAgICAgICAgICAgIC8vIOaWh+S7tuWktO+8jCdwYWtvJ1xyXG4gICAgICAgICAgICAgICAgLy8gbGV0IGhlYWRDaHVuayA9IHRoaXMuc3RyaW5nVG9VaW50OEFycmF5KFwiemlwLWpzb25cIik7XHJcbiAgICAgICAgICAgICAgICAvLyB6aXAuZmlsZShcImRhdGFiYXNlXCIsdGV4dCk7XHJcbiAgICAgICAgICAgICAgICAvLyAvLyDljovnvKnlkI7nmoTmlbDmja5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB6aXAuZ2VuZXJhdGVBc3luYyh7XHJcbiAgICAgICAgICAgICAgICAvLyAgICAgdHlwZTogXCJ1aW50OGFycmF5XCIsLy9ub2RlanPnlKhcclxuICAgICAgICAgICAgICAgIC8vICAgICBjb21wcmVzc2lvbjogXCJERUZMQVRFXCJcclxuICAgICAgICAgICAgICAgIC8vIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLojrflj5bliLDplb/luqbvvJpcIixjb250ZW50Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAvLyDovpPlh7rnmoTkuozov5vliLbvvIzmlofku7blpLQr5Y6L57yp5ZCO55qE5pWw5o2uXHJcbiAgICAgICAgICAgICAgICBhd2FpdCBBc3NldERiVXRpbHMuUmVxdWVzdENyZWF0ZU5ld0Fzc2V0KGFzc2V0QmluUGF0aCxjb250ZW50IGFzIGFueSx0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjYXNlIEV4cG9ydE1vZGUuSlNPTjpcclxuICAgICAgICAgICAgZGVmYXVsdDoge1xyXG4gICAgICAgICAgICAgICAgLy8g6buY6K6k5L2/55So5qCH5YeGanNvblxyXG4gICAgICAgICAgICAgICAgbGV0IHRleHQgPSBKU09OLnN0cmluZ2lmeShqc29uRGF0YSk7XHJcbiAgICAgICAgICAgICAgICAvL2ZzLndyaXRlRmlsZVN5bmMoanNvbkRhdGFGaWxlUGF0aCwgdGV4dCwgeyBlbmNvZGluZzogXCJ1dGYtOFwiIH0pO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgQXNzZXREYlV0aWxzLlJlcXVlc3RDcmVhdGVOZXdBc3NldChhc3NldEpzb25QYXRoLHRleHQgYXMgYW55LHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKFRvb2xzLmZvcm1hdChcIuW3suWvvOWHuumFjee9ruihqO+8miVk5LiqXCIsIGV4cG9ydENvdW50KSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlr7zlh7ogX0F1dG9FeHBvcnREYi50c++8iHJlc291cmNlcylcclxuICAgICAqIOWFtuS7lmJ1bmRsZeS8muWvvOWHuuWxnuS6juiHquW3seeahF9BdXRve2J1bmRsZU5hbWV9RXhwb3J0RGIudHMsYnVuZGxlTmFtZemmluWtl+avjeWkp+WGmVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZXhwb3J0QXV0b0V4cG9ydERiVHMoKXtcclxuICAgICAgICBsZXQgZGlyID0gJyc7XHJcbiAgICAgICAgaWYodGhpcy5fYnVuZGxlTmFtZSA9PSAncmVzb3VyY2VzJyl7XHJcbiAgICAgICAgICAgIGRpciA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcImFzc2V0c1wiLCBcInJlc291cmNlc1wiLFwic2NyaXB0c1wiLCBcImF1dG9cIik7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGRpciA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcImFzc2V0c1wiLCBcImJ1bmRsZXNcIiwgdGhpcy5fYnVuZGxlTmFtZSwgXCJzY3JpcHRzXCIsIFwiYXV0b1wiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBmaWxlUGF0aCA9ICcnO1xyXG4gICAgICAgIGxldCB0c0ZpbGVQYXRoID0gJ2RiOi8vYXNzZXRzLyc7XHJcbiAgICAgICAgaWYodGhpcy5fYnVuZGxlTmFtZSA9PSAncmVzb3VyY2VzJyl7XHJcbiAgICAgICAgICAgIGZpbGVQYXRoID0gcGF0aC5qb2luKGRpciwgXCJfQXV0b1Jlc291cmNlc0V4cG9ydERiLnRzXCIpO1xyXG4gICAgICAgICAgICB0c0ZpbGVQYXRoICs9IFwicmVzb3VyY2VzL3NjcmlwdHMvYXV0by9fQXV0b1Jlc291cmNlc0V4cG9ydERiLnRzXCI7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGZpbGVQYXRoID0gcGF0aC5qb2luKGRpciwgXCJfQXV0b1wiICsgVG9vbHMudXBwZXJGaXJzdExldHRlcih0aGlzLl9idW5kbGVOYW1lKSArIFwiRXhwb3J0RGIudHNcIik7XHJcbiAgICAgICAgICAgIHRzRmlsZVBhdGggKz0gXCJidW5kbGVzL1wiICsgdGhpcy5fYnVuZGxlTmFtZSArIFwiL3NjcmlwdHMvYXV0by9fQXV0b1wiICsgVG9vbHMudXBwZXJGaXJzdExldHRlcih0aGlzLl9idW5kbGVOYW1lKSArIFwiRXhwb3J0RGIudHNcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHRleHQgPSAnJztcclxuICAgICAgICB0ZXh0ICs9IFwiaW1wb3J0IERhdGFCYXNlIGZyb20gJ2RiOi8vYXNzZXRzL3Jlc291cmNlcy9zY3JpcHRzL2NvcmUvc3RydWN0L2RhdGEtYmFzZSc7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcImltcG9ydCBEYk1hbmFnZXIgZnJvbSAnZGI6Ly9hc3NldHMvcmVzb3VyY2VzL3NjcmlwdHMvY29yZS9tYW5hZ2VyL2RiLW1hbmFnZXInO1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCJcXG5cIlxyXG4gICAgICAgIHRleHQgKz0gXCIvKipcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICog5q2k5paH5Lu255SxZGJFeHBvcnRlcuiEmuacrOiHquWKqOeUn+aIkO+8geivt+WLv+aJi+WKqOS/ruaUueacrOaWh+S7tu+8gVxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgKiBcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICog5bCB6KOF6YWN572u6KGo55qE5ZCE6aG5Z2V0dGVy5Ye95pWwXFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIiAqL1xcblwiOyAgICBcclxuXHJcbiAgICAgICAgbGV0IG1vZHVsZU5hbWUgPSB0aGlzLl9idW5kbGVOYW1lICsgXCJEYlwiO1xyXG4gICAgICAgIGxldCBpbml0RnVuY05hbWUgPSBcIl9BdXRvXCIgKyBUb29scy51cHBlckZpcnN0TGV0dGVyKHRoaXMuX2J1bmRsZU5hbWUpICsgXCJFeHBvcnREYl9pbml0XCI7XHJcblxyXG4gICAgICAgIHRleHQgKz0gXCJsZXQgXCIgKyBtb2R1bGVOYW1lICsgXCIgPSB7fSBhcyBhbnk7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIndpbmRvd1snXCIgKyBtb2R1bGVOYW1lICsgXCInXSA9IFwiICsgbW9kdWxlTmFtZSArIFwiO1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCJcXG5cIjtcclxuXHJcbiAgICAgICAgLy8g5YWI5pS+572ua2V5c1xyXG4gICAgICAgIFRvb2xzLmZvckVhY2hNYXAodGhpcy5kYk5hbWVfMl9kYiwgKGRiTmFtZSwgZGIpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ+WvvOWHuumFjee9ruihqOW+l2tleXPvvJonLGRiTmFtZSk7XHJcbiAgICAgICAgICAgIGxldCBrZXlzVGV4dCA9IGRiLmdlbmVyYXRlQXV0b0V4cG9ydERiVHNDb25zdHNUZXh0KG1vZHVsZU5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoa2V5c1RleHQpIHtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0ga2V5c1RleHQgKyBcIlxcblwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGV4dCArPSBcIlxcblwiO1xyXG5cclxuICAgICAgICAvL+aUvuWIneWni+WMluWHveaVsFxyXG4gICAgICAgIHRleHQgKz0gXCJleHBvcnQgZnVuY3Rpb24gXCIgKyBpbml0RnVuY05hbWUgKyBcIigpe1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgICAgXCIgKyBtb2R1bGVOYW1lICsgXCIuZ2V0RGF0YUJhc2UgPSAoZGJOYW1lOiBzdHJpbmcpOiBEYXRhQmFzZSA9PiB7IHJldHVybiBEYk1hbmFnZXIuZ2V0RGF0YUJhc2UoZGJOYW1lKTsgfVxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCJcXG5cIjtcclxuICAgICAgICAvLyDlho3mlL7nva5nZXR0ZXJzXHJcbiAgICAgICAgVG9vbHMuZm9yRWFjaE1hcCh0aGlzLmRiTmFtZV8yX2RiLCAoZGJOYW1lLCBkYikgPT4ge1xyXG4gICAgICAgICAgICBsZXQgZ2V0dGVyc1RleHQgPSBkYi5nZW5lcmF0ZUF1dG9FeHBvcnREYlRzR2V0dGVyc1RleHQobW9kdWxlTmFtZSk7XHJcbiAgICAgICAgICAgIHRleHQgKz0gZ2V0dGVyc1RleHQgKyBcIlxcblwiO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRleHQgKz0gXCJ9XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIlxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIvKipcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICog5bu26L+fMW1z5ZCO6Ieq5Yqo5rOo5YaMXFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIiAqIFxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgKi9cXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwic2V0VGltZW91dCgoKSA9PiB7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIiAgICBsZXQgYkRpc2FibGVBdXRvSW5pdCA9ICEhd2luZG93WydfQXV0b0V4cG9ydERiX2JEaXNhYmxlQXV0b0luaXQnXTtcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICAgIGlmICghYkRpc2FibGVBdXRvSW5pdCkge1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgICAgICAgIC8vIGNvbnNvbGUubG9nKCdfQXV0b0V4cG9ydERiLnRzIOWFvOWuueS7o+eggeWQr+WKqO+8jOWIneWni+WMluaJgOaciWdldHRlcuaOpeWPoycpO1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgICAgICAgIFwiICsgaW5pdEZ1bmNOYW1lICsgXCIoKTtcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICAgIH1cXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwifSwgMSk7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIlxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCJ3aW5kb3dbJ1wiICsgaW5pdEZ1bmNOYW1lICsgXCInXSA9IFwiICsgaW5pdEZ1bmNOYW1lICsgXCI7XFxuXCI7XHJcblxyXG4gICAgICAgICAvLyDpooTlhYjmo4Dmn6XlhoXlrrnmmK/lkKbmlLnlj5hcclxuICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpKSB7XHJcbiAgICAgICAgICAgIGxldCBvcmlnaW5UZXh0ID0gZnMucmVhZEZpbGVTeW5jKGZpbGVQYXRoLCB7IGVuY29kaW5nOiBcInV0Zi04XCIgfSk7XHJcbiAgICAgICAgICAgIGlmIChvcmlnaW5UZXh0ID09IHRleHQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwi5paH5Lu25pyq5Y+R55Sf5pS55Yqo77yM5LiN6ZyA6KaB6YeN5paw5YaZ5YWl77yaXCIsIGZpbGVQYXRoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvL+eUn+aIkGF1dG9FeHBvcnREYi50c+aWh+S7tlxyXG4gICAgICAgIEFzc2V0RGJVdGlscy5SZXF1ZXN0Q3JlYXRlTmV3QXNzZXQodHNGaWxlUGF0aCx0ZXh0LHRydWUpO1xyXG4gICAgICAgIGNvbnNvbGUud2Fybign5a+85Ye66YWN572u6KGoZC50c+aPj+i/sOaWh+S7tu+8micsdHNGaWxlUGF0aCk7XHJcbiAgICB9ICAgXHJcblxyXG4gICAgcHVibGljIGV4cG9ydEkxOE5EZWZpbmVGaWxlKCl7XHJcbiAgICAgICAgY29uc3QgZGJCYXNlID0gdGhpcy5nZXREYXRhYmFzZSgnaTE4bl9sYW5ndWFnZV9jb25maWdfZGInKTtcclxuICAgICAgICBpZighZGJCYXNlKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB0ZXh0ICA9IGRiQmFzZS5nZW5lcmF0ZUkxOG5FbnVtVGV4dCgpO1xyXG4gICAgICAgIGlmKCF0ZXh0IHx8IHRleHQgPT0gXCJcIil7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdXJsID0gXCJkYjovL2Fzc2V0cy9yZXNvdXJjZXMvc2NyaXB0cy9hdXRvL2kxOG4tZGVmaW5lLnRzXCI7XHJcblxyXG4gICAgICAgIEFzc2V0RGJVdGlscy5SZXF1ZXN0Q3JlYXRlTmV3QXNzZXQodXJsLHRleHQsdHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmoLnmja7phY3nva7ooajnmoTlkI3lrZfojrflj5bkuIDkuKrphY3nva7ooajnmoTmlbDmja7vvIzlj6/og73ov5Tlm55udWxsXHJcbiAgICAgKiBAcGFyYW0gZGJOYW1lIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0RGF0YWJhc2UoZGJOYW1lIDogc3RyaW5nKSA6IERiQnVuZGxlRGF0YUJhc2UgfCBudWxse1xyXG4gICAgICAgIGlmKCF0aGlzLmRiTmFtZV8yX2RiW2RiTmFtZV0pe1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGJOYW1lXzJfZGJbZGJOYW1lXTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0cmluZ1RvVWludDhBcnJheShzdHIpIHtcclxuICAgICAgICB2YXIgYXJyID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBzdHIubGVuZ3RoOyBpIDwgajsgKytpKSB7XHJcbiAgICAgICAgICAgIGFyci5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRtcFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShhcnIpO1xyXG4gICAgICAgIHJldHVybiB0bXBVaW50OEFycmF5XHJcbiAgICB9XHJcbn0iXX0=