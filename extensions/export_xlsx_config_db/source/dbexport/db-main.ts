import { TaskManager } from "../utils/task-manager";
import DbExporter from "./db-exporter";
import { DbVerifyer } from "./db-verifyer";

export default class DbMain{

    private static _bProcessing = false;

    public static ProcessingExportDb(){
        if(this._bProcessing){
            console.log("请稍后再试！");
            return;
        }
        this._bProcessing   = true;
        let tm = new TaskManager();
        
        tm.addCall((fNext) => {
            // 初始化导出器
            DbExporter.init(Editor.Project.path, fNext);
        });

        tm.addCall((fNext)=>{
            // 校验配置表
		    DbVerifyer.verifyDb();
            // 合并配置表字段(需要在验证之后执行)
            DbExporter.mergeDbField();

            // 导出原始配置表
            DbExporter.exportPreviewDb();

            // 导出d.ts描述文件
            DbExporter.exportDtsFile();

            // 导出数据文件
            DbExporter.exportDataFile().then(()=>{
                // 导出 _AutoExportDb.ts
                DbExporter.exportAutoExportDbTs();

                // 热更新library数据文件
                DbExporter.exportLibraryFile();

                //导出多语言配置
                DbExporter.exportI18NDefineFile();

                fNext();
            });

            
        });
        tm.start(() => {
            this._bProcessing   = false;
        });
        
    }
}