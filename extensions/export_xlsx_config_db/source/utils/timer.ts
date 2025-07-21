export default class Timer {
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







    ///// 生命周期 /////
    _repeatCount = -1;
    _span = 1;
    _callback = null;
    _intervalId = null;
    _count = 0;
    _deltaTime = 0;

    lastTriggerTime;

    /**
     * 构造一个Timer
     * @param span 间隔（秒）
     * @param times 重复次数，-1为永久运行
     * @param callback 回调
     */
    constructor (span, repeatCount, callback) {
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
            } catch (error) {
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