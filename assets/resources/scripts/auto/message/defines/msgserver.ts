export namespace msgserver{

    export const PACKAGE_NAME = 'msgserver';

    /** NoticeType 公告类型 */
    export enum NoticeType{
        /**  URL类型 */
        URL = 0,
        /**  游戏主题 */
        Game = 1,
        /**  窗口 */
        Wnd = 2,
    }

    export enum Message {
        /** 公告信息 */
        NoticeInfo = 'NoticeInfo',
        /** 获取公告列表请求 */
        MsgSvrGetNoticeListReq = 'MsgSvrGetNoticeListReq',
        /** 获取公告列表请求应答 */
        MsgSvrGetNoticeListRsp = 'MsgSvrGetNoticeListRsp',
        /** 已读公告请求 */
        MsgSvrReadNoticeReq = 'MsgSvrReadNoticeReq',
        /** 已读公告请求应答 */
        MsgSvrReadNoticeRsp = 'MsgSvrReadNoticeRsp',
        /** 获取跑马灯请求 */
        MsgSvrGetHorseRaceReq = 'MsgSvrGetHorseRaceReq',
        /** 获取跑马灯应答 */
        MsgSvrGetHorseRaceRsp = 'MsgSvrGetHorseRaceRsp',
        /** 跑马灯变化通知 */
        MsgSvrHorseRaceUpdateNtf = 'MsgSvrHorseRaceUpdateNtf',
        /** msgid:MSGSVR_STOP_NTF = 0x4004; // 停服通知消息 */
        MsgSvrStopNtf = 'MsgSvrStopNtf',
        /** msgid:MSGSVR_ALLCLI_NTF = 0x4005; 	//通知所有客户端下线 */
        MsgSvrAllCliNtf = 'MsgSvrAllCliNtf',
        /** msgid:MSGSVR_MESSAGE_NTF = 0x4006;    //通用通知消息 */
        MsgSvrMessageNtf = 'MsgSvrMessageNtf',
        /** msgid:MsgSvrHorseRaceJbrNtf = 0x4010; // 跑马灯假百人变化通知 */
        MsgSvrHorseRaceJbrNtf = 'MsgSvrHorseRaceJbrNtf',
        /** 语聊玩家信息 */
        VoicePlayerInfo = 'VoicePlayerInfo',
        /** msgid: MSGSVR_VOICE_STATE_CHANGE_NTF = 0x400D;       //语聊玩家状态变化通知消息 */
        MsgSvrVoiceStateChangeNtf = 'MsgSvrVoiceStateChangeNtf',
        /** 进入语聊房间请求 */
        MsgSvrEnterVoiceRoomReq = 'MsgSvrEnterVoiceRoomReq',
        /** 进入语聊房间应答 */
        MsgSvrEnterVoiceRoomRsp = 'MsgSvrEnterVoiceRoomRsp',
        /** 离开语聊房间请求 */
        MsgSvrLeaveVoiceRoomReq = 'MsgSvrLeaveVoiceRoomReq',
        /** 离开语聊房间应答 */
        MsgSvrLeaveVoiceRoomRsp = 'MsgSvrLeaveVoiceRoomRsp',
        /** 获取语聊玩家信息请求 */
        MsgSvrGetVoicePlayerInfoReq = 'MsgSvrGetVoicePlayerInfoReq',
        /** 获取语聊玩家信息应答 */
        MsgSvrGetVoicePlayerInfoRsp = 'MsgSvrGetVoicePlayerInfoRsp',
    }

    /** 公告信息 */
    export interface NoticeInfo{
        /**  公告类型 */
        typ? : msgserver.NoticeType;
        /**  tag标签 */
        tag? : string;
        /**  公告标题 */
        title? : string;
        /**  公告图片url,支持多个图片轮换 */
        pic_url : string[];
        /**  点击区域: x,y */
        point : string[];
        /**  跳转url */
        go_url? : string;
        /**  公告ID */
        id? : number;
        /**   是否已读,  false=未读,显示红点 */
        is_read? : boolean;
    }

    /** 获取公告列表请求 */
    export interface MsgSvrGetNoticeListReq{
        /**  玩家ID */
        player_id? : number;
        /**  类型 0 默认 1 大转盘 */
        type? : number;
    }

    /** 获取公告列表请求应答 */
    export interface MsgSvrGetNoticeListRsp{
        /**  错误码， 参考 common.ErrCode */
        err_code? : number;
        /**  错误描述 */
        err_desc? : string;
        /**  公告列表 */
        list : NoticeInfo[];
    }

    /** 已读公告请求 */
    export interface MsgSvrReadNoticeReq{
        /**  玩家ID */
        player_id? : number;
        /**  公告ID */
        id? : number;
    }

    /** 已读公告请求应答 */
    export interface MsgSvrReadNoticeRsp{
        /**  错误码， 参考 common.ErrCode */
        err_code? : number;
        /**  错误描述 */
        err_desc? : string;
        /**  公告ID */
        id? : number;
        /**   是否已读 */
        is_read? : boolean;
    }

    /** 获取跑马灯请求 */
    export interface MsgSvrGetHorseRaceReq{
        /**  玩家ID */
        player_id? : number;
        /**  类型 0 默认 1 大转盘 */
        type? : number;
    }

    /** 获取跑马灯应答 */
    export interface MsgSvrGetHorseRaceRsp{
        /**  错误码， 参考 common.ErrCode */
        err_code? : number;
        /**  错误描述 */
        err_desc? : string;
        /**  两个跑马灯播放间隔,单位:秒 */
        tick? : number;
        /**  跑马灯播放一轮后，休眠时间:秒 */
        sleep? : number;
        /**  跑马灯内容列表 */
        content : string[];
        /**  类型 0 默认 1 大转盘 */
        type? : number;
    }

    /** 跑马灯变化通知 */
    export interface MsgSvrHorseRaceUpdateNtf{
        /**  渠道Id */
        channel? : number;
        /**  新加的跑马灯内容 */
        content? : string;
        /**  类型 0 默认 1 大转盘 */
        type? : number;
    }

    /** msgid:MSGSVR_STOP_NTF = 0x4004; // 停服通知消息 */
    export interface MsgSvrStopNtf{
        /** 消息内容 */
        msg? : string;
        /** 开房场限制 */
        roomforbid? : boolean;
        /** 金币场限制 */
        goldforbid? : boolean;
    }

    /** msgid:MSGSVR_ALLCLI_NTF = 0x4005; 	//通知所有客户端下线 */
    export interface MsgSvrAllCliNtf{
        /**  */
        msg? : number;
        /** 维护公告状态 */
        panlstatus? : number;
        /** 维护公告标题 */
        showpanlhead? : string;
        /** 维护公告内容 */
        showpanlmsg? : string;
    }

    /** msgid:MSGSVR_MESSAGE_NTF = 0x4006;    //通用通知消息 */
    export interface MsgSvrMessageNtf{
        /** 消息类型 */
        type? : number;
        /** 消息标题: txt或json */
        title? : string;
        /** 消息内容: txt或json */
        content? : string;
    }

    /** msgid:MsgSvrHorseRaceJbrNtf = 0x4010; // 跑马灯假百人变化通知 */
    export interface MsgSvrHorseRaceJbrNtf{
        /**  玩家名称 */
        name? : string;
        /**  玩家头像 */
        icon? : string;
        /**  赢金币总数 */
        win_coins? : string;
        /**  赢类型: 0=未赢，1=小赢，2=big win，3=mega win, 4=super win */
        win_type? : number;
    }

    /** 语聊玩家信息 */
    export interface VoicePlayerInfo{
        /**  玩家ID */
        player_id? : number;
        /**  当前状态 */
        state_id? : number;
        /**  微信昵称 */
        nick_name? : string;
        /**  微信头像 */
        pic_url? : string;
        /**  微信openid */
        open_id? : string;
    }

    /** msgid: MSGSVR_VOICE_STATE_CHANGE_NTF = 0x400D;       //语聊玩家状态变化通知消息 */
    export interface MsgSvrVoiceStateChangeNtf{
        /**  变化的玩家信息 */
        change_player? : VoicePlayerInfo;
    }

    /** 进入语聊房间请求 */
    export interface MsgSvrEnterVoiceRoomReq{
        /**  玩家ID */
        player_id? : number;
        /**  当前状态 */
        state_id? : number;
        /**  广播玩家列表 */
        broadcast_players : number[];
    }

    /** 进入语聊房间应答 */
    export interface MsgSvrEnterVoiceRoomRsp{
        /**  错误码， 参考 common.ErrCode */
        err_code? : number;
        /**  错误描述 */
        err_desc? : string;
    }

    /** 离开语聊房间请求 */
    export interface MsgSvrLeaveVoiceRoomReq{
        /**  玩家ID */
        player_id? : number;
    }

    /** 离开语聊房间应答 */
    export interface MsgSvrLeaveVoiceRoomRsp{
        /**  错误码， 参考 common.ErrCode */
        err_code? : number;
        /**  错误描述 */
        err_desc? : string;
    }

    /** 获取语聊玩家信息请求 */
    export interface MsgSvrGetVoicePlayerInfoReq{
        /**  微信openid */
        open_id : string[];
    }

    /** 获取语聊玩家信息应答 */
    export interface MsgSvrGetVoicePlayerInfoRsp{
        /**  错误码， 参考 common.ErrCode */
        err_code? : number;
        /**  错误描述 */
        err_desc? : string;
        /**  玩家信息列表 */
        inf_list : VoicePlayerInfo[];
    }

}
window['msgserver'] = msgserver;
