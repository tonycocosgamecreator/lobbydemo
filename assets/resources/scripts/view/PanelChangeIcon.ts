// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import List from 'db://assets/resources/scripts/core/view/list-view';
import WalletManager from '../manager/wallet-manager';
import CustomIconItem from './CustomIconItem';
import SsPlayerManager from '../manager/ss-player-manager';
import ViewManager from '../core/manager/view-manager';
import { MessageSender } from '../network/net/message-sender';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import { GButtonTouchStyle, PanelLayer, ViewOpenAnimationType } from '../core/view/view-define';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelChangeIcon')
export default class PanelChangeIcon extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    public panelLayer: PanelLayer = PanelLayer.Dialog;
    protected _open_animation_type: ViewOpenAnimationType = ViewOpenAnimationType.CENTER_SCALE_IN;

    buildUi() {
        this.buttonLogout.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.buttonVerifty.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.labelbalance.string = WalletManager.balance.toFixed(2) + ' ' + WalletManager.currency;
        this.list.itemRender = (node: cc.Node, index: number) => {
            //渲染逻辑
            let comp = node.getComponent(CustomIconItem);
            if (!comp) {
                comp = node.addComponent(CustomIconItem);
                comp.bindResourceConfig();
            }
            comp.fillData(index);
        }
        this.list.numItems = 64;
        let _selectId = SsPlayerManager.Icon;
        this.list.selectedId = _selectId - 1;
        this._updateIcon([true, _selectId]);
        BaseGlobal.registerListeners(this, {
            [GameEvent.PLAYER_CHANGE_AVATAR]: this._updateIcon
        });
    }

    _updateIcon(data: [boolean, number]) {
        if (data[0] == false) {
            return;
        }
        this.sprIcon.spriteFrame = this.getSpriteFrame("textures/avatars/av-" + data[1] + "/spriteFrame");
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonVerifty(event: cc.EventTouch) {
        if (this.list.selectedId == SsPlayerManager.Icon - 1) return;
        const req: supersevenbaccarat.MsgUpdatePlayerDataReq = {
            icon: this.list.selectedId + 1
        }
        MessageSender.SendMessage(supersevenbaccarat.Message.MsgUpdatePlayerDataReq, req);
    }

    private onClickButtonLogout(event: cc.EventTouch) {
        ViewManager.ClosePanel('PanelChangeIcon');
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_bg: [cc.Sprite],
            cc_buttonLogout: [GButton, this.onClickButtonLogout.bind(this)],
            cc_buttonVerifty: [GButton, this.onClickButtonVerifty.bind(this)],
            cc_labelbalance: [cc.Label],
            cc_list: [List],
            cc_sprIcon: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected bg: cc.Sprite = null;
    protected buttonLogout: GButton = null;
    protected buttonVerifty: GButton = null;
    protected labelbalance: cc.Label = null;
    protected list: List = null;
    protected sprIcon: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelChangeIcon';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelChangeIcon.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelChangeIcon.VIEW_NAME;
    }
    // @view export resource end
}
