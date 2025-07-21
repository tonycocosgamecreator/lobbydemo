"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetDbUtils = void 0;
class AssetDbUtils {
    /**
     * 发送消息，要求编辑器重新导入指定路径或者uuid的资源
     * @param url 资源的路径或者url
     */
    static async RequestReimportAsset(url) {
        const result = await Editor.Message.request("asset-db", "reimport-asset", url);
        console.log("要求刷新资源：", url, result);
        return result;
    }
    /**
     *
     * @param source 绝对地址
     * @param url asset-db url
     */
    static async RequestImportAsset(source, url) {
        console.log("要求导入资源：", source, url);
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
     */
    static GetBundleNameWithDbUrl(url) {
        if (url.includes("resources")) {
            return "resources";
        }
        const pre = "db://assets/bundles/";
        const plen = pre.length;
        const str = url.substring(plen);
        const pIndex = str.indexOf("/");
        return str.substring(0, pIndex);
    }
}
exports.AssetDbUtils = AssetDbUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtZGItdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdXRpbHMvYXNzZXQtZGItdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBSUEsTUFBYSxZQUFZO0lBRXJCOzs7T0FHRztJQUNJLE1BQU0sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsR0FBWTtRQUNqRCxNQUFNLE1BQU0sR0FBTSxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBQyxnQkFBZ0IsRUFBQyxHQUFHLENBQUMsQ0FBQztRQUNoRixPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBQyxHQUFHLEVBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUNEOzs7O09BSUc7SUFDSSxNQUFNLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLE1BQWUsRUFBQyxHQUFZO1FBQy9ELE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFDLE1BQU0sRUFBQyxHQUFHLENBQUMsQ0FBQztRQUNsQyxNQUFNLE1BQU0sR0FBTSxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBQyxjQUFjLEVBQUMsTUFBTSxFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXJGLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFDRDs7OztPQUlHO0lBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxHQUFZLEVBQUMsSUFBc0IsRUFBQyxTQUFTLEdBQUcsSUFBSTtRQUMxRixPQUFPLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFDLGNBQWMsRUFBQyxHQUFHLEVBQUMsSUFBSSxFQUFDLEVBQUMsU0FBUyxFQUFHLFNBQVMsRUFBQyxDQUFDLENBQUM7SUFDcEcsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE1BQU0sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsVUFBbUI7UUFDekQsT0FBTyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBQyxrQkFBa0IsRUFBQyxVQUFVLENBQUMsQ0FBQztJQUNsRixDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksTUFBTSxDQUFDLHNCQUFzQixDQUFDLEdBQVk7UUFDN0MsSUFBRyxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFDO1lBQ3pCLE9BQU8sV0FBVyxDQUFDO1NBQ3RCO1FBQ0QsTUFBTSxHQUFHLEdBQUssc0JBQXNCLENBQUM7UUFDckMsTUFBTSxJQUFJLEdBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQztRQUN6QixNQUFNLEdBQUcsR0FBSyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sTUFBTSxHQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkMsT0FBTyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxDQUFDO0NBQ0o7QUFyREQsb0NBcURDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXNzZXRJbmZvIH0gZnJvbSBcIkBjb2Nvcy9jcmVhdG9yLXR5cGVzL2VkaXRvci9wYWNrYWdlcy9hc3NldC1kYi9AdHlwZXMvcHVibGljXCI7XHJcblxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBBc3NldERiVXRpbHN7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlj5HpgIHmtojmga/vvIzopoHmsYLnvJbovpHlmajph43mlrDlr7zlhaXmjIflrprot6/lvoTmiJbogIV1dWlk55qE6LWE5rqQXHJcbiAgICAgKiBAcGFyYW0gdXJsIOi1hOa6kOeahOi3r+W+hOaIluiAhXVybFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIFJlcXVlc3RSZWltcG9ydEFzc2V0KHVybCA6IHN0cmluZyl7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ICAgID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsXCJyZWltcG9ydC1hc3NldFwiLHVybCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCLopoHmsYLliLfmlrDotYTmupDvvJpcIix1cmwscmVzdWx0KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHNvdXJjZSDnu53lr7nlnLDlnYBcclxuICAgICAqIEBwYXJhbSB1cmwgYXNzZXQtZGIgdXJsXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgYXN5bmMgUmVxdWVzdEltcG9ydEFzc2V0KHNvdXJjZSA6IHN0cmluZyx1cmwgOiBzdHJpbmcpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwi6KaB5rGC5a+85YWl6LWE5rqQ77yaXCIsc291cmNlLHVybCk7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ICAgID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsXCJpbXBvcnQtYXNzZXRcIixzb3VyY2UsdXJsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog6KaB5rGC5Yib5bu65LiA5Liq6LWE5rqQXHJcbiAgICAgKiBAcGFyYW0gdXJsXHJcbiAgICAgKiBAcGFyYW0gdGV4dFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIFJlcXVlc3RDcmVhdGVOZXdBc3NldCh1cmwgOiBzdHJpbmcsdGV4dCA6IHN0cmluZyB8IEJ1ZmZlcixvdmVyd3JpdGUgPSB0cnVlKXtcclxuICAgICAgICByZXR1cm4gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImFzc2V0LWRiXCIsXCJjcmVhdGUtYXNzZXRcIix1cmwsdGV4dCx7b3ZlcndyaXRlIDogb3ZlcndyaXRlfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDmoLnmja7mjIflrprnmoR1dWlk5oiW6ICFdXJs6I635Y+W5LiA5Liq6LWE5rqQ55qE5L+h5oGvXHJcbiAgICAgKiBAcGFyYW0gdXVpZE9yUGF0aFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIFJlcXVlc3RRdWVyeUFzc2V0SW5mbyh1dWlkT3JQYXRoIDogc3RyaW5nKSA6IFByb21pc2U8QXNzZXRJbmZvIHwgbnVsbD4ge1xyXG4gICAgICAgIHJldHVybiBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiYXNzZXQtZGJcIixcInF1ZXJ5LWFzc2V0LWluZm9cIix1dWlkT3JQYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOagueaNrue7meWumueahOi3r+W+hOiOt+W+l2J1bmRsZeWQjeWtl1xyXG4gICAgICogQHBhcmFtIHVybCDkvovlpoLvvJpkYjovL2Fzc2V0cy9idW5kbGVzL2RlbW9zL3ByZWZhYnNcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBHZXRCdW5kbGVOYW1lV2l0aERiVXJsKHVybCA6IHN0cmluZykgOiBzdHJpbmd7XHJcbiAgICAgICAgaWYodXJsLmluY2x1ZGVzKFwicmVzb3VyY2VzXCIpKXtcclxuICAgICAgICAgICAgcmV0dXJuIFwicmVzb3VyY2VzXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHByZSAgID0gXCJkYjovL2Fzc2V0cy9idW5kbGVzL1wiO1xyXG4gICAgICAgIGNvbnN0IHBsZW4gID0gcHJlLmxlbmd0aDtcclxuICAgICAgICBjb25zdCBzdHIgICA9IHVybC5zdWJzdHJpbmcocGxlbik7XHJcbiAgICAgICAgY29uc3QgcEluZGV4ICAgID0gc3RyLmluZGV4T2YoXCIvXCIpO1xyXG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyaW5nKDAscEluZGV4KTtcclxuICAgIH1cclxufVxyXG4iXX0=