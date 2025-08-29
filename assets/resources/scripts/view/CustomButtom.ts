// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SuperSevenManager, { gameState, gameType } from '../manager/ss-manager';
import WalletManager from '../manager/wallet-manager';
import { GButtonDisableStyle, GButtonState, GButtonTouchStyle } from '../core/view/view-define';
import { MessageSender } from '../network/net/message-sender';
import { Global } from '../global';
import { GameEvent } from '../define';
import BaseGlobal from '../core/message/base-global';
import UIHelper from '../network/helper/ui-helper';
import ViewManager from '../core/manager/view-manager';
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
    // _type: gameType = gameType.none;

    _timer: number = 0;

    // _state:
    _auto: boolean = false;

    _bets: number[] = [];

    _index: number = 0;

    _curBets: number = -1;

    _gameState: gameState = gameState.End;

    _free: boolean = false;

    buildUi() {
        this.buttonAdd.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonAdd.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonAdd.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/bottom/anniu_03'),
        this.getSpriteFrame('textures/bottom/anniu_03B'), this.getSpriteFrame('textures/bottom/anniu_03C')];

        this.buttonTimes.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;

        this.buttonSub.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonSub.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonSub.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/bottom/anniu_04'),
        this.getSpriteFrame('textures/bottom/anniu_04B'), this.getSpriteFrame('textures/bottom/anniu_04C')];

        this.buttonAuto.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonAuto.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonAuto.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/bottom/anniu_02'),
        this.getSpriteFrame('textures/bottom/anniu_02'), this.getSpriteFrame('textures/bottom/anniu_02B')];

        this.buttonStop.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonStop.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonStop.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/bottom/anniu_01'),
        this.getSpriteFrame('textures/bottom/anniu_01'), this.getSpriteFrame('textures/bottom/anniu_01B')];

        this.buttonSpin.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonSpin.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonSpin.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/bottom/anniu_00'),
        this.getSpriteFrame('textures/bottom/anniu_00'), this.getSpriteFrame('textures/bottom/anniu_00B')];
        this._init();
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_STATE]: this._updateState,
            [GameEvent.UPDATE_BET]: this._updateBet,
            [GameEvent.UPDATE_TIMES]: this._updateTimes,
            [GameEvent.UPDATE_AUTO]: this._updateAuto,
        });
    }


    reset() {
        this._gameState = gameState.End;
        this._auto = false;
        this.pay_node.active = false;
        this.free_node.active = false;
        this.labelWin.string = '';
        this.labelfreeGame.string = '';
        this.labelfreeTotal.string = '';
        this.labelResidue.string = '';
        this.labelResidue.node.parent.active = false;
        this.buttonStop.node.active = false;
        this.buttonSpin.node.active = false;
    }

    _init() {
        this.reset()
        this._timer = SuperSevenManager.Times;
        this.labelTimes.string = this._timer + '.0X';
        this._gameState = SuperSevenManager.State;
        this._bets = WalletManager.getCurrencyBetSize();
        if (!this._bets || this._bets.length == 0) {
            return this.labelTotal.string = '';
        }
        this._index = 0;
        SuperSevenManager.BetCoin = this._bets[this._index];
        this._updateAuto();
        this._updateButton();
    }

    _updateBet() {
        this.labelTotal.string = SuperSevenManager.BetCoin + '';
    }

    _updateTimes() {
        this._timer = SuperSevenManager.Times;
        this.labelTimes.string = this._timer + '.0X';
    }

    _updateAuto() {
        const autoNum = SuperSevenManager.AutoNum;
        this._auto = autoNum > 0;
        this.labelResidue.node.parent.active = this._auto;
        this.labelResidue.string = autoNum > 500 ? '∞' : autoNum + '';
        this.labelResidue.fontSize = autoNum > 500 ? 40 : 20;
    }

    _updateState() {
        this._gameState = SuperSevenManager.State;
        this.labelWin.string = this._gameState == gameState.End ? SuperSevenManager.SpinInfo.award + '' : '';
        if (this.labelWin.string == '0') {
            this.labelWin.string = '';
        }
        this._updateButton();
    }

    _updateButton() {
        this._free = SuperSevenManager.Free;
        const Ing = this._gameState == gameState.Ing;
        this.buttonAuto.state = (this._auto || this._free || Ing) ? GButtonState.SHOW_DISABLE : GButtonState.SHOW_ENABLE;
        this.buttonSpin.node.active = Ing ? false : true;
        this.buttonStop.node.active = Ing;
        if (this._free) {
            this.pay_node.active = false;
            this.free_node.active = true;
            this.labelfreeGame.string = SuperSevenManager.FreeCount + '';
            this.labelfreeTotal.string = (SuperSevenManager.FreeCount + SuperSevenManager.FinishedCount).toString();
        } else {
            this.pay_node.active = true;
            this.free_node.active = false;
            this.buttonAdd.state = Ing ? GButtonState.SHOW_DISABLE : GButtonState.SHOW_ENABLE;
            this.buttonSub.state = Ing ? GButtonState.SHOW_DISABLE : GButtonState.SHOW_ENABLE;
            this.buttonTimes.state = Ing ? GButtonState.SHOW_DISABLE : GButtonState.SHOW_ENABLE;
        }
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonSpin(event: cc.EventTouch) {
        cc.log('on click event cc_buttonSpin');
        let gold = WalletManager.balance;
        if (this._free == false && gold < this._bets[this._index]) {
            UIHelper.showConfirmOfOneButtonToRefreshBrowser(
                resourcesDb.I18N_RESOURCES_DB_INDEX.EC_COIN_NO_ENOUGH,
                resourcesDb.I18N_RESOURCES_DB_INDEX.Error
            );
            SuperSevenManager.Auto = false;
            this._updateButton();
            return;
        }
        let data = {
            currency: WalletManager.currency,
            bet_size: this._bets[this._index]
        }
        MessageSender.SendMessage(supersevenbaccarat.Message.MsgGameSpinReq, data);
    }
    private onClickButtonAuto(event: cc.EventTouch) {
        ViewManager.OpenPanel(this.module, 'PanelAuto');
    }

    private onClickButtonStop(event: cc.EventTouch) {
        if (this._auto) {
            SuperSevenManager.Auto = false;
            return;
        }
        Global.sendMsg(GameEvent.STOP_ROTATION);
    }

    private onClickButtonAdd(event: cc.EventTouch) {
        if (this._index == this._bets.length - 1) return;
        this._index++;
        SuperSevenManager.BetCoin = this._bets[this._index];
    }

    private onClickButtonTimes(event: cc.EventTouch) {
        if (this._free) return;
        if (SuperSevenManager.Auto) return;
        let _t = SuperSevenManager.Times;
        SuperSevenManager.Times = _t == 1 ? 2 : 1;
    }

    private onClickButtonSub(event: cc.EventTouch) {
        if (this._index == 0) return;
        this._index--;
        SuperSevenManager.BetCoin = this._bets[this._index];
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
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
        };
    }
    //------------------------ 所有可用变量 ------------------------//
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
