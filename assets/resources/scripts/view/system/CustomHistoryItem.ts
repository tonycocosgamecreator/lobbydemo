// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { CurrencyHelper } from '../../helper/currency-helper';
import WalletManager from '../../manager/wallet-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomHistoryItem')
export default class CustomHistoryItem extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    @ViewBase.requireResourceLoaded
    fillData(data: sevenupdown.SevenUpDownPlayerHistory, index: number) {
        const urls1 = ['textures/system/icon_tc_bz_02/spriteFrame', 'textures/system/XFJ_Img_9/spriteFrame'];
        this.itemBg.spriteFrame = this.getSpriteFrame(urls1[index % 2]);
        this.labelPeriod.string = data.period;
        const currency = WalletManager.currency;
        this.labelBetVal.string = CurrencyHelper.format(+data.bet, currency);
        this.labelWinBet.string = CurrencyHelper.format(+data.win_coin, currency);
        let wintype = data.win_type || [];
        this.result.children.forEach((child, idx) => {
            child.active = !!wintype[idx];
            if (wintype[idx]) {
                child.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/ui/" + wintype[idx] + "/spriteFrame");
            }
        })
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    // @view export event end


    // @view export resource begin

    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_itemBg: [cc.Sprite],
            cc_labelBetVal: [cc.Label],
            cc_labelPeriod: [cc.Label],
            cc_labelWinBet: [cc.Label],
            cc_result: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected itemBg: cc.Sprite = null;
    protected labelBetVal: cc.Label = null;
    protected labelPeriod: cc.Label = null;
    protected labelWinBet: cc.Label = null;
    protected result: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomHistoryItem';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomHistoryItem.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomHistoryItem.VIEW_NAME;
    }

    // @view export resource end
}
