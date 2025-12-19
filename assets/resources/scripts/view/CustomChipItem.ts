// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { Color } from 'cc';
import ReusableBase from '../core/view/reusable-base';
import { UIOpacity } from 'cc';
import WalletManager from '../manager/wallet-manager';
import  { betInfo } from '../manager/sevenupsevendown-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomChipItem')
export default class CustomChipItem extends ReusableBase {

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

    _chipColor = ['#47506A', '#1A7401', '#1756A4', '#91017A', '#A31B09', '#A36407'];
    _info: betInfo = null;
    _startLocalPos: cc.Vec3;
    _type: number = 0;

    get StartLocalPos(): cc.Vec3 {
        return this._startLocalPos;
    }

    get ChipInfo(): betInfo {
        return this._info;
    }
    get Type(): number {
        return this._type;
    }
    /**
     * 设置筹码的样式
     * @param index 筹码类型
     */
    setBetData(index: number, info: betInfo, startLocalPos: cc.Vec3, type: number) {
        this._type = type;
        this._startLocalPos = startLocalPos;
        this._info = info;
        this.node.getComponent(UIOpacity).opacity = 255;
        this.spricon.spriteFrame = this.getSpriteFrame("textures/ui/AB_Img_" + (22 + index) + "/spriteFrame");
        let _chipButtons = WalletManager.getCurrencyBetSize();
        if (_chipButtons) {
            this.labeltitle.string = _chipButtons[index] ? _chipButtons[index] + '' : '';
        }
        this.labeltitle.color = new Color(this._chipColor[index]);
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
            cc_labeltitle: [cc.Label],
            cc_spricon: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected labeltitle: cc.Label = null;
    protected spricon: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomChipItem';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomChipItem.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomChipItem.VIEW_NAME;
    }
    // @view export resource end
}
