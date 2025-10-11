// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { lobbyhttp } from '../lobby/net/lobby-https-interface-define';
import ReusableBase from '../core/view/reusable-base';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomGameItem')
export default class CustomGameItem extends ReusableBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    unuse(): void {

    }

    reuse(): void {

    }

    //------------------------ 内部逻辑 ------------------------//
    private _data: lobbyhttp.ICateGame = null;
    private _onClickButtonCallback: (game_code: string) => void = null;

    setData(data: lobbyhttp.ICateGame) {
        this._data = data;
        this.labelName.string = data.game_code;
        this.buttonIcon.node.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/icon/${data.game_code}`);
    }

    clear() {
        this._onClickButtonCallback = null;
    }

    public registerClickButtonCallback(callback: (game_code: string) => void) {
        this._onClickButtonCallback = callback;
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonIcon(event: cc.EventTouch) {
        this._onClickButtonCallback && this._onClickButtonCallback(this._data.game_code);
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonIcon: [GButton, this.onClickButtonIcon.bind(this)],
            cc_labelName: [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonIcon: GButton = null;
    protected labelName: cc.Label = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomGameItem';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomGameItem.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomGameItem.VIEW_NAME;
    }
    // @view export resource end
}
