// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import { StringUtils } from '../core/utils/string-utils';
import WalletManager from '../manager/wallet-manager';
import { CurrencyHelper } from '../helper/currency-helper';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomScore')
export default class CustomScore extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    _stage = -1;

    buildUi() {
        this.reset();
        BaseGlobal.registerListeners(this, {
            [GameEvent.PLYER_TOTAL_BET_UPDATE]: this.updatePlayBetValue,
        });
    }

    updateGameStage(reconnect: boolean = false) {
        this._stage = SevenUpSevenDownManager.Stage;
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this.reset();
                break;
            case baccarat.DeskStage.StartBetStage:
            case baccarat.DeskStage.EndBetStage:
            case baccarat.DeskStage.OpenStage:
                this.updatePlayBetValue();
                break;
        }
    }

    updatePlayBetValue() {
        if (this._stage == baccarat.DeskStage.SettleStage) return;
        const currency = WalletManager.currency;
        const total = SevenUpSevenDownManager.TotalBet;
        const mybets = SevenUpSevenDownManager.MyBets;
        this.node.children.forEach((child, idx) => {
            child.active = !!total[idx];
            if (total[idx]) {
                let bet = mybets[idx];
                let str = ''
                if (bet) {
                    str = str + '<color=#FFDC5A>' + CurrencyHelper.format(bet, currency, { showSymbol: true, minFractionDigits: 0 }) + '</color><color=#FFFFFF>/</color>';
                }
                str = str + '<color=#FFFFFF>' + CurrencyHelper.format(total[idx], currency, { showSymbol: bet ? false : true, minFractionDigits: 0 }) + '</color>';
                child.getChildByName('labelbet').getComponent(cc.RichText).string = str;
            }
        });

    }

    reset() {
        this.node.children.forEach(child => {
            child.active = false;
        })
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
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomScore';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomScore.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomScore.VIEW_NAME;
    }
    // @view export resource end
}
