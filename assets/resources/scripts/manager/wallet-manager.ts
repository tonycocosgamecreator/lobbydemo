import BaseManager from "../core/manager/base-manager";
import { BetInfo, GameEvent, WalletInfo } from "../define";
import { Global } from "../global";
import { CurrencyHelper } from "../helper/currency-helper";

export default class WalletManager extends BaseManager {
    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'WalletManager';

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

    //===========================公共方法===========================//
    private static _walletInfos: WalletInfo[] = [];
    public static get walletInfos(): WalletInfo[] {
        return this._walletInfos;
    }
    public static set walletInfos(walletInfos: WalletInfo[]) {
        this._walletInfos = walletInfos;
        if (this._currency == '') {
            this.currency = walletInfos[0].currency;
        }

    }
    private static _walletInfo: WalletInfo = null;
    public static get walletInfo(): WalletInfo {
        return this._walletInfo;
    }
    public static set walletInfo(walletInfo: WalletInfo) {
        this._walletInfo = walletInfo;
        this.updatePlayerCoin(this._walletInfo.balance);
    }
    private static _currency: string = '';
    public static get currency(): string {
        return this._currency;
    }
    public static set currency(currency: string) {
        this._currency = currency;
        for (let i = 0; i < this._walletInfos.length; i++) {
            const info = this._walletInfos[i];
            if (info.currency == currency) {
                this.walletInfo = info;
                break;
            }
        }
        Global.sendMsg(GameEvent.PLAYER_CURRENCY_UPDATE, currency);
    }
    /**
     * 获取当前货币余额
     */
    public static get balance(): number {
        if (this._walletInfo) {
            return this._walletInfo.balance;
        }
        return 0;
    }
    /**
     * 设置当前货币余额
     * @param currency 
     * @param balance 
     */
    public static setBalance(currency: string, balance: number) {
        for (let i = 0; i < this._walletInfos.length; i++) {
            const info = this._walletInfos[i];
            if (info.currency == currency) {
                info.balance = balance;
                break;
            }
        }
    }

    public static updatePlayerCoin(new_coin: number, sendmsg: boolean = true) {
        if (this._currency == '') {
            console.error('WalletManager.updatePlayerCoin: currency is empty!');
            return;
        }
        if (this._walletInfo == null) {
            console.error('WalletManager.updatePlayerCoin: walletInfo is null!');
            return;
        }
        if (this._walletInfo.currency != this._currency) {
            console.error('WalletManager.updatePlayerCoin: walletInfo currency is not equal!');
            return;
        }
        this._walletInfo.balance = new_coin;
        if (sendmsg) {
            Global.sendMsg(GameEvent.PLAYER_INFO_UPDATE, new_coin);
        }
    }

    public static isCoinEnough(val: number): boolean {
        if (this._walletInfo == null) {
            console.error('WalletManager.isCoinEnough: walletInfo is null!');
            return false;
        }
        if (this._walletInfo.currency != this._currency) {
            console.error('WalletManager.isCoinEnough: walletInfo currency is not equal!');
            return false;
        }
        return this._walletInfo.balance >= val;
    }

    private static _bets: { [currency: string]: BetInfo } = {};
    /**
     * 获取所有币种的下注配置
     */
    public static get bets(): { [currency: string]: BetInfo } {
        return this._bets;
    }
    /**
     * 设置所有币种的下注配置
     * @param bets 
     */
    public static set bets(bets: { [currency: string]: BetInfo }) {
        this._bets = bets;
    }
    /**
     * 获取指定币种的下注配置
     * @param currency 
     * @returns 
     */
    public static getCurrencyBetInfo(currency?: string): BetInfo {
        currency = currency || this._currency;
        return this._bets[currency];
    }
    /**
     * 获取指定币种的底注列表
     * @param currency 
     * @returns 
     */
    public static getCurrencyBetSize(currency?: string): number[] {
        currency = currency || this._currency;
        const betInfo = this.getCurrencyBetInfo(currency);
        if (betInfo) {
            return betInfo.bet_size;
        }
        return [];
    }
    public static getCurrencyBetIndex(currency?: string): number {
        currency = currency || this._currency;
        const betInfo = this.getCurrencyBetInfo(currency);
        if (betInfo) {
            return betInfo.default_index;
        }
        return 0;
    }
    private static _chooseChip: number = -1;
    public static set ChooseChip(value: number) { this._chooseChip = value }
    public static get ChooseChip(): number { return this._chooseChip; }

    public static getCurrencyBetGold(): number {
        let betSize = this.getCurrencyBetSize();
        if (!betSize || betSize.length == 0) return 0;
        if (this._chooseChip == -1) return 0
        return betSize[this._chooseChip] || 0;
    }
    /**
     * 获取指定币种的倍数列表
     * @param currency 
     * @returns 
     */
    public static getCurrencyMultiple(currency: string): number[] {
        const betInfo = this.getCurrencyBetInfo(currency);
        if (betInfo) {
            return betInfo.multiple;
        }
        return [];
    }
    /**
     * 获取指定币种的底注倍数列表
     * @param currency 
     * @returns 
     */
    public static getCurrencyBetIndexRule(currency: string): number[] {
        const betInfo = this.getCurrencyBetInfo(currency);
        if (betInfo) {
            return betInfo.bet_index_rule;
        }
        return [];
    }

    /**
     * 获取用于显示的货币格式化字符串
     */
    public static get formattedCurrency(): string {
        const balance = this.balance;
        const currency = this.currency;
        return CurrencyHelper.format(balance, currency, { showSymbol: true });
    }

}