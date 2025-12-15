import { _decorator, Component, Node } from 'cc';
import BaseManager from '../core/manager/base-manager';
import HttpLobbyHelper from '../network/net/http-lobby-helper';
import { Global } from '../global';
import { GameEvent } from '../define';
import { Vec3 } from 'cc';
import { randomRange } from 'cc';
const { ccclass, property } = _decorator;
export interface betInfo {
    bet_coin: string,
    bet_id: number,
    player_id: string,
    icon: number,
    win: number
}
export interface betAreaInfo {
    centerPoint: Vec3;//世界坐标
    width: number;//范围内一半的宽度
    height: number;//范围内一半的高度
}
export default class CommonManager extends BaseManager {
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'CommonManager';

    /**
     * 网络消息拦截器
     * @param msgType
     * @param data
     * @returns 如果返回true，说明消息被框架拦截了，不需要继续向下传递
     */
    public static onNetMessage(msgType: string, data: any): boolean {
        switch (msgType) {
            case wheel.Message.MsgLastWinNtf: {
                const msg = data as wheel.MsgLastWinNtf;
                if (msg.winAmount) {
                    this._userWinList.push(msg);
                    Global.sendMsg(GameEvent.UPDATE_USERWIN);
                }
                return true;
            }
            case baccarat.Message.MsgBaccaratOnlineNtf: {
                const msg = data as baccarat.MsgBaccaratOnlineNtf;
                this._onlineInRoom = msg.online_sum || 0;
                Global.sendMsg(GameEvent.UPDATE_ONLINE_ROOM);
                return true;
            }
        }
        return false
    }
    /**
     * 房间在线人数
     */
    private static _onlineInRoom: number = 0;
    /**
     * 实时在线人数
     */
    private static _online: number = 0;
    /**
     * 玩家获胜通知
     */
    private static _userWinList: wheel.MsgLastWinNtf[] = [];
    /**
     * 是否是自动游戏状态
     */
    private static _auto: boolean = false;
    /**
     * 是否点击过上一局下注的记录
     */
    private static _agail: boolean = false;
    /**
     * 前端记录的上一局下注记录
     */
    private static _lastbetInfo: betInfo[] = [];

    public static async doGetlineNum() {
        // const rsp = await HttpLobbyHelper.GetOnlineNum();
        // this.Online = rsp;
    }

    public static set Online(value: number) {
        this._online = value;
        Global.sendMsg(GameEvent.UPDATE_ONLINE);
    }

    public static get OnlineInRoom(): number {
        return this._onlineInRoom;
    }

    public static get Online(): number {
        return this._online;
    }

    public static get UserWinList(): wheel.MsgLastWinNtf[] {
        return this._userWinList;
    }

    public static set Auto(value: boolean) {
        this._auto = value;
    }

    public static get Auto(): boolean {
        return this._auto;
    }

    public static set Agail(value: boolean) {
        this._agail = value;
    }

    public static get Agail(): boolean {
        return this._agail;
    }

    public static set LastbetInfo(value: betInfo[]) {
        this._lastbetInfo = value;
    }

    public static get LastbetInfo(): betInfo[] {
        return this._lastbetInfo || [];
    }

    public static subtractUserWinList() {
        this._userWinList.splice(0, 1);
    }

    public static showName(str: string): string {
        if (str.length > 6) str = str.slice(0, 6) + '...';
        return "Player_" + str;
    }

}


