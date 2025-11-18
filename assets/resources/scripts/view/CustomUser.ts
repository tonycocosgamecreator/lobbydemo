// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import WalletManager from '../manager/wallet-manager';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
import { Tween } from 'cc';
import { v3 } from 'cc';
import { tween } from 'cc';
import { UIOpacity } from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomUserIcon from 'db://assets/resources/scripts/view/CustomUserIcon';
import { CurrencyHelper } from '../helper/currency-helper';
import ViewManager from '../core/manager/view-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomUser')
export default class CustomUser extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
        this.callback && this.unschedule(this.callback)
    }


    //------------------------ 内部逻辑 ------------------------//

    _stage = -1;
    _ids: string[] = [];
    _myId: string = '';
    callback = null;
    currency = '';
    buildUi() {
        BaseGlobal.registerListeners(this, {
            [GameEvent.PLAYER_INFO_UPDATE]: this.updateTotalBalance,
            [GameEvent.PLYER_TOTAL_BET_UPDATE]: this.updatePlayBalance,
            [GameEvent.UPDATE_ONLINE_ROOM]: this.updateOnlineRoom,
            [GameEvent.PLAYER_CHANGE_AVATAR]: this.updateHead
        });
        const balance = WalletManager.balance;
        this.currency = WalletManager.currency;
        this.updateTotalBalance(balance);
        this.updateOnlineRoom();
        this.resetBetPlayer();
        this.init();
        this.callback = () => {
            this.otherhead_node.children.forEach((child) => {
                child.getChildByName('head').getChildByName('mask').active = false;
            })
        }
    }

    init() {
        this.label_name.string = "Player_" + SevenUpSevenDownManager.PlayerId;
        this.spr_myhead.spriteFrame = this.getSpriteFrame(`textures/avatars/av-${SevenUpSevenDownManager.HeadId}`);
        this._myId = SevenUpSevenDownManager.PlayerId;
        this._stage = SevenUpSevenDownManager.Stage;
        const data = SevenUpSevenDownManager.BigWinList;
        this.otherhead_node.children.forEach((child, idx) => {
            const _d = data[idx];
            child.active = !!_d;
            if (_d) {
                child.getChildByName('labelcoin').getComponent(cc.Label).string = CurrencyHelper.format(_d.balance, this.currency, { showSymbol: true });
                child.getChildByName('labelwin').getComponent(cc.Label).string = '';
                child.getChildByName('head').getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${_d.icon}`);
                child.getChildByName('head').getChildByName('mask').active = false;
                this._ids.push(_d.player_id);
            }
        })
    }

    updateTotalBalance(balance: number): void {
        this.label_coin.string = CurrencyHelper.format(balance, this.currency, { showSymbol: true });
    }

    updatePlayBalance() {
        const balance = WalletManager.balance;
        this.updateTotalBalance(balance);
        const data = SevenUpSevenDownManager.BigWinList;
        this.otherhead_node.children.forEach((child, idx) => {
            const _d = data[idx];
            child.active = !!_d;
            if (_d) {
                child.getChildByName('labelcoin').getComponent(cc.Label).string = CurrencyHelper.format(_d.balance, this.currency, { showSymbol: true });
            }
        })
    }

    updateOnlineRoom() {
        this.labelpeople.string = SevenUpSevenDownManager.OnlineRoom + '';
    }

    updateHead() {
        this.spr_myhead.spriteFrame = this.getSpriteFrame(`textures/avatars/av-${SevenUpSevenDownManager.HeadId}`);
    }

    updateGameStage() {
        this.user_icon_node.updateGameStage();
        this._stage = SevenUpSevenDownManager.Stage;
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                const balance = WalletManager.balance;
                this.updateTotalBalance(balance);
                this.updatePlayer();
                this.resetBetPlayer();
                break;
            case baccarat.DeskStage.StartBetStage:
            case baccarat.DeskStage.EndBetStage:
            case baccarat.DeskStage.OpenStage:
                break;
        }
    }

    updatePlayer() {
        const data = SevenUpSevenDownManager.BigWinList;
        this.otherhead_node.children.forEach((child, idx) => {
            const _d = data[idx];
            let winNode = child.getChildByName('labelwin')
            Tween.stopAllByTarget(winNode);
            child.active = !!_d;
            if (_d) {
                child.getChildByName('labelcoin').getComponent(cc.Label).string = CurrencyHelper.format(_d.balance, this.currency, { showSymbol: true });
                winNode.getComponent(cc.Label).string = '';
                if (this._ids[idx] && this._ids[idx] != _d.player_id) {
                    const nd = child.getChildByName('head');
                    nd.eulerAngles = v3(0, 0, 0);
                    cc.tween(nd)
                        .to(0.2, { eulerAngles: v3(0, 90, 0) }, { easing: 'cubicInOut' })
                        .call(() => {
                            nd.eulerAngles = v3(0, -90, 0);
                            child.getChildByName('head').getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${_d.icon}`);
                        })
                        .to(0.2, { eulerAngles: v3(0, 0, 0) }, { easing: 'cubicInOut' })
                        .start();
                    this._ids[idx] = _d.player_id;
                } else {
                    this._ids[idx] = _d.player_id;
                    child.getChildByName('head').getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${_d.icon}`);
                }
                child.getChildByName('head').getChildByName('mask').active = false;
            }
        })
    }

    getWorldPosByUid(player_id: string, icon: number): cc.Vec3 {
        let node = this.rest_node;
        let wordPos = node.parent.transform.convertToWorldSpaceAR(node.position);
        let unrank = true;
        if (player_id == this._myId) {
            wordPos = this.spr_myhead.node.parent.transform.convertToWorldSpaceAR(this.spr_myhead.node.position);
            unrank = false;
            // this.user_icon_node.receiveData(Math.floor(Math.random() * 10) + 1)
        } else {
            this.otherhead_node.children.forEach((child, idx) => {
                if (this._ids[idx] && this._ids[idx] == player_id) {
                    wordPos = child.parent.transform.convertToWorldSpaceAR(child.position);
                    child.getChildByName('head').getChildByName('mask').active = true;
                    this.callback && this.unschedule(this.callback)
                    this.scheduleOnce(this.callback, 0.5);
                    unrank = false;
                }
            })
        }
        if (unrank) {
            this.user_icon_node.receiveData(icon)
        }
        return wordPos;
    }

    getLoseWorldPos() {
        let node = this.rest_node;
        let wordPos = node.parent.transform.convertToWorldSpaceAR(node.position);
        return wordPos;
    }

    resetBetPlayer() {
        Tween.stopAllByTarget(this.labelwin.node);
        this.labelwin.string = '';
    }


    playWinAnimation() {
        const _list = SevenUpSevenDownManager.BetsList;
        this._ids.forEach((v, idx) => {
            if (_list.has(v)) {
                let _d = _list.get(v);
                if (_d.win > 0) {
                    let child = this.otherhead_node.children[idx].getChildByName('labelwin');
                    Tween.stopAllByTarget(child);
                    child.getComponent(cc.Label).string = '+' + CurrencyHelper.format(_d.win, this.currency);
                    child.getComponent(UIOpacity).opacity = 0;
                    child.setPosition(v3(43, -10, 0)); // 从稍下方开始
                    child.scale = v3(0.8, 0.8, 1); // 初始稍小
                    tween(child)
                        .parallel(
                            tween().to(0.2, {
                                position: v3(43, 21, 0),
                                scale: v3(1, 1, 1)
                            }, { easing: 'backOut' }),
                            tween().to(0.15, { opacity: 255 }, { easing: 'cubicOut' })
                        )
                        .delay(0.6) // 显示时间
                        .to(0.15, { opacity: 0 }, { easing: 'cubicIn' })
                        .call(() => {
                            child.getComponent(cc.Label).string = '';
                            child.setPosition(v3(43, 0, 0));
                        })
                        .start();
                }
            }
        })
        if (_list.has(this._myId)) {
            let _d = _list.get(this._myId);
            if (_d.win > 0) {
                let child = this.labelwin.node;
                this.labelwin.string = '+' + CurrencyHelper.format(_d.win, this.currency);
                child.setPosition(v3(43, 0, 0))
                tween(child)
                    .parallel(
                        tween().to(0.2, {
                            position: v3(43, 21, 0),
                            scale: v3(1, 1, 1)
                        }, { easing: 'backOut' }),
                        tween().to(0.15, { opacity: 255 }, { easing: 'cubicOut' })
                    )
                    .delay(0.6) // 显示时间
                    .to(0.15, { opacity: 0 }, { easing: 'cubicIn' })
                    .call(() => {
                        this.labelwin.string = '';
                        child.setPosition(v3(43, 0, 0));
                    })
                    .start();
            }
        }
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonOne(event: cc.EventTouch) {
        let idx = 0;
        let id = this._ids[idx];
        if (!id) return;
        ViewManager.OpenPanel(this.module, 'PanelUserCenter', { idx: idx });
    }


    private onClickButtonTwo(event: cc.EventTouch) {
        let idx = 1;
        let id = this._ids[idx];
        if (!id) return;
        ViewManager.OpenPanel(this.module, 'PanelUserCenter', { idx: idx });
    }


    private onClickButtonThree(event: cc.EventTouch) {
        let idx = 2;
        let id = this._ids[idx];
        if (!id) return;
        ViewManager.OpenPanel(this.module, 'PanelUserCenter', { idx: idx });
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonOne: [GButton, this.onClickButtonOne.bind(this)],
            cc_buttonThree: [GButton, this.onClickButtonThree.bind(this)],
            cc_buttonTwo: [GButton, this.onClickButtonTwo.bind(this)],
            cc_label_coin: [cc.Label],
            cc_label_name: [cc.Label],
            cc_labelpeople: [cc.Label],
            cc_labelwin: [cc.Label],
            cc_myhead_node: [cc.Node],
            cc_otherhead_node: [cc.Node],
            cc_rest_node: [cc.Node],
            cc_spr_myhead: [cc.Sprite],
            cc_user_icon_node: [CustomUserIcon],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonOne: GButton = null;
    protected buttonThree: GButton = null;
    protected buttonTwo: GButton = null;
    protected label_coin: cc.Label = null;
    protected label_name: cc.Label = null;
    protected labelpeople: cc.Label = null;
    protected labelwin: cc.Label = null;
    protected myhead_node: cc.Node = null;
    protected otherhead_node: cc.Node = null;
    protected rest_node: cc.Node = null;
    protected spr_myhead: cc.Sprite = null;
    protected user_icon_node: CustomUserIcon = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomUser';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomUser.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomUser.VIEW_NAME;
    }
    // @view export resource end
}
