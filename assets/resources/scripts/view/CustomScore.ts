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
    _gameState: gameState = gameState.None;
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
    _listName = ['', 'tr', 'do', '', '7h', '7l', 'b3', 'b2', 'b1', '']
    _rotationEnd() {
        let bbar = 0;
        let bItem = [];
        let mbar = 0;
        let mItem = [];
        let sbar = 0;
        let sItem = [];
        let rs = 0;
        let rsItem = [];
        let bs = 0;
        let bsItem = [];
        let seven = 0;
        let sevenItem = [];
        let bar = 0;
        let barItem = [];
        const data = SuperSevenManager.AwardLine;
        for (let i = 0; i < data.length; i++) {
            const arr = data[i];
            if (bbar != 3) {
                bbar = arr.filter(item => item === itemElement.BIGBAR).length;
                if (bbar < 3) {
                    let t = arr.filter(item => item === itemElement.TRIPLE).length;
                    bbar += t
                    if (bbar < 3) {
                        let d = arr.filter(item => item === itemElement.DOUBLE).length;
                        bbar += d;
                    }
                }
                if (bbar >= 3) {
                    bbar = 3;
                    bItem = arr.slice(0);
                }
            }
            if (mbar != 3) {
                mbar = arr.filter(item => item === itemElement.MIDDLEBAR).length;
                if (mbar < 3) {
                    let t = arr.filter(item => item === itemElement.TRIPLE).length;
                    mbar += t
                    if (mbar < 3) {
                        let d = arr.filter(item => item === itemElement.DOUBLE).length;
                        mbar += d
                    }
                }
                if (mbar >= 3) {
                    mbar = 3;
                    mItem = arr.slice(0);
                }
            }
            if (sbar != 3) {
                sbar = arr.filter(item => item === itemElement.SMALLBAR).length;
                if (sbar < 3) {
                    let t = arr.filter(item => item === itemElement.TRIPLE).length;
                    sbar += t
                    if (sbar < 3) {
                        let d = arr.filter(item => item === itemElement.DOUBLE).length;
                        sbar += d;
                    }
                }
                if (sbar >= 3) {
                    sbar = 3;
                    sItem = arr.slice(0);
                }
            }
            if (rs != 3) {
                rs = arr.filter(item => item === itemElement.REDSEVEN).length;
                if (rs < 3) {
                    let t = arr.filter(item => item === itemElement.TRIPLE).length;
                    rs += t
                    if (rs < 3) {
                        let d = arr.filter(item => item === itemElement.DOUBLE).length;
                        rs += d
                    }
                }
                if (rs >= 3) {
                    rs = 3;
                    rsItem = arr.slice(0);
                }
            }
            if (bs != 3) {
                bs = arr.filter(item => item === itemElement.BULESEVEN).length;
                if (bs < 3) {
                    let t = arr.filter(item => item === itemElement.TRIPLE).length;
                    bs += t
                    if (bs < 3) {
                        let d = arr.filter(item => item === itemElement.DOUBLE).length;
                        bs += d
                    }
                }
                if (bs >= 3) {
                    bs = 3;
                    bsItem = arr.slice(0);
                }
            }
            if (seven != 3) {
                let r = arr.filter(item => item === itemElement.REDSEVEN).length;
                let b = arr.filter(item => item === itemElement.BULESEVEN).length;
                if (r > 0 && b > 0) {
                    seven = r + b;
                    if (seven < 3) {
                        let t = arr.filter(item => item === itemElement.TRIPLE).length;
                        seven += t;
                        if (seven < 3) {
                            let d = arr.filter(item => item === itemElement.DOUBLE).length;
                            seven += d;
                        }
                    }
                    if (seven >= 3) {
                        seven = 3;
                        sevenItem = arr.slice(0);
                    }
                }
            }
            if (bar != 3) {
                let b = arr.filter(item => item === itemElement.BIGBAR).length;
                let m = arr.filter(item => item === itemElement.MIDDLEBAR).length;
                let s = arr.filter(item => item === itemElement.SMALLBAR).length;
                if (b != 3 && m != 3 && s != 3) {
                    if (b + m + s >= 3) {
                        bar = 3;
                        barItem = arr.slice(0);
                    } else if ((b + m + s == 2) && (b != 2 && m != 2 && s != 2)) {
                        bar = 2;
                        let t = arr.filter(item => item === itemElement.TRIPLE).length;
                        bar += t;
                        if (bar < 3) {
                            let d = arr.filter(item => item === itemElement.DOUBLE).length;
                            bar += d;
                        }
                    }
                    if (bar >= 3) {
                        bar = 3;
                        barItem = arr.slice(0);
                    }
                }
            }
        }
        if (bbar == 3) {
            this.b3_img_node.children.forEach((child, idx) => {
                Tween.stopAllByTarget(child);
                child.scale = new Vec3(1, 1, 1);
                child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', this._listName[bItem[idx]]);
                cc.tween(child)
                    .to(this.time, { scale: new Vec3(this.maxScale, this.maxScale, this.maxScale) })
                    .to(this.time, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            });
        }
        if (mbar == 3) {
            this.b2_img_node.children.forEach((child, idx) => {
                Tween.stopAllByTarget(child);
                child.scale = new Vec3(1, 1, 1);
                child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', this._listName[mItem[idx]]);
                cc.tween(child)
                    .to(this.time, { scale: new Vec3(this.maxScale, this.maxScale, this.maxScale) })
                    .to(this.time, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            });
        }
        if (sbar == 3) {
            this.b1_img_node.children.forEach((child, idx) => {
                Tween.stopAllByTarget(child);
                child.scale = new Vec3(1, 1, 1);
                child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', this._listName[sItem[idx]]);
                cc.tween(child)
                    .to(this.time, { scale: new Vec3(this.maxScale, this.maxScale, this.maxScale) })
                    .to(this.time, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            });
        }
        if (rs == 3) {
            this.b5_img_node.children.forEach((child, idx) => {
                Tween.stopAllByTarget(child);
                child.scale = new Vec3(1, 1, 1);
                child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', this._listName[rsItem[idx]]);
                cc.tween(child)
                    .to(this.time, { scale: new Vec3(this.maxScale, this.maxScale, this.maxScale) })
                    .to(this.time, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            });
        }
        if (bs == 3) {
            this.b6_img_node.children.forEach((child, idx) => {
                Tween.stopAllByTarget(child);
                child.scale = new Vec3(1, 1, 1);
                child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', this._listName[bsItem[idx]]);
                cc.tween(child)
                    .to(this.time, { scale: new Vec3(this.maxScale, this.maxScale, this.maxScale) })
                    .to(this.time, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            });
        }
        if (seven == 3) {
            this.b4_img_node.children.forEach((child, idx) => {
                Tween.stopAllByTarget(child);
                child.scale = new Vec3(1, 1, 1);
                child.active = true;
                child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', this._listName[sevenItem[idx]]);
                cc.tween(child)
                    .to(this.time, { scale: new Vec3(this.maxScale, this.maxScale, this.maxScale) })
                    .to(this.time, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            });
        }

        if (bar == 3) {
            this.b7_img_node.children.forEach((child, idx) => {
                Tween.stopAllByTarget(child);
                child.scale = new Vec3(1, 1, 1);
                child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', this._listName[barItem[idx]]);
                cc.tween(child)
                    .to(this.time, { scale: new Vec3(this.maxScale, this.maxScale, this.maxScale) })
                    .to(this.time, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            });

        }
    }

    _reset() {
        this.b3_img_node.children.forEach(child => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
            child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', this._listName[itemElement.BIGBAR]);
        });
        this.b2_img_node.children.forEach(child => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
            child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', this._listName[itemElement.MIDDLEBAR]);
        });
        this.b1_img_node.children.forEach(child => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
            child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', this._listName[itemElement.SMALLBAR]);
        });
        this.b4_img_node.children.forEach((child, idx) => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
            child.active = idx < 2;
            let name = idx % 2 == 0 ? '7h' : '7l';
            child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', name);
        });
        this.b5_img_node.children.forEach(child => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
            child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', this._listName[itemElement.REDSEVEN]);
        });
        this.b6_img_node.children.forEach((child, idx) => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
            child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', this._listName[itemElement.BULESEVEN]);
        });
        this.b7_img_node.children.forEach((child, idx) => {
            Tween.stopAllByTarget(child);
            child.scale = new Vec3(1, 1, 1);
            let name = idx == 0 ? 'b3' : idx == 1 ? 'b2' : 'b1';
            child.getComponentInChildren(cc.Sprite).spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/small_symbols', name);
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
