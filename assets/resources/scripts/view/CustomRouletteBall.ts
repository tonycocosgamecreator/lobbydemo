// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import CustomRouletteWheel from './CustomRouletteWheel';
import { Vec3 } from 'cc';
import { math } from 'cc';
import { tween } from 'cc';
import { UIOpacity } from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;
type BallState = 'idle' | 'appear' | 'fast' | 'slow' | 'locked' | 'stopped';
@ccclass('CustomRouletteBall')
export default class CustomRouletteBall extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    update(dt: number) {
        if (!this.ndBall.active || !this._wheel) return;
        switch (this.state) {
            case 'fast':
                this.ballAngle += this.ballSpeed * dt;
                this.updatePosition();
                break;

            case 'locked':
                if (this.isRelativeLocked) {
                    this.updatePosition();
                }
                break;
        }
    }

    //------------------------ 内部逻辑 ------------------------//
    _wheel: CustomRouletteWheel = null;
    enterRingRadius = 270;
    outerRingRadius = 250;
    innerRingRadius = 180;
    ballAngle = 0;
    ballSpeed = 0;
    orbitRadius = 250;
    state: BallState = 'idle';
    targetOnWheel = 0;
    isRelativeLocked = false;
    hasBoostFx: boolean = false;
    init(wheel: CustomRouletteWheel) {
        this._wheel = wheel;
    }

    updatePosition() {
        if (!this._wheel) return;
        if (this.isRelativeLocked) {
            this.ballAngle = this.targetOnWheel - this._wheel.currentAngle;
        } else {
            if (this.ballAngle >= 2 * Math.PI) this.ballAngle -= 2 * Math.PI;
            else if (this.ballAngle < 0) this.ballAngle += 2 * Math.PI;
        }
        const x = Math.cos(this.ballAngle) * this.orbitRadius;
        const y = Math.sin(this.ballAngle) * this.orbitRadius;
        this.ndBall.setPosition(new Vec3(x, y, 0));
    }

    async appearOnOuterRing(): Promise<void> {
        return new Promise((resolve) => {
            this.ndBall.active = true;
            this.state = 'appear';

            // 顶部 90°：位置 (0, 270)
            const targetPos = new Vec3(0, this.enterRingRadius, 0);

            // 起点：从更上方掉下来
            const dropHeight = 200;
            const startPos = new Vec3(0, this.enterRingRadius + dropHeight, 0);

            const opacity = this.ndBall.getComponent(UIOpacity) || this.ndBall.addComponent(UIOpacity);
            opacity.opacity = 0;

            this.ndBall.setPosition(startPos);
            // this.ndBall.setScale(new Vec3(0.95, 0.95, 1));

            // 掉落尽量干净别 bounce（bounce 在旋转盘上会显假）
            tween(this.ndBall)
                .stop()
                .to(0.2, { position: targetPos }, { easing: 'quadIn' })
                // .to(0.10, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .call(() => {
                    // 此时球在边缘 270 的顶部点，后续由 startFastRotation 负责“收缩+转起来”
                    this.ballAngle = Math.PI / 2;
                    this.orbitRadius = this.enterRingRadius;
                    resolve();
                })
                .start();

            tween(opacity)
                .stop()
                .to(0.18, { opacity: 255 }, { easing: 'quadOut' })
                .start();
        });
    }

    async startFastRotation(): Promise<void> {
        return new Promise((resolve) => {

            const wheelSpeed = Math.abs(this._wheel.rotationSpeed);
            const targetBallSpeed = wheelSpeed * 1.5;

            const accelTime = 0.6;     // 速度加速总时长
            const shrinkTime = 0.35;   // 半径收缩时长（可调：越短越“落槽”）

            // 进入 fast：之后由 update(dt) 来更新 ballAngle & position
            this.state = 'fast';

            // 从边缘开始
            this.orbitRadius = this.enterRingRadius;
            this.ballSpeed = 0;

            let elapsed = 0;
            let stableTime = 0;

            const tick = (dt: number) => {
                elapsed += dt;

                // 1) 半径：270 -> 250（仅在 shrinkTime 内完成）
                const rt = Math.min(elapsed / shrinkTime, 1);
                const rEase = 1 - Math.pow(1 - rt, 3); // easeOutCubic
                this.orbitRadius = this.enterRingRadius + (this.outerRingRadius - this.enterRingRadius) * rEase;
                if (this.orbitRadius < this.outerRingRadius) {
                    this.orbitRadius = this.outerRingRadius;
                }

                // 2) 速度：0 -> targetBallSpeed（在 accelTime 内完成）
                const st = Math.min(elapsed / accelTime, 1);
                this.ballSpeed = targetBallSpeed * st;

                // 注意：这里不更新 ballAngle / 不 updatePosition！
                // 让 update(dt) 统一负责位置更新，避免“双驱动”。

                if (st >= 1) {
                    stableTime += dt;
                    if (stableTime >= 0.15) {
                        this.orbitRadius = this.outerRingRadius; // 强制落在外圈中心
                        this.unschedule(tick);
                        resolve();
                    }
                }
            };

            this.schedule(tick);
        });
    }

    setTargetOnWheel(targetNumber: number) {
        this.targetOnWheel = ((this.getNumberDisplayOnWheel(targetNumber)) % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
    }

    async targetDecelerationPosition(): Promise<void> {
        return new Promise((resolve) => {
            this.state = 'slow';
            const tick = (dt: number) => {
                const speed = this.ballSpeed * dt;
                this.ballAngle += speed;
                this.updatePosition();
                // 2. 计算相对角度和角度差
                const wheelDisplayAngle = -this._wheel.currentAngle;
                let ballRelativeToWheel = this.ballAngle - wheelDisplayAngle;
                ballRelativeToWheel = ((ballRelativeToWheel % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
                let angleDiff = this.targetOnWheel - ballRelativeToWheel;
                let wheelspeed = this._wheel.rotationSpeed * dt
                // 调整到 [0, 2π) 范围
                if (angleDiff < 0) { angleDiff += 2 * Math.PI; }
                if (angleDiff < Math.PI || angleDiff > (Math.PI + speed + wheelspeed)) {
                    return;
                }
                let targetball = this.targetOnWheel + Math.PI + wheelDisplayAngle;
                targetball = ((targetball % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
                this.ballAngle = targetball;
                this.updatePosition(); this.unschedule(tick); resolve();
            }; this.schedule(tick);
        });
    }

    async slowDownAndStop(duration: number = 1.5): Promise<void> {
        return new Promise((resolve) => {
            const triggerRadius = 220;
            const triggerWindow = 6;

            const startBallSpeed = Math.abs(this.ballSpeed);
            let elapsed = 0;

            const slowDown2Update = (dt: number) => {
                elapsed += dt;

                const wheelSpeedAbs = Math.abs(this._wheel.rotationSpeed);
                const minSpeed = wheelSpeedAbs * 0.8;

                // 0..1
                const p = Math.min(elapsed / duration, 1);

                // 减速曲线：前慢后快（更“拉长”减速观感）
                // 想更慢：把 3 改 2；想后段更猛：改 4
                const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic

                // 速度从 start -> min
                const curSpeed = startBallSpeed + (minSpeed - startBallSpeed) * ease;
                this.ballSpeed = Math.max(curSpeed, minSpeed);

                // 半径收缩与速度进度绑定（保持你原意）
                this.orbitRadius = this.outerRingRadius - ease * (this.outerRingRadius - this.innerRingRadius);

                if (!this.hasBoostFx && Math.abs(this.orbitRadius - triggerRadius) <= triggerWindow) {
                    this.hasBoostFx = true;
                    this.playBallBoostFx();
                }

                this.ballAngle += this.ballSpeed * dt;
                this.updatePosition();

                const wheelDisplayAngle = -this._wheel.currentAngle;
                let ballRelativeToWheel = this.ballAngle - wheelDisplayAngle;
                ballRelativeToWheel = ((ballRelativeToWheel % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);

                let angleDiff = this.targetOnWheel - ballRelativeToWheel;
                if (angleDiff < 0) angleDiff += 2 * Math.PI;

                // ✅ 仍然用你的对齐窗口
                if (angleDiff <= 0.1 && p > 0.35) { // 加个保护：至少跑一段时间再允许停
                    this.unschedule(slowDown2Update);
                    resolve();
                    return;
                }

                // 超时兜底
                if (p >= 1) {
                    this.unschedule(slowDown2Update);
                    resolve();
                }
            };

            this.schedule(slowDown2Update);
        });
    }


    lockToWheel() {
        this.state = 'locked';
        this.isRelativeLocked = true;
    }

    fadeOutBall(duration: number = 0.28): Promise<void> {
        return new Promise((resolve) => {
            if (!this.ndBall || !this.ndBall.isValid || !this.ndBall.active) {
                resolve();
                return;
            }
            const opacity = this.ndBall.getComponent(UIOpacity) || this.ndBall.addComponent(UIOpacity);

            tween(this.ndBall)
                .stop()
                .to(duration, { scale: new Vec3(0.9, 0.9, 1) }, { easing: 'quadIn' })
                .start();

            tween(opacity)
                .stop()
                .to(duration, { opacity: 0 }, { easing: 'quadIn' })
                .call(() => {
                    this.ndBall.active = false;
                    // 还原
                    opacity.opacity = 255;
                    this.ndBall.setScale(new Vec3(1, 1, 1));
                    resolve();
                })
                .start();
        });
    }


    playBallBoostFx(): void {
        const sprite = this.ndBall.children[0];
        if (!sprite) return;
        sprite.setPosition(Vec3.ZERO);
        let nodePos = this.ndBall.getPosition();
        const direction = new Vec3();
        Vec3.subtract(direction, Vec3.ZERO, new Vec3(nodePos.x, nodePos.y, 0));
        // 2. 归一化得到单位方向向量
        const normalizedDir = new Vec3();
        Vec3.normalize(normalizedDir, direction);
        const offset = new Vec3(
            normalizedDir.x * 36,
            normalizedDir.y * 36,
            0
        );
        cc.tween(sprite)
            .to(0.1, { position: offset })
            .to(0.2, { position: Vec3.ZERO })
            .start()
    }


    getNumberDisplayOnWheel(targetNumber: number): number {
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

    reset() {
        this.hasBoostFx = false;
        this.ndBall.active = false;
        this.ballAngle = 0;
        this.ballSpeed = 0;
        this.orbitRadius = this.outerRingRadius;
        this.state = 'idle';
        this.isRelativeLocked = false;
        this.ndBall.children[0].setPosition(Vec3.ZERO);
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
            cc_ndBall: [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected ndBall: cc.Node = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomRouletteBall';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomRouletteBall.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomRouletteBall.VIEW_NAME;
    }
    // @view export resource end
}
