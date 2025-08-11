import { bDebug } from "../../core/define";
import BaseManager from "../../core/manager/base-manager";
import { GameEvent, THEME_ID } from "../../define";
import { Global } from "../../global";
import { MessageSender } from "../net/message-sender";
/**
 * 这里处理进入游戏的一些消息
 */
export class EnterGameManager extends BaseManager {
    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'EnterGameManager';

    /**
     * 你属于哪个bundle
     */
    public static BundleName = 'resources';

    /**
     * 清理自己的数据结构
     * 此方法不会被主动调用，请在自己需要的时候自己调用
     */
    public static clear() { }

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
        return false;
    }

    //====================================公共方法===============================//
    /**
     * 进入指定的游戏
     * @param gameId 
     * @param deskType 桌子类型
     * @param change 是否是换桌
     */
    public static enterGame(gameId: string, deskType?: number, change?: boolean) {
        if (change == null) {
            change = false;
        }
        
        const data: baccarat.MsgEnterBaccaratReq = {
            theme_id: THEME_ID,
            //player_id   : GameApiManager.config.player_id,
            desk_type: deskType,
            change: change
        };
        //直接发送进入游戏的消息,只负责发消息，不负责接消息，因为快速线游戏已经在游戏里面了
        //根据游戏服务器的消息定义看来，每一个游戏都有一套自己的进入游戏的玩意儿在里面，所以 这里我们无需处理
        MessageSender.SendMessage(baccarat.Message.MsgEnterBaccaratReq, data);
    }
}