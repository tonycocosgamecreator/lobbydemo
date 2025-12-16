// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import { Tween } from 'cc';
import { UIOpacity } from 'cc';
import { v3 } from 'cc';
import { tween } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomWinTip')
export default class CustomWinTip extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    _duration: number = 0.4; // 动画持续时间
    _list: sevenupdown.MsgLastWinNtf[] = [];
    _showAnimation: boolean = false;
    _displayTime: number = 1; // 停留时间

    buildUi() {
        this.winbg_node.active = false;
        this.updateList();
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_LED]: this.updateList,
        });
    }
    setData() {
        const _data = this._list[0];
        this.spr_head.spriteFrame = this.getSpriteFrame(`textures/avatars/av-${_data.avatar || 1}`);
        let str = _data.username;
        if (str.length > 3) str = str.slice(0, 3) + '...';
        this.labelname.string = "Player_" + str;
        this.labelwin.string = 'WIN+' + _data.winAmount;
    }

    updateList() {
        this._list = SevenUpSevenDownManager.WinLedList;
    }

    protected update(dt: number): void {
        if (this._showAnimation) return;
        if (!this._list.length) return;
        this._showAnimation = true;
        const uiOpacity = this.winbg_node.getComponent(UIOpacity);
        Tween.stopAllByTarget(this.winbg_node);
        Tween.stopAllByTarget(uiOpacity);
        this.setData();
        this.winbg_node.active = true;
        uiOpacity.opacity = 0;
        this.winbg_node.setPosition(v3(0, -20, 0));
        tween(this.winbg_node)
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
                SevenUpSevenDownManager.subtractLedList();
                this.updateList();
                this._showAnimation = false;
            })
            .start();
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
            cc_labelname: [cc.Label],
            cc_labelwin: [cc.Label],
            cc_spr_head: [cc.Sprite],
            cc_winbg_node: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected labelname: cc.Label = null;
    protected labelwin: cc.Label = null;
    protected spr_head: cc.Sprite = null;
    protected winbg_node: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomWinTip';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomWinTip.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomWinTip.VIEW_NAME;
    }
    // @view export resource end
}
