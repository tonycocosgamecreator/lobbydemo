"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const task_manager_1 = require("../utils/task-manager");
const db_exporter_1 = __importDefault(require("./db-exporter"));
const db_verifyer_1 = require("./db-verifyer");
class DbMain {
    static ProcessingExportDb() {
        if (this._bProcessing) {
            console.log("请稍后再试！");
            return;
        }
        this._bProcessing = true;
        let tm = new task_manager_1.TaskManager();
        tm.addCall((fNext) => {
            // 初始化导出器
            db_exporter_1.default.init(Editor.Project.path, fNext);
        });
        tm.addCall((fNext) => {
            // 校验配置表
            db_verifyer_1.DbVerifyer.verifyDb();
            // 合并配置表字段(需要在验证之后执行)
            db_exporter_1.default.mergeDbField();
            // 导出原始配置表
            db_exporter_1.default.exportPreviewDb();
            // 导出d.ts描述文件
            db_exporter_1.default.exportDtsFile();
            // 导出数据文件
            db_exporter_1.default.exportDataFile().then(() => {
                // 导出 _AutoExportDb.ts
                db_exporter_1.default.exportAutoExportDbTs();
                // 热更新library数据文件
                db_exporter_1.default.exportLibraryFile();
                //导出多语言配置
                db_exporter_1.default.exportI18NDefineFile();
                fNext();
            });
        });
        tm.start(() => {
            this._bProcessing = false;
        });
    }
}
exports.default = DbMain;
DbMain._bProcessing = false;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGItbWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9kYmV4cG9ydC9kYi1tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsd0RBQW9EO0FBQ3BELGdFQUF1QztBQUN2QywrQ0FBMkM7QUFFM0MsTUFBcUIsTUFBTTtJQUloQixNQUFNLENBQUMsa0JBQWtCO1FBQzVCLElBQUcsSUFBSSxDQUFDLFlBQVksRUFBQztZQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RCLE9BQU87U0FDVjtRQUNELElBQUksQ0FBQyxZQUFZLEdBQUssSUFBSSxDQUFDO1FBQzNCLElBQUksRUFBRSxHQUFHLElBQUksMEJBQVcsRUFBRSxDQUFDO1FBRTNCLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUNqQixTQUFTO1lBQ1QscUJBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFDLEVBQUU7WUFDaEIsUUFBUTtZQUNkLHdCQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEIscUJBQXFCO1lBQ3JCLHFCQUFVLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFMUIsVUFBVTtZQUNWLHFCQUFVLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFN0IsYUFBYTtZQUNiLHFCQUFVLENBQUMsYUFBYSxFQUFFLENBQUM7WUFFM0IsU0FBUztZQUNULHFCQUFVLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUUsRUFBRTtnQkFDakMsc0JBQXNCO2dCQUN0QixxQkFBVSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBRWxDLGlCQUFpQjtnQkFDakIscUJBQVUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUUvQixTQUFTO2dCQUNULHFCQUFVLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFFbEMsS0FBSyxFQUFFLENBQUM7WUFDWixDQUFDLENBQUMsQ0FBQztRQUdQLENBQUMsQ0FBQyxDQUFDO1FBQ0gsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixJQUFJLENBQUMsWUFBWSxHQUFLLEtBQUssQ0FBQztRQUNoQyxDQUFDLENBQUMsQ0FBQztJQUVQLENBQUM7O0FBakRMLHlCQWtEQztBQWhEa0IsbUJBQVksR0FBRyxLQUFLLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUYXNrTWFuYWdlciB9IGZyb20gXCIuLi91dGlscy90YXNrLW1hbmFnZXJcIjtcclxuaW1wb3J0IERiRXhwb3J0ZXIgZnJvbSBcIi4vZGItZXhwb3J0ZXJcIjtcclxuaW1wb3J0IHsgRGJWZXJpZnllciB9IGZyb20gXCIuL2RiLXZlcmlmeWVyXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEYk1haW57XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2JQcm9jZXNzaW5nID0gZmFsc2U7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBQcm9jZXNzaW5nRXhwb3J0RGIoKXtcclxuICAgICAgICBpZih0aGlzLl9iUHJvY2Vzc2luZyl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi6K+356iN5ZCO5YaN6K+V77yBXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2JQcm9jZXNzaW5nICAgPSB0cnVlO1xyXG4gICAgICAgIGxldCB0bSA9IG5ldyBUYXNrTWFuYWdlcigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRtLmFkZENhbGwoKGZOZXh0KSA9PiB7XHJcbiAgICAgICAgICAgIC8vIOWIneWni+WMluWvvOWHuuWZqFxyXG4gICAgICAgICAgICBEYkV4cG9ydGVyLmluaXQoRWRpdG9yLlByb2plY3QucGF0aCwgZk5leHQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0bS5hZGRDYWxsKChmTmV4dCk9PntcclxuICAgICAgICAgICAgLy8g5qCh6aqM6YWN572u6KGoXHJcblx0XHQgICAgRGJWZXJpZnllci52ZXJpZnlEYigpO1xyXG4gICAgICAgICAgICAvLyDlkIjlubbphY3nva7ooajlrZfmrrUo6ZyA6KaB5Zyo6aqM6K+B5LmL5ZCO5omn6KGMKVxyXG4gICAgICAgICAgICBEYkV4cG9ydGVyLm1lcmdlRGJGaWVsZCgpO1xyXG5cclxuICAgICAgICAgICAgLy8g5a+85Ye65Y6f5aeL6YWN572u6KGoXHJcbiAgICAgICAgICAgIERiRXhwb3J0ZXIuZXhwb3J0UHJldmlld0RiKCk7XHJcblxyXG4gICAgICAgICAgICAvLyDlr7zlh7pkLnRz5o+P6L+w5paH5Lu2XHJcbiAgICAgICAgICAgIERiRXhwb3J0ZXIuZXhwb3J0RHRzRmlsZSgpO1xyXG5cclxuICAgICAgICAgICAgLy8g5a+85Ye65pWw5o2u5paH5Lu2XHJcbiAgICAgICAgICAgIERiRXhwb3J0ZXIuZXhwb3J0RGF0YUZpbGUoKS50aGVuKCgpPT57XHJcbiAgICAgICAgICAgICAgICAvLyDlr7zlh7ogX0F1dG9FeHBvcnREYi50c1xyXG4gICAgICAgICAgICAgICAgRGJFeHBvcnRlci5leHBvcnRBdXRvRXhwb3J0RGJUcygpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIOeDreabtOaWsGxpYnJhcnnmlbDmja7mlofku7ZcclxuICAgICAgICAgICAgICAgIERiRXhwb3J0ZXIuZXhwb3J0TGlicmFyeUZpbGUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL+WvvOWHuuWkmuivreiogOmFjee9rlxyXG4gICAgICAgICAgICAgICAgRGJFeHBvcnRlci5leHBvcnRJMThORGVmaW5lRmlsZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZOZXh0KCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdG0uc3RhcnQoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9iUHJvY2Vzc2luZyAgID0gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbn0iXX0=