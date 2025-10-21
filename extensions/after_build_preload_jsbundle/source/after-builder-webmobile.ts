import path from 'path';
import { BuildHook, IBuildResult, ITaskOptions } from '../@types';
import { PACKAGE_NAME } from './global';
import * as fs from 'fs-extra';
import Tools from './tools';
import CryptoJS from 'crypto-js';
import JSZip from 'jszip';

import { exec } from 'child_process';

export default class AfterBuildWebMobile {
    /**
     * 对指定文件夹下所有的png的名字进行修改
     * 这些名字的格式都为 name.xxxxx.png，需要去掉.xxxxx
     */
    public static onChangeAllPngNames(dir: string) {
        Tools.foreachDirFileName(dir, (fileName: string) => {
            if (fileName.includes('.jpg') && !fileName.includes('game')) {
                const newName = fileName.split('.')[0] + '.jpg';
                const oldPath = path.join(dir, fileName);
                const newPath = path.join(dir, newName);
                fs.renameSync(oldPath, newPath);
            }
        }, true);
    }


    /**
     * 
     * @param zip 
     * @param baseDir 
     * @param fileName 
     * @returns 
     */
    public static async writeZip(zip : JSZip,baseDir : string,fileName : string,md5str? : string){
        const content = await zip.generateAsync({
            type: "nodebuffer",//nodejs用
            compression: "DEFLATE",
            compressionOptions: {
                level : 9,
            }
        });
    
        if(!md5str){
            const resourcesZipMd5 = CryptoJS.MD5(content.toString()).toString();
            //取最后5位作为resMd5
            //const resMd5    = Editor.Utils.UUID.compressHex(resourcesZipMd5,4).toLocaleLowerCase().substring(0,5);
            md5str    = resourcesZipMd5.substring(0,5);
        }
        
        const newName   = fileName + '.' + md5str;
        const newResourcesZipDir = path.join(baseDir,newName + '.zip');
        fs.writeFileSync(newResourcesZipDir,content);
        return newName;
    }
    /**
     * 生成bundle对应的id和name
     * @param bundleName 
     */
    public static makeBundleIdAndNames(bundleName : {[key : string] : string}) {
        const fileJsonPath  = path.join(Editor.Project.path,'_config','statistical.config.json5');
        const content       = fs.readFileSync(fileJsonPath,{encoding : 'utf-8'});
        const jObject       = JSON.parse(content);
        const bundles       = jObject.bundles as {[name : string] : number};
        let text = 'const bundles = {\n';
        //遍历bundleName
        for(const name in bundleName){
            const fileName  = bundleName[name];
            const gid       = bundles[name];
            if(!gid){
                console.error('Can not found gid for bundle ->',name,fileName);
                console.error('Please define gid in _config/statistical.config.json5 file.');
                continue;
            }
            text += '            ' + gid + ' : "' + fileName + '",\n';
        }
        text += '        };\n';
        return text;
    }



    public static async onAfterBuild(options: ITaskOptions, result: IBuildResult) {
        let bUseVConsole = false;
        if (options.packages['web-mobile']) {
            const webMobile = options.packages['web-mobile'];
            bUseVConsole = webMobile['embedWebDebugger'];
        }
        console.warn('是否开启vConsole->', bUseVConsole);
        const outputName = options.outputName;
        const fileUrl = path.join(Editor.Project.path, 'build', outputName, 'index.html');
        if (!fs.existsSync(fileUrl)) {
            console.error('Can not found index.html->', fileUrl);
        }
        this.onChangeAllPngNames(path.join(Editor.Project.path, 'build', outputName));
        let content = fs.readFileSync(fileUrl, { encoding: 'utf-8' });
        const preDir = path.join(Editor.Project.path, 'build', outputName);
        //获取src/import-map.xxx.json
        const srcDir = path.join(preDir, 'src');
        const cocosjsDir = path.join(preDir, 'cocos-js');

        //找到cocosjsDir/src/settings.xxxxx.json文件，并读取其中的内容
        const settingsFiles = fs.readdirSync(srcDir);
        let settingsFile: string = '';
        for (let i = 0; i < settingsFiles.length; i++) {
            const fileName = settingsFiles[i];
            if (fileName.startsWith('settings')) {
                settingsFile = fileName;
                break;
            }
        }
        const settingsPath = path.join(srcDir, settingsFile);
        const settingsContent = fs.readFileSync(settingsPath, { encoding: 'utf-8' });
        const settingsJson = JSON.parse(settingsContent);
        //这里面是bundle的名字对应的
        const assets = settingsJson['assets'];
        //这里面是bundle的名字对应的版本号
        const bundleVers = assets['bundleVers'] as { [key: string]: string };

        //获取outs中import-map开头的文件名字
        let importMapFile: string = '';
        const srcFiles = fs.readdirSync(srcDir);
        for (let i = 0; i < srcFiles.length; i++) {
            const fileName = srcFiles[i];
            if (fileName.startsWith('import-map')) {
                importMapFile = fileName;
                break;
            }
        }

        const cocosJs = new JSZip();
        let outs: string[] = [];
        const exclude: string[] = ['.mp4', '.ttf'];
        Tools.downloadAsZip(srcDir, cocosJs, exclude, outs);
        Tools.downloadAsZip(cocosjsDir, cocosJs, exclude, outs);//['.wasm','.asm']
        //获取到preDir下的名字含有index和application的js文件，将其打包到cocosJs这个jszip中
        const mFiles = fs.readdirSync(preDir);
        mFiles.forEach((fileName) => {
            if (fileName.includes('index') || fileName.includes('application')) {
                if (!fileName.endsWith('.js')) {
                    return;
                }
                const fillPath = path.join(preDir, fileName);
                const content = fs.readFileSync(fillPath);
                cocosJs.file(fileName, content);
                //删除这个文件
                fs.removeSync(fillPath);
            }
        });

        //cocosJs.file(fileName, fs.readFileSync(fillPath));
        const cocosjsZipDir = path.join(Editor.Project.path, 'build', outputName);

        const cocosJsZipName = await this.writeZip(cocosJs, cocosjsZipDir, 'cocos-js');

        //删除srcDir和cocosjsDir中除了outs之外的文件
        Tools.foreachDirRemoveFileExcludes(srcDir, outs);
        Tools.foreachDirRemoveFileExcludes(cocosjsDir, outs);
        //删除cocos-js/assets目录
        const cocosJsAssetsDir = path.join(cocosjsDir, 'assets');
        fs.removeSync(cocosJsAssetsDir);
        //删除cocos-js目录
        fs.removeSync(cocosjsDir);
        //删除src/chunks目录
        const srcChunksDir = path.join(srcDir, 'chunks');
        fs.removeSync(srcChunksDir);
        //删除src目录
        fs.removeSync(srcDir);
        //删除content中<!-- COCOS TEMP BEGIN -->和<!-- COCOS TEMP END -->之间的部分
        const beginStr = '<!-- COCOS TEMP BEGIN -->';
        const endStr = '<!-- COCOS TEMP END -->';
        const beginIndex = content.indexOf(beginStr);
        const endIndex = content.indexOf(endStr);
        if (beginIndex === -1 || endIndex === -1) {
            console.error('Can not found begin or end');
        }
        content = content.substring(0, beginIndex) + content.substring(endIndex + endStr.length);

        const importMapContent = '<script src="src/' + importMapFile + '" type="systemjs-importmap" charset="utf-8"> </script>';
        //替换content中<!-- INSERT IMPORT MAP -->
        const insertIndex = content.indexOf('<!-- INSERT IMPORT MAP -->');
        if (insertIndex === -1) {
            console.error('Can not found insert index');
        }
        content = content.substring(0, insertIndex) + importMapContent + content.substring(insertIndex);


        //将assets目录下的main,resources,internal三个文件夹打包成resources.zip存放在assets目录下，并删除这三个文件夹
        const assetsDir = path.join(Editor.Project.path, 'build', outputName, 'assets');
        const resourcesZip = new JSZip();
        const resourcesDir = path.join(assetsDir, 'resources');
        //压缩resources目录下的png
        //await compresPNG(outputName,'resources');
        outs = [];
        const mainDir = path.join(assetsDir, 'main');
        const internalDir = path.join(assetsDir, 'internal');
        Tools.downloadAsZip(resourcesDir, resourcesZip, exclude, outs);
        Tools.downloadAsZip(mainDir, resourcesZip, [], []);
        Tools.downloadAsZip(internalDir, resourcesZip, [], []);

        const resourcesZipName = await this.writeZip(resourcesZip, assetsDir, 'resources');

        Tools.foreachDirRemoveFileExcludes(resourcesDir, outs);
        fs.removeSync(mainDir);
        fs.removeSync(internalDir);
        //将其余文件夹分别打包成和文件夹名字相同的zip文件，存放在assets目录下，并删除这些文件夹
        const files = fs.readdirSync(assetsDir);
        const bundleNames: { [key: string]: string } = {};
        const allNames: string[] = [];
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            if (fileName.includes("resources")) {
                continue;
            }
            const fillPath = path.join(assetsDir, fileName);
            if (fs.statSync(fillPath).isDirectory()) {
                //await compresPNG(outputName,fileName);
                const zip = new JSZip();
                const excludeOuts: string[] = [];
                const md5str = bundleVers[fileName];
                Tools.downloadAsZip(fillPath, zip, ['.mp4', '.ttf'], excludeOuts);
                const newName = await this.writeZip(zip, assetsDir, fileName, md5str);
                if (excludeOuts.length == 0) {
                    fs.removeSync(fillPath);
                } else {
                    //当有文件没有被删除时，不能删除文件夹
                    Tools.foreachDirRemoveFileExcludes(fillPath, excludeOuts);
                }
                bundleNames[fileName] = newName;
                allNames.push(newName);
            }
        }
        //将content中的%cocos-js%替换成cocos-js.zip的名字
        let allBundles = '"' + resourcesZipName + '",';
        for (let i = 0; i < allNames.length; i++) {
            const name = allNames[i];
            allBundles += '"' + name + '"';
            if (i != allNames.length - 1) {
                allBundles += ',';
            }
        }
        if(allBundles.endsWith(',')){
            allBundles = allBundles.substring(0, allBundles.length - 1);
        }
        content = content.replace('%cocos-js%', cocosJsZipName);
        let text = this.makeBundleIdAndNames(bundleNames);
        text += '        const searchs = window.searchs;\n'
        text += '        const gid = searchs["gid"];\n';
        text += '        if(!gid){\n';
        text += '            console.error("Can not found gid in searchs");\n';
        text += '            window["bundles"] = [' + allBundles + '];\n';
        text += '        }else{\n';
        text += '            const fileName = bundles[gid];\n';
        text += '            if(!fileName){\n';
        text += '               window["bundles"] = [' + allBundles + '];\n';
        text += '            }else{\n',
        text += '                window["bundles"] = ["' + resourcesZipName + '" , fileName];\n';
        text += '            }\n'
        text += '        }\n';
        //将content中的//BUNDLES DEFINED// 替换成text
        content = content.replace('//BUNDLES DEFINED//', text);

        if (bUseVConsole) {
            //1.替换content中<!-- INSERT VCONSOLE JS-->
            let html = '<script text= "text/javascript">\n';
            html += '        if(window.debug){\n';
            html += '            var script = document.createElement("script");\n';
            html += '            script.src = "./vconsole.min.js";\n';
            html += '            document.body.appendChild(script);\n';
            //for IE
            html += '            if(script.readyState){\n';
            html += '                script.onreadystatechange = function(){\n';
            html += '                    if(script.readyState == "loaded" || script.readyState == "complete"){\n';
            html += '                        script.onreadystatechange = null;\n';
            html += '                        window.VConsole && (window.vConsole = new VConsole());\n';
            html += '                    }\n';
            html += '                }\n';
            html += '            }else{\n';
            html += '                script.onload = function(){\n';
            html += '                    window.VConsole && (window.vConsole = new VConsole());\n';
            html += '                }\n';
            html += '            }\n';
            html += '       }\n';
            html += '    </script>\n';



            // const vConsoleJs = "./vconsole.min.js";
            // let vConsoleHtml = '<script src="' + vConsoleJs + '"></script>\n';
            // vConsoleHtml +='    <script text="text/javascript">\n';
            // vConsoleHtml +='        window.VConsole && (window.vConsole = new VConsole());\n';
            // vConsoleHtml +='    </script>\n';
            content = content.replace('<!-- INSERT VCONSOLE JS-->', html);
        }


        //对libs/ziploader.js进行MD5计算，将其名字改为ziploader.xxxxx.js
        const libsDir = path.join(preDir, 'libs');
        const zipLoaderPath = path.join(libsDir, 'ziploader.js');
        const zipLoaderContent = fs.readFileSync(zipLoaderPath);
        const zipLoaderMd5 = CryptoJS.MD5(zipLoaderContent.toString()).toString();
        const zipLoaderNewName = 'ziploader.' + zipLoaderMd5.substring(0, 5) + '.js';
        const zipLoaderNewPath = path.join(libsDir, zipLoaderNewName);
        fs.renameSync(zipLoaderPath, zipLoaderNewPath);

        //将content中的libs/ziploader.js替换成libs/ziploader.xxxxx.js
        content = content.replace('libs/ziploader.js', 'libs/' + zipLoaderNewName);
        //将content写入文件
        fs.writeFileSync(fileUrl, content);

        //将outputName目录下的所有文件打包成outputName.zip存放到build目录下
        const outputZip = new JSZip();
        Tools.downloadAsZip(preDir, outputZip, [], [], false);
        const outputZipDir = path.join(Editor.Project.path, 'build', outputName + '.zip');
        const outputZipContent = await outputZip.generateAsync({
            type: "nodebuffer",//nodejs用
            compression: "DEFLATE",
            compressionOptions: {
                level: 9,
            }
        });
        //如果outputZipDir存在则删除
        if (fs.existsSync(outputZipDir)) {
            fs.removeSync(outputZipDir);
        }
        fs.writeFileSync(outputZipDir, outputZipContent);
    }

}