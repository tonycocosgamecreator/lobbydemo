import BaseManager from "../../core/manager/base-manager";
import HttpLobbyHelper from "../net/http-lobby-helper";


export  default class LobbyManager extends BaseManager {
        /**
     * 获取所有游戏列表
     * 目前来说，暂时不影响APP的游戏列表，因为没有传递全面
     * @param cateId 分类ID 可选，如果不传，默认获取所有分类
     * @param is_system 是否是系统游戏 可选，默认是1，表示是系统游戏
     * @returns 
     */
    public static async doHttpGetCateGameLists(cateId? : number,is_system : number = 1) {
        // const msg = await HttpLobbyHelper.CateGameLists(is_system,cateId);
        // if(!msg){
        //     console.error('getCateGameLists error');
        //     return;
        // }
        
        // const data = msg.data;
        // const list = data.list;
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

        // this._game_cates = list;
        // for(let i = 0;i<list.length;i++){
        //     const cateList = list[i];
        //     this._cateGameLists[cateList.id] = cateList.game_list;
        // }
    }
}


