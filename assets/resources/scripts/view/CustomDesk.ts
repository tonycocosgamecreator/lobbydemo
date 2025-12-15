// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomBetArea from 'db://assets/resources/scripts/view/CustomBetArea';
import { Vec3 } from 'cc';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomDesk')
export default class CustomDesk extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _stage = -1;
    initData() {
        this.node.children.forEach((child, idx) => {
            child.getComponent(CustomBetArea).initData(idx + 1);
        });
    }

    reset() {
        this.node.children.forEach(child => {
            child.getComponent(CustomBetArea).reset();
        });
    }

    getDeskWorldPosByAid(areaId: number): Vec3 {
        let child = this.node.children[areaId - 1];
        let world = child.getComponent(CustomBetArea).getDeskWorldPos();
        return world || null
    }

    showResult(){
         this.node.children.forEach(child => {
            child.getComponent(CustomBetArea).showResult();
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
            cc_area1: [CustomBetArea],
            cc_area10: [CustomBetArea],
            cc_area11: [CustomBetArea],
            cc_area12: [CustomBetArea],
            cc_area13: [CustomBetArea],
            cc_area14: [CustomBetArea],
            cc_area15: [CustomBetArea],
            cc_area16: [CustomBetArea],
            cc_area17: [CustomBetArea],
            cc_area18: [CustomBetArea],
            cc_area19: [CustomBetArea],
            cc_area2: [CustomBetArea],
            cc_area20: [CustomBetArea],
            cc_area21: [CustomBetArea],
            cc_area22: [CustomBetArea],
            cc_area23: [CustomBetArea],
            cc_area24: [CustomBetArea],
            cc_area25: [CustomBetArea],
            cc_area26: [CustomBetArea],
            cc_area27: [CustomBetArea],
            cc_area28: [CustomBetArea],
            cc_area29: [CustomBetArea],
            cc_area3: [CustomBetArea],
            cc_area30: [CustomBetArea],
            cc_area31: [CustomBetArea],
            cc_area32: [CustomBetArea],
            cc_area33: [CustomBetArea],
            cc_area34: [CustomBetArea],
            cc_area35: [CustomBetArea],
            cc_area36: [CustomBetArea],
            cc_area37: [CustomBetArea],
            cc_area38: [CustomBetArea],
            cc_area39: [CustomBetArea],
            cc_area4: [CustomBetArea],
            cc_area40: [CustomBetArea],
            cc_area41: [CustomBetArea],
            cc_area42: [CustomBetArea],
            cc_area43: [CustomBetArea],
            cc_area44: [CustomBetArea],
            cc_area45: [CustomBetArea],
            cc_area46: [CustomBetArea],
            cc_area47: [CustomBetArea],
            cc_area48: [CustomBetArea],
            cc_area49: [CustomBetArea],
            cc_area5: [CustomBetArea],
            cc_area6: [CustomBetArea],
            cc_area7: [CustomBetArea],
            cc_area8: [CustomBetArea],
            cc_area9: [CustomBetArea],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected area1: CustomBetArea = null;
    protected area10: CustomBetArea = null;
    protected area11: CustomBetArea = null;
    protected area12: CustomBetArea = null;
    protected area13: CustomBetArea = null;
    protected area14: CustomBetArea = null;
    protected area15: CustomBetArea = null;
    protected area16: CustomBetArea = null;
    protected area17: CustomBetArea = null;
    protected area18: CustomBetArea = null;
    protected area19: CustomBetArea = null;
    protected area2: CustomBetArea = null;
    protected area20: CustomBetArea = null;
    protected area21: CustomBetArea = null;
    protected area22: CustomBetArea = null;
    protected area23: CustomBetArea = null;
    protected area24: CustomBetArea = null;
    protected area25: CustomBetArea = null;
    protected area26: CustomBetArea = null;
    protected area27: CustomBetArea = null;
    protected area28: CustomBetArea = null;
    protected area29: CustomBetArea = null;
    protected area3: CustomBetArea = null;
    protected area30: CustomBetArea = null;
    protected area31: CustomBetArea = null;
    protected area32: CustomBetArea = null;
    protected area33: CustomBetArea = null;
    protected area34: CustomBetArea = null;
    protected area35: CustomBetArea = null;
    protected area36: CustomBetArea = null;
    protected area37: CustomBetArea = null;
    protected area38: CustomBetArea = null;
    protected area39: CustomBetArea = null;
    protected area4: CustomBetArea = null;
    protected area40: CustomBetArea = null;
    protected area41: CustomBetArea = null;
    protected area42: CustomBetArea = null;
    protected area43: CustomBetArea = null;
    protected area44: CustomBetArea = null;
    protected area45: CustomBetArea = null;
    protected area46: CustomBetArea = null;
    protected area47: CustomBetArea = null;
    protected area48: CustomBetArea = null;
    protected area49: CustomBetArea = null;
    protected area5: CustomBetArea = null;
    protected area6: CustomBetArea = null;
    protected area7: CustomBetArea = null;
    protected area8: CustomBetArea = null;
    protected area9: CustomBetArea = null;
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
