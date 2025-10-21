"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleMain = void 0;
const path_1 = __importDefault(require("path"));
const file_utils_1 = __importDefault(require("../utils/file-utils"));
const fs_extra_1 = __importDefault(require("fs-extra"));
class BundleMain {
    static ProcessingExportBundles() {
        const names = [];
        const dir = path_1.default.join(Editor.Project.path, "assets", "bundles");
        //获取dir下所有后缀为meta的文件
        const files = file_utils_1.default.GetAllFilesInFolder(dir, "meta");
        if (files.length === 0) {
            console.log("No bundle files found");
            return;
        }
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            //读取文件内容
            const data = fs_extra_1.default.readFileSync(file, { encoding: 'utf-8' });
            const obj = JSON.parse(data);
            if (!obj['userData']) {
                continue;
            }
            const userData = obj['userData'];
            const isBundle = userData['isBundle'];
            if (!isBundle) {
                continue;
            }
            const name = path_1.default.basename(file, ".meta");
            names.push(name);
        }
        if (names.length === 0) {
            console.log("No bundle files found");
            return;
        }
        let text = "export enum Bundles { \n";
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            text += `    ${name} = "${name}",\n`;
        }
        text += "}";
        //AssetDbUtils.RequestCreateNewAsset("db://assets/resources/scripts/auto/bundles.ts", text);
    }
}
exports.BundleMain = BundleMain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLW1haW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvYnVuZGxlZXhwb3J0L2J1bmRsZS1tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUN4QixxRUFBNEM7QUFDNUMsd0RBQTBCO0FBRTFCLE1BQWEsVUFBVTtJQUdaLE1BQU0sQ0FBQyx1QkFBdUI7UUFDakMsTUFBTSxLQUFLLEdBQWMsRUFBRSxDQUFDO1FBQzVCLE1BQU0sR0FBRyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2hFLG9CQUFvQjtRQUNwQixNQUFNLEtBQUssR0FBRyxvQkFBUyxDQUFDLG1CQUFtQixDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN6RCxJQUFHLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFDO1lBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNyQyxPQUFPO1NBQ1Y7UUFDRCxLQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBQztZQUNqQyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsUUFBUTtZQUNSLE1BQU0sSUFBSSxHQUFHLGtCQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxFQUFDLFFBQVEsRUFBRyxPQUFPLEVBQUMsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0IsSUFBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBQztnQkFDaEIsU0FBUzthQUNaO1lBQ0QsTUFBTSxRQUFRLEdBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sUUFBUSxHQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN2QyxJQUFHLENBQUMsUUFBUSxFQUFDO2dCQUNULFNBQVM7YUFDWjtZQUNELE1BQU0sSUFBSSxHQUFHLGNBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDcEI7UUFDRCxJQUFHLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFDO1lBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNyQyxPQUFPO1NBQ1Y7UUFDRCxJQUFJLElBQUksR0FBRywwQkFBMEIsQ0FBQztRQUN0QyxLQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBQztZQUNqQyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsSUFBSSxJQUFJLE9BQU8sSUFBSSxPQUFPLElBQUksTUFBTSxDQUFDO1NBQ3hDO1FBQ0QsSUFBSSxJQUFJLEdBQUcsQ0FBQztRQUNaLDRGQUE0RjtJQUNoRyxDQUFDO0NBRUo7QUF6Q0QsZ0NBeUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IEZpbGVVdGlscyBmcm9tIFwiLi4vdXRpbHMvZmlsZS11dGlsc1wiO1xyXG5pbXBvcnQgZnMgZnJvbSBcImZzLWV4dHJhXCI7XHJcbmltcG9ydCB7IEFzc2V0RGJVdGlscyB9IGZyb20gXCIuLi91dGlscy9hc3NldC1kYi11dGlsc1wiO1xyXG5leHBvcnQgY2xhc3MgQnVuZGxlTWFpbiB7XHJcblxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgUHJvY2Vzc2luZ0V4cG9ydEJ1bmRsZXMoKSB7XHJcbiAgICAgICAgY29uc3QgbmFtZXMgOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgIGNvbnN0IGRpciA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcImFzc2V0c1wiLCBcImJ1bmRsZXNcIik7XHJcbiAgICAgICAgLy/ojrflj5ZkaXLkuIvmiYDmnInlkI7nvIDkuLptZXRh55qE5paH5Lu2XHJcbiAgICAgICAgY29uc3QgZmlsZXMgPSBGaWxlVXRpbHMuR2V0QWxsRmlsZXNJbkZvbGRlcihkaXIsIFwibWV0YVwiKTtcclxuICAgICAgICBpZihmaWxlcy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGJ1bmRsZSBmaWxlcyBmb3VuZFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gZmlsZXNbaV07XHJcbiAgICAgICAgICAgIC8v6K+75Y+W5paH5Lu25YaF5a65XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZSwge2VuY29kaW5nIDogJ3V0Zi04J30pO1xyXG4gICAgICAgICAgICBjb25zdCBvYmogPSBKU09OLnBhcnNlKGRhdGEpO1xyXG4gICAgICAgICAgICBpZighb2JqWyd1c2VyRGF0YSddKXtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHVzZXJEYXRhICA9IG9ialsndXNlckRhdGEnXTtcclxuICAgICAgICAgICAgY29uc3QgaXNCdW5kbGUgID0gdXNlckRhdGFbJ2lzQnVuZGxlJ107XHJcbiAgICAgICAgICAgIGlmKCFpc0J1bmRsZSl7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gcGF0aC5iYXNlbmFtZShmaWxlLCBcIi5tZXRhXCIpO1xyXG4gICAgICAgICAgICBuYW1lcy5wdXNoKG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihuYW1lcy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGJ1bmRsZSBmaWxlcyBmb3VuZFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgdGV4dCA9IFwiZXhwb3J0IGVudW0gQnVuZGxlcyB7IFxcblwiO1xyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBuYW1lc1tpXTtcclxuICAgICAgICAgICAgdGV4dCArPSBgICAgICR7bmFtZX0gPSBcIiR7bmFtZX1cIixcXG5gO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0ZXh0ICs9IFwifVwiO1xyXG4gICAgICAgIC8vQXNzZXREYlV0aWxzLlJlcXVlc3RDcmVhdGVOZXdBc3NldChcImRiOi8vYXNzZXRzL3Jlc291cmNlcy9zY3JpcHRzL2F1dG8vYnVuZGxlcy50c1wiLCB0ZXh0KTtcclxuICAgIH1cclxuXHJcbn0iXX0=