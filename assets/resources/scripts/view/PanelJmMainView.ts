// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import List from 'db://assets/resources/scripts/core/view/list-view';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

const TEMP_WORLD_V3 = new cc.Vec3();

const FAIL_CHIP_TARGET_POS = new cc.Vec3(0, -76, 0);

const PLAYER_NODE_POS = new cc.Vec3(0, 0, 0);

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

    /**
    * 选中的筹码，默认第一个
    */
    private _chipSelectIndex: number = -1;

    /**
    * 筹码长度
    */
    private _chipButtonsLen: number = -1;

    buildUi() {
        this._chipButtonsLen = this.ChipGroup.children.length;
    }

    /**
    * 每局游戏结束后重置筹码状态
    */
    initChip() {
        this._chipSelectIndex = -1;
        this.betChoose.node.active = false;
        for (let i = 0; i < this._chipButtonsLen; i++) {
            const button = this.ChipGroup[i];
            button.node.width = 101;
            button.node.height = 101;
        }
    }
    /**
    * 切换当前选中的筹码
    * @param index 
    */
    changeChipSelect(index: number) {
        if (index < 0 || index >= this._chipButtonsLen) {
            bDebug && console.error(`Invalid chip index: ${index}`);
            return;
        }
        this._chipSelectIndex = index;
        let node: cc.Node | null = null;
        //取消之前的选中
        for (let i = 0; i < this._chipButtonsLen; i++) {
            const button = this.ChipGroup[i];
            if (i == index) {
                //选中效果
                node = button.node;
            } else {
                //取消选中效果
                button.node.width = 101;
                button.node.height = 101;
            }
        }
        this.scheduleOnce(() => {
            //要等一会才能设置
            TEMP_WORLD_V3.set(0, 0, 0);
            //将node的坐标，转换到世界坐标
            node.transform.convertToWorldSpaceAR(TEMP_WORLD_V3, TEMP_WORLD_V3);
            //再将世界坐标转换到this.sp_bet_choose_node上
            this.sp_bet_choose_node.transform.convertToNodeSpaceAR(TEMP_WORLD_V3, TEMP_WORLD_V3);
            //将this.betChoose的坐标设置为TEMP_WORLD_V3
            this.betChoose.node.setPosition(TEMP_WORLD_V3);
            this.betChoose.node.active = true;
            node.width = 125;
            node.height = 125;
        }, 1 / 30)
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
    }
    private onClickButtonChip0(event: cc.EventTouch) {
        cc.log('on click event cc_buttonChip0');
    }
    private onClickButtonChip1(event: cc.EventTouch) {
        cc.log('on click event cc_buttonChip1');
    }
    private onClickButtonChip2(event: cc.EventTouch) {
        cc.log('on click event cc_buttonChip2');
    }
    private onClickButtonChip3(event: cc.EventTouch) {
        cc.log('on click event cc_buttonChip3');
    }
    private onClickButtonChip4(event: cc.EventTouch) {
        cc.log('on click event cc_buttonChip4');
    }
    private onClickButtonChip5(event: cc.EventTouch) {
        cc.log('on click event cc_buttonChip5');
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
            cc_ChipGroup    : [cc.Node],
            cc_betChoose    : [cc.Sprite],
            cc_buttonChip0    : [GButton,this.onClickButtonChip0.bind(this)],
            cc_buttonChip1    : [GButton,this.onClickButtonChip1.bind(this)],
            cc_buttonChip2    : [GButton,this.onClickButtonChip2.bind(this)],
            cc_buttonChip3    : [GButton,this.onClickButtonChip3.bind(this)],
            cc_buttonChip4    : [GButton,this.onClickButtonChip4.bind(this)],
            cc_buttonChip5    : [GButton,this.onClickButtonChip5.bind(this)],
            cc_buttonCloseDetail    : [GButton,this.onClickButtonCloseDetail.bind(this)],
            cc_buttonDetail    : [GButton,this.onClickButtonDetail.bind(this)],
            cc_buttonFairness    : [GButton,this.onClickButtonFairness.bind(this)],
            cc_historyDetailList    : [List],
            cc_historyList    : [List],
            cc_labelBalance    : [cc.Label],
            cc_labelJhandi    : [cc.Label],
            cc_labelPeopleNum    : [cc.Label],
            cc_labelPeriod    : [cc.Label],
            cc_labelTotalBet    : [cc.Label],
            cc_sp_bet_choose_node    : [cc.Node],
            cc_timeCount    : [cc.Label],
            cc_timeCounterBar    : [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected ChipGroup: cc.Node    = null;
   protected betChoose: cc.Sprite    = null;
   protected buttonChip0: GButton    = null;
   protected buttonChip1: GButton    = null;
   protected buttonChip2: GButton    = null;
   protected buttonChip3: GButton    = null;
   protected buttonChip4: GButton    = null;
   protected buttonChip5: GButton    = null;
   protected buttonCloseDetail: GButton    = null;
   protected buttonDetail: GButton    = null;
   protected buttonFairness: GButton    = null;
   protected historyDetailList: List    = null;
   protected historyList: List    = null;
   protected labelBalance: cc.Label    = null;
   protected labelJhandi: cc.Label    = null;
   protected labelPeopleNum: cc.Label    = null;
   protected labelPeriod: cc.Label    = null;
   protected labelTotalBet: cc.Label    = null;
   protected sp_bet_choose_node: cc.Node    = null;
   protected timeCount: cc.Label    = null;
   protected timeCounterBar: cc.Sprite    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'PanelJmMainView';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return PanelJmMainView.BUNDLE_NAME;
    }
   public get viewName(){
        return PanelJmMainView.VIEW_NAME;
    }
    // @view export resource end
}
