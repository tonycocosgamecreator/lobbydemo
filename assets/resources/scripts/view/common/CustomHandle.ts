// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import CommonManager, { betInfo } from '../../manager/common-manager';
import { GButtonDisableStyle, GButtonTouchStyle } from '../../core/view/view-define';
import GameManager from '../../manager/game-manager';
import { THEME_ID } from '../../define';
import { MessageSender } from '../../network/net/message-sender';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomHandle')
export default class CustomHandle extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _stage = -1;
    _auto: boolean = false;
    _agail: boolean = false;
    _lastBetInfo: betInfo[] = [];
    _myBetInfo: betInfo[] = [];
    buildUi() {
        this.buttonAgail.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonAuto.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonClear.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonDouble.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonUndo.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonAgail.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonUndo.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonClear.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonDouble.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonAgail.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/common/button/7up_Img_37'), this.getSpriteFrame('textures/common/button/7up_Img_37'), this.getSpriteFrame('textures/common/button/7up_Img_33')];
        this.buttonUndo.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/common/button/7up_Img_38'), this.getSpriteFrame('textures/common/button/7up_Img_38'), this.getSpriteFrame('textures/common/button/7up_Img_34')];
        this.buttonClear.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/common/button/7up_Img_39'), this.getSpriteFrame('textures/common/button/7up_Img_39'), this.getSpriteFrame('textures/common/button/7up_Img_35')];
        this.buttonDouble.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/common/button/7up_Img_40'), this.getSpriteFrame('textures/common/button/7up_Img_40'), this.getSpriteFrame('textures/common/button/7up_Img_36')];
    }

    initData(stage: number) {
        this._stage = stage;
        this._lastBetInfo = CommonManager.LastbetInfo;
        this._auto = CommonManager.Auto;
        this._agail = CommonManager.Agail;
        this.updateButtonState();
    }
    
    updateGameStage(stage: number) {
        this._stage = stage;
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this._lastBetInfo = CommonManager.LastbetInfo;
                this._agail = CommonManager.Agail;
                this.updateButtonState();
                break;
            case baccarat.DeskStage.StartBetStage:
                if (this._auto) {
                    this.autoBets();
                }
                this.updateButtonState();
                break;
            case baccarat.DeskStage.EndBetStage:
                this.updateButtonState();
                break;
            case baccarat.DeskStage.OpenStage:
                break;
            case baccarat.DeskStage.SettleStage:
                break;
        }
    }

    autoBets() {
        if (this._stage != baccarat.DeskStage.StartBetStage) return;
        let betcoin = 0;
        let bets = [];
        let area = [];
        this._lastBetInfo.forEach(t => {
            betcoin += parseInt(t.bet_coin);
            bets.push({ bet_id: t.bet_id, bet_coin: t.bet_coin, is_rebet: false })
            let pos = GameManager.View.getDeskWorldPosByAid(t.bet_id);
            area.push(pos);
        })
        CommonManager.Agail = true;
        GameManager.sendBetMessage(bets, betcoin, true, area);
    }

    updateButtonState(click: boolean = false) {
        let betStage = this._stage == baccarat.DeskStage.StartBetStage;
        this._myBetInfo = GameManager.getBetInfoByPlayId();
        if (!click && this._agail && this._myBetInfo.length == 0) {
            //点了下注上一局又点撤销
            this._agail = false;
        }
        this.buttonAgail.isEnabled = !this._auto && betStage && !this._agail && this._lastBetInfo.length > 0 ? true : false;
        this.buttonAgail.node.active = !this._auto && !this._agail;
        this.buttonAuto.node.active = !this._auto && this._agail;
        this.buttonUnauto.node.active = this._auto;
        this.buttonUndo.isEnabled = !this._auto && betStage && this._myBetInfo.length > 0;
        this.buttonClear.isEnabled = !this._auto && betStage && this._myBetInfo.length > 0;
        this.buttonDouble.isEnabled = !this._auto && betStage && this._myBetInfo.length > 0;
    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin



    private onClickButtonAuto(event: cc.EventTouch) {
        this._auto = true;
        CommonManager.Auto = true;
        this.updateButtonState(true);
    }


    private onClickButtonUnauto(event: cc.EventTouch) {
        this._auto = false;
        CommonManager.Auto = false;
        this.updateButtonState(true);
    }


    private onClickButtonAgail(event: cc.EventTouch) {
        this._agail = true;
        CommonManager.Agail = true;
        this.updateButtonState(true);
        this.autoBets();
    }


    private onClickButtonUndo(event: cc.EventTouch) {
        if (this._stage != baccarat.DeskStage.StartBetStage) return;
        if (this._myBetInfo.length == 0) return;
        const CancelBetSevenUpDownReq: game.MsgCancelBetSevenUpDownReq = {
            theme_id: THEME_ID,
            /**  桌子ID */
            desk_id: GameManager.DeskId,
            cancel_type: 1
        }
        MessageSender.SendMessage(game.Message.MsgCancelBetSevenUpDownReq, CancelBetSevenUpDownReq);
    }


    private onClickButtonClear(event: cc.EventTouch) {
        if (this._stage != baccarat.DeskStage.StartBetStage) return;
        if (this._myBetInfo.length == 0) return;
        const CancelBetSevenUpDownReq: game.MsgCancelBetSevenUpDownReq = {
            theme_id: THEME_ID,
            /**  桌子ID */
            desk_id: GameManager.DeskId,
            cancel_type: 2
        }
        MessageSender.SendMessage(game.Message.MsgCancelBetSevenUpDownReq, CancelBetSevenUpDownReq);
    }


    private onClickButtonDouble(event: cc.EventTouch) {
        if (this._stage != baccarat.DeskStage.StartBetStage) return;
        if (this._myBetInfo.length == 0) return;
        let bets = [];
        let betcoin = 0;
        let area = [];
        let _data = this._myBetInfo[this._myBetInfo.length - 1]
        betcoin = (+(_data.bet_coin)).mul(2);
        for (let i = 0; i < 2; i++) {
            bets.push({ bet_id: _data.bet_id, bet_coin: _data.bet_coin + '', is_rebet: false });
            let pos = GameManager.View.getDeskWorldPosByAid(_data.bet_id);;
            area.push(pos);
        }
        GameManager.sendBetMessage(bets, betcoin, false, area);
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonAgail: [GButton, this.onClickButtonAgail.bind(this)],
            cc_buttonAuto: [GButton, this.onClickButtonAuto.bind(this)],
            cc_buttonClear: [GButton, this.onClickButtonClear.bind(this)],
            cc_buttonDouble: [GButton, this.onClickButtonDouble.bind(this)],
            cc_buttonUnauto: [GButton, this.onClickButtonUnauto.bind(this)],
            cc_buttonUndo: [GButton, this.onClickButtonUndo.bind(this)],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonAgail: GButton = null;
    protected buttonAuto: GButton = null;
    protected buttonClear: GButton = null;
    protected buttonDouble: GButton = null;
    protected buttonUnauto: GButton = null;
    protected buttonUndo: GButton = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomHandle';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomHandle.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomHandle.VIEW_NAME;
    }
    // @view export resource end
}
