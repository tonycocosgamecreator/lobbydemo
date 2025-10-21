import { bDebug } from "../core/define";
import BaseManager from "../core/manager/base-manager";
import { GameEvent } from "../define";
import { Global } from "../global";

export default class SsPlayerManager extends BaseManager {

    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'SsPlayerManager';

    /**
     * 清理自己的数据结构
     * 此方法不会被主动调用，请在自己需要的时候自己调用
     */
    public static clear() {
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
    /**
     * 网络消息拦截器
     * @param msgType
     * @param data
     * @returns 如果返回true，说明消息被框架拦截了，不需要继续向下传递
     */
    public static onNetMessage(msgType: string, data: any): boolean {
        if (msgType == supersevenbaccarat.Message.MsgUpdatePlayerDataRsp) {
            const msg = data as supersevenbaccarat.MsgUpdatePlayerDataRsp;
            bDebug && console.log('Change Avatar : ', msg);
            if (msg && msg.err_code != commonrummy.RummyErrCode.EC_SUCCESS) {
                //更新失败了
                Global.sendMsg(GameEvent.PLAYER_CHANGE_AVATAR, [false, -1]);
                return;
            }
            //更新成功了
            this._icon = msg.icon || 1;
            Global.sendMsg(GameEvent.PLAYER_CHANGE_AVATAR, [true, this._icon]);
            return true;
        }
        return false;
    }



    public static doNetPlayerIcon() {

        return true;
    }
    private static _icon: number = 1;
    static get Icon(): number {
        return this._icon;
    }

    static set Icon(value: number) {
        this._icon = value;
    }

    private static _playid: number = 1;
    static get PlayId(): number {
        return this._playid;
    }

    static set PlayId(value: number) {
        this._playid = value;
    }
}