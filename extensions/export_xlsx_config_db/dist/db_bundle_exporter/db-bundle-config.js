"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbBundleConfig = exports.ExportMode = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
var ExportMode;
(function (ExportMode) {
    /**
     * 导出为压缩后的json文件
     */
    ExportMode["JSON"] = "json";
    /**
     * 导出为被jszip压缩后的二进制文件
     */
    ExportMode["ZIP_JSON"] = "zip-json";
    /**
     * 导出为格式化后的json文件
     */
    ExportMode["PRETTY_JSON"] = "pretty-json";
})(ExportMode = exports.ExportMode || (exports.ExportMode = {}));
class DbBundleConfig {
    static get Instance() {
        if (!this._instance) {
            this._instance = new DbBundleConfig();
        }
        return this._instance;
    }
    constructor() {
        const filePath = path_1.default.join(Editor.Project.path, "_config", "db.config.json5");
        console.log("DbBundleConfig -> ", filePath);
        const data = fs_extra_1.default.readFileSync(filePath, "utf-8");
        console.log('DbBundleConfig data -> ', data);
        const obj = JSON.parse(data);
        console.log('DbBundleConfig obj -> ', obj);
        this._config = {
            exportMode: obj.exportMode || ExportMode.JSON,
            mergeFieldToArrayKeepEmptyValue: obj.mergeFieldToArrayKeepEmptyValue || false,
        };
        console.log('DbBundleConfig _config -> ', obj);
    }
    get config() {
        return this._config;
    }
    get exportMode() {
        return this._config.exportMode;
    }
    get mergeFieldToArrayKeepEmptyValue() {
        return this._config.mergeFieldToArrayKeepEmptyValue;
    }
}
exports.DbBundleConfig = DbBundleConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGItYnVuZGxlLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9kYl9idW5kbGVfZXhwb3J0ZXIvZGItYnVuZGxlLWNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsd0RBQTBCO0FBRTFCLElBQVksVUFhWDtBQWJELFdBQVksVUFBVTtJQUNsQjs7T0FFRztJQUNILDJCQUFvQixDQUFBO0lBQ3BCOztPQUVHO0lBQ0gsbUNBQXdCLENBQUE7SUFDeEI7O09BRUc7SUFDSCx5Q0FBMkIsQ0FBQTtBQUMvQixDQUFDLEVBYlcsVUFBVSxHQUFWLGtCQUFVLEtBQVYsa0JBQVUsUUFhckI7QUFPRCxNQUFhLGNBQWM7SUFJaEIsTUFBTSxLQUFLLFFBQVE7UUFDdEIsSUFBRyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUM7WUFDZixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7U0FDekM7UUFDRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDMUIsQ0FBQztJQUVEO1FBQ0ksTUFBTSxRQUFRLEdBQUksY0FBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUMvRSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sSUFBSSxHQUFRLGtCQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNyRCxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixFQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLE1BQU0sR0FBRyxHQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBQyxHQUFHLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsT0FBTyxHQUFHO1lBQ1gsVUFBVSxFQUFHLEdBQUcsQ0FBQyxVQUFVLElBQUksVUFBVSxDQUFDLElBQUk7WUFDOUMsK0JBQStCLEVBQUcsR0FBRyxDQUFDLCtCQUErQixJQUFJLEtBQUs7U0FDakYsQ0FBQTtRQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEVBQUMsR0FBRyxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELElBQVcsTUFBTTtRQUNiLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN4QixDQUFDO0lBRUQsSUFBVyxVQUFVO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7SUFDbkMsQ0FBQztJQUVELElBQVcsK0JBQStCO1FBQ3RDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQztJQUN4RCxDQUFDO0NBQ0o7QUFwQ0Qsd0NBb0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmcy1leHRyYVwiO1xyXG5cclxuZXhwb3J0IGVudW0gRXhwb3J0TW9kZSB7XHJcbiAgICAvKipcclxuICAgICAqIOWvvOWHuuS4uuWOi+e8qeWQjueahGpzb27mlofku7ZcclxuICAgICAqL1xyXG4gICAgSlNPTiAgICAgICAgPSBcImpzb25cIixcclxuICAgIC8qKlxyXG4gICAgICog5a+85Ye65Li66KKranN6aXDljovnvKnlkI7nmoTkuozov5vliLbmlofku7ZcclxuICAgICAqL1xyXG4gICAgWklQX0pTT04gICAgPSBcInppcC1qc29uXCIsXHJcbiAgICAvKipcclxuICAgICAqIOWvvOWHuuS4uuagvOW8j+WMluWQjueahGpzb27mlofku7ZcclxuICAgICAqL1xyXG4gICAgUFJFVFRZX0pTT04gPSBcInByZXR0eS1qc29uXCIsXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSURiQnVuZGxlQ29uZmlnIHtcclxuICAgIGV4cG9ydE1vZGUgOiBFeHBvcnRNb2RlLFxyXG4gICAgbWVyZ2VGaWVsZFRvQXJyYXlLZWVwRW1wdHlWYWx1ZSA6IGJvb2xlYW4sXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBEYkJ1bmRsZUNvbmZpZ3tcclxuICAgIHByaXZhdGUgc3RhdGljIF9pbnN0YW5jZSA6IERiQnVuZGxlQ29uZmlnO1xyXG5cclxuICAgIHByaXZhdGUgX2NvbmZpZyA6IElEYkJ1bmRsZUNvbmZpZztcclxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0IEluc3RhbmNlKCl7XHJcbiAgICAgICAgaWYoIXRoaXMuX2luc3RhbmNlKXtcclxuICAgICAgICAgICAgdGhpcy5faW5zdGFuY2UgPSBuZXcgRGJCdW5kbGVDb25maWcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCl7XHJcbiAgICAgICAgY29uc3QgZmlsZVBhdGggID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiX2NvbmZpZ1wiLCBcImRiLmNvbmZpZy5qc29uNVwiKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkRiQnVuZGxlQ29uZmlnIC0+IFwiLCBmaWxlUGF0aCk7XHJcbiAgICAgICAgY29uc3QgZGF0YSAgICAgID0gZnMucmVhZEZpbGVTeW5jKGZpbGVQYXRoLCBcInV0Zi04XCIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdEYkJ1bmRsZUNvbmZpZyBkYXRhIC0+ICcsZGF0YSk7XHJcbiAgICAgICAgY29uc3Qgb2JqICAgID0gSlNPTi5wYXJzZShkYXRhKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnRGJCdW5kbGVDb25maWcgb2JqIC0+ICcsb2JqKTtcclxuICAgICAgICB0aGlzLl9jb25maWcgPSB7XHJcbiAgICAgICAgICAgIGV4cG9ydE1vZGUgOiBvYmouZXhwb3J0TW9kZSB8fCBFeHBvcnRNb2RlLkpTT04sXHJcbiAgICAgICAgICAgIG1lcmdlRmllbGRUb0FycmF5S2VlcEVtcHR5VmFsdWUgOiBvYmoubWVyZ2VGaWVsZFRvQXJyYXlLZWVwRW1wdHlWYWx1ZSB8fCBmYWxzZSxcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0RiQnVuZGxlQ29uZmlnIF9jb25maWcgLT4gJyxvYmopO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgY29uZmlnKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGV4cG9ydE1vZGUoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY29uZmlnLmV4cG9ydE1vZGU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBtZXJnZUZpZWxkVG9BcnJheUtlZXBFbXB0eVZhbHVlKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZy5tZXJnZUZpZWxkVG9BcnJheUtlZXBFbXB0eVZhbHVlO1xyXG4gICAgfVxyXG59Il19