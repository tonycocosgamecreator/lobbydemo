// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import List from 'db://assets/resources/scripts/core/view/list-view';
import { ViewOpenAnimationType } from '../../core/view/view-define';
import UIHelper from '../../network/helper/ui-helper';
import { MessageSender } from '../../network/net/message-sender';
import GameManager from '../../manager/game-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelChangeAvatar')
export default class PanelChangeAvatar extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    protected _open_animation_type: ViewOpenAnimationType = ViewOpenAnimationType.BOTTOM_TO_CENTER;
    protected buildUi() {
        const player_avatar_id = GameManager.Icon;

        this.listAvatars.itemRender = (item: cc.Node, index: number) => {
            const id = index + 1;
            const spf = this.getSpriteFrame(`textures/avatars/av-${id}`);
            const spr = item.getChildByName('icon').getComponent(cc.Sprite);
            spr.spriteFrame = spf;
            const select = item.getChildByName('selected');
            select.active = (id == player_avatar_id);
            item.active = true;
        };
        this.listAvatars.registerItemClickCallback((item: cc.Node, index: number) => {
            //选中
            const id = index + 1;
            if (id != player_avatar_id) {
                const req: game.MsgUpdatePlayerDataReq = {
                    icon: id
                }
                MessageSender.SendMessage(game.Message.MsgUpdatePlayerDataReq, req);
            }
        });
        this.listAvatars.numItems = 64;
    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        if (msgType == game.Message.MsgUpdatePlayerDataRsp) {
            const msg = data as game.MsgUpdatePlayerDataRsp;
            if (msg && msg.err_code != commonrummy.RummyErrCode.EC_SUCCESS) {
                //更新失败了
                UIHelper.showToastId(resourcesDb.I18N_RESOURCES_DB_INDEX.AVATAR_CHANGED_FAILED);
                return;
            }
            //更新成功了
            GameManager.Icon = msg.icon || 1;
            this.close();
            return true;
        }
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonOk(event: cc.EventTouch) {
        this.close();
    }
    private onClickButtonClose(event: cc.EventTouch) {
        this.close();
    }
    // @view export event end


    // @view export resource begin

    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_bg: [cc.Node],
            cc_buttonClose: [GButton, this.onClickButtonClose.bind(this)],
            cc_buttonOk: [GButton, this.onClickButtonOk.bind(this)],
            cc_listAvatars: [List],
            cc_okTitle_i18n: [cc.Label],
            cc_root: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected bg: cc.Node = null;
    protected buttonClose: GButton = null;
    protected buttonOk: GButton = null;
    protected listAvatars: List = null;
    protected okTitle_i18n: cc.Label = null;
    protected root: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelChangeAvatar';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelChangeAvatar.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelChangeAvatar.VIEW_NAME;
    }

    // @view export resource end
}
