// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
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
            [GameEvent.UPDATE_ADDBET]: this.updateAddBet,
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
                this.updateAddBet();
                break;
        }
    }

    updatePlayBetValue() {
        if (this._stage == baccarat.DeskStage.SettleStage) return;
        const currency = WalletManager.currency;
        const total = SevenUpSevenDownManager.TotalBet;
        const mybets = SevenUpSevenDownManager.MyBets;
        const info = SevenUpSevenDownManager.AllbetInfo;
        let id: string[][] = [];
        for (let i = 0; i < info.length; i++) {
            let _d = info[i];
            if (!id[_d.bet_id - 1]) id[_d.bet_id - 1] = [];
            id[_d.bet_id - 1].push(_d.player_id);
        }
        id = id.map(t => [...new Set(t)]);
        let all = 0;
        total.forEach((val) => {
            all += val;
        })
        this.node.children.forEach((child, idx) => {
            child.active = !!total[idx];
            if (total[idx]) {
                let bet = mybets[idx];
                let str = ''
                if (bet) {
                    str = str + '<color=#FFDC5A>' + CurrencyHelper.format(bet, currency, { showSymbol: true, minFractionDigits: 0 }) + '</color><color=#FFFFFF>/</color>';
                }
                str = str + '<color=#FFFFFF>' + CurrencyHelper.format(total[idx], currency, { showSymbol: bet ? false : true, minFractionDigits: 0 }) + '</color>';
                //比例
                if (child.getChildByName('progressbar')) {
                    child.getChildByName('label').getChildByName('labelbet').getComponent(cc.RichText).string = str;
                    child.getChildByName('label').getChildByName('labelpeople').getComponent(cc.Label).string = id[idx].length + '';
                    child.getChildByName('progressbar').getComponent(cc.ProgressBar).progress = total[idx] / all;
                    let tt = Math.ceil(total[idx] / all * 100);
                    child.getChildByName('progressbar').getChildByName('labelprogress').getComponent(cc.Label).string = tt + "%";
                } else {
                    child.getChildByName('labelbet').getComponent(cc.RichText).string = str;
                }

            }
        });

    }

    updateAddBet() {
        return;
        if (this._stage == baccarat.DeskStage.SettleStage) return;
        const data = SevenUpSevenDownManager.BetDetail;
        let all = 0;
        let id: number[] = [];
        let num: number[] = [];
        data.forEach(val => {
            if (!id[val.pos_id]) id[val.pos_id] = 0;
            id[val.pos_id] += val.bet_sum;
            all += val.bet_sum;
            if (!num[val.pos_id]) num[val.pos_id] = 0;
            num[val.pos_id] += 1;
        });
        this.node.children.forEach((child, idx) => {
            let index = idx + 1;
            if (!id[index]) id[index] = 0;
            if (!num[index]) num[index] = 0;
            child.getChildByName('label').getChildByName('labelpeople').getComponent(cc.Label).string = num[index] + '';
            if (all == 0) {
                child.getChildByName('progressbar').getComponent(cc.ProgressBar).progress = 0;
                child.getChildByName('progressbar').getChildByName('labelprogress').getComponent(cc.Label).string = '0%';
            } else {
                child.getChildByName('progressbar').getComponent(cc.ProgressBar).progress = id[index] / all;
                let str = Math.round(id[index] / all * 100);
                child.getChildByName('progressbar').getChildByName('labelprogress').getComponent(cc.Label).string = str + "%";
            }
        })

    }

    reset() {
        this.node.children.forEach(child => {
            child.active = false;
            if (child.getChildByName('progressbar')) {
                child.getChildByName('progressbar').getComponent(cc.ProgressBar).progress = 0;
                child.getChildByName('progressbar').getChildByName('labelprogress').getComponent(cc.Label).string = '0%';
                child.getChildByName('label').getChildByName('labelpeople').getComponent(cc.Label).string = '0';
                child.getChildByName('label').getChildByName('labelbet').getComponent(cc.RichText).string = '';
            } else {
                child.getChildByName('labelbet').getComponent(cc.RichText).string = '';
            }
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
