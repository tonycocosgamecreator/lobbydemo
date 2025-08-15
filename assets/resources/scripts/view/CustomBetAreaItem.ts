// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { Tween } from 'cc';
import { Color } from 'cc';
import JmManager from '../manager/jm-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomBetAreaItem')
export default class CustomBetAreaItem extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    setRecord(idx: number, value: number) {
        let showValue = value > 1;
        this.bet_result_node.children[idx].getComponentInChildren(cc.Label).color = showValue ? new Color('#FFF') : new Color('#CCC');
        this.bet_result_node.children[idx].getComponentInChildren(cc.Label).string = showValue ? value.toString() : 'X';
        this.bet_result_node.children[idx].getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/${showValue ? 'JM_Img_6' : 'JM_Img_5'}/spriteFrame`);
    }

    resetRecord() {
        this.bet_result_node.children.forEach(t => {
            t.getComponentInChildren(cc.Label).string = '';
            t.getComponentInChildren(cc.Label).color = new Color('#CCC');
            t.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame("textures/JM_Img_5/spriteFrame");
        })
    }

    setBetNum(idx: number) {
        let num = 0;
        let id = idx + 1;
        const data = JmManager.MyData;
        if (!data) {
            this.labelSum.string = num + '';
            return;
        }
        if (data && data.length == 0) {
            this.labelSum.string = num + '';
            return;
        }
        JmManager.MyData.forEach(t => {
            if (t.bet_id == id) {
                num += parseInt(t.bet_coin);
            }
        })
        this.labelSum.string = num + '';
    }

    setBetAreaLight() {
        Tween.stopAllByTarget(this.light_node.node);
        this.light_node.node.active = true;
        this.blink(this.light_node.node, 0.2, 3);
    }

    reset() {
        Tween.stopAllByTarget(this.light_node.node);
        this.light_node.node.active = false;
        this.light_node.node.opacity = 0;
    }

    blink(node, duration, times) {
        const tween = cc.tween(node);
        for (let i = 0; i < times; i++) {
            tween.to(duration, { opacity: 255 })
                .to(duration, { opacity: 0 });
        }
        tween.start();
    }

    // 使用方式

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_bet_result_node: [cc.Node],
            cc_labelSum: [cc.Label],
            cc_light_node: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected bet_result_node: cc.Node = null;
    protected labelSum: cc.Label = null;
    protected light_node: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomBetAreaItem';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomBetAreaItem.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomBetAreaItem.VIEW_NAME;
    }
    // @view export resource end
}
