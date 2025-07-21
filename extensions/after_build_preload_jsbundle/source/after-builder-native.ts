import path from "path";
import { IBuildResult, ITaskOptions } from "../@types";
import fs from "fs-extra";
import crypto from "crypto";
import JSZip from "jszip";
import Tools from "./tools";
import { channel } from "diagnostics_channel";
interface ISelfBuildConfigs {
    /**
     * 所有需要携带的bundle的名字
     */
    "bundles-contain" : string[];
    /**
     * 远程服务器地址列表
     */
    remotes : string[];
    /**
     * 当前打包的渠道
     */
    channel : string;
    /**
     * 当前平台的版本号
     */
    version : string;
    /**
     * 热更新环境
     */
    hotupdate_env : string; 
}

interface IAsset {
    md5 : string;       //资源的 md5 值
    size : number;      //资源的大小
    compressed? : boolean;//[可选项] 如果值为 true，文件被下载后会自动被解压，目前仅支持 zip 压缩格式
}

interface IManifest {
    packageUrl :  string;        //远程资源的本地缓存根路径
    remoteVersionUrl:   string; //[可选项] 远程版本文件的路径，用来判断服务器端是否有新版本的资源
    remoteManifestUrl :   string;//远程资源 Manifest 文件的路径，包含版本信息以及所有资源信息
    version :             string//资源的版本 x.x.x.x
    engineVersion :       string//引擎版本
    assets:              {
        [key : string] : IAsset    //key 为资源的相对路径，value 为资源的 md5 值和大小
    };
    searchPaths :   string[]      //需要添加到 FileUtils 中的搜索路径列表
}

const inject_script = `
(function () {
    if (typeof window.jsb === 'object') {
        var folder = "IN_AA_LOBBY";
        var writablePath = jsb.fileUtils.getWritablePath();
        var storagePath = writablePath + folder;
        if(!window.jsb.fileUtils.isDirectoryExist(storagePath)){
            window.jsb.fileUtils.createDirectory(storagePath);
        }
        var searchPaths = window.jsb.fileUtils.getSearchPaths();
        searchPaths.unshift(storagePath);
        window.jsb.fileUtils.setSearchPaths(searchPaths);
        console.log("searchPaths", searchPaths);
        var hotUpdateSearchPaths = localStorage.getItem('HotUpdateSearchPaths');
        if (hotUpdateSearchPaths) {
            var paths = JSON.parse(hotUpdateSearchPaths);
            //window.jsb.fileUtils.setSearchPaths(paths);
            localStorage.removeItem('HotUpdateSearchPaths');
            var fileList = [];
            //var storagePath = paths[0] || '';
            var tempPath = storagePath + '_temp/';
            var baseOffset = tempPath.length;

            if (window.jsb.fileUtils.isDirectoryExist(tempPath) && !window.jsb.fileUtils.isFileExist(tempPath + 'project.manifest.temp')) {
                window.jsb.fileUtils.listFilesRecursively(tempPath, fileList);
                fileList.forEach(srcPath => {
                    var relativePath = srcPath.substr(baseOffset);
                    var dstPath = storagePath + relativePath;

                    if (srcPath[srcPath.length] == '/') {
                        window.jsb.fileUtils.createDirectory(dstPath)
                    }
                    else {
                        if (window.jsb.fileUtils.isFileExist(dstPath)) {
                            window.jsb.fileUtils.removeFile(dstPath)
                        }
                        window.jsb.fileUtils.renameFile(srcPath, dstPath);
                    }
                })
                window.jsb.fileUtils.removeDirectory(tempPath);
            }
        }
    }
})();
`;

export default class AfterBuilderNative {
    private static _config : ISelfBuildConfigs | null = null;

    public static async onBeforeBuild(options: ITaskOptions, result: IBuildResult) {
        let pkg = options.packages['after_build_preload_jsbundle'];
        if(!pkg){
            console.error("after_build_preload_jsbundle not found in options.packages");
            return;
        }
        
        const remoteConfigPath = path.join(Editor.Project.path, "assets", "main", "configs","remotes.json");
        const remoteConfig = fs.readJSONSync(remoteConfigPath);
        let platform = "";
        if(options.packages["android"]){
            platform = "android";
        }else if(options.packages["ios"]){
            platform = "ios";
        }else if(options.packages["windows"]){
            platform = "windows";
        }
        if(platform == ""){
            console.error("当前平台不支持~",options.packages);
            return;
        }
        const selectChannel = pkg.selectChannel;
        if(selectChannel == ""){
            console.error("请选择打包Channel~");
            return;
        }
        const channel_config = remoteConfig[selectChannel];
        if(!channel_config){
            console.error("没有找到当前渠道的配置~",selectChannel,remoteConfig);
            return;
        }
        const env               = pkg.selectEnv;
        const remotesAddress    = channel_config[env];
        if(!remotesAddress){
            console.error("没有找到当前环境的配置~",env,channel_config);
            return;
        }

        const filePath = path.join(Editor.Project.path, "_config", "build_configs", selectChannel,platform,env + ".json");
        this._config = fs.readJSONSync(filePath) as ISelfBuildConfigs;
        if(!this._config){
            console.error("读取配置文件失败~",filePath);
            return;
        }
        this._config.remotes = remotesAddress;
        let version = this._config.version;
        const definePath = path.join(Editor.Project.path, "assets", "main", "scripts","base-define.ts");
        let content = fs.readFileSync(definePath, "utf-8");
        //将public static readonly CHANNEL = 到;的字符串替换为 public static readonly CHANNEL = "selectChannel";
        content = content.replace(/public static readonly CHANNEL = .*;/g, 'public static readonly CHANNEL = "' + selectChannel + '";');
        //将public static readonly HOT_UPDATE_ENV = 到;的字符串替换为 public static readonly HOT_UPDATE_ENV = "selectEnv";
        content = content.replace(/public static readonly HOT_UPDATE_ENV = .*;/g, 'public static readonly HOT_UPDATE_ENV = "' + env + '";');
        //将public static readonly VERSION = 到;的字符串替换为 public static readonly VERSION = "newVersion";
        content = content.replace(/public static readonly VERSION = .*;/g, 'public static readonly VERSION = "' + version + '";');
        fs.writeFileSync(definePath, content, "utf-8");
    }

    /**
     * 
     * @param options 
     * @param result 
     */
    public static async onAfterBuild(options: ITaskOptions, result: IBuildResult) {
        let pkgName = "";
        let pkg = options.packages['after_build_preload_jsbundle'];
        if(!pkg){
            console.error("after_build_preload_jsbundle not found in options.packages");
            return;
        }
        const outputName = options.outputName;
        let platform = "";
        if(options.packages["android"]){
            platform = "android";
        }else if(options.packages["ios"]){
            platform = "ios";
        }else if(options.packages["windows"]){
            platform = "windows";
        }
        if(platform == ""){
            console.error("当前平台不支持~",options.packages);
            return;
        }
        const channel = pkg.selectChannel;
        if(channel == ""){
            console.error("请选择打包Channel~");
            return;
        }
        const env = pkg.selectEnv;

        const filePath = path.join(Editor.Project.path, "_config", "build_configs", channel,platform,env + ".json");
        console.warn("当前打包平台->",platform,outputName);
        const buildPath = path.join(Editor.Project.path, "build", outputName);
        if(!fs.existsSync(buildPath)){
            console.error("build path not found ->",buildPath);
            return;
        }
        const buildRootPath = path.join(buildPath, "data");
        const assetsPath = path.join(buildRootPath, "assets");
        const buildRemoteRootPath = path.join(buildPath, "remotes");
        const remotesPath = path.join(buildRemoteRootPath,"assets");
        if(!fs.existsSync(assetsPath)){
            console.error("assets path not found ->",assetsPath);
            return;
        }
        let containBundles : string[] = this._config["bundles-contain"];
        fs.ensureDirSync(remotesPath);
        //获取assetsPath下所有文件夹的名字
        const folders = fs.readdirSync(assetsPath);
        let unContainBundles : string[] = [];
        for(let i = 0;i<folders.length;i++){
            const folder = folders[i];
            if(containBundles.indexOf(folder) == -1){
                unContainBundles.push(folder);
            }
        }
        //将unContainBundles中的文件夹移动到remotesPath下
        //获取所有assetsPath下的文件和他的md5
        let allFiles : {[name : string] : IAsset} = {};
        let version = this._config.version;
        let versionFilePath = path.join(Editor.Project.path,"build_results",channel,platform,env,version);
        fs.ensureDirSync(versionFilePath);
        let zips : {[bundleName : string] : {filePath : string,zip : JSZip}} = {};
        for(let i = 0;i<unContainBundles.length;i++){
            const folder = unContainBundles[i];
            const srcPath = path.join(assetsPath, folder);
            const destPath = path.join(remotesPath, folder);
            fs.moveSync(srcPath, destPath, {overwrite: true});
            this.getAllFiles(buildRemoteRootPath,destPath,allFiles);
            //写到打包版本文件夹下，这个文件需要在远程服务器上使用，所以所有文件都得打进去
            this.writeOneManifest(platform,env,channel, folder,allFiles,versionFilePath);
            //分包系统不需要写到本地，因为本地没有而远程有的时候才会出现直接下载zip的情况
            //this.writeOneManifest(folder,allFiles,buildRootPath,true);
            //将文件夹打包成zip文件
            const zipFileName = folder + "." + version + ".zip";
            const zipFilePath = path.join(versionFilePath, "assets", zipFileName);
            fs.ensureDirSync(path.dirname(zipFilePath));
            const zip = new JSZip();
            Tools.downloadAsZip(destPath,zip, [], [], true);
            zips[folder] = {
                filePath : zipFilePath,
                zip : zip
            };
            allFiles = {};
        }
        this.getAllFiles(buildRootPath,buildRootPath,allFiles);
        //写到打包版本文件夹下
        this.writeOneManifest(platform,env,channel,"main",allFiles,versionFilePath);
        //写到data文件夹下
        this.writeOneManifest(platform,env,channel,"main",allFiles,buildRootPath);
        

        //将data文件夹下的所有文件复制到build_results/platform/version下
        const dataPath = path.join(buildPath, "data");
        //执行对main.js的注入
        const mainJsPath = path.join(dataPath, "main.js");
        let content = fs.readFileSync(mainJsPath, "utf-8");
        content = inject_script + content;
        fs.writeFileSync(mainJsPath, content, "utf-8");
        console.warn("main.js注入完成->",mainJsPath);
        const dataFiles = fs.readdirSync(dataPath);
        for(let i = 0;i<dataFiles.length;i++){
            const file = dataFiles[i];
            const srcPath = path.join(dataPath, file);
            //复制文件到build_results/platform/version下
            const destPath = path.join(versionFilePath, file);
            fs.ensureDirSync(path.dirname(destPath));
            fs.copySync(srcPath, destPath, {overwrite: true});
        }

        //写完以后，将remotesPath下的文件夹移动到build_results/platform/version下
        for(let i = 0;i<unContainBundles.length;i++){
            const folder = unContainBundles[i];
            const srcPath = path.join(remotesPath, folder);
            const destPath = path.join(versionFilePath, "assets", folder);
            fs.moveSync(srcPath, destPath, {overwrite: true});
        }
        //删除remotesPath
        fs.removeSync(remotesPath);

        // for(let i = 0;i<unContainBundles.length;i++){
        //     const folder = unContainBundles[i];
        //     const zipInfo = zips[folder];
        //     const zip = zipInfo.zip;
        //     const zipFilePath = zipInfo.filePath;
        //     //将zip文件写入到zipFilePath
        //     const content = await zip.generateAsync({
        //         type: "nodebuffer",//nodejs用
        //         compression: "DEFLATE",
        //         compressionOptions: {
        //             level : 9,
        //         }
        //     });
        //     fs.writeFileSync(zipFilePath, content);
        // }


        const arr = version.split(".");
        const last = arr[arr.length - 1];
        const newVersion = arr.slice(0,arr.length - 1).join(".") + "." + (parseInt(last) + 1);
        //将版本号加1
        this._config.version = newVersion;
        //将版本号写入配置文件
        fs.writeJSONSync(filePath,this._config,{spaces: 4});
    }
    /**
     *  写入manifest文件
     * @param pName  包名字
     * @param allFiles  所有需要写入得文件名
     * @param versionFilePath 需要写入得路径
     * @param isContained 是否携带
     */
    private static writeOneManifest(platform : string,env : string,channel : string,pName : string,allFiles : {[name : string] : IAsset},versionFilePath : string){
        const manifest : IManifest = {
            packageUrl : this._config.remotes[0]+ channel + "/" + platform + "/" + env + "/",
            remoteVersionUrl : "",
            remoteManifestUrl : this._config.remotes[0] + channel + "/" + platform + "/" + env + "/" + pName + ".manifest",
            version : this._config.version,
            engineVersion : "3.8.3",
            assets : allFiles,
            searchPaths : []
        }
        const manifestPath = path.join(versionFilePath,pName + ".manifest");
        fs.writeJSONSync(manifestPath,manifest,{spaces: 4});
        console.warn("写入文件->",manifestPath);
        // const mainVersionManifest : IManifest = {
        //     packageUrl : this._config.remotes[0]+ channel + "/" + platform + "/" + env + "/",
        //     remoteVersionUrl : "",
        //     remoteManifestUrl : this._config.remotes[0] + channel + "/" +platform + "/" + env + "/" + pName + ".manifest",
        //     version : this._config.version,
        //     engineVersion : "3.8.3",
        //     assets : {},
        //     searchPaths : []
        // }
        // //写入main_version.manifest文件
        // const mainVersionManifestPath = path.join(versionFilePath,pName + "_version.manifest");
        // fs.writeJSONSync(mainVersionManifestPath,mainVersionManifest,{spaces: 4});
        // console.warn("写入文件->",mainVersionManifestPath);
    }


    private static getAllFiles(rootPath : string,folder : string,allFiles : {[name : string] : IAsset}){
        const files = fs.readdirSync(folder);
        for(let i = 0;i<files.length;i++){
            const file = files[i];
            const filePath = path.join(folder, file);
            const stat = fs.statSync(filePath);
            if(stat.isDirectory()){
                this.getAllFiles(rootPath,filePath,allFiles);
            }else{
                //const md5 = this.getFileMD5(filePath);
                const data = fs.readFileSync(filePath);
                const md5 = crypto.createHash('md5').update(data).digest('hex');
                //获取filePath相对于rootPath的路径
                const relativePath = path.relative(rootPath, filePath);
                //将相对路径中的\替换为/
                const relativePath2 = relativePath.replace(/\\/g, '/');
                allFiles[relativePath2] = {
                    "md5" : md5,
                    "size" : stat.size
                };
            }
        }
    }
}