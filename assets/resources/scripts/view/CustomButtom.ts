// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomButtom')
export default class CustomButtom extends ViewBase {

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
    private onClickButtonSpin(event : cc.EventTouch){
        cc.log('on click event cc_buttonSpin');
    }
    private onClickButtonAuto(event : cc.EventTouch){
        cc.log('on click event cc_buttonAuto');
    }
    private onClickButton_add(event : cc.EventTouch){
        cc.log('on click event cc_button_add');
    }
    private onClickButton_times(event : cc.EventTouch){
        cc.log('on click event cc_button_times');
    }
    private onClickButton_sub(event : cc.EventTouch){
        cc.log('on click event cc_button_sub');
    }
// @view export event end


// @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_bet_node    : [cc.Sprite],
            cc_buttonAuto    : [GButton,this.onClickButtonAuto.bind(this)],
            cc_buttonSpin    : [GButton,this.onClickButtonSpin.bind(this)],
            cc_button_add    : [GButton,this.onClickButton_add.bind(this)],
            cc_button_sub    : [GButton,this.onClickButton_sub.bind(this)],
            cc_button_times    : [GButton,this.onClickButton_times.bind(this)],
            cc_labelResidue    : [cc.Label],
            cc_labelTotal    : [cc.Label],
            cc_spbottom    : [cc.sp.Skeleton],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected bet_node: cc.Sprite    = null;
   protected buttonAuto: GButton    = null;
   protected buttonSpin: GButton    = null;
   protected button_add: GButton    = null;
   protected button_sub: GButton    = null;
   protected button_times: GButton    = null;
   protected labelResidue: cc.Label    = null;
   protected labelTotal: cc.Label    = null;
   protected spbottom: cc.sp.Skeleton    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomButtom';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomButtom.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomButtom.VIEW_NAME;
    }
// @view export resource end
}
