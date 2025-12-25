// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { UIOpacity } from 'cc';
import { Tween } from 'cc';
import { v3 } from 'cc';
import { CurrencyHelper } from '../../helper/currency-helper';
import { tween } from 'cc';
import WalletManager from '../../manager/wallet-manager';
import BaseGlobal from '../../core/message/base-global';
import { GameEvent } from '../../define';
import CommonManager from '../../manager/common-manager';
import GameManager from '../../manager/game-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomTopRankUser')
export default class CustomTopRankUser extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _playerId: string = '-1';
    _callback = null;
    _index: number = -1;
    _currency = '';
    buildUi() {
        this._currency = WalletManager.currency;
        this._callback = () => {
            this.ndMask.active = false;
        }
        BaseGlobal.registerListeners(this, {
            [GameEvent.ANIMATION_END_UPDATE]: this.updatePlayBalance,
        });
    }

    @ViewBase.requireResourceLoaded
    init(index: number, data: baccarat.RankList | null) {
        this._index = index;
        this.sprRank.spriteFrame = this.getSpriteFrame(`textures/common/user/rankings_${index + 1}`);
        this.ndCrown.active = index == 0 ? true : false;
        if (!data) {
            this._playerId = '-1';
            this.node.active = false;
            return;
        }
        this.node.active = true;
        this._playerId = data.player_id;
        this.sprHead.spriteFrame = this.getSpriteFrame(`textures/avatars/av-${data.icon}`);
        this.labelCoin.string = CurrencyHelper.format(data.balance, this._currency, { showSymbol: true });
        this.ndMask.active = false;
    }

    updateUserHead(data: baccarat.RankList | null) {
        if (!data) {
            this._playerId = '-1';
            this.node.active = false;
            return;
        }
        if (this._playerId == '-1' || data.player_id == this._playerId) {
            this.labelCoin.string = CurrencyHelper.format(data.balance, this._currency, { showSymbol: true });
            this.node.active = true;
            return;
        }
        this.playUserHeadAnimation(data.player_id, data.icon);
    }

    updatePlayBalance() {
        if (this._playerId == '-1') return;
        const data = CommonManager.getTopPlayerDataById(this._playerId);
        if (!data) return;
        this.labelCoin.string = CurrencyHelper.format(data.balance, this._currency, { showSymbol: true });
    }

    playUserHeadAnimation(playerId: string, icon: number) {
        this._playerId = playerId;
        Tween.stopAllByTarget(this.ndHead);
        this.ndHead.eulerAngles = v3(0, 0, 0);
        cc.tween(this.ndHead)
            .to(0.2, { eulerAngles: v3(0, 90, 0) }, { easing: 'cubicInOut' })
            .call(() => {
                this.ndHead.eulerAngles = v3(0, -90, 0);
                this.sprHead.spriteFrame = this.getSpriteFrame(`textures/avatars/av-${icon}`);
                this.ndMask.active = false;
                this.updatePlayBalance();
            })
            .to(0.2, { eulerAngles: v3(0, 0, 0) }, { easing: 'cubicInOut' })
            .start();
    }

    playBetHeadAnimation() {
        this.ndMask.active = true;
        this._callback && this.unschedule(this._callback)
        this.scheduleOnce(this._callback, 0.5);
    }

    playWinLabelAnimation(win: number) {
        const node = this.labelWin.node;
        const uiOpacity = node.getComponent(UIOpacity);
        Tween.stopAllByTarget(node);
        Tween.stopAllByTarget(uiOpacity);
        uiOpacity.opacity = 0;
        node.setPosition(v3(43, -10, 0));
        node.scale = v3(0.8, 0.8, 1);
        this.labelWin.string = '+' + CurrencyHelper.format(win, this._currency);
        cc.tween(node)
            .parallel(
                tween().to(0.2, {
                    position: v3(43, 21, 0),
                    scale: v3(1, 1, 1)
                }, { easing: 'backOut' }),
                tween().to(0.15, { opacity: 255 }, { easing: 'cubicOut' })
            )
            .delay(0.6)
            .to(0.15, { opacity: 0 }, { easing: 'cubicIn' })
            .call(() => {
                this.labelWin.string = '';
                node.setPosition(v3(43, 0, 0));
            })
            .start();
    }

    updateResult() {
        if (this._playerId == '-1') return;
        let count = GameManager.getWinByPlayId(this._playerId);
        if (count > 0) {
            this.playWinLabelAnimation(count);
        }
    }

    reset() {
        this.node.active = false;
        this.ndMask.active = false;
        this.labelCoin.string = '';
        this.labelWin.string = '';
        const node = this.labelWin.node;
        const uiOpacity = node.getComponent(UIOpacity);
        Tween.stopAllByTarget(node);
        Tween.stopAllByTarget(uiOpacity);
        Tween.stopAllByTarget(this.ndHead);
    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonClick(event: cc.EventTouch) {
        cc.log('on click event cc_buttonClick');
    }
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonClick: [GButton, this.onClickButtonClick.bind(this)],
            cc_labelCoin: [cc.Label],
            cc_labelWin: [cc.Label],
            cc_ndCrown: [cc.Node],
            cc_ndHead: [cc.Node],
            cc_ndMask: [cc.Node],
            cc_sprHead: [cc.Sprite],
            cc_sprRank: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonClick: GButton = null;
    protected labelCoin: cc.Label = null;
    protected labelWin: cc.Label = null;
    protected ndCrown: cc.Node = null;
    protected ndHead: cc.Node = null;
    protected ndMask: cc.Node = null;
    protected sprHead: cc.Sprite = null;
    protected sprRank: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomTopRankUser';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomTopRankUser.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomTopRankUser.VIEW_NAME;
    }
    // @view export resource end
}
