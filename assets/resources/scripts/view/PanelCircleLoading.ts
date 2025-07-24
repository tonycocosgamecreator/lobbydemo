// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

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

    protected lateUpdate(dt: number): void {
        if (this._isTimeOut) {
            return;
        }
        this.nowTime += dt;
        if (this.nowTime >= this.waittime) {
            this._isTimeOut = true;
            bDebug && cc.warn(`PanelWaitload 超时了，等待时间为 ${this.waittime} 秒`);
            //超时了
            this.close();
        }
    }

    //------------------------ 内部逻辑 ------------------------//

    /**
     * 超时自动关闭的时间
     */
    protected waittime: number = 20;
    /**
     * 当前时间
     * 用于计算超时
     */
    protected nowTime: number = 0;
    /**
     * 是否超时
     * 用于判断是否需要关闭界面
     */
    protected _isTimeOut: boolean = false;

    protected buildUi() {
        this.resetTimeOut(20);
    }


    public updateInfo(msg: string, timeout: number = 20) {
        if (this.labelTips) {
            this.labelTips.string = msg;
        }
        this.resetTimeOut(timeout);
    }

    /**
     * 重置超时时间,用于已经打开这个界面的情况下，再次被调用
     * @param time 
     */
    public resetTimeOut(time: number): void {
        this.waittime = time;
        this.nowTime = 0;
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
            cc_labelTips: [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected labelTips: cc.Label = null;
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
