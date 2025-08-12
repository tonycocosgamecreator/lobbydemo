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
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;
export enum SpineAnimation {
    collect = "collect",
    shaking = 'shaking',
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

    buildUi() {
        this.bet_area_node.node.on(cc.Node.EventType.TOUCH_END, this.onBetClick, this);
        console.log(this.anim_node, '===============');
        // this.spAnim.setAnimation(0, SpineAnimation.collect, false);
    }
    /**--------------------------------下注----------------------------------------------- */
    onBetClick(event: EventTouch) {
        let index = this.sp_bet_choose_node.ChipSelectIndex;
        if (index == -1) return;
        const touchPos = event.getUILocation();
        for (let i = 0; i < this.bet_area_node.node.children.length; i++) {
            const item = this.bet_area_node.node.children[i];
            if (this.checkNodeCollider(touchPos, item)) {
                let sourceWorldPos = this.sp_bet_choose_node.getCurrentChipWorldPos();
                this.fly_chip_node.addFlyChip(index, sourceWorldPos, new Vec3(touchPos.x, touchPos.y, 0));
            }
        }
    }

    checkNodeCollider(p: Vec2, target: Node): boolean {
        const collider = target.getComponent(PolygonCollider2D);
        if (!collider) return false;
        const uiTransform = target.getComponent(UITransform);
        if (!uiTransform) return false;
        const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(p.x, p.y, 0));
        return Intersection2D.pointInPolygon(new Vec2(localPos.x, localPos.y), collider.points);
    }


    stageChanged() {
        const stage = JmManager.stage;
        switch (stage) {
            case baccarat.DeskStage.ReadyStage:
                this.fly_chip_node.reset();
                this.bet_area_node.reset();
                this.sp_bet_choose_node.reset();
                this.timeCounterBar.node.active = false;
                // this.spAnim.setAnimation(0, SpineAnimation.collect, false);
                // this.scheduleOnce(() => {
                //     this.spAnim.setAnimation(0, SpineAnimation.shaking, false);
                // })
                break;
            case baccarat.DeskStage.StartBetStage: break;
            case baccarat.DeskStage.EndBetStage: break;
            case baccarat.DeskStage.OpenStage: break;
            case baccarat.DeskStage.SettleStage: break;
        }
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        if (msgType == baccarat.Message.MsgBaccaratOnlineNtf) {
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
        // let sourceNode = this.buttonFairness.node;
        // let sourceUITransform = sourceNode.parent.getComponent(UITransform);
        // let sourceWorldPos = sourceUITransform.convertToWorldSpaceAR(sourceNode.position);
        // this.fly_chip_node.getComponent(CustomFlyChip).recycleChip(sourceWorldPos)
    }
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_anim_node: [cc.sp.Skeleton],
            cc_bet_area_node: [CustomBetArea],
            cc_buttonFairness: [GButton, this.onClickButtonFairness.bind(this)],
            cc_fly_chip_node: [CustomFlyChip],
            cc_history_node: [CustomHistory],
            cc_labelPeopleNum: [cc.Label],
            cc_people_node: [cc.Sprite],
            cc_sp_bet_choose_node: [CustomChooseChip],
            cc_timeCount: [cc.Label],
            cc_timeCounterBar: [cc.Sprite],
            cc_top_node: [CustomSystemTopFoot],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected anim_node: cc.sp.Skeleton = null;
    protected bet_area_node: CustomBetArea = null;
    protected buttonFairness: GButton = null;
    protected fly_chip_node: CustomFlyChip = null;
    protected history_node: CustomHistory = null;
    protected labelPeopleNum: cc.Label = null;
    protected people_node: cc.Sprite = null;
    protected sp_bet_choose_node: CustomChooseChip = null;
    protected timeCount: cc.Label = null;
    protected timeCounterBar: cc.Sprite = null;
    protected top_node: CustomSystemTopFoot = null;
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
