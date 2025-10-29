// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomBaccaratTop from 'db://assets/resources/scripts/view/system/CustomBaccaratTop';
import CustomChip from 'db://assets/resources/scripts/view/CustomChip';
import CustomDesk from 'db://assets/resources/scripts/view/CustomDesk';
import CustomFlyChip from 'db://assets/resources/scripts/view/CustomFlyChip';
import CustomHandle from 'db://assets/resources/scripts/view/CustomHandle';
import CustomMainHistory from 'db://assets/resources/scripts/view/CustomMainHistory';
import CustomOnline from 'db://assets/resources/scripts/view/CustomOnline';
import CustomRecord from 'db://assets/resources/scripts/view/CustomRecord';
import CustomResult from 'db://assets/resources/scripts/view/CustomResult';
import CustomTime from 'db://assets/resources/scripts/view/CustomTime';
import CustomUser from 'db://assets/resources/scripts/view/CustomUser';
import CustomWinTip from 'db://assets/resources/scripts/view/CustomWinTip';
import { IPanelSevenUpSevenDownMainView } from '../define/ipanel-sevenupsevendown-main-view';
import SevenUpSevenDownManager, { betInfo } from '../manager/sevenupsevendown-manager';
import AudioManager from '../core/manager/audio-manager';
import { Global } from '../global';
import { BaseMessage } from '../core/message/base-message';
import Formater from '../core/utils/formater';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelSevenUpSevenDownMain')
export default class PanelSevenUpSevenDownMain extends ViewBase implements IPanelSevenUpSevenDownMainView {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
        SevenUpSevenDownManager.View = this;
    }

    protected onDestroy(): void {
        super.onDestroy();
        SevenUpSevenDownManager.View = null;
    }


    //------------------------ 内部逻辑 ------------------------//
    _isGameInBackground: boolean = false;
    stage = -1;

    buildUi() {
        this.reset();
        this.ske_person.node.active = true;
        Global.registerListeners(
            this,
            {
                [BaseMessage.ON_ENTER_FORGOUND]: () => {
                    this._isGameInBackground = false;
                },
                [BaseMessage.ON_ENTER_BACK_GROUND]: () => {
                    this._isGameInBackground = true;
                }
            }
        );
    }

    protected start(): void {
        this.updateReconnect();
    }

    reset() {
        this.ske_change.node.active = false;
        this.ske_start.node.active = false;
        this.touzi_node.active = false;
        this.spwin.node.active = false;
    }

    updateReconnect() {
        this.stage = SevenUpSevenDownManager.Stage;
        if (this.stage == -1) return;
        this.reset();
        this.time_node.updateGameStage();
        this.handle_node.updateGameStage();
        this.desk_node.updateGameStage(true);
        this.record_node.updateGameStage(true);
        this.fly_chip_node.updateGameStage(true);
        this.result_node.updateGameStage(true);
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
    }

    updateGameStage() {
        this.stage = SevenUpSevenDownManager.Stage;
        if (this.stage == -1) return;
        this.time_node.updateGameStage();
        this.handle_node.updateGameStage();
        this.desk_node.updateGameStage();
        this.record_node.updateGameStage();
        this.user_node.updateGameStage();
        this.fly_chip_node.updateGameStage();
        this.result_node.updateGameStage();
        switch (this.stage) {
            case baccarat.DeskStage.ReadyStage:
                this.reset();
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
                this.scheduleOnce(() => {
                    this.ske_person.setAnimation(0, 'clap', false);
                    this.result_node.showResult(true);
                    this.desk_node.showResult();
                    if (SevenUpSevenDownManager.WinCoin > 0) {
                        AudioManager.playSound(this.bundleName, '押中中奖音效');
                    }
                    this.scheduleOnce(() => {
                        if (SevenUpSevenDownManager.WinCoin > 0) {
                            let strText = Formater.splitNumber(SevenUpSevenDownManager.WinCoin.toFixed(2), ',', 3);
                            if (strText.endsWith('.00')) {
                                strText = strText.slice(0, -3)
                            } else if (strText.includes('.') && strText.endsWith('0')) {
                                strText = strText.slice(0, -1);
                            }
                            this.labelwinCoin.string = strText;
                            this.spwin.node.active = true;
                            this.spwin.setAnimation(0, 'animation', false);
                        }
                        //飞筹码
                        this.result_node.reset();
                        this.fly_chip_node.reset();
                        this.desk_node.reset();
                    }, 1)
                }, 2.8)
                break;
        }
    }

    getDeskWorldPosByIdx(id: number) {
        return this.desk_node.getWorldPosByIdx(id);
    }

    getUserWorldPosByUid(id: number) {
        return this.user_node.getWorldPosByUid(id);
    }

    updateflyChip(data: betInfo) {
        this.fly_chip_node.init(data, true);
        this.record_node.addList(data);
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
            cc_chip_node: [CustomChip],
            cc_desk_node: [CustomDesk],
            cc_fly_chip_node: [CustomFlyChip],
            cc_handle_node: [CustomHandle],
            cc_history_node: [CustomMainHistory],
            cc_labelwinCoin: [cc.Label],
            cc_online: [CustomOnline],
            cc_record_node: [CustomRecord],
            cc_result_node: [CustomResult],
            cc_ske_change: [cc.sp.Skeleton],
            cc_ske_person: [cc.sp.Skeleton],
            cc_ske_start: [cc.sp.Skeleton],
            cc_spwin: [cc.sp.Skeleton],
            cc_time_node: [CustomTime],
            cc_top: [CustomBaccaratTop],
            cc_touzi_node: [cc.Node],
            cc_user_node: [CustomUser],
            cc_wintip_node: [CustomWinTip],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected animation_node: cc.Node = null;
    protected bg: cc.Node = null;
    protected chip_node: CustomChip = null;
    protected desk_node: CustomDesk = null;
    protected fly_chip_node: CustomFlyChip = null;
    protected handle_node: CustomHandle = null;
    protected history_node: CustomMainHistory = null;
    protected labelwinCoin: cc.Label = null;
    protected online: CustomOnline = null;
    protected record_node: CustomRecord = null;
    protected result_node: CustomResult = null;
    protected ske_change: cc.sp.Skeleton = null;
    protected ske_person: cc.sp.Skeleton = null;
    protected ske_start: cc.sp.Skeleton = null;
    protected spwin: cc.sp.Skeleton = null;
    protected time_node: CustomTime = null;
    protected top: CustomBaccaratTop = null;
    protected touzi_node: cc.Node = null;
    protected user_node: CustomUser = null;
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
