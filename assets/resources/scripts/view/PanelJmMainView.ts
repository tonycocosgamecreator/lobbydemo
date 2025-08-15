// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomBetArea from 'db://assets/resources/scripts/view/CustomBetArea';
import CustomChooseChip from 'db://assets/resources/scripts/view/CustomChooseChip';
import CustomFlyChip from 'db://assets/resources/scripts/view/CustomFlyChip';
import CustomHistory from 'db://assets/resources/scripts/view/CustomHistory';
import CustomSystemTopFoot from 'db://assets/resources/scripts/view/CustomSystemTopFoot';
import { IPanelJmMainView } from '../define/ipanel-jm-main-view';
import JmManager from '../manager/jm-manager';
import { EventTouch } from 'cc';
import { Node } from 'cc';
import { Vec2 } from 'cc';
import { PolygonCollider2D } from 'cc';
import { UITransform } from 'cc';
import { Intersection2D } from 'cc';
import { Vec3 } from 'cc';
import WalletManager from '../manager/wallet-manager';
import { MessageSender } from '../network/net/message-sender';
import { BetPoint, GameEvent, THEME_ID } from '../define';
import { LocalStorageManager } from '../manager/localstorage-manager';
import { Global } from '../global';
import { BaseMessage } from '../core/message/base-message';
import JmMenuHelper from '../menu/jm-menu-helper';
import AudioManager from '../core/manager/audio-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;
export enum SpineAnimation {
    collect = "collect",
    shaking = 'shaking',
    idle1 = "idle1",
    idle3 = "idle3",
    open = "open",
    clap = "clap",
}

export enum SpineXiaZhuAnimation {
    xz = "xz",
    tzxz = 'tzxz',
    ewbl = 'ewbl',
}
@ccclass('PanelJmMainView')
export default class PanelJmMainView extends ViewBase implements IPanelJmMainView {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        JmManager.view = this;
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
        JmManager.view = null;
    }

    //------------------------ 内部逻辑 ------------------------//
    protected _isGameInBackground: boolean = false;
    buildUi() {
        Global.registerListeners(
            this,
            {
                [BaseMessage.ON_ENTER_FORGOUND]: () => {
                    this._isGameInBackground = false;
                },
                [BaseMessage.ON_ENTER_BACK_GROUND]: () => {
                    this._isGameInBackground = true;
                },
                [GameEvent.REQUST_OPEN_MENU]: () => {
                    //要求打开菜单
                    JmMenuHelper.OpenMenu();
                }
            }
        );
        this.bet_area_node.node.on(cc.Node.EventType.TOUCH_END, this.onBetClick, this);
        this.stageChanged();
    }
    /**--------------------------------下注----------------------------------------------- */
    _tagetWorldPos: Vec3 = null;
    _sourceWorldPos: Vec3 = null;
    onBetClick(event: EventTouch) {
        if (JmManager.stage != jmbaccarat.DeskStage.StartBetStage) return;
        let index = this.sp_bet_choose_node.ChipSelectIndex;
        if (index == -1) return;
        const touchPos = event.getUILocation();
        for (let i = 0; i < this.bet_area_node.node.children.length; i++) {
            const item = this.bet_area_node.node.children[i];
            if (this.checkNodeCollider(touchPos, item)) {
                this.sendBetMessage(i + 1);
                this._sourceWorldPos = this.sp_bet_choose_node.getCurrentChipWorldPos();
                this._tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
            }
        }
    }

    flyChip() {
        let point = LocalStorageManager.load(BetPoint, []);
        point.push({ index: this.sp_bet_choose_node.ChipSelectIndex, pos: this._tagetWorldPos });
        LocalStorageManager.save(BetPoint, point);
        this.fly_chip_node.addFlyChip(this.sp_bet_choose_node.ChipSelectIndex, this._sourceWorldPos, this._tagetWorldPos);
    }

    checkNodeCollider(p: Vec2, target: Node): boolean {
        const collider = target.getComponent(PolygonCollider2D);
        if (!collider) return false;
        const uiTransform = target.getComponent(UITransform);
        if (!uiTransform) return false;
        const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(p.x, p.y, 0));
        return Intersection2D.pointInPolygon(new Vec2(localPos.x, localPos.y), collider.points);
    }
    /**
     * 发送下注消息
     * @param betId 
     */
    protected sendBetMessage(betId: number) {
        const stage = JmManager.stage;
        if (stage != jmbaccarat.DeskStage.StartBetStage) {
            return;
        }
        const betSize = WalletManager.getCurrencyBetSize();
        const betCount = betSize[this.sp_bet_choose_node.ChipSelectIndex];
        let betDatas: jmbaccarat.BetData[] = [];
        let betData: jmbaccarat.BetData = {
            bet_id: betId,
            bet_coin: betCount.toString(),
            autoCashOut: false,
            out_rate: '0',
            is_settle: false,
            settle_out_rate: '0',
            is_rebet: false,
        }
        betDatas.push(betData);
        //如果有之前的下注，添加到这里
        let data: jmbaccarat.MsgBetBaccaratReq = {
            theme_id: THEME_ID,
            desk_id: JmManager.deskId,
            bets: betDatas
        };
        MessageSender.SendMessage(jmbaccarat.Message.MsgBetBaccaratReq, data);
    }

    stageChanged(reconnect: boolean = false) {
        const stage = JmManager.stage;
        this.timeCounterBar.node.active = false;
        this.result_node.node.active = false;
        if (stage == -1) return;
        switch (stage) {
            case jmbaccarat.DeskStage.ReadyStage:
                this.fly_chip_node.reset();
                this.bet_area_node.reset();
                this.sp_bet_choose_node.reset();
                break;
            case jmbaccarat.DeskStage.StartBetStage:
                this.timeCounterBar.node.active = true;
                break;
            case jmbaccarat.DeskStage.EndBetStage:
                break;
            case jmbaccarat.DeskStage.OpenStage:
                break;
            case jmbaccarat.DeskStage.SettleStage:
                this.timeCounterBar.node.active = true;
                break;
        }
    }

    /**
      * 当前正在显示的倒计时秒数
      */
    private _currentHaveSec: number = 0;
    protected lateUpdate(dt: number): void {
        if (JmManager.stage != jmbaccarat.DeskStage.StartBetStage && JmManager.stage != jmbaccarat.DeskStage.SettleStage) return;
        const left = JmManager.minusHaveSec(dt);
        const maxSec = JmManager.getDur();
        const secNow = Math.ceil(left);
        if (secNow !== this._currentHaveSec) {
            this._currentHaveSec = secNow;
            this.timeCount.string = secNow.toString();
            if (JmManager.stage == jmbaccarat.DeskStage.StartBetStage) {
                if (secNow == 5) {
                    AudioManager.playSound(this.bundleName, '倒计时剩余五秒时候播放');
                } else if (secNow < 5 && secNow > 0) {
                    AudioManager.playSound(this.bundleName, '剩余4秒，倒计时提示音，每秒播放一次');
                }
            }
        }
        this.timeCounterBar.progress = left / maxSec;
    }

    doubleArea() {
        this.scheduleOnce(() => {
            this.spXiaZhu.node.active = true;
            this.spXiaZhu.setAnimation(0, SpineXiaZhuAnimation.ewbl, false);
        }, 1)
    }


    playAnimationByStage(stage: number): void {
        this.resetAnimation();
        switch (stage) {
            case jmbaccarat.DeskStage.ReadyStage:
                this.spStart.node.active = true;
                this.spStart.setAnimation(0, 'animation', false);
                this.spAnim.node.active = true;
                this.spAnim.timeScale = 0.9;
                this.spAnim.setAnimation(0, SpineAnimation.collect, false);
                this.scheduleOnce(() => {
                    AudioManager.playSound(this.bundleName, '摇骰子音效');
                    this.spAnim.setAnimation(0, SpineAnimation.shaking, false);
                }, 1.8); break
            case jmbaccarat.DeskStage.StartBetStage:
                this.spAnim.node.active = true;
                this.spAnim.timeScale = 0.9;
                this.spAnim.setAnimation(0, SpineAnimation.idle1, false);
                this.spXiaZhu.node.active = true;
                this.spXiaZhu.setAnimation(0, SpineXiaZhuAnimation.xz, false);
                AudioManager.playSound(this.bundleName, '开始下注');
                break;
            case jmbaccarat.DeskStage.EndBetStage:
                this.spAnim.node.active = true;
                this.spAnim.timeScale = 1
                this.spAnim.setAnimation(0, SpineAnimation.idle3, true);
                this.spXiaZhu.node.active = true;
                this.spXiaZhu.setAnimation(0, SpineXiaZhuAnimation.tzxz, false);
                AudioManager.playSound(this.bundleName, '停止下注');
                break;
            case jmbaccarat.DeskStage.OpenStage:
                break;
            case jmbaccarat.DeskStage.SettleStage:
                cc.Tween.stopAllByTarget(this.result_node.node);
                let open = JmManager.openPos;
                this.result_node.node.children.forEach((t, idx) => {
                    t.active = !!open[idx];
                    this.touzi_node.children[idx].active = !!open[idx];
                    if (open[idx]) {
                        t.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/JM_Img_" + (11 + (open[idx] * 3)) + "/spriteFrame");
                        this.touzi_node.children[idx].getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/" + open[idx] + "/spriteFrame");
                    }
                });
                this.spAnim.node.active = true;
                this.spAnim.timeScale = 1;
                this.spAnim.setAnimation(0, SpineAnimation.open, false);
                this.touzi_node.active = true;
                this.scheduleOnce(() => {
                    this.result_node.node.active = true;
                    this.result_node.node.scale = new Vec3(0.1, 0.1, 0.1);
                    cc.tween(this.result_node.node)
                        .to(0.2, { scale: new Vec3(1, 1, 1) })
                        .start();
                    this.bet_area_node.updateBetArea(JmManager.winType);
                    this.spAnim.setAnimation(0, SpineAnimation.clap, true);
                    let sourceNode = this.people_node.node;
                    let sourceUITransform = sourceNode.parent.getComponent(UITransform);
                    let sourceWorldPos = sourceUITransform.convertToWorldSpaceAR(sourceNode.position);
                    this.fly_chip_node.getComponent(CustomFlyChip).recycleChip(sourceWorldPos)
                }, 2.5);
                break;
        }
    }

    resetAnimation() {
        this.spStart.node.active = false;
        this.spXiaZhu.node.active = false;
        this.result_node.node.active = false;
        this.touzi_node.active = false;
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        if (msgType == jmbaccarat.Message.MsgBaccaratOnlineNtf) {
            //在线玩家数量刷新
            this.labelPeopleNum.string = (data.online_sum || 0).toString();
            return true;
        }
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonFairness(event: cc.EventTouch) {
        cc.log('on click event cc_buttonFairness');

    }
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_animation_node: [cc.Node],
            cc_bet_area_node: [CustomBetArea],
            cc_buttonFairness: [GButton, this.onClickButtonFairness.bind(this)],
            cc_fly_chip_node: [CustomFlyChip],
            cc_history_node: [CustomHistory],
            cc_labelPeopleNum: [cc.Label],
            cc_people_node: [cc.Sprite],
            cc_result_node: [cc.Sprite],
            cc_spAnim: [cc.sp.Skeleton],
            cc_spStart: [cc.sp.Skeleton],
            cc_spXiaZhu: [cc.sp.Skeleton],
            cc_sp_bet_choose_node: [CustomChooseChip],
            cc_timeCount: [cc.Label],
            cc_timeCounterBar: [cc.ProgressBar],
            cc_top_node: [CustomSystemTopFoot],
            cc_touzi_node: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected animation_node: cc.Node = null;
    protected bet_area_node: CustomBetArea = null;
    protected buttonFairness: GButton = null;
    protected fly_chip_node: CustomFlyChip = null;
    protected history_node: CustomHistory = null;
    protected labelPeopleNum: cc.Label = null;
    protected people_node: cc.Sprite = null;
    protected result_node: cc.Sprite = null;
    protected spAnim: cc.sp.Skeleton = null;
    protected spStart: cc.sp.Skeleton = null;
    protected spXiaZhu: cc.sp.Skeleton = null;
    protected sp_bet_choose_node: CustomChooseChip = null;
    protected timeCount: cc.Label = null;
    protected timeCounterBar: cc.ProgressBar = null;
    protected top_node: CustomSystemTopFoot = null;
    protected touzi_node: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelJmMainView';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelJmMainView.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelJmMainView.VIEW_NAME;
    }
    // @view export resource end
}
