import { Message } from "protobufjs";
import I18NManager from "../../core/manager/i18n-manager";
import { Global } from "../../global";
import UIHelper from "../helper/ui-helper";
import { jsonmsg } from "../net/json/json-message-define";
import { MessageSender } from "../net/message-sender"
import BaseManager from "../../core/manager/base-manager";
import BrowserUtils from "../../core/utils/browser-utils";
import { EnterGameManager } from "./enter-game-manager";

export default class JsonLoginManager extends BaseManager {
    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'JsonLoginManager';

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
     * @param msg
     * @returns 如果返回true，说明消息被框架拦截了，不需要继续向下传递
     */
    public static onNetMessage(msgType: string, msg: any): boolean {
        if (msgType == jsonmsg.Message.MsgGameAuthAck) {
            //登录的回应
            const data = msg as jsonmsg.MsgGameAuthAck;
            const code = data.code;
            const game_code = data.game_code;
            EnterGameManager.enterGame(game_code);
        }
        return false;
    }

    //=============================公共方法===========================//
    /**
     * 开始链接服务器
     * @param bShowErrorTip 
     * @returns 
     */
    public static async ConnectToServer(bShowErrorTip: boolean = true) {
        //初始化链接
        const bConnectSuccess = await MessageSender.InitConnector(Global.NetWorkProtoType);
        if (!bConnectSuccess) {
            if (bShowErrorTip) {
                //如果链接失败
                UIHelper.showConfirmOneButtonToBack(I18NManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.Tip_SocketConnectFaild));
            }

            return false;
        }
        return true;
    }

    /**
     * 发送登录的消息
     */
    public static Login() {
        const data: jsonmsg.MsgGameAuthReq = {
            account: BrowserUtils.getParam(resourcesDb.LINK_URL_PARAM_DB_ID.account) ?? '',
            token: BrowserUtils.getParam(resourcesDb.LINK_URL_PARAM_DB_ID.token) ?? '',
        };
        MessageSender.SendMessage(jsonmsg.Message.MsgGameAuthReq, data);
    }
}