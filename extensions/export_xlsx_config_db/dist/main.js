"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onRightClickAssetMenu = exports.unload = exports.load = exports.methods = void 0;
const bundle_main_1 = require("./bundleexport/bundle-main");
const db_bundle_exporter_main_1 = __importDefault(require("./db_bundle_exporter/db-bundle-exporter-main"));
const db_main_1 = __importDefault(require("./dbexport/db-main"));
const proto_exporter_1 = require("./protos/proto-exporter");
const db_i18n_checker_1 = __importDefault(require("./db_i18n_check/db-i18n-checker"));
/**
 * @en Methods within the extension can be triggered by message
 * @zh 扩展内的方法，可以通过 message 触发
 */
exports.methods = {
    /**
     * @en A method that can be triggered by message
     * @zh 通过 message 触发的方法
     * @param str The string to be printed
     */
    export_db() {
        db_main_1.default.ProcessingExportDb();
    },
    export_bundles() {
        bundle_main_1.BundleMain.ProcessingExportBundles();
    },
    async export_protos() {
        await proto_exporter_1.ProtoExporter.ProcessingExportProtos();
        await proto_exporter_1.ProtoExporter.ProcessingExportProtosDTS();
    },
    export_bundle_db() {
        db_bundle_exporter_main_1.default.ProcessingExportDb();
    },
    /**
     * 导出指定bundle的配置表
     * 此消息由另外一个插件发送
     * @param bundleName
     */
    export_target_bundle_xlsx(bundleName) {
        console.warn('export_target_bundle_xlsx -> ', bundleName);
        //导出配置表
        db_bundle_exporter_main_1.default.ProcessingExportDb(bundleName);
    },
    check_i18n_config() {
        db_i18n_checker_1.default.check_i18n_config();
        db_bundle_exporter_main_1.default.ProcessingExportDb();
    }
};
/**
 * @en The method executed when the extension is started
 * @zh 扩展启动的时候执行的方法
 */
function load() {
    //Editor.Message.send('{name}', 'hello');
}
exports.load = load;
/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展触发的方法
 */
function unload() { }
exports.unload = unload;
/**
 * 右击
 * @param assetInfo
 */
function onRightClickAssetMenu(assetInfo) {
    const importer = assetInfo.importer;
    if (importer != 'directory' || !assetInfo.isDirectory) {
        return;
    }
    console.log('onRightClickAssetMenu -> ', assetInfo);
    //检查是否是一个bundle
    const name = assetInfo.name;
    const url = assetInfo.url;
    let isBundle = false;
    if (name == 'resources' || url.includes('bundles')) {
        isBundle = true;
    }
    if (!isBundle) {
        return;
    }
    //增加菜单，导出bundle协议与配置
    return [
        {
            label: "导出[" + name + "]协议与配置",
            async click() {
                await proto_exporter_1.ProtoExporter.ProcessingExportProtos(name);
                await proto_exporter_1.ProtoExporter.ProcessingExportProtosDTS(name);
                //导出配置表
                db_bundle_exporter_main_1.default.ProcessingExportDb(name);
            }
        }
    ];
}
exports.onRightClickAssetMenu = onRightClickAssetMenu;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUNBLDREQUF3RDtBQUN4RCwyR0FBZ0Y7QUFDaEYsaUVBQXdDO0FBQ3hDLDREQUF3RDtBQUN4RCxzRkFBNEQ7QUFFNUQ7OztHQUdHO0FBQ1UsUUFBQSxPQUFPLEdBQTRDO0lBQzVEOzs7O09BSUc7SUFDSCxTQUFTO1FBQ0wsaUJBQU0sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFFRCxjQUFjO1FBQ1Ysd0JBQVUsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFFRCxLQUFLLENBQUMsYUFBYTtRQUNmLE1BQU0sOEJBQWEsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQzdDLE1BQU0sOEJBQWEsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0lBQ3BELENBQUM7SUFFRCxnQkFBZ0I7UUFDWixpQ0FBb0IsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0lBQzlDLENBQUM7SUFDRDs7OztPQUlHO0lBQ0gseUJBQXlCLENBQUMsVUFBbUI7UUFDekMsT0FBTyxDQUFDLElBQUksQ0FBQywrQkFBK0IsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMxRCxPQUFPO1FBQ1AsaUNBQW9CLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVELGlCQUFpQjtRQUNiLHlCQUFhLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNsQyxpQ0FBb0IsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0lBQzlDLENBQUM7Q0FDSixDQUFDO0FBRUY7OztHQUdHO0FBQ0gsU0FBZ0IsSUFBSTtJQUNoQix5Q0FBeUM7QUFDN0MsQ0FBQztBQUZELG9CQUVDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsTUFBTSxLQUFLLENBQUM7QUFBNUIsd0JBQTRCO0FBRTVCOzs7R0FHRztBQUNILFNBQWdCLHFCQUFxQixDQUFDLFNBQXFCO0lBQ3ZELE1BQU0sUUFBUSxHQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUM7SUFDckMsSUFBRyxRQUFRLElBQUksV0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBQztRQUNqRCxPQUFPO0tBQ1Y7SUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3BELGVBQWU7SUFDZixNQUFNLElBQUksR0FBSSxTQUFTLENBQUMsSUFBSSxDQUFDO0lBQzdCLE1BQU0sR0FBRyxHQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7SUFDNUIsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLElBQUcsSUFBSSxJQUFJLFdBQVcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFDO1FBQzlDLFFBQVEsR0FBTSxJQUFJLENBQUM7S0FDdEI7SUFDRCxJQUFHLENBQUMsUUFBUSxFQUFDO1FBQ1QsT0FBTztLQUNWO0lBQ0Qsb0JBQW9CO0lBQ3BCLE9BQU87UUFDSDtZQUNJLEtBQUssRUFBRyxLQUFLLEdBQUcsSUFBSSxHQUFFLFFBQVE7WUFDOUIsS0FBSyxDQUFDLEtBQUs7Z0JBQ1AsTUFBTSw4QkFBYSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNqRCxNQUFNLDhCQUFhLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BELE9BQU87Z0JBQ1AsaUNBQW9CLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEQsQ0FBQztTQUNKO0tBQ0osQ0FBQztBQUNOLENBQUM7QUE1QkQsc0RBNEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXNzZXRJbmZvIH0gZnJvbSBcIkBjb2Nvcy9jcmVhdG9yLXR5cGVzL2VkaXRvci9wYWNrYWdlcy9hc3NldC1kYi9AdHlwZXMvcHJvdGVjdGVkXCI7XHJcbmltcG9ydCB7IEJ1bmRsZU1haW4gfSBmcm9tIFwiLi9idW5kbGVleHBvcnQvYnVuZGxlLW1haW5cIjtcclxuaW1wb3J0IERiQnVuZGxlRXhwb3J0ZXJNYWluIGZyb20gXCIuL2RiX2J1bmRsZV9leHBvcnRlci9kYi1idW5kbGUtZXhwb3J0ZXItbWFpblwiO1xyXG5pbXBvcnQgRGJNYWluIGZyb20gXCIuL2RiZXhwb3J0L2RiLW1haW5cIjtcclxuaW1wb3J0IHsgUHJvdG9FeHBvcnRlciB9IGZyb20gXCIuL3Byb3Rvcy9wcm90by1leHBvcnRlclwiO1xyXG5pbXBvcnQgRGJJMThuQ2hlY2tlciBmcm9tIFwiLi9kYl9pMThuX2NoZWNrL2RiLWkxOG4tY2hlY2tlclwiO1xyXG5cclxuLyoqXHJcbiAqIEBlbiBNZXRob2RzIHdpdGhpbiB0aGUgZXh0ZW5zaW9uIGNhbiBiZSB0cmlnZ2VyZWQgYnkgbWVzc2FnZVxyXG4gKiBAemgg5omp5bGV5YaF55qE5pa55rOV77yM5Y+v5Lul6YCa6L+HIG1lc3NhZ2Ug6Kem5Y+RXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgbWV0aG9kczogeyBba2V5OiBzdHJpbmddOiAoLi4uYW55OiBhbnkpID0+IGFueSB9ID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBAZW4gQSBtZXRob2QgdGhhdCBjYW4gYmUgdHJpZ2dlcmVkIGJ5IG1lc3NhZ2VcclxuICAgICAqIEB6aCDpgJrov4cgbWVzc2FnZSDop6blj5HnmoTmlrnms5VcclxuICAgICAqIEBwYXJhbSBzdHIgVGhlIHN0cmluZyB0byBiZSBwcmludGVkXHJcbiAgICAgKi9cclxuICAgIGV4cG9ydF9kYigpIHtcclxuICAgICAgICBEYk1haW4uUHJvY2Vzc2luZ0V4cG9ydERiKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGV4cG9ydF9idW5kbGVzKCkge1xyXG4gICAgICAgIEJ1bmRsZU1haW4uUHJvY2Vzc2luZ0V4cG9ydEJ1bmRsZXMoKTtcclxuICAgIH0sXHJcblxyXG4gICAgYXN5bmMgZXhwb3J0X3Byb3RvcygpIHtcclxuICAgICAgICBhd2FpdCBQcm90b0V4cG9ydGVyLlByb2Nlc3NpbmdFeHBvcnRQcm90b3MoKTtcclxuICAgICAgICBhd2FpdCBQcm90b0V4cG9ydGVyLlByb2Nlc3NpbmdFeHBvcnRQcm90b3NEVFMoKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGV4cG9ydF9idW5kbGVfZGIoKXtcclxuICAgICAgICBEYkJ1bmRsZUV4cG9ydGVyTWFpbi5Qcm9jZXNzaW5nRXhwb3J0RGIoKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIOWvvOWHuuaMh+WummJ1bmRsZeeahOmFjee9ruihqFxyXG4gICAgICog5q2k5raI5oGv55Sx5Y+m5aSW5LiA5Liq5o+S5Lu25Y+R6YCBXHJcbiAgICAgKiBAcGFyYW0gYnVuZGxlTmFtZSBcclxuICAgICAqL1xyXG4gICAgZXhwb3J0X3RhcmdldF9idW5kbGVfeGxzeChidW5kbGVOYW1lIDogc3RyaW5nKXtcclxuICAgICAgICBjb25zb2xlLndhcm4oJ2V4cG9ydF90YXJnZXRfYnVuZGxlX3hsc3ggLT4gJywgYnVuZGxlTmFtZSk7XHJcbiAgICAgICAgLy/lr7zlh7rphY3nva7ooahcclxuICAgICAgICBEYkJ1bmRsZUV4cG9ydGVyTWFpbi5Qcm9jZXNzaW5nRXhwb3J0RGIoYnVuZGxlTmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNoZWNrX2kxOG5fY29uZmlnKCl7XHJcbiAgICAgICAgRGJJMThuQ2hlY2tlci5jaGVja19pMThuX2NvbmZpZygpO1xyXG4gICAgICAgIERiQnVuZGxlRXhwb3J0ZXJNYWluLlByb2Nlc3NpbmdFeHBvcnREYigpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBlbiBUaGUgbWV0aG9kIGV4ZWN1dGVkIHdoZW4gdGhlIGV4dGVuc2lvbiBpcyBzdGFydGVkXHJcbiAqIEB6aCDmianlsZXlkK/liqjnmoTml7blgJnmiafooYznmoTmlrnms5VcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgLy9FZGl0b3IuTWVzc2FnZS5zZW5kKCd7bmFtZX0nLCAnaGVsbG8nKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBlbiBNZXRob2QgdHJpZ2dlcmVkIHdoZW4gdW5pbnN0YWxsaW5nIHRoZSBleHRlbnNpb25cclxuICogQHpoIOWNuOi9veaJqeWxleinpuWPkeeahOaWueazlVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHVubG9hZCgpIHsgfVxyXG5cclxuLyoqXHJcbiAqIOWPs+WHu1xyXG4gKiBAcGFyYW0gYXNzZXRJbmZvIFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIG9uUmlnaHRDbGlja0Fzc2V0TWVudShhc3NldEluZm8gOiBBc3NldEluZm8pe1xyXG4gICAgY29uc3QgaW1wb3J0ZXIgID0gYXNzZXRJbmZvLmltcG9ydGVyO1xyXG4gICAgaWYoaW1wb3J0ZXIgIT0gJ2RpcmVjdG9yeScgfHwgIWFzc2V0SW5mby5pc0RpcmVjdG9yeSl7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc29sZS5sb2coJ29uUmlnaHRDbGlja0Fzc2V0TWVudSAtPiAnLCBhc3NldEluZm8pO1xyXG4gICAgLy/mo4Dmn6XmmK/lkKbmmK/kuIDkuKpidW5kbGVcclxuICAgIGNvbnN0IG5hbWUgID0gYXNzZXRJbmZvLm5hbWU7XHJcbiAgICBjb25zdCB1cmwgICA9IGFzc2V0SW5mby51cmw7XHJcbiAgICBsZXQgaXNCdW5kbGUgPSBmYWxzZTtcclxuICAgIGlmKG5hbWUgPT0gJ3Jlc291cmNlcycgfHwgdXJsLmluY2x1ZGVzKCdidW5kbGVzJykpe1xyXG4gICAgICAgIGlzQnVuZGxlICAgID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGlmKCFpc0J1bmRsZSl7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy/lop7liqDoj5zljZXvvIzlr7zlh7pidW5kbGXljY/orq7kuI7phY3nva5cclxuICAgIHJldHVybiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsYWJlbCA6IFwi5a+85Ye6W1wiICsgbmFtZSsgXCJd5Y2P6K6u5LiO6YWN572uXCIsXHJcbiAgICAgICAgICAgIGFzeW5jIGNsaWNrKCkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgUHJvdG9FeHBvcnRlci5Qcm9jZXNzaW5nRXhwb3J0UHJvdG9zKG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgUHJvdG9FeHBvcnRlci5Qcm9jZXNzaW5nRXhwb3J0UHJvdG9zRFRTKG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgLy/lr7zlh7rphY3nva7ooahcclxuICAgICAgICAgICAgICAgIERiQnVuZGxlRXhwb3J0ZXJNYWluLlByb2Nlc3NpbmdFeHBvcnREYihuYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIF07XHJcbn1cclxuIl19