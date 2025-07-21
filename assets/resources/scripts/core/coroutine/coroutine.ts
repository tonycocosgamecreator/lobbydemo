import * as cc from 'cc';
import { AsyncWaitInfo } from './coroutine-define';
export default class Coroutine {
    /**
     * 异步方法，请使用await标记
     * 等待指定帧后继续执行
     * 注意：每一帧的时间为理论时间，若DC过高或者游戏逻辑耗时严重，会导致时间不正确
     * @param frame 帧数量，默认为1
     */
    public static async WaitFrame(frame: number = 1) {
        const fr = cc.game.frameTime * frame;
        return new Promise<any>((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, fr);
        });
    }

    /**
     * 异步方法，请使用await标记
     * 等待指定时间后继续执行后面的内容
     * @param time 单位：秒
     */
    public static async WaitTime(time: number) {
        if (time <= 0) {
            return;
        }
        const fr = time * 1000;
        //默认60帧
        return new Promise<any>((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, fr);
        });
    }

    /**
 * 
 * @param args 
 * @returns 
 */
    public static async WaitForComplete(args: AsyncWaitInfo) {
        const frame = cc.game.frameTime;
        const checkFrameCount = args.checkFrameCount || 1;
        if (!args.bindNode) {
            console.warn(args.name + " -> AsyncWaitInfo don't bind to a node, you need to destroy the async state by yourself");
        }
        let timeout = args.timeout || 0;
        let checkTime = checkFrameCount * frame;
        return new Promise<any>(resolve => {
            let interval = setInterval(() => {
                if (args.bindNode) {
                    if (!args.bindNode.isValid) {
                        console.warn(args.name + " -> The bind node is destroyed, async state will be destroyed");
                        clearInterval(interval);
                        resolve(true);
                        args = null;
                        return;
                    }
                }
                if (args.isCompleted) {
                    console.log(args.name + " -> Async state is completed");
                    clearInterval(interval);
                    resolve(true);
                    args = null;
                    return;
                }
                if (timeout > 0) {
                    timeout -= checkTime;
                    if (timeout <= 0) {
                        console.error(args.name + " -> Async state is timeout");
                        args.isSuccess = false;
                        args.isCompleted = true;
                        args.isTimeOut = true;
                        clearInterval(interval);
                        resolve(false);
                        args = null;
                        return;
                    }
                }
            }, checkTime);
        });

    }

}