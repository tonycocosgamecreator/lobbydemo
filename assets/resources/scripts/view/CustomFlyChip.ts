// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { betInfo } from '../manager/common-manager';
import PoolManager from '../core/manager/pool-manager';
import CustomChipItem from './CustomChipItem';
import WheelManager from '../manager/wheel-manager';
import { Vec3 } from 'cc';
import { v3 } from 'cc';
import { Global } from '../global';
import { GameEvent } from '../define';
import { tween } from 'cc';
import { UIOpacity } from 'cc';
import { Tween } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomFlyChip')
export default class CustomFlyChip extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _max = v3(0.7, 0.7, 0.7)
    _min = v3(0.5, 0.5, 0.5)
    _middle = v3(0.6, 0.6, 0.6)
    _baseDuration: number = 0.2; // 基础飞行时间(用于基准距离)
    _baseDistance: number = 500; // 基准距离(像素)
    _count = [];
    _chips: Map<number, betInfo[]> = new Map();

    initData() {
        for (let i = 0; i < 50; i++) {
            this._count[i] = this.getRandomInRange(5, 8);
        }
    }

    updateGameStage(stage: number, reconnect: boolean = false) {
        switch (stage) {
            case baccarat.DeskStage.ReadyStage:
                this.reset();
                this.initData();
                break;
            case baccarat.DeskStage.StartBetStage:
            case baccarat.DeskStage.EndBetStage:
            case baccarat.DeskStage.OpenStage:
                if (reconnect) {
                    let list = WheelManager.getBetInfoByPlay();
                    for (let i = 0; i < list.length; i++) {
                        let item = list[i];
                        item.forEach(d => {
                            this.setReconnectChipData(d)
                        })
                    }
                }
                break
            case baccarat.DeskStage.SettleStage:
                break;
        }
    }

    reset() {
        for (let i = 0; i < this.node.children.length; i++) {
            let child = this.node.children[i];
            this.clearChip(child);
            i--;
        }
        this._chips.clear();
    }

    getRandomInRange(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    clearChip(chip: cc.Node) {
        const opacity = chip.getComponent(UIOpacity);
        opacity.opacity = 255;
        Tween.stopAllByTarget(opacity);
        Tween.stopAllByTarget(chip);
        PoolManager.Put(chip.getComponent(CustomChipItem));
    }

    checkBetChipCount(data: betInfo) {
        let playerData = this._chips.get(data.bet_id);
        if (!playerData) {
            playerData = [];
        }
        playerData.push(data);
        let ct = this._count[data.bet_id];
        if (playerData.length > ct) {
            let firstElement = playerData.shift();
            this.sequentialDelet(firstElement)
        }
        this._chips.set(data.bet_id, playerData);
    }

    sequentialDelet(data: betInfo) {
        let childs = this.node.children;
        for (let i = 0; i < childs.length; i++) {
            let ts = childs[i].getComponent(CustomChipItem);
            const _d = ts.ChipInfo;
            if (_d.bet_coin == data.bet_coin && _d.bet_id == data.bet_id) {
                this.clearChip(childs[i])
                break;
            }
        }
    }

    reverseDelet(data: betInfo) {
        let childs = this.node.children;
        for (let i = childs.length - 1; i >= 0; i--) {
            let ts = childs[i].getComponent(CustomChipItem);
            const _d = ts.ChipInfo;
            if (_d.bet_coin == data.bet_coin && _d.bet_id == data.bet_id) {
                this.clearChip(childs[i])
                break;
            }
        }
    }

    updateflyChip(data: betInfo, order: number) {
        let targetWorldPos = null;
        if (order != -1) {
            targetWorldPos = WheelManager.getFlyChipClickWorldPos(order);
        }
        if (!targetWorldPos) {
            targetWorldPos = WheelManager.View.getDeskWorldPosByAid(data.bet_id);
        }
        const chip = PoolManager.Get(CustomChipItem);
        chip.node.scale = order == -1 ? v3(0, 0, 0) : v3(0.9, 0.9, 0.9);
        let startWorldPos = null
        startWorldPos = order == -1 ? WheelManager.View.getWorldPosByUid(data.player_id) : WheelManager.View.getChipWorldPos();
        let startLocalPos = this.node.transform.convertToNodeSpaceAR(startWorldPos);
        chip.node.setPosition(startLocalPos);
        chip.setBetData(data);
        this.node.addChild(chip.node);
        let endPos = this.node.transform.convertToNodeSpaceAR(targetWorldPos);
        this.flyToTarget(chip.node, endPos, order == -1 ? true : false, () => {
            Global.sendMsg(GameEvent.PLYER_TOTAL_BET_UPDATE);
            this.checkBetChipCount(data);
        });
    }

    flyToTarget(flyObject: cc.Node, endPos: cc.Vec3, needScaleAnimation: boolean, callback: () => void = null, dur: number = 0) {
        let startPos = flyObject.position;
        let distance = Vec3.distance(startPos, endPos);
        let flyDuration = dur ? dur : this._calculateDurationByDistance(distance);
        const opacity = flyObject.getComponent(UIOpacity);
        // 创建基础动画
        let flyTween = tween(flyObject);
        // 可选：预备阶段
        if (needScaleAnimation) {
            opacity.opacity = 0;
            tween(opacity)
                .to(0.4, { opacity: 255 })
                .start();
            this._addPrepareAnimation(flyTween);
        } else {
            opacity.opacity = 255;
        }
        // 飞行阶段
        this._addFlyAnimation(flyTween, flyDuration, endPos);

        // 落地效果
        flyTween.call(() => {
            this._onFlyEnd(flyObject, callback);
        });
        flyTween.start();
    }

    // 辅助方法：添加预备动画
    _addPrepareAnimation(tweenChain: cc.Tween<cc.Node>) {
        tweenChain
            .to(0.2, { scale: this._max })
            .to(0.15, { scale: this._min })
            .to(0.1, { scale: this._middle })
            .delay(0.05);
    }

    // 辅助方法：添加飞行动画
    _addFlyAnimation(tweenChain: cc.Tween<cc.Node>, flyDuration: number, endPos: Vec3) {
        const scale = new Vec3(this._min.x * 1.2, this._min.y * 1.2, 1)
        tweenChain.to(flyDuration, {
            position: endPos,
            scale: scale
        }, { easing: 'quadOut' });
    }

    // 辅助方法：飞行结束处理
    _onFlyEnd(flyObject: cc.Node, callback: () => void = null) {
        callback && callback()
        tween(flyObject)
            .to(0.15, {
                scale: new Vec3(this._min.x, this._min.y, 1)
            }, { easing: 'sineOut' })
            .start();
    }

    flyToEnd(flyObject: cc.Node, endPos: cc.Vec3) {
        let opacity = flyObject.getComponent(UIOpacity);
        opacity.opacity = 255;
        flyObject.scale = this._max;
        tween(flyObject)
            .to(0.5, { scale: this._min, position: endPos }, { easing: 'quadOut', })
            .call(() => {
                if (flyObject.getComponent(CustomChipItem)) {
                    this.clearChip(flyObject);
                }
            })
            .start();
    }

    _calculateDurationByDistance(distance: number): number {
        return (distance / this._baseDistance) * this._baseDuration;
    }

    recycleChip() {
        let winArea = WheelManager.WinArea;
        let losePosWord = WheelManager.View.getLoseWorldPos();
        let losePos = this.node.transform.convertToNodeSpaceAR(losePosWord);
        this.node.children.forEach((child, idx) => {
            let _d = child.getComponent(CustomChipItem).ChipInfo;
            if (!_d || winArea.indexOf(_d.bet_id) == -1) {
                this.flyToEnd(child, losePos);
            }
        });
        if (winArea.length == 0) return;
        this.scheduleOnce(() => {
            for (let i = 0; i < winArea.length; i++) {
                const data = WheelManager.getBetInfoByArea(winArea[i]);
                const targetWorldPos = WheelManager.View.getDeskWorldPosByAid(winArea[i]);
                const endPos = this.node.transform.convertToNodeSpaceAR(targetWorldPos);
                data.forEach(betinfo => {
                    this.setWinChipData(betinfo, losePos, endPos);
                })
            }
        }, 0.5);
        this.scheduleOnce(() => {
            this.node.children.forEach((child, idx) => {
                let startWorldPos = null;
                const data = child.getComponent(CustomChipItem).ChipInfo;
                if (data.player_id == WheelManager.PlayerId) {
                    startWorldPos = WheelManager.View.getMyHeadWorldPos();
                } else {
                    startWorldPos = WheelManager.View.getWorldPosByUid(data.player_id)
                }
                let startLocalPos = this.node.transform.convertToNodeSpaceAR(startWorldPos);
                this.flyToEnd(child, startLocalPos);
            })
        }, 1)
    }

    setWinChipData(data: betInfo, startPos: Vec3, endPos: Vec3) {
        const chip = PoolManager.Get(CustomChipItem);
        chip.node.scale = this._middle;
        chip.node.setPosition(startPos);
        chip.setBetData(data);
        this.node.addChild(chip.node);
        this.flyToTarget(chip.node, endPos, false, null, 0.5);
    }

    setReconnectChipData(data: betInfo) {
        let targetWorldPos = WheelManager.View.getDeskWorldPosByAid(data.bet_id);
        let endPos = this.node.transform.convertToNodeSpaceAR(targetWorldPos);
        const chip = PoolManager.Get(CustomChipItem);
        chip.node.scale = this._middle;
        chip.node.setPosition(endPos);
        chip.setBetData(data);
        this.node.addChild(chip.node);
        this.checkBetChipCount(data);
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
