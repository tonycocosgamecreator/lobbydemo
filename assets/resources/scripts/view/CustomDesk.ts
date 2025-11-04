// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
import { MessageSender } from '../network/net/message-sender';
import WalletManager from '../manager/wallet-manager';
import UIHelper from '../network/helper/ui-helper';
import { GameEvent, THEME_ID } from '../define';
import BaseGlobal from '../core/message/base-global';
import { sp } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomDesk')
export default class CustomDesk extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _chipButtons = [];
    _stage = -1;

    buildUi() {
        BaseGlobal.registerListeners(this, {
            [GameEvent.PLYER_TOTAL_BET_UPDATE]: this.updatePlayBetValue,
        });
        const odds = SevenUpSevenDownManager.Odds;
        this._chipButtons = WalletManager.getCurrencyBetSize()
        this.betarea_node.children.forEach((child, idx) => {
            child.getChildByName('odd').getComponent(cc.Label).string = odds[idx];
        });
        this.reset();
    }

    reset() {
        this.betarea_node.children.forEach((child, idx) => {
            child.getChildByName('star').active = false;
            child.getChildByName('coinbg').active = false;
            child.getChildByName('bets').active = false;
            child.getChildByName('spineone').active = false;
            child.getChildByName('lightning').active = false;
        });
    }

    updateGameStage(reconnect: boolean = false) {
        this._stage = SevenUpSevenDownManager.Stage;
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this.reset();
                break;
            case baccarat.DeskStage.StartBetStage:
            case baccarat.DeskStage.EndBetStage:
                this.updatePlayBetValue();
                break;
            case baccarat.DeskStage.OpenStage:
                let _odds = SevenUpSevenDownManager.OddString;
                for (let i = 0; i < _odds.length; i++) {
                    if (_odds[i] && +_odds[i]) {
                        let child = this.betarea_node.children[i];
                        this.showDoubleAnimaton(child, 'open', reconnect)
                        child.getChildByName('spineone').children[0].children[0].active = true;
                        child.getChildByName('spineone').children[0].children[1].active = false;
                        child.getChildByName('spineone').children[0].children[0].getComponent(cc.Label).string = `X2`;
                        child.getChildByName('spineone').children[0].children[1].getComponent(cc.Label).string = `X2`;
                    }
                }
                break;
            case baccarat.DeskStage.SettleStage:
                break;
        }
    }

    updatePlayBetValue() {
        const total = SevenUpSevenDownManager.TotalBet;
        const mybets = SevenUpSevenDownManager.MyBets;
        const isFirst = SevenUpSevenDownManager.FirstPlayBet;
        this.betarea_node.children.forEach((child, idx) => {
            child.getChildByName('star').active = isFirst.has(idx + 1);
            if (total[idx]) {
                child.getChildByName('bets').getChildByName('labelmybet').getComponent(cc.Label).string = mybets[idx] + '';
                child.getChildByName('bets').getChildByName('labelallbet').getComponent(cc.Label).string = '/' + total[idx];
                child.getChildByName('bets').active = true;
                child.getChildByName('coinbg').active = true;
            } else {
                child.getChildByName('bets').active = false;
                child.getChildByName('coinbg').active = false;
            }
        });

    }

    showDoubleAnimaton(child: cc.Node, name: string, reconnect: boolean = false) {
        let sp1 = child.getChildByName('spineone');
        sp1.active = true;
        const trackEntry = sp1.getComponent(sp.Skeleton).setAnimation(0, name, false);
        trackEntry.trackTime = reconnect ? trackEntry.animationEnd : 0;
        sp1.getComponent(sp.Skeleton).setCompleteListener(() => {
            sp1.children[0].children[0].active = false;
            sp1.children[0].children[1].active = true;
        })
    }

    showResult() {
        let wintype = SevenUpSevenDownManager.WinType;
        let _odds = SevenUpSevenDownManager.OddString;
        for (let i = 0; i < this.betarea_node.children.length; i++) {
            let child = this.betarea_node.children[i];
            let win = wintype.indexOf(i + 1) == -1 ? false : true;
            if (win) {
                let light = child.getChildByName('lightning');
                let name = (i == 6 || i == 12 || i == 13) ? 'animation' : 'animation2';
                if (light.getComponentInChildren(sp.Skeleton)) {

                    light.getComponentInChildren(sp.Skeleton).setAnimation(0, name, false);
                } else {
                    console.log(i, '========================================================,i')
                }
                light.active = true;
            }
            if (_odds[i] && +_odds[i]) {
                this.showDoubleAnimaton(child, 'end');
            }
        }
    }

    sendBetMessage(idx: number) {
        if (this._stage != baccarat.DeskStage.StartBetStage) return;
        const myCoin = WalletManager.balance;
        const betcoin = this._chipButtons[SevenUpSevenDownManager.ChipIdx];
        if (betcoin > myCoin) {
            UIHelper.showMoneyNotEnough();
            return;
        }
        const BetSevenUpDownReq: sevenupdown.MsgBetSevenUpDownReq = {
            theme_id: THEME_ID,
            /**  桌子ID */
            desk_id: SevenUpSevenDownManager.DeskId,
            /**  下注列表 */
            bets: [{ bet_id: idx, bet_coin: betcoin + '', is_rebet: false }],
        }
        MessageSender.SendMessage(sevenupdown.Message.MsgBetSevenUpDownReq, BetSevenUpDownReq);
    }

    getWorldPosByIdx(idx: number): cc.Vec3 {
        const child = this.betarea_node.children[idx - 1].getChildByName('end');
        let wordPos = child.parent.transform.convertToWorldSpaceAR(
            child.position
        );
        return wordPos;
    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButton_click1(event: cc.EventTouch) {
        this.sendBetMessage(1);
    }


    private onClickButton_click2(event: cc.EventTouch) {
        this.sendBetMessage(2);
    }


    private onClickButton_click3(event: cc.EventTouch) {
        this.sendBetMessage(3);
    }


    private onClickButton_click4(event: cc.EventTouch) {
        this.sendBetMessage(4);
    }


    private onClickButton_click5(event: cc.EventTouch) {
        this.sendBetMessage(5);
    }


    private onClickButton_click6(event: cc.EventTouch) {
        this.sendBetMessage(6);
    }


    private onClickButton_click7(event: cc.EventTouch) {
        this.sendBetMessage(7);
    }


    private onClickButton_click8(event: cc.EventTouch) {
        this.sendBetMessage(8);
    }


    private onClickButton_click9(event: cc.EventTouch) {
        this.sendBetMessage(9);
    }


    private onClickButton_click10(event: cc.EventTouch) {
        this.sendBetMessage(10);
    }


    private onClickButton_click11(event: cc.EventTouch) {
        this.sendBetMessage(11);
    }


    private onClickButton_click12(event: cc.EventTouch) {
        this.sendBetMessage(12);
    }


    private onClickButton_click13(event: cc.EventTouch) {
        this.sendBetMessage(13);
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_betarea_node: [cc.Node],
            cc_button_click1: [GButton, this.onClickButton_click1.bind(this)],
            cc_button_click10: [GButton, this.onClickButton_click10.bind(this)],
            cc_button_click11: [GButton, this.onClickButton_click11.bind(this)],
            cc_button_click12: [GButton, this.onClickButton_click12.bind(this)],
            cc_button_click13: [GButton, this.onClickButton_click13.bind(this)],
            cc_button_click2: [GButton, this.onClickButton_click2.bind(this)],
            cc_button_click3: [GButton, this.onClickButton_click3.bind(this)],
            cc_button_click4: [GButton, this.onClickButton_click4.bind(this)],
            cc_button_click5: [GButton, this.onClickButton_click5.bind(this)],
            cc_button_click6: [GButton, this.onClickButton_click6.bind(this)],
            cc_button_click7: [GButton, this.onClickButton_click7.bind(this)],
            cc_button_click8: [GButton, this.onClickButton_click8.bind(this)],
            cc_button_click9: [GButton, this.onClickButton_click9.bind(this)],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected betarea_node: cc.Node = null;
    protected button_click1: GButton = null;
    protected button_click10: GButton = null;
    protected button_click11: GButton = null;
    protected button_click12: GButton = null;
    protected button_click13: GButton = null;
    protected button_click2: GButton = null;
    protected button_click3: GButton = null;
    protected button_click4: GButton = null;
    protected button_click5: GButton = null;
    protected button_click6: GButton = null;
    protected button_click7: GButton = null;
    protected button_click8: GButton = null;
    protected button_click9: GButton = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomDesk';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomDesk.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomDesk.VIEW_NAME;
    }
    // @view export resource end
}
