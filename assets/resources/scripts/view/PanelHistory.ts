// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug, BooleanCallback } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import List, { ListViewEvent } from 'db://assets/resources/scripts/core/view/list-view';
import { ViewOpenAnimationType } from '../core/view/view-define';
import SsHistoryManager from '../manager/ss-history-manager';
import CustomHistoryItem from './CustomHistoryItem';
import { Global } from '../global';
import { GameEvent } from '../define';
import UIHelper from '../network/helper/ui-helper';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelHistory')
export default class PanelHistory extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    protected _open_animation_type: ViewOpenAnimationType = ViewOpenAnimationType.BOTTOM_TO_CENTER;
    private _callRequest: BooleanCallback = null;
    private _getCount: () => number;
    private _isLastPage: BooleanCallback = null;

    buildUi() {
        SsHistoryManager.clear();
        this._callRequest = () => {
            //请求更多历史记录
            return SsHistoryManager.doNetGetHistory();
        }
        this._getCount = () => {
            //获取当前历史记录的数量
            return SsHistoryManager.count;
        }
        this._isLastPage = () => {
            return SsHistoryManager.isLastPage;
        }
        this.list.itemRender = (node: cc.Node, index: number) => {
            //渲染逻辑
            let comp = node.getComponent(CustomHistoryItem);
            if (!comp) {
                comp = node.addComponent(CustomHistoryItem);
                comp.bindResourceConfig();
            }
            const data = SsHistoryManager.getIndex(index);
            comp.fillData(data,index);
        }
        this.list.on(
            ListViewEvent.SCROLL_END,
            () => {
                const count = this._getCount();
                const displayData = this.list.displayData;
                if (!displayData || displayData.length == 0) {
                    return;
                }
                const lastId = this.list.displayData[displayData.length - 1].id;
                if (lastId == count - 1) {
                    if (this._isLastPage && this._isLastPage()) {
                        return;
                    }
                    this._getMoreHistoryData();
                }
            }
        );
        Global.registerListeners(
            this,
            {
                [GameEvent.REQUEST_REFRESH_GAME_HISTORY]: this._refreshList,
            }
        );
        //拿新的数据
        this._getMoreHistoryData();
        this._refreshList();

    }

    private _refreshList() {
        const count = this._getCount();
        this.noHistory.node.active = count == 0;
        this.list.numItems = count;
    }

    private _getMoreHistoryData() {
        let bSuccess = false;
        if (this._callRequest) {
            bSuccess = this._callRequest();
            if (!bSuccess) {
                UIHelper.showToastId(resourcesDb.I18N_RESOURCES_DB_INDEX.Tip_No_More_Historys);
            }
        }
    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonClose(event: cc.EventTouch) {
        this.close();
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_bg: [cc.Sprite],
            cc_buttonClose: [GButton, this.onClickButtonClose.bind(this)],
            cc_itemBg: [cc.Sprite],
            cc_labelAmount: [cc.Label],
            cc_labelGameTime: [cc.Label],
            cc_labelOrderId: [cc.Label],
            cc_labelPrize: [cc.Label],
            cc_list: [List],
            cc_noHistory: [cc.Sprite],
            cc_root: [cc.Node],
            cc_topRoot: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected bg: cc.Sprite = null;
    protected buttonClose: GButton = null;
    protected itemBg: cc.Sprite = null;
    protected labelAmount: cc.Label = null;
    protected labelGameTime: cc.Label = null;
    protected labelOrderId: cc.Label = null;
    protected labelPrize: cc.Label = null;
    protected list: List = null;
    protected noHistory: cc.Sprite = null;
    protected root: cc.Node = null;
    protected topRoot: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelHistory';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelHistory.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelHistory.VIEW_NAME;
    }
    // @view export resource end
}
