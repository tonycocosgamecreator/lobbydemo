// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import Timer from '../core/utils/timer';
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
    public fillData(data: supersevenbaccarat.MsgBetRecord) {
        this.labelOrderId.string = data.sn;
        this.labelAmount.string = data.bet + '';
        if (data.win_gold > 0) {
            this.labelPrize.string = "+" + data.win_gold.toFixed(2);
            this.labelPrize.color = cc.color('#A68E50');
        } else {
            this.labelPrize.string = data.win_gold.toFixed(2);
            this.labelPrize.color = cc.color('#38B059');
        }
        this.labelGameTime.string = Timer.formateDate(data.utc_time,'yyyy/MM/dd\nHH:mm:ss')
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
            cc_labelAmount: [cc.Label],
            cc_labelGameTime: [cc.Label],
            cc_labelOrderId: [cc.Label],
            cc_labelPrize: [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected labelAmount: cc.Label = null;
    protected labelGameTime: cc.Label = null;
    protected labelOrderId: cc.Label = null;
    protected labelPrize: cc.Label = null;
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
