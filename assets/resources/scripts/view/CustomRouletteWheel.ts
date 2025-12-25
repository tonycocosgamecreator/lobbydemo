// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import { tween } from 'cc';
import { math } from 'cc';
import { Vec3 } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomRouletteWheel')
export default class CustomRouletteWheel extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    update(dt: number): void {
        if (this._isSpinning && this._rotationSpeed > 0) {
            this._currentAngle += this._rotationSpeed * dt;
            this._currentAngle = ((this._currentAngle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
            this.updateRotation();
        }
    }
    //------------------------ 内部逻辑 ------------------------//
    _currentAngle: number = 0; // 当前角度（弧度）
    _rotationSpeed: number = 0; // 旋转速度（弧度/秒）
    _isSpinning: boolean = false;
    _enterPos: Vec3 = new Vec3();
    _hiddenPos: Vec3 = new Vec3();
    // 角度相关方法
    get currentAngle(): number {
        return this._currentAngle;
    }

    get rotationSpeed(): number {
        return this._rotationSpeed;
    }

    get Position(): Vec3 {
        return this.node.getPosition()
    }

    buildUi() {
        this._enterPos = new Vec3(0, 180, 0);
        this._hiddenPos = this._enterPos.clone();
        this._hiddenPos.y += 630;
        this.node.setPosition(this._hiddenPos);
    }

    async playEnter(duration: number = 0.5): Promise<void> {
        return new Promise((resolve) => {
            this.node.active = true;
            tween(this.node)
                .stop()
                .set({ position: this._hiddenPos, scale: new Vec3(0.96, 0.96, 1) })
                .to(duration, { position: this._enterPos }, { easing: 'backOut' })
                .call(() => {
                    resolve();
                })
                .start();
        });
    }

    async playExit(duration: number = 0.45): Promise<void> {
        return new Promise((resolve) => {
            tween(this.node)
                .stop()
                .to(duration, { position: this._hiddenPos }, { easing: 'quadIn' })
                .call(() => {
                    resolve();
                })
                .start();
        });
    }

    updateRotation(): void {
        if (this._currentAngle >= 2 * Math.PI) {
            this._currentAngle -= 2 * Math.PI;
        } else if (this._currentAngle < 0) {
            this._currentAngle += 2 * Math.PI;
        }
        const degrees = math.toDegree(this._currentAngle);
        this.node.setRotationFromEuler(0, 0, -degrees);
    }

    async startSpin(targetRPS: number = 1, speedTime: number = 1): Promise<void> {
        return new Promise((resolve) => {
            if (this._isSpinning) {
                resolve();
                return;
            }
            this._isSpinning = true;
            const speedWrapper = { value: 0 };
            // 转换为弧度/秒：2π * 圈数/秒
            const targetSpeed = (2 * Math.PI) * targetRPS;
            tween(speedWrapper)
                .to(speedTime, { value: targetSpeed }, {
                    easing: 'quartIn',
                    onUpdate: (target: any) => {
                        this._rotationSpeed = target.value;
                    },
                    onComplete: () => {
                        console.log(`轮盘达到稳定速度: ${(this._rotationSpeed / (2 * Math.PI)).toFixed(2)}圈/秒`);
                        resolve();
                    }
                })
                .start();
        });
    }
    /**
     * 软减速：把轮盘速度从当前值缓慢降到一个“仍在转”的最小速度（不会停）
     * 用于在球 slowDownAndStop 期间提前让 wheel 开始减速，但真正停止留给后续 slowDownAndStop/lockToWheel 阶段。
     */
    async softSlowDown(duration: number = 1.6, keepSpeedRatio: number = 0.6): Promise<void> {
        return new Promise((resolve) => {
            if (!this._isSpinning) {
                resolve();
                return;
            }
            const startSpeed = this._rotationSpeed;
            const startAbs = Math.abs(startSpeed);
            const sign = startSpeed >= 0 ? 1 : -1;

            // 确保不会减到 0（至少留一点点速度）
            const minAbs = Math.max(startAbs * keepSpeedRatio, 0.03);

            const speedWrapper = { value: startAbs };
            tween(speedWrapper)
                .stop()
                .to(duration, { value: minAbs }, {
                    easing: 'quadOut',
                    onUpdate: (target: any) => {
                        // 只要还在 spinning，就持续更新；否则退出
                        if (!this._isSpinning) return;
                        this._rotationSpeed = sign * Math.max(target.value, minAbs);
                    },
                    onComplete: () => {
                        if (this._isSpinning) {
                            this._rotationSpeed = sign * minAbs;
                        }
                        resolve();
                    }
                })
                .start();
        });
    }

    async slowDownAndStop(duration: number = 2): Promise<void> {
        return new Promise((resolve) => {
            if (!this._isSpinning) {
                resolve();
                return;
            }
            const startSpeed = this._rotationSpeed;
            let elapsed = 0;
            const update = (dt: number) => {
                if (!this._isSpinning) return;

                elapsed += dt;
                const progress = Math.min(elapsed / duration, 1);
                // easeOutCubic（前快后慢，很适合轮盘）
                const easeOut = 1 - Math.pow(1 - progress, 3);
                this._rotationSpeed = startSpeed * (1 - easeOut);
                if (this._rotationSpeed < 0.02 || progress >= 1) {
                    this._rotationSpeed = 0;
                    this._isSpinning = false;
                    this.unschedule(update);
                    resolve();
                }
            };
            this.schedule(update);
        });
    }

    reset(): void {
        this._isSpinning = false;
        this._currentAngle = 0;
        this._rotationSpeed = 0;
        this.node.setPosition(this._hiddenPos);
        this.updateRotation();
        this.unscheduleAllCallbacks();
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
   public static readonly VIEW_NAME    = 'CustomRouletteWheel';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomRouletteWheel.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomRouletteWheel.VIEW_NAME;
    }
    // @view export resource end
}