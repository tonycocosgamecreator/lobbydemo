// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SuperSevenManager, { gameType } from '../manager/ss-manager';
import WalletManager from '../manager/wallet-manager';
import { GButtonTouchStyle } from '../core/view/view-define';
import { MessageSender } from '../network/net/message-sender';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomButtom')
export default class CustomButtom extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _type: gameType = gameType.none;

    // _state:
    _auto: boolean = false;

    _bets: number[] = [];

    _index: number = 0;

    _curBets: number = -1;

    buildUi() {
        this.buttonAdd.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonTimes.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonSub.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this._updateTimes();
        this._init();
    }

    setGameType(type: gameType) {
        this.reset();
        this._auto = SuperSevenManager.Auto;
        if (type == gameType.free) {
            this.free_node.active = true;
            return;
        }
        if (type == gameType.pay) {
            this.pay_node.active = true;
        }
    }

    reset() {
        this._auto = false;
        this.pay_node.active = false;
        this.free_node.active = false;
        this.labelWin.string = '';
        this.labelfreeGame.string = '';
        this.labelfreeTotal.string = '';
        this.labelResidue.string = '';
        this.labelResidue.node.parent.active = false;
        this.auto_unable_node.active = false;
        this.spin_unable_node.active = false;
        this.stop_unable_node.active = false;
        this.buttonStop.node.active = false;
        this.buttonSpin.node.active = false;
        this.buttonAuto.node.active = false;
    }

    _updateTimes() {
        let _t = SuperSevenManager.Times;
        this.labelTimes.string = _t + '.0X';
    }

    _init() {
        this.reset();
        this._bets = WalletManager.getCurrencyBetSize();
        if (!this._bets || this._bets.length == 0) {
            return this.labelTotal.string = '';
        }
        this._index = 0;
        this._updateBetCoin();
        this.pay_node.active = true;
        this.buttonAuto.node.active = true;
        this.buttonSpin.node.active = true;
    }

    _updateBetCoin() {
        this.labelTotal.string = this._bets[this._index] + '';
        SuperSevenManager.BetCoin = this._bets[this._index];
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonSpin(event: cc.EventTouch) {
        cc.log('on click event cc_buttonSpin');
        let data = {
            currency: WalletManager.currency,
            bet_size: this._bets[this._index]
        }
        MessageSender.SendMessage(supersevenbaccarat.Message.MsgGameSpinReq, data);
    }
    private onClickButtonAuto(event: cc.EventTouch) {
        cc.log('on click event cc_buttonAuto');
    }

    private onClickButtonStop(event: cc.EventTouch) {
        cc.log('on click event cc_buttonStop');
    }

    private onClickButtonAdd(event: cc.EventTouch) {
        if (this._index == this._bets.length - 1) return;
        this._index++;
        this._updateBetCoin();
    }

    private onClickButtonTimes(event: cc.EventTouch) {
        if (this._type != gameType.pay) return;
        if (SuperSevenManager.Auto) return;
        let _t = SuperSevenManager.Times;
        SuperSevenManager.Times = _t == 1 ? 2 : 1;
        this._updateTimes();
    }

    private onClickButtonSub(event: cc.EventTouch) {
        if (this._index == 0) return;
        this._index--;
        this._updateBetCoin();
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_auto_unable_node: [cc.Node],
            cc_buttonAdd: [GButton, this.onClickButtonAdd.bind(this)],
            cc_buttonAuto: [GButton, this.onClickButtonAuto.bind(this)],
            cc_buttonSpin: [GButton, this.onClickButtonSpin.bind(this)],
            cc_buttonStop: [GButton, this.onClickButtonStop.bind(this)],
            cc_buttonSub: [GButton, this.onClickButtonSub.bind(this)],
            cc_buttonTimes: [GButton, this.onClickButtonTimes.bind(this)],
            cc_free_node: [cc.Node],
            cc_labelResidue: [cc.Label],
            cc_labelTimes: [cc.Label],
            cc_labelTotal: [cc.Label],
            cc_labelWin: [cc.Label],
            cc_labelfreeGame: [cc.Label],
            cc_labelfreeTotal: [cc.Label],
            cc_pay_node: [cc.Node],
            cc_spbottom: [cc.sp.Skeleton],
            cc_spin_unable_node: [cc.Node],
            cc_stop_unable_node: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected auto_unable_node: cc.Node = null;
    protected buttonAdd: GButton = null;
    protected buttonAuto: GButton = null;
    protected buttonSpin: GButton = null;
    protected buttonStop: GButton = null;
    protected buttonSub: GButton = null;
    protected buttonTimes: GButton = null;
    protected free_node: cc.Node = null;
    protected labelResidue: cc.Label = null;
    protected labelTimes: cc.Label = null;
    protected labelTotal: cc.Label = null;
    protected labelWin: cc.Label = null;
    protected labelfreeGame: cc.Label = null;
    protected labelfreeTotal: cc.Label = null;
    protected pay_node: cc.Node = null;
    protected spbottom: cc.sp.Skeleton = null;
    protected spin_unable_node: cc.Node = null;
    protected stop_unable_node: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomButtom';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomButtom.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomButtom.VIEW_NAME;
    }
    // @view export resource end
}
