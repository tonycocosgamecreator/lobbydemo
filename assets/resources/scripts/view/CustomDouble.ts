// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
import { sp } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomDouble')
export default class CustomDouble extends ViewBase {

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
        this.reset();
    }

    updateGameStage(reconnect: boolean = false) {
        this._stage = SevenUpSevenDownManager.Stage;
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this.reset();
                break;
            case baccarat.DeskStage.OpenStage:
                let _odds = SevenUpSevenDownManager.OddString;
                for (let i = 0; i < _odds.length; i++) {
                    if (_odds[i] && +_odds[i]) {
                        let child = this.node.children[i];
                        this.showDoubleAnimaton(child, 'open', reconnect)
                        child.children[0].children[0].active = true;
                        child.children[0].children[1].active = false;
                        child.children[0].children[0].getComponent(cc.Label).string = `X2`;
                        child.children[0].children[1].getComponent(cc.Label).string = `X2`;
                    }
                }
                break;
        }
    }

    showDoubleAnimaton(child: cc.Node, name: string, reconnect: boolean = false) {
        child.active = true;
        const trackEntry = child.getComponent(sp.Skeleton).setAnimation(0, name, false);
        trackEntry.trackTime = reconnect ? trackEntry.animationEnd : 0;
        child.getComponent(sp.Skeleton).setCompleteListener(() => {
            child.children[0].children[0].active = false;
            child.children[0].children[1].active = true;
        })
    }

    showResult() {
        let _odds = SevenUpSevenDownManager.OddString;
        for (let i = 0; i < this.node.children.length; i++) {
            let child = this.node.children[i];
            if (_odds[i] && +_odds[i]) {
                this.showDoubleAnimaton(child, 'end');
            }
        }
    }

    reset() {
        this.node.children.forEach(child => {
            child.active = false;
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
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomDouble';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomDouble.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomDouble.VIEW_NAME;
    }

    // @view export resource end
}
