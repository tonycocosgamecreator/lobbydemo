// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import ReusableBase from '../../core/view/reusable-base';
import { PanelLayer } from '../../core/view/view-define';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomToast')
export default class CustomToast extends ReusableBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    unuse(): void {
        cc.Tween.stopAllByTarget(this.node);
        const uiOpacity = this.node.getComponent(cc.UIOpacity);
        cc.Tween.stopAllByTarget(uiOpacity);
        this.node.opacity = 255;
    }

    reuse(): void {

    }
    //------------------------ 内部逻辑 ------------------------//
    /**
     * 静态方法，请重写，以加入不同的层级
     */
    public panelLayer: PanelLayer = PanelLayer.Tips;

    @ViewBase.requireResourceLoaded
    public fillData(content: string) {
        this.labelInfo.string = content;
        this.updateContentSize();
    }

    /**
     * 刷新背景大小
     */
    public updateContentSize() {
        const width = this.contentNode.transform.width;
        const trs = this.bgNode.transform;
        const size = trs.contentSize;
        size.set(width, size.height);
        trs.contentSize = size;
        bDebug && console.log('更新Toast的大小：', size);
        this.bgNode.getComponent(cc.Sprite)?.markForUpdateRenderData(true);
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
            cc_bgNode    : [cc.Node],
            cc_contentNode    : [cc.Node],
            cc_labelInfo    : [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected bgNode: cc.Node    = null;
   protected contentNode: cc.Node    = null;
   protected labelInfo: cc.Label    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomToast';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomToast.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomToast.VIEW_NAME;
    }
    // @view export resource end
}
