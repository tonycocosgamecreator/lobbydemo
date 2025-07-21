import path from "path";
import Tools from "./tools";
import { AssetBundleInfo, BuiltinBundleName } from "../define";
import * as os from 'os';
const p_path = os.platform() === 'darwin' ? '\/' : '\\';

export default class PrefabUtils{
    private static _prefabUuid_2_prefabFilePath : {[uuid : string] : string}    = {};
    /**
     * 已经初始化的bundle
     */
    private static _bInitedBundles : AssetBundleInfo[]           = [];
    public static Clear(){
        this._prefabUuid_2_prefabFilePath   = {};
        this._bInitedBundles = [];
    }

    /**
     * 指定名字的bundle是否初始化了
     * @param bundleName 
     */
    public static IsBundleInited(bundleName : string){
        for(let i = 0;i<this._bInitedBundles.length;i++){
            const info = this._bInitedBundles[i];
            if(info.bundleName == bundleName){
                return true;
            }
        }
        return false;
        //return this._bInitedBundles.includes(bundleName);
    }

    /**
     * 初始化指定bundle的预制体数据
     * @param bundleInfo 需要加载的bundle的数据 
     */
    public static InitBundle(bundleInfo : AssetBundleInfo){

        let prefabDir = path.join(bundleInfo.url,`prefabs${p_path}`).replaceAll("\\","/");
        console.log("------------------预制体文件夹：",prefabDir);
        Tools.foreachDir(prefabDir,(filePath : string)=>{
            console.log("获取到文件：" + filePath);
            if(!filePath.endsWith(".prefab")){
                return;
            }
            let uuid = Tools.loadUuidFromMetaFilePath(filePath + ".meta");
            //console.log("获取到预制体的uuid：",filePath,uuid);
            if(uuid){
                this._prefabUuid_2_prefabFilePath[uuid] = filePath;
            }
        });
        this._bInitedBundles.push(bundleInfo);
    }

    /**
     * 根据uuid获取一个prefab预制体的路径
     * @param uuid 
     */
    public static GetPrefabFilePath(uuid : string) : string | null {
        if(!this._prefabUuid_2_prefabFilePath[uuid]){
            return null;
        }
        return this._prefabUuid_2_prefabFilePath[uuid];
    }
}