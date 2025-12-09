declare namespace matchrummy{

    const PACKAGE_NAME = 'match';

    enum Message {
        /** RummyMatchReq 匹配请求 */
        RummyMatchReq = 'RummyMatchReq',
        /** RummyMatchRsp 匹配应答 */
        RummyMatchRsp = 'RummyMatchRsp',
        /** TPMatchReq 匹配请求 */
        TPMatchReq = 'TPMatchReq',
        /** TPMatchRsp 匹配应答 */
        TPMatchRsp = 'TPMatchRsp',
    }

    /** RummyMatchReq 匹配请求 */
    interface RummyMatchReq{
        /**  游戏ID */
        game_id? : number;
        /**  场次ID */
        level_id? : number;
        /**  是否是换桌 */
        change_desk? : boolean;
        /**  原桌子ID,换桌时使用 */
        old_desk_id? : number;
    }

    /** RummyMatchRsp 匹配应答 */
    interface RummyMatchRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  桌子ID */
        desk_id? : number;
    }

    /** TPMatchReq 匹配请求 */
    interface TPMatchReq{
        /**  游戏ID */
        game_id? : number;
        /**  场次ID, 0=快速加入 */
        level_id? : number;
        /**  是否是换桌 */
        change_desk? : boolean;
        /**  原桌子ID,换桌时使用 */
        old_desk_id? : number;
        /**  玩法模式,tp快速加入时，必须填写 */
        play_mode? : commonrummy.RummyPlayMode;
        /**  桌子类型: 4=经典TP, 6=Joker TP */
        desk_type? : number;
        /**  正在玩的场次ID，用于TP升场判断 */
        play_level? : number;
    }

    /** TPMatchRsp 匹配应答 */
    interface TPMatchRsp{
        /**  请求结果信息 */
        result? : commonrummy.RummyResult;
        /**  桌子ID */
        desk_id? : number;
    }

}
