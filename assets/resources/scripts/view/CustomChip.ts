// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import ReusableBase from '../core/view/reusable-base';
import { Color } from 'cc';
import { ChipColor, ChipCount } from '../define';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomChip')
export default class CustomChip extends ReusableBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    unuse(): void {
        // this.node.opacity = 255;
    }
    reuse(): void {

    }

    //------------------------ 内部逻辑 ------------------------//
    /**
    * 设置筹码的样式
    * @param index 筹码类型
    */
    setBetData(index: number) {
        this.icon.spriteFrame = this.getSpriteFrame("textures/AB_Img_" + (22+index) + "/spriteFrame");
        this.title.string = ChipCount[index] + '';
        this.title.color = new Color(ChipColor[index]);
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
            cc_icon: [cc.Sprite],
            cc_title: [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected icon: cc.Sprite = null;
    protected title: cc.Label = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomChip';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomChip.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomChip.VIEW_NAME;
    }

    // @view export resource end
}
