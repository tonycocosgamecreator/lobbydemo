// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import List from 'db://assets/resources/scripts/core/view/list-view';
import { GButtonTouchStyle } from '../core/view/view-define';
import { v3 } from 'cc';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomMainHistory')
export default class CustomMainHistory extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _showAnimation: boolean = false;
    buildUi() {
        this.labelmax.string = '';
        this.labelmiddle.string = '';
        this.labelmin.string = '';
        this.historyDetailList.numItems = 0;
        this.historyList.numItems = 0;
        this.buttonCloseDetail.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonHistory.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.history_detail_node.scale = v3(1, 0, 1);
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_HISTORY]: this.updateHistory,
            [GameEvent.UPDATE_HISTORY_PROBABILITY]: this.updateHistoryProbability,
        });
        this.updateHistory();
        this.updateHistoryProbability();
    }

    updateHistory() {
        const _data = SevenUpSevenDownManager.Records;
        const _records = [..._data].reverse();
        this.historyList.itemRender = (item: cc.Node, i: number) => {
            item.getChildByName('light').active = i == 0;
            item.getChildByName('labeldice').getComponent(cc.Label).string = `${_records[i].win_type[0]}-${_records[i].win_type[1]}`;
            let value = _records[i].win_type[0] + _records[i].win_type[1];
            item.getChildByName('sprbg').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/ui/7up_Img_${value == 7 ? 3 : value < 7 ? 2 : 4}/spriteFrame`);
        }
        this.historyDetailList.itemRender = (item: cc.Node, i: number) => {
            item.getChildByName('double').active = _records[i].is_double;
            item.getChildByName('sprdice1').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/ui/${_records[i].win_type[0]}/spriteFrame`);
            item.getChildByName('sprdice2').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/ui/${_records[i].win_type[1]}/spriteFrame`);
        }
        let len = _data.length;
        this.historyList.numItems = len;
        this.historyDetailList.numItems = len;
        this.historyList.stopScrollTo();
        this.historyDetailList.stopScrollTo();
        this.historyList.scrollTo(0, 0.1);
        this.historyDetailList.scrollTo(0, 0.1);
    }

    updateHistoryProbability() {
        const _data = SevenUpSevenDownManager.Probability;
        this.labelmin.string = `2-6:${(_data[0]).toFixed(2)}%`;
        this.labelmiddle.string = `7:${(_data[1]).toFixed(2)}%`;
        this.labelmax.string = `8-12:${(_data[2]).toFixed(2)}%`;
    }

    playAnimation(show: boolean) {
        if (this._showAnimation) return;
        this._showAnimation = true;
        if (show) {
            cc.tween(this.history_detail_node).to(0.05, { scale: v3(1, 1, 1) }).call(() => {
                this._showAnimation = false;
            }).start();
        } else {
            cc.tween(this.history_detail_node).to(0.05, { scale: v3(1, 0, 1) }).call(() => {
                this._showAnimation = false;
            }).start();
        }
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonCloseDetail(event: cc.EventTouch) {
        this.playAnimation(false);
    }
    private onClickButtonHistory(event: cc.EventTouch) {
        this.playAnimation(true);
    }
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonCloseDetail    : [GButton,this.onClickButtonCloseDetail.bind(this)],
            cc_buttonHistory    : [GButton,this.onClickButtonHistory.bind(this)],
            cc_historyDetailList    : [List],
            cc_historyList    : [List],
            cc_history_detail_node    : [cc.Node],
            cc_labelmax    : [cc.Label],
            cc_labelmiddle    : [cc.Label],
            cc_labelmin    : [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected buttonCloseDetail: GButton    = null;
   protected buttonHistory: GButton    = null;
   protected historyDetailList: List    = null;
   protected historyList: List    = null;
   protected history_detail_node: cc.Node    = null;
   protected labelmax: cc.Label    = null;
   protected labelmiddle: cc.Label    = null;
   protected labelmin: cc.Label    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomMainHistory';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomMainHistory.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomMainHistory.VIEW_NAME;
    }
    // @view export resource end
}
