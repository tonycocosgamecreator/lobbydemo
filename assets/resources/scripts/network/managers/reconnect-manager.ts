import { WaitTime, bDebug } from "../../core/define";
import I18NManager from "../../core/manager/i18n-manager";
import ManagerBase from "../../core/manager/manager-base";
import { Net } from "../../core/net/net";
import BrowserUtils from "../../core/utils/browser-utils";
import { Global } from "../../global";
import { GameEvent, ReconnectState } from "../define/define";
import UIHelper from "../helper/ui-helper";
import { jsonmsg } from "../net/json/json-message-define";
import { MessageSender } from "../net/message-sender";
import JsonLoginManager from "./json-login-manager";
/**
 * 最大重连次数
 */
const MAX_RECONNECT_COUNT = 3;

/**
 * 重连管理器
 */
export class ReconnectManager extends ManagerBase {

    /**
     * 是否正在重连
     */
    private static _status: ReconnectState = ReconnectState.None;

    /**
     * 重试次数
     */
    private static _reconnectCount: number = 0;
    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'ReconnectManager';

    public static init() {
        super.init();
        Global.registerListeners(
            this,
            {
                [Net.NetFrameMessage.ON_CLIENT_CLOSE]: (args: any[]) => {
                    //连接关闭
                    const tp = args[0];
                    const event = args[1];
                    const eventType = event['type'];
                    if (!eventType || eventType == Net.WebSocketCloseEventType.HEART_BEAT_TIMEOUT) {
                        //因为心跳超时或者其他原因导致的关闭，都需要尝试重连
                        bDebug && console.log('开始断线重连~');
                        UIHelper.showCircleLoading(I18NManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.Tip_Reconnecting));
                        this.startReconnect();
                    } else {
                        //其他原因导致的关闭，直接弹出对话框
                        bDebug && console.log('其他原因导致的关闭', event);
                    }
                },
                [GameEvent.LOGIN_SUCCESS]: () => {
                    this._reset();
                }
            }
        );
    }

    /**
     * 清理自己的数据结构
     * 此方法不会被主动调用，请在自己需要的时候自己调用
     */
    public static clear() { }

    /**
     * 加载自己的本地存档
     * 不需要自己主动调用，会在注册时调用一次，或者在重置存档的时候回调
     * 会在init方法后被调用
     */
    public static loadRecord() { }
    /**
     * 存档
     * 此方法时一个protected的，所以，所有的存档操作都需要在manager内部处理，请勿在view中调用
     * 调用方式应该是,xxxManager.xxxx()->这个方法改变了一些需要存档的东西，主动触发存档操作
     */
    protected static saveRecord() { }
    /**
     * 每一帧回调一次
     * @param dt
     */
    public static update(dt: number) { }
    /**
     * 网络消息拦截器
     * @param msgType
     * @param data
     * @returns 如果返回true，说明消息被框架拦截了，不需要继续向下传递
     */
    public static onNetMessage(msgType: string, data: any): boolean {
        if (this.status != ReconnectState.Login) {
            return;
        }
        if (msgType == 'LoginAuthRsp' || msgType == jsonmsg.Message.MsgGameAuthAck) {
            this._reset();
            //首先处理登录消息，可能会失败，失败的话，直接弹出对话框
            //ProtoLoginManager.onNetMessage(msgType,data);
            //再处理登录失败的对话框
            // if(data.err_code != ProtoLogin.ErrorCode.SUCCESS){
            //     this._showReconnectFailedResultDialog();   
            // }
            //返回false，让登录管理器继续处理
        }
        return false;
    }

    //====================================================================================================
    /**
     * 获取当前重连状态
     */
    public static get status() {
        return this._status;
    }
    /**
     * 获取重连次数
     */
    public static get reconnectCount() {
        return this._reconnectCount;
    }

    /**
     * 开始重连
     */
    public static async startReconnect() {
        if (this._status != ReconnectState.None) {
            bDebug && console.error('重连状态错误', this._status);
            //UIHelper.hideCircleLoading();
            return;
        }
        if (this._reconnectCount >= MAX_RECONNECT_COUNT) {
            bDebug && console.log('重连次数达到上限');
            this._reset();
            this._showReconnectFailedResultDialog();
            return;
        }
        this._status = ReconnectState.Reconnecting;
        this._reconnectCount++;
        //关闭连接
        await MessageSender.CloseConnector();
        //等一会再开始
        await WaitTime(1.5);

        const bSuccess = await MessageSender.InitConnector(Global.NetWorkProtoType);
        if (!bSuccess) {
            this._status = ReconnectState.None;
            //再次重试
            return await this.startReconnect();
        }
        this._status = ReconnectState.Login;
        //链接成功，开始登录
        JsonLoginManager.Login();
        //等待登录结果
    }



    //================================私有方法===============================//
    /**
     * 重置状态
     */
    private static _reset() {
        this._status = ReconnectState.None;
        this._reconnectCount = 0;
        UIHelper.hideCircleLoading();
    }

    /**
     * 显示重连结果失败的对话框
     */
    private static _showReconnectFailedResultDialog() {
        MessageSender.CloseConnector();
        UIHelper.showConfirm(
            {
                yesHandler: () => {
                    //刷新浏览器
                    BrowserUtils.refreshURL();
                },
                bNotShowCloseButton: true,
                bSingleButton: true,
                value: I18NManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.Tip_ReconnectFailed),
            }
        );
    }
}