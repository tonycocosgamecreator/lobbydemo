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
     * 玩家信息更新
     */
    PLAYER_INFO_UPDATE = 'PLAYER_INFO_UPDATE',
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

export interface BetInfo{
    /** 币种 */
    currency : string;
    /** 底注列表 */
    bet_size : number[];
    /** 倍数列表 */
    multiple : number[];
    /** 底注倍数列表 */
    bet_index_rule : number[];
}

/**
 * 游戏的主题ID
 */
export const THEME_ID = 1025;

/**
* 筹码金额颜色
*/
export const ChipColor = ['#47506A', '#1A7401', '#1756A4', '#90017A', '#A31B09', '#A36407'];
/**
* 筹码金额
*/
export const ChipCount = [5, 10, 20, 50, 100, 200];


