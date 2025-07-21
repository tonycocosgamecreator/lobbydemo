"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const crypto_1 = __importDefault(require("crypto"));
const jszip_1 = __importDefault(require("jszip"));
const tools_1 = __importDefault(require("./tools"));
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
class AfterBuilderNative {
    static onBeforeBuild(options, result) {
        return __awaiter(this, void 0, void 0, function* () {
            let pkg = options.packages['after_build_preload_jsbundle'];
            if (!pkg) {
                console.error("after_build_preload_jsbundle not found in options.packages");
                return;
            }
            const remoteConfigPath = path_1.default.join(Editor.Project.path, "assets", "main", "configs", "remotes.json");
            const remoteConfig = fs_extra_1.default.readJSONSync(remoteConfigPath);
            let platform = "";
            if (options.packages["android"]) {
                platform = "android";
            }
            else if (options.packages["ios"]) {
                platform = "ios";
            }
            else if (options.packages["windows"]) {
                platform = "windows";
            }
            if (platform == "") {
                console.error("当前平台不支持~", options.packages);
                return;
            }
            const selectChannel = pkg.selectChannel;
            if (selectChannel == "") {
                console.error("请选择打包Channel~");
                return;
            }
            const channel_config = remoteConfig[selectChannel];
            if (!channel_config) {
                console.error("没有找到当前渠道的配置~", selectChannel, remoteConfig);
                return;
            }
            const env = pkg.selectEnv;
            const remotesAddress = channel_config[env];
            if (!remotesAddress) {
                console.error("没有找到当前环境的配置~", env, channel_config);
                return;
            }
            const filePath = path_1.default.join(Editor.Project.path, "_config", "build_configs", selectChannel, platform, env + ".json");
            this._config = fs_extra_1.default.readJSONSync(filePath);
            if (!this._config) {
                console.error("读取配置文件失败~", filePath);
                return;
            }
            this._config.remotes = remotesAddress;
            let version = this._config.version;
            const definePath = path_1.default.join(Editor.Project.path, "assets", "main", "scripts", "base-define.ts");
            let content = fs_extra_1.default.readFileSync(definePath, "utf-8");
            //将public static readonly CHANNEL = 到;的字符串替换为 public static readonly CHANNEL = "selectChannel";
            content = content.replace(/public static readonly CHANNEL = .*;/g, 'public static readonly CHANNEL = "' + selectChannel + '";');
            //将public static readonly HOT_UPDATE_ENV = 到;的字符串替换为 public static readonly HOT_UPDATE_ENV = "selectEnv";
            content = content.replace(/public static readonly HOT_UPDATE_ENV = .*;/g, 'public static readonly HOT_UPDATE_ENV = "' + env + '";');
            //将public static readonly VERSION = 到;的字符串替换为 public static readonly VERSION = "newVersion";
            content = content.replace(/public static readonly VERSION = .*;/g, 'public static readonly VERSION = "' + version + '";');
            fs_extra_1.default.writeFileSync(definePath, content, "utf-8");
        });
    }
    /**
     *
     * @param options
     * @param result
     */
    static onAfterBuild(options, result) {
        return __awaiter(this, void 0, void 0, function* () {
            let pkgName = "";
            let pkg = options.packages['after_build_preload_jsbundle'];
            if (!pkg) {
                console.error("after_build_preload_jsbundle not found in options.packages");
                return;
            }
            const outputName = options.outputName;
            let platform = "";
            if (options.packages["android"]) {
                platform = "android";
            }
            else if (options.packages["ios"]) {
                platform = "ios";
            }
            else if (options.packages["windows"]) {
                platform = "windows";
            }
            if (platform == "") {
                console.error("当前平台不支持~", options.packages);
                return;
            }
            const channel = pkg.selectChannel;
            if (channel == "") {
                console.error("请选择打包Channel~");
                return;
            }
            const env = pkg.selectEnv;
            const filePath = path_1.default.join(Editor.Project.path, "_config", "build_configs", channel, platform, env + ".json");
            console.warn("当前打包平台->", platform, outputName);
            const buildPath = path_1.default.join(Editor.Project.path, "build", outputName);
            if (!fs_extra_1.default.existsSync(buildPath)) {
                console.error("build path not found ->", buildPath);
                return;
            }
            const buildRootPath = path_1.default.join(buildPath, "data");
            const assetsPath = path_1.default.join(buildRootPath, "assets");
            const buildRemoteRootPath = path_1.default.join(buildPath, "remotes");
            const remotesPath = path_1.default.join(buildRemoteRootPath, "assets");
            if (!fs_extra_1.default.existsSync(assetsPath)) {
                console.error("assets path not found ->", assetsPath);
                return;
            }
            let containBundles = this._config["bundles-contain"];
            fs_extra_1.default.ensureDirSync(remotesPath);
            //获取assetsPath下所有文件夹的名字
            const folders = fs_extra_1.default.readdirSync(assetsPath);
            let unContainBundles = [];
            for (let i = 0; i < folders.length; i++) {
                const folder = folders[i];
                if (containBundles.indexOf(folder) == -1) {
                    unContainBundles.push(folder);
                }
            }
            //将unContainBundles中的文件夹移动到remotesPath下
            //获取所有assetsPath下的文件和他的md5
            let allFiles = {};
            let version = this._config.version;
            let versionFilePath = path_1.default.join(Editor.Project.path, "build_results", channel, platform, env, version);
            fs_extra_1.default.ensureDirSync(versionFilePath);
            let zips = {};
            for (let i = 0; i < unContainBundles.length; i++) {
                const folder = unContainBundles[i];
                const srcPath = path_1.default.join(assetsPath, folder);
                const destPath = path_1.default.join(remotesPath, folder);
                fs_extra_1.default.moveSync(srcPath, destPath, { overwrite: true });
                this.getAllFiles(buildRemoteRootPath, destPath, allFiles);
                //写到打包版本文件夹下，这个文件需要在远程服务器上使用，所以所有文件都得打进去
                this.writeOneManifest(platform, env, channel, folder, allFiles, versionFilePath);
                //分包系统不需要写到本地，因为本地没有而远程有的时候才会出现直接下载zip的情况
                //this.writeOneManifest(folder,allFiles,buildRootPath,true);
                //将文件夹打包成zip文件
                const zipFileName = folder + "." + version + ".zip";
                const zipFilePath = path_1.default.join(versionFilePath, "assets", zipFileName);
                fs_extra_1.default.ensureDirSync(path_1.default.dirname(zipFilePath));
                const zip = new jszip_1.default();
                tools_1.default.downloadAsZip(destPath, zip, [], [], true);
                zips[folder] = {
                    filePath: zipFilePath,
                    zip: zip
                };
                allFiles = {};
            }
            this.getAllFiles(buildRootPath, buildRootPath, allFiles);
            //写到打包版本文件夹下
            this.writeOneManifest(platform, env, channel, "main", allFiles, versionFilePath);
            //写到data文件夹下
            this.writeOneManifest(platform, env, channel, "main", allFiles, buildRootPath);
            //将data文件夹下的所有文件复制到build_results/platform/version下
            const dataPath = path_1.default.join(buildPath, "data");
            //执行对main.js的注入
            const mainJsPath = path_1.default.join(dataPath, "main.js");
            let content = fs_extra_1.default.readFileSync(mainJsPath, "utf-8");
            content = inject_script + content;
            fs_extra_1.default.writeFileSync(mainJsPath, content, "utf-8");
            console.warn("main.js注入完成->", mainJsPath);
            const dataFiles = fs_extra_1.default.readdirSync(dataPath);
            for (let i = 0; i < dataFiles.length; i++) {
                const file = dataFiles[i];
                const srcPath = path_1.default.join(dataPath, file);
                //复制文件到build_results/platform/version下
                const destPath = path_1.default.join(versionFilePath, file);
                fs_extra_1.default.ensureDirSync(path_1.default.dirname(destPath));
                fs_extra_1.default.copySync(srcPath, destPath, { overwrite: true });
            }
            //写完以后，将remotesPath下的文件夹移动到build_results/platform/version下
            for (let i = 0; i < unContainBundles.length; i++) {
                const folder = unContainBundles[i];
                const srcPath = path_1.default.join(remotesPath, folder);
                const destPath = path_1.default.join(versionFilePath, "assets", folder);
                fs_extra_1.default.moveSync(srcPath, destPath, { overwrite: true });
            }
            //删除remotesPath
            fs_extra_1.default.removeSync(remotesPath);
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
            const newVersion = arr.slice(0, arr.length - 1).join(".") + "." + (parseInt(last) + 1);
            //将版本号加1
            this._config.version = newVersion;
            //将版本号写入配置文件
            fs_extra_1.default.writeJSONSync(filePath, this._config, { spaces: 4 });
        });
    }
    /**
     *  写入manifest文件
     * @param pName  包名字
     * @param allFiles  所有需要写入得文件名
     * @param versionFilePath 需要写入得路径
     * @param isContained 是否携带
     */
    static writeOneManifest(platform, env, channel, pName, allFiles, versionFilePath) {
        const manifest = {
            packageUrl: this._config.remotes[0] + channel + "/" + platform + "/" + env + "/",
            remoteVersionUrl: "",
            remoteManifestUrl: this._config.remotes[0] + channel + "/" + platform + "/" + env + "/" + pName + ".manifest",
            version: this._config.version,
            engineVersion: "3.8.3",
            assets: allFiles,
            searchPaths: []
        };
        const manifestPath = path_1.default.join(versionFilePath, pName + ".manifest");
        fs_extra_1.default.writeJSONSync(manifestPath, manifest, { spaces: 4 });
        console.warn("写入文件->", manifestPath);
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
    static getAllFiles(rootPath, folder, allFiles) {
        const files = fs_extra_1.default.readdirSync(folder);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filePath = path_1.default.join(folder, file);
            const stat = fs_extra_1.default.statSync(filePath);
            if (stat.isDirectory()) {
                this.getAllFiles(rootPath, filePath, allFiles);
            }
            else {
                //const md5 = this.getFileMD5(filePath);
                const data = fs_extra_1.default.readFileSync(filePath);
                const md5 = crypto_1.default.createHash('md5').update(data).digest('hex');
                //获取filePath相对于rootPath的路径
                const relativePath = path_1.default.relative(rootPath, filePath);
                //将相对路径中的\替换为/
                const relativePath2 = relativePath.replace(/\\/g, '/');
                allFiles[relativePath2] = {
                    "md5": md5,
                    "size": stat.size
                };
            }
        }
    }
}
AfterBuilderNative._config = null;
exports.default = AfterBuilderNative;
