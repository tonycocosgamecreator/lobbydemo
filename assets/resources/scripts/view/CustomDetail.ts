// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import TextUtils from '../core/utils/text-utils';
import SuperSevenManager from '../manager/ss-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomDetail')
export default class CustomDetail extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    protected start(): void {
        this._startAnimation();

    }
    //------------------------ 内部逻辑 ------------------------//
    _fadeDuration: number = 1;
    _displayDuration: number = 5;
    _currentIndex: number = 0;
    buildUi() {
        this._updateBet();
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_BET]: this._updateBet,
        });
    }

    _updateBet() {
        const _betCoin = SuperSevenManager.BetCoin;
        this.labelMax.string = TextUtils.formatNumberWithUnit(10000000 * _betCoin / 10000, 0);
        this.label1.string = SuperSevenManager.Text(135 * _betCoin);
        this.label2.string = SuperSevenManager.Text(90 * _betCoin);
        this.label3.string = SuperSevenManager.Text(60 * _betCoin);
        this.label4.string = SuperSevenManager.Text(40 * _betCoin);
    }

    _startAnimation() {
        const _childrens = this.detail_right_node.children;
        _childrens.forEach((child, idx) => {
            child.opacity = idx == this._currentIndex ? 255 : 0;
        });
        let node = _childrens[this._currentIndex];
        cc.tween(node).delay(this._displayDuration).to(this._fadeDuration, { opacity: 0 }).call(() => {
            this._currentIndex = (this._currentIndex + 1) % _childrens.length;
            this._nextAnimation();
        }).start();
    }

    _nextAnimation() {
        const _childrens = this.detail_right_node.children;
        let node = _childrens[this._currentIndex];
        cc.tween(node)
            .to(this._fadeDuration, { opacity: 255 })
            .delay(this._displayDuration)
            .to(this._fadeDuration, { opacity: 0 })
            .call(() => {
                this._currentIndex = (this._currentIndex + 1) % _childrens.length;
                this._nextAnimation();
            })
            .start();
    }

    _updateState() {
        let free = SuperSevenManager.Free;
        this.item_free_node.active = free;
        this.item_pay_node.active = !free;
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
            cc_detail_right_node    : [cc.Node],
            cc_item_free_node    : [cc.Node],
            cc_item_pay_node    : [cc.Node],
            cc_label1    : [cc.Label],
            cc_label2    : [cc.Label],
            cc_label3    : [cc.Label],
            cc_label4    : [cc.Label],
            cc_labelCurrent    : [cc.Label],
            cc_labelMax    : [cc.Label],
            cc_labelTotal    : [cc.Label],
            cc_scrollView    : [cc.ScrollView],
            cc_spPaytable    : [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected detail_right_node: cc.Node    = null;
   protected item_free_node: cc.Node    = null;
   protected item_pay_node: cc.Node    = null;
   protected label1: cc.Label    = null;
   protected label2: cc.Label    = null;
   protected label3: cc.Label    = null;
   protected label4: cc.Label    = null;
   protected labelCurrent: cc.Label    = null;
   protected labelMax: cc.Label    = null;
   protected labelTotal: cc.Label    = null;
   protected scrollView: cc.ScrollView    = null;
   protected spPaytable: cc.Sprite    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomDetail';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomDetail.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomDetail.VIEW_NAME;
    }
    // @view export resource end
}
