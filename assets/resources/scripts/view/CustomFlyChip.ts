// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { Node } from 'cc';
import { Vec3 } from 'cc';
import { tween } from 'cc';
import CustomChip from './CustomChip';
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

    buildUi() {
        this.reset();
        this._chipButtons = WalletManager.getCurrencyBetSize();
        this.view = SevenUpSevenDownManager.View;
        this._playId = SevenUpSevenDownManager.PlayerId;
    }

    reset() {
        for (let i = 0; i < this.node.children.length; i++) {
            let child = this.node.children[i];
            this._clearChip(child);
            i--;
        }
    }

    updateGameStage(reconnect: boolean = false) {
        this._stage = SevenUpSevenDownManager.Stage;
        if (reconnect) {
            this.view = SevenUpSevenDownManager.View;
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
        let lose = this.view.getUserLoseWorldPos();
        let type = (data.bet_id == 6 || data.bet_id == 12 || data.bet_id == 13) ? 0 : 1;
        if (isme) {
            this.addFlyChip1(data, index, start, end, lose, type);
        } else if (isFly) {
            this.addFlyChip(data, index, start, end, lose, type);
        } else {
            this.setChipData(data, index, start, end, lose, type);
        }
    }

    /**
    * 添加单个筹码
    * @param index 筹码类型
    * @param sourceWorldPos 添加筹码位置的世界坐标
    * @param endWorldPos 飞筹码终点的世界坐标
    */
    addFlyChip(info: betInfo, index: number, sourceWorldPos: Vec3, endWorldPos: Vec3, loseWorldPos: Vec3, type: number) {
        const chip = PoolManager.Get(CustomChipItem);
        let targetLocalPos = this.node.transform.convertToNodeSpaceAR(sourceWorldPos);
        this.node.addChild(chip.node);
        chip.node.scale = v3(0, 0, 0);
        chip.node.position = targetLocalPos;
        let endPos = this.node.transform.convertToNodeSpaceAR(endWorldPos);
        let losePos = this.node.transform.convertToNodeSpaceAR(loseWorldPos);
        chip.setBetData(index, info, targetLocalPos, losePos, type);
        this._flyToTarget(chip.node, endPos, type);
    }

    addFlyChip1(info: betInfo, index: number, sourceWorldPos: Vec3, endWorldPos: Vec3, loseWorldPos: Vec3, type: number) {
        const chip = PoolManager.Get(CustomChipItem);
        let targetLocalPos = this.node.transform.convertToNodeSpaceAR(sourceWorldPos);
        let endPos = this.node.transform.convertToNodeSpaceAR(endWorldPos);
        this.node.addChild(chip.node);
        chip.node.scale = this._max[type];
        chip.node.setPosition(new Vec3(endPos.x, endPos.y + 30, endPos.z))
        let losePos = this.node.transform.convertToNodeSpaceAR(loseWorldPos);
        chip.setBetData(index, info, targetLocalPos, losePos, type);
        this._flyToTarget1(chip.node, endPos, type);
    }

    setChipData(info: betInfo, index: number, sourceWorldPos: Vec3, endWorldPos: Vec3, loseWorldPos: Vec3, type: number) {
        const chip = PoolManager.Get(CustomChipItem);
        let targetLocalPos = this.node.transform.convertToNodeSpaceAR(sourceWorldPos);
        this.node.addChild(chip.node);
        let endPos = this.node.transform.convertToNodeSpaceAR(endWorldPos);
        let losePos = this.node.transform.convertToNodeSpaceAR(loseWorldPos);
        chip.node.position = endPos;
        chip.setBetData(index, info, targetLocalPos, losePos, type);
        chip.node.scale = this._rs[type];
    }
    /**
    * 回收筹码
    * * @param recycleWorldPos 回收筹码终点的世界坐标
    */
    recycleChip() {
        let winData = SevenUpSevenDownManager.BetsList;
        this.node.children.forEach((child, idx) => {
            let _d = child.getComponent(CustomChipItem).ChipInfo;
            if (winData.has(_d.player_id) && winData.get(_d.player_id).win > 0) {
                this._flyToEnd(child, child.getComponent(CustomChipItem).StartLocalPos, child.getComponent(CustomChipItem).Type);
            } else {
                // this._flyToEnd(child, child.getComponent(CustomChipItem).LoseLocalPos);
                this._clearChip(child)
            }
        })
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
    _flyToTarget(flyObject: cc.Node, endPos: cc.Vec3, type: number): void {
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
                AudioManager.playSound(this.bundleName, '下注筹码声');
                Global.sendMsg(GameEvent.PLYER_TOTAL_BET_UPDATE);
                tween(flyObject)
                    .to(0.15, {
                        scale: new Vec3(this._rs[type].x, this._rs[type].y, 1) // 直接回到原始大小
                    }, { easing: 'sineOut' }) // 平滑过渡
                    .start();
            })
            .start();

    }

    _flyToTarget1(flyObject: cc.Node, endPos: cc.Vec3, type: number): void {
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
                AudioManager.playSound(this.bundleName, '下注筹码声');
                Global.sendMsg(GameEvent.PLYER_TOTAL_BET_UPDATE);
                tween(flyObject)
                    .to(0.05, {
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
        let startPos = flyObject.position;
        let distance = Vec3.distance(startPos, endPos);
        let flyDuration = this._calculateDurationByDistance(distance);
        flyObject.scale = this._max[type]
        tween(flyObject)
            .to(flyDuration, { scale: this._rs[type], position: endPos }, { easing: 'quadOut', })
            .call(() => {
                if (flyObject.getComponent(CustomChipItem)) {
                    this._clearChip(flyObject);
                }
            })
            .start();
        // tween(flyObject)
        //     .parallel(
        //         tween().to(flyDuration, {
        //             position: endPos
        //         }, {
        //             easing: 'quadOut',
        //         }),
        // tween().to(flyDuration, { opacity: 150 }),
        // )
        // .call(() => {
        //     if (flyObject.getComponent(CustomChipItem)) {
        //         this._clearChip(flyObject);
        //     }
        // })
        // .start();
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
