"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const pako_1 = __importDefault(require("pako"));
const asset_db_utils_1 = require("../utils/asset-db-utils");
const file_utils_1 = __importDefault(require("../utils/file-utils"));
const DEBUG = true;
class ProtosExporterPackage {
    static async exportProtos(bundleName) {
        this.bundleName = bundleName;
        this.packages = {};
        const rootPath = path_1.default.join(Editor.Project.path, 'protos', bundleName);
        if (!fs_extra_1.default.existsSync(rootPath)) {
            console.error(`bundle ${bundleName} not exists`);
            return;
        }
        const jsonObject = {};
        const folders = fs_extra_1.default.readdirSync(rootPath);
        //默认下面都是文件夹
        for (let i = 0; i < folders.length; i++) {
            const folderName = folders[i];
            if (folderName.startsWith('.')) {
                continue;
            }
            this.packages[folderName] = {
                name: folderName,
                files: {}
            };
            //获取folerName下面的所有文件
            const folderPath = path_1.default.join(rootPath, folderName);
            if (!fs_extra_1.default.statSync(folderPath).isDirectory()) {
                console.error(`folder ${folderName} not exists`);
                continue;
            }
            //默认所有都是文件
            const files = fs_extra_1.default.readdirSync(folderPath);
            for (let j = 0; j < files.length; j++) {
                const fileName = files[j];
                if (fileName.startsWith('.')) {
                    continue;
                }
                const filePath = path_1.default.join(folderPath, fileName);
                if (!fs_extra_1.default.statSync(filePath).isFile()) {
                    console.error(`file ${fileName} not exists`);
                    continue;
                }
                //获取文件的后缀名
                const extname = path_1.default.extname(fileName);
                if (extname != '.proto') {
                    console.error(`file ${fileName} not a proto file`);
                    continue;
                }
                //读取文件内容
                const content = fs_extra_1.default.readFileSync(filePath, 'utf-8');
                jsonObject[fileName] = content;
                let protoFile = {
                    packageName: folderName,
                    fileName: fileName,
                    importFiles: [],
                    messages: [],
                    enums: [],
                    bundleName: bundleName,
                };
                await this.parseProtoFile(protoFile, filePath);
                let pPackage = this.packages[folderName];
                if (!pPackage) {
                    pPackage = {
                        name: folderName,
                        files: {}
                    };
                    this.packages[folderName] = pPackage;
                }
                pPackage.files[fileName] = protoFile;
            }
        }
        const proto_all_string = JSON.stringify(jsonObject);
        const content = pako_1.default.deflate(proto_all_string, { level: 9 });
        //写入文件
        let outPath = "db://assets";
        if (bundleName == "resources") {
            outPath += "/resources/protos/proto.bin";
        }
        else {
            outPath += "/bundles/" + bundleName + "/protos/proto.bin";
        }
        await asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset(outPath, content, true);
        console.log("导出协议文件成功 -> ", bundleName);
        this.exportProtoPackageDTS();
    }
    /**
     * 导出单个proto文件
     * @param protoFile
     * @param filePath 文件路径，需要一行一行的解析
     */
    static async parseProtoFile(protoFile, filePath) {
        //1.无需解析import，如果遇到非正常类型，一律认为是其他包体的文件
        const lines = file_utils_1.default.GetFileContentByLines(filePath);
        //当前包体名字
        const packageName = protoFile.packageName;
        console.log("开始解析协议 -> ", packageName, ",", filePath);
        let pcomment = '';
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.endsWith("\r")) {
                line = line.substring(0, line.length - 1);
            }
            line = line.trimStart();
            if (line.startsWith("//")) {
                //这是一个注释行
                pcomment = line.substring(2).trim();
                continue;
            }
            DEBUG && console.log("line -> ", line);
            if (line.startsWith("message")) {
                //这是一个消息体
                let messageName = line.split(" ")[1].trim();
                if (messageName.endsWith("{")) {
                    messageName = messageName.substring(0, messageName.length - 1).trim();
                }
                const message = {
                    name: messageName,
                    comment: pcomment,
                    fields: [],
                };
                if (line.endsWith("}")) {
                    //这个消息没有任何字段
                    DEBUG && console.log("没有任何字段的消息：", messageName);
                }
                else {
                    i = this.parseOneMessage(i, lines, message);
                }
                protoFile.messages.push(message);
            }
            else if (line.startsWith("enum")) {
                //这是一个枚举体
                let enumName = line.split(" ")[1].trim();
                if (enumName.endsWith("{")) {
                    enumName = enumName.substring(0, enumName.length - 1);
                }
                let enumd = {
                    name: enumName,
                    comment: pcomment,
                    fields: []
                };
                i = this.parseOneEnum(i, lines, enumd);
                protoFile.enums.push(enumd);
            }
        }
    }
    static parseOneMessage(i, lines, message) {
        //直接开始读取下一行
        let j = i + 1;
        let comment = '';
        for (; j < lines.length; j++) {
            let fieldLine = lines[j].trimStart();
            if (fieldLine.endsWith("\r")) {
                fieldLine = fieldLine.substring(0, fieldLine.length - 1);
            }
            if (fieldLine.startsWith("}")) {
                //message结束了
                i = j;
                break;
            }
            if (fieldLine.startsWith("//")) {
                //这是一个注释行
                comment = fieldLine.substring(2).trim();
                continue;
            }
            if (fieldLine.startsWith("{")) {
                //这个message开始
                continue;
            }
            if (fieldLine == '' || fieldLine.length == 0 || fieldLine.trim() == '') {
                //这是一个空行
                continue;
            }
            //先将fieldLine以;分割 0 -> field结构 1-> 注释
            let arr = fieldLine.split(";").filter((value) => value.trimStart() != '');
            if (arr.length == 0) {
                continue;
            }
            if (arr.length > 1) {
                let str = arr[1].trimStart();
                if (str.startsWith("//")) {
                    //注释拿到
                    arr[1] = str.substring(2);
                    comment = arr[1].trim();
                }
            }
            // = 后面的数据不需要，因为fieldId对客户端导出来说没有意义
            arr[0] = arr[0].split("=")[0];
            if (arr[0].trimStart().startsWith("map")) {
                console.warn("协议字段 map ", fieldLine);
                let arr0 = arr[0].trimStart();
                //这是一个特殊的map<type1,type2> filedName
                //找到<>中的内容
                let start = arr0.indexOf("<") + 1;
                let end = arr0.indexOf(">");
                if (start == -1 || end == -1) {
                    console.error('map类型错误:', arr0);
                    continue;
                }
                let mapType = arr0.substring(start, end).trim();
                //使用,分割mapType
                let mapTypes = mapType.split(",");
                if (mapTypes.length != 2) {
                    console.error('map类型错误:', arr0);
                    continue;
                }
                let keyType = mapTypes[0].trim();
                let valueType = mapTypes[1].trim();
                keyType = this.changeProtoFieldTypeToTsType(keyType);
                let valueType1 = this.changeProtoFieldTypeToTsType(valueType);
                if (valueType1 != 'string' && valueType1 != "number" && valueType1 != "boolean" && valueType1 != "Uint8Array") {
                    //说明是自定义类型
                    //valueType = this._getObjectFiledValueType(valueType);
                    console.log("map中自定义类型：", valueType);
                }
                else {
                    valueType = valueType1;
                }
                //获取到>后面的内容
                arr0 = arr0.substring(end + 1).trim();
                //以=分割arr0
                let arr1 = arr0.split("=");
                let filedName = arr1[0].trim();
                if (arr1.length > 2) {
                    comment = arr1[2].trim();
                }
                let fieldInfo = {
                    name: filedName,
                    type: "{ [key : " + keyType + "] : " + valueType + "}",
                    oldType: "{ [key : " + keyType + "] : " + valueType + "}",
                    index: j,
                    optional: 'required',
                    comment,
                };
                console.log('fieldInfo:', fieldInfo);
                message.fields.push(fieldInfo);
                continue;
            }
            let field = arr[0].trimStart().split(" ");
            //删除field数组中的空格元素
            field = field.filter((value) => value.trim() != '');
            //optional repeated required
            let filedPtype = "optional";
            let oldType = '';
            let filedName = '';
            if (field.length == 2) {
                oldType = field[0].trim();
                filedName = field[1].trim();
            }
            else if (field.length >= 3) {
                filedPtype = field[0].trim();
                oldType = field[1].trim();
                filedName = field[2].trim();
            }
            let type = this.changeProtoFieldTypeToTsType(oldType);
            let fieldInfo = {
                name: filedName,
                type,
                oldType,
                index: j,
                optional: filedPtype,
                comment: arr.length > 1 ? arr[1] : comment,
            };
            DEBUG && console.log('fieldInfo:', fieldInfo);
            message.fields.push(fieldInfo);
        }
        return i;
    }
    static parseOneEnum(i, lines, enumObj) {
        let j = i + 1;
        let comment = '';
        for (; j < lines.length; j++) {
            let fieldLine = lines[j].trimStart();
            if (fieldLine.startsWith("}")) {
                i = j;
                break;
            }
            if (fieldLine.startsWith("{")) {
                continue;
            }
            if (fieldLine.startsWith("//")) {
                comment = fieldLine.substring(2).trim();
                continue;
            }
            if (fieldLine.endsWith("\r")) {
                fieldLine = fieldLine.substring(0, fieldLine.length - 1);
            }
            if (fieldLine == '' || fieldLine.length == 0) {
                continue;
            }
            //先将fieldLine以;分割
            let arr = fieldLine.split(";").filter((value) => value.trimStart() != '');
            if (arr.length == 0) {
                continue;
            }
            if (arr.length > 1) {
                let str = arr[1].trimStart();
                if (str.startsWith("//")) {
                    arr[1] = str.substring(2);
                }
            }
            let field = arr[0].trimStart().split("=");
            //console.log('field:',field);
            let fieldInfo = {
                name: field[0].trim(),
                value: parseInt(field[1].trim()),
                comment: arr.length > 1 ? arr[1] : comment,
            };
            enumObj.fields.push(fieldInfo);
        }
        return i;
    }
    static changeProtoFieldTypeToTsType(fieldType) {
        //console.log('changeProtoFieldTypeToTsType->fieldType:',fieldType);
        switch (fieldType) {
            case 'int32':
            case 'int64':
            case 'uint32':
            case 'uint64':
            case 'sint32':
            case 'sint64':
            case 'fixed32':
            case 'fixed64':
            case 'sfixed32':
            case 'sfixed64':
            case 'float':
            case 'double':
                return 'number';
            case 'bool':
                return 'boolean';
            case 'string':
                return 'string';
            case 'bytes':
                return 'Uint8Array';
            default:
                return fieldType;
        }
    }
    static async exportProtoPackageDTS() {
        const packages = Object.values(this.packages);
        const declarePath = path_1.default.join(Editor.Project.path, "declare");
        let tsFilePath = "db://assets/";
        if (this.bundleName == "resources") {
            tsFilePath += "resources/scripts/auto/message/defines/";
        }
        else {
            tsFilePath += "bundles/" + this.bundleName + "/scripts/auto/message/defines/";
        }
        for (let i = 0; i < packages.length; i++) {
            const p = packages[i];
            let allMessageNames = [];
            const files = Object.values(p.files);
            const packageName = p.name;
            const dtsfileName = path_1.default.join(declarePath, packageName + ".d.ts");
            const tsFileName = tsFilePath + packageName + ".ts";
            let textdts = '';
            let text = '';
            textdts += "declare namespace " + packageName + "{\n\n";
            text += "export namespace " + packageName + "{\n\n";
            textdts += "    const PACKAGE_NAME = '" + packageName + "';\n\n";
            text += "    export const PACKAGE_NAME = '" + packageName + "';\n\n";
            //将当前包体里面所有的proto文件写入到一个文件中
            for (let j = 0; j < files.length; j++) {
                const protoFile = files[j];
                const results = this.writeOneProtoFileDTS(protoFile, text, textdts);
                text = results.text;
                textdts = results.textdts;
                allMessageNames = allMessageNames.concat(results.messageNames);
            }
            console.log("allMessageNames = ", allMessageNames.length, allMessageNames);
            //将allMessageNames写成一个enum
            textdts += "    enum Message {\n";
            text += "    export enum Message {\n";
            for (let j = 0; j < allMessageNames.length; j++) {
                const mName = allMessageNames[j];
                const comment = mName.comment;
                const msgName = mName.name;
                textdts += "        /**" + comment + "**/\n";
                textdts += "        " + msgName + " = '" + msgName + "',\n";
                text += "        /**" + comment + "**/\n";
                text += "        " + msgName + " = '" + msgName + "',\n";
            }
            textdts += "    }\n\n";
            text += "    }\n\n";
            //最后收尾
            textdts += "}\n";
            text += "}\n";
            text += "window['" + packageName + "'] = " + packageName + ";\n";
            //写入dts
            fs_extra_1.default.writeFileSync(dtsfileName, textdts);
            await asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset(tsFileName, text, true);
            console.log("导出协议文件成功 -> ", packageName);
        }
    }
    static writeOneProtoFileDTS(protoFile, text, textdts) {
        const enums = protoFile.enums;
        let messageNames = [];
        //先写enum
        for (let i = 0; i < enums.length; i++) {
            const enumd = enums[i];
            textdts += "    /** " + enumd.comment + " */\n";
            textdts += "    enum " + enumd.name + "{\n";
            text += "    /** " + enumd.comment + " */\n";
            text += "    export enum " + enumd.name + "{\n";
            for (let j = 0; j < enumd.fields.length; j++) {
                let field = enumd.fields[j];
                textdts += "        /** " + field.comment + " */\n";
                textdts += "        " + field.name + " = " + field.value + ",\n";
                text += "        /** " + field.comment + " */\n";
                text += "        " + field.name + " = " + field.value + ",\n";
            }
            textdts += "    }\n\n";
            text += "    }\n\n";
        }
        //将所有message的name写成enum
        messageNames = protoFile.messages.map((message) => {
            return { name: message.name, comment: message.comment };
        });
        //写message
        for (let i = 0; i < protoFile.messages.length; i++) {
            let message = protoFile.messages[i];
            textdts += "    /** " + message.comment + " */\n";
            textdts += "    interface " + message.name + "{\n";
            text += "    /** " + message.comment + " */\n";
            text += "    export interface " + message.name + "{\n";
            for (let j = 0; j < message.fields.length; j++) {
                let field = message.fields[j];
                const pType = this._getFieldType(field);
                textdts += "        /** " + field.comment + " */\n";
                text += "        /** " + field.comment + " */\n";
                if (field.optional == 'optional') {
                    textdts += "        " + field.name + "? : " + pType + ";\n";
                    text += "        " + field.name + "? : " + pType + ";\n";
                }
                else if (field.optional == 'required' || field.optional == 'repeated') {
                    textdts += "        " + field.name + " : " + pType + ";\n";
                    text += "        " + field.name + " : " + pType + ";\n";
                }
            }
            textdts += "    }\n\n";
            text += "    }\n\n";
        }
        return {
            text,
            textdts,
            messageNames
        };
    }
    static _getFieldType(field) {
        let type = field.type;
        const filedPtype = field.optional;
        const oldType = field.oldType;
        if (type.includes(".")) {
            //例如common.Result 被认为是引用common包体里面的enum/message
        }
        if (filedPtype == 'repeated') {
            type = type + "[]";
        }
        return type;
    }
}
exports.default = ProtosExporterPackage;
ProtosExporterPackage.packages = {};
ProtosExporterPackage.bundleName = '';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdG9zLWV4cG9ydGVyLXBhY2thZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvcHJvdG9zL3Byb3Rvcy1leHBvcnRlci1wYWNrYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLHdEQUEwQjtBQUMxQixnREFBd0I7QUFDeEIsNERBQXVEO0FBQ3ZELHFFQUE0QztBQUU1QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUM7QUFFbkIsTUFBcUIscUJBQXFCO0lBSS9CLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLFVBQW1CO1FBQ2hELElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzdCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ25CLE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3JFLElBQUcsQ0FBQyxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBQztZQUN4QixPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsVUFBVSxhQUFhLENBQUMsQ0FBQztZQUNqRCxPQUFPO1NBQ1Y7UUFDRCxNQUFNLFVBQVUsR0FBK0IsRUFBRSxDQUFDO1FBQ2xELE1BQU0sT0FBTyxHQUFHLGtCQUFFLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pDLFdBQVc7UUFDWCxLQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBQyxDQUFDLEdBQUMsT0FBTyxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUUsRUFBQztZQUMvQixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsSUFBRyxVQUFVLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFDO2dCQUMxQixTQUFTO2FBQ1o7WUFDRCxJQUFJLENBQUMs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QUMsUUFBUSxDQUFDO1FBQ2xDLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7UUFDOUIsSUFBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFDO1lBQ2xCLCtDQUErQztTQUVsRDtRQUNELElBQUcsVUFBVSxJQUFJLFVBQVUsRUFBQztZQUN4QixJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztTQUN0QjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7O0FBMWRMLHdDQTJkQztBQXpka0IsOEJBQVEsR0FBNkMsRUFBRSxDQUFDO0FBQ3hELGdDQUFVLEdBQVksRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmcy1leHRyYVwiO1xyXG5pbXBvcnQgUGFrbyBmcm9tIFwicGFrb1wiO1xyXG5pbXBvcnQgeyBBc3NldERiVXRpbHMgfSBmcm9tIFwiLi4vdXRpbHMvYXNzZXQtZGItdXRpbHNcIjtcclxuaW1wb3J0IEZpbGVVdGlscyBmcm9tIFwiLi4vdXRpbHMvZmlsZS11dGlsc1wiO1xyXG5cclxuY29uc3QgREVCVUcgPSB0cnVlO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJvdG9zRXhwb3J0ZXJQYWNrYWdlIHtcclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBwYWNrYWdlcyA6IHtbcGFja2FnZU5hbWUgOiBzdHJpbmddIDogUHJvdG9QYWNrYWdlfSA9IHt9O1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgYnVuZGxlTmFtZSA6IHN0cmluZyA9ICcnO1xyXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBleHBvcnRQcm90b3MoYnVuZGxlTmFtZSA6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuYnVuZGxlTmFtZSA9IGJ1bmRsZU5hbWU7XHJcbiAgICAgICAgdGhpcy5wYWNrYWdlcyA9IHt9O1xyXG4gICAgICAgIGNvbnN0IHJvb3RQYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsJ3Byb3RvcycsIGJ1bmRsZU5hbWUpO1xyXG4gICAgICAgIGlmKCFmcy5leGlzdHNTeW5jKHJvb3RQYXRoKSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGJ1bmRsZSAke2J1bmRsZU5hbWV9IG5vdCBleGlzdHNgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBqc29uT2JqZWN0OiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xyXG4gICAgICAgIGNvbnN0IGZvbGRlcnMgPSBmcy5yZWFkZGlyU3luYyhyb290UGF0aCk7XHJcbiAgICAgICAgLy/pu5jorqTkuIvpnaLpg73mmK/mlofku7blpLlcclxuICAgICAgICBmb3IobGV0IGkgPSAwO2k8Zm9sZGVycy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgY29uc3QgZm9sZGVyTmFtZSA9IGZvbGRlcnNbaV07XHJcbiAgICAgICAgICAgIGlmKGZvbGRlck5hbWUuc3RhcnRzV2l0aCgnLicpKXtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucGFja2FnZXNbZm9sZGVyTmFtZV0gPSB7XHJcbiAgICAgICAgICAgICAgICBuYW1lIDogZm9sZGVyTmFtZSxcclxuICAgICAgICAgICAgICAgIGZpbGVzIDoge31cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLy/ojrflj5Zmb2xlck5hbWXkuIvpnaLnmoTmiYDmnInmlofku7ZcclxuICAgICAgICAgICAgY29uc3QgZm9sZGVyUGF0aCA9IHBhdGguam9pbihyb290UGF0aCxmb2xkZXJOYW1lKTtcclxuICAgICAgICAgICAgaWYoIWZzLnN0YXRTeW5jKGZvbGRlclBhdGgpLmlzRGlyZWN0b3J5KCkpe1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZm9sZGVyICR7Zm9sZGVyTmFtZX0gbm90IGV4aXN0c2ApO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8v6buY6K6k5omA5pyJ6YO95piv5paH5Lu2XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoZm9sZGVyUGF0aCk7XHJcbiAgICAgICAgICAgIGZvcihsZXQgaiA9IDA7ajxmaWxlcy5sZW5ndGg7aisrKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVOYW1lID0gZmlsZXNbal07XHJcbiAgICAgICAgICAgICAgICBpZihmaWxlTmFtZS5zdGFydHNXaXRoKCcuJykpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oZm9sZGVyUGF0aCxmaWxlTmFtZSk7XHJcbiAgICAgICAgICAgICAgICBpZighZnMuc3RhdFN5bmMoZmlsZVBhdGgpLmlzRmlsZSgpKXtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBmaWxlICR7ZmlsZU5hbWV9IG5vdCBleGlzdHNgKTtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8v6I635Y+W5paH5Lu255qE5ZCO57yA5ZCNXHJcbiAgICAgICAgICAgICAgICBjb25zdCBleHRuYW1lID0gcGF0aC5leHRuYW1lKGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmKGV4dG5hbWUgIT0gJy5wcm90bycpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGZpbGUgJHtmaWxlTmFtZX0gbm90IGEgcHJvdG8gZmlsZWApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy/or7vlj5bmlofku7blhoXlrrlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsJ3V0Zi04Jyk7XHJcbiAgICAgICAgICAgICAgICBqc29uT2JqZWN0W2ZpbGVOYW1lXSA9IGNvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICBsZXQgcHJvdG9GaWxlIDogUHJvdG9GaWxlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhY2thZ2VOYW1lIDogZm9sZGVyTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBmaWxlTmFtZSAgICA6IGZpbGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydEZpbGVzIDogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXMgICAgOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICBlbnVtcyAgICAgICA6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgIGJ1bmRsZU5hbWUgIDogYnVuZGxlTmFtZSxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBhcnNlUHJvdG9GaWxlKHByb3RvRmlsZSxmaWxlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgcFBhY2thZ2UgOiBQcm90b1BhY2thZ2UgPSB0aGlzLnBhY2thZ2VzW2ZvbGRlck5hbWVdO1xyXG4gICAgICAgICAgICAgICAgaWYoIXBQYWNrYWdlKXtcclxuICAgICAgICAgICAgICAgICAgICBwUGFja2FnZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSA6IGZvbGRlck5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVzIDoge31cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFja2FnZXNbZm9sZGVyTmFtZV0gPSBwUGFja2FnZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHBQYWNrYWdlLmZpbGVzW2ZpbGVOYW1lXSA9IHByb3RvRmlsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBwcm90b19hbGxfc3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoanNvbk9iamVjdCk7XHJcbiAgICAgICAgY29uc3QgY29udGVudCA9IFBha28uZGVmbGF0ZShwcm90b19hbGxfc3RyaW5nLCB7IGxldmVsOiA5fSk7XHJcbiAgICAgICAgLy/lhpnlhaXmlofku7ZcclxuICAgICAgICBsZXQgb3V0UGF0aCA9IFwiZGI6Ly9hc3NldHNcIjtcclxuICAgICAgICBpZihidW5kbGVOYW1lID09IFwicmVzb3VyY2VzXCIpe1xyXG4gICAgICAgICAgICBvdXRQYXRoICs9IFwiL3Jlc291cmNlcy9wcm90b3MvcHJvdG8uYmluXCI7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIG91dFBhdGggKz0gXCIvYnVuZGxlcy9cIiArIGJ1bmRsZU5hbWUgKyBcIi9wcm90b3MvcHJvdG8uYmluXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF3YWl0IEFzc2V0RGJVdGlscy5SZXF1ZXN0Q3JlYXRlTmV3QXNzZXQob3V0UGF0aCwgY29udGVudCBhcyBhbnksIHRydWUpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwi5a+85Ye65Y2P6K6u5paH5Lu25oiQ5YqfIC0+IFwiLCBidW5kbGVOYW1lKTtcclxuICAgICAgICB0aGlzLmV4cG9ydFByb3RvUGFja2FnZURUUygpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIOWvvOWHuuWNleS4qnByb3Rv5paH5Lu2XHJcbiAgICAgKiBAcGFyYW0gcHJvdG9GaWxlIFxyXG4gICAgICogQHBhcmFtIGZpbGVQYXRoIOaWh+S7tui3r+W+hO+8jOmcgOimgeS4gOihjOS4gOihjOeahOino+aekCBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgcGFyc2VQcm90b0ZpbGUocHJvdG9GaWxlIDogUHJvdG9GaWxlLGZpbGVQYXRoIDogc3RyaW5nKSB7XHJcbiAgICAgICAgLy8xLuaXoOmcgOino+aekGltcG9ydO+8jOWmguaenOmBh+WIsOmdnuato+W4uOexu+Wei++8jOS4gOW+i+iupOS4uuaYr+WFtuS7luWMheS9k+eahOaWh+S7tlxyXG4gICAgICAgIGNvbnN0IGxpbmVzID0gRmlsZVV0aWxzLkdldEZpbGVDb250ZW50QnlMaW5lcyhmaWxlUGF0aCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy/lvZPliY3ljIXkvZPlkI3lrZdcclxuICAgICAgICBjb25zdCBwYWNrYWdlTmFtZSA9IHByb3RvRmlsZS5wYWNrYWdlTmFtZTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIuW8gOWni+ino+aekOWNj+iuriAtPiBcIixwYWNrYWdlTmFtZSxcIixcIixmaWxlUGF0aCk7XHJcbiAgICAgICAgbGV0IHBjb21tZW50ID0gJyc7XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpPGxpbmVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBsZXQgbGluZSA9IGxpbmVzW2ldO1xyXG4gICAgICAgICAgICBpZihsaW5lLmVuZHNXaXRoKFwiXFxyXCIpKXtcclxuICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lLnN1YnN0cmluZygwLGxpbmUubGVuZ3RoLTEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxpbmUgPSBsaW5lLnRyaW1TdGFydCgpO1xyXG4gICAgICAgICAgICBpZiAobGluZS5zdGFydHNXaXRoKFwiLy9cIikpIHtcclxuICAgICAgICAgICAgICAgIC8v6L+Z5piv5LiA5Liq5rOo6YeK6KGMXHJcbiAgICAgICAgICAgICAgICBwY29tbWVudCA9IGxpbmUuc3Vic3RyaW5nKDIpLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIERFQlVHICYmIGNvbnNvbGUubG9nKFwibGluZSAtPiBcIiwgbGluZSk7XHJcbiAgICAgICAgICAgIGlmKGxpbmUuc3RhcnRzV2l0aChcIm1lc3NhZ2VcIikpe1xyXG4gICAgICAgICAgICAgICAgLy/ov5nmmK/kuIDkuKrmtojmga/kvZNcclxuICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlTmFtZSA9IGxpbmUuc3BsaXQoXCIgXCIpWzFdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIGlmKG1lc3NhZ2VOYW1lLmVuZHNXaXRoKFwie1wiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZU5hbWUgPSBtZXNzYWdlTmFtZS5zdWJzdHJpbmcoMCxtZXNzYWdlTmFtZS5sZW5ndGgtMSkudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA6IFByb3RvTWVzc2FnZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lIDogbWVzc2FnZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWVudCA6IHBjb21tZW50LFxyXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkcyA6IFtdLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYobGluZS5lbmRzV2l0aChcIn1cIikpe1xyXG4gICAgICAgICAgICAgICAgICAgIC8v6L+Z5Liq5raI5oGv5rKh5pyJ5Lu75L2V5a2X5q61XHJcbiAgICAgICAgICAgICAgICAgICAgREVCVUcgJiYgY29uc29sZS5sb2coXCLmsqHmnInku7vkvZXlrZfmrrXnmoTmtojmga/vvJpcIixtZXNzYWdlTmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICBpID0gdGhpcy5wYXJzZU9uZU1lc3NhZ2UoaSwgbGluZXMsIG1lc3NhZ2UpOyBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHByb3RvRmlsZS5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9ZWxzZSBpZihsaW5lLnN0YXJ0c1dpdGgoXCJlbnVtXCIpKXtcclxuICAgICAgICAgICAgICAgIC8v6L+Z5piv5LiA5Liq5p6a5Li+5L2TXHJcbiAgICAgICAgICAgICAgICBsZXQgZW51bU5hbWUgPSBsaW5lLnNwbGl0KFwiIFwiKVsxXS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZW51bU5hbWUuZW5kc1dpdGgoXCJ7XCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW51bU5hbWUgPSBlbnVtTmFtZS5zdWJzdHJpbmcoMCwgZW51bU5hbWUubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsZXQgZW51bWQ6IFByb3RvRW51bSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBlbnVtTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBjb21tZW50OiBwY29tbWVudCxcclxuICAgICAgICAgICAgICAgICAgICBmaWVsZHM6IFtdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgaSA9IHRoaXMucGFyc2VPbmVFbnVtKGksbGluZXMsZW51bWQpO1xyXG4gICAgICAgICAgICAgICAgcHJvdG9GaWxlLmVudW1zLnB1c2goZW51bWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIHBhcnNlT25lTWVzc2FnZShpIDogbnVtYmVyLGxpbmVzIDogc3RyaW5nW10sIG1lc3NhZ2UgOiBQcm90b01lc3NhZ2Upe1xyXG4gICAgICAgIC8v55u05o6l5byA5aeL6K+75Y+W5LiL5LiA6KGMXHJcbiAgICAgICAgbGV0IGogPSBpICsgMTtcclxuICAgICAgICBsZXQgY29tbWVudCA9ICcnO1xyXG4gICAgICAgIGZvcig7ajxsaW5lcy5sZW5ndGg7aisrKXtcclxuICAgICAgICAgICAgbGV0IGZpZWxkTGluZSA9IGxpbmVzW2pdLnRyaW1TdGFydCgpO1xyXG4gICAgICAgICAgICBpZiAoZmllbGRMaW5lLmVuZHNXaXRoKFwiXFxyXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBmaWVsZExpbmUgPSBmaWVsZExpbmUuc3Vic3RyaW5nKDAsIGZpZWxkTGluZS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihmaWVsZExpbmUuc3RhcnRzV2l0aChcIn1cIikpe1xyXG4gICAgICAgICAgICAgICAgLy9tZXNzYWdl57uT5p2f5LqGXHJcbiAgICAgICAgICAgICAgICBpID0gajtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKGZpZWxkTGluZS5zdGFydHNXaXRoKFwiLy9cIikpe1xyXG4gICAgICAgICAgICAgICAgLy/ov5nmmK/kuIDkuKrms6jph4rooYxcclxuICAgICAgICAgICAgICAgIGNvbW1lbnQgPSBmaWVsZExpbmUuc3Vic3RyaW5nKDIpLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKGZpZWxkTGluZS5zdGFydHNXaXRoKFwie1wiKSl7XHJcbiAgICAgICAgICAgICAgICAvL+i/meS4qm1lc3NhZ2XlvIDlp4tcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChmaWVsZExpbmUgPT0gJycgfHwgZmllbGRMaW5lLmxlbmd0aCA9PSAwIHx8IGZpZWxkTGluZS50cmltKCkgPT0gJycpIHtcclxuICAgICAgICAgICAgICAgIC8v6L+Z5piv5LiA5Liq56m66KGMXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL+WFiOWwhmZpZWxkTGluZeS7pTvliIblibIgMCAtPiBmaWVsZOe7k+aehCAxLT4g5rOo6YeKXHJcbiAgICAgICAgICAgIGxldCBhcnIgPSBmaWVsZExpbmUuc3BsaXQoXCI7XCIpLmZpbHRlcigodmFsdWUpID0+IHZhbHVlLnRyaW1TdGFydCgpICE9ICcnKTtcclxuICAgICAgICAgICAgaWYgKGFyci5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoYXJyLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgIGxldCBzdHIgPSBhcnJbMV0udHJpbVN0YXJ0KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyLnN0YXJ0c1dpdGgoXCIvL1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8v5rOo6YeK5ou/5YiwXHJcbiAgICAgICAgICAgICAgICAgICAgYXJyWzFdID0gc3RyLnN1YnN0cmluZygyKTtcclxuICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gYXJyWzFdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyA9IOWQjumdoueahOaVsOaNruS4jemcgOimge+8jOWboOS4umZpZWxkSWTlr7nlrqLmiLfnq6/lr7zlh7rmnaXor7TmsqHmnInmhI/kuYlcclxuICAgICAgICAgICAgYXJyWzBdID0gYXJyWzBdLnNwbGl0KFwiPVwiKVswXTtcclxuICAgICAgICAgICAgaWYoYXJyWzBdLnRyaW1TdGFydCgpLnN0YXJ0c1dpdGgoXCJtYXBcIikpe1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi5Y2P6K6u5a2X5q61IG1hcCBcIixmaWVsZExpbmUpO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFycjAgPSBhcnJbMF0udHJpbVN0YXJ0KCk7XHJcbiAgICAgICAgICAgICAgICAvL+i/meaYr+S4gOS4queJueauiueahG1hcDx0eXBlMSx0eXBlMj4gZmlsZWROYW1lXHJcbiAgICAgICAgICAgICAgICAvL+aJvuWIsDw+5Lit55qE5YaF5a65XHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnQgPSBhcnIwLmluZGV4T2YoXCI8XCIpICsgMTtcclxuICAgICAgICAgICAgICAgIGxldCBlbmQgPSBhcnIwLmluZGV4T2YoXCI+XCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXJ0ID09IC0xIHx8IGVuZCA9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ21hcOexu+Wei+mUmeivrzonLCBhcnIwKTtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxldCBtYXBUeXBlID0gYXJyMC5zdWJzdHJpbmcoc3RhcnQsIGVuZCkudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgLy/kvb/nlKgs5YiG5YmybWFwVHlwZVxyXG4gICAgICAgICAgICAgICAgbGV0IG1hcFR5cGVzID0gbWFwVHlwZS5zcGxpdChcIixcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAobWFwVHlwZXMubGVuZ3RoICE9IDIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdtYXDnsbvlnovplJnor686JywgYXJyMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsZXQga2V5VHlwZSA9IG1hcFR5cGVzWzBdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZVR5cGUgPSBtYXBUeXBlc1sxXS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICBrZXlUeXBlID0gdGhpcy5jaGFuZ2VQcm90b0ZpZWxkVHlwZVRvVHNUeXBlKGtleVR5cGUpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlVHlwZTEgPSB0aGlzLmNoYW5nZVByb3RvRmllbGRUeXBlVG9Uc1R5cGUodmFsdWVUeXBlKTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZVR5cGUxICE9ICdzdHJpbmcnICYmIHZhbHVlVHlwZTEgIT0gXCJudW1iZXJcIiAmJiB2YWx1ZVR5cGUxICE9IFwiYm9vbGVhblwiICYmIHZhbHVlVHlwZTEgIT0gXCJVaW50OEFycmF5XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL+ivtOaYjuaYr+iHquWumuS5ieexu+Wei1xyXG4gICAgICAgICAgICAgICAgICAgIC8vdmFsdWVUeXBlID0gdGhpcy5fZ2V0T2JqZWN0RmlsZWRWYWx1ZVR5cGUodmFsdWVUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIm1hcOS4reiHquWumuS5ieexu+Wei++8mlwiLHZhbHVlVHlwZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlVHlwZSA9IHZhbHVlVHlwZTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL+iOt+WPluWIsD7lkI7pnaLnmoTlhoXlrrlcclxuICAgICAgICAgICAgICAgIGFycjAgPSBhcnIwLnN1YnN0cmluZyhlbmQgKyAxKS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICAvL+S7pT3liIblibJhcnIwXHJcbiAgICAgICAgICAgICAgICBsZXQgYXJyMSA9IGFycjAuc3BsaXQoXCI9XCIpO1xyXG4gICAgICAgICAgICAgICAgbGV0IGZpbGVkTmFtZSA9IGFycjFbMF0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFycjEubGVuZ3RoID4gMikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSBhcnIxWzJdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxldCBmaWVsZEluZm86IFByb3RvRmllbGQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogZmlsZWROYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwieyBba2V5IDogXCIgKyBrZXlUeXBlICsgXCJdIDogXCIgKyB2YWx1ZVR5cGUgKyBcIn1cIixcclxuICAgICAgICAgICAgICAgICAgICBvbGRUeXBlOiBcInsgW2tleSA6IFwiICsga2V5VHlwZSArIFwiXSA6IFwiICsgdmFsdWVUeXBlICsgXCJ9XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGosXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uYWw6ICdyZXF1aXJlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWVudCxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZmllbGRJbmZvOicsIGZpZWxkSW5mbyk7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlLmZpZWxkcy5wdXNoKGZpZWxkSW5mbyk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IGZpZWxkID0gYXJyWzBdLnRyaW1TdGFydCgpLnNwbGl0KFwiIFwiKTtcclxuICAgICAgICAgICAgLy/liKDpmaRmaWVsZOaVsOe7hOS4reeahOepuuagvOWFg+e0oFxyXG4gICAgICAgICAgICBmaWVsZCA9IGZpZWxkLmZpbHRlcigodmFsdWUpID0+IHZhbHVlLnRyaW0oKSAhPSAnJyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL29wdGlvbmFsIHJlcGVhdGVkIHJlcXVpcmVkXHJcbiAgICAgICAgICAgIGxldCBmaWxlZFB0eXBlID0gXCJvcHRpb25hbFwiO1xyXG4gICAgICAgICAgICBsZXQgb2xkVHlwZSA9ICcnO1xyXG4gICAgICAgICAgICBsZXQgZmlsZWROYW1lOiBzdHJpbmcgPSAnJztcclxuICAgICAgICAgICAgaWYgKGZpZWxkLmxlbmd0aCA9PSAyKSB7XHJcbiAgICAgICAgICAgICAgICBvbGRUeXBlID0gZmllbGRbMF0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgZmlsZWROYW1lID0gZmllbGRbMV0udHJpbSgpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmxlbmd0aCA+PSAzKSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlZFB0eXBlID0gZmllbGRbMF0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgb2xkVHlwZSA9IGZpZWxkWzFdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIGZpbGVkTmFtZSA9IGZpZWxkWzJdLnRyaW0oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgdHlwZSA9IHRoaXMuY2hhbmdlUHJvdG9GaWVsZFR5cGVUb1RzVHlwZShvbGRUeXBlKTtcclxuICAgICAgICAgICAgbGV0IGZpZWxkSW5mbzogUHJvdG9GaWVsZCA9IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IGZpbGVkTmFtZSxcclxuICAgICAgICAgICAgICAgIHR5cGUsXHJcbiAgICAgICAgICAgICAgICBvbGRUeXBlLFxyXG4gICAgICAgICAgICAgICAgaW5kZXg6IGosXHJcbiAgICAgICAgICAgICAgICBvcHRpb25hbDogZmlsZWRQdHlwZSxcclxuICAgICAgICAgICAgICAgIGNvbW1lbnQ6IGFyci5sZW5ndGggPiAxID8gYXJyWzFdIDogY29tbWVudCxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgREVCVUcgJiYgY29uc29sZS5sb2coJ2ZpZWxkSW5mbzonLCBmaWVsZEluZm8pO1xyXG4gICAgICAgICAgICBtZXNzYWdlLmZpZWxkcy5wdXNoKGZpZWxkSW5mbyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIHBhcnNlT25lRW51bShpIDogbnVtYmVyLGxpbmVzIDogc3RyaW5nW10sIGVudW1PYmogOiBQcm90b0VudW0pe1xyXG4gICAgICAgIGxldCBqID0gaSArIDE7XHJcbiAgICAgICAgbGV0IGNvbW1lbnQgPSAnJztcclxuICAgICAgICBmb3IgKDsgaiA8IGxpbmVzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIGxldCBmaWVsZExpbmUgPSBsaW5lc1tqXS50cmltU3RhcnQoKTtcclxuICAgICAgICAgICAgaWYgKGZpZWxkTGluZS5zdGFydHNXaXRoKFwifVwiKSkge1xyXG4gICAgICAgICAgICAgICAgaSA9IGo7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZmllbGRMaW5lLnN0YXJ0c1dpdGgoXCJ7XCIpKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZmllbGRMaW5lLnN0YXJ0c1dpdGgoXCIvL1wiKSkge1xyXG4gICAgICAgICAgICAgICAgY29tbWVudCA9IGZpZWxkTGluZS5zdWJzdHJpbmcoMikudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGZpZWxkTGluZS5lbmRzV2l0aChcIlxcclwiKSkge1xyXG4gICAgICAgICAgICAgICAgZmllbGRMaW5lID0gZmllbGRMaW5lLnN1YnN0cmluZygwLCBmaWVsZExpbmUubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGZpZWxkTGluZSA9PSAnJyB8fCBmaWVsZExpbmUubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8v5YWI5bCGZmllbGRMaW5l5LulO+WIhuWJslxyXG4gICAgICAgICAgICBsZXQgYXJyID0gZmllbGRMaW5lLnNwbGl0KFwiO1wiKS5maWx0ZXIoKHZhbHVlKSA9PiB2YWx1ZS50cmltU3RhcnQoKSAhPSAnJyk7XHJcbiAgICAgICAgICAgIGlmIChhcnIubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChhcnIubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHN0ciA9IGFyclsxXS50cmltU3RhcnQoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzdHIuc3RhcnRzV2l0aChcIi8vXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyWzFdID0gc3RyLnN1YnN0cmluZygyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgZmllbGQgPSBhcnJbMF0udHJpbVN0YXJ0KCkuc3BsaXQoXCI9XCIpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdmaWVsZDonLGZpZWxkKTtcclxuICAgICAgICAgICAgbGV0IGZpZWxkSW5mbyA9IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IGZpZWxkWzBdLnRyaW0oKSxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBwYXJzZUludChmaWVsZFsxXS50cmltKCkpLFxyXG4gICAgICAgICAgICAgICAgY29tbWVudDogYXJyLmxlbmd0aCA+IDEgPyBhcnJbMV0gOiBjb21tZW50LFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBlbnVtT2JqLmZpZWxkcy5wdXNoKGZpZWxkSW5mbyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY2hhbmdlUHJvdG9GaWVsZFR5cGVUb1RzVHlwZShmaWVsZFR5cGU6IHN0cmluZykge1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ2NoYW5nZVByb3RvRmllbGRUeXBlVG9Uc1R5cGUtPmZpZWxkVHlwZTonLGZpZWxkVHlwZSk7XHJcbiAgICAgICAgc3dpdGNoIChmaWVsZFR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnaW50MzInOlxyXG4gICAgICAgICAgICBjYXNlICdpbnQ2NCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ3VpbnQzMic6XHJcbiAgICAgICAgICAgIGNhc2UgJ3VpbnQ2NCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ3NpbnQzMic6XHJcbiAgICAgICAgICAgIGNhc2UgJ3NpbnQ2NCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ2ZpeGVkMzInOlxyXG4gICAgICAgICAgICBjYXNlICdmaXhlZDY0JzpcclxuICAgICAgICAgICAgY2FzZSAnc2ZpeGVkMzInOlxyXG4gICAgICAgICAgICBjYXNlICdzZml4ZWQ2NCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ2Zsb2F0JzpcclxuICAgICAgICAgICAgY2FzZSAnZG91YmxlJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiAnbnVtYmVyJztcclxuICAgICAgICAgICAgY2FzZSAnYm9vbCc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2Jvb2xlYW4nO1xyXG4gICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuICdzdHJpbmcnO1xyXG4gICAgICAgICAgICBjYXNlICdieXRlcyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1VpbnQ4QXJyYXknO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgZXhwb3J0UHJvdG9QYWNrYWdlRFRTKCkge1xyXG4gICAgICAgIGNvbnN0IHBhY2thZ2VzID0gT2JqZWN0LnZhbHVlcyh0aGlzLnBhY2thZ2VzKTtcclxuICAgICAgICBjb25zdCBkZWNsYXJlUGF0aCA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLFwiZGVjbGFyZVwiKTtcclxuICAgICAgICBsZXQgdHNGaWxlUGF0aCA9IFwiZGI6Ly9hc3NldHMvXCI7XHJcbiAgICAgICAgaWYodGhpcy5idW5kbGVOYW1lID09IFwicmVzb3VyY2VzXCIpe1xyXG4gICAgICAgICAgICB0c0ZpbGVQYXRoICs9IFwicmVzb3VyY2VzL3NjcmlwdHMvYXV0by9tZXNzYWdlL2RlZmluZXMvXCI7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0c0ZpbGVQYXRoICs9IFwiYnVuZGxlcy9cIiArIHRoaXMuYnVuZGxlTmFtZSArIFwiL3NjcmlwdHMvYXV0by9tZXNzYWdlL2RlZmluZXMvXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7aTxwYWNrYWdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgY29uc3QgcCA9IHBhY2thZ2VzW2ldO1xyXG4gICAgICAgICAgICBsZXQgYWxsTWVzc2FnZU5hbWVzIDoge25hbWUgOiBzdHJpbmcsY29tbWVudCA6IHN0cmluZ31bXSA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlcyA9IE9iamVjdC52YWx1ZXMocC5maWxlcyk7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhY2thZ2VOYW1lICAgPSBwLm5hbWU7XHJcbiAgICAgICAgICAgIGNvbnN0IGR0c2ZpbGVOYW1lICAgPSBwYXRoLmpvaW4oZGVjbGFyZVBhdGgscGFja2FnZU5hbWUgKyBcIi5kLnRzXCIpO1xyXG4gICAgICAgICAgICBjb25zdCB0c0ZpbGVOYW1lICAgID0gdHNGaWxlUGF0aCArIHBhY2thZ2VOYW1lICsgXCIudHNcIjtcclxuICAgICAgICAgICAgbGV0IHRleHRkdHMgPSAnJztcclxuICAgICAgICAgICAgbGV0IHRleHQgPSAnJztcclxuICAgICAgICAgICAgdGV4dGR0cyArPSBcImRlY2xhcmUgbmFtZXNwYWNlIFwiICsgcGFja2FnZU5hbWUgKyBcIntcXG5cXG5cIjtcclxuICAgICAgICAgICAgdGV4dCArPSBcImV4cG9ydCBuYW1lc3BhY2UgXCIgKyBwYWNrYWdlTmFtZSArIFwie1xcblxcblwiO1xyXG4gICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgIGNvbnN0IFBBQ0tBR0VfTkFNRSA9ICdcIiArIHBhY2thZ2VOYW1lICsgXCInO1xcblxcblwiO1xyXG4gICAgICAgICAgICB0ZXh0ICs9IFwiICAgIGV4cG9ydCBjb25zdCBQQUNLQUdFX05BTUUgPSAnXCIgKyBwYWNrYWdlTmFtZSArIFwiJztcXG5cXG5cIjtcclxuICAgICAgICAgICAgLy/lsIblvZPliY3ljIXkvZPph4zpnaLmiYDmnInnmoRwcm90b+aWh+S7tuWGmeWFpeWIsOS4gOS4quaWh+S7tuS4rVxyXG4gICAgICAgICAgICBmb3IobGV0IGogPSAwO2o8ZmlsZXMubGVuZ3RoO2orKyl7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm90b0ZpbGUgPSBmaWxlc1tqXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLndyaXRlT25lUHJvdG9GaWxlRFRTKHByb3RvRmlsZSx0ZXh0LHRleHRkdHMpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCA9IHJlc3VsdHMudGV4dDtcclxuICAgICAgICAgICAgICAgIHRleHRkdHMgPSByZXN1bHRzLnRleHRkdHM7XHJcbiAgICAgICAgICAgICAgICBhbGxNZXNzYWdlTmFtZXMgPSBhbGxNZXNzYWdlTmFtZXMuY29uY2F0KHJlc3VsdHMubWVzc2FnZU5hbWVzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImFsbE1lc3NhZ2VOYW1lcyA9IFwiLGFsbE1lc3NhZ2VOYW1lcy5sZW5ndGgsYWxsTWVzc2FnZU5hbWVzKTtcclxuICAgICAgICAgICAgLy/lsIZhbGxNZXNzYWdlTmFtZXPlhpnmiJDkuIDkuKplbnVtXHJcbiAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgZW51bSBNZXNzYWdlIHtcXG5cIjtcclxuICAgICAgICAgICAgdGV4dCArPSBcIiAgICBleHBvcnQgZW51bSBNZXNzYWdlIHtcXG5cIjtcclxuICAgICAgICAgICAgZm9yKGxldCBqID0gMDtqPGFsbE1lc3NhZ2VOYW1lcy5sZW5ndGg7aisrKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1OYW1lID0gYWxsTWVzc2FnZU5hbWVzW2pdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29tbWVudCA9IG1OYW1lLmNvbW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtc2dOYW1lID0gbU5hbWUubmFtZTtcclxuICAgICAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgICAgIC8qKlwiICsgY29tbWVudCArIFwiKiovXFxuXCI7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgICAgICBcIiArIG1zZ05hbWUgKyBcIiA9ICdcIiArIG1zZ05hbWUgKyBcIicsXFxuXCI7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFwiICAgICAgICAvKipcIiArIGNvbW1lbnQgKyBcIioqL1xcblwiO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBcIiAgICAgICAgXCIgKyBtc2dOYW1lICsgXCIgPSAnXCIgKyBtc2dOYW1lICsgXCInLFxcblwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgfVxcblxcblwiO1xyXG4gICAgICAgICAgICB0ZXh0ICs9IFwiICAgIH1cXG5cXG5cIjtcclxuICAgICAgICAgICAgLy/mnIDlkI7mlLblsL5cclxuICAgICAgICAgICAgdGV4dGR0cyArPSBcIn1cXG5cIjtcclxuICAgICAgICAgICAgdGV4dCArPSBcIn1cXG5cIjtcclxuICAgICAgICAgICAgdGV4dCArPSBcIndpbmRvd1snXCIgKyBwYWNrYWdlTmFtZSArIFwiJ10gPSBcIiArIHBhY2thZ2VOYW1lICsgXCI7XFxuXCI7XHJcblxyXG4gICAgICAgICAgICAvL+WGmeWFpWR0c1xyXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGR0c2ZpbGVOYW1lLCB0ZXh0ZHRzKTtcclxuICAgICAgICAgICAgYXdhaXQgQXNzZXREYlV0aWxzLlJlcXVlc3RDcmVhdGVOZXdBc3NldCh0c0ZpbGVOYW1lLCB0ZXh0IGFzIGFueSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5a+85Ye65Y2P6K6u5paH5Lu25oiQ5YqfIC0+IFwiLCBwYWNrYWdlTmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyB3cml0ZU9uZVByb3RvRmlsZURUUyhwcm90b0ZpbGUgOiBQcm90b0ZpbGUsdGV4dCA6IHN0cmluZywgdGV4dGR0cyA6IHN0cmluZyl7XHJcbiAgICAgICAgY29uc3QgZW51bXMgPSBwcm90b0ZpbGUuZW51bXM7XHJcbiAgICAgICAgbGV0IG1lc3NhZ2VOYW1lcyA6IHtuYW1lIDogc3RyaW5nLGNvbW1lbnQ6c3RyaW5nfVtdID0gW107XHJcbiAgICAgICAgLy/lhYjlhpllbnVtXHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpPGVudW1zLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBjb25zdCBlbnVtZCA9IGVudW1zW2ldO1xyXG4gICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgIC8qKiBcIiArIGVudW1kLmNvbW1lbnQgKyBcIiAqL1xcblwiO1xyXG4gICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgIGVudW0gXCIgKyBlbnVtZC5uYW1lICsgXCJ7XFxuXCI7XHJcblxyXG4gICAgICAgICAgICB0ZXh0ICs9IFwiICAgIC8qKiBcIiArIGVudW1kLmNvbW1lbnQgKyBcIiAqL1xcblwiO1xyXG4gICAgICAgICAgICB0ZXh0ICs9IFwiICAgIGV4cG9ydCBlbnVtIFwiICsgZW51bWQubmFtZSArIFwie1xcblwiO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGVudW1kLmZpZWxkcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gZW51bWQuZmllbGRzW2pdO1xyXG4gICAgICAgICAgICAgICAgdGV4dGR0cyArPSBcIiAgICAgICAgLyoqIFwiICsgZmllbGQuY29tbWVudCArIFwiICovXFxuXCI7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgICAgICBcIiArIGZpZWxkLm5hbWUgKyBcIiA9IFwiICsgZmllbGQudmFsdWUgKyBcIixcXG5cIjtcclxuXHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IFwiICAgICAgICAvKiogXCIgKyBmaWVsZC5jb21tZW50ICsgXCIgKi9cXG5cIjtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gXCIgICAgICAgIFwiICsgZmllbGQubmFtZSArIFwiID0gXCIgKyBmaWVsZC52YWx1ZSArIFwiLFxcblwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgfVxcblxcblwiO1xyXG4gICAgICAgICAgICB0ZXh0ICs9IFwiICAgIH1cXG5cXG5cIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy/lsIbmiYDmnIltZXNzYWdl55qEbmFtZeWGmeaIkGVudW1cclxuICAgICAgICBtZXNzYWdlTmFtZXMgPSBwcm90b0ZpbGUubWVzc2FnZXMubWFwKChtZXNzYWdlKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB7bmFtZSA6IG1lc3NhZ2UubmFtZSxjb21tZW50OiBtZXNzYWdlLmNvbW1lbnR9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8v5YaZbWVzc2FnZVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdG9GaWxlLm1lc3NhZ2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gcHJvdG9GaWxlLm1lc3NhZ2VzW2ldO1xyXG4gICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgIC8qKiBcIiArIG1lc3NhZ2UuY29tbWVudCArIFwiICovXFxuXCI7XHJcbiAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgaW50ZXJmYWNlIFwiICsgbWVzc2FnZS5uYW1lICsgXCJ7XFxuXCI7XHJcblxyXG4gICAgICAgICAgICB0ZXh0ICs9IFwiICAgIC8qKiBcIiArIG1lc3NhZ2UuY29tbWVudCArIFwiICovXFxuXCI7XHJcbiAgICAgICAgICAgIHRleHQgKz0gXCIgICAgZXhwb3J0IGludGVyZmFjZSBcIiArIG1lc3NhZ2UubmFtZSArIFwie1xcblwiO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBtZXNzYWdlLmZpZWxkcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gbWVzc2FnZS5maWVsZHNbal07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwVHlwZSA9IHRoaXMuX2dldEZpZWxkVHlwZShmaWVsZCk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgICAgICAvKiogXCIgKyBmaWVsZC5jb21tZW50ICsgXCIgKi9cXG5cIjtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gXCIgICAgICAgIC8qKiBcIiArIGZpZWxkLmNvbW1lbnQgKyBcIiAqL1xcblwiO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLm9wdGlvbmFsID09ICdvcHRpb25hbCcpIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgICAgICBcIiArIGZpZWxkLm5hbWUgKyBcIj8gOiBcIiArIHBUeXBlICsgXCI7XFxuXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCArPSBcIiAgICAgICAgXCIgKyBmaWVsZC5uYW1lICsgXCI/IDogXCIgKyBwVHlwZSArIFwiO1xcblwiO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC5vcHRpb25hbCA9PSAncmVxdWlyZWQnIHx8IGZpZWxkLm9wdGlvbmFsID09ICdyZXBlYXRlZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgICAgICBcIiArIGZpZWxkLm5hbWUgKyBcIiA6IFwiICsgcFR5cGUgKyBcIjtcXG5cIjtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ICs9IFwiICAgICAgICBcIiArIGZpZWxkLm5hbWUgKyBcIiA6IFwiICsgcFR5cGUgKyBcIjtcXG5cIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgIH1cXG5cXG5cIjtcclxuICAgICAgICAgICAgdGV4dCArPSBcIiAgICB9XFxuXFxuXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRleHQsXHJcbiAgICAgICAgICAgIHRleHRkdHMsXHJcbiAgICAgICAgICAgIG1lc3NhZ2VOYW1lc1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfZ2V0RmllbGRUeXBlKGZpZWxkIDogUHJvdG9GaWVsZCkge1xyXG4gICAgICAgIGxldCB0eXBlID0gZmllbGQudHlwZTtcclxuICAgICAgICBjb25zdCBmaWxlZFB0eXBlID0gZmllbGQub3B0aW9uYWw7XHJcbiAgICAgICAgY29uc3Qgb2xkVHlwZSA9IGZpZWxkLm9sZFR5cGU7XHJcbiAgICAgICAgaWYodHlwZS5pbmNsdWRlcyhcIi5cIikpe1xyXG4gICAgICAgICAgICAvL+S+i+WmgmNvbW1vbi5SZXN1bHQg6KKr6K6k5Li65piv5byV55SoY29tbW9u5YyF5L2T6YeM6Z2i55qEZW51bS9tZXNzYWdlXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihmaWxlZFB0eXBlID09ICdyZXBlYXRlZCcpe1xyXG4gICAgICAgICAgICB0eXBlID0gdHlwZSArIFwiW11cIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHR5cGU7XHJcbiAgICB9ICAgXHJcbn0iXX0=