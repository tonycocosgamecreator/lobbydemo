// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import List from 'db://assets/resources/scripts/core/view/list-view';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end
import CustomSystemMenuBase from './CustomSystemMenuBase';
import { ListViewClickItemEventFunc } from 'db://assets/resources/scripts/core/view/list-view';
import { Global } from '../global';
import { GameEvent } from '../define';
import { BooleanCallback } from 'db://assets/resources/scripts/core/define';
import { ListViewEvent } from 'db://assets/resources/scripts/core/view/list-view';
import { SystemMenuHistoyItemRender } from '../helper/system-menu-define';
import UIHelper from '../network/helper/ui-helper';
const { ccclass, property } = cc._decorator;

@ccclass('CustomSystemMenuHistory')
export default class CustomSystemMenuHistory extends CustomSystemMenuBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    private _titleNode: cc.Node = null;
    private _itemPrefab: cc.Prefab = null;
    private _render: SystemMenuHistoyItemRender = null;
    private _callRequest: BooleanCallback = null;
    private _getCount: () => number;
    private _clickItem: ListViewClickItemEventFunc = null;
    private _isLastPage: BooleanCallback = null;
    private _background: cc.SpriteFrame = null;
    /**
     * 
     * @param titleNode 
     * @param itemPrefab 
     * @param render 
     * @param requestMore 
     * @param getCount 
     * @param clickItem 
     * @param background 
     */
    public register(
        titleNode: cc.Node,
        itemPrefab: cc.Prefab,
        render: SystemMenuHistoyItemRender,
        requestMore: BooleanCallback,
        getCount: () => number,
        clickItem?: ListViewClickItemEventFunc,
        _isLastPage?: BooleanCallback,
        background?: cc.SpriteFrame
    ) {
        this._titleNode = titleNode;
        this._itemPrefab = itemPrefab;
        this._render = render;
        this._callRequest = requestMore;
        this._getCount = getCount;
        this._clickItem = clickItem;
        this._isLastPage = _isLastPage;
        this._background = background
    }


    /**
     * 构建界面
     */
    private buildUi() {
        this.topRoot.addChild(this._titleNode);
        if (this._background) {
            this.bg.spriteFrame = this._background;
        }
        this.list.tmpPrefab = this._itemPrefab;
        this.list._init();
        this.list._resizeContent();
        this.list._onSizeChanged();

        this.list.itemRender = this._render;
        if (this._clickItem) {
            this.list.registerItemClickCallback(this._clickItem);
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

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_bg: [cc.Sprite],
            cc_list: [List],
            cc_noHistory: [cc.Sprite],
            cc_topRoot: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected bg: cc.Sprite = null;
    protected list: List = null;
    protected noHistory: cc.Sprite = null;
    protected topRoot: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomSystemMenuHistory';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomSystemMenuHistory.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomSystemMenuHistory.VIEW_NAME;
    }
    // @view export resource end
}
