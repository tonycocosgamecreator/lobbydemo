import { _decorator, Component, Node } from 'cc';
import BaseManager from '../core/manager/base-manager';
import UIHelper from '../network/helper/ui-helper';
import WalletManager from './wallet-manager';
import { MessageSender } from '../network/net/message-sender';
import { Global } from '../global';
import { GameEvent } from '../define';
import { IPanelSevenUpSevenDownMainView } from '../define/ipanel-sevenupsevendown-main-view';
const { ccclass, property } = _decorator;

export default class SevenUpSevenDownManager extends BaseManager {
    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'SevenUpSevenDownManager';
    /**
     * 你属于哪个bundle
     */
    public static BundleName = 'resources';
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
        if (msgType == sevenupdown.Message.MsgEnterSevenUpDownRsp) {
            const msg = data as sevenupdown.MsgEnterSevenUpDownRsp;
            const result = msg.result;
            if (result && result.err_code != commonrummy.RummyErrCode.EC_SUCCESS) {
                //如果有错误码，说明进入游戏失败了
                //这里可以弹出提示框，提示玩家进入游戏失败
                console.error(`enter Game Failed: ${result.err_desc}`);
                UIHelper.showConfirmOfOneButtonToRefreshBrowser(
                    resourcesDb.I18N_RESOURCES_DB_INDEX.TIP_ENTER_GAME_FAILED,
                    resourcesDb.I18N_RESOURCES_DB_INDEX.Error
                );
                return true; //拦截消息，不继续传递
            }
            this._deskId = msg.info.desk_id || 0;
            WalletManager.walletInfos = msg.wallets || [];
            WalletManager.bets = msg.info.bets;
            this._playerId = msg.player_id || 0;
            this._headId = msg.player_data?.icon || 1;
            this._odds = msg.info?.seven_up_down_info?.odds || [];
            this._records = msg.info?.seven_up_down_info?.win_type_list || [];
            this._stage = msg.info.stage;
            this._haveSec = msg.info.have_sec || 0;
            if (this._chipIdx == -1) {
                this._chipIdx = WalletManager.getCurrencyBetIndex();
            }
            MessageSender.SendMessage(sevenupdown.Message.MsgGetPercentReq, { desk_id: this._deskId });
            return false;
        }
        if (msgType == sevenupdown.Message.MsgGetPercentRsp) {
            const msg = data as sevenupdown.MsgGetPercentRsp;
            if (msg.percents) {
                this.Probability = msg.percents;
            }
            return true;
        }
        if (msgType == baccarat.Message.MsgBaccaratNextStageNtf) {
            const msg = data as baccarat.MsgBaccaratNextStageNtf;
            this._stage = msg.stage;
            this._haveSec = msg.have_sec || 0;
            this._dur = msg.have_sec || 0;
            if (msg.stage == baccarat.DeskStage.SettleStage) return false;
            this.View?.updateGameStage();
            return true;
        }
        if (msgType == baccarat.Message.MsgBaccaratOnlineNtf) {
            //房间在线玩家数量刷新
            this.Online = data.online_sum || 0;
            return true;
        }
        return false;
    }

    /**----------------游戏状态相关-------------------*/
    /** 
     * 当前状态
     */
    private static _stage: number = -1;
    /** 
     * 当前阶段剩余时间，单位是秒
     */
    private static _haveSec: number = 0;
    /** 
     * 当前阶段持续时间，单位是秒
     */
    private static _dur: number;
    /**----------------玩家数据相关-------------------*/
    /**
     * 当前桌子的ID
     */
    private static _deskId: number = -1;
    /**
    * 当前玩家的ID
    */
    private static _chipIdx: number = -1;//筹码默认选择
    private static _odds: string[] = [];//倍率
    private static _playerId: number = -1;//玩家名字id
    private static _headId: number = 1;//头像
    private static _records: sevenupdown.SUDSevenUpDownWinType[] | null = null;//当前所有的开奖记录
    private static _probability: number[] = [0, 0, 0];
    private static _online: number = 0;//实时在线人数
    /**----------------绑定界面-------------------*/
    private static _view: IPanelSevenUpSevenDownMainView | null = null;
    public static set ChipIdx(value: number) {
        this._chipIdx = value;
    }
    public static set Probability(value: number[]) {
        this._probability = value;
        Global.sendMsg(GameEvent.UPDATE_HISTORY_PROBABILITY);
    }
    public static set Online(value: number) {
        Global.sendMsg(GameEvent.UPDATE_ONLINE);
        this._online = value;
    }
    public static set View(value: IPanelSevenUpSevenDownMainView | null) {
        this._view = value;
    }

    public static get HaveSec(): number { return this._haveSec; }
    public static get Stage(): number { return this._stage; }
    public static get Dur(): number { return this._dur; }
    public static get ChipIdx(): number { return this._chipIdx; }
    public static get Odds(): string[] { return this._odds; }
    public static get PlayerId(): number { return this._playerId; }
    public static get HeadId(): number { return this._headId; }
    public static get Records(): sevenupdown.SUDSevenUpDownWinType[] | null { return this._records; }
    public static get Probability(): number[] { return this._probability; }
    public static get Online(): number { return this._online; }
    public static get View(): IPanelSevenUpSevenDownMainView | null { return this._view; }

    /**
     * 重置所有数据
     */
    public static reset() {

    }

    /**
     * 对倒计时进行减法
     * @param value 
     */
    public static minusHaveSec(value: number) {
        this._haveSec -= value;
        if (this._haveSec < 0) {
            this._haveSec = 0;
        }
        return this._haveSec;
    }
}


