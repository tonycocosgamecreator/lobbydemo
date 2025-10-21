declare namespace commonrummy{

    const PACKAGE_NAME = 'common';

    /** ProductID 产品 ID */
    enum ProductID{
        /** 印度rummy产品 */
        ProductID_RUMMY = 1,
        /** 网赚产品 */
        ProductID_NETMONEY = 2,
        /** 二元涨跌产品 */
        ProductID_BTC = 3,
        /** 共享充电宝产品 */
        ProductID_BATTERY = 4,
        /** slots产品 */
        ProductID_SLOTS = 5,
    }

    /** 玩家VIP等级: 0=普通，1=主播，2=网红，3=明星，4=奥斯卡，5=影帝，6=巨星。 */
    enum VIPLevel{
        /**  普通 */
        VIPMember = 0,
        /**  主播 */
        VIPAnchor = 1,
        /**  网红 */
        VIPIntenetRed = 2,
        /**  明星 */
        VIPStar = 3,
        /**  奥斯卡 */
        VIPOscar = 4,
        /**  影帝 */
        VIPStarKing = 5,
        /**  巨星 */
        VIPSuperStar = 6,
    }

    /** 银行卡种类 */
    enum BCKind{
        /**  银行卡 */
        CARD = 0,
        /**  UPI */
        UPI = 1,
        /**  印度移动支付 */
        IMPS = 2,
    }

    /** RummyGameId 游戏 ID */
    enum RummyGameId{
        /** 印度rummy游戏 */
        GAMEID_RUMMY = 3000,
        /** 印度tp游戏 */
        GAMEID_TP = 3001,
        /** 印度红蓝游戏 */
        GAMEID_RB = 3002,
        /** slots游戏 */
        GAMEID_SLOTS = 3003,
    }

    /** ErrCode 错误码 */
    enum RummyErrCode{
        /**  无错误 */
        EC_SUCCESS = 0,
        /**  失败 */
        EC_FAIL = 1,
        /**  服务器已停服 */
        EC_SERVER_STOP = 2,
        /**  非空闲状态 */
        EC_NOT_IDLE = 3,
        /**  非法操作 */
        EC_UNEXPECTED_OP = 4,
        /**  金币不足 */
        EC_COIN_NO_ENOUGH = 5,
        /**  用户不存在 */
        EC_USER_NO_EXIST = 6,
        /**  桌子不存在 */
        EC_DESK_NO_EXIST = 7,
        /**  DB错误 */
        EC_DB_ERROR = 8,
        /**  REDIS错误 */
        EC_REDIS_ERROR = 9,
        /**  达到上限 */
        EC_UP_LIMIT = 10,
        /**  没有权限 */
        EC_NO_PERMISSION = 11,
        /**  关闭主题 */
        EC_CLOSE_THEME = 12,
        /**  已经在游戏中了 */
        EC_MATCH_ALREADY_GAMEING = 257,
        /**  身份信息错误 */
        EC_INVALID_ID_CARD_OR_NAME = 288,
        /**  已认证 */
        EC_REAL_NAME_ALREADY = 289,
        /**  手机已存在 */
        EC_PHONE_EXIST = 304,
        /**  手机不存在 */
        EC_PHONE_NOT_EXIST = 305,
        /**  昵称不符合规范 */
        EC_NICKNAME_NON_STANDARD = 322,
        /**  昵称为空 */
        EC_NICKNAME_IS_NIL = 323,
        /** 已经使用了 */
        EC_USED = 514,
        /** 已经存在 */
        EC_ALREADY_EXIST = 515,
        /** 不在下注状态 */
        EC_DESK_NoT_ON_StartBetStage = 517,
        /** 小火箭cashout失败 */
        EC_DESK_CashOut_Timeout = 518,
    }

    /** RummyPlayerState 玩家状态 */
    enum RummyPlayerState{
        /**  空闲 */
        PS_IDLE = 1,
        /**  游戏中 */
        PS_GAMEING = 2,
        /**  匹配中 */
        PS_MATCHING = 3,
        /**  在牌桌上，但是未处于游戏中 (目前客户端不用关心此状态) */
        PS_DESK = 4,
        /**  正在参加锦标赛 */
        PS_TOURNAMENT = 5,
        /**  参加闯关赛中 */
        PS_CHASING = 6,
    }

    /** RummyClientType 终端类型 */
    enum RummyClientType{
        /**  web html5 */
        Rummy_CLIENT_TYPE_WEB = 1,
        /**  app */
        Rummy_CLIENT_TYPE_APP = 2,
    }

    /** RummyDeskType:桌子类型 */
    enum RummyDeskType{
        /**  NONE类型 */
        Rummy_DESK_TYPE_NONE = 0,
        /**  RUMMY底分类型 */
        Rummy_DESK_TYPE_POINT = 1,
        /**  RUMMY奖池类型 */
        Rummy_DESK_TYPE_POOL = 2,
        /**  RUMMY定局类型 */
        Rummy_DESK_TYPE_DEALS = 3,
        /**  TP类型 */
        Rummy_DESK_TYPE_TP = 4,
        /**  TP类型: 只使用10、J、Q、K、A来进行玩牌，去掉所有2~9 */
        Rummy_DESK_TYPE_TP5 = 5,
        /**  TP类型: 8.0、固定发2张暗牌和1张癞子牌（大王） */
        Rummy_DESK_TYPE_TP6 = 6,
        /**  TP类型: 3.0、AK47作为癞子牌，癞子牌可以变化为任意牌型 */
        Rummy_DESK_TYPE_TP7 = 7,
        /**  RUMMY 10张牌类型 */
        Rummy_DESK_TYPE_Card10 = 21,
    }

    /** RummyPlayMode:玩法模式 */
    enum RummyPlayMode{
        /**  真金模式，消耗金币和绑金 */
        Rummy_PLAY_MODE_CASH = 1,
        /**  练习模式, 无消耗 */
        Rummy_PLAY_MODE_PRACTICE = 2,
        /**  免费模式，消耗筹码 */
        Rummy_PLAY_MODE_FREE = 3,
    }

    /** RummyMoneyType 操作牌类型 */
    enum RummyMoneyType{
        /**  金币 */
        Rummy_OPR_TYPE_COIN = 1,
        /**  绑定金币 */
        Rummy_OPR_TYPE_BIND_COIN = 2,
        /**  礼券或房卡，bonus */
        Rummy_OPR_TYPE_GIFT_CARD = 3,
        /**  筹码或钻石 */
        Rummy_OPR_TYPE_TONE = 6,
    }

    /** RummySmsTempl 短信模板类型 */
    enum RummySmsTempl{
        /**  普通验证码模板 */
        Rummy_SMS_VERIFY = 0,
        /**  KYC模板 */
        Rummy_SMS_KYC = 1,
        /**  注册模板 */
        Rummy_SMS_REGSITER = 2,
        /**  找回密码模板 */
        Rummy_SMS_RESET_PASS = 3,
    }

    /** RummySmsTempl 短信模板类型 */
    enum BoleGameId{
        /**  WinGoLottery */
        Bct_WinGoLottery = 1001,
        /**  5D */
        Bct_FiveD = 1002,
        /** mines */
        Games_Mines = 2001,
    }

    enum Message {
        /** Result 通用处理结果 */
        RummyResult = 'RummyResult',
    }

    /** Result 通用处理结果 */
    interface RummyResult{
        /**  错误码 */
        err_code? : commonrummy.RummyErrCode;
        /**  错误描述 */
        err_desc? : string;
        /**  图片地址 */
        pic_url? : string;
    }

}
