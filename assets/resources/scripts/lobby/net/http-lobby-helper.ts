import { HttpLobbyConnector } from "./http-lobby-connector";
import { lobbyhttp } from "./lobby-https-interface-define";
import { StringUtils } from "../../core/utils/string-utils";
import { log } from "cc";


export default class HttpLobbyHelper {

    /**
     * 获取游戏分类
     * @param is_system 是否系统内置小游戏 0否 1是，默认值1
     * @returns 
     */
    public static async GetCates(is_system: number = 1): Promise<any | null> {

        let randomString = StringUtils.getSecureRandomString();
        let timestamp = new Date().getTime();
        const data = await HttpLobbyConnector.instance.send({
            type: 'POST',
            url: lobbyhttp.Message.CATES,
            params: {
            },
            headers: {
                AccessKeyId: lobbyhttp.AccessKeyId,
                Nonce: randomString,
                Timestamp: timestamp,
                Sign: lobbyhttp.AccessKeySecret + randomString + timestamp
            }
        });
        log(data)
        // const msg = JSON.parse(data) as lobbyhttp.ICatesRsp;
        // bDebug && console.log('GetCates -> ',msg);
        // if(!this._checkResponseValid(msg)){
        //     return null;
        // }
        // return msg;
        return null
    }




}