"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetHandlers = exports.configs = exports.unload = exports.load = void 0;
const global_1 = require("./global");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * 当前所有的渠道
 */
let platforms = [];
let bundleNames = [];
const load = function () {
    console.debug(`${global_1.PACKAGE_NAME} load`);
};
exports.load = load;
const unload = function () {
    console.debug(`${global_1.PACKAGE_NAME} unload`);
};
exports.unload = unload;
const complexTestItems = {
    number: {
        label: `i18n:${global_1.PACKAGE_NAME}.options.complexTestNumber`,
        description: `i18n:${global_1.PACKAGE_NAME}.options.complexTestNumber`,
        default: 80,
        render: {
            ui: 'ui-num-input',
            attributes: {
                step: 1,
                min: 0,
            },
        },
    },
    string: {
        label: `i18n:${global_1.PACKAGE_NAME}.options.complexTestString`,
        description: `i18n:${global_1.PACKAGE_NAME}.options.complexTestString`,
        default: 'cocos',
        render: {
            ui: 'ui-input',
            attributes: {
                placeholder: `i18n:${global_1.PACKAGE_NAME}.options.enterCocos`,
            },
        },
        verifyRules: ['ruleTest'],
    },
    boolean: {
        label: `i18n:${global_1.PACKAGE_NAME}.options.complexTestBoolean`,
        description: `i18n:${global_1.PACKAGE_NAME}.options.complexTestBoolean`,
        default: true,
        render: {
            ui: 'ui-checkbox',
        },
    },
};
let channels = [];
function getChannelConfigs() {
    if (channels.length == 0) {
        const platformPath = path_1.default.join(Editor.Project.path, '_config', 'build_configs', 'platforms.json');
        const platformConfigs = fs_extra_1.default.readJSONSync(platformPath);
        channels = platformConfigs.channels;
    }
    let res = [];
    for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];
        res.push({
            label: channel,
            value: channel,
        });
    }
    return res;
}
let envs = [];
function getHotUpdateEnvConfigs() {
    if (envs.length == 0) {
        const platformPath = path_1.default.join(Editor.Project.path, '_config', 'build_configs', 'platforms.json');
        const platformConfigs = fs_extra_1.default.readJSONSync(platformPath);
        envs = platformConfigs.hotupdate_env;
    }
    let res = [];
    for (let i = 0; i < envs.length; i++) {
        const env = envs[i];
        res.push({
            label: env,
            value: env,
        });
    }
    return res;
}
function getPlatformItems() {
    if (platforms.length == 0) {
        const platformPath = path_1.default.join(Editor.Project.path, '_config', 'build_configs', 'platforms.json');
        const platformConfigs = fs_extra_1.default.readJSONSync(platformPath);
        platforms = platformConfigs.platforms;
        console.warn('platforms->', platforms);
    }
    bundleNames = [];
    const bundleDir = path_1.default.join(Editor.Project.path, 'assets', 'bundles');
    //获取这个文件夹下所有的文件夹
    const bundles = fs_extra_1.default.readdirSync(bundleDir);
    bundleNames = bundles.filter((item) => {
        const stat = fs_extra_1.default.statSync(path_1.default.join(bundleDir, item));
        return stat.isDirectory();
    });
    let res = [];
    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        res.push({
            label: platform,
            value: platform,
        });
    }
    return res;
}
exports.configs = {
    '*': {
        hooks: './hooks',
        doc: 'editor/publish/custom-build-plugin.html',
        options: {
            // remoteAddress: {
            //     label: `i18n:${PACKAGE_NAME}.options.remoteAddress`,
            //     default: 'https://www.cocos.com/',
            //     render: {
            //         ui: 'ui-input',
            //         attributes: {
            //             placeholder: 'Enter remote address...',
            //         },
            //     },
            //     verifyRules: ['required'],
            // },
            selectChannel: {
                label: `channel`,
                description: `选择你需要打包的渠道`,
                default: 'channel0',
                render: {
                    ui: 'ui-select',
                    items: getChannelConfigs(),
                },
            },
            selectEnv: {
                label: `Env`,
                description: `选择你需要打包的环境`,
                default: 'local',
                render: {
                    ui: 'ui-select',
                    items: getHotUpdateEnvConfigs(),
                },
            },
            // bundles: {
            //     label : "主包携带bundle",
            //     description : "选择需要携带的bundle",
            //     type : 'array',
            //     default : getDefaultSelectBundles,
            //     itemConfigs: getBundleNamesRender()
            // }
            // objectTest: {
            //     label: `i18n:${PACKAGE_NAME}.options.objectTest`,
            //     description: `i18n:${PACKAGE_NAME}.options.objectTest`,
            //     type: 'object',
            //     default: {
            //         number: complexTestItems.number.default,
            //         string: complexTestItems.string.default,
            //         boolean: complexTestItems.boolean.default,
            //     },
            //     itemConfigs: complexTestItems,
            // },
            // arrayTest: {
            //     label: `i18n:${PACKAGE_NAME}.options.arrayTest`,
            //     description: `i18n:${PACKAGE_NAME}.options.arrayTest`,
            //     type: 'array',
            //     default: [complexTestItems.number.default, complexTestItems.string.default, complexTestItems.boolean.default],
            //     itemConfigs: JSON.parse(JSON.stringify(Object.values(complexTestItems))),
            // },
        },
        // panel: './panel',
        // verifyRuleMap: {
        //     ruleTest: {
        //         message: `i18n:${PACKAGE_NAME}.options.ruleTest_msg`,
        //         func(val, buildOptions) {
        //             if (val === 'cocos') {
        //                 return true;
        //             }
        //             return false;
        //         },
        //     },
        // },
    },
};
exports.assetHandlers = './asset-handlers';
