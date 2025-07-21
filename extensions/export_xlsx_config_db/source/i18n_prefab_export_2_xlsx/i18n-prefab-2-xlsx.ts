import { AssetInfo } from "@cocos/creator-types/editor/packages/asset-db/@types/protected";

export function onAssetMenu(assetInfo : AssetInfo){
    console.log('onAssetMenu', assetInfo);
    
}