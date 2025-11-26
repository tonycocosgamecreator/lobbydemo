import { _decorator, Component, Node } from 'cc';
import BaseManager from '../core/manager/base-manager';
import UIHelper from '../network/helper/ui-helper';
import WalletManager from './wallet-manager';
import { MessageSender } from '../network/net/message-sender';
import { Global } from '../global';
import { GameEvent } from '../define';
import { IPanelSevenUpSevenDownMainView } from '../define/ipanel-sevenupsevendown-main-view';
import HttpLobbyHelper from '../network/net/http-lobby-helper';
import I18nManager from '../core/manager/i18n-manager';
const { ccclass, property } = _decorator;
export interface betInfo {
    bet_coin: string,
    bet_id: number,
    player_id: string,
    icon: number,
    win?: string
}

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
            this.reset();
            this._deskId = msg.info.desk_id || 0;
            WalletManager.walletInfos = msg.wallets || [];
            WalletManager.bets = msg.info.bets;
            this._playerId = msg.player_id + '' || '';
            this._headId = msg.player_data?.icon || 1;
            this._odds = msg.info?.seven_up_down_info?.odds || [];
            this._oddString = msg.info?.odds || [];
            this._records = msg.info?.seven_up_down_info?.win_type_list || [];
            this._haveSec = msg.info.have_sec || 0;
            this._dur = msg.info.have_sec || 0;
            this._bigWinList = msg.info?.player_rank_ntf?.ranks || [];
            if (msg.info?.bet_ntf?.desk_id == this._deskId) {
                const plays = msg.info?.bet_ntf?.players || [];
                for (let i = 0; i < plays.length; i++) {
                    const play = plays[i];
                    let isme: boolean = this._playerId == play.player_id;
                    let _betV = this._betsList.get(play.player_id) || { playid: play.player_id, win: 0, bet: 0, icon: +play.icon }
                    for (let j = 0; j < play.bets.length; j++) {
                        const bet = play.bets[j];
                        const _d = {
                            bet_coin: bet.bet_coin,
                            bet_id: bet.bet_id,
                            player_id: play.player_id,
                            icon: +play.icon,
                        }
                        _betV.bet = _betV.bet.add(+bet.bet_coin);
                        if (isme) {
                            this._myBets[bet.bet_id - 1] = this._myBets[bet.bet_id - 1].add(+bet.bet_coin);
                            this._mybetInfo.push(_d);
                            this._before[0] = _d;
                        }
                        this._totalBet[bet.bet_id - 1] = this._totalBet[bet.bet_id - 1].add(+bet.bet_coin);
                        this._allbetInfo.push(_d);
                        // if (play.is_first) {
                        //     this._firstPlayBet.add(bet.bet_id);
                        // }
                    }
                    _betV.win = _betV.win.add(+play.win_coin);
                    this._betsList.set(play.player_id, _betV);
                }
                this._lastbetInfo = [...this._mybetInfo];
            }
            if (this._chipIdx == -1) {
                this._chipIdx = WalletManager.getCurrencyBetIndex();
            }
            MessageSender.SendMessage(sevenupdown.Message.MsgGetPercentReq, { desk_id: this._deskId });
            this._stage = msg.info.stage;
            if (this._stage == baccarat.DeskStage.SettleStage) {
                let _list = msg.info?.seven_up_down_info?.win_type_list || []
                this._openPos = _list.length ? _list[_list.length - 1].win_type : [];
                let v = this._openPos[0] + this._openPos[1];
                this._winType = [v - 1];
                if (v >= 2 && v <= 6) {
                    this._winType.push(12);
                } else if (v >= 8 && v <= 12) {
                    this._winType.push(13);
                }
            }
            this._view?.updateReconnect()
            return false;
        }
        if (msgType == sevenupdown.Message.MsgBetSevenUpDownRsp) {
            const msg = data as sevenupdown.MsgBetSevenUpDownRsp;
            const result = msg.result;
            if (result && result.err_code != commonrummy.RummyErrCode.EC_SUCCESS) {
                //如果有错误码，说明下注失败了
                //这里可以弹出提示框，提示玩家下注失败
                console.error(`Bet Failed: ${result.err_desc}`);
                UIHelper.showToastId(resourcesDb.I18N_RESOURCES_DB_INDEX.TIP_AB_BET_FAILED);
                this._order++;
                return true; //拦截消息，不继续传递
            }
            const new_coin = msg.new_coin || '0';
            const bets = msg.bets || [];
            this._before = [];
            let _betV = this._betsList.get(this._playerId) || { playid: this._playerId, win: 0, bet: 0, icon: this._headId };
            // this._betsList.delete(this._playerId)
            for (let i = 0; i < bets.length; i++) {
                const bet = bets[i];
                this._totalBet[bet.bet_id - 1] = this._totalBet[bet.bet_id - 1].add(+bet.bet_coin);
                this._myBets[bet.bet_id - 1] = this._myBets[bet.bet_id - 1].add(+bet.bet_coin);
                const _d = {
                    bet_coin: bet.bet_coin,
                    bet_id: bet.bet_id,
                    player_id: this._playerId,
                    icon: this._headId
                }
                _betV.bet = _betV.bet.add(+bet.bet_coin);
                this._betsList.set(this._playerId, _betV);
                this._bigWinList.forEach(t => {
                    if (t && t.player_id && t.player_id == this._playerId) {
                        t.balance = t.balance.sub(+bet.bet_coin);
                    }
                });
                // if (msg.is_first) {
                //     this._firstPlayBet.add(bet.bet_id);
                // }
                this._before.push(_d);
                this._allbetInfo.push(_d);
                this._order++;
                this._view?.updateflyChip(_d, true, this._order);
            }
            //更新客户端下注金币
            WalletManager.updatePlayerCoin(parseFloat(new_coin));
            return true;
        }
        if (msgType == sevenupdown.Message.MsgBetBaccaratNtf) {
            //广播玩家下注信息
            const msg = data as sevenupdown.MsgBetBaccaratNtf;
            if (msg.desk_id != this._deskId) return false;
            const plays = msg.players || [];
            if (plays && plays.length) {
                for (let i = 0; i < plays.length; i++) {
                    const play = plays[i];
                    if (this._playerId != play.player_id) {
                        let _betV = this._betsList.get(play.player_id) || { playid: play.player_id, win: 0, bet: 0, icon: +play.icon }
                        // this._betsList.delete(play.player_id)
                        for (let j = 0; j < play.bets.length; j++) {
                            const bet = play.bets[j];
                            this._totalBet[bet.bet_id - 1] = this._totalBet[bet.bet_id - 1].add(+bet.bet_coin);
                            const _d = {
                                bet_coin: bet.bet_coin,
                                bet_id: bet.bet_id,
                                player_id: play.player_id,
                                icon: +play.icon
                            }
                            _betV.bet = _betV.bet.add(+bet.bet_coin);
                            this._betsList.set(play.player_id, _betV);
                            // if (play.is_first) {
                            //     this._firstPlayBet.add(bet.bet_id);
                            // }
                            this._allbetInfo.push(_d);
                            this._bigWinList.forEach(t => {
                                if (t && t.player_id && t.player_id == play.player_id) {
                                    t.balance = t.balance.sub(+bet.bet_coin);
                                }
                            });
                            this._view?.updateflyChip(_d, false, -1);
                        }
                    }
                }
            }
            return true;
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
            if (msg.desk_id != this._deskId) return false;
            this._stage = msg.stage;
            this._haveSec = msg.have_sec || 0;
            this._dur = msg.have_sec || 0;
            if (msg.stage == baccarat.DeskStage.SettleStage) return false;
            if (msg.stage == baccarat.DeskStage.ReadyStage) {
                this.reset();
            }
            this.View?.updateGameStage();
            return true;
        }
        if (msgType == baccarat.Message.MsgBaccaratOnlineNtf) {
            //房间在线玩家数量刷新
            this.OnlineRoom = data.online_sum || 0;
            return true;
        }
        if (msgType == sevenupdown.Message.MsgCancelBetSevenUpDownRsp) {
            const msg = data as sevenupdown.MsgCancelBetSevenUpDownRsp;
            const result = msg.result;
            if (result && result.err_code != commonrummy.RummyErrCode.EC_SUCCESS) {
                //如果有错误码，说明下注失败了
                //这里可以弹出提示框，提示玩家下注失败
                console.error(`Bet Failed: ${result.err_desc}`);
                UIHelper.showToastId(resourcesDb.I18N_RESOURCES_DB_INDEX.TIP_AB_BET_FAILED);
                return true; //拦截消息，不继续传递
            }
            const new_coin = msg.new_coin || '0';
            WalletManager.updatePlayerCoin(parseFloat(new_coin));
            const bets = msg.bets || [];
            let info = []
            let _betV = this._betsList.get(this._playerId) || { playid: this._playerId, win: 0, bet: 0, icon: this._headId }
            // this._betsList.delete(this._playerId)
            for (let i = 0; i < bets.length; i++) {
                const bet = bets[i];
                this._totalBet[bet.bet_id - 1] = this._totalBet[bet.bet_id - 1].sub(+bet.bet_coin);
                this._myBets[bet.bet_id - 1] = this._myBets[bet.bet_id - 1].sub(+bet.bet_coin);
                const _d = {
                    bet_coin: bet.bet_coin,
                    bet_id: bet.bet_id,
                    player_id: this._playerId,
                    icon: this._headId
                }
                _betV.bet = _betV.bet.sub(+bet.bet_coin);
                this._betsList.set(this._playerId, _betV);
                this._bigWinList.forEach(t => {
                    if (t && t.player_id && t.player_id == this._playerId) {
                        t.balance = t.balance.add(+bet.bet_coin);
                    }
                });
                info.push(_d);
                this._view?.updateDeletChip(_d, true);
            }
            this._allbetInfo = this.removeObjectsByMultipleProps(this._allbetInfo, info, ['bet_coin', 'bet_id', 'player_id']);
            Global.sendMsg(GameEvent.PLYER_TOTAL_BET_UPDATE);
            return true
        }
        if (msgType == sevenupdown.Message.MsgCancelBetBaccaratNtf) {
            const msg = data as sevenupdown.MsgCancelBetBaccaratNtf;
            if (msg.desk_id != this._deskId) return false;
            const plays = msg.players || [];
            if (plays && plays.length) {
                let info = []
                for (let i = 0; i < plays.length; i++) {
                    const play = plays[i];
                    if (this._playerId != play.player_id) {
                        let _betV = this._betsList.get(play.player_id) || { playid: play.player_id, win: 0, bet: 0, icon: +play.icon }
                        // this._betsList.delete(play.player_id)
                        for (let j = 0; j < play.bets.length; j++) {
                            const bet = play.bets[j];
                            this._totalBet[bet.bet_id - 1] = this._totalBet[bet.bet_id - 1].add(+bet.bet_coin);
                            const _d = {
                                bet_coin: bet.bet_coin,
                                bet_id: bet.bet_id,
                                player_id: +play.player_id,
                                icon: play.icon
                            }
                            _betV.bet = _betV.bet.sub(+bet.bet_coin);
                            this._betsList.set(play.player_id, _betV);
                            this._bigWinList.forEach(t => {
                                if (t && t.player_id && t.player_id == play.player_id) {
                                    t.balance = t.balance.add(+bet.bet_coin);
                                }
                            });
                            info.push(_d);
                            this._view?.updateDeletChip(_d, false);
                        }
                    }
                }
                this._allbetInfo = this.removeObjectsByMultipleProps(this._allbetInfo, info, ['bet_coin', 'bet_id', 'player_id'])
                Global.sendMsg(GameEvent.PLYER_TOTAL_BET_UPDATE);
            }
            return true;
        }
        if (msgType == sevenupdown.Message.MsgOddNtf) {
            const msg = data as sevenupdown.MsgOddNtf;
            this._oddString = msg.odd_string || [];
            return false;
        }
        if (msgType == sevenupdown.Message.MsgSevenUpDownSettleNtf) {
            const msg = data as sevenupdown.MsgSevenUpDownSettleNtf;
            if (msg.desk_id != this._deskId) return false;
            if (msg.open_pos) {
                this._openPos = msg.open_pos;
                this.View?.updateGameStage();
            } else {
                console.error(`Settle Failed: result_data is null`);
            }
            const new_coin = msg.win_data?.new_coin || '0';
            WalletManager.updatePlayerCoin(parseFloat(new_coin), false);
            let v = msg.open_pos[0] + msg.open_pos[1];
            this._winType = [v - 1];
            if (v >= 2 && v <= 6) {
                this._winType.push(12);
            } else if (v >= 8 && v <= 12) {
                this._winType.push(13);
            }
            this._winCoin = +msg.win_data?.win_coin || 0;
            //历史记录更新
            this._records.push({ win_type: msg.open_pos, is_double: msg.is_double });
            Global.sendMsg(GameEvent.UPDATE_HISTORY);
            MessageSender.SendMessage(sevenupdown.Message.MsgGetPercentReq, { desk_id: this._deskId });
            return true;
        }
        if (msgType == sevenupdown.Message.MsgPlayerRankNtf) {
            const msg = data as sevenupdown.MsgPlayerRankNtf;
            this._bigWinList = msg.ranks || [];
            return true;
        }
        if (msgType == sevenupdown.Message.MsgLastWinNtf) {
            const msg = data as sevenupdown.MsgLastWinNtf;
            if (msg.winAmount) {
                this._winLedList.push(msg);
                Global.sendMsg(GameEvent.UPDATE_LED);
            }
            return true;
        }
        if (msgType == sevenupdown.Message.MsgAllBetBaccaratNtf) {
            //强制更新玩家下注和赢取额度
            const msg = data as sevenupdown.MsgAllBetBaccaratNtf;
            this._mybetInfo = [];
            this._allbetInfo = [];
            const plays = msg.players || [];
            if (plays && plays.length) {
                for (let i = 0; i < plays.length; i++) {
                    const play = plays[i];
                    let isme: boolean = this._playerId == play.player_id;
                    let _betV = this._betsList.get(play.player_id) || { playid: play.player_id, win: 0, bet: 0 }
                    _betV.bet = 0;
                    for (let j = 0; j < play.bets.length; j++) {
                        const bet = play.bets[j];
                        this._totalBet[bet.bet_id - 1] = this._totalBet[bet.bet_id - 1].add(+bet.bet_coin);
                        const _d = {
                            bet_coin: bet.bet_coin,
                            bet_id: bet.bet_id,
                            player_id: play.player_id,
                            icon: play.icon
                        }
                        _betV.bet = _betV.bet.add(+bet.bet_coin);
                        if (isme) {
                            this._mybetInfo.push(_d);
                        }
                        this._allbetInfo.push(_d);
                    }
                    _betV.win = +(play.win_coin);
                    this._bigWinList.forEach(t => {
                        if (t && t.player_id && t.player_id == play.player_id) {
                            t.balance = t.balance.add(+play.win_coin);
                        }
                    });
                }

            }
            this._lastbetInfo = [...this._mybetInfo];
            return true;
        }
        if (msgType == sevenupdown.Message.MsgGetRankRsp) {
            const msg = data as sevenupdown.MsgGetRankRsp;
            Global.sendMsg(GameEvent.UPDATE_RANK, msg.rank);
            return true;
        }
        if (msgType == baccarat.Message.MsgBaccaratKickOutNtf) {
            const msg = data as baccarat.MsgBaccaratKickOutNtf;
            console.warn('receive kick out ntf! === ', msg);
            const uid = msg.uid;
            if (uid == +this.PlayerId) {
                UIHelper.showConfirmOfOneButtonToRefreshBrowser(
                    I18nManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.Tip_BaccaratKickOutNtf),
                    I18nManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.Notice),
                    I18nManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.Confirm),
                );
                return true;
            }
            return true;
        }

        if (msgType == baccarat.Message.MsgBaccaratAreaUserBetsNtf) {
            const msg = data as baccarat.MsgBaccaratAreaUserBetsNtf;
            if (msg.desk_id != this._deskId) return false;
            this._betDetail = msg.bet_num;
            Global.sendMsg(GameEvent.UPDATE_ADDBET);
            return true;
        }
        return false;
    }
    /**----------------游戏状态相关-------------------*/
    /** 
     * 下注顺序
     */
    private static _order: number = -1;
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
    * 当前玩家的总投注额度
    */
    private static _myBets: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /**
    * 当前房间的总投注额度
    */
    private static _totalBet: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    /**
     * 下注区域翻倍率
     */
    private static _oddString: string[] = [];
    /**
     * 开牌点数
     */
    private static _openPos: number[] = [];
    /**
     * 赢的金币数
     */
    private static _winCoin: number = 0;
    /**
     * 玩家赢奖区域数据
     */
    private static _winType: number[] = [];
    /**
     * 自己的赢奖区域数据
     */
    // private static _myWinType: number[] = [];
    private static _chipIdx: number = -1;//筹码默认选择
    private static _odds: string[] = [];//倍率
    private static _playerId: string = '';//玩家名字id
    private static _headId: number = 1;//头像
    private static _records: sevenupdown.SUDSevenUpDownWinType[] | null = null;//当前所有的开奖记录
    private static _probability: number[] = [0, 0, 0];
    private static _online: number = 0;//实时在线人数
    private static _onlineRoom: number = 0;//房间人数
    private static _bigWinList: sevenupdown.SUDSevenUpDownRankList[] | null = null;//前三名玩家的信息
    private static _auto: boolean = false;
    private static _winLedList: sevenupdown.MsgLastWinNtf[] = [];
    // private static 
    /**----------------绑定界面-------------------*/
    private static _view: IPanelSevenUpSevenDownMainView | null = null;
    public static set ChipIdx(value: number) {
        this._chipIdx = value;
    }
    public static set HeadId(value: number) {
        this._headId = value;
        Global.sendMsg(GameEvent.PLAYER_CHANGE_AVATAR);
    }

    public static set Probability(value: number[]) {
        this._probability = value;
        Global.sendMsg(GameEvent.UPDATE_HISTORY_PROBABILITY);
    }

    public static set OnlineRoom(value: number) {
        this._onlineRoom = value;
        Global.sendMsg(GameEvent.UPDATE_ONLINE_ROOM);
    }

    public static set Online(value: number) {
        this._online = value;
        Global.sendMsg(GameEvent.UPDATE_ONLINE);
    }

    public static set Before(value: betInfo[]) {
        this._before = value;
    }
    public static set Auto(value: boolean) {
        this._auto = value;
    }

    public static set OddString(value: string[]) {
        this._oddString = value;
    }

    public static set View(value: IPanelSevenUpSevenDownMainView | null) {
        this._view = value;
    }
    public static get HaveSec(): number { return this._haveSec; }
    public static get Stage(): number { return this._stage; }
    public static get Dur(): number { return this._dur; }
    public static get DeskId(): number { return this._deskId; }
    public static get ChipIdx(): number { return this._chipIdx; }
    public static get Odds(): string[] { return this._odds; }
    public static get PlayerId(): string { return this._playerId; }
    public static get HeadId(): number { return this._headId; }
    public static get Records(): sevenupdown.SUDSevenUpDownWinType[] | null { return this._records; }
    public static get Probability(): number[] { return this._probability; }
    public static get Online(): number { return this._online; }
    public static get OnlineRoom(): number { return this._onlineRoom; }
    public static get BigWinList(): sevenupdown.SUDSevenUpDownRankList[] | null { return this._bigWinList; }
    public static get View(): IPanelSevenUpSevenDownMainView | null { return this._view; }
    public static get MyBets(): number[] { return this._myBets; }
    public static get TotalBet(): number[] { return this._totalBet; }
    public static get AllbetInfo(): betInfo[] { return this._allbetInfo; }
    public static get Before(): betInfo[] { return this._before; }
    public static get LastbetInfo(): betInfo[] { return this._lastbetInfo; }
    // public static get FirstPlayBet(): Set<number> { return this._firstPlayBet; }
    public static get OddString(): string[] { return this._oddString; }
    public static get OpenPos(): number[] { return this._openPos; }
    public static get WinLedList(): sevenupdown.MsgLastWinNtf[] { return this._winLedList; }
    public static get WinCoin(): number { return this._winCoin; }
    public static get WinType(): number[] { return this._winType; }
    public static get Auto(): boolean { return this._auto };
    public static get BetsList(): Map<string, { playid: string, win: number, bet: number, icon: number }> { return this._betsList; }
    public static get BetDetail(): baccarat.AreaUserBetsNum[] { return this._betDetail }

    /**
     * 重置所有数据
     */
    public static reset() {
        this._myBets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this._totalBet = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this._mybetInfo = [];
        this._before = [];
        this._allbetInfo = [];
        // this._firstPlayBet.clear()
        this._oddString = [];
        this._winCoin = 0;
        this._winType = [];
        this._order = -1;
        this._betsList.clear();
        this._betDetail = [];
    }

    private static _before: betInfo[] = [];//前端记录上一从下注内容
    private static _lastbetInfo: betInfo[] = [];//前端上一局下注记录
    private static _mybetInfo: betInfo[] = [];//本局自己下注记录
    private static _allbetInfo: betInfo[] = [];//本局所有人下注记录
    // private static _firstPlayBet: Set<number> = new Set;//第一名下注记录
    private static _betsList: Map<string, { playid: string, win: number, bet: number, icon: number }> = new Map();
    public static _betDetail: baccarat.AreaUserBetsNum[] = [];
    public static subtractLedList() {
        this._winLedList.splice(0, 1);
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
    public static async doGetlineNum() {
        const rsp = await HttpLobbyHelper.GetOnlineNum();
        this.Online = rsp;
    }
    public static removeObjectsByMultipleProps(arr1: betInfo[], arr2: betInfo[], matchKeys: (keyof betInfo)[]): betInfo[] {
        // 生成对象的匹配键
        const getMatchKey = (item: betInfo): string => {
            return matchKeys.map(key => item[key]).join('|');
        };

        const countMap = new Map<string, number>();
        // 统计数组2中每个匹配键的出现次数
        arr2.forEach(item => {
            const key = getMatchKey(item);
            countMap.set(key, (countMap.get(key) || 0) + 1);
        });
        // 过滤数组1中的对象
        return arr1.filter(item => {
            const key = getMatchKey(item);
            if (countMap.has(key) && countMap.get(key)! > 0) {
                countMap.set(key, countMap.get(key)! - 1);
                return false;
            }
            return true;
        });
    }
}


