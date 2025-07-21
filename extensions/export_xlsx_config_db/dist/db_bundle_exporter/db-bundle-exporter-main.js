"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const db_bundle_config_1 = require("./db-bundle-config");
const db_bundle_exporter_1 = __importDefault(require("./db-bundle-exporter"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const db_bundle_verifyer_1 = require("./db-bundle-verifyer");
const db_bundle_datas_1 = require("./db-bundle-datas");
class DbBundleExporterMain {
    static async ProcessingExportDb(targetName) {
        if (this._bProcessing) {
            console.log("请稍后再试！");
            return;
        }
        this._bProcessing = true;
        try {
            //先初始化配置文件
            db_bundle_config_1.DbBundleConfig.Instance;
            db_bundle_datas_1.DbBundleDatas.Instance.clear();
            if (!db_bundle_config_1.DbBundleConfig.Instance.mergeFieldToArrayKeepEmptyValue) {
                //如果没有配置合并字段到数组中
                console.log("");
                console.log("[提示] db.config.json5 中未配置 mergeFieldToArrayKeepEmptyValue");
                console.log("配置表导出器在处理MERGE_FLD_NAME功能时，会默认忽略所有的空白数据，在使用中会出现歧义：");
                console.log("如以下案例：");
                console.log("MERGE_FLD_NAME  strs    strs    strs");
                console.log("FLD_NAME        str1    str2    str3");
                console.log("DATA            a       b       c                  strs=['a', 'b', 'c']");
                console.log("DATA            a               c                  strs=['a', 'c']");
                console.log("DATA            a       b                          strs=['a', 'b'");
                console.log("");
                console.log("第二条数据中，按照预期c应该是属于第三个字段，实际导出的strs中，strs[1]为'c'不符合预期");
                console.log("修复后，输出的strs依次为：['a', 'b', 'c'], ['a', '', 'c'], ['a', 'b', '']");
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
            const dir = path_1.default.join(Editor.Project.path, "_config");
            //let tm      = new TaskManager();
            //对_config下面的所有文件夹当作一个bundle来处理
            const dirs = [];
            fs_extra_1.default.readdirSync(dir).forEach((file) => {
                if (file.includes('preview')) {
                    return false;
                }
                //如果file是文件夹
                const url = path_1.default.join(dir, file);
                if (fs_extra_1.default.statSync(url).isDirectory()) {
                    dirs.push(file);
                }
            });
            for (let i = 0; i < dirs.length; i++) {
                const bundleName = dirs[i];
                if (bundleName.includes('preview')) {
                    continue;
                }
                if (targetName && targetName != bundleName) {
                    continue;
                }
                console.log("开始导出配置表：", bundleName);
                const exporter = new db_bundle_exporter_1.default(bundleName);
                await exporter.exportBundle();
                const verifyer = new db_bundle_verifyer_1.DbBundleVerifyer(exporter);
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
                if (bundleName == 'resources') {
                    exporter.exportI18NDefineFile();
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        finally {
            this._bProcessing = false;
        }
    }
}
exports.default = DbBundleExporterMain;
DbBundleExporterMain._bProcessing = false;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGItYnVuZGxlLWV4cG9ydGVyLW1haW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvZGJfYnVuZGxlX2V4cG9ydGVyL2RiLWJ1bmRsZS1leHBvcnRlci1tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLHlEQUFvRDtBQUNwRCw4RUFBb0Q7QUFDcEQsd0RBQTBCO0FBQzFCLDZEQUF3RDtBQUN4RCx1REFBa0Q7QUFDbEQsTUFBcUIsb0JBQW9CO0lBRzlCLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsVUFBb0I7UUFDdkQsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEIsT0FBTztTQUNWO1FBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDekIsSUFBRztZQUNDLFVBQVU7WUFDVixpQ0FBYyxDQUFDLFFBQVEsQ0FBQztZQUN4QiwrQkFBYSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMvQixJQUFHLENBQUMsaUNBQWMsQ0FBQyxRQUFRLENBQUMsK0JBQStCLEVBQUM7Z0JBQ3hELGdCQUFnQjtnQkFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQywyREFBMkQsQ0FBQyxDQUFDO2dCQUN6RSxPQUFPLENBQUMsR0FBRyxDQUFDLG9EQUFvRCxDQUFDLENBQUM7Z0JBQ2xFLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7Z0JBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0NBQXNDLENBQUMsQ0FBQztnQkFDcEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO2dCQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLHlFQUF5RSxDQUFDLENBQUM7Z0JBQ3ZGLE9BQU8sQ0FB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QUMsb0JBQW9CLEVBQUUsQ0FBQztpQkFDbkM7YUFDSjtTQUNKO1FBQUEsT0FBTSxDQUFPLEVBQUM7WUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3BCO2dCQUFPO1lBQ0osSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7U0FDN0I7SUFDTCxDQUFDOztBQWxGTCx1Q0FtRkM7QUFsRmtCLGlDQUFZLEdBQUcsS0FBSyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgRGJCdW5kbGVDb25maWcgfSBmcm9tIFwiLi9kYi1idW5kbGUtY29uZmlnXCI7XHJcbmltcG9ydCBEYkJ1bmRsZUV4cG9ydGVyIGZyb20gXCIuL2RiLWJ1bmRsZS1leHBvcnRlclwiO1xyXG5pbXBvcnQgZnMgZnJvbSBcImZzLWV4dHJhXCI7XHJcbmltcG9ydCB7IERiQnVuZGxlVmVyaWZ5ZXIgfSBmcm9tIFwiLi9kYi1idW5kbGUtdmVyaWZ5ZXJcIjtcclxuaW1wb3J0IHsgRGJCdW5kbGVEYXRhcyB9IGZyb20gXCIuL2RiLWJ1bmRsZS1kYXRhc1wiO1xyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEYkJ1bmRsZUV4cG9ydGVyTWFpbiB7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBfYlByb2Nlc3NpbmcgPSBmYWxzZTtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIFByb2Nlc3NpbmdFeHBvcnREYih0YXJnZXROYW1lPyA6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLl9iUHJvY2Vzc2luZykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuivt+eojeWQjuWGjeivle+8gVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9iUHJvY2Vzc2luZyA9IHRydWU7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAvL+WFiOWIneWni+WMlumFjee9ruaWh+S7tlxyXG4gICAgICAgICAgICBEYkJ1bmRsZUNvbmZpZy5JbnN0YW5jZTtcclxuICAgICAgICAgICAgRGJCdW5kbGVEYXRhcy5JbnN0YW5jZS5jbGVhcigpO1xyXG4gICAgICAgICAgICBpZighRGJCdW5kbGVDb25maWcuSW5zdGFuY2UubWVyZ2VGaWVsZFRvQXJyYXlLZWVwRW1wdHlWYWx1ZSl7XHJcbiAgICAgICAgICAgICAgICAvL+WmguaenOayoeaciemFjee9ruWQiOW5tuWtl+auteWIsOaVsOe7hOS4rVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlvmj5DnpLpdIGRiLmNvbmZpZy5qc29uNSDkuK3mnKrphY3nva4gbWVyZ2VGaWVsZFRvQXJyYXlLZWVwRW1wdHlWYWx1ZVwiKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi6YWN572u6KGo5a+85Ye65Zmo5Zyo5aSE55CGTUVSR0VfRkxEX05BTUXlip/og73ml7bvvIzkvJrpu5jorqTlv73nlaXmiYDmnInnmoTnqbrnmb3mlbDmja7vvIzlnKjkvb/nlKjkuK3kvJrlh7rnjrDmrafkuYnvvJpcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuWmguS7peS4i+ahiOS+i++8mlwiKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJNRVJHRV9GTERfTkFNRSAgc3RycyAgICBzdHJzICAgIHN0cnNcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZMRF9OQU1FICAgICAgICBzdHIxICAgIHN0cjIgICAgc3RyM1wiKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiREFUQSAgICAgICAgICAgIGEgICAgICAgYiAgICAgICBjICAgICAgICAgICAgICAgICAgc3Rycz1bJ2EnLCAnYicsICdjJ11cIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRBVEEgICAgICAgICAgICBhICAgICAgICAgICAgICAgYyAgICAgICAgICAgICAgICAgIHN0cnM9WydhJywgJ2MnXVwiKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiREFUQSAgICAgICAgICAgIGEgICAgICAgYiAgICAgICAgICAgICAgICAgICAgICAgICAgc3Rycz1bJ2EnLCAnYidcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlwiKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLnrKzkuozmnaHmlbDmja7kuK3vvIzmjInnhafpooTmnJ9j5bqU6K+l5piv5bGe5LqO56ys5LiJ5Liq5a2X5q6177yM5a6e6ZmF5a+85Ye655qEc3Ryc+S4re+8jHN0cnNbMV3kuLonYyfkuI3nrKblkIjpooTmnJ9cIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuS/ruWkjeWQju+8jOi+k+WHuueahHN0cnPkvp3mrKHkuLrvvJpbJ2EnLCAnYicsICdjJ10sIFsnYScsICcnLCAnYyddLCBbJ2EnLCAnYicsICcnXVwiKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIueUseS6juatpOWKn+iDveS8muaUueWPmOWvvOWHuumAu+i+ke+8jOWPr+iDveW9seWTjemhueebruS4reW3suacieaVsOaNrueahOWvvOWHuu+8jOS/ruaUueWQjuivt+S7lOe7huaguOWvuXByZXZpZXctZGLkuK3nmoTmlofku7bmlLnliqjjgIJcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlwiKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5L+u5aSN5pa55byP77yaXCIpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIxLiDmiZPlvIDpobnnm67lupPkuK1fY29uZmlnL2RiLmNvbmZpZy5qc29uNVwiKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiMi4g5ZyoZXhwb3J0TW9kZeWtl+auteWQju+8jOaWsOWinumFjee9riBtZXJnZUZpZWxkVG9BcnJheUtlZXBFbXB0eVZhbHVlOiB0cnVlICAgICAo5rOo5oSP77yMdHJ1ZeaYr+W4g+WwlOWAvO+8jOS4jeaYr+Wtl+espuS4su+8iVwiKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiMy4g6YeN5paw5a+85Ye66YWN572u6KGo77yM5qOA5p+lcHJldmlld19kYuS4rWpzb27mlofku7bnmoTmlLnliqjvvIznoa7kv53njrDmnInmlbDmja7kuI3lj5flvbHlk41cIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL+mFjee9ruihqOebruW9lVxyXG4gICAgICAgICAgICBjb25zdCBkaXIgICA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcIl9jb25maWdcIik7XHJcbiAgICAgICAgICAgIC8vbGV0IHRtICAgICAgPSBuZXcgVGFza01hbmFnZXIoKTtcclxuICAgICAgICAgICAgLy/lr7lfY29uZmln5LiL6Z2i55qE5omA5pyJ5paH5Lu25aS55b2T5L2c5LiA5LiqYnVuZGxl5p2l5aSE55CGXHJcbiAgICAgICAgICAgIGNvbnN0IGRpcnMgOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICBmcy5yZWFkZGlyU3luYyhkaXIpLmZvckVhY2goKGZpbGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGZpbGUuaW5jbHVkZXMoJ3ByZXZpZXcnKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy/lpoLmnpxmaWxl5piv5paH5Lu25aS5XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1cmwgICA9IHBhdGguam9pbihkaXIsIGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgaWYoZnMuc3RhdFN5bmModXJsKS5pc0RpcmVjdG9yeSgpKXtcclxuICAgICAgICAgICAgICAgICAgICBkaXJzLnB1c2goZmlsZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwO2k8ZGlycy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1bmRsZU5hbWUgPSBkaXJzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYoYnVuZGxlTmFtZS5pbmNsdWRlcygncHJldmlldycpKXtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKHRhcmdldE5hbWUgJiYgdGFyZ2V0TmFtZSAhPSBidW5kbGVOYW1lKXtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5byA5aeL5a+85Ye66YWN572u6KGo77yaXCIsIGJ1bmRsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXhwb3J0ZXIgPSBuZXcgRGJCdW5kbGVFeHBvcnRlcihidW5kbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IGV4cG9ydGVyLmV4cG9ydEJ1bmRsZSgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmVyaWZ5ZXIgPSBuZXcgRGJCdW5kbGVWZXJpZnllcihleHBvcnRlcik7XHJcbiAgICAgICAgICAgICAgICB2ZXJpZnllci52ZXJpZnlEYigpO1xyXG4gICAgICAgICAgICAgICAgLy/lkIjlubbphY3nva7ooajlrZfmrrUo6ZyA6KaB5Zyo6aqM6K+B5LmL5ZCO5omn6KGMKVxyXG4gICAgICAgICAgICAgICAgZXhwb3J0ZXIubWVyZ2VEYkZpZWxkKCk7XHJcbiAgICAgICAgICAgICAgICAvL+WvvOWHuuWOn+Wni+mFjee9ruihqFxyXG4gICAgICAgICAgICAgICAgZXhwb3J0ZXIuZXhwb3J0UHJldmlld0RiKCk7XHJcbiAgICAgICAgICAgICAgICAvLyDlr7zlh7pkLnRz5o+P6L+w5paH5Lu2XHJcbiAgICAgICAgICAgICAgICBleHBvcnRlci5leHBvcnREdHNGaWxlKCk7XHJcbiAgICAgICAgICAgICAgICAvLyDlr7zlh7rmlbDmja7mlofku7ZcclxuICAgICAgICAgICAgICAgIGF3YWl0IGV4cG9ydGVyLmV4cG9ydERhdGFGaWxlKCk7XHJcbiAgICAgICAgICAgICAgICBleHBvcnRlci5leHBvcnRBdXRvRXhwb3J0RGJUcygpO1xyXG4gICAgICAgICAgICAgICAgaWYoYnVuZGxlTmFtZSA9PSAncmVzb3VyY2VzJyl7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZXIuZXhwb3J0STE4TkRlZmluZUZpbGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1jYXRjaChlIDogYW55KXtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICB9ZmluYWxseXtcclxuICAgICAgICAgICAgdGhpcy5fYlByb2Nlc3NpbmcgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iXX0=