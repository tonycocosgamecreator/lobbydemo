// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { Node } from 'cc';
import { UIOpacity } from 'cc';
import { v3 } from 'cc';
import WheelManager from '../../manager/wheel-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomOtherBetUser')
export default class CustomOtherBetUser extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _showAnimation: boolean = false;
    _currentData: number[] = [];
    _stage = -1;
    _positions = [v3(17, 0, 0), v3(0, 0, 1), v3(-21, 0, 2)];
    _scale = [v3(0.4, 0.4, 0.4), v3(0.5, 0.5, 0.5), v3(0.6, 0.6, 0.6)];
    _animationDuration: number = 0.2;
    _len: number = 3;

    buildUi() {
        this.reset();
    }

    reset() {
        this._currentData = [];
        this.node.children.forEach((child, idx) => {
            child.setPosition(this._positions[idx]);
            child.setScale(this._scale[idx]);
            child.active = false;
        })
    }

    receiveData(icon: number) {
        if (this._stage != baccarat.DeskStage.StartBetStage) {
            return;
        }
        const previousCount = this._currentData.length;
        this._currentData.push(icon);
        if (this._currentData.length > 3) {
            this._currentData.shift();
        }
        this.updateDisplay(previousCount);
    }

    updateDisplay(previousCount: number) {
        const currentCount = this._currentData.length;
        if (currentCount === 0) {
            this.hideAllHeads();
        } else if (currentCount === 1) {
            this.showSingleHead();
        } else if (currentCount === 2) {
            this.showDoubleHeads();
        } else {
            this.showThreeHeads();
        }

        // 如果数据变化，播放动画
        if ((previousCount < 3 && currentCount === 3) ||
            (previousCount === 3 && currentCount === 3)) {
            this.playAnimateDataUpdate();
        }
    }

    hideAllHeads() {
        this.node.children.forEach(child => {
            this.hideHead(child);
        });
    }

    hideHead(headNode: Node) {
        const opacity = headNode.getComponent(UIOpacity);
        cc.tween(opacity)
            .to(this._animationDuration, { opacity: 0 })
            .call(() => {
                headNode.active = false;
            })
            .start();
    }
    showSingleHead() {
        this.node.children.forEach((head, index) => {
            if (index === 2) {
                this.setHeadData(head, this._currentData[0]);
                this.showHead(head, this._positions[2], this._scale[2]);
            } else {
                this.hideHead(head);
            }
        });
    }
    showDoubleHeads() {
        this.node.children.forEach((head, index) => {
            if (index > 0) {
                this.setHeadData(head, this._currentData[index == 2 ? 0 : index]);
                this.showHead(head, this._positions[index], this._scale[index]);
            } else {
                this.hideHead(head);
            }
        });
    }

    showThreeHeads() {
        this.node.children.forEach((head, index) => {
            this.setHeadData(head, this._currentData[index == 0 ? 2 : index == 2 ? 0 : index]);
            this.showHead(head, this._positions[index], this._scale[index]);
        });
    }

    playAnimateDataUpdate() {
        if (this._currentData.length !== 3) return;
        const [head1, head2, head3] = this.node.children;
        const opacity1 = head1.getComponent(UIOpacity);
        head3.setPosition(this._positions[1])
        head2.setPosition(this._positions[0])
        // 位置1和位置2保持不动
        head3.setScale(this._scale[1])
        head3.setScale(this._scale[0])
        cc.tween(head3)
            .to(this._animationDuration, { position: this._positions[2] })
            .start();
        cc.tween(head3)
            .to(this._animationDuration, { scale: this._scale[2] })
            .start();
        cc.tween(head2)
            .to(this._animationDuration, { position: this._positions[1] })
            .start();
        cc.tween(head2)
            .to(this._animationDuration, { scale: this._scale[1] })
            .start();
        // 位置3从右侧滑入
        head1.setPosition(v3(27, 0, 0)); // 从更右侧开始
        opacity1.opacity = 0;
        head1.active = true;
        cc.tween(head1)
            .to(this._animationDuration, { position: this._positions[0] })
            .start();
        cc.tween(opacity1)
            .to(this._animationDuration, { opacity: 255 })
            .start();
    }

    setHeadData(headNode: Node, data: number) {
        const sprite = headNode.getComponentInChildren(cc.Sprite);
        if (sprite && data) {
            sprite.spriteFrame = this.getSpriteFrame(`textures/avatars/av-${data}`);
        }
    }

    showHead(headNode: Node, position: cc.Vec3, scale: cc.Vec3) {
        headNode.active = true;
        const opacity = headNode.getComponent(UIOpacity);
        cc.tween(headNode)
            .to(this._animationDuration, { position: position })
            .start();
        cc.tween(opacity)
            .to(this._animationDuration, { opacity: 255 })
            .start();
        cc.tween(headNode)
            .to(this._animationDuration, { scale: scale })
            .start();
    }

    updateGameStage(stage: baccarat.DeskStage.StartBetStage) {
        this._stage = stage;
        if (this._stage == baccarat.DeskStage.EndBetStage) {
            this.reset();
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
    public static readonly VIEW_NAME = 'CustomOtherBetUser';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomOtherBetUser.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomOtherBetUser.VIEW_NAME;
    }

    // @view export resource end
}
