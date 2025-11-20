import { _decorator, Component, Node } from 'cc';
import BaseManager from '../core/manager/base-manager';
import UIHelper from '../network/helper/ui-helper';
import WalletManager from './wallet-manager';
import { IPanelJmMainView } from '../define/ipanel-jm-main-view';
import { MessageSender } from '../network/net/message-sender';
import { Global } from '../global';
import { BetPoint, GameEvent } from '../define';
import { LocalStorageManager } from './localstorage-manager';
import { Vec3 } from 'cc';
import I18nManager from '../core/manager/i18n-manager';

export enum GameState {
    IDLE = 'idle',          // 空闲状态，游戏未开始
    DEALER_SHAKING = 'dealer_shaking',  // 荷官摇骰子动画阶段
    BETTING = 'betting',     // 下注阶段
    BET_LOCKED = 'bet_locked', // 停止下注
    RANDOMLY_DOUBLE = 'Randomly_double', // 随机翻倍区域
    RESULT = 'result'        // 结果显示阶段
}
export default class JmManager extends BaseManager {
    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'JmManager';
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
        if (msgType == jmbaccarat.Message.MsgEnterBaccaratRsp) {
            //进入游戏的响应
            const msg = data as jmbaccarat.MsgEnterBaccaratRsp;
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
            //设置钱包数据
            WalletManager.walletInfos = msg.wallets || [];
            //设置玩家的下注数据
            WalletManager.bets = msg.info.bets;
            //设置玩家的下注数据
            Global.sendMsg(GameEvent.UPDATE_BET_CHOOSE);
            //设置玩家的id
            this._playerId = msg.player_id || 0;
            //设置期号
            this.Period = msg.info.period_id || '';
            //设置当前游戏每个阶段的持续时间
            this._dur = msg.info.stage_total_time;
            //更新下注数据
            this._myBets = msg.my?.bets || [];
            //翻倍数据
            this.Odd = msg.info.odds || [];
            let _totalBet = 0;
            for (let i = 0; i < this._myBets.length; i++) {
                const bet = this._myBets[i];
                _totalBet += parseFloat(bet.bet_coin || '0');
            }
            this.TotalBet = _totalBet;
            //@todo : 需要设置其他数据
            this._stage = msg.info.stage;
            this._haveSec = msg.info.have_sec || 0;
            //请求开奖记录
            MessageSender.SendMessage(jmbaccarat.Message.MsgRecordDetailReq, { desk_id: this._deskId });
            this.checkChipPosData();
            if (msg.info.stage == jmbaccarat.DeskStage.SettleStage) {
                this._openPos = msg.info.records ? msg.info.records[msg.info.records.length - 1].luck_id : [];
            }
            //更新阶段
            this.View?.reconnect();
            return false;
        }
        if (msgType == jmbaccarat.Message.MsgRecordDetailAck) {
            const msg = data as jmbaccarat.MsgRecordDetailAck;
            //开奖记录
            this.Records = msg || null;
            return false;
        }
        if (msgType == jmbaccarat.Message.MsgBaccaratNextStageNtf) {
            //收到状态变化的通知
            const msg = data as jmbaccarat.MsgBaccaratNextStageNtf;
            this._stage = msg.stage;
            this._haveSec = msg.have_sec || 0;
            this._dur = msg.have_sec || 0;
            if (this._stage == jmbaccarat.DeskStage.ReadyStage) {
                LocalStorageManager.remove(BetPoint);
                this.reset()
                const period_id = msg.period_id || '';
                this.Period = period_id;
            }
            this._id = -1;
            if (msg.stage == jmbaccarat.DeskStage.SettleStage) return false;
            this.View?.stageChanged();
            return false;
        }
        if (msgType == jmbaccarat.Message.MsgBetBaccaratRsp) {
            const msg = data as jmbaccarat.MsgBetBaccaratRsp;
            const result = msg.result;
            this._id++;
            if (result && result.err_code != commonrummy.RummyErrCode.EC_SUCCESS) {
                //如果有错误码，说明下注失败了
                //这里可以弹出提示框，提示玩家下注失败
                console.error(`Bet Failed: ${result.err_desc}`);
                UIHelper.showToastId(resourcesDb.I18N_RESOURCES_DB_INDEX.TIP_AB_BET_FAILED);
                return true; //拦截消息，不继续传递
            }
            const new_coin = msg.new_coin || '0';
            const bets = msg.bets || [];
            //更新客户端下注金币
            WalletManager.updatePlayerCoin(parseFloat(new_coin));
            //更新下注数据
            let _totalBet = this._totalBet
            for (let i = 0; i < bets.length; i++) {
                const bet = bets[i];
                _totalBet += parseFloat(bet.bet_coin || '0');
                this._myBets.push(bet);
            }
            this.TotalBet = _totalBet;
            this._view?.flyChip(this._id)
            return false;
        }
        if (msgType == jmbaccarat.Message.MsgOddNtf) {
            const msg = data as jmbaccarat.MsgOddNtf;
            this.Odd = msg.odd_string || [];
            return false;
        }
        if (msgType == jmbaccarat.Message.MsgSettleNtf) {
            //如果是结算通知
            const msg = data as jmbaccarat.MsgSettleNtf;
            this._openPos = msg.open_pos || [];
            this._winType = msg.win_type || [];
            this._winCoin = +msg.win_data?.win_coin || 0;
            if (msg.open_pos) {
                //新增结果
                MessageSender.SendMessage(jmbaccarat.Message.MsgRecordDetailReq, { desk_id: this._deskId });
                if (data.win_data && data.win_data.new_coin) {
                    WalletManager.updatePlayerCoin(parseFloat(data.win_data.new_coin));
                }
            } else {
                //如果没有结果数据，说明是结算失败了
                console.error(`Settle Failed: result_data is null`);
            }
            this.View?.stageChanged();
            return false;
        }
        if (msgType == jmbaccarat.Message.MsgBetBaccaratNtf) {
            const msg = data as jmbaccarat.MsgBetBaccaratNtf;
            if (msg.desk_id != this._deskId) return false;
            this._view?.flyOtherChip(msg.players || []);
            return false;
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
    private static _playerId: number = -1;
    /**
     * 当前期号
     */
    private static _period: string = '';
    /**
     * 当前玩家的总投注额度
     */
    private static _totalBet: number = 0;

    /**----------------游戏结果相关-------------------*/
    /**
     * 赢的金币数
     */
    private static _winCoin: number = 0;
    /**
     * 下注区域赔率
     */
    private static _odd: string[] = [];
    /**
     * 本局是否有翻倍
     */
    private static _double: boolean = false;
    /**
     * 开牌点数
     */
    private static _openPos: number[] = [];
    /**
     * 玩家赢奖区域数据
     */
    private static _winType: number[] = [];
    /**
     * 玩家下筹码顺序
     */
    private static _id: number = 0;
    /**----------------下注数据相关-------------------*/
    /**
     * 当前所有的开奖记录
     */
    private static _records: jmbaccarat.MsgRecordDetailAck | null = null;
    /**
     * 本局玩家的下注数据
     */
    private static _myBets: jmbaccarat.BetData[] = [];

    /**----------------绑定界面-------------------*/
    private static _view: IPanelJmMainView | null = null;


    public static get WinCoin(): number { return this._winCoin; }
    public static get Odd(): string[] { return this._odd; }
    public static get Double(): boolean { return this._double; }
    public static get OpenPos(): number[] { return this._openPos; }
    public static get WinType(): number[] { return this._winType; }
    public static get PlayerId(): number { return this._playerId; }
    public static get MyBets(): jmbaccarat.BetData[] { return this._myBets; }
    public static get DeskId(): number { return this._deskId; }
    public static get TotalBet(): number { return this._totalBet; }
    public static get Period(): string { return this._period; }
    public static get Records(): jmbaccarat.MsgRecordDetailAck | null { return this._records; }
    public static get View(): IPanelJmMainView | null { return this._view; }
    public static get Stage(): number { return this._stage; }
    public static get HaveSec(): number { return this._haveSec; }
    public static get Dur(): number { return this._dur; }

    public static set Odd(value: string[]) {
        this._odd = value;
        for (let i = 0; i < this._odd.length; i++) {
            if (this._odd[i] && +this._odd[i]) {
                this._double = true;
            }
        }
    }

    public static set TotalBet(value: number) {
        this._totalBet = value;
        Global.sendMsg(GameEvent.PLYER_TOTAL_BET_UPDATE);
    }

    public static set Period(value: string) {
        this._period = value;
        Global.sendMsg(GameEvent.PLAYER_PERIOD_UPDATE);
    }

    public static set Records(value: jmbaccarat.MsgRecordDetailAck) {
        this._records = value;
        Global.sendMsg(GameEvent.UPDATE_HISTORY);
    }

    public static set View(value: IPanelJmMainView | null) {
        this._view = value;
    }

    /**----------------核心方法-------------------*/
    /**
     * 重置所有数据
     */
    public static reset() {
        this._double = false;
        this._winCoin = 0;
        this._odd = [];
        this._openPos = [];
        this._winType = [];
        this._myBets = [];
        this.TotalBet = 0;
        this._id = -1;
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
     *记录筹码位置
     * @param index 筹码类型索引
     * @param pos 筹码位置
     * @param id 筹码ID
     */
    public static storageChipPos(index: number, pos: Vec3, id: number) {
        let _data = LocalStorageManager.load(BetPoint, null);
        if (!_data) {
            _data = { key: this._period + this._playerId, idx: [] };
        }
        if (!_data.idx[id]) _data.idx[id] = [];
        _data.idx[id].push({ index: index, pos: pos });
        if (_data.idx[id].length > 20) {
            _data.idx[id].shift(); // 保持每个位置最多20个筹码
        }
        LocalStorageManager.save(BetPoint, _data);
    }

    /**
     * 检查存储在本地的筹码位置数据是否有效
     */
    public static checkChipPosData() {
        let _data = LocalStorageManager.load(BetPoint, null);
        if (_data && _data.key != this._period + this._playerId) {
            LocalStorageManager.remove(BetPoint);
        }
    }
}


