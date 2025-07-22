// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import HttpLobbyHelper from '../lobby/net/http-lobby-helper';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelLobby')
export default class PanelLobby extends ViewBase {

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

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private async onClickButtonGame1(event: cc.EventTouch) {
        let data = await HttpLobbyHelper.GetCates()
    }


    private onClickButtonGame2(event: cc.EventTouch) {
        cc.log('on click event cc_buttonGame2');
    }


    private onClickButtonGame3(event: cc.EventTouch) {
        cc.log('on click event cc_buttonGame3');
    }


    private onClickButtonGame4(event: cc.EventTouch) {
        cc.log('on click event cc_buttonGame4');
    }


    private onClickButtonGame5(event: cc.EventTouch) {
        cc.log('on click event cc_buttonGame5');
    }


    private onClickButtonGame6(event: cc.EventTouch) {
        cc.log('on click event cc_buttonGame6');
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonGame1: [GButton, this.onClickButtonGame1.bind(this)],
            cc_buttonGame2: [GButton, this.onClickButtonGame2.bind(this)],
            cc_buttonGame3: [GButton, this.onClickButtonGame3.bind(this)],
            cc_buttonGame4: [GButton, this.onClickButtonGame4.bind(this)],
            cc_buttonGame5: [GButton, this.onClickButtonGame5.bind(this)],
            cc_buttonGame6: [GButton, this.onClickButtonGame6.bind(this)],
            cc_labelLobby: [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonGame1: GButton = null;
    protected buttonGame2: GButton = null;
    protected buttonGame3: GButton = null;
    protected buttonGame4: GButton = null;
    protected buttonGame5: GButton = null;
    protected buttonGame6: GButton = null;
    protected labelLobby: cc.Label = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelLobby';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelLobby.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelLobby.VIEW_NAME;
    }
    // @view export resource end
}
