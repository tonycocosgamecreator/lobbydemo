import { ComponentInfo } from "../define";
import path from 'path';
import fs from 'fs-extra';
import Tools from "./tools";
export default class ComponentUtils {

    private static _componentFileId_2_componentInfo : {[filedId : string] : ComponentInfo} = {};
    private static _bInited = false;
    /**
     * 清理
     */
    public static Clear(){
        this._componentFileId_2_componentInfo    = {};
        this._bInited   = false;
    }

    /**
     * 初始化
     */
    public static Init(){
        this.Clear();
        const prjRootDir    = Editor.Project.path;
        let assemblyRecordJsFilePath = path.join(prjRootDir, "temp", "programming", "packer-driver", "targets", "editor", "assembly-record.json");
        if(!fs.existsSync(assemblyRecordJsFilePath)){
            console.error("找到指定文件：",assemblyRecordJsFilePath);
            return;
        }
        const assemblyRecordText = fs.readFileSync(assemblyRecordJsFilePath, { encoding: "utf-8" });
        const assemblyRecordData = JSON.parse(assemblyRecordText);

        Tools.forEachMap(assemblyRecordData.entries || {}, (tsFilePath, chunkId) => {
            tsFilePath = path.normalize(tsFilePath);

            let chunkFilePath = path.join(prjRootDir, "temp", "programming", "packer-driver", "targets", "editor", "chunks", chunkId.substring(0, 2), Tools.format("%s.js", chunkId));
            // console.log("for", tsFilePath, chunkId, chunkFilePath)
            let chunkFileText = fs.readFileSync(chunkFilePath, { encoding: "utf-8" });
            // console.log("chunkFileText", chunkFileText);

            // 这里需要提取几个信息
            // 1. 查找第一个 _export("(%className%)"... ccclass(，提取className
            // 2. 查找 _cclegacy._RF.push({}, "(%fileid%)"，提取fileId
            // 3. 如果存在className，则说明这个组件被导出到了代码中
            // 
            let classNameRet = chunkFileText.match(/ccclass\([\"\']([^\"\']+)/);
            let defaultClassNameRet = chunkFileText.match(/_export\(\"default.*ccclass\(.*_class = class ([^ ]+) extends/);
            let fileIdRet = chunkFileText.match(/_cclegacy\._RF\.push\(\{\}\, \"([^\"]+)/);
            // console.log("classNameRet", classNameRet && classNameRet[1]);
            // console.log("defaultClassNameRet", defaultClassNameRet && defaultClassNameRet[1]);
            // console.log("fileIdRet", fileIdRet && fileIdRet[1]);

            let fileId = null;
            let className = null;

            if (fileIdRet) {
                fileId = fileIdRet[1];

                let bDefaultExport = null;
                if (defaultClassNameRet) {
                    className = defaultClassNameRet[1];
                    bDefaultExport = true;
                } else if (classNameRet) {
                    className = classNameRet[1];
                    bDefaultExport = false;
                }

                if (fileId && className) {
                    let scriptFilePath = tsFilePath.substring(6, tsFilePath.length);
                    if(scriptFilePath.includes("assets")){
                        //获取相对路径
                        scriptFilePath = scriptFilePath.substring(scriptFilePath.indexOf("assets"),scriptFilePath.length);
                    }
                    if(scriptFilePath.endsWith(".ts")){
                        scriptFilePath = scriptFilePath.substring(0,scriptFilePath.length - 3).replaceAll("\\","/");
                    }
                    scriptFilePath = "db://" + scriptFilePath;
                    this._componentFileId_2_componentInfo[fileId] = {
                        className: className,
                        scriptFilePath: scriptFilePath,
                        bDefaultExport: bDefaultExport,
                    };
                    //console.log("解析到全局组件信息：",fileId,className,scriptFilePath);
                }
            }
        });
        this._bInited   = true;
    }

    /**
     * 新增一个组件信息
     * @param filedId 
     * @param info 
     */
    public static AddComponentInfo(filedId : string,info : ComponentInfo){
        this._componentFileId_2_componentInfo[filedId]   = info;
    }
    /**
     * 是否存在这个组件信息
     * @param filedId 
     */
    public static IsContainComponentInfo(filedId : string) : boolean {
        const info  = this._componentFileId_2_componentInfo[filedId];
        if(!info){
            return false;
        }
        return true;
    }
    /**
     * 获取指定的组件信息
     * @param filedId 
     */
    public static GetComponentInfo(filedId : string) : ComponentInfo | null {
        if(!this.IsContainComponentInfo(filedId)){
            return null;
        }
        return this._componentFileId_2_componentInfo[filedId];
    }
}