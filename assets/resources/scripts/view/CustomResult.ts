// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
import { v3 } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomResult')
export default class CustomResult extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    _stage = -1;
    buildUi() {
        this.reset()
    }

    reset() {
        cc.Tween.stopAllByTarget(this.node);
        this.node.active = false;
        this.node.scale = v3(1, 1, 1);
    }

    updateGameStage(reconnect: boolean = false) {
        this._stage = SevenUpSevenDownManager.Stage;
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
            case baccarat.DeskStage.StartBetStage:
            case baccarat.DeskStage.EndBetStage:
            case baccarat.DeskStage.OpenStage:
                this.reset();
                break;
            case baccarat.DeskStage.SettleStage:
                if (reconnect) {
                    this.showResult();
                }
                break;
        }
    }

    showResult(play: boolean = false) {
        let open = SevenUpSevenDownManager.OpenPos;
        this.spr_result1.spriteFrame = this.getSpriteFrame("textures/ui/" + open[0] + "/spriteFrame");
        this.spr_result2.spriteFrame = this.getSpriteFrame("textures/ui/" + open[1] + "/spriteFrame");
        this.node.active = true;
        if (play) {
            this.node.scale = v3(0, 0, 0);
            cc.tween(this.node)
                .to(0.2, { scale: v3(1, 1, 1) })
                .start();
        } else {
            this.node.scale = v3(1, 1, 1);
        }
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
            cc_spr_result1: [cc.Sprite],
            cc_spr_result2: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected spr_result1: cc.Sprite = null;
    protected spr_result2: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomResult';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomResult.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomResult.VIEW_NAME;
    }
    // @view export resource end
}
