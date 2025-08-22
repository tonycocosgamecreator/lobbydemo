// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, WaitTime, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import ReusableBase from '../core/view/reusable-base';
// @view export import end
const { ccclass, property } = cc._decorator;

@ccclass('CustomSystemMenuBase')
export default class CustomSystemMenuBase extends ReusableBase {
    

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    unuse(): void {
        //throw new Error('Method not implemented.');
    }

    reuse(): void {
        //throw new Error('Method not implemented.');
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
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static VIEW_NAME    = 'CustomSystemMenuBase';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomSystemMenuBase.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomSystemMenuBase.VIEW_NAME;
    }
// @view export resource end
}
