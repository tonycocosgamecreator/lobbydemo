// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelGame')
export default class PanelGame extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//










    //------------------------ 网络消息 ------------------------//
// @view export net begin

    public onNetworkMessage(msgType : string,data : any) : boolean {
        return false;
    }

// @view export event end

    //------------------------ 事件定义 ------------------------//
// @view export event begin
    private onClickButton(event : cc.EventTouch){
        cc.log('on click event cc_button');
    }
    private onClickButton(event : cc.EventTouch){
        cc.log('on click event cc_button');
    }
// @view export event end


// @view export resource begin

    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_button    : [GButton,this.onClickButton.bind(this)],
            cc_labelBar    : [cc.Label],
            cc_labelCurrent    : [cc.Label],
            cc_labelTotal    : [cc.Label],
            cc_ndBar1    : [cc.Node],
            cc_ndBar2    : [cc.Node],
            cc_ndBar3    : [cc.Node],
            cc_ndBar4    : [cc.Node],
            cc_ndBar5    : [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected button: GButton    = null;
   protected labelBar: cc.Label    = null;
   protected labelCurrent: cc.Label    = null;
   protected labelTotal: cc.Label    = null;
   protected ndBar1: cc.Node    = null;
   protected ndBar2: cc.Node    = null;
   protected ndBar3: cc.Node    = null;
   protected ndBar4: cc.Node    = null;
   protected ndBar5: cc.Node    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'PanelGame';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return PanelGame.BUNDLE_NAME;
    }
   public get viewName(){
        return PanelGame.VIEW_NAME;
    }

// @view export resource end
}
