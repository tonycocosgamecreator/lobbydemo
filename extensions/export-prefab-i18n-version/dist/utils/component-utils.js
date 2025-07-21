"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const tools_1 = __importDefault(require("./tools"));
class ComponentUtils {
    /**
     * 清理
     */
    static Clear() {
        this._componentFileId_2_componentInfo = {};
        this._bInited = false;
    }
    /**
     * 初始化
     */
    static Init() {
        this.Clear();
        const prjRootDir = Editor.Project.path;
        let assemblyRecordJsFilePath = path_1.default.join(prjRootDir, "temp", "programming", "packer-driver", "targets", "editor", "assembly-record.json");
        if (!fs_extra_1.default.existsSync(assemblyRecordJsFilePath)) {
            console.error("找到指定文件：", assemblyRecordJsFilePath);
            return;
        }
        const assemblyRecordText = fs_extra_1.default.readFileSync(assemblyRecordJsFilePath, { encoding: "utf-8" });
        const assemblyRecordData = JSON.parse(assemblyRecordText);
        tools_1.default.forEachMap(assemblyRecordData.entries || {}, (tsFilePath, chunkId) => {
            tsFilePath = path_1.default.normalize(tsFilePath);
            let chunkFilePath = path_1.default.join(prjRootDir, "temp", "programming", "packer-driver", "targets", "editor", "chunks", chunkId.substring(0, 2), tools_1.default.format("%s.js", chunkId));
            // console.log("for", tsFilePath, chunkId, chunkFilePath)
            let chunkFileText = fs_extra_1.default.readFileSync(chunkFilePath, { encoding: "utf-8" });
            // console.log("chunkFileText", chunkFileText);
            // 这里需要提取几个信息
            // 1. 查找第一个 _export("(%className%)"... ccclass(，提取className
            // 2. 查找 _cclegacy._RF.push({}, "(%fileid%)"，提取fileId
            // 3. 如果存在className，则说明这个组件被导出到了代码中
            // 
            let classNameRet = chunkFileText.match(/ccclass\([\"\']([^\"\']+)/);
            let defaultClassNameRet = chunkFileText.match(/_export\(\"default.*ccclass\(.*_class = class ([^ ]+) extends/);
            let fileIdRet = chunkFileText.match(/_cclegacy\._RF\.push\(\{\}\, \"([^\"]+)/);
            // console.log("classNameRet", classNameRet && classNameRet[1]);
            // console.log("defaultClassNameRet", defaultClassNameRet && defaultClassNameRet[1]);
            // console.log("fileIdRet", fileIdRet && fileIdRet[1]);
            let fileId = null;
            let className = null;
            if (fileIdRet) {
                fileId = fileIdRet[1];
                let bDefaultExport = null;
                if (defaultClassNameRet) {
                    className = defaultClassNameRet[1];
                    bDefaultExport = true;
                }
                else if (classNameRet) {
                    className = classNameRet[1];
                    bDefaultExport = false;
                }
                if (fileId && className) {
                    let scriptFilePath = tsFilePath.substring(6, tsFilePath.length);
                    if (scriptFilePath.includes("assets")) {
                        //获取相对路径
                        scriptFilePath = scriptFilePath.substring(scriptFilePath.indexOf("assets"), scriptFilePath.length);
                    }
                    if (scriptFilePath.endsWith(".ts")) {
                        scriptFilePath = scriptFilePath.substring(0, scriptFilePath.length - 3).replaceAll("\\", "/");
                    }
                    scriptFilePath = "db://" + scriptFilePath;
                    this._componentFileId_2_componentInfo[fileId] = {
                        className: className,
                        scriptFilePath: scriptFilePath,
                        bDefaultExport: bDefaultExport,
                    };
                    //console.log("解析到全局组件信息：",fileId,className,scriptFilePath);
                }
            }
        });
        this._bInited = true;
    }
    /**
     * 新增一个组件信息
     * @param filedId
     * @param info
     */
    static AddComponentInfo(filedId, info) {
        this._componentFileId_2_componentInfo[filedId] = info;
    }
    /**
     * 是否存在这个组件信息
     * @param filedId
     */
    static IsContainComponentInfo(filedId) {
        const info = this._componentFileId_2_componentInfo[filedId];
        if (!info) {
            return false;
        }
        return true;
    }
    /**
     * 获取指定的组件信息
     * @param filedId
     */
    static GetComponentInfo(filedId) {
        if (!this.IsContainComponentInfo(filedId)) {
            return null;
        }
        return this._componentFileId_2_componentInfo[filedId];
    }
}
exports.default = ComponentUtils;
ComponentUtils._componentFileId_2_componentInfo = {};
ComponentUtils._bInited = false;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3V0aWxzL2NvbXBvbmVudC11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLGdEQUF3QjtBQUN4Qix3REFBMEI7QUFDMUIsb0RBQTRCO0FBQzVCLE1BQXFCLGNBQWM7SUFJL0I7O09BRUc7SUFDSSxNQUFNLENBQUMsS0FBSztRQUNmLElBQUksQ0FBQyxnQ0FBZ0MsR0FBTSxFQUFFLENBQUM7UUFDOUMsSUFBSSxDQUFDLFFBQVEsR0FBSyxLQUFLLENBQUM7SUFDNUIsQ0FBQztJQUVEOztPQUVHO0lBQ0ksTUFBTSxDQUFDLElBQUk7UUFDZCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDYixNQUFNLFVBQVUsR0FBTSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztRQUMxQyxJQUFJLHdCQUF3QixHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztRQUMxSSxJQUFHLENBQUMsa0JBQUUsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsRUFBQztZQUN4QyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ2xELE9BQU87U0FDVjtRQUNELE1BQU0sa0JBQWtCLEdBQUcsa0JBQUUsQ0FBQyxZQUFZLENBQUMsd0JBQXdCLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUM1RixNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUUxRCxlQUFLLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLEVBQUU7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QzVELENBQUM7SUFDRDs7O09BR0c7SUFDSSxNQUFNLENBQUMsc0JBQXNCLENBQUMsT0FBZ0I7UUFDakQsTUFBTSxJQUFJLEdBQUksSUFBSSxDQUFDLGdDQUFnQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdELElBQUcsQ0FBQyxJQUFJLEVBQUM7WUFDTCxPQUFPLEtBQUssQ0FBQztTQUNoQjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFDRDs7O09BR0c7SUFDSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBZ0I7UUFDM0MsSUFBRyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsRUFBQztZQUNyQyxPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsT0FBTyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDMUQsQ0FBQzs7QUEvR0wsaUNBZ0hDO0FBOUdrQiwrQ0FBZ0MsR0FBMEMsRUFBRSxDQUFDO0FBQzdFLHVCQUFRLEdBQUcsS0FBSyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50SW5mbyB9IGZyb20gXCIuLi9kZWZpbmVcIjtcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XHJcbmltcG9ydCBUb29scyBmcm9tIFwiLi90b29sc1wiO1xyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21wb25lbnRVdGlscyB7XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2NvbXBvbmVudEZpbGVJZF8yX2NvbXBvbmVudEluZm8gOiB7W2ZpbGVkSWQgOiBzdHJpbmddIDogQ29tcG9uZW50SW5mb30gPSB7fTtcclxuICAgIHByaXZhdGUgc3RhdGljIF9iSW5pdGVkID0gZmFsc2U7XHJcbiAgICAvKipcclxuICAgICAqIOa4heeQhlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIENsZWFyKCl7XHJcbiAgICAgICAgdGhpcy5fY29tcG9uZW50RmlsZUlkXzJfY29tcG9uZW50SW5mbyAgICA9IHt9O1xyXG4gICAgICAgIHRoaXMuX2JJbml0ZWQgICA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5Yid5aeL5YyWXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgSW5pdCgpe1xyXG4gICAgICAgIHRoaXMuQ2xlYXIoKTtcclxuICAgICAgICBjb25zdCBwcmpSb290RGlyICAgID0gRWRpdG9yLlByb2plY3QucGF0aDtcclxuICAgICAgICBsZXQgYXNzZW1ibHlSZWNvcmRKc0ZpbGVQYXRoID0gcGF0aC5qb2luKHByalJvb3REaXIsIFwidGVtcFwiLCBcInByb2dyYW1taW5nXCIsIFwicGFja2VyLWRyaXZlclwiLCBcInRhcmdldHNcIiwgXCJlZGl0b3JcIiwgXCJhc3NlbWJseS1yZWNvcmQuanNvblwiKTtcclxuICAgICAgICBpZighZnMuZXhpc3RzU3luYyhhc3NlbWJseVJlY29yZEpzRmlsZVBhdGgpKXtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuaJvuWIsOaMh+WumuaWh+S7tu+8mlwiLGFzc2VtYmx5UmVjb3JkSnNGaWxlUGF0aCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgYXNzZW1ibHlSZWNvcmRUZXh0ID0gZnMucmVhZEZpbGVTeW5jKGFzc2VtYmx5UmVjb3JkSnNGaWxlUGF0aCwgeyBlbmNvZGluZzogXCJ1dGYtOFwiIH0pO1xyXG4gICAgICAgIGNvbnN0IGFzc2VtYmx5UmVjb3JkRGF0YSA9IEpTT04ucGFyc2UoYXNzZW1ibHlSZWNvcmRUZXh0KTtcclxuXHJcbiAgICAgICAgVG9vbHMuZm9yRWFjaE1hcChhc3NlbWJseVJlY29yZERhdGEuZW50cmllcyB8fCB7fSwgKHRzRmlsZVBhdGgsIGNodW5rSWQpID0+IHtcclxuICAgICAgICAgICAgdHNGaWxlUGF0aCA9IHBhdGgubm9ybWFsaXplKHRzRmlsZVBhdGgpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGNodW5rRmlsZVBhdGggPSBwYXRoLmpvaW4ocHJqUm9vdERpciwgXCJ0ZW1wXCIsIFwicHJvZ3JhbW1pbmdcIiwgXCJwYWNrZXItZHJpdmVyXCIsIFwidGFyZ2V0c1wiLCBcImVkaXRvclwiLCBcImNodW5rc1wiLCBjaHVua0lkLnN1YnN0cmluZygwLCAyKSwgVG9vbHMuZm9ybWF0KFwiJXMuanNcIiwgY2h1bmtJZCkpO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImZvclwiLCB0c0ZpbGVQYXRoLCBjaHVua0lkLCBjaHVua0ZpbGVQYXRoKVxyXG4gICAgICAgICAgICBsZXQgY2h1bmtGaWxlVGV4dCA9IGZzLnJlYWRGaWxlU3luYyhjaHVua0ZpbGVQYXRoLCB7IGVuY29kaW5nOiBcInV0Zi04XCIgfSk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiY2h1bmtGaWxlVGV4dFwiLCBjaHVua0ZpbGVUZXh0KTtcclxuXHJcbiAgICAgICAgICAgIC8vIOi/memHjOmcgOimgeaPkOWPluWHoOS4quS/oeaBr1xyXG4gICAgICAgICAgICAvLyAxLiDmn6Xmib7nrKzkuIDkuKogX2V4cG9ydChcIiglY2xhc3NOYW1lJSlcIi4uLiBjY2NsYXNzKO+8jOaPkOWPlmNsYXNzTmFtZVxyXG4gICAgICAgICAgICAvLyAyLiDmn6Xmib4gX2NjbGVnYWN5Ll9SRi5wdXNoKHt9LCBcIiglZmlsZWlkJSlcIu+8jOaPkOWPlmZpbGVJZFxyXG4gICAgICAgICAgICAvLyAzLiDlpoLmnpzlrZjlnKhjbGFzc05hbWXvvIzliJnor7TmmI7ov5nkuKrnu4Tku7booqvlr7zlh7rliLDkuobku6PnoIHkuK1cclxuICAgICAgICAgICAgLy8gXHJcbiAgICAgICAgICAgIGxldCBjbGFzc05hbWVSZXQgPSBjaHVua0ZpbGVUZXh0Lm1hdGNoKC9jY2NsYXNzXFwoW1xcXCJcXCddKFteXFxcIlxcJ10rKS8pO1xyXG4gICAgICAgICAgICBsZXQgZGVmYXVsdENsYXNzTmFtZVJldCA9IGNodW5rRmlsZVRleHQubWF0Y2goL19leHBvcnRcXChcXFwiZGVmYXVsdC4qY2NjbGFzc1xcKC4qX2NsYXNzID0gY2xhc3MgKFteIF0rKSBleHRlbmRzLyk7XHJcbiAgICAgICAgICAgIGxldCBmaWxlSWRSZXQgPSBjaHVua0ZpbGVUZXh0Lm1hdGNoKC9fY2NsZWdhY3lcXC5fUkZcXC5wdXNoXFwoXFx7XFx9XFwsIFxcXCIoW15cXFwiXSspLyk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiY2xhc3NOYW1lUmV0XCIsIGNsYXNzTmFtZVJldCAmJiBjbGFzc05hbWVSZXRbMV0pO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImRlZmF1bHRDbGFzc05hbWVSZXRcIiwgZGVmYXVsdENsYXNzTmFtZVJldCAmJiBkZWZhdWx0Q2xhc3NOYW1lUmV0WzFdKTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJmaWxlSWRSZXRcIiwgZmlsZUlkUmV0ICYmIGZpbGVJZFJldFsxXSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZmlsZUlkID0gbnVsbDtcclxuICAgICAgICAgICAgbGV0IGNsYXNzTmFtZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAoZmlsZUlkUmV0KSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlSWQgPSBmaWxlSWRSZXRbMV07XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGJEZWZhdWx0RXhwb3J0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGlmIChkZWZhdWx0Q2xhc3NOYW1lUmV0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gZGVmYXVsdENsYXNzTmFtZVJldFsxXTtcclxuICAgICAgICAgICAgICAgICAgICBiRGVmYXVsdEV4cG9ydCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZVJldCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9IGNsYXNzTmFtZVJldFsxXTtcclxuICAgICAgICAgICAgICAgICAgICBiRGVmYXVsdEV4cG9ydCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmaWxlSWQgJiYgY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNjcmlwdEZpbGVQYXRoID0gdHNGaWxlUGF0aC5zdWJzdHJpbmcoNiwgdHNGaWxlUGF0aC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHNjcmlwdEZpbGVQYXRoLmluY2x1ZGVzKFwiYXNzZXRzXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy/ojrflj5bnm7jlr7not6/lvoRcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0RmlsZVBhdGggPSBzY3JpcHRGaWxlUGF0aC5zdWJzdHJpbmcoc2NyaXB0RmlsZVBhdGguaW5kZXhPZihcImFzc2V0c1wiKSxzY3JpcHRGaWxlUGF0aC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZihzY3JpcHRGaWxlUGF0aC5lbmRzV2l0aChcIi50c1wiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdEZpbGVQYXRoID0gc2NyaXB0RmlsZVBhdGguc3Vic3RyaW5nKDAsc2NyaXB0RmlsZVBhdGgubGVuZ3RoIC0gMykucmVwbGFjZUFsbChcIlxcXFxcIixcIi9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdEZpbGVQYXRoID0gXCJkYjovL1wiICsgc2NyaXB0RmlsZVBhdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50RmlsZUlkXzJfY29tcG9uZW50SW5mb1tmaWxlSWRdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IGNsYXNzTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0RmlsZVBhdGg6IHNjcmlwdEZpbGVQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiRGVmYXVsdEV4cG9ydDogYkRlZmF1bHRFeHBvcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwi6Kej5p6Q5Yiw5YWo5bGA57uE5Lu25L+h5oGv77yaXCIsZmlsZUlkLGNsYXNzTmFtZSxzY3JpcHRGaWxlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9iSW5pdGVkICAgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5paw5aKe5LiA5Liq57uE5Lu25L+h5oGvXHJcbiAgICAgKiBAcGFyYW0gZmlsZWRJZCBcclxuICAgICAqIEBwYXJhbSBpbmZvIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIEFkZENvbXBvbmVudEluZm8oZmlsZWRJZCA6IHN0cmluZyxpbmZvIDogQ29tcG9uZW50SW5mbyl7XHJcbiAgICAgICAgdGhpcy5fY29tcG9uZW50RmlsZUlkXzJfY29tcG9uZW50SW5mb1tmaWxlZElkXSAgID0gaW5mbztcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog5piv5ZCm5a2Y5Zyo6L+Z5Liq57uE5Lu25L+h5oGvXHJcbiAgICAgKiBAcGFyYW0gZmlsZWRJZCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBJc0NvbnRhaW5Db21wb25lbnRJbmZvKGZpbGVkSWQgOiBzdHJpbmcpIDogYm9vbGVhbiB7XHJcbiAgICAgICAgY29uc3QgaW5mbyAgPSB0aGlzLl9jb21wb25lbnRGaWxlSWRfMl9jb21wb25lbnRJbmZvW2ZpbGVkSWRdO1xyXG4gICAgICAgIGlmKCFpbmZvKXtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog6I635Y+W5oyH5a6a55qE57uE5Lu25L+h5oGvXHJcbiAgICAgKiBAcGFyYW0gZmlsZWRJZCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBHZXRDb21wb25lbnRJbmZvKGZpbGVkSWQgOiBzdHJpbmcpIDogQ29tcG9uZW50SW5mbyB8IG51bGwge1xyXG4gICAgICAgIGlmKCF0aGlzLklzQ29udGFpbkNvbXBvbmVudEluZm8oZmlsZWRJZCkpe1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbXBvbmVudEZpbGVJZF8yX2NvbXBvbmVudEluZm9bZmlsZWRJZF07XHJcbiAgICB9XHJcbn0iXX0=