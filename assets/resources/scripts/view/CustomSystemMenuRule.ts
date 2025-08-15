// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, WaitTime, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用----------------------------//
import List from 'db://assets/resources/scripts/core/view/list-view';
// @view export import end
import CustomSystemMenuBase from './CustomSystemMenuBase';
const { ccclass, property } = cc._decorator;

@ccclass('CustomSystemMenuRule')
export default class CustomSystemMenuRule extends CustomSystemMenuBase {

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
            cc_bg    : [cc.Sprite],
            cc_list    : [List],
            cc_topRoot    : [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected bg: cc.Sprite    = null;
   protected list: List    = null;
   protected topRoot: cc.Node    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomSystemMenuRule';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomSystemMenuRule.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomSystemMenuRule.VIEW_NAME;
    }

// @view export resource end
}
