import { _decorator, Component, Node } from 'cc';
import BaseManager from '../core/manager/base-manager';
import { IPanelSuperSevenMainView } from '../define/ipanel-ss-main-view';
import { Global } from '../global';
import { GameEvent } from '../define';
import Formater from '../core/utils/formater';
import WalletManager from './wallet-manager';
import { SpriteAtlas } from 'cc';
import { resources } from 'cc';
import { SpriteFrame } from 'cc';
import { Sprite } from 'cc';
const { ccclass, property } = _decorator;

export enum gameType {
    /**默认状态 */
    none,
    /**免费 */
    free,
    /**付费 */
    pay
}

export enum gameState {

}
export default class SuperSevenManager extends BaseManager {
    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'SuperSevenManager';
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
        if (msgType == supersevenbaccarat.Message.MsgGameSpinAck) {
            const msg = data as supersevenbaccarat.MsgGameSpinAck;
            console.log(data, '--------------')
            //更新客户端下注金币
            WalletManager.updatePlayerCoin(msg.own_gold);
        }
        return false;
    }
    /**----------------游戏结果相关-------------------*/
    /**下注档次 */
    private static _bets: number[] = [];
    /**是否是自动下注 */
    private static _auto: boolean = false;
    /**当前游戏状态 */
    private static _state: gameState = null;
    /**当前转动倍数 */
    private static _times: number = 1;
    /**当前下注金额 */
    private static _betCoin: number = 1;
    /**游戏玩家信息 */
    private static _playInfo: supersevenbaccarat.PlayerInfo | null = null;
    /**是否是免费游戏 */
    private static _free: boolean = false;


    /**----------------绑定界面-------------------*/
    private static _view: IPanelSuperSevenMainView | null = null;


    public static set BetCoin(value: number) {
        this._betCoin = value;
        Global.sendMsg(GameEvent.UPDATE_BET);
    }

    public static set Times(value: number) {
        this._times = value;
    }

    public static set Auto(value: boolean) {
        this._auto = value;
    }

    public static set PlayInfo(value: supersevenbaccarat.PlayerInfo | null) {
        this._playInfo = value
    }

    public static set View(value: IPanelSuperSevenMainView | null) {
        this._view = value;
    }

    public static set Free(value: boolean) {
        this._free = value;
    }



    public static get BetCoin(): number { return this._betCoin; }
    public static get Times(): number { return this._times; }
    public static get State(): gameState { return this._state; }
    public static get Auto(): boolean { return this._auto; }
    public static get Bets(): Number[] { return this._bets; }
    public static get PlayInfo(): supersevenbaccarat.PlayerInfo | null { return this._playInfo; }
    public static get Free(): boolean { return this._free; }
    public static get View(): IPanelSuperSevenMainView | null { return this._view; }


    public static Text(value: number): string {
        let strText = Formater.splitNumber(value.toFixed(2), ',', 3);
        if (strText.endsWith('.00')) {
            strText = strText.slice(0, -3)
        } else if (strText.includes('.') && strText.endsWith('0')) {
            strText = strText.slice(0, -1);
        }
        return strText;
    }
}


