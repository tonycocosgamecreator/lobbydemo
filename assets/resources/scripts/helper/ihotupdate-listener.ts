import { native } from "cc";

export interface IHotUpdateListener {
    /**
     * 热更新开始
     */
    onHotUpdateStart(): void;
    /**
     * 热更新进度
     */
    onHotUpdateProgress(event : native.EventAssetsManager): void;
    /**
     * 热更新完成
     */
    onHotUpdateComplete(): void;
    /**
     * 热更新失败
     * @code 错误码 native.EventAssetsManager.ERROR_xxxx
     * -1 : 未知错误
     * -2 : 重试次数超过最大次数
     */
    onHotUpdateFailed(code : number): void;
}