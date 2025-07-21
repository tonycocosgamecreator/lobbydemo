import fs from 'fs-extra';
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

}