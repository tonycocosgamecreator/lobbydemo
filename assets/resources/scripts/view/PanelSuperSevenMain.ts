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
import SuperSevenManager, { gameState } from '../manager/ss-manager';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import { MessageSender } from '../network/net/message-sender';
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


    //------------------------ 内部逻辑 ------------------------//

    buildUi() {
        this.reset();
        BaseGlobal.registerListeners(this, {
            [GameEvent.ROTATION_END]: this._rotationEnd,
            [GameEvent.UPDATE_STATE]: this._updateState,
        });
    }


    _rotationEnd() {
        const count = SuperSevenManager.CurFreeCount;
        if (count) {
            this.spine_node.active = true;
            this.spFree.node.active = true;
            this.spFree.setAnimation(0, 'chuxian', false);
            this.scheduleOnce(() => {
                this.spFree.setAnimation(0, 'daiji', true);
            }, 0.5);
            SuperSevenManager.State = gameState.End;
            return;
        }
        const award = SuperSevenManager.SpinInfo.award;
        const betCoin = SuperSevenManager.BetCoin;
        let show = award && (award / betCoin) > 2
        if (show) {
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
                        this.reset();
                    }, 0.5);
                }, 2);
            }, 0.5);
        }
        this.scheduleOnce(() => {
            SuperSevenManager.State = gameState.End;
        }, show ? 2 : 0);
    }

    _updateState() {
        let state = SuperSevenManager.State;
        if (state == gameState.End) {
            let autoNum = SuperSevenManager.AutoNum;
            if (autoNum > 0) {
                let freeNum = SuperSevenManager.FreeCount;
                if (freeNum) {
                    SuperSevenManager.setAuto(0);
                } else {
                    SuperSevenManager.setAuto(autoNum);
                }
            }
        }
    }

    reset() {
        this.spine_node.active = false;
        this.spFont.node.active = false;
        this.spKuang.node.active = false;
        this.spFree.node.active = false;
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
        this.spFree.setAnimation(0, 'xiaoshi', false);
        this.scheduleOnce(() => {
            let data = {
                currency: WalletManager.currency,
                bet_size: SuperSevenManager.BetCoin
            }
            MessageSender.SendMessage(supersevenbaccarat.Message.MsgGameSpinReq, data);
            this.reset();
        })


    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttom_node: [CustomButtom],
            cc_buttonStart: [GButton, this.onClickButtonStart.bind(this)],
            cc_detail_node: [CustomDetail],
            cc_labelSpineWin: [cc.Label],
            cc_rotation_node: [CustomRotation],
            cc_score_node: [CustomScore],
            cc_spFont: [cc.sp.Skeleton],
            cc_spFree: [cc.sp.Skeleton],
            cc_spKuang: [cc.sp.Skeleton],
            cc_sphandShank: [cc.sp.Skeleton],
            cc_spine_node: [cc.Node],
            cc_top_node: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttom_node: CustomButtom = null;
    protected buttonStart: GButton = null;
    protected detail_node: CustomDetail = null;
    protected labelSpineWin: cc.Label = null;
    protected rotation_node: CustomRotation = null;
    protected score_node: CustomScore = null;
    protected spFont: cc.sp.Skeleton = null;
    protected spFree: cc.sp.Skeleton = null;
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
