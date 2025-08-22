"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleMain = void 0;
const path_1 = __importDefault(require("path"));
const file_utils_1 = __importDefault(require("../utils/file-utils"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const asset_db_utils_1 = require("../utils/asset-db-utils");
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
        asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset("db://assets/resources/scripts/auto/bundles.ts", text);
    }
}
exports.BundleMain = BundleMain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLW1haW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvYnVuZGxlZXhwb3J0L2J1bmRsZS1tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUN4QixxRUFBNEM7QUFDNUMsd0RBQTBCO0FBQzFCLDREQUF1RDtBQUN2RCxNQUFhLFVBQVU7SUFHWixNQUFNLENBQUMsdUJBQXVCO1FBQ2pDLE1BQU0sS0FBSyxHQUFjLEVBQUUsQ0FBQztRQUM1QixNQUFNLEdBQUcsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNoRSxvQkFBb0I7UUFDcEIsTUFBTSxLQUFLLEdBQUcsb0JBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDekQsSUFBRyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBQztZQUNsQixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDckMsT0FBTztTQUNWO1FBQ0QsS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUM7WUFDakMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLFFBQVE7WUFDUixNQUFNLElBQUksR0FBRyxrQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBQyxRQUFRLEVBQUcsT0FBTyxFQUFDLENBQUMsQ0FBQztZQUN6RCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdCLElBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUM7Z0JBQ2hCLFNBQVM7YUFDWjtZQUNELE1BQU0sUUFBUSxHQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNsQyxNQUFNLFFBQVEsR0FBSSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdkMsSUFBRyxDQUFDLFFBQVEsRUFBQztnQkFDVCxTQUFTO2FBQ1o7WUFDRCxNQUFNLElBQUksR0FBRyxjQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3BCO1FBQ0QsSUFBRyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBQztZQUNsQixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDckMsT0FBTztTQUNWO1FBQ0QsSUFBSSxJQUFJLEdBQUcsMEJBQTBCLENBQUM7UUFDdEMsS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUM7WUFDakMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLElBQUksSUFBSSxPQUFPLElBQUksT0FBTyxJQUFJLE1BQU0sQ0FBQztTQUN4QztRQUNELElBQUksSUFBSSxHQUFHLENBQUM7UUFDWiw2QkFBWSxDQUFDLHFCQUFxQixDQUFDLCtDQUErQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzlGLENBQUM7Q0FFSjtBQXpDRCxnQ0F5Q0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgRmlsZVV0aWxzIGZyb20gXCIuLi91dGlscy9maWxlLXV0aWxzXCI7XHJcbmltcG9ydCBmcyBmcm9tIFwiZnMtZXh0cmFcIjtcclxuaW1wb3J0IHsgQXNzZXREYlV0aWxzIH0gZnJvbSBcIi4uL3V0aWxzL2Fzc2V0LWRiLXV0aWxzXCI7XHJcbmV4cG9ydCBjbGFzcyBCdW5kbGVNYWluIHtcclxuXHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBQcm9jZXNzaW5nRXhwb3J0QnVuZGxlcygpIHtcclxuICAgICAgICBjb25zdCBuYW1lcyA6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgY29uc3QgZGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiYXNzZXRzXCIsIFwiYnVuZGxlc1wiKTtcclxuICAgICAgICAvL+iOt+WPlmRpcuS4i+aJgOacieWQjue8gOS4um1ldGHnmoTmlofku7ZcclxuICAgICAgICBjb25zdCBmaWxlcyA9IEZpbGVVdGlscy5HZXRBbGxGaWxlc0luRm9sZGVyKGRpciwgXCJtZXRhXCIpO1xyXG4gICAgICAgIGlmKGZpbGVzLmxlbmd0aCA9PT0gMCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYnVuZGxlIGZpbGVzIGZvdW5kXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBmaWxlc1tpXTtcclxuICAgICAgICAgICAgLy/or7vlj5bmlofku7blhoXlrrlcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhmaWxlLCB7ZW5jb2RpbmcgOiAndXRmLTgnfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IEpTT04ucGFyc2UoZGF0YSk7XHJcbiAgICAgICAgICAgIGlmKCFvYmpbJ3VzZXJEYXRhJ10pe1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgdXNlckRhdGEgID0gb2JqWyd1c2VyRGF0YSddO1xyXG4gICAgICAgICAgICBjb25zdCBpc0J1bmRsZSAgPSB1c2VyRGF0YVsnaXNCdW5kbGUnXTtcclxuICAgICAgICAgICAgaWYoIWlzQnVuZGxlKXtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGUsIFwiLm1ldGFcIik7XHJcbiAgICAgICAgICAgIG5hbWVzLnB1c2gobmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKG5hbWVzLmxlbmd0aCA9PT0gMCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYnVuZGxlIGZpbGVzIGZvdW5kXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCB0ZXh0ID0gXCJleHBvcnQgZW51bSBCdW5kbGVzIHsgXFxuXCI7XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVzW2ldO1xyXG4gICAgICAgICAgICB0ZXh0ICs9IGAgICAgJHtuYW1lfSA9IFwiJHtuYW1lfVwiLFxcbmA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRleHQgKz0gXCJ9XCI7XHJcbiAgICAgICAgQXNzZXREYlV0aWxzLlJlcXVlc3RDcmVhdGVOZXdBc3NldChcImRiOi8vYXNzZXRzL3Jlc291cmNlcy9zY3JpcHRzL2F1dG8vYnVuZGxlcy50c1wiLCB0ZXh0KTtcclxuICAgIH1cclxuXHJcbn0iXX0=