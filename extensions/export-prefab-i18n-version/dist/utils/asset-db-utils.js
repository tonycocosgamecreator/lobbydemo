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
exports.AssetDbUtils = void 0;
const define_1 = require("../define");
const path_1 = __importDefault(require("path"));
const os = __importStar(require("os"));
const p_path = os.platform() === 'darwin' ? '\/' : '\\';
class AssetDbUtils {
    /**
     * 发送消息，要求编辑器重新导入指定路径或者uuid的资源
     * @param url 资源的路径或者url
     */
    static async RequestReimportAsset(url) {
        const result = await Editor.Message.request("asset-db", "reimport-asset", url);
        define_1.DEBUG && console.log("要求刷新资源：", url, result);
        return result;
    }
    /**
     *
     * @param source 绝对地址
     * @param url asset-db url
     */
    static async RequestImportAsset(source, url) {
        define_1.DEBUG && console.log("要求导入资源：", source, url);
        const result = await Editor.Message.request("asset-db", "import-asset", source, url);
        return result;
    }
    /**
     * 要求创建一个资源
     * @param url
     * @param text
     */
    static async RequestCreateNewAsset(url, text, overwrite = true) {
        return await Editor.Message.request("asset-db", "create-asset", url, text, { overwrite: overwrite });
    }
    /**
     * 根据指定的uuid或者url获取一个资源的信息
     * @param uuidOrPath
     */
    static async RequestQueryAssetInfo(uuidOrPath) {
        return await Editor.Message.request("asset-db", "query-asset-info", uuidOrPath);
    }
    /**
     * 根据给定的路径获得bundle名字
     * @param url 例如：db://assets/bundles/demos/prefabs
     * @param bI18N 是否i18n模式
     */
    static GetBundleNameWithDbUrl(url) {
        const projectDir = Editor.Project.path;
        //console.log("当前项目路径：",projectDir);
        const lIndex = url.lastIndexOf("/") + 1;
        const lIndex1 = url.lastIndexOf(".prefab");
        const prefabName = url.substring(lIndex, lIndex1);
        const prefabsFolder = url.indexOf("prefabs");
        const stIndex = prefabsFolder + "prefabs".length + 1;
        let prefabSubUrl = "";
        if (stIndex != lIndex) {
            prefabSubUrl = url.substring(stIndex, lIndex - 1);
        }
        //console.log("prefabSubUrl = " + prefabSubUrl);
        const info = {
            url: '',
            db_url: '',
            bundleName: '',
            prefabName: prefabName,
            prefabSubUrl: prefabSubUrl,
            i18n_labels: [],
        };
        if (url.includes("resources")) {
            info.url = path_1.default.join(projectDir, "assets", "resources").replaceAll("\\", "/"); //projectDir + `${p_path}assets${p_path}resources`;
            info.db_url = "db://assets/resources";
            info.bundleName = "resources";
            return info;
        }
        const pre = "db://assets/bundles/";
        const plen = pre.length;
        const str = url.substring(plen);
        const pIndex = str.indexOf("prefabs");
        const subUrl = str.substring(0, pIndex - 1);
        define_1.DEBUG && console.log("subUrl = " + subUrl);
        let bI18N = false;
        if (subUrl.includes("/")) {
            bI18N = true;
        }
        //不使用多语言环境
        if (!bI18N) {
            const pIndex = str.indexOf("/");
            const bundleName = str.substring(0, pIndex);
            info.bundleName = bundleName;
            info.url = projectDir + `${p_path}assets${p_path}bundles${p_path}` + bundleName;
            info.db_url = "db://assets/bundles/" + bundleName;
            return info;
        }
        //如果使用多语言，那么就只能倒着推上去
        const prefabIndex = url.lastIndexOf("prefabs");
        if (prefabIndex == -1) {
            console.error("请将需要导出的预制体，放到prefabs目录下！");
            return null;
        }
        const sub = url.substring(0, prefabIndex - 1);
        //console.log("切断：",sub);
        const lastIndex = sub.lastIndexOf("/") + 1;
        const bundleName = sub.substring(lastIndex, sub.length);
        info.url = projectDir + `${p_path}assets${p_path}bundles${p_path}` + subUrl.replace("/", p_path);
        info.db_url = sub;
        info.bundleName = bundleName;
        return info;
    }
    /**
     * 根据Prefab的地址获取一个AssetBundleInfo
     * @param prefabPath
     */
    static getAsssetBundleInfoByPath(prefabPath) {
        prefabPath = prefabPath.replaceAll("\\", "/");
        const prefabName = prefabPath.substring(prefabPath.lastIndexOf("/") + 1, prefabPath.length - 7);
        const prefabsFolder = prefabPath.indexOf("prefabs");
        let prefabSubUrl = "";
        const stIndex = prefabsFolder + "prefabs".length + 1;
        const lastSpIndex = prefabPath.lastIndexOf("/") + 1;
        if (stIndex != lastSpIndex) {
            prefabSubUrl = prefabPath.substring(stIndex, lastSpIndex - 1);
        }
        console.log("预制体名字：", prefabName);
        console.log("预制体子路径：", prefabSubUrl);
        const info = {
            url: "",
            db_url: "",
            bundleName: "",
            prefabName: prefabName,
            prefabSubUrl: prefabSubUrl,
            i18n_labels: [],
        };
        const index = prefabPath.indexOf("assets");
        const url = prefabPath.substring(index, prefabPath.length);
        let bundleId = "";
        if (url.includes("resources")) {
            bundleId = "resources";
        }
        else {
            //获取bundles字符串的位置
            const bundlesIndex = url.indexOf("bundles");
            //从bundlesIndex开始，找下一个 /
            const nextSlashIndex = url.indexOf("/", bundlesIndex + 8);
            bundleId = url.substring(bundlesIndex + 8, nextSlashIndex);
        }
        info.bundleName = bundleId;
        let url0 = path_1.default.join(Editor.Project.path, "assets");
        //info.db_url     = "db://" + lSub.replace(p_path,"/");
        let db_url = "db://assets/";
        if (bundleId == "resources") {
            db_url = db_url + "resources/prefabs/";
            url0 = path_1.default.join(url0, "resources");
        }
        else {
            db_url = db_url + "bundles/" + bundleId + "/prefabs/";
            url0 = path_1.default.join(url0, "bundles", bundleId);
        }
        if (prefabSubUrl != "") {
            db_url = db_url + prefabSubUrl + "/";
        }
        db_url = db_url + prefabName;
        info.db_url = db_url;
        info.url = url0.replaceAll("\\", "/");
        return info;
    }
}
exports.AssetDbUtils = AssetDbUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtZGItdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdXRpbHMvYXNzZXQtZGItdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxzQ0FBbUQ7QUFDbkQsZ0RBQXdCO0FBQ3hCLHVDQUF5QjtBQUN6QixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUl4RCxNQUFhLFlBQVk7SUFFckI7OztPQUdHO0lBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxHQUFZO1FBQ2pELE1BQU0sTUFBTSxHQUFNLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFDLGdCQUFnQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hGLGNBQUssSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBQyxHQUFHLEVBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0MsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUNEOzs7O09BSUc7SUFDSSxNQUFNLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLE1BQWUsRUFBQyxHQUFZO1FBQy9ELGNBQUssSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBQyxNQUFNLEVBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0MsTUFBTSxNQUFNLEdBQU0sTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUMsY0FBYyxFQUFDLE1BQU0sRUFBQyxHQUFHLENBQUMsQ0FBQztRQUVyRixPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBQ0Q7Ozs7T0FJRztJQUNJLE1BQU0sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsR0FBWSxFQUFDLElBQXNCLEVBQUUs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LENBQUM7U0FDeEM7UUFDRCxNQUFNLEdBQUcsTUFBTSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7Q0FDSjtBQXhLRCxvQ0F3S0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBc3NldEluZm8gfSBmcm9tIFwiQGNvY29zL2NyZWF0b3ItdHlwZXMvZWRpdG9yL3BhY2thZ2VzL2Fzc2V0LWRiL0B0eXBlcy9wdWJsaWNcIjtcclxuaW1wb3J0IHsgQXNzZXRCdW5kbGVJbmZvLCBERUJVRyB9IGZyb20gXCIuLi9kZWZpbmVcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0ICogYXMgb3MgZnJvbSAnb3MnO1xyXG5jb25zdCBwX3BhdGggPSBvcy5wbGF0Zm9ybSgpID09PSAnZGFyd2luJyA/ICdcXC8nIDogJ1xcXFwnO1xyXG5cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgQXNzZXREYlV0aWxze1xyXG5cclxuICAgIC8qKlxyXG4gICAgICog5Y+R6YCB5raI5oGv77yM6KaB5rGC57yW6L6R5Zmo6YeN5paw5a+85YWl5oyH5a6a6Lev5b6E5oiW6ICFdXVpZOeahOi1hOa6kFxyXG4gICAgICogQHBhcmFtIHVybCDotYTmupDnmoTot6/lvoTmiJbogIV1cmxcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBSZXF1ZXN0UmVpbXBvcnRBc3NldCh1cmwgOiBzdHJpbmcpe1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCAgICA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLFwicmVpbXBvcnQtYXNzZXRcIix1cmwpO1xyXG4gICAgICAgIERFQlVHICYmIGNvbnNvbGUubG9nKFwi6KaB5rGC5Yi35paw6LWE5rqQ77yaXCIsdXJsLHJlc3VsdCk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBzb3VyY2Ug57ud5a+55Zyw5Z2AXHJcbiAgICAgKiBAcGFyYW0gdXJsIGFzc2V0LWRiIHVybFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIFJlcXVlc3RJbXBvcnRBc3NldChzb3VyY2UgOiBzdHJpbmcsdXJsIDogc3RyaW5nKXtcclxuICAgICAgICBERUJVRyAmJiBjb25zb2xlLmxvZyhcIuimgeaxguWvvOWFpei1hOa6kO+8mlwiLHNvdXJjZSx1cmwpO1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCAgICA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLFwiaW1wb3J0LWFzc2V0XCIsc291cmNlLHVybCk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOimgeaxguWIm+W7uuS4gOS4qui1hOa6kFxyXG4gICAgICogQHBhcmFtIHVybFxyXG4gICAgICogQHBhcmFtIHRleHRcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBSZXF1ZXN0Q3JlYXRlTmV3QXNzZXQodXJsIDogc3RyaW5nLHRleHQgOiBzdHJpbmcgfCBCdWZmZXIgLG92ZXJ3cml0ZSA9IHRydWUpe1xyXG4gICAgICAgIHJldHVybiBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiYXNzZXQtZGJcIixcImNyZWF0ZS1hc3NldFwiLCB1cmwsIHRleHQsIHtvdmVyd3JpdGUgOiBvdmVyd3JpdGV9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOagueaNruaMh+WumueahHV1aWTmiJbogIV1cmzojrflj5bkuIDkuKrotYTmupDnmoTkv6Hmga9cclxuICAgICAqIEBwYXJhbSB1dWlkT3JQYXRoXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgYXN5bmMgUmVxdWVzdFF1ZXJ5QXNzZXRJbmZvKHV1aWRPclBhdGggOiBzdHJpbmcpIDogUHJvbWlzZTxBc3NldEluZm8gfCBudWxsPiB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJhc3NldC1kYlwiLFwicXVlcnktYXNzZXQtaW5mb1wiLHV1aWRPclBhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5qC55o2u57uZ5a6a55qE6Lev5b6E6I635b6XYnVuZGxl5ZCN5a2XXHJcbiAgICAgKiBAcGFyYW0gdXJsIOS+i+Wmgu+8mmRiOi8vYXNzZXRzL2J1bmRsZXMvZGVtb3MvcHJlZmFic1xyXG4gICAgICogQHBhcmFtIGJJMThOIOaYr+WQpmkxOG7mqKHlvI9cclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBHZXRCdW5kbGVOYW1lV2l0aERiVXJsKHVybCA6IHN0cmluZykgOiBBc3NldEJ1bmRsZUluZm8gfCBudWxse1xyXG4gICAgICAgIGNvbnN0IHByb2plY3REaXIgICAgPSBFZGl0b3IuUHJvamVjdC5wYXRoO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coXCLlvZPliY3pobnnm67ot6/lvoTvvJpcIixwcm9qZWN0RGlyKTtcclxuICAgICAgICBjb25zdCBsSW5kZXggICAgPSB1cmwubGFzdEluZGV4T2YoXCIvXCIpICsgMTtcclxuICAgICAgICBjb25zdCBsSW5kZXgxICAgPSB1cmwubGFzdEluZGV4T2YoXCIucHJlZmFiXCIpO1xyXG4gICAgICAgIGNvbnN0IHByZWZhYk5hbWUgICAgPSB1cmwuc3Vic3RyaW5nKGxJbmRleCxsSW5kZXgxKTtcclxuICAgICAgICBjb25zdCBwcmVmYWJzRm9sZGVyID0gdXJsLmluZGV4T2YoXCJwcmVmYWJzXCIpO1xyXG4gICAgICAgIGNvbnN0IHN0SW5kZXggPSBwcmVmYWJzRm9sZGVyICsgXCJwcmVmYWJzXCIubGVuZ3RoICsgMTtcclxuICAgICAgICBsZXQgcHJlZmFiU3ViVXJsID0gXCJcIjtcclxuICAgICAgICBpZihzdEluZGV4ICE9IGxJbmRleCl7XHJcbiAgICAgICAgICAgIHByZWZhYlN1YlVybCA9IHVybC5zdWJzdHJpbmcoc3RJbmRleCxsSW5kZXggLSAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcInByZWZhYlN1YlVybCA9IFwiICsgcHJlZmFiU3ViVXJsKTtcclxuICAgICAgICBjb25zdCBpbmZvIDogQXNzZXRCdW5kbGVJbmZvID0ge1xyXG4gICAgICAgICAgICB1cmwgICAgICAgICA6ICcnLFxyXG4gICAgICAgICAgICBkYl91cmwgICAgICA6ICcnLFxyXG4gICAgICAgICAgICBidW5kbGVOYW1lICA6ICcnLFxyXG4gICAgICAgICAgICBwcmVmYWJOYW1lICA6IHByZWZhYk5hbWUsXHJcbiAgICAgICAgICAgIHByZWZhYlN1YlVybCA6IHByZWZhYlN1YlVybCxcclxuICAgICAgICAgICAgaTE4bl9sYWJlbHMgOiBbXSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZih1cmwuaW5jbHVkZXMoXCJyZXNvdXJjZXNcIikpe1xyXG4gICAgICAgICAgICBpbmZvLnVybCAgICAgICAgPSBwYXRoLmpvaW4ocHJvamVjdERpcixcImFzc2V0c1wiLFwicmVzb3VyY2VzXCIpLnJlcGxhY2VBbGwoXCJcXFxcXCIsXCIvXCIpOy8vcHJvamVjdERpciArIGAke3BfcGF0aH1hc3NldHMke3BfcGF0aH1yZXNvdXJjZXNgO1xyXG4gICAgICAgICAgICBpbmZvLmRiX3VybCAgICAgPSBcImRiOi8vYXNzZXRzL3Jlc291cmNlc1wiO1xyXG4gICAgICAgICAgICBpbmZvLmJ1bmRsZU5hbWUgPSBcInJlc291cmNlc1wiO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5mbztcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcHJlICAgICAgID0gXCJkYjovL2Fzc2V0cy9idW5kbGVzL1wiO1xyXG4gICAgICAgIGNvbnN0IHBsZW4gICAgICA9IHByZS5sZW5ndGg7XHJcbiAgICAgICAgY29uc3Qgc3RyICAgICAgID0gdXJsLnN1YnN0cmluZyhwbGVuKTtcclxuICAgICAgICBjb25zdCBwSW5kZXggICAgPSBzdHIuaW5kZXhPZihcInByZWZhYnNcIik7XHJcbiAgICAgICAgY29uc3Qgc3ViVXJsICAgID0gc3RyLnN1YnN0cmluZygwLHBJbmRleCAtIDEpO1xyXG4gICAgICAgIERFQlVHICYmIGNvbnNvbGUubG9nKFwic3ViVXJsID0gXCIgKyBzdWJVcmwpO1xyXG4gICAgICAgIGxldCBiSTE4TiAgICAgICA9IGZhbHNlO1xyXG4gICAgICAgIGlmKHN1YlVybC5pbmNsdWRlcyhcIi9cIikpe1xyXG4gICAgICAgICAgICBiSTE4TiAgICAgICA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8v5LiN5L2/55So5aSa6K+t6KiA546v5aKDXHJcbiAgICAgICAgaWYoIWJJMThOKXtcclxuICAgICAgICAgICAgY29uc3QgcEluZGV4ICAgID0gc3RyLmluZGV4T2YoXCIvXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBidW5kbGVOYW1lICAgID0gIHN0ci5zdWJzdHJpbmcoMCxwSW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgaW5mby5idW5kbGVOYW1lID0gYnVuZGxlTmFtZTtcclxuICAgICAgICAgICAgaW5mby51cmwgICAgICAgID0gcHJvamVjdERpciArIGAke3BfcGF0aH1hc3NldHMke3BfcGF0aH1idW5kbGVzJHtwX3BhdGh9YCArIGJ1bmRsZU5hbWU7XHJcbiAgICAgICAgICAgIGluZm8uZGJfdXJsICAgICA9IFwiZGI6Ly9hc3NldHMvYnVuZGxlcy9cIiArIGJ1bmRsZU5hbWU7XHJcbiAgICAgICAgICAgIHJldHVybiBpbmZvO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL+WmguaenOS9v+eUqOWkmuivreiogO+8jOmCo+S5iOWwseWPquiDveWAkuedgOaOqOS4iuWOu1xyXG4gICAgICAgIGNvbnN0IHByZWZhYkluZGV4ID0gdXJsLmxhc3RJbmRleE9mKFwicHJlZmFic1wiKTtcclxuICAgICAgICBpZihwcmVmYWJJbmRleCA9PSAtMSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLor7flsIbpnIDopoHlr7zlh7rnmoTpooTliLbkvZPvvIzmlL7liLBwcmVmYWJz55uu5b2V5LiL77yBXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc3ViICAgPSB1cmwuc3Vic3RyaW5nKDAscHJlZmFiSW5kZXggLSAxKTtcclxuXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIuWIh+aWre+8mlwiLHN1Yik7XHJcbiAgICAgICAgY29uc3QgbGFzdEluZGV4ID0gc3ViLmxhc3RJbmRleE9mKFwiL1wiKSArIDE7XHJcbiAgICAgICAgY29uc3QgYnVuZGxlTmFtZSAgICA9IHN1Yi5zdWJzdHJpbmcobGFzdEluZGV4LHN1Yi5sZW5ndGgpO1xyXG4gICAgICAgIGluZm8udXJsICAgICAgICA9IHByb2plY3REaXIgKyBgJHtwX3BhdGh9YXNzZXRzJHtwX3BhdGh9YnVuZGxlcyR7cF9wYXRofWAgKyBzdWJVcmwucmVwbGFjZShcIi9cIiwgcF9wYXRoKTtcclxuICAgICAgICBpbmZvLmRiX3VybCAgICAgPSBzdWI7XHJcbiAgICAgICAgaW5mby5idW5kbGVOYW1lID0gYnVuZGxlTmFtZTtcclxuICAgICAgICByZXR1cm4gaW5mbztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOagueaNrlByZWZhYueahOWcsOWdgOiOt+WPluS4gOS4qkFzc2V0QnVuZGxlSW5mb1xyXG4gICAgICogQHBhcmFtIHByZWZhYlBhdGggXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0QXNzc2V0QnVuZGxlSW5mb0J5UGF0aChwcmVmYWJQYXRoIDogc3RyaW5nKSA6IEFzc2V0QnVuZGxlSW5mbyB8IG51bGwge1xyXG4gICAgICAgIHByZWZhYlBhdGggPSBwcmVmYWJQYXRoLnJlcGxhY2VBbGwoXCJcXFxcXCIsXCIvXCIpO1xyXG4gICAgICAgIGNvbnN0IHByZWZhYk5hbWUgICAgPSBwcmVmYWJQYXRoLnN1YnN0cmluZyhwcmVmYWJQYXRoLmxhc3RJbmRleE9mKFwiL1wiKSArIDEscHJlZmFiUGF0aC5sZW5ndGggLSA3KTtcclxuICAgICAgICBjb25zdCBwcmVmYWJzRm9sZGVyID0gcHJlZmFiUGF0aC5pbmRleE9mKFwicHJlZmFic1wiKTtcclxuICAgICAgICBsZXQgcHJlZmFiU3ViVXJsID0gXCJcIjtcclxuICAgICAgICBjb25zdCBzdEluZGV4ID0gcHJlZmFic0ZvbGRlciArIFwicHJlZmFic1wiLmxlbmd0aCArIDE7XHJcbiAgICAgICAgY29uc3QgbGFzdFNwSW5kZXggPSBwcmVmYWJQYXRoLmxhc3RJbmRleE9mKFwiL1wiKSArIDE7XHJcbiAgICAgICAgaWYoc3RJbmRleCAhPSBsYXN0U3BJbmRleCl7XHJcbiAgICAgICAgICAgIHByZWZhYlN1YlVybCA9IHByZWZhYlBhdGguc3Vic3RyaW5nKHN0SW5kZXgsbGFzdFNwSW5kZXggLSAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS5sb2coXCLpooTliLbkvZPlkI3lrZfvvJpcIixwcmVmYWJOYW1lKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIumihOWItuS9k+WtkOi3r+W+hO+8mlwiLHByZWZhYlN1YlVybCk7XHJcbiAgICAgICAgY29uc3QgaW5mbyA6IEFzc2V0QnVuZGxlSW5mbyA9IHtcclxuICAgICAgICAgICAgdXJsICAgICAgICAgOiBcIlwiLFxyXG4gICAgICAgICAgICBkYl91cmwgICAgICA6IFwiXCIsXHJcbiAgICAgICAgICAgIGJ1bmRsZU5hbWUgIDogXCJcIixcclxuICAgICAgICAgICAgcHJlZmFiTmFtZSAgOiBwcmVmYWJOYW1lLFxyXG4gICAgICAgICAgICBwcmVmYWJTdWJVcmwgOiBwcmVmYWJTdWJVcmwsXHJcbiAgICAgICAgICAgIGkxOG5fbGFiZWxzIDogW10sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBwcmVmYWJQYXRoLmluZGV4T2YoXCJhc3NldHNcIik7XHJcbiAgICAgICAgY29uc3QgdXJsICAgPSBwcmVmYWJQYXRoLnN1YnN0cmluZyhpbmRleCxwcmVmYWJQYXRoLmxlbmd0aCk7XHJcbiAgICAgICAgbGV0IGJ1bmRsZUlkID0gXCJcIjtcclxuICAgICAgICBpZih1cmwuaW5jbHVkZXMoXCJyZXNvdXJjZXNcIikpe1xyXG4gICAgICAgICAgICBidW5kbGVJZCA9IFwicmVzb3VyY2VzXCI7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIC8v6I635Y+WYnVuZGxlc+Wtl+espuS4sueahOS9jee9rlxyXG4gICAgICAgICAgICBjb25zdCBidW5kbGVzSW5kZXggPSB1cmwuaW5kZXhPZihcImJ1bmRsZXNcIik7XHJcbiAgICAgICAgICAgIC8v5LuOYnVuZGxlc0luZGV45byA5aeL77yM5om+5LiL5LiA5LiqIC9cclxuICAgICAgICAgICAgY29uc3QgbmV4dFNsYXNoSW5kZXggPSB1cmwuaW5kZXhPZihcIi9cIixidW5kbGVzSW5kZXggKyA4KTtcclxuICAgICAgICAgICAgYnVuZGxlSWQgPSB1cmwuc3Vic3RyaW5nKGJ1bmRsZXNJbmRleCArIDgsbmV4dFNsYXNoSW5kZXgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5mby5idW5kbGVOYW1lID0gYnVuZGxlSWQ7XHJcbiAgICAgICAgbGV0IHVybDAgICAgICAgID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsXCJhc3NldHNcIik7XHJcblxyXG4gICAgICAgIC8vaW5mby5kYl91cmwgICAgID0gXCJkYjovL1wiICsgbFN1Yi5yZXBsYWNlKHBfcGF0aCxcIi9cIik7XHJcbiAgICAgICAgbGV0IGRiX3VybCA9IFwiZGI6Ly9hc3NldHMvXCI7XHJcbiAgICAgICAgaWYoYnVuZGxlSWQgPT0gXCJyZXNvdXJjZXNcIil7XHJcbiAgICAgICAgICAgIGRiX3VybCA9IGRiX3VybCArIFwicmVzb3VyY2VzL3ByZWZhYnMvXCI7XHJcbiAgICAgICAgICAgIHVybDAgPSBwYXRoLmpvaW4odXJsMCxcInJlc291cmNlc1wiKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgZGJfdXJsID0gZGJfdXJsICsgXCJidW5kbGVzL1wiICsgYnVuZGxlSWQgKyBcIi9wcmVmYWJzL1wiO1xyXG4gICAgICAgICAgICB1cmwwID0gcGF0aC5qb2luKHVybDAsXCJidW5kbGVzXCIsYnVuZGxlSWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihwcmVmYWJTdWJVcmwgIT0gXCJcIil7XHJcbiAgICAgICAgICAgIGRiX3VybCA9IGRiX3VybCArIHByZWZhYlN1YlVybCArIFwiL1wiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkYl91cmwgPSBkYl91cmwgKyBwcmVmYWJOYW1lO1xyXG4gICAgICAgIGluZm8uZGJfdXJsID0gZGJfdXJsO1xyXG4gICAgICAgIGluZm8udXJsID0gdXJsMC5yZXBsYWNlQWxsKFwiXFxcXFwiLFwiL1wiKTtcclxuICAgICAgICByZXR1cm4gaW5mbztcclxuICAgIH1cclxufVxyXG4iXX0=