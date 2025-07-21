import { AssetInfo } from "@cocos/creator-types/editor/packages/asset-db/@types/public";
import { AssetBundleInfo, DEBUG } from "../define";
import path from "path";
import * as os from 'os';
const p_path = os.platform() === 'darwin' ? '\/' : '\\';



export class AssetDbUtils{

    /**
     * 发送消息，要求编辑器重新导入指定路径或者uuid的资源
     * @param url 资源的路径或者url
     */
    public static async RequestReimportAsset(url : string){
        const result    = await Editor.Message.request("asset-db","reimport-asset",url);
        DEBUG && console.log("要求刷新资源：",url,result);
        return result;
    }
    /**
     *
     * @param source 绝对地址
     * @param url asset-db url
     */
    public static async RequestImportAsset(source : string,url : string){
        DEBUG && console.log("要求导入资源：",source,url);
        const result    = await Editor.Message.request("asset-db","import-asset",source,url);

        return result;
    }
    /**
     * 要求创建一个资源
     * @param url
     * @param text
     */
    public static async RequestCreateNewAsset(url : string,text : string | Buffer ,overwrite = true){
        return await Editor.Message.request("asset-db","create-asset", url, text, {overwrite : overwrite});
    }

    /**
     * 根据指定的uuid或者url获取一个资源的信息
     * @param uuidOrPath
     */
    public static async RequestQueryAssetInfo(uuidOrPath : string) : Promise<AssetInfo | null> {
        return await Editor.Message.request("asset-db","query-asset-info",uuidOrPath);
    }

    /**
     * 根据给定的路径获得bundle名字
     * @param url 例如：db://assets/bundles/demos/prefabs
     * @param bI18N 是否i18n模式
     */
    public static GetBundleNameWithDbUrl(url : string) : AssetBundleInfo | null{
        const projectDir    = Editor.Project.path;
        //console.log("当前项目路径：",projectDir);
        const lIndex    = url.lastIndexOf("/") + 1;
        const lIndex1   = url.lastIndexOf(".prefab");
        const prefabName    = url.substring(lIndex,lIndex1);
        const prefabsFolder = url.indexOf("prefabs");
        const stIndex = prefabsFolder + "prefabs".length + 1;
        let prefabSubUrl = "";
        if(stIndex != lIndex){
            prefabSubUrl = url.substring(stIndex,lIndex - 1);
        }
        
        //console.log("prefabSubUrl = " + prefabSubUrl);
        const info : AssetBundleInfo = {
            url         : '',
            db_url      : '',
            bundleName  : '',
            prefabName  : prefabName,
            prefabSubUrl : prefabSubUrl,
            i18n_labels : [],
        };

        if(url.includes("resources")){
            info.url        = path.join(projectDir,"assets","resources").replaceAll("\\","/");//projectDir + `${p_path}assets${p_path}resources`;
            info.db_url     = "db://assets/resources";
            info.bundleName = "resources";
            return info;
        }
        const pre       = "db://assets/bundles/";
        const plen      = pre.length;
        const str       = url.substring(plen);
        const pIndex    = str.indexOf("prefabs");
        const subUrl    = str.substring(0,pIndex - 1);
        DEBUG && console.log("subUrl = " + subUrl);
        let bI18N       = false;
        if(subUrl.includes("/")){
            bI18N       = true;
        }
        //不使用多语言环境
        if(!bI18N){
            const pIndex    = str.indexOf("/");
            const bundleName    =  str.substring(0,pIndex);

            info.bundleName = bundleName;
            info.url        = projectDir + `${p_path}assets${p_path}bundles${p_path}` + bundleName;
            info.db_url     = "db://assets/bundles/" + bundleName;
            return info;
        }
        //如果使用多语言，那么就只能倒着推上去
        const prefabIndex = url.lastIndexOf("prefabs");
        if(prefabIndex == -1){
            console.error("请将需要导出的预制体，放到prefabs目录下！");
            return null;
        }
        const sub   = url.substring(0,prefabIndex - 1);

        //console.log("切断：",sub);
        const lastIndex = sub.lastIndexOf("/") + 1;
        const bundleName    = sub.substring(lastIndex,sub.length);
        info.url        = projectDir + `${p_path}assets${p_path}bundles${p_path}` + subUrl.replace("/", p_path);
        info.db_url     = sub;
        info.bundleName = bundleName;
        return info;
    }

    /**
     * 根据Prefab的地址获取一个AssetBundleInfo
     * @param prefabPath 
     */
    public static getAsssetBundleInfoByPath(prefabPath : string) : AssetBundleInfo | null {
        prefabPath = prefabPath.replaceAll("\\","/");
        const prefabName    = prefabPath.substring(prefabPath.lastIndexOf("/") + 1,prefabPath.length - 7);
        const prefabsFolder = prefabPath.indexOf("prefabs");
        let prefabSubUrl = "";
        const stIndex = prefabsFolder + "prefabs".length + 1;
        const lastSpIndex = prefabPath.lastIndexOf("/") + 1;
        if(stIndex != lastSpIndex){
            prefabSubUrl = prefabPath.substring(stIndex,lastSpIndex - 1);
        }
        console.log("预制体名字：",prefabName);
        console.log("预制体子路径：",prefabSubUrl);
        const info : AssetBundleInfo = {
            url         : "",
            db_url      : "",
            bundleName  : "",
            prefabName  : prefabName,
            prefabSubUrl : prefabSubUrl,
            i18n_labels : [],
        };

        const index = prefabPath.indexOf("assets");
        const url   = prefabPath.substring(index,prefabPath.length);
        let bundleId = "";
        if(url.includes("resources")){
            bundleId = "resources";
        }else{
            //获取bundles字符串的位置
            const bundlesIndex = url.indexOf("bundles");
            //从bundlesIndex开始，找下一个 /
            const nextSlashIndex = url.indexOf("/",bundlesIndex + 8);
            bundleId = url.substring(bundlesIndex + 8,nextSlashIndex);
        }

        info.bundleName = bundleId;
        let url0        = path.join(Editor.Project.path,"assets");

        //info.db_url     = "db://" + lSub.replace(p_path,"/");
        let db_url = "db://assets/";
        if(bundleId == "resources"){
            db_url = db_url + "resources/prefabs/";
            url0 = path.join(url0,"resources");
        }else{
            db_url = db_url + "bundles/" + bundleId + "/prefabs/";
            url0 = path.join(url0,"bundles",bundleId);
        }
        if(prefabSubUrl != ""){
            db_url = db_url + prefabSubUrl + "/";
        }
        db_url = db_url + prefabName;
        info.db_url = db_url;
        info.url = url0.replaceAll("\\","/");
        return info;
    }
}
