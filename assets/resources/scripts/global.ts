import BaseGlobal from "./core/utils/base-global";
import { ProtoType } from "./network/define/define";

export enum EnvType {
    /**
     * 内网测试,开发中
     */
    dev = 'dev',
    /**
     * 巴西往外正式发布
     */
    br_release = 'br_release',
    /**
     * 巴西外网测试
     */
    br_debug    = 'br_debug',
    /**
     * 巴西预发布
     */
    br_prerelease = 'br_prerelease',
    /**
     * India外网测试
     */
    in_debug = 'in_debug',
    /**
     * India预发布
     */
    in_prerelease = 'in_prerelease',
    /**
     * India发布
     */
    in_release = 'in_release',
}


export class Global extends BaseGlobal{
    /**
     * 协议方式
     */
    public static NetWorkProtoType : ProtoType = ProtoType.Json;
    /**
     * 当前所在Bundle的名字
     */
    public static CurrentBundleName : string    = "";  


    public static readonly GameServerUrls = {
        //内网测试
        [EnvType.dev] : "http://192.168.0.46:8886/game_enter/",
        //巴西相关
        [EnvType.br_release] : "https://s.k8bet.com/game_enter/",
        [EnvType.br_debug] : "https://h5.slotsgenie.xyz/game_enter/",
        [EnvType.br_prerelease] : " https://s.k8betting.net/game_enter/",
        //印度相关
        [EnvType.in_debug] : "https://s-h5in.slotsgenie.xyz/game_enter/",
        [EnvType.in_prerelease] : "",
        [EnvType.in_release] : "https://s.nayabet.com/game_enter/",
    };

    /**
     * 当前环境
     */
    public static Env = EnvType.dev;
    /**
     * 当前游戏版本
     */
    public static Version = '1.0.0';
    /**
     * 当前渠道
     */
    public static ChannelId = 0;
}