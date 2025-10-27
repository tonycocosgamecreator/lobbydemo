// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomBigWinner from 'db://assets/resources/scripts/view/CustomBigWinner';
import CustomChip from 'db://assets/resources/scripts/view/CustomChip';
import CustomDesk from 'db://assets/resources/scripts/view/CustomDesk';
import CustomFlyChip from 'db://assets/resources/scripts/view/CustomFlyChip';
import CustomHandle from 'db://assets/resources/scripts/view/CustomHandle';
import CustomHead from 'db://assets/resources/scripts/view/CustomHead';
import CustomMainHistory from 'db://assets/resources/scripts/view/CustomMainHistory';
import CustomOnline from 'db://assets/resources/scripts/view/CustomOnline';
import CustomRecord from 'db://assets/resources/scripts/view/CustomRecord';
import CustomTime from 'db://assets/resources/scripts/view/CustomTime';
import CustomTop from 'db://assets/resources/scripts/view/CustomTop';
import CustomWinTip from 'db://assets/resources/scripts/view/CustomWinTip';
import { IPanelSevenUpSevenDownMainView } from '../define/ipanel-sevenupsevendown-main-view';
import SevenUpSevenDownManager, { betInfo } from '../manager/sevenupsevendown-manager';
import WalletManager from '../manager/wallet-manager';
import AudioManager from '../core/manager/audio-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelSevenUpSevenDownMain')
export default class PanelSevenUpSevenDownMain extends ViewBase implements IPanelSevenUpSevenDownMainView {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        SevenUpSevenDownManager.View = this;
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
        SevenUpSevenDownManager.View = null;
    }


    //------------------------ 内部逻辑 ------------------------//

    stage = -1;
    _chipButtons: number[] = [];
    buildUi() {
        this.ske_change.node.active = false;
        this.ske_start.node.active = false;
        this.ske_person.node.active = true;
        this.touzi_node.active = false;
        this._chipButtons = WalletManager.getCurrencyBetSize();
    }

    protected start(): void {
        this.updateReconnect();
    }

    updateReconnect() {
        this.stage = SevenUpSevenDownManager.Stage;
        if (this.stage == -1) return;
        this.time_node.updateGameStage();
        this.handle_node.updateGameStage();
        this.desk_node.updateGameStage(true);
        this.fly_chip_node.updateGameStage(true);
        this.record_node.updateGameStage(true);
        this.bigwinner_node.init();
        switch (this.stage) {
            case baccarat.DeskStage.ReadyStage:
                this.ske_person.setAnimation(0, 'idle2', false);
                break;
            case baccarat.DeskStage.StartBetStage:
                this.ske_person.setAnimation(0, 'idle2', false);
                break;
            case baccarat.DeskStage.EndBetStage:
                this.ske_person.setAnimation(0, 'idle3', false);
                break;
            case baccarat.DeskStage.OpenStage:
                break;
            case baccarat.DeskStage.SettleStage:
                this.setTouZiData();
                this.ske_person.setAnimation(0, 'clap', false);
                break;
        }
        if (this.stage == baccarat.DeskStage.StartBetStage) {
            const info = SevenUpSevenDownManager.AllbetInfo;
            for (let i = 0; i < info.length; i++) {
                let data = info[i];
                let start = null
                let index = 0
                this._chipButtons.forEach((value, idx) => {
                    if (+data.bet_coin == value) index = idx;
                })
                if (data.player_id == SevenUpSevenDownManager.PlayerId) {
                    start = this.chip_node.getWorldPos();
                } else {
                    start = this.bigwinner_node.getWorldPosByUid(data.player_id)
                }
                let end = this.desk_node.getWorldPosByIdx(data.bet_id)
                this.fly_chip_node.setChipData(data, index, start, end);
            }
        }
    }

    updateGameStage() {
        this.stage = SevenUpSevenDownManager.Stage;
        if (this.stage == -1) return;
        this.time_node.updateGameStage();
        this.handle_node.updateGameStage();
        this.desk_node.updateGameStage();
        this.fly_chip_node.updateGameStage();
        this.record_node.updateGameStage();
        this.bigwinner_node.updatePlayer();
        switch (this.stage) {
            case baccarat.DeskStage.ReadyStage:
                // this.bigwinner_node.updatePlayer();
                this.ske_change.node.active = false;
                this.ske_start.node.active = true;
                this.ske_start.setAnimation(0, 'animation', false);
                this.ske_person.setAnimation(0, 'collect', false);
                this.touzi_node.active = true;
                this.scheduleOnce(() => {
                    AudioManager.playSound(this.bundleName, '摇骰子音效');
                    this.ske_person.setAnimation(0, 'shaking', false);
                    this.touzi_node.active = false;
                }, 1.8);
                break;
            case baccarat.DeskStage.StartBetStage:
                this.ske_start.node.active = false;
                this.ske_change.node.active = true;
                this.ske_change.setAnimation(0, 'xz', false);
                this.ske_person.setAnimation(0, 'idle2', false);
                break;
            case baccarat.DeskStage.EndBetStage:
                this.ske_person.setAnimation(0, 'idle2', false);
                this.ske_change.setAnimation(0, 'tzxz', false);
                break;
            case baccarat.DeskStage.OpenStage:
                this.ske_person.setAnimation(0, 'idle3', false);
                let _odds = SevenUpSevenDownManager.OddString;
                for (let i = 0; i < _odds.length; i++) {
                    if (_odds[i] && +_odds[i]) {
                        this.ske_change.setAnimation(0, 'ewbl', false);
                        break;
                    }
                }
                break;
            case baccarat.DeskStage.SettleStage:
                this.ske_person.setAnimation(0, 'open', false);
                this.setTouZiData();
                this.ske_person.setAnimation(0, 'clap', false);
                this.scheduleOnce(() => {

                }, 2.8)
                break;
        }
    }

    updateflyChip(data: betInfo) {
        let start = null
        let index = 0
        this._chipButtons.forEach((value, idx) => {
            if (+data.bet_coin == value) index = idx;
        })
        if (data.player_id == SevenUpSevenDownManager.PlayerId) {
            start = this.head_node.getWorldPos();
        } else {
            start = this.bigwinner_node.getWorldPosByUid(data.player_id)
        }
        let end = this.desk_node.getWorldPosByIdx(data.bet_id)
        this.fly_chip_node.addFlyChip(data, index, start, end);
        this.record_node.addList(data);
        this.desk_node
    }

    updateDeletChip(data: betInfo) {
        this.fly_chip_node.recycleChipByCondition(data);
        this.record_node.deleList(data);
    }

    setTouZiData() {
        let open = SevenUpSevenDownManager.OpenPos;
        this.touzi_node.children.forEach((child, idx) => {
            child.active = !!open[idx];
            if (open[idx]) {
                child.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/ui/" + open[idx] + "/spriteFrame");
            }
        });
        this.touzi_node.active = true;
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonHistory(event: cc.EventTouch) {
        cc.log('on click event cc_buttonHistory');
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_animation_node: [cc.Node],
            cc_bg: [cc.Node],
            cc_bigwinner_node: [CustomBigWinner],
            cc_chip_node: [CustomChip],
            cc_desk_node: [CustomDesk],
            cc_fly_chip_node: [CustomFlyChip],
            cc_handle_node: [CustomHandle],
            cc_head_node: [CustomHead],
            cc_history_node: [CustomMainHistory],
            cc_online: [CustomOnline],
            cc_record_node: [CustomRecord],
            cc_ske_change: [cc.sp.Skeleton],
            cc_ske_person: [cc.sp.Skeleton],
            cc_ske_start: [cc.sp.Skeleton],
            cc_time_node: [CustomTime],
            cc_top: [CustomTop],
            cc_touzi_node: [cc.Node],
            cc_wintip_node: [CustomWinTip],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected animation_node: cc.Node = null;
    protected bg: cc.Node = null;
    protected bigwinner_node: CustomBigWinner = null;
    protected chip_node: CustomChip = null;
    protected desk_node: CustomDesk = null;
    protected fly_chip_node: CustomFlyChip = null;
    protected handle_node: CustomHandle = null;
    protected head_node: CustomHead = null;
    protected history_node: CustomMainHistory = null;
    protected online: CustomOnline = null;
    protected record_node: CustomRecord = null;
    protected ske_change: cc.sp.Skeleton = null;
    protected ske_person: cc.sp.Skeleton = null;
    protected ske_start: cc.sp.Skeleton = null;
    protected time_node: CustomTime = null;
    protected top: CustomTop = null;
    protected touzi_node: cc.Node = null;
    protected wintip_node: CustomWinTip = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelSevenUpSevenDownMain';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelSevenUpSevenDownMain.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelSevenUpSevenDownMain.VIEW_NAME;
    }
    // @view export resource end
}
