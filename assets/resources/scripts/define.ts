import { game } from "cc";

/**
 * 游戏内部通知
 */
export enum GameEvent {
    /**
     * 玩家总下注额度更新
     */
    PLYER_TOTAL_BET_UPDATE = 'PLYER_TOTAL_BET_UPDATE',
    /**
     * 更新货币系统
     */
    PLAYER_CURRENCY_UPDATE = 'PLAYER_CURRENCY_UPDATE',
    /**
     * 玩家当前局数更新
     */
    PLAYER_PERIOD_UPDATE = 'PLAYER_PERIOD_UPDATE',
    /**
     * 玩家信息更新
     */
    PLAYER_INFO_UPDATE = 'PLAYER_INFO_UPDATE',
    /**
     *更新下注选项的数据
     */
    UPDATE_BET_CHOOSE = 'UPDATE_BET_CHOOSE',
    /**
     *更新记录
     */
    UPDATE_HISTORY = 'UPDATE_HISTORY',
    /**
     * 要求打开菜单
     */
    REQUST_OPEN_MENU = 'REQUST_OPEN_MENU',
    /**
     * 要求更新历史记录的列表
     */
    REQUEST_REFRESH_GAME_HISTORY = 'REQUEST_REFRESH_GAME_HISTORY',
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
}

/**
 * 游戏的主题ID
 */
export const THEME_ID = 1025;

/**
* 筹码金额颜色
*/
export const ChipColor = ['#47506A', '#1A7401', '#1756A4', '#90017A', '#A31B09', '#A36407'];

export const BetPoint = 'BetPoint';

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
