// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import GameManager from '../manager/game-manager';
//------------------------特殊引用开始----------------------------//
import CustomDeskScoreItem from 'db://assets/resources/scripts/view/CustomDeskScoreItem';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomDeskScore')
export default class CustomDeskScore extends ViewBase {

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
        BaseGlobal.registerListeners(this, {
            [GameEvent.ANIMATION_END_UPDATE]: this.updatePlayBetValue,
        });

    }

    initData(stage: number) {
        this.node.children.forEach((child, idx) => {
            child.getComponent(CustomDeskScoreItem).initData(idx + 1);
        });
        if (stage != baccarat.DeskStage.ReadyStage) {
            this.updatePlayBetValue();
        }
    }

    updatePlayBetValue() {
        this.node.children.forEach((child, idx) => {
            const data = GameManager.getBetInfoByArea(idx + 1);
            child.getComponent(CustomDeskScoreItem).updatePlayBetValue(data);
        })
    }

    reset() {
        this.node.children.forEach(child => {
            child.getComponent(CustomDeskScoreItem).reset()
        })
    }



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
            cc_item1: [CustomDeskScoreItem],
            cc_item10: [CustomDeskScoreItem],
            cc_item11: [CustomDeskScoreItem],
            cc_item12: [CustomDeskScoreItem],
            cc_item13: [CustomDeskScoreItem],
            cc_item2: [CustomDeskScoreItem],
            cc_item3: [CustomDeskScoreItem],
            cc_item4: [CustomDeskScoreItem],
            cc_item5: [CustomDeskScoreItem],
            cc_item6: [CustomDeskScoreItem],
            cc_item7: [CustomDeskScoreItem],
            cc_item8: [CustomDeskScoreItem],
            cc_item9: [CustomDeskScoreItem],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected item1: CustomDeskScoreItem = null;
    protected item10: CustomDeskScoreItem = null;
    protected item11: CustomDeskScoreItem = null;
    protected item12: CustomDeskScoreItem = null;
    protected item13: CustomDeskScoreItem = null;
    protected item2: CustomDeskScoreItem = null;
    protected item3: CustomDeskScoreItem = null;
    protected item4: CustomDeskScoreItem = null;
    protected item5: CustomDeskScoreItem = null;
    protected item6: CustomDeskScoreItem = null;
    protected item7: CustomDeskScoreItem = null;
    protected item8: CustomDeskScoreItem = null;
    protected item9: CustomDeskScoreItem = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomDeskScore';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomDeskScore.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomDeskScore.VIEW_NAME;
    }
    // @view export resource end
}
