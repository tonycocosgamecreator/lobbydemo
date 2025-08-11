import { _decorator, Component, Node } from 'cc';
import BaseManager from '../core/manager/base-manager';
import UIHelper from '../network/helper/ui-helper';
import WalletManager from './wallet-manager';

export default class JmManager extends BaseManager {
    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'JmManager';
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
        if(msgType == baccarat.Message.MsgEnterBaccaratRsp) {
            //进入游戏的响应
            const msg = data as baccarat.MsgEnterBaccaratRsp;
            const result    = msg.result;
            if(result && result.err_code != commonrummy.RummyErrCode.EC_SUCCESS) {
                //如果有错误码，说明进入游戏失败了
                //这里可以弹出提示框，提示玩家进入游戏失败
                console.error(`enter Game Failed: ${result.err_desc}`);
                UIHelper.showConfirmOfOneButtonToRefreshBrowser(
                    resourcesDb.I18N_RESOURCES_DB_INDEX.TIP_ENTER_GAME_FAILED,
                    resourcesDb.I18N_RESOURCES_DB_INDEX.Error
                );
                const deskId = msg.info.desk_id || 0;
                //设置钱包数据
                WalletManager.walletInfos   = msg.wallets || [];
                //设置玩家的下注数据
                WalletManager.bets          = msg.info.bets;
                //设置玩家的id
                this.playerId     = msg.player_id || 0;
                //设置期号
                this.period      = msg.info.period_id || '';
                //@todo : 需要设置其他数据

                return true; //拦截消息，不继续传递
            }

            return false;
        }
        return false;
    }

    /**
     * 当前玩家的ID
     */
    public static playerId : number = -1;
    /**
     * 当前期号
     */
    public static period : string = '';
    

}


