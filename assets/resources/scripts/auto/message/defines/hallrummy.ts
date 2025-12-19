export namespace hallrummy{

    export const PACKAGE_NAME = 'hall';

    export enum Message {
        /** RummyPlayerInfo 玩家信息 */
        RummyPlayerInfo = 'RummyPlayerInfo',
        /** RummyGetPlayerInfoReq rummy点击玩家头像，获取玩家信息请求 */
        RummyGetPlayerInfoReq = 'RummyGetPlayerInfoReq',
        /** RummyGetPlayerInfoRsp rummy点击玩家头像，获取玩家信息回复 */
        RummyGetPlayerInfoRsp = 'RummyGetPlayerInfoRsp',
        /** RummyMoneyChangeNtf  金币变化通知 */
        RummyMoneyChangeNtf = 'RummyMoneyChangeNtf',
    }

    /** RummyPlayerInfo 玩家信息 */
    export interface RummyPlayerInfo{
        /** 显示ID */
        show_uid? : number;
        /** 头像地址 */
        avator_url? : string;
        /** 玩家性别: 1=男， 2=女 */
        gender? : number;
        /** 玩家昵称 */
        nick_name? : string;
        /** 绑定的手机号 */
        phone? : string;
        /** 实名状态 */
        realname_status? : boolean;
        /** 玩家真金数 */
        real_coin? : string;
        /** 玩家绑金数 */
        bind_coin? : string;
        /** 玩家总金数 */
        all_coin? : string;
        /** 玩家筹码或钻石数 */
        tone? : string;
        /** 玩家奖金总数 */
        total_bonus? : string;
        /** 玩家今日得到的奖金数 */
        today_bonus? : string;
        /** 今日必须消耗奖金数 */
        must_cost? : string;
        /** 今日已经消耗奖金数 */
        today_cost? : string;
        /** 今日消耗奖金进度 */
        cost_progress? : number;
        /** 充值总额 */
        recharge_sum? : number;
        /** bonus 待领取的cash */
        bonus_cash? : string;
        /** VIP等级 */
        vip_level? : number;
        /**  vip 等级充值额,只返回VIP3之前的充值额。 */
        vip_recharge : number[];
        /** bonus转化是否达到上限 */
        bonus_convert_limit? : boolean;
    }

    /** RummyGetPlayerInfoReq rummy点击玩家头像，获取玩家信息请求 */
    export interface RummyGetPlayerInfoReq{
    }

    /** RummyGetPlayerInfoRsp rummy点击玩家头像，获取玩家信息回复 */
    export interface RummyGetPlayerInfoRsp{
        /** 请求结果信息 */
        result? : commonrummy.RummyResult;
        /** 玩家个人信息 */
        player_info? : RummyPlayerInfo;
        /**  奖金过期帮助文本 */
        bonus_expire_help? : string;
        /**  奖金使用帮助文本 */
        bonus_cash_help? : string;
        /** 玩家地区 */
        my_area? : string;
        /** 地区列表 */
        areas : string[];
    }

    /** RummyMoneyChangeNtf  金币变化通知 */
    export interface RummyMoneyChangeNtf{
        /** 货币类型 */
        moneyType? : commonrummy.RummyMoneyType;
        /** 变化值 */
        change_val? : string;
        /** 变化后的值 */
        after_val? : string;
    }

}
window['hallrummy'] = hallrummy;
