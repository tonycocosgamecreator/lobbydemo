// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomRouletteWheel from 'db://assets/resources/scripts/view/CustomRouletteWheel';
import { v3 } from 'cc';
import { Vec3 } from 'cc';
import { tween } from 'cc';
import { math } from 'cc';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomRoulette')
export default class CustomRoulette extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.setNumberAngleMap();
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
                // 独立旋转：小球有自己的速度
                // 注意：轮盘是顺时针转（角度增加），小球通常是逆时针转（角度减少）
                this.ballAngle += this.ballSpeed * deltaTime;
                this.updatePosition();
                // 可选：添加角度限制，避免过大
                if (this.ballAngle > 2 * Math.PI) {
                    this.ballAngle -= 2 * Math.PI;
                }
                break;

            case 'slow':
                // 速度由动画控制，位置在slowDownAndMoveInward中更新
                break;

            case 'locked':
                // if (this.isRelativeLocked) {
                //     // 相对锁定：保持在轮盘相对位置
                //     const fixedRelativeAngle = Math.PI / 4; // 45度
                //     this.ballAngle = this.wheel.currentAngle + fixedRelativeAngle;
                //     this.updatePosition();
                // }
                break;
        }
    }

    //------------------------ 内部逻辑 ------------------------//
    private isGameRunning: boolean = false;
    private currentPhase: number = 0;

    private ballAngle: number = 0;
    private ballSpeed: number = 0;
    private orbitRadius: number = 2.5;
    private ballState: 'idle' | 'appear' | 'fast' | 'slow' | 'locked' | 'stopped' = 'idle';
    private isRelativeLocked: boolean = false;
    outerRingRadius: number = 250;  // 外圈半径
    innerRingRadius: number = 198;  // 内圈半径
    map: { [key: number]: number } = {};
    // 创建数字到角度的映射表
    private setNumberAngleMap() {
        // 欧洲轮盘数字顺序，从0°（顶部）开始
        const euroNumbers = [
            5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
            0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10
        ];

        const sectorSize = (2 * Math.PI) / 37; // 每个扇区弧度
        // 假设数字5在轮盘顶部（0度）
        // 顺时针方向每个数字增加一个扇区
        euroNumbers.forEach((num, index) => {
            // 计算角度，数字5在0°，顺时针增加
            const angle = (index * sectorSize) % (2 * Math.PI);
            this.map[num] = angle;
        });

    }
    getNumberAngleMap(): { [key: number]: number } {
        return this.map;
    }

    // 辅助函数：归一化角度到 [0, 2π)
    private normalizeAngle(angle: number): number {
        return ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    }
    // 开始游戏
    async startGame(): Promise<void> {
        if (this.isGameRunning) return;

        this.isGameRunning = true;
        this.currentPhase = 0;

        // 重置游戏
        this.resetGame();

        try {
            // 阶段1：轮盘启动 (1.0秒)
            await this.phase1_WheelStart();

            // 阶段2：小球快速旋转 (2.0秒)
            await this.phase2_BallFastRotation();

            // // 阶段3：小球减速 (1.5秒)
            await this.phase3_BallSlowDown();

            // // 阶段4：一起减速 (2.8秒)
            // await this.phase4_SlowDownTogether();
            this.wheel.stop()
            this.isGameRunning = false;
            this.currentPhase = 0;

        } catch (error) {
            console.error('游戏出错:', error);
            this.isGameRunning = false;
        }
    }

    private async phase1_WheelStart(): Promise<void> {
        console.log('阶段1：轮盘启动');
        this.currentPhase = 1;
        // this.node.emit('phase-changed', 1);

        // 轮盘开始旋转，目标速度 0.5 弧度/秒
        await this.wheel.startSpin(0.5);
    }

    private async phase2_BallFastRotation(): Promise<void> {
        console.log('阶段2：小球快速旋转');
        this.currentPhase = 2;
        try {
            // 1. 确保轮盘已经稳定旋转
            await this.wheel.waitForWheelStable();

            // 2. 小球出现
            await this.appearOnOuterRing();

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
        this.currentPhase = 3;

        // 测试数字32
        const targetNumber = 32;
        console.log(`\n=== 开始减速测试 ===`);
        console.log(`目标数字: ${targetNumber}`);

        await this.slowDownToTargetFinal(targetNumber);
    }


    private async phase4_SlowDownTogether(): Promise<void> {
        console.log('阶段4：相对静止一起减速');
        this.currentPhase = 4;
        this.node.emit('phase-changed', 4);

        // 小球锁定到轮盘
        this.lockToWheel();

        // 一起减速
        await this.wheel.slowDownAndStop(2.8);

        this.isGameRunning = false;
        this.currentPhase = 0;
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
                this.orbitRadius = this.innerRingRadius;
                break;
            default:
                this.orbitRadius = 200; // 默认值
        }
    }
    private updatePosition(): void {
        if (this.isRelativeLocked) {
            const fixedRelativeAngle = Math.PI / 4;
            this.ballAngle = this.wheel.currentAngle + fixedRelativeAngle;
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

                // 显示进度
                if (Math.floor(currentTime * 10) % 3 === 0) {
                    const progress = (currentTime / accelerationTime * 100).toFixed(0);
                    console.log(`加速进度: ${progress}%, 速度=${this.ballSpeed.toFixed(3)}`);
                }
            };

            this.schedule(linearAccelerate, 0.016);
        });
    }


    private async slowDownToTargetFinal(targetNumber: number): Promise<void> {
        return new Promise((resolve) => {
            // 1. 先找到目标数字相对于轮盘的角度偏移
            // 假设轮盘0度在顶部，小球相对角度为0时对应某个数字
            const numberToAngleMap = this.getNumberAngleMap(); // 需要实现这个方法
            const targetRelativeAngle = numberToAngleMap[targetNumber];

            console.log(`目标数字 ${targetNumber} 的相对角度: ${math.toDegree(targetRelativeAngle).toFixed(1)}°`);

            // 2. 计算最终小球应该的绝对角度
            // 最终小球位置 = 轮盘角度 + 相对偏移角度
            const currentWheelAngle = this.wheel.currentAngle;
            const finalBallAngle = currentWheelAngle + targetRelativeAngle;

            // 3. 获取当前状态
            const startBallAngle = this.ballAngle;
            const startWheelAngle = currentWheelAngle;
            const startTime = Date.now();

            // 4. 简单线性减速
            const duration = 2000; // 2秒
            const startRadius = this.outerRingRadius;
            const endRadius = this.innerRingRadius;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // 当前轮盘角度（假设轮盘也在减速）
                const wheelAngle = startWheelAngle + this.wheel.rotationSpeed * elapsed / 1000;
                this.wheel.currentAngle = wheelAngle;

                // 5. 计算当前轮盘对应的最终小球位置
                const currentTargetBallAngle = wheelAngle + targetRelativeAngle;

                // 6. 从当前位置平滑过渡到目标位置
                const startBallAngleNorm = this.normalizeAngle(startBallAngle);
                const currentTargetBallAngleNorm = this.normalizeAngle(currentTargetBallAngle);

                // 计算最短路径
                let angleDiff = currentTargetBallAngleNorm - startBallAngleNorm;
                if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                // 当前角度（线性插值）
                const currentBallAngle = startBallAngleNorm + angleDiff * progress;

                // 7. 设置小球状态
                this.ballAngle = currentBallAngle;

                // 小球速度逐渐与轮盘同步
                const wheelSpeed = this.wheel.rotationSpeed * (1 - progress * 0.8);
                this.ballSpeed = wheelSpeed;
                this.wheel.rotationSpeed = wheelSpeed;

                // 8. 半径变化
                this.orbitRadius = startRadius - (startRadius - endRadius) * progress;

                // 9. 更新位置
                this.updatePosition();

                // 10. 显示当前数字
                const currentRelAngle = this.normalizeAngle(this.ballAngle - wheelAngle);
                const currentNum = this.calculateNumberFromAngle(currentRelAngle);

                if (elapsed % 500 < 16) {
                    console.log(`进度: ${(progress * 100).toFixed(0)}% - 当前数字: ${currentNum}`);
                }

                // 11. 完成
                if (progress >= 1.0) {
                    // 最终位置
                    this.ballAngle = wheelAngle + targetRelativeAngle;
                    this.ballSpeed = this.wheel.rotationSpeed;
                    this.orbitRadius = endRadius;
                    this.updatePosition();

                    // 验证结果
                    const finalRelAngle = this.normalizeAngle(this.ballAngle - this.wheel.currentAngle);
                    const finalNum = this.calculateNumberFromAngle(finalRelAngle);

                    console.log(`\n🎯 完成!`);
                    console.log(`目标数字: ${targetNumber}, 最终数字: ${finalNum}`);
                    console.log(`最终相对角度: ${math.toDegree(finalRelAngle).toFixed(1)}°`);

                    if (finalNum === targetNumber) {
                        console.log(`✅ 准确命中目标!`);
                    } else {
                        console.log(`❌ 未命中目标，需要调整角度映射`);
                    }

                    this.ballState = 'locked';
                    this.isRelativeLocked = true;
                    resolve();
                } else {
                    requestAnimationFrame(animate);
                }
            };

            animate();
        });
    }

    // 辅助方法：从角度计算数字
    private calculateNumberFromAngle(relativeAngle: number): number {
        const map = this.getNumberAngleMap();
        const sectorSize = (2 * Math.PI) / 37;

        // 归一化角度
        const normalizedAngle = this.normalizeAngle(relativeAngle);

        // 找到最接近的角度对应的数字
        let closestNum = -1;
        let minDiff = Infinity;

        for (const [num, angle] of Object.entries(map)) {
            const diff = Math.abs(this.normalizeAngle(normalizedAngle - Number(angle)));
            if (diff < minDiff) {
                minDiff = diff;
                closestNum = Number(num);
            }
        }

        return closestNum;
    }


    // 锁定到轮盘相对位置
    lockToWheel(): void {
        this.ballState = 'locked';
        this.isRelativeLocked = true;
        this.ballSpeed = this.wheel.rotationSpeed;

        // 没有轨迹需要清除
    }
    resetGame(): void {
        this.wheel.reset();
        // this.ball.reset();
        this.isGameRunning = false;
        this.currentPhase = 0;
        //
        this.ball.active = false;
        this.ballState = 'idle';
        this.ballSpeed = 0;
        this.ballAngle = 0;
        this.orbitRadius = 2.5;
        this.isRelativeLocked = false;
        this.node.setScale(v3(1, 1, 1));
        this.unscheduleAllCallbacks();
    }



    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonStart(event: cc.EventTouch) {
        this.startGame()
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_ball: [cc.Node],
            cc_buttonStart: [GButton, this.onClickButtonStart.bind(this)],
            cc_labelResult: [cc.Label],
            cc_sprBg: [cc.Sprite],
            cc_wheel: [CustomRouletteWheel],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected ball: cc.Node = null;
    protected buttonStart: GButton = null;
    protected labelResult: cc.Label = null;
    protected sprBg: cc.Sprite = null;
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
