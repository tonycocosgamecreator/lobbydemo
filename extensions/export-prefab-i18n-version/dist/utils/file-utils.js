"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
class FileUtils {
    static IsFileExist(path) {
        return fs_extra_1.default.existsSync(path);
    }
    /**
     * 一行一行读取
     * @param path
     */
    static GetFileContentByLines(path) {
        if (!fs_extra_1.default.existsSync(path)) {
            return [];
        }
        const content = fs_extra_1.default.readFileSync(path, { encoding: 'utf-8' });
        return content.split("\n");
    }
}
exports.default = FileUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS11dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS91dGlscy9maWxlLXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsd0RBQTBCO0FBQzFCLE1BQXFCLFNBQVM7SUFFbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFhO1FBQ25DLE9BQU8sa0JBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxJQUFhO1FBQzdDLElBQUcsQ0FBQyxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBQztZQUNwQixPQUFPLEVBQUUsQ0FBQztTQUNiO1FBQ0QsTUFBTSxPQUFPLEdBQUssa0JBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFDLEVBQUMsUUFBUSxFQUFHLE9BQU8sRUFBQyxDQUFDLENBQUM7UUFDN0QsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLENBQUM7Q0FFSjtBQWxCRCw0QkFrQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMtZXh0cmEnO1xyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWxlVXRpbHMge1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgSXNGaWxlRXhpc3QocGF0aCA6IHN0cmluZyl7XHJcbiAgICAgICAgcmV0dXJuIGZzLmV4aXN0c1N5bmMocGF0aCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDkuIDooYzkuIDooYzor7vlj5ZcclxuICAgICAqIEBwYXJhbSBwYXRoIFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIEdldEZpbGVDb250ZW50QnlMaW5lcyhwYXRoIDogc3RyaW5nKSA6IHN0cmluZ1tdIHtcclxuICAgICAgICBpZighZnMuZXhpc3RzU3luYyhwYXRoKSl7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgY29udGVudCAgID0gZnMucmVhZEZpbGVTeW5jKHBhdGgse2VuY29kaW5nIDogJ3V0Zi04J30pO1xyXG4gICAgICAgIHJldHVybiBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xyXG4gICAgfVxyXG5cclxufSJdfQ==