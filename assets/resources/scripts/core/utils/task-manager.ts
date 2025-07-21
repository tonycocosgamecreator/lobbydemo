import { Prefab, error, isValid, resources, sp, Node, SpriteFrame, Component, Asset, AssetManager } from 'cc';
import Timer from './timer';
import { Tools } from './tools';
import { AssetType, bDebug } from '../define';

/**
 * 任务状态
 */
enum TaskState {
    pending,
    running,
    completed,
}

/**
 * 任务管理器状态
 */
enum TaskManagerState {
    pending,
    running,
    completed,
    destroyed,
}

export interface ITaskManagerTask {
    triggerCompleted(): void;
    isPending(): boolean;
    isRunning(): boolean;
    isCompleted(): boolean;
}

abstract class TaskBase implements ITaskManagerTask {
    public static readonly TaskState = TaskState;

    public name: string = 'no name';
    /** 是否支持多线程 */
    public bMultithreading = false;

    /** 状态 */
    protected state: TaskState;

    /** 任务完成回调 */
    protected fCompletedCallback: ((task: TaskBase, usedTime: number) => void) | null = null;

    /** 任务开始时间 */
    protected beginTime = 0;

    public index: number = 0;

    /**
     * @param name 任务名称
     */
    public constructor(name: string) {
        this.name = name;
        this.state = TaskState.pending;
    }

    /** 开启线程 */
    public enableMultithreading(): void {
        this.bMultithreading = true;
    }

    /** 设置任务完成回调 */
    public setCompletedCallback(fCompletedCallback: (task: TaskBase, usedTime: number) => void): void {
        this.fCompletedCallback = fCompletedCallback;
    }

    /** 执行任务 */
    public run() {
        // cc.log("run task", this.name);
        this.beginTime = Timer.time();
        this.state = TaskState.running;
        try {
            this.load();
        } catch (err) {
            bDebug && error('TaskBase has error!', err);
            this.triggerCompleted();
        }
    }

    /** 实际加载接口 */
    protected abstract load(): void;

    /** 触发任务完成 */
    public triggerCompleted() {
        this.state = TaskState.completed;
        const usedTime = Timer.time() - this.beginTime;

        // cc.log("completed task", this.name, usedTime);

        if (this.fCompletedCallback) {
            this.fCompletedCallback(this, usedTime);
        }
    }

    /** 是否等待中 */
    public isPending(): boolean {
        return this.state == TaskState.pending;
    }

    /** 是否运行中 */
    public isRunning(): boolean {
        return this.state == TaskState.running;
    }

    /** 是否结束 */
    public isCompleted(): boolean {
        return this.state == TaskState.completed;
    }

    /** 获取状态名称 */
    public getStateName(): string {
        return TaskState[this.state];
    }
}

/**
 * 回调型任务，通过callback的方式自定义任务内容
 */
class TaskCallback extends TaskBase {
    /** 执行回调 */
    private fLoadCallback: ((fNext: () => void, task: ITaskManagerTask) => void) | null = null;

    constructor(name: string, loadCallback: (fNext: () => void, task: ITaskManagerTask) => void) {
        super(name);

        this.fLoadCallback = loadCallback;
    }

    protected load() {
        if (this.fLoadCallback instanceof Function) {
            this.fLoadCallback(this.triggerCompleted.bind(this), this);
        } else {
            this.triggerCompleted();
        }
    }
}

/** 资源加载方法 */
export type ResourceLoadFuntion = (url: string, type: AssetType<Asset>, callback?: (err: Error, res: any) => void) => void;

/** cc默认的加载方法 */
const default_cc_load_func: ResourceLoadFuntion = resources.load.bind(resources);
/**
 * 资源加载任务
 * 使用cc.resources.load进行加载
 */
class TaskLoadResource extends TaskBase {
    /** 执行回调 */
    private url: string;
    private type: AssetType<Asset>;
    private bundle: AssetManager.Bundle | null = null;

    /**
     * @param name 任务名称
     * @param url 资源url：如"2d/icon/gold"
     * @param type 资源类型：如：cc.JsonAssets, cc.SpriteFrame
     */
    constructor(name: string, url: string, type: AssetType<Asset>, bundle: AssetManager.Bundle) {
        super(name);

        this.url = url;
        this.type = type;
        this.bundle = bundle;
    }

    protected load() {
        if (!this.bundle) {
            this.triggerCompleted();
            return;
        }

        this.bundle.load(this.url, this.type, (err, data) => {
            if (err) {
                bDebug && console.error('加载资源出现错误：', err);
            }
            this.triggerCompleted();
        });
    }
}

/**
 * 一次性加载很多资源
 * 同种类型的资源
 */
class TaskLoadResources extends TaskBase {
    private _urls: string[] = [];
    private _type: AssetType<Asset> | null = null;
    private _bundle: AssetManager.Bundle | null = null;
    /**
     *
     * @param name
     * @param bundle 要加载哪一个bundle的资源
     * @param urls   需要加载的资源的链接
     * @param type
     */
    constructor(name: string, bundle: AssetManager.Bundle, urls: string[], type: AssetType<Asset>) {
        super(name);
        this._urls = urls;
        this._type = type;
        this._bundle = bundle;
    }

    protected load(): void {
        if (!this._bundle) {
            this.triggerCompleted();
            return;
        }
        this._bundle.load(this._urls, this._type, (err, datas) => {
            this.triggerCompleted();
        });
    }
}

/**
 * FGUI package加载任务
 * 使用GUIPackage.loadPackage进行加载
 */
class TaskLoadFguiPackage extends TaskBase {
    /** 执行回调 */
    private packageName: string;

    /**
     * @param name 任务名称
     * @param packageName fgui包名，如"base", "main"
     */
    constructor(name: string, packageName: string) {
        super(name);

        this.packageName = packageName;
    }

    protected load() {
        // GUIPackage.loadPackageAndDependPackageFromResource("fgui", this.packageName, (err, pkg) => {
        //     if (err) {
        //         console.error("TaskLoadFguiPackage loadPackage has some error:", err);
        //     }
        //     this.triggerCompleted();
        // });
        this.triggerCompleted();
    }
}

export default class TaskManager {
    public static readonly TaskManagerState = TaskManagerState;

    /** 多线程时支持的最大任务数 */
    public MAX_TASK_COUNT = 256;

    /** 任务队列 */
    private tasks: TaskBase[] = [];
    /** 任务管理器名称 */
    private _name: string;
    /** 是否开启日志 */
    private bLog: boolean;

    /** 内置更新timer */
    private timer: Timer | null = null;

    /** 任务管理器状态 */
    private state: TaskManagerState;

    /** 已完成任务数量 */
    private _completedTaskCount: number;
    /** 进行中的任务数量 */
    private _runningTaskCount: number;

    /** 任务加载开始时间，用于计算任务管理器总耗时 */
    private loadBeginTime: number;
    /** 当前帧开始时间，用于计算当前帧耗时 */
    private frameBeginTime: number;

    private fOnProgressCallback: ((completedCount: number, totalCount: number) => void) | null = null;
    private fOnCompltedCallback: ((usedTime: number) => void) | null = null;

    ///// 生命周期 /////
    constructor(name = '', bLog = false) {
        this._name = name;
        this.bLog = bLog;

        this.tasks = [];
        this.state = TaskManagerState.pending;

        this._completedTaskCount = 0;
        this._runningTaskCount = 0;

        this.loadBeginTime = 0;
        this.frameBeginTime = 0;
    }

    public destroy() {
        if (this.isDestroyed()) return;

        this.state = TaskManagerState.destroyed;

        this.tasks = [];
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
    public addCall(callback: (fNext: () => void, task: ITaskManagerTask) => void, taskName = '', bEnableMultithreading = false) {
        if (!this.isPending()) {
            bDebug && console.warn(Tools.format('TaskManagerState.addCall 只有pending状态可添加任务，当前状态：%s', this.getStateName()));
            return;
        }

        if (!taskName) {
            taskName = Tools.format('TaskCallback[%d]', this.tasks.length + 1);
        }

        const task = new TaskCallback(taskName, callback);
        task.setCompletedCallback(this.onTaskCompleted.bind(this));
        task.index = this.tasks.length;
        if (bEnableMultithreading) task.enableMultithreading();
        this.tasks.push(task);
    }

    /**
     * 新增 加载单个资源的任务
     * @param url   资源路径
     * @param type  资源类型
     * @param taskName 任务调度名字
     * @param bEnableMultithreading 默认开启多线程支持
     * @param bundle 从哪一个bundle加载。默认为resources
     * @returns
     */
    public addResource(url: string, type: AssetType<Asset>, taskName = '', bEnableMultithreading = true, bundle: AssetManager.Bundle = resources) {
        if (!url) return;
        if (!this.isPending()) {
            bDebug && console.warn(Tools.format('TaskManagerState.addResource 只有pending状态可添加任务，当前状态：%s', this.getStateName()));
            return;
        }

        if (!taskName) {
            taskName = Tools.format('Resources[%d-%s]', this.tasks.length + 1, url);
        }

        const task = new TaskLoadResource(taskName, url, type, bundle);
        task.setCompletedCallback(this.onTaskCompleted.bind(this));
        task.index = this.tasks.length;
        if (bEnableMultithreading) task.enableMultithreading();
        this.tasks.push(task);
    }
    /**
     * 从指定的bundle中加载指定类型的资源若干个
     * @param urls
     * @param type
     * @param bundle
     */
    public addResources(urls: string[], type: AssetType<Asset>, bundle: AssetManager.Bundle = resources) {
        if (!urls || urls.length == 0) {
            return;
        }
        if (!this.isPending()) {
            bDebug && console.warn(Tools.format('TaskManagerState.addResources 只有pending状态可添加任务，当前状态：%s', this.getStateName()));
            return;
        }
        const taskName = Tools.format('TaskLoadResources[%d-%s]', this.tasks.length + 1, urls.join(';'));
        const task = new TaskLoadResources(taskName, bundle, urls, type);
        task.setCompletedCallback(this.onTaskCompleted.bind(this));
        task.index = this.tasks.length;
        task.enableMultithreading();
        this.tasks.push(task);
    }
    

    /**
     * 添加fgui package任务
     * @param packageName
     * @param taskName
     * @deprecated 暂时没有对FGUI做支持
     */
    public addFguiPapckage(packageName: string, taskName = '', bEnableMultithreading = false) {
        if (!this.isPending()) {
            bDebug && console.warn(Tools.format('TaskManagerState.addFguiPapckage 只有pending状态可添加任务，当前状态：%s', this.getStateName()));
            return;
        }

        if (!taskName) {
            taskName = Tools.format('TaskFguiPackage[%d-%s]', this.tasks.length + 1, packageName);
        }

        const task = new TaskLoadFguiPackage(taskName, packageName);
        task.setCompletedCallback(this.onTaskCompleted.bind(this));
        task.index = this.tasks.length;
        if (bEnableMultithreading) task.enableMultithreading();
        this.tasks.push(task);
    }

    /**
     * 获取任务数量
     * @returns
     */
    public get taskCount(): number {
        if (this.tasks) return this.tasks.length;
        return 0;
    }

    /**
     * 获取任务名称
     * @returns
     */
    public get name(): string {
        return this._name;
    }

    /**
     * 获取已完成任务数量
     * @returns
     */
    public get completedTaskCount(): number {
        return this._completedTaskCount;
    }

    /** 是否等待中 */
    public isPending(): boolean {
        return this.state == TaskManagerState.pending;
    }

    /** 是否运行中 */
    public isRunning(): boolean {
        return this.state == TaskManagerState.running;
    }

    /** 是否结束 */
    public isCompleted(): boolean {
        return this.state == TaskManagerState.completed;
    }

    /** 是否销毁 */
    public isDestroyed(): boolean {
        return this.state == TaskManagerState.destroyed;
    }

    /** 获取状态名称 */
    public getStateName(): string {
        return TaskManagerState[this.state];
    }

    /**
     * 设置进度更新回调
     * @param callback
     */
    public setProgressCallback(callback: (completedCount: number, totalCount: number) => void) {
        this.fOnProgressCallback = callback;
    }

    /**
     * 设置完成回调
     * @param callback
     */
    public setCompletedCallback(callback: (usedTime: number) => void) {
        if (this.fOnCompltedCallback) {
            bDebug && console.warn(`TaskManager.setCompletedCallback 完成回调已存在，重新设置会覆盖之前的回调方法! name=[${this._name}]`);
        }
        this.fOnCompltedCallback = callback;
    }

    /**
     * 加载全部资源
     * @param bindingNode 可选择绑定到一个节点中，如果节点被销毁，则停止所有加载任务
     */
    public start(fOnCompltedCallback?: (usedTime: number) => void, bindingNode?: Node) {
        if (!this.isPending()) {
            bDebug && console.warn(Tools.format('TaskManager.loadAll 当前状态不是pending，无法重复加载！name=[%s], state=[%d]', this._name, this.state));
            return;
        }

        if (fOnCompltedCallback) {
            this.setCompletedCallback(fOnCompltedCallback);
        }

        // 如果传入了绑定节点，则监听销毁情况
        if (isValid(bindingNode)) {
            const node = new Node();
            const component = node.addComponent(Component);
            component['onDestroy'] = () => {
                this.destroy();
            };
            node.parent = bindingNode;
        }

        bDebug && this.bLog && console.log(Tools.format('TaskManager[%s]开始全部任务，任务数：%d', this.name, this.taskCount));

        // 重置状态
        this.state = TaskManagerState.running;
        this._runningTaskCount = 0;
        this._completedTaskCount = 0;

        this.loadBeginTime = Timer.time();

        // 开启timer逐帧调用
        const timer = new Timer(1 / 60, -1, this.onTimerLoop.bind(this));
        timer.start(true);
        this.timer = timer;

        // 第一帧手动执行一次
        this.frameBeginTime = Timer.time();
        this.tryRunTask();
    }

    /**
     * 异步回调
     */
    public async startAsync(): Promise<number> {
        return new Promise<number>((resolve) => {
            this.start((dTime: number) => {
                resolve(dTime);
            });
        });
    }

    /**
     * 取消所有任务,不在继续往下执行
     */
    public cancel() {
        if (this.isDestroyed()) return;

        if (this.timer) {
            this.timer.stop();
            this.timer = null;
        }
        bDebug && this.bLog && console.log(Tools.format('TaskManager[%s] 取消所有任务', this.name));

        this.tasks = [];
        this.destroy();
    }

    public stop() {
        if (this.timer) {
            this.timer.stop();
        }

        // 标记为已完成
        this.state = TaskManagerState.completed;

        const usedTime = Timer.time() - this.loadBeginTime;
        // cc.log(Tools.format("loading finish, 用时%dms", usedTime * 1000));

        bDebug && this.bLog && console.log(Tools.format('TaskManager[%s] 停止所有任务，用时%dms。', this.name, usedTime * 1000));

        if (this.fOnCompltedCallback instanceof Function) {
            this.fOnCompltedCallback(usedTime);
            this.fOnCompltedCallback = null;
        }
    }

    ///// 内部逻辑 /////
    private onTimerLoop(timer: Timer) {
        // let dt = timer.deltaTime;
        this.frameBeginTime = Timer.time();
        this.tryRunTask();
    }

    private tryRunTask() {
        if (!this.isRunning()) return;

        // cc.log("TaskManager.tryRunTask", this._runningTaskCount, this._completedTaskCount, this.tasks.length);

        // 加载完毕
        if (this._completedTaskCount >= this.tasks.length) {
            // 标记为已完成
            // this.state = TaskManagerState.completed;

            // let usedTime = Tools.time() - this.loadBeginTime;
            // cc.log(Tools.format("loading finish, 用时%dms", usedTime * 1000));

            // this.bLog && console.log(Tools.format("TaskManager[%s] 所有任务处理完毕，用时%dms。", this.name, usedTime * 1000));

            // if (this.fOnCompltedCallback instanceof Function) {
            //     this.fOnCompltedCallback(usedTime);
            // }

            this.stop();

            return;
        }

        let bHasUnMultithreadingTaskRunning = false;

        const tasks = this.tasks;
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];

            if (task.isPending()) {
                // 查找未开启的任务
                if (!task.bMultithreading) {
                    // 不支持多线程，需要等待已执行的任务完成
                    if (this._runningTaskCount > 0) {
                        break;
                    }
                } else {
                    // 如果当前运行的任务不是多线程任务，则不能执行
                    if (bHasUnMultithreadingTaskRunning) {
                        break;
                    }
                }

                // 并发量太大
                if (this._runningTaskCount >= this.MAX_TASK_COUNT) break;

                // 直接开启
                this._runningTaskCount++;

                bDebug && this.bLog && console.log(Tools.format('TaskManager[%s] 任务[%d-%s]开始执行。', this.name, task.index + 1, task.name));
                task.run();

                if (!task.bMultithreading) {
                    bHasUnMultithreadingTaskRunning = true;
                }
            } else if (task.isRunning()) {
                if (!task.bMultithreading) {
                    bHasUnMultithreadingTaskRunning = true;
                }
            }
        }
    }

    private onTaskCompleted(task: TaskBase, usedTime: number) {
        if (!this.isRunning()) return;

        this._completedTaskCount++;
        this._runningTaskCount--;

        if (this.fOnProgressCallback instanceof Function) {
            this.fOnProgressCallback(this._completedTaskCount, this.tasks.length);
        }

        const gap = Timer.time() - this.frameBeginTime;
        // cc.log("onTaskCompleted", gap, this._runningTaskCount)

        bDebug && this.bLog && console.log(Tools.format('TaskManager[%s] 任务[%d-%s]执行完毕，耗时%dms', this.name, task.index + 1, task.name, usedTime * 1000));

        if (gap < 1 / 60) {
            // 当前帧还可以继续执行
            this.tryRunTask();
        }
    }
}
