import { EventTarget, game, isValid, log, warn } from 'cc';
import { Tools } from '../utils/tools';
import ICaller from './icaller';

export type T_MSG_LISTENERS = { [msgName: string]: (msgData: any, msgName?: string) => void };

export default class MsgHandler {
    /**
     * 注册的监听器
     * {msgName:listeners};
     */
    private registeredListeners: T_MSG_LISTENERS;
    /**
     * 已开始的监听器
     * {msgName:listeners};
     */
    private startedListeners: T_MSG_LISTENERS;
    /**
     * 是否已开始
     */
    private bStarted;

    private eventTarget: EventTarget;

    /**
     * 构造方法
     * @param eventTarget 事件目标，默认为cc.game
     */
    constructor(eventTarget?: EventTarget) {
        this.eventTarget = eventTarget || game;

        this.registeredListeners = {};
        this.startedListeners = {};
        this.bStarted = false;
    }

    /**
     * 注册监听器
     * @param listeners {msgName:listeners};
     */
    public registerListeners(listeners: T_MSG_LISTENERS, bindArg?: any): void {
        if (bindArg != null) {
            Tools.forEachMap(listeners, (k, listener) => {
                listeners[k] = listener.bind(bindArg);
            });
        }

        Tools.forEachMap(listeners, (msgName, listener) => {
            if (this.registeredListeners[msgName] != null) {
                log(`[警告] MsgHandler.registerListeners msg重复注册！ msgName=${msgName}`);
            }

            // 包装一层try-catch
            const safeListener = (e: any) => {
                try {
                    listener(e);
                } catch (error) {
                    warn('MsgHandler.listener has error!', error);
                }
            };
            this.registeredListeners[msgName] = safeListener;
        });

        if (this.bStarted) {
            this.startProcMsg();
        }
    }
    /**
     * 移除一个监听器
     * @param msgName 
     */
    public removeListener(msgName : string){
        const listener = this.registeredListeners[msgName];
        if(!listener){
            return;
        }
        this.eventTarget.off(msgName, listener, this);
        delete this.registeredListeners[msgName];
        log(`MsgHandler.removeListener 移除监听器！ msgName=${msgName}`);
    }

    /**
     * 开启消息处理器
     */
    public startProcMsg(): void {
        this.bStarted = true;
        Tools.forEachMap(this.registeredListeners, (msgName, listener) => {
            if (!this.startedListeners[msgName]) {
                const listener = this.registeredListeners[msgName];
                this.eventTarget.on(msgName, listener, this);
                this.startedListeners[msgName] = listener;
            }
        });
    }

    /**
     * 停止消息处理器
     */
    public stopProcMsg(): void {
        Tools.forEachMap(this.startedListeners, (msgName, listener) => {
            this.eventTarget.off(msgName, listener, this);
        });

        this.bStarted = false;
        this.startedListeners = {};
    }

    /**
     * 发送消息
     * @param msgName 消息名称
     * @param data 数据，通过e.e进行获取
     */
    public sendMsg(msgName: string, data?: any): void {
        try {
            this.eventTarget.emit(msgName, data);
        } catch (error) {
            warn('MsgHandler.sendMsg has exception', error);
        }
    }

    ///// 静态接口 /////
    /**所有监听消息的对象  及其 监听句柄 */
    private static globalHandlers: { handler: MsgHandler; caller: ICaller }[] = [];
    /**注册监听 */
    public static registerListeners(caller: ICaller, listeners: any): void {
        //为监听绑定对象本身
        Tools.forEachMap<any>(listeners, (k, listener) => {
            listeners[k] = listener.bind(caller);
        });

        //为每一个监听者单独创建一个监听对象, 该对象与监听者的生命一致
        let handler: MsgHandler | null = null;
        for (let i = 0; i < this.globalHandlers.length; i++) {
            const v = this.globalHandlers[i];
            if (v.caller == caller) {
                handler = v.handler;
                break;
            }
        }

        if (!handler) {
            handler = new MsgHandler();
            handler.startProcMsg();
            this.globalHandlers.push({
                handler: handler,
                caller: caller,
            });
        }

        handler.registerListeners(listeners);
    }

    /** 移除所有监听 */
    public static removeAllListeners(caller: ICaller): void {
        for (let i = 0; i < this.globalHandlers.length; i++) {
            const v = this.globalHandlers[i];
            if (v.caller == caller) {
                v.handler.stopProcMsg();
                this.globalHandlers.splice(i, 1);
                return;
            }
        }
    }
    /**
     * 移除指定对象的指定消息的监听
     * @param caller 
     * @param msgName 
     */
    public static removeListener(caller: ICaller, msgName: string): void {
        for (let i = 0; i < this.globalHandlers.length; i++) {
            const v = this.globalHandlers[i];
            if (v.caller == caller) {
                v.handler.removeListener(msgName);
                return;
            }
        }
    }

    /**发送全局消息 */
    public static sendMsg(msgName: string, data?: any): void {
        //先检查所有的监听者
        for (let i = this.globalHandlers.length - 1; i >= 0; i--) {
            const v = this.globalHandlers[i];
            if (v.caller && (!v.caller.isCallerValid || !isValid(v.caller))) {
                v.handler.stopProcMsg();
                this.globalHandlers.splice(i, 1);
            }
        }

        //向全局发送消息
        if (this.globalHandlers.length > 0) {
            this.globalHandlers[0].handler.sendMsg(msgName, data);
        }
    }
}
