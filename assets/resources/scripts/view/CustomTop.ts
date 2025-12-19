// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { view } from 'cc';
import { UITransform } from 'cc';
import { NodeEventType } from 'cc';
import { EventTouch } from 'cc';
import { GButtonTouchStyle } from '../core/view/view-define';
import { v3 } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomTop')
export default class CustomTop extends ViewBase {

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

    protected start(): void {
        const deviceSize = view.getVisibleSize();
        this.top_node.getComponent(UITransform).width = deviceSize.width;
        this.top_node.getComponent(UITransform).height = deviceSize.height;
        let targetNode = this.node.parent;
        let world = targetNode.parent.getComponent(UITransform).convertToWorldSpaceAR(targetNode.position);
        let local = this.node.getComponent(UITransform).convertToNodeSpaceAR(world);
        this.top_node.setPosition(local);
        this.top_node.on(NodeEventType.TOUCH_START, (event: EventTouch) => {
            event.propagationStopped = false;
        }, this);
        this.top_node.on(NodeEventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = false;
            this.playAnimation(false);
        }, this);
        this.top_node.on(NodeEventType.TOUCH_CANCEL, (event: EventTouch) => {
            event.propagationStopped = false;
            this.playAnimation(false);
        }, this);
        this.top_node.active = false;
    }

    buildUi() {
        this.show_node.scale = v3(1, 0, 1);
        this.button_help.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.button_histoy.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.button_menu.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.button_record.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.button_set.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
    }

    playAnimation(show: boolean) {
        if (!this.show_node) return;
        if (this._showAnimation) return;
        this._showAnimation = true;
        if (show) {
            cc.tween(this.show_node).to(0.08, { scale: v3(1, 1, 1) }).call(() => {
                this.top_node.active = true;
                this._showAnimation = false;
            }).start();
        } else {
            cc.tween(this.show_node).to(0.08, { scale: v3(1, 0, 1) }).call(() => {
                this._showAnimation = false;
                this.top_node.active = false;
            }).start();
        }
    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButton_menu(event: cc.EventTouch) {
        if (this.top_node.active) {
            this.playAnimation(false);
            return;
        }
        this.playAnimation(true);
    }

    private onClickButton_set(event: cc.EventTouch) {
        this.playAnimation(false);
    }


    private onClickButton_record(event: cc.EventTouch) {
        this.playAnimation(false);
    }


    private onClickButton_histoy(event: cc.EventTouch) {
        this.playAnimation(false);
    }


    private onClickButton_help(event: cc.EventTouch) {
        this.playAnimation(false);
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_button_help    : [GButton,this.onClickButton_help.bind(this)],
            cc_button_histoy    : [GButton,this.onClickButton_histoy.bind(this)],
            cc_button_menu    : [GButton,this.onClickButton_menu.bind(this)],
            cc_button_record    : [GButton,this.onClickButton_record.bind(this)],
            cc_button_set    : [GButton,this.onClickButton_set.bind(this)],
            cc_menu    : [cc.Sprite],
            cc_show_node    : [cc.Node],
            cc_top_node    : [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected button_help: GButton    = null;
   protected button_histoy: GButton    = null;
   protected button_menu: GButton    = null;
   protected button_record: GButton    = null;
   protected button_set: GButton    = null;
   protected menu: cc.Sprite    = null;
   protected show_node: cc.Node    = null;
   protected top_node: cc.Node    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomTop';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomTop.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomTop.VIEW_NAME;
    }
    // @view export resource end
}
