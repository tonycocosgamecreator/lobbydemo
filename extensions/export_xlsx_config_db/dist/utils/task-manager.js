"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskManager = void 0;
const timer_1 = __importDefault(require("./timer"));
const tools_1 = __importDefault(require("./tools"));
const MAX_TASK_COUNT = 10;
/**
 * 任务状态
 */
class TaskState {
}
TaskState.pending = 1;
TaskState.running = 2;
TaskState.completed = 3;
/**
 * 任务管理器状态
 */
class TaskManagerState {
}
TaskManagerState.pending = 1;
TaskManagerState.running = 2;
TaskManagerState.completed = 3;
TaskManagerState.destroyed = 4;
class TaskBase {
    /**
     * @param name 任务名称
     */
    constructor(name) {
        this.name = "no name";
        /** 是否支持多线程 */
        this.bMultithreading = false;
        /** 任务完成回调 */
        this.fCompletedCallback = null;
        /** 任务开始时间 */
        this.beginTime = 0;
        this.name = name;
        this.state = TaskState.pending;
    }
    /** 开启线程 */
    enableMultithreading() {
        this.bMultithreading = true;
    }
    /** 设置任务完成回调 */
    setCompletedCallback(fCompletedCallback) {
        this.fCompletedCallback = fCompletedCallback;
    }
    /** 执行任务 */
    run() {
        // console.log("run task", this.name);
        this.beginTime = timer_1.default.time();
        this.state = TaskState.running;
        try {
            this.load();
        }
        catch (error) {
            console.error("TaskBase has error!", error);
            this.triggerCompleted();
        }
    }
    /** 实际加载接口 */
    load() { }
    /** 触发任务完成 */
    triggerCompleted() {
        this.state = TaskState.completed;
        let usedTime = timer_1.default.time() - this.beginTime;
        // console.log("completed task", this.name, usedTime);
        if (this.fCompletedCallback) {
            this.fCompletedCallback(this, usedTime);
        }
    }
    /** 是否等待中 */
    isPending() {
        return this.state == TaskState.pending;
    }
    /** 是否运行中 */
    isRunning() {
        return this.state == TaskState.running;
    }
    /** 是否结束 */
    isCompleted() {
        return this.state == TaskState.completed;
    }
    /** 获取状态名称 */
    getStateName() {
        return TaskState[this.state];
    }
}
/**
 * 回调型任务，通过callback的方式自定义任务内容
 */
class TaskCallback extends TaskBase {
    constructor(name, fLoadCallback) {
        super(name);
        /** 执行回调 */
        this.fLoadCallback = null;
        this.fLoadCallback = fLoadCallback;
    }
    load() {
        if (this.fLoadCallback instanceof Function) {
            this.fLoadCallback(this.triggerCompleted.bind(this));
        }
        else {
            this.triggerCompleted();
        }
    }
}
class TaskManager {
    ///// 生命周期 /////
    constructor(name = "", bLog) {
        this._name = name;
        this.bLog = !!bLog;
        this.tasks = [];
        this.state = TaskManagerState.pending;
        this._completedTaskCount = 0;
        this._runningTaskCount = 0;
        this.maxTaskCount = process.env.NUMBER_OF_PROCESSORS || 10;
        this.loadBeginTime = 0;
        this.frameBeginTime = 0;
    }
    destroy() {
        if (this.isDestroyed())
            return;
        this.state = TaskManagerState.destroyed;
        this.tasks = null;
        if (this.timer) {
            this.timer.stop();
            this.timer = null;
        }
    }
    ///// 外部接口 /////
    /**
     * 添加callback类型任务
     * @param callback
     * @param taskName
     */
    addCall(callback, taskName = "", bEnableMultithreading = false) {
        if (!this.isPending()) {
            console.warn(tools_1.default.format("TaskManagerState.addCall 只有pending状态可添加任务，当前状态：%s", this.getStateName()));
            return;
        }
        if (!taskName) {
            taskName = tools_1.default.format("TaskCallback[%d]", this.tasks.length + 1);
        }
        let task = new TaskCallback(taskName, callback);
        task.setCompletedCallback(this.onTaskCompleted.bind(this));
        task.index = this.tasks.length;
        if (bEnableMultithreading)
            task.enableMultithreading();
        this.tasks.push(task);
    }
    /**
     * 获取任务数量
     * @returns
     */
    get taskCount() {
        if (this.tasks)
            return this.tasks.length;
        return 0;
    }
    /**
     * 获取任务名称
     * @returns
     */
    get name() {
        return this._name;
    }
    /**
     * 获取已完成任务数量
     * @returns
     */
    get completedTaskCount() {
        return this._completedTaskCount;
    }
    /** 是否等待中 */
    isPending() {
        return this.state == TaskManagerState.pending;
    }
    /** 是否运行中 */
    isRunning() {
        return this.state == TaskManagerState.running;
    }
    /** 是否结束 */
    isCompleted() {
        return this.state == TaskManagerState.completed;
    }
    /** 是否销毁 */
    isDestroyed() {
        return this.state == TaskManagerState.destroyed;
    }
    /** 获取状态名称 */
    getStateName() {
        return TaskManagerState[this.state];
    }
    /**
     * 设置进度更新回调
     * @param callback
     */
    setProgressCallback(callback) {
        this.fOnProgressCallback = callback;
    }
    /**
     * 设置完成s回调
     * @param callback
     */
    setCompletedCallback(callback) {
        this.fOnCompltedCallback = callback;
    }
    /**
     * 加载全部资源
     * @param bindingNode 可选择绑定到一个节点中，如果节点被销毁，则停止所有加载任务
     */
    start(fOnCompltedCallback) {
        if (!this.isPending()) {
            console.warn(tools_1.default.format("TaskManager.loadAll 当前状态不是pending，无法重复加载！name=[%s], state=[%d]", this._name, this.state));
            return;
        }
        if (fOnCompltedCallback instanceof Function) {
            this.setCompletedCallback(fOnCompltedCallback);
        }
        this.bLog && console.log(tools_1.default.format("TaskManager[%s]开始全部任务，任务数：%d", this.name, this.taskCount));
        // 重置状态
        this.state = TaskManagerState.running;
        this._runningTaskCount = 0;
        this._completedTaskCount = 0;
        this.loadBeginTime = timer_1.default.time();
        // 开启timer逐帧调用
        let timer = new timer_1.default(1 / 60, -1, this.onTimerLoop.bind(this));
        timer.start();
        this.timer = timer;
        // 第一帧手动执行一次
        this.frameBeginTime = timer_1.default.time();
        this.tryRunTask();
    }
    ///// 内部逻辑 /////
    onTimerLoop(timer) {
        let dt = timer.deltaTime;
        this.frameBeginTime = timer_1.default.time();
        this.tryRunTask();
        if (this.state == TaskManagerState.completed) {
            timer.stop();
        }
    }
    tryRunTask() {
        if (!this.isRunning())
            return;
        // console.log("TaskManager.tryRunTask", this._runningTaskCount, this._completedTaskCount, this.tasks.length);
        // 加载完毕
        if (this._completedTaskCount >= this.tasks.length) {
            // 标记为已完成
            this.state = TaskManagerState.completed;
            let usedTime = timer_1.default.time() - this.loadBeginTime;
            // console.log(Tools.format("loading finish, 用时%dms", usedTime * 1000));
            this.bLog && console.log(tools_1.default.format("TaskManager[%s] 所有任务处理完毕，用时%dms。", this.name, usedTime * 1000));
            if (this.fOnCompltedCallback instanceof Function) {
                this.fOnCompltedCallback(usedTime);
            }
            return;
        }
        let tasks = this.tasks;
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (task.isPending()) {
                // 查找未开启的任务
                if (!task.bMultithreading) {
                    // 不支持多线程，需要等待已执行的任务完成
                    if (this._runningTaskCount > 0) {
                        break;
                    }
                }
                // 并发量太大
                if (this._runningTaskCount >= this.maxTaskCount)
                    break;
                // 直接开启
                this._runningTaskCount++;
                this.bLog && console.log(tools_1.default.format("TaskManager[%s] 任务[%d-%s]开始执行。", this.name, task.index + 1, task.name));
                task.run();
            }
        }
    }
    onTaskCompleted(task, usedTime) {
        if (!this.isRunning())
            return;
        this._completedTaskCount++;
        this._runningTaskCount--;
        if (this.fOnProgressCallback instanceof Function) {
            this.fOnProgressCallback(this._completedTaskCount, this.tasks.length);
        }
        let gap = timer_1.default.time() - this.frameBeginTime;
        // console.log("onTaskCompleted", gap, this._runningTaskCount)
        this.bLog && console.log(tools_1.default.format("TaskManager[%s] 任务[%d-%s]执行完毕，耗时%dms", this.name, task.index + 1, task.name, usedTime * 1000));
        if (gap < 1 / 60) {
            // 当前帧还可以继续执行
            this.tryRunTask();
        }
    }
}
exports.TaskManager = TaskManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFzay1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3V0aWxzL3Rhc2stbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxvREFBNEI7QUFDNUIsb0RBQTRCO0FBRTVCLE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQztBQUUxQjs7R0FFRztBQUNILE1BQU0sU0FBUzs7QUFDSixpQkFBTyxHQUFHLENBQUMsQ0FBQztBQUNaLGlCQUFPLEdBQUcsQ0FBQyxDQUFDO0FBQ1osbUJBQVMsR0FBRyxDQUFDLENBQUM7QUFHekI7O0dBRUc7QUFDSCxNQUFNLGdCQUFnQjs7QUFDWCx3QkFBTyxHQUFHLENBQUMsQ0FBQztBQUNaLHdCQUFPLEdBQUcsQ0FBQyxDQUFDO0FBQ1osMEJBQVMsR0FBRyxDQUFDLENBQUM7QUFDZCwwQkFBUyxHQUFHLENBQUMsQ0FBQztBQUd6QixNQUFNLFFBQVE7SUFnQlY7O09BRUc7SUFDSCxZQUFZLElBQUk7UUFsQmhCLFNBQUksR0FBRyxTQUFTLENBQUM7UUFDakIsY0FBYztRQUNkLG9CQUFlLEdBQUcsS0FBSyxDQUFDO1FBS3hCLGFBQWE7UUFDYix1QkFBa0IsR0FBRyxJQUFJLENBQUM7UUFFMUIsYUFBYTtRQUNiLGNBQVMsR0FBRyxDQUFDLENBQUM7UUFRVixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUM7SUFDbkMsQ0FBQztJQUVELFdBQVc7SUFDWCxvQkFBb0I7UUFDaEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7SUFDaEMsQ0FBQztJQUVELGVBQWU7SUFDZixvQkFBb0IsQ0FBQyxrQkFBa0I7UUFDbkMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO0lBQ2pELENBQUM7SUFFRCxXQUFXO0lBQ1gsR0FBRztRQUNDLHNDQUFzQztRQUN0QyxJQUFJLENB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RXRJLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDZCxhQUFhO1lBQ2IsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1NBQ3JCO0lBQ0wsQ0FBQztDQUNKO0FBM1JELGtDQTJSQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBUaW1lciBmcm9tIFwiLi90aW1lclwiO1xyXG5pbXBvcnQgVG9vbHMgZnJvbSBcIi4vdG9vbHNcIjtcclxuXHJcbmNvbnN0IE1BWF9UQVNLX0NPVU5UID0gMTA7XHJcblxyXG4vKipcclxuICog5Lu75Yqh54q25oCBXHJcbiAqL1xyXG5jbGFzcyBUYXNrU3RhdGUge1xyXG4gICAgc3RhdGljIHBlbmRpbmcgPSAxO1xyXG4gICAgc3RhdGljIHJ1bm5pbmcgPSAyO1xyXG4gICAgc3RhdGljIGNvbXBsZXRlZCA9IDM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDku7vliqHnrqHnkIblmajnirbmgIFcclxuICovXHJcbmNsYXNzIFRhc2tNYW5hZ2VyU3RhdGUge1xyXG4gICAgc3RhdGljIHBlbmRpbmcgPSAxO1xyXG4gICAgc3RhdGljIHJ1bm5pbmcgPSAyO1xyXG4gICAgc3RhdGljIGNvbXBsZXRlZCA9IDM7XHJcbiAgICBzdGF0aWMgZGVzdHJveWVkID0gNDtcclxufVxyXG5cclxuY2xhc3MgVGFza0Jhc2Uge1xyXG4gICAgbmFtZSA9IFwibm8gbmFtZVwiO1xyXG4gICAgLyoqIOaYr+WQpuaUr+aMgeWkmue6v+eoiyAqL1xyXG4gICAgYk11bHRpdGhyZWFkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgLyoqIOeKtuaAgSAqL1xyXG4gICAgc3RhdGU7XHJcblxyXG4gICAgLyoqIOS7u+WKoeWujOaIkOWbnuiwgyAqL1xyXG4gICAgZkNvbXBsZXRlZENhbGxiYWNrID0gbnVsbDtcclxuXHJcbiAgICAvKiog5Lu75Yqh5byA5aeL5pe26Ze0ICovXHJcbiAgICBiZWdpblRpbWUgPSAwO1xyXG5cclxuICAgIGluZGV4O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIG5hbWUg5Lu75Yqh5ZCN56ewXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKG5hbWUpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgICAgIHRoaXMuc3RhdGUgPSBUYXNrU3RhdGUucGVuZGluZztcclxuICAgIH1cclxuXHJcbiAgICAvKiog5byA5ZCv57q/56iLICovXHJcbiAgICBlbmFibGVNdWx0aXRocmVhZGluZygpIHtcclxuICAgICAgICB0aGlzLmJNdWx0aXRocmVhZGluZyA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIOiuvue9ruS7u+WKoeWujOaIkOWbnuiwgyAqL1xyXG4gICAgc2V0Q29tcGxldGVkQ2FsbGJhY2soZkNvbXBsZXRlZENhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5mQ29tcGxldGVkQ2FsbGJhY2sgPSBmQ29tcGxldGVkQ2FsbGJhY2s7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIOaJp+ihjOS7u+WKoSAqL1xyXG4gICAgcnVuKCkge1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwicnVuIHRhc2tcIiwgdGhpcy5uYW1lKTtcclxuICAgICAgICB0aGlzLmJlZ2luVGltZSA9IFRpbWVyLnRpbWUoKTtcclxuICAgICAgICB0aGlzLnN0YXRlID0gVGFza1N0YXRlLnJ1bm5pbmc7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy5sb2FkKCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlRhc2tCYXNlIGhhcyBlcnJvciFcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJDb21wbGV0ZWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIOWunumZheWKoOi9veaOpeWPoyAqL1xyXG4gICAgbG9hZCgpIHsgfVxyXG5cclxuICAgIC8qKiDop6blj5Hku7vliqHlrozmiJAgKi9cclxuICAgIHRyaWdnZXJDb21wbGV0ZWQoKSB7XHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IFRhc2tTdGF0ZS5jb21wbGV0ZWQ7XHJcbiAgICAgICAgbGV0IHVzZWRUaW1lID0gVGltZXIudGltZSgpIC0gdGhpcy5iZWdpblRpbWU7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiY29tcGxldGVkIHRhc2tcIiwgdGhpcy5uYW1lLCB1c2VkVGltZSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmZDb21wbGV0ZWRDYWxsYmFjaykge1xyXG4gICAgICAgICAgICB0aGlzLmZDb21wbGV0ZWRDYWxsYmFjayh0aGlzLCB1c2VkVGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKiDmmK/lkKbnrYnlvoXkuK0gKi9cclxuICAgIGlzUGVuZGluZygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZSA9PSBUYXNrU3RhdGUucGVuZGluZztcclxuICAgIH1cclxuXHJcbiAgICAvKiog5piv5ZCm6L+Q6KGM5LitICovXHJcbiAgICBpc1J1bm5pbmcoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUgPT0gVGFza1N0YXRlLnJ1bm5pbmc7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIOaYr+WQpue7k+adnyAqL1xyXG4gICAgaXNDb21wbGV0ZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUgPT0gVGFza1N0YXRlLmNvbXBsZXRlZDtcclxuICAgIH1cclxuXHJcbiAgICAvKiog6I635Y+W54q25oCB5ZCN56ewICovXHJcbiAgICBnZXRTdGF0ZU5hbWUoKSB7XHJcbiAgICAgICAgcmV0dXJuIFRhc2tTdGF0ZVt0aGlzLnN0YXRlXTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIOWbnuiwg+Wei+S7u+WKoe+8jOmAmui/h2NhbGxiYWNr55qE5pa55byP6Ieq5a6a5LmJ5Lu75Yqh5YaF5a65XHJcbiAqL1xyXG5jbGFzcyBUYXNrQ2FsbGJhY2sgZXh0ZW5kcyBUYXNrQmFzZSB7XHJcbiAgICAvKiog5omn6KGM5Zue6LCDICovXHJcbiAgICBmTG9hZENhbGxiYWNrID0gbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCBmTG9hZENhbGxiYWNrKSB7XHJcbiAgICAgICAgc3VwZXIobmFtZSk7XHJcblxyXG4gICAgICAgIHRoaXMuZkxvYWRDYWxsYmFjayA9IGZMb2FkQ2FsbGJhY2s7XHJcbiAgICB9XHJcblxyXG4gICAgbG9hZCgpIHtcclxuICAgICAgICBpZiAodGhpcy5mTG9hZENhbGxiYWNrIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5mTG9hZENhbGxiYWNrKHRoaXMudHJpZ2dlckNvbXBsZXRlZC5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJDb21wbGV0ZWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUYXNrTWFuYWdlciB7XHJcblxyXG4gICAgLyoqIOS7u+WKoemYn+WIlyAqL1xyXG4gICAgdGFza3M7XHJcbiAgICAvKiog5Lu75Yqh566h55CG5Zmo5ZCN56ewICovXHJcbiAgICBfbmFtZTtcclxuICAgIC8qKiDmmK/lkKblvIDlkK/ml6Xlv5cgKi9cclxuICAgIGJMb2c7XHJcblxyXG4gICAgLyoqIOWGhee9ruabtOaWsHRpbWVyICovXHJcbiAgICB0aW1lcjtcclxuXHJcbiAgICAvKiog5Lu75Yqh566h55CG5Zmo54q25oCBICovXHJcbiAgICBzdGF0ZTtcclxuXHJcbiAgICAvKiog5bey5a6M5oiQ5Lu75Yqh5pWw6YePICovXHJcbiAgICBfY29tcGxldGVkVGFza0NvdW50O1xyXG4gICAgLyoqIOi/m+ihjOS4reeahOS7u+WKoeaVsOmHjyAqL1xyXG4gICAgX3J1bm5pbmdUYXNrQ291bnQ7XHJcblxyXG4gICAgLyoqIOacgOWkp+S7u+WKoeaVsOmHjyAqL1xyXG4gICAgbWF4VGFza0NvdW50O1xyXG5cclxuICAgIC8qKiDku7vliqHliqDovb3lvIDlp4vml7bpl7TvvIznlKjkuo7orqHnrpfku7vliqHnrqHnkIblmajmgLvogJfml7YgKi9cclxuICAgIGxvYWRCZWdpblRpbWU7XHJcbiAgICAvKiog5b2T5YmN5bin5byA5aeL5pe26Ze077yM55So5LqO6K6h566X5b2T5YmN5bin6ICX5pe2ICovXHJcbiAgICBmcmFtZUJlZ2luVGltZTtcclxuXHJcbiAgICBmT25Qcm9ncmVzc0NhbGxiYWNrO1xyXG4gICAgZk9uQ29tcGx0ZWRDYWxsYmFjaztcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiAgICAvLy8vLyDnlJ/lkb3lkajmnJ8gLy8vLy9cclxuICAgIGNvbnN0cnVjdG9yKG5hbWUgPSBcIlwiLCBiTG9nPyA6IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLl9uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLmJMb2cgPSAhIWJMb2c7XHJcblxyXG4gICAgICAgIHRoaXMudGFza3MgPSBbXTtcclxuICAgICAgICB0aGlzLnN0YXRlID0gVGFza01hbmFnZXJTdGF0ZS5wZW5kaW5nO1xyXG5cclxuICAgICAgICB0aGlzLl9jb21wbGV0ZWRUYXNrQ291bnQgPSAwO1xyXG4gICAgICAgIHRoaXMuX3J1bm5pbmdUYXNrQ291bnQgPSAwO1xyXG4gICAgICAgIHRoaXMubWF4VGFza0NvdW50ID0gcHJvY2Vzcy5lbnYuTlVNQkVSX09GX1BST0NFU1NPUlMgfHwgMTA7XHJcblxyXG4gICAgICAgIHRoaXMubG9hZEJlZ2luVGltZSA9IDA7XHJcbiAgICAgICAgdGhpcy5mcmFtZUJlZ2luVGltZSA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZGVzdHJveSgpIHtcclxuICAgICAgICBpZiAodGhpcy5pc0Rlc3Ryb3llZCgpKSByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMuc3RhdGUgPSBUYXNrTWFuYWdlclN0YXRlLmRlc3Ryb3llZDtcclxuXHJcbiAgICAgICAgdGhpcy50YXNrcyA9IG51bGw7XHJcbiAgICAgICAgaWYgKHRoaXMudGltZXIpIHtcclxuICAgICAgICAgICAgdGhpcy50aW1lci5zdG9wKCk7XHJcbiAgICAgICAgICAgIHRoaXMudGltZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4gICAgLy8vLy8g5aSW6YOo5o6l5Y+jIC8vLy8vXHJcbiAgICAvKipcclxuICAgICAqIOa3u+WKoGNhbGxiYWNr57G75Z6L5Lu75YqhXHJcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sgXHJcbiAgICAgKiBAcGFyYW0gdGFza05hbWUgXHJcbiAgICAgKi9cclxuICAgIGFkZENhbGwoY2FsbGJhY2ssIHRhc2tOYW1lID0gXCJcIiwgYkVuYWJsZU11bHRpdGhyZWFkaW5nID0gZmFsc2UpIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNQZW5kaW5nKCkpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKFRvb2xzLmZvcm1hdChcIlRhc2tNYW5hZ2VyU3RhdGUuYWRkQ2FsbCDlj6rmnIlwZW5kaW5n54q25oCB5Y+v5re75Yqg5Lu75Yqh77yM5b2T5YmN54q25oCB77yaJXNcIiwgdGhpcy5nZXRTdGF0ZU5hbWUoKSkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRhc2tOYW1lKSB7XHJcbiAgICAgICAgICAgIHRhc2tOYW1lID0gVG9vbHMuZm9ybWF0KFwiVGFza0NhbGxiYWNrWyVkXVwiLCB0aGlzLnRhc2tzLmxlbmd0aCArIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHRhc2sgPSBuZXcgVGFza0NhbGxiYWNrKHRhc2tOYW1lLCBjYWxsYmFjayk7XHJcbiAgICAgICAgdGFzay5zZXRDb21wbGV0ZWRDYWxsYmFjayh0aGlzLm9uVGFza0NvbXBsZXRlZC5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0YXNrLmluZGV4ID0gdGhpcy50YXNrcy5sZW5ndGg7XHJcbiAgICAgICAgaWYgKGJFbmFibGVNdWx0aXRocmVhZGluZykgdGFzay5lbmFibGVNdWx0aXRocmVhZGluZygpO1xyXG4gICAgICAgIHRoaXMudGFza3MucHVzaCh0YXNrKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOiOt+WPluS7u+WKoeaVsOmHj1xyXG4gICAgICogQHJldHVybnMgXHJcbiAgICAgKi9cclxuICAgIGdldCB0YXNrQ291bnQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMudGFza3MpIHJldHVybiB0aGlzLnRhc2tzLmxlbmd0aDtcclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOiOt+WPluS7u+WKoeWQjeensFxyXG4gICAgICogQHJldHVybnMgXHJcbiAgICAgKi9cclxuICAgIGdldCBuYW1lKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog6I635Y+W5bey5a6M5oiQ5Lu75Yqh5pWw6YePXHJcbiAgICAgKiBAcmV0dXJucyBcclxuICAgICAqL1xyXG4gICAgZ2V0IGNvbXBsZXRlZFRhc2tDb3VudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY29tcGxldGVkVGFza0NvdW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiDmmK/lkKbnrYnlvoXkuK0gKi9cclxuICAgIGlzUGVuZGluZygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZSA9PSBUYXNrTWFuYWdlclN0YXRlLnBlbmRpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIOaYr+WQpui/kOihjOS4rSAqL1xyXG4gICAgaXNSdW5uaW5nKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlID09IFRhc2tNYW5hZ2VyU3RhdGUucnVubmluZztcclxuICAgIH1cclxuXHJcbiAgICAvKiog5piv5ZCm57uT5p2fICovXHJcbiAgICBpc0NvbXBsZXRlZCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZSA9PSBUYXNrTWFuYWdlclN0YXRlLmNvbXBsZXRlZDtcclxuICAgIH1cclxuXHJcbiAgICAvKiog5piv5ZCm6ZSA5q+BICovXHJcbiAgICBpc0Rlc3Ryb3llZCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZSA9PSBUYXNrTWFuYWdlclN0YXRlLmRlc3Ryb3llZDtcclxuICAgIH1cclxuXHJcbiAgICAvKiog6I635Y+W54q25oCB5ZCN56ewICovXHJcbiAgICBnZXRTdGF0ZU5hbWUoKSB7XHJcbiAgICAgICAgcmV0dXJuIFRhc2tNYW5hZ2VyU3RhdGVbdGhpcy5zdGF0ZV07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDorr7nva7ov5vluqbmm7TmlrDlm57osINcclxuICAgICAqIEBwYXJhbSBjYWxsYmFjayBcclxuICAgICAqL1xyXG4gICAgc2V0UHJvZ3Jlc3NDYWxsYmFjayhjYWxsYmFjaykge1xyXG4gICAgICAgIHRoaXMuZk9uUHJvZ3Jlc3NDYWxsYmFjayA9IGNhbGxiYWNrO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog6K6+572u5a6M5oiQc+Wbnuiwg1xyXG4gICAgICogQHBhcmFtIGNhbGxiYWNrIFxyXG4gICAgICovXHJcbiAgICBzZXRDb21wbGV0ZWRDYWxsYmFjayhjYWxsYmFjaykge1xyXG4gICAgICAgIHRoaXMuZk9uQ29tcGx0ZWRDYWxsYmFjayA9IGNhbGxiYWNrO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5Yqg6L295YWo6YOo6LWE5rqQXHJcbiAgICAgKiBAcGFyYW0gYmluZGluZ05vZGUg5Y+v6YCJ5oup57uR5a6a5Yiw5LiA5Liq6IqC54K55Lit77yM5aaC5p6c6IqC54K56KKr6ZSA5q+B77yM5YiZ5YGc5q2i5omA5pyJ5Yqg6L295Lu75YqhXHJcbiAgICAgKi9cclxuICAgIHN0YXJ0KGZPbkNvbXBsdGVkQ2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNQZW5kaW5nKCkpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKFRvb2xzLmZvcm1hdChcIlRhc2tNYW5hZ2VyLmxvYWRBbGwg5b2T5YmN54q25oCB5LiN5pivcGVuZGluZ++8jOaXoOazlemHjeWkjeWKoOi9ve+8gW5hbWU9WyVzXSwgc3RhdGU9WyVkXVwiLCB0aGlzLl9uYW1lLCB0aGlzLnN0YXRlKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChmT25Db21wbHRlZENhbGxiYWNrIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRDb21wbGV0ZWRDYWxsYmFjayhmT25Db21wbHRlZENhbGxiYWNrKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYkxvZyAmJiBjb25zb2xlLmxvZyhUb29scy5mb3JtYXQoXCJUYXNrTWFuYWdlclslc13lvIDlp4vlhajpg6jku7vliqHvvIzku7vliqHmlbDvvJolZFwiLCB0aGlzLm5hbWUsIHRoaXMudGFza0NvdW50KSk7XHJcblxyXG4gICAgICAgIC8vIOmHjee9rueKtuaAgVxyXG4gICAgICAgIHRoaXMuc3RhdGUgPSBUYXNrTWFuYWdlclN0YXRlLnJ1bm5pbmc7XHJcbiAgICAgICAgdGhpcy5fcnVubmluZ1Rhc2tDb3VudCA9IDA7XHJcbiAgICAgICAgdGhpcy5fY29tcGxldGVkVGFza0NvdW50ID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5sb2FkQmVnaW5UaW1lID0gVGltZXIudGltZSgpO1xyXG5cclxuICAgICAgICAvLyDlvIDlkK90aW1lcumAkOW4p+iwg+eUqFxyXG4gICAgICAgIGxldCB0aW1lciA9IG5ldyBUaW1lcigxIC8gNjAsIC0xLCB0aGlzLm9uVGltZXJMb29wLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRpbWVyLnN0YXJ0KCk7XHJcbiAgICAgICAgdGhpcy50aW1lciA9IHRpbWVyO1xyXG5cclxuICAgICAgICAvLyDnrKzkuIDluKfmiYvliqjmiafooYzkuIDmrKFcclxuICAgICAgICB0aGlzLmZyYW1lQmVnaW5UaW1lID0gVGltZXIudGltZSgpO1xyXG4gICAgICAgIHRoaXMudHJ5UnVuVGFzaygpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiAgICAvLy8vLyDlhoXpg6jpgLvovpEgLy8vLy9cclxuICAgIG9uVGltZXJMb29wKHRpbWVyKSB7XHJcbiAgICAgICAgbGV0IGR0ID0gdGltZXIuZGVsdGFUaW1lO1xyXG5cclxuICAgICAgICB0aGlzLmZyYW1lQmVnaW5UaW1lID0gVGltZXIudGltZSgpO1xyXG4gICAgICAgIHRoaXMudHJ5UnVuVGFzaygpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSBUYXNrTWFuYWdlclN0YXRlLmNvbXBsZXRlZCkge1xyXG4gICAgICAgICAgICB0aW1lci5zdG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRyeVJ1blRhc2soKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzUnVubmluZygpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiVGFza01hbmFnZXIudHJ5UnVuVGFza1wiLCB0aGlzLl9ydW5uaW5nVGFza0NvdW50LCB0aGlzLl9jb21wbGV0ZWRUYXNrQ291bnQsIHRoaXMudGFza3MubGVuZ3RoKTtcclxuXHJcbiAgICAgICAgLy8g5Yqg6L295a6M5q+VXHJcbiAgICAgICAgaWYgKHRoaXMuX2NvbXBsZXRlZFRhc2tDb3VudCA+PSB0aGlzLnRhc2tzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAvLyDmoIforrDkuLrlt7LlrozmiJBcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFRhc2tNYW5hZ2VyU3RhdGUuY29tcGxldGVkO1xyXG5cclxuICAgICAgICAgICAgbGV0IHVzZWRUaW1lID0gVGltZXIudGltZSgpIC0gdGhpcy5sb2FkQmVnaW5UaW1lO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhUb29scy5mb3JtYXQoXCJsb2FkaW5nIGZpbmlzaCwg55So5pe2JWRtc1wiLCB1c2VkVGltZSAqIDEwMDApKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuYkxvZyAmJiBjb25zb2xlLmxvZyhUb29scy5mb3JtYXQoXCJUYXNrTWFuYWdlclslc10g5omA5pyJ5Lu75Yqh5aSE55CG5a6M5q+V77yM55So5pe2JWRtc+OAglwiLCB0aGlzLm5hbWUsIHVzZWRUaW1lICogMTAwMCkpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuZk9uQ29tcGx0ZWRDYWxsYmFjayBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZPbkNvbXBsdGVkQ2FsbGJhY2sodXNlZFRpbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB0YXNrcyA9IHRoaXMudGFza3M7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YXNrcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCB0YXNrID0gdGFza3NbaV07XHJcblxyXG4gICAgICAgICAgICBpZiAodGFzay5pc1BlbmRpbmcoKSkge1xyXG4gICAgICAgICAgICAgICAgLy8g5p+l5om+5pyq5byA5ZCv55qE5Lu75YqhXHJcbiAgICAgICAgICAgICAgICBpZiAoIXRhc2suYk11bHRpdGhyZWFkaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5LiN5pSv5oyB5aSa57q/56iL77yM6ZyA6KaB562J5b6F5bey5omn6KGM55qE5Lu75Yqh5a6M5oiQXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3J1bm5pbmdUYXNrQ291bnQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyDlubblj5Hph4/lpKrlpKdcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9ydW5uaW5nVGFza0NvdW50ID49IHRoaXMubWF4VGFza0NvdW50KSBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDnm7TmjqXlvIDlkK9cclxuICAgICAgICAgICAgICAgIHRoaXMuX3J1bm5pbmdUYXNrQ291bnQrKztcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJMb2cgJiYgY29uc29sZS5sb2coVG9vbHMuZm9ybWF0KFwiVGFza01hbmFnZXJbJXNdIOS7u+WKoVslZC0lc13lvIDlp4vmiafooYzjgIJcIiwgdGhpcy5uYW1lLCB0YXNrLmluZGV4ICsgMSwgdGFzay5uYW1lKSk7XHJcbiAgICAgICAgICAgICAgICB0YXNrLnJ1bigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBvblRhc2tDb21wbGV0ZWQodGFzaywgdXNlZFRpbWUpIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNSdW5uaW5nKCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5fY29tcGxldGVkVGFza0NvdW50Kys7XHJcbiAgICAgICAgdGhpcy5fcnVubmluZ1Rhc2tDb3VudC0tO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5mT25Qcm9ncmVzc0NhbGxiYWNrIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5mT25Qcm9ncmVzc0NhbGxiYWNrKHRoaXMuX2NvbXBsZXRlZFRhc2tDb3VudCwgdGhpcy50YXNrcy5sZW5ndGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGdhcCA9IFRpbWVyLnRpbWUoKSAtIHRoaXMuZnJhbWVCZWdpblRpbWU7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJvblRhc2tDb21wbGV0ZWRcIiwgZ2FwLCB0aGlzLl9ydW5uaW5nVGFza0NvdW50KVxyXG5cclxuICAgICAgICB0aGlzLmJMb2cgJiYgY29uc29sZS5sb2coVG9vbHMuZm9ybWF0KFwiVGFza01hbmFnZXJbJXNdIOS7u+WKoVslZC0lc13miafooYzlrozmr5XvvIzogJfml7YlZG1zXCIsIHRoaXMubmFtZSwgdGFzay5pbmRleCArIDEsIHRhc2submFtZSwgdXNlZFRpbWUgKiAxMDAwKSk7XHJcblxyXG4gICAgICAgIGlmIChnYXAgPCAxIC8gNjApIHtcclxuICAgICAgICAgICAgLy8g5b2T5YmN5bin6L+Y5Y+v5Lul57un57ut5omn6KGMXHJcbiAgICAgICAgICAgIHRoaXMudHJ5UnVuVGFzaygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSJdfQ==