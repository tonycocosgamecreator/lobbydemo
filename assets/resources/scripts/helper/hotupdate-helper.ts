import { log , native , error  } from "cc";
import { NATIVE } from "cc/env";
import BaseDefine from "../base-define";
import { IHotUpdateListener } from "./ihotupdate-listener";
import { game } from "cc";
import HotUpdateDatas from "./hotupdate-datas";

interface default_manifest_update_all  {
    packageUrl: string,
    remoteManifestUrl: string,
    remoteVersionUrl: string,
    version: string,
    assets: {}
};
/**
 * 热更新管理器
 */
export default class HotUpdateHelper {
    
    /**
     * 热更新文件夹
     */
    private _savePath : string = '';
    private _assetsManager : native.AssetsManager | null = null;
    private _listener : IHotUpdateListener | null = null;
    /**
     * 是否正在更新
     */
    private _isUpdating : boolean = false;
    /**
     * 默认的manifest文件
     */
    private _defaultManifest : default_manifest_update_all = {
        packageUrl: "",
        remoteManifestUrl: "",
        remoteVersionUrl: "",
        version: "1.0.0.0",
        assets: {}
    };
    /**
     * 成功失败都要回调的函数
     */
    private _callIfCompleteOrFail : (bundleName : string,success : boolean) =>void | null = null;

    constructor(public mName : string,listener? : IHotUpdateListener,func? : () =>void){
        this._listener = listener;
        this._callIfCompleteOrFail = func;
        this.init();
    }

    public destroy(){
        this._isUpdating = false;
        this._retryCount = 0;
        this._callIfCompleteOrFail = null;
        if(!this._assetsManager){
            return;
        }
        this._assetsManager.setEventCallback(null!);
        //这里需要回收对象，我要检查下native的代码
        this._assetsManager = null;
    }

    private init(){
        if(!NATIVE){
            return;
        }
        // 热更新文件夹
        let writePath = native.fileUtils.getWritablePath();
        if(!writePath.endsWith("/")){
            writePath += "/";
        }
        writePath += BaseDefine.HOT_UPDATE_CACHE_FOLDER_NAME + "/";
        if(!native.fileUtils.isDirectoryExist(writePath)){
            native.fileUtils.createDirectory(writePath);
        }
        this._savePath = writePath;
        console.log("savePath   = " ,this._savePath);
    }

    public checkUpdate(){
        if(!NATIVE){
            return;
        }
        const urls = HotUpdateDatas.getRemoteUrls();
        if(!urls){
            console.error("没有找到远程地址，请检查！");
            this._callIfCompleteOrFail && this._callIfCompleteOrFail(this.mName,false);
            return;
        }
        const url0 = HotUpdateDatas.getUrl(urls[0]);
        if(!this._assetsManager){
            this._assetsManager = native.AssetsManager.create('',this._savePath,this.mName);
        }
        if(this._isUpdating){
            console.error("正在更新中，请稍等！");
            
            return;
        }
        
        const state = this._assetsManager?.getState();
        let versionManifestUrl = this._savePath + this.mName + ".manifest";
        if(!native.fileUtils.isFileExist(versionManifestUrl)){
            //如果更新目录没有，则找包体里面自带的
            versionManifestUrl = this.mName + ".manifest";
            if(!native.fileUtils.isFileExist(versionManifestUrl)){
                //如果包体里面也没有，则清空
                versionManifestUrl = '';
            }
        }
        
        if(state == native.AssetsManager.State.UNINITED){
            if(versionManifestUrl == ''){
                //如果一直没有找到，说明我需要直接更新全部
                
                this._defaultManifest.packageUrl = url0;
                this._defaultManifest.remoteManifestUrl = url0 + this.mName + ".manifest";
                this._defaultManifest.remoteVersionUrl = url0 + this.mName + ".manifest";
                var manifest = new native.Manifest(JSON.stringify(this._defaultManifest), this._savePath);
                this._assetsManager.loadLocalManifest(manifest, this._savePath);
                console.log("没有找到manifest文件，直接更新全部内容。",this._defaultManifest);
            }else{
                this._assetsManager.loadLocalManifest(versionManifestUrl);
            }
        }
        if (!this._assetsManager.getLocalManifest() || !this._assetsManager.getLocalManifest().isLoaded()) {
            console.error("没有找到本地的manifest文件，请检查！",versionManifestUrl);
            this._listener && this._listener.onHotUpdateFailed(native.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST);
            this._callIfCompleteOrFail && this._callIfCompleteOrFail(this.mName,false);
            return;
        }
        this._assetsManager.setEventCallback(this.checkCb.bind(this));
        this._assetsManager.checkUpdate();
        this._isUpdating = true;
        console.log("开始检查更新...");
    }


    private checkCb(event : native.EventAssetsManager) {
        let isNeedRestartGame = false;
        let isFailed = false;
        let isCanRetry = false;
        console.log("热更新事件回调",event.getEventCode(),event.getMessage());
        switch (event.getEventCode()) {
            case native.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                console.error("没有找到本地的manifest文件，请检查！");
                isFailed = true;
                this._listener && this._listener.onHotUpdateFailed(native.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST);
                this._callIfCompleteOrFail && this._callIfCompleteOrFail(this.mName,false);
                break;
            case native.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                console.error("下载manifest文件失败，请检查！");
                isFailed = true;
                this._listener && this._listener.onHotUpdateFailed(native.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST);
                this._callIfCompleteOrFail && this._callIfCompleteOrFail(this.mName,false);
                break;
            case native.EventAssetsManager.ERROR_PARSE_MANIFEST:
                console.error("解析manifest文件失败，请检查！");
                isFailed = true;
                this._listener && this._listener.onHotUpdateFailed(native.EventAssetsManager.ERROR_PARSE_MANIFEST);
                this._callIfCompleteOrFail && this._callIfCompleteOrFail(this.mName,false);
                break;
            case native.EventAssetsManager.ALREADY_UP_TO_DATE:
                console.log("已经是最新版本了！");
                this._isUpdating = false;
                isNeedRestartGame = false;
                this._listener && this._listener.onHotUpdateComplete();
                this._callIfCompleteOrFail && this._callIfCompleteOrFail(this.mName,true);
                break;
            case native.EventAssetsManager.NEW_VERSION_FOUND:
                console.log("发现新版本了！");
                this._listener && this._listener.onHotUpdateStart();
                this._assetsManager.update();
                break;
            case native.EventAssetsManager.UPDATE_PROGRESSION:
                const byteProgress = event.getPercent();
                const fileProgress = event.getPercentByFile();

                const fileLabelString = event.getDownloadedFiles() + ' / ' + event.getTotalFiles();
                const byteLabelString = event.getDownloadedBytes() + ' / ' + event.getTotalBytes();
                console.log(byteProgress,fileProgress,fileLabelString, byteLabelString);
                var msg = event.getMessage();
                if (msg) {
                    console.log(event.getPercent()/100 + '% : ' + msg);
                }
                this._listener && this._listener.onHotUpdateProgress(event);
                break;
            case native.EventAssetsManager.ERROR_UPDATING:
                console.error("1更新失败，请检查！", event.getMessage());
                isFailed = true;
                this._listener && this._listener.onHotUpdateFailed(native.EventAssetsManager.ERROR_UPDATING);
                this._callIfCompleteOrFail && this._callIfCompleteOrFail(this.mName,false);
                break;
            case native.EventAssetsManager.UPDATE_FINISHED:
               console.log("更新完成！");
                this._isUpdating = false;
                isNeedRestartGame = true;
                this._listener && this._listener.onHotUpdateComplete();
                this._callIfCompleteOrFail && this._callIfCompleteOrFail(this.mName,true);
                break;
            case native.EventAssetsManager.UPDATE_FAILED:
                console.error("2更新失败，请检查！", event.getMessage());
                isFailed = true;
                isCanRetry = true;
                break;
            case native.EventAssetsManager.ERROR_DECOMPRESS:
                console.error("3解压失败，请检查！", event.getMessage());
                isFailed = true;
                this._listener && this._listener.onHotUpdateFailed(native.EventAssetsManager.ERROR_DECOMPRESS);
                this._callIfCompleteOrFail && this._callIfCompleteOrFail(this.mName,false);
                break;
            case 11:
                //@fish 大版本更新，弹窗！
                break;
        }
        if(isNeedRestartGame && this.mName == BaseDefine.HOT_UPDATE_MAIN_PACKAGE_NAME){
            //只有主包才有资格唤起重启
            let searchPaths = native.fileUtils.getSearchPaths();
            let newPaths = [this._savePath];
            // 重新设置搜索路径
            for(let i = 0;i<newPaths.length;i++){
                const ph = newPaths[i];
                if(searchPaths.indexOf(ph) == -1){
                    //将ph插入到searchPaths的最前面
                    searchPaths.unshift(ph);
                }else{
                    //如果已经有这个路径了，则删除
                    searchPaths.splice(searchPaths.indexOf(ph),1);
                    //重新插入到最前面
                    searchPaths.unshift(ph);
                }
            }
            const content = JSON.stringify(searchPaths);
            console.log("searchPaths:",content);    
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            localStorage.setItem('HotUpdateSearchPaths', content);
            //记录最后更新时间和版本号
            const versionData = {
                last_hot_update_time: new Date().getTime(),
                last_hot_update_version: this._assetsManager?.getRemoteManifest().getVersion()
            };
            localStorage.setItem('HotUpdateVersionData', JSON.stringify(versionData));
            native.fileUtils.setSearchPaths(searchPaths);
            this.destroy();
            setTimeout(() => {
                game.restart();
            }, 500);
            return;
        }
        if(isFailed){
            this._isUpdating = false;
            if(isCanRetry){
                this._retry();
            }else{
                this._callIfCompleteOrFail && this._callIfCompleteOrFail(this.mName,false);
                this.destroy();
            }
        }
    }
    
    public addListener(listener: IHotUpdateListener) {
        if(!this._listener){
            this._listener = listener;
        }else{
            console.error("已经添加过监听器了，请检查！");
        }
    }

    public removeListener() {
        if(this._listener){
            this._listener = null;
        }else{
            console.error("没有添加过监听器，请检查！");
        }
    }

    private _retryCount = 0;

    private _retryMaxCount = 3;

    private _retry() {
        this._retryCount++;
        if (this._retryCount > this._retryMaxCount) {
            console.error("重试次数超过最大次数，请检查！");
            this._isUpdating = false;
            this._listener && this._listener.onHotUpdateFailed(-2);
            this.destroy();
            return;
        }
        console.log("第" + this._retryCount + "次重试更新...");
        this._assetsManager.downloadFailedAssets();
    }
}