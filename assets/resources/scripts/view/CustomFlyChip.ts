// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { Node } from 'cc';
import { Vec3 } from 'cc';
import { tween } from 'cc';
import { v3 } from 'cc';
import PoolManager from '../core/manager/pool-manager';
import { Tween } from 'cc';
import CustomChipItem from './CustomChipItem';
import { UIOpacity } from 'cc';
import SevenUpSevenDownManager, { betInfo } from '../manager/sevenupsevendown-manager';
import AudioManager from '../core/manager/audio-manager';
import WalletManager from '../manager/wallet-manager';
import { Global } from '../global';
import { GameEvent } from '../define';
import { BaseMessage } from '../core/message/base-message';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;


@ccclass('CustomFlyChip')
export default class CustomFlyChip extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _isGameInBackground: boolean = false;
    _baseDuration: number = 0.2; // 基础飞行时间(用于基准距离)
    _baseDistance: number = 300; // 基准距离(像素)   
    // _targetScale: number = 0.5;
    _stage = -1;
    _chipButtons: number[] = [];
    _playId = '';
    view = null;
    _max = [v3(0.7, 0.7, 0.7), v3(0.6, 0.6, 0.6)];
    _rs = [v3(0.6, 0.6, 0.6), v3(0.5, 0.5, 0.5)]
    _min = [v3(0.5, 0.5, 0.5), v3(0.4, 0.4, 0.4)];
    private _chips: Map<number, betInfo[]> = new Map();
    private _count = [];
    _losePos
    getRandomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    buildUi() {
        this.reset();
        this._chipButtons = WalletManager.getCurrencyBetSize();
        this._playId = SevenUpSevenDownManager.PlayerId;
        Global.registerListeners(
            this,
            {
                [BaseMessage.ON_ENTER_FORGOUND]: () => {
                    this._isGameInBackground = false;
                },
                [BaseMessage.ON_ENTER_BACK_GROUND]: () => {
                    this._isGameInBackground = true;
                }
            }
        );
    }

    reset() {
        for (let i = 0; i < this.node.children.length; i++) {
            let child = this.node.children[i];
            this._clearChip(child);
            i--;
        }
        this._chips.clear();
        for (let i = 0; i < 14; i++) {
            this._count[i] = i == 6 || i == 12 || i == 13 ? this.getRandomInRange(15, 20) : this.getRandomInRange(5, 8);
        }
    }

    updateGameStage(reconnect: boolean = false) {
        this._stage = SevenUpSevenDownManager.Stage;
        if (reconnect) {
            this.view = SevenUpSevenDownManager.View;
            const losePos = this.view.getUserLoseWorldPos();
            this._losePos = this.node.transform.convertToNodeSpaceAR(losePos);
        }
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this.reset();
                break
            case baccarat.DeskStage.StartBetStage:
            case baccarat.DeskStage.EndBetStage:
            case baccarat.DeskStage.OpenStage:
                if (reconnect) {
                    this.reset();
                    const info = SevenUpSevenDownManager.AllbetInfo;
                    for (let i = 0; i < info.length; i++) {
                        this.init(info[i], false, false, -1)
                    }
                }
                break
            case baccarat.DeskStage.SettleStage:

                break;
        }
    }

    init(data: betInfo, isFly: boolean = false, isme: boolean = false, order: number) {
        let index = 0
        this._chipButtons.forEach((value, idx) => {
            if (+data.bet_coin == value) index = idx;
        })
        let start = this.view.getUserWorldPosByUid(data.player_id, data.icon);
        let end = this.view.getDeskWorldPosByIdx(data.bet_id, isme, order);
        let type = (data.bet_id == 6 || data.bet_id == 12 || data.bet_id == 13) ? 0 : 1;
        if (isme) {
            this.addFlyChip1(data, index, start, end, type);
        } else if (isFly) {
            this.addFlyChip(data, index, start, end, type);
        } else {
            this.setChipData(data, index, start, end, type);
            this._checkChip(data);
        }
    }

    /**
    * 添加单个筹码
    * @param index 筹码类型
    * @param sourceWorldPos 添加筹码位置的世界坐标
    * @param endWorldPos 飞筹码终点的世界坐标
    */
    addFlyChip(info: betInfo, index: number, sourceWorldPos: Vec3, endWorldPos: Vec3, type: number) {
        const chip = PoolManager.Get(CustomChipItem);
        let targetLocalPos = this.node.transform.convertToNodeSpaceAR(sourceWorldPos);
        this.node.addChild(chip.node);
        chip.node.scale = v3(0, 0, 0);
        chip.node.position = targetLocalPos;
        let endPos = this.node.transform.convertToNodeSpaceAR(endWorldPos);
        chip.setBetData(index, info, targetLocalPos, type);
        this._flyToTarget(info, chip.node, endPos, type);
    }

    addFlyChip1(info: betInfo, index: number, sourceWorldPos: Vec3, endWorldPos: Vec3, type: number) {
        const chip = PoolManager.Get(CustomChipItem);
        let targetLocalPos = this.node.transform.convertToNodeSpaceAR(sourceWorldPos);
        let endPos = this.node.transform.convertToNodeSpaceAR(endWorldPos);
        this.node.addChild(chip.node);
        chip.node.scale = this._max[type];
        chip.node.setPosition(new Vec3(endPos.x, endPos.y + 30, endPos.z))
        chip.setBetData(index, info, targetLocalPos, type);
        this._flyToTarget1(info, chip.node, endPos, type);
    }

    setChipData(info: betInfo, index: number, sourceWorldPos: Vec3, endWorldPos: Vec3, type: number) {
        const chip = PoolManager.Get(CustomChipItem);
        let targetLocalPos = this.node.transform.convertToNodeSpaceAR(sourceWorldPos);
        this.node.addChild(chip.node);
        let endPos = this.node.transform.convertToNodeSpaceAR(endWorldPos);
        chip.node.position = endPos;
        chip.setBetData(index, info, targetLocalPos, type);
        chip.node.scale = this._rs[type];
    }
    addWinData(info: betInfo, index: number, sourceWorldPos: Vec3, endWorldPos: Vec3, type: number) {
        const chip = PoolManager.Get(CustomChipItem);
        let targetLocalPos = this.node.transform.convertToNodeSpaceAR(sourceWorldPos);
        this.node.addChild(chip.node);
        chip.node.scale = this._rs[type];
        chip.node.position = this._losePos;
        let endPos = this.node.transform.convertToNodeSpaceAR(endWorldPos);
        chip.setBetData(index, info, targetLocalPos, type);
        this._flyToTarget2(chip.node, endPos, type);

    }
    /**
    * 回收筹码
    * * @param recycleWorldPos 回收筹码终点的世界坐标
    */
    recycleChip() {
        let wintype = SevenUpSevenDownManager.WinType;
        let AllbetInfo = SevenUpSevenDownManager.AllbetInfo;
        this.node.children.forEach((child, idx) => {
            let _d = child.getComponent(CustomChipItem).ChipInfo;
            if (!_d || wintype.indexOf(_d.bet_id) == -1) {
                this._flyToEnd(child, this._losePos, child.getComponent(CustomChipItem).Type);
            }
        })
        this.scheduleOnce(() => {
            AllbetInfo.forEach(v => {
                if (wintype.indexOf(v.bet_id) != -1) {
                    let index = 0;
                    this._chipButtons.forEach((value, idx) => {
                        if (+v.bet_coin == value) index = idx;
                    })
                    let start = this.view.getUserWorldPosByUid(v.player_id, v.icon);
                    let end = this.view.getDeskWorldPosByIdx(v.bet_id, false, 1);
                    let type = (v.bet_id == 6 || v.bet_id == 12 || v.bet_id == 13) ? 0 : 1;
                    this.addWinData(v, index, start, end, type)
                }
            })
        }, 0.6);
        this.scheduleOnce(() => {
            this.node.children.forEach((child, idx) => {
                this._flyToEnd(child, child.getComponent(CustomChipItem).StartLocalPos, child.getComponent(CustomChipItem).Type);
            })
        }, 1.4);
        this._chips.clear();
    }

    recycleChipByCondition(data: betInfo) {
        let childs = this.node.children;
        for (let i = childs.length - 1; i >= 0; i--) {
            let ts = childs[i].getComponent(CustomChipItem);
            const _d = ts.ChipInfo;
            if (_d.bet_coin == data.bet_coin && _d.bet_id == data.bet_id) {
                // this._flyToEnd(childs[i], ts.StartLocalPos);
                this._clearChip(childs[i])
                break;
            }
        }
    }
    /**
    * 飞筹码动画
    */
    _flyToTarget(info: betInfo, flyObject: cc.Node, endPos: cc.Vec3, type: number): void {
        let startPos = flyObject.position;
        let distance = Vec3.distance(startPos, endPos);
        let flyDuration = this._calculateDurationByDistance(distance);
        const opacity = flyObject.getComponent(UIOpacity);
        opacity.opacity = 0;
        Tween.stopAllByTarget(flyObject);
        Tween.stopAllByTarget(opacity);
        tween(opacity)
            .to(0.4, { opacity: 255 })
            .start();

        tween(flyObject)
            // 预备阶段：出现 → 收缩 → 回弹
            .to(0.2, { scale: this._max[type] })
            .to(0.15, { scale: this._min[type] })
            .to(0.1, { scale: this._rs[type] })
            .delay(0.05)

            // 飞行阶段：稍微放大一点
            .to(flyDuration, {
                position: endPos,
                scale: new Vec3(this._rs[type].x * 1.2, this._rs[type].y * 1.2, 1) // 飞行时放大10%
            }, { easing: 'quadOut' })

            // 落地效果：直接缩回到原始大小
            .call(() => {
                if (this._isGameInBackground == false) {
                    AudioManager.playSound(this.bundleName, '下注筹码声');
                }
                this._checkChip(info);
                Global.sendMsg(GameEvent.PLYER_TOTAL_BET_UPDATE);
                tween(flyObject)
                    .to(0.15, {
                        scale: new Vec3(this._rs[type].x, this._rs[type].y, 1) // 直接回到原始大小
                    }, { easing: 'sineOut' }) // 平滑过渡
                    .start();
            })
            .start();

    }

    _flyToTarget1(info: betInfo, flyObject: cc.Node, endPos: cc.Vec3, type: number): void {
        const opacity = flyObject.getComponent(UIOpacity);
        Tween.stopAllByTarget(flyObject);
        Tween.stopAllByTarget(opacity);
        opacity.opacity = 255;
        tween(flyObject)
            .to(0.2, {
                position: endPos,
                scale: new Vec3(this._rs[type].x * 1.2, this._rs[type].y * 1.2, 1)
            }, { easing: 'quadOut' })
            // 落地效果：直接缩回到原始大小
            .call(() => {
                if (this._isGameInBackground == false) {
                    AudioManager.playSound(this.bundleName, '下注筹码声');
                }
                this._checkChip(info);
                Global.sendMsg(GameEvent.PLYER_TOTAL_BET_UPDATE);
                tween(flyObject)
                    .to(0.05, {
                        scale: new Vec3(this._rs[type].x, this._rs[type].y, 1) // 直接回到原始大小
                    }, { easing: 'sineOut' }) // 平滑过渡
                    .start();
            })
            .start();
    }
    _flyToTarget2(flyObject: cc.Node, endPos: cc.Vec3, type: number): void {
        let startPos = flyObject.position;
        const opacity = flyObject.getComponent(UIOpacity);
        opacity.opacity = 255;
        Tween.stopAllByTarget(flyObject);
        Tween.stopAllByTarget(opacity);
        tween(flyObject)
            .to(0.5, {
                position: endPos,
                scale: new Vec3(this._rs[type].x * 1.2, this._rs[type].y * 1.2, 1) // 飞行时放大10%
            }, { easing: 'quadOut' })

            // 落地效果：直接缩回到原始大小
            .call(() => {
                if (this._isGameInBackground == false) {
                    AudioManager.playSound(this.bundleName, '下注筹码声');
                }
                Global.sendMsg(GameEvent.PLYER_TOTAL_BET_UPDATE);
                tween(flyObject)
                    .to(0.15, {
                        scale: new Vec3(this._rs[type].x, this._rs[type].y, 1) // 直接回到原始大小
                    }, { easing: 'sineOut' }) // 平滑过渡
                    .start();
            })
            .start();

    }
    /**
    * 收筹码动画
    */
    _flyToEnd(flyObject: cc.Node, endPos: cc.Vec3, type: number): void {
        flyObject.scale = this._max[type]
        tween(flyObject)
            .to(0.3, { scale: this._rs[type], position: endPos }, { easing: 'quadOut', })
            .call(() => {
                if (flyObject.getComponent(CustomChipItem)) {
                    this._clearChip(flyObject);
                }
            })
            .start();
    }
    /**
    * 飞筹码动画需要的时间
    */
    _calculateDurationByDistance(distance: number): number {
        return (distance / this._baseDistance) * this._baseDuration;
    }

    /**
    * 回收筹码到对象池
    */
    _clearChip(chip: Node) {
        chip.scale = v3(1, 1, 1);
        const opacity = chip.getComponent(UIOpacity);
        opacity.opacity = 255;
        Tween.stopAllByTarget(opacity);
        Tween.stopAllByTarget(chip);
        PoolManager.Put(chip.getComponent(CustomChipItem));
    }

    _checkChip(info: betInfo) {
        let playerData = this._chips.get(info.bet_id);
        if (!playerData) {
            playerData = [];
        }
        playerData.push(info);
        let ct = this._count[info.bet_id];
        if (playerData.length > ct) {
            // const removeCount = playerData.length - ct;
            // const removedElements = playerData.slice(0, removeCount);
            // removedElements.forEach(t => {
            //     this.recycleChipByCondition2(t)
            // })
            // playerData = playerData.slice(removeCount);
            let firstElement = playerData.shift();
            this.recycleChipByCondition2(firstElement)
        }
        this._chips.set(info.bet_id, playerData);
    }

    recycleChipByCondition2(data: betInfo) {
        let childs = this.node.children;
        for (let i = 0; i < childs.length; i++) {
            let ts = childs[i].getComponent(CustomChipItem);
            const _d = ts.ChipInfo;
            if (_d.bet_coin == data.bet_coin && _d.bet_id == data.bet_id) {
                this._clearChip(childs[i])
                break;
            }
        }
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
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomFlyChip';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomFlyChip.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomFlyChip.VIEW_NAME;
    }

    // @view export resource end
}
