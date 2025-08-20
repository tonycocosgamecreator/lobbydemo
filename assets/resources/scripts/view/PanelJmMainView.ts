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
import CustomResult from 'db://assets/resources/scripts/view/CustomResult';
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
import { GameEvent, THEME_ID } from '../define';
import { Global } from '../global';
import { BaseMessage } from '../core/message/base-message';
import JmMenuHelper from '../menu/jm-menu-helper';
import AudioManager from '../core/manager/audio-manager';
import { randomRange } from 'cc';
import { utils } from 'cc';
import TextUtils from '../core/utils/text-utils';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;
export enum SpineAnimation {
    collect = "collect",
    shaking = 'shaking',
    idle2 = "idle2",
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
        JmManager.View = this;
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
        JmManager.View = null;
    }

    //------------------------ 内部逻辑 ------------------------//

    _tagetWorldPos: Vec3 = null;
    _sourceWorldPos: Vec3 = null;
    /** 
     * 下注区域位置1，2，3，4，5，6 
     * */
    _betId = -1;
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
        this.reconnect();
    }
    /**--------------------------------下注----------------------------------------------- */

    onBetClick(event: EventTouch) {
        if (JmManager.Stage != jmbaccarat.DeskStage.StartBetStage) return;
        let index = this.sp_bet_choose_node.ChipSelectIndex;
        if (index == -1) return;
        const touchPos = event.getUILocation();
        const children = this.bet_area_node.node.children;
        for (let i = 0; i < children.length; i++) {
            const item = children[i];
            if (this.checkNodeCollider(touchPos, item)) {
                this._betId = i + 1;
                this.sendBetMessage(this._betId);
                this._sourceWorldPos = this.sp_bet_choose_node.getCurrentChipWorldPos();
                this._tagetWorldPos = new Vec3(touchPos.x, touchPos.y, 0);
            }
        }
    }
    /**
    * 自己飞筹码动画
    */
    flyChip() {
        JmManager.storageChipPos(this.sp_bet_choose_node.ChipSelectIndex, this._tagetWorldPos, this._betId - 1)
        this.fly_chip_node.addFlyChip(this.sp_bet_choose_node.ChipSelectIndex, this._sourceWorldPos, this._tagetWorldPos);
    }

    /**
    * 其他玩家飞筹码动画
    * @param players 其他玩家的下注数据数组
    */
    flyOtherChip(players: jmbaccarat.BetPlayer[]) {
        if (!players?.length) return;
        const chipButtons = WalletManager.getCurrencyBetSize();
        const currentPlayerId = JmManager.PlayerId;
        players.forEach(player => {
            // 跳过当前玩家
            if (player.player_id === currentPlayerId) return;
            // 处理每个下注
            player.bets?.forEach(bet => {
                const chipValue = parseInt(bet.bet_coin);
                const chipIndex = chipButtons.indexOf(chipValue);
                // 如果筹码值有效
                if (chipIndex !== -1) {
                    // 下注区域索引
                    const betAreaIndex = bet.bet_id - 1;
                    //获取目标节点和位置
                    const targetNode = this.bet_area_node.node.children[betAreaIndex];
                    const endPos = targetNode.parent.transform.convertToWorldSpaceAR(targetNode.position);
                    const targetWorldPos = this.getRandomPointAround(endPos);
                    //获取起始位置
                    const sourceWorldPos = this.people_node.node.parent.transform.convertToWorldSpaceAR(
                        this.people_node.node.position
                    );
                    //存储位置并执行飞筹码动画
                    JmManager.storageChipPos(chipIndex, targetWorldPos, betAreaIndex);
                    this.fly_chip_node.addFlyChip(chipIndex, sourceWorldPos, targetWorldPos);
                }
            });
        });
    }

    checkNodeCollider(p: Vec2, target: Node): boolean {
        const collider = target.getComponent(PolygonCollider2D);
        if (!collider) return false;
        const uiTransform = target.getComponent(UITransform);
        if (!uiTransform) return false;
        const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(p.x, p.y, 0));
        return Intersection2D.pointInPolygon(new Vec2(localPos.x, localPos.y), collider.points);
    }

    getRandomPointAround(centerPoint: Vec3, horizontalRange: number = 90, verticalRange: number = 120): Vec3 {
        const randomX = randomRange(-horizontalRange, horizontalRange);
        const randomY = randomRange(-verticalRange, verticalRange);
        return new Vec3(
            centerPoint.x + randomX,
            centerPoint.y + randomY,
            centerPoint.z,
        );
    }

    /**
     * 发送下注消息
     * @param betId 
     */
    protected sendBetMessage(betId: number) {
        const stage = JmManager.Stage;
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
            desk_id: JmManager.DeskId,
            bets: betDatas
        };
        MessageSender.SendMessage(jmbaccarat.Message.MsgBetBaccaratReq, data);
    }

    reconnect() {
        const stage = JmManager.Stage;
        this.reset();
        this.fly_chip_node.reset();
        if (stage == -1) return;
        switch (stage) {
            case jmbaccarat.DeskStage.ReadyStage:
                this.spAnim.setAnimation(0, SpineAnimation.idle2, false);
                break;
            case jmbaccarat.DeskStage.StartBetStage:
                this.timeCounterBar.node.parent.active = true;
                this.fly_chip_node.reconnectChip();
                this.spAnim.setAnimation(0, SpineAnimation.idle2, false);
                break;
            case jmbaccarat.DeskStage.EndBetStage:
                this.fly_chip_node.reconnectChip();
                this.spAnim.setAnimation(0, SpineAnimation.idle3, true);
                break;
            case jmbaccarat.DeskStage.OpenStage:
                this.fly_chip_node.reconnectChip();
                this.spAnim.setAnimation(0, SpineAnimation.idle3, true);
                if (JmManager.Double) {
                    this.bet_area_node.reconnectAnimaton();
                }
                break;
            case jmbaccarat.DeskStage.SettleStage:
                this.timeCounterBar.node.parent.active = true;
                this.setTouZiData();
                this.spAnim.setAnimation(0, SpineAnimation.clap, true);
                this.result_node.reconnectResult();
                break;
        }
    }

    stageChanged() {
        const stage = JmManager.Stage;
        this.reset();
        if (stage == -1) return;
        switch (stage) {
            case jmbaccarat.DeskStage.ReadyStage:
                this.fly_chip_node.reset();
                this.bet_area_node.reset();
                this.spStart.node.active = true;
                this.spStart.setAnimation(0, 'animation', false);
                this.spAnim.node.active = true;
                this.spAnim.timeScale = 0.9;
                this.touzi_node.active = true;
                this.spAnim.setAnimation(0, SpineAnimation.collect, false);
                this.scheduleOnce(() => {
                    this.touzi_node.active = false;
                    AudioManager.playSound(this.bundleName, '摇骰子音效');
                    this.spAnim.setAnimation(0, SpineAnimation.shaking, false);
                }, 1.8); break;
            case jmbaccarat.DeskStage.StartBetStage:
                this.timeCounterBar.node.parent.active = true;
                this.spAnim.node.active = true;
                this.spAnim.timeScale = 0.9;
                this.spAnim.setAnimation(0, SpineAnimation.idle2, false);
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
                this.spAnim.node.active = true;
                this.spAnim.timeScale = 1
                this.spAnim.setAnimation(0, SpineAnimation.idle3, true);
                if (JmManager.Double) {
                    this.bet_area_node.showAnimaton();
                    this.spXiaZhu.node.active = true;
                    this.spXiaZhu.setAnimation(0, SpineXiaZhuAnimation.ewbl, false);
                }
                break;
            case jmbaccarat.DeskStage.SettleStage:
                this.timeCounterBar.node.parent.active = true;
                this.setTouZiData();
                if (JmManager.Double) {
                    this.bet_area_node.reconnectAnimaton();
                }
                this.spAnim.node.active = true;
                this.spAnim.timeScale = 1;
                this.spAnim.setAnimation(0, SpineAnimation.open, false);
                this.scheduleOnce(() => {
                    this.result_node.showResult();
                    this.bet_area_node.showResult();
                    this.spAnim.setAnimation(0, SpineAnimation.clap, true);
                    if (JmManager.WinCoin > 0) {
                        AudioManager.playSound(this.bundleName, '押中中奖音效');
                        TextUtils.updateNumberTextWithSperateAndFixed(this.labelwinCoin, JmManager.WinCoin, 3, ',', 1, 0);
                        this.spWin.node.active = true;
                        this.spWin.setAnimation(0, 'animation', false);
                    }
                    this.scheduleOnce(() => {
                        if (JmManager.WinCoin > 0) {
                            AudioManager.playSound(this.bundleName, '当前玩家获胜增加金币音效');
                        }
                        let sourceNode = this.people_node.node;
                        let sourceUITransform = sourceNode.parent.getComponent(UITransform);
                        let sourceWorldPos = sourceUITransform.convertToWorldSpaceAR(sourceNode.position);
                        this.fly_chip_node.getComponent(CustomFlyChip).recycleChip(sourceWorldPos)
                    }, 1)
                }, 2.8);
                break;
        }
    }

    private _index = [new Vec3(0, 40, 7), new Vec3(26, 33, 6), new Vec3(-26, 33, 5), new Vec3(0, 18, 4), new Vec3(26, 3, 3), new Vec3(-26, 3, 2), new Vec3(-15, -21, 1), new Vec3(15, -21, 0)];
    setTouZiData() {
        let open = JmManager.OpenPos;
        const pos = this.shuffleArray(this._index)
        const children = this.touzi_node.children;
        children.forEach((child, idx) => {
            child.active = !!open[idx];
            if (open[idx]) {
                child.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/" + open[idx] + "/spriteFrame");
                child.position = pos[idx];
            }
        });
        this.touzi_node.active = true;
    }
    
    shuffleArray(array: Vec3[]) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    /**
      * 当前正在显示的倒计时秒数
      */
    private _currentHaveSec: number = 0;
    protected lateUpdate(dt: number): void {
        if (JmManager.Stage != jmbaccarat.DeskStage.StartBetStage && JmManager.Stage != jmbaccarat.DeskStage.SettleStage) return;
        const left = JmManager.minusHaveSec(dt);
        const maxSec = JmManager.Dur;
        const secNow = Math.ceil(left);
        if (secNow !== this._currentHaveSec) {
            this._currentHaveSec = secNow;
            this.timeCount.string = secNow.toString();
            if (JmManager.Stage == jmbaccarat.DeskStage.StartBetStage) {
                if (secNow == 5) {
                    AudioManager.playSound(this.bundleName, '倒计时剩余五秒时候播放');
                } else if (secNow < 5 && secNow > 0) {
                    AudioManager.playSound(this.bundleName, '剩余4秒，倒计时提示音，每秒播放一次');
                }
            }
        }
        this.timeCounterBar.progress = left / maxSec;
    }

    reset() {
        this.spStart.node.active = false;
        this.spXiaZhu.node.active = false;
        this.spWin.node.active = false;
        this.touzi_node.active = false;
        this.timeCounterBar.node.parent.active = false;
        this.result_node.reset();
        this.bet_area_node.reset();
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
            cc_labelwinCoin: [cc.Label],
            cc_people_node: [cc.Sprite],
            cc_result_node: [CustomResult],
            cc_spAnim: [cc.sp.Skeleton],
            cc_spStart: [cc.sp.Skeleton],
            cc_spWin: [cc.sp.Skeleton],
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
    protected labelwinCoin: cc.Label = null;
    protected people_node: cc.Sprite = null;
    protected result_node: CustomResult = null;
    protected spAnim: cc.sp.Skeleton = null;
    protected spStart: cc.sp.Skeleton = null;
    protected spWin: cc.sp.Skeleton = null;
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
