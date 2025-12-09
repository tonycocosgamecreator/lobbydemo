// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomBaccaratTop from 'db://assets/resources/scripts/view/system/CustomBaccaratTop';
import CustomChip from 'db://assets/resources/scripts/view/CustomChip';
import CustomDesk from 'db://assets/resources/scripts/view/CustomDesk';
import CustomDouble from 'db://assets/resources/scripts/view/CustomDouble';
import CustomFlyChip from 'db://assets/resources/scripts/view/CustomFlyChip';
import CustomHandle from 'db://assets/resources/scripts/view/CustomHandle';
import CustomMainHistory from 'db://assets/resources/scripts/view/CustomMainHistory';
import CustomOnline from 'db://assets/resources/scripts/view/CustomOnline';
import CustomRecord from 'db://assets/resources/scripts/view/CustomRecord';
import CustomRoomData from 'db://assets/resources/scripts/view/CustomRoomData';
import CustomScore from 'db://assets/resources/scripts/view/CustomScore';
import CustomStar from 'db://assets/resources/scripts/view/CustomStar';
import CustomTime from 'db://assets/resources/scripts/view/CustomTime';
import CustomUser from 'db://assets/resources/scripts/view/CustomUser';
import CustomWinTip from 'db://assets/resources/scripts/view/CustomWinTip';
import { IPanelSevenUpSevenDownMainView } from '../define/ipanel-sevenupsevendown-main-view';
import SevenUpSevenDownManager, { betInfo } from '../manager/sevenupsevendown-manager';
import AudioManager from '../core/manager/audio-manager';
import { Global } from '../global';
import { BaseMessage } from '../core/message/base-message';
import { GameEvent } from '../define';
import { Vec3 } from 'cc';
import { v3 } from 'cc';
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
    _isGameInBackground: boolean = false;
    _stage = -1;
    // _playId: string = '';
    _boneNode1 = null;
    _boneNode2 = null;
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
        this.ske_extra.node.active = false;
        this.touzi_node.node.active = false;
    }

    updateReconnect() {
        // this._playId = SevenUpSevenDownManager.PlayerId;
        this._stage = SevenUpSevenDownManager.Stage;
        if (this._stage == -1) return;
        this.reset();
        this.room.updateRoomData()
        this.time_node.updateGameStage();
        this.star_node.updateGameStage();
        this.handle_node.updateGameStage(true);
        this.desk_node.updateGameStage(true);
        this.record_node.updateGameStage(true);
        this.fly_chip_node.updateGameStage(true);
        this.double_node.updateGameStage(true);
        this.score_node.updateGameStage(true);
        this.ske_person.setCompleteListener(null);
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this.ske_person.setAnimation(0, 'collect', false);
                this.touzi_node.node.active = true;
                break;
            case baccarat.DeskStage.StartBetStage:
                this.ske_person.setAnimation(0, 'idle1', false);
                this.ske_person.setCompleteListener(() => {
                    this.ske_person.setCompleteListener(null);
                    this.ske_person.setAnimation(0, 'dle3', true);
                })
                break;
            case baccarat.DeskStage.EndBetStage:
                this.ske_person.setAnimation(0, 'dle3', true);
                break;
            case baccarat.DeskStage.OpenStage:
                this.ske_person.setAnimation(0, 'dle3', true);
                break;
            case baccarat.DeskStage.SettleStage:
                this.setTouZiData();
                this.desk_node.showResult(true);
                this.ske_person.setAnimation(0, 'clap', false);
                break;
        }
    }

    updateGameStage() {
        this._stage = SevenUpSevenDownManager.Stage;
        if (this._stage == -1) return;
        this.star_node.updateGameStage();
        this.time_node.updateGameStage();
        this.handle_node.updateGameStage();
        this.desk_node.updateGameStage();
        this.record_node.updateGameStage();
        this.user_node.updateGameStage();
        this.fly_chip_node.updateGameStage();
        // this.result_node.updateGameStage();
        this.double_node.updateGameStage();
        this.score_node.updateGameStage();
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this.reset();
                this.ske_start.node.active = true;
                this.ske_start.setAnimation(0, 'animation', false);
                this.ske_person.setAnimation(0, 'collect', false);
                this.touzi_node.node.active = true;
                this.room.updatePeriod();
                break;
            case baccarat.DeskStage.StartBetStage:
                this.touzi_node.node.active = false;
                this.ske_start.node.active = false;
                this.ske_change.node.active = true;
                this.ske_change.setAnimation(0, 'xz', false);
                this.ske_person.setAnimation(0, 'idle1', false);
                this.ske_person.setCompleteListener(() => {
                    this.ske_person.setCompleteListener(null);
                    this.ske_person.setAnimation(0, 'dle3', true);
                })
                if (this._isGameInBackground == false) {
                    AudioManager.playSound(this.bundleName, '开始下注');
                }
                break;
            case baccarat.DeskStage.EndBetStage:
                this.ske_person.setCompleteListener(null);
                this.ske_person.setAnimation(0, 'dle3', true);
                this.ske_change.setAnimation(0, 'tzxz', false);
                if (this._isGameInBackground == false) {
                    AudioManager.playSound(this.bundleName, '停止下注');
                }
                break;
            case baccarat.DeskStage.OpenStage:
                // this.ske_person.setAnimation(0, 'dle3', true);
                this.ske_change.node.active = false;
                let _odds = SevenUpSevenDownManager.OddString;
                for (let i = 0; i < _odds.length; i++) {
                    if (_odds[i] && +_odds[i]) {
                        this.ske_extra.node.active = true;
                        this.ske_extra.setAnimation(0, 'animation', false);
                        break;
                    }
                }
                break;
            case baccarat.DeskStage.SettleStage:
                this.ske_extra.node.active = false;
                AudioManager.playSound(this.bundleName, '摇骰子音效');
                this.ske_person.setAnimation(0, 'shaking', false);
                this.scheduleOnce(() => {
                    this.ske_person.setAnimation(0, 'open', false);
                    this.setTouZiData();
                }, 3.9)
                this.scheduleOnce(() => {
                    this.ske_person.setAnimation(0, 'clap', true);
                    // this.result_node.showResult(true);
                    this.desk_node.showResult();
                    this.double_node.showResult()
                    if (this._isGameInBackground == false && SevenUpSevenDownManager.WinCoin > 0) {
                        AudioManager.playSound(this.bundleName, '押中中奖音效');
                    }
                }, 6.5);
                this.scheduleOnce(() => {
                    //飞筹码
                    // this.result_node.reset();
                    this.fly_chip_node.recycleChip();
                    // this.desk_node.reset();

                }, 7)
                this.scheduleOnce(() => {
                    this.user_node.playWinAnimation();
                    Global.sendMsg(GameEvent.PLYER_TOTAL_BET_UPDATE);
                }, 9)
                break;
        }
    }

    getDeskWorldPosByIdx(id: number, isme: boolean, order: number) {
        return this.desk_node.getWorldPosByIdx(id, isme, order);
    }

    getUserWorldPosByUid(id: string, icon: number) {
        return this.user_node.getWorldPosByUid(id, icon);
    }

    getUserLoseWorldPos() {
        return this.endPos.parent.transform.convertToWorldSpaceAR(
            this.endPos.position
        );
    }

    updateflyChip(data: betInfo, isme: boolean, order: number) {
        this.fly_chip_node.init(data, true, isme, order);
        if (isme) {
            this.desk_node.updateBetAnimation(data.bet_id);
            this.handle_node.updateClear();
        }
        this.record_node.updateList();
    }

    updateDeletChip(data: betInfo, isme: boolean) {
        this.fly_chip_node.recycleChipByCondition(data);
        this.record_node.updateList();
        if (isme) {
            this.handle_node.updateClear(true);
        }
    }

    _defaultPos = [v3(-15, 10, 0), v3(19, 10, 0)]
    setTouZiData() {
        let open = SevenUpSevenDownManager.OpenPos;
        this.touzi_node.node.children.forEach((child, idx) => {
            child.active = !!open[idx];
            if (open[idx]) {
                let pos = this.getRandomPointAround(this._defaultPos[idx])
                child.setPosition(pos)
                child.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/dice/dice_white_" + open[idx] + "/spriteFrame");

            }
        });
        this.touzi_node.node.active = true;
    }

    getRandomPointAround(centerPoint: Vec3, horizontalRange: number = 4, verticalRange: number = 8): Vec3 {
        const randomX = Math.floor(Math.random() * 9) - horizontalRange;
        const randomY = Math.floor(Math.random() * 9) - verticalRange;
        return new Vec3(
            centerPoint.x + randomX,
            centerPoint.y + randomY,
            centerPoint.z,
        );
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_animation_node: [cc.Node],
            cc_bg: [cc.Node],
            cc_chip_node: [CustomChip],
            cc_desk_node: [CustomDesk],
            cc_double_node: [CustomDouble],
            cc_endPos: [cc.Node],
            cc_fly_chip_node: [CustomFlyChip],
            cc_handle_node: [CustomHandle],
            cc_history_node: [CustomMainHistory],
            cc_online: [CustomOnline],
            cc_record_node: [CustomRecord],
            cc_room: [CustomRoomData],
            cc_scollview: [cc.ScrollView],
            cc_score_node: [CustomScore],
            cc_ske_change: [cc.sp.Skeleton],
            cc_ske_extra: [cc.sp.Skeleton],
            cc_ske_person: [cc.sp.Skeleton],
            cc_ske_start: [cc.sp.Skeleton],
            cc_star_node: [CustomStar],
            cc_time_node: [CustomTime],
            cc_top: [CustomBaccaratTop],
            cc_touzi_node: [cc.Sprite],
            cc_user_node: [CustomUser],
            cc_wintip_node: [CustomWinTip],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected animation_node: cc.Node = null;
    protected bg: cc.Node = null;
    protected chip_node: CustomChip = null;
    protected desk_node: CustomDesk = null;
    protected double_node: CustomDouble = null;
    protected endPos: cc.Node = null;
    protected fly_chip_node: CustomFlyChip = null;
    protected handle_node: CustomHandle = null;
    protected history_node: CustomMainHistory = null;
    protected online: CustomOnline = null;
    protected record_node: CustomRecord = null;
    protected room: CustomRoomData = null;
    protected scollview: cc.ScrollView = null;
    protected score_node: CustomScore = null;
    protected ske_change: cc.sp.Skeleton = null;
    protected ske_extra: cc.sp.Skeleton = null;
    protected ske_person: cc.sp.Skeleton = null;
    protected ske_start: cc.sp.Skeleton = null;
    protected star_node: CustomStar = null;
    protected time_node: CustomTime = null;
    protected top: CustomBaccaratTop = null;
    protected touzi_node: cc.Sprite = null;
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
