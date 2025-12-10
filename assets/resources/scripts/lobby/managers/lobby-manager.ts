import BaseManager from "../../core/manager/base-manager";
import BrowserUtils from "../../core/utils/browser-utils";
import { IPanelLobbyView } from "../define/lobby-main-view";
import HttpLobbyHelper from "../net/http-lobby-helper";
import { lobbyhttp } from "../net/lobby-https-interface-define";


export default class LobbyManager extends BaseManager {

    /**
    * PanelLobby界面
    */
    public static iPanelLobbyView: IPanelLobbyView | null = null;
    public static cateGameLists: lobbyhttp.ICateGame[] = [];
    public static curGameUrl: string = '';
    /**
     * 获取所有游戏列表
     */
    public static async doHttpGetCateGameLists() {
        this.cateGameLists = []
        const msg = await HttpLobbyHelper.GetCates();
        if (!msg) {
            console.error('getCateGameLists error');
            return;
        }
        const data = msg.data;
        const list = data.list;
        // const currentGame = data.current_room;
        // if(currentGame.room_id && currentGame.room_id != 0){
        // if(this._currentGameRoom){
        //     console.error('doHttpGetCateGameLists error,currentGame is not null',this._currentGameRoom);
        //     return;
        // }
        // if(currentGame.code == "sit&go"){
        //     currentGame.match_type = poker.MatchType.SNG;
        //     bDebug && console.log("当前拉回的游戏是比赛模式 -> ",currentGame);
        // }else{
        //     currentGame.match_type = poker.MatchType.MatchTypeNone;
        //     bDebug && console.log("当前拉回的游戏是普通模式 -> ",currentGame);
        // }
        // this._currentGameRoom = currentGame;
        // }
        for (let i = 0; i < list.length; i++) {
            const cateList = list[i];
            this.cateGameLists.push(cateList);
        }
        if (LobbyManager.iPanelLobbyView) {
            LobbyManager.iPanelLobbyView.onReceiveInitData();
        }
    }

    public static async doHttpGameLogin(game_code: string) {
        this.curGameUrl = '';
        const msg = await HttpLobbyHelper.doGameLogin(game_code, BrowserUtils.getParam('currency'));
        if (!msg) {
            console.error('doGameLogin error');
            return;
        }
        if (msg.code && msg.code == 200) {
            const data = msg.data;
            if (data.url.includes("http://") || data.url.includes("https://")) {
                this.curGameUrl = data.url;
            }
        }
        if (LobbyManager.iPanelLobbyView) {
            LobbyManager.iPanelLobbyView.onReceiveGameUrlData();
        }
    }
}


