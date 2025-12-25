// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import AudioManager from '../core/manager/audio-manager';
import GameManager from '../manager/game-manager';
import ViewManager from '../core/manager/view-manager';
import { ViewOpenAnimationType } from '../core/view/view-define';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;
const TOGGLE_ICON_POS_OFF = cc.v3(-26, 0, 0);
const TOGGLE_ICON_POS_ON = cc.v3(26, 0, 0);
@ccclass('PanelGameMenu')
export default class PanelGameMenu extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    protected toggle_spfs: cc.SpriteFrame[] = [];
    protected _open_animation_type: ViewOpenAnimationType = ViewOpenAnimationType.CENTER_SCALE_IN;
    buildUi() {
        this.buttonAvatar.useDefaultEffect();
        // this.buttonSound.useDefaultEffect();
        // this.buttonMusic.useDefaultEffect();
        this.toggle_spfs = [
            this.getSpriteFrame("textures/system/XFJ_Img_7"),
            this.getSpriteFrame("textures/system/XFJ_Img_8")
        ];
        this.initData();
        this.updateToggles();
    }

    protected updateToggles() {
        const isSoundEnabled = AudioManager.isSoundEnabled;
        const isMusicEnabled = AudioManager.isMusicEnabled;
        this.buttonSound.node.getComponent(cc.Sprite).spriteFrame = isSoundEnabled ? this.toggle_spfs[1] : this.toggle_spfs[0];
        this.buttonMusic.node.getComponent(cc.Sprite).spriteFrame = isMusicEnabled ? this.toggle_spfs[1] : this.toggle_spfs[0];

        const soundIcon = this.buttonSound.iconNode;
        const musicIcon = this.buttonMusic.iconNode;
        soundIcon.position = isSoundEnabled ? TOGGLE_ICON_POS_ON : TOGGLE_ICON_POS_OFF;
        musicIcon.position = isMusicEnabled ? TOGGLE_ICON_POS_ON : TOGGLE_ICON_POS_OFF;
    }

    initData() {
        this.LabelNickName.string = "Player_" + GameManager.PlayerId;
        this.playerHead.spriteFrame = this.getSpriteFrame(`textures/avatars/av-${GameManager.Icon}`);
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {

        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonClose(event: cc.EventTouch) {
        this.close();
    }


    private onClickButtonAvatar(event: cc.EventTouch) {
        ViewManager.OpenPanel(this.module, 'PanelChangeAvatar', null, 'system');
        this.close();
    }


    private onClickButtonSound(event: cc.EventTouch) {
        let isSoundEnabled = AudioManager.isSoundEnabled;
        isSoundEnabled = !isSoundEnabled;
        AudioManager.isSoundEnabled = isSoundEnabled;
        this.updateToggles();
    }


    private onClickButtonMusic(event: cc.EventTouch) {
        let isMusicEnabled = AudioManager.isMusicEnabled;
        isMusicEnabled = !isMusicEnabled;
        AudioManager.isMusicEnabled = isMusicEnabled;
        this.updateToggles();
    }


    private onClickButtonHistory(event: cc.EventTouch) {
        ViewManager.OpenPanel(this.module, 'PanelHistory', null, 'system');
        this.close();
    }


    private onClickButtonGameRule(event: cc.EventTouch) {
        ViewManager.OpenPanel(this.module, 'PanelGameRule', null, 'system');
        this.close();
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_LabelNickName: [cc.Label],
            cc_buttonAvatar: [GButton, this.onClickButtonAvatar.bind(this)],
            cc_buttonClose: [GButton, this.onClickButtonClose.bind(this)],
            cc_buttonGameRule: [GButton, this.onClickButtonGameRule.bind(this)],
            cc_buttonHistory: [GButton, this.onClickButtonHistory.bind(this)],
            cc_buttonMusic: [GButton, this.onClickButtonMusic.bind(this)],
            cc_buttonSound: [GButton, this.onClickButtonSound.bind(this)],
            cc_playerHead: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected LabelNickName: cc.Label = null;
    protected buttonAvatar: GButton = null;
    protected buttonClose: GButton = null;
    protected buttonGameRule: GButton = null;
    protected buttonHistory: GButton = null;
    protected buttonMusic: GButton = null;
    protected buttonSound: GButton = null;
    protected playerHead: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelGameMenu';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelGameMenu.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelGameMenu.VIEW_NAME;
    }
    // @view export resource end
}
