// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import WalletManager from '../manager/wallet-manager';
import ViewManager from '../core/manager/view-manager';
import SsPlayerManager from '../manager/ss-player-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomTop')
export default class CustomTop extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    buildUi() {
        BaseGlobal.registerListeners(this, {
            [GameEvent.PLAYER_CURRENCY_UPDATE]: this._updateTotalBalance,
            [GameEvent.PLAYER_CHANGE_AVATAR]: this._updateIcon
        });
        this._updateTotalBalance();
        this.menu_node.active = false;
        this.buttonCloseSet.useDefaultEffect();
        this.buttonSet.useDefaultEffect();
        this.buttonHistory.useDefaultEffect();
        this._updateIcon([true, SsPlayerManager.Icon]);
    }

    _updateTotalBalance() {
        this.labelbalance.string = WalletManager.balance.toFixed(2) + ' ' + WalletManager.currency;
    }

    _updateIcon(data: [boolean, number]) {
        if (data[0] == false) {
            return;
        }
        this.sprIcon.spriteFrame = this.getSpriteFrame("textures/avatars/av-" + data[1] + "/spriteFrame");
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonHistory(event: cc.EventTouch) {
        ViewManager.OpenPanel(this.module, 'PanelHistory');
    }


    private onClickButtonSet(event: cc.EventTouch) {
        this.menu_node.active = true;
    }


    private onClickButtonCloseSet(event: cc.EventTouch) {
        this.menu_node.active = false;
    }


    private onClickButtonIcon(event: cc.EventTouch) {
        ViewManager.OpenPanel(this.module, 'PanelChangeIcon');
    }


    private onClickButtonRule(event: cc.EventTouch) {
      ViewManager.OpenPanel(this.module, 'PanelRule');
    }


    private onClickButtonMusic(event: cc.EventTouch) {
        cc.log('on click event cc_buttonMusic');
    }


    private onClickButtonSound(event: cc.EventTouch) {
        cc.log('on click event cc_buttonSound');
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonCloseSet: [GButton, this.onClickButtonCloseSet.bind(this)],
            cc_buttonHistory: [GButton, this.onClickButtonHistory.bind(this)],
            cc_buttonIcon: [GButton, this.onClickButtonIcon.bind(this)],
            cc_buttonMusic: [GButton, this.onClickButtonMusic.bind(this)],
            cc_buttonRule: [GButton, this.onClickButtonRule.bind(this)],
            cc_buttonSet: [GButton, this.onClickButtonSet.bind(this)],
            cc_buttonSound: [GButton, this.onClickButtonSound.bind(this)],
            cc_labelbalance: [cc.Label],
            cc_menu_node: [cc.Node],
            cc_sprIcon: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonCloseSet: GButton = null;
    protected buttonHistory: GButton = null;
    protected buttonIcon: GButton = null;
    protected buttonMusic: GButton = null;
    protected buttonRule: GButton = null;
    protected buttonSet: GButton = null;
    protected buttonSound: GButton = null;
    protected labelbalance: cc.Label = null;
    protected menu_node: cc.Node = null;
    protected sprIcon: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomTop';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomTop.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomTop.VIEW_NAME;
    }
    // @view export resource end
}
