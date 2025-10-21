"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = __importDefault(require("../utils/tools"));
const db_exporter_1 = __importDefault(require("./db-exporter"));
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
/**
 * 一张配置表
 */
class DataBase {
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
        let filePathMap = db_exporter_1.default.dbNames_2_dbFilePathMap[this.name];
        if (filePathMap) {
            let filePaths = [];
            tools_1.default.forEachMap(filePathMap, (filePath) => {
                filePath = filePath.replaceAll(db_exporter_1.default.prjRootDir + "\\", "").replaceAll("\\", "/");
                // console.log(Exporter.prjRootDir, filePath)
                filePaths.push(filePath);
            });
            text += tools_1.default.format("'sources': %s,\n", JSON.stringify(filePaths));
        }
        ;
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
    generateDbdtsText() {
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
        text += this.generateDbdtsGettersText();
        return text;
    }
    generateAutoExportDbTsGettersText() {
        let text = "";
        text += tools_1.default.format("    db.get_%s = (): db.%s => { return DbManager.getDataBase('%s').datas; }\n", this.name, this.name, this.name);
        switch (this.rule) {
            case "m": {
                let majorField = this.fields[0];
                text += tools_1.default.format("    db.get_from_%s = (%s: %s, bQuiet?: boolean): db.%s_data => { return DbManager.getDataBase('%s')._get1(%s, bQuiet); }\n", this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, this.name, this.name, majorField.name);
                text += tools_1.default.format("    db.foreach_from_%s = (callback: (%sKey: string, data: db.%s_data) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData1(callback); }\n", this.name, majorField.name, this.name, this.name);
                break;
            }
            case "mm": {
                let majorField = this.fields[0];
                let minorField = this.fields[1];
                text += tools_1.default.format("    db.get_from_%s = (%s: %s, %s: %s, bQuiet?: boolean): db.%s_data => { return DbManager.getDataBase('%s')._get2(%s, %s, bQuiet); }\n", this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, minorField.name, minorField.tsType == 'number' ? 'number | string' : minorField.tsType, this.name, this.name, majorField.name, minorField.name);
                text += tools_1.default.format("    db.foreach_from_%s = (callback: (%sKey: string, %sKey: string, data: db.%s_data) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData2(callback); }\n", this.name, majorField.name, minorField.name, this.name, this.name);
                text += tools_1.default.format("    db.getMap_from_%s = (%s: %s, bQuiet?: boolean): { [%s: %s]: db.%s_data } => { return DbManager.getDataBase('%s')._get1(%s, bQuiet); }\n", this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, minorField.name, minorField.tsType, this.name, this.name, majorField.name);
                text += tools_1.default.format("    db.foreachMap_from_%s = (callback: (%sKey: string, datas: { [%s: %s]: db.%s_data }) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData1(callback); }\n", this.name, majorField.name, minorField.name, minorField.tsType, this.name, this.name);
                break;
            }
            case "ma": {
                let majorField = this.fields[0];
                text += tools_1.default.format("    db.get_from_%s = (%s: %s, index: number, bQuiet?: boolean): db.%s_data => { return DbManager.getDataBase('%s')._get2(%s, index, bQuiet); }\n", this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, this.name, this.name, majorField.name);
                text += tools_1.default.format("    db.foreach_from_%s = (callback: (%sKey: string, index: number, data: db.%s_data) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData2(callback); }\n", this.name, majorField.name, this.name, this.name);
                text += tools_1.default.format("    db.getArr_from_%s = (%s: %s, bQuiet?: boolean): db.%s_data[] => { return DbManager.getDataBase('%s')._get1(%s, bQuiet); }\n", this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, this.name, this.name, majorField.name);
                text += tools_1.default.format("    db.foreachArr_from_%s = (callback: (%sKey: string, datas: db.%s_data[]) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData1(callback); }\n", this.name, majorField.name, this.name, this.name);
                break;
            }
            case "a": {
                text += tools_1.default.format("    db.get_from_%s = (index: number, bQuiet?: boolean): db.%s_data => { return DbManager.getDataBase('%s')._get1(index, bQuiet); }\n", this.name, this.name, this.name);
                text += tools_1.default.format("    db.foreach_from_%s = (callback: (index: number, data: db.%s_data) => (void | boolean)) => { DbManager.getDataBase('%s')._foreachData1(callback); }\n", this.name, this.name, this.name);
                break;
            }
        }
        return text;
    }
    generateDbdtsGettersText() {
        let text = "";
        text += tools_1.default.format("    function get_%s(): db.%s;\n", this.name, this.name);
        switch (this.rule) {
            case "m": {
                let majorField = this.fields[0];
                text += tools_1.default.format("    function get_from_%s(%s: %s, bQuiet?: boolean): db.%s_data;\n", this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, this.name);
                text += tools_1.default.format("    function foreach_from_%s(callback: (%sKey: string, data: db.%s_data) => (void | boolean)): void;\n", this.name, majorField.name, this.name);
                break;
            }
            case "mm": {
                let majorField = this.fields[0];
                let minorField = this.fields[1];
                text += tools_1.default.format("    function get_from_%s(%s: %s, %s: %s, bQuiet?: boolean): db.%s_data;\n", this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, minorField.name, minorField.tsType == 'number' ? 'number | string' : minorField.tsType, this.name);
                text += tools_1.default.format('    function foreach_from_%s(callback: (%sKey: string, %sKey: string, data: db.%s_data) => (void | boolean)): void;\n', this.name, majorField.name, minorField.name, this.name);
                text += tools_1.default.format('    function getMap_from_%s(%s: %s, bQuiet?: boolean): { [%s: %s]: db.%s_data };\n', this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, minorField.name, minorField.tsType, this.name);
                text += tools_1.default.format('    function foreachMap_from_%s(callback: (%sKey: string, datas: { [%s: %s]: db.%s_data }) => (void | boolean)): void;\n', this.name, majorField.name, minorField.name, minorField.tsType, this.name);
                break;
            }
            case "ma": {
                let majorField = this.fields[0];
                text += tools_1.default.format('    function get_from_%s(%s: %s, index: number, bQuiet?: boolean): db.%s_data;\n', this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, this.name);
                text += tools_1.default.format('    function foreach_from_%s(callback: (%sKey: string, index: number, data: db.%s_data) => (void | boolean)): void;\n', this.name, majorField.name, this.name);
                text += tools_1.default.format('    function getArr_from_%s(%s: %s, bQuiet?: boolean): db.%s_data[];\n', this.name, majorField.name, majorField.tsType == 'number' ? 'number | string' : majorField.tsType, this.name);
                text += tools_1.default.format('    function foreachArr_from_%s(callback: (%sKey: string, datas: db.%s_data[]) => (void | boolean)): void;\n', this.name, majorField.name, this.name);
                break;
            }
            case "a": {
                text += tools_1.default.format('    function get_from_%s(index: number, bQuiet?: boolean): db.%s_data;\n', this.name, this.name);
                text += tools_1.default.format('    function foreach_from_%s(callback: (index: number, data: db.%s_data) => (void | boolean)): void;\n', this.name, this.name);
                break;
            }
        }
        return text;
    }
    /**
     * 导出_autoExportDb.ts中使用的文本
     */
    generateAutoExportDbTsConstsText() {
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
            text += tools_1.default.format('db.%s = {\n', varname);
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
        text3 += "    return db.I18N_Language_Code[serverKey]; \n";
        text3 += "}\n";
        return text1 + "\n" + text2 + "\n" + text3;
    }
    /**
     * 导出db.d.ts中使用的文本
     */
    generateDbdtsConstsText() {
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
        let db = new DataBase();
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
exports.default = DataBase;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1iYXNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2RiZXhwb3J0L2RhdGEtYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDJEQUFtQztBQUNuQyxnRUFBdUM7QUFFdkMsTUFBTSxvQkFBb0IsR0FBRztJQUN6QixDQUFDLEVBQUUsUUFBUTtJQUNYLENBQUMsRUFBRSxRQUFRO0lBQ1gsQ0FBQyxFQUFFLFFBQVE7SUFDWCxDQUFDLEVBQUUsU0FBUztDQUNmLENBQUM7QUFFRixNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFDdEI7SUFDSSxJQUFJLEdBQUcsR0FBRyw0QkFBNEIsQ0FBQztJQUV2QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNqQyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDckMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN6QjtJQUVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2pDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUV0QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNqQyxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdEMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENB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O2FBQy9HO1NBQ0o7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBRXpCLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQzs7QUEvZk0sNkJBQWUsR0FBMkIsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFRvb2xzIGZyb20gXCIuLi91dGlscy90b29sc1wiO1xyXG5pbXBvcnQgRGJFeHBvcnRlciBmcm9tIFwiLi9kYi1leHBvcnRlclwiO1xyXG5cclxuY29uc3QgQkFTSUNfVFlQRV8yX1RTX1RZUEUgPSB7XHJcbiAgICBJOiBcIm51bWJlclwiLFxyXG4gICAgRjogXCJudW1iZXJcIixcclxuICAgIFM6IFwic3RyaW5nXCIsXHJcbiAgICBCOiBcImJvb2xlYW5cIixcclxufTtcclxuXHJcbmNvbnN0IENPTF8yX05BTUUgPSBbXTtcclxue1xyXG4gICAgbGV0IHN0ciA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpcIjtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IGNoYXIgPSBzdHIuc3Vic3RyaW5nKGksIGkgKyAxKTtcclxuICAgICAgICBDT0xfMl9OQU1FLnB1c2goY2hhcik7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBjaGFyMSA9IHN0ci5zdWJzdHJpbmcoaSwgaSArIDEpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHN0ci5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBjb25zdCBjaGFyMiA9IHN0ci5zdWJzdHJpbmcoaiwgaiArIDEpO1xyXG4gICAgICAgICAgICBDT0xfMl9OQU1FLnB1c2goY2hhcjEgKyBjaGFyMilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29uc29sZS5sb2coQ09MXzJfTkFNRSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDkuIDlvKDphY3nva7ooahcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERhdGFCYXNlIHtcclxuICAgIG9yaWdpbkZpbGVQYXRoIDogc3RyaW5nO1xyXG4gICAgb3JpZ2luU2hlZXROYW1lIDogc3RyaW5nO1xyXG5cclxuICAgIG5hbWUgOiBzdHJpbmc7XHJcbiAgICBydWxlIDogc3RyaW5nO1xyXG4gICAgLy8gYkV4cG9ydEtleSA9IGZhbHNlO1xyXG4gICAgZmllbGRzIDogRGF0YUJhc2VGaWVsZFtdID0gW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBbW3Zhcm5hbWUsIGtleUZpZWxkTmFtZSwgdmFsdWVGaWVsZE5hbWVdXVxyXG4gICAgICovXHJcbiAgICBleHBvcnRDb25zdHMgOiBbc3RyaW5nLHN0cmluZyxzdHJpbmddW10gPSBbXTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIOWOn+Wni+aVsOaNru+8jOWSjHJ1bGXml6DlhbNcclxuICAgICAqIFtcclxuICAgICAqICAgICAge2sxOnYxLCBrMjp2Mn1cclxuICAgICAqIF1cclxuICAgICAqL1xyXG4gICAgb3JpZ2luRGF0YXMgOiB7W2tleSA6IHN0cmluZ10gOiBhbnl9W10gPSBbXTtcclxuICAgIC8qKlxyXG4gICAgICog5Y6f5aeL5pWw5o2uaW5kZXjliLDljp/lp4vooajmoLxyb3fnmoTmmKDlsITlhbPns7tcclxuICAgICAqL1xyXG4gICAgb3JpZ2luRGF0YUluZGV4XzJfb3JpZ2luRmlsZVBhdGhfb3JpZ2luU2hlZXROYW1lX29yaWdpblJvdyA9IHt9O1xyXG5cclxuICAgIGRhdGFzO1xyXG5cclxuICAgIHdhcm5Mb2cgPSBbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmZpZWxkcyA9IFtdO1xyXG4gICAgICAgIHRoaXMud2FybkxvZyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEZpZWxkcyhmaWVsZHMpIHtcclxuICAgICAgICB0aGlzLmZpZWxkcyA9IFRvb2xzLnNvcnRBcnJheUJ5RmllbGQoZmllbGRzLCBcIm9yaWdpbkNvbFwiKVxyXG4gICAgfVxyXG5cclxuICAgIGdldEZpZWxkQnlOYW1lKGZpZWxkTmFtZSkge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgZmllbGQgPSB0aGlzLmZpZWxkc1tpXTtcclxuICAgICAgICAgICAgaWYgKGZpZWxkLm5hbWUgPT0gZmllbGROYW1lKSByZXR1cm4gZmllbGQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEV4cG9ydENvbnN0cyhleHBvcnRDb25zdHMgOiBbc3RyaW5nLHN0cmluZyxzdHJpbmddW10pIHtcclxuICAgICAgICB0aGlzLmV4cG9ydENvbnN0cyA9IGV4cG9ydENvbnN0cztcclxuICAgIH1cclxuXHJcbiAgICBzZXRPcmlnaW5EYXRhcyhvcmlnaW5EYXRhcywgb3JpZ2luRGF0YUluZGV4XzJfb3JpZ2luRmlsZVBhdGhfb3JpZ2luU2hlZXROYW1lX29yaWdpblJvdykge1xyXG4gICAgICAgIHRoaXMub3JpZ2luRGF0YXMgPSBvcmlnaW5EYXRhcztcclxuICAgICAgICB0aGlzLm9yaWdpbkRhdGFJbmRleF8yX29yaWdpbkZpbGVQYXRoX29yaWdpblNoZWV0TmFtZV9vcmlnaW5Sb3cgPSBvcmlnaW5EYXRhSW5kZXhfMl9vcmlnaW5GaWxlUGF0aF9vcmlnaW5TaGVldE5hbWVfb3JpZ2luUm93O1xyXG5cclxuICAgICAgICBsZXQgdHlwZV8yX3ZhbGlkID0ge1xyXG4gICAgICAgICAgICBTOiB0cnVlLFxyXG4gICAgICAgICAgICBJOiB0cnVlLFxyXG4gICAgICAgICAgICBGOiB0cnVlLFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJEYXRhQmFzZS5zZXRPcmlnaW5EYXRhc1wiLCB0aGlzKTtcclxuXHJcbiAgICAgICAgLy8g6Kej5p6Q5Li65q2j5byP5qC85byP77yfXHJcbiAgICAgICAgc3dpdGNoICh0aGlzLnJ1bGUpIHtcclxuICAgICAgICAgICAgY2FzZSBcImFcIjoge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm9yaWdpbkRhdGFzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMub3JpZ2luRGF0YXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhcy5wdXNoKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1hXCI6IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YXMgPSB7fTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5vcmlnaW5EYXRhcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLm9yaWdpbkRhdGFzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWFqb3JJZEZpZWxkID0gdGhpcy5maWVsZHNbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYWpvcklkRmllbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXSBydWxlPVslc10g5pyq5om+5Yiw5Li76KaBaWTlrZfmrrXvvIFcIiwgdGhpcy5vcmlnaW5GaWxlUGF0aCwgdGhpcy5ydWxlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXR5cGVfMl92YWxpZFttYWpvcklkRmllbGQudHlwZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXSBydWxlPVslc10g5Li76KaBaWRbJXNd57G75Z6L5LiN6IO95Li6WyVzXe+8geivt+mFjee9ruS4ukksIEYsIFPkuK3nmoTkuIDnp43jgIJcIiwgdGhpcy5vcmlnaW5GaWxlUGF0aCwgdGhpcy5ydWxlLCBtYWpvcklkRmllbGQubmFtZSwgbWFqb3JJZEZpZWxkLnR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtYWpvcklkID0gZGF0YVttYWpvcklkRmllbGQubmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1ham9ySWQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNdIHJ1bGU9WyVzXSDkuLvopoFpZFslc13mnKrphY3nva7vvIFcIiwgdGhpcy5vcmlnaW5GaWxlUGF0aCwgdGhpcy5ydWxlLCBtYWpvcklkRmllbGQubmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5uYW1lLCBpLCBtYWpvcklkRmllbGQubmFtZSwgbWFqb3JJZEZpZWxkLnRzVHlwZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtaW5vckRhdGFzID0gdGhpcy5kYXRhc1ttYWpvcklkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1pbm9yRGF0YXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWlub3JEYXRhcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGFzW21ham9ySWRdID0gbWlub3JEYXRhcztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1pbm9yRGF0YXMucHVzaChkYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJtbVwiOiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFzID0ge307XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub3JpZ2luRGF0YXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5vcmlnaW5EYXRhc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcm93ID0gb3JpZ2luRGF0YUluZGV4XzJfb3JpZ2luRmlsZVBhdGhfb3JpZ2luU2hlZXROYW1lX29yaWdpblJvd1tpXVsyXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1ham9ySWRGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbWFqb3JJZEZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc10gcnVsZT1bJXNdIOacquaJvuWIsOS4u+imgWlk5a2X5q6177yBXCIsIHRoaXMub3JpZ2luRmlsZVBhdGgsIHRoaXMucnVsZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXR5cGVfMl92YWxpZFttYWpvcklkRmllbGQudHlwZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXSBydWxlPVslc10g5Li76KaBaWRbJXNd57G75Z6L5LiN6IO95Li6WyVzXe+8geivt+mFjee9ruS4ukksIEYsIFPkuK3nmoTkuIDnp43jgIJcIiwgdGhpcy5vcmlnaW5GaWxlUGF0aCwgdGhpcy5ydWxlLCBtYWpvcklkRmllbGQubmFtZSwgbWFqb3JJZEZpZWxkLnR5cGUpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtYWpvcklkID0gZGF0YVttYWpvcklkRmllbGQubmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1ham9ySWQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNdIHJ1bGU9WyVzXSDkuLvopoFpZFslc13mnKrphY3nva7vvIFcIiwgdGhpcy5vcmlnaW5GaWxlUGF0aCwgdGhpcy5ydWxlLCBtYWpvcklkRmllbGQubmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1pbm9ySWRGaWVsZCA9IHRoaXMuZmllbGRzWzFdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbWlub3JJZEZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc10gcnVsZT1bJXNdIOacquaJvuWIsOasoeimgWlk5a2X5q6177yBXCIsIHRoaXMub3JpZ2luRmlsZVBhdGgsIHRoaXMucnVsZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWlub3JJZCA9IGRhdGFbbWlub3JJZEZpZWxkLm5hbWVdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtaW5vcklkID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXSBydWxlPVslc10g5qyh6KaBaWRbJXNd5pyq6YWN572u77yB5Li7aWRbJXNdPVslc13vvIFcIiwgdGhpcy5vcmlnaW5GaWxlUGF0aCwgdGhpcy5ydWxlLCBtYWpvcklkRmllbGQubmFtZSwgbWFqb3JJZEZpZWxkLm5hbWUsIG1ham9ySWQpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtaW5vckRhdGFzID0gdGhpcy5kYXRhc1ttYWpvcklkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1pbm9yRGF0YXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWlub3JEYXRhcyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGFzW21ham9ySWRdID0gbWlub3JEYXRhcztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtaW5vckRhdGFzW21pbm9ySWRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc10gcnVsZT1bJXNdIOasoeimgWlk5Yay56qB77ya5Li7aWRbJXNdPVslc10g5qyhaWRbJXNdPVslc13vvIzor7fmo4Dmn6XphY3nva7ooajnrKwlZOihjOOAglwiLCB0aGlzLm9yaWdpbkZpbGVQYXRoLCB0aGlzLnJ1bGUsIG1pbm9ySWRGaWVsZC5uYW1lLCBtaW5vcklkLCBtYWpvcklkRmllbGQubmFtZSwgbWFqb3JJZCwgcm93ICsgMSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBtaW5vckRhdGFzW21pbm9ySWRdID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJtXCI6IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YXMgPSB7fTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5vcmlnaW5EYXRhcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLm9yaWdpbkRhdGFzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCByb3cgPSBvcmlnaW5EYXRhSW5kZXhfMl9vcmlnaW5GaWxlUGF0aF9vcmlnaW5TaGVldE5hbWVfb3JpZ2luUm93W2ldWzJdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWFqb3JJZEZpZWxkID0gdGhpcy5maWVsZHNbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYWpvcklkRmllbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXSBydWxlPVslc10g5pyq5om+5Yiw5Li76KaBaWTlrZfmrrXvvIFcIiwgdGhpcy5vcmlnaW5GaWxlUGF0aCwgdGhpcy5ydWxlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdHlwZV8yX3ZhbGlkW21ham9ySWRGaWVsZC50eXBlXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNdIHJ1bGU9WyVzXSDkuLvopoFpZFslc13nsbvlnovkuI3og73kuLpbJXNd77yB6K+36YWN572u5Li6SSwgRiwgU+S4reeahOS4gOenjeOAglwiLCB0aGlzLm9yaWdpbkZpbGVQYXRoLCB0aGlzLnJ1bGUsIG1ham9ySWRGaWVsZC5uYW1lLCBtYWpvcklkRmllbGQudHlwZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1ham9ySWQgPSBkYXRhW21ham9ySWRGaWVsZC5uYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWFqb3JJZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc10gcnVsZT1bJXNdIOS4u+imgWlkWyVzXeacqumFjee9ru+8gVwiLCB0aGlzLm9yaWdpbkZpbGVQYXRoLCB0aGlzLnJ1bGUsIG1ham9ySWRGaWVsZC5uYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIm1ham9ySWRcIiwgaSwgbWFqb3JJZCwgISF0aGlzLmRhdGFzW21ham9ySWRdKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXRhc1ttYWpvcklkXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNdIHJ1bGU9WyVzXSDkuLvopoFpZOWGsueqge+8miVzPVslc13vvIzor7fmo4Dmn6XphY3nva7ooajnrKwlZOihjOOAglwiLCB0aGlzLm9yaWdpbkZpbGVQYXRoLCB0aGlzLnJ1bGUsIG1ham9ySWRGaWVsZC5uYW1lLCBtYWpvcklkLCByb3cgKyAxKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YXNbbWFqb3JJZF0gPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGVmYXVsdDoge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubmFtZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXSBydWxlPVslc10g5LiN5pSv5oyB5q2k6KeE5YiZ77yM6K+35L2/55SobeOAgW1t44CBbWHjgIFh5Lit55qE5LiA56eN44CCXCIsIHRoaXMub3JpZ2luRmlsZVBhdGgsIHRoaXMucnVsZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOacquefpXJ1bGXvvJ9cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5rKh5pyJ5ZCN5a2X77yM6K+05piO6L+Z5LiN5piv5LiA5Liq5ZCI5rOV55qE6ZyA6KaB5a+85Ye655qE6YWN572u77yM5peg6ZyA5oql6K2mXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFzID0ge307XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3JEYihjYWxsYmFjaywgYk9ubHlGb3JNYWpvciA9IGZhbHNlKSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLnJ1bGUpIHtcclxuICAgICAgICAgICAgY2FzZSBcImFcIjoge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmRhdGFzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSwgaSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwibWFcIjoge1xyXG4gICAgICAgICAgICAgICAgVG9vbHMuZm9yRWFjaE1hcCh0aGlzLmRhdGFzLCAobWFqb3JJZCwgYXJyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJPbmx5Rm9yTWFqb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soYXJyLCBtYWpvcklkKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGFycltpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEsIG1ham9ySWQsIGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwibW1cIjoge1xyXG4gICAgICAgICAgICAgICAgVG9vbHMuZm9yRWFjaE1hcCh0aGlzLmRhdGFzLCAobWFqb3JJZCwgbWlub3JEYXRhcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiT25seUZvck1ham9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG1pbm9yRGF0YXMsIG1ham9ySWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAobWlub3JEYXRhcywgKG1pbm9ySWQsIGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNhc2UgXCJtXCI6XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAodGhpcy5kYXRhcywgKG1ham9ySWQsIGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhLCBtYWpvcklkKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TWFqb3JJZE5hbWUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmllbGRzWzBdLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TWlub3JJZE5hbWUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmllbGRzWzFdLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDnlJ/miJDljp/lp4tqc29u5pWw5o2uXHJcbiAgICAgKi9cclxuICAgIGdlbmVyYXRlUHJldmlld0RiSnNvblRleHQoKSB7XHJcbiAgICAgICAgbGV0IHRleHQgPSAnJztcclxuXHJcbiAgICAgICAgdGV4dCArPSAne1xcbic7XHJcblxyXG4gICAgICAgIC8vIG5hbWVcclxuICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiduYW1lJzogJyVzJyxcXG5cIiwgdGhpcy5uYW1lKTtcclxuXHJcbiAgICAgICAgLy8gcnVsZVxyXG4gICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiJ3J1bGUnOiAnJXMnLFxcblwiLCB0aGlzLnJ1bGUpO1xyXG5cclxuICAgICAgICAvLyDlhbPogZTphY3nva7ooahcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkV4cG9ydGVyLmRiTmFtZXNfMl9kYkZpbGVQYXRoTWFwXCIsIEV4cG9ydGVyLmRiTmFtZXNfMl9kYkZpbGVQYXRoTWFwKVxyXG4gICAgICAgIGxldCBmaWxlUGF0aE1hcCA9IERiRXhwb3J0ZXIuZGJOYW1lc18yX2RiRmlsZVBhdGhNYXBbdGhpcy5uYW1lXTtcclxuICAgICAgICBpZiAoZmlsZVBhdGhNYXApIHtcclxuICAgICAgICAgICAgbGV0IGZpbGVQYXRocyA9IFtdO1xyXG4gICAgICAgICAgICBUb29scy5mb3JFYWNoTWFwKGZpbGVQYXRoTWFwLCAoZmlsZVBhdGgpID0+IHtcclxuICAgICAgICAgICAgICAgIGZpbGVQYXRoID0gZmlsZVBhdGgucmVwbGFjZUFsbChEYkV4cG9ydGVyLnByalJvb3REaXIgKyBcIlxcXFxcIiwgXCJcIikucmVwbGFjZUFsbChcIlxcXFxcIiwgXCIvXCIpO1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coRXhwb3J0ZXIucHJqUm9vdERpciwgZmlsZVBhdGgpXHJcbiAgICAgICAgICAgICAgICBmaWxlUGF0aHMucHVzaChmaWxlUGF0aClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiJ3NvdXJjZXMnOiAlcyxcXG5cIiwgSlNPTi5zdHJpbmdpZnkoZmlsZVBhdGhzKSk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8vIOWtl+autVxyXG4gICAgICAgIGxldCBmaWVsZHMgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmZpZWxkc1tpXTtcclxuXHJcbiAgICAgICAgICAgIGZpZWxkcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIG9yaWdpbkNvbDogdi5vcmlnaW5Db2wsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiB2Lm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiB2LnR5cGUsXHJcbiAgICAgICAgICAgICAgICB0c1R5cGU6IHYudHNUeXBlLFxyXG4gICAgICAgICAgICAgICAgZGVzYzogdi5kZXNjLFxyXG4gICAgICAgICAgICAgICAgdmVyaWZ5ZXJzOiB2LnZlcmlmeWVycyxcclxuICAgICAgICAgICAgICAgIGlkTWVyZ2VUbzogdi5pZE1lcmdlVG8sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIidmaWVsZHMnOiAlcyxcXG5cIiwgSlNPTi5zdHJpbmdpZnkoZmllbGRzLCBudWxsLCA0KSk7XHJcblxyXG4gICAgICAgIC8vIOWtl+autVxyXG4gICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiJ2RhdGFzJzogJXNcXG5cIiwgSlNPTi5zdHJpbmdpZnkodGhpcy5kYXRhcywgbnVsbCwgNCkpO1xyXG5cclxuICAgICAgICB0ZXh0ICs9ICd9JztcclxuXHJcbiAgICAgICAgcmV0dXJuIHRleHRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOeUn+aIkGRiLmQudHPmlofmnKxcclxuICAgICAqL1xyXG4gICAgZ2VuZXJhdGVEYmR0c1RleHQoKSB7XHJcbiAgICAgICAgbGV0IHRleHQgPSBcIlwiO1xyXG5cclxuICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIHR5cGUgJXNfZGF0YSA9IHtcXG4nLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgZmllbGQgPSB0aGlzLmZpZWxkc1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmaWVsZC5kZXNjKSB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgICAgICAvKiogJXMgKi9cXG4nLCBmaWVsZC5kZXNjKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyAgICAgICAgcmVhZG9ubHkgJXM6ICVzLFxcbicsIGZpZWxkLm5hbWUsIGZpZWxkLnRzVHlwZSk7XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICB0ZXh0ICs9ICcgICAgfTtcXG4nO1xyXG5cclxuICAgICAgICB0ZXh0ICs9ICdcXG4nO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKHRoaXMucnVsZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwibVwiOiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFqb3JGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyAgICB0eXBlICVzID0ge1xcbicsIHRoaXMubmFtZSk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgICAgICBbJXM6ICVzXTogJXNfZGF0YSxcXG4nLCBtYWpvckZpZWxkLm5hbWUsIG1ham9yRmllbGQudHNUeXBlLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSAnICAgIH07XFxuJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJtbVwiOiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFqb3JGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgbGV0IG1pbm9yRmllbGQgPSB0aGlzLmZpZWxkc1sxXTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgdHlwZSAlcyA9IHtcXG4nLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyAgICAgICAgWyVzOiAlc106IHtcXG4nLCBtYWpvckZpZWxkLm5hbWUsIG1ham9yRmllbGQudHNUeXBlKTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgICAgICAgICBbJXM6ICVzXTogJXNfZGF0YSxcXG4nLCBtaW5vckZpZWxkLm5hbWUsIG1pbm9yRmllbGQudHNUeXBlLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSAnICAgICAgICB9LFxcbidcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gJyAgICB9O1xcbic7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwibWFcIjoge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1ham9yRmllbGQgPSB0aGlzLmZpZWxkc1swXTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgdHlwZSAlcyA9IHtcXG4nLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyAgICAgICAgWyVzOiAlc106ICVzX2RhdGFbXSxcXG4nLCBtYWpvckZpZWxkLm5hbWUsIG1ham9yRmllbGQudHNUeXBlLCB0aGlzLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSAnICAgIH07XFxuJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJhXCI6IHtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgdHlwZSAlcyA9ICVzX2RhdGFbXTtcXG4nLCB0aGlzLm5hbWUsIHRoaXMubmFtZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGV4dCArPSAnXFxuJztcclxuXHJcbiAgICAgICAgdGV4dCArPSB0aGlzLmdlbmVyYXRlRGJkdHNHZXR0ZXJzVGV4dCgpO1xyXG5cclxuXHJcbiAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVBdXRvRXhwb3J0RGJUc0dldHRlcnNUZXh0KCkge1xyXG4gICAgICAgIGxldCB0ZXh0ID0gXCJcIjtcclxuXHJcbiAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICAgZGIuZ2V0XyVzID0gKCk6IGRiLiVzID0+IHsgcmV0dXJuIERiTWFuYWdlci5nZXREYXRhQmFzZSgnJXMnKS5kYXRhczsgfVxcblwiLCB0aGlzLm5hbWUsIHRoaXMubmFtZSwgdGhpcy5uYW1lKTtcclxuXHJcbiAgICAgICAgc3dpdGNoICh0aGlzLnJ1bGUpIHtcclxuICAgICAgICAgICAgY2FzZSBcIm1cIjoge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1ham9yRmllbGQgPSB0aGlzLmZpZWxkc1swXTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiICAgIGRiLmdldF9mcm9tXyVzID0gKCVzOiAlcywgYlF1aWV0PzogYm9vbGVhbik6IGRiLiVzX2RhdGEgPT4geyByZXR1cm4gRGJNYW5hZ2VyLmdldERhdGFCYXNlKCclcycpLl9nZXQxKCVzLCBiUXVpZXQpOyB9XFxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLnRzVHlwZSA9PSAnbnVtYmVyJyA/ICdudW1iZXIgfCBzdHJpbmcnIDogbWFqb3JGaWVsZC50c1R5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICAgZGIuZm9yZWFjaF9mcm9tXyVzID0gKGNhbGxiYWNrOiAoJXNLZXk6IHN0cmluZywgZGF0YTogZGIuJXNfZGF0YSkgPT4gKHZvaWQgfCBib29sZWFuKSkgPT4geyBEYk1hbmFnZXIuZ2V0RGF0YUJhc2UoJyVzJykuX2ZvcmVhY2hEYXRhMShjYWxsYmFjayk7IH1cXG5cIixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1tXCI6IHtcclxuICAgICAgICAgICAgICAgIGxldCBtYWpvckZpZWxkID0gdGhpcy5maWVsZHNbMF07XHJcbiAgICAgICAgICAgICAgICBsZXQgbWlub3JGaWVsZCA9IHRoaXMuZmllbGRzWzFdO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICAgZGIuZ2V0X2Zyb21fJXMgPSAoJXM6ICVzLCAlczogJXMsIGJRdWlldD86IGJvb2xlYW4pOiBkYi4lc19kYXRhID0+IHsgcmV0dXJuIERiTWFuYWdlci5nZXREYXRhQmFzZSgnJXMnKS5fZ2V0MiglcywgJXMsIGJRdWlldCk7IH1cXG5cIixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQudHNUeXBlID09ICdudW1iZXInID8gJ251bWJlciB8IHN0cmluZycgOiBtYWpvckZpZWxkLnRzVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBtaW5vckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWlub3JGaWVsZC50c1R5cGUgPT0gJ251bWJlcicgPyAnbnVtYmVyIHwgc3RyaW5nJyA6IG1pbm9yRmllbGQudHNUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1pbm9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICBkYi5mb3JlYWNoX2Zyb21fJXMgPSAoY2FsbGJhY2s6ICglc0tleTogc3RyaW5nLCAlc0tleTogc3RyaW5nLCBkYXRhOiBkYi4lc19kYXRhKSA9PiAodm9pZCB8IGJvb2xlYW4pKSA9PiB7IERiTWFuYWdlci5nZXREYXRhQmFzZSgnJXMnKS5fZm9yZWFjaERhdGEyKGNhbGxiYWNrKTsgfVxcblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWlub3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICAgZGIuZ2V0TWFwX2Zyb21fJXMgPSAoJXM6ICVzLCBiUXVpZXQ/OiBib29sZWFuKTogeyBbJXM6ICVzXTogZGIuJXNfZGF0YSB9ID0+IHsgcmV0dXJuIERiTWFuYWdlci5nZXREYXRhQmFzZSgnJXMnKS5fZ2V0MSglcywgYlF1aWV0KTsgfVxcblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC50c1R5cGUgPT0gJ251bWJlcicgPyAnbnVtYmVyIHwgc3RyaW5nJyA6IG1ham9yRmllbGQudHNUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1pbm9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtaW5vckZpZWxkLnRzVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICBkYi5mb3JlYWNoTWFwX2Zyb21fJXMgPSAoY2FsbGJhY2s6ICglc0tleTogc3RyaW5nLCBkYXRhczogeyBbJXM6ICVzXTogZGIuJXNfZGF0YSB9KSA9PiAodm9pZCB8IGJvb2xlYW4pKSA9PiB7IERiTWFuYWdlci5nZXREYXRhQmFzZSgnJXMnKS5fZm9yZWFjaERhdGExKGNhbGxiYWNrKTsgfVxcblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWlub3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1pbm9yRmllbGQudHNUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1hXCI6IHtcclxuICAgICAgICAgICAgICAgIGxldCBtYWpvckZpZWxkID0gdGhpcy5maWVsZHNbMF07XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICBkYi5nZXRfZnJvbV8lcyA9ICglczogJXMsIGluZGV4OiBudW1iZXIsIGJRdWlldD86IGJvb2xlYW4pOiBkYi4lc19kYXRhID0+IHsgcmV0dXJuIERiTWFuYWdlci5nZXREYXRhQmFzZSgnJXMnKS5fZ2V0MiglcywgaW5kZXgsIGJRdWlldCk7IH1cXG5cIixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQudHNUeXBlID09ICdudW1iZXInID8gJ251bWJlciB8IHN0cmluZycgOiBtYWpvckZpZWxkLnRzVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICBkYi5mb3JlYWNoX2Zyb21fJXMgPSAoY2FsbGJhY2s6ICglc0tleTogc3RyaW5nLCBpbmRleDogbnVtYmVyLCBkYXRhOiBkYi4lc19kYXRhKSA9PiAodm9pZCB8IGJvb2xlYW4pKSA9PiB7IERiTWFuYWdlci5nZXREYXRhQmFzZSgnJXMnKS5fZm9yZWFjaERhdGEyKGNhbGxiYWNrKTsgfVxcblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICBkYi5nZXRBcnJfZnJvbV8lcyA9ICglczogJXMsIGJRdWlldD86IGJvb2xlYW4pOiBkYi4lc19kYXRhW10gPT4geyByZXR1cm4gRGJNYW5hZ2VyLmdldERhdGFCYXNlKCclcycpLl9nZXQxKCVzLCBiUXVpZXQpOyB9XFxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLnRzVHlwZSA9PSAnbnVtYmVyJyA/ICdudW1iZXIgfCBzdHJpbmcnIDogbWFqb3JGaWVsZC50c1R5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICAgZGIuZm9yZWFjaEFycl9mcm9tXyVzID0gKGNhbGxiYWNrOiAoJXNLZXk6IHN0cmluZywgZGF0YXM6IGRiLiVzX2RhdGFbXSkgPT4gKHZvaWQgfCBib29sZWFuKSkgPT4geyBEYk1hbmFnZXIuZ2V0RGF0YUJhc2UoJyVzJykuX2ZvcmVhY2hEYXRhMShjYWxsYmFjayk7IH1cXG5cIixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcImFcIjoge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICAgZGIuZ2V0X2Zyb21fJXMgPSAoaW5kZXg6IG51bWJlciwgYlF1aWV0PzogYm9vbGVhbik6IGRiLiVzX2RhdGEgPT4geyByZXR1cm4gRGJNYW5hZ2VyLmdldERhdGFCYXNlKCclcycpLl9nZXQxKGluZGV4LCBiUXVpZXQpOyB9XFxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICAgZGIuZm9yZWFjaF9mcm9tXyVzID0gKGNhbGxiYWNrOiAoaW5kZXg6IG51bWJlciwgZGF0YTogZGIuJXNfZGF0YSkgPT4gKHZvaWQgfCBib29sZWFuKSkgPT4geyBEYk1hbmFnZXIuZ2V0RGF0YUJhc2UoJyVzJykuX2ZvcmVhY2hEYXRhMShjYWxsYmFjayk7IH1cXG5cIixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBnZW5lcmF0ZURiZHRzR2V0dGVyc1RleHQoKSB7XHJcbiAgICAgICAgbGV0IHRleHQgPSBcIlwiO1xyXG5cclxuICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgICBmdW5jdGlvbiBnZXRfJXMoKTogZGIuJXM7XFxuXCIsIHRoaXMubmFtZSwgdGhpcy5uYW1lKTtcclxuXHJcbiAgICAgICAgc3dpdGNoICh0aGlzLnJ1bGUpIHtcclxuICAgICAgICAgICAgY2FzZSBcIm1cIjoge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1ham9yRmllbGQgPSB0aGlzLmZpZWxkc1swXTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiICAgIGZ1bmN0aW9uIGdldF9mcm9tXyVzKCVzOiAlcywgYlF1aWV0PzogYm9vbGVhbik6IGRiLiVzX2RhdGE7XFxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLnRzVHlwZSA9PSAnbnVtYmVyJyA/ICdudW1iZXIgfCBzdHJpbmcnIDogbWFqb3JGaWVsZC50c1R5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiICAgIGZ1bmN0aW9uIGZvcmVhY2hfZnJvbV8lcyhjYWxsYmFjazogKCVzS2V5OiBzdHJpbmcsIGRhdGE6IGRiLiVzX2RhdGEpID0+ICh2b2lkIHwgYm9vbGVhbikpOiB2b2lkO1xcblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJtbVwiOiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFqb3JGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgbGV0IG1pbm9yRmllbGQgPSB0aGlzLmZpZWxkc1sxXTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiICAgIGZ1bmN0aW9uIGdldF9mcm9tXyVzKCVzOiAlcywgJXM6ICVzLCBiUXVpZXQ/OiBib29sZWFuKTogZGIuJXNfZGF0YTtcXG5cIixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQudHNUeXBlID09ICdudW1iZXInID8gJ251bWJlciB8IHN0cmluZycgOiBtYWpvckZpZWxkLnRzVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBtaW5vckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWlub3JGaWVsZC50c1R5cGUgPT0gJ251bWJlcicgPyAnbnVtYmVyIHwgc3RyaW5nJyA6IG1pbm9yRmllbGQudHNUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIGZ1bmN0aW9uIGZvcmVhY2hfZnJvbV8lcyhjYWxsYmFjazogKCVzS2V5OiBzdHJpbmcsICVzS2V5OiBzdHJpbmcsIGRhdGE6IGRiLiVzX2RhdGEpID0+ICh2b2lkIHwgYm9vbGVhbikpOiB2b2lkO1xcbicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtaW5vckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgZnVuY3Rpb24gZ2V0TWFwX2Zyb21fJXMoJXM6ICVzLCBiUXVpZXQ/OiBib29sZWFuKTogeyBbJXM6ICVzXTogZGIuJXNfZGF0YSB9O1xcbicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLnRzVHlwZSA9PSAnbnVtYmVyJyA/ICdudW1iZXIgfCBzdHJpbmcnIDogbWFqb3JGaWVsZC50c1R5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWlub3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1pbm9yRmllbGQudHNUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIGZ1bmN0aW9uIGZvcmVhY2hNYXBfZnJvbV8lcyhjYWxsYmFjazogKCVzS2V5OiBzdHJpbmcsIGRhdGFzOiB7IFslczogJXNdOiBkYi4lc19kYXRhIH0pID0+ICh2b2lkIHwgYm9vbGVhbikpOiB2b2lkO1xcbicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtaW5vckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWlub3JGaWVsZC50c1R5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJtYVwiOiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFqb3JGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyAgICBmdW5jdGlvbiBnZXRfZnJvbV8lcyglczogJXMsIGluZGV4OiBudW1iZXIsIGJRdWlldD86IGJvb2xlYW4pOiBkYi4lc19kYXRhO1xcbicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLnRzVHlwZSA9PSAnbnVtYmVyJyA/ICdudW1iZXIgfCBzdHJpbmcnIDogbWFqb3JGaWVsZC50c1R5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCcgICAgZnVuY3Rpb24gZm9yZWFjaF9mcm9tXyVzKGNhbGxiYWNrOiAoJXNLZXk6IHN0cmluZywgaW5kZXg6IG51bWJlciwgZGF0YTogZGIuJXNfZGF0YSkgPT4gKHZvaWQgfCBib29sZWFuKSk6IHZvaWQ7XFxuJyxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIGZ1bmN0aW9uIGdldEFycl9mcm9tXyVzKCVzOiAlcywgYlF1aWV0PzogYm9vbGVhbik6IGRiLiVzX2RhdGFbXTtcXG4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBtYWpvckZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFqb3JGaWVsZC50c1R5cGUgPT0gJ251bWJlcicgPyAnbnVtYmVyIHwgc3RyaW5nJyA6IG1ham9yRmllbGQudHNUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIGZ1bmN0aW9uIGZvcmVhY2hBcnJfZnJvbV8lcyhjYWxsYmFjazogKCVzS2V5OiBzdHJpbmcsIGRhdGFzOiBkYi4lc19kYXRhW10pID0+ICh2b2lkIHwgYm9vbGVhbikpOiB2b2lkO1xcbicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcImFcIjoge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyAgICBmdW5jdGlvbiBnZXRfZnJvbV8lcyhpbmRleDogbnVtYmVyLCBiUXVpZXQ/OiBib29sZWFuKTogZGIuJXNfZGF0YTtcXG4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyAgICBmdW5jdGlvbiBmb3JlYWNoX2Zyb21fJXMoY2FsbGJhY2s6IChpbmRleDogbnVtYmVyLCBkYXRhOiBkYi4lc19kYXRhKSA9PiAodm9pZCB8IGJvb2xlYW4pKTogdm9pZDtcXG4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5a+85Ye6X2F1dG9FeHBvcnREYi50c+S4reS9v+eUqOeahOaWh+acrFxyXG4gICAgICovXHJcbiAgICBnZW5lcmF0ZUF1dG9FeHBvcnREYlRzQ29uc3RzVGV4dCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZXhwb3J0Q29uc3RzKSByZXR1cm4gXCJcIjtcclxuXHJcbiAgICAgICAgbGV0IHRleHQgPSBcIlwiO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZXhwb3J0Q29uc3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmV4cG9ydENvbnN0c1tpXTtcclxuXHJcbiAgICAgICAgICAgIC8vIOaPkOWPlmV4cG9ydENvbnN05Lit55qE5Y+Y6YePXHJcbiAgICAgICAgICAgIGxldCBbdmFybmFtZSwga2V5RmllbGROYW1lLCB2YWx1ZUZpZWxkTmFtZV0gPSB2O1xyXG5cclxuICAgICAgICAgICAgLy8g5o+Q5Y+WZmllbGRcclxuICAgICAgICAgICAgbGV0IGtleUZpZWxkID0gdGhpcy5nZXRGaWVsZEJ5TmFtZShrZXlGaWVsZE5hbWUpO1xyXG4gICAgICAgICAgICBsZXQgdmFsdWVGaWVsZCA9IHRoaXMuZ2V0RmllbGRCeU5hbWUodmFsdWVGaWVsZE5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoIWtleUZpZWxkIHx8ICF2YWx1ZUZpZWxkKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIOWGmeWFpeazqOmHilxyXG4gICAgICAgICAgICBpZiAoa2V5RmllbGQuZGVzYykge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBgICAgIC8qKiAke2tleUZpZWxkLmRlc2N9ICovXFxuYDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnZGIuJXMgPSB7XFxuJywgdmFybmFtZSk7XHJcblxyXG4gICAgICAgICAgICAvLyDmj5Dlj5bmlbDmja5cclxuICAgICAgICAgICAgbGV0IG1hcCA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLmZvckRiKChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQga2V5ID0gZGF0YVtrZXlGaWVsZE5hbWVdO1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gZGF0YVt2YWx1ZUZpZWxkTmFtZV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGtleSAhPSBudWxsICYmIHZhbHVlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBtYXBba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIOaMiWtleeaOkuW6j+WQjumBjeWOhlxyXG4gICAgICAgICAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKG1hcCk7XHJcbiAgICAgICAgICAgIC8va2V5cy5zb3J0KCk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwga2V5cy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGtleSA9IGtleXNbal07XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSBtYXBba2V5XTtcclxuXHJcbiAgICAgICAgICAgICAgICBrZXkgPSBrZXkucmVwbGFjZSgvIC9nLCAnXycpOy8vcmVwbGFjZSgvLS9nLCAnXycpLlxyXG5cclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZVRleHQgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZUZpZWxkLnRzVHlwZSA9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlVGV4dCA9IFN0cmluZyh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlVGV4dCA9IGAnJHt2YWx1ZX0nYDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IGAgICAgJyR7a2V5fSc6ICR7dmFsdWVUZXh0fSxcXG5gO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0ZXh0ICs9ICd9XFxuJztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcImV4cG9ydENvbnN0cyA9IFwiLHRleHQpO1xyXG4gICAgICAgIHJldHVybiB0ZXh0O1xyXG5cclxuXHJcblxyXG5cclxuICAgICAgICAvLyBsZXQgdGV4dCA9IFwiXCI7XHJcbiAgICAgICAgLy8gaWYgKCF0aGlzLmJFeHBvcnRLZXkpIHJldHVybiB0ZXh0O1xyXG4gICAgICAgIC8vIGlmICh0aGlzLnJ1bGUgPT0gXCJhXCIpIHtcclxuICAgICAgICAvLyAgICAgY29uc29sZS5lcnJvcihcIlvorablkYpd5a+85Ye66KeE5YiZ5Li6Ye+8jOaXoOazleWvvOiHtGtleeS4uuW4uOmHjy5cIik7XHJcbiAgICAgICAgLy8gICAgIHJldHVybiB0ZXh0O1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgLy8gbGV0IGtleXMgPSBbXTtcclxuICAgICAgICAvLyB0aGlzLmZvckRiKGZ1bmN0aW9uIChwYXJhbXMsIGlkKSB7XHJcbiAgICAgICAgLy8gICAgIGtleXMucHVzaChpZCk7XHJcbiAgICAgICAgLy8gfSwgdHJ1ZSk7XHJcbiAgICAgICAgLy8ga2V5cy5zb3J0KCk7XHJcblxyXG4gICAgICAgIC8vIGxldCBtYWpvckZpZWxkID0gdGhpcy5maWVsZHNbMF07XHJcbiAgICAgICAgLy8gaWYgKG1ham9yRmllbGQuZGVzYykge1xyXG4gICAgICAgIC8vICAgICB0ZXh0ICs9IGAgICAgLyoqICR7bWFqb3JGaWVsZC5kZXNjfSAqL1xcbmA7XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIC8vIC8vIHRleHQgKz0gVG9vbHMuZm9ybWF0KGAgICAgcHVibGljIHN0YXRpYyByZWFkb25seSAlcyA9IHtcXG5gLCBgJHt0aGlzLm5hbWV9XyR7bWFqb3JGaWVsZC5uYW1lfWAudG9VcHBlckNhc2UoKSk7XHJcbiAgICAgICAgLy8gdGV4dCArPSBUb29scy5mb3JtYXQoJ2RiLiVzXyVzID0ge1xcbicsIHRoaXMubmFtZS50b1VwcGVyQ2FzZSgpLCBtYWpvckZpZWxkLm5hbWUudG9VcHBlckNhc2UoKSk7XHJcbiAgICAgICAgLy8ga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAvLyAgICAgbGV0IGZsZCA9IGtleS5yZXBsYWNlKC8tL2csIFwiX1wiKS5yZXBsYWNlKC8gL2csIFwiX1wiKTtcclxuICAgICAgICAvLyAgICAgaWYgKGlzTmFOKHBhcnNlSW50KGZsZFswXSkpKSB7XHJcbiAgICAgICAgLy8gICAgICAgICB0ZXh0ICs9IGAgICAgJHtmbGR9OiBcIiR7a2V5fVwiLFxcbmA7XHJcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gICAgICAgICAvLyDlpoLmnpzmmK/ku6XmlbDlrZflvIDlpLTnmoRrZXnvvIzpnIDopoHliqDlvJXlj7dcclxuICAgICAgICAvLyAgICAgICAgIHRleHQgKz0gYCAgICBcIiR7ZmxkfVwiOiBcIiR7a2V5fVwiLFxcbmA7XHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyB9KVxyXG4gICAgICAgIC8vIHRleHQgKz0gXCJ9XFxuXCI7XHJcblxyXG4gICAgICAgIC8vIHJldHVybiB0ZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5a+5aTE4bumFjee9ruihqOi/m+ihjOm7mOiupOWvvOWHulxyXG4gICAgICovXHJcbiAgICBnZW5lcmF0ZUkxOG5FbnVtVGV4dCgpe1xyXG4gICAgICAgIGlmKCF0aGlzLmV4cG9ydENvbnN0cyl7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog6L+Z5Liq5piv57Si5byVXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgbGV0IHRleHQxIDogc3RyaW5nID0gXCIvL+atpOaWh+S7tuS4uuiHquWKqOWvvOWHuu+8jOeUqOS6jkNvbXBvbmVudOS4reWKqOaAgemAieaLqeivreiogOaXtuWBmuiHquWKqOWIh+aNoueUqO+8jOaXoOWFtuS7luaEj+S5ie+8jOiHquWKqOS/ruaUueWQjuS4i+asoeWvvOWHuuS8muiiq+imhuebllxcblwiO1xyXG4gICAgICAgIHRleHQxICs9IFwiLy/oi6Xmg7Plop7liqDmlrDnmoTor63oqIDvvIzor7fmiZPlvIBfY29uZmlnL0Rf5aSa6K+t6KiAL+ivreiogOmFjee9rl9pMThuX2xhbmd1YWdlX2NvbmZpZ19kYi54bHN45Lit5aKe5YqgXFxuXCI7XHJcbiAgICAgICAgdGV4dDEgKz0gXCIvL+WkmuivreiogOWbvueJh+i1hOa6kOaUvuWIsOavj+S4qmJ1bmRsZeS4i+eahGkxOG7nm67lvZXkuIvvvIzmlrDlu7ror6Xor63oqIDnmoTmlofku7blpLnvvIzmlofku7blpLnlkI3lrZfkuLrkuIror4l4bHN46KGo5Lit55qEaWTliJfnmoTlkI3lrZfjgIJcXG5cIjtcclxuICAgICAgICB0ZXh0MSArPSBcIi8v5aSa6K+t6KiA5Zu+54mH6LWE5rqQ6K+35omL5Yqo6I635Y+W77yM5oiW6ICF5Zyo5YiH5o2i6K+t6KiA55qE5pe25YCZ5YWo6YOo5Yqg6L295ZCO55u05o6l5L2/55SoXFxuXCI7XHJcbiAgICAgICAgdGV4dDEgKz0gXCJcXG5cXG5cIjtcclxuICAgICAgICB0ZXh0MSArPSBcImV4cG9ydCBlbnVtIExhbmd1YWdlSW5kZXgge1xcblwiO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOi/meS4quaYr+ecn+WunueahOWQjeWtl1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGxldCB0ZXh0MiA6IHN0cmluZyA9IFwiZXhwb3J0IGNvbnN0IExhbmd1YWdlS2V5IDogc3RyaW5nW10gPSBbIFxcblwiO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5leHBvcnRDb25zdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgdiA9IHRoaXMuZXhwb3J0Q29uc3RzW2ldO1xyXG5cclxuICAgICAgICAgICAgLy8g5o+Q5Y+WZXhwb3J0Q29uc3TkuK3nmoTlj5jph49cclxuICAgICAgICAgICAgbGV0IFt2YXJuYW1lLCBrZXlGaWVsZE5hbWUsIHZhbHVlRmllbGROYW1lXSA9IHY7XHJcblxyXG4gICAgICAgICAgICAvLyDmj5Dlj5ZmaWVsZFxyXG4gICAgICAgICAgICBsZXQga2V5RmllbGQgPSB0aGlzLmdldEZpZWxkQnlOYW1lKGtleUZpZWxkTmFtZSk7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZUZpZWxkID0gdGhpcy5nZXRGaWVsZEJ5TmFtZSh2YWx1ZUZpZWxkTmFtZSk7XHJcbiAgICAgICAgICAgIGlmICgha2V5RmllbGQgfHwgIXZhbHVlRmllbGQpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBpZihrZXlGaWVsZC5uYW1lICE9ICdpZCcpe1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8g5o+Q5Y+W5pWw5o2uXHJcbiAgICAgICAgICAgIGxldCBtYXAgPSB7fTtcclxuICAgICAgICAgICAgdGhpcy5mb3JEYigoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGtleSA9IGRhdGFba2V5RmllbGROYW1lXTtcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IGRhdGFbdmFsdWVGaWVsZE5hbWVdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChrZXkgIT0gbnVsbCAmJiB2YWx1ZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFwW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgLy8g5oyJa2V55o6S5bqP5ZCO6YGN5Y6GXHJcbiAgICAgICAgICAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKG1hcCk7XHJcbiAgICAgICAgICAgICAvL2tleXMuc29ydCgpO1xyXG4gICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBrZXlzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQga2V5ICAgID0ga2V5c1tqXTtcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSAgPSBtYXBba2V5XTtcclxuXHJcbiAgICAgICAgICAgICAgICBrZXkgPSBrZXkucmVwbGFjZSgvIC9nLCAnXycpOy8vcmVwbGFjZSgvLS9nLCAnXycpLlxyXG5cclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZVRleHQgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZUZpZWxkLnRzVHlwZSA9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlVGV4dCA9IFN0cmluZyh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlVGV4dCA9IGAnJHt2YWx1ZX0nYDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRleHQxICs9IFwiICAgIFwiICsga2V5ICsgXCIgPSBcIiArIGogKyBcIixcXG5cIjtcclxuICAgICAgICAgICAgICAgIHRleHQyICs9IFwiICAgICdcIiArIGtleSArIFwiJyxcXG5cIjtcclxuICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgIHRleHQxICs9IFwifTsgXFxuXCI7XHJcbiAgICAgICAgICAgICB0ZXh0MiArPSBcIl07IFxcblwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHRleHQzID0gXCIvKiogXFxuXCI7XHJcbiAgICAgICAgdGV4dDMgKz0gXCIgKiDmoLnmja7kvKDlhaXnmoTor63oqIDnmoRrZXnvvIzov5Tlm57or63oqIDnmoRlbnVt55qE57Si5byV77yM5aaC5p6c5rKh5pyJ77yM5YiZ6L+U5ZueLTEgXFxuXCI7XHJcbiAgICAgICAgdGV4dDMgKz0gXCIgKiBAcGFyYW0gbmFtZSBcXG5cIjtcclxuICAgICAgICB0ZXh0MyArPSBcIiAqIEByZXR1cm5zIFxcblwiO1xyXG4gICAgICAgIHRleHQzICs9IFwiICovIFxcblwiO1xyXG4gICAgICAgIHRleHQzICs9IFwiZXhwb3J0IGZ1bmN0aW9uIGdldExhbmd1YWdlSW5kZXhCeUtleShuYW1lIDogc3RyaW5nKSA6IExhbmd1YWdlSW5kZXggfCBudW1iZXIgeyBcXG5cIjtcclxuICAgICAgICB0ZXh0MyArPSBcIiAgICByZXR1cm4gTGFuZ3VhZ2VLZXkuaW5kZXhPZihuYW1lKTsgXFxuXCI7XHJcbiAgICAgICAgdGV4dDMgKz0gXCJ9IFxcblwiO1xyXG4gICAgICAgIHRleHQzICs9IFwiXFxuXCI7XHJcbiAgICAgICAgdGV4dDMgKz0gXCIvKipcXG4gKiDlsIbmnI3liqHlmajkvKDpgJLov4fmnaXnmoTor63oqIDku6PnoIHvvIzovazmjaLkuLrmnKzlnLDnmoTor63oqIDku6PnoIFcXG4gKiBAcGFyYW0gc2VydmVyS2V5IFxcbiAqL1xcblwiO1xyXG4gICAgICAgIHRleHQzICs9IFwiZXhwb3J0IGZ1bmN0aW9uIHNlcnZlckxhbmd1YWdlS2V5VG9Mb2NhbChzZXJ2ZXJLZXkgOiBzdHJpbmcpIDogc3RyaW5nIHsgXFxuXCI7XHJcbiAgICAgICAgdGV4dDMgKz0gXCIgICAgcmV0dXJuIGRiLkkxOE5fTGFuZ3VhZ2VfQ29kZVtzZXJ2ZXJLZXldOyBcXG5cIjtcclxuICAgICAgICB0ZXh0MyArPSBcIn1cXG5cIjtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRleHQxICsgXCJcXG5cIiArIHRleHQyICsgXCJcXG5cIiArIHRleHQzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5a+85Ye6ZGIuZC50c+S4reS9v+eUqOeahOaWh+acrFxyXG4gICAgICovXHJcbiAgICBnZW5lcmF0ZURiZHRzQ29uc3RzVGV4dCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZXhwb3J0Q29uc3RzKSByZXR1cm4gXCJcIjtcclxuXHJcbiAgICAgICAgbGV0IHRleHQgPSBcIlwiO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZXhwb3J0Q29uc3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmV4cG9ydENvbnN0c1tpXTtcclxuXHJcbiAgICAgICAgICAgIC8vIOaPkOWPlmV4cG9ydENvbnN05Lit55qE5Y+Y6YePXHJcbiAgICAgICAgICAgIGxldCBbdmFybmFtZSwga2V5RmllbGROYW1lLCB2YWx1ZUZpZWxkTmFtZV0gPSB2O1xyXG5cclxuICAgICAgICAgICAgLy8g5o+Q5Y+WZmllbGRcclxuICAgICAgICAgICAgbGV0IGtleUZpZWxkID0gdGhpcy5nZXRGaWVsZEJ5TmFtZShrZXlGaWVsZE5hbWUpO1xyXG4gICAgICAgICAgICBsZXQgdmFsdWVGaWVsZCA9IHRoaXMuZ2V0RmllbGRCeU5hbWUodmFsdWVGaWVsZE5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoIWtleUZpZWxkIHx8ICF2YWx1ZUZpZWxkKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIOWGmeWFpeazqOmHilxyXG4gICAgICAgICAgICBpZiAoa2V5RmllbGQuZGVzYykge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBgICAgIC8qKiAke2tleUZpZWxkLmRlc2N9ICovXFxuYDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgIGV4cG9ydCBjb25zdCAlczoge1xcbicsIHZhcm5hbWUpO1xyXG5cclxuICAgICAgICAgICAgLy8g5o+Q5Y+W5pWw5o2uXHJcbiAgICAgICAgICAgIGxldCBtYXAgPSB7fTtcclxuICAgICAgICAgICAgdGhpcy5mb3JEYigoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGtleSA9IGRhdGFba2V5RmllbGROYW1lXTtcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IGRhdGFbdmFsdWVGaWVsZE5hbWVdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChrZXkgIT0gbnVsbCAmJiB2YWx1ZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFwW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyDmjIlrZXnmjpLluo/lkI7pgY3ljoZcclxuICAgICAgICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhtYXApO1xyXG4gICAgICAgICAgICAvL+aUvuW8g+aOkuW6j1xyXG4gICAgICAgICAgICAvL2tleXMuc29ydCgpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGtleXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBrZXkgPSBrZXlzW2pdO1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gbWFwW2tleV07XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlVGV4dCA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWVGaWVsZC50c1R5cGUgPT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZVRleHQgPSBTdHJpbmcodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZVRleHQgPSBgJyR7dmFsdWV9J2A7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAga2V5ID0ga2V5LnJlcGxhY2UoLyAvZywgJ18nKTsvL3JlcGxhY2UoLy0vZywgJ18nKS5cclxuICAgICAgICAgICAgICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiICAgICAgICBbJyVzJ106ICVzLFxcblwiLCBrZXksIHZhbHVlVGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRleHQgKz0gXCJ9XFxuXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGV4dDtcclxuICAgIH1cclxuXHJcbiAgICBjYW5FeHBvcnQoKSB7XHJcbiAgICAgICAgbGV0IHR5cGVfMl92YWxpZCA9IHtcclxuICAgICAgICAgICAgSTogdHJ1ZSxcclxuICAgICAgICAgICAgRjogdHJ1ZSxcclxuICAgICAgICAgICAgUzogdHJ1ZSxcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvLyDmmK/lkKbog73lr7zlh7pcclxuICAgICAgICBzd2l0Y2ggKHRoaXMucnVsZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwibVwiOiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFqb3JGaWVsZCA9IHRoaXMuZmllbGRzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFtYWpvckZpZWxkKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gISF0eXBlXzJfdmFsaWRbbWFqb3JGaWVsZC50eXBlXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwibWFcIjoge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1ham9yRmllbGQgPSB0aGlzLmZpZWxkc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghbWFqb3JGaWVsZCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICEhdHlwZV8yX3ZhbGlkW21ham9yRmllbGQudHlwZV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1tXCI6IHtcclxuICAgICAgICAgICAgICAgIGxldCBtYWpvckZpZWxkID0gdGhpcy5maWVsZHNbMF07XHJcbiAgICAgICAgICAgICAgICBsZXQgbWlub3JGaWVsZCA9IHRoaXMuZmllbGRzWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFtYWpvckZpZWxkIHx8ICFtaW5vckZpZWxkKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gISF0eXBlXzJfdmFsaWRbbWFqb3JGaWVsZC50eXBlXSAmJiAhIXR5cGVfMl92YWxpZFttaW5vckZpZWxkLnR5cGVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJhXCI6IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDliKTmlq3mmK/lkKblj6/ku6XlkIjlubZcclxuICAgICAqIDEuIOaJgOacieWtl+auteWQjeOAgeWtl+auteexu+Wei+W/hemhu+ebuOWQjFxyXG4gICAgICogMi4gaWTkuI3og73lhrLnqoHvvIjmjInnhadt44CBbWHjgIFtbeWIhuWIq+WkhOeQhu+8iVxyXG4gICAgICogQHJldHVybnMgZXJyTXNnXHJcbiAgICAgKi9cclxuICAgIGNhbk1lcmdlKGRiKSB7XHJcbiAgICAgICAgLy8gMS4g5qOA5p+l5a2X5q61XHJcbiAgICAgICAgaWYgKHRoaXMuZmllbGRzLmxlbmd0aCAhPSBkYi5maWVsZHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIuWtl+auteaVsOmHj+S4jeS4gOiHtFwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgZjEgPSB0aGlzLmZpZWxkc1tpXTtcclxuICAgICAgICAgICAgbGV0IGYyID0gZGIuZmllbGRzW2ldO1xyXG4gICAgICAgICAgICBpZiAoZjEubmFtZSAhPSBmMi5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9vbHMuZm9ybWF0KFwi5a2X5q61WyVkXSDlrZfmrrXlkI3kuI3lkIzvvJogbmFtZTE9WyVzXSwgbmFtZTI9WyVzXVwiLCBpLCBmMS5uYW1lLCBmMi5uYW1lKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGYxLnR5cGUgIT0gZjIudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFRvb2xzLmZvcm1hdChcIuWtl+autVslc13nsbvlnovkuI3lkIzvvJogdHlwZTE9WyVzXSwgdHlwZTI9WyVzXVwiLCBmMS5uYW1lLCBmMS50eXBlLCBmMi50eXBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g5qOA5p+lcnVsZVxyXG4gICAgICAgIGlmICh0aGlzLnJ1bGUgIT0gZGIucnVsZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gVG9vbHMuZm9ybWF0KFwicnVsZeS4jeWQjO+8miBydWxlMT1bJXNdLCBydWxlMj1bJXNdXCIsIHRoaXMucnVsZSwgZGIucnVsZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyDmo4Dmn6XmlbDmja7mmK/lkKbph43lpI1cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmRhdGFzKVxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGRiLmRhdGFzKVxyXG4gICAgICAgIHN3aXRjaCAodGhpcy5ydWxlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJtXCI6IHtcclxuICAgICAgICAgICAgICAgIGxldCBtYWpvckZpZWxkID0gdGhpcy5maWVsZHNbMF07XHJcbiAgICAgICAgICAgICAgICBsZXQgbXNnID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAoZGIuZGF0YXMsIChtYWpvcklkLCBkYXRhMikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBkYXRhMSA9IHRoaXMuZGF0YXNbbWFqb3JJZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGExKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1zZyA9IFRvb2xzLmZvcm1hdChcIuaVsOaNrumHjeWkje+8miVzPVslc11cIiwgbWFqb3JGaWVsZC5uYW1lLCBtYWpvcklkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobXNnKSByZXR1cm4gbXNnO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1hXCI6IHtcclxuICAgICAgICAgICAgICAgIC8vIG1h55qE6YOo5YiG55u05o6l5ZCI5bm2XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwibW1cIjoge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1ham9yRmllbGQgPSB0aGlzLmZpZWxkc1swXTtcclxuICAgICAgICAgICAgICAgIGxldCBtaW5vckZpZWxkID0gdGhpcy5maWVsZHNbMV07XHJcbiAgICAgICAgICAgICAgICBsZXQgbXNnID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAoZGIuZGF0YXMsIChtYWpvcklkLCBtYXAyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1hcDEgPSB0aGlzLmRhdGFzW21ham9ySWRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbWFwMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBtYWpvcklk5a+55bqU55qEbWFwMeacquaJvuWIsO+8jOebtOaOpXJldHVyblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAobWFwMiwgKG1pbm9ySWQsIGRhdGEyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkYXRhMSA9IG1hcDFbbWlub3JJZF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXNnID0gVG9vbHMuZm9ybWF0KFwi5pWw5o2u6YeN5aSN77yaJXM9WyVzXSAlcz1bJXNdXCIsIG1ham9yRmllbGQubmFtZSwgbWFqb3JJZCwgbWlub3JGaWVsZC5uYW1lLCBtaW5vcklkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtc2cpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobXNnKSByZXR1cm4gbXNnO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcImFcIjoge1xyXG4gICAgICAgICAgICAgICAgLy8gYeaooeW8j+S4jeajgOafpWlkXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgbWVyZ2VEYihkYikge1xyXG4gICAgICAgIC8vIOS9v+eUqG1lcmdlRGLliY3vvIzor7fnoa7kv53kvb/nlKjkuoZjaGVja+aOpeWPo+i/m+ihjOajgOa1i+OAglxyXG4gICAgICAgIHN3aXRjaCAodGhpcy5ydWxlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJtXCI6IHtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAoZGIuZGF0YXMsIChtYWpvcklkLCBkYXRhMikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YXNbbWFqb3JJZF0gPSBkYXRhMjtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIm1hXCI6IHtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAoZGIuZGF0YXMsIChtYWpvcklkLCBhcnIyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFycjEgPSB0aGlzLmRhdGFzW21ham9ySWRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghYXJyMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDnm7TmjqXkvb/nlKhhcnIyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YXNbbWFqb3JJZF0gPSBhcnIyO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWQiOW5tuaVsOe7hFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycjIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEyID0gYXJyMltpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycjEucHVzaChkYXRhMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJtbVwiOiB7XHJcbiAgICAgICAgICAgICAgICBUb29scy5mb3JFYWNoTWFwKGRiLmRhdGFzLCAobWFqb3JJZCwgbWFwMikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtYXAxID0gdGhpcy5kYXRhc1ttYWpvcklkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hcDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g55u05o6l5L2/55SobWFwMlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGFzW21ham9ySWRdID0gbWFwMjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlkIjlubZtYXBcclxuICAgICAgICAgICAgICAgICAgICAgICAgVG9vbHMuZm9yRWFjaE1hcChtYXAyLCAobWlub3JJZCwgZGF0YTIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcDFbbWlub3JJZF0gPSBkYXRhMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwiYVwiOiB7XHJcbiAgICAgICAgICAgICAgICAvLyDlkIjlubbmlbDnu4RcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGIuZGF0YXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhMiA9IGRiLmRhdGFzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YXMucHVzaChkYXRhMik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g5ZCI5bm25Y6f5aeL5pWw5o2uXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYi5vcmlnaW5EYXRhcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhMiA9IGRiLm9yaWdpbkRhdGFzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbkRhdGFzLnB1c2goZGF0YTIpO1xyXG5cclxuICAgICAgICAgICAgbGV0IG5ld0luZGV4ID0gdGhpcy5vcmlnaW5EYXRhcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICBsZXQgW29yaWdpbkZpbGVQYXRoLCBvcmlnaW5TaGVldE5hbWUsIG9yaWdpblJvd10gPSBkYi5vcmlnaW5EYXRhSW5kZXhfMl9vcmlnaW5GaWxlUGF0aF9vcmlnaW5TaGVldE5hbWVfb3JpZ2luUm93W2ldO1xyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbkRhdGFJbmRleF8yX29yaWdpbkZpbGVQYXRoX29yaWdpblNoZWV0TmFtZV9vcmlnaW5Sb3dbbmV3SW5kZXhdID0gW29yaWdpbkZpbGVQYXRoLCBvcmlnaW5TaGVldE5hbWUsIG9yaWdpblJvd107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyDlkIjlubborablkYpcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRiLndhcm5Mb2cubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbG9nID0gZGIud2FybkxvZ1tpXTtcclxuICAgICAgICAgICAgdGhpcy53YXJuTG9nLnB1c2gobG9nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4gICAgLy8vLy8g6Z2Z5oCB5Yqg6L295pa55rOVIC8vLy8vXHJcbiAgICBzdGF0aWMgX2NhbGNDZWxsQ29vcmQocm93LCBjb2wpIHtcclxuICAgICAgICByZXR1cm4gVG9vbHMuZm9ybWF0KFwiJXMlZFwiLCBDT0xfMl9OQU1FW2NvbF0sIHJvdyArIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBsb2FkRGF0YUJhc2VGcm9tUmF3RGF0YShvcmlnaW5GaWxlUGF0aCA6IHN0cmluZywgcmF3RGF0YSA6IHtuYW1lIDogc3RyaW5nLGRhdGEgOiBzdHJpbmdbXVtdfSkge1xyXG4gICAgICAgIGxldCBkYiA9IG5ldyBEYXRhQmFzZSgpO1xyXG4gICAgICAgIGRiLm9yaWdpbkZpbGVQYXRoID0gb3JpZ2luRmlsZVBhdGg7XHJcbiAgICAgICAgZGIub3JpZ2luU2hlZXROYW1lID0gcmF3RGF0YS5uYW1lO1xyXG5cclxuICAgICAgICBsZXQgZmllbGRzIDogRGF0YUJhc2VGaWVsZFtdICA9IFtdO1xyXG4gICAgICAgIGxldCBmaWVsZE1hcCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG4gICAgICAgIGxldCBvcmlnaW5EYXRhcyA9IFtdO1xyXG4gICAgICAgIC8vIGxldCBvcmlnaW5EYXRhSW5kZXhfMl9vcmlnaW5Sb3cgPSB7fTtcclxuICAgICAgICBsZXQgb3JpZ2luRGF0YUluZGV4XzJfb3JpZ2luRmlsZVBhdGhfb3JpZ2luU2hlZXROYW1lX29yaWdpblJvdyA9IHt9O1xyXG4gICAgICAgIGxldCBleHBvcnRDb25zdHMgOiBbc3RyaW5nLHN0cmluZyxzdHJpbmddW10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IGNoZWNrSWRFbXB0eUZpZWxkSW5kZWllcyA9IFtdO1xyXG5cclxuICAgICAgICBsZXQgYkV4cG9ydEtleSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyDliqDlt6XmlbDmja5cclxuICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCByYXdEYXRhLmRhdGEubGVuZ3RoOyByb3crKykge1xyXG4gICAgICAgICAgICBjb25zdCByb3dEYXRhID0gcmF3RGF0YS5kYXRhW3Jvd10gfHwgW107XHJcblxyXG4gICAgICAgICAgICBsZXQgY21kID0gcm93RGF0YVswXTtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAoY21kKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiREJfTkFNRVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGIubmFtZSA9IHJvd0RhdGFbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiREJfUlVMRVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGIucnVsZSA9IHJvd0RhdGFbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDI7IGkgPCByb3dEYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSByb3dEYXRhW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodiA9PSBcImV4cG9ydF9rZXlcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRiLnJ1bGUgPT0gXCJhXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFRvb2xzLmZvcm1hdChcIlvorablkYpdIOmFjee9ruihqCVz5a+85Ye66KeE5YiZ5Li6Ye+8jOaXoOazleWvvOWHumtleeS4uuW4uOmHj+OAglwiLCBkYi5uYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJFeHBvcnRLZXkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGRiLnJ1bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImFcIjogYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJtYVwiOiBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm1tXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja0lkRW1wdHlGaWVsZEluZGVpZXMgPSBbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrSWRFbXB0eUZpZWxkSW5kZWllcyA9IFswXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiRVhQT1JUX0NPTlNUXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmFybmFtZSA9IHJvd0RhdGFbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGtleUZpZWxkTmFtZSA9IHJvd0RhdGFbMl07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlRmllbGROYW1lID0gcm93RGF0YVszXTtcclxuICAgICAgICAgICAgICAgICAgICBleHBvcnRDb25zdHMucHVzaChbdmFybmFtZSwga2V5RmllbGROYW1lLCB2YWx1ZUZpZWxkTmFtZV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcIkZMRF9UWVBFXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlh7rnjrDph43lpI3nmoRGTERfVFlQReWumuS5ie+8gVwiLCBkYi5uYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5o+Q5Y+W5a2X5q6157G75Z6L77yM5rKh5pyJ6YWN572u5a2X5q6157G75Z6L55qE5YiX6YO95LiN5a+85Ye6XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgY29sID0gMTsgY29sIDwgcm93RGF0YS5sZW5ndGg7IGNvbCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcm93RGF0YVtjb2xdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZCA9IG5ldyBEYXRhQmFzZUZpZWxkKGRiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLnR5cGUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLm9yaWdpbkNvbCA9IGNvbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLnRzVHlwZSA9IGZpZWxkLmNhbGNUc1R5cGUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZpZWxkLnRzVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yM5Ye6546w5pyq55+l5pWw5o2u57G75Z6L77yB5a2X5q615YiXWyVkXSwg5pWw5o2u57G75Z6LWyVzXe+8gVwiLCBkYi5uYW1lLCBjb2wsIHZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJGTERfTkFNRVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBmaWVsZHNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHJvd0RhdGFbZmllbGQub3JpZ2luQ29sXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBmaWVsZHNbaV1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGQubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yM5a2X5q615ZCN6KKr6KaG55uWWyVzXS0+WyVzXVwiLCBkYi5uYW1lLCBmaWVsZC5uYW1lLCB2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQubmFtZSA9IHZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZE1hcC5oYXModmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlh7rnjrDph43lpI3lrZfmrrXlkI1bJXNdXCIsIGRiLm5hbWUsIHZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkTWFwLmFkZCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiRkxEX0RFU0NcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZmllbGRzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSByb3dEYXRhW2ZpZWxkLm9yaWdpbkNvbF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gZmllbGRzW2ldXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkLmRlc2MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC5kZXNjID0gZmllbGQuZGVzYyArIFwiXFxuXCIgKyB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQuZGVzYyA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcIkZMRF9WRVJJRllFUlwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBmaWVsZHNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHJvd0RhdGFbZmllbGQub3JpZ2luQ29sXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBmaWVsZHNbaV1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC52ZXJpZnllcnMucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiRkxEX0lEX01FUkdFX1RPXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZCA9IGZpZWxkc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gcm93RGF0YVtmaWVsZC5vcmlnaW5Db2xdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZCA9IGZpZWxkc1tpXVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZC5pZE1lcmdlVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jGlkTWVyZ2VUb+iiq+imhuebllslc10tPlslc11cIiwgZGIubmFtZSwgZmllbGQuaWRNZXJnZVRvLCB2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQuaWRNZXJnZVRvID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiRkxEX0NPTlZFUlRfTUFQXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZCA9IGZpZWxkc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gcm93RGF0YVtmaWVsZC5vcmlnaW5Db2xdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZCA9IGZpZWxkc1tpXVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZC5jb252ZXJ0TWFwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIxjb252ZXJ0TWFw6KKr6KaG55uWWyVzXS0+WyVzXVwiLCBkYi5uYW1lLCBmaWVsZC5jb252ZXJ0TWFwLCB2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQuY29udmVydE1hcCA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcIkRBVEFcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBkYXRhIDoge1trZXkgOiBzdHJpbmddIDogYW55fSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOmdnuepuuajgOa1i1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBiQ2hlY2tQYXNzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoZWNrSWRFbXB0eUZpZWxkSW5kZWllcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZEluZGV4ID0gY2hlY2tJZEVtcHR5RmllbGRJbmRlaWVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBmaWVsZHNbZmllbGRJbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZmllbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiY2hlY2tJZEVtcHR5RmllbGRJbmRlaWVzIGZpZWxkIG5vdCBmb3VuZFwiLCBkYi5uYW1lLCBmaWVsZEluZGV4KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gcm93RGF0YVtmaWVsZC5vcmlnaW5Db2xdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCAodHlwZW9mIHZhbHVlID09IFwic3RyaW5nXCIgJiYgdmFsdWUgPT0gXCJcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yM5Li76KaBaWTlrZfmrrVbJXNd5LiN6IO95Li656m677yB6K+35qOA5p+l56ysJWTooYzjgIJcIiwgZGIubmFtZSwgZmllbGQubmFtZSwgcm93ICsgMSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYkNoZWNrUGFzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghYkNoZWNrUGFzcykgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZmllbGRzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSByb3dEYXRhW2ZpZWxkLm9yaWdpbkNvbF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjZWxsQ29vcmQgPSB0aGlzLl9jYWxjQ2VsbENvb3JkKHJvdywgZmllbGQub3JpZ2luQ29sKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtmaWVsZC5uYW1lXSA9IGZpZWxkLnBhcnNlVmFsdWUodmFsdWUsIGNlbGxDb29yZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbkRhdGFzLnB1c2goZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luRGF0YUluZGV4XzJfb3JpZ2luRmlsZVBhdGhfb3JpZ2luU2hlZXROYW1lX29yaWdpblJvd1tvcmlnaW5EYXRhcy5sZW5ndGggLSAxXSA9IFtvcmlnaW5GaWxlUGF0aCwgZGIub3JpZ2luU2hlZXROYW1lLCByb3ddO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBcIk1FUkdFX0ZMRF9OQU1FXCI6XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiRkxEX01FUkdFX1RPX0FSUlwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZmllbGRzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSByb3dEYXRhW2ZpZWxkLm9yaWdpbkNvbF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gZmllbGRzW2ldXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkLm1lcmdlVG9BcnJGaWVsZE5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jEZMRF9NRVJHRV9UT19BUlLooqvopobnm5ZbJXNdLT5bJXNdXCIsIGRiLm5hbWUsIGZpZWxkLm1lcmdlVG9BcnJGaWVsZE5hbWUsIHZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC5tZXJnZVRvQXJyRmllbGROYW1lID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZC5iTWVyZ2VUb0FycktlZXBFbXB0eSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIkZMRF9NRVJHRV9UT19BUlJfS0VFUF9FTVBUWVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZmllbGRzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSByb3dEYXRhW2ZpZWxkLm9yaWdpbkNvbF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gZmllbGRzW2ldXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkLm1lcmdlVG9BcnJGaWVsZE5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jEZMRF9NRVJHRV9UT19BUlJfS0VFUF9FTVBUWeiiq+imhuebllslc10tPlslc11cIiwgZGIubmFtZSwgZmllbGQubWVyZ2VUb0FyckZpZWxkTmFtZSwgdmFsdWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLm1lcmdlVG9BcnJGaWVsZE5hbWUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkLmJNZXJnZVRvQXJyS2VlcEVtcHR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJGSUxMX0RFRkFVTFRcIjogLy8g5LuF6ZKI5a+556ym5ZCI57G75Z6L5a2X5q6177yM5b+955Wl5pWw5o2u6ZW/5bqm6K2m5ZGK77yM5L2/55So55So6buY6K6k5YC85aGr5YWF77yaQj1mYWxzZe+8jEk9MO+8jFM9XCJcIu+8jEY9MFxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZmllbGRzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSByb3dEYXRhW2ZpZWxkLm9yaWdpbkNvbF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gZmllbGRzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQuZmlsbERlZmF1bHRWYWx1ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChiRXhwb3J0S2V5KSB7XHJcbiAgICAgICAgICAgIGxldCBtYWpvckZpZWxkID0gZmllbGRzWzBdO1xyXG4gICAgICAgICAgICBleHBvcnRDb25zdHMucHVzaChbXHJcbiAgICAgICAgICAgICAgICBUb29scy5mb3JtYXQoXCIlc18lc1wiLCBkYi5uYW1lLnRvVXBwZXJDYXNlKCksIG1ham9yRmllbGQubmFtZS50b1VwcGVyQ2FzZSgpKSxcclxuICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgIG1ham9yRmllbGQubmFtZSxcclxuICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRiLnNldEZpZWxkcyhmaWVsZHMpO1xyXG5cclxuICAgICAgICAvLyDmoKHpqoxleHBvcnRDb25zdHNcclxuICAgICAgICBmb3IgKGxldCBpID0gZXhwb3J0Q29uc3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGxldCBbdmFybmFtZSwga2V5RmllbGROYW1lLCB2YWx1ZUZpZWxkTmFtZV0gPSBleHBvcnRDb25zdHNbaV07XHJcblxyXG4gICAgICAgICAgICBsZXQga2V5RmllbGQgPSBkYi5nZXRGaWVsZEJ5TmFtZShrZXlGaWVsZE5hbWUpO1xyXG4gICAgICAgICAgICBsZXQgdmFsdWVGaWVsZCA9IGRiLmdldEZpZWxkQnlOYW1lKHZhbHVlRmllbGROYW1lKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOWPmOmHj+WQjVxyXG4gICAgICAgICAgICBpZiAoIXZhcm5hbWUgfHwgIWtleUZpZWxkIHx8ICF2YWx1ZUZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICBkYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jEVYUE9SVF9DT05TVOmFjee9ruW8guW4uO+8gXZhcm5hbWU9WyVzXSBrZXlGaWVsZE5hbWU9WyVzXSB2YWx1ZUZpZWxkTmFtZT1bJXNdXCIsIGRiLm5hbWUsIHZhcm5hbWUsIGtleUZpZWxkTmFtZSwgdmFsdWVGaWVsZE5hbWUpKTtcclxuICAgICAgICAgICAgICAgIGV4cG9ydENvbnN0cy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRiLnNldEV4cG9ydENvbnN0cyhleHBvcnRDb25zdHMpO1xyXG4gICAgICAgIGRiLnNldE9yaWdpbkRhdGFzKG9yaWdpbkRhdGFzLCBvcmlnaW5EYXRhSW5kZXhfMl9vcmlnaW5GaWxlUGF0aF9vcmlnaW5TaGVldE5hbWVfb3JpZ2luUm93KTtcclxuICAgICAgICBkYi5wcm9jZXNzQ29udmVydE1hcCgpO1xyXG4gICAgICAgIC8vIGRiLnByb2Nlc3NNZXJnZVRvQXJyKCk7IC8vIOWcqOi/meWQiOW5tuS8muWvvOiHtOmqjOivgeWksei0pVxyXG4gICAgICAgIHJldHVybiBkYjtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzQ29udmVydE1hcCgpIHtcclxuICAgICAgICBmb3IgKGxldCBmaWVsZEluZGV4ID0gMDsgZmllbGRJbmRleCA8IHRoaXMuZmllbGRzLmxlbmd0aDsgZmllbGRJbmRleCsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gdGhpcy5maWVsZHNbZmllbGRJbmRleF07XHJcbiAgICAgICAgICAgIGlmIChmaWVsZC5jb252ZXJ0TWFwKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygn6ZyA6KaB5aSE55CGY29udmVydE1hcOmAu+i+kScsIHRoaXMubmFtZSwgZmllbGQubmFtZSwgZmllbGQuY29udmVydE1hcClcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbWFwRmllbGRzID0gZmllbGQuY29udmVydE1hcC5yZXBsYWNlKC8gKi9nLCBcIlwiKS5zcGxpdChcIjtcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g6Kej5p6QdHlwZVxyXG4gICAgICAgICAgICAgICAgbGV0IHRzVHlwZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgIGxldCBkaW1lbnNpb25hbCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgdHlwZUluZGV4ID0gMDsgdHlwZUluZGV4IDwgZmllbGQudHlwZS5sZW5ndGg7IHR5cGVJbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGZpZWxkLnR5cGVbdHlwZUluZGV4XTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKEJBU0lDX1RZUEVfMl9UU19UWVBFW3RdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRzVHlwZXMucHVzaChCQVNJQ19UWVBFXzJfVFNfVFlQRVt0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0ID09IFwiQVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbmFsKys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0c1R5cGVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBkaW1lbnNpb25hbCsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiYmFzaWNUeXBlc1wiLCB0c1R5cGVzKVxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJkaW1lbnNpb25hbFwiLCBkaW1lbnNpb25hbClcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobWFwRmllbGRzLmxlbmd0aCAhPSB0c1R5cGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIxjb252ZXJ0TWFwJyVzJy0+JXPlkozmlbDmja7nsbvlnosnJXMnLT4lc+mVv+W6puS4jeWMuemFje+8geivt+ajgOafpeWtl+auteWIhumalOespuaYr+WQpuS4uuWIhuWPtyc7J1wiLCB0aGlzLm5hbWUsIGZpZWxkLmNvbnZlcnRNYXAsIEpTT04uc3RyaW5naWZ5KG1hcEZpZWxkcyksIGZpZWxkLnR5cGUsIEpTT04uc3RyaW5naWZ5KHRzVHlwZXMpKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRpbWVuc2lvbmFsID49IDMpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIOWkhOeQhnRzVHlwZVxyXG4gICAgICAgICAgICAgICAgbGV0IHRlbXBTdHIgPSBcIntcIjtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHNUeXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRzVHlwZSA9IHRzVHlwZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1hcEZpZWxkID0gbWFwRmllbGRzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0ZW1wU3RyICs9IFRvb2xzLmZvcm1hdChcIiVzOiAlc1wiLCBtYXBGaWVsZCwgdHNUeXBlKVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpIDwgdHNUeXBlcy5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBTdHIgKz0gXCIsIFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIHtpdGVtSWQ6IHN0cmluZywgYW1vdW50OiBudW1iZXJ9XHJcbiAgICAgICAgICAgICAgICB0ZW1wU3RyICs9IFwifVwiO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChkaW1lbnNpb25hbCA9PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8ge2l0ZW1JZDogc3RyaW5nLCBhbW91bnQ6IG51bWJlcn1bXVxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBTdHIgKz0gXCJbXVwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZmllbGQudHNUeXBlID0gdGVtcFN0cjtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyDlvIDlp4vpgY3ljobmlbDmja5cclxuICAgICAgICAgICAgICAgIHRoaXMuZm9yRGIoKGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImZvclwiLCBtYWpvcklkLCBtaW5vcklkLCBkYXRhKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5oyJ57u05bqm6L+b6KGM5LiN5ZCM55qE5aSE55CGXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG9yaWdpbkFyciA9IGRhdGFbZmllbGQubmFtZV0gfHwgW107XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpbWVuc2lvbmFsID09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG1hcCA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBtYXBGaWVsZEluZGV4ID0gMDsgbWFwRmllbGRJbmRleCA8IG1hcEZpZWxkcy5sZW5ndGg7IG1hcEZpZWxkSW5kZXgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFwRmllbGQgPSBtYXBGaWVsZHNbbWFwRmllbGRJbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXBbbWFwRmllbGRdID0gb3JpZ2luQXJyW21hcEZpZWxkSW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZmllbGQubmFtZV0gPSBtYXA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGltZW5zaW9uYWwgPT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWFwcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9yaWdpbkFyci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3ViQXJyID0gb3JpZ2luQXJyW2ldIHx8IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtYXAgPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG1hcEZpZWxkSW5kZXggPSAwOyBtYXBGaWVsZEluZGV4IDwgbWFwRmllbGRzLmxlbmd0aDsgbWFwRmllbGRJbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFwRmllbGQgPSBtYXBGaWVsZHNbbWFwRmllbGRJbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwW21hcEZpZWxkXSA9IHN1YkFyclttYXBGaWVsZEluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZmllbGQubmFtZV0gPSBtYXA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwcy5wdXNoKG1hcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtmaWVsZC5uYW1lXSA9IG1hcHM7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIOWwhuWkmuS4quWtl+auteWQiOW5tuaIkOS4gOS4quaVsOe7hCAqL1xyXG4gICAgcHJvY2Vzc01lcmdlVG9BcnIoKSB7XHJcbiAgICAgICAgbGV0IGJLZWVwRW1wdHkgPSBmYWxzZTtcclxuICAgICAgICBsZXQgaGFzTWVyZ2VGbGQgPSBmYWxzZTtcclxuICAgICAgICAvLyDmib7liLDmiYDmnInpnIDopoHlkIjlubbnmoTlrZfmrrVcclxuICAgICAgICBsZXQgbWVyZ2VNYXAgPSB7fTtcclxuICAgICAgICBmb3IgKGxldCBmaWVsZEluZGV4ID0gMDsgZmllbGRJbmRleCA8IHRoaXMuZmllbGRzLmxlbmd0aDsgZmllbGRJbmRleCsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gdGhpcy5maWVsZHNbZmllbGRJbmRleF07XHJcbiAgICAgICAgICAgIGlmIChmaWVsZC5tZXJnZVRvQXJyRmllbGROYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobWVyZ2VNYXBbZmllbGQubWVyZ2VUb0FyckZpZWxkTmFtZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXJnZU1hcFtmaWVsZC5tZXJnZVRvQXJyRmllbGROYW1lXS5wdXNoKGZpZWxkKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWVyZ2VNYXBbZmllbGQubWVyZ2VUb0FyckZpZWxkTmFtZV0gPSBbZmllbGRdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaGFzTWVyZ2VGbGQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBiS2VlcEVtcHR5ID0gISFmaWVsZC5iTWVyZ2VUb0FycktlZXBFbXB0eTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwicHJvY2Vzc01lcmdlVG9BcnJcIiwgYktlZXBFbXB0eSlcclxuXHJcbiAgICAgICAgaWYgKCFoYXNNZXJnZUZsZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyDmo4Dmn6XlkIjlubblrZfmrrXmmK/lkKbmnInlhrLnqoFcclxuICAgICAgICBmb3IgKGxldCBmaWVsZEluZGV4ID0gMDsgZmllbGRJbmRleCA8IHRoaXMuZmllbGRzLmxlbmd0aDsgZmllbGRJbmRleCsrKSB7XHJcbiAgICAgICAgICAgIGxldCBmbGROYW1lID0gdGhpcy5maWVsZHNbZmllbGRJbmRleF0ubmFtZTtcclxuICAgICAgICAgICAgaWYgKG1lcmdlTWFwW2ZsZE5hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlkIjlubblrZfmrrXlkozljp/lp4vlrZfmrrXlhrLnqoFbJXNd77yM5ZCI5bm25aSx6LSlIVwiLCB0aGlzLm5hbWUsIGZsZE5hbWUpKTtcclxuICAgICAgICAgICAgICAgIC8vIOWboOS4uuWGsueqgeS6huWwseS4jeefpemBk+W6lOivpeW5suWYm+S6hu+8jOaJgOS7peebtOaOpemAgOWHuu+8jOWQiOW5tuWksei0pVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyDmo4Dmn6XlrZfmrrXnsbvlnovmmK/lkKbkuIDoh7TvvIjlj6rmnInlkIznsbvlnovlrZfmrrXmiY3og73lkIjlubbvvIlcclxuICAgICAgICBmb3IgKGxldCBrIGluIG1lcmdlTWFwKSB7XHJcbiAgICAgICAgICAgIGxldCBmbGRMaXN0ID0gbWVyZ2VNYXBba107XHJcbiAgICAgICAgICAgIGxldCBtYWpvckZpZWxkID0gZmxkTGlzdFswXTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBmbGRMaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBmbGRMaXN0W2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKG1ham9yRmllbGQudHlwZSAhPSBmaWVsZC50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yM5ZCI5bm25a2X5q61WyVzXeWtmOWcqEZMRF9UWVBF5LiN5LiA6Ie0WyVzXVslc13vvIzlkIjlubblpLHotKUhXCIsIHRoaXMubmFtZSwgaywgbWFqb3JGaWVsZC50eXBlLCBmaWVsZC50eXBlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtYWpvckZpZWxkLmNvbnZlcnRNYXAgIT0gZmllbGQuY29udmVydE1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jOWQiOW5tuWtl+autVslc13lrZjlnKhGTERfQ09OVkVSVF9NQVDkuI3kuIDoh7RbJXNdWyVzXe+8jOWQiOW5tuWksei0pSFcIiwgdGhpcy5uYW1lLCBrLCBtYWpvckZpZWxkLmNvbnZlcnRNYXAsIGZpZWxkLmNvbnZlcnRNYXApKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwibWVyZ2VNYXBcIiwgbWVyZ2VNYXApXHJcblxyXG5cclxuXHJcbiAgICAgICAgLy8g6L+95Yqg5paw5a2X5q615ZKM5paw5pWw5o2uXHJcbiAgICAgICAgbGV0IGNvbCA9IHRoaXMuZmllbGRzW3RoaXMuZmllbGRzLmxlbmd0aCAtIDFdLm9yaWdpbkNvbCArIDE7XHJcbiAgICAgICAgZm9yIChsZXQgayBpbiBtZXJnZU1hcCkge1xyXG4gICAgICAgICAgICBsZXQgZmxkTGlzdCA9IG1lcmdlTWFwW2tdO1xyXG4gICAgICAgICAgICBsZXQgbWFqb3JGaWVsZCA9IGZsZExpc3RbMF07XHJcblxyXG4gICAgICAgICAgICAvLyDmt7vliqDmlrDlrZfmrrVcclxuICAgICAgICAgICAgbGV0IG5ld0ZpZWxkID0gbmV3IERhdGFCYXNlRmllbGQobWFqb3JGaWVsZC5kYik7XHJcbiAgICAgICAgICAgIG5ld0ZpZWxkLm5hbWUgPSBrO1xyXG4gICAgICAgICAgICBuZXdGaWVsZC5kZXNjID0gbWFqb3JGaWVsZC5kZXNjO1xyXG4gICAgICAgICAgICBuZXdGaWVsZC50eXBlID0gbWFqb3JGaWVsZC50eXBlICsgXCJBXCI7XHJcbiAgICAgICAgICAgIG5ld0ZpZWxkLm9yaWdpbkNvbCA9IGNvbCsrO1xyXG4gICAgICAgICAgICBuZXdGaWVsZC50c1R5cGUgPSBtYWpvckZpZWxkLnRzVHlwZSArIFwiW11cIjtcclxuICAgICAgICAgICAgdGhpcy5maWVsZHMucHVzaChuZXdGaWVsZCk7XHJcblxyXG4gICAgICAgICAgICAvLyDmt7vliqDmlrDmlbDmja5cclxuICAgICAgICAgICAgdGhpcy5mb3JEYihmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1lcmdlRGF0YSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgZmxkTGlzdC5sZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gZmxkTGlzdFtpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IGRhdGFbZmllbGQubmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGRhdGFbZmllbGQubmFtZV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghYktlZXBFbXB0eSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzmlbDmja7kuLrnqbrvvIzliJnot7Pov4dcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT0gMCkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QudmFsdWVzKHZhbHVlKS5ldmVyeShmdW5jdGlvbiAodikgeyByZXR1cm4gdiA9PSB1bmRlZmluZWQ7IH0pKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIOaVsOWAvDDkuI3ooajnpLrnqbpcclxuICAgICAgICAgICAgICAgICAgICBtZXJnZURhdGEucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZGF0YVtrXSA9IG1lcmdlRGF0YTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIOWIoOmZpOWQiOW5tueahOWtl+autVxyXG4gICAgICAgIGZvciAobGV0IGsgaW4gbWVyZ2VNYXApIHtcclxuICAgICAgICAgICAgbGV0IGZsZExpc3QgPSBtZXJnZU1hcFtrXTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmbGRMaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWR4ID0gdGhpcy5maWVsZHMuaW5kZXhPZihmbGRMaXN0W2ldKTtcclxuICAgICAgICAgICAgICAgIGlmIChpZHggPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmllbGRzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBsb2FkRnJvbVhsc3hBc3luYyhmaWxlUGF0aCwgZk9uQ29tcGxldGVkKSB7XHJcbiAgICAgICAgbGV0IGRicyA9IFtdO1xyXG5cclxuICAgICAgICAvLyDpgJrov4dub2RlLXhsc3jliqDovb3mlbDmja5cclxuICAgICAgICBUb29scy5sb2FkUmF3RGF0YXNGcm9tWGxzeEFzeW5jKGZpbGVQYXRoLCAocmF3RGF0YXMgOiB7bmFtZSA6IHN0cmluZyxkYXRhIDogc3RyaW5nW11bXX1bXSkgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBzaGVldEluZGV4ID0gMDsgc2hlZXRJbmRleCA8IHJhd0RhdGFzLmxlbmd0aDsgc2hlZXRJbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByYXdEYXRhID0gcmF3RGF0YXNbc2hlZXRJbmRleF07XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGRiID0gdGhpcy5sb2FkRGF0YUJhc2VGcm9tUmF3RGF0YShmaWxlUGF0aCwgcmF3RGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZGJzLnB1c2goZGIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmT25Db21wbGV0ZWQgJiYgZk9uQ29tcGxldGVkKGRicylcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhyYXdEYXRhcylcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgRGF0YUJhc2VGaWVsZCB7XHJcbiAgICBkYiA6IERhdGFCYXNlO1xyXG4gICAgb3JpZ2luQ29sIDogbnVtYmVyO1xyXG4gICAgbmFtZSA6IHN0cmluZztcclxuICAgIHR5cGUgOiBzdHJpbmc7XHJcbiAgICB0c1R5cGUgOiBzdHJpbmc7XHJcbiAgICBkZXNjIDogc3RyaW5nO1xyXG4gICAgdmVyaWZ5ZXJzID0gW107XHJcbiAgICBpZE1lcmdlVG87XHJcbiAgICBjb252ZXJ0TWFwO1xyXG4gICAgZmlsbERlZmF1bHRWYWx1ZSA9IG51bGw7XHJcbiAgICBiTWVyZ2VUb0FycktlZXBFbXB0eSA9IGZhbHNlO1xyXG4gICAgbWVyZ2VUb0FyckZpZWxkTmFtZTtcclxuICAgIHN0YXRpYyBwYXJzZVZhbHVlQ2FjaGUgOiB7W2tleSA6IHN0cmluZ10gOiB7fX0gPSB7fTtcclxuIFxyXG4gICAgY29uc3RydWN0b3IoZGIgOiBEYXRhQmFzZSkge1xyXG4gICAgICAgIHRoaXMuZGIgPSBkYjtcclxuICAgICAgICB0aGlzLnZlcmlmeWVycyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbnN0cnVjdG9yIChrZXksIHR5cGUsIGRlc2MsIHZlcmlmeWVyKSB7XHJcbiAgICAvLyAgICAgdGhpcy5rZXkgPSBrZXk7XHJcbiAgICAvLyAgICAgdGhpcy50eXBlID0gdHlwZTtcclxuICAgIC8vICAgICB0aGlzLmRlc2MgPSBkZXNjO1xyXG4gICAgLy8gICAgIHRoaXMudmVyaWZ5ZXIgPSB2ZXJpZnllciB8fCBbXTtcclxuICAgIC8vIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOiOt+WPlnRz5Lit55qE57G75Z6LXHJcbiAgICAgKiBAcmV0dXJuc1xyXG4gICAgICovXHJcbiAgICBjYWxjVHNUeXBlKCkge1xyXG4gICAgICAgIC8vIOajgOafpeaYr+S4uuWfuuehgOexu+Wei1xyXG4gICAgICAgIGlmIChCQVNJQ19UWVBFXzJfVFNfVFlQRVt0aGlzLnR5cGVdKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBCQVNJQ19UWVBFXzJfVFNfVFlQRVt0aGlzLnR5cGVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMudHlwZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIC8vIOWkjeWQiOexu+Wei1xyXG4gICAgICAgICAgICAvLyDkvp3mrKHpgY3ljoZ0eXBl55qE5a2X5q+NXHJcblxyXG4gICAgICAgICAgICBsZXQgdHNUeXBlcyA9IFtdO1xyXG4gICAgICAgICAgICBsZXQgZGltZW5zaW9uYWwgPSAwO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnR5cGUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHQgPSB0aGlzLnR5cGVbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHRzVHlwZSA9IEJBU0lDX1RZUEVfMl9UU19UWVBFW3RdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRzVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRzVHlwZXMucHVzaCh0c1R5cGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0ID09IFwiQVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGltZW5zaW9uYWwrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRzVHlwZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uYWwrKztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8g5Y+q5pSv5oyBMX4y57u05pWw57uEXHJcbiAgICAgICAgICAgIGlmIChkaW1lbnNpb25hbCA+PSAzIHx8IGRpbWVuc2lvbmFsIDw9IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzkvb/nlKjkuobkuI3mlK/mjIHnmoQlZOe7tOaVsOe7hO+8mlslc11cIiwgdGhpcy5kYi5uYW1lLCBkaW1lbnNpb25hbCwgdGhpcy50eXBlKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLndhcm4oXCLlj6rmlK/mjIExfjLnu7TmlbDnu4RcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGRpbWVuc2lvbmFsID09IDEpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0c1R5cGVzLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFRvb2xzLmZvcm1hdChcIiVzW11cIiwgdHNUeXBlcy5qb2luKFwiLCBcIikpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0c1R5cGVzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFRvb2xzLmZvcm1hdChcImFueVtdXCIsIHRzVHlwZXMuam9pbihcIiwgXCIpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFRvb2xzLmZvcm1hdChcIlslc11cIiwgdHNUeXBlcy5qb2luKFwiLCBcIikpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRpbWVuc2lvbmFsID09IDIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0c1R5cGVzLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFRvb2xzLmZvcm1hdChcIiVzW11bXVwiLCB0c1R5cGVzLmpvaW4oXCIsIFwiKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRzVHlwZXMubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVG9vbHMuZm9ybWF0KFwiYW55W11bXVwiLCB0c1R5cGVzLmpvaW4oXCIsIFwiKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBUb29scy5mb3JtYXQoXCJbJXNdW11cIiwgdHNUeXBlcy5qb2luKFwiLCBcIikpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBpZiAodHNUeXBlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIC8vICAgICBsZXQgdHNUeXBlVGV4dCA9IFRvb2xzLmZvcm1hdChcIlslc11cIiwgdHNUeXBlcy5qb2luKFwiLCBcIikpO1xyXG4gICAgICAgICAgICAvLyAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBkaW1lbnNpb25hbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgdHNUeXBlVGV4dCArPSBcIltdXCI7XHJcbiAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gdHNUeXBlVGV4dDtcclxuICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgX3BhcnNlQmFzaWNWYWx1ZSh2YWx1ZSwgdHlwZSwgb3JpZ2luVmFsdWUsIG9yaWdpblR5cGUsIGNlbGxDb29yZCkge1xyXG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB2YWx1ZSA9IFwiXCI7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwicGFyc2VCYXNpY1ZhbHVlXCIsIHZhbHVlLCB0eXBlLCBvcmlnaW5WYWx1ZSwgY2VsbENvb3JkKTtcclxuXHJcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJJXCI6IHtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiICBJXCIpXHJcbiAgICAgICAgICAgICAgICBsZXQgZm4gPSBwYXJzZUZsb2F0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIC8vIFwiMTsyXCIg5Lmf5Y+v5Lul5q2j5bi46Kej5p6Q5Li6Me+8jOaJgOS7pei/memHjOeahOW8guW4uOWIpOWumueUqHRvU3RyaW5n6L+Y5Y6f5p2l5q+U6L6DXHJcbiAgICAgICAgICAgICAgICBpZiAoZm4udG9TdHJpbmcoKSAhPSB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIxJ57G75Z6L5pWw5o2u6Kej5p6Q5Ye66ZSZ77yadHlwZT1bJXNdLCB2YWx1ZT1bJXNdLCDljZXlhYPmoLw9WyVzXVwiLCB0aGlzLmRiLm5hbWUsIG9yaWdpblR5cGUsIG9yaWdpblZhbHVlLCBjZWxsQ29vcmQpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGZuID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNOYU4oZm4pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5Y+q5pyJ5b2TdmFsdWUgPT0gTmFO5pe277yM5omN5pyJ5Y+v6IO96L+Q6KGM5Yiw6L+Z5Liq5byC5bi4XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jEnnsbvlnovmlbDmja7op6PmnpDlh7rplJnvvJp0eXBlPVslc10sIHZhbHVlPVslc10sIOWNleWFg+agvD1bJXNdXCIsIHRoaXMuZGIubmFtZSwgb3JpZ2luVHlwZSwgb3JpZ2luVmFsdWUsIGNlbGxDb29yZCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZuID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyDnlLHkuo5leGNlbOeahOeyvuW6puWSjGpz5LiN5ZCM77yM5Y+v6IO95Ye6546w5L2N572u5Li6MTAwMO+8jGpz5Lit6K+75Y+W5Ye65pivOTk5Ljk5OTk5OTk5OTk55oiW6ICFMTAwMC4wMDAwMDAwMDHnmoTmg4XlhrXvvIzov5nph4zlhYjpmY3kvY7nsr7luqblho3msYLmlbRcclxuICAgICAgICAgICAgICAgIGxldCBuID0gcGFyc2VJbnQoZm4udG9GaXhlZCgyKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNOYU4obikpIG4gPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmbiAhPSBuKSB0aGlzLmRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yMSeexu+aVsOaNrumFjee9ruS4ukbvvIzkuKLlpLHnsr7luqborablkYrvvIF0eXBlPVslc10sIHZhbHVlPVslc10sIOWNleWFg+agvD1bJXNdXCIsIHRoaXMuZGIubmFtZSwgb3JpZ2luVHlwZSwgb3JpZ2luVmFsdWUsIGNlbGxDb29yZCkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiRlwiOiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbjtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbiA9IDA7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBuID0gcGFyc2VGbG9hdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coVG9vbHMuZm9ybWF0KFwicGFyc2UgRiB2YWx1ZTpbJXNdIG46WyVmXSBuLnRvU3RyaW5nKCk6WyVzXVwiLCB2YWx1ZSwgbiwgbi50b1N0cmluZygpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKG4udG9TdHJpbmcoKSAhPSB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAodmFsdWUgIT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgdGhpcy5kYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jEbnsbvlnovmlbDmja7op6PmnpDlh7rplJnvvJp0eXBlPVslc10sIHZhbHVlPVslc11cIiwgdGhpcy5kYi5uYW1lLCBvcmlnaW5UeXBlLCBvcmlnaW5WYWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIG4gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzTmFOKG4pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIxG57G75Z6L5pWw5o2u6Kej5p6Q5Ye66ZSZ77yadHlwZT1bJXNdLCB2YWx1ZT1bJXNdLCDljZXlhYPmoLw9WyVzXVwiLCB0aGlzLmRiLm5hbWUsIG9yaWdpblR5cGUsIG9yaWdpblZhbHVlLCBjZWxsQ29vcmQpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbiA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjYXNlIFwiU1wiOiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY2FzZSBcIkJcIjoge1xyXG4gICAgICAgICAgICAgICAgbGV0IHN0ciA9IHZhbHVlLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgICAgICAgICAgaWYgKHN0ciA9PSBcInRydWVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdHIgPT0gXCJmYWxzZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSAhPSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jELnsbvmlbDmja7phY3nva7plJnor6/vvIzpnIDopoHkuLpUUlVF5oiWRkFMU0XvvIF0eXBlPVslc10gdmFsdWU9WyVzXSwg5Y2V5YWD5qC8PVslc11cIiwgdGhpcy5kYi5uYW1lLCBvcmlnaW5UeXBlLCBvcmlnaW5WYWx1ZSwgY2VsbENvb3JkKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog5qOA5p+l5Z+656GA57G75Z6LXHJcbiAgICAgKiBAcGFyYW0gdmFsdWUgXHJcbiAgICAgKiBAcGFyYW0gdHlwZSBJIFMgRiBCXHJcbiAgICAgKiBAcmV0dXJucyBcclxuICAgICAqL1xyXG4gICAgX2NoZWNrQmFzaWNWYWx1ZVR5cGUodmFsdWUgOiBhbnksIHR5cGUgOiBzdHJpbmcpIHtcclxuICAgICAgICAvLyDlhYHorrjkuLpudWxsXHJcbiAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJfY2hlY2tCYXNpY1ZhbHVlVHlwZVwiLCB2YWx1ZSwgdHlwZSlcclxuICAgICAgICBpZiAoIUJBU0lDX1RZUEVfMl9UU19UWVBFW3R5cGVdKSB7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiIG5vdCBiYXNpYyB0eXBlXCIpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiSVwiOiB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIklcIiwgdHlwZW9mIHZhbHVlKVxyXG4gICAgICAgICAgICAgICAgLy8g5qOA5p+l57G75Z6LXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9IFwibnVtYmVyXCIpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIml0J3MgbnVtYmVyXCIpXHJcblxyXG4gICAgICAgICAgICAgICAgLy8g5qOA5p+l57K+5bqmXHJcbiAgICAgICAgICAgICAgICBsZXQgbiA9IHBhcnNlSW50KHZhbHVlLnRvRml4ZWQoMikpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9IG4pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIueyvuW6puaNn+WksVwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIFwiRlwiOiB7XHJcbiAgICAgICAgICAgICAgICAvLyDmo4Dmn6XnsbvlnotcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT0gXCJudW1iZXJcIikgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgXCJTXCI6IHtcclxuICAgICAgICAgICAgICAgIC8vIOajgOafpeexu+Wei1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPSBcInN0cmluZ1wiKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBcIkJcIjoge1xyXG4gICAgICAgICAgICAgICAgLy8g5qOA5p+l57G75Z6LXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIF92YWxpZEpzb25WYWx1ZSh2YWx1ZSA6IGFueVtdLCBvcmlnaW5WYWx1ZSA6IHN0cmluZywgY2VsbENvb3JkIDogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICB0aGlzLmRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yM5aSN5ZCI57G75Z6L5a2X5q616Kej5p6Q5byC5bi477yMSlNPTuino+aekOeahOWAvOS4jeaYr+aVsOe7hO+8geOAgnR5cGU9JyVzJywgdmFsdWU9JyVzJywgb3JpZ2luVmFsdWU9JyVzJywg5Y2V5YWD5qC8PVslc11cIiwgdGhpcy5kYi5uYW1lLCB0aGlzLnR5cGUsIHZhbHVlLCBvcmlnaW5WYWx1ZSwgY2VsbENvb3JkKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlLmxlbmd0aCA8PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIOWFgeiuuOepuuaVsOe7hFxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiX3ZhbGlkSnNvblZhbHVlXCIsIGNlbGxDb29yZCwgdGhpcy50eXBlLCBvcmlnaW5WYWx1ZSwgdmFsdWUpO1xyXG5cclxuICAgICAgICAvLyDog73ov5vlhaXliLDov5nph4zvvIzkuIDlrprmmK/lpI3lkIjnsbvlnovjgIJcclxuICAgICAgICBsZXQgdHlwZXMgOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgIGxldCBkaW1lbnNpb25hbCA9IDA7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50eXBlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHQgPSB0aGlzLnR5cGVbaV07XHJcblxyXG4gICAgICAgICAgICBsZXQgdHNUeXBlID0gQkFTSUNfVFlQRV8yX1RTX1RZUEVbdF07XHJcbiAgICAgICAgICAgIGlmICh0c1R5cGUpIHtcclxuICAgICAgICAgICAgICAgIHR5cGVzLnB1c2godCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodCA9PSBcIkFcIikge1xyXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uYWwrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgZGltZW5zaW9uYWwrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiICB0c1R5cGVzXCIsIHR5cGVzKVxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiICBkaW1lbnNpb25hbFwiLCBkaW1lbnNpb25hbClcclxuXHJcbiAgICAgICAgLy8g5LiA57u05pWw57uEXHJcbiAgICAgICAgaWYgKGRpbWVuc2lvbmFsID09IDEpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVzLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDljZXkuIDnsbvlnovvvIzmoKHpqozlgLznsbvlnotcclxuICAgICAgICAgICAgICAgIGxldCBmaWVsZFR5cGUgPSB0eXBlc1swXTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZFZhbHVlID0gdmFsdWVbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9jaGVja0Jhc2ljVmFsdWVUeXBlKGZpZWxkVmFsdWUsIGZpZWxkVHlwZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jOWkjeWQiOexu+Wei+Wtl+auteino+aekOW8guW4uO+8jOWAvOexu+Wei+S4jeWMuemFjeOAgnR5cGU9JyVzJywgdmFsdWU9JyVzJywgZmllbGRUeXBlPSclcycsIGZpbGVkVmFsdWU9JyVzJyDljZXlhYPmoLw9WyVzXVwiLCB0aGlzLmRiLm5hbWUsIHRoaXMudHlwZSwgb3JpZ2luVmFsdWUsIGZpZWxkVHlwZSwgZmllbGRWYWx1ZSwgY2VsbENvb3JkKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgLy8g6Ieq5a6a5LmJ57G75Z6L77yM5piv5ZCm5YWB6K6477yf77yM6Lez6L+H5qCh6aqMXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8g5aSN5ZCI57G75Z6L77yM5qCh6aqM5YC857G75Z6L44CB5qCh6aqM5pWw57uE6ZW/5bqmXHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUubGVuZ3RoICE9IHR5cGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlpI3lkIjnsbvlnovlrZfmrrXop6PmnpDlvILluLjvvIzmlbDmja7plb/luqblkoznsbvlnovplb/luqbkuI3ljLnphY3jgIJ0eXBlPSclcycsIHZhbHVlPSclcycsIOWNleWFg+agvD1bJXNdXCIsIHRoaXMuZGIubmFtZSwgdGhpcy50eXBlLCBvcmlnaW5WYWx1ZSwgY2VsbENvb3JkKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZFZhbHVlID0gdmFsdWVbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkVHlwZSA9IHR5cGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fY2hlY2tCYXNpY1ZhbHVlVHlwZShmaWVsZFZhbHVlLCBmaWVsZFR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlpI3lkIjnsbvlnovlrZfmrrXop6PmnpDlvILluLjvvIzlgLznsbvlnovkuI3ljLnphY3jgIJ0eXBlPSclcycsIHZhbHVlPSclcycsIGZpZWxkVHlwZT0nJXMnLCBmaWxlZFZhbHVlPSclcycg5Y2V5YWD5qC8PVslc11cIiwgdGhpcy5kYi5uYW1lLCB0aGlzLnR5cGUsIG9yaWdpblZhbHVlLCBmaWVsZFR5cGUsIGZpZWxkVmFsdWUsIGNlbGxDb29yZCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChkaW1lbnNpb25hbCA9PSAyKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJvd0FyciA9IHZhbHVlW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd0FycikpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yM5aSN5ZCI57G75Z6L5a2X5q616Kej5p6Q5byC5bi477yM5LqM57u05pWw57uE55qE56ysJWTooYzmiJDlkZgnJXMn5LiN5piv5pWw57uE44CCdHlwZT0nJXMnLCB2YWx1ZT0nJXMnLCDljZXlhYPmoLw9WyVzXVwiLCB0aGlzLmRiLm5hbWUsIGksIHJvd0FyciwgdGhpcy50eXBlLCBvcmlnaW5WYWx1ZSwgY2VsbENvb3JkKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVzLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5Y2V5LiA57G75Z6L77yM5qCh6aqM5YC857G75Z6LXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkVHlwZSA9IHR5cGVzWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcm93QXJyLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkVmFsdWUgPSByb3dBcnJbal07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fY2hlY2tCYXNpY1ZhbHVlVHlwZShmaWVsZFZhbHVlLCBmaWVsZFR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRiLndhcm5Mb2cucHVzaChUb29scy5mb3JtYXQoXCLphY3nva7ooahbJXNd5Lit77yM5aSN5ZCI57G75Z6L5a2X5q616Kej5p6Q5byC5bi477yM5LqM57u05pWw57uE56ysJWTooYzmiJDlkZjlgLznsbvlnovkuI3ljLnphY3jgIJ0eXBlPSclcycsIHZhbHVlPSclcycsIGZpZWxkVHlwZT0nJXMnLCBmaWxlZFZhbHVlPSclcycg5Y2V5YWD5qC8PVslc11cIiwgdGhpcy5kYi5uYW1lLCBpLCB0aGlzLnR5cGUsIG9yaWdpblZhbHVlLCBmaWVsZFR5cGUsIGZpZWxkVmFsdWUsIGNlbGxDb29yZCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g6Ieq5a6a5LmJ57G75Z6L77yM5piv5ZCm5YWB6K6477yf77yM6Lez6L+H5qCh6aqMXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIHZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5aSN5ZCI57G75Z6L77yM5qCh6aqM5YC857G75Z6L44CB5qCh6aqM5pWw57uE6ZW/5bqmXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJvd0Fyci5sZW5ndGggIT0gdHlwZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGIud2FybkxvZy5wdXNoKFRvb2xzLmZvcm1hdChcIumFjee9ruihqFslc13kuK3vvIzlpI3lkIjnsbvlnovlrZfmrrXop6PmnpDlvILluLjvvIzkuoznu7TmlbDnu4TnrKwlZOihjOaIkOWRmOaVsOaNrumVv+W6puWSjOexu+Wei+mVv+W6puS4jeWMuemFjeOAgnR5cGU9JyVzJywgdmFsdWU9JyVzJywg5Y2V5YWD5qC8PVslc11cIiwgdGhpcy5kYi5uYW1lLCBpLCB0aGlzLnR5cGUsIG9yaWdpblZhbHVlLCBjZWxsQ29vcmQpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByb3dBcnIubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGRWYWx1ZSA9IHJvd0FycltqXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkVHlwZSA9IHR5cGVzW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2NoZWNrQmFzaWNWYWx1ZVR5cGUoZmllbGRWYWx1ZSwgZmllbGRUeXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jOWkjeWQiOexu+Wei+Wtl+auteino+aekOW8guW4uO+8jOS6jOe7tOaVsOe7hOesrCVk6KGM5oiQ5ZGY5YC857G75Z6L5LiN5Yy56YWN44CCdHlwZT0nJXMnLCB2YWx1ZT0nJXMnLCBmaWVsZFR5cGU9JyVzJywgZmlsZWRWYWx1ZT0nJXMnIOWNleWFg+agvD1bJXNdXCIsIHRoaXMuZGIubmFtZSwgaSwgdGhpcy50eXBlLCBvcmlnaW5WYWx1ZSwgZmllbGRUeXBlLCBmaWVsZFZhbHVlLCBjZWxsQ29vcmQpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8g5LiN5piv5pWw57uE77yM6L+U5ZuebnVsbFxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwYXJzZVZhbHVlKG9yaWdpblZhbHVlIDogc3RyaW5nLCBjZWxsQ29vcmQgOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAob3JpZ2luVmFsdWUgPT0gbnVsbCkgb3JpZ2luVmFsdWUgPSBcIlwiO1xyXG5cclxuICAgICAgICAvLyDkvJjlhYjlnKjnvJPlrZjkuK3mn6Xor6LvvIzlpoLmnpzlkb3ku6TnvJPlrZjliJnnm7TmjqXkvb/nlKjnvJPlrZjnmoTmlbDmja7vvIzmj5DljYfop6PmnpDmlYjnjodcclxuICAgICAgICBsZXQgY2FjaGUgPSBEYXRhQmFzZUZpZWxkLnBhcnNlVmFsdWVDYWNoZVt0aGlzLnR5cGVdO1xyXG4gICAgICAgIGlmICghY2FjaGUpIHtcclxuICAgICAgICAgICAgY2FjaGUgPSB7fTtcclxuICAgICAgICAgICAgRGF0YUJhc2VGaWVsZC5wYXJzZVZhbHVlQ2FjaGVbdGhpcy50eXBlXSA9IGNhY2hlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGNhY2hlVmFsdWUgPSBjYWNoZVtvcmlnaW5WYWx1ZV07XHJcbiAgICAgICAgaWYgKGNhY2hlVmFsdWUgIT09IHVuZGVmaW5lZCkgcmV0dXJuIGNhY2hlVmFsdWU7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdwYXJzZVZhbHVlJywgdGhpcy50eXBlLCBvcmlnaW5WYWx1ZSlcclxuICAgICAgICAvLyBpZiAob3JpZ2luVmFsdWUgPT0gbnVsbCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIC8vIOWwneivleS9v+eUqOWfuuehgOexu+Wei+ino+aekFxyXG4gICAgICAgIGxldCByZXQgPSB0aGlzLl9wYXJzZUJhc2ljVmFsdWUob3JpZ2luVmFsdWUsIHRoaXMudHlwZSwgb3JpZ2luVmFsdWUsIHRoaXMudHlwZSwgY2VsbENvb3JkKTtcclxuICAgICAgICBpZiAocmV0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnR5cGUubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAvLyDlpI3lkIjnsbvlnotcclxuICAgICAgICAgICAgbGV0IGRhdGEgPSBudWxsO1xyXG4gICAgICAgICAgICAvLyDlsJ3or5XnlKhqc29u6Kej5p6QXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShvcmlnaW5WYWx1ZSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDlv73nlaVcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGRhdGEgJiYgQXJyYXkuaXNBcnJheShkYXRhKSkge1xyXG4gICAgICAgICAgICAgICAgLy8g5qCh6aqManNvbuagvOW8j+eahOaVsOaNruaYr+WQpuato+ehrlxyXG4gICAgICAgICAgICAgICAgZGF0YSA9IHRoaXMuX3ZhbGlkSnNvblZhbHVlKGRhdGEsIG9yaWdpblZhbHVlLCBjZWxsQ29vcmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGpzb27mlbDmja7lvILluLjvvIzph4fnlKjlrZfnrKbkuLLop6PmnpBcclxuICAgICAgICAgICAgLy8g6Kej5p6Q56ym5Y+35LyY5YWI57qn77yaXCJ8XCIsIFwiO1wiXHJcblxyXG4gICAgICAgICAgICAvLyDop6PmnpDnsbvlnotcclxuICAgICAgICAgICAgbGV0IHR5cGVzID0gW107XHJcbiAgICAgICAgICAgIGxldCBkaW1lbnNpb25hbCA9IDA7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudHlwZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdCA9IHRoaXMudHlwZVtpXTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgdHNUeXBlID0gQkFTSUNfVFlQRV8yX1RTX1RZUEVbdF07XHJcbiAgICAgICAgICAgICAgICBpZiAodHNUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZXMucHVzaCh0KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodCA9PSBcIkFcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbmFsKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICBkaW1lbnNpb25hbCsrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhUb29scy5mb3JtYXQoXCLop6PmnpDmlbDnu4Qgb3JpZ2luVmFsdWU9JyVzJywgdHlwZT0nJXMnLCB0eXBlcz0lcywgZGltZW5zaW9uYWw9JWRcIiwgb3JpZ2luVmFsdWUsIHRoaXMudHlwZSwgSlNPTi5zdHJpbmdpZnkodHlwZXMpLCBkaW1lbnNpb25hbCkpO1xyXG4gICAgICAgICAgICBpZiAoZGltZW5zaW9uYWwgPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy8g5LiA57u05pWw57uEXHJcbiAgICAgICAgICAgICAgICBsZXQgYXJyO1xyXG4gICAgICAgICAgICAgICAgaWYgKG9yaWdpblZhbHVlID09PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyID0gW11cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYXJyID0gb3JpZ2luVmFsdWUudG9TdHJpbmcoKS5yZXBsYWNlKC9cXHMvZywgXCJcIikuc3BsaXQoXCI7XCIpIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGFyciA9IG9yaWdpblZhbHVlLnRvU3RyaW5nKCkuc3BsaXQoXCI7XCIpIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiICBzcGxpdFwiLCBKU09OLnN0cmluZ2lmeShhcnIpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcGFyc2VkQXJyID0gW107XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZXMubGVuZ3RoIDw9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDljZXkuIDnsbvlnotcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdCA9IHR5cGVzWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXJyLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZ2ID0gYXJyW2pdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJmb3JcIiwgaiwgdCwgdnYpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLl9wYXJzZUJhc2ljVmFsdWUodnYsIHQsIG9yaWdpblZhbHVlLCB0aGlzLnR5cGUsIGNlbGxDb29yZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZEFyci5wdXNoKHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDmnInlpJrkuKrnsbvlnovvvIznm7TmjqXmjInnhad0eXBlc+ino+aekFxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjb3VudDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5maWxsRGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ID0gdHlwZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlcy5sZW5ndGggIT0gYXJyLmxlbmd0aCAmJiBhcnIubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jOWkjeWQiOexu+Wei+Wtl+auteino+aekOW8guW4uO+8jOaVsOaNrumVv+W6puWSjOexu+Wei+mVv+W6puS4jeWMuemFjeOAgnR5cGU9JyVzJywgdmFsdWU9JyVzJywg5Y2V5YWD5qC8PVslc11cIiwgdGhpcy5kYi5uYW1lLCB0aGlzLnR5cGUsIG9yaWdpblZhbHVlLCBjZWxsQ29vcmQpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IE1hdGgubWluKGFyci5sZW5ndGgsIHR5cGVzLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY291bnQ7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gdHlwZXNbal07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2diA9IGFycltqXSB8fCBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJmb3JcIiwgaiwgdCwgdnYpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLl9wYXJzZUJhc2ljVmFsdWUodnYsIHQsIG9yaWdpblZhbHVlLCB0aGlzLnR5cGUsIGNlbGxDb29yZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZEFyci5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0ID0gcGFyc2VkQXJyO1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coVG9vbHMuZm9ybWF0KFwi6Kej5p6Q5LiA57u05pWw57uEJyVzJyB0eXBlPSclcycsIHJldD0nJXMnXCIsIG9yaWdpblZhbHVlLCB0aGlzLnR5cGUsIEpTT04uc3RyaW5naWZ5KHJldCkpKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGltZW5zaW9uYWwgPT0gMikge1xyXG4gICAgICAgICAgICAgICAgLy8g5LqM57u05pWw57uEXHJcbiAgICAgICAgICAgICAgICByZXQgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIuS6jOe7tOaVsOe7hFwiLCBvcmlnaW5WYWx1ZSwgdHlwZXMpXHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFycjEgPSBbXTtcclxuICAgICAgICAgICAgICAgIGlmIChvcmlnaW5WYWx1ZSAmJiBvcmlnaW5WYWx1ZSAhPT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGFycjEgPSBvcmlnaW5WYWx1ZS50b1N0cmluZygpLnJlcGxhY2UoLyAvZywgXCJcIikuc3BsaXQoXCJ8XCIpIHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGFycjEgPSBvcmlnaW5WYWx1ZS50b1N0cmluZygpLnNwbGl0KFwifFwiKSB8fCBbXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiYXJyMVwiLCBhcnIxKVxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIxLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IGFycjFbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFycjI7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYgPT09IFwiXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJyMiA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycjIgPSB2LnNwbGl0KFwiO1wiKSB8fCBbXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwYXJzZWRBcnIyID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlcy5sZW5ndGggPD0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDljZXkuIDnsbvlnotcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHQgPSB0eXBlc1swXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhcnIyLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2diA9IGFycjJbal07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJmb3JcIiwgaiwgdCwgdnYpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5fcGFyc2VCYXNpY1ZhbHVlKHZ2LCB0LCBvcmlnaW5WYWx1ZSwgdGhpcy50eXBlLCBjZWxsQ29vcmQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VkQXJyMi5wdXNoKHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlpJrnsbvlnotcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvdW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5maWxsRGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IHR5cGVzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlcy5sZW5ndGggIT0gYXJyMi5sZW5ndGggJiYgYXJyMi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYi53YXJuTG9nLnB1c2goVG9vbHMuZm9ybWF0KFwi6YWN572u6KGoWyVzXeS4re+8jOWkjeWQiOexu+Wei+Wtl+auteino+aekOW8guW4uO+8jOaVsOaNrumVv+W6puWSjOexu+Wei+mVv+W6puS4jeWMuemFjeOAgnR5cGU9JyVzJywgdmFsdWU9JyVzJywg5Y2V5YWD5qC8PVslc11cIiwgdGhpcy5kYi5uYW1lLCB0aGlzLnR5cGUsIG9yaWdpblZhbHVlLCBjZWxsQ29vcmQpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ID0gTWF0aC5taW4oYXJyMi5sZW5ndGgsIHR5cGVzLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvdW50OyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSB0eXBlc1tqXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2diA9IGFycjJbal0gfHwgXCJcIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLl9wYXJzZUJhc2ljVmFsdWUodnYsIHQsIG9yaWdpblZhbHVlLCB0aGlzLnR5cGUsIGNlbGxDb29yZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZWRBcnIyLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImZvclwiLCBpLCB2LCBhcnIyLCBwYXJzZWRBcnIyKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXQucHVzaChwYXJzZWRBcnIyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFRvb2xzLmZvcm1hdChcIuino+aekOS6jOe7tOaVsOe7hCclcycgdHlwZT0nJXMnLCByZXQ9JyVzJ1wiLCBvcmlnaW5WYWx1ZSwgdGhpcy50eXBlLCBKU09OLnN0cmluZ2lmeShyZXQpKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNhY2hlW29yaWdpblZhbHVlXSA9IHJldDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuXHJcbn1cclxuIl19