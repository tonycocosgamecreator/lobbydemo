import { _decorator, Component, Node } from 'cc';
import BaseManager from '../core/manager/base-manager';
import { sys } from 'cc';
const { ccclass, property } = _decorator;

export class LocalStorageManager extends BaseManager {
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'LocalStorageManager';
    /**
     * 你属于哪个bundle
     */
    public static BundleName = 'resources';
    /**
     * 清理自己的数据结构
     * 此方法不会被主动调用，请在自己需要的时候自己调用
     */
    public static clear() {
        sys.localStorage.clear();
    }

    /**
     * 加载自己的本地存档
     * 不需要自己主动调用，会在注册时调用一次，或者在重置存档的时候回调
     * 会在init方法后被调用
     */
    public static loadRecord() { }
    /**
     * 存档
     * 此方法时一个protected的，所以，所有的存档操作都需要在manager内部处理，请勿在view中调用
     * 调用方式应该是,xxxManager.xxxx()->这个方法改变了一些需要存档的东西，主动触发存档操作
     */
    protected static saveRecord() { }
    /**
     * 每一帧回调一次
     * @param dt
     */
    public static update(dt: number) { }

    // 保存数据
    static save(key: string, value: any) {
        try {
            const data = typeof value === 'string' ? value : JSON.stringify(value);
            sys.localStorage.setItem(key, data);
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }

    // 读取数据
    static load<T>(key: string, defaultValue: T): T {
        try {
            const data = sys.localStorage.getItem(key);
            if (data === null || data === undefined) return defaultValue;

            try {
                return JSON.parse(data) as T;
            } catch {
                return data as T;
            }
        } catch (e) {
            console.error('Load failed:', e);
            return defaultValue;
        }
    }

    // 删除数据
    static remove(key: string) {
        sys.localStorage.removeItem(key);
    }
}


