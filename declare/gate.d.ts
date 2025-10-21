declare namespace gate{

    const PACKAGE_NAME = 'gate';

    /** option go_package = "gitlab.fz.stevegame.red/back-end/common/client_pb/gate"; */
    enum ErrCode{
        /**  成功 */
        SUCCESS = 0,
        /**  未知错误 */
        UNKNOW = 1,
        /**  参数错误 */
        ERR_PARAM = 2,
        /**  失败 */
        ERR_FAIL = 3,
        /**  用户已存在 */
        ERR_USER_EXIST = 4,
        /**  验证码错误 */
        ERR_VIRIFY_CODE = 5,
        /**  无效的 token */
        ERR_INVALID_TOKEN = 101,
        /**  token 已经过期 */
        ERR_EXPIRE_TOKEN = 102,
        /**  已经认证过了 */
        ERR_ALREADY_AUTHED = 103,
    }

    enum Message {
        /** GateAuthReq 网关认证请求 */
        GateAuthReq = 'GateAuthReq',
        /** GateAuthRsp 网关认证应答 */
        GateAuthRsp = 'GateAuthRsp',
        /** GateHeartBeatReq 心跳检测请求 */
        GateHeartBeatReq = 'GateHeartBeatReq',
        /** GateHeartBeatRsp 心跳检测应答 */
        GateHeartBeatRsp = 'GateHeartBeatRsp',
        /** GateAnotherLoginNtf 顶号通知 */
        GateAnotherLoginNtf = 'GateAnotherLoginNtf',
        /** GateNoLoginNtf 未登陆通知 */
        GateNoLoginNtf = 'GateNoLoginNtf',
        /** GateTransmitHTTPReq 向平台服转发 HTTP 请求 */
        GateTransmitHTTPReq = 'GateTransmitHTTPReq',
        /** GateTransmitHTTPRsp HTTP 响应 */
        GateTransmitHTTPRsp = 'GateTransmitHTTPRsp',
        /** GateRegisterReq 注册请求 */
        GateRegisterReq = 'GateRegisterReq',
        /** GateRegisterRsp 注册响应 */
        GateRegisterRsp = 'GateRegisterRsp',
        /** GateResetPasswordReq 找回密码请求 */
        GateResetPasswordReq = 'GateResetPasswordReq',
        /** GateResetPasswordRsp 找回密码响应 */
        GateResetPasswordRsp = 'GateResetPasswordRsp',
        /** GateSendSmsCodeReq 发送短信验证码请求 */
        GateSendSmsCodeReq = 'GateSendSmsCodeReq',
        /** GateSendSmsCodeRsp 发送短信验证码响应 */
        GateSendSmsCodeRsp = 'GateSendSmsCodeRsp',
        /** GateGetPicCodeReq 获取图形验证码请求 */
        GateGetPicCodeReq = 'GateGetPicCodeReq',
        /** GateGetPicCodeRsp 获取图形验证码响应 */
        GateGetPicCodeRsp = 'GateGetPicCodeRsp',
        /** GateTransferMsgFailNtf 转发消息失败通知 */
        GateTransferMsgFailNtf = 'GateTransferMsgFailNtf',
    }

    /** GateAuthReq 网关认证请求 */
    interface GateAuthReq{
        /**  玩家 ID  */
        player_id? : number;
        /**  认证到期时间 */
        expire? : number;
        /**  token  */
        token? : string;
    }

    /** GateAuthRsp 网关认证应答 */
    interface GateAuthRsp{
        /**  错误码 */
        err_code? : gate.ErrCode;
    }

    /** GateHeartBeatReq 心跳检测请求 */
    interface GateHeartBeatReq{
        /**  时间 */
        time_stamp? : number;
    }

    /** GateHeartBeatRsp 心跳检测应答 */
    interface GateHeartBeatRsp{
        /**  时间 */
        time_stamp? : number;
    }

    /** GateAnotherLoginNtf 顶号通知 */
    interface GateAnotherLoginNtf{
        /**  保留 */
        reserve? : number;
        /**  顶号设备 */
        device? : string;
        /**  顶号时间 */
        time_stamp? : number;
    }

    /** GateNoLoginNtf 未登陆通知 */
    interface GateNoLoginNtf{
        /**  保留 */
        reserve? : number;
    }

    /** GateTransmitHTTPReq 向平台服转发 HTTP 请求 */
    interface GateTransmitHTTPReq{
        /**  url，不包括地址，如 /resetphone?account=xxx */
        url? : string;
        /**  method， 如 POST、GET */
        method? : string;
        /**  content_type， 对应 http 协议头的 Content-Type */
        content_type? : string;
        /**  body 数据，对应 http 的 Body, json格式，服务器回自动转换成post-form格式 */
        data? : string;
    }

    /** GateTransmitHTTPRsp HTTP 响应 */
    interface GateTransmitHTTPRsp{
        /**  e.g 200 */
        status_code? : number;
        /**  响应数据 */
        response_body? : string;
        /**  url，不包括地址，如 /resetphone?account=xxx */
        url? : string;
        /** 错误描述 */
        err_msg? : string;
    }

    /** GateRegisterReq 注册请求 */
    interface GateRegisterReq{
        /**  手机号 */
        phone? : string;
        /**  密码 */
        password? : string;
        /**  验证码 */
        code? : string;
        /**  邀请码 */
        inviteKey? : string;
        /**  来源 */
        source? : string;
        /** 产品ID */
        product_id? : number;
        /** 渠道ID */
        channel_id? : number;
        /**  广告 id，邀请码 */
        adid? : string;
        /**  客户端版本号 */
        version? : string;
        /**  登录设备名 */
        device? : string;
        /**  登录设备 IMEI */
        imei? : string;
        /**  用于LoeMaster sdk 基础数据 */
        sdk_data? : string;
        /**  地理坐标,x,y经纬度  用,分割。 */
        coordinate? : string;
        /**  手机系统语言 */
        language? : string;
        /**  手机名称 */
        phone_name? : string;
        /**  运营商 */
        service_provider? : string;
        /**  是否真金模式: 由客户端根据SDK提供 */
        is_real? : boolean;
    }

    /** GateRegisterRsp 注册响应 */
    interface GateRegisterRsp{
        /**  错误码 */
        err_code? : gate.ErrCode;
        /**  错误内容 */
        err_msg? : string;
        /**  玩家ID */
        player_id? : number;
        /**  登录sessionID，之后客户端可以使用 player_id + token 登录 */
        token? : string;
        /**  java http服务器回复，json格式。 */
        http_rsp? : string;
    }

    /** GateResetPasswordReq 找回密码请求 */
    interface GateResetPasswordReq{
        /**  手机号 */
        phone? : string;
        /**  新密码 */
        password? : string;
        /**  验证码 */
        code? : string;
        /**  渠道ID */
        channel_id? : number;
    }

    /** GateResetPasswordRsp 找回密码响应 */
    interface GateResetPasswordRsp{
        /**  错误码 */
        err_code? : gate.ErrCode;
        /**  错误内容 */
        err_msg? : string;
    }

    /** GateSendSmsCodeReq 发送短信验证码请求 */
    interface GateSendSmsCodeReq{
        /**  手机号 */
        phone? : string;
        /**  验证码模板类型, 2=注册模板， 3=重置密码 */
        tpl? : commonrummy.RummySmsTempl;
        /**  渠道ID */
        channel_id? : number;
    }

    /** GateSendSmsCodeRsp 发送短信验证码响应 */
    interface GateSendSmsCodeRsp{
        /**  错误码 */
        err_code? : gate.ErrCode;
        /**  错误内容 */
        err_msg? : string;
    }

    /** GateGetPicCodeReq 获取图形验证码请求 */
    interface GateGetPicCodeReq{
        /**  手机号 */
        phone? : string;
    }

    /** GateGetPicCodeRsp 获取图形验证码响应 */
    interface GateGetPicCodeRsp{
        /**  错误码 */
        err_code? : gate.ErrCode;
        /**  图形验证码数据 */
        buf? : string;
        /**  错误内容 */
        err_msg? : string;
    }

    /** GateTransferMsgFailNtf 转发消息失败通知 */
    interface GateTransferMsgFailNtf{
        /**  消息ID */
        msg_id? : number;
        /**  失败描述 */
        fail_des? : string;
        /**  请求数据 */
        req_msg? : Uint8Array;
    }

}
