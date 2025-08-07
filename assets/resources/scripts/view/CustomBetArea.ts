// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomBetArea')
export default class CustomBetArea extends ViewBase {

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

//这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

// @view export event end

    //------------------------ 事件定义 ------------------------//
// @view export event begin
// @view export event end


// @view export resource begin

    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_labelSum    : [cc.Label],
            cc_ndBetResult    : [cc.Node],
            cc_ndSum    : [cc.Sprite],
            cc_ndlight    : [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected labelSum: cc.Label    = null;
   protected ndBetResult: cc.Node    = null;
   protected ndSum: cc.Sprite    = null;
   protected ndlight: cc.Sprite    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomBetArea';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomBetArea.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomBetArea.VIEW_NAME;
    }

// @view export resource end
}
