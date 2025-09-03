// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import SuperSevenManager, { gameState, itemElement } from '../manager/ss-manager';
import { Tween } from 'cc';
import { Vec3 } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomScore')
export default class CustomScore extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi()
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    //------------------------ 内部逻辑 ------------------------//
    _gameState: gameState = gameState.End;
    maxScale: number = 1.1;
    time: number = 0.8;
    buildUi() {
        this._updateBet();
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_BET]: this._updateBet,
            [GameEvent.UPDATE_STATE]: this._updateState,
        });
    }

    _updateBet() {
        const _betCoin = SuperSevenManager.BetCoin;
        this.labelb4.string = SuperSevenManager.Text(_betCoin * 20000 / 10000);
        this.labelb3.string = SuperSevenManager.Text(_betCoin * 10000 / 10000);
        this.labelb2.string = SuperSevenManager.Text(_betCoin * 5000 / 10000);
        this.labelb1.string = SuperSevenManager.Text(_betCoin * 3000 / 10000);
        this.labelb5.string = SuperSevenManager.Text(_betCoin * 50000 / 10000);
        this.labelb6.string = SuperSevenManager.Text(_betCoin * 30000 / 10000);
        this.labelb7.string = SuperSevenManager.Text(_betCoin * 2000 / 10000);
    }

    _updateState() {
        this._gameState = SuperSevenManager.State;
        switch (this._gameState) {
            case gameState.Ing:
                this._reset();
                break;
            case gameState.Result:
                this._rotationEnd();
                break;
            case gameState.End:
                break;
        }
    }
    _rotationEnd() {
        let bbar = 0;
        let sbar = 0;
        let mbar = 0;
        let rs = 0;
        let bs = 0;
        let seven = 0;
        let bar = 0;
        const data = SuperSevenManager.LineArr;
        for (let i = 0; i < data.length; i++) {
            const arr = data[i];
            if (arr.indexOf(itemElement.BIGBAR) != -1) {
                bbar++;
                bar++;
            }
            if (arr.indexOf(itemElement.MIDDLEBAR) != -1) {
                mbar++;
                bar++;
            }
            if (arr.indexOf(itemElement.SMALLBAR) != -1) {
                sbar++;
                bar++;
            }
            if (arr.indexOf(itemElement.REDSEVEN) != -1) {
                rs++;
                seven++
            }
            if (arr.indexOf(itemElement.BULESEVEN) != -1) {
                bs++;
                seven++;
            }
        }
        if (bbar == 3) {
            this.b3_img_node.children.forEach(child => {
                Tween.stopAllByTarget(child);
                child.scale = new Vec3(1, 1, 1);
                cc.tween(child)
                    .to(this.time, { scale: new Vec3(this.maxScale, this.maxScale, this.maxScale) })
                    .to(this.time, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            });
        }
        if (mbar == 3) {
            this.b2_img_node.children.forEach(child => {
                Tween.stopAllByTarget(child);
                child.scale = new Vec3(1, 1, 1);
                cc.tween(child)
                    .to(this.time, { scale: new Vec3(this.maxScale, this.maxScale, this.maxScale) })
                    .to(this.time, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            });
        }
        if (sbar == 3) {
            this.b1_img_node.children.forEach(child => {
                Tween.stopAllByTarget(child);
                child.scale = new Vec3(1, 1, 1);
                cc.tween(child)
                    .to(this.time, { scale: new Vec3(this.maxScale, this.maxScale, this.maxScale) })
                    .to(this.time, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            });
        }
        if (rs == 3) {
            this.b5_img_node.children.forEach(child => {
                Tween.stopAllByTarget(child);
                child.scale = new Vec3(1, 1, 1);
                cc.tween(child)
                    .to(this.time, { scale: new Vec3(this.maxScale, this.maxScale, this.maxScale) })
                    .to(this.time, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            });
        }
        if (bs == 7) {
            this.b6_img_node.children.forEach(child => {
                Tween.stopAllByTarget(child);
                child.scale = new Vec3(1, 1, 1);
                cc.tween(child)
                    .to(this.time, { scale: new Vec3(this.maxScale, this.maxScale, this.maxScale) })
                    .to(this.time, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            });
        }
        if (seven >= 2) {

        }
        if (bar >= 2) {

        }
    }

    _reset() {
        this.b3_img_node.children.forEach(child => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
        });
        this.b2_img_node.children.forEach(child => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
        });
        this.b1_img_node.children.forEach(child => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
        });
        this.b4_img_node.children.forEach((child, idx) => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
            child.active = idx < 2;
            let name = idx % 2 == 0 ? '7h' : '7l';
            child.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', name);
        });
        this.b5_img_node.children.forEach(child => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
        });
        this.b6_img_node.children.forEach((child, idx) => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
        });
        this.b7_img_node.children.forEach((child, idx) => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
            let name = idx == 0 ? 'b3' : idx == 1 ? 'b2' : 'b1';
            child.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', name);
        });
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
            cc_b1_img_node: [cc.Node],
            cc_b1_node: [cc.Node],
            cc_b2_img_node: [cc.Node],
            cc_b2_node: [cc.Node],
            cc_b3_img_node: [cc.Node],
            cc_b3_node: [cc.Node],
            cc_b4_any_node: [cc.Sprite],
            cc_b4_img_node: [cc.Node],
            cc_b4_node: [cc.Node],
            cc_b5_img_node: [cc.Node],
            cc_b5_node: [cc.Node],
            cc_b6_img_node: [cc.Node],
            cc_b6_node: [cc.Node],
            cc_b7_any_node: [cc.Sprite],
            cc_b7_img_node: [cc.Node],
            cc_b7_node: [cc.Node],
            cc_labelb1: [cc.Label],
            cc_labelb2: [cc.Label],
            cc_labelb3: [cc.Label],
            cc_labelb4: [cc.Label],
            cc_labelb5: [cc.Label],
            cc_labelb6: [cc.Label],
            cc_labelb7: [cc.Label],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected b1_img_node: cc.Node = null;
    protected b1_node: cc.Node = null;
    protected b2_img_node: cc.Node = null;
    protected b2_node: cc.Node = null;
    protected b3_img_node: cc.Node = null;
    protected b3_node: cc.Node = null;
    protected b4_any_node: cc.Sprite = null;
    protected b4_img_node: cc.Node = null;
    protected b4_node: cc.Node = null;
    protected b5_img_node: cc.Node = null;
    protected b5_node: cc.Node = null;
    protected b6_img_node: cc.Node = null;
    protected b6_node: cc.Node = null;
    protected b7_any_node: cc.Sprite = null;
    protected b7_img_node: cc.Node = null;
    protected b7_node: cc.Node = null;
    protected labelb1: cc.Label = null;
    protected labelb2: cc.Label = null;
    protected labelb3: cc.Label = null;
    protected labelb4: cc.Label = null;
    protected labelb5: cc.Label = null;
    protected labelb6: cc.Label = null;
    protected labelb7: cc.Label = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomScore';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomScore.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomScore.VIEW_NAME;
    }
    // @view export resource end
}
