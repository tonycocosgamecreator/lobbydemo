// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import * as cc from 'cc';
import { math } from 'cc';
import CustomRouletteWheel from './CustomRouletteWheel';
import { Vec3 } from 'cc';
import { UIOpacity } from 'cc';
import { tween } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomRoulettePointer')
export default class CustomRoulettePointer extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    update() {
        if (!this._wheel) return;
        const degrees = math.toDegree(this._wheel.currentAngle);
        this.node.setRotationFromEuler(0, 0, -degrees);
        this.node.setPosition(this._wheel.Position);
    }
    //------------------------ 内部逻辑 ------------------------//
    _wheel: CustomRouletteWheel = null;

    init(wheel: CustomRouletteWheel) {
        this._wheel = wheel;
        this.node.setPosition(this._wheel.Position);
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
    public static readonly VIEW_NAME = 'CustomRoulettePointer';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomRoulettePointer.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomRoulettePointer.VIEW_NAME;
    }

    // @view export resource end
}
