// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import ViewManager from '../core/manager/view-manager';
import { PageView } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelRule')
export default class PanelRule extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _page: number = 0;
    _maxPage: number = 4;
    buildUi() {
        this.pageRule.node.on('page-turning', this.callback, this);
        this.pageRule.setCurrentPageIndex(this._page);
    }

    callback(pageView: PageView) {
        this._page = pageView.curPageIdx;
        cc.log(this._page,'-------------------')
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonLeft(event: cc.EventTouch) {
        if (this._page == 0) return;
        this._page--;
        this.pageRule.setCurrentPageIndex(this._page);
    }


    private onClickButtonClose(event: cc.EventTouch) {
        ViewManager.ClosePanel('PanelRule');
    }


    private onClickButtonRight(event: cc.EventTouch) {
        if (this._page >= this._maxPage) return;
        this._page++;
        this.pageRule.setCurrentPageIndex(this._page)
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonClose: [GButton, this.onClickButtonClose.bind(this)],
            cc_buttonLeft: [GButton, this.onClickButtonLeft.bind(this)],
            cc_buttonRight: [GButton, this.onClickButtonRight.bind(this)],
            cc_pageRule: [cc.PageView],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonClose: GButton = null;
    protected buttonLeft: GButton = null;
    protected buttonRight: GButton = null;
    protected pageRule: cc.PageView = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelRule';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelRule.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelRule.VIEW_NAME;
    }
    // @view export resource end
}
