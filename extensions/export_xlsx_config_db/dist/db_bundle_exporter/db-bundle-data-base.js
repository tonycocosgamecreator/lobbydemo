"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbBundleDataBase = void 0;
const tools_1 = __importDefault(require("../utils/tools"));
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
            COL_2_NAME.push(char1 + char2);
        }
    }
    // console.log(COL_2_NAME);
}
class DbBundleDataBase {
    constructor() {
        // bExportKey = false;
        this.fields = [];
        /**
         * [[varname, keyFieldName, valueFieldName]]
         */
        this.exportConsts = [];
        /**
         * 原始数据，和rule无关
         * [
         *      {k1:v1, k2:v2}
         * ]
         */
        this.originDatas = [];
        /**
         * 原始数据index到原始表格row的映射关系
         */
        this.originDataIndex_2_originFilePath_originSheetName_originRow = {};
        this.warnLog = [];
        this.fields = [];
        this.warnLog = [];
    }
    setFields(fields) {
        this.fields = tools_1.default.sortArrayByField(fields, "originCol");
    }
    getFieldByName(fieldName) {
        for (let i = 0; i < this.fields.length; i++) {
            const field = this.fields[i];
            if (field.name == fieldName)
                return field;
        }
        return null;
    }
    setExportConsts(exportConsts) {
        this.exportConsts = exportConsts;
    }
    setOriginDatas(originDatas, originDataIndex_2_originFilePath_originSheetName_originRow) {
        this.originDatas = originDatas;
        this.originDataIndex_2_originFilePath_originSheetName_originRow = originDataIndex_2_originFilePath_originSheetName_originRow;
        let type_2_valid = {
            S: true,
            I: true,
            F: true,
        };
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
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 未找到主要id字段！", this.originFilePath, this.rule));
                        return;
                    }
                    if (!type_2_valid[majorIdField.type]) {
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 主要id[%s]类型不能为[%s]！请配置为I, F, S中的一种。", this.originFilePath, this.rule, majorIdField.name, majorIdField.type));
                    }
                    let majorId = data[majorIdField.name];
                    if (majorId == null) {
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 主要id[%s]未配置！", this.originFilePath, this.rule, majorIdField.name));
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
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 未找到主要id字段！", this.originFilePath, this.rule));
                        return;
                    }
                    if (!type_2_valid[majorIdField.type]) {
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 主要id[%s]类型不能为[%s]！请配置为I, F, S中的一种。", this.originFilePath, this.rule, majorIdField.name, majorIdField.type));
                    }
                    let majorId = data[majorIdField.name];
                    if (majorId == null) {
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 主要id[%s]未配置！", this.originFilePath, this.rule, majorIdField.name));
                    }
                    let minorIdField = this.fields[1];
                    if (!minorIdField) {
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 未找到次要id字段！", this.originFilePath, this.rule));
                        return;
                    }
                    let minorId = data[minorIdField.name];
                    if (minorId == null) {
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 次要id[%s]未配置！主id[%s]=[%s]！", this.originFilePath, this.rule, majorIdField.name, majorIdField.name, majorId));
                    }
                    let minorDatas = this.datas[majorId];
                    if (!minorDatas) {
                        minorDatas = {};
                        this.datas[majorId] = minorDatas;
                    }
                    if (minorDatas[minorId]) {
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 次要id冲突：主id[%s]=[%s] 次id[%s]=[%s]，请检查配置表第%d行。", this.originFilePath, this.rule, minorIdField.name, minorId, majorIdField.name, majorId, row + 1));
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
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 未找到主要id字段！", this.originFilePath, this.rule));
                        return;
                    }
                    if (!type_2_valid[majorIdField.type]) {
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 主要id[%s]类型不能为[%s]！请配置为I, F, S中的一种。", this.originFilePath, this.rule, majorIdField.name, majorIdField.type));
                    }
                    let majorId = data[majorIdField.name];
                    if (majorId == null) {
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 主要id[%s]未配置！", this.originFilePath, this.rule, majorIdField.name));
                    }
                    // console.log("majorId", i, majorId, !!this.datas[majorId])
                    if (this.datas[majorId]) {
                        this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 主要id冲突：%s=[%s]，请检查配置表第%d行。", this.originFilePath, this.rule, majorIdField.name, majorId, row + 1));
                    }
                    this.datas[majorId] = data;
                }
                break;
            }
            default: {
                if (this.name != null) {
                    this.warnLog.push(tools_1.default.format("配置表[%s] rule=[%s] 不支持此规则，请使用m、mm、ma、a中的一种。", this.originFilePath, this.rule));
                    // 未知rule？
                }
                else {
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
                tools_1.default.forEachMap(this.datas, (majorId, arr) => {
                    if (bOnlyForMajor) {
                        callback(arr, majorId);
                    }
                    else {
                        for (let i = 0; i < arr.length; i++) {
                            const data = arr[i];
                            callback(data, majorId, i);
                        }
                    }
                });
                break;
            }
            case "mm": {
                tools_1.default.forEachMap(this.datas, (majorId, minorDatas) => {
                    if (bOnlyForMajor) {
                        callback(minorDatas, majorId);
                    }
                    else {
                        tools_1.default.forEachMap(minorDatas, (minorId, data) => {
                            callback(data, majorId, minorId);
                        });
                    }
                });
                break;
            }
            // case "m":
            default: {
                tools_1.default.forEachMap(this.datas, (majorId, data) => {
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
        text += tools_1.default.format("'name': '%s',\n", this.name);
        // rule
        text += tools_1.default.format("'rule': '%s',\n", this.rule);
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
        text += tools_1.default.format("'fields': %s,\n", JSON.stringify(fields, null, 4));
        // 字段
        text += tools_1.default.format("'datas': %s\n", JSON.stringify(this.datas, null, 4));
        text += '}';
        return text;
    }
    /**
     * 生成db.d.ts文本
     */
    generateDbdtsText(moduleName) {
        let text = "";
        text += tools_1.default.format('    type %s_data = {\n', this.name);
        for (let i = 0; i < this.fields.length; i++) {
            const field = this.fields[i];
            if (field.desc) {
                text += tools_1.default.format('        /** %s */\n', field.desc);
            }
            text += tools_1.default.format('        readonly %s: %s,\n', field.name, field.tsType);
        }
        text += '    };\n';
        text += '\n';
        switch (this.rule) {
            case "m": {
                let majorField = this.fields[0];
                text += tools_1.default.format('    type %s = {\n', this.name);
                text += tools_1.default.format('        [%s: %s]: %s_data,\n', majorField.name, majorField.tsType, this.name);
                text += '    };\n';
                break;
            }
            case "mm": {
                let majorField = this.fields[0];
                let minorField = this.fields[1];
                text += tools_1.default.format('    type %s = {\n', this.name);
                text += tools_1.default.format('        [%s: %s]: {\n', majorField.name, majorField.tsType);
                text += tools_1.default.format('            [%s: %s]: %s_data,\n', minorField.name, minorField.tsType, this.name);
                text += '        },\n';
                text += '    };\n';
                break;
            }
            case "ma": {
                let majorField = this.fields[0];
                text += tools_1.default.format('    type %s = {\n', this.name);
                text += tools_1.default.format('        [%s: %s]: %s_data[],\n', majorField.name, majorField.tsType, this.name);
                text += '    };\n';
                break;
            }
            case "a": {
                text += tools_1.default.format('    type %s = %s_data[];\n', this.name, this.name);
                break;
            }
        }
        text += '\n';
        text += this.generateDbdtsGettersText(moduleName);
        return text;
    }
    generateAutoExportDbTsGettersText(moduleName) {
        let text = "";
        text += tools_1.default.format("    %s.get_%s = (): %s.%s => { return DbManager.getDataBase('%s').datas; }\n", moduleName, this.name, moduleName, this.name, this.name);
        switch (this.rule) {
            case "m": {
                let majorField = this.fields[0];
                text += tools_1.default.format("    %s.get_from_%s = (%s: %s, bQuiet?: boolean): %s.%s_data => { return DbManager.getDataBase('%s')._get1(%s, bQuiet); }\n", moduleName, this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, moduleName, this.name, this.name, majorField.name);
                text += tools_1.default.format("    %s.foreach_from_%s = (callback: (%sKey: string, data: %s.%s_data) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData1(callback); }\n", moduleName, this.name, majorField.name, moduleName, this.name, this.name);
                break;
            }
            case "mm": {
                let majorField = this.fields[0];
                let minorField = this.fields[1];
                text += tools_1.default.format("    %s.get_from_%s = (%s: %s, %s: %s, bQuiet?: boolean): %s.%s_data => { return DbManager.getDataBase('%s')._get2(%s, %s, bQuiet); }\n", moduleName, this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, minorField.name, minorField.tsType == 'number' ? 'number | string' : minorField.tsType, moduleName, this.name, this.name, majorField.name, minorField.name);
                text += tools_1.default.format("    %s.foreach_from_%s = (callback: (%sKey: string, %sKey: string, data: %s.%s_data) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData2(callback); }\n", moduleName, this.name, majorField.name, minorField.name, moduleName, this.name, this.name);
                text += tools_1.default.format("    %s.getMap_from_%s = (%s: %s, bQuiet?: boolean): { [%s: %s]: %s.%s_data } => { return DbManager.getDataBase('%s')._get1(%s, bQuiet); }\n", moduleName, this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, minorField.name, minorField.tsType, moduleName, this.name, this.name, majorField.name);
                text += tools_1.default.format("    %s.foreachMap_from_%s = (callback: (%sKey: string, datas: { [%s: %s]: %s.%s_data }) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData1(callback); }\n", moduleName, this.name, majorField.name, minorField.name, minorField.tsType, moduleName, this.name, this.name);
                break;
            }
            case "ma": {
                let majorField = this.fields[0];
                text += tools_1.default.format("    %s.get_from_%s = (%s: %s, index: number, bQuiet?: boolean): %s.%s_data => { return DbManager.getDataBase('%s')._get2(%s, index, bQuiet); }\n", moduleName, this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, moduleName, this.name, this.name, majorField.name);
                text += tools_1.default.format("    %s.foreach_from_%s = (callback: (%sKey: string, index: number, data: %s.%s_data) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData2(callback); }\n", moduleName, this.name, majorField.name, moduleName, this.name, this.name);
                text += tools_1.default.format("    %s.getArr_from_%s = (%s: %s, bQuiet?: boolean): %s.%s_data[] => { return DbManager.getDataBase('%s')._get1(%s, bQuiet); }\n", moduleName, this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, moduleName, this.name, this.name, majorField.name);
                text += tools_1.default.format("    %s.foreachArr_from_%s = (callback: (%sKey: string, datas: %s.%s_data[]) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData1(callback); }\n", moduleName, this.name, majorField.name, moduleName, this.name, this.name);
                break;
            }
            case "a": {
                text += tools_1.default.format("    %s.get_from_%s = (index: number, bQuiet?: boolean): %s.%s_data => { return DbManager.getDataBase('%s')._get1(index, bQuiet); }\n", moduleName, this.name, moduleName, this.name, this.name);
                text += tools_1.default.format("    %s.foreach_from_%s = (callback: (index: number, data: %s.%s_data) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData1(callback); }\n", moduleName, this.name, moduleName, this.name, this.name);
                break;
            }
        }
        return text;
    }
    generateDbdtsGettersText(moduleName) {
        let text = "";
        text += tools_1.default.format("    function get_%s(): %s.%s;\n", this.name, moduleName, this.name);
        switch (this.rule) {
            case "m": {
                let majorField = this.fields[0];
                text += tools_1.default.format("    function get_from_%s(%s: %s, bQuiet?: boolean): %s.%s_data;\n", this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, moduleName, this.name);
                text += tools_1.default.format("    function foreach_from_%s(callback: (%sKey: string, data: %s.%s_data) => (void | boolean)): void;\n", this.name, majorField.name, moduleName, this.name);
                break;
            }
            case "mm": {
                let majorField = this.fields[0];
                let minorField = this.fields[1];
                text += tools_1.default.format("    function get_from_%s(%s: %s, %s: %s, bQuiet?: boolean): %s.%s_data;\n", this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, minorField.name, minorField.tsType == 'number' ? 'number | string' : minorField.tsType, moduleName, this.name);
                text += tools_1.default.format('    function foreach_from_%s(callback: (%sKey: string, %sKey: string, data: %s.%s_data) => (void | boolean)): void;\n', this.name, majorField.name, minorField.name, moduleName, this.name);
                text += tools_1.default.format('    function getMap_from_%s(%s: %s, bQuiet?: boolean): { [%s: %s]: %s.%s_data };\n', this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, minorField.name, minorField.tsType, moduleName, this.name);
                text += tools_1.default.format('    function foreachMap_from_%s(callback: (%sKey: string, datas: { [%s: %s]: %s.%s_data }) => (void | boolean)): void;\n', this.name, majorField.name, minorField.name, minorField.tsType, moduleName, this.name);
                break;
            }
            case "ma": {
                let majorField = this.fields[0];
                text += tools_1.default.format('    function get_from_%s(%s: %s, index: number, bQuiet?: boolean): %s.%s_data;\n', this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, moduleName, this.name);
                text += tools_1.default.format('    function foreach_from_%s(callback: (%sKey: string, index: number, data: %s.%s_data) => (void | boolean)): void;\n', this.name, majorField.name, moduleName, this.name);
                text += tools_1.default.format('    function getArr_from_%s(%s: %s, bQuiet?: boolean): %s.%s_data[];\n', this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, moduleName, this.name);
                text += tools_1.default.format('    function foreachArr_from_%s(callback: (%sKey: string, datas: %s.%s_data[]) => (void | boolean)): void;\n', this.name, majorField.name, moduleName, this.name);
                break;
            }
            case "a": {
                text += tools_1.default.format('    function get_from_%s(index: number, bQuiet?: boolean): %s.%s_data;\n', this.name, moduleName, this.name);
                text += tools_1.default.format('    function foreach_from_%s(callback: (index: number, data: %s.%s_data) => (void | boolean)): void;\n', this.name, moduleName, this.name);
                break;
            }
        }
        return text;
    }
    /**
     * 导出_autoExportDb.ts中使用的文本
     */
    generateAutoExportDbTsConstsText(moduelName) {
        if (!this.exportConsts)
            return "";
        let text = "";
        for (let i = 0; i < this.exportConsts.length; i++) {
            const v = this.exportConsts[i];
            // 提取exportConst中的变量
            let [varname, keyFieldName, valueFieldName] = v;
            // 提取field
            let keyField = this.getFieldByName(keyFieldName);
            let valueField = this.getFieldByName(valueFieldName);
            if (!keyField || !valueField)
                continue;
            // 写入注释
            if (keyField.desc) {
                text += `    /** ${keyField.desc} */\n`;
            }
            text += tools_1.default.format('%s.%s = {\n', moduelName, varname);
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
                key = key.replace(/ /g, '_'); //replace(/-/g, '_').
                let valueText = '';
                if (valueField.tsType == 'number') {
                    valueText = String(value);
                }
                else {
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
    generateI18nEnumText() {
        if (!this.exportConsts) {
            return;
        }
        /**
         * 这个是索引
         */
        let text1 = "//此文件为自动导出，用于Component中动态选择语言时做自动切换用，无其他意义，自动修改后下次导出会被覆盖\n";
        text1 += "//若想增加新的语言，请打开_config/D_多语言/语言配置_i18n_language_config_db.xlsx中增加\n";
        text1 += "//多语言图片资源放到每个bundle下的i18n目录下，新建该语言的文件夹，文件夹名字为上诉xlsx表中的id列的名字。\n";
        text1 += "//多语言图片资源请手动获取，或者在切换语言的时候全部加载后直接使用\n";
        text1 += "\n\n";
        text1 += "export enum LanguageIndex {\n";
        /**
         * 这个是真实的名字
         */
        let text2 = "export const LanguageKey : string[] = [ \n";
        for (let i = 0; i < this.exportConsts.length; i++) {
            const v = this.exportConsts[i];
            // 提取exportConst中的变量
            let [varname, keyFieldName, valueFieldName] = v;
            // 提取field
            let keyField = this.getFieldByName(keyFieldName);
            let valueField = this.getFieldByName(valueFieldName);
            if (!keyField || !valueField)
                continue;
            if (keyField.name != 'id') {
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
                let key = keys[j];
                let value = map[key];
                key = key.replace(/ /g, '_'); //replace(/-/g, '_').
                let valueText = '';
                if (valueField.tsType == 'number') {
                    valueText = String(value);
                }
                else {
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
        text3 += "    return resourcesDb.I18N_Language_Code[serverKey]; \n";
        text3 += "}\n";
        return text1 + "\n" + text2 + "\n" + text3;
    }
    /**
     * 导出db.d.ts中使用的文本
     */
    generateDbdtsConstsText(moduleName) {
        if (!this.exportConsts)
            return "";
        let text = "";
        for (let i = 0; i < this.exportConsts.length; i++) {
            const v = this.exportConsts[i];
            // 提取exportConst中的变量
            let [varname, keyFieldName, valueFieldName] = v;
            // 提取field
            let keyField = this.getFieldByName(keyFieldName);
            let valueField = this.getFieldByName(valueFieldName);
            if (!keyField || !valueField)
                continue;
            // 写入注释
            if (keyField.desc) {
                text += `    /** ${keyField.desc} */\n`;
            }
            text += tools_1.default.format('    export const %s: {\n', varname);
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
                }
                else {
                    valueText = `'${value}'`;
                }
                key = key.replace(/ /g, '_'); //replace(/-/g, '_').
                text += tools_1.default.format("        ['%s']: %s,\n", key, valueText);
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
        };
        // 是否能导出
        switch (this.rule) {
            case "m": {
                let majorField = this.fields[0];
                if (!majorField)
                    return false;
                return !!type_2_valid[majorField.type];
            }
            case "ma": {
                let majorField = this.fields[0];
                if (!majorField)
                    return false;
                return !!type_2_valid[majorField.type];
            }
            case "mm": {
                let majorField = this.fields[0];
                let minorField = this.fields[1];
                if (!majorField || !minorField)
                    return false;
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
                return tools_1.default.format("字段[%d] 字段名不同： name1=[%s], name2=[%s]", i, f1.name, f2.name);
            }
            if (f1.type != f2.type) {
                return tools_1.default.format("字段[%s]类型不同： type1=[%s], type2=[%s]", f1.name, f1.type, f2.type);
            }
        }
        // 检查rule
        if (this.rule != db.rule) {
            return tools_1.default.format("rule不同： rule1=[%s], rule2=[%s]", this.rule, db.rule);
        }
        // 检查数据是否重复
        // console.log(this.datas)
        // console.log(db.datas)
        switch (this.rule) {
            case "m": {
                let majorField = this.fields[0];
                let msg = null;
                tools_1.default.forEachMap(db.datas, (majorId, data2) => {
                    let data1 = this.datas[majorId];
                    if (data1) {
                        msg = tools_1.default.format("数据重复：%s=[%s]", majorField.name, majorId);
                        return true;
                    }
                });
                if (msg)
                    return msg;
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
                tools_1.default.forEachMap(db.datas, (majorId, map2) => {
                    let map1 = this.datas[majorId];
                    if (!map1) {
                        // majorId对应的map1未找到，直接return
                        return true;
                    }
                    tools_1.default.forEachMap(map2, (minorId, data2) => {
                        let data1 = map1[minorId];
                        if (data1) {
                            msg = tools_1.default.format("数据重复：%s=[%s] %s=[%s]", majorField.name, majorId, minorField.name, minorId);
                            return true;
                        }
                    });
                    if (msg)
                        return true;
                });
                if (msg)
                    return msg;
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
                tools_1.default.forEachMap(db.datas, (majorId, data2) => {
                    this.datas[majorId] = data2;
                });
                break;
            }
            case "ma": {
                tools_1.default.forEachMap(db.datas, (majorId, arr2) => {
                    let arr1 = this.datas[majorId];
                    if (!arr1) {
                        // 直接使用arr2
                        this.datas[majorId] = arr2;
                    }
                    else {
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
                tools_1.default.forEachMap(db.datas, (majorId, map2) => {
                    let map1 = this.datas[majorId];
                    if (!map1) {
                        // 直接使用map2
                        this.datas[majorId] = map2;
                    }
                    else {
                        // 合并map
                        tools_1.default.forEachMap(map2, (minorId, data2) => {
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
        return tools_1.default.format("%s%d", COL_2_NAME[col], row + 1);
    }
    static loadDataBaseFromRawData(originFilePath, rawData) {
        let db = new DbBundleDataBase();
        db.originFilePath = originFilePath;
        db.originSheetName = rawData.name;
        let fields = [];
        let fieldMap = new Set();
        let originDatas = [];
        // let originDataIndex_2_originRow = {};
        let originDataIndex_2_originFilePath_originSheetName_originRow = {};
        let exportConsts = [];
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
                                console.error(tools_1.default.format("[警告] 配置表%s导出规则为a，无法导出key为常量。", db.name));
                            }
                            else {
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
                        db.warnLog.push(tools_1.default.format("配置表[%s]中，出现重复的FLD_TYPE定义！", db.name));
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
                                db.warnLog.push(tools_1.default.format("配置表[%s]中，出现未知数据类型！字段列[%d], 数据类型[%s]！", db.name, col, value));
                            }
                            else {
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
                            let field = fields[i];
                            if (field.name) {
                                db.warnLog.push(tools_1.default.format("配置表[%s]中，字段名被覆盖[%s]->[%s]", db.name, field.name, value));
                            }
                            field.name = value;
                            if (fieldMap.has(value)) {
                                db.warnLog.push(tools_1.default.format("配置表[%s]中，出现重复字段名[%s]", db.name, value));
                            }
                            else {
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
                            let field = fields[i];
                            if (field.desc) {
                                field.desc = field.desc + "\n" + value;
                            }
                            else {
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
                            let field = fields[i];
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
                            let field = fields[i];
                            if (field.idMergeTo) {
                                db.warnLog.push(tools_1.default.format("配置表[%s]中，idMergeTo被覆盖[%s]->[%s]", db.name, field.idMergeTo, value));
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
                            let field = fields[i];
                            if (field.convertMap) {
                                db.warnLog.push(tools_1.default.format("配置表[%s]中，convertMap被覆盖[%s]->[%s]", db.name, field.convertMap, value));
                            }
                            field.convertMap = value;
                        }
                    }
                    break;
                }
                case "DATA": {
                    let data = {};
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
                            db.warnLog.push(tools_1.default.format("配置表[%s]中，主要id字段[%s]不能为空！请检查第%d行。", db.name, field.name, row + 1));
                            bCheckPass = false;
                        }
                    }
                    if (!bCheckPass)
                        continue;
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
                            let field = fields[i];
                            if (field.mergeToArrFieldName) {
                                db.warnLog.push(tools_1.default.format("配置表[%s]中，FLD_MERGE_TO_ARR被覆盖[%s]->[%s]", db.name, field.mergeToArrFieldName, value));
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
                            let field = fields[i];
                            if (field.mergeToArrFieldName) {
                                db.warnLog.push(tools_1.default.format("配置表[%s]中，FLD_MERGE_TO_ARR_KEEP_EMPTY被覆盖[%s]->[%s]", db.name, field.mergeToArrFieldName, value));
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
                tools_1.default.format("%s_%s", db.name.toUpperCase(), majorField.name.toUpperCase()),
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
                db.warnLog.push(tools_1.default.format("配置表[%s]中，EXPORT_CONST配置异常！varname=[%s] keyFieldName=[%s] valueFieldName=[%s]", db.name, varname, keyFieldName, valueFieldName));
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
                    }
                    else if (t == "A") {
                        dimensional++;
                    }
                }
                if (tsTypes.length > 1) {
                    dimensional++;
                }
                // console.log("basicTypes", tsTypes)
                // console.log("dimensional", dimensional)
                if (mapFields.length != tsTypes.length) {
                    this.warnLog.push(tools_1.default.format("配置表[%s]中，convertMap'%s'->%s和数据类型'%s'->%s长度不匹配！请检查字段分隔符是否为分号';'", this.name, field.convertMap, JSON.stringify(mapFields), field.type, JSON.stringify(tsTypes)));
                }
                if (dimensional >= 3)
                    continue;
                // 处理tsType
                let tempStr = "{";
                for (let i = 0; i < tsTypes.length; i++) {
                    const tsType = tsTypes[i];
                    let mapField = mapFields[i];
                    tempStr += tools_1.default.format("%s: %s", mapField, tsType);
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
                    }
                    else if (dimensional == 2) {
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
                }
                else {
                    mergeMap[field.mergeToArrFieldName] = [field];
                }
                hasMergeFld = true;
            }
            bKeepEmpty = !!field.bMergeToArrKeepEmpty;
        }
        // console.log("processMergeToArr", bKeepEmpty)
        if (!hasMergeFld)
            return;
        // 检查合并字段是否有冲突
        for (let fieldIndex = 0; fieldIndex < this.fields.length; fieldIndex++) {
            let fldName = this.fields[fieldIndex].name;
            if (mergeMap[fldName]) {
                console.error(tools_1.default.format("配置表[%s]中，合并字段和原始字段冲突[%s]，合并失败!", this.name, fldName));
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
                    console.error(tools_1.default.format("配置表[%s]中，合并字段[%s]存在FLD_TYPE不一致[%s][%s]，合并失败!", this.name, k, majorField.type, field.type));
                    return;
                }
                if (majorField.convertMap != field.convertMap) {
                    console.error(tools_1.default.format("配置表[%s]中，合并字段[%s]存在FLD_CONVERT_MAP不一致[%s][%s]，合并失败!", this.name, k, majorField.convertMap, field.convertMap));
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
                            if (value.length == 0)
                                continue;
                        }
                        else if (value instanceof Object) {
                            if (Object.values(value).every(function (v) { return v == undefined; }))
                                continue;
                        }
                        else if (value === "") {
                            continue;
                        }
                    }
                    // 数值0不表示空
                    mergeData.push(value);
                }
                data[k] = mergeData;
            });
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
    static loadFromXlsxAsync(filePath, fOnCompleted) {
        let dbs = [];
        // 通过node-xlsx加载数据
        tools_1.default.loadRawDatasFromXlsxAsync(filePath, (rawDatas) => {
            for (let sheetIndex = 0; sheetIndex < rawDatas.length; sheetIndex++) {
                const rawData = rawDatas[sheetIndex];
                let db = this.loadDataBaseFromRawData(filePath, rawData);
                dbs.push(db);
            }
            fOnCompleted && fOnCompleted(dbs);
        });
        // console.log(rawDatas)
    }
}
exports.DbBundleDataBase = DbBundleDataBase;
class DataBaseField {
    constructor(db) {
        this.verifyers = [];
        this.fillDefaultValue = null;
        this.bMergeToArrKeepEmpty = false;
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
                }
                else if (t == "A") {
                    dimensional++;
                }
            }
            if (tsTypes.length > 1) {
                dimensional++;
            }
            // 只支持1~2维数组
            if (dimensional >= 3 || dimensional <= 0) {
                this.db.warnLog.push(tools_1.default.format("配置表[%s]中，使用了不支持的%d维数组：[%s]", this.db.name, dimensional, this.type));
                // console.warn("只支持1~2维数组");
                return null;
            }
            if (dimensional == 1) {
                if (tsTypes.length == 1) {
                    return tools_1.default.format("%s[]", tsTypes.join(", "));
                }
                else if (tsTypes.length == 0) {
                    return tools_1.default.format("any[]", tsTypes.join(", "));
                }
                else {
                    return tools_1.default.format("[%s]", tsTypes.join(", "));
                }
            }
            else if (dimensional == 2) {
                if (tsTypes.length == 1) {
                    return tools_1.default.format("%s[][]", tsTypes.join(", "));
                }
                else if (tsTypes.length == 0) {
                    return tools_1.default.format("any[][]", tsTypes.join(", "));
                }
                else {
                    return tools_1.default.format("[%s][]", tsTypes.join(", "));
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
        if (value == null)
            value = "";
        // console.log("parseBasicValue", value, type, originValue, cellCoord);
        switch (type) {
            case "I": {
                // console.log("  I")
                let fn = parseFloat(value);
                // "1;2" 也可以正常解析为1，所以这里的异常判定用toString还原来比较
                if (fn.toString() != value) {
                    if (value != "") {
                        this.db.warnLog.push(tools_1.default.format("配置表[%s]中，I类型数据解析出错：type=[%s], value=[%s], 单元格=[%s]", this.db.name, originType, originValue, cellCoord));
                        return 0;
                    }
                    fn = 0;
                }
                if (isNaN(fn)) {
                    // 只有当value == NaN时，才有可能运行到这个异常
                    this.db.warnLog.push(tools_1.default.format("配置表[%s]中，I类型数据解析出错：type=[%s], value=[%s], 单元格=[%s]", this.db.name, originType, originValue, cellCoord));
                    fn = 0;
                }
                // 由于excel的精度和js不同，可能出现位置为1000，js中读取出是999.99999999999或者1000.000000001的情况，这里先降低精度再求整
                let n = parseInt(fn.toFixed(2));
                if (isNaN(n))
                    n = 0;
                if (fn != n)
                    this.db.warnLog.push(tools_1.default.format("配置表[%s]中，I类数据配置为F，丢失精度警告！type=[%s], value=[%s], 单元格=[%s]", this.db.name, originType, originValue, cellCoord));
                return n;
            }
            case "F": {
                let n;
                if (value == "") {
                    n = 0;
                }
                else {
                    n = parseFloat(value);
                    // console.log(Tools.format("parse F value:[%s] n:[%f] n.toString():[%s]", value, n, n.toString()));
                    // if (n.toString() != value) {
                    //     if (value != "") {
                    //         this.db.warnLog.push(Tools.format("配置表[%s]中，F类型数据解析出错：type=[%s], value=[%s]", this.db.name, originType, originValue));
                    //     }
                    //     n = 0;
                    // }
                    if (isNaN(n)) {
                        this.db.warnLog.push(tools_1.default.format("配置表[%s]中，F类型数据解析出错：type=[%s], value=[%s], 单元格=[%s]", this.db.name, originType, originValue, cellCoord));
                        n = 0;
                    }
                }
                return n;
            }
            case "S": {
                return value.toString();
            }
            case "B": {
                let str = value.toString().toLowerCase();
                if (str == "true") {
                    return true;
                }
                else if (str == "false") {
                    return false;
                }
                else if (value != "") {
                    this.db.warnLog.push(tools_1.default.format("配置表[%s]中，B类数据配置错误，需要为TRUE或FALSE！type=[%s] value=[%s], 单元格=[%s]", this.db.name, originType, originValue, cellCoord));
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
    _checkBasicValueType(value, type) {
        // 允许为null
        if (value === null)
            return true;
        // console.log("_checkBasicValueType", value, type)
        if (!BASIC_TYPE_2_TS_TYPE[type]) {
            // console.log(" not basic type")
            return false;
        }
        switch (type) {
            case "I": {
                // console.log("I", typeof value)
                // 检查类型
                if (typeof value != "number")
                    return false;
                // console.log("it's number")
                // 检查精度
                let n = parseInt(value.toFixed(2));
                if (value != n) {
                    console.log("精度损失");
                    return false;
                }
                break;
            }
            case "F": {
                // 检查类型
                if (typeof value != "number")
                    return false;
                break;
            }
            case "S": {
                // 检查类型
                if (typeof value != "string")
                    return false;
                break;
            }
            case "B": {
                // 检查类型
                if (typeof value != "boolean")
                    return false;
                break;
            }
        }
        return true;
    }
    _validJsonValue(value, originValue, cellCoord) {
        if (!Array.isArray(value)) {
            this.db.warnLog.push(tools_1.default.format("配置表[%s]中，复合类型字段解析异常，JSON解析的值不是数组！。type='%s', value='%s', originValue='%s', 单元格=[%s]", this.db.name, this.type, value, originValue, cellCoord));
            return null;
        }
        else if (value.length <= 0) {
            // 允许空数组
            return value;
        }
        // console.log("_validJsonValue", cellCoord, this.type, originValue, value);
        // 能进入到这里，一定是复合类型。
        let types = [];
        let dimensional = 0;
        for (let i = 0; i < this.type.length; i++) {
            const t = this.type[i];
            let tsType = BASIC_TYPE_2_TS_TYPE[t];
            if (tsType) {
                types.push(t);
            }
            else if (t == "A") {
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
                        this.db.warnLog.push(tools_1.default.format("配置表[%s]中，复合类型字段解析异常，值类型不匹配。type='%s', value='%s', fieldType='%s', filedValue='%s' 单元格=[%s]", this.db.name, this.type, originValue, fieldType, fieldValue, cellCoord));
                        return [];
                    }
                }
            }
            else if (types.length == 0) {
                // 自定义类型，是否允许？，跳过校验
                return value;
            }
            else {
                // 复合类型，校验值类型、校验数组长度
                if (value.length != types.length) {
                    this.db.warnLog.push(tools_1.default.format("配置表[%s]中，复合类型字段解析异常，数据长度和类型长度不匹配。type='%s', value='%s', 单元格=[%s]", this.db.name, this.type, originValue, cellCoord));
                    return [];
                }
                for (let i = 0; i < value.length; i++) {
                    const fieldValue = value[i];
                    let fieldType = types[i];
                    if (!this._checkBasicValueType(fieldValue, fieldType)) {
                        this.db.warnLog.push(tools_1.default.format("配置表[%s]中，复合类型字段解析异常，值类型不匹配。type='%s', value='%s', fieldType='%s', filedValue='%s' 单元格=[%s]", this.db.name, this.type, originValue, fieldType, fieldValue, cellCoord));
                        return [];
                    }
                }
            }
        }
        else if (dimensional == 2) {
            for (let i = 0; i < value.length; i++) {
                const rowArr = value[i];
                if (!Array.isArray(rowArr)) {
                    this.db.warnLog.push(tools_1.default.format("配置表[%s]中，复合类型字段解析异常，二维数组的第%d行成员'%s'不是数组。type='%s', value='%s', 单元格=[%s]", this.db.name, i, rowArr, this.type, originValue, cellCoord));
                    return [];
                }
                if (types.length == 1) {
                    // 单一类型，校验值类型
                    let fieldType = types[0];
                    for (let j = 0; j < rowArr.length; j++) {
                        const fieldValue = rowArr[j];
                        if (!this._checkBasicValueType(fieldValue, fieldType)) {
                            this.db.warnLog.push(tools_1.default.format("配置表[%s]中，复合类型字段解析异常，二维数组第%d行成员值类型不匹配。type='%s', value='%s', fieldType='%s', filedValue='%s' 单元格=[%s]", this.db.name, i, this.type, originValue, fieldType, fieldValue, cellCoord));
                            return [];
                        }
                    }
                }
                else if (types.length == 0) {
                    // 自定义类型，是否允许？，跳过校验
                    // return value;
                }
                else {
                    // 复合类型，校验值类型、校验数组长度
                    if (rowArr.length != types.length) {
                        this.db.warnLog.push(tools_1.default.format("配置表[%s]中，复合类型字段解析异常，二维数组第%d行成员数据长度和类型长度不匹配。type='%s', value='%s', 单元格=[%s]", this.db.name, i, this.type, originValue, cellCoord));
                        return [];
                    }
                    for (let j = 0; j < rowArr.length; j++) {
                        const fieldValue = rowArr[j];
                        let fieldType = types[j];
                        if (!this._checkBasicValueType(fieldValue, fieldType)) {
                            this.db.warnLog.push(tools_1.default.format("配置表[%s]中，复合类型字段解析异常，二维数组第%d行成员值类型不匹配。type='%s', value='%s', fieldType='%s', filedValue='%s' 单元格=[%s]", this.db.name, i, this.type, originValue, fieldType, fieldValue, cellCoord));
                            return [];
                        }
                    }
                }
            }
        }
        else {
            // 不是数组，返回null
            return null;
        }
        return value;
    }
    parseValue(originValue, cellCoord) {
        if (originValue == null)
            originValue = "";
        // 优先在缓存中查询，如果命令缓存则直接使用缓存的数据，提升解析效率
        let cache = DataBaseField.parseValueCache[this.type];
        if (!cache) {
            cache = {};
            DataBaseField.parseValueCache[this.type] = cache;
        }
        let cacheValue = cache[originValue];
        if (cacheValue !== undefined)
            return cacheValue;
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
            }
            catch (error) {
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
                }
                else if (t == "A") {
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
                    arr = [];
                }
                else {
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
                }
                else {
                    // 有多个类型，直接按照types解析
                    let count;
                    if (this.fillDefaultValue) {
                        count = types.length;
                    }
                    else {
                        if (types.length != arr.length && arr.length > 0) {
                            this.db.warnLog.push(tools_1.default.format("配置表[%s]中，复合类型字段解析异常，数据长度和类型长度不匹配。type='%s', value='%s', 单元格=[%s]", this.db.name, this.type, originValue, cellCoord));
                        }
                        count = Math.min(arr.length, types.length);
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
            }
            else if (dimensional == 2) {
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
                    }
                    else {
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
                    }
                    else {
                        // 多类型
                        let count;
                        if (this.fillDefaultValue) {
                            count = types.length;
                        }
                        else {
                            if (types.length != arr2.length && arr2.length > 0) {
                                this.db.warnLog.push(tools_1.default.format("配置表[%s]中，复合类型字段解析异常，数据长度和类型长度不匹配。type='%s', value='%s', 单元格=[%s]", this.db.name, this.type, originValue, cellCoord));
                            }
                            count = Math.min(arr2.length, types.length);
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
DataBaseField.parseValueCache = {};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGItYnVuZGxlLWRhdGEtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9kYl9idW5kbGVfZXhwb3J0ZXIvZGItYnVuZGxlLWRhdGEtYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwyREFBbUM7QUFDbkMsTUFBTSxvQkFBb0IsR0FBRztJQUN6QixDQUFDLEVBQUUsUUFBUTtJQUNYLENBQUMsRUFBRSxRQUFRO0lBQ1gsQ0FBQyxFQUFFLFFBQVE7SUFDWCxDQUFDLEVBQUUsU0FBUztDQUNmLENBQUM7QUFFRixNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFDdEI7SUFDSSxJQUFJLEdBQUcsR0FBRyw0QkFBNEIsQ0FBQztJQUV2QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNqQyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDckMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN6QjtJQUVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2pDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUV0QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNqQyxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdEMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFL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QUM7NEJBQzVFLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQzFCO3FCQUNKO29CQUVELDZDQUE2QztvQkFFN0MsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDeEI7Z0JBQ0QsNEdBQTRHO2FBQy9HO1NBQ0o7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBRXpCLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQzs7QUEvZk0sNkJBQWUsR0FBMkIsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFRvb2xzIGZyb20gXCIuLi91dGlscy90b29sc1wiO1xyXG5jb25zdCBCQVNJQ19UWVBFXzJfVFNfVFlQRSA9IHtcclxuICAgIEk6IFwibnVtYmVyXCIsXHJcbiAgICBGOiBcIm51bWJlclwiLFxyXG4gICAgUzogXCJzdHJpbmdcIixcclxuICAgIEI6IFwiYm9vbGVhblwiLFxyXG59O1xyXG5cclxuY29uc3QgQ09MXzJfTkFNRSA9IFtdO1xyXG57XHJcbiAgICBsZXQgc3RyID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWlwiO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgY2hhciA9IHN0ci5zdWJzdHJpbmcoaSwgaSArIDEpO1xyXG4gICAgICAgIENPTF8yX05BTUUucHVzaChjaGFyKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IGNoYXIxID0gc3RyLnN1YnN0cmluZyhpLCBpICsgMSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgc3RyLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNoYXIyID0gc3RyLnN1YnN0cmluZyhqLCBqICsgMSk7XHJcbiAgICAgICAgICAgIENPTF8yX05BTUUucHVzaChjaGFyMSArIGNoYXIyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBjb25zb2xlLmxvZyhDT0xfMl9OQU1FKTtcclxufVxyXG5leHBvcnQgY2xhc3MgRGJCdW5kbGVEYXRhQmFzZSB7XHJcbiAgICBvcmlnaW5GaWxlUGF0aCA6IHN0cmluZztcclxuICAgIG9yaWdpblNoZWV0TmFtZSA6IHN0cmluZztcclxuXHJcbiAgICBuYW1lIDogc3RyaW5nO1xyXG4gICAgcnVsZSA6IHN0cmluZztcclxuICAgIC8vIGJFeHBvcnRLZXkgPSBmYWxzZTtcclxuICAgIGZpZWxkcyA6IERhdGFCYXNlRmllbGRbXSA9IFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogW1t2YXJuYW1lLCBrZXlGaWVsZE5hbWUsIHZhbHVlRmllbGROYW1lXV1cclxuICAgICAqL1xyXG4gICAgZXhwb3J0Q29uc3RzIDogW3N0cmluZyxzdHJpbmcsc3RyaW5nXVtdID0gW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDljp/lp4vmlbDmja7vvIzlkoxydWxl5peg5YWzXHJcbiAgICAgKiBbXHJcbiAgICAgKiAgICAgIHtrMTp2MSwgazI6djJ9XHJcbiAgICAgKiBdXHJcbiAgICAgKi9cclxuICAgIG9yaWdpbkRhdGFzIDoge1trZXkgOiBzdHJpbmddIDogYW55fVtdID0gW107XHJcbiAgICAvKipcclxuICAgICAqIOWOn+Wni+aVsOaNrmluZGV45Yiw5Y6f5aeL6KGo5qC8cm9355qE5pig5bCE5YWz57O7XHJcbiAgICAgKi9cclxuICAgIG9yaWdpbkRhdGFJbmRleF8yX29yaWdpbkZpbGVQYXRoX29yaWdpblNoZWV0TmFtZV9vcmlnaW5Sb3cgPSB7fTtcclxuXHJcbiAgICBkYXRhcztcclxuXHJcbiAgICB3YXJuTG9nID0gW107XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5maWVsZHMgPSBbXTtcclxuICAgICAgICB0aGlzLndhcm5Mb2cgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRGaWVsZHMoZmllbGRzKSB7XHJcbiAgICAgICAgdGhpcy5maWVsZHMgPSBUb29scy5zb3J0QXJyYXlCeUZpZWxkKGZpZWxkcywgXCJvcmlnaW5Db2xcIilcclxuICAgIH1cclxuXHJcbiAgICBnZXRGaWVsZEJ5TmFtZShmaWVsZE5hbWUpIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gdGhpcy5maWVsZHNbaV07XHJcbiAgICAgICAgICAgIGlmIChmaWVsZC5uYW1lID09IGZpZWxkTmFtZSkgcmV0dXJuIGZpZWxkO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBzZXRFeHBvcnRDb25zdHMoZXhwb3J0Q29uc3RzIDogW3N0cmluZyxzdHJpbmcsc3RyaW5nXVtdKSB7XHJcbiAgICAgICAgdGhpcy5leHBvcnRDb25zdHMgPSBleHBvcnRDb25zdHM7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0T3JpZ2luRGF0YXMob3JpZ2luRGF0YXMsIG9yaWdpbkRhdGFJbmRleF8yX29yaWdpbkZpbGVQYXRoX29yaWdpblNoZWV0TmFtZV9vcmlnaW5Sb3cpIHtcclxuICAgICAgICB0aGlzLm9yaWdpbkRhdGFzID0gb3JpZ2luRGF0YXM7XHJcbiAgICAgICAgdGhpcy5vcmlnaW5EYXRhSW5kZXhfMl9vcmlnaW5GaWxlUGF0aF9vcmlnaW5TaGVldE5hbWVfb3JpZ2luUm93ID0gb3JpZ2luRGF0YUluZGV4XzJfb3JpZ2luRmlsZVBhdGhfb3JpZ2luU2hlZXROYW1lX29yaWdpblJvdztcclxuXHJcbiAgICAgICAgbGV0IHR5cGVfMl92YWxpZCA9IHtcclxuICAgICAgICAgICAgUzogdHJ1ZSxcclxuICAgICAgICAgICAgSTogdHJ1ZSxcclxuICAgICAgICAgICAgRjogdHJ1ZSxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiRGF0YUJhc2Uuc2V0T3JpZ2luRGF0YXNcIiwgdGhpcyk7XHJcblxyXG4gICAgICAgIC8vIOino+aekOS4uuato+W8j+agvOW8j++8n1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy5ydWxlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJhXCI6IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YXMgPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5vcmlnaW5EYXRhcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLm9yaWdpbkRhdGFzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YXMucHVzaChkYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJtYVwiOiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFzID0ge307XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub3JpZ2luRGF0YXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5vcmlnaW5EYXRhc1tpXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1ham9ySWRGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbWFqb3JJZEZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc10gcnVsZT1bJXNdIOacquaJvuWIsOS4u+imgWlk5a2X5q6177yBXCIsIHRoaXMub3JpZ2luRmlsZVBhdGgsIHRoaXMucnVsZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0eXBlXzJfdmFsaWRbbWFqb3JJZEZpZWxkLnR5cGVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc10gcnVsZT1bJXNdIOS4u+imgWlkWyVzXeexu+Wei+S4jeiDveS4ulslc13vvIHor7fphY3nva7kuLpJLCBGLCBT5Lit55qE5LiA56eN44CCXCIsIHRoaXMub3JpZ2luRmlsZVBhdGgsIHRoaXMucnVsZSwgbWFqb3JJZEZpZWxkLm5hbWUsIG1ham9ySWRGaWVsZC50eXBlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWFqb3JJZCA9IGRhdGFbbWFqb3JJZEZpZWxkLm5hbWVdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYWpvcklkID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXSBydWxlPVslc10g5Li76KaBaWRbJXNd5pyq6YWN572u77yBXCIsIHRoaXMub3JpZ2luRmlsZVBhdGgsIHRoaXMucnVsZSwgbWFqb3JJZEZpZWxkLm5hbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMubmFtZSwgaSwgbWFqb3JJZEZpZWxkLm5hbWUsIG1ham9ySWRGaWVsZC50c1R5cGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWlub3JEYXRhcyA9IHRoaXMuZGF0YXNbbWFqb3JJZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtaW5vckRhdGFzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbm9yRGF0YXMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhc1ttYWpvcklkXSA9IG1pbm9yRGF0YXM7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBtaW5vckRhdGFzLnB1c2goZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwibW1cIjoge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhcyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm9yaWdpbkRhdGFzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMub3JpZ2luRGF0YXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJvdyA9IG9yaWdpbkRhdGFJbmRleF8yX29yaWdpbkZpbGVQYXRoX29yaWdpblNoZWV0TmFtZV9vcmlnaW5Sb3dbaV1bMl07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtYWpvcklkRmllbGQgPSB0aGlzLmZpZWxkc1swXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1ham9ySWRGaWVsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNdIHJ1bGU9WyVzXSDmnKrmib7liLDkuLvopoFpZOWtl+aute+8gVwiLCB0aGlzLm9yaWdpbkZpbGVQYXRoLCB0aGlzLnJ1bGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0eXBlXzJfdmFsaWRbbWFqb3JJZEZpZWxkLnR5cGVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc10gcnVsZT1bJXNdIOS4u+imgWlkWyVzXeexu+Wei+S4jeiDveS4ulslc13vvIHor7fphY3nva7kuLpJLCBGLCBT5Lit55qE5LiA56eN44CCXCIsIHRoaXMub3JpZ2luRmlsZVBhdGgsIHRoaXMucnVsZSwgbWFqb3JJZEZpZWxkLm5hbWUsIG1ham9ySWRGaWVsZC50eXBlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWFqb3JJZCA9IGRhdGFbbWFqb3JJZEZpZWxkLm5hbWVdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYWpvcklkID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXSBydWxlPVslc10g5Li76KaBaWRbJXNd5pyq6YWN572u77yBXCIsIHRoaXMub3JpZ2luRmlsZVBhdGgsIHRoaXMucnVsZSwgbWFqb3JJZEZpZWxkLm5hbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtaW5vcklkRmllbGQgPSB0aGlzLmZpZWxkc1sxXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1pbm9ySWRGaWVsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNdIHJ1bGU9WyVzXSDmnKrmib7liLDmrKHopoFpZOWtl+aute+8gVwiLCB0aGlzLm9yaWdpbkZpbGVQYXRoLCB0aGlzLnJ1bGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1pbm9ySWQgPSBkYXRhW21pbm9ySWRGaWVsZC5uYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWlub3JJZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc10gcnVsZT1bJXNdIOasoeimgWlkWyVzXeacqumFjee9ru+8geS4u2lkWyVzXT1bJXNd77yBXCIsIHRoaXMub3JpZ2luRmlsZVBhdGgsIHRoaXMucnVsZSwgbWFqb3JJZEZpZWxkLm5hbWUsIG1ham9ySWRGaWVsZC5uYW1lLCBtYWpvcklkKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWlub3JEYXRhcyA9IHRoaXMuZGF0YXNbbWFqb3JJZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtaW5vckRhdGFzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbm9yRGF0YXMgPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhc1ttYWpvcklkXSA9IG1pbm9yRGF0YXM7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobWlub3JEYXRhc1ttaW5vcklkXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNdIHJ1bGU9WyVzXSDmrKHopoFpZOWGsueqge+8muS4u2lkWyVzXT1bJXNdIOasoWlkWyVzXT1bJXNd77yM6K+35qOA5p+l6YWN572u6KGo56ysJWTooYzjgIJcIiwgdGhpcy5vcmlnaW5GaWxlUGF0aCwgdGhpcy5ydWxlLCBtaW5vcklkRmllbGQubmFtZSwgbWlub3JJZCwgbWFqb3JJZEZpZWxkLm5hbWUsIG1ham9ySWQsIHJvdyArIDEpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbWlub3JEYXRhc1ttaW5vcklkXSA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwibVwiOiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFzID0ge307XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub3JpZ2luRGF0YXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5vcmlnaW5EYXRhc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcm93ID0gb3JpZ2luRGF0YUluZGV4XzJfb3JpZ2luRmlsZVBhdGhfb3JpZ2luU2hlZXROYW1lX29yaWdpblJvd1tpXVsyXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1ham9ySWRGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbWFqb3JJZEZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc10gcnVsZT1bJXNdIOacquaJvuWIsOS4u+imgWlk5a2X5q6177yBXCIsIHRoaXMub3JpZ2luRmlsZVBhdGgsIHRoaXMucnVsZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXR5cGVfMl92YWxpZFttYWpvcklkRmllbGQudHlwZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXSBydWxlPVslc10g5Li76KaBaWRbJXNd57G75Z6L5LiN6IO95Li6WyVzXe+8geivt+mFjee9ruS4ukksIEYsIFPkuK3nmoTkuIDnp43jgIJcIiwgdGhpcy5vcmlnaW5GaWxlUGF0aCwgdGhpcy5ydWxlLCBtYWpvcklkRmllbGQubmFtZSwgbWFqb3JJZEZpZWxkLnR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtYWpvcklkID0gZGF0YVttYWpvcklkRmllbGQubmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1ham9ySWQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNdIHJ1bGU9WyVzXSDkuLvopoFpZFslc13mnKrphY3nva7vvIFcIiwgdGhpcy5vcmlnaW5GaWxlUGF0aCwgdGhpcy5ydWxlLCBtYWpvcklkRmllbGQubmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJtYWpvcklkXCIsIGksIG1ham9ySWQsICEhdGhpcy5kYXRhc1ttYWpvcklkXSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZGF0YXNbbWFqb3JJZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXSBydWxlPVslc10g5Li76KaBaWTlhrLnqoHvvJolcz1bJXNd77yM6K+35qOA5p+l6YWN572u6KGo56ysJWTooYzjgIJcIiwgdGhpcy5vcmlnaW5GaWxlUGF0aCwgdGhpcy5ydWxlLCBtYWpvcklkRmllbGQubmFtZSwgbWFqb3JJZCwgcm93ICsgMSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGFzW21ham9ySWRdID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5hbWUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc10gcnVsZT1bJXNdIOS4jeaUr+aMgeatpOinhOWIme+8jOivt+S9v+eUqG3jgIFtbeOAgW1h44CBYeS4reeahOS4gOenjeOAglwiLCB0aGlzLm9yaWdpbkZpbGVQYXRoLCB0aGlzLnJ1bGUpKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyDmnKrnn6VydWxl77yfXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOayoeacieWQjeWtl++8jOivtOaYjui/meS4jeaYr+S4gOS4quWQiOazleeahOmcgOimgeWvvOWHuueahOmFjee9ru+8jOaXoOmcgOaKpeitplxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhcyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yRGIoY2FsbGJhY2ssIGJPbmx5Rm9yTWFqb3IgPSBmYWxzZSkge1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy5ydWxlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJhXCI6IHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5kYXRhcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmRhdGFzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEsIGkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1hXCI6IHtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAodGhpcy5kYXRhcywgKG1ham9ySWQsIGFycikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiT25seUZvck1ham9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGFyciwgbWFqb3JJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhcnJbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhLCBtYWpvcklkLCBpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1tXCI6IHtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAodGhpcy5kYXRhcywgKG1ham9ySWQsIG1pbm9yRGF0YXMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYk9ubHlGb3JNYWpvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhtaW5vckRhdGFzLCBtYWpvcklkKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBUb29scy5mb3JFYWNoTWFwKG1pbm9yRGF0YXMsIChtaW5vcklkLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhLCBtYWpvcklkLCBtaW5vcklkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBjYXNlIFwibVwiOlxyXG4gICAgICAgICAgICBkZWZhdWx0OiB7XHJcbiAgICAgICAgICAgICAgICBUb29scy5mb3JFYWNoTWFwKHRoaXMuZGF0YXMsIChtYWpvcklkLCBkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSwgbWFqb3JJZCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldE1ham9ySWROYW1lKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZpZWxkc1swXS5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE1pbm9ySWROYW1lKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZpZWxkc1sxXS5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog55Sf5oiQ5Y6f5aeLanNvbuaVsOaNrlxyXG4gICAgICovXHJcbiAgICBnZW5lcmF0ZVByZXZpZXdEYkpzb25UZXh0KCkge1xyXG4gICAgICAgIGxldCB0ZXh0ID0gJyc7XHJcblxyXG4gICAgICAgIHRleHQgKz0gJ3tcXG4nO1xyXG5cclxuICAgICAgICAvLyBuYW1lXHJcbiAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCInbmFtZSc6ICclcycsXFxuXCIsIHRoaXMubmFtZSk7XHJcblxyXG4gICAgICAgIC8vIHJ1bGVcclxuICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIidydWxlJzogJyVzJyxcXG5cIiwgdGhpcy5ydWxlKTtcclxuXHJcbiAgICAgICAgLy8g5YWz6IGU6YWN572u6KGoXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJFeHBvcnRlci5kYk5hbWVzXzJfZGJGaWxlUGF0aE1hcFwiLCBFeHBvcnRlci5kYk5hbWVzXzJfZGJGaWxlUGF0aE1hcClcclxuICAgICAgICAvLyBsZXQgZmlsZVBhdGhNYXAgPSBEYkJ1bmRsZURhdGFzLkluc3RhbmNlLmRiTmFtZXNfMl9kYkZpbGVQYXRoTWFwW3RoaXMubmFtZV07XHJcbiAgICAgICAgLy8gaWYgKGZpbGVQYXRoTWFwKSB7XHJcbiAgICAgICAgLy8gICAgIGxldCBmaWxlUGF0aHMgPSBbXTtcclxuICAgICAgICAvLyAgICAgVG9vbHMuZm9yRWFjaE1hcChmaWxlUGF0aE1hcCwgKGZpbGVQYXRoKSA9PiB7XHJcbiAgICAgICAgLy8gICAgICAgICBmaWxlUGF0aCA9IGZpbGVQYXRoLnJlcGxhY2VBbGwoRWRpdG9yLlByb2plY3QucGF0aCArIFwiXFxcXFwiLCBcIlwiKS5yZXBsYWNlQWxsKFwiXFxcXFwiLCBcIi9cIik7XHJcbiAgICAgICAgLy8gICAgICAgICAvLyBjb25zb2xlLmxvZyhFeHBvcnRlci5wcmpSb290RGlyLCBmaWxlUGF0aClcclxuICAgICAgICAvLyAgICAgICAgIGZpbGVQYXRocy5wdXNoKGZpbGVQYXRoKVxyXG4gICAgICAgIC8vICAgICB9KTtcclxuICAgICAgICAvLyAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCInc291cmNlcyc6ICVzLFxcblwiLCBKU09OLnN0cmluZ2lmeShmaWxlUGF0aHMpKTtcclxuICAgICAgICAvLyB9O1xyXG5cclxuXHJcbiAgICAgICAgLy8g5a2X5q61XHJcbiAgICAgICAgbGV0IGZpZWxkcyA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgdiA9IHRoaXMuZmllbGRzW2ldO1xyXG5cclxuICAgICAgICAgICAgZmllbGRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgb3JpZ2luQ29sOiB2Lm9yaWdpbkNvbCxcclxuICAgICAgICAgICAgICAgIG5hbWU6IHYubmFtZSxcclxuICAgICAgICAgICAgICAgIHR5cGU6IHYudHlwZSxcclxuICAgICAgICAgICAgICAgIHRzVHlwZTogdi50c1R5cGUsXHJcbiAgICAgICAgICAgICAgICBkZXNjOiB2LmRlc2MsXHJcbiAgICAgICAgICAgICAgICB2ZXJpZnllcnM6IHYudmVyaWZ5ZXJzLFxyXG4gICAgICAgICAgICAgICAgaWRNZXJnZVRvOiB2LmlkTWVyZ2VUbyxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiJ2ZpZWxkcyc6ICVzLFxcblwiLCBKU09OLnN0cmluZ2lmeShmaWVsZHMsIG51bGwsIDQpKTtcclxuXHJcbiAgICAgICAgLy8g5a2X5q61XHJcbiAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCInZGF0YXMnOiAlc1xcblwiLCBKU09OLnN0cmluZ2lmeSh0aGlzLmRhdGFzLCBudWxsLCA0KSk7XHJcblxyXG4gICAgICAgIHRleHQgKz0gJ30nO1xyXG5cclxuICAgICAgICByZXR1cm4gdGV4dFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog55Sf5oiQZGIuZC50c+aWh+acrFxyXG4gICAgICovXHJcbiAgICBnZW5lcmF0ZURiZHRzVGV4dChtb2R1bGVOYW1lIDogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IHRleHQgPSBcIlwiO1xyXG5cclxuICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIHR5cGUgJXNfZGF0YSA9IHtcXG4nLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgZmllbGQgPSB0aGlzLmZpZWxkc1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmaWVsZC5kZXNjKSB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgICAgICAvKiogJXMgKi9cXG4nLCBmaWVsZC5kZXNjKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyAgICAgICAgcmVhZG9ubHkgJXM6ICVzLFxcbicsIGZpZWxkLm5hbWUsIGZpZWxkLnRzVHlwZSk7XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICB0ZXh0ICs9ICcgICAgfTtcXG4nO1xyXG5cclxuICAgICAgICB0ZXh0ICs9ICdcXG4nO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKHRoaXMucnVsZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwibVwiOiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFqb3JGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyAgICB0eXBlICVzID0ge1xcbicsIHRoaXMubmFtZSk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgICAgICBbJXM6ICVzXTogJXNfZGF0YSxcXG4nLCBtYWpvckZpZWxkLm5hbWUsIG1ham9yRmllbGQudHNUeXBlLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSAnICAgIH07XFxuJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJtbVwiOiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFqb3JGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgbGV0IG1pbm9yRmllbGQgPSB0aGlzLmZpZWxkc1sxXTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgdHlwZSAlcyA9IHtcXG4nLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyAgICAgICAgWyVzOiAlc106IHtcXG4nLCBtYWpvckZpZWxkLm5hbWUsIG1ham9yRmllbGQudHNUeXBlKTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgICAgICAgICBbJXM6ICVzXTogJXNfZGF0YSxcXG4nLCBtaW5vckZpZWxkLm5hbWUsIG1pbm9yRmllbGQudHNUeXBlLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSAnICAgICAgICB9LFxcbidcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gJyAgICB9O1xcbic7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwibWFcIjoge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1ham9yRmllbGQgPSB0aGlzLmZpZWxkc1swXTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgdHlwZSAlcyA9IHtcXG4nLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyAgICAgICAgWyVzOiAlc106ICVzX2RhdGFbXSxcXG4nLCBtYWpvckZpZWxkLm5hbWUsIG1ham9yRmllbGQudHNUeXBlLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSAnICAgIH07XFxuJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJhXCI6IHtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgdHlwZSAlcyA9ICVzX2RhdGFbXTtcXG4nLCB0aGlzLm5hbWUsIHRoaXMubmFtZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGV4dCArPSAnXFxuJztcclxuXHJcbiAgICAgICAgdGV4dCArPSB0aGlzLmdlbmVyYXRlRGJkdHNHZXR0ZXJzVGV4dChtb2R1bGVOYW1lKTtcclxuXHJcblxyXG4gICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlQXV0b0V4cG9ydERiVHNHZXR0ZXJzVGV4dChtb2R1bGVOYW1lIDogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IHRleHQgPSBcIlwiO1xyXG5cclxuICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICAlcy5nZXRfJXMgPSAoKTogJXMuJXMgPT4geyByZXR1cm4gRGJNYW5hZ2VyLmdldERhdGFCYXNlKCclcycpLmRhdGFzOyB9XFxuXCIsIG1vZHVsZU5hbWUsdGhpcy5uYW1lLCBtb2R1bGVOYW1lLCB0aGlzLm5hbWUsIHRoaXMubmFtZSk7XHJcblxyXG4gICAgICAgIHN3aXRjaCAodGhpcy5ydWxlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJtXCI6IHtcclxuICAgICAgICAgICAgICAgIGxldCBtYWpvckZpZWxkID0gdGhpcy5maWVsZHNbMF07XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICAlcy5nZXRfZnJvbV8lcyA9ICglczogJXMsIGJRdWlldD86IGJvb2xlYW4pOiAlcy4lc19kYXRhID0+IHsgcmV0dXJuIERiTWFuYWdlci5nZXREYXRhQmFzZSgnJXMnKS5fZ2V0MSglcywgYlF1aWV0KTsgfVxcblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLnRzVHlwZSA9PSAnbnVtYmVyJyA/ICdudW1iZXIgfCBzdHJpbmcnIDogbWFqb3JGaWVsZC50c1R5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICAlcy5mb3JlYWNoX2Zyb21fJXMgPSAoY2FsbGJhY2s6ICglc0tleTogc3RyaW5nLCBkYXRhOiAlcy4lc19kYXRhKSA9PiAodm9pZCB8IGJvb2xlYW4pKSA9PiB7IERiTWFuYWdlci5nZXREYXRhQmFzZSgnJXMnKS5fZm9yZWFjaERhdGExKGNhbGxiYWNrKTsgfVxcblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1tXCI6IHtcclxuICAgICAgICAgICAgICAgIGxldCBtYWpvckZpZWxkID0gdGhpcy5maWVsZHNbMF07XHJcbiAgICAgICAgICAgICAgICBsZXQgbWlub3JGaWVsZCA9IHRoaXMuZmllbGRzWzFdO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICAgJXMuZ2V0X2Zyb21fJXMgPSAoJXM6ICVzLCAlczogJXMsIGJRdWlldD86IGJvb2xlYW4pOiAlcy4lc19kYXRhID0+IHsgcmV0dXJuIERiTWFuYWdlci5nZXREYXRhQmFzZSgnJXMnKS5fZ2V0MiglcywgJXMsIGJRdWlldCk7IH1cXG5cIixcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC50c1R5cGUgPT0gJ251bWJlcicgPyAnbnVtYmVyIHwgc3RyaW5nJyA6IG1ham9yRmllbGQudHNUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1pbm9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtaW5vckZpZWxkLnRzVHlwZSA9PSAnbnVtYmVyJyA/ICdudW1iZXIgfCBzdHJpbmcnIDogbWlub3JGaWVsZC50c1R5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtaW5vckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICAgJXMuZm9yZWFjaF9mcm9tXyVzID0gKGNhbGxiYWNrOiAoJXNLZXk6IHN0cmluZywgJXNLZXk6IHN0cmluZywgZGF0YTogJXMuJXNfZGF0YSkgPT4gKHZvaWQgfCBib29sZWFuKSkgPT4geyBEYk1hbmFnZXIuZ2V0RGF0YUJhc2UoJyVzJykuX2ZvcmVhY2hEYXRhMihjYWxsYmFjayk7IH1cXG5cIixcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWlub3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICAlcy5nZXRNYXBfZnJvbV8lcyA9ICglczogJXMsIGJRdWlldD86IGJvb2xlYW4pOiB7IFslczogJXNdOiAlcy4lc19kYXRhIH0gPT4geyByZXR1cm4gRGJNYW5hZ2VyLmdldERhdGFCYXNlKCclcycpLl9nZXQxKCVzLCBiUXVpZXQpOyB9XFxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQudHNUeXBlID09ICdudW1iZXInID8gJ251bWJlciB8IHN0cmluZycgOiBtYWpvckZpZWxkLnRzVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBtaW5vckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWlub3JGaWVsZC50c1R5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICAlcy5mb3JlYWNoTWFwX2Zyb21fJXMgPSAoY2FsbGJhY2s6ICglc0tleTogc3RyaW5nLCBkYXRhczogeyBbJXM6ICVzXTogJXMuJXNfZGF0YSB9KSA9PiAodm9pZCB8IGJvb2xlYW4pKSA9PiB7IERiTWFuYWdlci5nZXREYXRhQmFzZSgnJXMnKS5fZm9yZWFjaERhdGExKGNhbGxiYWNrKTsgfVxcblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtaW5vckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWlub3JGaWVsZC50c1R5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJtYVwiOiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFqb3JGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICAgJXMuZ2V0X2Zyb21fJXMgPSAoJXM6ICVzLCBpbmRleDogbnVtYmVyLCBiUXVpZXQ/OiBib29sZWFuKTogJXMuJXNfZGF0YSA9PiB7IHJldHVybiBEYk1hbmFnZXIuZ2V0RGF0YUJhc2UoJyVzJykuX2dldDIoJXMsIGluZGV4LCBiUXVpZXQpOyB9XFxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQudHNUeXBlID09ICdudW1iZXInID8gJ251bWJlciB8IHN0cmluZycgOiBtYWpvckZpZWxkLnRzVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiICAgICVzLmZvcmVhY2hfZnJvbV8lcyA9IChjYWxsYmFjazogKCVzS2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIsIGRhdGE6ICVzLiVzX2RhdGEpID0+ICh2b2lkIHwgYm9vbGVhbikpID0+IHsgRGJNYW5hZ2VyLmdldERhdGFCYXNlKCclcycpLl9mb3JlYWNoRGF0YTIoY2FsbGJhY2spOyB9XFxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICAlcy5nZXRBcnJfZnJvbV8lcyA9ICglczogJXMsIGJRdWlldD86IGJvb2xlYW4pOiAlcy4lc19kYXRhW10gPT4geyByZXR1cm4gRGJNYW5hZ2VyLmdldERhdGFCYXNlKCclcycpLl9nZXQxKCVzLCBiUXVpZXQpOyB9XFxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQudHNUeXBlID09ICdudW1iZXInID8gJ251bWJlciB8IHN0cmluZycgOiBtYWpvckZpZWxkLnRzVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiICAgICVzLmZvcmVhY2hBcnJfZnJvbV8lcyA9IChjYWxsYmFjazogKCVzS2V5OiBzdHJpbmcsIGRhdGFzOiAlcy4lc19kYXRhW10pID0+ICh2b2lkIHwgYm9vbGVhbikpID0+IHsgRGJNYW5hZ2VyLmdldERhdGFCYXNlKCclcycpLl9mb3JlYWNoRGF0YTEoY2FsbGJhY2spOyB9XFxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwiYVwiOiB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICAlcy5nZXRfZnJvbV8lcyA9IChpbmRleDogbnVtYmVyLCBiUXVpZXQ/OiBib29sZWFuKTogJXMuJXNfZGF0YSA9PiB7IHJldHVybiBEYk1hbmFnZXIuZ2V0RGF0YUJhc2UoJyVzJykuX2dldDEoaW5kZXgsIGJRdWlldCk7IH1cXG5cIixcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICAgJXMuZm9yZWFjaF9mcm9tXyVzID0gKGNhbGxiYWNrOiAoaW5kZXg6IG51bWJlciwgZGF0YTogJXMuJXNfZGF0YSkgPT4gKHZvaWQgfCBib29sZWFuKSkgPT4geyBEYk1hbmFnZXIuZ2V0RGF0YUJhc2UoJyVzJykuX2ZvcmVhY2hEYXRhMShjYWxsYmFjayk7IH1cXG5cIixcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgZ2VuZXJhdGVEYmR0c0dldHRlcnNUZXh0KG1vZHVsZU5hbWUgOiBzdHJpbmcpIHtcclxuICAgICAgICBsZXQgdGV4dCA9IFwiXCI7XHJcblxyXG4gICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiICAgIGZ1bmN0aW9uIGdldF8lcygpOiAlcy4lcztcXG5cIiwgdGhpcy5uYW1lLCBtb2R1bGVOYW1lLCB0aGlzLm5hbWUpO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKHRoaXMucnVsZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwibVwiOiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFqb3JGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICAgZnVuY3Rpb24gZ2V0X2Zyb21fJXMoJXM6ICVzLCBiUXVpZXQ/OiBib29sZWFuKTogJXMuJXNfZGF0YTtcXG5cIixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQudHNUeXBlID09ICdudW1iZXInID8gJ251bWJlciB8IHN0cmluZycgOiBtYWpvckZpZWxkLnRzVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICBmdW5jdGlvbiBmb3JlYWNoX2Zyb21fJXMoY2FsbGJhY2s6ICglc0tleTogc3RyaW5nLCBkYXRhOiAlcy4lc19kYXRhKSA9PiAodm9pZCB8IGJvb2xlYW4pKTogdm9pZDtcXG5cIixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJtbVwiOiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFqb3JGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgbGV0IG1pbm9yRmllbGQgPSB0aGlzLmZpZWxkc1sxXTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiICAgIGZ1bmN0aW9uIGdldF9mcm9tXyVzKCVzOiAlcywgJXM6ICVzLCBiUXVpZXQ/OiBib29sZWFuKTogJXMuJXNfZGF0YTtcXG5cIixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQudHNUeXBlID09ICdudW1iZXInID8gJ251bWJlciB8IHN0cmluZycgOiBtYWpvckZpZWxkLnRzVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBtaW5vckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWlub3JGaWVsZC50c1R5cGUgPT0gJ251bWJlcicgPyAnbnVtYmVyIHwgc3RyaW5nJyA6IG1pbm9yRmllbGQudHNUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgZnVuY3Rpb24gZm9yZWFjaF9mcm9tXyVzKGNhbGxiYWNrOiAoJXNLZXk6IHN0cmluZywgJXNLZXk6IHN0cmluZywgZGF0YTogJXMuJXNfZGF0YSkgPT4gKHZvaWQgfCBib29sZWFuKSk6IHZvaWQ7XFxuJyxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1pbm9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIGZ1bmN0aW9uIGdldE1hcF9mcm9tXyVzKCVzOiAlcywgYlF1aWV0PzogYm9vbGVhbik6IHsgWyVzOiAlc106ICVzLiVzX2RhdGEgfTtcXG4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC50c1R5cGUgPT0gJ251bWJlcicgPyAnbnVtYmVyIHwgc3RyaW5nJyA6IG1ham9yRmllbGQudHNUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1pbm9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtaW5vckZpZWxkLnRzVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIGZ1bmN0aW9uIGZvcmVhY2hNYXBfZnJvbV8lcyhjYWxsYmFjazogKCVzS2V5OiBzdHJpbmcsIGRhdGFzOiB7IFslczogJXNdOiAlcy4lc19kYXRhIH0pID0+ICh2b2lkIHwgYm9vbGVhbikpOiB2b2lkO1xcbicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtaW5vckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWlub3JGaWVsZC50c1R5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1hXCI6IHtcclxuICAgICAgICAgICAgICAgIGxldCBtYWpvckZpZWxkID0gdGhpcy5maWVsZHNbMF07XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIGZ1bmN0aW9uIGdldF9mcm9tXyVzKCVzOiAlcywgaW5kZXg6IG51bWJlciwgYlF1aWV0PzogYm9vbGVhbik6ICVzLiVzX2RhdGE7XFxuJyxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQudHNUeXBlID09ICdudW1iZXInID8gJ251bWJlciB8IHN0cmluZycgOiBtYWpvckZpZWxkLnRzVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIGZ1bmN0aW9uIGZvcmVhY2hfZnJvbV8lcyhjYWxsYmFjazogKCVzS2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIsIGRhdGE6ICVzLiVzX2RhdGEpID0+ICh2b2lkIHwgYm9vbGVhbikpOiB2b2lkO1xcbicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIGZ1bmN0aW9uIGdldEFycl9mcm9tXyVzKCVzOiAlcywgYlF1aWV0PzogYm9vbGVhbik6ICVzLiVzX2RhdGFbXTtcXG4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC50c1R5cGUgPT0gJ251bWJlcicgPyAnbnVtYmVyIHwgc3RyaW5nJyA6IG1ham9yRmllbGQudHNUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgZnVuY3Rpb24gZm9yZWFjaEFycl9mcm9tXyVzKGNhbGxiYWNrOiAoJXNLZXk6IHN0cmluZywgZGF0YXM6ICVzLiVzX2RhdGFbXSkgPT4gKHZvaWQgfCBib29sZWFuKSk6IHZvaWQ7XFxuJyxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJhXCI6IHtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgZnVuY3Rpb24gZ2V0X2Zyb21fJXMoaW5kZXg6IG51bWJlciwgYlF1aWV0PzogYm9vbGVhbik6ICVzLiVzX2RhdGE7XFxuJyxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyAgICBmdW5jdGlvbiBmb3JlYWNoX2Zyb21fJXMoY2FsbGJhY2s6IChpbmRleDogbnVtYmVyLCBkYXRhOiAlcy4lc19kYXRhKSA9PiAodm9pZCB8IGJvb2xlYW4pKTogdm9pZDtcXG4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlr7zlh7pfYXV0b0V4cG9ydERiLnRz5Lit5L2/55So55qE5paH5pysXHJcbiAgICAgKi9cclxuICAgIGdlbmVyYXRlQXV0b0V4cG9ydERiVHNDb25zdHNUZXh0KG1vZHVlbE5hbWUgOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZXhwb3J0Q29uc3RzKSByZXR1cm4gXCJcIjtcclxuXHJcbiAgICAgICAgbGV0IHRleHQgPSBcIlwiO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZXhwb3J0Q29uc3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmV4cG9ydENvbnN0c1tpXTtcclxuXHJcbiAgICAgICAgICAgIC8vIOaPkOWPlmV4cG9ydENvbnN05Lit55qE5Y+Y6YePXHJcbiAgICAgICAgICAgIGxldCBbdmFybmFtZSwga2V5RmllbGROYW1lLCB2YWx1ZUZpZWxkTmFtZV0gPSB2O1xyXG5cclxuICAgICAgICAgICAgLy8g5o+Q5Y+WZmllbGRcclxuICAgICAgICAgICAgbGV0IGtleUZpZWxkID0gdGhpcy5nZXRGaWVsZEJ5TmFtZShrZXlGaWVsZE5hbWUpO1xyXG4gICAgICAgICAgICBsZXQgdmFsdWVGaWVsZCA9IHRoaXMuZ2V0RmllbGRCeU5hbWUodmFsdWVGaWVsZE5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoIWtleUZpZWxkIHx8ICF2YWx1ZUZpZWxkKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIOWGmeWFpeazqOmHilxyXG4gICAgICAgICAgICBpZiAoa2V5RmllbGQuZGVzYykge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBgICAgIC8qKiAke2tleUZpZWxkLmRlc2N9ICovXFxuYDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnJXMuJXMgPSB7XFxuJywgbW9kdWVsTmFtZSx2YXJuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOaPkOWPluaVsOaNrlxyXG4gICAgICAgICAgICBsZXQgbWFwID0ge307XHJcbiAgICAgICAgICAgIHRoaXMuZm9yRGIoKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBrZXkgPSBkYXRhW2tleUZpZWxkTmFtZV07XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSBkYXRhW3ZhbHVlRmllbGROYW1lXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoa2V5ICE9IG51bGwgJiYgdmFsdWUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcFtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8g5oyJa2V55o6S5bqP5ZCO6YGN5Y6GXHJcbiAgICAgICAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMobWFwKTtcclxuICAgICAgICAgICAgLy9rZXlzLnNvcnQoKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBrZXlzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQga2V5ID0ga2V5c1tqXTtcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IG1hcFtrZXldO1xyXG5cclxuICAgICAgICAgICAgICAgIGtleSA9IGtleS5yZXBsYWNlKC8gL2csICdfJyk7Ly9yZXBsYWNlKC8tL2csICdfJykuXHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlVGV4dCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlRmllbGQudHNUeXBlID09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVUZXh0ID0gU3RyaW5nKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVUZXh0ID0gYCcke3ZhbHVlfSdgO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRleHQgKz0gYCAgICAnJHtrZXl9JzogJHt2YWx1ZVRleHR9LFxcbmA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRleHQgKz0gJ31cXG4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NvbnNvbGUubG9nKFwiZXhwb3J0Q29uc3RzID0gXCIsdGV4dCk7XHJcbiAgICAgICAgcmV0dXJuIHRleHQ7XHJcblxyXG5cclxuXHJcblxyXG4gICAgICAgIC8vIGxldCB0ZXh0ID0gXCJcIjtcclxuICAgICAgICAvLyBpZiAoIXRoaXMuYkV4cG9ydEtleSkgcmV0dXJuIHRleHQ7XHJcbiAgICAgICAgLy8gaWYgKHRoaXMucnVsZSA9PSBcImFcIikge1xyXG4gICAgICAgIC8vICAgICBjb25zb2xlLmVycm9yKFwiW+itpuWRil3lr7zlh7rop4TliJnkuLph77yM5peg5rOV5a+86Ie0a2V55Li65bi46YePLlwiKTtcclxuICAgICAgICAvLyAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICAvLyBsZXQga2V5cyA9IFtdO1xyXG4gICAgICAgIC8vIHRoaXMuZm9yRGIoZnVuY3Rpb24gKHBhcmFtcywgaWQpIHtcclxuICAgICAgICAvLyAgICAga2V5cy5wdXNoKGlkKTtcclxuICAgICAgICAvLyB9LCB0cnVlKTtcclxuICAgICAgICAvLyBrZXlzLnNvcnQoKTtcclxuXHJcbiAgICAgICAgLy8gbGV0IG1ham9yRmllbGQgPSB0aGlzLmZpZWxkc1swXTtcclxuICAgICAgICAvLyBpZiAobWFqb3JGaWVsZC5kZXNjKSB7XHJcbiAgICAgICAgLy8gICAgIHRleHQgKz0gYCAgICAvKiogJHttYWpvckZpZWxkLmRlc2N9ICovXFxuYDtcclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgLy8gLy8gdGV4dCArPSBUb29scy5mb3JtYXQoYCAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5ICVzID0ge1xcbmAsIGAke3RoaXMubmFtZX1fJHttYWpvckZpZWxkLm5hbWV9YC50b1VwcGVyQ2FzZSgpKTtcclxuICAgICAgICAvLyB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnZGIuJXNfJXMgPSB7XFxuJywgdGhpcy5uYW1lLnRvVXBwZXJDYXNlKCksIG1ham9yRmllbGQubmFtZS50b1VwcGVyQ2FzZSgpKTtcclxuICAgICAgICAvLyBrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgIC8vICAgICBsZXQgZmxkID0ga2V5LnJlcGxhY2UoLy0vZywgXCJfXCIpLnJlcGxhY2UoLyAvZywgXCJfXCIpO1xyXG4gICAgICAgIC8vICAgICBpZiAoaXNOYU4ocGFyc2VJbnQoZmxkWzBdKSkpIHtcclxuICAgICAgICAvLyAgICAgICAgIHRleHQgKz0gYCAgICAke2ZsZH06IFwiJHtrZXl9XCIsXFxuYDtcclxuICAgICAgICAvLyAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyAgICAgICAgIC8vIOWmguaenOaYr+S7peaVsOWtl+W8gOWktOeahGtlee+8jOmcgOimgeWKoOW8leWPt1xyXG4gICAgICAgIC8vICAgICAgICAgdGV4dCArPSBgICAgIFwiJHtmbGR9XCI6IFwiJHtrZXl9XCIsXFxuYDtcclxuICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgIC8vIH0pXHJcbiAgICAgICAgLy8gdGV4dCArPSBcIn1cXG5cIjtcclxuXHJcbiAgICAgICAgLy8gcmV0dXJuIHRleHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlr7lpMThu6YWN572u6KGo6L+b6KGM6buY6K6k5a+85Ye6XHJcbiAgICAgKi9cclxuICAgIGdlbmVyYXRlSTE4bkVudW1UZXh0KCl7XHJcbiAgICAgICAgaWYoIXRoaXMuZXhwb3J0Q29uc3RzKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDov5nkuKrmmK/ntKLlvJVcclxuICAgICAgICAgKi9cclxuICAgICAgICBsZXQgdGV4dDEgOiBzdHJpbmcgPSBcIi8v5q2k5paH5Lu25Li66Ieq5Yqo5a+85Ye677yM55So5LqOQ29tcG9uZW505Lit5Yqo5oCB6YCJ5oup6K+t6KiA5pe25YGa6Ieq5Yqo5YiH5o2i55So77yM5peg5YW25LuW5oSP5LmJ77yM6Ieq5Yqo5L+u5pS55ZCO5LiL5qyh5a+85Ye65Lya6KKr6KaG55uWXFxuXCI7XHJcbiAgICAgICAgdGV4dDEgKz0gXCIvL+iLpeaDs+WinuWKoOaWsOeahOivreiogO+8jOivt+aJk+W8gF9jb25maWcvRF/lpJror63oqIAv6K+t6KiA6YWN572uX2kxOG5fbGFuZ3VhZ2VfY29uZmlnX2RiLnhsc3jkuK3lop7liqBcXG5cIjtcclxuICAgICAgICB0ZXh0MSArPSBcIi8v5aSa6K+t6KiA5Zu+54mH6LWE5rqQ5pS+5Yiw5q+P5LiqYnVuZGxl5LiL55qEaTE4buebruW9leS4i++8jOaWsOW7uuivpeivreiogOeahOaWh+S7tuWkue+8jOaWh+S7tuWkueWQjeWtl+S4uuS4iuiviXhsc3jooajkuK3nmoRpZOWIl+eahOWQjeWtl+OAglxcblwiO1xyXG4gICAgICAgIHRleHQxICs9IFwiLy/lpJror63oqIDlm77niYfotYTmupDor7fmiYvliqjojrflj5bvvIzmiJbogIXlnKjliIfmjaLor63oqIDnmoTml7blgJnlhajpg6jliqDovb3lkI7nm7TmjqXkvb/nlKhcXG5cIjtcclxuICAgICAgICB0ZXh0MSArPSBcIlxcblxcblwiO1xyXG4gICAgICAgIHRleHQxICs9IFwiZXhwb3J0IGVudW0gTGFuZ3VhZ2VJbmRleCB7XFxuXCI7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog6L+Z5Liq5piv55yf5a6e55qE5ZCN5a2XXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgbGV0IHRleHQyIDogc3RyaW5nID0gXCJleHBvcnQgY29uc3QgTGFuZ3VhZ2VLZXkgOiBzdHJpbmdbXSA9IFsgXFxuXCI7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmV4cG9ydENvbnN0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCB2ID0gdGhpcy5leHBvcnRDb25zdHNbaV07XHJcblxyXG4gICAgICAgICAgICAvLyDmj5Dlj5ZleHBvcnRDb25zdOS4reeahOWPmOmHj1xyXG4gICAgICAgICAgICBsZXQgW3Zhcm5hbWUsIGtleUZpZWxkTmFtZSwgdmFsdWVGaWVsZE5hbWVdID0gdjtcclxuXHJcbiAgICAgICAgICAgIC8vIOaPkOWPlmZpZWxkXHJcbiAgICAgICAgICAgIGxldCBrZXlGaWVsZCA9IHRoaXMuZ2V0RmllbGRCeU5hbWUoa2V5RmllbGROYW1lKTtcclxuICAgICAgICAgICAgbGV0IHZhbHVlRmllbGQgPSB0aGlzLmdldEZpZWxkQnlOYW1lKHZhbHVlRmllbGROYW1lKTtcclxuICAgICAgICAgICAgaWYgKCFrZXlGaWVsZCB8fCAhdmFsdWVGaWVsZCkgY29udGludWU7XHJcbiAgICAgICAgICAgIGlmKGtleUZpZWxkLm5hbWUgIT0gJ2lkJyl7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyDmj5Dlj5bmlbDmja5cclxuICAgICAgICAgICAgbGV0IG1hcCA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLmZvckRiKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQga2V5ID0gZGF0YVtrZXlGaWVsZE5hbWVdO1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gZGF0YVt2YWx1ZUZpZWxkTmFtZV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGtleSAhPSBudWxsICYmIHZhbHVlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBtYXBba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAvLyDmjIlrZXnmjpLluo/lkI7pgY3ljoZcclxuICAgICAgICAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMobWFwKTtcclxuICAgICAgICAgICAgIC8va2V5cy5zb3J0KCk7XHJcbiAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGtleXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBrZXkgICAgPSBrZXlzW2pdO1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlICA9IG1hcFtrZXldO1xyXG5cclxuICAgICAgICAgICAgICAgIGtleSA9IGtleS5yZXBsYWNlKC8gL2csICdfJyk7Ly9yZXBsYWNlKC8tL2csICdfJykuXHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlVGV4dCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlRmllbGQudHNUeXBlID09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVUZXh0ID0gU3RyaW5nKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVUZXh0ID0gYCcke3ZhbHVlfSdgO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGV4dDEgKz0gXCIgICAgXCIgKyBrZXkgKyBcIiA9IFwiICsgaiArIFwiLFxcblwiO1xyXG4gICAgICAgICAgICAgICAgdGV4dDIgKz0gXCIgICAgJ1wiICsga2V5ICsgXCInLFxcblwiO1xyXG4gICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgdGV4dDEgKz0gXCJ9OyBcXG5cIjtcclxuICAgICAgICAgICAgIHRleHQyICs9IFwiXTsgXFxuXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdGV4dDMgPSBcIi8qKiBcXG5cIjtcclxuICAgICAgICB0ZXh0MyArPSBcIiAqIOagueaNruS8oOWFpeeahOivreiogOeahGtlee+8jOi/lOWbnuivreiogOeahGVudW3nmoTntKLlvJXvvIzlpoLmnpzmsqHmnInvvIzliJnov5Tlm54tMSBcXG5cIjtcclxuICAgICAgICB0ZXh0MyArPSBcIiAqIEBwYXJhbSBuYW1lIFxcblwiO1xyXG4gICAgICAgIHRleHQzICs9IFwiICogQHJldHVybnMgXFxuXCI7XHJcbiAgICAgICAgdGV4dDMgKz0gXCIgKi8gXFxuXCI7XHJcbiAgICAgICAgdGV4dDMgKz0gXCJleHBvcnQgZnVuY3Rpb24gZ2V0TGFuZ3VhZ2VJbmRleEJ5S2V5KG5hbWUgOiBzdHJpbmcpIDogTGFuZ3VhZ2VJbmRleCB8IG51bWJlciB7IFxcblwiO1xyXG4gICAgICAgIHRleHQzICs9IFwiICAgIHJldHVybiBMYW5ndWFnZUtleS5pbmRleE9mKG5hbWUpOyBcXG5cIjtcclxuICAgICAgICB0ZXh0MyArPSBcIn0gXFxuXCI7XHJcbiAgICAgICAgdGV4dDMgKz0gXCJcXG5cIjtcclxuICAgICAgICB0ZXh0MyArPSBcIi8qKlxcbiAqIOWwhuacjeWKoeWZqOS8oOmAkui/h+adpeeahOivreiogOS7o+egge+8jOi9rOaNouS4uuacrOWcsOeahOivreiogOS7o+eggVxcbiAqIEBwYXJhbSBzZXJ2ZXJLZXkgXFxuICovXFxuXCI7XHJcbiAgICAgICAgdGV4dDMgKz0gXCJleHBvcnQgZnVuY3Rpb24gc2VydmVyTGFuZ3VhZ2VLZXlUb0xvY2FsKHNlcnZlcktleSA6IHN0cmluZykgOiBzdHJpbmcgeyBcXG5cIjtcclxuICAgICAgICB0ZXh0MyArPSBcIiAgICByZXR1cm4gcmVzb3VyY2VzRGIuSTE4Tl9MYW5ndWFnZV9Db2RlW3NlcnZlcktleV07IFxcblwiO1xyXG4gICAgICAgIHRleHQzICs9IFwifVxcblwiO1xyXG5cclxuICAgICAgICByZXR1cm4gdGV4dDEgKyBcIlxcblwiICsgdGV4dDIgKyBcIlxcblwiICsgdGV4dDM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlr7zlh7pkYi5kLnRz5Lit5L2/55So55qE5paH5pysXHJcbiAgICAgKi9cclxuICAgIGdlbmVyYXRlRGJkdHNDb25zdHNUZXh0KG1vZHVsZU5hbWUgOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZXhwb3J0Q29uc3RzKSByZXR1cm4gXCJcIjtcclxuXHJcbiAgICAgICAgbGV0IHRleHQgPSBcIlwiO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZXhwb3J0Q29uc3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmV4cG9ydENvbnN0c1tpXTtcclxuXHJcbiAgICAgICAgICAgIC8vIOaPkOWPlmV4cG9ydENvbnN05Lit55qE5Y+Y6YePXHJcbiAgICAgICAgICAgIGxldCBbdmFybmFtZSwga2V5RmllbGROYW1lLCB2YWx1ZUZpZWxkTmFtZV0gPSB2O1xyXG5cclxuICAgICAgICAgICAgLy8g5o+Q5Y+WZmllbGRcclxuICAgICAgICAgICAgbGV0IGtleUZpZWxkID0gdGhpcy5nZXRGaWVsZEJ5TmFtZShrZXlGaWVsZE5hbWUpO1xyXG4gICAgICAgICAgICBsZXQgdmFsdWVGaWVsZCA9IHRoaXMuZ2V0RmllbGRCeU5hbWUodmFsdWVGaWVsZE5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoIWtleUZpZWxkIHx8ICF2YWx1ZUZpZWxkKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIOWGmeWFpeazqOmHilxyXG4gICAgICAgICAgICBpZiAoa2V5RmllbGQuZGVzYykge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBgICAgIC8qKiAke2tleUZpZWxkLmRlc2N9ICovXFxuYDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIGV4cG9ydCBjb25zdCAlczoge1xcbicsIHZhcm5hbWUpO1xyXG5cclxuICAgICAgICAgICAgLy8g5o+Q5Y+W5pWw5o2uXHJcbiAgICAgICAgICAgIGxldCBtYXAgPSB7fTtcclxuICAgICAgICAgICAgdGhpcy5mb3JEYigoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGtleSA9IGRhdGFba2V5RmllbGROYW1lXTtcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IGRhdGFbdmFsdWVGaWVsZE5hbWVdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChrZXkgIT0gbnVsbCAmJiB2YWx1ZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFwW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyDmjIlrZXnmjpLluo/lkI7pgY3ljoZcclxuICAgICAgICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhtYXApO1xyXG4gICAgICAgICAgICAvL+aUvuW8g+aOkuW6j1xyXG4gICAgICAgICAgICAvL2tleXMuc29ydCgpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGtleXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBrZXkgPSBrZXlzW2pdO1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gbWFwW2tleV07XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlVGV4dCA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWVGaWVsZC50c1R5cGUgPT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZVRleHQgPSBTdHJpbmcodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZVRleHQgPSBgJyR7dmFsdWV9J2A7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAga2V5ID0ga2V5LnJlcGxhY2UoLyAvZywgJ18nKTsvL3JlcGxhY2UoLy0vZywgJ18nKS5cclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiICAgICAgICBbJyVzJ106ICVzLFxcblwiLCBrZXksIHZhbHVlVGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRleHQgKz0gXCJ9XFxuXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGV4dDtcclxuICAgIH1cclxuXHJcbiAgICBjYW5FeHBvcnQoKSB7XHJcbiAgICAgICAgbGV0IHR5cGVfMl92YWxpZCA9IHtcclxuICAgICAgICAgICAgSTogdHJ1ZSxcclxuICAgICAgICAgICAgRjogdHJ1ZSxcclxuICAgICAgICAgICAgUzogdHJ1ZSxcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvLyDmmK/lkKbog73lr7zlh7pcclxuICAgICAgICBzd2l0Y2ggKHRoaXMucnVsZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwibVwiOiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFqb3JGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFtYWpvckZpZWxkKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gISF0eXBlXzJfdmFsaWRbbWFqb3JGaWVsZC50eXBlXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwibWFcIjoge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1ham9yRmllbGQgPSB0aGlzLmZpZWxkc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghbWFqb3JGaWVsZCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICEhdHlwZV8yX3ZhbGlkW21ham9yRmllbGQudHlwZV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1tXCI6IHtcclxuICAgICAgICAgICAgICAgIGxldCBtYWpvckZpZWxkID0gdGhpcy5maWVsZHNbMF07XHJcbiAgICAgICAgICAgICAgICBsZXQgbWlub3JGaWVsZCA9IHRoaXMuZmllbGRzWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFtYWpvckZpZWxkIHx8ICFtaW5vckZpZWxkKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gISF0eXBlXzJfdmFsaWRbbWFqb3JGaWVsZC50eXBlXSAmJiAhIXR5cGVfMl92YWxpZFttaW5vckZpZWxkLnR5cGVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJhXCI6IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDliKTmlq3mmK/lkKblj6/ku6XlkIjlubZcclxuICAgICAqIDEuIOaJgOacieWtl+auteWQjeOAgeWtl+auteexu+Wei+W/hemhu+ebuOWQjFxyXG4gICAgICogMi4gaWTkuI3og73lhrLnqoHvvIjmjInnhadt44CBbWHjgIFtbeWIhuWIq+WkhOeQhu+8iVxyXG4gICAgICogQHJldHVybnMgZXJyTXNnXHJcbiAgICAgKi9cclxuICAgIGNhbk1lcmdlKGRiKSB7XHJcbiAgICAgICAgLy8gMS4g5qOA5p+l5a2X5q61XHJcbiAgICAgICAgaWYgKHRoaXMuZmllbGRzLmxlbmd0aCAhPSBkYi5maWVsZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIuWtl+auteaVsOmHj+S4jeS4gOiHtFwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgZjEgPSB0aGlzLmZpZWxkc1tpXTtcclxuICAgICAgICAgICAgbGV0IGYyID0gZGIuZmllbGRzW2ldO1xyXG4gICAgICAgICAgICBpZiAoZjEubmFtZSAhPSBmMi5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9vbHMuZm9ybWF0KFwi5a2X5q61WyVkXSDlrZfmrrXlkI3kuI3lkIzvvJogbmFtZTE9WyVzXSwgbmFtZTI9WyVzXVwiLCBpLCBmMS5uYW1lLCBmMi5uYW1lKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGYxLnR5cGUgIT0gZjIudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFRvb2xzLmZvcm1hdChcIuWtl+autVslc13nsbvlnovkuI3lkIzvvJogdHlwZTE9WyVzXSwgdHlwZTI9WyVzXVwiLCBmMS5uYW1lLCBmMS50eXBlLCBmMi50eXBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g5qOA5p+lcnVsZVxyXG4gICAgICAgIGlmICh0aGlzLnJ1bGUgIT0gZGIucnVsZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gVG9vbHMuZm9ybWF0KFwicnVsZeS4jeWQjO+8miBydWxlMT1bJXNdLCBydWxlMj1bJXNdXCIsIHRoaXMucnVsZSwgZGIucnVsZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyDmo4Dmn6XmlbDmja7mmK/lkKbph43lpI1cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmRhdGFzKVxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGRiLmRhdGFzKVxyXG4gICAgICAgIHN3aXRjaCAodGhpcy5ydWxlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJtXCI6IHtcclxuICAgICAgICAgICAgICAgIGxldCBtYWpvckZpZWxkID0gdGhpcy5maWVsZHNbMF07XHJcbiAgICAgICAgICAgICAgICBsZXQgbXNnID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAoZGIuZGF0YXMsIChtYWpvcklkLCBkYXRhMikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBkYXRhMSA9IHRoaXMuZGF0YXNbbWFqb3JJZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGExKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1zZyA9IFRvb2xzLmZvcm1hdChcIuaVsOaNrumHjeWkje+8miVzPVslc11cIiwgbWFqb3JGaWVsZC5uYW1lLCBtYWpvcklkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobXNnKSByZXR1cm4gbXNnO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1hXCI6IHtcclxuICAgICAgICAgICAgICAgIC8vIG1h55qE6YOo5YiG55u05o6l5ZCI5bm2XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwibW1cIjoge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1ham9yRmllbGQgPSB0aGlzLmZpZWxkc1swXTtcclxuICAgICAgICAgICAgICAgIGxldCBtaW5vckZpZWxkID0gdGhpcy5maWVsZHNbMV07XHJcbiAgICAgICAgICAgICAgICBsZXQgbXNnID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAoZGIuZGF0YXMsIChtYWpvcklkLCBtYXAyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1hcDEgPSB0aGlzLmRhdGFzW21ham9ySWRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbWFwMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBtYWpvcklk5a+55bqU55qEbWFwMeacquaJvuWIsO+8jOebtOaOpXJldHVyblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAobWFwMiwgKG1pbm9ySWQsIGRhdGEyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkYXRhMSA9IG1hcDFbbWlub3JJZF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXNnID0gVG9vbHMuZm9ybWF0KFwi5pWw5o2u6YeN5aSN77yaJXM9WyVzXSAlcz1bJXNdXCIsIG1ham9yRmllbGQubmFtZSwgbWFqb3JJZCwgbWlub3JGaWVsZC5uYW1lLCBtaW5vcklkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtc2cpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobXNnKSByZXR1cm4gbXNnO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcImFcIjoge1xyXG4gICAgICAgICAgICAgICAgLy8gYeaooeW8j+S4jeajgOafpWlkXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgbWVyZ2VEYihkYikge1xyXG4gICAgICAgIC8vIOS9v+eUqG1lcmdlRGLliY3vvIzor7fnoa7kv53kvb/nlKjkuoZjaGVja+aOpeWPo+i/m+ihjOajgOa1i+OAglxyXG4gICAgICAgIHN3aXRjaCAodGhpcy5ydWxlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJtXCI6IHtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAoZGIuZGF0YXMsIChtYWpvcklkLCBkYXRhMikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YXNbbWFqb3JJZF0gPSBkYXRhMjtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1hXCI6IHtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAoZGIuZGF0YXMsIChtYWpvcklkLCBhcnIyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFycjEgPSB0aGlzLmRhdGFzW21ham9ySWRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghYXJyMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDnm7TmjqXkvb/nlKhhcnIyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YXNbbWFqb3JJZF0gPSBhcnIyO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWQiOW5tuaVsOe7hFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycjIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEyID0gYXJyMltpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycjEucHVzaChkYXRhMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJtbVwiOiB7XHJcbiAgICAgICAgICAgICAgICBUb29scy5mb3JFYWNoTWFwKGRiLmRhdGFzLCAobWFqb3JJZCwgbWFwMikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtYXAxID0gdGhpcy5kYXRhc1ttYWpvcklkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hcDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g55u05o6l5L2/55SobWFwMlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGFzW21ham9ySWRdID0gbWFwMjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlkIjlubZtYXBcclxuICAgICAgICAgICAgICAgICAgICAgICAgVG9vbHMuZm9yRWFjaE1hcChtYXAyLCAobWlub3JJZCwgZGF0YTIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcDFbbWlub3JJZF0gPSBkYXRhMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwiYVwiOiB7XHJcbiAgICAgICAgICAgICAgICAvLyDlkIjlubbmlbDnu4RcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGIuZGF0YXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhMiA9IGRiLmRhdGFzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YXMucHVzaChkYXRhMik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g5ZCI5bm25Y6f5aeL5pWw5o2uXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYi5vcmlnaW5EYXRhcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhMiA9IGRiLm9yaWdpbkRhdGFzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbkRhdGFzLnB1c2goZGF0YTIpO1xyXG5cclxuICAgICAgICAgICAgbGV0IG5ld0luZGV4ID0gdGhpcy5vcmlnaW5EYXRhcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICBsZXQgW29yaWdpbkZpbGVQYXRoLCBvcmlnaW5TaGVldE5hbWUsIG9yaWdpblJvd10gPSBkYi5vcmlnaW5EYXRhSW5kZXhfMl9vcmlnaW5GaWxlUGF0aF9vcmlnaW5TaGVldE5hbWVfb3JpZ2luUm93W2ldO1xyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbkRhdGFJbmRleF8yX29yaWdpbkZpbGVQYXRoX29yaWdpblNoZWV0TmFtZV9vcmlnaW5Sb3dbbmV3SW5kZXhdID0gW29yaWdpbkZpbGVQYXRoLCBvcmlnaW5TaGVldE5hbWUsIG9yaWdpblJvd107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyDlkIjlubborablkYpcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRiLndhcm5Mb2cubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbG9nID0gZGIud2FybkxvZ1tpXTtcclxuICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2gobG9nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4gICAgLy8vLy8g6Z2Z5oCB5Yqg6L295pa55rOVIC8vLy8vXHJcbiAgICBzdGF0aWMgX2NhbGNDZWxsQ29vcmQocm93LCBjb2wpIHtcclxuICAgICAgICByZXR1cm4gVG9vbHMuZm9ybWF0KFwiJXMlZFwiLCBDT0xfMl9OQU1FW2NvbF0sIHJvdyArIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBsb2FkRGF0YUJhc2VGcm9tUmF3RGF0YShvcmlnaW5GaWxlUGF0aCA6IHN0cmluZywgcmF3RGF0YSA6IHtuYW1lIDogc3RyaW5nLGRhdGEgOiBzdHJpbmdbXVtdfSkge1xyXG4gICAgICAgIGxldCBkYiA9IG5ldyBEYkJ1bmRsZURhdGFCYXNlKCk7XHJcbiAgICAgICAgZGIub3JpZ2luRmlsZVBhdGggPSBvcmlnaW5GaWxlUGF0aDtcclxuICAgICAgICBkYi5vcmlnaW5TaGVldE5hbWUgPSByYXdEYXRhLm5hbWU7XHJcblxyXG4gICAgICAgIGxldCBmaWVsZHMgOiBEYXRhQmFzZUZpZWxkW10gID0gW107XHJcbiAgICAgICAgbGV0IGZpZWxkTWFwID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcbiAgICAgICAgbGV0IG9yaWdpbkRhdGFzID0gW107XHJcbiAgICAgICAgLy8gbGV0IG9yaWdpbkRhdGFJbmRleF8yX29yaWdpblJvdyA9IHt9O1xyXG4gICAgICAgIGxldCBvcmlnaW5EYXRhSW5kZXhfMl9vcmlnaW5GaWxlUGF0aF9vcmlnaW5TaGVldE5hbWVfb3JpZ2luUm93ID0ge307XHJcbiAgICAgICAgbGV0IGV4cG9ydENvbnN0cyA6IFtzdHJpbmcsc3RyaW5nLHN0cmluZ11bXSA9IFtdO1xyXG5cclxuICAgICAgICBsZXQgY2hlY2tJZEVtcHR5RmllbGRJbmRlaWVzID0gW107XHJcblxyXG4gICAgICAgIGxldCBiRXhwb3J0S2V5ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIOWKoOW3peaVsOaNrlxyXG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHJhd0RhdGEuZGF0YS5sZW5ndGg7IHJvdysrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJvd0RhdGEgPSByYXdEYXRhLmRhdGFbcm93XSB8fCBbXTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjbWQgPSByb3dEYXRhWzBdO1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoIChjbWQpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJEQl9OQU1FXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBkYi5uYW1lID0gcm93RGF0YVsxXTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJEQl9SVUxFXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBkYi5ydWxlID0gcm93RGF0YVsxXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMjsgaSA8IHJvd0RhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IHJvd0RhdGFbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ID09IFwiZXhwb3J0X2tleVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGIucnVsZSA9PSBcImFcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoVG9vbHMuZm9ybWF0KFwiW+itpuWRil0g6YWN572u6KGoJXPlr7zlh7rop4TliJnkuLph77yM5peg5rOV5a+85Ye6a2V55Li65bi46YeP44CCXCIsIGRiLm5hbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYkV4cG9ydEtleSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoZGIucnVsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYVwiOiBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm1hXCI6IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwibW1cIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrSWRFbXB0eUZpZWxkSW5kZWllcyA9IFsxXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tJZEVtcHR5RmllbGRJbmRlaWVzID0gWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJFWFBPUlRfQ09OU1RcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YXJuYW1lID0gcm93RGF0YVsxXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQga2V5RmllbGROYW1lID0gcm93RGF0YVsyXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWVGaWVsZE5hbWUgPSByb3dEYXRhWzNdO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cG9ydENvbnN0cy5wdXNoKFt2YXJuYW1lLCBrZXlGaWVsZE5hbWUsIHZhbHVlRmllbGROYW1lXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiRkxEX1RZUEVcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jOWHuueOsOmHjeWkjeeahEZMRF9UWVBF5a6a5LmJ77yBXCIsIGRiLm5hbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyDmj5Dlj5blrZfmrrXnsbvlnovvvIzmsqHmnInphY3nva7lrZfmrrXnsbvlnovnmoTliJfpg73kuI3lr7zlh7pcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBjb2wgPSAxOyBjb2wgPCByb3dEYXRhLmxlbmd0aDsgY29sKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSByb3dEYXRhW2NvbF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gbmV3IERhdGFCYXNlRmllbGQoZGIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQudHlwZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQub3JpZ2luQ29sID0gY29sO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQudHNUeXBlID0gZmllbGQuY2FsY1RzVHlwZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZmllbGQudHNUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlh7rnjrDmnKrnn6XmlbDmja7nsbvlnovvvIHlrZfmrrXliJdbJWRdLCDmlbDmja7nsbvlnotbJXNd77yBXCIsIGRiLm5hbWUsIGNvbCwgdmFsdWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRzLnB1c2goZmllbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcIkZMRF9OQU1FXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZCA9IGZpZWxkc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gcm93RGF0YVtmaWVsZC5vcmlnaW5Db2xdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZCA9IGZpZWxkc1tpXVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZC5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlrZfmrrXlkI3ooqvopobnm5ZbJXNdLT5bJXNdXCIsIGRiLm5hbWUsIGZpZWxkLm5hbWUsIHZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC5uYW1lID0gdmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkTWFwLmhhcyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jOWHuueOsOmHjeWkjeWtl+auteWQjVslc11cIiwgZGIubmFtZSwgdmFsdWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRNYXAuYWRkKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJGTERfREVTQ1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBmaWVsZHNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHJvd0RhdGFbZmllbGQub3JpZ2luQ29sXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBmaWVsZHNbaV1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGQuZGVzYykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLmRlc2MgPSBmaWVsZC5kZXNjICsgXCJcXG5cIiArIHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC5kZXNjID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiRkxEX1ZFUklGWUVSXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZCA9IGZpZWxkc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gcm93RGF0YVtmaWVsZC5vcmlnaW5Db2xdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZCA9IGZpZWxkc1tpXVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLnZlcmlmeWVycy5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJGTERfSURfTUVSR0VfVE9cIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZmllbGRzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSByb3dEYXRhW2ZpZWxkLm9yaWdpbkNvbF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gZmllbGRzW2ldXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkLmlkTWVyZ2VUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yMaWRNZXJnZVRv6KKr6KaG55uWWyVzXS0+WyVzXVwiLCBkYi5uYW1lLCBmaWVsZC5pZE1lcmdlVG8sIHZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC5pZE1lcmdlVG8gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJGTERfQ09OVkVSVF9NQVBcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZmllbGRzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSByb3dEYXRhW2ZpZWxkLm9yaWdpbkNvbF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gZmllbGRzW2ldXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkLmNvbnZlcnRNYXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jGNvbnZlcnRNYXDooqvopobnm5ZbJXNdLT5bJXNdXCIsIGRiLm5hbWUsIGZpZWxkLmNvbnZlcnRNYXAsIHZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC5jb252ZXJ0TWFwID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiREFUQVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRhdGEgOiB7W2tleSA6IHN0cmluZ10gOiBhbnl9ID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g6Z2e56m65qOA5rWLXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJDaGVja1Bhc3MgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hlY2tJZEVtcHR5RmllbGRJbmRlaWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkSW5kZXggPSBjaGVja0lkRW1wdHlGaWVsZEluZGVpZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZCA9IGZpZWxkc1tmaWVsZEluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmaWVsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJjaGVja0lkRW1wdHlGaWVsZEluZGVpZXMgZmllbGQgbm90IGZvdW5kXCIsIGRiLm5hbWUsIGZpZWxkSW5kZXgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSByb3dEYXRhW2ZpZWxkLm9yaWdpbkNvbF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8ICh0eXBlb2YgdmFsdWUgPT0gXCJzdHJpbmdcIiAmJiB2YWx1ZSA9PSBcIlwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzkuLvopoFpZOWtl+autVslc13kuI3og73kuLrnqbrvvIHor7fmo4Dmn6XnrKwlZOihjOOAglwiLCBkYi5uYW1lLCBmaWVsZC5uYW1lLCByb3cgKyAxKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiQ2hlY2tQYXNzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFiQ2hlY2tQYXNzKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBmaWVsZHNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHJvd0RhdGFbZmllbGQub3JpZ2luQ29sXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNlbGxDb29yZCA9IHRoaXMuX2NhbGNDZWxsQ29vcmQocm93LCBmaWVsZC5vcmlnaW5Db2wpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2ZpZWxkLm5hbWVdID0gZmllbGQucGFyc2VWYWx1ZSh2YWx1ZSwgY2VsbENvb3JkKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luRGF0YXMucHVzaChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5EYXRhSW5kZXhfMl9vcmlnaW5GaWxlUGF0aF9vcmlnaW5TaGVldE5hbWVfb3JpZ2luUm93W29yaWdpbkRhdGFzLmxlbmd0aCAtIDFdID0gW29yaWdpbkZpbGVQYXRoLCBkYi5vcmlnaW5TaGVldE5hbWUsIHJvd107XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiTUVSR0VfRkxEX05BTUVcIjpcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJGTERfTUVSR0VfVE9fQVJSXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBmaWVsZHNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHJvd0RhdGFbZmllbGQub3JpZ2luQ29sXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBmaWVsZHNbaV1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGQubWVyZ2VUb0FyckZpZWxkTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yMRkxEX01FUkdFX1RPX0FSUuiiq+imhuebllslc10tPlslc11cIiwgZGIubmFtZSwgZmllbGQubWVyZ2VUb0FyckZpZWxkTmFtZSwgdmFsdWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLm1lcmdlVG9BcnJGaWVsZE5hbWUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLmJNZXJnZVRvQXJyS2VlcEVtcHR5ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiRkxEX01FUkdFX1RPX0FSUl9LRUVQX0VNUFRZXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBmaWVsZHNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHJvd0RhdGFbZmllbGQub3JpZ2luQ29sXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBmaWVsZHNbaV1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGQubWVyZ2VUb0FyckZpZWxkTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yMRkxEX01FUkdFX1RPX0FSUl9LRUVQX0VNUFRZ6KKr6KaG55uWWyVzXS0+WyVzXVwiLCBkYi5uYW1lLCBmaWVsZC5tZXJnZVRvQXJyRmllbGROYW1lLCB2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQubWVyZ2VUb0FyckZpZWxkTmFtZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQuYk1lcmdlVG9BcnJLZWVwRW1wdHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIkZJTExfREVGQVVMVFwiOiAvLyDku4Xpkojlr7nnrKblkIjnsbvlnovlrZfmrrXvvIzlv73nlaXmlbDmja7plb/luqborablkYrvvIzkvb/nlKjnlKjpu5jorqTlgLzloavlhYXvvJpCPWZhbHNl77yMST0w77yMUz1cIlwi77yMRj0wXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBmaWVsZHNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHJvd0RhdGFbZmllbGQub3JpZ2luQ29sXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBmaWVsZHNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC5maWxsRGVmYXVsdFZhbHVlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGJFeHBvcnRLZXkpIHtcclxuICAgICAgICAgICAgbGV0IG1ham9yRmllbGQgPSBmaWVsZHNbMF07XHJcbiAgICAgICAgICAgIGV4cG9ydENvbnN0cy5wdXNoKFtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvcm1hdChcIiVzXyVzXCIsIGRiLm5hbWUudG9VcHBlckNhc2UoKSwgbWFqb3JGaWVsZC5uYW1lLnRvVXBwZXJDYXNlKCkpLFxyXG4gICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGIuc2V0RmllbGRzKGZpZWxkcyk7XHJcblxyXG4gICAgICAgIC8vIOagoemqjGV4cG9ydENvbnN0c1xyXG4gICAgICAgIGZvciAobGV0IGkgPSBleHBvcnRDb25zdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgbGV0IFt2YXJuYW1lLCBrZXlGaWVsZE5hbWUsIHZhbHVlRmllbGROYW1lXSA9IGV4cG9ydENvbnN0c1tpXTtcclxuXHJcbiAgICAgICAgICAgIGxldCBrZXlGaWVsZCA9IGRiLmdldEZpZWxkQnlOYW1lKGtleUZpZWxkTmFtZSk7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZUZpZWxkID0gZGIuZ2V0RmllbGRCeU5hbWUodmFsdWVGaWVsZE5hbWUpO1xyXG5cclxuICAgICAgICAgICAgLy8g5Y+Y6YeP5ZCNXHJcbiAgICAgICAgICAgIGlmICghdmFybmFtZSB8fCAha2V5RmllbGQgfHwgIXZhbHVlRmllbGQpIHtcclxuICAgICAgICAgICAgICAgIGRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yMRVhQT1JUX0NPTlNU6YWN572u5byC5bi477yBdmFybmFtZT1bJXNdIGtleUZpZWxkTmFtZT1bJXNdIHZhbHVlRmllbGROYW1lPVslc11cIiwgZGIubmFtZSwgdmFybmFtZSwga2V5RmllbGROYW1lLCB2YWx1ZUZpZWxkTmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgZXhwb3J0Q29uc3RzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGIuc2V0RXhwb3J0Q29uc3RzKGV4cG9ydENvbnN0cyk7XHJcbiAgICAgICAgZGIuc2V0T3JpZ2luRGF0YXMob3JpZ2luRGF0YXMsIG9yaWdpbkRhdGFJbmRleF8yX29yaWdpbkZpbGVQYXRoX29yaWdpblNoZWV0TmFtZV9vcmlnaW5Sb3cpO1xyXG4gICAgICAgIGRiLnByb2Nlc3NDb252ZXJ0TWFwKCk7XHJcbiAgICAgICAgLy8gZGIucHJvY2Vzc01lcmdlVG9BcnIoKTsgLy8g5Zyo6L+Z5ZCI5bm25Lya5a+86Ie06aqM6K+B5aSx6LSlXHJcbiAgICAgICAgcmV0dXJuIGRiO1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NDb252ZXJ0TWFwKCkge1xyXG4gICAgICAgIGZvciAobGV0IGZpZWxkSW5kZXggPSAwOyBmaWVsZEluZGV4IDwgdGhpcy5maWVsZHMubGVuZ3RoOyBmaWVsZEluZGV4KyspIHtcclxuICAgICAgICAgICAgY29uc3QgZmllbGQgPSB0aGlzLmZpZWxkc1tmaWVsZEluZGV4XTtcclxuICAgICAgICAgICAgaWYgKGZpZWxkLmNvbnZlcnRNYXApIHtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCfpnIDopoHlpITnkIZjb252ZXJ0TWFw6YC76L6RJywgdGhpcy5uYW1lLCBmaWVsZC5uYW1lLCBmaWVsZC5jb252ZXJ0TWFwKVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBtYXBGaWVsZHMgPSBmaWVsZC5jb252ZXJ0TWFwLnJlcGxhY2UoLyAqL2csIFwiXCIpLnNwbGl0KFwiO1wiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDop6PmnpB0eXBlXHJcbiAgICAgICAgICAgICAgICBsZXQgdHNUeXBlcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgbGV0IGRpbWVuc2lvbmFsID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB0eXBlSW5kZXggPSAwOyB0eXBlSW5kZXggPCBmaWVsZC50eXBlLmxlbmd0aDsgdHlwZUluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gZmllbGQudHlwZVt0eXBlSW5kZXhdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoQkFTSUNfVFlQRV8yX1RTX1RZUEVbdF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHNUeXBlcy5wdXNoKEJBU0lDX1RZUEVfMl9UU19UWVBFW3RdKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHQgPT0gXCJBXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGltZW5zaW9uYWwrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRzVHlwZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbmFsKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJiYXNpY1R5cGVzXCIsIHRzVHlwZXMpXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImRpbWVuc2lvbmFsXCIsIGRpbWVuc2lvbmFsKVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtYXBGaWVsZHMubGVuZ3RoICE9IHRzVHlwZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jGNvbnZlcnRNYXAnJXMnLT4lc+WSjOaVsOaNruexu+WeiyclcyctPiVz6ZW/5bqm5LiN5Yy56YWN77yB6K+35qOA5p+l5a2X5q615YiG6ZqU56ym5piv5ZCm5Li65YiG5Y+3JzsnXCIsIHRoaXMubmFtZSwgZmllbGQuY29udmVydE1hcCwgSlNPTi5zdHJpbmdpZnkobWFwRmllbGRzKSwgZmllbGQudHlwZSwgSlNPTi5zdHJpbmdpZnkodHNUeXBlcykpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZGltZW5zaW9uYWwgPj0gMykgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g5aSE55CGdHNUeXBlXHJcbiAgICAgICAgICAgICAgICBsZXQgdGVtcFN0ciA9IFwie1wiO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0c1R5cGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHNUeXBlID0gdHNUeXBlc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWFwRmllbGQgPSBtYXBGaWVsZHNbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBTdHIgKz0gVG9vbHMuZm9ybWF0KFwiJXM6ICVzXCIsIG1hcEZpZWxkLCB0c1R5cGUpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPCB0c1R5cGVzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcFN0ciArPSBcIiwgXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8ge2l0ZW1JZDogc3RyaW5nLCBhbW91bnQ6IG51bWJlcn1cclxuICAgICAgICAgICAgICAgIHRlbXBTdHIgKz0gXCJ9XCI7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRpbWVuc2lvbmFsID09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyB7aXRlbUlkOiBzdHJpbmcsIGFtb3VudDogbnVtYmVyfVtdXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcFN0ciArPSBcIltdXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBmaWVsZC50c1R5cGUgPSB0ZW1wU3RyO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIOW8gOWni+mBjeWOhuaVsOaNrlxyXG4gICAgICAgICAgICAgICAgdGhpcy5mb3JEYigoZGF0YSwgbWFqb3JJZCwgbWlub3JJZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiZm9yXCIsIG1ham9ySWQsIG1pbm9ySWQsIGRhdGEpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyDmjInnu7Tluqbov5vooYzkuI3lkIznmoTlpITnkIZcclxuICAgICAgICAgICAgICAgICAgICBsZXQgb3JpZ2luQXJyID0gZGF0YVtmaWVsZC5uYW1lXSB8fCBbXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGltZW5zaW9uYWwgPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWFwID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG1hcEZpZWxkSW5kZXggPSAwOyBtYXBGaWVsZEluZGV4IDwgbWFwRmllbGRzLmxlbmd0aDsgbWFwRmllbGRJbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXBGaWVsZCA9IG1hcEZpZWxkc1ttYXBGaWVsZEluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcFttYXBGaWVsZF0gPSBvcmlnaW5BcnJbbWFwRmllbGRJbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtmaWVsZC5uYW1lXSA9IG1hcDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkaW1lbnNpb25hbCA9PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtYXBzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3JpZ2luQXJyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdWJBcnIgPSBvcmlnaW5BcnJbaV0gfHwgW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG1hcCA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgbWFwRmllbGRJbmRleCA9IDA7IG1hcEZpZWxkSW5kZXggPCBtYXBGaWVsZHMubGVuZ3RoOyBtYXBGaWVsZEluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXBGaWVsZCA9IG1hcEZpZWxkc1ttYXBGaWVsZEluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXBbbWFwRmllbGRdID0gc3ViQXJyW21hcEZpZWxkSW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtmaWVsZC5uYW1lXSA9IG1hcDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXBzLnB1c2gobWFwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2ZpZWxkLm5hbWVdID0gbWFwcztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKiog5bCG5aSa5Liq5a2X5q615ZCI5bm25oiQ5LiA5Liq5pWw57uEICovXHJcbiAgICBwcm9jZXNzTWVyZ2VUb0FycigpIHtcclxuICAgICAgICBsZXQgYktlZXBFbXB0eSA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBoYXNNZXJnZUZsZCA9IGZhbHNlO1xyXG4gICAgICAgIC8vIOaJvuWIsOaJgOaciemcgOimgeWQiOW5tueahOWtl+autVxyXG4gICAgICAgIGxldCBtZXJnZU1hcCA9IHt9O1xyXG4gICAgICAgIGZvciAobGV0IGZpZWxkSW5kZXggPSAwOyBmaWVsZEluZGV4IDwgdGhpcy5maWVsZHMubGVuZ3RoOyBmaWVsZEluZGV4KyspIHtcclxuICAgICAgICAgICAgY29uc3QgZmllbGQgPSB0aGlzLmZpZWxkc1tmaWVsZEluZGV4XTtcclxuICAgICAgICAgICAgaWYgKGZpZWxkLm1lcmdlVG9BcnJGaWVsZE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChtZXJnZU1hcFtmaWVsZC5tZXJnZVRvQXJyRmllbGROYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1lcmdlTWFwW2ZpZWxkLm1lcmdlVG9BcnJGaWVsZE5hbWVdLnB1c2goZmllbGQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXJnZU1hcFtmaWVsZC5tZXJnZVRvQXJyRmllbGROYW1lXSA9IFtmaWVsZF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBoYXNNZXJnZUZsZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGJLZWVwRW1wdHkgPSAhIWZpZWxkLmJNZXJnZVRvQXJyS2VlcEVtcHR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJwcm9jZXNzTWVyZ2VUb0FyclwiLCBiS2VlcEVtcHR5KVxyXG5cclxuICAgICAgICBpZiAoIWhhc01lcmdlRmxkKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIOajgOafpeWQiOW5tuWtl+auteaYr+WQpuacieWGsueqgVxyXG4gICAgICAgIGZvciAobGV0IGZpZWxkSW5kZXggPSAwOyBmaWVsZEluZGV4IDwgdGhpcy5maWVsZHMubGVuZ3RoOyBmaWVsZEluZGV4KyspIHtcclxuICAgICAgICAgICAgbGV0IGZsZE5hbWUgPSB0aGlzLmZpZWxkc1tmaWVsZEluZGV4XS5uYW1lO1xyXG4gICAgICAgICAgICBpZiAobWVyZ2VNYXBbZmxkTmFtZV0pIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jOWQiOW5tuWtl+auteWSjOWOn+Wni+Wtl+auteWGsueqgVslc13vvIzlkIjlubblpLHotKUhXCIsIHRoaXMubmFtZSwgZmxkTmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgLy8g5Zug5Li65Yay56qB5LqG5bCx5LiN55+l6YGT5bqU6K+l5bmy5Zib5LqG77yM5omA5Lul55u05o6l6YCA5Ye677yM5ZCI5bm25aSx6LSlXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIOajgOafpeWtl+auteexu+Wei+aYr+WQpuS4gOiHtO+8iOWPquacieWQjOexu+Wei+Wtl+auteaJjeiDveWQiOW5tu+8iVxyXG4gICAgICAgIGZvciAobGV0IGsgaW4gbWVyZ2VNYXApIHtcclxuICAgICAgICAgICAgbGV0IGZsZExpc3QgPSBtZXJnZU1hcFtrXTtcclxuICAgICAgICAgICAgbGV0IG1ham9yRmllbGQgPSBmbGRMaXN0WzBdO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGZsZExpc3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBmaWVsZCA9IGZsZExpc3RbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAobWFqb3JGaWVsZC50eXBlICE9IGZpZWxkLnR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlkIjlubblrZfmrrVbJXNd5a2Y5ZyoRkxEX1RZUEXkuI3kuIDoh7RbJXNdWyVzXe+8jOWQiOW5tuWksei0pSFcIiwgdGhpcy5uYW1lLCBrLCBtYWpvckZpZWxkLnR5cGUsIGZpZWxkLnR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1ham9yRmllbGQuY29udmVydE1hcCAhPSBmaWVsZC5jb252ZXJ0TWFwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yM5ZCI5bm25a2X5q61WyVzXeWtmOWcqEZMRF9DT05WRVJUX01BUOS4jeS4gOiHtFslc11bJXNd77yM5ZCI5bm25aSx6LSlIVwiLCB0aGlzLm5hbWUsIGssIG1ham9yRmllbGQuY29udmVydE1hcCwgZmllbGQuY29udmVydE1hcCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJtZXJnZU1hcFwiLCBtZXJnZU1hcClcclxuXHJcblxyXG5cclxuICAgICAgICAvLyDov73liqDmlrDlrZfmrrXlkozmlrDmlbDmja5cclxuICAgICAgICBsZXQgY29sID0gdGhpcy5maWVsZHNbdGhpcy5maWVsZHMubGVuZ3RoIC0gMV0ub3JpZ2luQ29sICsgMTtcclxuICAgICAgICBmb3IgKGxldCBrIGluIG1lcmdlTWFwKSB7XHJcbiAgICAgICAgICAgIGxldCBmbGRMaXN0ID0gbWVyZ2VNYXBba107XHJcbiAgICAgICAgICAgIGxldCBtYWpvckZpZWxkID0gZmxkTGlzdFswXTtcclxuXHJcbiAgICAgICAgICAgIC8vIOa3u+WKoOaWsOWtl+autVxyXG4gICAgICAgICAgICBsZXQgbmV3RmllbGQgPSBuZXcgRGF0YUJhc2VGaWVsZChtYWpvckZpZWxkLmRiKTtcclxuICAgICAgICAgICAgbmV3RmllbGQubmFtZSA9IGs7XHJcbiAgICAgICAgICAgIG5ld0ZpZWxkLmRlc2MgPSBtYWpvckZpZWxkLmRlc2M7XHJcbiAgICAgICAgICAgIG5ld0ZpZWxkLnR5cGUgPSBtYWpvckZpZWxkLnR5cGUgKyBcIkFcIjtcclxuICAgICAgICAgICAgbmV3RmllbGQub3JpZ2luQ29sID0gY29sKys7XHJcbiAgICAgICAgICAgIG5ld0ZpZWxkLnRzVHlwZSA9IG1ham9yRmllbGQudHNUeXBlICsgXCJbXVwiO1xyXG4gICAgICAgICAgICB0aGlzLmZpZWxkcy5wdXNoKG5ld0ZpZWxkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOa3u+WKoOaWsOaVsOaNrlxyXG4gICAgICAgICAgICB0aGlzLmZvckRiKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWVyZ2VEYXRhID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBmbGRMaXN0Lmxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBmbGRMaXN0W2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gZGF0YVtmaWVsZC5uYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZGF0YVtmaWVsZC5uYW1lXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFiS2VlcEVtcHR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOaVsOaNruS4uuepuu+8jOWImei3s+i/h1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PSAwKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC52YWx1ZXModmFsdWUpLmV2ZXJ5KGZ1bmN0aW9uICh2KSB7IHJldHVybiB2ID09IHVuZGVmaW5lZDsgfSkpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5pWw5YC8MOS4jeihqOekuuepulxyXG4gICAgICAgICAgICAgICAgICAgIG1lcmdlRGF0YS5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBkYXRhW2tdID0gbWVyZ2VEYXRhO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g5Yig6Zmk5ZCI5bm255qE5a2X5q61XHJcbiAgICAgICAgZm9yIChsZXQgayBpbiBtZXJnZU1hcCkge1xyXG4gICAgICAgICAgICBsZXQgZmxkTGlzdCA9IG1lcmdlTWFwW2tdO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZsZExpc3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBpZHggPSB0aGlzLmZpZWxkcy5pbmRleE9mKGZsZExpc3RbaV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWVsZHMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGxvYWRGcm9tWGxzeEFzeW5jKGZpbGVQYXRoIDogc3RyaW5nLCBmT25Db21wbGV0ZWQgOiAoZGJzIDogRGJCdW5kbGVEYXRhQmFzZVtdKSA9PiB2b2lkKSB7XHJcbiAgICAgICAgbGV0IGRicyA6IERiQnVuZGxlRGF0YUJhc2VbXSA9IFtdO1xyXG5cclxuICAgICAgICAvLyDpgJrov4dub2RlLXhsc3jliqDovb3mlbDmja5cclxuICAgICAgICBUb29scy5sb2FkUmF3RGF0YXNGcm9tWGxzeEFzeW5jKGZpbGVQYXRoLCAocmF3RGF0YXMgOiB7bmFtZSA6IHN0cmluZyxkYXRhIDogc3RyaW5nW11bXX1bXSkgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBzaGVldEluZGV4ID0gMDsgc2hlZXRJbmRleCA8IHJhd0RhdGFzLmxlbmd0aDsgc2hlZXRJbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByYXdEYXRhID0gcmF3RGF0YXNbc2hlZXRJbmRleF07XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGRiID0gdGhpcy5sb2FkRGF0YUJhc2VGcm9tUmF3RGF0YShmaWxlUGF0aCwgcmF3RGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZGJzLnB1c2goZGIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmT25Db21wbGV0ZWQgJiYgZk9uQ29tcGxldGVkKGRicylcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhyYXdEYXRhcylcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgRGF0YUJhc2VGaWVsZCB7XHJcbiAgICBkYiA6IERiQnVuZGxlRGF0YUJhc2U7XHJcbiAgICBvcmlnaW5Db2wgOiBudW1iZXI7XHJcbiAgICBuYW1lIDogc3RyaW5nO1xyXG4gICAgdHlwZSA6IHN0cmluZztcclxuICAgIHRzVHlwZSA6IHN0cmluZztcclxuICAgIGRlc2MgOiBzdHJpbmc7XHJcbiAgICB2ZXJpZnllcnMgPSBbXTtcclxuICAgIGlkTWVyZ2VUbztcclxuICAgIGNvbnZlcnRNYXA7XHJcbiAgICBmaWxsRGVmYXVsdFZhbHVlID0gbnVsbDtcclxuICAgIGJNZXJnZVRvQXJyS2VlcEVtcHR5ID0gZmFsc2U7XHJcbiAgICBtZXJnZVRvQXJyRmllbGROYW1lO1xyXG4gICAgc3RhdGljIHBhcnNlVmFsdWVDYWNoZSA6IHtba2V5IDogc3RyaW5nXSA6IHt9fSA9IHt9O1xyXG4gXHJcbiAgICBjb25zdHJ1Y3RvcihkYiA6IERiQnVuZGxlRGF0YUJhc2UpIHtcclxuICAgICAgICB0aGlzLmRiID0gZGI7XHJcbiAgICAgICAgdGhpcy52ZXJpZnllcnMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjb25zdHJ1Y3RvciAoa2V5LCB0eXBlLCBkZXNjLCB2ZXJpZnllcikge1xyXG4gICAgLy8gICAgIHRoaXMua2V5ID0ga2V5O1xyXG4gICAgLy8gICAgIHRoaXMudHlwZSA9IHR5cGU7XHJcbiAgICAvLyAgICAgdGhpcy5kZXNjID0gZGVzYztcclxuICAgIC8vICAgICB0aGlzLnZlcmlmeWVyID0gdmVyaWZ5ZXIgfHwgW107XHJcbiAgICAvLyB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDojrflj5Z0c+S4reeahOexu+Wei1xyXG4gICAgICogQHJldHVybnNcclxuICAgICAqL1xyXG4gICAgY2FsY1RzVHlwZSgpIHtcclxuICAgICAgICAvLyDmo4Dmn6XmmK/kuLrln7rnoYDnsbvlnotcclxuICAgICAgICBpZiAoQkFTSUNfVFlQRV8yX1RTX1RZUEVbdGhpcy50eXBlXSkge1xyXG4gICAgICAgICAgICByZXR1cm4gQkFTSUNfVFlQRV8yX1RTX1RZUEVbdGhpcy50eXBlXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnR5cGUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAvLyDlpI3lkIjnsbvlnotcclxuICAgICAgICAgICAgLy8g5L6d5qyh6YGN5Y6GdHlwZeeahOWtl+avjVxyXG5cclxuICAgICAgICAgICAgbGV0IHRzVHlwZXMgPSBbXTtcclxuICAgICAgICAgICAgbGV0IGRpbWVuc2lvbmFsID0gMDtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50eXBlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ID0gdGhpcy50eXBlW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCB0c1R5cGUgPSBCQVNJQ19UWVBFXzJfVFNfVFlQRVt0XTtcclxuICAgICAgICAgICAgICAgIGlmICh0c1R5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0c1R5cGVzLnB1c2godHNUeXBlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodCA9PSBcIkFcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbmFsKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0c1R5cGVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbmFsKys7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIOWPquaUr+aMgTF+Mue7tOaVsOe7hFxyXG4gICAgICAgICAgICBpZiAoZGltZW5zaW9uYWwgPj0gMyB8fCBkaW1lbnNpb25hbCA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yM5L2/55So5LqG5LiN5pSv5oyB55qEJWTnu7TmlbDnu4TvvJpbJXNdXCIsIHRoaXMuZGIubmFtZSwgZGltZW5zaW9uYWwsIHRoaXMudHlwZSkpO1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS53YXJuKFwi5Y+q5pSv5oyBMX4y57u05pWw57uEXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChkaW1lbnNpb25hbCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHNUeXBlcy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBUb29scy5mb3JtYXQoXCIlc1tdXCIsIHRzVHlwZXMuam9pbihcIiwgXCIpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHNUeXBlcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBUb29scy5mb3JtYXQoXCJhbnlbXVwiLCB0c1R5cGVzLmpvaW4oXCIsIFwiKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBUb29scy5mb3JtYXQoXCJbJXNdXCIsIHRzVHlwZXMuam9pbihcIiwgXCIpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkaW1lbnNpb25hbCA9PSAyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHNUeXBlcy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBUb29scy5mb3JtYXQoXCIlc1tdW11cIiwgdHNUeXBlcy5qb2luKFwiLCBcIikpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0c1R5cGVzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFRvb2xzLmZvcm1hdChcImFueVtdW11cIiwgdHNUeXBlcy5qb2luKFwiLCBcIikpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVG9vbHMuZm9ybWF0KFwiWyVzXVtdXCIsIHRzVHlwZXMuam9pbihcIiwgXCIpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gaWYgKHRzVHlwZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAvLyAgICAgbGV0IHRzVHlwZVRleHQgPSBUb29scy5mb3JtYXQoXCJbJXNdXCIsIHRzVHlwZXMuam9pbihcIiwgXCIpKTtcclxuICAgICAgICAgICAgLy8gICAgIGZvciAobGV0IGkgPSAxOyBpIDwgZGltZW5zaW9uYWw7IGkrKykge1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIHRzVHlwZVRleHQgKz0gXCJbXVwiO1xyXG4gICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHRzVHlwZVRleHQ7XHJcbiAgICAgICAgICAgIC8vIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIF9wYXJzZUJhc2ljVmFsdWUodmFsdWUsIHR5cGUsIG9yaWdpblZhbHVlLCBvcmlnaW5UeXBlLCBjZWxsQ29vcmQpIHtcclxuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkgdmFsdWUgPSBcIlwiO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcInBhcnNlQmFzaWNWYWx1ZVwiLCB2YWx1ZSwgdHlwZSwgb3JpZ2luVmFsdWUsIGNlbGxDb29yZCk7XHJcblxyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiSVwiOiB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIiAgSVwiKVxyXG4gICAgICAgICAgICAgICAgbGV0IGZuID0gcGFyc2VGbG9hdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAvLyBcIjE7MlwiIOS5n+WPr+S7peato+W4uOino+aekOS4ujHvvIzmiYDku6Xov5nph4znmoTlvILluLjliKTlrprnlKh0b1N0cmluZ+i/mOWOn+adpeavlOi+g1xyXG4gICAgICAgICAgICAgICAgaWYgKGZuLnRvU3RyaW5nKCkgIT0gdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yMSeexu+Wei+aVsOaNruino+aekOWHuumUme+8mnR5cGU9WyVzXSwgdmFsdWU9WyVzXSwg5Y2V5YWD5qC8PVslc11cIiwgdGhpcy5kYi5uYW1lLCBvcmlnaW5UeXBlLCBvcmlnaW5WYWx1ZSwgY2VsbENvb3JkKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBmbiA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzTmFOKGZuKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOWPquacieW9k3ZhbHVlID09IE5hTuaXtu+8jOaJjeacieWPr+iDvei/kOihjOWIsOi/meS4quW8guW4uFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIxJ57G75Z6L5pWw5o2u6Kej5p6Q5Ye66ZSZ77yadHlwZT1bJXNdLCB2YWx1ZT1bJXNdLCDljZXlhYPmoLw9WyVzXVwiLCB0aGlzLmRiLm5hbWUsIG9yaWdpblR5cGUsIG9yaWdpblZhbHVlLCBjZWxsQ29vcmQpKTtcclxuICAgICAgICAgICAgICAgICAgICBmbiA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g55Sx5LqOZXhjZWznmoTnsr7luqblkoxqc+S4jeWQjO+8jOWPr+iDveWHuueOsOS9jee9ruS4ujEwMDDvvIxqc+S4reivu+WPluWHuuaYrzk5OS45OTk5OTk5OTk5OeaIluiAhTEwMDAuMDAwMDAwMDAx55qE5oOF5Ya177yM6L+Z6YeM5YWI6ZmN5L2O57K+5bqm5YaN5rGC5pW0XHJcbiAgICAgICAgICAgICAgICBsZXQgbiA9IHBhcnNlSW50KGZuLnRvRml4ZWQoMikpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzTmFOKG4pKSBuID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZm4gIT0gbikgdGhpcy5kYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jEnnsbvmlbDmja7phY3nva7kuLpG77yM5Lii5aSx57K+5bqm6K2m5ZGK77yBdHlwZT1bJXNdLCB2YWx1ZT1bJXNdLCDljZXlhYPmoLw9WyVzXVwiLCB0aGlzLmRiLm5hbWUsIG9yaWdpblR5cGUsIG9yaWdpblZhbHVlLCBjZWxsQ29vcmQpKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY2FzZSBcIkZcIjoge1xyXG4gICAgICAgICAgICAgICAgbGV0IG47XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIG4gPSAwO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbiA9IHBhcnNlRmxvYXQodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFRvb2xzLmZvcm1hdChcInBhcnNlIEYgdmFsdWU6WyVzXSBuOlslZl0gbi50b1N0cmluZygpOlslc11cIiwgdmFsdWUsIG4sIG4udG9TdHJpbmcoKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIChuLnRvU3RyaW5nKCkgIT0gdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHZhbHVlICE9IFwiXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIxG57G75Z6L5pWw5o2u6Kej5p6Q5Ye66ZSZ77yadHlwZT1bJXNdLCB2YWx1ZT1bJXNdXCIsIHRoaXMuZGIubmFtZSwgb3JpZ2luVHlwZSwgb3JpZ2luVmFsdWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBuID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc05hTihuKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yMRuexu+Wei+aVsOaNruino+aekOWHuumUme+8mnR5cGU9WyVzXSwgdmFsdWU9WyVzXSwg5Y2V5YWD5qC8PVslc11cIiwgdGhpcy5kYi5uYW1lLCBvcmlnaW5UeXBlLCBvcmlnaW5WYWx1ZSwgY2VsbENvb3JkKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG4gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY2FzZSBcIlNcIjoge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNhc2UgXCJCXCI6IHtcclxuICAgICAgICAgICAgICAgIGxldCBzdHIgPSB2YWx1ZS50b1N0cmluZygpLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgICAgIGlmIChzdHIgPT0gXCJ0cnVlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RyID09IFwiZmFsc2VcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgIT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIxC57G75pWw5o2u6YWN572u6ZSZ6K+v77yM6ZyA6KaB5Li6VFJVReaIlkZBTFNF77yBdHlwZT1bJXNdIHZhbHVlPVslc10sIOWNleWFg+agvD1bJXNdXCIsIHRoaXMuZGIubmFtZSwgb3JpZ2luVHlwZSwgb3JpZ2luVmFsdWUsIGNlbGxDb29yZCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOajgOafpeWfuuehgOexu+Wei1xyXG4gICAgICogQHBhcmFtIHZhbHVlIFxyXG4gICAgICogQHBhcmFtIHR5cGUgSSBTIEYgQlxyXG4gICAgICogQHJldHVybnMgXHJcbiAgICAgKi9cclxuICAgIF9jaGVja0Jhc2ljVmFsdWVUeXBlKHZhbHVlIDogYW55LCB0eXBlIDogc3RyaW5nKSB7XHJcbiAgICAgICAgLy8g5YWB6K645Li6bnVsbFxyXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiX2NoZWNrQmFzaWNWYWx1ZVR5cGVcIiwgdmFsdWUsIHR5cGUpXHJcbiAgICAgICAgaWYgKCFCQVNJQ19UWVBFXzJfVFNfVFlQRVt0eXBlXSkge1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIiBub3QgYmFzaWMgdHlwZVwiKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBcIklcIjoge1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJJXCIsIHR5cGVvZiB2YWx1ZSlcclxuICAgICAgICAgICAgICAgIC8vIOajgOafpeexu+Wei1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPSBcIm51bWJlclwiKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJpdCdzIG51bWJlclwiKVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIOajgOafpeeyvuW6plxyXG4gICAgICAgICAgICAgICAgbGV0IG4gPSBwYXJzZUludCh2YWx1ZS50b0ZpeGVkKDIpKTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPSBuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLnsr7luqbmjZ/lpLFcIilcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIkZcIjoge1xyXG4gICAgICAgICAgICAgICAgLy8g5qOA5p+l57G75Z6LXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9IFwibnVtYmVyXCIpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwiU1wiOiB7XHJcbiAgICAgICAgICAgICAgICAvLyDmo4Dmn6XnsbvlnotcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT0gXCJzdHJpbmdcIikgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJCXCI6IHtcclxuICAgICAgICAgICAgICAgIC8vIOajgOafpeexu+Wei1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPSBcImJvb2xlYW5cIikgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBfdmFsaWRKc29uVmFsdWUodmFsdWUgOiBhbnlbXSwgb3JpZ2luVmFsdWUgOiBzdHJpbmcsIGNlbGxDb29yZCA6IHN0cmluZykge1xyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5kYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jOWkjeWQiOexu+Wei+Wtl+auteino+aekOW8guW4uO+8jEpTT07op6PmnpDnmoTlgLzkuI3mmK/mlbDnu4TvvIHjgIJ0eXBlPSclcycsIHZhbHVlPSclcycsIG9yaWdpblZhbHVlPSclcycsIOWNleWFg+agvD1bJXNdXCIsIHRoaXMuZGIubmFtZSwgdGhpcy50eXBlLCB2YWx1ZSwgb3JpZ2luVmFsdWUsIGNlbGxDb29yZCkpO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZS5sZW5ndGggPD0gMCkge1xyXG4gICAgICAgICAgICAvLyDlhYHorrjnqbrmlbDnu4RcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIl92YWxpZEpzb25WYWx1ZVwiLCBjZWxsQ29vcmQsIHRoaXMudHlwZSwgb3JpZ2luVmFsdWUsIHZhbHVlKTtcclxuXHJcbiAgICAgICAgLy8g6IO96L+b5YWl5Yiw6L+Z6YeM77yM5LiA5a6a5piv5aSN5ZCI57G75Z6L44CCXHJcbiAgICAgICAgbGV0IHR5cGVzIDogc3RyaW5nW10gPSBbXTtcclxuICAgICAgICBsZXQgZGltZW5zaW9uYWwgPSAwO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudHlwZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCB0ID0gdGhpcy50eXBlW2ldO1xyXG5cclxuICAgICAgICAgICAgbGV0IHRzVHlwZSA9IEJBU0lDX1RZUEVfMl9UU19UWVBFW3RdO1xyXG4gICAgICAgICAgICBpZiAodHNUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlcy5wdXNoKHQpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHQgPT0gXCJBXCIpIHtcclxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbmFsKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIGRpbWVuc2lvbmFsKys7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIiAgdHNUeXBlc1wiLCB0eXBlcylcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIiAgZGltZW5zaW9uYWxcIiwgZGltZW5zaW9uYWwpXHJcblxyXG4gICAgICAgIC8vIOS4gOe7tOaVsOe7hFxyXG4gICAgICAgIGlmIChkaW1lbnNpb25hbCA9PSAxKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlcy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy8g5Y2V5LiA57G75Z6L77yM5qCh6aqM5YC857G75Z6LXHJcbiAgICAgICAgICAgICAgICBsZXQgZmllbGRUeXBlID0gdHlwZXNbMF07XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGRWYWx1ZSA9IHZhbHVlW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fY2hlY2tCYXNpY1ZhbHVlVHlwZShmaWVsZFZhbHVlLCBmaWVsZFR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlpI3lkIjnsbvlnovlrZfmrrXop6PmnpDlvILluLjvvIzlgLznsbvlnovkuI3ljLnphY3jgIJ0eXBlPSclcycsIHZhbHVlPSclcycsIGZpZWxkVHlwZT0nJXMnLCBmaWxlZFZhbHVlPSclcycg5Y2V5YWD5qC8PVslc11cIiwgdGhpcy5kYi5uYW1lLCB0aGlzLnR5cGUsIG9yaWdpblZhbHVlLCBmaWVsZFR5cGUsIGZpZWxkVmFsdWUsIGNlbGxDb29yZCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZXMubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgIC8vIOiHquWumuS5ieexu+Wei++8jOaYr+WQpuWFgeiuuO+8n++8jOi3s+i/h+agoemqjFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIOWkjeWQiOexu+Wei++8jOagoemqjOWAvOexu+Wei+OAgeagoemqjOaVsOe7hOmVv+W6plxyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCAhPSB0eXBlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yM5aSN5ZCI57G75Z6L5a2X5q616Kej5p6Q5byC5bi477yM5pWw5o2u6ZW/5bqm5ZKM57G75Z6L6ZW/5bqm5LiN5Yy56YWN44CCdHlwZT0nJXMnLCB2YWx1ZT0nJXMnLCDljZXlhYPmoLw9WyVzXVwiLCB0aGlzLmRiLm5hbWUsIHRoaXMudHlwZSwgb3JpZ2luVmFsdWUsIGNlbGxDb29yZCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGRWYWx1ZSA9IHZhbHVlW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZFR5cGUgPSB0eXBlc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2NoZWNrQmFzaWNWYWx1ZVR5cGUoZmllbGRWYWx1ZSwgZmllbGRUeXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yM5aSN5ZCI57G75Z6L5a2X5q616Kej5p6Q5byC5bi477yM5YC857G75Z6L5LiN5Yy56YWN44CCdHlwZT0nJXMnLCB2YWx1ZT0nJXMnLCBmaWVsZFR5cGU9JyVzJywgZmlsZWRWYWx1ZT0nJXMnIOWNleWFg+agvD1bJXNdXCIsIHRoaXMuZGIubmFtZSwgdGhpcy50eXBlLCBvcmlnaW5WYWx1ZSwgZmllbGRUeXBlLCBmaWVsZFZhbHVlLCBjZWxsQ29vcmQpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoZGltZW5zaW9uYWwgPT0gMikge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByb3dBcnIgPSB2YWx1ZVtpXTtcclxuICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyb3dBcnIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jOWkjeWQiOexu+Wei+Wtl+auteino+aekOW8guW4uO+8jOS6jOe7tOaVsOe7hOeahOesrCVk6KGM5oiQ5ZGYJyVzJ+S4jeaYr+aVsOe7hOOAgnR5cGU9JyVzJywgdmFsdWU9JyVzJywg5Y2V5YWD5qC8PVslc11cIiwgdGhpcy5kYi5uYW1lLCBpLCByb3dBcnIsIHRoaXMudHlwZSwgb3JpZ2luVmFsdWUsIGNlbGxDb29yZCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlcy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOWNleS4gOexu+Wei++8jOagoemqjOWAvOexu+Wei1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZFR5cGUgPSB0eXBlc1swXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHJvd0Fyci5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZFZhbHVlID0gcm93QXJyW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2NoZWNrQmFzaWNWYWx1ZVR5cGUoZmllbGRWYWx1ZSwgZmllbGRUeXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jOWkjeWQiOexu+Wei+Wtl+auteino+aekOW8guW4uO+8jOS6jOe7tOaVsOe7hOesrCVk6KGM5oiQ5ZGY5YC857G75Z6L5LiN5Yy56YWN44CCdHlwZT0nJXMnLCB2YWx1ZT0nJXMnLCBmaWVsZFR5cGU9JyVzJywgZmlsZWRWYWx1ZT0nJXMnIOWNleWFg+agvD1bJXNdXCIsIHRoaXMuZGIubmFtZSwgaSwgdGhpcy50eXBlLCBvcmlnaW5WYWx1ZSwgZmllbGRUeXBlLCBmaWVsZFZhbHVlLCBjZWxsQ29vcmQpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOiHquWumuS5ieexu+Wei++8jOaYr+WQpuWFgeiuuO+8n++8jOi3s+i/h+agoemqjFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiB2YWx1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOWkjeWQiOexu+Wei++8jOagoemqjOWAvOexu+Wei+OAgeagoemqjOaVsOe7hOmVv+W6plxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyb3dBcnIubGVuZ3RoICE9IHR5cGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yM5aSN5ZCI57G75Z6L5a2X5q616Kej5p6Q5byC5bi477yM5LqM57u05pWw57uE56ysJWTooYzmiJDlkZjmlbDmja7plb/luqblkoznsbvlnovplb/luqbkuI3ljLnphY3jgIJ0eXBlPSclcycsIHZhbHVlPSclcycsIOWNleWFg+agvD1bJXNdXCIsIHRoaXMuZGIubmFtZSwgaSwgdGhpcy50eXBlLCBvcmlnaW5WYWx1ZSwgY2VsbENvb3JkKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcm93QXJyLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkVmFsdWUgPSByb3dBcnJbal07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZFR5cGUgPSB0eXBlc1tqXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9jaGVja0Jhc2ljVmFsdWVUeXBlKGZpZWxkVmFsdWUsIGZpZWxkVHlwZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlpI3lkIjnsbvlnovlrZfmrrXop6PmnpDlvILluLjvvIzkuoznu7TmlbDnu4TnrKwlZOihjOaIkOWRmOWAvOexu+Wei+S4jeWMuemFjeOAgnR5cGU9JyVzJywgdmFsdWU9JyVzJywgZmllbGRUeXBlPSclcycsIGZpbGVkVmFsdWU9JyVzJyDljZXlhYPmoLw9WyVzXVwiLCB0aGlzLmRiLm5hbWUsIGksIHRoaXMudHlwZSwgb3JpZ2luVmFsdWUsIGZpZWxkVHlwZSwgZmllbGRWYWx1ZSwgY2VsbENvb3JkKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIOS4jeaYr+aVsOe7hO+8jOi/lOWbnm51bGxcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VWYWx1ZShvcmlnaW5WYWx1ZSA6IHN0cmluZywgY2VsbENvb3JkIDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKG9yaWdpblZhbHVlID09IG51bGwpIG9yaWdpblZhbHVlID0gXCJcIjtcclxuXHJcbiAgICAgICAgLy8g5LyY5YWI5Zyo57yT5a2Y5Lit5p+l6K+i77yM5aaC5p6c5ZG95Luk57yT5a2Y5YiZ55u05o6l5L2/55So57yT5a2Y55qE5pWw5o2u77yM5o+Q5Y2H6Kej5p6Q5pWI546HXHJcbiAgICAgICAgbGV0IGNhY2hlID0gRGF0YUJhc2VGaWVsZC5wYXJzZVZhbHVlQ2FjaGVbdGhpcy50eXBlXTtcclxuICAgICAgICBpZiAoIWNhY2hlKSB7XHJcbiAgICAgICAgICAgIGNhY2hlID0ge307XHJcbiAgICAgICAgICAgIERhdGFCYXNlRmllbGQucGFyc2VWYWx1ZUNhY2hlW3RoaXMudHlwZV0gPSBjYWNoZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBjYWNoZVZhbHVlID0gY2FjaGVbb3JpZ2luVmFsdWVdO1xyXG4gICAgICAgIGlmIChjYWNoZVZhbHVlICE9PSB1bmRlZmluZWQpIHJldHVybiBjYWNoZVZhbHVlO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZygncGFyc2VWYWx1ZScsIHRoaXMudHlwZSwgb3JpZ2luVmFsdWUpXHJcbiAgICAgICAgLy8gaWYgKG9yaWdpblZhbHVlID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICAvLyDlsJ3or5Xkvb/nlKjln7rnoYDnsbvlnovop6PmnpBcclxuICAgICAgICBsZXQgcmV0ID0gdGhpcy5fcGFyc2VCYXNpY1ZhbHVlKG9yaWdpblZhbHVlLCB0aGlzLnR5cGUsIG9yaWdpblZhbHVlLCB0aGlzLnR5cGUsIGNlbGxDb29yZCk7XHJcbiAgICAgICAgaWYgKHJldCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy50eXBlLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgLy8g5aSN5ZCI57G75Z6LXHJcbiAgICAgICAgICAgIGxldCBkYXRhID0gbnVsbDtcclxuICAgICAgICAgICAgLy8g5bCd6K+V55SoanNvbuino+aekFxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2Uob3JpZ2luVmFsdWUpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgLy8g5b+955WlXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhICYmIEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcclxuICAgICAgICAgICAgICAgIC8vIOagoemqjGpzb27moLzlvI/nmoTmlbDmja7mmK/lkKbmraPnoa5cclxuICAgICAgICAgICAgICAgIGRhdGEgPSB0aGlzLl92YWxpZEpzb25WYWx1ZShkYXRhLCBvcmlnaW5WYWx1ZSwgY2VsbENvb3JkKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBqc29u5pWw5o2u5byC5bi477yM6YeH55So5a2X56ym5Liy6Kej5p6QXHJcbiAgICAgICAgICAgIC8vIOino+aekOespuWPt+S8mOWFiOe6p++8mlwifFwiLCBcIjtcIlxyXG5cclxuICAgICAgICAgICAgLy8g6Kej5p6Q57G75Z6LXHJcbiAgICAgICAgICAgIGxldCB0eXBlcyA9IFtdO1xyXG4gICAgICAgICAgICBsZXQgZGltZW5zaW9uYWwgPSAwO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnR5cGUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHQgPSB0aGlzLnR5cGVbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHRzVHlwZSA9IEJBU0lDX1RZUEVfMl9UU19UWVBFW3RdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRzVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGVzLnB1c2godCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHQgPT0gXCJBXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBkaW1lbnNpb25hbCsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uYWwrKztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coVG9vbHMuZm9ybWF0KFwi6Kej5p6Q5pWw57uEIG9yaWdpblZhbHVlPSclcycsIHR5cGU9JyVzJywgdHlwZXM9JXMsIGRpbWVuc2lvbmFsPSVkXCIsIG9yaWdpblZhbHVlLCB0aGlzLnR5cGUsIEpTT04uc3RyaW5naWZ5KHR5cGVzKSwgZGltZW5zaW9uYWwpKTtcclxuICAgICAgICAgICAgaWYgKGRpbWVuc2lvbmFsID09IDEpIHtcclxuICAgICAgICAgICAgICAgIC8vIOS4gOe7tOaVsOe7hFxyXG4gICAgICAgICAgICAgICAgbGV0IGFycjtcclxuICAgICAgICAgICAgICAgIGlmIChvcmlnaW5WYWx1ZSA9PT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGFyciA9IFtdXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGFyciA9IG9yaWdpblZhbHVlLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxzL2csIFwiXCIpLnNwbGl0KFwiO1wiKSB8fCBbXTtcclxuICAgICAgICAgICAgICAgICAgICBhcnIgPSBvcmlnaW5WYWx1ZS50b1N0cmluZygpLnNwbGl0KFwiO1wiKSB8fCBbXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIiAgc3BsaXRcIiwgSlNPTi5zdHJpbmdpZnkoYXJyKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHBhcnNlZEFyciA9IFtdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVzLmxlbmd0aCA8PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5Y2V5LiA57G75Z6LXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHQgPSB0eXBlc1swXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFyci5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2diA9IGFycltqXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiZm9yXCIsIGosIHQsIHZ2KVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5fcGFyc2VCYXNpY1ZhbHVlKHZ2LCB0LCBvcmlnaW5WYWx1ZSwgdGhpcy50eXBlLCBjZWxsQ29vcmQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZWRBcnIucHVzaCh2YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5pyJ5aSa5Liq57G75Z6L77yM55u05o6l5oyJ54WndHlwZXPop6PmnpBcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY291bnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZmlsbERlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IHR5cGVzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZXMubGVuZ3RoICE9IGFyci5sZW5ndGggJiYgYXJyLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlpI3lkIjnsbvlnovlrZfmrrXop6PmnpDlvILluLjvvIzmlbDmja7plb/luqblkoznsbvlnovplb/luqbkuI3ljLnphY3jgIJ0eXBlPSclcycsIHZhbHVlPSclcycsIOWNleWFg+agvD1bJXNdXCIsIHRoaXMuZGIubmFtZSwgdGhpcy50eXBlLCBvcmlnaW5WYWx1ZSwgY2VsbENvb3JkKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQgPSBNYXRoLm1pbihhcnIubGVuZ3RoLCB0eXBlcy5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvdW50OyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IHR5cGVzW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdnYgPSBhcnJbal0gfHwgXCJcIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiZm9yXCIsIGosIHQsIHZ2KVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5fcGFyc2VCYXNpY1ZhbHVlKHZ2LCB0LCBvcmlnaW5WYWx1ZSwgdGhpcy50eXBlLCBjZWxsQ29vcmQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZWRBcnIucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldCA9IHBhcnNlZEFycjtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFRvb2xzLmZvcm1hdChcIuino+aekOS4gOe7tOaVsOe7hCclcycgdHlwZT0nJXMnLCByZXQ9JyVzJ1wiLCBvcmlnaW5WYWx1ZSwgdGhpcy50eXBlLCBKU09OLnN0cmluZ2lmeShyZXQpKSk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRpbWVuc2lvbmFsID09IDIpIHtcclxuICAgICAgICAgICAgICAgIC8vIOS6jOe7tOaVsOe7hFxyXG4gICAgICAgICAgICAgICAgcmV0ID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCLkuoznu7TmlbDnu4RcIiwgb3JpZ2luVmFsdWUsIHR5cGVzKVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBhcnIxID0gW107XHJcbiAgICAgICAgICAgICAgICBpZiAob3JpZ2luVmFsdWUgJiYgb3JpZ2luVmFsdWUgIT09IFwiXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBhcnIxID0gb3JpZ2luVmFsdWUudG9TdHJpbmcoKS5yZXBsYWNlKC8gL2csIFwiXCIpLnNwbGl0KFwifFwiKSB8fCBbXTtcclxuICAgICAgICAgICAgICAgICAgICBhcnIxID0gb3JpZ2luVmFsdWUudG9TdHJpbmcoKS5zcGxpdChcInxcIikgfHwgW107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImFycjFcIiwgYXJyMSlcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyMS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSBhcnIxW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBhcnIyO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2ID09PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycjIgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnIyID0gdi5zcGxpdChcIjtcIikgfHwgW107XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgcGFyc2VkQXJyMiA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZXMubGVuZ3RoIDw9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Y2V5LiA57G75Z6LXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0ID0gdHlwZXNbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXJyMi5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdnYgPSBhcnIyW2pdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiZm9yXCIsIGosIHQsIHZ2KVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuX3BhcnNlQmFzaWNWYWx1ZSh2diwgdCwgb3JpZ2luVmFsdWUsIHRoaXMudHlwZSwgY2VsbENvb3JkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZEFycjIucHVzaCh2YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5aSa57G75Z6LXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjb3VudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZmlsbERlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQgPSB0eXBlcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZXMubGVuZ3RoICE9IGFycjIubGVuZ3RoICYmIGFycjIubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlpI3lkIjnsbvlnovlrZfmrrXop6PmnpDlvILluLjvvIzmlbDmja7plb/luqblkoznsbvlnovplb/luqbkuI3ljLnphY3jgIJ0eXBlPSclcycsIHZhbHVlPSclcycsIOWNleWFg+agvD1bJXNdXCIsIHRoaXMuZGIubmFtZSwgdGhpcy50eXBlLCBvcmlnaW5WYWx1ZSwgY2VsbENvb3JkKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IE1hdGgubWluKGFycjIubGVuZ3RoLCB0eXBlcy5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb3VudDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gdHlwZXNbal07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdnYgPSBhcnIyW2pdIHx8IFwiXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5fcGFyc2VCYXNpY1ZhbHVlKHZ2LCB0LCBvcmlnaW5WYWx1ZSwgdGhpcy50eXBlLCBjZWxsQ29vcmQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VkQXJyMi5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJmb3JcIiwgaSwgdiwgYXJyMiwgcGFyc2VkQXJyMilcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2gocGFyc2VkQXJyMik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhUb29scy5mb3JtYXQoXCLop6PmnpDkuoznu7TmlbDnu4QnJXMnIHR5cGU9JyVzJywgcmV0PSclcydcIiwgb3JpZ2luVmFsdWUsIHRoaXMudHlwZSwgSlNPTi5zdHJpbmdpZnkocmV0KSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjYWNoZVtvcmlnaW5WYWx1ZV0gPSByZXQ7XHJcblxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbn0iXX0=