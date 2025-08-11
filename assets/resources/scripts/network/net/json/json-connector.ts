import { bDebug } from "../../../core/define";
import I18NManager from "../../../core/manager/i18n-manager";
import Managers from "../../../core/manager/managers";
import ViewManager from "../../../core/manager/view-manager";
import BaseConnector from "../../../core/net/base-connector";
import { Net } from "../../../core/net/net";
import UIHelper from "../../helper/ui-helper";
import { jsonmsg } from "./json-message-define";
/**
 * 使用JSON方式进行链接
 */
export class JsonConnector extends BaseConnector {

    private _send_seq: number = 0;
    private _rev_seq: number = 0;

    private _heart_beat_send_time: number = 0;


    private static _instance: JsonConnector = null;

    constructor(_type: Net.ConnectorType | string) {
        super(_type);
        JsonConnector._instance = this;
    }

    /**
     * 单例对象
     * 注意：你需要在获取之前，在其他地方初始化，此处不会初始化
     */
    public static get instance() {
        return this._instance;
    }

    //====================================================================================================

    protected init() {

    }


    protected onHeartBeatTimeOut() {

    }

    protected onSocketOpen() {

    }

    protected onSocketClose() {

    }

    protected onSocketError() {

    }

    protected onOneMessage(buffer: Uint8Array) {
        //此方法在这里不会触发了，因为onMessage被重写了
    }
    /**
     * 发送心跳包
     */
    public sendHeartBeatMessage() {
        let data: jsonmsg.MsgGamePingReq = {
            utc: Date.now(),
        };
        this._heart_beat_send_time = data.utc;
        this.sendMsg(jsonmsg.Message.MsgGamePingReq, data);
    }

    protected isHeartBeatMessage(msgId: string | number): boolean {
        if (typeof msgId == 'number') {
            msgId = msgId.toString();
        }
        if (msgId == jsonmsg.Message.MsgGamePingReq || msgId == jsonmsg.Message.MsgGamePingAck) {
            return true;
        }
        return false;
    }

    public sendMsg(msgNameOrId: string | number, data: any, deskId?: number): void {
        if (typeof msgNameOrId == 'number') {
            msgNameOrId = msgNameOrId.toString();
        }
        this._send_seq++;
        const msg: jsonmsg.MessageStruct = {
            req_id: this._send_seq,
            msg_name: msgNameOrId,
            data: data
        };
        if (!this.isHeartBeatMessage(msgNameOrId)) {
            bDebug && console.log('sendMsg', msgNameOrId, msg);
        }
        this.send(JSON.stringify(msg));

    }

    /**
     * @override 重写父类收到消息的方法
     * @description 收到网络消息
     */
    protected onMessage(data: MessageEvent) {
        //恢复心跳超时次数，因为你收到服务器的消息了
        this._now_heart_beat_timeout_count = 0;
        const msg = JSON.parse(data.data) as jsonmsg.MessageStruct;
        if (!msg) {
            console.error('JsonConnector.onMessage: msg is null', data);
            return;
        }

        this._rev_seq = msg.req_id;
        if (this.isHeartBeatMessage(msg.msg_name)) {
            //心跳包，直接返回
            const nt = Date.now();
            this._ping = nt - this._heart_beat_send_time;
            this._heart_beat_send_time = 0;
            //bDebug && console.log("ping : ",this.ping)
            return;
        }
        bDebug && console.log('onMessage', msg.msg_name, msg);

        if (msg.msg_name == jsonmsg.Message.MsgKickOffAck) {
            //被踢下线了
            const title = I18NManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.Notice);
            const value = msg.data.reason;
            UIHelper.showConfirmOneButtonToBack(
                value,
                title,
                I18NManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.Confirm)
            );
            return;
        }

        const code = msg.data.code;
        if (code != undefined && code != jsonmsg.Code.CodeSuccess) {
            let key: string = '';
            for (let k in jsonmsg.Code) {
                if (jsonmsg.Code[k] == code) {
                    //找到了对应的错误码
                    key = k;
                    break;
                }
            }
            UIHelper.hideCircleLoading();
            console.log('code : ', code, key);
            const value = I18NManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX[key]);
            const title = I18NManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.Error);
            //这都是有问题的
            if (jsonmsg.isCodeNeedCloseGame(code)) {
                UIHelper.showConfirmOneButtonToBack(
                    value,
                    title,
                    I18NManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.ExitGame)
                );
                return;
            }
            if (jsonmsg.isCodeNeedRefresh(code)) {
                UIHelper.showConfirmOfOneButtonToRefreshBrowser(
                    value,
                    title,
                    I18NManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.Retry)
                );
                return;
            }
            //其他都是提示
            UIHelper.showConfirmOfOneButtonToClose(
                value,
                title,
                I18NManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.Confirm)
            );
            return;
        }
        //不是心跳包，进行消息的分发
        const bInterrupt = Managers.onNetMessageAll(msg.msg_name, msg.data);
        if (bInterrupt) {
            return;
        }
        ViewManager.onNetworkMessage(msg.msg_name, msg.data);
    }

}