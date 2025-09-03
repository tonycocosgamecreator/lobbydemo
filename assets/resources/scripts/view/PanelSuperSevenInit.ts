// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import ViewManager from '../core/manager/view-manager';
import Managers from '../core/manager/managers';
import SuperSevenManager from '../manager/ss-manager';
import JsonLoginManager from '../network/managers/json-login-manager';
import WalletManager from '../manager/wallet-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;
interface MsgGameEnterAck {
    code: number;
    /**游戏唯一编码 */
    game_code: string;
}
@ccclass('PanelSuperSevenInit')
export default class PanelSuperSevenInit extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    buildUi() {
        Managers.registe(SuperSevenManager);
        JsonLoginManager.Login();

    }

    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        if (msgType == supersevenbaccarat.Message.MsgGameEnterAck) {
            const msg = data as supersevenbaccarat.MsgGameEnterAck
            if (data.code != 0) return false;
            WalletManager.bets = msg.bet_config;
            WalletManager.walletInfos = msg.wallets || [];
            SuperSevenManager.PlayInfo = msg.player || null;
            let free = msg.player?.free_count > 0 || false;
            SuperSevenManager.Free = free;
            if (free) {
                SuperSevenManager.FreeCount = msg.player?.free_count || 0;
                SuperSevenManager.FinishedCount = msg.player?.free_finished_times || 0;
                SuperSevenManager.FinishedWin = msg.player?.free_win_gold || 0;
            }
            SuperSevenManager.BetCoin = msg.player?.last_bet || 0;
            ViewManager.OpenPanel(this.module, 'PanelSuperSevenMain');
            this.close();
        }
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'PanelSuperSevenInit';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return PanelSuperSevenInit.BUNDLE_NAME;
    }
    public get viewName() {
        return PanelSuperSevenInit.VIEW_NAME;
    }
    // @view export resource end
}
