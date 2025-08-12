// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { Vec3 } from 'cc';
import { tween } from 'cc';
import { v3 } from 'cc';
import PoolManager from '../core/manager/pool-manager';
import CustomChip from './CustomChip';
import { UITransform } from 'cc';
import { Node } from 'cc';
import { UIOpacity } from 'cc';
import { Tween } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomFlyChip')
export default class CustomFlyChip extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    //------------------------ 内部逻辑 ------------------------//
    _baseDuration: number = 0.1; // 基础飞行时间(用于基准距离)
    _baseDistance: number = 200; // 基准距离(像素)   
    _targetScale: number = 0.5;

    reset() {
        this.node.children.forEach(t => {
            this._clearChip(t);
        })
    }
    /**
    * 添加单个筹码
    * @param index 筹码类型
    * @param sourceWorldPos 添加筹码位置的世界坐标
    * @param endWorldPos 飞筹码终点的世界坐标
    */
    addFlyChip(index: number, sourceWorldPos: Vec3, endWorldPos: Vec3) {
        const chip = PoolManager.Get(CustomChip);
        chip.setBetData(index);
        let targetLocalPos = this.node.transform.convertToNodeSpaceAR(sourceWorldPos);
        this.node.addChild(chip.node);
        chip.node.position = targetLocalPos;
        let endPos = this.node.transform.convertToNodeSpaceAR(endWorldPos);
        this._flyToTarget(chip.node, endPos);
    }
    /**
    * 回收筹码
    * * @param recycleWorldPos 回收筹码终点的世界坐标
    */
    recycleChip(recycleWorldPos: Vec3) {
        let recyclePos = this.node.transform.convertToNodeSpaceAR(recycleWorldPos);
        this.node.children.forEach(t => {
            this._flyToEnd(t, recyclePos);
        })
    }
    /**
    * 飞筹码动画
    */
    _flyToTarget(flyObject: cc.Node, endPos: cc.Vec3): void {
        let startPos = flyObject.position;
        let distance = Vec3.distance(startPos, endPos);
        let flyDuration = this._calculateDurationByDistance(distance);
        tween(flyObject)
            .parallel(
                tween().to(flyDuration, {
                    position: endPos
                }, {
                    easing: 'quadOut',
                }),
                tween().to(flyDuration, {
                    scale: v3(this._targetScale, this._targetScale, this._targetScale)
                }, {
                    easing: 'sineOut'
                })
            )
            .call(() => {
                //筹码落地声音
            })
            .start();

    }
    /**
    * 收筹码动画
    */
    _flyToEnd(flyObject: cc.Node, endPos: cc.Vec3): void {
        let startPos = flyObject.position;
        let distance = Vec3.distance(startPos, endPos);
        let flyDuration = this._calculateDurationByDistance(distance);
        tween(flyObject)
            .parallel(
                tween().to(flyDuration, {
                    position: endPos
                }, {
                    easing: 'quadOut',
                }),
                tween().to(flyDuration, { opacity: 150 }),
                tween().to(flyDuration, { scale: v3(0.1, 0.1, 0.1) })
            )
            .call(() => {
                if (flyObject.getComponent(CustomChip)) {
                    this._clearChip(flyObject);
                }
            })
            .start();
    }
    /**
    * 飞筹码动画需要的时间
    */
    _calculateDurationByDistance(distance: number): number {
        return (distance / this._baseDistance) * this._baseDuration;
    }

    /**
    * 回收筹码到对象池
    */
    _clearChip(chip: Node) {
        chip.scale = v3(1, 1, 1);
        chip.getComponent(UIOpacity).opacity = 255;
        Tween.stopAllByTarget(chip);
        PoolManager.Put(chip.getComponent(CustomChip));
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
    public static readonly VIEW_NAME = 'CustomFlyChip';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomFlyChip.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomFlyChip.VIEW_NAME;
    }

    // @view export resource end
}
