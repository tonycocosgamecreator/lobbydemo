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
/**
* 筹码金额颜色
*/
export const ChipColor = ['#47506A', '#1A7401', '#1756A4', '#90017A', '#A31B09', '#A36407'];
/**
* 筹码金额
*/
export const ChipCount = [5, 10, 20, 50, 100, 200];


