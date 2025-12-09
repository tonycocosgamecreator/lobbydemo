import { HttpHelper } from "../../core/net/http-helper";

export interface IHttpContent {
    /**GET|POST */
    type: string;
    /**请求地址,例如： /mg/api/system/guestLogin 注意，一定要带/ */
    url: string;
    /**请求参数 */
    params: object;
    /**请求头,可选 */
    headers?: object;
    /**请求超时时间,可选，会默认5000ms */
    timeout?: number;
    /**请求成功回调,可选,如果使用await，则可以不传 */
    callback?: (data: string) => void;
}
export class HttpLobbyConnector {

    private static _instance: HttpLobbyConnector;
    private _baseUrl: string = '';
    public static get instance() {
        if (!this._instance) {
            this._instance = new HttpLobbyConnector();
            this._instance._baseUrl = "http://192.168.110.4:11402";

        }
        return this._instance;
    }

    public get baseUrl() {
        return this._baseUrl;
    }
    /**
     * 注意，最后一定不能带 / 
     */
    public set baseUrl(url: string) {
        this._baseUrl = url;
    }

    public async send(content: IHttpContent) {
        if (content.type == 'GET') {
            const data = await HttpHelper.Get(this._baseUrl + content.url, content.params, content.timeout, content.headers);
            content.callback && content.callback(data);
            return data;
        } else if (content.type == 'POST') {
            const data = await HttpHelper.Post(this._baseUrl + content.url, content.params, content.timeout, content.headers);
            if (data == 'onerror') {
                console.error('POST ERROR -> ', content.url, content.params, content.timeout);
                let msg = {
                    status: false,
                    msg: 'The network is not available, please check your network connection.',
                    data: null,
                    loginStatus: 0
                };
                const msgStr = JSON.stringify(msg);
                content.callback && content.callback(msgStr);
                return msgStr;
            } else if (data == 'ontimeout') {
                console.error('POST TIMEOUT -> ', content.url, content.params, content.timeout);
                let msg = {
                    status: false,
                    msg: 'connection timeout',
                    data: null,
                    loginStatus: 0
                };
                const msgStr = JSON.stringify(msg);
                content.callback && content.callback(msgStr);
                return msgStr;
            } else {
                content.callback && content.callback(data);
                return data;
            }
        }
    }

}