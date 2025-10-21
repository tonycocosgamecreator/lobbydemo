declare namespace login{

    const PACKAGE_NAME = 'login';

    /**  */
    enum ErrorCode{
        /**  成功 */
        SUCCESS = 0,
        /**  服务器异常 */
        ABNORMAL = 1,
        /**  需要验证手机验证码 */
        ERR_NEED_CHECK = 2,
        /**  认证超时 */
        ERR_EXPIRE_TOKEN = 101,
        /**  无效的 token  */
        ERR_INVALID_TOKEN = 102,
        /**  账号不存在 */
        ERR_ACCOUNT_NOT_EXIST = 103,
        /**  密码错误 */
        ERR_PASSWORD_ERR = 104,
        /**  账号或密码错误 */
        ERR_ACCOUNT_OR_PASSWORD_ERR = 105,
        /**  账号被封停 */
        ERR_ACCOUNT_DISABLED = 106,
        /**  图形验证码错误 */
        ERR_PIC_CODE = 107,
        /**  邀请码错误 */
        ERR_INVITOR_CODE = 108,
        /**  微信session获取失败 */
        ERR_GET_WX_SESSION = 1001,
    }

    /** 登录方式 */
    enum LoginType{
        /**  */
        TOKEN_LOGIN = 0,
        /**  */
        VISITOR_LOGIN = 1,
        /**  */
        PHONE_LOGIN = 2,
        /**  */
        WECHAT_LOGIN = 3,
        /**  */
        WECHAT_XYX_LOGIN = 4,
        /**  */
        GOOGLE_LOGIN = 5,
        /**  */
        FACEBOOK_LOGIN = 6,
        /**  */
        ACCOUNT_LOGIN = 7,
    }

    /** 登录方式 */
    enum SealType{
        /**  未封号 */
        NO_SEAL = 0,
        /**  禁止登录 */
        DISABLE_LOGIN = 1,
        /**  审核模式 */
        CHECK_MODE = 2,
        /**  禁止提现 */
        DISABLE_WITHDRAW = 3,
    }

    /** 绑定类型 */
    enum BindType{
        /**  微信 */
        WECHAT = 3,
    }

    enum Message {
        /** 绑定信息根据绑定类型为不同数据结构，无绑定类型时为空数组 */
        BindInfo = 'BindInfo',
        /** 登录数据，与平台 API http://192.168.8.242:8086/project/24/interface/api/41 相对应 */
        LoginData = 'LoginData',
        /** LoginAuthReq 认证请求 */
        LoginAuthReq = 'LoginAuthReq',
        /** LoginAuthRsp 认证应答 */
        LoginAuthRsp = 'LoginAuthRsp',
        /** AccountSysLoginRequestData 账号系统登录消息 */
        AccountSysLoginRequestData = 'AccountSysLoginRequestData',
        /** LoginModPassReq 修改登录密码请求 */
        LoginModPassReq = 'LoginModPassReq',
        /** LoginModPassRsp 修改登录密码应答 */
        LoginModPassRsp = 'LoginModPassRsp',
    }

    /** 绑定信息根据绑定类型为不同数据结构，无绑定类型时为空数组 */
    interface BindInfo{
        /** 微信appid */
        wc_appid? : string;
        /** openid */
        wc_openid? : string;
        /** 微信unionid */
        wc_unionid? : string;
    }

    /** 登录数据，与平台 API http://192.168.8.242:8086/project/24/interface/api/41 相对应 */
    interface LoginData{
        /** 登录方式 */
        type? : login.LoginType;
        /** 渠道 */
        channel? : number;
        /** 用户名根据登录方式： 1 游客：IMEI/Iphone生成唯一ID 2 手机账号：传手机号码 3 微信账号：传openid 5 google: id_token */
        username? : string;
        /** 1.游客注册传空字符串2.微信传空字符串, 3.手机登录短信验证码 */
        dymc_code? : string;
        /** 1.游客注册传空字符串 2.手机登录传密码 3.微信登录传code */
        password? : string;
        /** 省ID */
        pro_id? : number;
        /** 市ID */
        city_id? : number;
        /** 绑定信息 */
        bind_info? : BindInfo;
        /**  绑定方式 */
        bind_type? : login.BindType;
        /**  验证码发送场景 */
        send_case? : number;
        /**  广告 id */
        adid? : string;
        /** 产品ID */
        product_id? : number;
        /** 邀请人玩家playerID */
        invite_id? : number;
        /** 推广员ID */
        promoter_id? : string;
        /** 来源ID */
        from_id? : string;
        /** 场景ID */
        zone_id? : string;
        /** 微信昵称或者其他平台昵称 */
        nick_name? : string;
        /** 是否根据渠道生成新的账号 */
        isChannelAcct? : boolean;
    }

    /** LoginAuthReq 认证请求 */
    interface LoginAuthReq{
        /**  账号 ID */
        account_id? : number;
        /**  登录请求数据，服务器直接转发给账号平台服务 */
        request_data? : LoginData;
        /**  广告 id，邀请码 */
        adid? : string;
        /**  客户端版本号 */
        version? : string;
        /**  登录设备名 */
        device? : string;
        /**  登录设备 IMEI */
        imei? : string;
        /**  用于 player_id + token 登录 */
        player_id? : number;
        /**  用于 player_id + token 登录 */
        token? : string;
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
        /**  客户端时区 */
        time_zone? : string;
        /**  */
        gaid? : string;
        /**  h5大厅登录签发token，用于启动游戏时候的游戏内登录 */
        jwt_token? : string;
    }

    /** LoginAuthRsp 认证应答 */
    interface LoginAuthRsp{
        /**  错误码 */
        err_code? : login.ErrorCode;
        /**  游戏用户 ID  */
        player_id? : number;
        /**  重连时使用 token + player_id 登录 */
        token? : string;
        /**  封停原因 */
        seal_reason? : string;
        /**  封停结束时间 */
        seal_end_time? : number;
        /**  封停天数 */
        seal_days? : number;
        /**  首次登录,true 为首次登录 */
        first_login? : boolean;
        /**  微信open_id */
        open_id? : string;
        /**  账号 ID */
        account_id? : number;
        /**  错误描述 */
        err_msg? : string;
        /**  java http服务器回复，json格式。 */
        http_rsp? : string;
        /**  封号模式 */
        seal_mode? : login.SealType;
        /**  h5大厅接口权限认证和h5启动游戏使用 */
        jwt_token? : string;
    }

    /** AccountSysLoginRequestData 账号系统登录消息 */
    interface AccountSysLoginRequestData{
        /**  产品 ID */
        product_id? : number;
        /**  登录数据 */
        data? : Uint8Array;
    }

    /** LoginModPassReq 修改登录密码请求 */
    interface LoginModPassReq{
        /**  旧密码 */
        old_pass? : string;
        /**  新密码 */
        new_pass? : string;
    }

    /** LoginModPassRsp 修改登录密码应答 */
    interface LoginModPassRsp{
        /**  错误码 */
        err_code? : login.ErrorCode;
        /**  错误描述 */
        err_msg? : string;
    }

}
