// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomOnlineInRoom from 'db://assets/resources/scripts/view/common/CustomOnlineInRoom';
import CustomOtherBetUser from 'db://assets/resources/scripts/view/common/CustomOtherBetUser';
import CustomTopRankUser from 'db://assets/resources/scripts/view/common/CustomTopRankUser';
import CommonManager, { betInfo } from '../../manager/common-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomAllUser')
export default class CustomAllUser extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    topUserList: baccarat.RankList[] = [];
    initPlayer() {
        this.onlineInRoom.updateOnlineInRoom();
        this.topUserList = CommonManager.getTopPlayerData();
        this.ndTopRankUser.children.forEach((child, idx) => {
            child.getComponent(CustomTopRankUser).init(idx, this.topUserList[idx] || null);
        })
        this.otherUser.reset();
    }

    updatePlayer() {
        this.topUserList = CommonManager.getTopPlayerData();
        this.ndTopRankUser.children.forEach((child, idx) => {
            child.getComponent(CustomTopRankUser).updateUserHead(this.topUserList[idx] || null);
        })
    }

    updateShowOtherUserIcon(data: betInfo) {
        let other = true;
        this.topUserList.forEach((value) => {
            if (value.player_id == data.player_id) {
                other = false;
            }
        })
        if (other) {
            this.otherUser.receiveData(data.icon);
        }
    }

    getWorldPosByUid(playerid: string): cc.Vec3 {
        let wordPos = this.otherUser.node.parent.transform.convertToWorldSpaceAR(this.otherUser.node.position);;
        this.topUserList.forEach((value: baccarat.RankList, idx: number) => {
            if (value.player_id == playerid) {
                const child = this.ndTopRankUser.children[idx];
                child.getComponent(CustomTopRankUser).playBetHeadAnimation();
                wordPos = child.parent.transform.convertToWorldSpaceAR(child.position);
            }
        })
        return wordPos
    }

    updateResult() {
        this.ndTopRankUser.children.forEach((child, idx) => {
            child.getComponent(CustomTopRankUser).updateResult();
        })
    }

    clearOtherUser() {
        this.otherUser.reset();
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
            cc_ndTopRankUser    : [cc.Node],
            cc_onlineInRoom    : [CustomOnlineInRoom],
            cc_otherUser    : [CustomOtherBetUser],
            cc_r1    : [CustomTopRankUser],
            cc_r2    : [CustomTopRankUser],
            cc_r3    : [CustomTopRankUser],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected ndTopRankUser: cc.Node    = null;
   protected onlineInRoom: CustomOnlineInRoom    = null;
   protected otherUser: CustomOtherBetUser    = null;
   protected r1: CustomTopRankUser    = null;
   protected r2: CustomTopRankUser    = null;
   protected r3: CustomTopRankUser    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomAllUser';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomAllUser.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomAllUser.VIEW_NAME;
    }
    // @view export resource end
}
