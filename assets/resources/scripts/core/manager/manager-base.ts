import { Global } from '../../global';
import { BaseMessage } from '../message/base-message';
import BaseGlobal from '../utils/base-global';

export default class ManagerBase {
    /**
     * 用于接收Global发送的消息
     */
    public static isCallerValid = true;
    /**
     * 当前管理器是否可用
     */
    private static _bEnabled = true;

    //=============================公共方法=============================//
    /**
     * 需要存档的数据
     */
    protected static datas: any = {};

    /**
     *
     * @param val 设置是否启用这个管理器
     */
    public static setEnabled(val: boolean) {
        this._bEnabled = val;
    }
    /**
     * 这个管理器是否可用
     * @returns
     */
    public static isEnabled() {
        return this._bEnabled;
    }

    /**
     * 初始化
     * 框架会主动调用，此处初始化自己的listeners，例如：
     * Global.registerListeners(
     *      this,
     *      {
     *          [xxx] : this.xxx
     *      }
     * )
     */
    public static init() {
        BaseGlobal.registerListeners(this, {
            //当重置存档时，主动调用loadRecord方法
            [BaseMessage.RESET_RECORD]: this.loadRecord,
        });
    }
    /**
     * 主动调用，销毁
     */
    public static destroy() {
        Global.removeAllListeners(this);
        this.clear();
        this.isCallerValid  = false;
        this._bEnabled      = false;
    }

    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = '';

    /**
     * 清理自己的数据结构
     * 此方法不会被主动调用，请在自己需要的时候自己调用
     */
    public static clear() {}

    /**
     * 加载自己的本地存档
     * 不需要自己主动调用，会在注册时调用一次，或者在重置存档的时候回调
     * 会在init方法后被调用
     */
    public static loadRecord() {}
    /**
     * 存档
     * 此方法时一个protected的，所以，所有的存档操作都需要在manager内部处理，请勿在view中调用
     * 调用方式应该是,xxxManager.xxxx()->这个方法改变了一些需要存档的东西，主动触发存档操作
     */
    protected static saveRecord() {}
    /**
     * 每一帧回调一次
     * @param dt
     */
    public static update(dt: number) {}
    /**
     * 网络消息拦截器
     * @param msgType
     * @param data
     * @returns 如果返回true，说明消息被框架拦截了，不需要继续向下传递
     */
    public static onNetMessage(msgType: string, data: any): boolean {
        return false;
    }
}
