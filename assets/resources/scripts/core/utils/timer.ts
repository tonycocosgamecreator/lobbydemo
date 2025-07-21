import { Component, Node, warn } from 'cc';
// const { ccclass } = _decorator;
let _gameStartTime = 0;
let _curTime = 0;
let _lastUpdateTime = 0;
let _deltaTime: number = 0;
let _timeOffset = 0;

export default class Timer {
    private static _timeOffset: number = 0;
    //--------------------- 时间相关函数 ---------------------
    /**
     * 获取秒级time
     * 此时间会收到服务器时间偏移的影响
     * @returns time 单位秒
     */
    public static time(): number {
        return Date.now() / 1000 + this._timeOffset;
    }

    /**
     * 获取当前时间，毫秒
     * 此时间会收到服务器时间偏移的影响
     */
    public static get now() {
        return Date.now() + this._timeOffset * 1000;
    }

    public static getDateSelectorDataOfNow() {
        const date = new Date(this.now);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1, // 月份从0开始
            day: date.getDate(),
        };
    }

    /**
     * 设置时间偏移值(本地时间，与服务器时间的单边距离)
     * @param time 单位秒
     */
    public static setTimeOffset(offset: number) {
        this._timeOffset = offset;
        _timeOffset = offset;
        _curTime += offset;
        _lastUpdateTime += offset;
    }

    /**
     * 获取时间偏移值
     * @returns time 单位秒
     */
    public static getTimeOffset(): number {
        return this._timeOffset;
    }

    /**
     * 获取距离今天00:00:00的时间（秒）
     */
    public static calcTimeInDay(time: number): number {
        const todayBeginDate = new Date(time * 1000);
        todayBeginDate.setHours(0);
        todayBeginDate.setMinutes(0);
        todayBeginDate.setSeconds(0);
        todayBeginDate.setMilliseconds(0);

        return time - todayBeginDate.getTime() / 1000;
    }

    public static getMonthDays(year:number,mon:number) {
		let date = new Date(year, mon, 0)
		let days = date.getDate();
		return days;
	}

    /**
     * 是否是同一天
     * @param seconds1 单位秒
     * @param seconds2 单位秒
     */
    public static isOneDay(seconds1: number, seconds2: number): boolean {
        const d1 = new Date(seconds1 * 1000);
        const d2 = new Date(seconds2 * 1000);

        return d1.getDate() == d2.getDate() && d1.getMonth() == d2.getMonth() && d1.getFullYear() == d2.getFullYear();
    }

    /**
     * - 是否同一周
     * @param seconds1
     * @param seconds2
     */
    public static isOneWeek(seconds1: number, seconds2: number) {
        const d1 = new Date(seconds1 * 1000);
        let dayCur = d1.getDay();
        //周日 是第0天
        if (dayCur == 0) dayCur = 7;
        const hourCur = d1.getHours();
        const minCur = d1.getMinutes();
        const secondCur = d1.getSeconds();

        const deltaTime = (dayCur - 1) * 24 * 60 * 60 + hourCur * 60 * 60 + minCur * 60 + secondCur;
        const beginTime = seconds1 - deltaTime;
        const endTime = beginTime + 7 * 24 * 60 * 60;
        return seconds2 >= beginTime && seconds2 <= endTime;
    }

    /**
     * - 是否是同一月
     * @param seconds1
     * @param seconds2
     */
    public static isOneMonth(seconds1: number, seconds2: number): boolean {
        const d1 = new Date(seconds1 * 1000);
        const d2 = new Date(seconds2 * 1000);
        return d1.getMonth() == d2.getMonth() && d1.getFullYear() == d2.getFullYear();
    }

    /**
     * 获取距离本周一00:00:00的时间
     */
    public static calcTimeInWeek(time: number): number {
        const weekBeginDate = new Date(time * 1000);

        let day = weekBeginDate.getDay();
        if (day == 0) day = 7;
        // 周1~周7  day：[1, 7]

        weekBeginDate.setDate(weekBeginDate.getDate() - day + 1);
        weekBeginDate.setHours(0);
        weekBeginDate.setMinutes(0);
        weekBeginDate.setSeconds(0);
        weekBeginDate.setMilliseconds(0);
        // console.log(weekBeginDate);

        return time - weekBeginDate.getTime() / 1000;
    }

    /**
     * 获取距离今天00:00:00的时间（秒）
     */
    public static timeInToday(): number {
        const time = this.time();
        return this.calcTimeInDay(time);
    }

    /** 上一帧的间隔时间(秒) */
    public static get deltaTime(): number {
        return _deltaTime;
    }

    /** 从游戏启动到当前的时间(秒) */
    public static get timeFromGameStart(): number {
        return _curTime - _gameStartTime;
    }

    public static initTime() {
        _gameStartTime = Date.now() / 1000;
        this.updateTime();
    }

    public static updateTime() {
        _curTime = Date.now() / 1000 + _timeOffset;
        _deltaTime = _curTime - _lastUpdateTime;
        _lastUpdateTime = _curTime;
    }

    ///// 静态方法 /////
    /**
     * 延迟调用回调
     * @param span 时间（秒）
     * @param callback 回调
     * @param node? 可选，绑定到节点上
     */
    public static callLater(span: number, callback: (timer: Timer) => void, node?: Node): Timer {
        const timer = new Timer(span, 1, callback);
        if (node) {
            timer.startAndBindToNode(node);
        } else {
            timer.start();
        }
        return timer;
    }

    /**
     * 启动循环调用timer
     * @param span 间隔时间（秒）
     * @param callback 回调
     * @param bIgnoreForeverWarn true:永久调用，不报警
     */
    public static callLoop(span: number, callback: (timer: Timer) => void, bIgnoreForeverWarn: boolean): Timer;
    /**
     * 启动循环调用timer，绑定在宿主节点上
     * @param span 间隔时间（秒）
     * @param callback 回调
     * @param node 宿主节点，节点销毁后timer停止
     */
    public static callLoop(span: number, callback: (timer: Timer) => void, node?: Node): Timer;
    public static callLoop(span: number, callback: (timer: Timer) => void, e?: Node | boolean): Timer {
        const timer = new Timer(span, -1, callback);

        // log("callLoop", span, callback, e);

        if (e == true) {
            // boolean 模式重载
            const bIgnoreForeverWarn = e;
            timer.start(bIgnoreForeverWarn);
        } else if (e instanceof Node) {
            // node 模式重载
            const node = e;
            timer.startAndBindToNode(node);
        } else {
            timer.start();
        }

        return timer;
    }

    /**
     * 将指定的秒数格式化成00:00:00 | 00:00
     * @param second
     * @param count 默认为2->格式化为00:00:00格式，如果为1->格式化为00:00
     */
    public static formatSecondTime(second: number, count: number = 2): string {
        const result = [];
        while (count >= 0) {
            const current = Math.floor(second / 60 ** count);
            result.push(current);
            second -= current * 60 ** count;
            --count;
        }
        return result.map((item) => (item <= 9 ? `0${item}` : item)).join(':');
    }

    /**
     * 将这个秒分割为[0,0,0,0]这种格式 -> 00:00
     * 用于在不同的label上显示不同的数字
     * @param second
     */
    public static getSecondsSplitEveryInMinite(second: number, out?: number[]): number[] {
        const result = [];
        let count = 1;
        while (count >= 0) {
            const current = Math.floor(second / 60 ** count);
            result.push(current);
            second -= current * 60 ** count;
            --count;
        }
        out = [];
        for (let i = 0; i < result.length; i++) {
            const p = result[i];
            if (p <= 9) {
                out.push(0);
                out.push(p);
            } else {
                const t = Math.floor(p / 10);
                const y = Math.floor(p % 10);
                out.push(t);
                out.push(y);
            }
        }

        return out;
    }

    /**
     * 格式化指定时间
     * @param time
     * @param format
     */
    public static formateDate(time: number, format = 'yyyy-MM-dd HH:mm:ss'): string {
        const date = new Date(time);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const second = date.getSeconds();
        const formatMap: { [key: string]: any } = {
            yyyy: year.toString(),
            MM: month.toString().padStart(2, '0'),
            dd: day.toString().padStart(2, '0'),
            HH: hour.toString().padStart(2, '0'),
            mm: minute.toString().padStart(2, '0'),
            ss: second.toString().padStart(2, '0'),
        };
        return format.replace(/yyyy|MM|dd|HH|mm|ss/g, (match) => formatMap[match]);
    }

    ///// 生命周期 /////
    private _repeatCount: number = -1;
    private _span: number = 1;
    private _callback: ((timer: Timer) => void) | null = null;
    private _intervalId: any = null;
    private _count: number = 0;
    private _deltaTime: number = 0;

    private _bindingNode: Node | null = null;

    private lastTriggerTime: number;

    /**
     * 构造一个Timer
     * @param span 间隔（秒）
     * @param times 重复次数，-1为永久运行
     * @param callback 回调
     */
    constructor(span: number, repeatCount: number, callback: (timer: Timer) => void) {
        this._span = span;
        this._repeatCount = repeatCount;
        this._callback = callback;

        this.lastTriggerTime = Timer.time();
    }

    private _onSpan(): void {
        // 次数+1
        this._count++;
        this._deltaTime = Timer.time() - this.lastTriggerTime;
        this.lastTriggerTime = Timer.time();

        // 调用回调
        if (this._callback) {
            try {
                this._callback(this);
            } catch (error) {
                warn('警告] Timer._onSpan callback has error', error);
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
    public isRunning(): boolean {
        return this._intervalId != null;
    }

    /**
     * 获取当前运行的次数
     */
    public get count(): number {
        return this._count;
    }

    /**
     * 获取运行间隔
     */
    public get span(): number {
        return this._span;
    }

    /**
     * 获取两帧之间的时间差（真实时间）
     */
    public get deltaTime(): number {
        return this._deltaTime;
    }

    /**
     * 判断timer是否正在运行
     * @param parent 宿主node
     */
    startAndBindToNode(parent: Node): Timer {
        // log("startAndBindToNode", parent)
        const node = new Node();
        const component = node.addComponent(Component);
        if (component._isOnLoadCalled == 0) {
            component['onLoad'] = () => {
                // log("onLoad")
                this.start(true);
            };
        } else {
            // onLoad已经错过了
            this.start(true);
        }

        component['onDestroy'] = () => {
            // log("节点销毁，当前Timer随之销毁！");
            this.stop();
        };
        node.parent = parent;

        this._bindingNode = node;

        this.lastTriggerTime = Timer.time();

        return this;
    }

    /**
     * 开始timer
     * @param bIgnoreForeverWarn 是否禁用永久运行警告（无宿主的永久运行timer，在start时会给予警告）
     */
    start(bIgnoreForeverWarn: boolean = false): Timer {
        this.stop();

        if (!this._callback) {
            console.warn('警告] Timer.start callback未设置！');
            return this;
        }

        // 如果是无限循环模式，给予警告
        if (!bIgnoreForeverWarn && this._repeatCount < 0) {
            console.warn('警告] Timer.start, this timer will never stop!');
            console.warn('警告]     please use startAndBindToNode');
            console.warn('警告]     or your can stop timer in callback. use e:stop()');
            // console.trace();
        }

        this._count = 0;
        this._intervalId = setInterval(this._onSpan.bind(this), this.span * 1000);

        this.lastTriggerTime = Timer.time();

        return this;
    }

    /**
     * 停止timer
     */
    stop(): Timer {
        if (this._intervalId != null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        return this;
    }

    /**
     * 销毁timer
     * 使用场景：在Cocos Inspecter中可以看到在绑定了Timer的Node上出现了新的Node
     * 这些Node不会主动销毁，只有在父节点销毁时才会销毁
     * 如果当前节点反复添加新的Timer，就会导致节点树越来越多。
     * 注意：请在你不需要Timer的时候调用
     */
    destroy() {
        this.stop();
        if (!this._bindingNode) {
            //没有绑定对象的timer不处理，给予警告提示
            console.warn('当前Timer没有绑定到任何节点，无法销毁！');
            return;
        }

        this._bindingNode.destroy();
        this._bindingNode = null;
    }
}
