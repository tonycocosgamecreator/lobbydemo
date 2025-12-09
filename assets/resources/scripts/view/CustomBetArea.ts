// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { Tween } from 'cc';
import { UIOpacity } from 'cc';
import { Vec3 } from 'cc';
import { Vec2 } from 'cc';
import { UITransform } from 'cc';
import WheelManager from '../manager/wheel-manager';
import { randomRange } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomBetArea')
export default class CustomBetArea extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _areaId = -1;
    _width: number;
    _height: number;
    initData(area: number) {
        this._areaId = area;
        this._width = this.node.getComponent(UITransform).width / 2 - 20;
        this._height = this.node.getComponent(UITransform).height / 2 - 20;
        this.reset();
    }

    reset() {
        let node = this.light.node;
        Tween.stopAllByTarget(node.getComponent(UIOpacity));
        node.active = false;
    }


    blink(node: cc.Node, duration: number, times: number) {
        const tween = cc.tween(node.getComponent(UIOpacity));
        for (let i = 0; i < times; i++) {
            if (i === times - 1) {
                // 最后一次闪烁：淡入后保持透明度255
                tween.to(duration, { opacity: 255 });
            } else {
                // 其他闪烁：正常的淡入淡出
                tween.to(duration, { opacity: 255 })
                    .to(duration, { opacity: 0 });
            }
        }
        tween.start();
    }

    checkPos(pos: Vec2): Vec3 {
        const _centerPos = this.node.getComponent(cc.UITransform).convertToWorldSpaceAR(
            this.buttonClick.node.position
        );
        let _maxX = _centerPos.x + this._width;
        let _minX = _centerPos.x - this._width;
        let _maxY = _centerPos.y + this._height;
        let _minY = _centerPos.y - this._height;
        let x = pos.x;
        let y = pos.y;
        if (x < _minX) x = _minX;
        if (y < _minY) y = _minY;
        if (x > _maxX) x = _maxX;
        if (y > _maxY) y = _maxY;
        return new Vec3(x, y, 0);

    }

    getDeskWorldPos(): Vec3 {
        const _centerPos = this.node.getComponent(cc.UITransform).convertToWorldSpaceAR(
            this.buttonClick.node.position
        );
        let world = this.getRandomPointAround(_centerPos, this._width, this._height)
        return world
    }

    getRandomPointAround(centerPoint: Vec3, horizontalRange: number, verticalRange: number): Vec3 {
        const randomX = randomRange(-horizontalRange, horizontalRange);
        const randomY = randomRange(-verticalRange, verticalRange);
        return new Vec3(
            centerPoint.x + randomX,
            centerPoint.y + randomY,
            centerPoint.z,
        );
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonClick(event: cc.EventTouch) {
        const touchPos = event.getUILocation();
        let world = this.checkPos(touchPos);
        WheelManager.sendMyBetMessage(this._areaId, world)
    }
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonClick: [GButton, this.onClickButtonClick.bind(this)],
            cc_light: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonClick: GButton = null;
    protected light: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomBetArea';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomBetArea.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomBetArea.VIEW_NAME;
    }
    // @view export resource end
}
