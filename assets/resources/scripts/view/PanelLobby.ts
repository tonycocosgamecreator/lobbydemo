// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { IPanelLobbyView } from '../lobby/define/lobby-main-view';
import LobbyManager from '../lobby/managers/lobby-manager';
import PoolManager from '../core/manager/pool-manager';
import CustomGameItem from './CustomGameItem';
import UIHelper from '../lobby/helper/ui-helper';
import ViewManager from '../core/manager/view-manager';
import JsonLoginManager from '../lobby/managers/json-login-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelLobby')
export default class PanelLobby extends ViewBase implements IPanelLobbyView {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    protected onEnable(): void {
        LobbyManager.iPanelLobbyView = this;
        UIHelper.showCircleLoading();
        LobbyManager.doHttpGetCateGameLists();
    }

    protected onDisable(): void {
        LobbyManager.iPanelLobbyView = null;
    }
    //------------------------ 内部逻辑 ------------------------//
    _items: CustomGameItem[] = [];

    protected buildUi(): void {
        // JsonLoginManager.Login();

    }

    onReceiveInitData(): void {
        UIHelper.hideCircleLoading();
        this.clear();
        let data = LobbyManager.cateGameLists;
        if (!data) {
            bDebug && console.error("CustomMyRefrrals.onReceiveAgencyData() -> infoData is null");
            return;
        }
        for (let i = 0; i < data.length; i++) {
            const item = PoolManager.Get(CustomGameItem);
            item.node.parent = this.layout;
            this._items.push(item);
            item.setData(data[i]);
            item.registerClickButtonCallback(this.registerClickButtonCallback.bind(this));
        }
        this.scrollview.scrollToTop(0);
    }

    onReceiveGameUrlData(): void {
        UIHelper.hideCircleLoading();
        window.location.href = LobbyManager.curGameUrl;
        // ViewManager.HidePanel("PanelLobby");
        // 隐藏大厅 拉起webview
        // ViewManager.OpenPanel(this.module, "PanelThirdGame");
    }

    clear() {
        this.scrollview.stopAutoScroll();
        this._items.forEach(item => {
            item.clear();
            item.node.parent = null;
            PoolManager.Put(item);
        });
        this.layout.removeAllChildren()
    }

    registerClickButtonCallback(data: string) {
        if (data == null || data == '') {
            return
        }
        UIHelper.showCircleLoading();
        LobbyManager.doHttpGameLogin(data);

    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin


    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_layout: [cc.Node],
            cc_scrollview: [cc.ScrollView],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected layout: cc.Node = null;
    protected scrollview: cc.ScrollView = null;
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
