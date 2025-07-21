import { Tools } from "../utils/tools";
import BaseManager from "./base-manager";
import RecordManager from "./record-manager";
import { NATIVE } from "cc/env";

interface CONTEXT {
    deviceId: string;
};

export default class DeviceManager extends BaseManager {
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'DeviceManager';

    /**
     * 你属于哪个bundle
     */
    public static BundleName = 'resources';
    /**
     * 设备信息
     */
    protected static data : CONTEXT = {
        deviceId: '',
    }

    /**
     * 清理自己的数据结构
     * 此方法不会被主动调用，请在自己需要的时候自己调用
     */
    public static clear() {}

    /**
     * 加载自己的本地存档
     * 不需要自己主动调用，会在注册时调用一次，或者在重置存档的时候回调
     * 会在init方法后被调用
     */
    public static loadRecord() {
        const record = RecordManager.getRecord(DeviceManager.KEY);
        if (record) {
            DeviceManager.data = record as CONTEXT;
        }
    }
    /**
     * 存档
     * 此方法时一个protected的，所以，所有的存档操作都需要在manager内部处理，请勿在view中调用
     * 调用方式应该是,xxxManager.xxxx()->这个方法改变了一些需要存档的东西，主动触发存档操作
     */
    protected static saveRecord() {}



    public static get deviceId() : string {
        if (!DeviceManager.data.deviceId || DeviceManager.data.deviceId == '') {
            if(!NATIVE){
                DeviceManager.data.deviceId = Tools.Uuid;
            }else{
                console.warn('FISH 你需要在这里设置你从原生设备上获取到的deviceId!!');
            }
            DeviceManager.saveRecord();
        }
        return DeviceManager.data.deviceId;
    }
}