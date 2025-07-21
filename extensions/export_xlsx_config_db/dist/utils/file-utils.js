"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class FileUtils {
    static IsFileExist(path) {
        return fs_1.default.existsSync(path);
    }
    /**
     * 一行一行读取
     * @param path
     */
    static GetFileContentByLines(path) {
        if (!fs_1.default.existsSync(path)) {
            return [];
        }
        const content = fs_1.default.readFileSync(path, { encoding: 'utf-8' });
        return content.split("\n");
    }
    /**
     * 获取文件夹下所有文件 不递归
     * @param folderPath  文件夹路径
     * @param extName   文件后缀名 可选 传入null或者不传则获取所有文件
     * @returns 所有文件的绝对路径，不递归
     */
    static GetAllFilesInFolder(folderPath, extName = null) {
        if (!fs_1.default.existsSync(folderPath)) {
            return [];
        }
        if (extName && extName.startsWith(".")) {
            extName = extName.substring(1);
        }
        const files = fs_1.default.readdirSync(folderPath);
        let result = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const pExtName = path_1.default.extname(file).substring(1);
            const filePath = folderPath + "/" + file;
            if (extName) {
                if (pExtName === extName) {
                    result.push(filePath);
                }
            }
            else {
                result.push(filePath);
            }
        }
        return result;
    }
    /**
     *  写文件
     * @param path
     * @param content
     */
    static WriteFile(path, content) {
        fs_1.default.writeFileSync(path, content, { encoding: 'utf-8' });
    }
}
exports.default = FileUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS11dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS91dGlscy9maWxlLXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQUN4QixNQUFxQixTQUFTO0lBRW5CLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBYTtRQUNuQyxPQUFPLFlBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxJQUFhO1FBQzdDLElBQUcsQ0FBQyxZQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFDO1lBQ3BCLE9BQU8sRUFBRSxDQUFDO1NBQ2I7UUFDRCxNQUFNLE9BQU8sR0FBSyxZQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBQyxFQUFDLFFBQVEsRUFBRyxPQUFPLEVBQUMsQ0FBQyxDQUFDO1FBQzdELE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBR0Q7Ozs7O09BS0c7SUFDSSxNQUFNLENBQUMsbUJBQW1CLENBQUMsVUFBbUIsRUFBQyxVQUEwQixJQUFJO1FBQ2hGLElBQUcsQ0FBQyxZQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFDO1lBQzFCLE9BQU8sRUFBRSxDQUFDO1NBQ2I7UUFDRCxJQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFDO1lBQ2xDLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2xDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsWUFBRSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN6QyxJQUFJLE1BQU0sR0FBYyxFQUFFLENBQUM7UUFDM0IsS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUM7WUFDakMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sUUFBUSxHQUFHLFVBQVUsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO1lBQ3pDLElBQUcsT0FBTyxFQUFDO2dCQUNQLElBQUcsUUFBUSxLQUFLLE9BQU8sRUFBQztvQkFDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDekI7YUFDSjtpQkFBSTtnQkFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ3pCO1NBQ0o7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBYSxFQUFDLE9BQWdCO1FBQ2xELFlBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFDLE9BQU8sRUFBQyxFQUFDLFFBQVEsRUFBRyxPQUFPLEVBQUMsQ0FBQyxDQUFDO0lBQ3hELENBQUM7Q0FDSjtBQXpERCw0QkF5REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmlsZVV0aWxzIHtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIElzRmlsZUV4aXN0KHBhdGggOiBzdHJpbmcpe1xyXG4gICAgICAgIHJldHVybiBmcy5leGlzdHNTeW5jKHBhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5LiA6KGM5LiA6KGM6K+75Y+WXHJcbiAgICAgKiBAcGFyYW0gcGF0aCBcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBHZXRGaWxlQ29udGVudEJ5TGluZXMocGF0aCA6IHN0cmluZykgOiBzdHJpbmdbXSB7XHJcbiAgICAgICAgaWYoIWZzLmV4aXN0c1N5bmMocGF0aCkpe1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgICA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLHtlbmNvZGluZyA6ICd1dGYtOCd9KTtcclxuICAgICAgICByZXR1cm4gY29udGVudC5zcGxpdChcIlxcblwiKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDojrflj5bmlofku7blpLnkuIvmiYDmnInmlofku7Yg5LiN6YCS5b2SXHJcbiAgICAgKiBAcGFyYW0gZm9sZGVyUGF0aCAg5paH5Lu25aS56Lev5b6EXHJcbiAgICAgKiBAcGFyYW0gZXh0TmFtZSAgIOaWh+S7tuWQjue8gOWQjSDlj6/pgIkg5Lyg5YWlbnVsbOaIluiAheS4jeS8oOWImeiOt+WPluaJgOacieaWh+S7tlxyXG4gICAgICogQHJldHVybnMg5omA5pyJ5paH5Lu255qE57ud5a+56Lev5b6E77yM5LiN6YCS5b2SXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgR2V0QWxsRmlsZXNJbkZvbGRlcihmb2xkZXJQYXRoIDogc3RyaW5nLGV4dE5hbWUgOiBzdHJpbmcgfCBudWxsID0gbnVsbCkgOiBzdHJpbmdbXSB7XHJcbiAgICAgICAgaWYoIWZzLmV4aXN0c1N5bmMoZm9sZGVyUGF0aCkpe1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGV4dE5hbWUgJiYgZXh0TmFtZS5zdGFydHNXaXRoKFwiLlwiKSl7XHJcbiAgICAgICAgICAgIGV4dE5hbWUgPSBleHROYW1lLnN1YnN0cmluZygxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyhmb2xkZXJQYXRoKTtcclxuICAgICAgICBsZXQgcmVzdWx0IDogc3RyaW5nW10gPSBbXTtcclxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gZmlsZXNbaV07XHJcbiAgICAgICAgICAgIGNvbnN0IHBFeHROYW1lID0gcGF0aC5leHRuYW1lKGZpbGUpLnN1YnN0cmluZygxKTtcclxuICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBmb2xkZXJQYXRoICsgXCIvXCIgKyBmaWxlO1xyXG4gICAgICAgICAgICBpZihleHROYW1lKXtcclxuICAgICAgICAgICAgICAgIGlmKHBFeHROYW1lID09PSBleHROYW1lKXtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChmaWxlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAg5YaZ5paH5Lu2XHJcbiAgICAgKiBAcGFyYW0gcGF0aCBcclxuICAgICAqIEBwYXJhbSBjb250ZW50IFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIFdyaXRlRmlsZShwYXRoIDogc3RyaW5nLGNvbnRlbnQgOiBzdHJpbmcpe1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMocGF0aCxjb250ZW50LHtlbmNvZGluZyA6ICd1dGYtOCd9KTtcclxuICAgIH1cclxufSJdfQ==