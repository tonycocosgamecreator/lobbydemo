// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import JmManager from '../manager/jm-manager';
import { Vec3 } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomResult')
export default class CustomResult extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    reset() {
        cc.Tween.stopAllByTarget(this.node);
        this.node.active = false;
    }

    _init() {
        let open = JmManager.openPos;
        this.node.children.forEach((t, idx) => {
            t.active = !!open[idx];
            if (open[idx]) {
                t.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/JM_Img_" + (11 + (open[idx] * 3)) + "/spriteFrame");
            }
        });
    }

    showResult() {
        this._init();
        this.node.active = true;
        this.node.scale = new Vec3(0.1, 0.1, 0.1);
        cc.tween(this.node)
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    /**
      * 断线重连展示结果
      */
    reconnectResult() {
        this._init();
        this.node.active = true;
        this.node.scale = new Vec3(1, 1, 1);
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
        return CustomResult.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomResult.VIEW_NAME;
    }
    // @view export resource end
}
