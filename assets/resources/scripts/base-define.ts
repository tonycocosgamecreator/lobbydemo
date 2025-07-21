import { game ,macro } from "cc";


export default class BaseDefine {

    public static width = 0;
    public static height = 0;

    public static readonly APP_NAME = "DemoLobby";
    /**
     * 热更新缓存目录名称，热更新资源会存放在这个目录下
     * 这个目录是一个约定的名称，表示热更新资源的缓存目录。热更新资源是指游戏在运行时可以动态下载和更新的资源，这些资源通常存放在服务器上。热更新缓存目录名称可以根据实际需求进行修改，但建议保持一致性，以便于管理和维护。
     * 更新时，不会主动设置这个名字，这个名字会被写死在main.js中，直接生效，所以，如果你要修改的话，请一定记得修改extensions/after_build_preload_jsbundle 中对于native打包的部分代码
     */
    public static readonly HOT_UPDATE_CACHE_FOLDER_NAME = "DemoLobby";

    public static readonly TEMP_CHANNEL_STR = "%{CHANNEL}";
    public static readonly TEMP_HOT_UPDATE_ENV_STR = "%{HOT_UPDATE_ENV}";
    public static readonly TEMP_VERSION_STR = "%{VERSION}";
    /**
     * 热更新主包名称，不是这个名称的包，统一认为是一个分包资源
     * 热更新主包名称是一个约定的名称，表示主包的名称。主包是指游戏的核心功能和资源，通常是最重要的部分。热更新主包名称可以根据实际需求进行修改，但建议保持一致性，以便于管理和维护。
     */
    public static readonly HOT_UPDATE_MAIN_PACKAGE_NAME = "main";

    public static readonly ResolutionMinLongestSide = 1280;
    public static readonly ResolutionMaxLongestSide = 1600;
    public static readonly ResolutionMinShortestSide = 720;
    public static readonly ResolutionMaxShortestSide = 960;
    /**
     * 朝向
     */
    public static orientation = macro.ORIENTATION_PORTRAIT;
    /**
     * 设计分辨路宽度
     */
    public static ResolutionWidth = this.ResolutionMinShortestSide;
    /**
     * 设计分辨率高度
     */
    public static ResolutionHeight = this.ResolutionMinLongestSide;
    /**
     * 当前渠道，自动模式，请勿修改
     */
    public static readonly CHANNEL = "channel0";
    /**
     * 当前热更新环境，自动模式，请勿修改
     */
    public static readonly HOT_UPDATE_ENV = "local";
    /**
     * 这是当前的版本号，自动模式，请勿修改
     */
    public static readonly VERSION = "1.0.0..0";

    /**
     * 异步方法，请使用await标记
     * 等待指定帧后继续执行
     * 注意：每一帧的时间为理论时间，若DC过高或者游戏逻辑耗时严重，会导致时间不正确
     * @param frame 帧数量，默认为1
     */
    public static async WaitFrame(frame: number = 1) {
        const fr = game.frameTime * frame;
        //bDebug && console.log("期望等待的时间：",fr);
        return new Promise<any>((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, fr);
        });
    }
}