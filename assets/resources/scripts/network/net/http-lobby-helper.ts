import { HttpLobbyConnector } from "./http-lobby-connector";
import { lobbyhttp } from "./lobby-https-interface-define";


export default class HttpLobbyHelper {
    /**
     * 获取游戏分类
     * @param is_system 是否系统内置小游戏 0否 1是，默认值1
     * @returns 
     */
    public static async GetCates(): Promise<any | null> {
        const data = await HttpLobbyConnector.instance.send({
            type: 'POST',
            url: lobbyhttp.Message.CATES,
            params: {},
            headers: {}
        });
        const msg = JSON.parse(data) as lobbyhttp.ICateGameListsRsp;
        if (!msg || msg.code != 200) return null;
        return msg;
    }

    /**
       * 游戏登录
       */
    public static async doGameLogin(game_code): Promise<any | null> {
        const data = await HttpLobbyConnector.instance.send({
            type: 'POST',
            url: lobbyhttp.Message.LOGIN,
            params: {
                account: lobbyhttp.Account.Value,
                game_code: game_code,
            },
            headers: {}
        });
        const msg = JSON.parse(data) as lobbyhttp.ICateGameLoginRsp;
        if (!msg || msg.code != 200) return null;
        return msg;

    }


}