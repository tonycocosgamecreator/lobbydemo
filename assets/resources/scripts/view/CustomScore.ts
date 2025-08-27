// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import SuperSevenManager from '../manager/ss-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomScore')
export default class CustomScore extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi()
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    //------------------------ 内部逻辑 ------------------------//
    buildUi() {
        this._updateBet();
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_BET]: this._updateBet,
        });
    }

    _updateBet() {
        const _betCoin = SuperSevenManager.BetCoin;
        this.labelb4.string = SuperSevenManager.Text(_betCoin * 20000 / 10000);
        this.labelb3.string = SuperSevenManager.Text(_betCoin * 10000 / 10000);
        this.labelb2.string = SuperSevenManager.Text(_betCoin * 5000 / 10000);
        this.labelb1.string = SuperSevenManager.Text(_betCoin * 3000 / 10000);
        this.labelb5.string = SuperSevenManager.Text(_betCoin * 50000 / 10000);
        this.labelb6.string = SuperSevenManager.Text(_betCoin * 30000 / 10000);
        this.labelb7.string = SuperSevenManager.Text(_betCoin * 2000 / 10000);
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
            cc_b1_img_node    : [cc.Node],
            cc_b1_node    : [cc.Node],
            cc_b2_img_node    : [cc.Node],
            cc_b2_node    : [cc.Node],
            cc_b3_img_node    : [cc.Node],
            cc_b3_node    : [cc.Node],
            cc_b4_any_node    : [cc.Sprite],
            cc_b4_img3_node    : [cc.Node],
            cc_b4_node    : [cc.Node],
            cc_b5_img_node    : [cc.Node],
            cc_b5_node    : [cc.Node],
            cc_b6_img_node    : [cc.Node],
            cc_b6_node    : [cc.Node],
            cc_b7_any_node    : [cc.Sprite],
            cc_b7_node    : [cc.Node],
            cc_labelb1    : [cc.Label],
            cc_labelb2    : [cc.Label],
            cc_labelb3    : [cc.Label],
            cc_labelb4    : [cc.Label],
            cc_labelb5    : [cc.Label],
            cc_labelb6    : [cc.Label],
            cc_labelb7    : [cc.Label],
            cc_spr_b1    : [cc.Sprite],
            cc_spr_b2    : [cc.Sprite],
            cc_spr_b3    : [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected b1_img_node: cc.Node    = null;
   protected b1_node: cc.Node    = null;
   protected b2_img_node: cc.Node    = null;
   protected b2_node: cc.Node    = null;
   protected b3_img_node: cc.Node    = null;
   protected b3_node: cc.Node    = null;
   protected b4_any_node: cc.Sprite    = null;
   protected b4_img3_node: cc.Node    = null;
   protected b4_node: cc.Node    = null;
   protected b5_img_node: cc.Node    = null;
   protected b5_node: cc.Node    = null;
   protected b6_img_node: cc.Node    = null;
   protected b6_node: cc.Node    = null;
   protected b7_any_node: cc.Sprite    = null;
   protected b7_node: cc.Node    = null;
   protected labelb1: cc.Label    = null;
   protected labelb2: cc.Label    = null;
   protected labelb3: cc.Label    = null;
   protected labelb4: cc.Label    = null;
   protected labelb5: cc.Label    = null;
   protected labelb6: cc.Label    = null;
   protected labelb7: cc.Label    = null;
   protected spr_b1: cc.Sprite    = null;
   protected spr_b2: cc.Sprite    = null;
   protected spr_b3: cc.Sprite    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomScore';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomScore.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomScore.VIEW_NAME;
    }
    // @view export resource end
}
