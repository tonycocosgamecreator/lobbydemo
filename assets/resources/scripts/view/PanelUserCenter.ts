// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
import { CurrencyHelper } from '../helper/currency-helper';
import WalletManager from '../manager/wallet-manager';
import { ViewOpenAnimationType } from '../core/view/view-define';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;
declare type CONTEXT = {
    idx: number;
};
@ccclass('PanelUserCenter')
export default class PanelUserCenter extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    public context: CONTEXT | null = null;
    protected _open_animation_type: ViewOpenAnimationType = ViewOpenAnimationType.BOTTOM_TO_CENTER;
    buildUi() {
        if (this.context) {
            const data = SevenUpSevenDownManager.BigWinList;
            const _d = data[this.context.idx || 0];
            let currency = WalletManager.currency;
            this.labelcoin.string = CurrencyHelper.format(_d.balance, currency, { showSymbol: true });
            this.labelname.string = "Player_" + _d.player_id;
            this.sprhead.spriteFrame = this.getSpriteFrame(`textures/avatars/av-${_d.icon}`);
        } else {
            this.close();
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
            cc_bg: [cc.Node],
            cc_buttonClose: [GButton, this.onClickButtonClose.bind(this)],
            cc_labelcoin: [cc.Label],
            cc_labelname: [cc.Label],
            cc_sprhead: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected bg: cc.Node = null;
    protected buttonClose: GButton = null;
    protected labelcoin: cc.Label = null;
    protected labelname: cc.Label = null;
    protected sprhead: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelUserCenter';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelUserCenter.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelUserCenter.VIEW_NAME;
    }
    // @view export resource end
}
