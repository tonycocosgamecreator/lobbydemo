import { AssetInfo } from "@cocos/creator-types/editor/packages/asset-db/@types/public";



export class AssetDbUtils{

    /**
     * 发送消息，要求编辑器重新导入指定路径或者uuid的资源
     * @param url 资源的路径或者url
     */
    public static async RequestReimportAsset(url : string){
        const result    = await Editor.Message.request("asset-db","reimport-asset",url);
        console.log("要求刷新资源：",url,result);
        return result;
    }
    /**
     *
     * @param source 绝对地址
     * @param url asset-db url
     */
    public static async RequestImportAsset(source : string,url : string){
        console.log("要求导入资源：",source,url);
        const result    = await Editor.Message.request("asset-db","import-asset",source,url);

        return result;
    }
    /**
     * 要求创建一个资源
     * @param url
     * @param text
     */
    public static async RequestCreateNewAsset(url : string,text : string | Buffer,overwrite = true){
        return await Editor.Message.request("asset-db","create-asset",url,text,{overwrite : overwrite});
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
     */
    public static GetBundleNameWithDbUrl(url : string) : string{
        if(url.includes("resources")){
            return "resources";
        }
        const pre   = "db://assets/bundles/";
        const plen  = pre.length;
        const str   = url.substring(plen);
        const pIndex    = str.indexOf("/");
        return str.substring(0,pIndex);
    }
}
