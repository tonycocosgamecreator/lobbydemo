import { _decorator, Component, Node } from 'cc';
import BaseManager from '../core/manager/base-manager';
import UIHelper from '../network/helper/ui-helper';
import WalletManager from './wallet-manager';
import { IPanelJmMainView } from '../define/ipanel-jm-main-view';
import { MessageSender } from '../network/net/message-sender';
import { Global } from '../global';
import { BetPoint, GameEvent } from '../define';
import { LocalStorageManager } from './localstorage-manager';

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
            this._deskId = msg.info.desk_id || 0;
            //设置钱包数据
            WalletManager.walletInfos = msg.wallets || [];
            //设置玩家的下注数据
            WalletManager.bets = msg.info.bets;
            //设置玩家的下注数据
            Global.sendMsg(GameEvent.UPDATE_BET_CHOOSE);
            //设置玩家的id
            this.playerId = msg.player_id || 0;
            //设置期号
            this.period = msg.info.period_id || '';
            //设置当前游戏每个阶段的持续时间
            this._dur = msg.info.stage_total_time;
            //更新下注数据
            this._myBets = msg.my?.bets || [];
            let _totalBet = 0;
            for (let i = 0; i < this._myBets.length; i++) {
                const bet = this._myBets[i];
                _totalBet += parseFloat(bet.bet_coin || '0');
            }
            this.totalBet = _totalBet;
            //@todo : 需要设置其他数据
            MessageSender.SendMessage(jmbaccarat.Message.MsgRecordDetailReq, { desk_id: this._deskId });
            if (msg.info.stage == jmbaccarat.DeskStage.ReadyStage) {
                LocalStorageManager.remove(BetPoint);
            } else {
                if (this._myBets.length) {
                    let point = LocalStorageManager.load(BetPoint, []);
                    if (point.length == this._myBets.length) {
                        Global.sendMsg(GameEvent.RECOVER_CHIP);
                    } else {
                        LocalStorageManager.remove(BetPoint);
                    }
                }
            }
            //更新阶段
            this.updateStage(msg.info.stage, msg.info.have_sec || 0, true);
            return false;
        }
        if (msgType == jmbaccarat.Message.MsgRecordDetailAck) {
            const msg = data as jmbaccarat.MsgRecordDetailAck;
            //开奖记录
            this.records = msg || null;
            return false;
        }
        if (msgType == jmbaccarat.Message.MsgBaccaratNextStageNtf) {
            //收到状态变化的通知
            const msg = data as jmbaccarat.MsgBaccaratNextStageNtf;
            const stage = msg.stage;
            const haveSec = msg.have_sec || 0;
            this._dur = msg.have_sec || 0;
            if (stage == jmbaccarat.DeskStage.ReadyStage) {
                LocalStorageManager.remove(BetPoint);
                this._myBets = [];
                this.totalBet = 0;
                const period_id = msg.period_id || '';
                this.period = period_id;
            }
            if (stage == jmbaccarat.DeskStage.SettleStage) {
                return;
            }
            //更新阶段
            this.updateStage(stage, haveSec);
            return false;
        }
        if (msgType == jmbaccarat.Message.MsgBetBaccaratRsp) {
            const msg = data as jmbaccarat.MsgBetBaccaratRsp;
            const result = msg.result;
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
            this.totalBet = _totalBet;
            this._view?.flyChip()
            return false;
        }
        if (msgType == jmbaccarat.Message.MsgOddNtf) {
            const msg = data as jmbaccarat.MsgOddNtf;
            this._odd = msg.odd_string || [];
            let show = false;
            this._odd.forEach((t, idx) => {
                if (t && +t[idx]) {
                    show = true;
                }
            })
            if (show) {
                this._view?.doubleArea()
            }
            return false;
        }
        if (msgType == jmbaccarat.Message.MsgSettleNtf) {
            //如果是结算通知
            const msg = data as jmbaccarat.MsgSettleNtf;
            this._openPos = msg.open_pos || [];
            if (msg.open_pos) {
                //新增结果
                MessageSender.SendMessage(jmbaccarat.Message.MsgRecordDetailReq, { desk_id: this._deskId });
                if (data.win_data && data.win_data.new_coin) {
                    WalletManager.updatePlayerCoin(parseFloat(data.win_data.new_coin));
                }
                this.totalBet = 0;
            } else {
                //如果没有结果数据，说明是结算失败了
                console.error(`Settle Failed: result_data is null`);
            }
            this.view?.showSettleResult();
            return false;

        }
        return false;
    }
    public static _odd: string[] = [];
    public static get odd(): string[] {
        return this._odd;
    }

    public static _openPos: number[] = [];
    public static get openPos(): number[] {
        return this._openPos;
    }
    /**
    * 当前桌子的ID
    */
    public static _deskId: number = -1;
    /**
     * 当前玩家的ID
     */
    public static playerId: number = -1;
    /**
     * 当前期号
     */
    public static _period: string = '';
    /**
     * 当前玩家的总投注额度
     */
    protected static _totalBet: number = 0;
    /**
    * 当前所有的开奖记录
    */
    protected static _records: jmbaccarat.MsgRecordDetailAck = null;

    protected static _myBets: jmbaccarat.BetData[] = [];

    public static get MyData(): jmbaccarat.BetData[] {
        return this._myBets;
    }
    public static get deskId(): number {
        return this._deskId;
    }
    protected static set totalBet(value: number) {
        this._totalBet = value;
        Global.sendMsg(GameEvent.PLYER_TOTAL_BET_UPDATE);
    }
    public static get totalBet(): number {
        return this._totalBet;
    }
    /**
     * 设置当前的期号
     * @param value 
     */
    public static set period(value: string) {
        this._period = value;
        Global.sendMsg(GameEvent.PLAYER_PERIOD_UPDATE);
    }
    /**
    * 获取当前的期号
    */
    public static get period(): string {
        return this._period;
    }
    /**
     * 获取开奖记录
     */
    public static get records(): jmbaccarat.MsgRecordDetailAck {
        return this._records;
    }
    /**
     * 设置开奖记录
     * @param value 
     */
    public static set records(value: jmbaccarat.MsgRecordDetailAck) {
        this._records = value;
        Global.sendMsg(GameEvent.UPDATE_HISTORY);
    }

    protected static _view: IPanelJmMainView | null = null;
    public static get view(): IPanelJmMainView | null {
        return this._view;
    }
    public static set view(value: IPanelJmMainView | null) {
        this._view = value;
    }


    protected static _stage: number = -1;
    protected static _haveSec: number = 0;
    public static get stage(): number {
        return this._stage;
    }
    /**
     * 获取当前阶段剩余时间
     */
    public static get haveSec(): number {
        return this._haveSec;
    }

    public static set haveSec(value: number) {
        this._haveSec = value;
    }
    /**
     * 对倒计时进行减法
     * @param value 
     * @returns 
     */
    public static minusHaveSec(value: number) {
        this._haveSec -= value;
        if (this._haveSec < 0) {
            this._haveSec = 0;
        }
        return this._haveSec;
    }
    /**
     * 当前游戏，每个阶段的持续时间
     * 这个数据是从服务器获取的，单位是秒
     */
    protected static _dur: number;
    /**
     * 获取当前阶段的持续时间
     * @param value 
     */
    public static getDur(): number {
        return this._dur;
    }
    /**
     * 更新阶段
     * @param value 阶段
     * @param haveSec 剩余时间
     */
    public static updateStage(value: jmbaccarat.DeskStage, haveSec: number = 0, reconnect: boolean = false) {
        this._stage = value;
        this._haveSec = haveSec;
        //通知界面更新阶段
        this.view?.stageChanged(reconnect);
    }

}


