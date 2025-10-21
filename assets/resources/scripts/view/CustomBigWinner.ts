// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomBigWinner')
export default class CustomBigWinner extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

//    callback
//     buildUi() {
//         this.callback = function () {
          
//         }
//         this.schedule(this.callback, 0.5)
//     }








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
            cc_label_rank    : [cc.Label],
            cc_spr_head_one    : [cc.Sprite],
            cc_spr_head_three    : [cc.Sprite],
            cc_spr_head_two    : [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected label_rank: cc.Label    = null;
   protected spr_head_one: cc.Sprite    = null;
   protected spr_head_three: cc.Sprite    = null;
   protected spr_head_two: cc.Sprite    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomBigWinner';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomBigWinner.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomBigWinner.VIEW_NAME;
    }
// @view export resource end
}
