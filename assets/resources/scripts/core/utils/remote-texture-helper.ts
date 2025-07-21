import * as cc from 'cc';
import { native } from 'cc';
import { NATIVE } from 'cc/env';
import { bDebug, EmptyCallback, HOT_UPDATE_CACHE_FOLDER_NAME } from '../define';
import { Md5 } from './md5';
const CACHE_STORAGE_KEY = "remote-texture-cache-aa";
/**
 * 远程纹理帮助类
 */
export default class RemoteTextureHelper {
    /**
     * 远程纹理缓存
     */
    protected static _remoteSpriteFrames: { [url: string]: cc.SpriteFrame } = {};
    /**
     * native缓存目录
     */
    protected static _nativeCacheDir: string = '';

    /**
     * 下载列表标记
     */
    protected static _downloaderlist: { [url: string]: boolean } = {};

    /**
     * 预下载远程资源
     * @param urls 
     */
    public static preDownloads(urls : string[]) {
        let spf_urls: string[] = [];
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            if (this._remoteSpriteFrames[url]) {
                //已经有的，不下载
                continue;
            }
            if(this._downloaderlist[url]) {
                //正在下载的，不处理
                continue;
            }
            spf_urls.push(url);
        }
        if(spf_urls.length == 0) {
            return;
        }
        bDebug && console.log("RemoteTextureHelper preDownloads: ", spf_urls);
        for (let i = 0; i < spf_urls.length; i++) {
            this.loadRemote(spf_urls[i]);
        }
    }

    /**
     * 获取远程纹理
     * @param url 
     * @returns 
     */
    public static async getRemoteTexture(url: string, args?: any): Promise<[cc.SpriteFrame, any] | null> {
        if (this._remoteSpriteFrames[url]) {
            return [this._remoteSpriteFrames[url], args];
        }
        if (NATIVE) {
            const localPath = this.getLocalPath(url);
            if (native.fileUtils.isFileExist(localPath)) {
                //如果本地存在，则直接加载本地资源
                bDebug && console.log("RemoteTextureHelper load from local: ", localPath);
                return this.loadLocal(localPath, url, args);
            } else {
                //如果本地不存在，则加载远程资源
                if (!this._downloaderlist[url]) {
                    bDebug && console.log("RemoteTextureHelper load from remote1: ", url);
                    this._downloaderlist[url] = true; //标记为正在下载
                    //开始下载远程资源
                    return this.loadRemote(url, args);
                } else {
                    bDebug && console.log("RemoteTextureHelper load from remote2: ", url);
                    //如果正在下载，使用轮询的方式等待下载完成
                    return new Promise((resolve) => {
                        let setIntervaiId = setInterval(() => {
                            if (this._remoteSpriteFrames[url]) {
                                setIntervaiId && clearInterval(setIntervaiId);
                                setIntervaiId = null;
                                bDebug && console.log("RemoteTextureHelper load from remote3: ", url);
                                resolve([this._remoteSpriteFrames[url], args]);
                                return;
                            }

                            if (!this._downloaderlist[url]) {//下载失败
                                setIntervaiId && clearInterval(setIntervaiId);
                                setIntervaiId = null;
                                resolve(null);
                            }
                        }, 100);
                    });
                }
            }
        } else {
            //非native平台，直接加载远程资源
            return this.loadRemote(url, args);
        }
    }

    /**
     * 真加载远程资源
     * @param url 
     * @param args 
     * @returns 
     */
    protected static async loadRemote(url: string, args?: any): Promise<[cc.SpriteFrame, any] | null> {

        return new Promise((resolve) => {
            //如果是native平台，则需要将资源保存到本地
            if (NATIVE) {
                const localPath = this.getLocalPath(url);
                var downloader = new native.Downloader();
                downloader.onSuccess = (task: native.DownloadTask) => {
                    console.log("Remote texture downloaded successfully: ", url);
                    // 下载成功后，加载本地资源
                    resolve(this.loadLocal(localPath, url, args));
                }

                downloader.onError = function (task: native.DownloadTask, errorCode: number, errorCodeInternal: number, errorStr: string) {
                    console.error("Failed to download remote texture: ", url, " Error: ", errorStr);
                    delete this._downloaderlist[url];
                    resolve(null);
                }
                downloader.createDownloadTask(url, localPath);
            } else {
                cc.assetManager.loadRemote(url, (err, imageAsset: cc.ImageAsset) => {
                    if (err) {
                        console.error("Failed to load remote icon: ", url, err);
                        resolve(null);
                        return;
                    }
                    // bDebug && console.log("Browser Remote texture loaded successfully: ", url);
                    const texture = new cc.Texture2D();
                    texture.image = imageAsset;
                    const spriteFrame = new cc.SpriteFrame();
                    spriteFrame.texture = texture;
                    spriteFrame.packable = false;
                    this._remoteSpriteFrames[url] = spriteFrame;
                    resolve([spriteFrame, args]);
                });
            }

        });
    }

    //--------------------------------------------NATIVE--------------------------------------------//
    /**
     * 根据远程图片的url，获取一个在本地缓存目录中的路径
     * 会将这个url进行md5加密，作为文件名
     * @param url 
     * @returns 
     */
    private static getLocalPath(url: string): string {
        if (!NATIVE) {
            return '';
        }
        const ext = this.getFileExtension(url);
        const hashed = Md5.hashStr(url);
        return `${this.getNativeCacheDir()}${hashed}${ext}`;
    }

    private static getFileExtension(url: string): string {
        const result = url.match(/\.\w+$/);
        return result ? result[0] : '.png';
    }
    /**
     * 获取native下远程资源缓存目录
     * @returns 
     */
    public static getNativeCacheDir(): string {
        if (!NATIVE) {
            return;
        }
        if (this._nativeCacheDir != "") {
            return this._nativeCacheDir;
        }
        let writePath = native.fileUtils.getWritablePath();
        if (!writePath.endsWith("/")) {
            writePath += "/";
        }
        writePath += HOT_UPDATE_CACHE_FOLDER_NAME + "/" + CACHE_STORAGE_KEY + "/";
        if (!native.fileUtils.isDirectoryExist(writePath)) {
            native.fileUtils.createDirectory(writePath);
        }
        this._nativeCacheDir = writePath;
        bDebug && console.log("RemoteTextureHelper getNativeCacheDir: " + this._nativeCacheDir);
        return this._nativeCacheDir;
    }
    /**
     * 清空所有远程资源的缓存
     * @returns 
     */
    static clearCache(): void {
        if (!NATIVE) {
            return;
        }
        if (this._nativeCacheDir == "") {
            this.getNativeCacheDir();
        }
        if (native.fileUtils.isDirectoryExist(this._nativeCacheDir)) {
            native.fileUtils.removeDirectory(this._nativeCacheDir);
            native.fileUtils.createDirectory(this._nativeCacheDir);
        }
    }
    /**
     * 从本地加载
     * @param localurl 
     * @param url 
     * @param args 
     * @returns 
     */
    protected static async loadLocal(localurl: string, url: string, args?: any): Promise<[cc.SpriteFrame, any] | null> {
        return new Promise((resolve) => {
            cc.assetManager.loadRemote(localurl, (err, imageAsset: cc.ImageAsset) => {
                if (err) {
                    console.error("Failed to load remote icon: ", localurl, err);
                    resolve(null);
                    return;
                }
                const texture = new cc.Texture2D();
                texture.image = imageAsset;
                const spriteFrame = new cc.SpriteFrame();
                spriteFrame.texture = texture;
                spriteFrame.packable = false;
                this._remoteSpriteFrames[url] = spriteFrame;
                if (this._downloaderlist[url]) delete this._downloaderlist[url]; // 下载完成后，移除下载标记
                resolve([spriteFrame, args]);
            });
        });
    }
}
