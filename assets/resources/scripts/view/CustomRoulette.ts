// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { Vec3 } from 'cc';
import { math } from 'cc';
import AudioManager from '../core/manager/audio-manager';
import { tween } from 'cc';
import { UIOpacity } from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomRouletteWheel from 'db://assets/resources/scripts/view/CustomRouletteWheel';
import { v3 } from 'cc';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomRoulette')
export default class CustomRoulette extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
        this.resetGame();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    update(deltaTime: number): void {
        const degrees = math.toDegree(this.wheel.currentAngle);
        this.pointer.setRotationFromEuler(0, 0, -degrees);
        if (!this.ball.active) return;
        switch (this.ballState) {
            case 'fast':
                // 注意：轮盘是顺时针转（角度增加），小球通常是逆时针转（角度减少）
                this.ballAngle += this.ballSpeed * deltaTime;
                this.updatePosition();
                break;
            case 'slow':
                // 速度由动画控制，位置在slowDownAndMoveInward中更新
                break;

            case 'locked':
                if (this.isRelativeLocked) {
                    this.updatePosition();
                }
                break;
        }
    }

    //------------------------ 内部逻辑 ------------------------//
    private isGameRunning: boolean = false;
    private ballAngle: number = 0;
    private ballSpeed: number = 0;
    private orbitRadius: number = 2.5;
    private ballState: 'idle' | 'appear' | 'fast' | 'slow' | 'locked' | 'stopped' = 'idle';
    private isRelativeLocked: boolean = false;
    outerRingRadius: number = 250;  // 外圈半径
    innerRingRadius: number = 180;  // 内圈半径
    targetOnWheel: number = 0;
    targetNumber: number = 0;
    private _enterPos: Vec3 = new Vec3();
    private _hiddenPos: Vec3 = new Vec3();
    private _uiOpacity: UIOpacity = null;
    buildUi() {
        // 记录“正常位置”
        this._enterPos = v3(0, 180, 0);
        // 上方隐藏位置（你也可以把 500 调大/调小）
        this._hiddenPos = this._enterPos.clone();
        this._hiddenPos.y += 500;
        // 透明度组件（没有就加一个）
        this._uiOpacity = this.pointer.getComponent(UIOpacity) || this.pointer.addComponent(UIOpacity);
        // 默认先隐藏在上方（如果你希望场景初始可见，就别做这两行）
        this.pointer.setPosition(this._hiddenPos);
        this._uiOpacity.opacity = 0;
    }
    public playEnter(duration: number = 0.5): Promise<void> {
        return new Promise((resolve) => {
            this.pointer.active = true;

            // 从上方落下 + 渐显 + 轻微回弹
            tween(this.pointer)
                .stop()
                .set({ position: this._hiddenPos, scale: new Vec3(0.96, 0.96, 1) })
                .to(duration, { position: this._enterPos }, { easing: 'backOut' })
                .start();

            tween(this._uiOpacity)
                .stop()
                .set({ opacity: 0 })
                .to(duration * 0.9, { opacity: 255 }, { easing: 'quadOut' })
                .call(resolve)
                .start();
        });
    }

    public playExit(duration: number = 0.45): Promise<void> {
        return new Promise((resolve) => {
            // 上收 + 渐隐
            tween(this.pointer)
                .stop()
                .to(duration, { position: this._hiddenPos }, { easing: 'quadIn' })
                .call(() => {
                    this.pointer.active = false;
                    resolve();
                })
                .start();

            tween(this._uiOpacity)
                .stop()
                .to(duration * 0.9, { opacity: 0 }, { easing: 'quadIn' })
                .start();
        });
    }
    // 获取数字在轮盘上的正确显示角度
    private getNumberDisplayOnWheel(targetNumber: number): number {
        const euroNumbers = [
            5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
            0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10
        ];
        const index = euroNumbers.indexOf(targetNumber);
        const sectorAngle = (2 * Math.PI) / 37;
        const displayAngleRad = Math.PI / 2 - (index * sectorAngle);
        console.log(`数字 ${targetNumber} 在轮盘上的显示角度: ${math.toDegree(displayAngleRad).toFixed(1)}°`);
        return displayAngleRad;
    }

    // 开始游戏
    async startGame(targetNumber: number): Promise<void> {
        if (this.isGameRunning) return;
        this.targetNumber = targetNumber;
        this.labelResult.string = targetNumber + '';
        this.sprbg.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/wheel/LP_Img_${this.getColorByIdx(targetNumber)}/spriteFrame`);
        // 重置游戏
        this.resetGame();
        this.isGameRunning = true;
        try {
            // 阶段1：轮盘启动 (1.0秒)
            this.playEnter(0.55);
            await this.wheel.playEnter(0.55);
            await this.phase1_WheelStart();

            // 阶段2：小球快速旋转 (2.0秒)
            await this.phase2_BallFastRotation();

            // // 阶段3：小球减速 (1.5秒)
            await this.phase3_BallSlowDown();
            this.result.active = true;
            AudioManager.playSound(this.bundleName, '小球落入对应数字区');
            // // 阶段4：一起减速 (2.8秒)
            await this.phase4_SlowDownTogether();

            this.isGameRunning = false;

        } catch (error) {
            console.error('游戏出错:', error);
            this.isGameRunning = false;
        }
    }

    private async phase1_WheelStart(): Promise<void> {
        console.log('阶段1：轮盘启动');
        // 轮盘开始旋转，目标速度 0.5 弧度/秒
        await this.wheel.startSpin(0.5);
    }

    private async phase2_BallFastRotation(): Promise<void> {
        console.log('阶段2：小球快速旋转');
        try {
            // 1. 确保轮盘已经稳定旋转
            await this.wheel.waitForWheelStable();
            AudioManager.playSound(this.bundleName, '小球转动开始落入');
            // 2. 小球出现
            await this.appearOnOuterRing();
            AudioManager.playSound(this.bundleName, '小球在轨道上转动');
            // 3. 开始快速旋转
            await this.startFastRotation();
            // 4. 等待一段时间（可以调整这个时间）
            const keepRotationTime = 1.2 + Math.random() * 0.6; // 1.2-1.8秒

            await this.delay(keepRotationTime * 1000);
        } catch (error) {
            console.error('阶段2出错:', error);
        }
    }

    private async phase3_BallSlowDown(): Promise<void> {
        console.log('阶段3：小球减速');
        this.targetOnWheel = ((this.getNumberDisplayOnWheel(this.targetNumber)) % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
        console.log(`目标数字角度: ${math.toDegree(this.targetOnWheel).toFixed(1)}°`);
        await this.targetDecelerationPosition();
        await this.slowDownAndStop()
    }

    private async phase4_SlowDownTogether(): Promise<void> {
        console.log('阶段4：相对静止一起减速');
        // 小球锁定到轮盘
        this.lockToWheel();
        // 一起减速
        await this.wheel.slowDownAndStop(2);
        // 先淡出结果 UI（如果你想保留更久就把 duration 调大或 delay 一下）
        await this.delay(600)
        this.fadeOutNode(this.result, 0.5);
        // ball 淡出（带轻微缩小）
        await this.fadeOutBall(0.28);
        this.playExit(0.45);
        await this.wheel.playExit(0.45);
        this.isGameRunning = false;
    }
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    //小球
    // 计算合适的轨道半径
    private calculateOrbitRadius(): void {
        if (!this.wheel) return;
        // 根据状态设置轨道半径
        switch (this.ballState) {
            case 'appear':
            case 'fast':
                // 外圈：距离轮盘边缘一定距离
                this.orbitRadius = this.outerRingRadius;
                break;
            case 'slow':
            case 'locked':
                // 内圈：靠近数字区域
                // this.orbitRadius = this.innerRingRadius;
                break;
            default:
            // this.orbitRadius = 200; // 默认值
        }
    }
    private updatePosition(): void {
        if (this.isRelativeLocked) {
            this.ballAngle = this.targetOnWheel - this.wheel.currentAngle;
        } else {
            if (this.ballAngle >= 2 * Math.PI) {
                this.ballAngle -= 2 * Math.PI;
            } else if (this.ballAngle < 0) {
                this.ballAngle += 2 * Math.PI;
            }
        }
        const x = Math.cos(this.ballAngle) * this.orbitRadius;
        const y = Math.sin(this.ballAngle) * this.orbitRadius;

        this.ball.setPosition(new Vec3(x, y, 0));
    }

    // 小球出现在外圈
    appearOnOuterRing(): Promise<void> {
        return new Promise((resolve) => {
            this.ball.active = true;
            this.ballState = 'appear';
            // 计算轨道半径
            this.calculateOrbitRadius();
            // 重要：小球从轮盘顶部出现，但需要考虑旋转方向
            // 轮盘是顺时针转（currentAngle增加）
            // 小球是逆时针转，所以位置应该相对固定
            this.ballAngle = Math.PI / 2; // 顶部90度位置
            // 设置初始位置
            this.updatePosition();
            this.ballState = 'fast';
            this.ball.active = true;
            const op = this.ball.getComponent(cc.UIOpacity);
            if (op) op.opacity = 255;
            this.ball.setScale(new Vec3(1, 1, 1));
            console.log(`小球出现完成，初始角度: ${math.toDegree(this.ballAngle).toFixed(1)}°`);
            resolve();
        });
    }
    // 开始快速旋转
    startFastRotation(): Promise<void> {
        return new Promise((resolve) => {
            if (this.ballState !== 'fast') {
                resolve();
                return;
            }
            const wheelSpeed = Math.abs(this.wheel.rotationSpeed);
            const targetSpeedMultiplier = 1.5
            const targetBallSpeed = wheelSpeed * targetSpeedMultiplier;
            // 线性加速参数
            const accelerationTime = 0.6; // 固定加速时间0.6秒
            const accelerationRate = targetBallSpeed / accelerationTime;
            console.log(`线性加速开始: 目标速度=${targetBallSpeed.toFixed(3)}, 加速时间=${accelerationTime}s`);
            this.ballSpeed = 0;
            let currentTime = 0;
            const linearAccelerate = () => {
                currentTime += 0.016; // 每帧时间
                if (currentTime < accelerationTime) {
                    // 加速阶段
                    this.ballSpeed = accelerationRate * currentTime;
                } else {
                    // 达到目标速度
                    this.ballSpeed = targetBallSpeed;
                    console.log(`线性加速完成: ${this.ballSpeed.toFixed(3)} rad/s`);
                    this.unschedule(linearAccelerate);
                    this.scheduleOnce(() => {
                        resolve();
                    }, 1);
                }
            };

            this.schedule(linearAccelerate, 0.016);
        });
    }

    private async targetDecelerationPosition(): Promise<void> {
        return new Promise((resolve) => {
            this.ballState = 'slow';
            const slowDownUpdate = () => {
                const speed = this.ballSpeed * 0.016;
                this.ballAngle += this.ballSpeed * 0.016;
                this.updatePosition();
                // 2. 计算相对角度和角度差
                const wheelDisplayAngle = -this.wheel.currentAngle;
                let ballRelativeToWheel = this.ballAngle - wheelDisplayAngle;
                ballRelativeToWheel = ((ballRelativeToWheel % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
                let angleDiff = this.targetOnWheel - ballRelativeToWheel;
                // 调整到 [0, 2π) 范围
                if (angleDiff < 0) {
                    angleDiff += 2 * Math.PI;
                }
                if (angleDiff < Math.PI || angleDiff > (Math.PI + speed)) {
                    return;
                }
                let targetball = this.targetOnWheel + Math.PI + wheelDisplayAngle;
                targetball = ((this.ballAngle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
                this.ballAngle = targetball
                this.updatePosition();
                this.unschedule(slowDownUpdate);
                resolve();
            };
            this.schedule(slowDownUpdate, 0.016);
        });
    }
    private hasBoostFx: boolean = false;
    private async slowDownAndStop(): Promise<void> {
        return new Promise((resolve) => {
            const dt = 0.016;

            // 触发强化的半径
            const triggerRadius = 220;
            const triggerWindow = 6;

            // 以“开始进入 slowDownAndStop 时的球速”为起点做进度
            const startBallSpeed = Math.abs(this.ballSpeed);

            const slowDown2Update = () => {
                const wheelSpeedAbs = Math.abs(this.wheel.rotationSpeed);
                const minSpeed = wheelSpeedAbs * 0.8;

                // 1) 更新球速（用 abs 逻辑，不要让符号干扰）
                let curSpeed = Math.abs(this.ballSpeed);

                if (curSpeed > minSpeed) {
                    curSpeed = Math.max(curSpeed - 0.1, minSpeed);
                } else {
                    curSpeed = minSpeed;
                }
                this.ballSpeed = curSpeed;

                // 2) 根据“减速进度”更新轨道半径（outer -> inner）
                // t=0：刚进入 slowDownAndStop（外圈）
                // t=1：降到 minSpeed（内圈）
                const denom = Math.max(startBallSpeed - minSpeed, 0.0001);
                const t = Math.max(0, Math.min(1, (startBallSpeed - curSpeed) / denom));
                this.orbitRadius = this.outerRingRadius - t * (this.outerRingRadius - this.innerRingRadius);

                // 3) 触发视觉强化：确保一定能扫到 220
                if (!this.hasBoostFx && Math.abs(this.orbitRadius - triggerRadius) <= triggerWindow) {
                    this.hasBoostFx = true;
                    this.playBallBoostFx();
                }

                // 4) 位置更新
                this.ballAngle += this.ballSpeed * dt;
                this.updatePosition();

                // 5) 角度差判断（保留你原逻辑）
                const wheelDisplayAngle = -this.wheel.currentAngle;
                let ballRelativeToWheel = this.ballAngle - wheelDisplayAngle;
                ballRelativeToWheel = ((ballRelativeToWheel % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);

                let angleDiff = this.targetOnWheel - ballRelativeToWheel;
                if (angleDiff < 0) angleDiff += 2 * Math.PI;

                if (angleDiff <= 0.1) {
                    this.unschedule(slowDown2Update);
                    resolve();
                }
            };

            this.schedule(slowDown2Update, dt);
        });
    }

    private playBallBoostFx(): void {
        // 你 ball 节点不一定是 Sprite，这里用 scale 做最通用的强化
        tween(this.ball)
            .stop()
            .to(0.08, { scale: new Vec3(1.18, 1.18, 1) }, { easing: 'quadOut' })
            .to(0.10, { scale: new Vec3(0.98, 0.98, 1) }, { easing: 'quadIn' })
            .to(0.08, { scale: new Vec3(1.00, 1.00, 1) }, { easing: 'backOut' })
            .start();
    }

    // 锁定到轮盘相对位置
    lockToWheel(): void {
        this.ballState = 'locked';
        this.isRelativeLocked = true;
        this.ballSpeed = this.wheel.rotationSpeed;
    }
    private fadeOutNode(node: cc.Node, duration: number = 0.25): Promise<void> {
        return new Promise((resolve) => {
            if (!node || !node.isValid || !node.active) {
                resolve();
                return;
            }

            const opacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);

            tween(opacity)
                .stop()
                .to(duration, { opacity: 0 }, { easing: 'quadIn' })
                .call(() => {
                    node.active = false;
                    // 还原透明度，避免下次显示还是 0
                    opacity.opacity = 255;
                    resolve();
                })
                .start();
        });
    }

    // ball 专用：顺便做一点缩小，更自然
    private fadeOutBall(duration: number = 0.28): Promise<void> {
        return new Promise((resolve) => {
            if (!this.ball || !this.ball.isValid || !this.ball.active) {
                resolve();
                return;
            }
            const opacity = this.ball.getComponent(UIOpacity) || this.ball.addComponent(UIOpacity);

            tween(this.ball)
                .stop()
                .to(duration, { scale: new Vec3(0.9, 0.9, 1) }, { easing: 'quadIn' })
                .start();

            tween(opacity)
                .stop()
                .to(duration, { opacity: 0 }, { easing: 'quadIn' })
                .call(() => {
                    this.ball.active = false;
                    // 还原
                    opacity.opacity = 255;
                    this.ball.setScale(new Vec3(1, 1, 1));
                    resolve();
                })
                .start();
        });
    }

    resetGame(): void {
        this.wheel.reset();
        this.hasBoostFx = false;
        this.isGameRunning = false;
        this.ball.active = false;
        this.ballState = 'idle';
        this.ballSpeed = 0;
        this.ballAngle = 0;
        this.orbitRadius = this.outerRingRadius;
        this.isRelativeLocked = false;
        this.result.active = false;
        this.result.getComponent(UIOpacity).opacity = 255;
        this.pointer.setPosition(this._hiddenPos);
        this._uiOpacity.opacity = 0;
        this.unscheduleAllCallbacks();
    }
    //4 红色 5黑色 6绿色
    getColorByIdx(idx: number): number {
        if (idx == 0) return 6;
        if (idx <= 10) {
            return idx % 2 == 1 ? 4 : 5;
        }
        if (idx <= 18) {
            return idx % 2 == 1 ? 5 : 4;
        }
        if (idx <= 28) {
            return idx % 2 == 1 ? 4 : 5;
        }
        if (idx <= 36) {
            return idx % 2 == 1 ? 5 : 4;
        }
        return 3;
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
            cc_ball: [cc.Node],
            cc_labelResult: [cc.Label],
            cc_pointer: [cc.Node],
            cc_result: [cc.Node],
            cc_sprbg: [cc.Sprite],
            cc_wheel: [CustomRouletteWheel],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected ball: cc.Node = null;
    protected labelResult: cc.Label = null;
    protected pointer: cc.Node = null;
    protected result: cc.Node = null;
    protected sprbg: cc.Sprite = null;
    protected wheel: CustomRouletteWheel = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomRoulette';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomRoulette.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomRoulette.VIEW_NAME;
    }
    // @view export resource end
}
