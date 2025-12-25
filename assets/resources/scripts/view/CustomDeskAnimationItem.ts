// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomDeskAnimationItem')
export default class CustomDeskAnimationItem extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _playAnimaton: boolean = false;

    playDoubleEnterAnimaton() {
        this.skeDouble.node.active = true;
        this._playAnimaton = true;
        const trackEntry = this.skeDouble.setAnimation(0, 'open', false);
        trackEntry.trackTime = 0;
        this.labelEnter.node.active = true;
        this.labelStandby.node.active = false;
        this.skeDouble.setCompleteListener(() => {
            this.labelEnter.node.active = false;
            this.labelStandby.node.active = true;
        })
    }

    playDoubleStandbyAnimaton() {
        this.skeDouble.node.active = true;
        this._playAnimaton = true;
        const trackEntry = this.skeDouble.setAnimation(0, 'open', false);
        trackEntry.trackTime = trackEntry.animationEnd;
        this.labelEnter.node.active = false;
        this.labelStandby.node.active = true;
    }

    playDoubleExitAnimaton() {
        if (!this._playAnimaton) return;
        const trackEntry = this.skeDouble.setAnimation(0, 'end', false);
        trackEntry.trackTime = 0;
        this.skeDouble.setCompleteListener(() => {
            this.skeDouble.node.active = false;
        })
    }

    playLiHuaAnimaton(areaId: number) {
        let name = (areaId == 6 || areaId == 12 || areaId == 13) ? 'animation' : 'animation2';
        this.skeLihua.node.active = true;
        this.skeLihua.setAnimation(0, name, false);

    }

    reset() {
        this.skeDouble.node.active = false;
        this.skeLihua.node.active = false;
        this._playAnimaton = false;
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
            cc_labelEnter: [cc.Label],
            cc_labelStandby: [cc.Label],
            cc_skeDouble: [cc.sp.Skeleton],
            cc_skeLihua: [cc.sp.Skeleton],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected labelEnter: cc.Label = null;
    protected labelStandby: cc.Label = null;
    protected skeDouble: cc.sp.Skeleton = null;
    protected skeLihua: cc.sp.Skeleton = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomDeskAnimationItem';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomDeskAnimationItem.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomDeskAnimationItem.VIEW_NAME;
    }
    // @view export resource end
}
