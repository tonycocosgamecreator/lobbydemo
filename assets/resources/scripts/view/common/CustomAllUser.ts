// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomLuckRankUser from 'db://assets/resources/scripts/view/common/CustomLuckRankUser';
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
    luckUserList: game.SUDSevenUpDownRankList[] = [];
    initPlayer() {
        this.onlineInRoom.updateOnlineInRoom();
        this.topUserList = CommonManager.getTopPlayerData();
        this.luckUserList = CommonManager.getLuckPlayerData();
        this.ndTopRankUser.children.forEach((child, idx) => {
            child.getComponent(CustomTopRankUser).init(idx, this.topUserList[idx] || null);
        })
        this.ndLuckRankUser.children.forEach((child, idx) => {
            child.getComponent(CustomLuckRankUser).init(idx, this.luckUserList[idx] || null);
        })
        this.otherUser.reset();
    }

    updatePlayer() {
        this.topUserList = CommonManager.getTopPlayerData();
        this.luckUserList = CommonManager.getLuckPlayerData();
        this.ndTopRankUser.children.forEach((child, idx) => {
            child.getComponent(CustomTopRankUser).updateUserHead(this.topUserList[idx] || null);
        })
        this.ndLuckRankUser.children.forEach((child, idx) => {
            child.getComponent(CustomLuckRankUser).updateUserHead(this.luckUserList[idx] || null);
        })
    }

    updateShowOtherUserIcon(data: betInfo) {
        let other = true;
        this.topUserList.forEach((value) => {
            if (value.player_id == data.player_id) {
                other = false;
            }
        });
        if (other) {
            this.luckUserList.forEach((value) => {
                if (value.player_id == data.player_id) {
                    other = false;
                }
            })
        }
        if (other) {
            this.otherUser.receiveData(data.icon);
        }
    }

    getWorldPosByUid(playerid: string): cc.Vec3 {
        let other = true;
        let wordPos = this.otherUser.node.parent.transform.convertToWorldSpaceAR(this.otherUser.node.position);
        this.topUserList.forEach((value: baccarat.RankList, idx: number) => {
            if (value.player_id == playerid) {
                other = false;
                const child = this.ndTopRankUser.children[idx];
                child.getComponent(CustomTopRankUser).playBetHeadAnimation();
                wordPos = child.parent.transform.convertToWorldSpaceAR(child.position);
            }
        })
        if (other) {
            this.luckUserList.forEach((value: game.SUDSevenUpDownRankList, idx: number) => {
                if (value.player_id == playerid) {
                    const child = this.ndLuckRankUser.children[idx];
                    child.getComponent(CustomLuckRankUser).playBetHeadAnimation();
                    wordPos = child.parent.transform.convertToWorldSpaceAR(child.position);
                }
            })
        }
        return wordPos;
    }

    updateResult() {
        this.ndTopRankUser.children.forEach((child) => {
            child.getComponent(CustomTopRankUser).updateResult();
        })
        this.ndLuckRankUser.children.forEach((child) => {
            child.getComponent(CustomLuckRankUser).updateResult();
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
            cc_l1: [CustomTopRankUser],
            cc_l2: [CustomTopRankUser],
            cc_l3: [CustomTopRankUser],
            cc_ndLuckRankUser: [cc.Node],
            cc_ndTopRankUser: [cc.Node],
            cc_onlineInRoom: [CustomOnlineInRoom],
            cc_otherUser: [CustomOtherBetUser],
            cc_r1: [CustomLuckRankUser],
            cc_r2: [CustomLuckRankUser],
            cc_r3: [CustomLuckRankUser],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected l1: CustomTopRankUser = null;
    protected l2: CustomTopRankUser = null;
    protected l3: CustomTopRankUser = null;
    protected ndLuckRankUser: cc.Node = null;
    protected ndTopRankUser: cc.Node = null;
    protected onlineInRoom: CustomOnlineInRoom = null;
    protected otherUser: CustomOtherBetUser = null;
    protected r1: CustomLuckRankUser = null;
    protected r2: CustomLuckRankUser = null;
    protected r3: CustomLuckRankUser = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomAllUser';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomAllUser.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomAllUser.VIEW_NAME;
    }
    // @view export resource end
}
