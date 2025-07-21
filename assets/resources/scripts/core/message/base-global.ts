import * as cc from 'cc';
import { BUILD } from 'cc/env';
import MsgHandler, { T_MSG_LISTENERS } from './msg-handler';
import ICaller from './icaller';
import { debug } from 'cc';
export default class BaseGlobal {
    /**
     * UI摄像机
     */
    public static UICAMERA: cc.Camera | null = null;

    public static readonly FRAMEWORK_VERSION = '3.8.3';
    public static readonly B_DEV_MODE = !BUILD && cc.sys.platform == cc.sys.Platform.DESKTOP_BROWSER;

    /**
     * 发送全局消息
     */
    public static sendMsg(msgName: string, data?: any): void {
        try {
            MsgHandler.sendMsg(msgName, data);
        } catch (error) {
            debug && console.error(`[BaseGlobal.sendMsg] Error msgName ${msgName}:`, error);
            //ErrorLogUtils.SendHttpErrorLog(JSON.stringify({ errorType: "EventError", errorName: msgName, errorInfo: JSON.stringify(error.stack), eventInfo: JSON.stringify({ eventName: msgName, data: data || {} }) }));
        }
    }

    /**
     * 注册全局消息监听器
     * @param caller
     * @param listeners
     */
    public static registerListeners(caller: ICaller, listeners: T_MSG_LISTENERS): void {
        MsgHandler.registerListeners(caller, listeners);
    }

    /**
     * 移除全局消息监听器
     * @param caller
     */
    public static removeAllListeners(caller: ICaller): void {
        MsgHandler.removeAllListeners(caller);
    }
    /**
     * 移除指定对象的指定消息的监听
     * @param caller 
     * @param msgName 
     */
    public static removeListener(caller: ICaller, msgName: string) {
        MsgHandler.removeListener(caller, msgName);
    }
}