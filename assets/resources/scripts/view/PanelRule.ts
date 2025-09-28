// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { ViewOpenAnimationType } from '../core/view/view-define';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelRule')
export default class PanelRule extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    protected _open_animation_type: ViewOpenAnimationType = ViewOpenAnimationType.BOTTOM_TO_CENTER;
    buildUi() {
    }


    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin



    private onClickButtonClose(event: cc.EventTouch) {
        this.close();
    }



    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_bg    : [cc.Sprite],
            cc_buttonClose    : [GButton,this.onClickButtonClose.bind(this)],
            cc_root    : [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected bg: cc.Sprite    = null;
   protected buttonClose: GButton    = null;
   protected root: cc.Node    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'PanelRule';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return PanelRule.BUNDLE_NAME;
    }
   public get viewName(){
        return PanelRule.VIEW_NAME;
    }
    // @view export resource end
}
