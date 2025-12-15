// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../../core/message/base-global';
import { GameEvent } from '../../define';
import CommonManager from '../../manager/common-manager';
import { UIOpacity } from 'cc';
import { Tween } from 'cc';
import { tween } from 'cc';
import { v3 } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomWin')
export default class CustomWin extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    protected update(dt: number): void {
        if (this._showAnimation) return;
        if (!this._list.length) return;
        this._showAnimation = true;
        const uiOpacity = this.ndBg.getComponent(UIOpacity);
        Tween.stopAllByTarget(this.ndBg);
        Tween.stopAllByTarget(uiOpacity);
        this.setData();
        this.ndBg.active = true;
        uiOpacity.opacity = 0;
        this.ndBg.setPosition(v3(0, -20, 0));
        cc.tween(this.ndBg)
            .parallel(
                tween().to(this._duration, { position: v3(0, 0, 0) }, { easing: 'cubicOut' }),
                tween().to(this._duration, { opacity: 255 })
            )
            .delay(this._displayTime)
            .parallel(
                tween().to(this._duration, { position: v3(0, 20, 0) }, { easing: 'cubicIn' }),
                tween().to(this._duration, { opacity: 0 })
            )
            .call(() => {
                CommonManager.subtractUserWinList();
                this.updateList();
                this._showAnimation = false;
            })
            .start();
    }
    //------------------------ 内部逻辑 ------------------------//
    _duration: number = 0.4; // 动画持续时间
    _list: wheel.MsgLastWinNtf[] = [];
    _showAnimation: boolean = false;
    _displayTime: number = 1; // 停留时间

    buildUi() {
        this.ndBg.active = false;
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_USERWIN]: this.updateList,
        });
    }

    setData() {
        const _data = this._list[0];
        this.sprHead.spriteFrame = this.getSpriteFrame(`textures/avatars/av-${_data.avatar || 1}`);
        this.labelName.string = _data.username;
        this.labelWin.string = `WIN+${_data.winAmount}`;
    }

    updateList() {
        this._list = CommonManager.UserWinList;
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
            cc_labelName: [cc.Label],
            cc_labelWin: [cc.Label],
            cc_ndBg: [cc.Node],
            cc_sprHead: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected labelName: cc.Label = null;
    protected labelWin: cc.Label = null;
    protected ndBg: cc.Node = null;
    protected sprHead: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomWin';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomWin.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomWin.VIEW_NAME;
    }
    // @view export resource end
}
