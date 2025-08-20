// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../core/message/base-global';
import { GameEvent, THEME_ID } from '../define';
import WalletManager from '../manager/wallet-manager';
import JmManager from '../manager/jm-manager';
import { MessageSender } from '../network/net/message-sender';
import { Global } from '../global';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomSystemTopFoot')
export default class CustomSystemTopFoot extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _back_callback: () => void = null;

    buildUi() {
        this.buttonBack.node.active = false;
        BaseGlobal.registerListeners(this, {
            [GameEvent.PLYER_TOTAL_BET_UPDATE]: this._updateTotalBet,
            [GameEvent.PLAYER_INFO_UPDATE]: this._updateTotalBalance,
            [GameEvent.PLAYER_PERIOD_UPDATE]: this._updatePeriod,
            [GameEvent.PLAYER_CURRENCY_UPDATE]: this._updateTotalBalance
        });
        this._updateTotalBalance();
        this._updateTotalBet();
        this._updatePeriod();
    }

    /**
     * 注册返回按钮的回调
     * @param callback 
     */
    registerBackCallback(callback: EmptyCallback | null): void {
        this._back_callback = callback;
    }

    _updateTotalBet() {
        this.totalBet.string = JmManager.TotalBet + '';
    }

    _updateTotalBalance() {
        this.balance.string = WalletManager.balance.toFixed(2);
    }

    private _updatePeriod() {
        this.period.string = JmManager.Period;
    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonBack(event: cc.EventTouch) {
        const data: jmbaccarat.MsgLeaveBaccaratReq = {
            desk_id: JmManager.DeskId,
            theme_id: THEME_ID,
        };
        MessageSender.SendMessage(jmbaccarat.Message.MsgLeaveBaccaratReq, data);
    }


    private onClickButtonMenu(event: cc.EventTouch) {
        cc.log('on click event cc_buttonMenu');
        Global.sendMsg(GameEvent.REQUST_OPEN_MENU);
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_balance: [cc.Label],
            cc_buttonBack: [GButton, this.onClickButtonBack.bind(this)],
            cc_buttonMenu: [GButton, this.onClickButtonMenu.bind(this)],
            cc_jhandimunda: [cc.Label],
            cc_period: [cc.Label],
            cc_totalBet: [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected balance: cc.Label = null;
    protected buttonBack: GButton = null;
    protected buttonMenu: GButton = null;
    protected jhandimunda: cc.Label = null;
    protected period: cc.Label = null;
    protected totalBet: cc.Label = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomSystemTopFoot';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomSystemTopFoot.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomSystemTopFoot.VIEW_NAME;
    }
    // @view export resource end
}
