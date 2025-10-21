import { Asset, BufferAsset, JsonAsset, assetManager, path, resources } from 'cc';
import DataBase from '../struct/data-base';
import Timer from '../utils/timer';
import { Tools } from '../utils/tools';
import { EDITOR } from 'cc/env';
import { EmptyCallback, bDebug } from '../define';
import { AssetManager } from 'cc';
import I18NManager from './i18n-manager';

window['_AutoExportDb_bDisableAutoInit'] = true;

export default class DbManager {
    protected static dbs: { [dbName: string]: DataBase } = {};
    /**
     * 配置表是否加载成功了
     */
    private static _bLoaded = false;

    public static getDataBase(dbName: string): DataBase | null {
        return this.dbs[dbName];
    }
    /**
     * 采用异步方式加载db
     */
    public static async loadDbAsync(bundle : AssetManager.Bundle){
        const bundleName = bundle.name;
        this.dbs = this.dbs || {};
        const beginTime = Timer.time();
        const res       = await this._loadDbResource(bundle);
        if(!res){
            return false;
        }
        const bSuccess  = await this._loadSuccess(res);
        if(!bSuccess){
            console.error('[ERROR] INIT Database failed~');
            return false;
        }
        this._callInit(bundleName);
        bDebug && console.log(bundleName + ' -> DbManager load data used ：', Timer.time() - beginTime);
        this._bLoaded   = true;
        return true;
    }
    /**
     * 直接使用加载好的数据初始化
     * @param bundleName 
     * @param res 
     * @returns 
     */
    public static async loadDb(bundleName : string,res : BufferAsset){
        const beginTime = Timer.time();
        const bSuccess  = await this._loadSuccess(res);
        if(!bSuccess){
            console.error('[ERROR] INIT Database failed~');
            return false;
        }
        this._callInit(bundleName);
        bDebug && console.log(bundleName + ' -> DbManager load data used ：', Timer.time() - beginTime);
        this._bLoaded   = true;
    }


    //======================================私有方法========================================//
    /**
     * 
     * @returns 内部加载db资源数据
     */
    private static async _loadDbResource(bundle : AssetManager.Bundle){
        return new Promise<Asset | null>(resolve=>{
            bundle.load('cfg/db',Asset,(err,res)=>{
                if(err){
                    resolve(null);
                    return;
                }
                resolve(res);
            });
        });
    }

    /**
     * 加载完成以后，需要将方法都注册进来
     */
    private static _callInit(bundleName : string) {
        // if(bundleName == AssetManager.BuiltinBundleName.RESOURCES){
        //     // 初始化配置表getter接口
        //     if (window['_AutoResourcesExportDb_init'] instanceof Function) {
        //         window['_AutoResourcesExportDb_init']();
        //         this._bLoaded = true;
        //     } else {
        //         throw new Error('_AutoResourcesExportDb_init not found! ');
        //     }
        //     return;
        // }
        //其他bundle的配置表
        //_Auto{bundleName}ExportDb_init bundleName首字母大写
        const funcStr = `_Auto${bundleName.charAt(0).toUpperCase()}${bundleName.slice(1)}ExportDb_init`;
        const call = window[funcStr];
        if(call && call instanceof Function){
            call();
            this._bLoaded = true;
        }else{
            console.error(`_Auto${bundleName.charAt(0).toUpperCase()}${bundleName.slice(1)}ExportDb_init not found!`);
        }
    }
    /**
     * 数据记载成功以后，回调，处理数据结构
     * @param res 
     * @returns 
     */
    private static async _loadSuccess(res: any): Promise<boolean> {
        if (res instanceof JsonAsset) {
            // resourcesDb.json， 直接提取数据

            Tools.forEachMap(res.json, (dbName, dbData) => {
                const db = new DataBase();
                db.rule = dbData.rule;
                db.name = dbData.name;
                db.datas = dbData.datas;
                db.fieldName_2_type = dbData.fieldName_2_type;

                this.dbs[dbName] = db;
            });
            return true;
        } else if (res instanceof BufferAsset) {
            // resourcesDb.bin，二进制数据
            const JSZip = window['JSZIP'];
            const zip = new JSZip();

            const datas = await zip.loadAsync(res.buffer()); //pako.inflate(dataChunk, { to: "string" });
            bDebug && console.log('zip = ', datas);
            const file = datas.files['database'];
            if (!file) {
                return false;
            }

            const data = await file.async('string');
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
    }

    //================================编辑器模式==================================//

    private static _assetInEditor: Asset | null = null;
    /**
     * 仅编辑器模式可用
     * @param call
     * @returns
     */
    public static loadDbInEditorMode(call?: EmptyCallback) {
        if (!EDITOR) {
            return;
        }
        if (this._assetInEditor) {
            assetManager.releaseAsset(this._assetInEditor);
            this._assetInEditor = null;
        }

        assetManager.loadAny('7479c4d5-e33c-4aa9-9b8c-139792412543', (err, res) => {
            if (err || !res) {
                bDebug && console.log(err);
                return;
            }
            this._assetInEditor = res;
            this._loadSuccess(res).then((bSuccess) => {
                if (!bSuccess) {
                    bDebug && console.error('加载配置文件失败了！');
                    return;
                }
                this._callInit(AssetManager.BuiltinBundleName.RESOURCES);

                const datas = resourcesDb.get_i18n_resources_db();
                I18NManager.registerI18nResourceDatas(datas);

                this._bLoaded = true;
                call && call();
            });
        });
    }
}
