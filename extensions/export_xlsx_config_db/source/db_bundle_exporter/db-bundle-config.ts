import path from "path";
import fs from "fs-extra";

export enum ExportMode {
    /**
     * 导出为压缩后的json文件
     */
    JSON        = "json",
    /**
     * 导出为被jszip压缩后的二进制文件
     */
    ZIP_JSON    = "zip-json",
    /**
     * 导出为格式化后的json文件
     */
    PRETTY_JSON = "pretty-json",
}

export interface IDbBundleConfig {
    exportMode : ExportMode,
    mergeFieldToArrayKeepEmptyValue : boolean,
}

export class DbBundleConfig{
    private static _instance : DbBundleConfig;

    private _config : IDbBundleConfig;
    public static get Instance(){
        if(!this._instance){
            this._instance = new DbBundleConfig();
        }
        return this._instance;
    }

    constructor(){
        const filePath  = path.join(Editor.Project.path, "_config", "db.config.json5");
        console.log("DbBundleConfig -> ", filePath);
        const data      = fs.readFileSync(filePath, "utf-8");
        console.log('DbBundleConfig data -> ',data);
        const obj    = JSON.parse(data);
        console.log('DbBundleConfig obj -> ',obj);
        this._config = {
            exportMode : obj.exportMode || ExportMode.JSON,
            mergeFieldToArrayKeepEmptyValue : obj.mergeFieldToArrayKeepEmptyValue || false,
        }
        console.log('DbBundleConfig _config -> ',obj);
    }

    public get config(){
        return this._config;
    }

    public get exportMode(){
        return this._config.exportMode;
    }

    public get mergeFieldToArrayKeepEmptyValue(){
        return this._config.mergeFieldToArrayKeepEmptyValue;
    }
}