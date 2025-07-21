import { JsonAsset } from "cc";
import BaseDefine from "../base-define";
import { sys } from "cc";

export interface IHotUpdateDatas {
    [channel_name : string]: {
        local : string[];
        test : string[];
        prerelease : string[];
        release : string[];
    }
}

export default class HotUpdateDatas {
    private static datas : IHotUpdateDatas = {};
    public static init(datas : JsonAsset) {
        this.datas = datas.json as IHotUpdateDatas;
        console.log("HotUpdateDatas", this.datas);
    }

    /**
     * 根据当前渠道和系统，获取热更新的地址
     * 这个地址不包含系统
     * 返回["https://www.localftpserver.com/app/"],但是真实的应该是["https://www.localftpserver.com/app/${channel}/${platform}/${env}/"]
     */
    public static getRemoteUrls() {
        let channel = BaseDefine.CHANNEL;
        let env = BaseDefine.HOT_UPDATE_ENV;
        let urls = this.datas[channel][env];
        if (!urls) {
            console.error("HotUpdateDatas getRemoteUrls error, channel: " + channel + ", env: " + env);
            return null;
        }
        return urls;
    }

    /**
     * 根据当前
     * @param url 
     */
    public static getUrl(url : string){
        /**
         * windows,ios,android
         */
        let os = sys.os;
        if(os !== sys.OS.ANDROID && os !== sys.OS.IOS && os !== sys.OS.WINDOWS){
            console.error("HotUpdateDatas getUrl error, os: " + os);
            return null;
        }
        const osFolder = os.toLowerCase();
        const env = BaseDefine.HOT_UPDATE_ENV;
        const channel = BaseDefine.CHANNEL;
        if(url.endsWith("/")){
            url = url.substring(0, url.length - 1);
        }
        return url += `/${channel}/${osFolder}/${env}/`;
    }
}