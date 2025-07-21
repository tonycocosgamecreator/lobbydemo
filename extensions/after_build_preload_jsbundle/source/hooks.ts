import path from 'path';
import { BuildHook, IBuildResult, ITaskOptions } from '../@types';
import { PACKAGE_NAME } from './global';
import * as fs from 'fs-extra';
import Tools from './tools';
import CryptoJS from 'crypto-js';
import JSZip from 'jszip';

import {exec} from 'child_process';
import AfterBuildWebMobile from './after-builder-webmobile';
import AfterBuilderNative from './after-builder-native';

function log(...arg: any[]) {
    return console.log(`[${PACKAGE_NAME}] `, ...arg);
}

let allAssets = [];

export const throwError: BuildHook.throwError = true;

export const load: BuildHook.load = async function() {
    console.log(`[${PACKAGE_NAME}] Load cocos plugin example in builder.`);
    allAssets = await Editor.Message.request('asset-db', 'query-assets');
};

export const onBeforeBuild: BuildHook.onBeforeBuild = async function(options: ITaskOptions, result: IBuildResult) {
    if (options.packages['web-mobile'] || options.packages['web-desktop']) {
        //进入web-mobile模式
        return;
    }
    AfterBuilderNative.onBeforeBuild(options, result);
};

export const onBeforeCompressSettings: BuildHook.onBeforeCompressSettings = async function(options: ITaskOptions, result: IBuildResult) {
    // const pkgOptions = options.packages[PACKAGE_NAME];
    // if (pkgOptions.webTestOption) {
    //     console.debug('webTestOption', true);
    // }
    // // Todo some thing
    // console.debug('get settings test', result.settings);
};

export const onAfterCompressSettings: BuildHook.onAfterCompressSettings = async function(options: ITaskOptions, result: IBuildResult) {
    // Todo some thing
    console.log('webTestOption', 'onAfterCompressSettings');
    
};




export async function compressOne(dir : string) : Promise<void>{
    //console.warn('start compress png->',dir);
    const pngquantPath  = path.join(Editor.Project.path,'tools','pngquant','pngquant.exe');
    return new Promise((resolve,reject)=>{
        exec(pngquantPath + ' ' + dir + ' --force --verbose --skip-if-larger --speed=1 --quality=0-100 --ext .png',(error,stdout,stderr)=>{
            if(stdout){
                console.warn("stdout -> ",stdout.toString());
            }
            if(error){
                console.warn('Compress png error->',error);
                resolve();
                return;
            }
            // if(stderr){
            //     console.warn('Compress png stderr->',dir,stderr.toString());
            //     resolve();
            //     return;
            // }
            console.warn('Compress png success->',dir,stdout);
            resolve();
        });
    });
}

/**
 * 对指定bundle中的所有png图片进行压缩
 * @param bundle 
 */
export async function compresPNG(outputName : string,bundle : string){
    const bundleDir     = path.join(Editor.Project.path,'build',outputName,'assets', bundle);
    
    //遍历bundleDir下的所有文件以及文件夹，找到所有的png文件的路径
    const pngFiles : string[] = [];
    Tools.GetAllFilesPath(bundleDir,'.png',pngFiles);   
    //对所有的png文件进行压缩
    for(let i = 0;i<pngFiles.length;i++){
        const pngFile = pngFiles[i];
        await compressOne(pngFile);
    }
}


export const onAfterBuild: BuildHook.onAfterBuild = async function(options: ITaskOptions, result: IBuildResult) {
    //console.warn('onAfterBuild->',options.packages);
    const pkgNames = Object.keys(options.packages);
    console.warn('onAfterBuild -> ', options);
    if (options.packages['web-mobile'] || options.packages['web-desktop']) {
        //进入web-mobile模式
        await AfterBuildWebMobile.onAfterBuild(options, result);
        return;
    }
    await AfterBuilderNative.onAfterBuild(options, result);
};

export const unload: BuildHook.unload = async function() {
    console.log(`[${PACKAGE_NAME}] Unload cocos plugin example in builder.`);
};

export const onError: BuildHook.onError = async function(options, result) {
    // Todo some thing
    console.warn(`${PACKAGE_NAME} run onError`);
};

export const onBeforeMake: BuildHook.onBeforeMake = async function(root, options) {
    console.log(`onBeforeMake: root: ${root}, options: ${options}`);
};

export const onAfterMake: BuildHook.onAfterMake = async function(root, options) {
    console.log(`onAfterMake: root: ${root}, options: ${options}`);
};
