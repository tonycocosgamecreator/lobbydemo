import path from "path";
import { DbBundleConfig } from "./db-bundle-config";
import DbBundleExporter from "./db-bundle-exporter";
import fs from "fs-extra";
import { DbBundleVerifyer } from "./db-bundle-verifyer";
import { DbBundleDatas } from "./db-bundle-datas";
export default class DbBundleExporterMain {
    private static _bProcessing = false;

    public static async ProcessingExportDb(targetName? : string) {
        if (this._bProcessing) {
            console.log("请稍后再试！");
            return;
        }
        this._bProcessing = true;
        try{
            //先初始化配置文件
            DbBundleConfig.Instance;
            DbBundleDatas.Instance.clear();
            if(!DbBundleConfig.Instance.mergeFieldToArrayKeepEmptyValue){
                //如果没有配置合并字段到数组中
                console.log("");
                console.log("[提示] db.config.json5 中未配置 mergeFieldToArrayKeepEmptyValue");
                console.log("配置表导出器在处理MERGE_FLD_NAME功能时，会默认忽略所有的空白数据，在使用中会出现歧义：");
                console.log("如以下案例：")
                console.log("MERGE_FLD_NAME  strs    strs    strs");
                console.log("FLD_NAME        str1    str2    str3");
                console.log("DATA            a       b       c                  strs=['a', 'b', 'c']");
                console.log("DATA            a               c                  strs=['a', 'c']");
                console.log("DATA            a       b                          strs=['a', 'b'");
                console.log("")
                console.log("第二条数据中，按照预期c应该是属于第三个字段，实际导出的strs中，strs[1]为'c'不符合预期");
                console.log("修复后，输出的strs依次为：['a', 'b', 'c'], ['a', '', 'c'], ['a', 'b', '']")
                console.log("");
                console.log("由于此功能会改变导出逻辑，可能影响项目中已有数据的导出，修改后请仔细核对preview-db中的文件改动。");
                console.log("");
                console.log("修复方式：");
                console.log("1. 打开项目库中_config/db.config.json5");
                console.log("2. 在exportMode字段后，新增配置 mergeFieldToArrayKeepEmptyValue: true     (注意，true是布尔值，不是字符串）");
                console.log("3. 重新导出配置表，检查preview_db中json文件的改动，确保现有数据不受影响");
                console.log("");
            }
            //配置表目录
            const dir   = path.join(Editor.Project.path, "_config");
            //let tm      = new TaskManager();
            //对_config下面的所有文件夹当作一个bundle来处理
            const dirs : string[] = [];
            fs.readdirSync(dir).forEach((file) => {
                if(file.includes('preview')){
                    return false;
                }
                //如果file是文件夹
                const url   = path.join(dir, file);
                if(fs.statSync(url).isDirectory()){
                    dirs.push(file);
                }
            });
            for(let i = 0;i<dirs.length;i++){
                const bundleName = dirs[i];
                if(bundleName.includes('preview')){
                    continue;
                }
                if(targetName && targetName != bundleName){
                    continue;
                }
                console.log("开始导出配置表：", bundleName);
                const exporter = new DbBundleExporter(bundleName);
                await exporter.exportBundle();
                const verifyer = new DbBundleVerifyer(exporter);
                verifyer.verifyDb();
                //合并配置表字段(需要在验证之后执行)
                exporter.mergeDbField();
                //导出原始配置表
                exporter.exportPreviewDb();
                // 导出d.ts描述文件
                exporter.exportDtsFile();
                // 导出数据文件
                await exporter.exportDataFile();
                exporter.exportAutoExportDbTs();
                if(bundleName == 'resources'){
                    exporter.exportI18NDefineFile();
                }
            }
        }catch(e : any){
            console.error(e);
        }finally{
            this._bProcessing = false;
        }
    }
}