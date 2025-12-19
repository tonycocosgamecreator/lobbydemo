// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { v3 } from 'cc';
import { GButtonTouchStyle } from '../core/view/view-define';
import { view } from 'cc';
import { UITransform } from 'cc';
import { NodeEventType } from 'cc';
import { EventTouch } from 'cc';
import WalletManager from '../manager/wallet-manager';
import { Color } from 'cc';
import { Tween } from 'cc';
import { easing } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomChip')
export default class CustomChip extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _startAngle: number = 175; // 起始角度
    _endAngle: number = 5; // 结束角度
    _radius: number = 220; // 扇形半径
    _duration: number = 0.2; // 动画持续时间
    _idxs = [];
    _totalButtons: number;
    _chipButtons: number[] = [];//筹码底注列表
    _showAnimation: boolean = false;
    _world: cc.Vec3 = v3(0, 0, 0);
    _chipColor = ['#47506A', '#1A7401', '#1756A4', '#91017A', '#A31B09', '#A36407'];
    _chooseChip: number = -1;
    getWorldPos() {
        return this.buttonclick.node.parent.transform.convertToWorldSpaceAR(this.buttonclick.node.position)
    }

    protected start(): void {
        const deviceSize = view.getVisibleSize();
        this.chip_node.getComponent(UITransform).width = deviceSize.width;
        this.chip_node.getComponent(UITransform).height = deviceSize.height;
        let targetNode = this.node.parent.parent.parent.parent;
        this._world = targetNode.parent.getComponent(UITransform).convertToWorldSpaceAR(targetNode.position);
        this.chip_node.on(NodeEventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = false;
        }, this);
        this.chip_node.on(NodeEventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = false;
            this.playAnimation(false);
        }, this);
        this.chip_node.on(NodeEventType.TOUCH_CANCEL, (event: EventTouch) => {
            event.propagationStopped = false;
            this.playAnimation(false);
        }, this);
        this.chip_node.active = false;
    }

    buildUi() {
        this._chipButtons = WalletManager.getCurrencyBetSize();
        this._chooseChip = WalletManager.ChooseChip;
        if (this._chooseChip == -1) {
            this._chooseChip = WalletManager.getCurrencyBetIndex();
            WalletManager.ChooseChip = this._chooseChip;
        }
        this._totalButtons = this._chipButtons.length;
        this._chipButtons.forEach((num, idx) => {
            // 计算每个按钮在扇形中的位置
            let button = this.menu_node.children[idx] || cc.instantiate(this.menu_node.children[0]);
            const angleRange = this._endAngle - this._startAngle;
            const angle = this._startAngle + (angleRange / (this._totalButtons - 1 || 1)) * idx;
            const radian = angle * Math.PI / 180;
            const targetX = Math.cos(radian) * this._radius;
            const targetY = Math.sin(radian) * this._radius;
            this._idxs.push(v3(targetX, targetY, 0));
            button.setPosition(0, 0, 0);
            button.scale = v3(0, 0, 0);
            button.parent = this.menu_node;
            button.getComponentInChildren(cc.Label).string = num + '';
            if (idx >= this._chipColor.length) idx -= this._chipColor.length;
            button.getComponentInChildren(cc.Label).color = new Color(this._chipColor[idx]);
            button.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/common/AB_Img_" + (22 + idx) + "/spriteFrame");
            button.name = idx + '';
            button.active = false;
            button.on(NodeEventType.TOUCH_START, (event: EventTouch) => {
                button.scale = v3(1, 1, 1);
                Tween.stopAllByTarget(button);
                cc.tween(button)
                    .to(0.05, {
                        scale: v3(0.92, 0.92, 0.92)
                    })
                    .start();
            }, this);
            button.on(NodeEventType.TOUCH_END, (event: EventTouch) => {
                Tween.stopAllByTarget(button);
                button.scale = v3(0.92, 0.92, 0.92);
                cc.tween(button)
                    .to(0.05, { scale: v3(1, 1, 1) }, { easing: easing.elasticOut })
                    .call(() => {
                        this.playAnimation(false);
                        this._chooseChip = +button.name;
                        WalletManager.ChooseChip = +button.name;
                        this.setTargetChip();
                    })
                    .start();
            }, this)
        });
        this.chip_bg.active = false;
        this.buttonclick.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.setTargetChip();
    }

    setTargetChip() {
        let idx = this._chooseChip;
        if (idx >= this._chipColor.length) idx -= this._chipColor.length;
        this.buttonclick.getComponentInChildren(cc.Label).string = this._chipButtons[idx] + '';
        this.buttonclick.getComponentInChildren(cc.Label).color = new Color(this._chipColor[idx]);
        this.buttonclick.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/common/AB_Img_" + (22 + idx) + "/spriteFrame");
    }

    playAnimation(show: boolean) {
        if (this._showAnimation) return;
        this._showAnimation = true;
        if (show) {
            this.chip_bg.active = true;
            this.menu_node.children.forEach((button, index) => {
                button.active = true;
                // 执行动画
                cc.tween(button)
                    .to(this._duration, {
                        position: this._idxs[index],
                        scale: v3(1, 1, 1)
                    }, {
                        easing: 'backOut'
                    }).call(() => {
                        if (index == this._totalButtons - 1) {
                            this._showAnimation = false;
                            this.chip_node.active = true;
                            let local = this.node.getComponent(UITransform).convertToNodeSpaceAR(this._world);
                            this.chip_node.setPosition(local);
                        }
                    })
                    .start();
            });
        } else {
            this.chip_bg.active = false;
            this.menu_node.children.forEach((button, index) => {
                // 执行动画
                cc.tween(button)
                    .to(this._duration, {
                        position: v3(0, 0, 0),
                        scale: v3(0, 0, 0)
                    }, {
                        easing: 'backIn'
                    }).call(() => {
                        button.active = false;
                        if (index == this._totalButtons - 1) {
                            this._showAnimation = false;
                            this.chip_node.active = false;
                        }
                    })
                    .start();
            });
        }
    }

    getChipWorldPos() {
        let wordPos = this.buttonclick.node.parent.transform.convertToWorldSpaceAR(this.buttonclick.node.position);
        return wordPos;
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonclick(event: cc.EventTouch) {
        if (this._showAnimation) return;
        if (this.chip_node.active) {
            this.playAnimation(false);
            return;
        }
        this.playAnimation(true);
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonclick: [GButton, this.onClickButtonclick.bind(this)],
            cc_chip_bg: [cc.Node],
            cc_chip_node: [cc.Node],
            cc_menu_node: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonclick: GButton = null;
    protected chip_bg: cc.Node = null;
    protected chip_node: cc.Node = null;
    protected menu_node: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomChip';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomChip.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomChip.VIEW_NAME;
    }
    // @view export resource end
}
