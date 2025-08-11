import Tools from "../utils/tools";
const BASIC_TYPE_2_TS_TYPE = {
    I: "number",
    F: "number",
    S: "string",
    B: "boolean",
};

const COL_2_NAME = [];
{
    let str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let i = 0; i < str.length; i++) {
        const char = str.substring(i, i + 1);
        COL_2_NAME.push(char);
    }

    for (let i = 0; i < str.length; i++) {
        const char1 = str.substring(i, i + 1);

        for (let j = 0; j < str.length; j++) {
            const char2 = str.substring(j, j + 1);
            COL_2_NAME.push(char1 + char2)
        }
    }

    // console.log(COL_2_NAME);
}
export class DbBundleDataBase {
    originFilePath : string;
    originSheetName : string;

    name : string;
    rule : string;
    // bExportKey = false;
    fields : DataBaseField[] = [];

    /**
     * [[varname, keyFieldName, valueFieldName]]
     */
    exportConsts : [string,string,string][] = [];

    /**
     * 原始数据，和rule无关
     * [
     *      {k1:v1, k2:v2}
     * ]
     */
    originDatas : {[key : string] : any}[] = [];
    /**
     * 原始数据index到原始表格row的映射关系
     */
    originDataIndex_2_originFilePath_originSheetName_originRow = {};

    datas;

    warnLog = [];

    constructor() {
        this.fields = [];
        this.warnLog = [];
    }

    setFields(fields) {
        this.fields = Tools.sortArrayByField(fields, "originCol")
    }

    getFieldByName(fieldName) {
        for (let i = 0; i < this.fields.length; i++) {
            const field = this.fields[i];
            if (field.name == fieldName) return field;
        }
        return null;
    }

    setExportConsts(exportConsts : [string,string,string][]) {
        this.exportConsts = exportConsts;
    }

    setOriginDatas(originDatas, originDataIndex_2_originFilePath_originSheetName_originRow) {
        this.originDatas = originDatas;
        this.originDataIndex_2_originFilePath_originSheetName_originRow = originDataIndex_2_originFilePath_originSheetName_originRow;

        let type_2_valid = {
            S: true,
            I: true,
            F: true,
        }

        // console.log("DataBase.setOriginDatas", this);

        // 解析为正式格式？
        switch (this.rule) {
            case "a": {
                this.datas = [];
                for (let i = 0; i < this.originDatas.length; i++) {
                    const data = this.originDatas[i];
                    this.datas.push(data);
                }
                break;
            }
            case "ma": {
                this.datas = {};
                for (let i = 0; i < this.originDatas.length; i++) {
                    const data = this.originDatas[i];

                    let majorIdField = this.fields[0];
                    if (!majorIdField) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 未找到主要id字段！", this.originFilePath, this.rule));
                        return;
                    }


                    if (!type_2_valid[majorIdField.type]) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 主要id[%s]类型不能为[%s]！请配置为I, F, S中的一种。", this.originFilePath, this.rule, majorIdField.name, majorIdField.type));
                    }

                    let majorId = data[majorIdField.name];
                    if (majorId == null) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 主要id[%s]未配置！", this.originFilePath, this.rule, majorIdField.name));
                    }

                    // console.log(this.name, i, majorIdField.name, majorIdField.tsType);

                    let minorDatas = this.datas[majorId];
                    if (!minorDatas) {
                        minorDatas = [];
                        this.datas[majorId] = minorDatas;
                    }

                    minorDatas.push(data);
                }
                break;
            }
            case "mm": {
                this.datas = {};
                for (let i = 0; i < this.originDatas.length; i++) {
                    const data = this.originDatas[i];
                    let row = originDataIndex_2_originFilePath_originSheetName_originRow[i][2];

                    let majorIdField = this.fields[0];
                    if (!majorIdField) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 未找到主要id字段！", this.originFilePath, this.rule));
                        return;
                    }

                    if (!type_2_valid[majorIdField.type]) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 主要id[%s]类型不能为[%s]！请配置为I, F, S中的一种。", this.originFilePath, this.rule, majorIdField.name, majorIdField.type));
                    }

                    let majorId = data[majorIdField.name];
                    if (majorId == null) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 主要id[%s]未配置！", this.originFilePath, this.rule, majorIdField.name));
                    }

                    let minorIdField = this.fields[1];
                    if (!minorIdField) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 未找到次要id字段！", this.originFilePath, this.rule));
                        return;
                    }

                    let minorId = data[minorIdField.name];
                    if (minorId == null) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 次要id[%s]未配置！主id[%s]=[%s]！", this.originFilePath, this.rule, majorIdField.name, majorIdField.name, majorId));
                    }

                    let minorDatas = this.datas[majorId];
                    if (!minorDatas) {
                        minorDatas = {};
                        this.datas[majorId] = minorDatas;
                    }

                    if (minorDatas[minorId]) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 次要id冲突：主id[%s]=[%s] 次id[%s]=[%s]，请检查配置表第%d行。", this.originFilePath, this.rule, minorIdField.name, minorId, majorIdField.name, majorId, row + 1));
                    }
                    minorDatas[minorId] = data;
                }
                break;
            }
            case "m": {
                this.datas = {};
                for (let i = 0; i < this.originDatas.length; i++) {
                    const data = this.originDatas[i];
                    let row = originDataIndex_2_originFilePath_originSheetName_originRow[i][2];

                    let majorIdField = this.fields[0];
                    if (!majorIdField) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 未找到主要id字段！", this.originFilePath, this.rule));
                        return;
                    }

                    if (!type_2_valid[majorIdField.type]) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 主要id[%s]类型不能为[%s]！请配置为I, F, S中的一种。", this.originFilePath, this.rule, majorIdField.name, majorIdField.type));
                    }

                    let majorId = data[majorIdField.name];
                    if (majorId == null) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 主要id[%s]未配置！", this.originFilePath, this.rule, majorIdField.name));
                    }

                    // console.log("majorId", i, majorId, !!this.datas[majorId])

                    if (this.datas[majorId]) {
                        this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 主要id冲突：%s=[%s]，请检查配置表第%d行。", this.originFilePath, this.rule, majorIdField.name, majorId, row + 1));
                    }
                    this.datas[majorId] = data;
                }
                break;
            }
            default: {
                if (this.name != null) {
                    this.warnLog.push(Tools.format("配置表[%s] rule=[%s] 不支持此规则，请使用m、mm、ma、a中的一种。", this.originFilePath, this.rule));
                    // 未知rule？
                } else {
                    // 没有名字，说明这不是一个合法的需要导出的配置，无需报警
                }
                this.datas = {};
                break;
            }
        }
    }

    forDb(callback, bOnlyForMajor = false) {
        switch (this.rule) {
            case "a": {
                for (let i = 0; i < this.datas.length; i++) {
                    const data = this.datas[i];
                    callback(data, i);
                }
                break;
            }
            case "ma": {
                Tools.forEachMap(this.datas, (majorId, arr) => {
                    if (bOnlyForMajor) {
                        callback(arr, majorId);
                    } else {
                        for (let i = 0; i < arr.length; i++) {
                            const data = arr[i];
                            callback(data, majorId, i);
                        }
                    }
                });
                break;
            }
            case "mm": {
                Tools.forEachMap(this.datas, (majorId, minorDatas) => {
                    if (bOnlyForMajor) {
                        callback(minorDatas, majorId);
                    } else {
                        Tools.forEachMap(minorDatas, (minorId, data) => {
                            callback(data, majorId, minorId);
                        });
                    }
                });
                break;
            }
            // case "m":
            default: {
                Tools.forEachMap(this.datas, (majorId, data) => {
                    callback(data, majorId);
                });
                break;
            }
        }
    }

    getMajorIdName() {
        return this.fields[0].name;
    }

    getMinorIdName() {
        return this.fields[1].name;
    }

    /**
     * 生成原始json数据
     */
    generatePreviewDbJsonText() {
        let text = '';

        text += '{\n';

        // name
        text += Tools.format("'name': '%s',\n", this.name);

        // rule
        text += Tools.format("'rule': '%s',\n", this.rule);

        // 关联配置表
        // console.log("Exporter.dbNames_2_dbFilePathMap", Exporter.dbNames_2_dbFilePathMap)
        // let filePathMap = DbBundleDatas.Instance.dbNames_2_dbFilePathMap[this.name];
        // if (filePathMap) {
        //     let filePaths = [];
        //     Tools.forEachMap(filePathMap, (filePath) => {
        //         filePath = filePath.replaceAll(Editor.Project.path + "\\", "").replaceAll("\\", "/");
        //         // console.log(Exporter.prjRootDir, filePath)
        //         filePaths.push(filePath)
        //     });
        //     text += Tools.format("'sources': %s,\n", JSON.stringify(filePaths));
        // };


        // 字段
        let fields = [];
        for (let i = 0; i < this.fields.length; i++) {
            const v = this.fields[i];

            fields.push({
                originCol: v.originCol,
                name: v.name,
                type: v.type,
                tsType: v.tsType,
                desc: v.desc,
                verifyers: v.verifyers,
                idMergeTo: v.idMergeTo,
            });
        }
        text += Tools.format("'fields': %s,\n", JSON.stringify(fields, null, 4));

        // 字段
        text += Tools.format("'datas': %s\n", JSON.stringify(this.datas, null, 4));

        text += '}';

        return text
    }

    /**
     * 生成db.d.ts文本
     */
    generateDbdtsText(moduleName : string) {
        let text = "";

        text += Tools.format('    type %s_data = {\n', this.name);
        for (let i = 0; i < this.fields.length; i++) {
            const field = this.fields[i];

            if (field.desc) {
                text += Tools.format('        /** %s */\n', field.desc);
            }

            text += Tools.format('        readonly %s: %s,\n', field.name, field.tsType);

        }
        text += '    };\n';

        text += '\n';

        switch (this.rule) {
            case "m": {
                let majorField = this.fields[0];
                text += Tools.format('    type %s = {\n', this.name);
                text += Tools.format('        [%s: %s]: %s_data,\n', majorField.name, majorField.tsType, this.name);
                text += '    };\n';
                break;
            }
            case "mm": {
                let majorField = this.fields[0];
                let minorField = this.fields[1];
                text += Tools.format('    type %s = {\n', this.name);
                text += Tools.format('        [%s: %s]: {\n', majorField.name, majorField.tsType);
                text += Tools.format('            [%s: %s]: %s_data,\n', minorField.name, minorField.tsType, this.name);
                text += '        },\n'
                text += '    };\n';
                break;
            }
            case "ma": {
                let majorField = this.fields[0];
                text += Tools.format('    type %s = {\n', this.name);
                text += Tools.format('        [%s: %s]: %s_data[],\n', majorField.name, majorField.tsType, this.name);
                text += '    };\n';
                break;
            }
            case "a": {
                text += Tools.format('    type %s = %s_data[];\n', this.name, this.name);
                break;
            }
        }

        text += '\n';

        text += this.generateDbdtsGettersText(moduleName);


        return text;
    }

    generateAutoExportDbTsGettersText(moduleName : string) {
        let text = "";

        text += Tools.format("    %s.get_%s = (): %s.%s => { return DbManager.getDataBase('%s').datas; }\n", moduleName,this.name, moduleName, this.name, this.name);

        switch (this.rule) {
            case "m": {
                let majorField = this.fields[0];
                text += Tools.format("    %s.get_from_%s = (%s: %s, bQuiet?: boolean): %s.%s_data => { return DbManager.getDataBase('%s')._get1(%s, bQuiet); }\n",
                    moduleName,
                    this.name,
                    majorField.name,
                    majorField.tsType == 'number' ? 'number | string' : majorField.tsType,
                    moduleName,
                    this.name,
                    this.name,
                    majorField.name,
                );
                text += Tools.format("    %s.foreach_from_%s = (callback: (%sKey: string, data: %s.%s_data) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData1(callback); }\n",
                    moduleName,
                    this.name,
                    majorField.name,
                    moduleName,
                    this.name,
                    this.name,
                );
                break;
            }
            case "mm": {
                let majorField = this.fields[0];
                let minorField = this.fields[1];
                text += Tools.format("    %s.get_from_%s = (%s: %s, %s: %s, bQuiet?: boolean): %s.%s_data => { return DbManager.getDataBase('%s')._get2(%s, %s, bQuiet); }\n",
                    moduleName,
                    this.name,
                    majorField.name,
                    majorField.tsType == 'number' ? 'number | string' : majorField.tsType,
                    minorField.name,
                    minorField.tsType == 'number' ? 'number | string' : minorField.tsType,
                    moduleName,
                    this.name,
                    this.name,
                    majorField.name,
                    minorField.name,
                );
                text += Tools.format("    %s.foreach_from_%s = (callback: (%sKey: string, %sKey: string, data: %s.%s_data) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData2(callback); }\n",
                    moduleName,
                    this.name,
                    majorField.name,
                    minorField.name,
                    moduleName,
                    this.name,
                    this.name,
                );
                text += Tools.format("    %s.getMap_from_%s = (%s: %s, bQuiet?: boolean): { [%s: %s]: %s.%s_data } => { return DbManager.getDataBase('%s')._get1(%s, bQuiet); }\n",
                    moduleName,
                    this.name,
                    majorField.name,
                    majorField.tsType == 'number' ? 'number | string' : majorField.tsType,
                    minorField.name,
                    minorField.tsType,
                    moduleName,
                    this.name,
                    this.name,
                    majorField.name,
                );
                text += Tools.format("    %s.foreachMap_from_%s = (callback: (%sKey: string, datas: { [%s: %s]: %s.%s_data }) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData1(callback); }\n",
                    moduleName,
                    this.name,
                    majorField.name,
                    minorField.name,
                    minorField.tsType,
                    moduleName,
                    this.name,
                    this.name,
                );
                break;
            }
            case "ma": {
                let majorField = this.fields[0];
                text += Tools.format("    %s.get_from_%s = (%s: %s, index: number, bQuiet?: boolean): %s.%s_data => { return DbManager.getDataBase('%s')._get2(%s, index, bQuiet); }\n",
                    moduleName,
                    this.name,
                    majorField.name,
                    majorField.tsType == 'number' ? 'number | string' : majorField.tsType,
                    moduleName,
                    this.name,
                    this.name,
                    majorField.name,
                );
                text += Tools.format("    %s.foreach_from_%s = (callback: (%sKey: string, index: number, data: %s.%s_data) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData2(callback); }\n",
                    moduleName,
                    this.name,
                    majorField.name,
                    moduleName,
                    this.name,
                    this.name,
                );
                text += Tools.format("    %s.getArr_from_%s = (%s: %s, bQuiet?: boolean): %s.%s_data[] => { return DbManager.getDataBase('%s')._get1(%s, bQuiet); }\n",
                    moduleName,
                    this.name,
                    majorField.name,
                    majorField.tsType == 'number' ? 'number | string' : majorField.tsType,
                    moduleName,
                    this.name,
                    this.name,
                    majorField.name,
                );
                text += Tools.format("    %s.foreachArr_from_%s = (callback: (%sKey: string, datas: %s.%s_data[]) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData1(callback); }\n",
                    moduleName,
                    this.name,
                    majorField.name,
                    moduleName,
                    this.name,
                    this.name,
                );
                break;
            }
            case "a": {
                text += Tools.format("    %s.get_from_%s = (index: number, bQuiet?: boolean): %s.%s_data => { return DbManager.getDataBase('%s')._get1(index, bQuiet); }\n",
                    moduleName,
                    this.name,
                    moduleName,
                    this.name,
                    this.name,
                );
                text += Tools.format("    %s.foreach_from_%s = (callback: (index: number, data: %s.%s_data) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData1(callback); }\n",
                    moduleName,
                    this.name,
                    moduleName,
                    this.name,
                    this.name,
                );
                break;
            }
        }

        return text;
    }



    generateDbdtsGettersText(moduleName : string) {
        let text = "";

        text += Tools.format("    function get_%s(): %s.%s;\n", this.name, moduleName, this.name);

        switch (this.rule) {
            case "m": {
                let majorField = this.fields[0];
                text += Tools.format("    function get_from_%s(%s: %s, bQuiet?: boolean): %s.%s_data;\n",
                    this.name,
                    majorField.name,
                    majorField.tsType == 'number' ? 'number | string' : majorField.tsType,
                    moduleName,
                    this.name,
                );
                text += Tools.format("    function foreach_from_%s(callback: (%sKey: string, data: %s.%s_data) => (void | boolean)): void;\n",
                    this.name,
                    majorField.name,
                    moduleName,
                    this.name,
                );
                break;
            }
            case "mm": {
                let majorField = this.fields[0];
                let minorField = this.fields[1];
                text += Tools.format("    function get_from_%s(%s: %s, %s: %s, bQuiet?: boolean): %s.%s_data;\n",
                    this.name,
                    majorField.name,
                    majorField.tsType == 'number' ? 'number | string' : majorField.tsType,
                    minorField.name,
                    minorField.tsType == 'number' ? 'number | string' : minorField.tsType,
                    moduleName,
                    this.name,
                );
                text += Tools.format('    function foreach_from_%s(callback: (%sKey: string, %sKey: string, data: %s.%s_data) => (void | boolean)): void;\n',
                    this.name,
                    majorField.name,
                    minorField.name,
                    moduleName,
                    this.name,
                );
                text += Tools.format('    function getMap_from_%s(%s: %s, bQuiet?: boolean): { [%s: %s]: %s.%s_data };\n',
                    this.name,
                    majorField.name,
                    majorField.tsType == 'number' ? 'number | string' : majorField.tsType,
                    minorField.name,
                    minorField.tsType,
                    moduleName,
                    this.name,
                );
                text += Tools.format('    function foreachMap_from_%s(callback: (%sKey: string, datas: { [%s: %s]: %s.%s_data }) => (void | boolean)): void;\n',
                    this.name,
                    majorField.name,
                    minorField.name,
                    minorField.tsType,
                    moduleName,
                    this.name,
                );
                break;
            }
            case "ma": {
                let majorField = this.fields[0];
                text += Tools.format('    function get_from_%s(%s: %s, index: number, bQuiet?: boolean): %s.%s_data;\n',
                    this.name,
                    majorField.name,
                    majorField.tsType == 'number' ? 'number | string' : majorField.tsType,
                    moduleName,
                    this.name,
                );
                text += Tools.format('    function foreach_from_%s(callback: (%sKey: string, index: number, data: %s.%s_data) => (void | boolean)): void;\n',
                    this.name,
                    majorField.name,
                    moduleName,
                    this.name,
                );
                text += Tools.format('    function getArr_from_%s(%s: %s, bQuiet?: boolean): %s.%s_data[];\n',
                    this.name,
                    majorField.name,
                    majorField.tsType == 'number' ? 'number | string' : majorField.tsType,
                    moduleName,
                    this.name,
                );
                text += Tools.format('    function foreachArr_from_%s(callback: (%sKey: string, datas: %s.%s_data[]) => (void | boolean)): void;\n',
                    this.name,
                    majorField.name,
                    moduleName,
                    this.name,
                );
                break;
            }
            case "a": {
                text += Tools.format('    function get_from_%s(index: number, bQuiet?: boolean): %s.%s_data;\n',
                    this.name,
                    moduleName,
                    this.name,
                );
                text += Tools.format('    function foreach_from_%s(callback: (index: number, data: %s.%s_data) => (void | boolean)): void;\n',
                    this.name,
                    moduleName,
                    this.name,
                );
                break;
            }
        }

        return text;
    }

    /**
     * 导出_autoExportDb.ts中使用的文本
     */
    generateAutoExportDbTsConstsText(moduelName : string) {
        if (!this.exportConsts) return "";

        let text = "";

        for (let i = 0; i < this.exportConsts.length; i++) {
            const v = this.exportConsts[i];

            // 提取exportConst中的变量
            let [varname, keyFieldName, valueFieldName] = v;

            // 提取field
            let keyField = this.getFieldByName(keyFieldName);
            let valueField = this.getFieldByName(valueFieldName);
            if (!keyField || !valueField) continue;

            // 写入注释
            if (keyField.desc) {
                text += `    /** ${keyField.desc} */\n`;
            }
            text += Tools.format('%s.%s = {\n', moduelName,varname);

            // 提取数据
            let map = {};
            this.forDb((data) => {
                let key = data[keyFieldName];
                let value = data[valueFieldName];

                if (key != null && value != null) {
                    map[key] = value;
                }
            });

            // 按key排序后遍历
            let keys = Object.keys(map);
            //keys.sort();
            for (let j = 0; j < keys.length; j++) {
                let key = keys[j];
                let value = map[key];

                key = key.replace(/ /g, '_');//replace(/-/g, '_').

                let valueText = '';
                if (valueField.tsType == 'number') {
                    valueText = String(value);
                } else {
                    valueText = `'${value}'`;
                }

                text += `    '${key}': ${valueText},\n`;
            }

            text += '}\n';
        }
        //console.log("exportConsts = ",text);
        return text;




        // let text = "";
        // if (!this.bExportKey) return text;
        // if (this.rule == "a") {
        //     console.error("[警告]导出规则为a，无法导致key为常量.");
        //     return text;
        // }

        // let keys = [];
        // this.forDb(function (params, id) {
        //     keys.push(id);
        // }, true);
        // keys.sort();

        // let majorField = this.fields[0];
        // if (majorField.desc) {
        //     text += `    /** ${majorField.desc} */\n`;
        // }
        // // text += Tools.format(`    public static readonly %s = {\n`, `${this.name}_${majorField.name}`.toUpperCase());
        // text += Tools.format('db.%s_%s = {\n', this.name.toUpperCase(), majorField.name.toUpperCase());
        // keys.forEach(function (key) {
        //     let fld = key.replace(/-/g, "_").replace(/ /g, "_");
        //     if (isNaN(parseInt(fld[0]))) {
        //         text += `    ${fld}: "${key}",\n`;
        //     } else {
        //         // 如果是以数字开头的key，需要加引号
        //         text += `    "${fld}": "${key}",\n`;
        //     }
        // })
        // text += "}\n";

        // return text;
    }

    /**
     * 对i18n配置表进行默认导出
     */
    generateI18nEnumText(){
        if(!this.exportConsts){
            return;
        }
        /**
         * 这个是索引
         */
        let text1 : string = "//此文件为自动导出，用于Component中动态选择语言时做自动切换用，无其他意义，自动修改后下次导出会被覆盖\n";
        text1 += "//若想增加新的语言，请打开_config/D_多语言/语言配置_i18n_language_config_db.xlsx中增加\n";
        text1 += "//多语言图片资源放到每个bundle下的i18n目录下，新建该语言的文件夹，文件夹名字为上诉xlsx表中的id列的名字。\n";
        text1 += "//多语言图片资源请手动获取，或者在切换语言的时候全部加载后直接使用\n";
        text1 += "\n\n";
        text1 += "export enum LanguageIndex {\n";
        /**
         * 这个是真实的名字
         */
        let text2 : string = "export const LanguageKey : string[] = [ \n";
        for (let i = 0; i < this.exportConsts.length; i++) {
            const v = this.exportConsts[i];

            // 提取exportConst中的变量
            let [varname, keyFieldName, valueFieldName] = v;

            // 提取field
            let keyField = this.getFieldByName(keyFieldName);
            let valueField = this.getFieldByName(valueFieldName);
            if (!keyField || !valueField) continue;
            if(keyField.name != 'id'){
                continue;
            }
            // 提取数据
            let map = {};
            this.forDb((data) => {
                let key = data[keyFieldName];
                let value = data[valueFieldName];

                if (key != null && value != null) {
                    map[key] = value;
                }
            });

             // 按key排序后遍历
             let keys = Object.keys(map);
             //keys.sort();
             for (let j = 0; j < keys.length; j++) {
                let key    = keys[j];
                let value  = map[key];

                key = key.replace(/ /g, '_');//replace(/-/g, '_').

                let valueText = '';
                if (valueField.tsType == 'number') {
                    valueText = String(value);
                } else {
                    valueText = `'${value}'`;
                }
                text1 += "    " + key + " = " + j + ",\n";
                text2 += "    '" + key + "',\n";
             }
             text1 += "}; \n";
             text2 += "]; \n";
        }

        let text3 = "/** \n";
        text3 += " * 根据传入的语言的key，返回语言的enum的索引，如果没有，则返回-1 \n";
        text3 += " * @param name \n";
        text3 += " * @returns \n";
        text3 += " */ \n";
        text3 += "export function getLanguageIndexByKey(name : string) : LanguageIndex | number { \n";
        text3 += "    return LanguageKey.indexOf(name); \n";
        text3 += "} \n";
        text3 += "\n";
        text3 += "/**\n * 将服务器传递过来的语言代码，转换为本地的语言代码\n * @param serverKey \n */\n";
        text3 += "export function serverLanguageKeyToLocal(serverKey : string) : string { \n";
        text3 += "    return db.I18N_Language_Code[serverKey]; \n";
        text3 += "}\n";

        return text1 + "\n" + text2 + "\n" + text3;
    }

    /**
     * 导出db.d.ts中使用的文本
     */
    generateDbdtsConstsText(moduleName : string) {
        if (!this.exportConsts) return "";

        let text = "";

        for (let i = 0; i < this.exportConsts.length; i++) {
            const v = this.exportConsts[i];

            // 提取exportConst中的变量
            let [varname, keyFieldName, valueFieldName] = v;

            // 提取field
            let keyField = this.getFieldByName(keyFieldName);
            let valueField = this.getFieldByName(valueFieldName);
            if (!keyField || !valueField) continue;

            // 写入注释
            if (keyField.desc) {
                text += `    /** ${keyField.desc} */\n`;
            }
            text += Tools.format('    export const %s: {\n', varname);

            // 提取数据
            let map = {};
            this.forDb((data) => {
                let key = data[keyFieldName];
                let value = data[valueFieldName];

                if (key != null && value != null) {
                    map[key] = value;
                }
            });

            // 按key排序后遍历
            let keys = Object.keys(map);
            //放弃排序
            //keys.sort();
            for (let j = 0; j < keys.length; j++) {
                let key = keys[j];
                let value = map[key];

                let valueText = "";
                if (valueField.tsType == 'number') {
                    valueText = String(value);
                } else {
                    valueText = `'${value}'`;
                }

                key = key.replace(/ /g, '_');//replace(/-/g, '_').
                text += Tools.format("        ['%s']: %s,\n", key, valueText);
            }

            text += "}\n";
        }

        return text;
    }

    canExport() {
        let type_2_valid = {
            I: true,
            F: true,
            S: true,
        }


        // 是否能导出
        switch (this.rule) {
            case "m": {
                let majorField = this.fields[0];
                if (!majorField) return false;
                return !!type_2_valid[majorField.type];
            }
            case "ma": {
                let majorField = this.fields[0];
                if (!majorField) return false;
                return !!type_2_valid[majorField.type];
            }
            case "mm": {
                let majorField = this.fields[0];
                let minorField = this.fields[1];
                if (!majorField || !minorField) return false;
                return !!type_2_valid[majorField.type] && !!type_2_valid[minorField.type];
            }
            case "a": {
                return true;
            }
        }

        return false;
    }

    /**
     * 判断是否可以合并
     * 1. 所有字段名、字段类型必须相同
     * 2. id不能冲突（按照m、ma、mm分别处理）
     * @returns errMsg
     */
    canMerge(db) {
        // 1. 检查字段
        if (this.fields.length != db.fields.length) {
            return "字段数量不一致";
        }

        for (let i = 0; i < this.fields.length; i++) {
            let f1 = this.fields[i];
            let f2 = db.fields[i];
            if (f1.name != f2.name) {
                return Tools.format("字段[%d] 字段名不同： name1=[%s], name2=[%s]", i, f1.name, f2.name);
            }

            if (f1.type != f2.type) {
                return Tools.format("字段[%s]类型不同： type1=[%s], type2=[%s]", f1.name, f1.type, f2.type);
            }
        }

        // 检查rule
        if (this.rule != db.rule) {
            return Tools.format("rule不同： rule1=[%s], rule2=[%s]", this.rule, db.rule);
        }

        // 检查数据是否重复
        // console.log(this.datas)
        // console.log(db.datas)
        switch (this.rule) {
            case "m": {
                let majorField = this.fields[0];
                let msg = null;
                Tools.forEachMap(db.datas, (majorId, data2) => {
                    let data1 = this.datas[majorId];
                    if (data1) {
                        msg = Tools.format("数据重复：%s=[%s]", majorField.name, majorId);
                        return true;
                    }
                });
                if (msg) return msg;
                break;
            }
            case "ma": {
                // ma的部分直接合并
                break;
            }
            case "mm": {
                let majorField = this.fields[0];
                let minorField = this.fields[1];
                let msg = null;
                Tools.forEachMap(db.datas, (majorId, map2) => {
                    let map1 = this.datas[majorId];
                    if (!map1) {
                        // majorId对应的map1未找到，直接return
                        return true;
                    }

                    Tools.forEachMap(map2, (minorId, data2) => {
                        let data1 = map1[minorId];
                        if (data1) {
                            msg = Tools.format("数据重复：%s=[%s] %s=[%s]", majorField.name, majorId, minorField.name, minorId);
                            return true;
                        }
                    });

                    if (msg) return true;
                });
                if (msg) return msg;
                break;
            }
            case "a": {
                // a模式不检查id
                break;
            }
        }

        return null;
    }

    mergeDb(db) {
        // 使用mergeDb前，请确保使用了check接口进行检测。
        switch (this.rule) {
            case "m": {
                Tools.forEachMap(db.datas, (majorId, data2) => {
                    this.datas[majorId] = data2;
                });
                break;
            }
            case "ma": {
                Tools.forEachMap(db.datas, (majorId, arr2) => {
                    let arr1 = this.datas[majorId];
                    if (!arr1) {
                        // 直接使用arr2
                        this.datas[majorId] = arr2;
                    } else {
                        // 合并数组
                        for (let i = 0; i < arr2.length; i++) {
                            const data2 = arr2[i];
                            arr1.push(data2);
                        }
                    }
                });
                break;
            }
            case "mm": {
                Tools.forEachMap(db.datas, (majorId, map2) => {
                    let map1 = this.datas[majorId];
                    if (!map1) {
                        // 直接使用map2
                        this.datas[majorId] = map2;
                    } else {
                        // 合并map
                        Tools.forEachMap(map2, (minorId, data2) => {
                            map1[minorId] = data2;
                        });
                    }
                });
                break;
            }
            case "a": {
                // 合并数组
                for (let i = 0; i < db.datas.length; i++) {
                    const data2 = db.datas[i];
                    this.datas.push(data2);
                }
                break;
            }
        }

        // 合并原始数据
        for (let i = 0; i < db.originDatas.length; i++) {
            const data2 = db.originDatas[i];
            this.originDatas.push(data2);

            let newIndex = this.originDatas.length - 1;
            let [originFilePath, originSheetName, originRow] = db.originDataIndex_2_originFilePath_originSheetName_originRow[i];
            this.originDataIndex_2_originFilePath_originSheetName_originRow[newIndex] = [originFilePath, originSheetName, originRow];
        }

        // 合并警告
        for (let i = 0; i < db.warnLog.length; i++) {
            const log = db.warnLog[i];
            this.warnLog.push(log);
        }
    }










    ///// 静态加载方法 /////
    static _calcCellCoord(row, col) {
        return Tools.format("%s%d", COL_2_NAME[col], row + 1);
    }

    static loadDataBaseFromRawData(originFilePath : string, rawData : {name : string,data : string[][]}) {
        let db = new DbBundleDataBase();
        db.originFilePath = originFilePath;
        db.originSheetName = rawData.name;

        let fields : DataBaseField[]  = [];
        let fieldMap = new Set<string>();
        let originDatas = [];
        // let originDataIndex_2_originRow = {};
        let originDataIndex_2_originFilePath_originSheetName_originRow = {};
        let exportConsts : [string,string,string][] = [];

        let checkIdEmptyFieldIndeies = [];

        let bExportKey = false;

        // 加工数据
        for (let row = 0; row < rawData.data.length; row++) {
            const rowData = rawData.data[row] || [];

            let cmd = rowData[0];

            switch (cmd) {
                case "DB_NAME": {
                    db.name = rowData[1];
                    break;
                }
                case "DB_RULE": {
                    db.rule = rowData[1];
                    for (let i = 2; i < rowData.length; i++) {
                        const v = rowData[i];
                        if (v == "export_key") {
                            if (db.rule == "a") {
                                console.error(Tools.format("[警告] 配置表%s导出规则为a，无法导出key为常量。", db.name));
                            } else {
                                bExportKey = true;
                            }
                        }
                    }

                    switch (db.rule) {
                        case "a": break;
                        case "ma": break;
                        case "mm":
                            checkIdEmptyFieldIndeies = [1];
                            break;
                        default:
                            // m
                            checkIdEmptyFieldIndeies = [0];
                            break;
                    }

                    break;
                }
                case "EXPORT_CONST": {
                    let varname = rowData[1];
                    let keyFieldName = rowData[2];
                    let valueFieldName = rowData[3];
                    exportConsts.push([varname, keyFieldName, valueFieldName]);
                    break;
                }
                case "FLD_TYPE": {
                    if (fields.length > 0) {
                        db.warnLog.push(Tools.format("配置表[%s]中，出现重复的FLD_TYPE定义！", db.name));
                        break;
                    }

                    // 提取字段类型，没有配置字段类型的列都不导出
                    for (let col = 1; col < rowData.length; col++) {
                        const value = rowData[col];
                        if (value) {
                            let field = new DataBaseField(db);
                            field.type = value;
                            field.originCol = col;
                            field.tsType = field.calcTsType();

                            if (!field.tsType) {
                                db.warnLog.push(Tools.format("配置表[%s]中，出现未知数据类型！字段列[%d], 数据类型[%s]！", db.name, col, value));
                            } else {
                                fields.push(field);
                            }
                        }
                    }
                    break;
                }
                case "FLD_NAME": {
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        let value = rowData[field.originCol];
                        if (value) {
                            let field = fields[i]

                            if (field.name) {
                                db.warnLog.push(Tools.format("配置表[%s]中，字段名被覆盖[%s]->[%s]", db.name, field.name, value));
                            }
                            field.name = value;

                            if (fieldMap.has(value)) {
                                db.warnLog.push(Tools.format("配置表[%s]中，出现重复字段名[%s]", db.name, value));
                            } else {
                                fieldMap.add(value);
                            }
                        }
                    }
                    break;
                }
                case "FLD_DESC": {
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        let value = rowData[field.originCol];
                        if (value) {
                            let field = fields[i]

                            if (field.desc) {
                                field.desc = field.desc + "\n" + value;
                            } else {
                                field.desc = value;
                            }
                        }
                    }
                    break;
                }
                case "FLD_VERIFYER": {
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        let value = rowData[field.originCol];
                        if (value) {
                            let field = fields[i]

                            field.verifyers.push(value);
                        }
                    }
                    break;
                }
                case "FLD_ID_MERGE_TO": {
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        let value = rowData[field.originCol];
                        if (value) {
                            let field = fields[i]

                            if (field.idMergeTo) {
                                db.warnLog.push(Tools.format("配置表[%s]中，idMergeTo被覆盖[%s]->[%s]", db.name, field.idMergeTo, value));
                            }
                            field.idMergeTo = value;
                        }
                    }
                    break;
                }
                case "FLD_CONVERT_MAP": {
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        let value = rowData[field.originCol];
                        if (value) {
                            let field = fields[i]

                            if (field.convertMap) {
                                db.warnLog.push(Tools.format("配置表[%s]中，convertMap被覆盖[%s]->[%s]", db.name, field.convertMap, value));
                            }
                            field.convertMap = value;
                        }
                    }
                    break;
                }
                case "DATA": {
                    let data : {[key : string] : any} = {};
                    // 非空检测
                    let bCheckPass = true;
                    for (let i = 0; i < checkIdEmptyFieldIndeies.length; i++) {
                        const fieldIndex = checkIdEmptyFieldIndeies[i];
                        let field = fields[fieldIndex];
                        if (!field) {
                            // console.log("checkIdEmptyFieldIndeies field not found", db.name, fieldIndex)
                            continue;
                        }
                        let value = rowData[field.originCol];
                        if (value === undefined || (typeof value == "string" && value == "")) {
                            db.warnLog.push(Tools.format("配置表[%s]中，主要id字段[%s]不能为空！请检查第%d行。", db.name, field.name, row + 1));
                            bCheckPass = false;
                        }
                    }
                    if (!bCheckPass) continue;

                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        let value = rowData[field.originCol];
                        let cellCoord = this._calcCellCoord(row, field.originCol);
                        data[field.name] = field.parseValue(value, cellCoord);
                    }
                    originDatas.push(data);
                    originDataIndex_2_originFilePath_originSheetName_originRow[originDatas.length - 1] = [originFilePath, db.originSheetName, row];
                    break;
                }
                case "MERGE_FLD_NAME":
                case "FLD_MERGE_TO_ARR":
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        let value = rowData[field.originCol];
                        if (value) {
                            let field = fields[i]

                            if (field.mergeToArrFieldName) {
                                db.warnLog.push(Tools.format("配置表[%s]中，FLD_MERGE_TO_ARR被覆盖[%s]->[%s]", db.name, field.mergeToArrFieldName, value));
                            }
                            field.mergeToArrFieldName = value;
                            field.bMergeToArrKeepEmpty = false;
                        }
                    }
                    break;
                case "FLD_MERGE_TO_ARR_KEEP_EMPTY":
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        let value = rowData[field.originCol];
                        if (value) {
                            let field = fields[i]

                            if (field.mergeToArrFieldName) {
                                db.warnLog.push(Tools.format("配置表[%s]中，FLD_MERGE_TO_ARR_KEEP_EMPTY被覆盖[%s]->[%s]", db.name, field.mergeToArrFieldName, value));
                            }
                            field.mergeToArrFieldName = value;
                            field.bMergeToArrKeepEmpty = true;
                        }
                    }
                    break;
                case "FILL_DEFAULT": // 仅针对符合类型字段，忽略数据长度警告，使用用默认值填充：B=false，I=0，S=""，F=0
                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        let value = rowData[field.originCol];
                        if (value) {
                            let field = fields[i];
                            field.fillDefaultValue = true;
                        }
                    }
                    break;
            }
        }

        if (bExportKey) {
            let majorField = fields[0];
            exportConsts.push([
                Tools.format("%s_%s", db.name.toUpperCase(), majorField.name.toUpperCase()),
                majorField.name,
                majorField.name,
            ]);
        }
        db.setFields(fields);

        // 校验exportConsts
        for (let i = exportConsts.length - 1; i >= 0; i--) {
            let [varname, keyFieldName, valueFieldName] = exportConsts[i];

            let keyField = db.getFieldByName(keyFieldName);
            let valueField = db.getFieldByName(valueFieldName);

            // 变量名
            if (!varname || !keyField || !valueField) {
                db.warnLog.push(Tools.format("配置表[%s]中，EXPORT_CONST配置异常！varname=[%s] keyFieldName=[%s] valueFieldName=[%s]", db.name, varname, keyFieldName, valueFieldName));
                exportConsts.splice(i, 1);
            }
        }

        db.setExportConsts(exportConsts);
        db.setOriginDatas(originDatas, originDataIndex_2_originFilePath_originSheetName_originRow);
        db.processConvertMap();
        // db.processMergeToArr(); // 在这合并会导致验证失败
        return db;
    }

    processConvertMap() {
        for (let fieldIndex = 0; fieldIndex < this.fields.length; fieldIndex++) {
            const field = this.fields[fieldIndex];
            if (field.convertMap) {
                // console.log('需要处理convertMap逻辑', this.name, field.name, field.convertMap)

                let mapFields = field.convertMap.replace(/ */g, "").split(";");

                // 解析type
                let tsTypes = [];
                let dimensional = 0;

                for (let typeIndex = 0; typeIndex < field.type.length; typeIndex++) {
                    const t = field.type[typeIndex];

                    if (BASIC_TYPE_2_TS_TYPE[t]) {
                        tsTypes.push(BASIC_TYPE_2_TS_TYPE[t]);
                    } else if (t == "A") {
                        dimensional++;
                    }
                }

                if (tsTypes.length > 1) {
                    dimensional++;
                }

                // console.log("basicTypes", tsTypes)
                // console.log("dimensional", dimensional)

                if (mapFields.length != tsTypes.length) {
                    this.warnLog.push(Tools.format("配置表[%s]中，convertMap'%s'->%s和数据类型'%s'->%s长度不匹配！请检查字段分隔符是否为分号';'", this.name, field.convertMap, JSON.stringify(mapFields), field.type, JSON.stringify(tsTypes)));
                }

                if (dimensional >= 3) continue;

                // 处理tsType
                let tempStr = "{";
                for (let i = 0; i < tsTypes.length; i++) {
                    const tsType = tsTypes[i];
                    let mapField = mapFields[i];

                    tempStr += Tools.format("%s: %s", mapField, tsType)
                    if (i < tsTypes.length - 1) {
                        tempStr += ", ";
                    }
                }
                // {itemId: string, amount: number}
                tempStr += "}";

                if (dimensional == 2) {
                    // {itemId: string, amount: number}[]
                    tempStr += "[]";
                }
                field.tsType = tempStr;

                // 开始遍历数据
                this.forDb((data, majorId, minorId) => {
                    // console.log("for", majorId, minorId, data);

                    // 按维度进行不同的处理
                    let originArr = data[field.name] || [];
                    if (dimensional == 1) {
                        let map = {};
                        for (let mapFieldIndex = 0; mapFieldIndex < mapFields.length; mapFieldIndex++) {
                            const mapField = mapFields[mapFieldIndex];
                            map[mapField] = originArr[mapFieldIndex];
                        }
                        data[field.name] = map;

                    } else if (dimensional == 2) {
                        let maps = [];
                        for (let i = 0; i < originArr.length; i++) {
                            const subArr = originArr[i] || [];

                            let map = {};
                            for (let mapFieldIndex = 0; mapFieldIndex < mapFields.length; mapFieldIndex++) {
                                const mapField = mapFields[mapFieldIndex];
                                map[mapField] = subArr[mapFieldIndex];
                            }
                            data[field.name] = map;

                            maps.push(map);
                        }
                        data[field.name] = maps;
                    }
                });
            }
        }
    }

    /** 将多个字段合并成一个数组 */
    processMergeToArr() {
        let bKeepEmpty = false;
        let hasMergeFld = false;
        // 找到所有需要合并的字段
        let mergeMap = {};
        for (let fieldIndex = 0; fieldIndex < this.fields.length; fieldIndex++) {
            const field = this.fields[fieldIndex];
            if (field.mergeToArrFieldName) {
                if (mergeMap[field.mergeToArrFieldName]) {
                    mergeMap[field.mergeToArrFieldName].push(field);
                } else {
                    mergeMap[field.mergeToArrFieldName] = [field];
                }
                hasMergeFld = true;
            }

            bKeepEmpty = !!field.bMergeToArrKeepEmpty;
        }

        // console.log("processMergeToArr", bKeepEmpty)

        if (!hasMergeFld) return;

        // 检查合并字段是否有冲突
        for (let fieldIndex = 0; fieldIndex < this.fields.length; fieldIndex++) {
            let fldName = this.fields[fieldIndex].name;
            if (mergeMap[fldName]) {
                console.error(Tools.format("配置表[%s]中，合并字段和原始字段冲突[%s]，合并失败!", this.name, fldName));
                // 因为冲突了就不知道应该干嘛了，所以直接退出，合并失败
                return;
            }
        }

        // 检查字段类型是否一致（只有同类型字段才能合并）
        for (let k in mergeMap) {
            let fldList = mergeMap[k];
            let majorField = fldList[0];
            for (let i = 1; i < fldList.length; i++) {
                let field = fldList[i];
                if (majorField.type != field.type) {
                    console.error(Tools.format("配置表[%s]中，合并字段[%s]存在FLD_TYPE不一致[%s][%s]，合并失败!", this.name, k, majorField.type, field.type));
                    return;
                }

                if (majorField.convertMap != field.convertMap) {
                    console.error(Tools.format("配置表[%s]中，合并字段[%s]存在FLD_CONVERT_MAP不一致[%s][%s]，合并失败!", this.name, k, majorField.convertMap, field.convertMap));
                    return;
                }
            }
        }

        // console.log("mergeMap", mergeMap)



        // 追加新字段和新数据
        let col = this.fields[this.fields.length - 1].originCol + 1;
        for (let k in mergeMap) {
            let fldList = mergeMap[k];
            let majorField = fldList[0];

            // 添加新字段
            let newField = new DataBaseField(majorField.db);
            newField.name = k;
            newField.desc = majorField.desc;
            newField.type = majorField.type + "A";
            newField.originCol = col++;
            newField.tsType = majorField.tsType + "[]";
            this.fields.push(newField);

            // 添加新数据
            this.forDb(function (data) {
                let mergeData = [];
                for (let idx = 0; idx < fldList.length; idx++) {
                    let field = fldList[idx];
                    let value = data[field.name];
                    delete data[field.name];

                    if (!bKeepEmpty) {
                        // 如果数据为空，则跳过
                        if (value instanceof Array) {
                            if (value.length == 0) continue;
                        } else if (value instanceof Object) {
                            if (Object.values(value).every(function (v) { return v == undefined; })) continue;
                        } else if (value === "") {
                            continue;
                        }
                    }

                    // 数值0不表示空
                    mergeData.push(value);
                }

                data[k] = mergeData;
            })
        }

        // 删除合并的字段
        for (let k in mergeMap) {
            let fldList = mergeMap[k];
            for (let i = 0; i < fldList.length; i++) {
                let idx = this.fields.indexOf(fldList[i]);
                if (idx >= 0) {
                    this.fields.splice(idx, 1);
                }
            }
        }
    }

    static loadFromXlsxAsync(filePath : string, fOnCompleted : (dbs : DbBundleDataBase[]) => void) {
        let dbs : DbBundleDataBase[] = [];

        // 通过node-xlsx加载数据
        Tools.loadRawDatasFromXlsxAsync(filePath, (rawDatas : {name : string,data : string[][]}[]) => {
            for (let sheetIndex = 0; sheetIndex < rawDatas.length; sheetIndex++) {
                const rawData = rawDatas[sheetIndex];

                let db = this.loadDataBaseFromRawData(filePath, rawData);

                dbs.push(db);
            }

            fOnCompleted && fOnCompleted(dbs)
        });
        // console.log(rawDatas)
    }
}

class DataBaseField {
    db : DbBundleDataBase;
    originCol : number;
    name : string;
    type : string;
    tsType : string;
    desc : string;
    verifyers = [];
    idMergeTo;
    convertMap;
    fillDefaultValue = null;
    bMergeToArrKeepEmpty = false;
    mergeToArrFieldName;
    static parseValueCache : {[key : string] : {}} = {};
 
    constructor(db : DbBundleDataBase) {
        this.db = db;
        this.verifyers = [];
    }

    // constructor (key, type, desc, verifyer) {
    //     this.key = key;
    //     this.type = type;
    //     this.desc = desc;
    //     this.verifyer = verifyer || [];
    // }

    /**
     * 获取ts中的类型
     * @returns
     */
    calcTsType() {
        // 检查是为基础类型
        if (BASIC_TYPE_2_TS_TYPE[this.type]) {
            return BASIC_TYPE_2_TS_TYPE[this.type];
        }

        if (this.type.length > 0) {
            // 复合类型
            // 依次遍历type的字母

            let tsTypes = [];
            let dimensional = 0;

            for (let i = 0; i < this.type.length; i++) {
                const t = this.type[i];

                let tsType = BASIC_TYPE_2_TS_TYPE[t];
                if (tsType) {
                    tsTypes.push(tsType);
                } else if (t == "A") {
                    dimensional++;
                }
            }

            if (tsTypes.length > 1) {
                dimensional++;
            }

            // 只支持1~2维数组
            if (dimensional >= 3 || dimensional <= 0) {
                this.db.warnLog.push(Tools.format("配置表[%s]中，使用了不支持的%d维数组：[%s]", this.db.name, dimensional, this.type));
                // console.warn("只支持1~2维数组");
                return null;
            }

            if (dimensional == 1) {
                if (tsTypes.length == 1) {
                    return Tools.format("%s[]", tsTypes.join(", "));
                } else if (tsTypes.length == 0) {
                    return Tools.format("any[]", tsTypes.join(", "));
                } else {
                    return Tools.format("[%s]", tsTypes.join(", "));
                }
            } else if (dimensional == 2) {
                if (tsTypes.length == 1) {
                    return Tools.format("%s[][]", tsTypes.join(", "));
                } else if (tsTypes.length == 0) {
                    return Tools.format("any[][]", tsTypes.join(", "));
                } else {
                    return Tools.format("[%s][]", tsTypes.join(", "));
                }
            }

            // if (tsTypes.length > 0) {
            //     let tsTypeText = Tools.format("[%s]", tsTypes.join(", "));
            //     for (let i = 1; i < dimensional; i++) {
            //         tsTypeText += "[]";
            //     }
            //     return tsTypeText;
            // }
        }

        return null;
    }

    _parseBasicValue(value, type, originValue, originType, cellCoord) {
        if (value == null) value = "";

        // console.log("parseBasicValue", value, type, originValue, cellCoord);

        switch (type) {
            case "I": {
                // console.log("  I")
                let fn = parseFloat(value);
                // "1;2" 也可以正常解析为1，所以这里的异常判定用toString还原来比较
                if (fn.toString() != value) {
                    if (value != "") {
                        this.db.warnLog.push(Tools.format("配置表[%s]中，I类型数据解析出错：type=[%s], value=[%s], 单元格=[%s]", this.db.name, originType, originValue, cellCoord));
                        return 0;
                    }
                    fn = 0;
                }

                if (isNaN(fn)) {
                    // 只有当value == NaN时，才有可能运行到这个异常
                    this.db.warnLog.push(Tools.format("配置表[%s]中，I类型数据解析出错：type=[%s], value=[%s], 单元格=[%s]", this.db.name, originType, originValue, cellCoord));
                    fn = 0;
                }

                // 由于excel的精度和js不同，可能出现位置为1000，js中读取出是999.99999999999或者1000.000000001的情况，这里先降低精度再求整
                let n = parseInt(fn.toFixed(2));
                if (isNaN(n)) n = 0;

                if (fn != n) this.db.warnLog.push(Tools.format("配置表[%s]中，I类数据配置为F，丢失精度警告！type=[%s], value=[%s], 单元格=[%s]", this.db.name, originType, originValue, cellCoord));

                return n;
            }

            case "F": {
                let n;
                if (value == "") {
                    n = 0;
                } else {

                    n = parseFloat(value);
                    // console.log(Tools.format("parse F value:[%s] n:[%f] n.toString():[%s]", value, n, n.toString()));
                    // if (n.toString() != value) {
                    //     if (value != "") {
                    //         this.db.warnLog.push(Tools.format("配置表[%s]中，F类型数据解析出错：type=[%s], value=[%s]", this.db.name, originType, originValue));
                    //     }
                    //     n = 0;
                    // }

                    if (isNaN(n)) {
                        this.db.warnLog.push(Tools.format("配置表[%s]中，F类型数据解析出错：type=[%s], value=[%s], 单元格=[%s]", this.db.name, originType, originValue, cellCoord));
                        n = 0;
                    }
                }

                return n;
            }

            case "S": {
                return value.toString();
            }

            case "B": {
                let str = value.toString().toLowerCase()
                if (str == "true") {
                    return true;
                } else if (str == "false") {
                    return false;
                } else if (value != "") {
                    this.db.warnLog.push(Tools.format("配置表[%s]中，B类数据配置错误，需要为TRUE或FALSE！type=[%s] value=[%s], 单元格=[%s]", this.db.name, originType, originValue, cellCoord));
                }

                return false;
            }
        }

        return null;
    }
    /**
     * 检查基础类型
     * @param value 
     * @param type I S F B
     * @returns 
     */
    _checkBasicValueType(value : any, type : string) {
        // 允许为null
        if (value === null) return true;

        // console.log("_checkBasicValueType", value, type)
        if (!BASIC_TYPE_2_TS_TYPE[type]) {
            // console.log(" not basic type")
            return false;
        }

        switch (type) {
            case "I": {
                // console.log("I", typeof value)
                // 检查类型
                if (typeof value != "number") return false;

                // console.log("it's number")

                // 检查精度
                let n = parseInt(value.toFixed(2));
                if (value != n) {
                    console.log("精度损失")
                    return false;
                }

                break;
            }
            case "F": {
                // 检查类型
                if (typeof value != "number") return false;

                break;
            }
            case "S": {
                // 检查类型
                if (typeof value != "string") return false;

                break;
            }
            case "B": {
                // 检查类型
                if (typeof value != "boolean") return false;

                break;
            }
        }

        return true;
    }

    _validJsonValue(value : any[], originValue : string, cellCoord : string) {
        if (!Array.isArray(value)) {
            this.db.warnLog.push(Tools.format("配置表[%s]中，复合类型字段解析异常，JSON解析的值不是数组！。type='%s', value='%s', originValue='%s', 单元格=[%s]", this.db.name, this.type, value, originValue, cellCoord));
            return null;

        } else if (value.length <= 0) {
            // 允许空数组
            return value;
        }
        // console.log("_validJsonValue", cellCoord, this.type, originValue, value);

        // 能进入到这里，一定是复合类型。
        let types : string[] = [];
        let dimensional = 0;

        for (let i = 0; i < this.type.length; i++) {
            const t = this.type[i];

            let tsType = BASIC_TYPE_2_TS_TYPE[t];
            if (tsType) {
                types.push(t);
            } else if (t == "A") {
                dimensional++;
            }
        }

        if (types.length > 1) {
            dimensional++;
        }

        // console.log("  tsTypes", types)
        // console.log("  dimensional", dimensional)

        // 一维数组
        if (dimensional == 1) {
            if (types.length == 1) {
                // 单一类型，校验值类型
                let fieldType = types[0];
                for (let i = 0; i < value.length; i++) {
                    const fieldValue = value[i];
                    if (!this._checkBasicValueType(fieldValue, fieldType)) {
                        this.db.warnLog.push(Tools.format("配置表[%s]中，复合类型字段解析异常，值类型不匹配。type='%s', value='%s', fieldType='%s', filedValue='%s' 单元格=[%s]", this.db.name, this.type, originValue, fieldType, fieldValue, cellCoord));
                        return [];
                    }
                }


            } else if (types.length == 0) {
                // 自定义类型，是否允许？，跳过校验
                return value;

            } else {
                // 复合类型，校验值类型、校验数组长度
                if (value.length != types.length) {
                    this.db.warnLog.push(Tools.format("配置表[%s]中，复合类型字段解析异常，数据长度和类型长度不匹配。type='%s', value='%s', 单元格=[%s]", this.db.name, this.type, originValue, cellCoord));
                    return [];
                }

                for (let i = 0; i < value.length; i++) {
                    const fieldValue = value[i];
                    let fieldType = types[i];
                    if (!this._checkBasicValueType(fieldValue, fieldType)) {
                        this.db.warnLog.push(Tools.format("配置表[%s]中，复合类型字段解析异常，值类型不匹配。type='%s', value='%s', fieldType='%s', filedValue='%s' 单元格=[%s]", this.db.name, this.type, originValue, fieldType, fieldValue, cellCoord));
                        return [];
                    }
                }
            }
        } else if (dimensional == 2) {
            for (let i = 0; i < value.length; i++) {
                const rowArr = value[i];
                if (!Array.isArray(rowArr)) {
                    this.db.warnLog.push(Tools.format("配置表[%s]中，复合类型字段解析异常，二维数组的第%d行成员'%s'不是数组。type='%s', value='%s', 单元格=[%s]", this.db.name, i, rowArr, this.type, originValue, cellCoord));
                    return [];
                }
                if (types.length == 1) {
                    // 单一类型，校验值类型
                    let fieldType = types[0];
                    for (let j = 0; j < rowArr.length; j++) {
                        const fieldValue = rowArr[j];
                        if (!this._checkBasicValueType(fieldValue, fieldType)) {
                            this.db.warnLog.push(Tools.format("配置表[%s]中，复合类型字段解析异常，二维数组第%d行成员值类型不匹配。type='%s', value='%s', fieldType='%s', filedValue='%s' 单元格=[%s]", this.db.name, i, this.type, originValue, fieldType, fieldValue, cellCoord));
                            return [];
                        }
                    }


                } else if (types.length == 0) {
                    // 自定义类型，是否允许？，跳过校验
                    // return value;

                } else {
                    // 复合类型，校验值类型、校验数组长度
                    if (rowArr.length != types.length) {
                        this.db.warnLog.push(Tools.format("配置表[%s]中，复合类型字段解析异常，二维数组第%d行成员数据长度和类型长度不匹配。type='%s', value='%s', 单元格=[%s]", this.db.name, i, this.type, originValue, cellCoord));
                        return [];
                    }

                    for (let j = 0; j < rowArr.length; j++) {
                        const fieldValue = rowArr[j];
                        let fieldType = types[j];
                        if (!this._checkBasicValueType(fieldValue, fieldType)) {
                            this.db.warnLog.push(Tools.format("配置表[%s]中，复合类型字段解析异常，二维数组第%d行成员值类型不匹配。type='%s', value='%s', fieldType='%s', filedValue='%s' 单元格=[%s]", this.db.name, i, this.type, originValue, fieldType, fieldValue, cellCoord));
                            return [];
                        }
                    }
                }

            }

        } else {
            // 不是数组，返回null
            return null;
        }

        return value;
    }

    parseValue(originValue : string, cellCoord : string) {
        if (originValue == null) originValue = "";

        // 优先在缓存中查询，如果命令缓存则直接使用缓存的数据，提升解析效率
        let cache = DataBaseField.parseValueCache[this.type];
        if (!cache) {
            cache = {};
            DataBaseField.parseValueCache[this.type] = cache;
        }

        let cacheValue = cache[originValue];
        if (cacheValue !== undefined) return cacheValue;

        // console.log('parseValue', this.type, originValue)
        // if (originValue == null) return null;

        // 尝试使用基础类型解析
        let ret = this._parseBasicValue(originValue, this.type, originValue, this.type, cellCoord);
        if (ret != null) {
            return ret;
        }

        if (this.type.length > 1) {
            // 复合类型
            let data = null;
            // 尝试用json解析
            try {
                data = JSON.parse(originValue);
            } catch (error) {
                // 忽略
            }

            if (data && Array.isArray(data)) {
                // 校验json格式的数据是否正确
                data = this._validJsonValue(data, originValue, cellCoord);
                return data;
            }

            // json数据异常，采用字符串解析
            // 解析符号优先级："|", ";"

            // 解析类型
            let types = [];
            let dimensional = 0;

            for (let i = 0; i < this.type.length; i++) {
                const t = this.type[i];

                let tsType = BASIC_TYPE_2_TS_TYPE[t];
                if (tsType) {
                    types.push(t);
                } else if (t == "A") {
                    dimensional++;
                }
            }

            if (types.length > 1) {
                dimensional++;
            }

            // console.log(Tools.format("解析数组 originValue='%s', type='%s', types=%s, dimensional=%d", originValue, this.type, JSON.stringify(types), dimensional));
            if (dimensional == 1) {
                // 一维数组
                let arr;
                if (originValue === "") {
                    arr = []
                } else {
                    // arr = originValue.toString().replace(/\s/g, "").split(";") || [];
                    arr = originValue.toString().split(";") || [];
                }

                // console.log("  split", JSON.stringify(arr));

                let parsedArr = [];
                if (types.length <= 1) {
                    // 单一类型
                    let t = types[0];
                    for (let j = 0; j < arr.length; j++) {
                        const vv = arr[j];

                        // console.log("for", j, t, vv)

                        let value = this._parseBasicValue(vv, t, originValue, this.type, cellCoord);
                        parsedArr.push(value);

                    }
                } else {
                    // 有多个类型，直接按照types解析
                    let count;
                    if (this.fillDefaultValue) {
                        count = types.length;
                    } else {
                        if (types.length != arr.length && arr.length > 0) {
                            this.db.warnLog.push(Tools.format("配置表[%s]中，复合类型字段解析异常，数据长度和类型长度不匹配。type='%s', value='%s', 单元格=[%s]", this.db.name, this.type, originValue, cellCoord));
                        }
                        count = Math.min(arr.length, types.length)
                    }

                    for (let j = 0; j < count; j++) {
                        const t = types[j];
                        let vv = arr[j] || "";

                        // console.log("for", j, t, vv)

                        let value = this._parseBasicValue(vv, t, originValue, this.type, cellCoord);
                        parsedArr.push(value);
                    }
                }

                ret = parsedArr;
                // console.log(Tools.format("解析一维数组'%s' type='%s', ret='%s'", originValue, this.type, JSON.stringify(ret)));

            } else if (dimensional == 2) {
                // 二维数组
                ret = [];

                // console.log("二维数组", originValue, types)

                let arr1 = [];
                if (originValue && originValue !== "") {
                    // arr1 = originValue.toString().replace(/ /g, "").split("|") || [];
                    arr1 = originValue.toString().split("|") || [];
                }
                // console.log("arr1", arr1)
                for (let i = 0; i < arr1.length; i++) {
                    const v = arr1[i];
                    let arr2;
                    if (v === "") {
                        arr2 = [];
                    } else {
                        arr2 = v.split(";") || [];
                    }

                    let parsedArr2 = [];

                    if (types.length <= 1) {
                        // 单一类型
                        let t = types[0];
                        for (let j = 0; j < arr2.length; j++) {
                            const vv = arr2[j];

                            // console.log("for", j, t, vv)

                            let value = this._parseBasicValue(vv, t, originValue, this.type, cellCoord);
                            parsedArr2.push(value);

                        }
                    } else {
                        // 多类型
                        let count;
                        if (this.fillDefaultValue) {
                            count = types.length;
                        } else {
                            if (types.length != arr2.length && arr2.length > 0) {
                                this.db.warnLog.push(Tools.format("配置表[%s]中，复合类型字段解析异常，数据长度和类型长度不匹配。type='%s', value='%s', 单元格=[%s]", this.db.name, this.type, originValue, cellCoord));
                            }
                            count = Math.min(arr2.length, types.length)
                        }
                        for (let j = 0; j < count; j++) {
                            const t = types[j];
                            let vv = arr2[j] || "";

                            let value = this._parseBasicValue(vv, t, originValue, this.type, cellCoord);
                            parsedArr2.push(value);
                        }
                    }

                    // console.log("for", i, v, arr2, parsedArr2)

                    ret.push(parsedArr2);
                }
                // console.log(Tools.format("解析二维数组'%s' type='%s', ret='%s'", originValue, this.type, JSON.stringify(ret)));
            }
        }

        cache[originValue] = ret;

        return ret;
    }
}