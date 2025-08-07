// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomBetArea from 'db://assets/resources/scripts/view/CustomBetArea';
import CustomChooseChip from 'db://assets/resources/scripts/view/CustomChooseChip';
import CustomFlyChip from 'db://assets/resources/scripts/view/CustomFlyChip';
import List from 'db://assets/resources/scripts/core/view/list-view';
import { EventTouch } from 'cc';
import { Vec2 } from 'cc';
import { PolygonCollider2D } from 'cc';
import { UITransform } from 'cc';
import { Intersection2D } from 'cc';
import { Vec3 } from 'cc';
import { Node } from 'cc';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;


@ccclass('PanelJmMainView')
export default class PanelJmMainView extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    buildUi() {
        this.bet_area_node.on(cc.Node.EventType.TOUCH_END, this.onBetClick, this)
    }

    onBetClick(event: EventTouch) {
        let index = this.sp_bet_choose_node.ChipSelectIndex;
        if (index == -1) return;
        const touchPos = event.getUILocation();
        for (let i = 0; i < this.bet_area_node.children.length; i++) {
            const item = this.bet_area_node.children[i];
            if (this.check(touchPos, item)) {
                let sourceWorldPos = this.sp_bet_choose_node.getCurrentChipWorldPos();
                this.fly_chip_node.getComponent(CustomFlyChip).addFlyChip(index, sourceWorldPos, new Vec3(touchPos.x, touchPos.y, 0));
            }
        }
    }

    check(p: Vec2, target: Node): boolean {
        const collider = target.getComponent(PolygonCollider2D);
        if (!collider) return false;
        const uiTransform = target.getComponent(UITransform);
        if (!uiTransform) return false;
        const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(p.x, p.y, 0));
        return Intersection2D.pointInPolygon(new Vec2(localPos.x, localPos.y), collider.points);
    }




    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonFairness(event: cc.EventTouch) {
        cc.log('on click event cc_buttonFairness');
        let sourceNode = this.buttonFairness.node;
        let sourceUITransform = sourceNode.parent.getComponent(UITransform);
        let sourceWorldPos = sourceUITransform.convertToWorldSpaceAR(sourceNode.position);
        this.fly_chip_node.getComponent(CustomFlyChip).recycleChip(sourceWorldPos)
    }

    private onClickButtonDetail(event: cc.EventTouch) {
        cc.log('on click event cc_buttonDetail');
    }
    private onClickButtonCloseDetail(event: cc.EventTouch) {
        cc.log('on click event cc_buttonCloseDetail');
    }
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_bet_area0_node: [CustomBetArea],
            cc_bet_area1_node: [CustomBetArea],
            cc_bet_area2_node: [CustomBetArea],
            cc_bet_area3_node: [CustomBetArea],
            cc_bet_area4_node: [CustomBetArea],
            cc_bet_area5_node: [CustomBetArea],
            cc_bet_area_node: [cc.Node],
            cc_buttonCloseDetail: [GButton, this.onClickButtonCloseDetail.bind(this)],
            cc_buttonDetail: [GButton, this.onClickButtonDetail.bind(this)],
            cc_buttonFairness: [GButton, this.onClickButtonFairness.bind(this)],
            cc_fly_chip_node: [CustomFlyChip],
            cc_historyDetailList: [List],
            cc_historyList: [List],
            cc_labelPeopleNum: [cc.Label],
            cc_people_node: [cc.Sprite],
            cc_sp_bet_choose_node: [CustomChooseChip],
            cc_timeCount: [cc.Label],
            cc_timeCounterBar: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected bet_area0_node: CustomBetArea = null;
    protected bet_area1_node: CustomBetArea = null;
    protected bet_area2_node: CustomBetArea = null;
    protected bet_area3_node: CustomBetArea = null;
    protected bet_area4_node: CustomBetArea = null;
    protected bet_area5_node: CustomBetArea = null;
    protected bet_area_node: cc.Node = null;
    protected buttonCloseDetail: GButton = null;
    protected buttonDetail: GButton = null;
    protected buttonFairness: GButton = null;
    protected fly_chip_node: CustomFlyChip = null;
    protected historyDetailList: List = null;
    protected historyList: List = null;
    protected labelPeopleNum: cc.Label = null;
    protected people_node: cc.Sprite = null;
    protected sp_bet_choose_node: CustomChooseChip = null;
    protected timeCount: cc.Label = null;
    protected timeCounterBar: cc.Sprite = null;
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
