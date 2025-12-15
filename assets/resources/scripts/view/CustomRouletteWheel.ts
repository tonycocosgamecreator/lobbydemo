// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { tween } from 'cc';
import { math } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomRouletteWheel')
export default class CustomRouletteWheel extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    //------------------------ 内部逻辑 ------------------------//
    wheelRadius = 328;
    sectors: number = 37;
    startSpeed: number = 200; // 调整为合适的速度
    spinDuration: number = 5;
    private _currentAngle: number = 0; // 当前角度（弧度）
    private _rotationSpeed: number = 0; // 旋转速度（弧度/秒）
    private isSpinning: boolean = false;

    // 速度参数
    maxSpinSpeed: number = 30; // 最大旋转速度（弧度/秒），增加这个值可以让转盘转得更快
    accelerationTime: number = 0.5; // 加速时间（秒）
    decelerationTime: number = 2.0; // 减速时间（秒），减少这个值可以更快停止
    minSpeedThreshold: number = 0.1; // 最小速度阈值（弧度/秒），低于这个值就停止

    // 角度相关方法
    get currentAngle(): number {
        return this._currentAngle;
    }

    set currentAngle(value: number) {
        this._currentAngle = value;
        this.updateRotation();
    }

    get rotationSpeed(): number {
        return this._rotationSpeed;
    }

    set rotationSpeed(value: number) {
        this._rotationSpeed = value;
    }

    // 更新轮盘旋转
    private updateRotation(): void {
        // 1. 标准化角度到 [0, 2π) 范围
        if (this._currentAngle >= 2 * Math.PI) {
            this._currentAngle -= 2 * Math.PI;
        } else if (this._currentAngle < 0) {
            this._currentAngle += 2 * Math.PI;
        }
        // 将弧度转换为度（用于显示）
        const degrees = math.toDegree(this._currentAngle);
        // 在Cocos Creator 3.x中，应该使用节点的欧拉角
        this.node.setRotationFromEuler(0, 0, -degrees);
    }

    // 开始旋转 - 加速到目标速度
    startSpin(targetRPS: number = 2.5): Promise<void> {  // RPS = Revolutions Per Second 每秒圈数
        return new Promise((resolve) => {
            if (this.isSpinning) {
                resolve();
                return;
            }

            this.isSpinning = true;
            const speedWrapper = { value: 0 };

            // 转换为弧度/秒：2π * 圈数/秒
            const targetSpeed = (2 * Math.PI) * targetRPS;

            console.log(`启动旋转: ${targetRPS}圈/秒, ${targetSpeed.toFixed(2)}弧度/秒`);

            tween(speedWrapper)
                .to(1.2, { value: targetSpeed }, {
                    easing: 'quartIn',
                    onUpdate: (target: any) => {
                        this.rotationSpeed = target.value;
                    },
                    onComplete: () => {
                        console.log(`轮盘达到稳定速度: ${(this.rotationSpeed / (2 * Math.PI)).toFixed(2)}圈/秒`);
                        resolve();
                    }
                })
                .start();
        });
    }

    // 减速停止 - 使用更激进的减速曲线
    slowDownAndStop(duration: number = 3.5): Promise<void> {
        return new Promise((resolve) => {
            if (!this.isSpinning) {
                resolve();
                return;
            }

            console.log(`开始减速: 当前速度 ${(this._rotationSpeed / (2 * Math.PI)).toFixed(2)}圈/秒`);

            let elapsedTime = 0;

            const slowDownUpdate = () => {
                if (!this.isSpinning) return;

                elapsedTime += 0.016;
                const progress = Math.min(elapsedTime / duration, 1);

                // 更真实的减速曲线
                let friction;
                if (progress < 0.3) {
                    friction = 0.996; // 开始阶段减速较慢
                } else if (progress < 0.6) {
                    friction = 0.990; // 中间阶段正常减速
                } else if (progress < 0.85) {
                    friction = 0.980; // 接近停止时减速加快
                } else {
                    friction = 0.960; // 最后阶段快速停止
                }
                this._rotationSpeed *= friction;

                // 显示当前速度
                if (Math.floor(elapsedTime * 10) % 10 === 0) { // 每0.1秒显示一次
                    const currentRPS = this._rotationSpeed / (2 * Math.PI);
                    console.log(`减速中: ${currentRPS.toFixed(3)}圈/秒, 进度 ${(progress * 100).toFixed(1)}%`);
                }

                if (this._rotationSpeed < 0.02 || progress >= 1) { // 调整停止阈值
                    this._rotationSpeed = 0;
                    this.isSpinning = false;
                    console.log('轮盘停止旋转');
                    this.unschedule(slowDownUpdate);
                    resolve();
                }
            };
            this.schedule(slowDownUpdate, 0.016);
        });
    }

    stop() {
        this.isSpinning = false;
    }

    // 重置
    reset(): void {
        this.isSpinning = false;
        this._currentAngle = 0;
        this._rotationSpeed = 0;
        this.updateRotation();
        this.unscheduleAllCallbacks();
    }

    // 更新函数
    update(deltaTime: number): void {
        if (this.isSpinning && this._rotationSpeed > 0) {
            // 更新角度：速度 * 时间
            this._currentAngle += this._rotationSpeed * deltaTime;
            if (this._currentAngle > 360) this._currentAngle -= 360;
            this.updateRotation();
        }
    }

    // 辅助方法：等待轮盘稳定
    waitForWheelStable(): Promise<void> {
        return new Promise((resolve) => {
            const checkStable = () => {
                if (Math.abs(this.rotationSpeed) > 0.1) { // 有足够速度
                    resolve();
                } else {
                    setTimeout(checkStable, 50);
                }
            };
            checkStable();
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
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomRouletteWheel';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomRouletteWheel.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomRouletteWheel.VIEW_NAME;
    }

    // @view export resource end
}