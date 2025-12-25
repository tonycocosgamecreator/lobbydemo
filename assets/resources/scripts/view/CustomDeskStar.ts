// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import { Tween } from 'cc';
import { UIOpacity } from 'cc';
import GameManager from '../manager/game-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomDeskStar')
export default class CustomDeskStar extends ViewBase {

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
    _showAnimation: boolean = false;
    _duration: number = 0.3; // 动画持续时间
    _pId: string = '-1';

    buildUi() {
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_STAR]: this.updateAnimation,
        });
        this.reset()
    }

    updateGameStage(stage: number) {
        this._stage = stage;
    }

    updateAnimation(playid: string) {
        if (this._stage != baccarat.DeskStage.StartBetStage) return;
        if (this._showAnimation == true) return;
        this.reset();
        this._showAnimation = true;
        this._pId = playid;
        const info = GameManager.getBetInfoByPlayId(playid);
        let betid: number[] = [];
        for (let i = 0; i < info.length; i++) {
            const _d = info[i];
            if (_d.player_id == playid) {
                betid.push(_d.bet_id);
            }
        }
        betid = Array.from(new Set(betid));
        if (betid.length == 0) {
            return this._showAnimation = false;
        }
        betid.forEach((val) => {
            let child = this.node.children[val - 1];
            if (child) {
                const uiOpacity = child.getComponent(UIOpacity);
                uiOpacity.opacity = 0;
                cc.tween(uiOpacity)
                    .to(this._duration * 0.7, { opacity: 255 }, { easing: 'sineOut' })
                    .to(this._duration * 1.2, { opacity: 80 }, { easing: 'sineInOut' })
                    .to(this._duration * 0.7, { opacity: 255 }, { easing: 'sineOut' })
                    .to(this._duration * 1.2, { opacity: 0 }, { easing: 'sineInOut' })
                    .call(() => {
                        this._showAnimation = false;
                    })
                    .start()
            }
        })
    }

    reset() {
        this.node.children.forEach(child => {
            let u = child.getComponent(UIOpacity)
            Tween.stopAllByTarget(u);
            u.opacity = 0;
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
    public static readonly VIEW_NAME = 'CustomDeskStar';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomDeskStar.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomDeskStar.VIEW_NAME;
    }

    // @view export resource end
}
