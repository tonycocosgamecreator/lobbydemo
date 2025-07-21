import path from "path";
import xlsx from "node-xlsx";
import fs from "fs-extra";
export default class DbI18nChecker {
    /**
     * 当前所有的语言id
     */
    private static _all_language_ids : string[] = [];
    private static _all_language_names : string[] = [];

    public static check_i18n_config() {
        this._all_language_ids = [];
        //首先读取_config/resources/语言配置_i18n_language_config_db.xlsx
        const filePath  = path.join(Editor.Project.path, '_config/resources/语言配置_i18n_language_config_db.xlsx');
        //读表格
        const sheets    = xlsx.parse(fs.readFileSync(filePath));
        if(!sheets){
            return;
        }
        //获取第一个sheet
        const sheet = sheets[0];
        if(!sheet){
            return;
        }
        
        const data = sheet.data;
        if(!data){
            return;
        }
        //从第9行开始读取数据
        //获取所有的语言id
        for(let i = 8; i < data.length; i++){
            const row = data[i];
            if(!row){
                continue;
            }
            const language_id = row[2];
            if(!language_id){
                continue;
            }
            this._all_language_ids.push(language_id);
            this._all_language_names.push(row[1]);
        }

        //console.warn('check_i18n_config -> ', this._all_language_ids);
        //对所有bundle中的多语言配置表进行检测
        const _configUrl = path.join(Editor.Project.path, '_config');
        //获取_configUrl下的所有 文件夹 的名字
        const dirs = fs.readdirSync(_configUrl);
        for(let i = 0; i < dirs.length; i++){
            const dir       = dirs[i];
            const dirPath   = path.join(_configUrl, dir);
            //判断是否是文件夹
            const stat = fs.statSync(dirPath);
            if(!stat.isDirectory()){
                continue;
            }
            // if(dir != 'resources'){
            //     continue;
            // }
            //获取多语言配置表
            const dbPath = path.join(dirPath, '多语言_i18n_' + dir + '_db.xlsx');
            if(!fs.existsSync(dbPath)){
                console.error('多语言配置表不存在 -> ', dbPath);
                continue;
            }
            this.check_i18n_db(dbPath);
        }
    }

    private static check_i18n_db(dbPath : string){
        const sheets    = xlsx.parse(fs.readFileSync(dbPath));
        if(!sheets){
            return;
        }
        //获取第一个sheet
        const sheet = sheets[0];
        if(!sheet){
            return;
        }
        const datas = sheet.data;
        if(!datas){
            return;
        }
        //找到第一列数据为FLD_NAME的行
        let keyIndex = -1;
        let fldName : any[] = null;
        for(let i = 0; i < datas.length; i++){
            const row = datas[i];
            if(!row){
                continue;
            }
            if(row[0] == 'FLD_NAME'){
                keyIndex    = i;
                fldName     = row;
                break;
            }
        }
        if(keyIndex == -1){
            console.error('没有找到FLD_NAME字段');
            return;
        }
        let newerLanguageIds : string[]     = [];
        let newerLanguageNames : string[]   = [];
        let newerFiledTypes : string[]      = [];
        for(let i = 0;i<this._all_language_ids.length;i++){
            const language_id = this._all_language_ids[i];
            if(!fldName.includes(language_id)){
                newerLanguageIds.push(language_id);
                newerLanguageNames.push(this._all_language_names[i]);
                newerFiledTypes.push('S');
            }
        }
        if(newerLanguageIds.length == 0){
            //没有需要更新的语言字段
            return;
        }
        let fildType    = datas[keyIndex - 1];
        let fildDesc    = datas[keyIndex + 1];
        //在最后一列插入新的语言id
        fldName.push(...newerLanguageIds);
        fildDesc.push(...newerLanguageNames);
        fildType.push(...newerFiledTypes);
        //检测新的语言是否有en字段
        let enIndex = -1;
        let en_us_index = -1;
        for(let i = 0; i < fldName.length; i++){
            if(!fldName[i]){
                continue;
            }
            if(fldName[i] == 'en_us'){
                en_us_index = i;
                continue;
            }
            if(fldName[i].includes('en') && fldName[i] != 'en_us'){
                enIndex = i;
                break;
            }
        }
        console.warn('check_i18n_db -> ', newerLanguageIds,enIndex,en_us_index);
        if(enIndex != -1 && en_us_index != -1){
            
            for(let i = 0;i<datas.length;i++){
                const rowData = datas[i];
                if(rowData[0] == "DATA"){
                    rowData[enIndex] = rowData[en_us_index];
                }
            }
        }

        //写入新的数据
        //写入文件
        const sheetOptions  = {'!cols': [{wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}]};
        const buffer        = xlsx.build([{name : sheet.name,data : datas,options : sheetOptions}]);
        fs.writeFileSync(dbPath,buffer,{encoding : "binary"});
        console.warn(dbPath + ' : writeNewLanguage -> ', newerLanguageIds);
    }   

}   