// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { UITransform } from 'cc';
import GameManager from '../manager/game-manager';
import { Color } from 'cc';
import { Vec3 } from 'cc';
import { Vec2 } from 'cc';
import { randomRange } from 'cc';
import { UIOpacity } from 'cc';
import { Tween } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomDeskInfoItem')
export default class CustomDeskInfoItem extends ViewBase {

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
    _buttomArea: boolean = true;
    initData(area: number) {
        this.reset();
        this._areaId = area;
        const odds = GameManager.Odds;
        this._width = this.node.getComponent(UITransform).width / 2 - 20;
        this._height = this.node.getComponent(UITransform).height / 2 - 20;
        this.labelOdd.string = `${odds[area - 1]}`;
        this._buttomArea = (area == 6 || area == 12 || area == 13) ? false : true;
        this.labelIdx.string = this._buttomArea ? `${area + 1}` : '';
        this.labelOdd.color = this._buttomArea ? new Color('#808080') : new Color('#ffffffff');
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

    showResult() {
        const winArea = GameManager.WinArea;
        if (winArea.indexOf(this._areaId) != -1) {
            this.sprLightning.node.active = true;
            if (this._buttomArea) {
                this.labelIdx.color = new Color('#ffffffff');
                this.labelOdd.color = new Color('#ffffffff');
            }
        }
    }
    playBetAnimation() {
        const child = this.sprClick.node;
        const opacity = child.getComponent(UIOpacity)
        Tween.stopAllByTarget(opacity);
        opacity.opacity = 0;
        child.active = true;
        cc.tween(opacity)
            .to(0.12, { opacity: 30 })
            .delay(0.03)
            .to(0.1, { opacity: 0 })
            .call(() => {
                child.active = false;
            })
            .start();
    }

    reset() {
        this.sprLightning.node.active = false;
        this.sprClick.node.active = false;
        this.labelIdx.color = new Color('#808080');
        this.labelOdd.color = this._buttomArea ? new Color('#808080') : new Color('#ffffffff');
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
        GameManager.sendMyBetMessage(this._areaId, world)
    }
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonClick: [GButton, this.onClickButtonClick.bind(this)],
            cc_labelIdx: [cc.Label],
            cc_labelOdd: [cc.Label],
            cc_sprClick: [cc.Sprite],
            cc_sprLightning: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonClick: GButton = null;
    protected labelIdx: cc.Label = null;
    protected labelOdd: cc.Label = null;
    protected sprClick: cc.Sprite = null;
    protected sprLightning: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomDeskInfoItem';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomDeskInfoItem.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomDeskInfoItem.VIEW_NAME;
    }
    // @view export resource end
}
