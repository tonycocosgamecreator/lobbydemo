import { game } from "cc";

/**
 * 游戏内部通知
 */
export enum GameEvent {
    /**
     * 更新货币系统
     */
    PLAYER_CURRENCY_UPDATE = 'PLAYER_CURRENCY_UPDATE',
    /**
     * 玩家信息更新
     */
    PLAYER_INFO_UPDATE = 'PLAYER_INFO_UPDATE',
    /**
     * 要求打开菜单
     */
    REQUST_OPEN_MENU = 'REQUST_OPEN_MENU',
    /**
     * 要求更新历史记录的列表
     */
    REQUEST_REFRESH_GAME_HISTORY = 'REQUEST_REFRESH_GAME_HISTORY',
    /**
     * 更新下注金额
     */
    UPDATE_BET = 'UPDATE_BET',
    /**
     *停止旋转
     */
    STOP_ROTATION = 'STOP_ROTATION',
    /**
     *游戏状态
     */
    UPDATE_STATE = 'UPDATE_STATE',
    /**
     *转轴倍数
     */
    UPDATE_TIMES = 'UPDATE_TIMES',
    /**
     *免费游戏
     */
    UPDATE_FREE = 'UPDATE_FREE',
    /**
     *自动游戏
     */
    UPDATE_AUTO = 'UPDATE_AUTO',
    /**
     *历史记录
     */
    UPDATE_HISTORY = 'UPDATE_HISTORY',
    /**
     *历史记录中奖区域的概率
     */
    UPDATE_HISTORY_PROBABILITY = 'UPDATE_HISTORY_PROBABILITY',
    /**
     *房间在线人数
     */
    UPDATE_ONLINE_ROOM = 'UPDATE_ONLINE_ROOM',
    /**
     *实时在线人数
     */
    UPDATE_ONLINE = 'UPDATE_ONLINE',
    /**
     * 玩家总下注额度更新
     */
    PLYER_TOTAL_BET_UPDATE = 'PLYER_TOTAL_BET_UPDATE',
    /**
     *LED
     */
    UPDATE_LED = 'UPDATE_LED',
    /**
    *RANK
    */
    UPDATE_RANK = 'UPDATE_RANK',
    /**
    *更换头像
    */
    PLAYER_CHANGE_AVATAR = 'PLAYER_CHANGE_AVATAR',
    /**
    *用户累计下注值
    */
    UPDATE_ADDBET = 'UPDATE_ADDBET',
    /**
    *sta动画
    */
    UPDATE_STAR = 'UPDATE_STAR'

}

export interface WalletInfo {
    /**
     * 货币类型
     */
    currency: string;
    /**
     * 货币数量
     */
    balance: number;
}

export interface BetInfo {
    /** 币种 */
    currency: string;
    /** 底注列表 */
    bet_size: number[];
    /** 倍数列表 */
    multiple: number[];
    /** 底注倍数列表 */
    bet_index_rule: number[];
    /** 默认选中倍数 */
    default_index: number;
    /** 最大下注 */
    max_bet?: number;
    /** 最小下注 */
    min_bet?: number;
}

/**
 * 游戏的主题ID
 */
export const THEME_ID = 1050;


/**
 * 异步方法，请使用await标记
 * 等待指定帧后继续执行
 * 注意：每一帧的时间为理论时间，若DC过高或者游戏逻辑耗时严重，会导致时间不正确
 * @param frame 帧数量，默认为1
 */
export async function WaitFrame(frame: number = 1) {
    const fr = game.frameTime * frame;
    //bDebug && console.log("期望等待的时间：",fr);
    return new Promise<any>((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, fr);
    });
}
