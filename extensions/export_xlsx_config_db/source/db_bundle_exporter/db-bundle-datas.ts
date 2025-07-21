import { DbBundleDataBase } from "./db-bundle-data-base";

export class DbBundleDatas {

    private static _instance: DbBundleDatas;
    public static get Instance(): DbBundleDatas {
        if (!this._instance) {
            this._instance = new DbBundleDatas();
        }
        return this._instance;
    }

    public dbNames_2_dbFilePathMap : {[dbName : string] : {[fileName : string] : boolean}}  = {};
    
    public dbFilePath_2_dbNameMap : {[key : string] : {[dbName : string] : boolean}}        = {};
    /**
     * 已经加载过得配置表
     */
    public loadedDbFilePaths : {[key : string] : boolean}   = {};

    public dbFilePath_2_dirty : {[key : string] : boolean}  = {};
    
    public dbName_2_db : {[name : string] : DbBundleDataBase} = {};

    public clear(){
        this.dbNames_2_dbFilePathMap    = {};
        this.dbFilePath_2_dbNameMap    = {};
        this.loadedDbFilePaths        = {};
        this.dbFilePath_2_dirty        = {};
        this.dbName_2_db            = {};
    }
}