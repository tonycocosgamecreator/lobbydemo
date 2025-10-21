import BaseGlobal from "../message/base-global";
import { ConnectorType } from "../net/net-define";
import BaseManager from "./base-manager";

/**
 * 所有管理器的的管理类
 */
export default class Managers {
    protected static _managers: { [key: string]: typeof BaseManager } = {};
    /**
     * 注册管理器
     * @param manager 
     * @returns 
     */
    public static registe(manager: typeof BaseManager) {
        if(manager.BundleName == ""){
            console.error(`${manager.KEY} BundleName is empty!registe failed!`);
            return;
        }
        if(this._managers[manager.KEY]){
            console.error(`${manager.KEY} already registered!`);
            return;
        }
        manager.init();
        manager.loadRecord();
        this._managers[manager.KEY] = manager;
    }

    /**
     * 注销管理器
     * @param manager 
     */ 
    public static unregiste(manager: typeof BaseManager) {
        manager.destroy();
        delete this._managers[manager.KEY];
    }

    /**
     * 注销管理器
     * @param keys 
     */  
    public static unregisteByKeys(keys: string[]) {
        for(let key of keys){
            const base = this._managers[key];
            if(base){
                base.destroy();
                delete this._managers[key];
            }
        }
    }
    /**
     * 注销所有管理器
     * @param bundleName 
     */
    public static unregisteAll(bundleName: string) {
        for(let key in this._managers){
            const manager = this._managers[key];
            if(manager.BundleName === bundleName){
                this.unregiste(manager);
            }
        }
    }
    /**
     * 获取管理器
     * @param key 
     * @returns 
     */
    public static getManager(key: string) {
        return this._managers[key];
    }

    /**
     * 每一帧回调一次,帧结束时
     * @param dt
     */
    public static onLateUpdate(dt: number) {
        for(let key in this._managers){
            const manager = this._managers[key];
            if(manager.isEnabled()){
                manager.onLateUpdate(dt);
            }
        }
    }
    /**
     * 网络消息拦截器
     * @param msgType 
     * @param data 
     * @param connectorType 
     * @returns 
     */
    public static onNetMessage(msgType: string, data: any,connectorType : ConnectorType | string = ConnectorType.Lobby): boolean {
        for(let key in this._managers){
            const manager = this._managers[key];
            if(manager.isEnabled()){
                const isIntercept = manager.onNetMessage(msgType, data, connectorType);
                if(isIntercept){
                    return true;
                }
            }
        }
        return false;
    }
}