// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomButtom from 'db://assets/resources/scripts/view/CustomButtom';
import CustomDetail from 'db://assets/resources/scripts/view/CustomDetail';
import CustomRotation from 'db://assets/resources/scripts/view/CustomRotation';
import CustomScore from 'db://assets/resources/scripts/view/CustomScore';
import CustomTop from 'db://assets/resources/scripts/view/CustomTop';
import { IPanelSuperSevenMainView } from '../define/ipanel-ss-main-view';
import SuperSevenManager, { gameState, Gold } from '../manager/ss-manager';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import { GoldCounter } from './GoldCounter';
import { v3 } from 'cc';
import { GButtonTouchStyle } from '../core/view/view-define';
import { Tween } from 'cc';
import AudioManager from '../core/manager/audio-manager';
import { view } from 'cc';
import WalletManager from '../manager/wallet-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelSuperSevenMain')
export default class PanelSuperSevenMain extends ViewBase implements IPanelSuperSevenMainView {
    ;

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        SuperSevenManager.View = this;
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
        SuperSevenManager.View = null;
    }

    protected start(): void {
        const screenSize = view.getVisibleSize();
        this.top_node.node.getComponent(cc.UITransform).height = screenSize.height;
        this.scheduleOnce(() => {
            this.top_node.updateAllWidgets();
        }, 1)
    }

    //------------------------ 内部逻辑 ------------------------//
    _gameState: gameState = gameState.None;
    _free: boolean = false;

    buildUi() {
        this._reset();
        this._updateFree();
        this.spGuangQuan.node.active = this._free;
        if (this._free) {
            this.spGuangQuan.setAnimation(0, 'daiji', true);
        }
        this.buttonStart.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_STATE]: this._updateState,
            [GameEvent.UPDATE_FREE]: this._updateFree,
        });
        this.sptankuang.node.parent.active = true;
        this.sptankuang.setAnimation(0, 'chuxian', false);
        this.sptankuang.setCompleteListener(() => {
            this.sptankuang.setCompleteListener(null);
            this.sptankuang.setAnimation(0, 'daiji', false);
            this.sptankuang.setCompleteListener(() => {
                this.sptankuang.setCompleteListener(null);
                this.sptankuang.setAnimation(0, 'xiaosi', false);
                this.sptankuang.setCompleteListener(() => {
                    this.sptankuang.setCompleteListener(null);
                    this.sptankuang.node.parent.active = false;
                })
            })
        })
    }

    _updateFree() {
        this._free = SuperSevenManager.Free;
    }

    _rotationEnd() {
        const count = SuperSevenManager.CurFreeCount;
        const freeCount = SuperSevenManager.FreeCount;
        const gold = SuperSevenManager.Gold;
        this._award = SuperSevenManager.SpinInfo.award;
        this._playNum = gold - 2;
        if (count) {
            SuperSevenManager.Free = true;
            let curType = SuperSevenManager.CurFree;
            this.startFreeAnimation(count == freeCount && !curType);
            return;
        }
        if (this._free) {
            if (gold != Gold.None) {
                this.spGuangQuan.setAnimation(0, 'baozha', false);
                this.spGuangQuan.setCompleteListener(() => {
                    this.spGuangQuan.setCompleteListener(null);
                    this.spGuangQuan.setAnimation(0, 'daiji', true);
                });
            }
            //最后一局了
            if (freeCount == 0) {
                this.endFreeAnimation();
                return;
            }
        }

        if (gold > Gold.Nice) {
            this.bigWinAnimation();
            return;
        }

        if (gold == Gold.Nice) {
            this.niceAnimation();
            return;
        }

        if (gold == Gold.Win) {
            this.winAnimation();
            return;
        }
        this.scheduleOnce(() => {
            SuperSevenManager.State = gameState.End;
        }, gold == Gold.None ? 0 : 2)

    }

    niceAnimation() {
        this.spine_node.active = true;
        this.buttom_node.playNiceAnimation();
    }

    winAnimation() {
        this.spine_node.active = true;
        this.buttom_node.playWinAnimation();
    }

    private timerId: any = null;
    clearTimer(): void {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }
    _spinWinName = ['big', 'huge', 'massive', 'legendary'];
    _playNum = 0;
    bigWinAnimation() {
        this.spine_node.active = true;
        cc.tween(this.content_node).repeatForever(cc.tween().to(0.05, { x: -3 }).to(0.05, { x: 3 })).start();
        cc.tween(this.content_node).to(2, { scale: v3(1.3, 1.3, 0) }, { easing: "sineOut" }).delay(0.5).call(() => {
            Tween.stopAllByTarget(this.content_node);
            this.content_node.position = v3(0, this.content_node.position.y, 0);
            cc.tween(this.content_node).to(2, { scale: v3(1, 1, 0) }, { easing: "sineOut" }).start();
            let bgNode = this.animation_node.node;
            Tween.stopAllByTarget(bgNode);
            bgNode.active = true;
            bgNode.opacity = 0;
            cc.tween(bgNode).to(0.2, { opacity: 200 }).start();
            this.scheduleOnce(() => {
                this.commonWin();
            }, 0.2);
        }).start();
    }
    _playWinAnimation = false;
    _award: number = 0;
    commonWin() {
        let idx = 0;
        this.win_node.active = true;
        this.win_lizi_node.node.active = true;
        this.labelSpineWin.node.getComponent(GoldCounter).setGold(0);
        let time = this._playNum * 3 - 2;
        this.labelSpineWin.node.getComponent(GoldCounter).setAnimationDuration(time);
        this.labelSpineWin.node.getComponent(GoldCounter).addGold(this._award);
        this.spGuang.setAnimation(0, 'chuxian', false);
        this.spKuang.setAnimation(0, 'chuxian', false);
        this.spKuang.setCompleteListener(() => {
            this.spKuang.setCompleteListener(null)
            this.spKuang.setAnimation(0, 'daiji', true);
        })
        this.spGuang.setCompleteListener(() => {
            this.spGuang.setCompleteListener(null)
            this.spGuang.setAnimation(0, 'daiji', true);
        })
        let cb = (play: number) => {
            let name = this._spinWinName[idx];
            let soundName = `human_${name}_win`;
            AudioManager.playSound(this.bundleName, soundName);
            this.spFont.setSkin(name);
            this.spFont.setAnimation(0, 'wz_chuxian', true);
            this.spFont.setCompleteListener(() => {
                this.win_lizi_node.node.children.forEach(child => {
                    let ps = child.getComponent(cc.ParticleSystem);
                    ps.rateOverTime.constant = 30 + 20 * idx;
                    ps.play();
                })
                this._playWinAnimation = true;
                this.spFont.setCompleteListener(null);
                this.spFont.setAnimation(0, 'wz_daiji', true);
                if (play == 0) {
                    this._playWinAnimation = false;
                    this.scheduleOnce(() => {
                        this.spGuang.setCompleteListener(null)
                        this.spFont.setAnimation(0, 'wz_xiaoshi', false);
                        this.spKuang.setAnimation(0, 'xiaoshi', false);
                        this.spGuang.setAnimation(0, 'xiaoshi', false);
                        let bgNode = this.animation_node.node;
                        cc.tween(bgNode).to(0.33, { opacity: 0 }).call(() => {
                            this.win_lizi_node.node.children.forEach((child, idx) => {
                                let ps = child.getComponent(cc.ParticleSystem);
                                ps.stop();
                                const originalSpeed = ps.simulationSpeed;
                                ps.simulationSpeed = 1000;
                                this.scheduleOnce(() => {
                                    ps.rateOverTime.constant = 30;
                                    ps.simulationSpeed = originalSpeed;
                                    ps.duration = ps.duration;
                                    if (idx == 1) {
                                        SuperSevenManager.State = gameState.End;
                                    }
                                }, 0)
                            })
                        }).start();
                    }, 2);
                }
            })
        }
        this._playNum--;
        cb(this._playNum);
        if (this._playNum) {
            this.timerId = setInterval(() => {
                this._playNum--;
                if (this._playNum <= 0) {
                    this.clearTimer();
                }
                idx++;
                cb && cb(this._playNum);
            }, 3000);
        }
    }
    bigWinAnimation2() {
        this.spine_node.active = true;
        let bgNode = this.animation_node.node;
        Tween.stopAllByTarget(bgNode);
        bgNode.active = true;
        bgNode.opacity = 200;
        this.commonWin();
    }

    startFreeAnimation(show: boolean) {
        AudioManager.playBgm(this.bundleName, 'free_bgm');
        AudioManager.playSound(this.bundleName, 'extra_free_games');
        this.spine_node.active = true;
        let bgNode = this.animation_node.node;
        Tween.stopAllByTarget(bgNode);
        bgNode.active = true;
        bgNode.opacity = 0;
        cc.tween(bgNode).to(0.2, { opacity: 120 }).start();
        this.spFree.node.active = true;
        let buttonNode = this.buttonStart.node;
        buttonNode.active = show;
        Tween.stopAllByTarget(buttonNode)
        buttonNode.scale = v3(0, 0, 0);
        this.spFree.setAnimation(0, 'chuxian', false);
        this.spFree.setCompleteListener(() => {
            this.spFree.setCompleteListener(null);
            if (show) {
                cc.tween(buttonNode).to(0.3, { scale: v3(1, 1, 1) }, { easing: "backOut" }).start();
                this.spFree.setAnimation(0, 'daiji', true);
            } else {
                this.spFree.setAnimation(0, 'daiji', false);
                this.scheduleOnce(() => {
                    this.spFree.setAnimation(0, 'xiaosi', false);
                    cc.tween(bgNode).to(0.5, { opacity: 0 }).call(() => {
                        SuperSevenManager.State = gameState.End;
                    }).start();
                }, 1)
            }
        })
    }

    endFreeAnimation() {
        AudioManager.playSound(this.bundleName, 'congratulations');
        this.spine_node.active = true;
        let bgNode = this.animation_node.node;
        Tween.stopAllByTarget(bgNode);
        bgNode.active = true;
        bgNode.opacity = 0;
        let N1 = this.labelFreeWin.node;
        Tween.stopAllByTarget(N1);
        N1.opacity = 255;
        cc.tween(bgNode).to(0.2, { opacity: 120 }).start();
        const win = SuperSevenManager.FinishedWin;
        this.spFreeWin.node.active = true;
        this.buttonCollect.node.active = true;
        this.labelFreeWin.node.getComponent(GoldCounter).setGold(0);
        let time = Math.abs(win * 0.05);
        if (time > 5) time = 5;
        this.labelFreeWin.node.getComponent(GoldCounter).setAnimationDuration(time);
        this.labelFreeWin.node.getComponent(GoldCounter).addGold(win);
        this.buttom_node._updateFont();
        this.spFreeWin.setAnimation(0, 'chuxian', false);
        this.spFreeWin.setCompleteListener(() => {
            this.spFreeWin.setCompleteListener(null);
            this.spFreeWin.setAnimation(0, 'daiji', true);
        })
    }

    _updateState() {
        this._gameState = SuperSevenManager.State;
        switch (this._gameState) {
            case gameState.Ing:
                this.sphandShank.setAnimation(0, 'animation', false);
                break;
            case gameState.Result: this._rotationEnd(); break;
            case gameState.End:
                this._reset();
                const balance = WalletManager.balance;
                this.top_node.updateTotalBalance(balance);
                break;
        }
    }

    _reset() {
        Tween.stopAllByTarget(this.content_node);
        this.content_node.scale = v3(1, 1, 1);
        this.content_node.position = v3(0, this.content_node.position.y, 0);
        this.spine_node.active = false;
        this.win_node.active = false;
        this.spFont.setCompleteListener(null);
        this.spGuang.setCompleteListener(null);
        this.spKuang.setCompleteListener(null);
        this.spFree.node.active = false;
        this.spFree.setCompleteListener(null);
        this.spFreeWin.node.active = false;
        this.spFreeWin.setCompleteListener(null);
        this.animation_node.node.active = false;
        this.clearTimer();
        this._playWinAnimation = false;
        this.win_lizi_node.node.active = false;
    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        if (msgType == supersevenbaccarat.Message.MsgGameEnterAck) {
            SuperSevenManager.SendMsg = false;
            SuperSevenManager.AutoNum = 0;
        }
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonStart(event: cc.EventTouch) {
        this.buttonStart.node.active = false;
        this.spFree.setAnimation(0, 'xiaosi', false);
        let bgNode = this.animation_node.node;
        cc.tween(bgNode).to(0.5, { opacity: 0 }).call(() => {
            this.spFree.node.active = false;
            this.detail_node._updateChange(1);
            this.rotation_node._playXingGuang();
            this.scheduleOnce(() => {
                this.spGuangQuan.node.active = true;
                this.spGuangQuan.setAnimation(0, 'baozha', false);
                this.spGuangQuan.setCompleteListener(() => {
                    this.spGuangQuan.setCompleteListener(null);
                    this.spGuangQuan.setAnimation(0, 'daiji', true);
                    SuperSevenManager.State = gameState.End;
                });
            }, 1);
        }).start();
    }


    private onClickButtonCollect(event: cc.EventTouch) {
        cc.log('on click event cc_buttonCollect');
        this.buttonCollect.node.active = false;
        let N1 = this.labelFreeWin.node;
        cc.tween(N1).to(0.2, { opacity: 0 }).start();
        this.spFreeWin.setAnimation(0, 'xiaosi', false);
        let bgNode = this.animation_node.node;
        cc.tween(bgNode).to(0.33, { opacity: 0 }).call(() => {
            this.spFreeWin.node.active = false;
            this.spGuangQuan.setCompleteListener(null);
            this.spGuangQuan.node.active = false;
            SuperSevenManager.Free = false;
            this.detail_node._updateChange(1);
            this.rotation_node._playXingGuang();
            const gold = SuperSevenManager.Gold;
            this.scheduleOnce(() => {
                this.spFreeWin.setCompleteListener(null);
                if (gold >= Gold.Big) {
                    this.bigWinAnimation2();
                    return;
                }
                SuperSevenManager.State = gameState.End;
                AudioManager.playBgm(this.bundleName, 'bgm');
            }, 1);
        }).start();
    }


    private onClickButtonCloseWin(event: cc.EventTouch) {
        if (this._gameState != gameState.Result) return;
        if (!this._playWinAnimation) return;
        this._playWinAnimation = false;
        this.clearTimer();
        this.spFont.setCompleteListener(null);
        const gold = SuperSevenManager.Gold;
        let idx = gold - 3;
        let name = this._spinWinName[idx];
        this.win_lizi_node.node.children.forEach(child => {
            let ps = child.getComponent(cc.ParticleSystem);
            ps.rateOverTime.constant = 30 + 20 * idx;
            ps.play();
        })
        this.spFont.setSkin(name);
        this.spFont.setAnimation(0, 'wz_daiji', true);
        this.labelSpineWin.node.getComponent(GoldCounter).completeAnimation()
        this.labelSpineWin.node.getComponent(GoldCounter).addGold(this._award);
        this.scheduleOnce(() => {
            this.spGuang.setCompleteListener(null)
            this.spFont.setAnimation(0, 'wz_xiaoshi', false);
            this.spKuang.setAnimation(0, 'xiaoshi', false);
            this.spGuang.setAnimation(0, 'xiaoshi', false);
            let bgNode = this.animation_node.node;
            cc.tween(bgNode).to(0.33, { opacity: 0 }).call(() => {
                this.win_lizi_node.node.children.forEach((child, idx) => {
                    let ps = child.getComponent(cc.ParticleSystem);
                    ps.stop();
                    const originalSpeed = ps.simulationSpeed;
                    ps.simulationSpeed = 1000;
                    this.scheduleOnce(() => {
                        ps.rateOverTime.constant = 30;
                        ps.simulationSpeed = originalSpeed;
                        ps.duration = ps.duration;
                        if (idx == 1) {
                            SuperSevenManager.State = gameState.End;
                        }
                    }, 0)
                })
            }).start();
        }, 2);

    }


    private onClickButtonCloseTip(event: cc.EventTouch) {
        this.sptankuang.setCompleteListener(null);
        this.sptankuang.node.parent.active = false;
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_animation_node: [cc.Sprite],
            cc_buttom_node: [CustomButtom],
            cc_buttonCloseTip: [GButton, this.onClickButtonCloseTip.bind(this)],
            cc_buttonCloseWin: [GButton, this.onClickButtonCloseWin.bind(this)],
            cc_buttonCollect: [GButton, this.onClickButtonCollect.bind(this)],
            cc_buttonStart: [GButton, this.onClickButtonStart.bind(this)],
            cc_content_node: [cc.Node],
            cc_detail_node: [CustomDetail],
            cc_labelFreeWin: [cc.Label],
            cc_labelSpineWin: [cc.Label],
            cc_rotation_node: [CustomRotation],
            cc_score_node: [CustomScore],
            cc_spFont: [cc.sp.Skeleton],
            cc_spFree: [cc.sp.Skeleton],
            cc_spFreeWin: [cc.sp.Skeleton],
            cc_spGuang: [cc.sp.Skeleton],
            cc_spGuangQuan: [cc.sp.Skeleton],
            cc_spKuang: [cc.sp.Skeleton],
            cc_sphandShank: [cc.sp.Skeleton],
            cc_spine_node: [cc.Node],
            cc_sptankuang: [cc.sp.Skeleton],
            cc_top_node: [CustomTop],
            cc_win_lizi_node: [cc.Mask],
            cc_win_node: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected animation_node: cc.Sprite = null;
    protected buttom_node: CustomButtom = null;
    protected buttonCloseTip: GButton = null;
    protected buttonCloseWin: GButton = null;
    protected buttonCollect: GButton = null;
    protected buttonStart: GButton = null;
    protected content_node: cc.Node = null;
    protected detail_node: CustomDetail = null;
    protected labelFreeWin: cc.Label = null;
    protected labelSpineWin: cc.Label = null;
    protected rotation_node: CustomRotation = null;
    protected score_node: CustomScore = null;
    protected spFont: cc.sp.Skeleton = null;
    protected spFree: cc.sp.Skeleton = null;
    protected spFreeWin: cc.sp.Skeleton = null;
    protected spGuang: cc.sp.Skeleton = null;
    protected spGuangQuan: cc.sp.Skeleton = null;
    protected spKuang: cc.sp.Skeleton = null;
    protected sphandShank: cc.sp.Skeleton = null;
    protected spine_node: cc.Node = null;
    protected sptankuang: cc.sp.Skeleton = null;
    protected top_node: CustomTop = null;
    protected win_lizi_node: cc.Mask = null;
    protected win_node: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelSuperSevenMain';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelSuperSevenMain.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelSuperSevenMain.VIEW_NAME;
    }
    // @view export resource end
}
