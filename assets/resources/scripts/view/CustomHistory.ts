// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import List from 'db://assets/resources/scripts/core/view/list-view';
import JmManager from '../manager/jm-manager';
import BaseGlobal from '../core/message/base-global';
import { GameEvent, MsgRecordDetailAck } from '../define';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomHistory')
export default class CustomHistory extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    /** 是否是展开的状态 */
    _open: boolean = false;

    _data: MsgRecordDetailAck = null;

    buildUi() {
        this.Open = false;
        this._init();
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_HISTORY]: this._init
        });
    }

    set Open(value: boolean) {
        this._open = value;
        this.historyDetailList.node.parent.active = this._open;
        this.historyList.node.parent.active = !this._open;
    }

    get Open(): boolean {
        return this._open;
    }

    _init() {
        this._data = JmManager.records;
        if (!this._data) {
            this.reset();
            return;
        }
        this.historyList.itemRender = (item: cc.Node, i: number) => {
            let rc = this._data.record[i].luck_id;
            let ad = this._data.award[i];
            item.children.forEach((t, j) => {
                if (j < 6) {
                    t.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/JM_Img_" + (11 + (rc[j] * 3)) + "/spriteFrame");
                    if (!ad) ad = [];
                    t.children[0].active = ad.includes(rc[j]);
                }
            });
        }
        this.historyDetailList.itemRender = (item: cc.Node, i: number) => {
            let rc = this._data.record[i].luck_id;
            let ad = this._data.award[i];
            item.children.forEach((t, j) => {
                t.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/JM_Img_" + (11 + (rc[j] * 3)) + "/spriteFrame");
                if (!ad) ad = [];
                t.children[0].active = ad.includes(rc[j]);
            });
        }
        this.probability_node.children.forEach((item: cc.Node, i: number) => {
            item.getComponentInChildren(cc.Label).string = this._data.probability[i] + '';
        })
        this.historyList.numItems = this._data.record.length;
        this.historyDetailList.numItems = this._data.record.length;
        this.historyList.scrollTo(0, 0.1);
        this.historyDetailList.scrollTo(0, 0.1);
    }

    reset() {
        this.historyDetailList.numItems = 0;
        this.historyDetailList.numItems = 0;
    }



    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonDetail(event: cc.EventTouch) {
        cc.log('on click event cc_buttonDetail');
        this.Open = true;
        this.historyList.scrollView.stopAutoScroll();
    }
    private onClickButtonCloseDetail(event: cc.EventTouch) {
        cc.log('on click event cc_buttonCloseDetail');
        this.Open = false;
        this.historyDetailList.scrollView.stopAutoScroll();
        this.historyDetailList.scrollTo(0, 0);
    }


    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonCloseDetail: [GButton, this.onClickButtonCloseDetail.bind(this)],
            cc_buttonDetail: [GButton, this.onClickButtonDetail.bind(this)],
            cc_historyDetailList: [List],
            cc_historyList: [List],
            cc_probability_node: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonCloseDetail: GButton = null;
    protected buttonDetail: GButton = null;
    protected historyDetailList: List = null;
    protected historyList: List = null;
    protected probability_node: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomHistory';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomHistory.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomHistory.VIEW_NAME;
    }
    // @view export resource end
}
