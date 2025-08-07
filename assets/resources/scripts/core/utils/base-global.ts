/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cc from 'cc';
import { BUILD } from 'cc/env';
import MsgHandler, { T_MSG_LISTENERS } from './msg-handler';
import ICaller from './iCaller';
//import { BUILD } from "cc/env";
export enum ResolutionAdapterMode {
    extension,
    edge,
}
export default class BaseGlobal {
    /**
     * UI摄像机
     */
    public static UICAMERA: cc.Camera | null = null;
    /**
     * 屏幕当前宽度
     */
    public static width: number = 0;
    /**
     * 屏幕当前高度
     */
    public static height: number = 0;

    public static readonly FRAMEWORK_VERSION = '3.8.2';
    public static readonly B_DEV_MODE = !BUILD && cc.sys.platform == cc.sys.Platform.DESKTOP_BROWSER;
    /**
     * 分辨率适配配置
     * 当前支持两种适配模式：
     * 1. extension扩展模式：
     *      比【最小分辨率】更宽的屏幕：保持最小高度，宽度自由延展
     *      比【最小分辨率】更高的屏幕：保持最小宽度，高度自由延展
     * 2. edge扩展模式：
     *      比【最小分辨率】更宽，比【最大分辨率】更窄：保持最小高度，宽度自由延展
     *      比【最小分辨率】更宽，比【最大分辨率】更宽：固定最小高度+最大宽度，屏幕上下补充Edge*
     *      比【最小分辨率】更高，比【最大分辨率】更矮：保持最小宽度，高度自由延展
     *      比【最小分辨率】更高，比【最大分辨率】更高：固定最小宽度+最大高度，屏幕左右补充Edge*
     *
     */
    static RESOLUTION_CONFIG = {
        /** 最小分辨率宽度 */
        minWidth: 720,
        /** 最小分辨率高度 */
        minHeight: 1560,

        /** 最大分辨率宽度，仅适用于edge模式 */
        maxWidth: 960,
        /** 最大分辨率高度，仅适用于edge模式 */
        maxHeight: 1600,

        /** 适配模式 */
        adapterMode: ResolutionAdapterMode.extension,
    };
    /**
     * 发送全局消息
     */
    public static sendMsg(msgName: string, data?: any): void {
        MsgHandler.sendMsg(msgName, data);
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
    public static removeListener(caller : ICaller,msgName : string){
        MsgHandler.removeListener(caller,msgName);
    }
}
