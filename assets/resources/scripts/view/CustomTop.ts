// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { UITransform } from 'cc';
import { view } from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomMenu from 'db://assets/resources/scripts/view/system/CustomMenu';
//------------------------特殊引用完毕----------------------------//
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

    protected start(): void {
        const deviceSize = view.getVisibleSize();
        this.ndClick.getComponent(UITransform).width = deviceSize.width * 2;
        this.ndClick.getComponent(UITransform).height = deviceSize.height * 2;
        let targetNode = this.node.parent.parent.parent.parent;
        let world = targetNode.parent.getComponent(UITransform).convertToWorldSpaceAR(targetNode.position);
        let local = this.node.getComponent(UITransform).convertToNodeSpaceAR(world);
        this.ndClick.setPosition(local);
        this.ndClick.active = false;
    }
    //------------------------ 内部逻辑 ------------------------//
    _showAnimation: boolean = false;
    buildUi() {
        this.menu.show(false, 0, () => {
            this.ndClick.active = false
        });
        this.menu.setCloseCb(() => {
            this.ndClick.active = false
        });
    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButton_menu(event: cc.EventTouch) {
        if (this._showAnimation) return;
        this._showAnimation = true;
        if (this.ndClick.active) {
            this.menu.show(false, 0.35, () => {
                this.ndClick.active = false;
                this._showAnimation = false;
            });
        } else {
            this.ndClick.active = true;
            this.menu.show(true, 0.35, () => {
                this._showAnimation = false;
            });
        }
    }

    private onClickButtonClose(event: cc.EventTouch) {
        if (this._showAnimation) return;
        this._showAnimation = true;
        this.menu.show(false, 0.35, () => {
            this.ndClick.active = false;
            this._showAnimation = false;
        });
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonClose    : [GButton,this.onClickButtonClose.bind(this)],
            cc_button_menu    : [GButton,this.onClickButton_menu.bind(this)],
            cc_menu    : [CustomMenu],
            cc_ndClick    : [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected buttonClose: GButton    = null;
   protected button_menu: GButton    = null;
   protected menu: CustomMenu    = null;
   protected ndClick: cc.Node    = null;
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
