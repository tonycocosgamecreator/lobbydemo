"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterMake = exports.onBeforeMake = exports.onError = exports.unload = exports.onAfterBuild = exports.onAfterCompressSettings = exports.onBeforeCompressSettings = exports.onBeforeBuild = exports.load = exports.throwError = void 0;
exports.compressOne = compressOne;
exports.compresPNG = compresPNG;
const path_1 = __importDefault(require("path"));
const global_1 = require("./global");
const tools_1 = __importDefault(require("./tools"));
const child_process_1 = require("child_process");
const after_builder_webmobile_1 = __importDefault(require("./after-builder-webmobile"));
const after_builder_native_1 = __importDefault(require("./after-builder-native"));
function log(...arg) {
    return console.log(`[${global_1.PACKAGE_NAME}] `, ...arg);
}
let allAssets = [];
exports.throwError = true;
const load = function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[${global_1.PACKAGE_NAME}] Load cocos plugin example in builder.`);
        allAssets = yield Editor.Message.request('asset-db', 'query-assets');
    });
};
exports.load = load;
const onBeforeBuild = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        if (options.packages['web-mobile'] || options.packages['web-desktop']) {
            //进入web-mobile模式
            return;
        }
        after_builder_native_1.default.onBeforeBuild(options, result);
    });
};
exports.onBeforeBuild = onBeforeBuild;
const onBeforeCompressSettings = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        // const pkgOptions = options.packages[PACKAGE_NAME];
        // if (pkgOptions.webTestOption) {
        //     console.debug('webTestOption', true);
        // }
        // // Todo some thing
        // console.debug('get settings test', result.settings);
    });
};
exports.onBeforeCompressSettings = onBeforeCompressSettings;
const onAfterCompressSettings = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        // Todo some thing
        console.log('webTestOption', 'onAfterCompressSettings');
    });
};
exports.onAfterCompressSettings = onAfterCompressSettings;
function compressOne(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        //console.warn('start compress png->',dir);
        const pngquantPath = path_1.default.join(Editor.Project.path, 'tools', 'pngquant', 'pngquant.exe');
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(pngquantPath + ' ' + dir + ' --force --verbose --skip-if-larger --speed=1 --quality=0-100 --ext .png', (error, stdout, stderr) => {
                if (stdout) {
                    console.warn("stdout -> ", stdout.toString());
                }
                if (error) {
                    console.warn('Compress png error->', error);
                    resolve();
                    return;
                }
                // if(stderr){
                //     console.warn('Compress png stderr->',dir,stderr.toString());
                //     resolve();
                //     return;
                // }
                console.warn('Compress png success->', dir, stdout);
                resolve();
            });
        });
    });
}
/**
 * 对指定bundle中的所有png图片进行压缩
 * @param bundle
 */
function compresPNG(outputName, bundle) {
    return __awaiter(this, void 0, void 0, function* () {
        const bundleDir = path_1.default.join(Editor.Project.path, 'build', outputName, 'assets', bundle);
        //遍历bundleDir下的所有文件以及文件夹，找到所有的png文件的路径
        const pngFiles = [];
        tools_1.default.GetAllFilesPath(bundleDir, '.png', pngFiles);
        //对所有的png文件进行压缩
        for (let i = 0; i < pngFiles.length; i++) {
            const pngFile = pngFiles[i];
            yield compressOne(pngFile);
        }
    });
}
const onAfterBuild = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        //console.warn('onAfterBuild->',options.packages);
        const pkgNames = Object.keys(options.packages);
        console.warn('onAfterBuild -> ', options);
        if (options.packages['web-mobile'] || options.packages['web-desktop']) {
            //进入web-mobile模式
            yield after_builder_webmobile_1.default.onAfterBuild(options, result);
            return;
        }
        yield after_builder_native_1.default.onAfterBuild(options, result);
    });
};
exports.onAfterBuild = onAfterBuild;
const unload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[${global_1.PACKAGE_NAME}] Unload cocos plugin example in builder.`);
    });
};
exports.unload = unload;
const onError = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        // Todo some thing
        console.warn(`${global_1.PACKAGE_NAME} run onError`);
    });
};
exports.onError = onError;
const onBeforeMake = function (root, options) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`onBeforeMake: root: ${root}, options: ${options}`);
    });
};
exports.onBeforeMake = onBeforeMake;
const onAfterMake = function (root, options) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`onAfterMake: root: ${root}, options: ${options}`);
    });
};
exports.onAfterMake = onAfterMake;
