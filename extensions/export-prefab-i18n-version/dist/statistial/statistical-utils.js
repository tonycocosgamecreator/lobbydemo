"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const json5_1 = __importDefault(require("json5"));
class StatisticalUtils {
    static getBundleGameId(bundleName) {
        //读取配置文件
        const configFileUrl = path_1.default.join(Editor.Project.path, "_config", "statistical.config.json5");
        const configData = fs_extra_1.default.readFileSync(configFileUrl).toString();
        console.log('读取配置文件：', configData);
        const configJson = json5_1.default.parse(configData);
        const bundles = configJson.bundles;
        return bundles[bundleName];
    }
}
exports.default = StatisticalUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGlzdGljYWwtdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2Uvc3RhdGlzdGlhbC9zdGF0aXN0aWNhbC11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGdEQUF3QjtBQUN4Qix3REFBMEI7QUFDMUIsa0RBQTBCO0FBRzFCLE1BQXFCLGdCQUFnQjtJQUMxQixNQUFNLENBQUMsZUFBZSxDQUFDLFVBQW1CO1FBQzdDLFFBQVE7UUFDUixNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFDLFNBQVMsRUFBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzFGLE1BQU0sVUFBVSxHQUFNLGtCQUFFLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2hFLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sVUFBVSxHQUFNLGVBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFzQixDQUFDO1FBQ25FLE1BQU0sT0FBTyxHQUFTLFVBQVUsQ0FBQyxPQUFPLENBQUM7UUFDekMsT0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDL0IsQ0FBQztDQUNKO0FBVkQsbUNBVUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgZnMgZnJvbSBcImZzLWV4dHJhXCI7XHJcbmltcG9ydCBKU09ONSBmcm9tIFwianNvbjVcIjtcclxuaW1wb3J0IHsgU3RhdGlzdGljYWxDb25maWcgfSBmcm9tIFwiLi4vZGVmaW5lXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGF0aXN0aWNhbFV0aWxzIHtcclxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0QnVuZGxlR2FtZUlkKGJ1bmRsZU5hbWUgOiBzdHJpbmcpIDogbnVtYmVyIHwgdW5kZWZpbmVkIHtcclxuICAgICAgICAvL+ivu+WPlumFjee9ruaWh+S7tlxyXG4gICAgICAgIGNvbnN0IGNvbmZpZ0ZpbGVVcmwgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCxcIl9jb25maWdcIixcInN0YXRpc3RpY2FsLmNvbmZpZy5qc29uNVwiKTtcclxuICAgICAgICBjb25zdCBjb25maWdEYXRhICAgID0gZnMucmVhZEZpbGVTeW5jKGNvbmZpZ0ZpbGVVcmwpLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ+ivu+WPlumFjee9ruaWh+S7tu+8micsY29uZmlnRGF0YSk7XHJcbiAgICAgICAgY29uc3QgY29uZmlnSnNvbiAgICA9IEpTT041LnBhcnNlKGNvbmZpZ0RhdGEpIGFzIFN0YXRpc3RpY2FsQ29uZmlnO1xyXG4gICAgICAgIGNvbnN0IGJ1bmRsZXMgICAgICAgPSBjb25maWdKc29uLmJ1bmRsZXM7XHJcbiAgICAgICAgcmV0dXJuIGJ1bmRsZXNbYnVuZGxlTmFtZV07XHJcbiAgICB9XHJcbn0iXX0=