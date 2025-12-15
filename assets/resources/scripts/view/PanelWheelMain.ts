// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomAllUser from 'db://assets/resources/scripts/view/common/CustomAllUser';
import CustomButtom from 'db://assets/resources/scripts/view/CustomButtom';
import CustomChip from 'db://assets/resources/scripts/view/CustomChip';
import CustomDesk from 'db://assets/resources/scripts/view/CustomDesk';
import CustomFlyChip from 'db://assets/resources/scripts/view/CustomFlyChip';
import CustomHandle from 'db://assets/resources/scripts/view/CustomHandle';
import CustomMainHistory from 'db://assets/resources/scripts/view/CustomMainHistory';
import CustomOnline from 'db://assets/resources/scripts/view/common/CustomOnline';
import CustomRoomData from 'db://assets/resources/scripts/view/CustomRoomData';
import CustomRoulette from 'db://assets/resources/scripts/view/CustomRoulette';
import CustomScore from 'db://assets/resources/scripts/view/CustomScore';
import CustomTop from 'db://assets/resources/scripts/view/CustomTop';
import CustomUser from 'db://assets/resources/scripts/view/common/CustomUser';
import CustomWin from 'db://assets/resources/scripts/view/common/CustomWin';
import WheelManager from '../manager/wheel-manager';
import { Global } from '../global';
import { BaseMessage } from '../core/message/base-message';
import AudioManager from '../core/manager/audio-manager';
import { betInfo } from '../manager/common-manager';
import { Vec3 } from 'cc';
import { IPanelWheelMainView } from '../define/ipanel-wheel-main-view';
import { GameEvent } from '../define';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelWheelMain')
export default class PanelWheelMain extends ViewBase implements IPanelWheelMainView {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        WheelManager.View = this;
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
        WheelManager.View = null;
    }

    protected start(): void {
        this.updateReconnect();
    }
    //------------------------ 内部逻辑 ------------------------//

    _stage = -1;
    _isGameInBackground: boolean = false;

    buildUi() {
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

    updateReconnect() {
        this._stage = WheelManager.Stage;
        if (this._stage == -1) return;
        this.reset();
        this.desk.initData();
        this.room.updateRoomData();
        this.history.updateHistory();
        this.win.updateList();
        this.user.updatePlayer();
        this.alluser.initPlayer();
        this.score.updateGameStage(this._stage);
        this.handle.updateGameStage(this._stage, true);
        this.buttom.updateGameStage(this._stage, true);
        this.flychip.updateGameStage(this._stage, true)
    }

    async updateGameStage() {
        this._stage = WheelManager.Stage;
        this.handle.updateGameStage(this._stage);
        this.buttom.updateGameStage(this._stage);
        this.score.updateGameStage(this._stage);
        this.flychip.updateGameStage(this._stage);
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this.skeXiazhu.node.active = false;
                this.skeStart.node.active = true;
                this.skeStart.setAnimation(0, 'animation', false);
                this.room.updatePeriod();
                this.history.updateHistory();
                this.alluser.updatePlayer();
                this.desk.reset();
                break;
            case baccarat.DeskStage.StartBetStage:
                this.skeStart.node.active = false;
                this.skeXiazhu.node.active = true;
                this.skeXiazhu.setAnimation(0, 'xz', false);
                if (this._isGameInBackground == false) {
                    AudioManager.playSound(this.bundleName, '开始下注');
                }
                break;
            case baccarat.DeskStage.EndBetStage:
                this.skeXiazhu.node.active = true;
                this.skeXiazhu.setAnimation(0, 'tzxz', false);
                if (this._isGameInBackground == false) {
                    AudioManager.playSound(this.bundleName, '停止下注');
                }
                this.alluser.clearOtherUser();
                break;
            case baccarat.DeskStage.SettleStage:
                this.skeXiazhu.node.active = false;
                this.roulette.node.active = true;
                const win = WheelManager.WinType;
                await this.roulette.startGame(win);
                this.scheduleOnce(() => {
                    this.roulette.node.active = false;
                    this.desk.showResult();
                    const data = WheelManager.getBetInfoByPlayId();
                    if (!data || data.length == 0) return;
                    let count = 0;
                    data.forEach(v => {
                        if (v.win > 0) {
                            count = count.add(v.win);
                        }
                    })
                    if (count > 0) {
                        if (this._isGameInBackground == false) {
                            AudioManager.playSound(this.bundleName, '当前玩家赢分播放音效');
                        }
                    }
                }, 1)
                this.scheduleOnce(() => {
                    this.flychip.recycleChip()
                }, 2);
                this.scheduleOnce(() => {
                    this.user.updateResult();
                    this.alluser.updateResult();
                    Global.sendMsg(GameEvent.PLYER_TOTAL_BET_UPDATE);
                }, 3.5)
                break;
        }
    }

    updateflyChip(data: betInfo, order: number) {
        this.flychip.updateflyChip(data, order);
        if (order == -1) {
            this.alluser.updateShowOtherUserIcon(data);
        } else {
            this.handle.updateButtonState();
        }
        this.buttom.updateBetList();
    }

    updateDeletChip(data: betInfo, isme: boolean) {
        this.flychip.reverseDelet(data);
        this.buttom.updateBetList();
        if (isme) {
            this.handle.updateButtonState();
        }
    }

    getWorldPosByUid(playid: string): Vec3 {
        return this.alluser.getWorldPosByUid(playid);
    }

    getMyHeadWorldPos(): Vec3 {
        return this.user.getMyHeadWorldPos();
    }

    getChipWorldPos(): Vec3 {
        return this.chip.getChipWorldPos();
    }

    getDeskWorldPosByAid(areaid: number): Vec3 {
        return this.desk.getDeskWorldPosByAid(areaid)
    }

    getLoseWorldPos() {
        let wordPos = this.room.node.parent.transform.convertToWorldSpaceAR(this.room.node.position);
        return wordPos;
    }

    reset() {
        this.skeStart.node.active = false;
        this.skeXiazhu.node.active = false;
        this.roulette.node.active = false;
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
            cc_alluser: [CustomAllUser],
            cc_bg: [cc.Node],
            cc_buttom: [CustomButtom],
            cc_chip: [CustomChip],
            cc_desk: [CustomDesk],
            cc_flychip: [CustomFlyChip],
            cc_handle: [CustomHandle],
            cc_history: [CustomMainHistory],
            cc_online: [CustomOnline],
            cc_room: [CustomRoomData],
            cc_roulette: [CustomRoulette],
            cc_score: [CustomScore],
            cc_scroll: [cc.Sprite],
            cc_skeStart: [cc.sp.Skeleton],
            cc_skeXiazhu: [cc.sp.Skeleton],
            cc_top: [CustomTop],
            cc_user: [CustomUser],
            cc_win: [CustomWin],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected alluser: CustomAllUser = null;
    protected bg: cc.Node = null;
    protected buttom: CustomButtom = null;
    protected chip: CustomChip = null;
    protected desk: CustomDesk = null;
    protected flychip: CustomFlyChip = null;
    protected handle: CustomHandle = null;
    protected history: CustomMainHistory = null;
    protected online: CustomOnline = null;
    protected room: CustomRoomData = null;
    protected roulette: CustomRoulette = null;
    protected score: CustomScore = null;
    protected scroll: cc.Sprite = null;
    protected skeStart: cc.sp.Skeleton = null;
    protected skeXiazhu: cc.sp.Skeleton = null;
    protected top: CustomTop = null;
    protected user: CustomUser = null;
    protected win: CustomWin = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelWheelMain';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelWheelMain.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelWheelMain.VIEW_NAME;
    }
    // @view export resource end
}
