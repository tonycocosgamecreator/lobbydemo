import Timer from "./timer";
import Tools from "./tools";

const MAX_TASK_COUNT = 10;

/**
 * 任务状态
 */
class TaskState {
    static pending = 1;
    static running = 2;
    static completed = 3;
}

/**
 * 任务管理器状态
 */
class TaskManagerState {
    static pending = 1;
    static running = 2;
    static completed = 3;
    static destroyed = 4;
}

class TaskBase {
    name = "no name";
    /** 是否支持多线程 */
    bMultithreading = false;

    /** 状态 */
    state;

    /** 任务完成回调 */
    fCompletedCallback = null;

    /** 任务开始时间 */
    beginTime = 0;

    index;

    /**
     * @param name 任务名称
     */
    constructor(name) {
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
        this.beginTime = Timer.time();
        this.state = TaskState.running;
        try {
            this.load();
        } catch (error) {
            console.error("TaskBase has error!", error);
            this.triggerCompleted();
        }
    }

    /** 实际加载接口 */
    load() { }

    /** 触发任务完成 */
    triggerCompleted() {
        this.state = TaskState.completed;
        let usedTime = Timer.time() - this.beginTime;

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
    /** 执行回调 */
    fLoadCallback = null;

    constructor(name, fLoadCallback) {
        super(name);

        this.fLoadCallback = fLoadCallback;
    }

    load() {
        if (this.fLoadCallback instanceof Function) {
            this.fLoadCallback(this.triggerCompleted.bind(this));
        } else {
            this.triggerCompleted();
        }
    }
}

export class TaskManager {

    /** 任务队列 */
    tasks;
    /** 任务管理器名称 */
    _name;
    /** 是否开启日志 */
    bLog;

    /** 内置更新timer */
    timer;

    /** 任务管理器状态 */
    state;

    /** 已完成任务数量 */
    _completedTaskCount;
    /** 进行中的任务数量 */
    _runningTaskCount;

    /** 最大任务数量 */
    maxTaskCount;

    /** 任务加载开始时间，用于计算任务管理器总耗时 */
    loadBeginTime;
    /** 当前帧开始时间，用于计算当前帧耗时 */
    frameBeginTime;

    fOnProgressCallback;
    fOnCompltedCallback;










    ///// 生命周期 /////
    constructor(name = "", bLog? : boolean) {
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
        if (this.isDestroyed()) return;

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
            console.warn(Tools.format("TaskManagerState.addCall 只有pending状态可添加任务，当前状态：%s", this.getStateName()));
            return;
        }

        if (!taskName) {
            taskName = Tools.format("TaskCallback[%d]", this.tasks.length + 1);
        }

        let task = new TaskCallback(taskName, callback);
        task.setCompletedCallback(this.onTaskCompleted.bind(this));
        task.index = this.tasks.length;
        if (bEnableMultithreading) task.enableMultithreading();
        this.tasks.push(task);
    }

    /**
     * 获取任务数量
     * @returns 
     */
    get taskCount() {
        if (this.tasks) return this.tasks.length;
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
            console.warn(Tools.format("TaskManager.loadAll 当前状态不是pending，无法重复加载！name=[%s], state=[%d]", this._name, this.state));
            return;
        }

        if (fOnCompltedCallback instanceof Function) {
            this.setCompletedCallback(fOnCompltedCallback);
        }

        this.bLog && console.log(Tools.format("TaskManager[%s]开始全部任务，任务数：%d", this.name, this.taskCount));

        // 重置状态
        this.state = TaskManagerState.running;
        this._runningTaskCount = 0;
        this._completedTaskCount = 0;

        this.loadBeginTime = Timer.time();

        // 开启timer逐帧调用
        let timer = new Timer(1 / 60, -1, this.onTimerLoop.bind(this));
        timer.start();
        this.timer = timer;

        // 第一帧手动执行一次
        this.frameBeginTime = Timer.time();
        this.tryRunTask();
    }








    ///// 内部逻辑 /////
    onTimerLoop(timer) {
        let dt = timer.deltaTime;

        this.frameBeginTime = Timer.time();
        this.tryRunTask();

        if (this.state == TaskManagerState.completed) {
            timer.stop();
        }
    }

    tryRunTask() {
        if (!this.isRunning()) return;

        // console.log("TaskManager.tryRunTask", this._runningTaskCount, this._completedTaskCount, this.tasks.length);

        // 加载完毕
        if (this._completedTaskCount >= this.tasks.length) {
            // 标记为已完成
            this.state = TaskManagerState.completed;

            let usedTime = Timer.time() - this.loadBeginTime;
            // console.log(Tools.format("loading finish, 用时%dms", usedTime * 1000));

            this.bLog && console.log(Tools.format("TaskManager[%s] 所有任务处理完毕，用时%dms。", this.name, usedTime * 1000));

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
                if (this._runningTaskCount >= this.maxTaskCount) break;

                // 直接开启
                this._runningTaskCount++;

                this.bLog && console.log(Tools.format("TaskManager[%s] 任务[%d-%s]开始执行。", this.name, task.index + 1, task.name));
                task.run();
            }
        }
    }


    onTaskCompleted(task, usedTime) {
        if (!this.isRunning()) return;

        this._completedTaskCount++;
        this._runningTaskCount--;

        if (this.fOnProgressCallback instanceof Function) {
            this.fOnProgressCallback(this._completedTaskCount, this.tasks.length);
        }

        let gap = Timer.time() - this.frameBeginTime;
        // console.log("onTaskCompleted", gap, this._runningTaskCount)

        this.bLog && console.log(Tools.format("TaskManager[%s] 任务[%d-%s]执行完毕，耗时%dms", this.name, task.index + 1, task.name, usedTime * 1000));

        if (gap < 1 / 60) {
            // 当前帧还可以继续执行
            this.tryRunTask();
        }
    }
}