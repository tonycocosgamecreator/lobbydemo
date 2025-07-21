import path from "path";
import fs from "fs-extra";
import JSON5 from "json5";
import { StatisticalConfig } from "../define";

export default class StatisticalUtils {
    public static getBundleGameId(bundleName : string) : number | undefined {
        //读取配置文件
        const configFileUrl = path.join(Editor.Project.path,"_config","statistical.config.json5");
        const configData    = fs.readFileSync(configFileUrl).toString();
        console.log('读取配置文件：',configData);
        const configJson    = JSON5.parse(configData) as StatisticalConfig;
        const bundles       = configJson.bundles;
        return bundles[bundleName];
    }
}