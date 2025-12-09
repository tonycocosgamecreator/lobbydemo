// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../../core/message/base-global';
import { GameEvent } from '../../define';
import CommonManager from '../../manager/common-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomOnlineInRoom')
export default class CustomOnlineInRoom extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

   buildUi() {
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_ONLINE_ROOM]: this.updateOnlineInRoom,
        });
    }

    updateOnlineInRoom() {
        this.labelPeople.string = CommonManager.OnlineInRoom + '';
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
            cc_labelPeople    : [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected labelPeople: cc.Label    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomOnlineInRoom';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomOnlineInRoom.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomOnlineInRoom.VIEW_NAME;
    }

// @view export resource end
}
