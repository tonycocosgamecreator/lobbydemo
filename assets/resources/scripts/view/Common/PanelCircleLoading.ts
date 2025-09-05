// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { PanelLayer } from '../../core/view/view-define';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

declare type CONTEXT = {
    info?: string;
};

@ccclass('PanelCircleLoading')
export default class PanelCircleLoading extends ViewBase {

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
     * 静态方法，请重写，以加入不同的层级
     */
    public panelLayer: PanelLayer = PanelLayer.Top;

    public context: CONTEXT | null = null;

    private buildUi() {
        cc.tween(this.icon.node)
            .by(5, {
                angle: 360,
            })
            .repeatForever()
            .start();
        if (this.context && this.context.info) {
            this.info.string = this.context.info;
        }
    }

    public updateInfo(info: string) {
        if (this.context) {
            this.context.info = info;
        }
        if (info) {
            this.info.string = info;
        }
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_icon: [cc.Sprite],
            cc_info: [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected icon: cc.Sprite = null;
    protected info: cc.Label = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelCircleLoading';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelCircleLoading.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelCircleLoading.VIEW_NAME;
    }
    // @view export resource end
}
