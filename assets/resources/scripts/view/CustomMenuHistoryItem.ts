// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomMenuHistoryItem')
export default class CustomMenuHistoryItem extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    @ViewBase.requireResourceLoaded
    public fillData(data: jmbaccarat.PlayerHistory) {
        this.labelPeroid.string = data.period;
        this.labelBet.string = data.bet;
        const profit = parseFloat(data.win_coin) - parseFloat(data.bet);
        if (profit >= 0) {
            this.labelWin.string = "+" + profit.toFixed(2);
            //使用绿色
            this.labelWin.color = cc.color('#00FF00');
        } else {
            this.labelWin.string = profit.toFixed(2);
            this.labelWin.color = cc.Color.RED;
        }
        let list = data.win_type || []
        this.layout_node.children.forEach((t, idx) => {
            t.active = !!list[idx];
            if (list[idx]) {
                t.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/JM_Img_" + (11 + (list[idx] * 3)) + "/spriteFrame");
            }
        });
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
            cc_bg    : [cc.Sprite],
            cc_labelBet    : [cc.Label],
            cc_labelPeroid    : [cc.Label],
            cc_labelWin    : [cc.Label],
            cc_layout_node    : [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected bg: cc.Sprite    = null;
   protected labelBet: cc.Label    = null;
   protected labelPeroid: cc.Label    = null;
   protected labelWin: cc.Label    = null;
   protected layout_node: cc.Node    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomMenuHistoryItem';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomMenuHistoryItem.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomMenuHistoryItem.VIEW_NAME;
    }
    // @view export resource end
}
