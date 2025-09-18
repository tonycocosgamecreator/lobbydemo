// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SuperSevenManager, { gameState } from '../manager/ss-manager';
import WalletManager from '../manager/wallet-manager';
import { GButtonDisableStyle, GButtonState, GButtonTouchStyle } from '../core/view/view-define';
import { MessageSender } from '../network/net/message-sender';
import { Global } from '../global';
import { GameEvent } from '../define';
import BaseGlobal from '../core/message/base-global';
import UIHelper from '../network/helper/ui-helper';
import ViewManager from '../core/manager/view-manager';
import { GoldCounter } from './GoldCounter';
import AudioManager from '../core/manager/audio-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomButtom')
export default class CustomButtom extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _timer: number = 0;

    _autoNum: number = 0;

    _bets: number[] = [];

    _index: number = 0;

    _curBets: number = -1;

    _gameState: gameState = gameState.None;

    _free: boolean = false;

    buildUi() {
        this.buttonAdd.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonAdd.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonAdd.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/bottom/anniu_03'),
        this.getSpriteFrame('textures/bottom/anniu_03B'), this.getSpriteFrame('textures/bottom/anniu_03C')];

        this.buttonTimes.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;

        this.buttonSub.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonSub.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonSub.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/bottom/anniu_04'),
        this.getSpriteFrame('textures/bottom/anniu_04B'), this.getSpriteFrame('textures/bottom/anniu_04C')];

        this.buttonAuto.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonAuto.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonAuto.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/bottom/anniu_02'),
        this.getSpriteFrame('textures/bottom/anniu_02'), this.getSpriteFrame('textures/bottom/anniu_02B')];

        this.buttonStop.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonStop.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonStop.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/bottom/anniu_01'),
        this.getSpriteFrame('textures/bottom/anniu_01'), this.getSpriteFrame('textures/bottom/anniu_01B')];

        this.buttonSpin.disableEffectStyle = GButtonDisableStyle.CHANGE_SPRITE;
        this.buttonSpin.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonSpin.spriteFramesOfIconWithSelected = [this.getSpriteFrame('textures/bottom/anniu_00'),
        this.getSpriteFrame('textures/bottom/anniu_00'), this.getSpriteFrame('textures/bottom/anniu_00B')];
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_STATE]: this._updateState,
            [GameEvent.UPDATE_BET]: this._updateBet,
            [GameEvent.UPDATE_TIMES]: this._updateTimes,
            [GameEvent.UPDATE_AUTO]: this._updateAuto,
            [GameEvent.UPDATE_FREE]: this._updateFree,
        });
        this._init();
    }


    reset() {
        this.pay_node.active = false;
        this.free_node.active = false;
        this.labelWin.string = '';
        this.labelfreeGame.string = '';
        this.labelfreeTotal.string = '';
        this.labelResidue.string = '';
        this.labelResidue.node.parent.active = false;
        this.buttonStop.node.active = false;
        this.buttonSpin.node.active = false;
    }

    _init() {
        this.reset();
        this._resetSpine();
        this._updateTimes();
        this._updateFree();
        this._updateAuto();
        this._bets = WalletManager.getCurrencyBetSize();
        const _bet = SuperSevenManager.BetCoin;
        if (_bet) {
            if (!this._bets || this._bets.length == 0) {
                this._index = 0;
                return this.labelTotal.string = '';
            } else {
                this._bets.forEach((t, idx) => {
                    if (t == _bet) {
                        this._index = idx;
                    }
                })
            }
        } else {
            this._index = 0;
            if (!this._bets || this._bets.length == 0) {
                return this.labelTotal.string = '';
            }
        }
        SuperSevenManager.BetCoin = this._bets[this._index];
        this._updateState();
    }

    _updateBet() {
        this.labelTotal.string = SuperSevenManager.BetCoin + '';
        this.labelfreeTotal.string = SuperSevenManager.BetCoin + '';
    }

    _updateTimes() {
        this._timer = SuperSevenManager.Times;
        this.labelTimes.string = this._timer + '.0X';
    }

    _updateAuto() {
        this._autoNum = SuperSevenManager.AutoNum;
        this.labelResidue.node.parent.active = this._autoNum > 0;
        this.labelResidue.string = this._autoNum > 500 ? '∞' : this._autoNum > 0 ? this._autoNum + '' : '';
        this.labelResidue.fontSize = this._autoNum > 500 ? 40 : 20;
        this.buttonAuto.state = (this._autoNum > 0 || this._free || this._gameState == gameState.Ing) ? GButtonState.SHOW_DISABLE : GButtonState.SHOW_ENABLE;
    }

    _updateFree() {
        this._free = SuperSevenManager.Free;
        this.pay_node.active = !this._free;
        this.free_node.active = this._free;
        let all = SuperSevenManager.FreeCount + SuperSevenManager.FinishedCount;
        this.labelfreeGame.string = SuperSevenManager.FinishedCount + '/' + all;
        this.buttonAuto.state = (this._autoNum > 0 || this._free || this._gameState == gameState.Ing) ? GButtonState.SHOW_DISABLE : GButtonState.SHOW_ENABLE;
    }

    _updateState() {
        this._gameState = SuperSevenManager.State;
        const GC = this.labelWin.node.getComponent(GoldCounter);
        switch (this._gameState) {
            case gameState.None:
                this.buttonStop.node.active = false;
                this.buttonSpin.node.active = true;
                let eb = this._free || this._autoNum > 0;
                if (this._free) {
                    this._updateFont();
                }
                this.buttonAdd.state = eb ? GButtonState.SHOW_DISABLE : GButtonState.SHOW_ENABLE;
                this.buttonSub.state = eb ? GButtonState.SHOW_DISABLE : GButtonState.SHOW_ENABLE;
                this.buttonTimes.state = eb ? GButtonState.SHOW_DISABLE : GButtonState.SHOW_ENABLE;
                break;
            case gameState.Ing:
                GC.completeAnimation();
                if (SuperSevenManager.CurFree == false) {
                    GC.completeAnimation();
                    GC.setGold(0);
                }
                this.buttonAdd.state = GButtonState.SHOW_DISABLE;
                this.buttonSub.state = GButtonState.SHOW_DISABLE;
                this.buttonTimes.state = GButtonState.SHOW_DISABLE;
                this.buttonStop.node.active = true;
                this.buttonSpin.node.active = false;
                this.buttonAuto.state = GButtonState.SHOW_DISABLE;
                break;
            case gameState.Result: break;
            case gameState.End:
                this._resetSpine();
                let award = SuperSevenManager.SpinInfo?.award || 0;
                if (award) {
                    GC.completeAnimation();
                    if (SuperSevenManager.CurFree) {
                        let all = SuperSevenManager.FinishedWin;
                        GC.setGold(all);
                    } else {
                        GC.setGold(award);
                    }
                }
                this.buttonStop.node.active = false;
                this.buttonSpin.node.active = true;
                if (this._free) {
                    this.onClickButtonSpin(null);
                    return;
                }
                if (this._autoNum) {
                    SuperSevenManager.setAuto(this._autoNum);
                } else {
                    this.buttonAdd.state = GButtonState.SHOW_ENABLE;
                    this.buttonSub.state = GButtonState.SHOW_ENABLE;
                    this.buttonTimes.state = GButtonState.SHOW_ENABLE;
                }
                this.buttonAuto.state = (this._autoNum > 0 || this._free) ? GButtonState.SHOW_DISABLE : GButtonState.SHOW_ENABLE;
                break;
        }
    }

    playNiceAnimation() {
        AudioManager.playSound(this.bundleName, 'nice_win');
        this.spNiceWin.node.active = true;
        this.spNiceWinFont.node.active = true;
        let GC = this.labelNiceWin.getComponent(GoldCounter);
        let award = SuperSevenManager.SpinInfo?.award || 0;
        GC.completeAnimation();
        let time = 0;
        let win = 0;
        if (SuperSevenManager.CurFree) {
            let all = SuperSevenManager.FinishedWin;
            let diff = all - award;
            GC.setGold(diff);
            time = Math.abs(diff) * 0.05;
            win = all;
        } else {
            GC.setGold(1);
            time = Math.abs(award) * 0.05;
            win = award;
        }
        if (time > 1) time = 1;
        GC.setAnimationDuration(time);
        GC.addGold(win);
        this.spCoin.active = true;
        this.spCoin.getComponent(cc.ParticleSystem).play();
        this.spNiceWin.setAnimation(0, 'guang_chuxian', false);
        this.spNiceWinFont.setAnimation(0, 'nice_chuxian', false);
        this.spNiceWin.setCompleteListener(() => {
            this.spNiceWin.setCompleteListener(null)
            this.spNiceWin.setAnimation(0, 'guang_daiji', true);
        })
        this.spNiceWinFont.setCompleteListener(() => {
            this.spNiceWinFont.setCompleteListener(null)
            this.spNiceWinFont.setAnimation(0, 'nice_daiji', true);
            this.scheduleOnce(() => {
                this.spNiceWinFont.setAnimation(0, 'nice_xiaoshi', false);
                this.spNiceWin.setAnimation(0, 'guang_xiaoshi', false);
                let ps = this.spCoin.getComponent(cc.ParticleSystem);
                ps.stop();
                const originalSpeed = ps.simulationSpeed;
                ps.simulationSpeed = 1000;
                this.scheduleOnce(() => {
                    ps.simulationSpeed = originalSpeed;
                    ps.duration = ps.duration;
                    this.spCoin.active = false;
                });
                this.spNiceWinFont.setCompleteListener(() => {
                    this.spNiceWinFont.setCompleteListener(null)
                    SuperSevenManager.State = gameState.End;
                })
            }, 3)
        })
    }

    playWinAnimation() {
        let award = SuperSevenManager.SpinInfo?.award || 0;
        if (!award) return;
        const GC = this.labelWin.node.getComponent(GoldCounter);
        GC.completeAnimation();
        let time = 0;
        let win = 0;
        if (SuperSevenManager.CurFree) {
            let all = SuperSevenManager.FinishedWin;
            let diff = all - award;
            GC.setGold(diff);
            time = Math.abs(diff) * 0.05;
            win = all;
        } else {
            GC.setGold(1);
            time = Math.abs(award) * 0.05;
            win = award;
        }
        if (time > 1) time = 1;
        GC.setAnimationDuration(time);
        GC.addGold(win);
        this.scheduleOnce(() => {
            SuperSevenManager.State = gameState.End;
        }, time)

    }
    _resetSpine() {
        this.spNiceWin.node.active = false;
        this.spNiceWinFont.node.active = false;
        this.spCoin.active = false;
    }
    _updateFont() {
        const GC = this.labelWin.node.getComponent(GoldCounter);
        let award = SuperSevenManager.FinishedWin;
        GC.completeAnimation();
        GC.setGold(award);
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonSpin(event: cc.EventTouch) {
        cc.log('on click event cc_buttonSpin');
        if (this._gameState != gameState.End && this._gameState != gameState.None) return;
        let gold = WalletManager.balance;
        if (!this._free) {
            if (gold < this._bets[this._index]) {
                UIHelper.showConfirmOfOneButtonToRefreshBrowser(
                    resourcesDb.I18N_RESOURCES_DB_INDEX.EC_COIN_NO_ENOUGH,
                    resourcesDb.I18N_RESOURCES_DB_INDEX.Error
                );
                return;
            }
        }
        let data = {
            currency: WalletManager.currency,
            bet_size: this._bets[this._index]
        }
        MessageSender.SendMessage(supersevenbaccarat.Message.MsgGameSpinReq, data);
    }
    private onClickButtonAuto(event: cc.EventTouch) {
        if (this._gameState != gameState.End && this._gameState != gameState.None) return;
        if (this._free || this._autoNum > 0) return;
        ViewManager.OpenPanel(this.module, 'PanelAuto');
    }

    private onClickButtonStop(event: cc.EventTouch) {
        if (this._autoNum > 0) {
            SuperSevenManager.AutoNum = 0;
            return;
        }
        if (this._gameState != gameState.Ing) return;
        Global.sendMsg(GameEvent.STOP_ROTATION);
    }

    private onClickButtonAdd(event: cc.EventTouch) {
        if (this._gameState != gameState.End && this._gameState != gameState.None) return;
        if (this._free || this._autoNum > 0) return;
        if (this._index == this._bets.length - 1) return;
        this._index++;
        SuperSevenManager.BetCoin = this._bets[this._index];
    }

    private onClickButtonTimes(event: cc.EventTouch) {
        if (this._gameState != gameState.End && this._gameState != gameState.None) return;
        if (this._free || this._autoNum > 0) return;
        let _t = SuperSevenManager.Times;
        SuperSevenManager.Times = _t == 1 ? 2 : 1;
    }

    private onClickButtonSub(event: cc.EventTouch) {
        if (this._gameState != gameState.End && this._gameState != gameState.None) return;
        if (this._free || this._autoNum > 0) return;
        if (this._index == 0) return;
        this._index--;
        SuperSevenManager.BetCoin = this._bets[this._index];
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonAdd    : [GButton,this.onClickButtonAdd.bind(this)],
            cc_buttonAuto    : [GButton,this.onClickButtonAuto.bind(this)],
            cc_buttonSpin    : [GButton,this.onClickButtonSpin.bind(this)],
            cc_buttonStop    : [GButton,this.onClickButtonStop.bind(this)],
            cc_buttonSub    : [GButton,this.onClickButtonSub.bind(this)],
            cc_buttonTimes    : [GButton,this.onClickButtonTimes.bind(this)],
            cc_free_node    : [cc.Node],
            cc_labelNiceWin    : [cc.Label],
            cc_labelResidue    : [cc.Label],
            cc_labelTimes    : [cc.Label],
            cc_labelTotal    : [cc.Label],
            cc_labelWin    : [cc.Label],
            cc_labelfreeGame    : [cc.Label],
            cc_labelfreeTotal    : [cc.Label],
            cc_pay_node    : [cc.Node],
            cc_spCoin    : [cc.Node],
            cc_spNiceWin    : [cc.sp.Skeleton],
            cc_spNiceWinFont    : [cc.sp.Skeleton],
            cc_spbottom    : [cc.sp.Skeleton],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected buttonAdd: GButton    = null;
   protected buttonAuto: GButton    = null;
   protected buttonSpin: GButton    = null;
   protected buttonStop: GButton    = null;
   protected buttonSub: GButton    = null;
   protected buttonTimes: GButton    = null;
   protected free_node: cc.Node    = null;
   protected labelNiceWin: cc.Label    = null;
   protected labelResidue: cc.Label    = null;
   protected labelTimes: cc.Label    = null;
   protected labelTotal: cc.Label    = null;
   protected labelWin: cc.Label    = null;
   protected labelfreeGame: cc.Label    = null;
   protected labelfreeTotal: cc.Label    = null;
   protected pay_node: cc.Node    = null;
   protected spCoin: cc.Node    = null;
   protected spNiceWin: cc.sp.Skeleton    = null;
   protected spNiceWinFont: cc.sp.Skeleton    = null;
   protected spbottom: cc.sp.Skeleton    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomButtom';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomButtom.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomButtom.VIEW_NAME;
    }
    // @view export resource end
}
