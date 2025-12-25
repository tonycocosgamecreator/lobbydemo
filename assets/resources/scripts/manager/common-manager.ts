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
            case baccarat.Message.MsgLastWinNtf: {
                const msg = data as baccarat.MsgLastWinNtf;
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
            case baccarat.Message.MsgPlayerRankNtf: {
                const msg = data as baccarat.MsgPlayerRankNtf;
                this.setTopPlayerData(msg.ranks);
                return true;
            }
            case baccarat.Message.MsgGetRankRsp: {
                const msg = data as baccarat.MsgGetRankRsp;
                Global.sendMsg(GameEvent.UPDATE_RANK, msg.rank);
                return true;
            }
        }
        return false
    }
    /**
     * 前三名玩家数据
     */
    private static _topPlayers: Map<string, baccarat.RankList> = new Map();
    /**
     * 最幸运的三位玩家
     */
    private static _luckPlayers: Map<string, game.SUDSevenUpDownRankList> = new Map();
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
    private static _userWinList: baccarat.MsgLastWinNtf[] = [];
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

    public static get UserWinList(): baccarat.MsgLastWinNtf[] {
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
    //=============================================================================

    /**
     * 设置榜单玩家的数据
     * @param ranks 
     */
    public static setTopPlayerData(ranks: baccarat.RankList[]) {
        this._topPlayers.clear();
        ranks.forEach((playerData) => {
            if (playerData) {
                this._topPlayers.set(playerData.player_id, playerData);
            }
        });
    }

    /**
     * 榜单玩家分数的变化
     * @param playerId 
     * @param count
     */
    public static addTopPlayerScore(playerId: string, count: number) {
        let playerData = this._topPlayers.get(playerId);
        if (!playerData) return;
        let score = playerData.balance.add(count);
        playerData.balance = score;
        this._topPlayers.set(playerId, playerData);
    }

    /**
     * 获取榜单玩家的数据
     * @param ranks 
     */
    public static getTopPlayerData(): baccarat.RankList[] {
        return Array.from(this._topPlayers.values());
    }

    /**
     * 根据id获取榜单玩家的某个数据
     * @param playerId 
     */
    public static getTopPlayerDataById(playerId: string): baccarat.RankList | null {
        return this._topPlayers.get(playerId) || null;
    }

    /**
     * 设置幸运玩家的数据
     * @param ranks 
     */
    public static setLuckPlayerData(ranks: game.SUDSevenUpDownRankList[]) {
        this._luckPlayers.clear();
        ranks.forEach((playerData) => {
            if (playerData) {
                this._luckPlayers.set(playerData.player_id, playerData);
            }
        });
    }

    /**
     * 幸运玩家分数的变化
     * @param playerId 
     * @param count
     */
    public static addLuckPlayerScore(playerId: string, count: number) {
        let playerData = this._luckPlayers.get(playerId);
        if (!playerData) return;
        let score = playerData.balance.add(count);
        playerData.balance = score;
        this._luckPlayers.set(playerId, playerData);
    }

    /**
     * 获取幸运玩家的数据
     * @param ranks 
     */
    public static getLuckPlayerData(): game.SUDSevenUpDownRankList[] {
        return Array.from(this._luckPlayers.values());
    }

    /**
     * 根据id获取榜单玩家的某个数据
     * @param playerId 
     */
    public static getLuckPlayerDataById(playerId: string): baccarat.RankList | null {
        return this._luckPlayers.get(playerId) || null;
    }
    //=============================================================================
    public static subtractUserWinList() {
        this._userWinList.splice(0, 1);
    }

    public static showName(str: string, maxLen: number = 6): string {
        if (str.length > maxLen) str = str.slice(0, maxLen) + '...';
        return "Player_" + str;
    }

}


