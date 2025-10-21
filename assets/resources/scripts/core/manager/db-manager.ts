import { BufferAsset,Asset,JsonAsset,AssetManager } from "cc";
import DataBase from "../struct/data-base";
import BaseManager from "./base-manager";
import Timer from "../utils/timer";
import { Tools } from "../utils/tools";
import pako from "pako";
/**
 * 配置表管理器
 */
export default class DbManager extends BaseManager {
    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'DbManager';

    /**
     * 你属于哪个bundle
     */
    public static BundleName = 'resources';

    /**
     * 清理自己的数据结构
     * 此方法不会被主动调用，请在自己需要的时候自己调用
     */
    public static clear() {}

    //--=============================公共方法===========================//
    /**
     * 获取指定名称的数据库
     * @param dbName 数据库名称
     */
    protected static dbs: { [dbName: string]: DataBase } = {};
    /**
     * 
     * @param dbName 数据库名称
     * @param db 数据库实例
     * @returns 
     */
    public static getDataBase(dbName: string): DataBase | null {
        return this.dbs[dbName];
    }
    
    /**
     * 加载指定bundle的配置表
     * @param bundleName  bundle名称
     * @param res 资源
     */
    public static async loadDb(bundleName : string,res : BufferAsset | JsonAsset) : Promise<boolean> {
        const st = Timer.time();
        const bSuccess = await this._loadAssetSuccess(bundleName,res);
        if(!bSuccess){
            console.error(bundleName + ' load db error,time:',Timer.time() - st);
            return false;
        }
        console.log(bundleName + ' load db success,time:',Timer.time() - st);
        this._callInit(bundleName);
        return true;
    }



    //--=============================私有方法===========================//
    /**
     * 加载成功的回调函数
     * @param bundleName 加载的bundle名称
     * @param res 加载的资源
     * @returns 
     */
    private static async _loadAssetSuccess(bundleName : string,res : BufferAsset | JsonAsset) : Promise<boolean> {
        if(res instanceof JsonAsset){
            Tools.forEachMap(res.json, (dbName, dbData) => {
                const db = new DataBase();
                db.rule = dbData.rule;
                db.name = dbData.name;
                db.datas = dbData.datas;
                db.fieldName_2_type = dbData.fieldName_2_type;

                this.dbs[dbName] = db;
            });
            return true;
        }
        if(res instanceof BufferAsset){
            let data : string = "";
            const buffer = res.buffer();
            data = pako.inflate(buffer, { to: 'string' });
            if (!data) {
                console.error(bundleName + ' load db error,data is null,BufferAsset module');
                return false;
            }
            const jsonData = JSON.parse(data);

            Tools.forEachMap(jsonData, (dbName, dbData) => {
                const db = new DataBase();
                db.rule = dbData.rule;
                db.name = dbData.name;
                db.datas = dbData.datas;
                db.fieldName_2_type = dbData.fieldName_2_type;

                this.dbs[dbName] = db;
            });
            return true;
        }
        console.error(bundleName + ' load asset error,res is not BufferAsset or JsonAsset');
        return false;
    }

    /**
     * 加载完成以后，需要将方法都注册进来
     */
    private static _callInit(bundleName : string) {
        //_Auto{bundleName}ExportDb_init bundleName首字母大写
        const funcStr = `_Auto${bundleName.charAt(0).toUpperCase()}${bundleName.slice(1)}ExportDb_init`;
        const call = window[funcStr];
        if(call && call instanceof Function){
            call();
        }else{
            console.error(`_Auto${bundleName.charAt(0).toUpperCase()}${bundleName.slice(1)}ExportDb_init not found!`);
        }
    }
}