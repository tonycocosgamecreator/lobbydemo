"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Timer {
    ///// 静态方法 /////
    /**
     * 延迟调用回调
     * @param span 时间（秒）
     * @param callback 回调
     * @param node? 可选，绑定到节点上
     */
    static callLater(span, callback) {
        let timer = new Timer(span, 1, callback);
        timer.start();
        return timer;
    }
    static callLoop(span, callback) {
        let timer = new Timer(span, -1, callback);
        timer.start();
        return timer;
    }
    static time() {
        return new Date().getTime() / 1000;
    }
    /**
     * 构造一个Timer
     * @param span 间隔（秒）
     * @param times 重复次数，-1为永久运行
     * @param callback 回调
     */
    constructor(span, repeatCount, callback) {
        ///// 生命周期 /////
        this._repeatCount = -1;
        this._span = 1;
        this._callback = null;
        this._intervalId = null;
        this._count = 0;
        this._deltaTime = 0;
        this._span = span;
        this._repeatCount = repeatCount;
        this._callback = callback;
        this.lastTriggerTime = Timer.time();
    }
    _onSpan() {
        // 次数+1
        this._count++;
        this._deltaTime = Timer.time() - this.lastTriggerTime;
        this.lastTriggerTime = Timer.time();
        // 调用回调
        if (this._callback) {
            try {
                this._callback(this);
            }
            catch (error) {
                console.warn("警告] Timer._onSpan callback has error", error);
            }
        }
        // 检测是否需要停止
        if (this._repeatCount >= 0 && this._count >= this._repeatCount) {
            this.stop();
        }
    }
    ///// 接口 /////
    /**
     * 判断Timer是否正在运行
     */
    isRunning() {
        return this._intervalId != null;
    }
    /**
     * 获取当前运行的次数
     */
    get count() {
        return this._count;
    }
    /**
     * 获取运行间隔
     */
    get span() {
        return this._span;
    }
    /**
     * 获取两帧之间的时间差（真实时间）
     */
    get deltaTime() {
        return this._deltaTime;
    }
    /**
     * 开始timer
     * @param bIgnoreForeverWarn 是否禁用永久运行警告（无宿主的永久运行timer，在start时会给予警告）
     */
    start() {
        this.stop();
        if (!this._callback) {
            console.warn("警告] Timer.start callback未设置！");
            return this;
        }
        this._count = 0;
        this._intervalId = setInterval(this._onSpan.bind(this), this.span * 1000);
        this.lastTriggerTime = Timer.time();
        return this;
    }
    /**
     * 停止timer
     */
    stop() {
        if (this._intervalId != null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        return this;
    }
}
exports.default = Timer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdXRpbHMvdGltZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxNQUFxQixLQUFLO0lBQ3RCLGdCQUFnQjtJQUNoQjs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFFBQVE7UUFDM0IsSUFBSSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN6QyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDZCxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBQ0QsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUTtRQUMxQixJQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2QsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUlELE1BQU0sQ0FBQyxJQUFJO1FBQ1AsT0FBTyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztJQUN2QyxDQUFDO0lBa0JEOzs7OztPQUtHO0lBQ0gsWUFBYSxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVE7UUFoQnhDLGdCQUFnQjtRQUNoQixpQkFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLFVBQUssR0FBRyxDQUFDLENBQUM7UUFDVixjQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLGdCQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ25CLFdBQU0sR0FBRyxDQUFDLENBQUM7UUFDWCxlQUFVLEdBQUcsQ0FBQyxDQUFDO1FBV1gsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7UUFDaEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFFMUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDeEMsQ0FBQztJQUVELE9BQU87UUFDSCxPQUFPO1FBQ1AsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2QsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUN0RCxJQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUVwQyxPQUFPO1FBQ1AsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2hCLElBQUk7Z0JBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN4QjtZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUNaLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDL0Q7U0FDSjtRQUVELFdBQVc7UUFDWCxJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtZQUM1RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDZjtJQUNMLENBQUM7SUFVRCxjQUFjO0lBQ2Q7O09BRUc7SUFDSCxTQUFTO1FBQ0wsT0FBTyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQztJQUNwQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLEtBQUs7UUFDTCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDdkIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxJQUFJO1FBQ0osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksU0FBUztRQUNULE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUMzQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSztRQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUVaLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUM3QyxPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDaEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztRQUUxRSxJQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUVwQyxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJO1FBQ0EsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksRUFBRTtZQUMxQixhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1NBQzNCO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQVdKO0FBekpELHdCQXlKQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IGNsYXNzIFRpbWVyIHtcclxuICAgIC8vLy8vIOmdmeaAgeaWueazlSAvLy8vL1xyXG4gICAgLyoqXHJcbiAgICAgKiDlu7bov5/osIPnlKjlm57osINcclxuICAgICAqIEBwYXJhbSBzcGFuIOaXtumXtO+8iOenku+8iVxyXG4gICAgICogQHBhcmFtIGNhbGxiYWNrIOWbnuiwg1xyXG4gICAgICogQHBhcmFtIG5vZGU/IOWPr+mAie+8jOe7keWumuWIsOiKgueCueS4ilxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgY2FsbExhdGVyKHNwYW4sIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgbGV0IHRpbWVyID0gbmV3IFRpbWVyKHNwYW4sIDEsIGNhbGxiYWNrKTtcclxuICAgICAgICB0aW1lci5zdGFydCgpO1xyXG4gICAgICAgIHJldHVybiB0aW1lcjtcclxuICAgIH1cclxuICAgIHN0YXRpYyBjYWxsTG9vcChzcGFuLCBjYWxsYmFjaykge1xyXG4gICAgICAgIGxldCB0aW1lciA9IG5ldyBUaW1lcihzcGFuLCAtMSwgY2FsbGJhY2spO1xyXG4gICAgICAgIHRpbWVyLnN0YXJ0KCk7XHJcbiAgICAgICAgcmV0dXJuIHRpbWVyO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgc3RhdGljIHRpbWUoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMTAwMDtcclxuICAgIH1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiAgICAvLy8vLyDnlJ/lkb3lkajmnJ8gLy8vLy9cclxuICAgIF9yZXBlYXRDb3VudCA9IC0xO1xyXG4gICAgX3NwYW4gPSAxO1xyXG4gICAgX2NhbGxiYWNrID0gbnVsbDtcclxuICAgIF9pbnRlcnZhbElkID0gbnVsbDtcclxuICAgIF9jb3VudCA9IDA7XHJcbiAgICBfZGVsdGFUaW1lID0gMDtcclxuXHJcbiAgICBsYXN0VHJpZ2dlclRpbWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmnoTpgKDkuIDkuKpUaW1lclxyXG4gICAgICogQHBhcmFtIHNwYW4g6Ze06ZqU77yI56eS77yJXHJcbiAgICAgKiBAcGFyYW0gdGltZXMg6YeN5aSN5qyh5pWw77yMLTHkuLrmsLjkuYXov5DooYxcclxuICAgICAqIEBwYXJhbSBjYWxsYmFjayDlm57osINcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IgKHNwYW4sIHJlcGVhdENvdW50LCBjYWxsYmFjaykge1xyXG4gICAgICAgIHRoaXMuX3NwYW4gPSBzcGFuO1xyXG4gICAgICAgIHRoaXMuX3JlcGVhdENvdW50ID0gcmVwZWF0Q291bnQ7XHJcbiAgICAgICAgdGhpcy5fY2FsbGJhY2sgPSBjYWxsYmFjaztcclxuXHJcbiAgICAgICAgdGhpcy5sYXN0VHJpZ2dlclRpbWUgPSBUaW1lci50aW1lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgX29uU3BhbigpIHtcclxuICAgICAgICAvLyDmrKHmlbArMVxyXG4gICAgICAgIHRoaXMuX2NvdW50Kys7XHJcbiAgICAgICAgdGhpcy5fZGVsdGFUaW1lID0gVGltZXIudGltZSgpIC0gdGhpcy5sYXN0VHJpZ2dlclRpbWU7XHJcbiAgICAgICAgdGhpcy5sYXN0VHJpZ2dlclRpbWUgPSBUaW1lci50aW1lKCk7XHJcblxyXG4gICAgICAgIC8vIOiwg+eUqOWbnuiwg1xyXG4gICAgICAgIGlmICh0aGlzLl9jYWxsYmFjaykge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY2FsbGJhY2sodGhpcyk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLorablkYpdIFRpbWVyLl9vblNwYW4gY2FsbGJhY2sgaGFzIGVycm9yXCIsIGVycm9yKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g5qOA5rWL5piv5ZCm6ZyA6KaB5YGc5q2iXHJcbiAgICAgICAgaWYgKHRoaXMuX3JlcGVhdENvdW50ID49IDAgJiYgdGhpcy5fY291bnQgPj0gdGhpcy5fcmVwZWF0Q291bnQpIHtcclxuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4gICAgLy8vLy8g5o6l5Y+jIC8vLy8vXHJcbiAgICAvKipcclxuICAgICAqIOWIpOaWrVRpbWVy5piv5ZCm5q2j5Zyo6L+Q6KGMXHJcbiAgICAgKi9cclxuICAgIGlzUnVubmluZygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJ2YWxJZCAhPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog6I635Y+W5b2T5YmN6L+Q6KGM55qE5qyh5pWwXHJcbiAgICAgKi9cclxuICAgIGdldCBjb3VudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY291bnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDojrflj5bov5DooYzpl7TpmpRcclxuICAgICAqL1xyXG4gICAgZ2V0IHNwYW4oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NwYW47XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDojrflj5bkuKTluKfkuYvpl7TnmoTml7bpl7Tlt67vvIjnnJ/lrp7ml7bpl7TvvIlcclxuICAgICAqL1xyXG4gICAgZ2V0IGRlbHRhVGltZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGVsdGFUaW1lO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5byA5aeLdGltZXJcclxuICAgICAqIEBwYXJhbSBiSWdub3JlRm9yZXZlcldhcm4g5piv5ZCm56aB55So5rC45LmF6L+Q6KGM6K2m5ZGK77yI5peg5a6/5Li755qE5rC45LmF6L+Q6KGMdGltZXLvvIzlnKhzdGFydOaXtuS8mue7meS6iOitpuWRiu+8iVxyXG4gICAgICovXHJcbiAgICBzdGFydCgpIHtcclxuICAgICAgICB0aGlzLnN0b3AoKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9jYWxsYmFjaykge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLorablkYpdIFRpbWVyLnN0YXJ0IGNhbGxiYWNr5pyq6K6+572u77yBXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2NvdW50ID0gMDtcclxuICAgICAgICB0aGlzLl9pbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwodGhpcy5fb25TcGFuLmJpbmQodGhpcyksIHRoaXMuc3BhbiAqIDEwMDApO1xyXG5cclxuICAgICAgICB0aGlzLmxhc3RUcmlnZ2VyVGltZSA9IFRpbWVyLnRpbWUoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlgZzmraJ0aW1lclxyXG4gICAgICovXHJcbiAgICBzdG9wKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9pbnRlcnZhbElkICE9IG51bGwpIHtcclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9pbnRlcnZhbElkKTtcclxuICAgICAgICAgICAgdGhpcy5faW50ZXJ2YWxJZCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxufSJdfQ==