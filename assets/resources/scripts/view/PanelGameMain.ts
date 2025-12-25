// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomAllUser from 'db://assets/resources/scripts/view/common/CustomAllUser';
import CustomChip from 'db://assets/resources/scripts/view/common/CustomChip';
import CustomChipAnimation from 'db://assets/resources/scripts/view/CustomChipAnimation';
import CustomDeskAnimation from 'db://assets/resources/scripts/view/CustomDeskAnimation';
import CustomDeskInfo from 'db://assets/resources/scripts/view/CustomDeskInfo';
import CustomDeskScore from 'db://assets/resources/scripts/view/CustomDeskScore';
import CustomDeskStar from 'db://assets/resources/scripts/view/CustomDeskStar';
import CustomHandle from 'db://assets/resources/scripts/view/common/CustomHandle';
import CustomMainHistory from 'db://assets/resources/scripts/view/CustomMainHistory';
import CustomOnline from 'db://assets/resources/scripts/view/common/CustomOnline';
import CustomRoomData from 'db://assets/resources/scripts/view/common/CustomRoomData';
import CustomTime from 'db://assets/resources/scripts/view/common/CustomTime';
import CustomUser from 'db://assets/resources/scripts/view/common/CustomUser';
import CustomWin from 'db://assets/resources/scripts/view/common/CustomWin';
import { Global } from '../global';
import { BaseMessage } from '../core/message/base-message';
import { IPanelGameMainView } from '../define/ipanel-game-main-view';
import GameManager from '../manager/game-manager';
import { Vec3 } from 'cc';
import { betInfo } from '../manager/common-manager';
import AudioManager from '../core/manager/audio-manager';
import { GameEvent } from '../define';
import ViewManager from '../core/manager/view-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelGameMain')
export default class PanelGameMain extends ViewBase implements IPanelGameMainView {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        GameManager.View = this;
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
        GameManager.View = null;
    }

    protected start(): void {
        this.updateReconnect();
    }
    //------------------------ 内部逻辑 ------------------------//

    _stage = -1;
    _isGameInBackground: boolean = false;

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

    updateReconnect() {
        this._stage = GameManager.Stage;
        if (this._stage == -1) return;
        this.win.updateList();
        this.history.updateHistoryData();
        this.room.updateRoomData();
        this.desk.initData(this._stage);
        this.score.initData(this._stage);
        this.animation.initData(this._stage);
        this.fly.initData(this._stage);
        this.star.updateGameStage(this._stage);
        this.user.updatePlayer();
        this.alluser.initPlayer();
        this.handle.initData(this._stage);
        this.time.updateGameStage(this._stage);
        this.ske_person.setAnimation(0, 'idle', true);
        if (this._stage == baccarat.DeskStage.SettleStage) {
            this.setTouZiData();
            this.desk.showResult();
        }
    }


    updateGameStage() {
        this._stage = GameManager.Stage;
        this.star.updateGameStage(this._stage);
        this.handle.updateGameStage(this._stage);
        this.time.updateGameStage(this._stage);
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this.reset();
                this.room.updatePeriod();
                this.history.updateHistory();
                this.desk.reset();
                this.score.reset();
                this.animation.reset();
                this.alluser.updatePlayer();
                this.fly.reset();
                this.ske_start.node.active = true;
                this.ske_start.setAnimation(0, 'animation', false);
                break;
            case baccarat.DeskStage.StartBetStage:
                this.ske_start.node.active = false;
                this.ske_change.node.active = true;
                this.ske_change.setAnimation(0, 'xz', false);
                if (this._isGameInBackground == false) {
                    AudioManager.playSound(this.bundleName, '开始下注');
                }
                break;
            case baccarat.DeskStage.EndBetStage:
                this.ske_change.node.active = true;
                this.ske_change.setAnimation(0, 'tzxz', false);
                if (this._isGameInBackground == false) {
                    AudioManager.playSound(this.bundleName, '停止下注');
                }
                this.alluser.clearOtherUser();
                break;
            case baccarat.DeskStage.OpenStage:
                this.ske_change.node.active = false;
                const multiple = GameManager.Multiple;
                for (let i = 0; i < multiple.length; i++) {
                    if (multiple[i] && +multiple[i]) {
                        this.ske_extra.node.active = true;
                        this.ske_extra.setAnimation(0, 'animation', false);
                        break;
                    }
                }
                this.animation.playDoubleEnterAnimaton();
                break;
            case baccarat.DeskStage.SettleStage:
                this.ske_extra.node.active = false;
                AudioManager.playSound(this.bundleName, '摇骰子音效');
                this.ske_person.setAnimation(0, 'shaking', false);
                this.ske_touzi.setAnimation(0, 'shaking_touzi', false);
                this.ske_touzi.node.active = true;
                this.tou3.node.active = true;
                this.tou4.node.active = true;
                this.scheduleOnce(() => {
                    this.setTouZiData();
                    this.tou1.node.active = false;
                    this.tou2.node.active = false;
                    this.tou3.node.active = false;
                    this.tou4.node.active = false;
                }, 0.74);
                this.scheduleOnce(() => {
                    this.tou1.node.active = true;
                    this.tou2.node.active = true;
                    this.tou3.node.active = true;
                    this.tou4.node.active = true;
                }, 4.2);
                this.scheduleOnce(() => {
                    this.ske_person.setAnimation(0, 'idle', true);
                    this.ske_touzi.node.active = false;
                }, 8.26)
                this.scheduleOnce(() => {
                    this.desk.showResult();
                    this.animation.playLiHuaAnimaton();
                    if (this._isGameInBackground == false && GameManager.getWinByPlayId() > 0) {
                        AudioManager.playSound(this.bundleName, '押中中奖音效');
                    }
                }, 6.33);
                this.scheduleOnce(() => {
                    this.tou3.node.active = false;
                    this.tou4.node.active = false;
                    this.animation.playDoubleExitAnimaton();
                    this.fly.recycleChip();
                }, 8);
                this.scheduleOnce(() => {
                    this.user.updateResult();
                    this.alluser.updateResult();
                    Global.sendMsg(GameEvent.ANIMATION_END_UPDATE);
                }, 9.5)
                break
        }
    }

    updateflyChip(data: betInfo, order: number) {
        this.fly.updateflyChip(data, order);
        if (order == -1) {
            this.alluser.updateShowOtherUserIcon(data);
        } else {
            this.desk.playBetAnimationByArea(data.bet_id);
            this.handle.updateButtonState();
        }
    }

    updateDeletChip(data: betInfo, isme: boolean) {
        this.fly.reverseDelet(data);
        if (isme) {
            this.handle.updateButtonState();
        }
    }

    getDeskWorldPosByAid(areaid: number): Vec3 {
        return this.desk.getDeskWorldPosByAid(areaid)
    }

    getWorldPosByUid(playid: string): Vec3 {
        return this.alluser.getWorldPosByUid(playid);
    }

    getLoseWorldPos() {
        let wordPos = this.endPos.parent.transform.convertToWorldSpaceAR(this.endPos.position);
        return wordPos;
    }

    getMyHeadWorldPos(): Vec3 {
        return this.user.getMyHeadWorldPos();
    }

    setTouZiData() {
        let open = GameManager.WinType;
        this.tou1.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/dice/dice_white_" + open[0] + "/spriteFrame");
        this.tou2.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/dice/dice_white_" + open[1] + "/spriteFrame");
        this.tou3.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/dice/dice_white_" + open[0] + "/spriteFrame");
        this.tou4.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/dice/dice_white_" + open[1] + "/spriteFrame");
        this.tou1.node.active = true;
        this.tou2.node.active = true;
        this.tou3.node.active = true;
        this.tou4.node.active = true;
    }

    reset() {
        this.ske_change.node.active = false;
        this.ske_start.node.active = false;
        this.ske_extra.node.active = false;
        this.ske_touzi.node.active = false;
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonMenu(event: cc.EventTouch) {
        ViewManager.OpenPanel(this.module, 'PanelGameMenu');
    }


    private onClickButtonList(event : cc.EventTouch){
        ViewManager.OpenPanel(this.module, 'PanelGameButtom');
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_alluser    : [CustomAllUser],
            cc_animation    : [CustomDeskAnimation],
            cc_buttom    : [cc.Node],
            cc_buttonList    : [GButton,this.onClickButtonList.bind(this)],
            cc_buttonMenu    : [GButton,this.onClickButtonMenu.bind(this)],
            cc_chip    : [CustomChip],
            cc_desk    : [CustomDeskInfo],
            cc_endPos    : [cc.Node],
            cc_fly    : [CustomChipAnimation],
            cc_handle    : [CustomHandle],
            cc_history    : [CustomMainHistory],
            cc_online    : [CustomOnline],
            cc_room    : [CustomRoomData],
            cc_score    : [CustomDeskScore],
            cc_ske_change    : [cc.sp.Skeleton],
            cc_ske_extra    : [cc.sp.Skeleton],
            cc_ske_person    : [cc.sp.Skeleton],
            cc_ske_start    : [cc.sp.Skeleton],
            cc_ske_touzi    : [cc.sp.Skeleton],
            cc_star    : [CustomDeskStar],
            cc_time    : [CustomTime],
            cc_top    : [cc.Node],
            cc_tou1    : [cc.Sprite],
            cc_tou2    : [cc.Sprite],
            cc_tou3    : [cc.Sprite],
            cc_tou4    : [cc.Sprite],
            cc_user    : [CustomUser],
            cc_win    : [CustomWin],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected alluser: CustomAllUser    = null;
   protected animation: CustomDeskAnimation    = null;
   protected buttom: cc.Node    = null;
   protected buttonList: GButton    = null;
   protected buttonMenu: GButton    = null;
   protected chip: CustomChip    = null;
   protected desk: CustomDeskInfo    = null;
   protected endPos: cc.Node    = null;
   protected fly: CustomChipAnimation    = null;
   protected handle: CustomHandle    = null;
   protected history: CustomMainHistory    = null;
   protected online: CustomOnline    = null;
   protected room: CustomRoomData    = null;
   protected score: CustomDeskScore    = null;
   protected ske_change: cc.sp.Skeleton    = null;
   protected ske_extra: cc.sp.Skeleton    = null;
   protected ske_person: cc.sp.Skeleton    = null;
   protected ske_start: cc.sp.Skeleton    = null;
   protected ske_touzi: cc.sp.Skeleton    = null;
   protected star: CustomDeskStar    = null;
   protected time: CustomTime    = null;
   protected top: cc.Node    = null;
   protected tou1: cc.Sprite    = null;
   protected tou2: cc.Sprite    = null;
   protected tou3: cc.Sprite    = null;
   protected tou4: cc.Sprite    = null;
   protected user: CustomUser    = null;
   protected win: CustomWin    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'PanelGameMain';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return PanelGameMain.BUNDLE_NAME;
    }
   public get viewName(){
        return PanelGameMain.VIEW_NAME;
    }
    // @view export resource end
}
