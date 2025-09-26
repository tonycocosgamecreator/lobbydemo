// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SsPlayerManager from '../manager/ss-player-manager';
import AudioManager from '../core/manager/audio-manager';
import ViewManager from '../core/manager/view-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;
const NORMAL_POS = cc.v3(540, 926.5, 0);
const OUT_POS = cc.v3(1482, 926.5, 0);

const TOGGLE_ICON_POS_OFF = cc.v3(-20, 0, 0);
const TOGGLE_ICON_POS_ON = cc.v3(20, 0, 0);
@ccclass('CustomMenu')
export default class CustomMenu extends ViewBase {

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

    protected buildUi() {
        this.buttonAvatar.useDefaultEffect();
        this.buttonSound.useDefaultEffect();
        this.buttonMusic.useDefaultEffect();
        this.toggle_spfs = [
            this.getSpriteFrame("textures/system/XFJ_Img_6"),
            this.getSpriteFrame("textures/system/XFJ_Img_7")
        ];
        this.updateToggles();
    }

    protected updateToggles() {
        const isSoundEnabled = AudioManager.isSoundEnabled;
        const isMusicEnabled = AudioManager.isMusicEnabled;
        this.buttonSound.icon = isSoundEnabled ? this.toggle_spfs[1] : this.toggle_spfs[0];
        this.buttonMusic.icon = isMusicEnabled ? this.toggle_spfs[1] : this.toggle_spfs[0];

        const soundIcon = this.buttonSound.iconNode;
        const musicIcon = this.buttonMusic.iconNode;
        soundIcon.position = isSoundEnabled ? TOGGLE_ICON_POS_ON : TOGGLE_ICON_POS_OFF;
        musicIcon.position = isMusicEnabled ? TOGGLE_ICON_POS_ON : TOGGLE_ICON_POS_OFF;
    }

    /**
     * 显示/隐藏
     * @param bShow 
     * @param duration 
     */
    public show(bShow: boolean, duration: number) {
        if (bShow) {
            this.LabelNickName.string = "aviator_" + SsPlayerManager.PlayId;
            this.playerHead.spriteFrame = this.getSpriteFrame(`textures/avatars/av-${SsPlayerManager.Icon}`);
        }
        if (duration <= 0) {
            this.node.active = bShow;
            if (!bShow) {
                this.root.position = OUT_POS;
            } else {
                this.root.position = NORMAL_POS;
            }
            return;
        }
        if (bShow) {
            this.node.active = true;
            this.root.position = OUT_POS;
            cc.tween(this.root)
                .to(duration, { position: NORMAL_POS }, { easing: cc.easing.backOut })
                .start();
        } else {
            cc.tween(this.root)
                .to(duration, { position: OUT_POS }, { easing: cc.easing.backIn })
                .call(() => {
                    this.node.active = false;
                })
                .start();
        }
    }

    public isShow(): boolean {
        return this.node.active;
    }



    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonBg(event: cc.EventTouch) {
        this.show(false, 0.35);
    }
    private onClickButtonAvatar(event: cc.EventTouch) {
        this.show(false, 0.35);
        ViewManager.OpenPanel(this.module, 'PanelChangeAvatar');
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
        this.show(false, 0.35);
        ViewManager.OpenPanel(this.module, 'PanelHistory');
    }
    private onClickButtonGameLimit(event: cc.EventTouch) {
        cc.log('on click event cc_buttonGameLimit');
        this.show(false, 0.35);
    }
    private onClickButtonGameRule(event: cc.EventTouch) {
        cc.log('on click event cc_buttonGameRule');
        this.show(false, 0.35);
    }
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_LabelNickName: [cc.Label],
            cc_buttonAvatar: [GButton, this.onClickButtonAvatar.bind(this)],
            cc_buttonBg: [GButton, this.onClickButtonBg.bind(this)],
            cc_buttonGameLimit: [GButton, this.onClickButtonGameLimit.bind(this)],
            cc_buttonGameRule: [GButton, this.onClickButtonGameRule.bind(this)],
            cc_buttonHistory: [GButton, this.onClickButtonHistory.bind(this)],
            cc_buttonMusic: [GButton, this.onClickButtonMusic.bind(this)],
            cc_buttonSound: [GButton, this.onClickButtonSound.bind(this)],
            cc_playerHead: [cc.Sprite],
            cc_root: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected LabelNickName: cc.Label = null;
    protected buttonAvatar: GButton = null;
    protected buttonBg: GButton = null;
    protected buttonGameLimit: GButton = null;
    protected buttonGameRule: GButton = null;
    protected buttonHistory: GButton = null;
    protected buttonMusic: GButton = null;
    protected buttonSound: GButton = null;
    protected playerHead: cc.Sprite = null;
    protected root: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomMenu';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomMenu.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomMenu.VIEW_NAME;
    }
    // @view export resource end
}
