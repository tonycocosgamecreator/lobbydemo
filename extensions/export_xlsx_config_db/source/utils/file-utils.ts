import fs from 'fs';
import path from 'path';
export default class FileUtils {

    public static IsFileExist(path : string){
        return fs.existsSync(path);
    }

    /**
     * 一行一行读取
     * @param path 
     */
    public static GetFileContentByLines(path : string) : string[] {
        if(!fs.existsSync(path)){
            return [];
        }
        const content   = fs.readFileSync(path,{encoding : 'utf-8'});
        return content.split("\n");
    }


    /**
     * 获取文件夹下所有文件 不递归
     * @param folderPath  文件夹路径
     * @param extName   文件后缀名 可选 传入null或者不传则获取所有文件
     * @returns 所有文件的绝对路径，不递归
     */
    public static GetAllFilesInFolder(folderPath : string,extName : string | null = null) : string[] {
        if(!fs.existsSync(folderPath)){
            return [];
        }
        if(extName && extName.startsWith(".")){
            extName = extName.substring(1);
        }
        const files = fs.readdirSync(folderPath);
        let result : string[] = [];
        for(let i = 0; i < files.length; i++){
            const file = files[i];
            const pExtName = path.extname(file).substring(1);
            const filePath = folderPath + "/" + file;
            if(extName){
                if(pExtName === extName){
                    result.push(filePath);
                }
            }else{
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
    public static WriteFile(path : string,content : string){
        fs.writeFileSync(path,content,{encoding : 'utf-8'});
    }
}