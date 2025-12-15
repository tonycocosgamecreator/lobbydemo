// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomRouletteWheel from 'db://assets/resources/scripts/view/CustomRouletteWheel';
import { v3 } from 'cc';
import { Vec3 } from 'cc';
import { math } from 'cc';
import AudioManager from '../core/manager/audio-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomRoulette')
export default class CustomRoulette extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.resetGame();
        this.updatePosition();
        this.calculateOrbitRadius();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    update(deltaTime: number): void {
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
        this.node.emit('phase-changed', 4);
        // 小球锁定到轮盘
        this.lockToWheel();
        // 一起减速
        await this.wheel.slowDownAndStop(2);
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
                this.orbitRadius = 200; // 默认值
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



    private async slowDownAndStop(): Promise<void> {
        return new Promise((resolve) => {
            const slowDown2Update = () => {
                const wheelSpeed = this.wheel.rotationSpeed;
                const minSpeed = Math.abs(wheelSpeed) * 0.8;

                if (this.ballSpeed > minSpeed) {
                    this.ballSpeed -= 0.2;
                } else {
                    this.ballSpeed = minSpeed;
                }

                this.ballAngle += this.ballSpeed * 0.016;
                this.updatePosition();
                // 计算相对角度和角度差
                const wheelDisplayAngle = -this.wheel.currentAngle;
                let ballRelativeToWheel = this.ballAngle - wheelDisplayAngle;
                ballRelativeToWheel = ((ballRelativeToWheel % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
                let angleDiff = this.targetOnWheel - ballRelativeToWheel;
                // 根据减速进度调整轨道半径
                const progress = Math.min(this.ballSpeed / wheelSpeed, 1);
                this.orbitRadius = this.outerRingRadius - progress * (this.outerRingRadius - this.innerRingRadius);
                // 调整到 [0, 2π) 范围
                if (angleDiff < 0) angleDiff += 2 * Math.PI;

                if (angleDiff <= 0.1) {
                    this.unschedule(slowDown2Update);
                    resolve();
                }
            };
            this.schedule(slowDown2Update, 0.016);
        });
    }

    // 锁定到轮盘相对位置
    lockToWheel(): void {
        this.ballState = 'locked';
        this.isRelativeLocked = true;
        this.ballSpeed = this.wheel.rotationSpeed;
    }

    resetGame(): void {
        this.wheel.reset();
        this.isGameRunning = false;
        this.ball.active = false;
        this.ballState = 'idle';
        this.ballSpeed = 0;
        this.ballAngle = 0;
        this.orbitRadius = this.outerRingRadius;
        this.isRelativeLocked = false;
        this.result.active = false;
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
            cc_result: [cc.Node],
            cc_sprbg: [cc.Sprite],
            cc_wheel: [CustomRouletteWheel],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected ball: cc.Node = null;
    protected labelResult: cc.Label = null;
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
