// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import SuperSevenManager from '../manager/ss-manager';
import { Tween } from 'cc';
import { v3 } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;
export enum ShowSpineName {
    '10109_symbols_wild_3' = '3xwild_win',
    '10109_symbols_wild_2' = '2xwild_win',
    '10109_symbols_scatter' = 'scatter_win',
    '10109_symbols_7_red' = 'M1',
    '10109_symbols_7_blue' = 'M2',
    '10109_symbols_bar_3' = 'M3',
    '10109_symbols_bar_2' = 'M4',
    '10109_symbols_bar_1' = 'M5',
    '10109_symbols_cherry' = 'M6',
}
export enum DisableSpineName {
    '10109_symbols_wild_3' = '3xwild_win',
    '10109_symbols_wild_2' = '2xwild_win',
    '10109_symbols_scatter' = 'scatter_jili',
    '10109_symbols_7_red' = 'M1',
    '10109_symbols_7_blue' = 'M2',
    '10109_symbols_bar_3' = 'M3',
    '10109_symbols_bar_2' = 'M4',
    '10109_symbols_bar_1' = 'M5',
    '10109_symbols_cherry' = 'M6',
}
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
    _name: string = '';
    _idx: number = -1;
    _show: boolean = false;
    set Index(value: number) {
        this._idx = value;
    }
    // @ViewBase.requireResourceLoaded
    setData(name: string, show: boolean = false) {
        this.reset();
        this._show = show;
        this._name = name;
        this.sprImg.spriteFrame = this.getSpriteFrameBySpriteAtlas('plists/10109_symbols', name);
    }

    flashAnimation(arr: number[]) {
        if (this._name == '' || this._idx == -1) return;
        let inclue = arr.indexOf(this._idx) != -1;
        let name = inclue ? ShowSpineName[this._name] : DisableSpineName[this._name];
        this.reset()
        this.sprImg.node.active = false;
        if (name.includes('M')) {
            if (inclue) {
                this.spSkeleton.setAnimation(0, name, true);
            } else {
                const trackEntry = this.spSkeleton.setAnimation(0, name, false);
                trackEntry.trackTime = trackEntry.animationEnd;
            }
            this.spSkeleton.node.scale = name == 'M6' ? v3(1.36, 1.36, 1.36) : v3(1.24, 1.24, 1.24);
            this.spSkeleton.node.active = true;
        } else {
            if (inclue) {
                if (name == 'scatter_win') {
                    const count = SuperSevenManager.CurFreeCount;
                    this.spGuang.node.active = count > 0;
                    this.node.setSiblingIndex(this.node.parent.children.length - 1);
                }
                this.spSymbol.setAnimation(0, name, true);
            } else {
                const trackEntry = this.spSymbol.setAnimation(0, name, false);
                trackEntry.trackTime = trackEntry.animationEnd;
            }
            this.spSymbol.node.active = true;
        }
    }

    showFeeAnimation() {
        if (this._name == '' || this._idx == -1) return;
        if (!this._show) return;
        if (this._name != '10109_symbols_scatter' && this._name != '10109_symbols_wild_3') return;
        const node = this.sprImg.node.parent;
        cc.tween(node).to(0.05, {
            scale: v3(1.2, 1.2, 1.2)
        }).to(0.05, {
            scale: v3(1, 1, 1)
        }).start();
    }

    init() {
        Tween.stopAllByTarget(this.sprImg.node.parent);
        this.sprImg.node.parent.scale = v3(1, 1, 1);
    }

    reset() {
        this.spSkeleton.setCompleteListener(null);
        this.spSymbol.setCompleteListener(null);
        this.spSkeleton.clearTracks();
        this.spSymbol.clearTracks();
        this.sprImg.node.active = true;
        this.spSkeleton.node.active = false;
        this.spSymbol.node.active = false;
        this.spGuang.node.active = false;
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
            cc_spGuang: [cc.sp.Skeleton],
            cc_spSkeleton: [cc.sp.Skeleton],
            cc_spSymbol: [cc.sp.Skeleton],
            cc_sprImg: [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected spGuang: cc.sp.Skeleton = null;
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
