// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomDesk')
export default class CustomDesk extends ViewBase {

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
        const odds = SevenUpSevenDownManager.Odds;
        this.betarea_node.children.forEach((child, idx) => {
            child.getChildByName('odd').getComponent(cc.Label).string = odds[idx];
        });
        this.reset();
    }

    reset() {
        this.labelallbet_down.string = '';
        this.labelallbet_top.string = '';
        this.labelmybet_down.string = '';
        this.labelmybet_top.string = '';
        this.betarea_node.children.forEach((child, idx) => {
            child.getChildByName('star').active = false;
            child.getChildByName('lightning').active = false;
        });
    }


    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButton_click0(event: cc.EventTouch) {
        cc.log('on click event cc_button_click0');
    }


    private onClickButton_click1(event: cc.EventTouch) {
        cc.log('on click event cc_button_click1');
    }


    private onClickButton_click2(event: cc.EventTouch) {
        cc.log('on click event cc_button_click2');
    }


    private onClickButton_click3(event: cc.EventTouch) {
        cc.log('on click event cc_button_click3');
    }


    private onClickButton_click4(event: cc.EventTouch) {
        cc.log('on click event cc_button_click4');
    }


    private onClickButton_click5(event: cc.EventTouch) {
        cc.log('on click event cc_button_click5');
    }


    private onClickButton_click6(event: cc.EventTouch) {
        cc.log('on click event cc_button_click6');
    }


    private onClickButton_click7(event: cc.EventTouch) {
        cc.log('on click event cc_button_click7');
    }


    private onClickButton_click8(event: cc.EventTouch) {
        cc.log('on click event cc_button_click8');
    }


    private onClickButton_click9(event: cc.EventTouch) {
        cc.log('on click event cc_button_click9');
    }


    private onClickButton_click10(event: cc.EventTouch) {
        cc.log('on click event cc_button_click10');
    }


    private onClickButton_click11(event: cc.EventTouch) {
        cc.log('on click event cc_button_click11');
    }


    private onClickButton_click12(event: cc.EventTouch) {
        cc.log('on click event cc_button_click12');
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_betarea_node: [cc.Node],
            cc_button_click0: [GButton, this.onClickButton_click0.bind(this)],
            cc_button_click1: [GButton, this.onClickButton_click1.bind(this)],
            cc_button_click10: [GButton, this.onClickButton_click10.bind(this)],
            cc_button_click11: [GButton, this.onClickButton_click11.bind(this)],
            cc_button_click12: [GButton, this.onClickButton_click12.bind(this)],
            cc_button_click2: [GButton, this.onClickButton_click2.bind(this)],
            cc_button_click3: [GButton, this.onClickButton_click3.bind(this)],
            cc_button_click4: [GButton, this.onClickButton_click4.bind(this)],
            cc_button_click5: [GButton, this.onClickButton_click5.bind(this)],
            cc_button_click6: [GButton, this.onClickButton_click6.bind(this)],
            cc_button_click7: [GButton, this.onClickButton_click7.bind(this)],
            cc_button_click8: [GButton, this.onClickButton_click8.bind(this)],
            cc_button_click9: [GButton, this.onClickButton_click9.bind(this)],
            cc_labelallbet_down: [cc.Label],
            cc_labelallbet_top: [cc.Label],
            cc_labelmybet_down: [cc.Label],
            cc_labelmybet_top: [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected betarea_node: cc.Node = null;
    protected button_click0: GButton = null;
    protected button_click1: GButton = null;
    protected button_click10: GButton = null;
    protected button_click11: GButton = null;
    protected button_click12: GButton = null;
    protected button_click2: GButton = null;
    protected button_click3: GButton = null;
    protected button_click4: GButton = null;
    protected button_click5: GButton = null;
    protected button_click6: GButton = null;
    protected button_click7: GButton = null;
    protected button_click8: GButton = null;
    protected button_click9: GButton = null;
    protected labelallbet_down: cc.Label = null;
    protected labelallbet_top: cc.Label = null;
    protected labelmybet_down: cc.Label = null;
    protected labelmybet_top: cc.Label = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomDesk';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomDesk.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomDesk.VIEW_NAME;
    }
    // @view export resource end
}
