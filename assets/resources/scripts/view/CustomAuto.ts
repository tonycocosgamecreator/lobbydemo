// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import GButtonGroup from 'db://assets/resources/scripts/core/view/gbutton-group';
import SuperSevenManager from '../manager/ss-manager';
import WalletManager from '../manager/wallet-manager';
import ViewManager from '../core/manager/view-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomAuto')
export default class CustomAuto extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _bets: number[] = [];

    _index: number = 0;
    buildUi() {
        this.tabGroupAuto.init();
        this.tabGroupSpeed.init();
        this.tabGroupAuto.iconSpriteFrames = [
            this.getSpriteFrameBySpriteAtlas('plists/LMSlot_SpineOption', 'btn2'),
            this.getSpriteFrameBySpriteAtlas('plists/LMSlot_SpineOption', 'btn1')
        ];
        this.tabGroupSpeed.iconSpriteFrames = [
            this.getSpriteFrameBySpriteAtlas('plists/LMSlot_SpineOption', 'btn2'),
            this.getSpriteFrameBySpriteAtlas('plists/LMSlot_SpineOption', 'btn1')
        ];
        this.tabGroupAuto.titleColors = [
            cc.color('#739E7B'),
            cc.Color.WHITE
        ];
        this.tabGroupSpeed.titleColors = [
            cc.color('#739E7B'),
            cc.Color.WHITE
        ];
        let _t = SuperSevenManager.Times;
        this.tabGroupSpeed.selectIndex = _t == 1 ? 0 : 1;
        this.tabGroupAuto.selectIndex = 0;
        this._bets = WalletManager.getCurrencyBetSize();
        this._index = 0;
        this.labelTotal.string = this._bets[this._index] + '';
    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonClose(event: cc.EventTouch) {
        ViewManager.ClosePanel('PanelAuto');
    }
    private onClickButtonspeed1(event: cc.EventTouch) {
        cc.log('on click event cc_buttonspeed1');
        this.tabGroupSpeed.selectIndex = 0;
    }
    private onClickButtonspeed2(event: cc.EventTouch) {
        this.tabGroupSpeed.selectIndex = 1;
    }
    private onClickButtonauto1(event: cc.EventTouch) {
        cc.log('on click event cc_buttonauto1');
        this.tabGroupAuto.selectIndex = 0;
    }
    private onClickButtonauto2(event: cc.EventTouch) {
        cc.log('on click event cc_buttonauto2');
        this.tabGroupAuto.selectIndex = 1;
    }
    private onClickButtonauto3(event: cc.EventTouch) {
        cc.log('on click event cc_buttonauto3');
        this.tabGroupAuto.selectIndex = 2;
    }
    private onClickButtonauto4(event: cc.EventTouch) {
        cc.log('on click event cc_buttonauto4');
        this.tabGroupAuto.selectIndex = 3;
    }
    private onClickButtonauto5(event: cc.EventTouch) {
        cc.log('on click event cc_buttonauto5');
        this.tabGroupAuto.selectIndex = 4;
    }
    private onClickButtonAdd(event: cc.EventTouch) {
        cc.log('on click event cc_buttonAdd');
        if (this._index == this._bets.length - 1) return;
        this._index++;
        this.labelTotal.string = this._bets[this._index] + '';
    }
    private onClickButtonSub(event: cc.EventTouch) {
        cc.log('on click event cc_buttonSub');
         if (this._index == 0) return;
        this._index--;
        this.labelTotal.string = this._bets[this._index] + '';
    }
    private onClickButton_auto(event: cc.EventTouch) {
        cc.log('on click event cc_button_auto');
    }
    // @view export event end


    // @view export resource begin

    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonAdd: [GButton, this.onClickButtonAdd.bind(this)],
            cc_buttonClose: [GButton, this.onClickButtonClose.bind(this)],
            cc_buttonSub: [GButton, this.onClickButtonSub.bind(this)],
            cc_button_auto: [GButton, this.onClickButton_auto.bind(this)],
            cc_buttonauto1: [GButton, this.onClickButtonauto1.bind(this)],
            cc_buttonauto2: [GButton, this.onClickButtonauto2.bind(this)],
            cc_buttonauto3: [GButton, this.onClickButtonauto3.bind(this)],
            cc_buttonauto4: [GButton, this.onClickButtonauto4.bind(this)],
            cc_buttonauto5: [GButton, this.onClickButtonauto5.bind(this)],
            cc_buttonspeed1: [GButton, this.onClickButtonspeed1.bind(this)],
            cc_buttonspeed2: [GButton, this.onClickButtonspeed2.bind(this)],
            cc_labelTotal: [cc.Label],
            cc_tabGroupAuto: [GButtonGroup],
            cc_tabGroupSpeed: [GButtonGroup],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonAdd: GButton = null;
    protected buttonClose: GButton = null;
    protected buttonSub: GButton = null;
    protected button_auto: GButton = null;
    protected buttonauto1: GButton = null;
    protected buttonauto2: GButton = null;
    protected buttonauto3: GButton = null;
    protected buttonauto4: GButton = null;
    protected buttonauto5: GButton = null;
    protected buttonspeed1: GButton = null;
    protected buttonspeed2: GButton = null;
    protected labelTotal: cc.Label = null;
    protected tabGroupAuto: GButtonGroup = null;
    protected tabGroupSpeed: GButtonGroup = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomAuto';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomAuto.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomAuto.VIEW_NAME;
    }

    // @view export resource end
}
