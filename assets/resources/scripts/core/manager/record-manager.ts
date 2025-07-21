import BaseGlobal from "../message/base-global";
import { BaseMessage } from "../message/base-message";
import BaseManager from "./base-manager";
const RECORD_VERSION = '__VERSION__';
export default class RecordManager extends BaseManager {
    public static KEY = 'RecordManager';
    public static BundleName = 'resources';

    /**
     * 当前所有的本地存档
     */
    private static _records: { [name: string]: {[key : string] : any} } = {};
    /**
     * 脏标记
     */
    private static _bDirty: boolean = false;
    /**
     * 多少时间进行一次存档，仅脏标记为true是会触发存档
     */
    private static _fReflushTime: number = 0.1;
    /**
     * 当前存档时间
     */
    private static _fNowReflushTime: number = 0;
    /**
     * 存档版本，如果版本不对，则默认重置所有存档
     */
    private static _iRecordVersion: number = 0;

    public static loadRecord() {}
    public static saveRecord() {}

    public static onLateUpdate(dt: number): void {
        this._fNowReflushTime += dt;
        if (!this._bDirty) {
            return;
        }
        if (this._fNowReflushTime < this._fReflushTime) {
            return;
        }
        this._fNowReflushTime = 0;
        this.saveRecord();
        this._bDirty = false;
    }

    //====================================公共方法=================================//

    /**
     *
     * @param key 设置存档的KEY
     */
    public static setStorageKey(key: string) {
        this.KEY = key;
    }

    /**
     * 设置最小存档间隔
     */
    public static set fReflushTime(val: number) {
        this._fReflushTime = val;
    }

    /**
     * 设置存档的数据
     * @param key   key
     * @param data  需要存档的内容
     */
    public static setRecord(key: string, data: {[key : string] : any}) {
        this._records[key] = data;
        this._bDirty = true;
    }

    /**
     * 获取存档数据
     * @param key
     */
    public static getRecord(key: string) {
        return this._records[key];
    }

    /**
     * 重置所有存档
     * 此方法会触发BaseMessage.RESET_RECORD通知
     * 此方法会修改存档版本号
     */
    public static reset() {
        this._records = {};
        this._iRecordVersion += 1;
        this._records[RECORD_VERSION] = {
            version: this._iRecordVersion
        };
        this._bDirty = false;
        this.saveRecord();
        BaseGlobal.sendMsg(BaseMessage.RESET_RECORD);
    }
}