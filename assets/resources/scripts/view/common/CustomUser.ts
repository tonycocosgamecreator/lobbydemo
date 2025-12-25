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
import AudioManager from '../../core/manager/audio-manager';
import GameManager from '../../manager/game-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomUser')
export default class CustomUser extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _currency = '';
    buildUi() {
        this._currency = WalletManager.currency;
        BaseGlobal.registerListeners(this, {
            [GameEvent.PLAYER_INFO_UPDATE]: this.updateTotalBalance,
            [GameEvent.ANIMATION_END_UPDATE]: this.updatePlayBalance,
            [GameEvent.PLAYER_CHANGE_AVATAR]: this.updateHead,
        });
    }

    updatePlayer() {
        this.labelName.string = CommonManager.showName(GameManager.PlayerId);
        this.updateHead();
        this.updatePlayBalance();
    }

    updateHead() {
        this.sprHead.spriteFrame = this.getSpriteFrame(`textures/avatars/av-${GameManager.Icon}`);
    }

    updateTotalBalance(balance: number): void {
        this.labelCoin.string = CurrencyHelper.format(balance, this._currency, { showSymbol: true });
    }

    updatePlayBalance() {
        const balance = WalletManager.balance;
        this.updateTotalBalance(balance);
    }

    updateResult() {
        let count = GameManager.getWinByPlayId();
        if (count > 0) {
            this.playWinLabelAnimation(count);
        }
    }

    playWinLabelAnimation(win: number) {
        const node = this.labelWin.node;
        const uiOpacity = node.getComponent(UIOpacity);
        Tween.stopAllByTarget(node);
        Tween.stopAllByTarget(uiOpacity);
        uiOpacity.opacity = 0;
        node.setPosition(v3(-30, 30, 0)); // 从稍下方开始
        node.scale = v3(0.8, 0.8, 1); // 初始稍小
        this.labelWin.string = '+' + CurrencyHelper.format(win, this._currency);
        cc.tween(node)
            .parallel(
                tween().to(0.2, {
                    position: v3(-30, 61, 0),
                    scale: v3(1, 1, 1)
                }, { easing: 'backOut' }),
                tween().to(0.15, { opacity: 255 }, { easing: 'cubicOut' })
            ).call(() => {
                AudioManager.playSound(this.bundleName, '胜利收取金币');
            })
            .delay(0.6)
            .to(0.15, { opacity: 0 }, { easing: 'cubicIn' })
            .call(() => {
                this.labelWin.string = '';
                node.setPosition(v3(-30, 30, 0));
            })
            .start();
    }

    getMyHeadWorldPos(): cc.Vec3 {
        let wordPos = this.sprHead.node.parent.transform.convertToWorldSpaceAR(this.sprHead.node.position);
        return wordPos;
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
            cc_labelCoin: [cc.Label],
            cc_labelName: [cc.Label],
            cc_labelWin: [cc.Label],
            cc_sprHead: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected labelCoin: cc.Label = null;
    protected labelName: cc.Label = null;
    protected labelWin: cc.Label = null;
    protected sprHead: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomUser';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomUser.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomUser.VIEW_NAME;
    }
    // @view export resource end
}
