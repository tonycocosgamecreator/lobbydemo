// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomItem from 'db://assets/resources/scripts/view/CustomItem';
import { UITransform } from 'cc';
import { Column } from './CustomRotation';
import { Global } from '../global';
import { GameEvent } from '../define';
import BaseGlobal from '../core/message/base-global';
import SuperSevenManager from '../manager/ss-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end
enum SPIN_STATES {
    IDLE = 'idle',
    ACCELERATING = 'accelerating',
    CRUISING = 'cruising',
    DECELERATING = 'decelerating',
    STOPPED = 'stopped'
};
const { ccclass, property } = cc._decorator;
@ccclass('CustomList')
export default class CustomList extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _listName = ['10109_symbols_wild_3', '10109_symbols_wild_2', '10109_symbols_scatter', '10109_symbols_7_red', '10109_symbols_7_blue', '10109_symbols_bar_3', '10109_symbols_bar_2', '10109_symbols_bar_1', '10109_symbols_cherry']
    _spineName = ['3xwild_win', '2xwild_win', 'scatter_win', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']
    _totalHeight: number = 0;
    _itemHight: number = 0;
    _anchorY: number = 0;
    _endY: number = 0;
    _nodeLength: number = 0;
    _isStopping: boolean = true;
    acceleration: number = 8000; // 加速度(像素/秒²)

    maxSpeed: number = 4000; // 最大速度(像素/秒)

    deceleration: number = 8000; // 减速度(像素/秒²)

    maxSpinTime: number = 1; // 最大旋转时间(秒)

    currentSpeed: number = 0;
    spinState: string = SPIN_STATES.IDLE;
    spinStartTime: number = 0;
    targetNode: cc.Node = null;
    targetPosition: number = 0;//最终停止的位置
    _column: Column = Column.Left;//属于第几列

    buildUi() {
        this.reset();
        this._itemHight = this.node.children[0].getComponent(UITransform).height;
        this._anchorY = this.node.children[0].getComponent(UITransform).anchorY;
        this._endY = -(this._itemHight + this._itemHight * this._anchorY);
        this._nodeLength = this.node.children.length;
        this._totalHeight = this._itemHight * this._nodeLength;
        for (let i = 0; i < this._nodeLength; i++) {
            const node = this.node.children[i];
            let y = this._itemHight * this._anchorY + this._itemHight * (i - 1);
            node.setPosition(0, y, 0);
            node.getComponent(CustomItem).Index = i;
        }
    }

    updateTimes() {
        let _t = SuperSevenManager.Times;
        if (_t == 1) {
            this.acceleration = 6000;
            this.deceleration = 6000;
            this.maxSpeed = 3000;
        } else {
            this.acceleration = 8000;
            this.deceleration = 8000;
            this.maxSpeed = 4000;
        }
        this.maxSpinTime = 1;
    }

    flashAnimation(arr: number[][]) {
        this.clearTimer();
        let startIdx = 0;
        let maxIdx = arr.length - 1;
        let cb = () => {
            this.node.children.forEach(child => {
                child.getComponent(CustomItem).flashAnimation(arr[startIdx]);
            })
            if (startIdx == maxIdx) {
                startIdx = 1;
            } else {
                startIdx++;
            }
        }
        cb();
        this.timerId = setInterval(() => {
            cb && cb()
        }, 2000);
    }

    setData(line: number[], startIdx: number, column: Column, accelerate: boolean = false) {
        this.clearTimer();
        this.updateTimes();
        this._column = column;
        this.maxSpinTime = column;
        const childrens = this.node.children;
        let randomNum = Math.floor(Math.random() * this._listName.length);
        if (line.length == 1) {
            childrens[startIdx].getComponent(CustomItem).setData(this._listName[line[0] - 1]);
               childrens[startIdx + 1].getComponent(CustomItem).setData(this._listName[randomNum]);
        } else {
            childrens[startIdx].getComponent(CustomItem).setData(this._listName[line[1] - 1]);
            childrens[startIdx + 1].getComponent(CustomItem).setData(this._listName[line[0] - 1]);
        }
        childrens[startIdx == 0 ? childrens.length - 1 : startIdx - 1].getComponent(CustomItem).setData(this._listName[randomNum]);
        childrens[startIdx == 0 ? childrens.length - 1 : startIdx - 1].getComponent(CustomItem).setData(this._listName[randomNum]);
        // 设置目标结果
        this.targetNode = childrens[startIdx];
        // 计算目标位置（让目标节点停在顶部）
        this.targetPosition = line.length == 1 ? 0 : -(this._itemHight * this._anchorY);
        if (accelerate) {
            this.maxSpinTime += 1;
            this.acceleration *= 2;
            this.deceleration *= 2;
            this.maxSpeed *= 2;
        }
        this.startSpinning();
    }

    // 开始旋转
    startSpinning() {
        this.spinState = SPIN_STATES.ACCELERATING;
        this._isStopping = true;
        this.spinStartTime = Date.now();
        this.currentSpeed = 0;
    }

    protected update(deltaTime: number): void {
        if (this._isStopping == false) return;
        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.spinStartTime) / 1000;
        switch (this.spinState) {
            case SPIN_STATES.ACCELERATING:
                this.handleAccelerating(deltaTime, elapsedTime);
                break;
            case SPIN_STATES.CRUISING:
                this.handleCruising(deltaTime, elapsedTime);
                break;
            case SPIN_STATES.DECELERATING:
                this.handleDecelerating(deltaTime);
                break;
        }
    }


    updatePosition(distance: number) {
        for (let i = 0; i < this._nodeLength; i++) {
            const node = this.node.children[i];
            let y = node.position.y
            y -= distance;
            if (y < this._endY) y += this._totalHeight;
            node.setPosition(0, y, 0);
        }
    }
    // 加速阶段处理
    handleAccelerating(deltaTime: number, elapsedTime: number) {
        // 加速
        this.currentSpeed += this.acceleration * deltaTime;
        // 限制最大速度
        if (this.currentSpeed >= this.maxSpeed) {
            this.currentSpeed = this.maxSpeed;
            this.spinState = SPIN_STATES.CRUISING;
        }
        this.updatePosition(deltaTime * this.currentSpeed);
    }

    // 匀速阶段处理
    handleCruising(deltaTime: number, elapsedTime: number) {
        this.updatePosition(deltaTime * this.currentSpeed);
        // 检查是否达到最大旋转时间
        if (elapsedTime >= this.maxSpinTime) {
            this.spinState = SPIN_STATES.DECELERATING;
        }
    }

    // 减速阶段处理
    handleDecelerating(deltaTime: number) {
        const remainingDistance = this.getRemainingDistance();
        // 简单的速度控制
        if (remainingDistance > 100) {
            // 远距离：正常速度
            this.currentSpeed = this.maxSpeed;
        }
        else if (remainingDistance > 50) {
            // 中距离：开始减速
            this.currentSpeed = Math.max(200, this.currentSpeed - this.deceleration * deltaTime);
        }
        else if (remainingDistance > 10) {
            // 近距离：中等速度
            this.currentSpeed = 150;
        }
        else {
            // 精细调整：按距离比例减速
            this.currentSpeed = remainingDistance * 10;
        }

        // 检查是否到达
        if (remainingDistance < 1) {
            // 精确对齐
            let distance = Math.abs(this.targetNode.y - this.targetPosition);
            this.updatePosition(distance);
            this.currentSpeed = 0;
            this._isStopping = false;
            this.spinState = SPIN_STATES.STOPPED;
            if (this._column == Column.Right) {
                Global.sendMsg(GameEvent.ROTATION_END);
            }
        } else {
            // 更新位置（始终向下移动）
            this.updatePosition(this.currentSpeed * deltaTime);
        }
    }

    getRemainingDistance(): number {
        const currentY = this.targetNode.y;
        if (currentY >= this.targetPosition) {
            return currentY - this.targetPosition;
        } else {
            return (currentY + this._totalHeight) - this.targetPosition;
        }
    }
    stopImmediately(): void {
        if (!this._isStopping) return;
        // 立即停止所有运动
        this.currentSpeed = 0;
        this._isStopping = false;
        this.spinState = SPIN_STATES.STOPPED;
        const remainingDistance = this.getRemainingDistance();
        let distance = remainingDistance;
        this.updatePosition(distance);
        if (this._column == Column.Right) {
            Global.sendMsg(GameEvent.ROTATION_END);
        }
        console.log("立即停止完成");

    }
    reset() {
        this.node.children.forEach(child => {
            child.getComponent(CustomItem).reset();
        })
    }
    private timerId: any = null;
    clearTimer(): void {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
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
            cc_item1_node: [CustomItem],
            cc_item2_node: [CustomItem],
            cc_item3_node: [CustomItem],
            cc_item4_node: [CustomItem],
            cc_item5_node: [CustomItem],
            cc_item6_node: [CustomItem],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected item1_node: CustomItem = null;
    protected item2_node: CustomItem = null;
    protected item3_node: CustomItem = null;
    protected item4_node: CustomItem = null;
    protected item5_node: CustomItem = null;
    protected item6_node: CustomItem = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomList';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomList.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomList.VIEW_NAME;
    }
    // @view export resource end
}
