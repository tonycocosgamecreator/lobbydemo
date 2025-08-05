// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import List from 'db://assets/resources/scripts/core/view/list-view';
import { UITransform } from 'cc';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelGame')
export default class PanelGame extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi()
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    buildUi() {
        let a = ['啦啦啦', '哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈', '啦啦啦', '哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈', '哼哼', '叽叽叽叽急急急及']
        // 2. 手动设置 `_customSize`（记录每个Item的宽度）
        this.historyList["_customSize"] = {};
        for (let i = 0; i < a.length; i++) {
            this.historyList["_customSize"][i] = i % 2 === 0 ? 100 : 500; // 和 itemRender 里的逻辑一致
        }
        this.historyList.itemRender = (item: cc.Node, index: number) => {
            const ut = item.getComponent(UITransform);
            const label = item.getComponent(cc.Label);
            label.string = a[index]
            ut.width = this.historyList["_customSize"][index]; // 使用 _customSize 的值
        };
        this.historyList.numItems = a.length;
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

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_betChoose: [cc.Sprite],
            cc_buttonChip0: [GButton, this.onClickButtonChip0.bind(this)],
            cc_buttonChip1: [GButton, this.onClickButtonChip1.bind(this)],
            cc_buttonChip2: [GButton, this.onClickButtonChip2.bind(this)],
            cc_buttonChip3: [GButton, this.onClickButtonChip3.bind(this)],
            cc_buttonChip4: [GButton, this.onClickButtonChip4.bind(this)],
            cc_buttonChip5: [GButton, this.onClickButtonChip5.bind(this)],
            cc_buttonDetail: [GButton, this.onClickButtonDetail.bind(this)],
            cc_buttonFairness: [GButton, this.onClickButtonFairness.bind(this)],
            cc_historyList: [List],
            cc_labelBalance: [cc.Label],
            cc_labelJhandi: [cc.Label],
            cc_labelPeopleNum: [cc.Label],
            cc_labelPeriod: [cc.Label],
            cc_labelTotalBet: [cc.Label],
            cc_sp_bet_choose_node: [cc.Node],
            cc_timeCount: [cc.Label],
            cc_timeCounterBar: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected betChoose: cc.Sprite = null;
    protected buttonChip0: GButton = null;
    protected buttonChip1: GButton = null;
    protected buttonChip2: GButton = null;
    protected buttonChip3: GButton = null;
    protected buttonChip4: GButton = null;
    protected buttonChip5: GButton = null;
    protected buttonDetail: GButton = null;
    protected buttonFairness: GButton = null;
    protected historyList: List = null;
    protected labelBalance: cc.Label = null;
    protected labelJhandi: cc.Label = null;
    protected labelPeopleNum: cc.Label = null;
    protected labelPeriod: cc.Label = null;
    protected labelTotalBet: cc.Label = null;
    protected sp_bet_choose_node: cc.Node = null;
    protected timeCount: cc.Label = null;
    protected timeCounterBar: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelGame';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelGame.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelGame.VIEW_NAME;
    }
    // @view export resource end
}
