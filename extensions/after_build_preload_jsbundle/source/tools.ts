import * as fs from 'fs-extra';
import JSZip from 'jszip';
import path from 'path';
export default class Tools
{
    static foreachDir(dir : string,callback : (name : string)=>void,bNotRecursion? : boolean) {
        if (!fs.existsSync(dir)){
            console.error("找不到指定文件夹：",dir);
            return;
        }

        fs.readdirSync(dir).forEach((fileName) => {
            if (fileName.startsWith("~")) {
                // 忽略隐藏文件
                return;
            }

            let pathName = path.join(dir, fileName);

            try {
                if (fs.statSync(pathName).isDirectory() && bNotRecursion != true) {
                    this.foreachDir(pathName, callback,bNotRecursion);
                } else {
                    callback(path.normalize(pathName));
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    static foreachDirRemoveFileExcludes(dir : string,excludes : string[]) {
        if (!fs.existsSync(dir)){
            console.warn("[Tools.foreachDirFileName]->找不到指定文件夹：",dir);
            return;
        }
        fs.readdirSync(dir).forEach((fileName) => {
            if (fileName.startsWith("~")) {
                // 忽略隐藏文件
                return;
            }
            let pathName = path.join(dir, fileName);
            if (fs.statSync(pathName).isDirectory()) {
                this.foreachDirRemoveFileExcludes(pathName, excludes);
                //检查pathName是否为空文件夹
                if(fs.existsSync(pathName) && fs.readdirSync(pathName).length == 0){
                    fs.removeSync(pathName);
                }
            } else {
                if(!fs.statSync(pathName).isDirectory()){
                    if(!excludes.includes(fileName)){
                        fs.removeSync(pathName);
                    }
                }
            }
        });
        if(fs.existsSync(dir) && fs.readdirSync(dir).length == 0){
            fs.removeSync(dir);
        }
    }

    static foreachDirFileName(dir : string,callback : (name : string)=>void,bNotRecursion : boolean = false){
        if (!fs.existsSync(dir)){
            console.warn("[Tools.foreachDirFileName]->找不到指定文件夹：",dir);
            return;
        }

        fs.readdirSync(dir).forEach((fileName) => {
            if (fileName.startsWith("~")) {
                // 忽略隐藏文件
                return;
            }

            let pathName = path.join(dir, fileName);

            try {
                if (fs.statSync(pathName).isDirectory() && !bNotRecursion) {
                    this.foreachDirFileName(pathName, callback,bNotRecursion);
                } else {
                    if(!fs.statSync(pathName).isDirectory()){
                        callback(path.normalize(fileName));
                    }
                    
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    public static GetAllFilesPath(dir : string,ext : string,out : string[]){
        if (!fs.existsSync(dir)){
            console.warn("[Tools.foreachDirFileName]->找不到指定文件夹：",dir);
            return [];
        }
        fs.readdirSync(dir).forEach((fileName) => {
            if (fileName.startsWith("~")) {
                // 忽略隐藏文件
                return;
            }

            let pathName = path.join(dir, fileName);

            try {
                if (fs.statSync(pathName).isDirectory()) {
                    this.GetAllFilesPath(pathName,ext,out);
                } else {
                    if(!fs.statSync(pathName).isDirectory()){
                        if(path.extname(pathName) == ext){
                            out.push(pathName);
                        }
                    }
                }
            } catch (error) {
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
    public static downloadAsZip(url : string,zip : JSZip,exclude? : string[],excludeOuts? : string[],bUseFirstFolder : boolean = true){
        //console.warn("downloadAsZip->",url,exclude,excludeOuts);
        if (!fs.existsSync(url)){
            console.warn("找不到指定文件夹：",url);
            return;
        }
        const baseName = path.basename(url);
        if(bUseFirstFolder){
            zip = zip.folder(baseName);
        }
        
        const files = fs.readdirSync(url); 
        files.forEach(fileName => {
            const fillPath = url + "/" + fileName;
            if(exclude){
                //console.warn("filePath->",fillPath);
                for(let i = 0;i<exclude.length;i++){    
                    const excludeName = exclude[i];
                    if(fileName.startsWith(excludeName) || fileName.endsWith(excludeName)){
                        console.log("excludeName->",excludeName,fileName);
                        excludeOuts && excludeOuts.push(fileName);
                        return;
                    }
                }
            }
            
            const file = fs.statSync(fillPath);
            // 如果是文件夹的话需要递归遍历下面的子文件
            if (file.isDirectory()) {
                //const dirZip = zip.folder(fileName);
                this.downloadAsZip(fillPath,zip,exclude,excludeOuts);
            } else {
                // 读取每个文件为buffer存到zip中
                zip.file(fileName, fs.readFileSync(fillPath));
            }
        });
    }
}