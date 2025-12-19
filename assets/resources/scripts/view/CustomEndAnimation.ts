// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
import { sp } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomEndAnimation')
export default class CustomEndAnimation extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    reset() {
        this.node.children.forEach(child => {
            child.active = false;
        })
    }

    showResult() {
        let wintype = SevenUpSevenDownManager.WinType;
        for (let i = 0; i < this.node.children.length; i++) {
            let child = this.node.children[i];
            let win = wintype.indexOf(i + 1) == -1 ? false : true;
            if (win) {
                let name = (i == 5 || i == 11 || i == 12) ? 'animation' : 'animation2';
                child.getComponentInChildren(sp.Skeleton).setAnimation(0, name, false);
                child.active = true;
            }
        }
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
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomEndAnimation';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomEndAnimation.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomEndAnimation.VIEW_NAME;
    }

    // @view export resource end
}
