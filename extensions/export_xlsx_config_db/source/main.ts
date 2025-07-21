import { AssetInfo } from "@cocos/creator-types/editor/packages/asset-db/@types/protected";
import { BundleMain } from "./bundleexport/bundle-main";
import DbBundleExporterMain from "./db_bundle_exporter/db-bundle-exporter-main";
import DbMain from "./dbexport/db-main";
import { ProtoExporter } from "./protos/proto-exporter";
import DbI18nChecker from "./db_i18n_check/db-i18n-checker";
import ProtosExporterPackage from "./protos/protos-exporter-package";

/**
 * @en Methods within the extension can be triggered by message
 * @zh 扩展内的方法，可以通过 message 触发
 */
export const methods: { [key: string]: (...any: any) => any } = {
    /**
     * @en A method that can be triggered by message
     * @zh 通过 message 触发的方法
     * @param str The string to be printed
     */
    export_db() {
        DbMain.ProcessingExportDb();
    },

    export_bundles() {
        BundleMain.ProcessingExportBundles();
    },

    async export_protos() {
        await ProtosExporterPackage.exportProtos("resources");
        //await ProtoExporter.ProcessingExportProtos();
        //await ProtoExporter.ProcessingExportProtosDTS();
    },
    
    export_bundle_db(){
        DbBundleExporterMain.ProcessingExportDb();
    },
    /**
     * 导出指定bundle的配置表
     * 此消息由另外一个插件发送
     * @param bundleName 
     */
    export_target_bundle_xlsx(bundleName : string){
        console.warn('export_target_bundle_xlsx -> ', bundleName);
        //导出配置表
        DbBundleExporterMain.ProcessingExportDb(bundleName);
    },

    check_i18n_config(){
        DbI18nChecker.check_i18n_config();
        DbBundleExporterMain.ProcessingExportDb();
    }
};

/**
 * @en The method executed when the extension is started
 * @zh 扩展启动的时候执行的方法
 */
export function load() {
    //Editor.Message.send('{name}', 'hello');
}

/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展触发的方法
 */
export function unload() { }

/**
 * 右击
 * @param assetInfo 
 */
export function onRightClickAssetMenu(assetInfo : AssetInfo){
    const importer  = assetInfo.importer;
    if(importer != 'directory' || !assetInfo.isDirectory){
        return;
    }
    console.log('onRightClickAssetMenu -> ', assetInfo);
    //检查是否是一个bundle
    const name  = assetInfo.name;
    const url   = assetInfo.url;
    let isBundle = false;
    if(name == 'resources' || url.includes('bundles')){
        isBundle    = true;
    }
    if(!isBundle){
        return;
    }
    //增加菜单，导出bundle协议与配置
    return [
        {
            label : "导出[" + name+ "]协议与配置",
            async click() {
                await ProtosExporterPackage.exportProtos(name);
                //await ProtoExporter.ProcessingExportProtos(name);
                //await ProtoExporter.ProcessingExportProtosDTS(name);
                //导出配置表
                DbBundleExporterMain.ProcessingExportDb(name);
            }
        }
    ];
}
