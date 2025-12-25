export namespace game{

    export const PACKAGE_NAME = 'baccarat';

    /** 阶段 */
    export enum SUDDeskStage{
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

    export enum Message {
        /** 阶段 */
        SUDBetData = 'SUDBetData',
        /** 阶段 */
        SUDMyData = 'SUDMyData',
        /** 阶段 */
        PlayData = 'PlayData',
        /** 阶段 */
        SUDDeskInfo = 'SUDDeskInfo',
        /** 阶段 */
        SUDAreaUserBetsNum = 'SUDAreaUserBetsNum',
        /** 阶段 */
        SUDSevenUpDownRankInfo = 'SUDSevenUpDownRankInfo',
        /** 阶段 */
        SUDSevenUpDownBetNtf = 'SUDSevenUpDownBetNtf',
        /** 阶段 */
        SUDSevenUpDownRankList = 'SUDSevenUpDownRankList',
        /** 阶段 */
        SUDSevenUpDownInfo = 'SUDSevenUpDownInfo',
        /** 阶段 */
        SUDSevenUpDownWinType = 'SUDSevenUpDownWinType',
        /** EnterBaccaratReq 进入7UPDOWN请求 */
        MsgEnterSevenUpDownReq = 'MsgEnterSevenUpDownReq',
        /** EnterBaccaratRsp 进入7UPDOWN请求响应 */
        MsgEnterSevenUpDownRsp = 'MsgEnterSevenUpDownRsp',
        /** LeaveBaccaratReq 离开7UPDOWN请求 */
        MsgLeaveSevenUpDownReq = 'MsgLeaveSevenUpDownReq',
        /** LeaveBaccaratRsp 离开7UPDOWN请求响应 */
        MsgLeaveSevenUpDownRsp = 'MsgLeaveSevenUpDownRsp',
        /** 7UPDOWN 历史中奖请求请求 */
        MsgGetPercentReq = 'MsgGetPercentReq',
        /** 7UPDOWN 历史中奖请求响应 */
        MsgGetPercentRsp = 'MsgGetPercentRsp',
        /** BetBaccaratReq 7UPDOWN下注请求 */
        MsgBetSevenUpDownReq = 'MsgBetSevenUpDownReq',
        /** BetBaccaratRsp 7UPDOWN下注请求响应 */
        MsgBetSevenUpDownRsp = 'MsgBetSevenUpDownRsp',
        /** 取消下注请求 */
        MsgCancelBetSevenUpDownReq = 'MsgCancelBetSevenUpDownReq',
        /** 取消下注请求响应 */
        MsgCancelBetSevenUpDownRsp = 'MsgCancelBetSevenUpDownRsp',
        /** 取消下注请求响应通知 */
        MsgCancelBetBaccaratNtf = 'MsgCancelBetBaccaratNtf',
        /** BetPlayer */
        BetPlayer = 'BetPlayer',
        /** SevenUpDownSettleNtf 结算通知消息 */
        MsgSevenUpDownSettleNtf = 'MsgSevenUpDownSettleNtf',
        /** StockWinData 胜利者数据 */
        SettleWinData = 'SettleWinData',
        /** SelfWinData 我的赢奖数据 */
        SevenUpDownWinData = 'SevenUpDownWinData',
        /** LotteryOpenData 开奖数据 */
        SevenUpDownOpenData = 'SevenUpDownOpenData',
        /** LotteryOpenData 开奖数据 */
        MsgSevenUpDownPlayerHistoryReq = 'MsgSevenUpDownPlayerHistoryReq',
        /** 玩家下注信息 */
        MsgSevenUpDownPlayerHistoryRsp = 'MsgSevenUpDownPlayerHistoryRsp',
        /** BetBaccaratNtf 最新玩家下注通知消息 */
        MsgBetBaccaratNtf = 'MsgBetBaccaratNtf',
        /** BetBaccaratNtf 最新玩家下注通知消息 */
        SevenUpDownPlayerHistory = 'SevenUpDownPlayerHistory',
        /** 翻倍数据 */
        MsgOddNtf = 'MsgOddNtf',
        /** 前三名数据 */
        MsgPlayerRankNtf = 'MsgPlayerRankNtf',
        /** 跑马灯 */
        MsgLastWinNtf = 'MsgLastWinNtf',
        /** 所有玩家下注记录 */
        MsgAllBetBaccaratNtf = 'MsgAllBetBaccaratNtf',
        /** 请求排行榜 */
        MsgGetRankReq = 'MsgGetRankReq',
        /** 请求排行榜回复 */
        MsgGetRankRsp = 'MsgGetRankRsp',
        /** 排行榜数据 */
        SevenUpDownRankData = 'SevenUpDownRankData',
        /** 请求更换头像 */
        MsgUpdatePlayerDataReq = 'MsgUpdatePlayerDataReq',
        /** 请求更换头像回复 */
        MsgUpdatePlayerDataRsp = 'MsgUpdatePlayerDataRsp',
    }

    /** 阶段 */
    export interface SUDBetData{
        /**  下注元素ID */
        bet_id? : number;
        /**  下注金额 */
        bet_coin? : string;
        /** 是否是rebet */
        is_rebet? : boolean;
    }

    /** 阶段 */
    export interface SUDMyData{
        /**  上次底注金额 */
        prev_bet? : string;
        /**  下注列表 */
        bets : SUDBetData[];
        /**  当前桌子上赢金币总数 */
        win_coin? : string;
        /**  玩家最新金币余额 */
        new_coin? : string;
        /**  玩家当局赢的倍数 */
        win_rate? : string;
    }

    /** 阶段 */
    export interface PlayData{
        /**  玩家头像 */
        icon? : number;
        /**  玩家id */
        player_id? : number;
    }

    /** 阶段 */
    export interface SUDDeskInfo{
        /**  桌子ID */
        desk_id? : number;
        /**  桌子阶段 */
        stage? : game.SUDDeskStage;
        /**  此阶段结束时间戳,这里是毫秒时间戳 */
        end_time? : number;
        /**  */
        bets : { [key : string] : baccarat.BetInfo};
        /**  桌子人数 */
        online_sum? : number;
        /**  所有人的下注金额列表 */
        all_bets : SUDBetData[];
        /**  此阶段剩余秒数 */
        have_sec? : number;
        /**  最少下注金币金币余额 */
        bet_min? : string;
        /**  最大下注金币金币余额 */
        bet_max? : string;
        /**  序列 */
        seq? : string;
        /** 当前期号 */
        period_id? : string;
        /**  区域下注人数 */
        area_bet_num : SUDAreaUserBetsNum[];
        /** 7updown前几名下注人员信息 */
        player_rank_ntf? : SUDSevenUpDownRankInfo;
        /** 下注信息 */
        bet_ntf? : SUDSevenUpDownBetNtf;
        /** 下注区域翻倍率 */
        odds : string[];
        /** 7updown配置信息 */
        seven_up_down_info? : SUDSevenUpDownInfo;
        /**  当前阶段总时间 */
        stage_total_time? : number;
    }

    /** 阶段 */
    export interface SUDAreaUserBetsNum{
        /**  位置ID */
        pos_id? : number;
        /**  下注人数 */
        user_sum? : number;
        /**  下注和 */
        bet_sum? : number;
    }

    /** 阶段 */
    export interface SUDSevenUpDownRankInfo{
        /** 前几名信息 */
        ranks : SUDSevenUpDownRankList[];
        /** 最幸运玩家信息 */
        ranks_rate : SUDSevenUpDownRankList[];
    }

    /** 阶段 */
    export interface SUDSevenUpDownBetNtf{
        /**  桌子ID */
        desk_id? : number;
        /**  下注玩家信息 */
        players : BetPlayer[];
    }

    /** 阶段 */
    export interface SUDSevenUpDownRankList{
        /** 玩家id */
        player_id? : string;
        /** 玩家金额 */
        balance? : number;
        /** 玩家icon */
        icon? : number;
    }

    /** 阶段 */
    export interface SUDSevenUpDownInfo{
        /** 下注区域赔率 */
        odds : string[];
        /**  停止下注秒数 */
        end_sec? : number;
        /** 回合秒数 */
        cycle_time? : number;
        /** 开奖结果列表 */
        win_type_list : SUDSevenUpDownWinType[];
    }

    /** 阶段 */
    export interface SUDSevenUpDownWinType{
        /** 开奖结果列表 */
        win_type : number[];
        /** 是否翻倍 */
        is_double? : boolean;
    }

    /** EnterBaccaratReq 进入7UPDOWN请求 */
    export interface MsgEnterSevenUpDownReq{
        /**  主题ID */
        theme_id? : number;
        /**  是否是换桌 */
        change? : boolean;
        /**  桌子类型 */
        desk_type? : number;
    }

    /** EnterBaccaratRsp 进入7UPDOWN请求响应 */
    export interface MsgEnterSevenUpDownRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  桌子信息 */
        info? : SUDDeskInfo;
        /**  我的信息 */
        my? : SUDMyData;
        /**  玩家ID */
        player_id? : number;
        /**  玩家基础信息 */
        player_data? : PlayData;
        /**  是否可以下注 */
        can_spin? : boolean;
        /**  钱包列表 */
        wallets : baccarat.WalletInfo[];
    }

    /** LeaveBaccaratReq 离开7UPDOWN请求 */
    export interface MsgLeaveSevenUpDownReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
    }

    /** LeaveBaccaratRsp 离开7UPDOWN请求响应 */
    export interface MsgLeaveSevenUpDownRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
    }

    /** 7UPDOWN 历史中奖请求请求 */
    export interface MsgGetPercentReq{
        /**  桌子ID */
        desk_id? : number;
    }

    /** 7UPDOWN 历史中奖请求响应 */
    export interface MsgGetPercentRsp{
        /** 中奖概率 */
        percents : number[];
    }

    /** BetBaccaratReq 7UPDOWN下注请求 */
    export interface MsgBetSevenUpDownReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  上次底注金额 */
        prev_bet? : string;
        /**  下注列表 */
        bets : SUDBetData[];
    }

    /** BetBaccaratRsp 7UPDOWN下注请求响应 */
    export interface MsgBetSevenUpDownRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  扣除金币 */
        cost_coin? : string;
        /**  我的最新金币余额 */
        new_coin? : string;
        /**  下注列表 */
        bets : SUDBetData[];
        /**  头像 */
        icon? : number;
        /**  isFirst */
        is_first? : boolean;
    }

    /** 取消下注请求 */
    export interface MsgCancelBetSevenUpDownReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  取消类型 1 上一步 2 所有 */
        cancel_type? : number;
    }

    /** 取消下注请求响应 */
    export interface MsgCancelBetSevenUpDownRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  扣除金币 */
        cost_coin? : string;
        /**  我的最新金币余额 */
        new_coin? : string;
        /**  下注列表 */
        bets : SUDBetData[];
    }

    /** 取消下注请求响应通知 */
    export interface MsgCancelBetBaccaratNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  下注玩家信息 */
        players : BetPlayer[];
    }

    /** BetPlayer */
    export interface BetPlayer{
        /**  下注列表 */
        bets : baccarat.BetData[];
        /**  玩家ID */
        player_id? : string;
        /**  头像 */
        icon? : number;
        /**  是否是第一名下注 */
        is_first? : boolean;
        /**  赢分 */
        win_coin? : string;
    }

    /** SevenUpDownSettleNtf 结算通知消息 */
    export interface MsgSevenUpDownSettleNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  开奖位置ID */
        open_pos : number[];
        /**  开奖区域 */
        win_type? : number;
        /**  我的开奖数据 */
        win_data? : SevenUpDownWinData;
        /** 开奖期数 */
        period? : string;
        /** 下一期 */
        next_period? : string;
        /** 是否最后一期 */
        is_last? : boolean;
        /**  下注列表 */
        bets : SUDBetData[];
        /**  赢钱玩家列表 */
        win_list : SettleWinData[];
        /**  历史下注 */
        history? : SevenUpDownPlayerHistory;
        /** 游戏记录显示是否x2 */
        is_double? : boolean;
    }

    /** StockWinData 胜利者数据 */
    export interface SettleWinData{
        /**  赢金币数 */
        name? : string;
        /**  赢金币数 */
        win_coin? : string;
        /**  用户id */
        player_id? : number;
    }

    /** SelfWinData 我的赢奖数据 */
    export interface SevenUpDownWinData{
        /**  我赢的金币数 */
        win_coin? : string;
        /**  我的最新金币余额 */
        new_coin? : string;
        /**  我的开奖数据 */
        open_elem : SevenUpDownOpenData[];
    }

    /** LotteryOpenData 开奖数据 */
    export interface SevenUpDownOpenData{
        /**  位置ID */
        pos_id? : number;
        /**  赢倍数 */
        win_times? : string;
        /**  赢金币数 */
        win_coin? : string;
    }

    /** LotteryOpenData 开奖数据 */
    export interface MsgSevenUpDownPlayerHistoryReq{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  第几页 */
        page? : number;
    }

    /** 玩家下注信息 */
    export interface MsgSevenUpDownPlayerHistoryRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  历史下注 */
        history : SevenUpDownPlayerHistory[];
        /** 是否最后一页 */
        IsLast? : boolean;
    }

    /** BetBaccaratNtf 最新玩家下注通知消息 */
    export interface MsgBetBaccaratNtf{
        /**  主题ID */
        theme_id? : number;
        /**  桌子ID */
        desk_id? : number;
        /**  最新的下注玩家信息 */
        players : BetPlayer[];
    }

    /** BetBaccaratNtf 最新玩家下注通知消息 */
    export interface SevenUpDownPlayerHistory{
        /**  期数 */
        period? : string;
        /**  下注金额 */
        bet? : string;
        /**  开奖id */
        win_type : number[];
        /**  赢奖数量 */
        win_coin? : string;
        /** 明文 */
        plain_text? : string;
        /** 密文 */
        encrypt_text? : string;
    }

    /** 翻倍数据 */
    export interface MsgOddNtf{
        /** 每个区域的翻倍情况 */
        odd_string : string[];
    }

    /** 前三名数据 */
    export interface MsgPlayerRankNtf{
        /** 前几名信息 */
        ranks : SUDSevenUpDownRankList[];
        /** 最幸运玩家信息 */
        ranks_rate : SUDSevenUpDownRankList[];
    }

    /** 跑马灯 */
    export interface MsgLastWinNtf{
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

    /** 所有玩家下注记录 */
    export interface MsgAllBetBaccaratNtf{
        /**  桌子ID */
        desk_id? : number;
        /**  下注玩家信息 */
        players : BetPlayer[];
    }

    /** 请求排行榜 */
    export interface MsgGetRankReq{
        /**  147，日榜，258，月，369，年 */
        rank_type? : number;
    }

    /** 请求排行榜回复 */
    export interface MsgGetRankRsp{
        /** 请求时间  */
        save_time? : string;
        /**  我的开奖数据 */
        rank : SevenUpDownRankData[];
    }

    /** 排行榜数据 */
    export interface SevenUpDownRankData{
        /**  下注金额 */
        bet? : string;
        /**  赢金币数 */
        win? : string;
        /**  名字 */
        name? : string;
        /**  玩家头像 */
        icon? : string;
        /**  时间 */
        save_time? : number;
    }

    /** 请求更换头像 */
    export interface MsgUpdatePlayerDataReq{
        /**  */
        icon? : number;
    }

    /** 请求更换头像回复 */
    export interface MsgUpdatePlayerDataRsp{
        /**  错误码 */
        err_code? : commonrummy.RummyErrCode;
        /**  错误描述 */
        err_desc? : string;
        /**  图片地址 */
        pic_url? : string;
        /**  */
        icon? : number;
    }

}
window['game'] = game;
