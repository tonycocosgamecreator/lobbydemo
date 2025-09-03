import { Label } from 'cc';
import { Tween } from 'cc';
import { tween } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GoldCounter')
export class GoldCounter extends Component {
    @property(Label)
    goldLabel: Label = null!;

    // 当前显示的金币数量
    private _currentGold: number = 0;

    // 目标金币数量
    private _targetGold: number = 0;

    // 是否正在动画中
    private _isAnimating: boolean = false;

    // 动画持续时间（秒）
    private _animationDuration: number = 0.4;

    onLoad() {
        this.updateGoldDisplay();
    }

    /**
     * 设置金币数量（无动画）
     * @param amount 金币数量
     */
    setGold(amount: number) {
        this._currentGold = amount;
        this._targetGold = amount;
        this.updateGoldDisplay();
    }

    /**
     * 增加金币（带动画效果）
     * @param amount 增加的数量
     */
    addGold(amount: number) {
        this._targetGold += amount;

        if (!this._isAnimating) {
            this.startAnimation();
        }
    }

    /**
     * 缓动函数 - sineOut
     */
    private easeSineOut(t: number): number {
        return Math.sin(t * Math.PI / 2);
    }

    /**
     * 缓动函数 - quadraticOut
     */
    private easeQuadOut(t: number): number {
        return t * (2 - t);
    }

    /**
     * 开始金币增加动画
     */
    private startAnimation() {
        this._isAnimating = true;

        const startValue = this._currentGold;
        const endValue = this._targetGold;
        const originalScale = this.goldLabel.node.scale.clone();

        // 计算动画持续时间
        const duration = Math.min(this._animationDuration, 0.5 + (endValue - startValue) / 1000 * 0.5);

        let startTime = Date.now();

        const updateGold = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);

            // 使用缓动函数计算当前值
            const easedProgress = this.easeQuadOut(progress);
            this._currentGold = Math.floor(startValue + (endValue - startValue) * easedProgress);

            // 更新显示
            this.updateGoldDisplay();

            // // 添加缩放效果
            // if (progress < 0.3) {
            //     // 开始阶段快速放大
            //     const scale = 1 + 0.3 * (progress / 0.3);
            //     this.goldLabel.node.setScale(scale, scale, 1);
            // } else if (progress < 0.6) {
            //     // 中间阶段保持放大
            //     this.goldLabel.node.setScale(1.3, 1.3, 1);
            // } else {
            //     // 结束阶段缓慢恢复
            //     const scale = 1.3 - 0.3 * ((progress - 0.6) / 0.4);
            //     this.goldLabel.node.setScale(scale, scale, 1);
            // }

            // 如果动画未完成，继续更新
            if (progress < 1) {
                requestAnimationFrame(updateGold);
            } else {
                // 动画完成
                this.goldLabel.node.setScale(originalScale);
                this._currentGold = endValue;
                this.updateGoldDisplay();

                // 检查是否需要继续动画
                if (this._currentGold < this._targetGold) {
                    this.startAnimation();
                } else {
                    this._isAnimating = false;
                }
            }
        };

        // 开始动画
        requestAnimationFrame(updateGold);
    }
    private animObj = null;
 

    /**
     * 更新金币显示
     */
    private updateGoldDisplay() {
        if (this.goldLabel) {
            this.goldLabel.string = this.formatNumber(this._currentGold);
        }
    }

    /**
     * 格式化数字，添加千位分隔符
     */
    private formatNumber(num: number): string {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * 设置动画持续时间
     */
    setAnimationDuration(duration: number) {
        this._animationDuration = duration;
    }

    /**
     * 立即完成当前动画
     */
    completeAnimation() {
        this._currentGold = this._targetGold;
        this.updateGoldDisplay();
        this._isAnimating = false;
        this.reset();
        this.goldLabel.node.setScale(1, 1, 1);
    }

    /**
     * 获取当前金币数量
     */
    getCurrentGold(): number {
        return this._currentGold;
    }

    /**
     * 获取目标金币数量
     */
    getTargetGold(): number {
        return this._targetGold;
    }

    reset() {
        if (this.animObj) {
            Tween.stopAllByTarget(this.animObj);
        }
    }
}


