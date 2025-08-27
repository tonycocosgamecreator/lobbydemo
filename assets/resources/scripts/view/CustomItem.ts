// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SuperSevenManager from '../manager/ss-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomItem')
export default class CustomItem extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    @ViewBase.requireResourceLoaded
    setData(name: string) {
        this.reset()
        this.sprImg.spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/10109_symbols', name);
    }

    flashAnimation(name: string) {
        if (name.includes('M')) {
            this.spSkeleton.setAnimation(0, name, true);
            this.spSkeleton.node.active = true;
        } else {
            this.spSymbol.setAnimation(0, name, true);
            this.spSymbol.node.active = true;
        }
        this.scheduleOnce(() => {
            this.reset();
        }, 0.2)
    }

    reset() {
        this.spSkeleton.node.active = false;
        this.spSymbol.node.active = false;
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
            cc_spSkeleton: [cc.sp.Skeleton],
            cc_spSymbol: [cc.sp.Skeleton],
            cc_sprImg: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected spSkeleton: cc.sp.Skeleton = null;
    protected spSymbol: cc.sp.Skeleton = null;
    protected sprImg: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomItem';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomItem.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomItem.VIEW_NAME;
    }
    // @view export resource end
}
