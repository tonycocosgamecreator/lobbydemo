// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import LobbyManager from '../lobby/managers/lobby-manager';
import ViewManager from '../core/manager/view-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelThirdGame')
export default class PanelThirdGame extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    get _webview(): cc.WebView {
        return this.webview.getComponent(cc.WebView);
    }

    async buildUi() {
        let url = LobbyManager.curGameUrl;
        this._webview.url = url;
        // "https://gogzgame.gdsgog.xyz?gid=1003&language=en-US&server_url=wss%3A%2F%2Fgogzapi.gdsgog.xyz%2Faviator&token=886728ad8b6dafe86774af0e9b06096c";
        this.buttonBack.node.setSiblingIndex(100);
    }







    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonBack(event: cc.EventTouch) {
        this.close();
        ViewManager.ShowPanel("PanelLobby");
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonBack: [GButton, this.onClickButtonBack.bind(this)],
            cc_webview: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonBack: GButton = null;
    protected webview: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelThirdGame';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelThirdGame.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelThirdGame.VIEW_NAME;
    }
    // @view export resource end
}
