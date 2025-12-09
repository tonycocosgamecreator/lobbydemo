export namespace jsonmsg {

    export interface MessageStruct {
        /**消息名字，定义在Message里面 */
        msg_name : string;
        /**暂时未知 */
        req_id : number;
        /**消息内容 */
        data : {[key : string]: any};
    }

    export enum Code {
        CodeSuccess = 0,
        CodeFail = 1,
        /**重复登录 */
        CodeRepeatedLogin = 2,
        /**配置文件未找到 */
        CodeConfigureNotFound = 3,
        /**下注不匹配 */
        CodeBetNotMatch = 4,
        /**需要选择免费游戏 */
        CodeNeedSelectFreeGame = 5,
        /**需要选择免转动游戏 */
        CodeNeedSpinFree = 6,
        /**下注不够 */
        CodeBetNotEnough = 7,
        /**钱包锁定 */
        CodeWalletIsLock = 8,
        /**token无效 */
        TokenInvalid = 9,

        /**游戏未准备好 */
        CodeGameNotReady = 201,
        /**用户禁止登入游戏 */
        CodeUserForbid = 202,
        /**游戏关服了 */
        CodeGameNotOpen = 203,
    }
    /**
     *  错误码是否需要关闭游戏
     * @description 需要关闭游戏的错误码，主要是token无效，游戏未准备好，用户禁止登入游戏，游戏关服了
     * @param code 
     * @returns 
     */
    export function isCodeNeedCloseGame(code: number): boolean {
        if(code == Code.TokenInvalid || code == Code.CodeGameNotReady || code == Code.CodeUserForbid || code == Code.CodeGameNotOpen){
            return true;
        }
        return false;
    }
    /**
     *  错误码是否需要刷新游戏
     * @description 需要刷新游戏的错误码，主要是登录失败，重复登录，配置文件未找到
     * @param code 
     * @returns 
     */
    export function isCodeNeedRefresh(code: number): boolean {
        if(code == Code.CodeFail || code == Code.CodeRepeatedLogin || code == Code.CodeConfigureNotFound){
            return true;
        }
        return false;
    }

    export enum Message {
        /**心跳请求 */
        MsgGamePingReq = "MsgGamePingReq",
        /**心跳回复 */
        MsgGamePingAck = "MsgGamePingAck",
        /**登录验证 */
        MsgGameAuthReq = "MsgGameAuthReq",
        /**登录验证返回 */
        MsgGameAuthAck = "MsgGameAuthAck",
        /**进入游戏请求 */
        MsgGameEnterReq = "MsgGameEnterReq",
        /**进入游戏返回 */
        MsgGameEnterAck = "MsgGameEnterAck",
        /**玩家被剔除游戏的通知 */
        MsgKickOffAck = "MsgKickOffAck"
    }
    /**
     * 心跳的请求
     */
    export interface MsgGamePingReq {
        utc : number
    }
    /**
     * 心跳的返回
     */
    export interface MsgGamePingAck {
        utc : number,
        /**服务器时间 */
        server_time : number,
    }

    /**
     * 登录验证的请求
     */
    export interface MsgGameAuthReq {
        /**游戏账号，测试环境有效 */
        account : string;
        /**登录的token，正式环境有效 */
        token: string;
    }

    /**
     * 登录验证的返回
     */
    export interface MsgGameAuthAck {
        /**错误码 */
        code: number;
        /**游戏的名字，例如 mines2 */
        game_code : string;
    }
    /**
     * 进入游戏的请求
     */
    export interface MsgGameEnterReq {
        /**数据自定义 */
        [key : string]: any;
    }
    /**
     * 进入游戏的返回
     */
    export interface MsgGameEnterAck {
        code : number;
        /**游戏唯一编码 */
        game_code : string;
    }
    /**
     * 玩家被踢出游戏的通知
     */
    export interface MsgKickOffAck {
        reason : string;
    }
}

