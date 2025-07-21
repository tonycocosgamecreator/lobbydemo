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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class Tools {
    static foreachDir(dir, callback, bNotRecursion) {
        if (!fs.existsSync(dir)) {
            console.error("找不到指定文件夹：", dir);
            return;
        }
        fs.readdirSync(dir).forEach((fileName) => {
            if (fileName.startsWith("~")) {
                // 忽略隐藏文件
                return;
            }
            let pathName = path_1.default.join(dir, fileName);
            try {
                if (fs.statSync(pathName).isDirectory() && bNotRecursion != true) {
                    this.foreachDir(pathName, callback, bNotRecursion);
                }
                else {
                    callback(path_1.default.normalize(pathName));
                }
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    static foreachDirRemoveFileExcludes(dir, excludes) {
        if (!fs.existsSync(dir)) {
            console.warn("[Tools.foreachDirFileName]->找不到指定文件夹：", dir);
            return;
        }
        fs.readdirSync(dir).forEach((fileName) => {
            if (fileName.startsWith("~")) {
                // 忽略隐藏文件
                return;
            }
            let pathName = path_1.default.join(dir, fileName);
            if (fs.statSync(pathName).isDirectory()) {
                this.foreachDirRemoveFileExcludes(pathName, excludes);
                //检查pathName是否为空文件夹
                if (fs.existsSync(pathName) && fs.readdirSync(pathName).length == 0) {
                    fs.removeSync(pathName);
                }
            }
            else {
                if (!fs.statSync(pathName).isDirectory()) {
                    if (!excludes.includes(fileName)) {
                        fs.removeSync(pathName);
                    }
                }
            }
        });
        if (fs.existsSync(dir) && fs.readdirSync(dir).length == 0) {
            fs.removeSync(dir);
        }
    }
    static foreachDirFileName(dir, callback, bNotRecursion = false) {
        if (!fs.existsSync(dir)) {
            console.warn("[Tools.foreachDirFileName]->找不到指定文件夹：", dir);
            return;
        }
        fs.readdirSync(dir).forEach((fileName) => {
            if (fileName.startsWith("~")) {
                // 忽略隐藏文件
                return;
            }
            let pathName = path_1.default.join(dir, fileName);
            try {
                if (fs.statSync(pathName).isDirectory() && !bNotRecursion) {
                    this.foreachDirFileName(pathName, callback, bNotRecursion);
                }
                else {
                    if (!fs.statSync(pathName).isDirectory()) {
                        callback(path_1.default.normalize(fileName));
                    }
                }
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    static GetAllFilesPath(dir, ext, out) {
        if (!fs.existsSync(dir)) {
            console.warn("[Tools.foreachDirFileName]->找不到指定文件夹：", dir);
            return [];
        }
        fs.readdirSync(dir).forEach((fileName) => {
            if (fileName.startsWith("~")) {
                // 忽略隐藏文件
                return;
            }
            let pathName = path_1.default.join(dir, fileName);
            try {
                if (fs.statSync(pathName).isDirectory()) {
                    this.GetAllFilesPath(pathName, ext, out);
                }
                else {
                    if (!fs.statSync(pathName).isDirectory()) {
                        if (path_1.default.extname(pathName) == ext) {
                            out.push(pathName);
                        }
                    }
                }
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    /**
     * 将指定目录中所有的文件/文件夹添加到zip中
     * @param url
     * @param zip
     * @param bUseFirstFolder 首个文件夹是否要创建在里面
     */
    static downloadAsZip(url, zip, exclude, excludeOuts, bUseFirstFolder = true) {
        //console.warn("downloadAsZip->",url,exclude,excludeOuts);
        if (!fs.existsSync(url)) {
            console.warn("找不到指定文件夹：", url);
            return;
        }
        const baseName = path_1.default.basename(url);
        if (bUseFirstFolder) {
            zip = zip.folder(baseName);
        }
        const files = fs.readdirSync(url);
        files.forEach(fileName => {
            const fillPath = url + "/" + fileName;
            if (exclude) {
                //console.warn("filePath->",fillPath);
                for (let i = 0; i < exclude.length; i++) {
                    const excludeName = exclude[i];
                    if (fileName.startsWith(excludeName) || fileName.endsWith(excludeName)) {
                        console.log("excludeName->", excludeName, fileName);
                        excludeOuts && excludeOuts.push(fileName);
                        return;
                    }
                }
            }
            const file = fs.statSync(fillPath);
            // 如果是文件夹的话需要递归遍历下面的子文件
            if (file.isDirectory()) {
                //const dirZip = zip.folder(fileName);
                this.downloadAsZip(fillPath, zip, exclude, excludeOuts);
            }
            else {
                // 读取每个文件为buffer存到zip中
                zip.file(fileName, fs.readFileSync(fillPath));
            }
        });
    }
}
exports.default = Tools;
