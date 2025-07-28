import * as cc from 'cc';
import { DEBUG, PREVIEW } from 'cc/env';

export const HOT_UPDATE_CACHE_FOLDER_NAME = "hot-update-cache";

export const bDebug = PREVIEW || DEBUG || window['debug'];

/**
 * 单个资源的类型定义
 */
export declare type AssetType<T> = cc.__private.__types_globals__Constructor<T>;

export declare type CLASS<T> = new (...args: any[]) => T;
/**
 * 模块化加载的时候的参数定义
 */
export declare type ModuleLoadInfo = {
    type: AssetType<cc.Asset>;
    urls: string[];
};

export declare type EmptyCallback = () => void;
export declare type BooleanCallback = () => boolean;
export declare type ClickEventCallback = (event?: cc.EventTouch, target?: any) => void;
export declare type ViewBindConfigResult = {
    [realName: string]: [obj: typeof cc.Component | typeof cc.Node | typeof cc.Animation, event?: ClickEventCallback]
};

/**
 * 异步方法，请使用await标记
 * 等待指定时间后继续执行后面的内容
 * @param time 单位：秒
 */
export async function WaitTime(time: number) {
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