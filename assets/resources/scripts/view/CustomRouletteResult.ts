// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { UIOpacity } from 'cc';
import { tween } from 'cc';
import { Tween } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomResult')
export default class CustomRouletteResult extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    showResult(targetNumber: number) {
        this.node.active = true;
        const opacity = this.node.getComponent(UIOpacity)
        if (opacity) Tween.stopAllByTarget(opacity);
        opacity.opacity = 255;
        this.labelResult.string = targetNumber + '';
        this.sprbg.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/ui/LP_Img_${this.getColorByIdx(targetNumber)}/spriteFrame`);
    }

    fadeOutNode(node: cc.Node, duration: number = 0.25): Promise<void> {
        return new Promise((resolve) => {
            if (!node || !node.isValid || !node.active) {
                resolve();
                return;
            }
            const opacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
            tween(opacity)
                .stop()
                .to(duration, { opacity: 0 }, { easing: 'quadIn' })
                .call(() => {
                    node.active = false;
                    opacity.opacity = 255;
                    resolve();
                })
                .start();
        });
    }

    //4 红色 5黑色 6绿色
    getColorByIdx(idx: number): number {
        if (idx == 0) return 6;
        if (idx <= 10) {
            return idx % 2 == 1 ? 4 : 5;
        }
        if (idx <= 18) {
            return idx % 2 == 1 ? 5 : 4;
        }
        if (idx <= 28) {
            return idx % 2 == 1 ? 4 : 5;
        }
        if (idx <= 36) {
            return idx % 2 == 1 ? 5 : 4;
        }
        return 3;
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
            cc_labelResult: [cc.Label],
            cc_sprbg: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected labelResult: cc.Label = null;
    protected sprbg: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomResult';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomRouletteResult.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomRouletteResult.VIEW_NAME;
    }

    // @view export resource end
}
