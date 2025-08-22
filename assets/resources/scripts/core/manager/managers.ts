import { bDebug } from "../define";
import BaseGlobal from "../message/base-global";
import { Tools } from "../utils/tools";
import BaseManager from "./base-manager";

/**
 * 所有管理器的的管理类
 */
export default class Managers {
    //======================所有管理器相关======================//
    /**
     * 当前所有注册的管理器
     */
    private static _managerInstances: { [key: string]: typeof BaseManager } = {};
    /**
     * 初始化-注册
     * 注册时会主动按照顺序调用-> init(),loadRecored()方法
     */
    public static registe(_base: typeof BaseManager) {
        if (this._managerInstances[_base.KEY]) {
            bDebug && console.warn('试图重复注册管理器：' + _base.KEY);
            return;
        }
        _base.init();
        _base.loadRecord();
        this._managerInstances[_base.KEY] = _base;
    }
    /**
     * 移除自己的注册
     */
    public static unregiste(_base: typeof BaseManager) {
        _base.clear();
        BaseGlobal.removeAllListeners(_base);
        delete this._managerInstances[_base.KEY];
    }

    /**
     * 根据key来移除注册
     * @param key 
     * @returns 
     */
    public static unregisteOfKey(key: string) {
        const base = this._managerInstances[key];
        if (!base) {
            return;
        }
        base.destroy();
        //在destory里面已经处理了
        //BaseGlobal.removeAllListeners(base);
        delete this._managerInstances[key];
    }


    /**
     * 每帧更新一次
     * @deprecated 框架内部方法，请勿主动调用
     * @param dt
     */
    public static onLateUpdate(dt: number) {
        Tools.forEachMap(this._managerInstances, (key, ma) => {
            if (!ma.isEnabled) {
                return;
            }
            ma.onLateUpdate(dt);
        });
    }

    public static onNetMessageAll(msgType: string, data: any): boolean {
        let bIntercept = false;

        //获取重连管理器，如果有重连管理器，优先传递
        let reconnectManager = this._managerInstances['ReconnectManager'];
        if (reconnectManager) {
            bIntercept = reconnectManager.onNetMessage(msgType, data);
            if (bIntercept) {
                return true;
            }
        }

        Tools.forEachMap(this._managerInstances, (key, ma) => {
            if (!ma.isEnabled) {
                return;
            }
            bIntercept = ma.onNetMessage(msgType, data);
            if (bIntercept) {
                return true;
            }
        });
        return bIntercept;
    }
}