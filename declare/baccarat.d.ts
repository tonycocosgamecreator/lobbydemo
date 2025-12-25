declare namespace baccarat{

    const PACKAGE_NAME = 'baccarat';

    /** ID */
    enum BaccaratID{
        /**  水果 */
        Bct_Fruit = 100,
        /**  龙虎 */
        Bct_LongHu = 101,
        /**  红黑 */
        Bct_HongHei = 102,
        /**  WinGoLottery */
        Bct_WinGoLottery = 1001,
        /**  5D */
        Bct_FiveD = 1002,
        /**  小火箭 */
        Bct_Rocket = 1003,
        /**  3d小火箭 */
        Bct_Rocket3D = 1004,
        /**  龙虎 */
        Bct_LongHu2024 = 1005,
        /**  股票 */
        Bct_Stock = 1006,
        /** wingo2 */
        Bac_WinGO2 = 1012,
    }

    /** 阶段 */
    enum DeskStage{
        /** ReadyStage 准备阶段 */
        ReadyStage = 0,
        /** StartBetStage 开始下注阶段 */
        StartBetStage = 1,
        /** EndBetStage 结束下注阶段 */
        EndBetStage = 2,
        /** OpenStage 开奖阶段 */
        OpenStage = 3,
        /** SettleStage 结算阶段 */
        SettleStage = 4,
    }

    /** OpenAward 开奖类型 */
    enum OpenAward{
        /** 普通开奖 */
        OpenNormal = 0,
        /** Good Luck 开奖 */
        OpenGoodLuck = 1,
        /** 大三仙 */
        OpenDaSanXian = 2,
        /** 小三仙 */
        OpenXiaoSanXian = 3,
        /** 小四喜 */
        OpenXiaoSiXi = 4,
        /** 天女散花 */
        OpenTianNvSanHua = 5,
        /** 双子星 */
        OpenShuangZiXing = 6,
        /** 开火车 */
        OpenKaiHuoChe = 7,
        /** 大满罐 */
        OpenDaManGuan = 8,
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    enum WinGoLotteryBetZone{
        /**  */
        Type0 = 0,
        /**  */
        Type1 = 1,
        /**  */
        Type2 = 2,
        /**  */
        Type3 = 3,
        /**  */
        Type4 = 4,
        /**  */
        Type5 = 5,
        /**  */
        Type6 = 6,
        /**  */
        Type7 = 7,
        /**  */
        Type8 = 8,
        /**  */
        Type9 = 9,
        /**  */
        TypeGreen = 10,
        /**  */
        TypeViolet = 11,
        /**  */
        TypeRed = 12,
        /**  */
        TypeBig = 13,
        /**  */
        TypeSmall = 14,
    }

    /** 开奖类型ID:  1=龙， 2=胡， 3=和 */
    enum LHOpenAward{
        /** 龙 */
        LHOpenLong = 1,
        /** 虎 */
        LHOpenHu = 2,
        /** 和 */
        LHOpenHe = 3,
    }

    /** 开奖类型ID:  1=红， 2=黑， 3=红+牌型， 4=黑+牌型 */
    enum RBOpenAward{
        /** 红 */
        HHOpenRed = 1,
        /** 黑 */
        HHOpenBlack = 2,
        /** 红+牌型 */
        HHOpenRedType = 3,
        /** 黑+牌型 */
        HHOpenBlackType = 4,
    }

    /** RBCardType 红黑牌型 */
    enum RBCardType{
        /**   单张 */
        SCORE_SINGLE = 1,
        /**   对子 */
        SCORE_DUI_ZI = 2,
        /**   顺子 */
        SCORE_SHUN_ZI = 3,
        /**   同花 */
        SCORE_YI_SE = 4,
        /**   顺金 */
        SCORE_SHUN_JIN = 5,
        /**   炸弹 */
        SCORE_SAN_ZHANG = 6,
    }

    /** 开奖类型ID:  1=红， 2=黑， 3=皇冠 */
    enum DBOpenAward{
        /** 红 */
        DBOpenRed = 1,
        /** 黑 */
        DBOpenBlack = 2,
        /** 皇冠 */
        DBOpenKing = 3,
    }

    enum Message {
        /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
        BetData = 'BetData',
        /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
        AbCard = 'AbCard',
        /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
        OpenRecord = 'OpenRecord',
        /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
        MsgDealCardNft = 'MsgDealCardNft',
        /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
        MyData = 'MyData',
        /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
        EncryptText = 'EncryptText',
        /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
        AbOdd = 'AbOdd',
        /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
        DeskInfo = 'DeskInfo',
        /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
        FiveDInfo = 'FiveDInfo',
        /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
        FiveDOdds = 'FiveDOdds',
        /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
        WinGoInfo = 'WinGoInfo',
        /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
        WinGoOpenInfo = 'WinGoOpenInfo',
        /** WinGoOdds WinGo下注区域赔率 */
        WinGoOdds = 'WinGoOdds',
        /** RocketDInfo 小火箭配置信息 */
        RocketDInfo = 'RocketDInfo',
        /** Rocket3DInfo 3d小火箭配置信息 */
        Rocket3DInfo = 'Rocket3DInfo',
        /** Rocket3DInfo 3d小火箭配置信息 */
        LongHuInfo = 'LongHuInfo',
        /** Rocket3DInfo 3d小火箭配置信息 */
        LongHuOpenInfo = 'LongHuOpenInfo',
        /** Rocket3DInfo 3d小火箭配置信息 */
        SevenUpDownInfo = 'SevenUpDownInfo',
        /** Rocket3DInfo 3d小火箭配置信息 */
        SevenUpDownOpenInfo = 'SevenUpDownOpenInfo',
        /** 股票信息 */
        StockInfo = 'StockInfo',
        /** 股票信息 */
        PlayerInfo = 'PlayerInfo',
        /** CashOutPlayer 下车玩家 */
        CashOutPlayer = 'CashOutPlayer',
        /** EnterBaccaratReq 进入百人场请求 */
        MsgEnterBaccaratReq = 'MsgEnterBaccaratReq',
        /** EnterBaccaratReq 进入百人场请求 */
        BetInfo = 'BetInfo',
        /** EnterBaccaratReq 进入百人场请求 */
        WalletInfo = 'WalletInfo',
        /** EnterBaccaratRsp 进入百人场请求响应 */
        MsgEnterBaccaratRsp = 'MsgEnterBaccaratRsp',
        /** LeaveBaccaratReq 离开百人场请求 */
        MsgLeaveBaccaratReq = 'MsgLeaveBaccaratReq',
        /** LeaveBaccaratRsp 离开百人场请求响应 */
        MsgLeaveBaccaratRsp = 'MsgLeaveBaccaratRsp',
        /** BetBaccaratReq 百人场下注请求 */
        MsgBetBaccaratReq = 'MsgBetBaccaratReq',
        /** BetBaccaratRsp 百人场下注请求响应 */
        MsgBetBaccaratRsp = 'MsgBetBaccaratRsp',
        /** BetBaccaratCancelReq 百人场下注取消请求 */
        MsgBetBaccaratCancelReq = 'MsgBetBaccaratCancelReq',
        /** BetBaccaratCancelRsp 百人场下注取消请求响应 */
        MsgBetBaccaratCancelRsp = 'MsgBetBaccaratCancelRsp',
        /** GetBaccaratPlayerListReq 获取百人场玩家请求 */
        MsgGetBaccaratPlayerListReq = 'MsgGetBaccaratPlayerListReq',
        /** GetBaccaratPlayerListRsp 获取百人场玩家请求响应 */
        MsgGetBaccaratPlayerListRsp = 'MsgGetBaccaratPlayerListRsp',
        /** PauseBaccaratReq 暂停百人场请求 */
        MsgPauseBaccaratReq = 'MsgPauseBaccaratReq',
        /** PauseBaccaratRsp 暂停百人场请求响应 */
        MsgPauseBaccaratRsp = 'MsgPauseBaccaratRsp',
        /** BetPlayer 百人场下注请求 */
        BetPlayer = 'BetPlayer',
        /** BetBaccaratNtf 最新玩家下注通知消息 */
        MsgBetBaccaratNtf = 'MsgBetBaccaratNtf',
        /** BaccaratNextStageNtf 阶段变化通知消息 */
        MsgBaccaratNextStageNtf = 'MsgBaccaratNextStageNtf',
        /** WinPlayer 赢奖玩家 */
        WinPlayer = 'WinPlayer',
        /** MyWinData 我的赢奖数据 */
        MyWinData = 'MyWinData',
        /** OpenData 开奖数据 */
        OpenData = 'OpenData',
        /** BaccaratSettleNtf 结算通知消息 */
        MsgBaccaratSettleNtf = 'MsgBaccaratSettleNtf',
        /** BaccaratOnlineNtf 在线人数变化通知消息 */
        MsgBaccaratOnlineNtf = 'MsgBaccaratOnlineNtf',
        /** BaccaratAreaUserBetsNtf 每个区域用户下注累计值 */
        MsgBaccaratAreaUserBetsNtf = 'MsgBaccaratAreaUserBetsNtf',
        /** BaccaratAreaUserBetsNtf 每个区域用户下注累计值 */
        AreaUserBetsNum = 'AreaUserBetsNum',
        /** MyWinDataShort 我的赢奖数据 */
        MyWinDataShort = 'MyWinDataShort',
        /** BaccaratKickOutNtf 长时间未下注踢出通知消息 */
        MsgBaccaratKickOutNtf = 'MsgBaccaratKickOutNtf',
        /** BaccaratLongHuSettleNtf LH结算通知消息 */
        MsgBaccaratLongHuSettleNtf = 'MsgBaccaratLongHuSettleNtf',
        /** BaccaratRedBlackSettleNtf HH结算通知消息 */
        MsgBaccaratRedBlackSettleNtf = 'MsgBaccaratRedBlackSettleNtf',
        /** RocketCashOutReq 小飞机下车请求 */
        MsgRocketCashOutReq = 'MsgRocketCashOutReq',
        /** RocketCashOutRsp 小火箭下车请求响应 */
        MsgRocketCashOutRsp = 'MsgRocketCashOutRsp',
        /** RocketSettleNtf 小飞机爆炸结算通知消息 */
        MsgRocketSettleNtf = 'MsgRocketSettleNtf',
        /** RocketFlyNtf 小火箭 起飞通知消息 */
        MsgRocketFlyNtf = 'MsgRocketFlyNtf',
        /** RocketCashOutNtf 小火箭下车通知消息 */
        MsgRocketCashOutNtf = 'MsgRocketCashOutNtf',
        /** 小火箭进度通知 */
        MsgRocketRateNtf = 'MsgRocketRateNtf',
        /** 玩家取消自动下车请求 */
        MsgRocketAutoCashOutReq = 'MsgRocketAutoCashOutReq',
        /** 玩家取消自动下车请求返回 */
        MsgRocketAutoCashOutRsp = 'MsgRocketAutoCashOutRsp',
        /** 小火箭下注记录列表请求 */
        MsgRocketPlayerHistoryReq = 'MsgRocketPlayerHistoryReq',
        /** 小火箭下注记录列表返回 */
        MsgRocketPlayerHistoryRsp = 'MsgRocketPlayerHistoryRsp',
        /** 小火箭下注记录列表返回 */
        RocketData = 'RocketData',
        /** 小火箭下注记录列表返回 */
        RocketPlayerHistory = 'RocketPlayerHistory',
        /** 小火箭验证消息请求 */
        MsgRocketEncryptedDataReq = 'MsgRocketEncryptedDataReq',
        /** 小火箭验证消息返回 */
        MsgRocketEncryptedDataRsp = 'MsgRocketEncryptedDataRsp',
        /** 小火箭对局历史列表请求 */
        MsgRocketDeskHistoryReq = 'MsgRocketDeskHistoryReq',
        /** 小火箭对局历史列表请求 */
        RocketDeskRate = 'RocketDeskRate',
        /** 小火箭对局历史列表返回 */
        MsgRocketDeskHistoryRsp = 'MsgRocketDeskHistoryRsp',
        /** //////////////////////////// winGoLottery私有协议  ///////////////////// */
        MsgLotteryPlayerHistoryReq = 'MsgLotteryPlayerHistoryReq',
        /** 玩家下注信息 */
        MsgLotteryPlayerHistoryRsp = 'MsgLotteryPlayerHistoryRsp',
        /** 玩家下注信息 */
        LotteryPlayerHistory = 'LotteryPlayerHistory',
        /** 玩家下注信息 */
        MsgLotteryEncryptedDataReq = 'MsgLotteryEncryptedDataReq',
        /** 玩家下注信息 */
        MsgLotteryEncryptedDataRsp = 'MsgLotteryEncryptedDataRsp',
        /** LotterySettleNtf 结算通知消息 */
        MsgLotterySettleNtf = 'MsgLotterySettleNtf',
        /** SelfWinData 我的赢奖数据 */
        SelfWinData = 'SelfWinData',
        /** LotteryOpenData 开奖数据 */
        LotteryOpenData = 'LotteryOpenData',
        /** //////////////////////////// 5d   ///////////////////// */
        MsgLotteryHistoryReq = 'MsgLotteryHistoryReq',
        /** //////////////////////////// 5d   ///////////////////// */
        MsgLotteryHistoryRsp = 'MsgLotteryHistoryRsp',
        /** //////////////////////////// 5d   ///////////////////// */
        LotteryHistory = 'LotteryHistory',
        /** //////////////////////////// 5d   ///////////////////// */
        MsgEncryptedDataReq = 'MsgEncryptedDataReq',
        /** //////////////////////////// 5d   ///////////////////// */
        MsgEncryptedDataRsp = 'MsgEncryptedDataRsp',
        /** //////////////////////////// 5d   ///////////////////// */
        MsgPlayerHistoryReq = 'MsgPlayerHistoryReq',
        /** 玩家下注信息 */
        MsgPlayerHistoryRsp = 'MsgPlayerHistoryRsp',
        /** 玩家下注信息 */
        PlayerHistory = 'PlayerHistory',
        /** Rocket3DCashOutReq 小飞机下车请求 */
        MsgRocket3DCashOutReq = 'MsgRocket3DCashOutReq',
        /** Rocket3DCashOutRsp 小火箭下车请求响应 */
        MsgRocket3DCashOutRsp = 'MsgRocket3DCashOutRsp',
        /** Rocket3DSettleNtf 小飞机爆炸结算通知消息 */
        MsgRocket3DSettleNtf = 'MsgRocket3DSettleNtf',
        /** Rocket3DFlyNtf 小火箭 起飞通知消息 */
        MsgRocket3DFlyNtf = 'MsgRocket3DFlyNtf',
        /** Rocket3DCashOutNtf 小火箭下车通知消息 */
        MsgRocket3DCashOutNtf = 'MsgRocket3DCashOutNtf',
        /** 小火箭进度通知 */
        MsgRocket3DRateNtf = 'MsgRocket3DRateNtf',
        /** 玩家取消自动下车请求 */
        MsgRocket3DAutoCashOutReq = 'MsgRocket3DAutoCashOutReq',
        /** 玩家取消自动下车请求返回 */
        MsgRocket3DAutoCashOutRsp = 'MsgRocket3DAutoCashOutRsp',
        /** 小火箭下注记录列表请求 */
        MsgRocket3DPlayerHistoryReq = 'MsgRocket3DPlayerHistoryReq',
        /** 小火箭下注记录列表返回 */
        MsgRocket3DPlayerHistoryRsp = 'MsgRocket3DPlayerHistoryRsp',
        /** 小火箭下注记录列表返回 */
        MsgRocket3DData = 'MsgRocket3DData',
        /** 小火箭下注记录列表返回 */
        MsgRocket3DPlayerHistory = 'MsgRocket3DPlayerHistory',
        /** 小火箭验证消息请求 */
        MsgRocket3DEncryptedDataReq = 'MsgRocket3DEncryptedDataReq',
        /** 小火箭验证消息返回 */
        MsgRocket3DEncryptedDataRsp = 'MsgRocket3DEncryptedDataRsp',
        /** 小火箭对局历史列表请求 */
        MsgRocket3DDeskHistoryReq = 'MsgRocket3DDeskHistoryReq',
        /** 小火箭对局历史列表请求 */
        MsgRocket3DDeskRate = 'MsgRocket3DDeskRate',
        /** 小火箭对局历史列表返回 */
        MsgRocket3DDeskHistoryRsp = 'MsgRocket3DDeskHistoryRsp',
        /** 小火箭对局历史列表返回 */
        MsgRocket3DPlayer = 'MsgRocket3DPlayer',
        /** 小火箭本局下注玩家列表查看请求 */
        MsgRocket3DDeskBetsHistoryReq = 'MsgRocket3DDeskBetsHistoryReq',
        /** 小火箭本局下注玩家列表查看请求 */
        MsgRocket3DDeskBetsHistoryRsp = 'MsgRocket3DDeskBetsHistoryRsp',
        /** LongHuSettleNtf 结算通知消息 */
        MsgLongHuSettleNtf = 'MsgLongHuSettleNtf',
        /** SelfWinData 我的赢奖数据 */
        MsgLongHuWinData = 'MsgLongHuWinData',
        /** LongHuShuffleCardsNtf 洗牌消息 */
        MsgLongHuShuffleCardsNtf = 'MsgLongHuShuffleCardsNtf',
        /** LotteryOpenData 开奖数据 */
        MsgLongHuOpenData = 'MsgLongHuOpenData',
        /** } */
        MsgLongHuPlayerHistoryReq = 'MsgLongHuPlayerHistoryReq',
        /** 玩家下注信息 */
        MsgLongHuPlayerHistoryRsp = 'MsgLongHuPlayerHistoryRsp',
        /** 玩家下注信息 */
        MsgLongHuPlayerHistory = 'MsgLongHuPlayerHistory',
        /** 玩家下注信息 */
        MsgStockPlayerHistoryReq = 'MsgStockPlayerHistoryReq',
        /** 玩家下注信息 */
        MsgStockPlayerHistoryRsp = 'MsgStockPlayerHistoryRsp',
        /** 玩家下注信息 */
        MsgStockPlayerHistory = 'MsgStockPlayerHistory',
        /** 公平性验证 */
        MsgStockEncryptedDataReq = 'MsgStockEncryptedDataReq',
        /** 公平性验证 */
        MsgStockEncryptedDataRsp = 'MsgStockEncryptedDataRsp',
        /** StockSettleNtf 结算通知消息 */
        MsgStockSettleNtf = 'MsgStockSettleNtf',
        /** StockSettleData 结算数据 */
        MsgStockSettleData = 'MsgStockSettleData',
        /** StockWinData 胜利者数据 */
        MsgStockWinData = 'MsgStockWinData',
        /** 股票历史列表请求 */
        MsgStockDeskHistoryReq = 'MsgStockDeskHistoryReq',
        /** 股票历史列表请求 */
        MsgStockDeskHistory = 'MsgStockDeskHistory',
        /** 股票历史列表请求 */
        MsgStockDeskHistoryRsp = 'MsgStockDeskHistoryRsp',
        /** SevenUpDownSettleNtf 结算通知消息 */
        MsgSevenUpDownSettleNtf = 'MsgSevenUpDownSettleNtf',
        /** SelfWinData 我的赢奖数据 */
        MsgSevenUpDownWinData = 'MsgSevenUpDownWinData',
        /** LotteryOpenData 开奖数据 */
        MsgSevenUpDownOpenData = 'MsgSevenUpDownOpenData',
        /** LotteryOpenData 开奖数据 */
        MsgSevenUpDownPlayerHistoryReq = 'MsgSevenUpDownPlayerHistoryReq',
        /** 玩家下注信息 */
        MsgSevenUpDownPlayerHistoryRsp = 'MsgSevenUpDownPlayerHistoryRsp',
        /** 玩家下注信息 */
        MsgSevenUpDownPlayerHistory = 'MsgSevenUpDownPlayerHistory',
        /** 玩家下注信息 */
        MsgAndarBaharSettleNtf = 'MsgAndarBaharSettleNtf',
        /** 玩家下注信息 */
        AndarBaharHistory = 'AndarBaharHistory',
        /** 玩家下注信息 */
        MsgAndarBaharPlayerHistoryReq = 'MsgAndarBaharPlayerHistoryReq',
        /** 玩家下注信息 */
        MsgAndarBaharPlayerHistoryRsp = 'MsgAndarBaharPlayerHistoryRsp',
        /** 玩家获胜通知(跑马灯形式展示) */
        MsgLastWinNtf = 'MsgLastWinNtf',
        /** 前三名数据 */
        MsgPlayerRankNtf = 'MsgPlayerRankNtf',
        /** 前三名数据 */
        RankInfo = 'RankInfo',
        /** 前三名数据 */
        RankList = 'RankList',
        /** 请求排行榜 */
        MsgGetRankReq = 'MsgGetRankReq',
        /** 请求排行榜回复 */
        MsgGetRankRsp = 'MsgGetRankRsp',
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    interface BetData{
        /**  下注元素ID */
        bet_id? : number;
        /**  下注金额 */
        bet_coin? : string;
        /** 是否是自动cashOut */
        autoCashOut? : boolean;
        /** 自动cashOutRate */
        out_rate? : string;
        /** 已经结算 */
        is_settle? : boolean;
        /** 结算的rate */
        settle_out_rate? : string;
        /** 是否是rebet */
        is_rebet? : boolean;
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    interface AbCard{
        /**  牌ID */
        data? : number;
        /**  明文文本 */
        data_string? : string;
        /**  加密文本 */
        encrypt_text? : string;
        /**  随机种子 */
        seed? : string;
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    interface OpenRecord{
        /**  中间牌 */
        card? : AbCard;
        /**  所有牌 */
        card_all : AbCard[];
        /**  左边牌列表 */
        card_left : AbCard[];
        /**  右边牌列表 */
        card_right : AbCard[];
        /**  开奖位置ID */
        pos? : number;
        /**  开奖的位置（1 = 左边，3 = 右边） */
        last_pos? : number;
        /**  前三张牌 */
        card_three : AbCard[];
        /**  牌型ID (2 = 同花，3 = 顺子，4 = 同花顺，其他不需要) */
        card_type? : number;
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    interface MsgDealCardNft{
        /**  开奖位置ID */
        pos? : number;
        /**  开奖牌 */
        card? : AbCard;
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    interface MyData{
        /**  上次底注金额 */
        prev_bet? : string;
        /**  下注列表 */
        bets : BetData[];
        /**  当前桌子上赢金币总数 */
        win_coin? : string;
        /**  玩家最新金币余额 */
        new_coin? : string;
        /**  玩家当局赢的倍数 */
        win_rate? : string;
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    interface EncryptText{
        /**  */
        data? : number;
        /**  明文文本 */
        data_string? : string;
        /**  加密文本 */
        encrypt_text? : string;
        /**  随机种子 */
        seed? : string;
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    interface AbOdd{
        /**  下注元素ID */
        bet_id? : number;
        /**  下注金额 */
        bet_coin? : string;
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    interface DeskInfo{
        /**  桌子ID */
        desk_id? : number;
        /**  桌子阶段 */
        stage? : baccarat.DeskStage;
        /**  此阶段结束时间戳,这里是毫秒时间戳 */
        end_time? : number;
        /**  */
        bets : { [key : string] : BetInfo};
        /**  桌子人数 */
        online_sum? : number;
        /**  所有人的下注金额列表 */
        all_bets : BetData[];
        /**  最近20次的开奖记录 */
        records : OpenRecord[];
        /**  此阶段剩余秒数 */
        have_sec? : number;
        /**  最少下注金币金币余额 */
        bet_min? : string;
        /**  最大下注金币金币余额 */
        bet_max? : string;
        /**  jackpot金额 */
        jacket_coin? : string;
        /**  开奖开始时间unix时间戳，用于小火箭 */
        open_time? : number;
        /**  参数: 1.小火箭2个参数 */
        desk_param : string[];
        /**  序列 */
        seq? : string;
        /** 当前期号 */
        period_id? : string;
        /** wingo下注区域赔率 */
        wingo_info? : WinGoInfo;
        /** 玩家下注信息 */
        bet_player : BetPlayer[];
        /** 5d下注区域赔率 */
        five_d_info? : FiveDInfo;
        /** 小火箭下注配置信息 */
        rocket_d_info? : RocketDInfo;
        /** 3d小火箭下注配置信息 */
        rocket_3d_info? : Rocket3DInfo;
        /** 龙虎下注配置信息 */
        longhu_info? : LongHuInfo;
        /** 股票数据信息 */
        stock_info? : StockInfo;
        /**  区域下注人数 */
        area_bet_num : AreaUserBetsNum[];
        /** 7updown配置信息 */
        seven_up_down_info? : SevenUpDownInfo;
        /**  加密文本列表 */
        encrypt_text : EncryptText[];
        /**  赔率列表 */
        odds : AbOdd[];
        /**  当前回合已经打开的牌的记录 */
        open_cards? : OpenRecord;
        /**  当前阶段总时间 */
        stage_total_time? : number;
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    interface FiveDInfo{
        /**  */
        five_odds? : FiveDOdds;
        /**  */
        sum_odds? : FiveDOdds;
        /**  停止下注秒数 */
        end_sec? : number;
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    interface FiveDOdds{
        /** 数字区域 */
        number? : string;
        /** 小 */
        small? : string;
        /** 大 */
        big? : string;
        /** 奇数 */
        odd? : string;
        /** 偶数 */
        even? : string;
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    interface WinGoInfo{
        /** wingo下注区域赔率 */
        wingo_odds? : WinGoOdds;
        /**  停止下注秒数 */
        end_sec? : number;
        /** 开奖结果 */
        wingo_open_info : WinGoOpenInfo[];
        /** 回合秒数 */
        cycle_time? : number;
    }

    /** 选择区域  0-9 为选择号码   10:绿色  11:紫色   12：红色 13 大 14 小 */
    interface WinGoOpenInfo{
        /**  */
        period? : string;
        /**  */
        pos? : number;
    }

    /** WinGoOdds WinGo下注区域赔率 */
    interface WinGoOdds{
        /** 绿色区域 */
        green? : string;
        /** 紫色 */
        violet? : string;
        /** 红色 */
        red? : string;
        /** 单个 */
        common? : string;
        /** 特殊 */
        special? : string;
        /** 大 */
        big? : string;
        /**  小 */
        small? : string;
    }

    /** RocketDInfo 小火箭配置信息 */
    interface RocketDInfo{
        /** [0,9] 加减注切换 */
        betLevelQuota : string[];
        /** 快速选择下注配置 */
        fastBetQuota : string[];
        /** 配置时间 */
        cfg_time? : number;
        /** 停止下注秒数 */
        end_sec? : number;
        /** 计算参数 */
        args : string[];
        /** 当前玩家下注信息,如果有的话 */
        userBetInfos : BetData[];
        /** 当前期号 */
        period_id? : string;
    }

    /** Rocket3DInfo 3d小火箭配置信息 */
    interface Rocket3DInfo{
        /** [0,9] 加减注切换 */
        betLevelQuota : string[];
        /** 快速选择下注配置 */
        fastBetQuota : string[];
        /** 配置时间（下注时间） */
        cfg_time? : number;
        /** 停止下注秒数 */
        end_sec? : number;
        /** 计算参数 */
        args : string[];
        /** 当前玩家下注信息,如果有的话 */
        userBetInfos : BetData[];
        /** 当前期号 */
        period_id? : string;
        /** 最大倍率（配置） */
        cfg_max_rate? : number;
    }

    /** Rocket3DInfo 3d小火箭配置信息 */
    interface LongHuInfo{
        /** 龙虎下注区域赔率(0龙 1虎 2合 3纯合) */
        longhu_odds : string[];
        /**  停止下注秒数 */
        end_sec? : number;
        /** 开奖结果 */
        longhu_open_info : LongHuOpenInfo[];
        /** 回合秒数 */
        cycle_time? : number;
        /** 开奖结果列表 */
        win_type_list : number[];
    }

    /** Rocket3DInfo 3d小火箭配置信息 */
    interface LongHuOpenInfo{
        /**  */
        period? : string;
        /**  */
        pos? : number;
    }

    /** Rocket3DInfo 3d小火箭配置信息 */
    interface SevenUpDownInfo{
        /** 下注区域赔率 */
        odds : string[];
        /**  停止下注秒数 */
        end_sec? : number;
        /** 开奖结果 */
        open_info : SevenUpDownOpenInfo[];
        /** 回合秒数 */
        cycle_time? : number;
        /** 开奖结果列表 */
        win_type_list : number[];
    }

    /** Rocket3DInfo 3d小火箭配置信息 */
    interface SevenUpDownOpenInfo{
        /**  */
        period? : string;
        /**  */
        win_type? : number;
    }

    /** 股票信息 */
    interface StockInfo{
        /** 基础值 */
        base? : number;
        /** 涨跌值列表 */
        points : number[];
        /** 当前期号 */
        period_id? : string;
        /** 配置时间（下注时间） */
        cfg_bet_time? : number;
    }

    /** 股票信息 */
    interface PlayerInfo{
        /**  玩家ID */
        player_id? : number;
        /**  昵称 */
        name? : string;
        /**  头像 */
        icon? : string;
        /**  金币 */
        coin? : string;
        /**  赢金币数 */
        win_coin? : string;
        /**  胜局数 */
        win_count? : number;
        /**  押注金额 */
        bet_coin? : string;
    }

    /** CashOutPlayer 下车玩家 */
    interface CashOutPlayer{
        /**  昵称 */
        name? : string;
        /**  玩家ID */
        player_id? : number;
        /**  头像 */
        icon? : string;
        /**  下车倍数 */
        out_rate? : string;
        /**  赢金币 */
        win_coin? : string;
        /**  是否机器人 */
        is_robot? : boolean;
        /**  下注id */
        bet_id? : number;
    }

    /** EnterBaccaratReq 进入百人场请求 */
    interface MsgEnterBaccaratReq{
        /**  主题ID */
        theme_id? : number;
        /**  是否是换桌 */
        change? : boolean;
        /**  桌子类型 */
        desk_type? : number;
    }

    /** EnterBaccaratReq 进入百人场请求 */
    interface BetInfo{
        /** 币种 */
        currency : string;
        /** 底注列表 */
        bet_size : number[];
        /** 倍数列表 */
        multiple : number[];
        /** 底注倍数列表 */
        bet_index_rule : number[];
        /** 最小下注 */
        min_bet? : number;
        /** 最大下注 */
        max_bet? : number;
        /** 快速下注列表 */
        fast_bet_size : number[];
        /** 默认显示选中底注 */
        default_index : number;
    }

    /** EnterBaccaratReq 进入百人场请求 */
    interface WalletInfo{
        /** 币种 */
        currency : string;
        /** 余额 */
        balance : number;
    }

    /** EnterBaccaratRsp 进入百人场请求响应 */
    interface MsgEnterBaccaratRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  桌子信息 */
        info? : DeskInfo;
        /**  我的信息 */
        my? : MyData;
        /**  左边的排行榜 */
        left_rank : PlayerInfo[];
        /**  右边的排行榜 */
        right_rank : PlayerInfo[];
        /**  是否可以下注 */
        can_spin? : boolean;
        /**  下车列表 */
        out_list : CashOutPlayer[];
        /**  最小充值金额 */
        pay_min? : number;
        /**  钱包列表 */
        wallets : WalletInfo[];
        /**  玩家ID */
        player_id? : number;
    }

    /** LeaveBaccaratReq 离开百人场请求 */
    interface MsgLeaveBaccaratReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
    }

    /** LeaveBaccaratRsp 离开百人场请求响应 */
    interface MsgLeaveBaccaratRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
    }

    /** BetBaccaratReq 百人场下注请求 */
    interface MsgBetBaccaratReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  上次底注金额 */
        prev_bet? : string;
        /**  下注列表 */
        bets : BetData[];
    }

    /** BetBaccaratRsp 百人场下注请求响应 */
    interface MsgBetBaccaratRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  扣除金币 */
        cost_coin? : string;
        /**  我的最新金币余额 */
        new_coin? : string;
        /**  下注列表 */
        bets : BetData[];
    }

    /** BetBaccaratCancelReq 百人场下注取消请求 */
    interface MsgBetBaccaratCancelReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 取消下注的ID */
        bet_id? : number;
    }

    /** BetBaccaratCancelRsp 百人场下注取消请求响应 */
    interface MsgBetBaccaratCancelRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 取消下注的ID */
        bet_id? : number;
        /**  我的最新金币余额 */
        new_coin? : string;
    }

    /** GetBaccaratPlayerListReq 获取百人场玩家请求 */
    interface MsgGetBaccaratPlayerListReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
    }

    /** GetBaccaratPlayerListRsp 获取百人场玩家请求响应 */
    interface MsgGetBaccaratPlayerListRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  玩家列表 */
        players : PlayerInfo[];
    }

    /** PauseBaccaratReq 暂停百人场请求 */
    interface MsgPauseBaccaratReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
    }

    /** PauseBaccaratRsp 暂停百人场请求响应 */
    interface MsgPauseBaccaratRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
    }

    /** BetPlayer 百人场下注请求 */
    interface BetPlayer{
        /**  昵称 */
        name? : string;
        /**  下注列表 */
        bets : BetData[];
        /**  玩家ID */
        player_id? : number;
        /**  头像 */
        icon? : string;
        /**  玩家信息 */
        player_info? : string;
        /**  lottery 期数 */
        period? : string;
        /**  是否机器人 */
        is_robot? : boolean;
    }

    /** BetBaccaratNtf 最新玩家下注通知消息 */
    interface MsgBetBaccaratNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  最新的下注玩家信息 */
        players : BetPlayer[];
    }

    /** BaccaratNextStageNtf 阶段变化通知消息 */
    interface MsgBaccaratNextStageNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  桌子阶段 */
        stage? : baccarat.DeskStage;
        /**  此阶段结束时间戳 */
        end_time? : number;
        /**  此阶段剩余秒数 */
        have_sec? : number;
        /** 当前期号 */
        period_id? : string;
        /** 股票点位（开奖和结算阶段会发） */
        stock_info? : StockInfo;
    }

    /** WinPlayer 赢奖玩家 */
    interface WinPlayer{
        /**  玩家ID */
        player_id? : number;
        /**  昵称 */
        name? : string;
        /**  头像 */
        icon? : string;
        /**  赢金币数 */
        win_coin? : string;
        /**  下注金币数 */
        bet_coin? : string;
    }

    /** MyWinData 我的赢奖数据 */
    interface MyWinData{
        /**  我赢的金币数 */
        win_coin? : string;
        /**  我的开奖数据 */
        open_elem : OpenData[];
        /**  我的最新金币余额 */
        new_coin? : string;
    }

    /** OpenData 开奖数据 */
    interface OpenData{
        /**  位置ID */
        pos_id? : number;
        /**  赢倍数 */
        win_times? : string;
        /**  赢金币数 */
        win_coin? : string;
    }

    /** BaccaratSettleNtf 结算通知消息 */
    interface MsgBaccaratSettleNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  开奖类型 */
        open_type? : baccarat.OpenAward;
        /**  开奖位置ID */
        open_pos : number[];
        /**  我的开奖数据 */
        my_data? : MyWinData;
        /**  左边的排行榜 */
        left_rank : PlayerInfo[];
        /**  右边的排行榜 */
        right_rank : PlayerInfo[];
        /**  big win列表 */
        big_win : WinPlayer[];
        /**  mega win列表 */
        mega_win : WinPlayer[];
        /**  super win列表 */
        super_win : WinPlayer[];
        /**  我的下注列表 */
        my_bets : BetData[];
    }

    /** BaccaratOnlineNtf 在线人数变化通知消息 */
    interface MsgBaccaratOnlineNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  最新在线人数 */
        online_sum? : number;
    }

    /** BaccaratAreaUserBetsNtf 每个区域用户下注累计值 */
    interface MsgBaccaratAreaUserBetsNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  */
        bet_num : AreaUserBetsNum[];
    }

    /** BaccaratAreaUserBetsNtf 每个区域用户下注累计值 */
    interface AreaUserBetsNum{
        /**  位置ID */
        pos_id? : number;
        /**  下注人数 */
        user_sum? : number;
        /**  下注和 */
        bet_sum? : number;
    }

    /** MyWinDataShort 我的赢奖数据 */
    interface MyWinDataShort{
        /**  我赢的金币数 */
        win_coin? : string;
        /**  我的最新金币余额 */
        new_coin? : string;
        /**  我的下注余额 */
        bet_coin? : string;
    }

    /** BaccaratKickOutNtf 长时间未下注踢出通知消息 */
    interface MsgBaccaratKickOutNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  玩家ID */
        uid? : number;
    }

    /** BaccaratLongHuSettleNtf LH结算通知消息 */
    interface MsgBaccaratLongHuSettleNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  开奖类型ID */
        open_id? : baccarat.LHOpenAward;
        /**  开奖牌列表 */
        open_data : number[];
        /**  我的开奖数据 */
        my_data? : MyWinDataShort;
        /**  左边的排行榜 */
        left_rank : PlayerInfo[];
        /**  右边的排行榜 */
        right_rank : PlayerInfo[];
        /**  big win列表 */
        big_win : WinPlayer[];
        /**  mega win列表 */
        mega_win : WinPlayer[];
        /**  super win列表 */
        super_win : WinPlayer[];
        /**  我的下注列表 */
        my_bets : BetData[];
    }

    /** BaccaratRedBlackSettleNtf HH结算通知消息 */
    interface MsgBaccaratRedBlackSettleNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  开奖类型ID */
        open_id? : baccarat.RBOpenAward;
        /**  开奖红黑牌型 */
        card_type : baccarat.RBCardType[];
        /**  开奖牌列表 */
        open_data : number[];
        /**  我的开奖数据 */
        my_data? : MyWinDataShort;
        /**  左边的排行榜 */
        left_rank : PlayerInfo[];
        /**  右边的排行榜 */
        right_rank : PlayerInfo[];
        /**  big win列表 */
        big_win : WinPlayer[];
        /**  mega win列表 */
        mega_win : WinPlayer[];
        /**  super win列表 */
        super_win : WinPlayer[];
        /**  我的下注列表 */
        my_bets : BetData[];
    }

    /** RocketCashOutReq 小飞机下车请求 */
    interface MsgRocketCashOutReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 下车那次下注 */
        bet_id? : number;
    }

    /** RocketCashOutRsp 小火箭下车请求响应 */
    interface MsgRocketCashOutRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /** 下车那次下注 */
        bet_id? : number;
        /**  赢取金币数 */
        win_coin? : string;
        /**  我的最新金币余额 */
        new_coin? : string;
        /**  赢倍数 */
        win_rate? : string;
    }

    /** RocketSettleNtf 小飞机爆炸结算通知消息 */
    interface MsgRocketSettleNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  爆炸倍率 */
        open_rate? : string;
        /**  是否开jackpot */
        open_jackpot? : boolean;
        /**  jacket pot最大赢家 */
        jack_top? : WinPlayer;
        /**  jacket pot 我赢的金币 */
        jack_my? : MyWinDataShort;
        /**  爆炸时的毫秒数 */
        open_seconds? : number;
        /**  爆炸时的unix毫秒时间戳 */
        open_unix? : number;
        /**  jackpot奖池总金币 */
        jack_pool? : string;
        /**  本次瓜分 jackpot奖池金币 */
        jack_award? : string;
    }

    /** RocketFlyNtf 小火箭 起飞通知消息 */
    interface MsgRocketFlyNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  小火箭起飞毫秒时间戳 */
        start_time? : number;
    }

    /** RocketCashOutNtf 小火箭下车通知消息 */
    interface MsgRocketCashOutNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  最新的小火箭下车玩家 */
        players : CashOutPlayer[];
    }

    /** 小火箭进度通知 */
    interface MsgRocketRateNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  小火箭起飞毫秒时间戳 */
        start_time? : number;
        /** 当前跑到多少时间了 */
        progress_time? : number;
        /** 当前倍率 */
        rate_time? : string;
    }

    /** 玩家取消自动下车请求 */
    interface MsgRocketAutoCashOutReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 那次下注 */
        bet_id? : number;
        /** 是否自动 */
        isAuto? : boolean;
        /** 只有isAuto 是true的时候才有意义 */
        out_rate? : string;
    }

    /** 玩家取消自动下车请求返回 */
    interface MsgRocketAutoCashOutRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 那次下注 */
        bet_id? : number;
        /** 是否自动 */
        isAuto? : boolean;
        /** 只有isAuto 是true的时候才有意义 */
        out_rate? : string;
    }

    /** 小火箭下注记录列表请求 */
    interface MsgRocketPlayerHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 多少页 */
        page_count? : number;
    }

    /** 小火箭下注记录列表返回 */
    interface MsgRocketPlayerHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  */
        page_count? : number;
        /**  历史下注 */
        history : RocketPlayerHistory[];
    }

    /** 小火箭下注记录列表返回 */
    interface RocketData{
        /**  */
        bet_id? : number;
        /**  */
        bet_coin? : string;
        /**  */
        out_rate? : string;
        /**  */
        win_coin? : string;
    }

    /** 小火箭下注记录列表返回 */
    interface RocketPlayerHistory{
        /**  期数 */
        period? : string;
        /** 时间 */
        save_time? : number;
        /** 开奖倍率 */
        open_rate? : string;
        /**  */
        infos : RocketData[];
    }

    /** 小火箭验证消息请求 */
    interface MsgRocketEncryptedDataReq{
        /**  主题ID */
        theme_id? : number;
        /**  期数 */
        period? : string;
        /** 桌子id */
        desk_id? : number;
    }

    /** 小火箭验证消息返回 */
    interface MsgRocketEncryptedDataRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  */
        period? : string;
        /** 明文 */
        plain_text? : string;
        /** 密文 */
        encrypt_text? : string;
    }

    /** 小火箭对局历史列表请求 */
    interface MsgRocketDeskHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 多少页 */
        page_count? : number;
    }

    /** 小火箭对局历史列表请求 */
    interface RocketDeskRate{
        /**  */
        period? : string;
        /** 时间 */
        save_time? : number;
        /** 开奖倍率 */
        open_rate? : string;
    }

    /** 小火箭对局历史列表返回 */
    interface MsgRocketDeskHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 多少页 */
        page_count? : number;
        /**  */
        infos : RocketDeskRate[];
    }

    /** //////////////////////////// winGoLottery私有协议  ///////////////////// */
    interface MsgLotteryPlayerHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
    }

    /** 玩家下注信息 */
    interface MsgLotteryPlayerHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  历史下注 */
        history : LotteryPlayerHistory[];
    }

    /** 玩家下注信息 */
    interface LotteryPlayerHistory{
        /**  期数 */
        period? : string;
        /**  下注位置id */
        select? : number;
        /**  下注金额 */
        point? : string;
        /**  开奖id */
        pos_id? : number;
        /**  赢奖数量 */
        amount? : string;
        /**  是否开奖 */
        is_open? : boolean;
    }

    /** 玩家下注信息 */
    interface MsgLotteryEncryptedDataReq{
        /**  主题ID */
        theme_id? : number;
        /**  期数 */
        period? : string;
        /** 桌子id */
        desk_id? : number;
    }

    /** 玩家下注信息 */
    interface MsgLotteryEncryptedDataRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  */
        period? : string;
        /** 明文 */
        plain_text? : string;
        /** 密文 */
        encrypt_text? : string;
    }

    /** LotterySettleNtf 结算通知消息 */
    interface MsgLotterySettleNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  开奖位置ID */
        open_pos : number[];
        /**  我的开奖数据 */
        my_data? : SelfWinData;
        /** 开奖期数 */
        period? : string;
        /** 下一期 */
        next_period? : string;
        /** 是否最后一期 */
        is_last? : boolean;
    }

    /** SelfWinData 我的赢奖数据 */
    interface SelfWinData{
        /**  我赢的金币数 */
        win_coin? : string;
        /**  我的开奖数据 */
        open_elem : LotteryOpenData[];
        /**  我的最新金币余额 */
        new_coin? : string;
    }

    /** LotteryOpenData 开奖数据 */
    interface LotteryOpenData{
        /**  位置ID */
        pos_id? : number;
        /**  赢倍数 */
        win_times? : string;
        /**  赢金币数 */
        win_coin? : string;
    }

    /** //////////////////////////// 5d   ///////////////////// */
    interface MsgLotteryHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  桌子类型 */
        desk_type? : number;
        /**  第几页 */
        page? : number;
    }

    /** //////////////////////////// 5d   ///////////////////// */
    interface MsgLotteryHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  历史开奖 */
        history : LotteryHistory[];
        /** 是否最后一页 */
        IsLast? : boolean;
        /**  桌子ID */
        desk_id? : number;
        /**  桌子类型 */
        desk_type? : number;
    }

    /** //////////////////////////// 5d   ///////////////////// */
    interface LotteryHistory{
        /**  期数 */
        period? : string;
        /**  开奖结果 */
        open_res? : number;
    }

    /** //////////////////////////// 5d   ///////////////////// */
    interface MsgEncryptedDataReq{
        /**  主题ID */
        theme_id? : number;
        /**  期数 */
        period? : string;
        /** 桌子id */
        desk_id? : number;
        /** 桌子类型 */
        desk_type? : number;
    }

    /** //////////////////////////// 5d   ///////////////////// */
    interface MsgEncryptedDataRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  */
        period? : string;
        /** 明文 */
        plain_text? : string;
        /** 密文 */
        encrypt_text? : string;
    }

    /** //////////////////////////// 5d   ///////////////////// */
    interface MsgPlayerHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  桌子类型 */
        desk_type? : number;
        /**  第几页 */
        page? : number;
    }

    /** 玩家下注信息 */
    interface MsgPlayerHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  历史下注 */
        history : PlayerHistory[];
        /** 是否最后一页 */
        IsLast? : boolean;
        /**  桌子ID */
        desk_id? : number;
        /**  桌子类型 */
        desk_type? : number;
    }

    /** 玩家下注信息 */
    interface PlayerHistory{
        /**  期数 */
        period? : string;
        /**  下注位置id */
        select? : number;
        /**  下注金额 */
        point? : string;
        /**  开奖id */
        pos_id? : number;
        /**  赢奖数量 */
        amount? : string;
        /**  是否开奖 */
        is_open? : boolean;
    }

    /** Rocket3DCashOutReq 小飞机下车请求 */
    interface MsgRocket3DCashOutReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 下车那次下注 */
        bet_id? : number;
    }

    /** Rocket3DCashOutRsp 小火箭下车请求响应 */
    interface MsgRocket3DCashOutRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /** 下车那次下注 */
        bet_id? : number;
        /**  赢取金币数 */
        win_coin? : string;
        /**  我的最新金币余额 */
        new_coin? : string;
        /**  赢倍数 */
        win_rate? : string;
    }

    /** Rocket3DSettleNtf 小飞机爆炸结算通知消息 */
    interface MsgRocket3DSettleNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  爆炸倍率 */
        open_rate? : string;
        /**  是否开jackpot */
        open_jackpot? : boolean;
        /**  jacket pot最大赢家 */
        jack_top? : WinPlayer;
        /**  jacket pot 我赢的金币 */
        jack_my? : MyWinDataShort;
        /**  爆炸时的毫秒数 */
        open_seconds? : number;
        /**  爆炸时的unix毫秒时间戳 */
        open_unix? : number;
        /**  jackpot奖池总金币 */
        jack_pool? : string;
        /**  本次瓜分 jackpot奖池金币 */
        jack_award? : string;
    }

    /** Rocket3DFlyNtf 小火箭 起飞通知消息 */
    interface MsgRocket3DFlyNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  小火箭起飞毫秒时间戳 */
        start_time? : number;
    }

    /** Rocket3DCashOutNtf 小火箭下车通知消息 */
    interface MsgRocket3DCashOutNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  最新的小火箭下车玩家 */
        players : CashOutPlayer[];
    }

    /** 小火箭进度通知 */
    interface MsgRocket3DRateNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  小火箭起飞毫秒时间戳 */
        start_time? : number;
        /** 当前跑到多少时间了 */
        progress_time? : number;
        /** 当前倍率 */
        rate_time? : string;
    }

    /** 玩家取消自动下车请求 */
    interface MsgRocket3DAutoCashOutReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 那次下注 */
        bet_id? : number;
        /** 是否自动 */
        isAuto? : boolean;
        /** 只有isAuto 是true的时候才有意义 */
        out_rate? : string;
    }

    /** 玩家取消自动下车请求返回 */
    interface MsgRocket3DAutoCashOutRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 那次下注 */
        bet_id? : number;
        /** 是否自动 */
        isAuto? : boolean;
        /** 只有isAuto 是true的时候才有意义 */
        out_rate? : string;
    }

    /** 小火箭下注记录列表请求 */
    interface MsgRocket3DPlayerHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 多少页 */
        page_count? : number;
    }

    /** 小火箭下注记录列表返回 */
    interface MsgRocket3DPlayerHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  */
        page_count? : number;
        /**  历史下注 */
        history : RocketPlayerHistory[];
    }

    /** 小火箭下注记录列表返回 */
    interface MsgRocket3DData{
        /**  */
        bet_id? : number;
        /**  */
        bet_coin? : string;
        /**  */
        out_rate? : string;
        /**  */
        win_coin? : string;
    }

    /** 小火箭下注记录列表返回 */
    interface MsgRocket3DPlayerHistory{
        /**  期数 */
        period? : string;
        /** 时间 */
        save_time? : number;
        /** 开奖倍率 */
        open_rate? : string;
        /**  */
        infos : MsgRocket3DData[];
    }

    /** 小火箭验证消息请求 */
    interface MsgRocket3DEncryptedDataReq{
        /**  主题ID */
        theme_id? : number;
        /**  期数 */
        period? : string;
        /** 桌子id */
        desk_id? : number;
    }

    /** 小火箭验证消息返回 */
    interface MsgRocket3DEncryptedDataRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  */
        period? : string;
        /** 明文 */
        plain_text? : string;
        /** 密文 */
        encrypt_text? : string;
    }

    /** 小火箭对局历史列表请求 */
    interface MsgRocket3DDeskHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 多少页 */
        page_count? : number;
    }

    /** 小火箭对局历史列表请求 */
    interface MsgRocket3DDeskRate{
        /**  */
        period? : string;
        /** 时间 */
        save_time? : number;
        /** 开奖倍率 */
        open_rate? : string;
    }

    /** 小火箭对局历史列表返回 */
    interface MsgRocket3DDeskHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 多少页 */
        page_count? : number;
        /**  */
        infos : MsgRocket3DDeskRate[];
    }

    /** 小火箭对局历史列表返回 */
    interface MsgRocket3DPlayer{
        /**  昵称 */
        name? : string;
        /**  玩家ID */
        player_id? : number;
        /**  是否机器人 */
        is_robot? : boolean;
        /** 下注金额 */
        bet_coin? : string;
        /**  下车倍数 */
        out_rate? : string;
        /**  赢金币 */
        win_coin? : string;
        /** 是否结算 */
        is_settle? : boolean;
        /** 下注区域id */
        bet_id? : number;
    }

    /** 小火箭本局下注玩家列表查看请求 */
    interface MsgRocket3DDeskBetsHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 多少页 */
        page_count? : number;
    }

    /** 小火箭本局下注玩家列表查看请求 */
    interface MsgRocket3DDeskBetsHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  多少页 */
        page_count? : number;
        /**  最大页数 */
        max_page_count? : number;
        /**  用户下注信息 */
        bet_info : MsgRocket3DPlayer[];
    }

    /** LongHuSettleNtf 结算通知消息 */
    interface MsgLongHuSettleNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  开奖位置ID */
        open_pos : number[];
        /**  开奖区域 */
        win_type? : number;
        /**  我的开奖数据 */
        win_data? : MsgLongHuWinData;
        /** 开奖期数 */
        period? : string;
        /** 下一期 */
        next_period? : string;
        /** 是否最后一期 */
        is_last? : boolean;
    }

    /** SelfWinData 我的赢奖数据 */
    interface MsgLongHuWinData{
        /**  我赢的金币数 */
        win_coin? : string;
        /**  我的最新金币余额 */
        new_coin? : string;
        /**  我的开奖数据 */
        open_elem : MsgLongHuOpenData[];
    }

    /** LongHuShuffleCardsNtf 洗牌消息 */
    interface MsgLongHuShuffleCardsNtf{
        /**  我赢的金币数 */
        card_num? : number;
    }

    /** LotteryOpenData 开奖数据 */
    interface MsgLongHuOpenData{
        /**  位置ID */
        pos_id? : number;
        /**  赢倍数 */
        win_times? : string;
        /**  赢金币数 */
        win_coin? : string;
    }

    /** } */
    interface MsgLongHuPlayerHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  第几页 */
        page? : number;
    }

    /** 玩家下注信息 */
    interface MsgLongHuPlayerHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  历史下注 */
        history : MsgLongHuPlayerHistory[];
        /** 是否最后一页 */
        IsLast? : boolean;
    }

    /** 玩家下注信息 */
    interface MsgLongHuPlayerHistory{
        /**  期数 */
        period? : string;
        /**  下注区域 */
        bet_area? : number;
        /**  下注金额 */
        bet? : string;
        /**  开奖id */
        win_type? : number;
        /**  赢奖数量 */
        win_coin? : string;
    }

    /** 玩家下注信息 */
    interface MsgStockPlayerHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  第几页 （从1开始） */
        page? : number;
    }

    /** 玩家下注信息 */
    interface MsgStockPlayerHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  历史下注 */
        history : MsgStockPlayerHistory[];
        /**  第几页 */
        page? : number;
        /**  最大页数 */
        max_page? : number;
    }

    /** 玩家下注信息 */
    interface MsgStockPlayerHistory{
        /**  期数 */
        period? : string;
        /**  下注位置id */
        bet_id? : number;
        /**  下注金额 */
        bet_coin? : string;
        /**  开奖id */
        open_id? : number;
        /**  开奖倍率 */
        open_rate? : number;
        /**  赢奖数量 */
        win_coin? : string;
        /**  是否开奖 */
        is_open? : boolean;
    }

    /** 公平性验证 */
    interface MsgStockEncryptedDataReq{
        /**  主题ID */
        theme_id? : number;
        /**  期数 */
        period? : string;
        /** 桌子id */
        desk_id? : number;
    }

    /** 公平性验证 */
    interface MsgStockEncryptedDataRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  */
        period? : string;
        /** 明文 */
        plain_text? : string;
        /** 密文 */
        encrypt_text? : string;
    }

    /** StockSettleNtf 结算通知消息 */
    interface MsgStockSettleNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  开奖位置ID */
        open_id? : number;
        /**  赢倍数 */
        win_rate? : string;
        /**  我的开奖数据 */
        my_data? : MsgStockSettleData;
        /**  开奖期数 */
        period? : string;
        /**  赢钱玩家列表 */
        win_list : MsgStockWinData[];
    }

    /** StockSettleData 结算数据 */
    interface MsgStockSettleData{
        /**  位置ID */
        bet_pos? : number;
        /**  赢金币数 */
        win_coin? : string;
        /**  最新金币余额 */
        new_coin? : string;
    }

    /** StockWinData 胜利者数据 */
    interface MsgStockWinData{
        /**  赢金币数 */
        name? : string;
        /**  赢金币数 */
        win_coin? : string;
    }

    /** 股票历史列表请求 */
    interface MsgStockDeskHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 第几页 （从1开始） */
        page? : number;
    }

    /** 股票历史列表请求 */
    interface MsgStockDeskHistory{
        /**  */
        period? : string;
        /** 股票曲线点位 */
        stock_info? : StockInfo;
    }

    /** 股票历史列表请求 */
    interface MsgStockDeskHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  历史信息 */
        infos : MsgStockDeskHistory[];
        /**  第几页 */
        page? : number;
        /**  最大页数 */
        max_page? : number;
    }

    /** SevenUpDownSettleNtf 结算通知消息 */
    interface MsgSevenUpDownSettleNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  开奖位置ID */
        open_pos : number[];
        /**  开奖区域 */
        win_type? : number;
        /**  我的开奖数据 */
        win_data? : MsgSevenUpDownWinData;
        /** 开奖期数 */
        period? : string;
        /** 下一期 */
        next_period? : string;
        /** 是否最后一期 */
        is_last? : boolean;
    }

    /** SelfWinData 我的赢奖数据 */
    interface MsgSevenUpDownWinData{
        /**  我赢的金币数 */
        win_coin? : string;
        /**  我的最新金币余额 */
        new_coin? : string;
        /**  我的开奖数据 */
        open_elem : MsgSevenUpDownOpenData[];
    }

    /** LotteryOpenData 开奖数据 */
    interface MsgSevenUpDownOpenData{
        /**  位置ID */
        pos_id? : number;
        /**  赢倍数 */
        win_times? : string;
        /**  赢金币数 */
        win_coin? : string;
    }

    /** LotteryOpenData 开奖数据 */
    interface MsgSevenUpDownPlayerHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  第几页 */
        page? : number;
    }

    /** 玩家下注信息 */
    interface MsgSevenUpDownPlayerHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  历史下注 */
        history : MsgSevenUpDownPlayerHistory[];
        /** 是否最后一页 */
        IsLast? : boolean;
    }

    /** 玩家下注信息 */
    interface MsgSevenUpDownPlayerHistory{
        /**  期数 */
        period? : string;
        /**  下注区域 */
        bet_area? : number;
        /**  下注金额 */
        bet? : string;
        /**  开奖id */
        win_type? : number;
        /**  赢奖数量 */
        win_coin? : string;
    }

    /** 玩家下注信息 */
    interface MsgAndarBaharSettleNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /** 开奖期数 */
        period? : string;
        /**  开奖结果数据 */
        result_data? : OpenRecord;
        /**  开奖结果 */
        result? : number;
        /**  玩家下注金额 */
        bet_coin? : string;
        /**  玩家赢奖金额 */
        win_coin? : string;
        /**  玩家最新金币余额 */
        new_coin? : string;
    }

    /** 玩家下注信息 */
    interface AndarBaharHistory{
        /**  期数 */
        period? : string;
        /**  开奖结果数据 */
        result_data? : OpenRecord;
        /**  结果 1 左边 3 右边 */
        result? : number;
        /**  玩家下注数据 */
        bets : BetData[];
        /**  玩家下注金额 */
        bet_coin? : string;
        /**  玩家赢奖金额 */
        win_coin? : string;
    }

    /** 玩家下注信息 */
    interface MsgAndarBaharPlayerHistoryReq{
        /**  */
        theme_id? : number;
        /**  第几页 */
        page? : number;
    }

    /** 玩家下注信息 */
    interface MsgAndarBaharPlayerHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  历史下注 */
        history : AndarBaharHistory[];
        /**  是否最后一页 */
        is_last? : boolean;
        /**  最大页数 */
        max_page_num? : number;
    }

    /** 玩家获胜通知(跑马灯形式展示) */
    interface MsgLastWinNtf{
        /**  玩家头像 */
        avatar? : number;
        /**  */
        countryCode? : string;
        /** 货币类型     */
        currency? : string;
        /** 玩家名字   */
        username? : string;
        /** 赢分      */
        winAmount? : string;
    }

    /** 前三名数据 */
    interface MsgPlayerRankNtf{
        /** 前三名信息 */
        ranks : RankList[];
    }

    /** 前三名数据 */
    interface RankInfo{
        /** 前三名信息 */
        ranks : RankList[];
    }

    /** 前三名数据 */
    interface RankList{
        /** 玩家id */
        player_id? : string;
        /** 玩家金额 */
        balance? : number;
        /** 玩家icon */
        icon? : number;
    }

    /** 请求排行榜 */
    interface MsgGetRankReq{
        /**  147，日榜，258，月，369，年 */
        rank_type? : number;
    }

    /** 请求排行榜回复 */
    interface MsgGetRankRsp{
        /** 请求时间  */
        save_time? : string;
        /**  我的开奖数据 */
        rank : game.SevenUpDownRankData[];
    }

}
