"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const tools_1 = __importDefault(require("./tools"));
const os = __importStar(require("os"));
const p_path = os.platform() === 'darwin' ? '\/' : '\\';
class PrefabUtils {
    static Clear() {
        this._prefabUuid_2_prefabFilePath = {};
        this._bInitedBundles = [];
    }
    /**
     * 指定名字的bundle是否初始化了
     * @param bundleName
     */
    static IsBundleInited(bundleName) {
        for (let i = 0; i < this._bInitedBundles.length; i++) {
            const info = this._bInitedBundles[i];
            if (info.bundleName == bundleName) {
                return true;
            }
        }
        return false;
        //return this._bInitedBundles.includes(bundleName);
    }
    /**
     * 初始化指定bundle的预制体数据
     * @param bundleInfo 需要加载的bundle的数据
     */
    static InitBundle(bundleInfo) {
        let prefabDir = path_1.default.join(bundleInfo.url, `prefabs${p_path}`).replaceAll("\\", "/");
        console.log("------------------预制体文件夹：", prefabDir);
        tools_1.default.foreachDir(prefabDir, (filePath) => {
            console.log("获取到文件：" + filePath);
            if (!filePath.endsWith(".prefab")) {
                return;
            }
            let uuid = tools_1.default.loadUuidFromMetaFilePath(filePath + ".meta");
            //console.log("获取到预制体的uuid：",filePath,uuid);
            if (uuid) {
                this._prefabUuid_2_prefabFilePath[uuid] = filePath;
            }
        });
        this._bInitedBundles.push(bundleInfo);
    }
    /**
     * 根据uuid获取一个prefab预制体的路径
     * @param uuid
     */
    static GetPrefabFilePath(uuid) {
        if (!this._prefabUuid_2_prefabFilePath[uuid]) {
            return null;
        }
        return this._prefabUuid_2_prefabFilePath[uuid];
    }
}
exports.default = PrefabUtils;
PrefabUtils._prefabUuid_2_prefabFilePath = {};
/**
 * 已经初始化的bundle
 */
PrefabUtils._bInitedBundles = [];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmFiLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3V0aWxzL3ByZWZhYi11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUU1Qix1Q0FBeUI7QUFDekIsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFFeEQsTUFBcUIsV0FBVztJQU1yQixNQUFNLENBQUMsS0FBSztRQUNmLElBQUksQ0FBQyw0QkFBNEIsR0FBSyxFQUFFLENBQUM7UUFDekMsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7SUFDOUIsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBbUI7UUFDNUMsS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDO1lBQzVDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckMsSUFBRyxJQUFJLENBQUMsVUFBVSxJQUFJLFVBQVUsRUFBQztnQkFDN0IsT0FBTyxJQUFJLENBQUM7YUFDZjtTQUNKO1FBQ0QsT0FBTyxLQUFLLENBQUM7UUFDYixtREFBbUQ7SUFDdkQsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBNEI7UUFFakQsSUFBSSxTQUFTLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFDLFVBQVUsTUFBTSxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xGLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEVBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkQsZUFBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUMsQ0FBQyxRQUFpQixFQUFDLEVBQUU7WUFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUM7WUFDakMsSUFBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUM7Z0JBQzdCLE9BQU87YUFDVjtZQUNELElBQUksSUFBSSxHQUFHLGVBQUssQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLENBQUM7WUFDOUQsNENBQTRDO1lBQzVDLElBQUcsSUFBSSxFQUFDO2dCQUNKLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUM7YUFDdEQ7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRDs7O09BR0c7SUFDSSxNQUFNLENBQUMsaUJBQWlCLENBQUMsSUFBYTtRQUN6QyxJQUFHLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxFQUFDO1lBQ3hDLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7UUFDRCxPQUFPLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuRCxDQUFDOztBQXpETCw4QkEwREM7QUF6RGtCLHdDQUE0QixHQUFtQyxFQUFFLENBQUM7QUFDakY7O0dBRUc7QUFDWSwyQkFBZSxHQUFpQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgVG9vbHMgZnJvbSBcIi4vdG9vbHNcIjtcclxuaW1wb3J0IHsgQXNzZXRCdW5kbGVJbmZvLCBCdWlsdGluQnVuZGxlTmFtZSB9IGZyb20gXCIuLi9kZWZpbmVcIjtcclxuaW1wb3J0ICogYXMgb3MgZnJvbSAnb3MnO1xyXG5jb25zdCBwX3BhdGggPSBvcy5wbGF0Zm9ybSgpID09PSAnZGFyd2luJyA/ICdcXC8nIDogJ1xcXFwnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJlZmFiVXRpbHN7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBfcHJlZmFiVXVpZF8yX3ByZWZhYkZpbGVQYXRoIDoge1t1dWlkIDogc3RyaW5nXSA6IHN0cmluZ30gICAgPSB7fTtcclxuICAgIC8qKlxyXG4gICAgICog5bey57uP5Yid5aeL5YyW55qEYnVuZGxlXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgc3RhdGljIF9iSW5pdGVkQnVuZGxlcyA6IEFzc2V0QnVuZGxlSW5mb1tdICAgICAgICAgICA9IFtdO1xyXG4gICAgcHVibGljIHN0YXRpYyBDbGVhcigpe1xyXG4gICAgICAgIHRoaXMuX3ByZWZhYlV1aWRfMl9wcmVmYWJGaWxlUGF0aCAgID0ge307XHJcbiAgICAgICAgdGhpcy5fYkluaXRlZEJ1bmRsZXMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOaMh+WumuWQjeWtl+eahGJ1bmRsZeaYr+WQpuWIneWni+WMluS6hlxyXG4gICAgICogQHBhcmFtIGJ1bmRsZU5hbWUgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgSXNCdW5kbGVJbml0ZWQoYnVuZGxlTmFtZSA6IHN0cmluZyl7XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpPHRoaXMuX2JJbml0ZWRCdW5kbGVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5fYkluaXRlZEJ1bmRsZXNbaV07XHJcbiAgICAgICAgICAgIGlmKGluZm8uYnVuZGxlTmFtZSA9PSBidW5kbGVOYW1lKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAvL3JldHVybiB0aGlzLl9iSW5pdGVkQnVuZGxlcy5pbmNsdWRlcyhidW5kbGVOYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOWIneWni+WMluaMh+WummJ1bmRsZeeahOmihOWItuS9k+aVsOaNrlxyXG4gICAgICogQHBhcmFtIGJ1bmRsZUluZm8g6ZyA6KaB5Yqg6L2955qEYnVuZGxl55qE5pWw5o2uIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIEluaXRCdW5kbGUoYnVuZGxlSW5mbyA6IEFzc2V0QnVuZGxlSW5mbyl7XHJcblxyXG4gICAgICAgIGxldCBwcmVmYWJEaXIgPSBwYXRoLmpvaW4oYnVuZGxlSW5mby51cmwsYHByZWZhYnMke3BfcGF0aH1gKS5yZXBsYWNlQWxsKFwiXFxcXFwiLFwiL1wiKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIi0tLS0tLS0tLS0tLS0tLS0tLemihOWItuS9k+aWh+S7tuWkue+8mlwiLHByZWZhYkRpcik7XHJcbiAgICAgICAgVG9vbHMuZm9yZWFjaERpcihwcmVmYWJEaXIsKGZpbGVQYXRoIDogc3RyaW5nKT0+e1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuiOt+WPluWIsOaWh+S7tu+8mlwiICsgZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICBpZighZmlsZVBhdGguZW5kc1dpdGgoXCIucHJlZmFiXCIpKXtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgdXVpZCA9IFRvb2xzLmxvYWRVdWlkRnJvbU1ldGFGaWxlUGF0aChmaWxlUGF0aCArIFwiLm1ldGFcIik7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCLojrflj5bliLDpooTliLbkvZPnmoR1dWlk77yaXCIsZmlsZVBhdGgsdXVpZCk7XHJcbiAgICAgICAgICAgIGlmKHV1aWQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcHJlZmFiVXVpZF8yX3ByZWZhYkZpbGVQYXRoW3V1aWRdID0gZmlsZVBhdGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9iSW5pdGVkQnVuZGxlcy5wdXNoKGJ1bmRsZUluZm8pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5qC55o2udXVpZOiOt+WPluS4gOS4qnByZWZhYumihOWItuS9k+eahOi3r+W+hFxyXG4gICAgICogQHBhcmFtIHV1aWQgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgR2V0UHJlZmFiRmlsZVBhdGgodXVpZCA6IHN0cmluZykgOiBzdHJpbmcgfCBudWxsIHtcclxuICAgICAgICBpZighdGhpcy5fcHJlZmFiVXVpZF8yX3ByZWZhYkZpbGVQYXRoW3V1aWRdKXtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9wcmVmYWJVdWlkXzJfcHJlZmFiRmlsZVBhdGhbdXVpZF07XHJcbiAgICB9XHJcbn0iXX0=