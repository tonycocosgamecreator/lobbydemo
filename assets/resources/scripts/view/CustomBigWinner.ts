// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../core/message/base-global';
import SevenUpSevenDownManager from '../manager/sevenupsevendown-manager';
import { GameEvent } from '../define';
import { Tween } from 'cc';
import { v3 } from 'cc';
import { tween } from 'cc';
import { easing } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomBigWinner')
export default class CustomBigWinner extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    _ids: number[] = [];
    localIdx = [v3(-17, 10, 0), v3(4, 10, 0), v3(25, 10, 0)];
    _showAnimation: boolean = false;

    buildUi() {
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_ONLINE_ROOM]: this.updateOnlineRoom,
        });
        this.reset();
        this.updateOnlineRoom();
    }

    updateOnlineRoom() {
        this.labelnum.string = SevenUpSevenDownManager.OnlineRoom + '';
    }

    init() {
        this._ids = [];
        this.resetBetPlayer();
        const data = SevenUpSevenDownManager.BigWinList;
        this.head_node.children.forEach((child, idx) => {
            const _d = data[idx];
            child.active = !!_d;
            if (_d) {
                child.getChildByName('labelcoin').getComponent(cc.Label).string = _d.balance + '';
                child.getChildByName('labelwin').getComponent(cc.Label).string = '';
                child.getChildByName('head').getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${_d.icon}`);
                this._ids.push(_d.player_id);
            }
        })
    }

    updatePlayer() {
        const data = SevenUpSevenDownManager.BigWinList;
        this.head_node.children.forEach((child, idx) => {
            const _d = data[idx];
            child.active = !!_d;
            if (_d) {
                child.getChildByName('labelcoin').getComponent(cc.Label).string = _d.balance + '';
                child.getChildByName('labelwin').getComponent(cc.Label).string = '';
                if (this._ids[idx] && this._ids[idx] != _d.player_id) {
                    const nd = child.getChildByName('head');
                    nd.eulerAngles = v3(0, 0, 0);
                    cc.tween(nd)
                        .to(0.2, { eulerAngles: v3(0, 90, 0) }, { easing: 'cubicInOut' })
                        .call(() => {
                            nd.eulerAngles = v3(0, -90, 0);
                            child.getChildByName('head').getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${_d.icon}`);
                        })
                        .to(0.2, { eulerAngles: v3(0, 0, 0) }, { easing: 'cubicInOut' })
                        .start();


                    this._ids[idx] = _d.player_id;
                } else {
                    this._ids[idx] = _d.player_id;
                    child.getChildByName('head').getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${_d.icon}`);
                }
            }
        })
    }

    resetBetPlayer() {
        this._showAnimation = false;
        this.spr_head_one.node.parent.active = false;
        this.spr_head_two.node.parent.active = false;
        this.spr_head_three.node.parent.active = false;
    }

    reset() {
        this.head_node.children.forEach((child, idx) => {
            child.active = false;
            Tween.stopAllByTarget(child.getChildByName('labelwin'));
            Tween.stopAllByTarget(child.getChildByName('head'))
        })
        this.resetBetPlayer();
    }

    getWorldPosByUid(player_id: number): cc.Vec3 {
        let node = this.rest_node;
        let wordPos = node.parent.transform.convertToWorldSpaceAR(node.position);
        this.head_node.children.forEach((child, idx) => {
            if (this._ids[idx] && this._ids[idx] == player_id) {
                node = child;
                const startPos = cc.v3(0, 0, 0);
                let target = node.getChildByName('head');
                Tween.stopAllByTarget(target);
                target.position = startPos;
                tween(target)
                    .by(0.05, { position: cc.v3(10, 5, 0) })
                    .by(0.05, { position: cc.v3(-8, -3, 0) })
                    .by(0.05, { position: cc.v3(6, 2, 0) })
                    .by(0.05, { position: cc.v3(-4, -1, 0) })
                    .by(0.05, { position: cc.v3(2, 0, 0) })
                    .call(() => {
                        target.position = startPos;
                    })
                    .start();
            }
        })
        return wordPos;
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
            cc_head_node: [cc.Node],
            cc_labelnum: [cc.Label],
            cc_rest_node: [cc.Node],
            cc_spr_head_one: [cc.Sprite],
            cc_spr_head_three: [cc.Sprite],
            cc_spr_head_two: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected head_node: cc.Node = null;
    protected labelnum: cc.Label = null;
    protected rest_node: cc.Node = null;
    protected spr_head_one: cc.Sprite = null;
    protected spr_head_three: cc.Sprite = null;
    protected spr_head_two: cc.Sprite = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomBigWinner';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomBigWinner.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomBigWinner.VIEW_NAME;
    }
    // @view export resource end
}
