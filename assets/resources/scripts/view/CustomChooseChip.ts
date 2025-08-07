// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../core/message/base-global';
import { ChipColor, ChipCount, GameEvent } from '../define';
import { Color } from 'cc';
import { Vec3 } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

const TEMP_WORLD_V3 = new cc.Vec3();

const FAIL_CHIP_TARGET_POS = new cc.Vec3(0, -76, 0);

const PLAYER_NODE_POS = new cc.Vec3(0, 0, 0);

@ccclass('CustomChooseChip')
export default class CustomChooseChip extends ViewBase {

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
    * 账户金额
    */
    private _totalBalance: number = 0;

    /**
    * 选中的筹码，默认第一个
    */
    private _chipSelectIndex: number = -1;

    /**
    * 筹码长度
    */
    private _chipButtonsLen: number = -1;

    set ChipSelectIndex(value: number) {
        this._chipSelectIndex = value;
    }

    get ChipSelectIndex(): number {
        return this._chipSelectIndex;
    }

    buildUi() {
        this._chipButtonsLen = this.ChipGroup.children.length;
        this.init();
        BaseGlobal.registerListeners(this, {
            [GameEvent.PLAYER_CURRENCY_UPDATE]: this.updateTotalBalance,
        });
    }
    /**
    *初始化筹码状态
    */
    init() {
        this._chipSelectIndex = -1;
        this.betChoose.node.active = false;
        for (let i = 0; i < this._chipButtonsLen; i++) {
            const button = this.ChipGroup.children[i];
            button.getComponent(GButton).useDefaultEffect();
            button.width = 101;
            button.height = 101;
        }
    }
    /**
    * 每局游戏结束后重置筹码状态
    */
    clearChip() {
        this._chipSelectIndex = -1;
        this.betChoose.node.active = false;
        for (let i = 0; i < this._chipButtonsLen; i++) {
            const button = this.ChipGroup.children[i];
            button.width = 101;
            button.height = 101;
        }
    }
    /**
    * 更新筹码展示状态 不够余额下注的话置灰
    */
    updateButtonState() {
        for (let i = 0; i < this._chipButtonsLen; i++) {
            const button = this.ChipGroup.children[i];
            let isEnable = this._totalBalance >= ChipCount[i]
            button.getComponent(GButton).isEnabled = isEnable;
            button.getChildByName('title').getComponent(cc.Label).color = isEnable ? new Color(ChipColor[i]) : new Color('#4A4D55');
        }
        if (this._chipSelectIndex == -1) return;
        //当前选择的筹码大于用户余额的时候 需要重置筹码状态
        if (this._totalBalance < ChipCount[this._chipSelectIndex]) {
            this.clearChip();
        }
    }
    /**
    * 切换当前选中的筹码
    * @param index 
    */
    changeChipSelect(index: number) {
        if (this._chipButtonsLen == -1) return;
        if (index < 0 || index >= this._chipButtonsLen) {
            bDebug && console.error(`Invalid chip index: ${index}`);
            return;
        }
        this._chipSelectIndex = index;
        let node: cc.Node | null = null;
        //取消之前的选中
        for (let i = 0; i < this._chipButtonsLen; i++) {
            const button = this.ChipGroup.children[i];
            if (i == index) {
                //选中效果
                node = button;
            } else {
                //取消选中效果
                button.width = 101;
                button.height = 101;
            }
        }
        this.scheduleOnce(() => {
            //要等一会才能设置
            TEMP_WORLD_V3.set(0, 0, 0);
            //将node的坐标，转换到世界坐标
            node.transform.convertToWorldSpaceAR(TEMP_WORLD_V3, TEMP_WORLD_V3);
            //再将世界坐标转换到this.sp_bet_choose_node上
            this.node.transform.convertToNodeSpaceAR(TEMP_WORLD_V3, TEMP_WORLD_V3);
            //将this.betChoose的坐标设置为TEMP_WORLD_V3
            this.betChoose.node.setPosition(TEMP_WORLD_V3);
            this.betChoose.node.active = true;
            node.width = 125;
            node.height = 125;
        }, 1 / 30)
    }

    updateTotalBalance() {
        //更新自己的账户余额
        this.updateButtonState()
    }

    getCurrentChipWorldPos(): Vec3 {
        let sourceNode = this.ChipGroup.children[this._chipSelectIndex];
        let sourceWorldPos = sourceNode.parent.transform.convertToWorldSpaceAR(sourceNode.position);
        return sourceWorldPos;
    }


    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonChip0(event: cc.EventTouch) {
        this.changeChipSelect(0);
    }
    private onClickButtonChip1(event: cc.EventTouch) {
        this.changeChipSelect(1);
    }
    private onClickButtonChip2(event: cc.EventTouch) {
        this.changeChipSelect(2);
    }
    private onClickButtonChip3(event: cc.EventTouch) {
        this.changeChipSelect(3);
    }
    private onClickButtonChip4(event: cc.EventTouch) {
        this.changeChipSelect(4);
    }
    private onClickButtonChip5(event: cc.EventTouch) {
        this.changeChipSelect(5);
    }
    // @view export event end


    // @view export resource begin

    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_ChipGroup: [cc.Node],
            cc_betChoose: [cc.Sprite],
            cc_buttonChip0: [GButton, this.onClickButtonChip0.bind(this)],
            cc_buttonChip1: [GButton, this.onClickButtonChip1.bind(this)],
            cc_buttonChip2: [GButton, this.onClickButtonChip2.bind(this)],
            cc_buttonChip3: [GButton, this.onClickButtonChip3.bind(this)],
            cc_buttonChip4: [GButton, this.onClickButtonChip4.bind(this)],
            cc_buttonChip5: [GButton, this.onClickButtonChip5.bind(this)],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected ChipGroup: cc.Node = null;
    protected betChoose: cc.Sprite = null;
    protected buttonChip0: GButton = null;
    protected buttonChip1: GButton = null;
    protected buttonChip2: GButton = null;
    protected buttonChip3: GButton = null;
    protected buttonChip4: GButton = null;
    protected buttonChip5: GButton = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomChooseChip';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomChooseChip.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomChooseChip.VIEW_NAME;
    }

    // @view export resource end
}
