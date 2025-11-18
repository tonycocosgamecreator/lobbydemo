// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { GButtonDisableStyle, GButtonTouchStyle } from '../core/view/view-define';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
import { GameEvent, THEME_ID } from '../define';
import { MessageSender } from '../network/net/message-sender';
import WalletManager from '../manager/wallet-manager';
import UIHelper from '../network/helper/ui-helper';
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
    _auto: boolean = false;
    _stage = -1;
    buildUi() {
        this.button_agail.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.button_auto.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.button_clear.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.button_double.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.button_undo.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.button_agail.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.button_undo.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.button_clear.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.button_double.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.button_agail.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/ui/7up_Img_37'), this.getSpriteFrame('textures/ui/7up_Img_37'), this.getSpriteFrame('textures/ui/7up_Img_33')];
        this.button_undo.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/ui/7up_Img_38'), this.getSpriteFrame('textures/ui/7up_Img_38'), this.getSpriteFrame('textures/ui/7up_Img_34')];
        this.button_clear.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/ui/7up_Img_39'), this.getSpriteFrame('textures/ui/7up_Img_39'), this.getSpriteFrame('textures/ui/7up_Img_35')];
        this.button_double.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/ui/7up_Img_40'), this.getSpriteFrame('textures/ui/7up_Img_40'), this.getSpriteFrame('textures/ui/7up_Img_36')];
        this.updateAuto();
    }

    updateGameStage(reconnect: boolean = false) {
        this._stage = SevenUpSevenDownManager.Stage;
        this.button_undo.isEnabled = false;
        this.button_clear.isEnabled = false;
        this.button_agail.isEnabled = false;
        this.button_double.isEnabled = false;
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this.updateAuto();
                break;
            case baccarat.DeskStage.StartBetStage:
                let list = SevenUpSevenDownManager.LastbetInfo;
                if (this._auto) {
                    let betcoin = 0;
                    let bets = [];
                    list.forEach(t => {
                        betcoin += parseInt(t.bet_coin);
                        bets.push({ bet_id: t.bet_id, bet_coin: t.bet_coin, is_rebet: false })
                    })
                    this.sendBetMessage(bets, betcoin, true);
                } else {
                    this.button_agail.isEnabled = list && list.length ? true : false;
                }
                if (reconnect) {
                    this.updateClear();
                }
                break;
        }
    }

    updateAuto() {
        this._auto = SevenUpSevenDownManager.Auto;
        this.button_auto.node.active = this._auto;
        this.button_unauto.node.active = this._auto;
        this.button_agail.node.active = !this._auto;
    }

    updateClear(isUndo: boolean = false) {
        if (this._stage != baccarat.DeskStage.StartBetStage) return;
        const mybets = SevenUpSevenDownManager.MyBets;
        let before = SevenUpSevenDownManager.Before;
        let v = 0;
        mybets.forEach(t => { v += t });
        this.button_undo.isEnabled = !!v && this._auto == false;
        this.button_clear.isEnabled = !!v && this._auto == false;
        this.button_double.isEnabled = !!v && this._auto == false && before.length > 0;
        if (isUndo) {
            if (this._auto == false && v == 0) {
                let list = SevenUpSevenDownManager.LastbetInfo;
                this.button_agail.isEnabled = list && list.length ? true : false;
                this.updateAuto();
            }
        }
    }

    sendBetMessage(bets: sevenupdown.SUDBetData[], gold: number, isAuto: boolean = false, agail: boolean = false) {
        const myCoin = WalletManager.balance;
        if (gold > myCoin) {
            UIHelper.showMoneyNotEnough();
            if (isAuto) SevenUpSevenDownManager.Auto = false;
            return;
        }
        const BetSevenUpDownReq: sevenupdown.MsgBetSevenUpDownReq = {
            theme_id: THEME_ID,
            /**  桌子ID */
            desk_id: SevenUpSevenDownManager.DeskId,
            /**  下注列表 */
            bets: bets,
        }
        MessageSender.SendMessage(sevenupdown.Message.MsgBetSevenUpDownReq, BetSevenUpDownReq);
        if (agail) {
            this.button_auto.node.active = true;
            this.button_unauto.node.active = false;
            this.button_agail.node.active = false;
        }

    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButton_auto(event: cc.EventTouch) {
        SevenUpSevenDownManager.Auto = true;
        this.button_agail.isEnabled = false;
        this.updateAuto();
        this.updateClear();
    }

    private onClickButton_agail(event: cc.EventTouch) {
        let list = SevenUpSevenDownManager.LastbetInfo;
        if (list.length == 0) return;
        let betcoin = 0;
        let bets = [];
        list.forEach(t => {
            betcoin += parseInt(t.bet_coin);
            bets.push({ bet_id: t.bet_id, bet_coin: t.bet_coin, is_rebet: false })
        })
        this.sendBetMessage(bets, betcoin, false, true);
    }

    private onClickButton_undo(event: cc.EventTouch) {
        if (this._stage != baccarat.DeskStage.StartBetStage) return;
        const CancelBetSevenUpDownReq: sevenupdown.MsgCancelBetSevenUpDownReq = {
            theme_id: THEME_ID,
            /**  桌子ID */
            desk_id: SevenUpSevenDownManager.DeskId,
            cancel_type: 1
        }
        MessageSender.SendMessage(sevenupdown.Message.MsgCancelBetSevenUpDownReq, CancelBetSevenUpDownReq);
    }

    private onClickButton_clear(event: cc.EventTouch) {
        if (this._stage != baccarat.DeskStage.StartBetStage) return;
        const CancelBetSevenUpDownReq: sevenupdown.MsgCancelBetSevenUpDownReq = {
            theme_id: THEME_ID,
            /**  桌子ID */
            desk_id: SevenUpSevenDownManager.DeskId,
            cancel_type: 2
        }
        MessageSender.SendMessage(sevenupdown.Message.MsgCancelBetSevenUpDownReq, CancelBetSevenUpDownReq);
    }

    private onClickButton_double(event: cc.EventTouch) {
        const _data = SevenUpSevenDownManager.Before;
        if (_data.length == 0) return;
        let bets = [];
        let betcoin = 0;
        _data.forEach((val) => {
            betcoin += +(val.bet_coin) * 2;
            bets.push({ bet_id: val.bet_id, bet_coin: val.bet_coin + '', is_rebet: false });
            bets.push({ bet_id: val.bet_id, bet_coin: val.bet_coin + '', is_rebet: false });
        })
        this.sendBetMessage(bets, betcoin, true);
    }

    private onClickButton_unauto(event: cc.EventTouch) {
        SevenUpSevenDownManager.Auto = false;
        this.updateAuto();
        this.updateClear();
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_button_agail: [GButton, this.onClickButton_agail.bind(this)],
            cc_button_auto: [GButton, this.onClickButton_auto.bind(this)],
            cc_button_clear: [GButton, this.onClickButton_clear.bind(this)],
            cc_button_double: [GButton, this.onClickButton_double.bind(this)],
            cc_button_unauto: [GButton, this.onClickButton_unauto.bind(this)],
            cc_button_undo: [GButton, this.onClickButton_undo.bind(this)],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected button_agail: GButton = null;
    protected button_auto: GButton = null;
    protected button_clear: GButton = null;
    protected button_double: GButton = null;
    protected button_unauto: GButton = null;
    protected button_undo: GButton = null;
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
