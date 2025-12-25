// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import GameManager from '../manager/game-manager';
import { betInfo } from '../manager/common-manager';
import WalletManager from '../manager/wallet-manager';
import { CurrencyHelper } from '../helper/currency-helper';
import { UITransform } from 'cc';
import { v3 } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomDeskScoreItem')
export default class CustomDeskScoreItem extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//   
    _playId: string = '';
    _areaId = -1;
    _buttomArea: boolean = true;
    _maxWidth = 95;
    initData(area: number) {
        this.reset();
        this._playId = GameManager.PlayerId;
        this._areaId = area;
        this._buttomArea = (area == 6 || area == 12 || area == 13) ? false : true;
    }

    updatePlayBetValue(data: betInfo[]) {
        if (!data || !data.length) {
            this.reset();
            return;
        }
        let bet = 0;
        let areaBets = 0;
        let pIds = [];
        if (data && data.length) {
            data.forEach((val) => {
                if (val.player_id == this._playId) {
                    bet = bet.add(+val.bet_coin);
                }
                if (pIds.indexOf(val.player_id) == -1) {
                    pIds.push(val.player_id)
                }
                areaBets = areaBets.add(+val.bet_coin)
            })
        }
        const currency = WalletManager.currency;
        let str = ''
        if (bet) {
            str = str + '<color=#FFDC5A>' + CurrencyHelper.format(bet, currency, { showSymbol: true, minFractionDigits: 0 }) + '</color><color=#FFFFFF>/</color>';
        }
        str = str + '<color=#FFFFFF>' + CurrencyHelper.format(areaBets, currency, { showSymbol: bet ? false : true, minFractionDigits: 0 }) + '</color>';
        this.richBet.string = str;
        this.progressBar.node.active = !this._buttomArea;
        this.labelPeople.node.active = !this._buttomArea;
        this.node.active = true;
        if (this._buttomArea) {
            this.adjustRichText(this.richBet.node);
            return
        };
        this.labelPeople.string = pIds.length + '';
        const bets = GameManager.getAllBetValue();
        const ratio = Math.ceil(areaBets / bets * 100);
        this.progressBar.progress = ratio / 100;
        this.labelProgress.string = `${ratio}%`;
    }

    adjustRichText(richTextNode: cc.Node) {
        // this.scheduleOnce(() => {
            const transform = richTextNode.getComponent(UITransform);
            const actualWidth = transform.width;
            if (actualWidth > this._maxWidth) {
                // 计算需要缩小的比例
                const scale = this._maxWidth / actualWidth;
                richTextNode.scale = v3(scale, scale, scale);
            } else {
                richTextNode.scale = v3(1, 1, 1);
            }
        // });
    }

    reset() {
        this.node.active = false;
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
            cc_labelPeople: [cc.Label],
            cc_labelProgress: [cc.Label],
            cc_progressBar: [cc.ProgressBar],
            cc_richBet: [cc.RichText],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected labelPeople: cc.Label = null;
    protected labelProgress: cc.Label = null;
    protected progressBar: cc.ProgressBar = null;
    protected richBet: cc.RichText = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomDeskScoreItem';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomDeskScoreItem.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomDeskScoreItem.VIEW_NAME;
    }
    // @view export resource end
}
