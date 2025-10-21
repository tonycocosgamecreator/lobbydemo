// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomHandle')
export default class CustomHandle extends ViewBase {

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
    private onClickButton_auto(event : cc.EventTouch){
        cc.log('on click event cc_button_auto');
    }
    private onClickButton_agail(event : cc.EventTouch){
        cc.log('on click event cc_button_agail');
    }
    private onClickButton_undo(event : cc.EventTouch){
        cc.log('on click event cc_button_undo');
    }
    private onClickButton_clear(event : cc.EventTouch){
        cc.log('on click event cc_button_clear');
    }
    private onClickButton_double(event : cc.EventTouch){
        cc.log('on click event cc_button_double');
    }
// @view export event end


// @view export resource begin

    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_button_agail    : [GButton,this.onClickButton_agail.bind(this)],
            cc_button_auto    : [GButton,this.onClickButton_auto.bind(this)],
            cc_button_clear    : [GButton,this.onClickButton_clear.bind(this)],
            cc_button_double    : [GButton,this.onClickButton_double.bind(this)],
            cc_button_undo    : [GButton,this.onClickButton_undo.bind(this)],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected button_agail: GButton    = null;
   protected button_auto: GButton    = null;
   protected button_clear: GButton    = null;
   protected button_double: GButton    = null;
   protected button_undo: GButton    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomHandle';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomHandle.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomHandle.VIEW_NAME;
    }

// @view export resource end
}
