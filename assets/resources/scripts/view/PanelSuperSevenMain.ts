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
import { IPanelSuperSevenMainView } from '../define/ipanel-ss-main-view';
import SuperSevenManager, { gameState, Gold } from '../manager/ss-manager';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import { GoldCounter } from './GoldCounter';
import { v3 } from 'cc';
import { GButtonTouchStyle } from '../core/view/view-define';
import { Tween } from 'cc';
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


    //------------------------ 内部逻辑 ------------------------//
    _gameState: gameState = gameState.End;
    _free: boolean = false;
    buildUi() {
        this._reset();
        this._updateFree();
        this.spGuangQuan.node.active = this._free;
        this.spGuangQuan.setAnimation(0, 'daiji', true);
        this.buttonStart.touchEffectStyle = GButtonTouchStyle.SCALE_LARGER;
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_STATE]: this._updateState,
            [GameEvent.UPDATE_FREE]: this._updateFree,
        });
    }

    _updateFree() {
        this._free = SuperSevenManager.Free;
    }

    _rotationEnd() {
        const count = SuperSevenManager.CurFreeCount;
        const sy = SuperSevenManager.FreeCount;
        if (count) {
            this.spine_node.active = true;
            this.spFree.node.active = true;
            let first = sy == count;
            let buttonNode = this.buttonStart.node;
            buttonNode.active = first;
            Tween.stopAllByTarget(buttonNode)
            buttonNode.scale = v3(0, 0, 0);
            this.spFree.setAnimation(0, 'chuxian', false);
            this.scheduleOnce(() => {
                cc.tween(buttonNode).to(0.5, { scale: v3(1, 1, 1) }, { easing: "backOut" }).start();
                this.spFree.setAnimation(0, 'daiji', true);
                if (!first) {
                    this.scheduleOnce(() => {
                        this.spKuang.setAnimation(0, 'xiaoshi', false);
                        this.scheduleOnce(() => {
                            this._reset();
                            SuperSevenManager.State = gameState.End;
                        }, 0.5);
                    }, 2);
                }
            }, 0.5);
            return;
        }
        if (this._free && sy == 0) {
            const win = SuperSevenManager.FinishedWin;
            if (win) {
                this.spine_node.active = true;
                this.spFreeWin.node.active = true;
                this.labelFreeWin.string = '';
                this.spFreeWin.setAnimation(0, 'chuxian', false);
                this.scheduleOnce(() => {
                    this.labelFreeWin.node.getComponent(GoldCounter).setGold(0);
                    this.labelFreeWin.node.getComponent(GoldCounter).setAnimationDuration(win * 0.05);
                    this.labelFreeWin.node.getComponent(GoldCounter).addGold(win);
                    this.spFreeWin.setAnimation(0, 'daiji', true);
                }, 0.8);
                return;
            } else {
                //强转游戏状态
                SuperSevenManager.Free = false;
                this._free = false;
                this.detail_node._updateChange(1);
                SuperSevenManager.State = gameState.End;
            }
        }
        const gold = SuperSevenManager.Gold;
        if (gold != Gold.None) {
            this.spGuangQuan.setAnimation(0, 'baozha', false);
            this.spGuangQuan.setCompleteListener(() => {
                this.spGuangQuan.setCompleteListener(null);
                this.spGuangQuan.setAnimation(0, 'daiji', true);
            });
        }
        const show = gold == Gold.Big;
        if (show) {
            const award = SuperSevenManager.SpinInfo.award;
            this.spine_node.active = true;
            this.spFont.node.active = true;
            this.spKuang.node.active = true;
            this.labelSpineWin.string = SuperSevenManager.Text(award);
            this.spFont.setAnimation(0, 'wz_chuxian', false);
            this.spKuang.setAnimation(0, 'chuxian', false);
            this.scheduleOnce(() => {
                this.spFont.setAnimation(0, 'wz_daiji', true);
                this.spKuang.setAnimation(0, 'daiji', true);
                this.scheduleOnce(() => {
                    this.spFont.setAnimation(0, 'wz_xiaoshi', false);
                    this.spKuang.setAnimation(0, 'xiaoshi', false);
                    this.scheduleOnce(() => {
                        this._reset();
                    }, 0.5);
                }, 2);
            }, 0.5);
        }
        this.scheduleOnce(() => {
            SuperSevenManager.State = gameState.End;
        }, show ? 2 : 0);
    }

    _updateState() {
        this._gameState = SuperSevenManager.State;
        switch (this._gameState) {
            case gameState.Ing: this._reset(); break;
            case gameState.Result: this._rotationEnd(); break;
            case gameState.End:
                let autoNum = SuperSevenManager.AutoNum;
                if (autoNum > 0) {
                    let freeNum = SuperSevenManager.FreeCount;
                    if (freeNum) {
                        SuperSevenManager.setAuto(0);
                    } else {
                        SuperSevenManager.setAuto(autoNum);
                    }
                }
                break;
        }
    }

    _reset() {
        this.spine_node.active = false;
        this.spFont.node.active = false;
        this.spKuang.node.active = false;
        this.spFree.node.active = false;
        this.spFreeWin.node.active = false;
    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonStart(event: cc.EventTouch) {
        this.buttonStart.node.active = false;
        this.spFree.setAnimation(0, 'xiaosi', false);
        SuperSevenManager.Free = true;
        this.detail_node._updateChange(1);
        this.rotation_node._playXingGuang();
        this.scheduleOnce(() => {
            this._reset();
            this.spGuangQuan.node.active = true;
            this.spGuangQuan.setAnimation(0, 'baozha', false);
            this.spGuangQuan.setCompleteListener(() => {
                this.spGuangQuan.setCompleteListener(null);
                this.spGuangQuan.setAnimation(0, 'daiji', true);
                SuperSevenManager.State = gameState.End;
            });
        }, 1);
        // let data = {
        //     currency: WalletManager.currency,
        //     bet_size: SuperSevenManager.BetCoin
        // }
        // MessageSender.SendMessage(supersevenbaccarat.Message.MsgGameSpinReq, data);
    }


    private onClickButtonCollect(event: cc.EventTouch) {
        cc.log('on click event cc_buttonCollect');
        this.spFreeWin.setAnimation(0, 'xiaoshi', false);
        SuperSevenManager.Free = false;
        this.detail_node._updateChange(1);
        SuperSevenManager.State = gameState.End;
        this.rotation_node._playXingGuang();
        this.scheduleOnce(() => { this._reset(); }, 0.5);
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttom_node: [CustomButtom],
            cc_buttonCollect: [GButton, this.onClickButtonCollect.bind(this)],
            cc_buttonStart: [GButton, this.onClickButtonStart.bind(this)],
            cc_detail_node: [CustomDetail],
            cc_labelFreeWin: [cc.Label],
            cc_labelSpineWin: [cc.Label],
            cc_rotation_node: [CustomRotation],
            cc_score_node: [CustomScore],
            cc_spFont: [cc.sp.Skeleton],
            cc_spFree: [cc.sp.Skeleton],
            cc_spFreeWin: [cc.sp.Skeleton],
            cc_spGuangQuan: [cc.sp.Skeleton],
            cc_spKuang: [cc.sp.Skeleton],
            cc_sphandShank: [cc.sp.Skeleton],
            cc_spine_node: [cc.Node],
            cc_top_node: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttom_node: CustomButtom = null;
    protected buttonCollect: GButton = null;
    protected buttonStart: GButton = null;
    protected detail_node: CustomDetail = null;
    protected labelFreeWin: cc.Label = null;
    protected labelSpineWin: cc.Label = null;
    protected rotation_node: CustomRotation = null;
    protected score_node: CustomScore = null;
    protected spFont: cc.sp.Skeleton = null;
    protected spFree: cc.sp.Skeleton = null;
    protected spFreeWin: cc.sp.Skeleton = null;
    protected spGuangQuan: cc.sp.Skeleton = null;
    protected spKuang: cc.sp.Skeleton = null;
    protected sphandShank: cc.sp.Skeleton = null;
    protected spine_node: cc.Node = null;
    protected top_node: cc.Node = null;
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
