// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import Managers from '../core/manager/managers';
import CommonManager from '../manager/common-manager';
import WheelManager from '../manager/wheel-manager';
import ViewManager from '../core/manager/view-manager';
//------------------------特殊引用开始----------------------------//
import CustomDesk from 'db://assets/resources/scripts/view/CustomDesk';
import JsonLoginManager from '../network/managers/json-login-manager';
import HistoryManager from '../manager/history-manager';
import AudioManager from '../core/manager/audio-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelWheelInit')
export default class PanelWheelInit extends ViewBase {

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
        AudioManager.playBgm(this.bundleName, '背景音乐')
        Managers.registe(CommonManager);
        Managers.registe(WheelManager);
        Managers.registe(HistoryManager);
        JsonLoginManager.Login();
    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        if (msgType == wheel.Message.MsgEnterSevenUpDownRsp) {
            ViewManager.OpenPanel(this.module, "PanelWheelMain");
            this.close();
            return true
        }
        return false;
    }

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
   public static readonly VIEW_NAME    = 'PanelWheelInit';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return PanelWheelInit.BUNDLE_NAME;
    }
   public get viewName(){
        return PanelWheelInit.VIEW_NAME;
    }
    // @view export resource end
}
