import path from "path";
import FileUtils from "../utils/file-utils";
import fs from "fs-extra";
import { AssetDbUtils } from "../utils/asset-db-utils";
export class BundleMain {


    public static ProcessingExportBundles() {
        const names : string[] = [];
        const dir = path.join(Editor.Project.path, "assets", "bundles");
        //获取dir下所有后缀为meta的文件
        const files = FileUtils.GetAllFilesInFolder(dir, "meta");
        if(files.length === 0){
            console.log("No bundle files found");
            return;
        }
        for(let i = 0; i < files.length; i++){
            const file = files[i];
            //读取文件内容
            const data = fs.readFileSync(file, {encoding : 'utf-8'});
            const obj = JSON.parse(data);
            if(!obj['userData']){
                continue;
            }
            const userData  = obj['userData'];
            const isBundle  = userData['isBundle'];
            if(!isBundle){
                continue;
            }
            const name = path.basename(file, ".meta");
            names.push(name);
        }
        if(names.length === 0){
            console.log("No bundle files found");
            return;
        }
        let text = "export enum Bundles { \n";
        for(let i = 0; i < names.length; i++){
            const name = names[i];
            text += `    ${name} = "${name}",\n`;
        }
        text += "}";
        AssetDbUtils.RequestCreateNewAsset("db://assets/resources/scripts/auto/bundles.ts", text);
    }

}