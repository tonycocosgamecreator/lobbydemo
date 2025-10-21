import { bDebug } from "db://assets/resources/scripts/core/define";
import { GameEvent } from "db://assets/resources/scripts/define";
import { Global } from "db://assets/resources/scripts/global";
import BaseManager from "../core/manager/base-manager";
import UIHelper from "../network/helper/ui-helper";
import { MessageSender } from "../network/net/message-sender";
import WalletManager from "./wallet-manager";

export default class SsHistoryManager extends BaseManager {

    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'SsHistoryManager';

    /**
     * 清理自己的数据结构
     * 此方法不会被主动调用，请在自己需要的时候自己调用
     */
    public static clear() {
        this._pageIndex = 0;
        // this._maxPageIndex = 1;
        this._isLastPage = false;
        this._datas = [];
    }

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
        if (msgType == supersevenbaccarat.Message.MsgGameRecordListAck) {
            const msg = data as supersevenbaccarat.MsgGameRecordListAck;
            if (msg.code != 0) return false;
            let is_last = !msg.infos || msg.infos.length == 0;
            this._isLastPage = is_last;
            if (this._isLastPage) {
                //如果已经是最后一页了，就不需要再请求了
                return false;
            }
            if (msg.infos.length < this._pageLen) {
                this._isLastPage = true;
            }
            this._pageIndex++;
            const history = msg.infos;
            if (history && history.length > 0) {
                this._datas.push(...history);
                Global.sendMsg(GameEvent.REQUEST_REFRESH_GAME_HISTORY);
            }
        }
        return false;
    }



    public static doNetGetHistory() {
        if (this._isLastPage) {
            //如果已经是最后一页了，就不需要再请求了
            return false;
        }
        const xlsx_config = resourcesDb.get_from_game_entrance_config_db('SuperSeven');
        const theme_id = xlsx_config.themeId;
        const data: supersevenbaccarat.MsgGameRecordListReq = {
            currency: WalletManager.currency,
            page: this._pageIndex,
            limit: this._pageLen,
        };
        MessageSender.SendMessage(supersevenbaccarat.Message.MsgGameRecordListReq, data);
        return true;
    }


    /**
     * 当前页
     */
    private static _pageIndex: number = 0;
    /**
     * 每页的长度
     */
    private static _pageLen: number = 20;
    /**
     * 最大页数
     */
    // private static _maxPageIndex: number = 1;
    /**
     * 是否最后一页
     */
    private static _isLastPage: boolean = false;


    public static get isLastPage(): boolean {
        return this._isLastPage;
    }

    private static _datas: supersevenbaccarat.MsgBetRecord[] = [];

    public static get datas(): supersevenbaccarat.MsgBetRecord[] {
        return this._datas;
    }

    public static get count(): number {
        return this._datas.length;
    }

    static getIndex(index: number) {
        return this._datas[index];
    }
}