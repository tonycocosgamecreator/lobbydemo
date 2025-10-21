// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import WalletManager from '../manager/wallet-manager';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomHead')
export default class CustomHead extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    buildUi() {
        BaseGlobal.registerListeners(this, {
            [GameEvent.PLAYER_INFO_UPDATE]: this.updateTotalBalance
        });
        const balance = WalletManager.balance;
        this.updateTotalBalance(balance);
        this.label_name.string = "aviator_" + SevenUpSevenDownManager.PlayerId;
        this.spr_head.spriteFrame = this.getSpriteFrame(`textures/avatars/av-${SevenUpSevenDownManager.HeadId}`);
    }

    updateTotalBalance(balance: number): void {
        this.label_coin.string = balance.toFixed(2);
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
            cc_label_coin: [cc.Label],
            cc_label_name: [cc.Label],
            cc_spr_head: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected label_coin: cc.Label = null;
    protected label_name: cc.Label = null;
    protected spr_head: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomHead';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomHead.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomHead.VIEW_NAME;
    }

    // @view export resource end
}
