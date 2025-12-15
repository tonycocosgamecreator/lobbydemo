// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import WalletManager from '../manager/wallet-manager';
import WheelManager from '../manager/wheel-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomRoomData')
export default class CustomRoomData extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    updateRoomData() {
        const currency = WalletManager.currency;
        let info = WalletManager.getCurrencyBetInfo(currency);
        this.labelMinBet.string = info.min_bet + '';
        this.labelRID.string = WheelManager.DeskId + '';
        this.labelUID.string = WheelManager.Period + '';
    }

    updatePeriod() {
        this.labelUID.string = WheelManager.Period + '';
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
            cc_labelMinBet: [cc.Label],
            cc_labelRID: [cc.Label],
            cc_labelUID: [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected labelMinBet: cc.Label = null;
    protected labelRID: cc.Label = null;
    protected labelUID: cc.Label = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomRoomData';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomRoomData.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomRoomData.VIEW_NAME;
    }

    // @view export resource end
}
