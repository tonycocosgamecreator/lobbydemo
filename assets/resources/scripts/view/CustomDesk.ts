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
import { sp } from 'cc';
import BaseGlobal from '../core/message/base-global';
import { Vec3 } from 'cc';
import { randomRange } from 'cc';
import { UITransform } from 'cc';
import { Tween } from 'cc';
import { UIOpacity } from 'cc';
import { Color } from 'cc';
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
    _tagetWorldPos: Vec3[] = [];

    buildUi() {
        const odds = SevenUpSevenDownManager.Odds;
        this._chipButtons = WalletManager.getCurrencyBetSize()
        this.betarea_node.children.forEach((child, idx) => {
            child.getChildByName('odd').getComponent(cc.Label).string = odds[idx];
        });
        this.reset();
    }

    reset() {
        this.betarea_node.children.forEach((child, idx) => {
            if (idx != 5 && idx != 11 && idx != 12) {
                child.getChildByName('labelIdx').getComponent(cc.Label).color = new Color('#808080');
                child.getChildByName('odd').getComponent(cc.Label).color = new Color('#808080');
            }
            child.getChildByName('lightning').active = false;
            child.getChildByName('show').active = false;
        });
        this._tagetWorldPos = [];
    }

    updateGameStage(reconnect: boolean = false) {
        this._stage = SevenUpSevenDownManager.Stage;
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this.reset();
            case baccarat.DeskStage.StartBetStage:
            case baccarat.DeskStage.EndBetStage:
            case baccarat.DeskStage.OpenStage:
                if (reconnect) {
                    this.resetLabelColor();
                }
                break;
        }
    }

    showResult() {
        let wintype = SevenUpSevenDownManager.WinType;
        for (let i = 0; i < this.betarea_node.children.length; i++) {
            let child = this.betarea_node.children[i];
            let win = wintype.indexOf(i + 1) == -1 ? false : true;
            child.getChildByName('lightning').active = win;
            if (i != 5 && i != 11 && i != 12) {
                child.getChildByName('labelIdx').getComponent(cc.Label).color = win ? new Color('#ffffffff') : new Color('#808080');
                child.getChildByName('odd').getComponent(cc.Label).color = win ? new Color('#ffffffff') : new Color('#808080');
            }
        }
    }

    resetLabelColor() {
        this.betarea_node.children.forEach((child, idx) => {
            if (idx != 5 && idx != 11 && idx != 12) {
                child.getChildByName('labelIdx').getComponent(cc.Label).color = new Color('#808080');
                child.getChildByName('odd').getComponent(cc.Label).color = new Color('#808080');
            }
        });
    }

    sendBetMessage(idx: number, tagetWorldPos: Vec3) {
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
        this._tagetWorldPos.push(tagetWorldPos);
        MessageSender.SendMessage(sevenupdown.Message.MsgBetSevenUpDownReq, BetSevenUpDownReq);
    }
    getWorldPosByIdx(idx: number, isme: boolean, order: number): cc.Vec3 {
        let wordPos = null;
        if (isme) {
            wordPos = this.getUserClickPosByIdx(order);
            if (wordPos) {
                return wordPos;
            }
        }
        const child = this.betarea_node.children[idx - 1].getChildByName('end');
        let endPos = child.parent.transform.convertToWorldSpaceAR(
            child.position
        );
        let width = child.getComponent(UITransform).width / 2;
        let height = child.getComponent(UITransform).height / 2;
        wordPos = this.getRandomPointAround(endPos, width, height);
        return wordPos;
    }

    getUserClickPosByIdx(order: number): cc.Vec3 {
        let wordPos = this._tagetWorldPos[order]
        return wordPos;
    }

    getRandomPointAround(centerPoint: Vec3, horizontalRange: number = 90, verticalRange: number = 120): Vec3 {
        const randomX = randomRange(-horizontalRange, horizontalRange);
        const randomY = randomRange(-verticalRange, verticalRange);
        return new Vec3(
            centerPoint.x + randomX,
            centerPoint.y + randomY,
            centerPoint.z,
        );
    }

    updateBetAnimation(idx: number) {
        const child = this.betarea_node.children[idx - 1].getChildByName('show');
        const opacity = child.getComponent(UIOpacity)
        Tween.stopAllByTarget(opacity);
        opacity.opacity = 0;
        child.active = true;
        cc.tween(opacity)
            .to(0.12, { opacity: 30 })
            .delay(0.03)
            .to(0.1, { opacity: 0 })
            .call(() => {
                child.active = false;
            })
            .start();

    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButton_click1(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(1, _tagetWorldPos);
    }


    private onClickButton_click2(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(2, _tagetWorldPos);
    }


    private onClickButton_click3(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(3, _tagetWorldPos);
    }


    private onClickButton_click4(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(4, _tagetWorldPos);
    }


    private onClickButton_click5(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(5, _tagetWorldPos);
    }


    private onClickButton_click6(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(6, _tagetWorldPos);
    }


    private onClickButton_click7(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(7, _tagetWorldPos);
    }


    private onClickButton_click8(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(8, _tagetWorldPos);
    }


    private onClickButton_click9(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(9, _tagetWorldPos);
    }


    private onClickButton_click10(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(10, _tagetWorldPos);
    }


    private onClickButton_click11(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(11, _tagetWorldPos);
    }


    private onClickButton_click12(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(12, _tagetWorldPos);
    }


    private onClickButton_click13(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let _tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
        this.sendBetMessage(13, _tagetWorldPos);
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
