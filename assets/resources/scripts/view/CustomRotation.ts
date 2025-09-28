// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomList, { Column } from 'db://assets/resources/scripts/view/CustomList';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import SuperSevenManager, { gameState, Gold } from '../manager/ss-manager';
import AudioManager from '../core/manager/audio-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomRotation')
export default class CustomRotation extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _gameState: gameState = gameState.None;
    _executeCount: number = 0;
    _rIndex: number = 0;
    _startIdx: number = 0;
    _matrix: number[] = [];
    _data: supersevenbaccarat.SpinInfo | null = null;
    _lineArr: number[][] = [];
    _flashArr: number[][][] = [];
    buildUi() {
        this._init();
        this._reset();
        BaseGlobal.registerListeners(this, {
            [GameEvent.STOP_ROTATION]: this._stopRotation,
            [GameEvent.UPDATE_STATE]: this._updateState,
        });
    }

    _init() {
        this.list0_node.setColumn(Column.Left);
        this.list1_node.setColumn(Column.Middle);
        this.list2_node.setColumn(Column.Right);
    }

    _updateState() {
        this._gameState = SuperSevenManager.State;
        switch (this._gameState) {
            case gameState.Ing:
                this._reset();
                this.spRotation.node.active = true;
                this.spRotation.timeScale = 1.8;
                this.spRotation.setAnimation(0, 'daiji', true);
                this._updateRotation();
                break;
            case gameState.Result:
                this._rotationEnd();
                break;
            case gameState.End:
                break;
        }
    }

    _reset() {
        this.spStar.node.active = false;
        this.spRotation.node.active = false;
        this.spZhou.node.active = false;
        this.spXingGuang.node.active = false;
        this.spjzlunzi.setAnimation(0, 'daiji', true);
    }

    _stopRotation() {
        this.unschedule(this.onCountdownComplete);
        this.rotation_list_node.children.forEach(child => {
            child.getComponent(CustomList).stopImmediately()
        });
    }

    _updateRotation() {
        this._data = SuperSevenManager.SpinInfo;
        this._rIndex++;
        this._startIdx = this._rIndex % 2 == 1 ? 3 : 0;
        this._matrix = this._data.matrix;
        this._flashArr = [];
        if (this._data.info && this._data.info.length) {
            let idx = 0;
            this._flashArr[0] = [[], [], []];
            for (let j = 0; j < this._data.info.length; j++) {
                idx++;
                if (!this._flashArr[idx]) this._flashArr[idx] = [];
                const line = this._data.info[j].line;
                for (let k = 0; k < line.length; k++) {
                    let _idx = line[k] == -1 ? -1 : line[k] > 2 ? this._startIdx : this._startIdx + 1
                    if (this._flashArr[0][k].indexOf(_idx) == -1) {
                        this._flashArr[0][k].push(_idx);
                    }
                    this._flashArr[idx][k] = [_idx];

                }
            }
        }
        const data = SuperSevenManager.LineArr;
        this._executeCount = 0;
        this.list0_node.setData(data[0], this._startIdx);
        this.list1_node.setData(data[1], this._startIdx);
        this.list2_node.setData(data[2], this._startIdx);
        if (SuperSevenManager.FreeGame || SuperSevenManager.Wild) {
            this.scheduleOnce(this.onCountdownComplete, 1.1);
        }
    }

    onCountdownComplete() {
        this.spZhou.node.active = true;
        let free = SuperSevenManager.FreeGame;
        let name = free ? 'mipai_lan' : 'mipai_huang'
        this.spZhou.setAnimation(0, name, true);
        AudioManager.playSound(this.bundleName, free ? '10109_scatter_notify' : '10109_3xwild_notify');
    }

    _rotationEnd() {
        if (this._data.award && this._data.award > 0) {
            let arr = [[], [], []];
            for (let i = 0; i < this._flashArr.length; i++) {
                arr[0].push(this._flashArr[i][0]);
                arr[1].push(this._flashArr[i][1]);
                arr[2].push(this._flashArr[i][2])
            }
            this.rotation_list_node.children.forEach((child, idx) => {
                child.getComponent(CustomList).flashAnimation(arr[idx])
            });
        }
        const gold = SuperSevenManager.Gold;
        const show = gold >= Gold.Big;
        this.spStar.node.active = show;
        this.spRotation.node.active = show;
        if (show) {
            this.spRotation.timeScale = 1;
            this.spRotation.setAnimation(0, 'caihong', true);
        }
        if (gold != Gold.None) {
            this.spjzlunzi.setAnimation(0, 'juanzhou2', true);
        }
        this.spZhou.node.active = false;
    }

    _playXingGuang() {
        this.spXingGuang.node.active = true;
        this.spXingGuang.setAnimation(0, 'animation', false);
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
            cc_list0_node: [CustomList],
            cc_list1_node: [CustomList],
            cc_list2_node: [CustomList],
            cc_rotation_list_node: [cc.Node],
            cc_spRotation: [cc.sp.Skeleton],
            cc_spStar: [cc.sp.Skeleton],
            cc_spXingGuang: [cc.sp.Skeleton],
            cc_spZhou: [cc.sp.Skeleton],
            cc_spjzlunzi: [cc.sp.Skeleton],
            cc_star_node: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected list0_node: CustomList = null;
    protected list1_node: CustomList = null;
    protected list2_node: CustomList = null;
    protected rotation_list_node: cc.Node = null;
    protected spRotation: cc.sp.Skeleton = null;
    protected spStar: cc.sp.Skeleton = null;
    protected spXingGuang: cc.sp.Skeleton = null;
    protected spZhou: cc.sp.Skeleton = null;
    protected spjzlunzi: cc.sp.Skeleton = null;
    protected star_node: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomRotation';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomRotation.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomRotation.VIEW_NAME;
    }
    // @view export resource end
}
