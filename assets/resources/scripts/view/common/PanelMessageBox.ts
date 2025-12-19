// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end
//为了防止被自动化覆盖，单独拿出来引用
import { PanelLayer, UIConfirmContext, ViewOpenAnimationType } from '../../core/view/view-define';

const { ccclass, property } = cc._decorator;

declare type CONTEXT = UIConfirmContext;

@ccclass('PanelMessageBox')
export default class PanelMessageBox extends ViewBase {
    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    //------------------------ 内部逻辑 ------------------------//
    /**
     * 当前上下文参数
     */
    public context: CONTEXT | null = null;

    /**
     * 静态方法，请重写，以加入不同的层级
     */
    public panelLayer: PanelLayer = PanelLayer.Dialog;

    /**
     * 界面开启效果
     */
    protected _open_animation_type: ViewOpenAnimationType = ViewOpenAnimationType.BOTTOM_TO_CENTER;

    private buildUi() {
        if (this.context.title && this.context.title != '') {
            this.title_i18n.string = this.context.title;
        }
        this.labelContent.string = this.context.value;

        //不显示x按钮
        if (this.context.bNotShowCloseButton) {
            this.buttonClose.node.active = false;
        }
        //只显示一个按钮
        if (this.context.bSingleButton) {
            this.buttonCancel.node.active = false;
        }
        const sButtonTitles = this.context.sButtonTitles;
        if (sButtonTitles) {
            const sOk = sButtonTitles[0];
            const sCancel = sButtonTitles[1];
            if (sOk && sOk != '') {
                this.buttonOk.title = sOk;
            }
            if (sCancel && sCancel != '') {
                this.buttonCancel.title = sCancel;
            }
        }
    }

    private _doConfirm(yes: boolean) {
        const handle = yes ? this.context.yesHandler : this.context.noHandler;
        handle && handle();
        this.close();
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
        this._doConfirm(false);
    }
    private onClickButtonOk(event: cc.EventTouch) {
        this._doConfirm(true);
    }
    private onClickButtonCancel(event: cc.EventTouch) {
        this._doConfirm(false);
    }
    // @view export event end

    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_bg    : [cc.Sprite],
            cc_buttonCancel    : [GButton,this.onClickButtonCancel.bind(this)],
            cc_buttonClose    : [GButton,this.onClickButtonClose.bind(this)],
            cc_buttonOk    : [GButton,this.onClickButtonOk.bind(this)],
            cc_cancelTitle_i18n    : [cc.Label],
            cc_labelContent    : [cc.Label],
            cc_okTitle_i18n    : [cc.Label],
            cc_title_i18n    : [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected bg: cc.Sprite    = null;
   protected buttonCancel: GButton    = null;
   protected buttonClose: GButton    = null;
   protected buttonOk: GButton    = null;
   protected cancelTitle_i18n: cc.Label    = null;
   protected labelContent: cc.Label    = null;
   protected okTitle_i18n: cc.Label    = null;
   protected title_i18n: cc.Label    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'PanelMessageBox';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return PanelMessageBox.BUNDLE_NAME;
    }
   public get viewName(){
        return PanelMessageBox.VIEW_NAME;
    }
    // @view export resource end
}
