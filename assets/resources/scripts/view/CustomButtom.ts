// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomAllBets from 'db://assets/resources/scripts/view/CustomAllBets';
import CustomRank from 'db://assets/resources/scripts/view/CustomRank';
import GButtonGroup from 'db://assets/resources/scripts/core/view/gbutton-group';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomButtom')
export default class CustomButtom extends ViewBase {

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
        this.tabGroup.init();
        this.tabGroup.iconSpriteFrames = [
            null,
            this.getSpriteFrame("textures/ui/7up_Img_27"),
        ];
        this.tabGroup.titleColors = [
            cc.color("#A4AAB3"),
            cc.Color.WHITE,
        ];
        this.tabGroup.selectIndex = 0;
        this.top_node.node.active = false;
    }

    changeState(isAllBet: boolean) {
        this.top_node.node.active = !isAllBet;
        this.allbets.node.active = isAllBet;
    }

    updateGameStage(stage: baccarat.DeskStage.StartBetStage, reconnect: boolean = false) {
        this.allbets.updateGameStage(stage, reconnect);
    }

    updateBetList(result: boolean = false) {
        this.allbets.updateData(result);
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonallbets(event: cc.EventTouch) {
        this.changeState(true);
    }
    private onClickButtontop(event: cc.EventTouch) {
        this.changeState(false);
    }
    // @view export event end


    // @view export resource begin

    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_allbets: [CustomAllBets],
            cc_buttonallbets: [GButton, this.onClickButtonallbets.bind(this)],
            cc_buttontop: [GButton, this.onClickButtontop.bind(this)],
            cc_tabGroup: [GButtonGroup],
            cc_top_node: [CustomRank],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected allbets: CustomAllBets = null;
    protected buttonallbets: GButton = null;
    protected buttontop: GButton = null;
    protected tabGroup: GButtonGroup = null;
    protected top_node: CustomRank = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomButtom';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomButtom.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomButtom.VIEW_NAME;
    }

    // @view export resource end
}
