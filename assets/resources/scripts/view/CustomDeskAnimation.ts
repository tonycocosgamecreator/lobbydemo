// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomDeskAnimationItem from 'db://assets/resources/scripts/view/CustomDeskAnimationItem';
import GameManager from '../manager/game-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomDeskAnimation')
export default class CustomDeskAnimation extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    initData(stage: number) {
        this.reset();
        if (stage == baccarat.DeskStage.OpenStage) {
            this.playDoubleStandbyAnimaton();
        }
    }

    playDoubleEnterAnimaton() {
        const multiple = GameManager.Multiple;
        for (let i = 0; i < multiple.length; i++) {
            if (multiple[i] && +multiple[i]) {
                this.node.children[i].getComponent(CustomDeskAnimationItem).playDoubleEnterAnimaton();
            }
        }
    }

    playDoubleStandbyAnimaton() {
        const multiple = GameManager.Multiple;
        for (let i = 0; i < multiple.length; i++) {
            if (multiple[i] && +multiple[i]) {
                this.node.children[i].getComponent(CustomDeskAnimationItem).playDoubleStandbyAnimaton();
            }
        }
    }

    playDoubleExitAnimaton() {
        this.node.children.forEach(child => {
            child.getComponent(CustomDeskAnimationItem).playDoubleExitAnimaton();
        })
    }

    playLiHuaAnimaton() {
        const winArea = GameManager.WinArea;
        this.node.children.forEach((child, idx) => {
            const areaId = idx + 1;
            if (winArea.indexOf(areaId) != -1) {
                child.getComponent(CustomDeskAnimationItem).playLiHuaAnimaton(areaId);
            }
        })
    }

    reset() {
        this.node.children.forEach(child => {
            child.getComponent(CustomDeskAnimationItem).reset();
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
            cc_item1: [CustomDeskAnimationItem],
            cc_item10: [CustomDeskAnimationItem],
            cc_item11: [CustomDeskAnimationItem],
            cc_item12: [CustomDeskAnimationItem],
            cc_item13: [CustomDeskAnimationItem],
            cc_item2: [CustomDeskAnimationItem],
            cc_item3: [CustomDeskAnimationItem],
            cc_item4: [CustomDeskAnimationItem],
            cc_item5: [CustomDeskAnimationItem],
            cc_item6: [CustomDeskAnimationItem],
            cc_item7: [CustomDeskAnimationItem],
            cc_item8: [CustomDeskAnimationItem],
            cc_item9: [CustomDeskAnimationItem],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected item1: CustomDeskAnimationItem = null;
    protected item10: CustomDeskAnimationItem = null;
    protected item11: CustomDeskAnimationItem = null;
    protected item12: CustomDeskAnimationItem = null;
    protected item13: CustomDeskAnimationItem = null;
    protected item2: CustomDeskAnimationItem = null;
    protected item3: CustomDeskAnimationItem = null;
    protected item4: CustomDeskAnimationItem = null;
    protected item5: CustomDeskAnimationItem = null;
    protected item6: CustomDeskAnimationItem = null;
    protected item7: CustomDeskAnimationItem = null;
    protected item8: CustomDeskAnimationItem = null;
    protected item9: CustomDeskAnimationItem = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomDeskAnimation';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomDeskAnimation.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomDeskAnimation.VIEW_NAME;
    }
    // @view export resource end
}
