import { _decorator, Component, Node } from 'cc';
import BaseManager from '../core/manager/base-manager';
import CommonManager, { betInfo } from './common-manager';
import UIHelper from '../network/helper/ui-helper';
import WalletManager from './wallet-manager';
import { MessageSender } from '../network/net/message-sender';
import { IPanelGameMainView } from '../define/ipanel-game-main-view';
import { GameEvent, THEME_ID } from '../define';
import { Vec3 } from 'cc';
import { Global } from '../global';
import I18nManager from '../core/manager/i18n-manager';
const { ccclass, property } = _decorator;


export default class GameManager extends BaseManager {
    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'GameManager';
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
        switch (msgType) {
            case game.Message.MsgEnterSevenUpDownRsp: {
                const msg = data as game.MsgEnterSevenUpDownRsp;
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
                this._period = msg.info.period_id || '';
                this._haveSec = msg.info.have_sec || 0;
                this._dur = msg.info.have_sec || 0;
                WalletManager.walletInfos = msg.wallets || [];
                WalletManager.bets = msg.info.bets;
                this._playerId = msg.player_id + '' || '';
                this._icon = msg.player_data?.icon || 1;
                this._odds = msg.info?.seven_up_down_info?.odds || [];
                this._multiple = msg.info?.odds || [];
                this._records = msg.info?.seven_up_down_info?.win_type_list || [];
                CommonManager.setTopPlayerData(msg.info?.player_rank_ntf?.ranks || []);
                CommonManager.setLuckPlayerData(msg.info?.player_rank_ntf?.ranks_rate || []);
                const plays = msg.info?.bet_ntf?.players || [];
                for (let i = 0; i < plays.length; i++) {
                    const play = plays[i];
                    for (let j = 0; j < play.bets.length; j++) {
                        const bet = play.bets[j];
                        const _d = {
                            bet_coin: bet.bet_coin,
                            bet_id: bet.bet_id,
                            player_id: play.player_id,
                            icon: play.icon,
                            win: j == 0 ? +play.win_coin : 0,
                        }
                        this.addPlayerData(_d);
                        this._betOrderIcon.push(+play.icon);
                    }
                }
                MessageSender.SendMessage(game.Message.MsgGetPercentReq, { desk_id: this._deskId });
                this._stage = msg.info.stage;
                if (this._stage == baccarat.DeskStage.SettleStage) {
                    this._winType = this._records[this._records.length - 1].win_type || [];
                    this.setWinAreaByType(this._winType);
                }
                this._view?.updateReconnect();
                return false;
            }
            case game.Message.MsgGetPercentRsp: {
                const msg = data as game.MsgGetPercentRsp;
                if (msg.percents) {
                    this._probability = msg.percents;
                    Global.sendMsg(GameEvent.UPDATE_HISTORY_PROBABILITY);
                }
                return true;
            }
            case baccarat.Message.MsgBaccaratNextStageNtf: {
                const msg = data as baccarat.MsgBaccaratNextStageNtf;
                if (msg.desk_id != this._deskId) return false;
                this._stage = msg.stage;
                this._haveSec = msg.have_sec || 0;
                this._dur = msg.have_sec || 0;
                if (msg.stage == baccarat.DeskStage.SettleStage)
                    return true;
                if (msg.stage == baccarat.DeskStage.ReadyStage) {
                    this.reset();
                    CommonManager.Agail = false;
                }
                this.View?.updateGameStage();
                return true;
            }
            case game.Message.MsgBetSevenUpDownRsp: {
                const msg = data as game.MsgBetSevenUpDownRsp;
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
                WalletManager.updatePlayerCoin(parseFloat(new_coin));
                const bets = msg.bets || [];
                for (let i = 0; i < bets.length; i++) {
                    const bet = bets[i];
                    const _d = {
                        bet_coin: bet.bet_coin,
                        bet_id: bet.bet_id,
                        player_id: this._playerId,
                        icon: this._icon,
                        win: 0
                    }
                    this.addPlayerData(_d);
                    this._betOrderIcon.push(this._icon);
                    CommonManager.addTopPlayerScore(this._playerId, -bet.bet_coin)
                    this._order++;
                    this._view?.updateflyChip(_d, this._order);
                }
                return true;
            }
            case game.Message.MsgBetBaccaratNtf: {
                const msg = data as game.MsgBetBaccaratNtf;
                if (msg.desk_id != this._deskId) return false;
                const plays = msg.players || [];
                for (let i = 0; i < plays.length; i++) {
                    const play = plays[i];
                    if (this._playerId != play.player_id) {
                        const bets = play.bets;
                        for (let j = 0; j < bets.length; j++) {
                            const bet = bets[j];
                            const _d = {
                                bet_coin: bet.bet_coin,
                                bet_id: bet.bet_id,
                                player_id: play.player_id,
                                icon: play.icon,
                                win: 0
                            }
                            this.addPlayerData(_d);
                            this._betOrderIcon.push(play.icon);
                            CommonManager.addTopPlayerScore(play.player_id, -bet.bet_coin)
                            this._view?.updateflyChip(_d, -1);
                        }
                    }
                }
                return true;
            }
            case game.Message.MsgCancelBetSevenUpDownRsp: {
                const msg = data as game.MsgCancelBetSevenUpDownRsp;
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
                for (let i = 0; i < bets.length; i++) {
                    const bet = bets[i];
                    const _d = {
                        bet_coin: bet.bet_coin,
                        bet_id: bet.bet_id,
                        player_id: this._playerId,
                        icon: this.Icon,
                        win: 0,
                    }
                    CommonManager.addTopPlayerScore(this._playerId, +bet.bet_coin)
                    this.subPlayerData(_d)
                    this._view?.updateDeletChip(_d, true);
                }
                Global.sendMsg(GameEvent.ANIMATION_END_UPDATE);
                return true;
            }
            case game.Message.MsgCancelBetBaccaratNtf: {
                const msg = data as game.MsgCancelBetBaccaratNtf;
                if (msg.desk_id != this._deskId) return false;
                const plays = msg.players || [];
                for (let i = 0; i < plays.length; i++) {
                    const play = plays[i];
                    if (this._playerId != play.player_id) {
                        for (let j = 0; j < play.bets.length; j++) {
                            const bet = play.bets[j];
                            const _d = {
                                bet_coin: bet.bet_coin,
                                bet_id: bet.bet_id,
                                player_id: play.player_id,
                                icon: play.icon,
                                win: 0
                            }
                            CommonManager.addTopPlayerScore(play.player_id, +bet.bet_coin)
                            this.subPlayerData(_d)
                            this._view?.updateDeletChip(_d, false);
                        }
                    }
                }
                return true;
            }
            case game.Message.MsgOddNtf: {
                const msg = data as game.MsgOddNtf;
                this._multiple = msg.odd_string || [];
                return true;
            }
            case game.Message.MsgAllBetBaccaratNtf: {
                const msg = data as game.MsgAllBetBaccaratNtf;
                this.clearPlayerData();
                const plays = msg.players || [];
                if (plays && plays.length) {
                    for (let i = 0; i < plays.length; i++) {
                        const play = plays[i];
                        for (let j = 0; j < play.bets.length; j++) {
                            const bet = play.bets[j];
                            const _d = {
                                bet_coin: bet.bet_coin,
                                bet_id: bet.bet_id,
                                player_id: play.player_id,
                                icon: play.icon,
                                win: j == 0 ? +(play.win_coin) : 0
                            }
                            this.addPlayerData(_d);
                            CommonManager.addTopPlayerScore(play.player_id, +play.win_coin);
                        }
                    }
                }
                return true;
            }
            case game.Message.MsgSevenUpDownSettleNtf: {
                const msg = data as game.MsgSevenUpDownSettleNtf;
                if (msg.desk_id != this._deskId) return false;
                const new_coin = msg.win_data?.new_coin || '0';
                WalletManager.updatePlayerCoin(parseFloat(new_coin), false);
                this._records.push({ win_type: msg.open_pos, is_double: msg.is_double });
                this._winType = msg.open_pos;
                this.setWinAreaByType(this._winType);
                CommonManager.LastbetInfo = this.getBetInfoByPlayId();
                MessageSender.SendMessage(game.Message.MsgGetPercentReq, { desk_id: this._deskId });
                this.View?.updateGameStage();
                return true;
            }
            case baccarat.Message.MsgBaccaratKickOutNtf: {
                const msg = data as baccarat.MsgBaccaratKickOutNtf;
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
     * 当前期号
     */
    private static _period: string = '';
    /**
     * 当前桌子的ID
     */
    private static _deskId: number = -1;
    /**
     * 历史记录
     */
    private static _records: game.SUDSevenUpDownWinType[] | null = null;
    /**
     * 历史胜率百分比
     */
    private static _probability: number[] | null = [0, 0, 0]
    /**
     * 玩家playerId
     */
    private static _playerId: string = '';
    /**
     * 玩家icon
     */
    private static _icon: number = 1;
    /**
     * 每个区域的赔率比
     */
    private static _odds: string[] = [];
    /**
     * 每个区域的翻倍数
     */
    private static _multiple: string[] = [];
    /**
     * 当局玩家下注记录分数//记录排行榜用的
     */
    private static _allPlayerBetInfo: Map<string, betInfo[]> = new Map();
    /**
     * 当局玩家下注记录
     */
    private static _allAreaBetInfo: Map<number, betInfo[]> = new Map();
    /**
     * 按下注顺序展示的玩家头像
     */
    private static _betOrderIcon: number[] = [];
    /**
     * 开牌点数
     */
    private static _winType: number[] = [];
    /**
     * 玩家赢奖区域数据
     */
    public static _winArea: number[] = [];
    /** 
     * 下注顺序
     */
    private static _order: number = -1;
    /** 
     * 自己下注位置记录
     */
    private static _tagetWorldPos: Vec3[] = [];
    /**----------------绑定界面-------------------*/
    private static _view: IPanelGameMainView | null = null;

    public static get Stage(): number { return this._stage; }
    public static get HaveSec(): number { return this._haveSec; }
    public static get Dur(): number { return this._dur; }
    public static get DeskId(): number { return this._deskId; }
    public static get Period(): string { return this._period; }
    public static get Records(): game.SUDSevenUpDownWinType[] | null { return this._records; }
    public static get Probability(): number[] { return this._probability; }
    public static get PlayerId(): string { return this._playerId; }
    public static get Icon(): number { return this._icon; }
    public static get Odds(): string[] { return this._odds; }
    public static get Multiple(): string[] { return this._multiple; }
    public static get BetOrderIcon(): number[] { return this._betOrderIcon; }
    public static get WinType(): number[] { return this._winType; }
    public static get WinArea(): number[] { return this._winArea; }
    public static get View(): IPanelGameMainView | null { return this._view; }


    public static set View(value: IPanelGameMainView | null) {
        this._view = value;
    }
    public static set Icon(value: number) {
        this._icon = value;
    };

    public static reset() {
        this.clearPlayerData();
        this._betOrderIcon = [];
        this._multiple = [];
        this._winArea = [];
        this._winType = [];
        this._order = -1;
        this._tagetWorldPos = [];
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


    /**
     * 添加玩家下注数据
     * @param  
     */
    public static addPlayerData(betInfo: betInfo) {
        let playerData = this._allPlayerBetInfo.get(betInfo.player_id);
        if (!playerData) {
            playerData = [];
        }
        playerData.push(betInfo);
        this._allPlayerBetInfo.set(betInfo.player_id, playerData);
        let areaData = this._allAreaBetInfo.get(betInfo.bet_id);
        if (!areaData) {
            areaData = [];
        }
        areaData.push(betInfo);
        this._allAreaBetInfo.set(betInfo.bet_id, areaData);
    }

    /**
     * 删除玩家下注数据
     * @param  
     */
    public static subPlayerData(betInfo: betInfo) {
        let playerData = this._allPlayerBetInfo.get(betInfo.player_id);
        if (playerData) {
            for (let i = playerData.length - 1; i >= 0; i--) {
                const bet = playerData[i];
                if (bet.bet_coin === betInfo.bet_coin &&
                    bet.bet_id === betInfo.bet_id) {
                    playerData.splice(i, 1);
                    if (playerData.length == 0) {
                        this._allPlayerBetInfo.delete(betInfo.player_id)
                    } else {
                        this._allPlayerBetInfo.set(betInfo.player_id, playerData);
                    }
                    break;
                }
            }
        }
        let areaData = this._allAreaBetInfo.get(betInfo.bet_id);
        if (areaData) {
            for (let i = areaData.length - 1; i >= 0; i--) {
                const bet = areaData[i];
                if (bet.bet_coin === betInfo.bet_coin &&
                    bet.bet_id === betInfo.bet_id) {
                    areaData.splice(i, 1);
                    if (areaData.length == 0) {
                        this._allAreaBetInfo.delete(betInfo.bet_id)
                    } else {

                        this._allAreaBetInfo.set(betInfo.bet_id, areaData);
                    }
                    break;
                }
            }
        }
    }

    public static clearPlayerData() {
        this._allPlayerBetInfo.clear();
        this._allAreaBetInfo.clear();
    }

    /**
     * 查找对应id玩家下注的所有数据
     * @param playerId 玩家id,默认为自己的id
     */
    public static getBetInfoByPlayId(playerId: string = this._playerId): betInfo[] {
        return this._allPlayerBetInfo.get(playerId) || [];
    }

    /**
     * 查找所有玩家下注的数据
     */
    public static getBetInfoByPlay(): betInfo[][] {
        return Array.from(this._allPlayerBetInfo.values());
    }

    /**
     * 查找对应区域玩家下注的所有数据
     * @param betId 区域id
     */
    public static getBetInfoByArea(betId: number) {
        return this._allAreaBetInfo.get(betId) || [];
    }

    public static getAllBetValue(): number {
        const data = Array.from(this._allPlayerBetInfo.values());
        let allbet = 0;
        for (const bet of data) {
            for (const value of bet) {
                allbet = allbet.add(+value.bet_coin);
            }
        }
        return allbet;
    }

    /**
     * 查找对应id玩家赢取的金额
     * @param playerId 玩家id,默认为自己的id
     */
    public static getWinByPlayId(playerId: string = this._playerId): number {
        let win = 0;
        const data = this.getBetInfoByPlayId(playerId);
        if (!data || data.length == 0) {
            return win;
        }
        data.forEach(v => {
            if (v.win > 0) {
                win = win.add(v.win);
            }
        });
        return win;
    }

    public static setWinAreaByType(WinType: number[]) {
        let v = WinType[0] + WinType[1];
        this._winArea = [];
        this._winArea.push(v - 1);
        if (v >= 2 && v <= 6) {
            this._winArea.push(12);
        } else if (v >= 8 && v <= 12) {
            this._winArea.push(13);
        }
    }

    /**
   * 下注--自动下注 双倍下注按钮
   */
    public static sendBetMessage(bets: game.SUDBetData[], gold: number, isAuto: boolean = false, tagetWorldPos: Vec3[] | null) {
        const myCoin = WalletManager.balance;
        if (gold > myCoin) {
            UIHelper.showMoneyNotEnough();
            if (isAuto) CommonManager.Auto = false;
            return;
        }
        this._tagetWorldPos = this._tagetWorldPos.concat(tagetWorldPos);
        const BetSevenUpDownReq: game.MsgBetSevenUpDownReq = {
            theme_id: THEME_ID,
            /**  桌子ID */
            desk_id: this._deskId,
            /**  下注列表 */
            bets: bets,
        }
        MessageSender.SendMessage(game.Message.MsgBetSevenUpDownReq, BetSevenUpDownReq);
    }

    public static sendMyBetMessage(idx: number, tagetWorldPos: Vec3) {
        if (this._stage != baccarat.DeskStage.StartBetStage) return;
        const myCoin = WalletManager.balance;
        let gold = WalletManager.getCurrencyBetGold();
        if (gold > myCoin) {
            UIHelper.showMoneyNotEnough();
            return;
        }
        const BetSevenUpDownReq: game.MsgBetSevenUpDownReq = {
            theme_id: THEME_ID,
            /**  桌子ID */
            desk_id: this._deskId,
            /**  下注列表 */
            bets: [{ bet_id: idx, bet_coin: gold + '', is_rebet: false }],
        }
        this._tagetWorldPos.push(tagetWorldPos);
        MessageSender.SendMessage(game.Message.MsgBetSevenUpDownReq, BetSevenUpDownReq);
    }

    public static getFlyChipClickWorldPos(order: number): Vec3 | null {
        let _wordPos = this._tagetWorldPos[order];
        return _wordPos || null;
    }
}


