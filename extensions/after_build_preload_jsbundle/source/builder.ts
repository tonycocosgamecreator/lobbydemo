import { ArrayItem, BuildPlugin } from '../@types';
import { PACKAGE_NAME } from './global';
import path from 'path';
import fs from 'fs-extra';
import { on } from 'events';
interface ISelfBuildConfigs {
    /**
     * 所有需要携带的bundle的名字
     */
    "bundles-contain" : string[];
    /**
     * 远程服务器地址列表
     */
    "remotes" : string[];
    /**
     * 当前打包的平台
     */
    "platform" : string;
    /**
     * 当前平台的版本号
     */
    "version" : string;
}
/**
 * 当前所有的渠道
 */
let platforms : string[] = [];

let bundleNames : string[] = [];


export const load: BuildPlugin.load = function() {
    console.debug(`${PACKAGE_NAME} load`);
    
    
};
export const unload: BuildPlugin.Unload = function() {
    console.debug(`${PACKAGE_NAME} unload`);
};

const complexTestItems = {
    number: {
        label: `i18n:${PACKAGE_NAME}.options.complexTestNumber`,
        description: `i18n:${PACKAGE_NAME}.options.complexTestNumber`,
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
        label: `i18n:${PACKAGE_NAME}.options.complexTestString`,
        description: `i18n:${PACKAGE_NAME}.options.complexTestString`,
        default: 'cocos',
        render: {
            ui: 'ui-input',
            attributes: {
                placeholder: `i18n:${PACKAGE_NAME}.options.enterCocos`,
            },
        },
        verifyRules: ['ruleTest'],
    },
    boolean: {
        label: `i18n:${PACKAGE_NAME}.options.complexTestBoolean`,
        description: `i18n:${PACKAGE_NAME}.options.complexTestBoolean`,
        default: true,
        render: {
            ui: 'ui-checkbox',
        },
    },
};

let channels : string[] = [];

function getChannelConfigs() {
    if(channels.length == 0){
        const platformPath = path.join(Editor.Project.path, '_config','build_configs','platforms.json');
        const platformConfigs = fs.readJSONSync(platformPath);
        channels = platformConfigs.channels;
    }
    let res : ArrayItem[]= [];
    for(let i = 0;i<channels.length;i++){
        const channel = channels[i];
        res.push({
            label: channel,
            value: channel,
        });
    }
    return res;
}

let envs : string[] = [];
function getHotUpdateEnvConfigs() {
    if(envs.length == 0){
        const platformPath = path.join(Editor.Project.path, '_config','build_configs','platforms.json');
        const platformConfigs = fs.readJSONSync(platformPath);
        envs = platformConfigs.hotupdate_env;
    }
    let res : ArrayItem[]= [];
    for(let i = 0;i<envs.length;i++){
        const env = envs[i];
        res.push({
            label: env,
            value: env,
        });
    }
    return res;
}

function getPlatformItems() {
    if(platforms.length == 0){
        const platformPath = path.join(Editor.Project.path, '_config','build_configs','platforms.json');
        const platformConfigs = fs.readJSONSync(platformPath);
        platforms = platformConfigs.platforms;
        console.warn('platforms->',platforms);
    }
    bundleNames = [];
    const bundleDir = path.join(Editor.Project.path, 'assets', 'bundles');
    //获取这个文件夹下所有的文件夹
    const bundles = fs.readdirSync(bundleDir);
    bundleNames = bundles.filter((item) => {
        const stat = fs.statSync(path.join(bundleDir, item));
        return stat.isDirectory();
    });

    let res : ArrayItem[]= [];
    for(let i = 0;i<platforms.length;i++){
        const platform = platforms[i];
        res.push({
            label: platform,
            value: platform,
        });
    }
    return res;
}


export const configs: BuildPlugin.Configs = {
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
            selectEnv : {
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

export const assetHandlers: BuildPlugin.AssetHandlers = './asset-handlers';
