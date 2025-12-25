// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomDeskInfoItem from 'db://assets/resources/scripts/view/CustomDeskInfoItem';
import { Vec3 } from 'cc';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomDeskInfo')
export default class CustomDeskInfo extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    initData(stage: number) {
        this.node.children.forEach((child, idx) => {
            child.getComponent(CustomDeskInfoItem).initData(idx + 1);
        });
        if (stage == baccarat.DeskStage.SettleStage) {
            this.showResult();
        }
    }

    playBetAnimationByArea(areaId: number) {
        this.node.children[areaId - 1].getComponent(CustomDeskInfoItem).playBetAnimation();
    }

    showResult() {
        this.node.children.forEach(child => {
            child.getComponent(CustomDeskInfoItem).showResult();
        });
    }

    getDeskWorldPosByAid(areaId: number): Vec3 {
        let child = this.node.children[areaId - 1];
        let world = child.getComponent(CustomDeskInfoItem).getDeskWorldPos();
        return world || null
    }

    reset() {
        this.node.children.forEach(child => {
            child.getComponent(CustomDeskInfoItem).reset();
        });
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
            cc_item1: [CustomDeskInfoItem],
            cc_item10: [CustomDeskInfoItem],
            cc_item11: [CustomDeskInfoItem],
            cc_item12: [CustomDeskInfoItem],
            cc_item13: [CustomDeskInfoItem],
            cc_item2: [CustomDeskInfoItem],
            cc_item3: [CustomDeskInfoItem],
            cc_item4: [CustomDeskInfoItem],
            cc_item5: [CustomDeskInfoItem],
            cc_item6: [CustomDeskInfoItem],
            cc_item7: [CustomDeskInfoItem],
            cc_item8: [CustomDeskInfoItem],
            cc_item9: [CustomDeskInfoItem],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected item1: CustomDeskInfoItem = null;
    protected item10: CustomDeskInfoItem = null;
    protected item11: CustomDeskInfoItem = null;
    protected item12: CustomDeskInfoItem = null;
    protected item13: CustomDeskInfoItem = null;
    protected item2: CustomDeskInfoItem = null;
    protected item3: CustomDeskInfoItem = null;
    protected item4: CustomDeskInfoItem = null;
    protected item5: CustomDeskInfoItem = null;
    protected item6: CustomDeskInfoItem = null;
    protected item7: CustomDeskInfoItem = null;
    protected item8: CustomDeskInfoItem = null;
    protected item9: CustomDeskInfoItem = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomDeskInfo';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomDeskInfo.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomDeskInfo.VIEW_NAME;
    }
    // @view export resource end
}
