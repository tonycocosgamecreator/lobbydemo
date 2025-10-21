// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomBigWinner from 'db://assets/resources/scripts/view/CustomBigWinner';
import CustomChip from 'db://assets/resources/scripts/view/CustomChip';
import CustomDesk from 'db://assets/resources/scripts/view/CustomDesk';
import CustomHandle from 'db://assets/resources/scripts/view/CustomHandle';
import CustomHead from 'db://assets/resources/scripts/view/CustomHead';
import CustomMainHistory from 'db://assets/resources/scripts/view/CustomMainHistory';
import CustomOnline from 'db://assets/resources/scripts/view/CustomOnline';
import CustomTime from 'db://assets/resources/scripts/view/CustomTime';
import CustomTop from 'db://assets/resources/scripts/view/CustomTop';
import { IPanelSevenUpSevenDownMainView } from '../define/ipanel-sevenupsevendown-main-view';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
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

    buildUi() {
        this.ske_change.node.active = false;
        this.ske_start.node.active = false;
        this.ske_person.node.active = true;
    }

    protected start(): void {
        this.updateReconnect();

    }

    updateReconnect() {
        this.stage = SevenUpSevenDownManager.Stage;
        if (this.stage == -1) return;
        switch (this.stage) {
            case baccarat.DeskStage.ReadyStage:
                this.ske_person.setAnimation(0, 'collect', false);
                this.scheduleOnce(() => {
                    this.ske_person.setAnimation(0, 'shaking', false);
                }, 1.8);
                break;
            case baccarat.DeskStage.StartBetStage:
                this.ske_person.setAnimation(0, 'idle2', false);
                break;
            case baccarat.DeskStage.EndBetStage:
                break;
            case baccarat.DeskStage.OpenStage:
                break;
            case baccarat.DeskStage.SettleStage:
                break;
        }
        this.time_node.updateGameStage();
    }

    updateGameStage() {
        this.stage = SevenUpSevenDownManager.Stage;
        if (this.stage == -1) return;
        switch (this.stage) {
            case baccarat.DeskStage.ReadyStage:
                this.desk_node.reset();
                this.ske_change.node.active = false;
                this.ske_start.node.active = true;
                this.ske_start.setAnimation(0, 'animation', false);
                this.ske_person.setAnimation(0, 'collect', false);
                this.scheduleOnce(() => {
                    this.ske_person.setAnimation(0, 'shaking', false);
                }, 1.8);
                break;
            case baccarat.DeskStage.StartBetStage:
                this.ske_start.node.active = false;
                this.ske_change.node.active = true;
                this.ske_change.setAnimation(0, 'xz', false);
                this.ske_person.setAnimation(0, 'idle2', false);
                break;
            case baccarat.DeskStage.EndBetStage:
                break;
            case baccarat.DeskStage.OpenStage:
                break;
            case baccarat.DeskStage.SettleStage:
                break;
        }
        this.time_node.updateGameStage();
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
            cc_bg: [cc.Node],
            cc_bigwinner_node: [CustomBigWinner],
            cc_chip_node: [CustomChip],
            cc_desk_node: [CustomDesk],
            cc_handle_node: [CustomHandle],
            cc_head_node: [CustomHead],
            cc_history_node: [CustomMainHistory],
            cc_online: [CustomOnline],
            cc_ske_change: [cc.sp.Skeleton],
            cc_ske_person: [cc.sp.Skeleton],
            cc_ske_start: [cc.sp.Skeleton],
            cc_time_node: [CustomTime],
            cc_top: [CustomTop],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected bg: cc.Node = null;
    protected bigwinner_node: CustomBigWinner = null;
    protected chip_node: CustomChip = null;
    protected desk_node: CustomDesk = null;
    protected handle_node: CustomHandle = null;
    protected head_node: CustomHead = null;
    protected history_node: CustomMainHistory = null;
    protected online: CustomOnline = null;
    protected ske_change: cc.sp.Skeleton = null;
    protected ske_person: cc.sp.Skeleton = null;
    protected ske_start: cc.sp.Skeleton = null;
    protected time_node: CustomTime = null;
    protected top: CustomTop = null;
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
