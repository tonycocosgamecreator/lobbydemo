// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomMenu from 'db://assets/resources/scripts/view/system/CustomMenu';
import BaseGlobal from '../../core/message/base-global';
import { GameEvent } from '../../define';
import WalletManager from '../../manager/wallet-manager';
import { CurrencyHelper } from '../../helper/currency-helper';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomBaccaratTop')
export default class CustomBaccaratTop extends ViewBase {

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
            [GameEvent.PLAYER_INFO_UPDATE]: this.updateTotalBalance,
            [GameEvent.PLYER_TOTAL_BET_UPDATE]: this.updatePlayBalance,
        });
        this.labelGameTitle.string = 'sevenupdown';
        this.menu.show(false, 0);
        this.updatePlayBalance();
    }

    updateTotalBalance(balance: number): void {
        const currency = WalletManager.currency;
        this.labelCoin.string = CurrencyHelper.format(balance, currency, { showSymbol: true });
        this.labelCurrency.string = '';
    }

    updatePlayBalance() {
        const balance = WalletManager.balance;
        this.updateTotalBalance(balance);
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonMenu(event: cc.EventTouch) {
        this.menu.show(true, 0.35);
    }
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_bg: [cc.Sprite],
            cc_buttonMenu: [GButton, this.onClickButtonMenu.bind(this)],
            cc_labelCoin: [cc.Label],
            cc_labelCurrency: [cc.Label],
            cc_labelGameTitle: [cc.Label],
            cc_menu: [CustomMenu],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected bg: cc.Sprite = null;
    protected buttonMenu: GButton = null;
    protected labelCoin: cc.Label = null;
    protected labelCurrency: cc.Label = null;
    protected labelGameTitle: cc.Label = null;
    protected menu: CustomMenu = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomBaccaratTop';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomBaccaratTop.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomBaccaratTop.VIEW_NAME;
    }
    // @view export resource end
}
