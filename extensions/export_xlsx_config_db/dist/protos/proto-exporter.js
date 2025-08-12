"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtoExporter = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const jszip_1 = __importDefault(require("jszip"));
const asset_db_utils_1 = require("../utils/asset-db-utils");
const file_utils_1 = __importDefault(require("../utils/file-utils"));
const tools_1 = __importDefault(require("../utils/tools"));
//import pako from "pako";
const DEBUG = false;
class ProtoExporter {
    /**
     *  将protobuf文件合并到一个json格式的字符串中，然后使用jszip压缩成二进制文件
     */
    static async ProcessingExportProtos(targetName) {
        const dir = path_1.default.join(Editor.Project.path, 'protos');
        //遍历dir下所有的文件夹
        const files = fs_extra_1.default.readdirSync(dir);
        //每个文件夹下的proto文件合并到一个json对象中
        let datas = {};
        for (let bundleName of files) {
            if (targetName && targetName != bundleName) {
                continue;
            }
            const filePath = path_1.default.join(dir, bundleName);
            if (fs_extra_1.default.statSync(filePath).isDirectory()) {
                //遍历文件夹下的所有proto文件
                const protoFiles = fs_extra_1.default.readdirSync(filePath);
                const jsonObject = {};
                for (let protoFile of protoFiles) {
                    //检查是否以.proto结尾
                    if (!protoFile.endsWith('.proto')) {
                        continue;
                    }
                    const protoFilePath = path_1.default.join(filePath, protoFile);
                    //读取proto文件内容
                    const protoContent = fs_extra_1.default.readFileSync(protoFilePath).toString();
                    jsonObject[protoFile] = protoContent;
                }
                const jsonStr = JSON.stringify(jsonObject);
                datas[bundleName] = jsonStr;
                //const content = pako.deflate(jsonStr,{ level:0 });
                const zip = new jszip_1.default();
                zip.file(bundleName, jsonStr);
                //压缩后的数据
                const content = await zip.generateAsync({
                    type: "uint8array",
                    compression: "DEFLATE",
                    compressionOptions: {
                        level: 9,
                    }
                });
                let outPath = 'db://assets';
                let jsonPath = path_1.default.join(Editor.Project.path, 'assets');
                if (bundleName == 'resources') {
                    outPath = 'db://assets/resources/protos/proto.bin';
                    jsonPath = path_1.default.join(Editor.Project.path, 'assets', 'resources', 'protos', 'proto.bin');
                }
                else {
                    outPath = `db://assets/bundles/${bundleName}/protos/proto.bin`;
                    jsonPath = path_1.default.join(Editor.Project.path, 'assets', 'bundles', bundleName, 'protos', 'proto.bin');
                }
                //fs.writeJsonSync(jsonPath,jsonObject,{spaces : 4});
                // 输出的二进制，文件头+压缩后的数据
                await asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset(outPath, content, true);
            }
        }
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
    static getScriptNameAndNamespaceNameFromProtoFileName(protoFileName) {
        let fileName = protoFileName;
        if (fileName.endsWith('.proto')) {
            fileName = path_1.default.basename(fileName, '.proto');
        }
        DEBUG && console.log('getScriptNameAndNamespaceNameFromProtoFileName->fileName:', fileName);
        //去掉protoFileName中的特殊符号,比如包括_
        fileName = fileName.replace(/_/g, '');
        let packageName = fileName;
        //packageName首字母大写
        //packageName = packageName.substring(0,1).toUpperCase() + packageName.substring(1);
        //return {scriptName : fileName + "-message-defines",namespaceName : "Proto" + packageName};
        return { scriptName: fileName + "-message-defines", namespaceName: packageName };
    }
    /**
     * 获取指定proto文件的导入文件名
     * @param filePath
     */
    static _getProtoImportFileNames(filePath) {
        const lines = file_utils_1.default.GetFileContentByLines(filePath);
        let importFiles = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.endsWith("\r")) {
                //去掉\r
                line = line.substring(0, line.length - 1);
            }
            if (line.startsWith("import")) {
                let importFile = line.split(" ")[1];
                if (importFile.endsWith(";")) {
                    importFile = importFile.substring(0, importFile.length - 1);
                }
                if (importFile.startsWith('"')) {
                    importFile = importFile.substring(1, importFile.length - 1);
                }
                if (importFile.endsWith('"')) {
                    importFile = importFile.substring(0, importFile.length - 1);
                }
                importFiles.push(importFile);
                continue;
            }
        }
        return importFiles;
    }
    /**
     * 解析指定的proto文件
     * @param filePath
     * @param bundleName
     * @param bAnalysisImport
     * @returns
     */
    static _analyzeProtoFile(filePath, bundleName, bAnalysisImport = true) {
        const name = path_1.default.basename(filePath, '.proto');
        const lines = file_utils_1.default.GetFileContentByLines(filePath);
        const files = this.files;
        //包名字
        let protoFile = {
            packageName: '',
            fileName: path_1.default.basename(name, '.proto'),
            importFiles: [],
            messages: [],
            enums: [],
            bundleName,
        };
        let pcomment = '';
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.endsWith("\r")) {
                //去掉\r
                line = line.substring(0, line.length - 1);
            }
            if (line.startsWith("import")) {
                let importFile = line.split(" ")[1];
                if (importFile.endsWith(";")) {
                    importFile = importFile.substring(0, importFile.length - 1);
                }
                if (importFile.startsWith('"')) {
                    importFile = importFile.substring(1, importFile.length - 1);
                }
                if (importFile.endsWith('"')) {
                    importFile = importFile.substring(0, importFile.length - 1);
                }
                protoFile.importFiles.push(importFile);
                continue;
            }
            if (line.startsWith("package")) {
                let packageName = line.split(" ")[1];
                if (packageName.endsWith(";")) {
                    packageName = packageName.substring(0, packageName.length - 1);
                }
                protoFile.packageName = packageName;
                continue;
            }
            line = line.trimStart();
            if (line.startsWith("//")) {
                pcomment = line.substring(2).trim();
                continue;
            }
            DEBUG && console.log('line:', line);
            if (line.startsWith("message")) {
                let messageName = line.split(" ")[1].trim();
                if (messageName.endsWith("{")) {
                    messageName = messageName.substring(0, messageName.length - 1);
                }
                let message = {
                    name: messageName,
                    comment: pcomment,
                    fields: []
                };
                let j = i + 1;
                if (!line.trimEnd().endsWith("}")) {
                    let comment = '';
                    for (; j < lines.length; j++) {
                        let fieldLine = lines[j].trimStart();
                        if (fieldLine.startsWith("}")) {
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
                        //后面的数据不要
                        arr[0] = arr[0].split("=")[0];
                        DEBUG && console.log('message field:', arr);
                        let arr0 = arr[0];
                        if (arr0.trimStart().startsWith("map")) {
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
                                valueType = this._getObjectFiledValueType(valueType);
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
                        DEBUG && console.log('field:', field);
                        //optional repeated required
                        let filedPtype = "optional";
                        let oldType = '';
                        let filedName = '';
                        if (field.length == 2) {
                            oldType = field[0].trim();
                            filedName = field[1].trim();
                        }
                        else if (field.length == 3) {
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
                }
                //console.log('message:',message);
                protoFile.messages.push(message);
                i = j;
            }
            if (line.startsWith("enum")) {
                let enumName = line.split(" ")[1].trim();
                if (enumName.endsWith("{")) {
                    enumName = enumName.substring(0, enumName.length - 1);
                }
                let enumd = {
                    name: enumName,
                    comment: pcomment,
                    fields: []
                };
                let j = i + 1;
                let comment = '';
                for (; j < lines.length; j++) {
                    let fieldLine = lines[j].trimStart();
                    if (fieldLine.startsWith("}")) {
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
                    //DEBUG && console.log('enum fieldInfo:',fieldInfo);
                    enumd.fields.push(fieldInfo);
                }
                protoFile.enums.push(enumd);
                i = j;
            }
        }
        DEBUG && console.log('proto文件：', protoFile);
        return protoFile;
    }
    static _exportOneProtoFile(file, folderName, filePath) {
        if (this.files[file]) {
            return;
        }
        const importFiles = this._getProtoImportFileNames(filePath);
        if (importFiles.length == 0) {
            console.log('没有导入文件,开始解析:', filePath);
            const protoFile = this._analyzeProtoFile(filePath, folderName, false);
            this.files[file] = protoFile;
            return;
        }
        for (let i = 0; i < importFiles.length; i++) {
            const importFile = importFiles[i];
            if (this.files[importFile]) {
                //说明在files中
                continue;
            }
            else {
                //说明不在files中，继续循环
                const importFilePath = path_1.default.join(Editor.Project.path, 'protos', folderName, importFile);
                this._exportOneProtoFile(importFile, folderName, importFilePath);
            }
        }
        console.log('需要导入的文件解析完毕,开始解析:', filePath);
        const protoFile = this._analyzeProtoFile(filePath, folderName, false);
        this.files[file] = protoFile;
    }
    /**
     * 解析指定名字的文件夹下的所有proto文件
     * @param folerName
     */
    static _exportOneFolderProtoFilesToDTS(folerName) {
        const dir = path_1.default.join(Editor.Project.path, 'protos', folerName);
        if (!fs_extra_1.default.existsSync(dir)) {
            return;
        }
        let files = fs_extra_1.default.readdirSync(dir);
        let count = files.length;
        for (let file of files) {
            if (file.endsWith('.proto')) {
                const filePath = path_1.default.join(dir, file);
                this._exportOneProtoFile(file, folerName, filePath);
                // const protoFile = this._analyzeProtoFile(filePath,folerName,false);
                // this.files[file] = protoFile;
            }
        }
    }
    static _getObjectFiledValueType(valueType) {
        const files = this.files;
        const values = Object.values(files);
        let found = false;
        //如果type和oldType相等，且不是string类型，说明是自定义类型
        tools_1.default.forEachMap(files, (fileName, protoFile) => {
            const enums = protoFile.enums;
            for (let i = 0; i < enums.length; i++) {
                if (enums[i].name == valueType) {
                    const info = this.getScriptNameAndNamespaceNameFromProtoFileName(fileName);
                    valueType = info.namespaceName + '.' + valueType;
                    found = true;
                    return true;
                }
            }
            const messages = protoFile.messages;
            for (let i = 0; i < messages.length; i++) {
                if (messages[i].name == valueType) {
                    const info = this.getScriptNameAndNamespaceNameFromProtoFileName(fileName);
                    valueType = info.namespaceName + '.' + valueType;
                    found = true;
                    return true;
                }
            }
        });
        return valueType;
    }
    static _getFieldType(field, messages) {
        let type = field.type;
        const files = this.files;
        const filedPtype = field.optional;
        const oldType = field.oldType;
        if (type.includes('.')) {
            //如果包含.说明是别的包的类型
            const arr = type.split('.');
            const pName = arr[0];
            const pType = arr[1];
            //找到packageName对应的namespace
            tools_1.default.forEachMap(files, (fileName, protoFile) => {
                if (protoFile.packageName == pName) {
                    const info = this.getScriptNameAndNamespaceNameFromProtoFileName(fileName);
                    type = info.namespaceName + '.' + pType;
                    return true;
                }
            });
        }
        else {
            if (type == oldType && type != 'string') {
                let sameFile = false;
                //首先检查messages是否有
                for (let i = 0; i < messages.length; i++) {
                    if (messages[i].name == type) {
                        DEBUG && console.log('IN SAME FILE:', type);
                        sameFile = true;
                        break;
                    }
                }
                if (!sameFile) {
                    //如果type和oldType相等，且不是string类型，说明是自定义类型
                    tools_1.default.forEachMap(files, (fileName, protoFile) => {
                        const enums = protoFile.enums;
                        for (let i = 0; i < enums.length; i++) {
                            if (enums[i].name == type) {
                                const info = this.getScriptNameAndNamespaceNameFromProtoFileName(fileName);
                                type = info.namespaceName + '.' + type;
                                return true;
                            }
                        }
                        const messages = protoFile.messages;
                        for (let i = 0; i < messages.length; i++) {
                            if (messages[i].name == type) {
                                const info = this.getScriptNameAndNamespaceNameFromProtoFileName(fileName);
                                type = info.namespaceName + '.' + type;
                                return true;
                            }
                        }
                    });
                }
            }
        }
        if (filedPtype == 'repeated') {
            type = type + '[]';
        }
        return type;
    }
    static _writeProtoFileToDTS(protoFile) {
        let protoFileName = protoFile.fileName;
        if (protoFileName.endsWith('.proto')) {
            protoFileName = path_1.default.basename(protoFileName, '.proto');
        }
        const bundleName = protoFile.bundleName;
        const files = this.files;
        //去掉protoFileName中的特殊符号,比如包括_
        protoFileName = protoFileName.replace(/_/g, '').toLowerCase();
        /**
         * 描述文件
         */
        let textdts = '';
        /**
         * 导出文件
         */
        let text = '';
        textdts += "declare namespace " + protoFileName + "{\n\n";
        text += "export namespace " + protoFileName + "{\n\n";
        //写真正的package名字
        textdts += "    const PACKAGE_NAME = '" + protoFile.packageName + "';\n\n";
        text += "    export const PACKAGE_NAME = '" + protoFile.packageName + "';\n\n";
        //写enum
        for (let i = 0; i < protoFile.enums.length; i++) {
            let enumd = protoFile.enums[i];
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
        textdts += "    enum Message {\n";
        text += "    export enum Message {\n";
        for (let i = 0; i < protoFile.messages.length; i++) {
            let message = protoFile.messages[i];
            textdts += "        /** " + message.comment + " */\n";
            textdts += "        " + message.name + " = '" + message.name + "',\n";
            text += "        /** " + message.comment + " */\n";
            text += "        " + message.name + " = '" + message.name + "',\n";
        }
        textdts += "    }\n\n";
        text += "    }\n\n";
        //写message
        for (let i = 0; i < protoFile.messages.length; i++) {
            let message = protoFile.messages[i];
            textdts += "    /** " + message.comment + " */\n";
            textdts += "    interface " + message.name + "{\n";
            text += "    /** " + message.comment + " */\n";
            text += "    export interface " + message.name + "{\n";
            for (let j = 0; j < message.fields.length; j++) {
                let field = message.fields[j];
                const pType = this._getFieldType(field, protoFile.messages);
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
        textdts += "}\n";
        text += "}\n";
        text += "window['" + protoFileName + "'] = " + protoFileName + ";\n";
        //console.log('text:',text);
        let fileUrl = "";
        let dtsfileName = protoFileName + '.d.ts';
        let fileName = protoFileName + '.ts';
        if (bundleName == 'resources') {
            fileUrl = path_1.default.join('assets', 'resources', 'scripts', 'auto', 'message', 'defines', fileName);
        }
        else {
            fileUrl = path_1.default.join('assets', 'bundles', bundleName, 'scripts', 'message', 'defines', fileName);
        }
        fileUrl = 'db://' + fileUrl;
        DEBUG && console.warn('导出proto->fileUrl:', fileUrl);
        asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset(fileUrl, text);
        const filePath = path_1.default.join(Editor.Project.path, 'declare', dtsfileName);
        DEBUG && console.warn('导出proto_d.ts->fileUrl:', filePath);
        file_utils_1.default.WriteFile(filePath, textdts);
    }
    //将每一个proto文件导出d.ts和ts文件
    static async ProcessingExportProtosDTS(targetName) {
        //1.先解析resources文件夹下的所有proto文件
        this._exportOneFolderProtoFilesToDTS('resources');
        //在解析protos目录下的其他文件夹
        const dir = path_1.default.join(Editor.Project.path, 'protos');
        const files = fs_extra_1.default.readdirSync(dir);
        for (let file of files) {
            if (file == 'resources') {
                continue;
            }
            if (targetName && targetName != file) {
                continue;
            }
            this._exportOneFolderProtoFilesToDTS(file);
        }
        //开始写入文件
        tools_1.default.forEachMap(this.files, (fileName, protoFile) => {
            if (targetName && targetName != protoFile.bundleName) {
                return;
            }
            this._writeProtoFileToDTS(protoFile);
        });
        //清空数据
        this.files = {};
    }
}
exports.ProtoExporter = ProtoExporter;
ProtoExporter.files = {};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdG8tZXhwb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvcHJvdG9zL3Byb3RvLWV4cG9ydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUN4Qix3REFBMEI7QUFDMUIsa0RBQTBCO0FBQzFCLDREQUF1RDtBQUN2RCxxRUFBNEM7QUFDNUMsMkRBQW1DO0FBQ25DLDBCQUEwQjtBQUMxQixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUM7QUFFcEIsTUFBYSxhQUFhO0lBRXRCOztPQUVHO0lBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxVQUFvQjtRQUMzRCxNQUFNLEdBQUcsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELGNBQWM7UUFDZCxNQUFNLEtBQUssR0FBRyxrQkFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQyw0QkFBNEI7UUFDNUIsSUFBSSxLQUFLLEdBQWdDLEVBQUUsQ0FBQztRQUM1QyxLQUFJLElBQUksVUFBVSxJQUFJLEtBQUssRUFBQztZQUN4QixJQUFHLFVBQVUsSUFBSSxVQUFVLElBQUksVUFBVSxFQUFDO2dCQUN0QyxTQUFTO2FBQ1o7WUFDRCxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBQyxVQUFVLENBQUMsQ0FBQztZQUMzQyxJQUFHLGtCQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFDO2dCQUNuQyxrQkFBa0I7Z0JBQ2xCLE1BQU0sVUFBVSxHQUFHLGtCQUFFLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLFVBQVUsR0FBZ0MsRUFBRSxDQUFDO2dCQUNuRCxLQUFJLElBQUksU0FBUyxJQUFJLFVBQVUsRUFBQztvQkFDNUIsZUFB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QVcsQ0FBQyxDQUFDO1FBQ2xELG9CQUFvQjtRQUNwQixNQUFNLEdBQUcsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sS0FBSyxHQUFHLGtCQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLEtBQUksSUFBSSxJQUFJLElBQUksS0FBSyxFQUFDO1lBQ2xCLElBQUcsSUFBSSxJQUFJLFdBQVcsRUFBQztnQkFDbkIsU0FBUzthQUNaO1lBQ0QsSUFBRyxVQUFVLElBQUksVUFBVSxJQUFJLElBQUksRUFBQztnQkFDaEMsU0FBUzthQUNaO1lBQ0QsSUFBSSxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzlDO1FBQ0QsUUFBUTtRQUNSLGVBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQyxDQUFDLFFBQWlCLEVBQUMsU0FBcUIsRUFBRSxFQUFFO1lBQ3BFLElBQUcsVUFBVSxJQUFJLFVBQVUsSUFBSSxTQUFTLENBQUMsVUFBVSxFQUFDO2dCQUNoRCxPQUFPO2FBQ1Y7WUFDRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNO1FBQ04sSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7SUFDcEIsQ0FBQzs7QUFqcEJMLHNDQWtwQkM7QUFwbEJrQixtQkFBSyxHQUFtQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgZnMgZnJvbSBcImZzLWV4dHJhXCI7XHJcbmltcG9ydCBKU1ppcCBmcm9tIFwianN6aXBcIjtcclxuaW1wb3J0IHsgQXNzZXREYlV0aWxzIH0gZnJvbSBcIi4uL3V0aWxzL2Fzc2V0LWRiLXV0aWxzXCI7XHJcbmltcG9ydCBGaWxlVXRpbHMgZnJvbSBcIi4uL3V0aWxzL2ZpbGUtdXRpbHNcIjtcclxuaW1wb3J0IFRvb2xzIGZyb20gXCIuLi91dGlscy90b29sc1wiO1xyXG4vL2ltcG9ydCBwYWtvIGZyb20gXCJwYWtvXCI7XHJcbmNvbnN0IERFQlVHID0gZmFsc2U7XHJcblxyXG5leHBvcnQgY2xhc3MgUHJvdG9FeHBvcnRlciB7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogIOWwhnByb3RvYnVm5paH5Lu25ZCI5bm25Yiw5LiA5LiqanNvbuagvOW8j+eahOWtl+espuS4suS4re+8jOeEtuWQjuS9v+eUqGpzemlw5Y6L57yp5oiQ5LqM6L+b5Yi25paH5Lu2XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgYXN5bmMgUHJvY2Vzc2luZ0V4cG9ydFByb3Rvcyh0YXJnZXROYW1lPyA6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IGRpciA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCdwcm90b3MnKTtcclxuICAgICAgICAvL+mBjeWOhmRpcuS4i+aJgOacieeahOaWh+S7tuWkuVxyXG4gICAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoZGlyKTtcclxuICAgICAgICAvL+avj+S4quaWh+S7tuWkueS4i+eahHByb3Rv5paH5Lu25ZCI5bm25Yiw5LiA5LiqanNvbuWvueixoeS4rVxyXG4gICAgICAgIGxldCBkYXRhcyA6IHtbbmFtZSA6IHN0cmluZ10gOiBzdHJpbmd9ID0ge307XHJcbiAgICAgICAgZm9yKGxldCBidW5kbGVOYW1lIG9mIGZpbGVzKXtcclxuICAgICAgICAgICAgaWYodGFyZ2V0TmFtZSAmJiB0YXJnZXROYW1lICE9IGJ1bmRsZU5hbWUpe1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oZGlyLGJ1bmRsZU5hbWUpO1xyXG4gICAgICAgICAgICBpZihmcy5zdGF0U3luYyhmaWxlUGF0aCkuaXNEaXJlY3RvcnkoKSl7XHJcbiAgICAgICAgICAgICAgICAvL+mBjeWOhuaWh+S7tuWkueS4i+eahOaJgOaciXByb3Rv5paH5Lu2XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwcm90b0ZpbGVzID0gZnMucmVhZGRpclN5bmMoZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QganNvbk9iamVjdCA6IHtbbmFtZSA6IHN0cmluZ10gOiBzdHJpbmd9ID0ge307XHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IHByb3RvRmlsZSBvZiBwcm90b0ZpbGVzKXtcclxuICAgICAgICAgICAgICAgICAgICAvL+ajgOafpeaYr+WQpuS7pS5wcm90b+e7k+WwvlxyXG4gICAgICAgICAgICAgICAgICAgIGlmKCFwcm90b0ZpbGUuZW5kc1dpdGgoJy5wcm90bycpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3RvRmlsZVBhdGggPSBwYXRoLmpvaW4oZmlsZVBhdGgscHJvdG9GaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAvL+ivu+WPlnByb3Rv5paH5Lu25YaF5a65XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvdG9Db250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHByb3RvRmlsZVBhdGgpLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAganNvbk9iamVjdFtwcm90b0ZpbGVdID0gcHJvdG9Db250ZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc3QganNvblN0ciAgID0gSlNPTi5zdHJpbmdpZnkoanNvbk9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICBkYXRhc1tidW5kbGVOYW1lXSA9IGpzb25TdHI7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnN0IGNvbnRlbnQgPSBwYWtvLmRlZmxhdGUoanNvblN0cix7IGxldmVsOjAgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB6aXAgICAgICAgPSBuZXcgSlNaaXAoKTtcclxuICAgICAgICAgICAgICAgIHppcC5maWxlKGJ1bmRsZU5hbWUsanNvblN0cik7XHJcbiAgICAgICAgICAgICAgICAvL+WOi+e8qeWQjueahOaVsOaNrlxyXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHppcC5nZW5lcmF0ZUFzeW5jKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInVpbnQ4YXJyYXlcIiwvL25vZGVqc+eUqFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbXByZXNzaW9uOiBcIkRFRkxBVEVcIixcclxuICAgICAgICAgICAgICAgICAgICBjb21wcmVzc2lvbk9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV2ZWwgOiA5LFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgbGV0IG91dFBhdGggPSAnZGI6Ly9hc3NldHMnO1xyXG4gICAgICAgICAgICAgICAgbGV0IGpzb25QYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsJ2Fzc2V0cycpO1xyXG4gICAgICAgICAgICAgICAgaWYoYnVuZGxlTmFtZSA9PSAncmVzb3VyY2VzJyl7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0UGF0aCA9ICdkYjovL2Fzc2V0cy9yZXNvdXJjZXMvcHJvdG9zL3Byb3RvLmJpbic7XHJcbiAgICAgICAgICAgICAgICAgICAganNvblBhdGggPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwnYXNzZXRzJywncmVzb3VyY2VzJywncHJvdG9zJywncHJvdG8uYmluJyk7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICBvdXRQYXRoID0gYGRiOi8vYXNzZXRzL2J1bmRsZXMvJHtidW5kbGVOYW1lfS9wcm90b3MvcHJvdG8uYmluYDtcclxuICAgICAgICAgICAgICAgICAgICBqc29uUGF0aCA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCdhc3NldHMnLCdidW5kbGVzJyxidW5kbGVOYW1lLCdwcm90b3MnLCdwcm90by5iaW4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vZnMud3JpdGVKc29uU3luYyhqc29uUGF0aCxqc29uT2JqZWN0LHtzcGFjZXMgOiA0fSk7XHJcbiAgICAgICAgICAgICAgICAvLyDovpPlh7rnmoTkuozov5vliLbvvIzmlofku7blpLQr5Y6L57yp5ZCO55qE5pWw5o2uXHJcbiAgICAgICAgICAgICAgICBhd2FpdCBBc3NldERiVXRpbHMuUmVxdWVzdENyZWF0ZU5ld0Fzc2V0KG91dFBhdGgsY29udGVudCBhcyBhbnksdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIFxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIGZpbGVzIDoge1tuYW1lIDogc3RyaW5nXSA6IFByb3RvRmlsZX0gPSB7fTtcclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBjaGFuZ2VQcm90b0ZpZWxkVHlwZVRvVHNUeXBlKGZpZWxkVHlwZSA6IHN0cmluZyl7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnY2hhbmdlUHJvdG9GaWVsZFR5cGVUb1RzVHlwZS0+ZmllbGRUeXBlOicsZmllbGRUeXBlKTtcclxuICAgICAgICBzd2l0Y2goZmllbGRUeXBlKXtcclxuICAgICAgICAgICAgY2FzZSAnaW50MzInOlxyXG4gICAgICAgICAgICBjYXNlICdpbnQ2NCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ3VpbnQzMic6XHJcbiAgICAgICAgICAgIGNhc2UgJ3VpbnQ2NCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ3NpbnQzMic6XHJcbiAgICAgICAgICAgIGNhc2UgJ3NpbnQ2NCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ2ZpeGVkMzInOlxyXG4gICAgICAgICAgICBjYXNlICdmaXhlZDY0JzpcclxuICAgICAgICAgICAgY2FzZSAnc2ZpeGVkMzInOlxyXG4gICAgICAgICAgICBjYXNlICdzZml4ZWQ2NCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ2Zsb2F0JzpcclxuICAgICAgICAgICAgY2FzZSAnZG91YmxlJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiAnbnVtYmVyJztcclxuICAgICAgICAgICAgY2FzZSAnYm9vbCc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2Jvb2xlYW4nO1xyXG4gICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuICdzdHJpbmcnO1xyXG4gICAgICAgICAgICBjYXNlICdieXRlcyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1VpbnQ4QXJyYXknO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgZ2V0U2NyaXB0TmFtZUFuZE5hbWVzcGFjZU5hbWVGcm9tUHJvdG9GaWxlTmFtZShwcm90b0ZpbGVOYW1lIDogc3RyaW5nKXtcclxuICAgICAgICBsZXQgZmlsZU5hbWUgICAgPSBwcm90b0ZpbGVOYW1lO1xyXG4gICAgICAgIGlmKGZpbGVOYW1lLmVuZHNXaXRoKCcucHJvdG8nKSl7XHJcbiAgICAgICAgICAgIGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShmaWxlTmFtZSwnLnByb3RvJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERFQlVHICYmIGNvbnNvbGUubG9nKCdnZXRTY3JpcHROYW1lQW5kTmFtZXNwYWNlTmFtZUZyb21Qcm90b0ZpbGVOYW1lLT5maWxlTmFtZTonLGZpbGVOYW1lKTtcclxuICAgICAgICAvL+WOu+aOiXByb3RvRmlsZU5hbWXkuK3nmoTnibnmrornrKblj7cs5q+U5aaC5YyF5ousX1xyXG4gICAgICAgIGZpbGVOYW1lICAgPSBmaWxlTmFtZS5yZXBsYWNlKC9fL2csJycpO1xyXG4gICAgICAgIGxldCBwYWNrYWdlTmFtZSA9IGZpbGVOYW1lO1xyXG4gICAgICAgIC8vcGFja2FnZU5hbWXpppblrZfmr43lpKflhplcclxuICAgICAgICAvL3BhY2thZ2VOYW1lID0gcGFja2FnZU5hbWUuc3Vic3RyaW5nKDAsMSkudG9VcHBlckNhc2UoKSArIHBhY2thZ2VOYW1lLnN1YnN0cmluZygxKTtcclxuICAgICAgICAvL3JldHVybiB7c2NyaXB0TmFtZSA6IGZpbGVOYW1lICsgXCItbWVzc2FnZS1kZWZpbmVzXCIsbmFtZXNwYWNlTmFtZSA6IFwiUHJvdG9cIiArIHBhY2thZ2VOYW1lfTtcclxuICAgICAgICByZXR1cm4ge3NjcmlwdE5hbWUgOiBmaWxlTmFtZSArIFwiLW1lc3NhZ2UtZGVmaW5lc1wiLG5hbWVzcGFjZU5hbWUgOiBwYWNrYWdlTmFtZX07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDojrflj5bmjIflrppwcm90b+aWh+S7tueahOWvvOWFpeaWh+S7tuWQjVxyXG4gICAgICogQHBhcmFtIGZpbGVQYXRoIFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfZ2V0UHJvdG9JbXBvcnRGaWxlTmFtZXMoZmlsZVBhdGggOiBzdHJpbmcpe1xyXG4gICAgICAgIGNvbnN0IGxpbmVzICAgICA9IEZpbGVVdGlscy5HZXRGaWxlQ29udGVudEJ5TGluZXMoZmlsZVBhdGgpO1xyXG4gICAgICAgIGxldCBpbXBvcnRGaWxlcyA6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpPGxpbmVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBsZXQgbGluZSA9IGxpbmVzW2ldO1xyXG4gICAgICAgICAgICBpZihsaW5lLmVuZHNXaXRoKFwiXFxyXCIpKXtcclxuICAgICAgICAgICAgICAgIC8v5Y675o6JXFxyXHJcbiAgICAgICAgICAgICAgICBsaW5lID0gbGluZS5zdWJzdHJpbmcoMCxsaW5lLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKGxpbmUuc3RhcnRzV2l0aChcImltcG9ydFwiKSl7XHJcbiAgICAgICAgICAgICAgICBsZXQgaW1wb3J0RmlsZSA9IGxpbmUuc3BsaXQoXCIgXCIpWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYoaW1wb3J0RmlsZS5lbmRzV2l0aChcIjtcIikpe1xyXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydEZpbGUgPSBpbXBvcnRGaWxlLnN1YnN0cmluZygwLGltcG9ydEZpbGUubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihpbXBvcnRGaWxlLnN0YXJ0c1dpdGgoJ1wiJykpe1xyXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydEZpbGUgPSBpbXBvcnRGaWxlLnN1YnN0cmluZygxLGltcG9ydEZpbGUubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihpbXBvcnRGaWxlLmVuZHNXaXRoKCdcIicpKXtcclxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRGaWxlID0gaW1wb3J0RmlsZS5zdWJzdHJpbmcoMCxpbXBvcnRGaWxlLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaW1wb3J0RmlsZXMucHVzaChpbXBvcnRGaWxlKTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpbXBvcnRGaWxlcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOino+aekOaMh+WumueahHByb3Rv5paH5Lu2XHJcbiAgICAgKiBAcGFyYW0gZmlsZVBhdGggXHJcbiAgICAgKiBAcGFyYW0gYnVuZGxlTmFtZSBcclxuICAgICAqIEBwYXJhbSBiQW5hbHlzaXNJbXBvcnQgXHJcbiAgICAgKiBAcmV0dXJucyBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2FuYWx5emVQcm90b0ZpbGUoZmlsZVBhdGggOiBzdHJpbmcsYnVuZGxlTmFtZSA6IHN0cmluZyxiQW5hbHlzaXNJbXBvcnQgOiBib29sZWFuID0gdHJ1ZSl7XHJcbiAgICAgICAgY29uc3QgbmFtZSAgICAgID0gcGF0aC5iYXNlbmFtZShmaWxlUGF0aCwnLnByb3RvJyk7XHJcbiAgICAgICAgY29uc3QgbGluZXMgICAgID0gRmlsZVV0aWxzLkdldEZpbGVDb250ZW50QnlMaW5lcyhmaWxlUGF0aCk7XHJcbiAgICAgICAgY29uc3QgZmlsZXMgICAgID0gdGhpcy5maWxlcztcclxuICAgICAgICAvL+WMheWQjeWtl1xyXG4gICAgICAgIGxldCBwcm90b0ZpbGUgOiBQcm90b0ZpbGUgPSB7XHJcbiAgICAgICAgICAgIHBhY2thZ2VOYW1lIDogJycsXHJcbiAgICAgICAgICAgIGZpbGVOYW1lICAgIDogcGF0aC5iYXNlbmFtZShuYW1lLCcucHJvdG8nKSxcclxuICAgICAgICAgICAgaW1wb3J0RmlsZXMgOiBbXSxcclxuICAgICAgICAgICAgbWVzc2FnZXMgICAgOiBbXSxcclxuICAgICAgICAgICAgZW51bXMgICAgICAgOiBbXSxcclxuICAgICAgICAgICAgYnVuZGxlTmFtZSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGxldCBwY29tbWVudCA9ICcnO1xyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7aTxsaW5lcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgbGV0IGxpbmUgPSBsaW5lc1tpXTtcclxuICAgICAgICAgICAgaWYobGluZS5lbmRzV2l0aChcIlxcclwiKSl7XHJcbiAgICAgICAgICAgICAgICAvL+WOu+aOiVxcclxyXG4gICAgICAgICAgICAgICAgbGluZSA9IGxpbmUuc3Vic3RyaW5nKDAsbGluZS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihsaW5lLnN0YXJ0c1dpdGgoXCJpbXBvcnRcIikpe1xyXG4gICAgICAgICAgICAgICAgbGV0IGltcG9ydEZpbGUgPSBsaW5lLnNwbGl0KFwiIFwiKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmKGltcG9ydEZpbGUuZW5kc1dpdGgoXCI7XCIpKXtcclxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRGaWxlID0gaW1wb3J0RmlsZS5zdWJzdHJpbmcoMCxpbXBvcnRGaWxlLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoaW1wb3J0RmlsZS5zdGFydHNXaXRoKCdcIicpKXtcclxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRGaWxlID0gaW1wb3J0RmlsZS5zdWJzdHJpbmcoMSxpbXBvcnRGaWxlLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoaW1wb3J0RmlsZS5lbmRzV2l0aCgnXCInKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0RmlsZSA9IGltcG9ydEZpbGUuc3Vic3RyaW5nKDAsaW1wb3J0RmlsZS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHByb3RvRmlsZS5pbXBvcnRGaWxlcy5wdXNoKGltcG9ydEZpbGUpO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYobGluZS5zdGFydHNXaXRoKFwicGFja2FnZVwiKSl7XHJcbiAgICAgICAgICAgICAgICBsZXQgcGFja2FnZU5hbWUgPSBsaW5lLnNwbGl0KFwiIFwiKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmKHBhY2thZ2VOYW1lLmVuZHNXaXRoKFwiO1wiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFja2FnZU5hbWUgICAgID0gcGFja2FnZU5hbWUuc3Vic3RyaW5nKDAscGFja2FnZU5hbWUubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwcm90b0ZpbGUucGFja2FnZU5hbWUgPSBwYWNrYWdlTmFtZTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxpbmUgPSBsaW5lLnRyaW1TdGFydCgpO1xyXG4gICAgICAgICAgICBpZihsaW5lLnN0YXJ0c1dpdGgoXCIvL1wiKSl7XHJcbiAgICAgICAgICAgICAgICBwY29tbWVudCA9IGxpbmUuc3Vic3RyaW5nKDIpLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIERFQlVHICYmIGNvbnNvbGUubG9nKCdsaW5lOicsbGluZSk7XHJcbiAgICAgICAgICAgIGlmKGxpbmUuc3RhcnRzV2l0aChcIm1lc3NhZ2VcIikpe1xyXG4gICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2VOYW1lID0gbGluZS5zcGxpdChcIiBcIilbMV0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgaWYobWVzc2FnZU5hbWUuZW5kc1dpdGgoXCJ7XCIpKXtcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlTmFtZSA9IG1lc3NhZ2VOYW1lLnN1YnN0cmluZygwLG1lc3NhZ2VOYW1lLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2UgOiBQcm90b01lc3NhZ2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSAgICA6IG1lc3NhZ2VOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgOiBwY29tbWVudCxcclxuICAgICAgICAgICAgICAgICAgICBmaWVsZHMgIDogW11cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBsZXQgaiA9IGkgKyAxO1xyXG4gICAgICAgICAgICAgICAgaWYoIWxpbmUudHJpbUVuZCgpLmVuZHNXaXRoKFwifVwiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNvbW1lbnQgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICBmb3IoO2o8bGluZXMubGVuZ3RoO2orKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZExpbmUgPSBsaW5lc1tqXS50cmltU3RhcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoZmllbGRMaW5lLnN0YXJ0c1dpdGgoXCJ9XCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGZpZWxkTGluZS5zdGFydHNXaXRoKFwie1wiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihmaWVsZExpbmUuc3RhcnRzV2l0aChcIi8vXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSBmaWVsZExpbmUuc3Vic3RyaW5nKDIpLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGZpZWxkTGluZS5lbmRzV2l0aChcIlxcclwiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZExpbmUgPSBmaWVsZExpbmUuc3Vic3RyaW5nKDAsZmllbGRMaW5lLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGZpZWxkTGluZSA9PSAnJyB8fCBmaWVsZExpbmUubGVuZ3RoID09IDApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8v5YWI5bCGZmllbGRMaW5l5LulO+WIhuWJslxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYXJyICAgPSBmaWVsZExpbmUuc3BsaXQoXCI7XCIpLmZpbHRlcigodmFsdWUpID0+IHZhbHVlLnRyaW1TdGFydCgpICE9ICcnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoYXJyLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGFyci5sZW5ndGggPiAxKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzdHIgPSBhcnJbMV0udHJpbVN0YXJ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihzdHIuc3RhcnRzV2l0aChcIi8vXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJbMV0gPSBzdHIuc3Vic3RyaW5nKDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8v5ZCO6Z2i55qE5pWw5o2u5LiN6KaBXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyclswXSA9IGFyclswXS5zcGxpdChcIj1cIilbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIERFQlVHICYmIGNvbnNvbGUubG9nKCdtZXNzYWdlIGZpZWxkOicsYXJyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGFycjAgID0gYXJyWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihhcnIwLnRyaW1TdGFydCgpLnN0YXJ0c1dpdGgoXCJtYXBcIikpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/ov5nmmK/kuIDkuKrnibnmrornmoRtYXA8dHlwZTEsdHlwZTI+IGZpbGVkTmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/mib7liLA8PuS4reeahOWGheWuuVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHN0YXJ0ID0gYXJyMC5pbmRleE9mKFwiPFwiKSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW5kICAgPSBhcnIwLmluZGV4T2YoXCI+XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoc3RhcnQgPT0gLTEgfHwgZW5kID09IC0xKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdtYXDnsbvlnovplJnor686JyxhcnIwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtYXBUeXBlID0gYXJyMC5zdWJzdHJpbmcoc3RhcnQsZW5kKS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL+S9v+eUqCzliIblibJtYXBUeXBlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWFwVHlwZXMgPSBtYXBUeXBlLnNwbGl0KFwiLFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKG1hcFR5cGVzLmxlbmd0aCAhPSAyKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdtYXDnsbvlnovplJnor686JyxhcnIwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBrZXlUeXBlID0gbWFwVHlwZXNbMF0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlVHlwZSA9IG1hcFR5cGVzWzFdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleVR5cGUgPSB0aGlzLmNoYW5nZVByb3RvRmllbGRUeXBlVG9Uc1R5cGUoa2V5VHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWVUeXBlMSA9IHRoaXMuY2hhbmdlUHJvdG9GaWVsZFR5cGVUb1RzVHlwZSh2YWx1ZVR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYodmFsdWVUeXBlMSAhPSAnc3RyaW5nJyAmJiB2YWx1ZVR5cGUxICE9IFwibnVtYmVyXCIgJiYgdmFsdWVUeXBlMSAhPSBcImJvb2xlYW5cIiAmJiB2YWx1ZVR5cGUxICE9IFwiVWludDhBcnJheVwiKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL+ivtOaYjuaYr+iHquWumuS5ieexu+Wei1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlVHlwZSA9IHRoaXMuX2dldE9iamVjdEZpbGVkVmFsdWVUeXBlKHZhbHVlVHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVR5cGUgPSB2YWx1ZVR5cGUxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/ojrflj5bliLA+5ZCO6Z2i55qE5YaF5a65XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnIwID0gYXJyMC5zdWJzdHJpbmcoZW5kICsgMSkudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/ku6U95YiG5YmyYXJyMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGFycjEgPSBhcnIwLnNwbGl0KFwiPVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWxlZE5hbWUgPSBhcnIxWzBdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGFycjEubGVuZ3RoID4gMil7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCA9IGFycjFbMl0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkSW5mbyA6IFByb3RvRmllbGQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSAgICA6IGZpbGVkTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlICAgIDogXCJ7IFtrZXkgOiBcIiArIGtleVR5cGUgKyBcIl0gOiBcIiArIHZhbHVlVHlwZSArIFwifVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFR5cGUgOiBcInsgW2tleSA6IFwiICsga2V5VHlwZSArIFwiXSA6IFwiICsgdmFsdWVUeXBlICsgXCJ9XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggICA6IGosXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uYWwgOiAncmVxdWlyZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpZWxkSW5mbzonLGZpZWxkSW5mbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLmZpZWxkcy5wdXNoKGZpZWxkSW5mbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBhcnJbMF0udHJpbVN0YXJ0KCkuc3BsaXQoXCIgXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL+WIoOmZpGZpZWxk5pWw57uE5Lit55qE56m65qC85YWD57SgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkID0gZmllbGQuZmlsdGVyKCh2YWx1ZSkgPT4gdmFsdWUudHJpbSgpICE9ICcnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgREVCVUcgJiYgY29uc29sZS5sb2coJ2ZpZWxkOicsZmllbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL29wdGlvbmFsIHJlcGVhdGVkIHJlcXVpcmVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWxlZFB0eXBlICAgID0gXCJvcHRpb25hbFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgb2xkVHlwZSAgICAgICA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmlsZWROYW1lIDogc3RyaW5nID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGZpZWxkLmxlbmd0aCA9PSAyKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFR5cGUgICAgID0gZmllbGRbMF0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZWROYW1lICAgPSBmaWVsZFsxXS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1lbHNlIGlmKGZpZWxkLmxlbmd0aCA9PSAzKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVkUHR5cGUgID0gZmllbGRbMF0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVHlwZSAgICAgPSBmaWVsZFsxXS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlZE5hbWUgICA9IGZpZWxkWzJdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSB0aGlzLmNoYW5nZVByb3RvRmllbGRUeXBlVG9Uc1R5cGUob2xkVHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGRJbmZvIDogUHJvdG9GaWVsZCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgICAgOiBmaWxlZE5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICAgOiBqLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uYWwgOiBmaWxlZFB0eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCA6IGFyci5sZW5ndGggPiAxID8gYXJyWzFdIDogY29tbWVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgREVCVUcgJiYgY29uc29sZS5sb2coJ2ZpZWxkSW5mbzonLGZpZWxkSW5mbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UuZmllbGRzLnB1c2goZmllbGRJbmZvKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdtZXNzYWdlOicsbWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBwcm90b0ZpbGUubWVzc2FnZXMucHVzaChtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGkgPSBqO1xyXG4gICAgICAgICAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgICAgICAgICBpZihsaW5lLnN0YXJ0c1dpdGgoXCJlbnVtXCIpKXtcclxuICAgICAgICAgICAgICAgIGxldCBlbnVtTmFtZSA9IGxpbmUuc3BsaXQoXCIgXCIpWzFdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIGlmKGVudW1OYW1lLmVuZHNXaXRoKFwie1wiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgZW51bU5hbWUgPSBlbnVtTmFtZS5zdWJzdHJpbmcoMCxlbnVtTmFtZS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxldCBlbnVtZCA6IFByb3RvRW51bSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lICAgIDogZW51bU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWVudCA6IHBjb21tZW50LFxyXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkcyAgOiBbXVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGxldCBqID0gaSArIDE7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29tbWVudCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgZm9yKDtqPGxpbmVzLmxlbmd0aDtqKyspe1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZExpbmUgPSBsaW5lc1tqXS50cmltU3RhcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZihmaWVsZExpbmUuc3RhcnRzV2l0aChcIn1cIikpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoZmllbGRMaW5lLnN0YXJ0c1dpdGgoXCJ7XCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZihmaWVsZExpbmUuc3RhcnRzV2l0aChcIi8vXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCA9IGZpZWxkTGluZS5zdWJzdHJpbmcoMikudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoZmllbGRMaW5lLmVuZHNXaXRoKFwiXFxyXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRMaW5lID0gZmllbGRMaW5lLnN1YnN0cmluZygwLGZpZWxkTGluZS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoZmllbGRMaW5lID09ICcnIHx8IGZpZWxkTGluZS5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvL+WFiOWwhmZpZWxkTGluZeS7pTvliIblibJcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYXJyICAgPSBmaWVsZExpbmUuc3BsaXQoXCI7XCIpLmZpbHRlcigodmFsdWUpID0+IHZhbHVlLnRyaW1TdGFydCgpICE9ICcnKTtcclxuICAgICAgICAgICAgICAgICAgICBpZihhcnIubGVuZ3RoID09IDApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoYXJyLmxlbmd0aCA+IDEpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc3RyID0gYXJyWzFdLnRyaW1TdGFydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzdHIuc3RhcnRzV2l0aChcIi8vXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyclsxXSA9IHN0ci5zdWJzdHJpbmcoMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gYXJyWzBdLnRyaW1TdGFydCgpLnNwbGl0KFwiPVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdmaWVsZDonLGZpZWxkKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGRJbmZvID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lICAgIDogZmllbGRbMF0udHJpbSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSAgIDogcGFyc2VJbnQoZmllbGRbMV0udHJpbSgpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCA6IGFyci5sZW5ndGggPiAxID8gYXJyWzFdIDogY29tbWVudCxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIC8vREVCVUcgJiYgY29uc29sZS5sb2coJ2VudW0gZmllbGRJbmZvOicsZmllbGRJbmZvKTtcclxuICAgICAgICAgICAgICAgICAgICBlbnVtZC5maWVsZHMucHVzaChmaWVsZEluZm8pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJvdG9GaWxlLmVudW1zLnB1c2goZW51bWQpO1xyXG4gICAgICAgICAgICAgICAgaSA9IGo7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgREVCVUcgJiYgY29uc29sZS5sb2coJ3Byb3Rv5paH5Lu277yaJyxwcm90b0ZpbGUpO1xyXG4gICAgICAgIHJldHVybiBwcm90b0ZpbGU7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIF9leHBvcnRPbmVQcm90b0ZpbGUoZmlsZSA6IHN0cmluZyxmb2xkZXJOYW1lIDogc3RyaW5nLGZpbGVQYXRoIDogc3RyaW5nKXtcclxuICAgICAgICBcclxuICAgICAgICBpZih0aGlzLmZpbGVzW2ZpbGVdKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBpbXBvcnRGaWxlcyA9IHRoaXMuX2dldFByb3RvSW1wb3J0RmlsZU5hbWVzKGZpbGVQYXRoKTtcclxuICAgICAgICBpZihpbXBvcnRGaWxlcy5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmsqHmnInlr7zlhaXmlofku7Ys5byA5aeL6Kej5p6QOicsZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICBjb25zdCBwcm90b0ZpbGUgPSB0aGlzLl9hbmFseXplUHJvdG9GaWxlKGZpbGVQYXRoLGZvbGRlck5hbWUsZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLmZpbGVzW2ZpbGVdID0gcHJvdG9GaWxlO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IobGV0IGkgPSAwO2k8aW1wb3J0RmlsZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIGNvbnN0IGltcG9ydEZpbGUgPSBpbXBvcnRGaWxlc1tpXTtcclxuICAgICAgICAgICAgaWYodGhpcy5maWxlc1tpbXBvcnRGaWxlXSl7XHJcbiAgICAgICAgICAgICAgICAvL+ivtOaYjuWcqGZpbGVz5LitXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAvL+ivtOaYjuS4jeWcqGZpbGVz5Lit77yM57un57ut5b6q546vXHJcbiAgICAgICAgICAgICAgICBjb25zdCBpbXBvcnRGaWxlUGF0aCA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCdwcm90b3MnLGZvbGRlck5hbWUsaW1wb3J0RmlsZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9leHBvcnRPbmVQcm90b0ZpbGUoaW1wb3J0RmlsZSxmb2xkZXJOYW1lLGltcG9ydEZpbGVQYXRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZygn6ZyA6KaB5a+85YWl55qE5paH5Lu26Kej5p6Q5a6M5q+VLOW8gOWni+ino+aekDonLGZpbGVQYXRoKTtcclxuICAgICAgICBjb25zdCBwcm90b0ZpbGUgPSB0aGlzLl9hbmFseXplUHJvdG9GaWxlKGZpbGVQYXRoLGZvbGRlck5hbWUsZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuZmlsZXNbZmlsZV0gPSBwcm90b0ZpbGU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDop6PmnpDmjIflrprlkI3lrZfnmoTmlofku7blpLnkuIvnmoTmiYDmnIlwcm90b+aWh+S7tlxyXG4gICAgICogQHBhcmFtIGZvbGVyTmFtZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfZXhwb3J0T25lRm9sZGVyUHJvdG9GaWxlc1RvRFRTKGZvbGVyTmFtZSA6IHN0cmluZyl7XHJcbiAgICAgICAgY29uc3QgZGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsJ3Byb3RvcycsZm9sZXJOYW1lKTtcclxuICAgICAgICBpZighZnMuZXhpc3RzU3luYyhkaXIpKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyhkaXIpO1xyXG5cclxuICAgICAgICBsZXQgY291bnQgPSBmaWxlcy5sZW5ndGg7XHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIGZvcihsZXQgZmlsZSBvZiBmaWxlcyl7XHJcbiAgICAgICAgICAgIGlmKGZpbGUuZW5kc1dpdGgoJy5wcm90bycpKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGRpcixmaWxlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2V4cG9ydE9uZVByb3RvRmlsZShmaWxlLGZvbGVyTmFtZSxmaWxlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zdCBwcm90b0ZpbGUgPSB0aGlzLl9hbmFseXplUHJvdG9GaWxlKGZpbGVQYXRoLGZvbGVyTmFtZSxmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmZpbGVzW2ZpbGVdID0gcHJvdG9GaWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIF9nZXRPYmplY3RGaWxlZFZhbHVlVHlwZSh2YWx1ZVR5cGUgOiBhbnkpe1xyXG4gICAgICAgIGNvbnN0IGZpbGVzICAgICAgICAgICAgID0gdGhpcy5maWxlcztcclxuICAgICAgICBjb25zdCB2YWx1ZXMgPSBPYmplY3QudmFsdWVzKGZpbGVzKTtcclxuICAgICAgICBsZXQgZm91bmQgOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAgICAgLy/lpoLmnpx0eXBl5ZKMb2xkVHlwZeebuOetie+8jOS4lOS4jeaYr3N0cmluZ+exu+Wei++8jOivtOaYjuaYr+iHquWumuS5ieexu+Wei1xyXG4gICAgICAgIFRvb2xzLmZvckVhY2hNYXAoZmlsZXMsKGZpbGVOYW1lIDogc3RyaW5nLHByb3RvRmlsZSA6IFByb3RvRmlsZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBlbnVtcyA9IHByb3RvRmlsZS5lbnVtcztcclxuICAgICAgICAgICAgZm9yKGxldCBpID0gMDtpPGVudW1zLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgaWYoZW51bXNbaV0ubmFtZSA9PSB2YWx1ZVR5cGUpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSB0aGlzLmdldFNjcmlwdE5hbWVBbmROYW1lc3BhY2VOYW1lRnJvbVByb3RvRmlsZU5hbWUoZmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlVHlwZSA9IGluZm8ubmFtZXNwYWNlTmFtZSArICcuJyArIHZhbHVlVHlwZTtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZXMgPSBwcm90b0ZpbGUubWVzc2FnZXM7XHJcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7aTxtZXNzYWdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgICAgIGlmKG1lc3NhZ2VzW2ldLm5hbWUgPT0gdmFsdWVUeXBlKXtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5nZXRTY3JpcHROYW1lQW5kTmFtZXNwYWNlTmFtZUZyb21Qcm90b0ZpbGVOYW1lKGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZVR5cGUgPSBpbmZvLm5hbWVzcGFjZU5hbWUgKyAnLicgKyB2YWx1ZVR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7ICBcclxuICAgICAgICByZXR1cm4gdmFsdWVUeXBlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIF9nZXRGaWVsZFR5cGUoZmllbGQgOiBQcm90b0ZpZWxkLG1lc3NhZ2VzIDogUHJvdG9NZXNzYWdlW10pe1xyXG4gICAgICAgIGxldCB0eXBlICAgID0gZmllbGQudHlwZTtcclxuICAgICAgICBjb25zdCBmaWxlcyA9IHRoaXMuZmlsZXM7XHJcbiAgICAgICAgY29uc3QgZmlsZWRQdHlwZSAgICA9IGZpZWxkLm9wdGlvbmFsO1xyXG4gICAgICAgIGNvbnN0IG9sZFR5cGUgICA9IGZpZWxkLm9sZFR5cGU7XHJcbiAgICAgICAgaWYodHlwZS5pbmNsdWRlcygnLicpKXtcclxuICAgICAgICAgICAgLy/lpoLmnpzljIXlkKsu6K+05piO5piv5Yir55qE5YyF55qE57G75Z6LXHJcbiAgICAgICAgICAgIGNvbnN0IGFyciA9IHR5cGUuc3BsaXQoJy4nKTtcclxuICAgICAgICAgICAgY29uc3QgcE5hbWUgPSBhcnJbMF07XHJcbiAgICAgICAgICAgIGNvbnN0IHBUeXBlID0gYXJyWzFdO1xyXG4gICAgICAgICAgICAvL+aJvuWIsHBhY2thZ2VOYW1l5a+55bqU55qEbmFtZXNwYWNlXHJcbiAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAoZmlsZXMsKGZpbGVOYW1lIDogc3RyaW5nLHByb3RvRmlsZSA6IFByb3RvRmlsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYocHJvdG9GaWxlLnBhY2thZ2VOYW1lID09IHBOYW1lKXtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5nZXRTY3JpcHROYW1lQW5kTmFtZXNwYWNlTmFtZUZyb21Qcm90b0ZpbGVOYW1lKGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gaW5mby5uYW1lc3BhY2VOYW1lICsgJy4nICsgcFR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZih0eXBlID09IG9sZFR5cGUgJiYgdHlwZSAhPSAnc3RyaW5nJyl7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2FtZUZpbGUgOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAvL+mmluWFiOajgOafpW1lc3NhZ2Vz5piv5ZCm5pyJXHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwO2k8bWVzc2FnZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYobWVzc2FnZXNbaV0ubmFtZSA9PSB0eXBlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgREVCVUcgJiYgY29uc29sZS5sb2coJ0lOIFNBTUUgRklMRTonLHR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYW1lRmlsZSAgICA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKCFzYW1lRmlsZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgLy/lpoLmnpx0eXBl5ZKMb2xkVHlwZeebuOetie+8jOS4lOS4jeaYr3N0cmluZ+exu+Wei++8jOivtOaYjuaYr+iHquWumuS5ieexu+Wei1xyXG4gICAgICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAoZmlsZXMsKGZpbGVOYW1lIDogc3RyaW5nLHByb3RvRmlsZSA6IFByb3RvRmlsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbnVtcyA9IHByb3RvRmlsZS5lbnVtcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDtpPGVudW1zLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZW51bXNbaV0ubmFtZSA9PSB0eXBlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5nZXRTY3JpcHROYW1lQW5kTmFtZXNwYWNlTmFtZUZyb21Qcm90b0ZpbGVOYW1lKGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gaW5mby5uYW1lc3BhY2VOYW1lICsgJy4nICsgdHlwZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXNzYWdlcyA9IHByb3RvRmlsZS5tZXNzYWdlcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDtpPG1lc3NhZ2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYobWVzc2FnZXNbaV0ubmFtZSA9PSB0eXBlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5nZXRTY3JpcHROYW1lQW5kTmFtZXNwYWNlTmFtZUZyb21Qcm90b0ZpbGVOYW1lKGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gaW5mby5uYW1lc3BhY2VOYW1lICsgJy4nICsgdHlwZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZmlsZWRQdHlwZSA9PSAncmVwZWF0ZWQnKXtcclxuICAgICAgICAgICAgdHlwZSA9IHR5cGUgKyAnW10nO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHlwZTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3dyaXRlUHJvdG9GaWxlVG9EVFMocHJvdG9GaWxlIDogUHJvdG9GaWxlKXtcclxuICAgICAgICBsZXQgcHJvdG9GaWxlTmFtZSAgICA9IHByb3RvRmlsZS5maWxlTmFtZTtcclxuICAgICAgICBpZihwcm90b0ZpbGVOYW1lLmVuZHNXaXRoKCcucHJvdG8nKSl7XHJcbiAgICAgICAgICAgIHByb3RvRmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHByb3RvRmlsZU5hbWUsJy5wcm90bycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBidW5kbGVOYW1lICAgID0gcHJvdG9GaWxlLmJ1bmRsZU5hbWU7XHJcbiAgICAgICAgY29uc3QgZmlsZXMgICAgICAgICA9IHRoaXMuZmlsZXM7XHJcbiAgICAgICAgLy/ljrvmjolwcm90b0ZpbGVOYW1l5Lit55qE54m55q6K56ym5Y+3LOavlOWmguWMheaLrF9cclxuICAgICAgICBwcm90b0ZpbGVOYW1lID0gcHJvdG9GaWxlTmFtZS5yZXBsYWNlKC9fL2csJycpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5o+P6L+w5paH5Lu2XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgbGV0IHRleHRkdHMgPSAnJztcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDlr7zlh7rmlofku7ZcclxuICAgICAgICAgKi9cclxuICAgICAgICBsZXQgdGV4dCAgICA9ICcnO1xyXG5cclxuICAgICAgICB0ZXh0ZHRzICs9IFwiZGVjbGFyZSBuYW1lc3BhY2UgXCIgKyBwcm90b0ZpbGVOYW1lICsgXCJ7XFxuXFxuXCI7XHJcbiAgICAgICAgdGV4dCAgICArPSBcImV4cG9ydCBuYW1lc3BhY2UgXCIgKyBwcm90b0ZpbGVOYW1lICsgXCJ7XFxuXFxuXCI7XHJcbiAgICAgICAgLy/lhpnnnJ/mraPnmoRwYWNrYWdl5ZCN5a2XXHJcbiAgICAgICAgdGV4dGR0cyArPSBcIiAgICBjb25zdCBQQUNLQUdFX05BTUUgPSAnXCIgKyBwcm90b0ZpbGUucGFja2FnZU5hbWUgKyBcIic7XFxuXFxuXCI7XHJcbiAgICAgICAgdGV4dCAgICArPSBcIiAgICBleHBvcnQgY29uc3QgUEFDS0FHRV9OQU1FID0gJ1wiICsgcHJvdG9GaWxlLnBhY2thZ2VOYW1lICsgXCInO1xcblxcblwiO1xyXG4gICAgICAgIC8v5YaZZW51bVxyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7aTxwcm90b0ZpbGUuZW51bXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIGxldCBlbnVtZCA9IHByb3RvRmlsZS5lbnVtc1tpXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgLyoqIFwiICsgZW51bWQuY29tbWVudCArIFwiICovXFxuXCI7XHJcbiAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgZW51bSBcIiArIGVudW1kLm5hbWUgKyBcIntcXG5cIjtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRleHQgICAgKz0gXCIgICAgLyoqIFwiICsgZW51bWQuY29tbWVudCArIFwiICovXFxuXCI7XHJcbiAgICAgICAgICAgIHRleHQgICAgKz0gXCIgICAgZXhwb3J0IGVudW0gXCIgKyBlbnVtZC5uYW1lICsgXCJ7XFxuXCI7XHJcbiAgICBcclxuICAgICAgICAgICAgZm9yKGxldCBqID0gMDtqPGVudW1kLmZpZWxkcy5sZW5ndGg7aisrKXtcclxuICAgICAgICAgICAgICAgIGxldCBmaWVsZCA9IGVudW1kLmZpZWxkc1tqXTtcclxuICAgICAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgICAgIC8qKiBcIiArIGZpZWxkLmNvbW1lbnQgKyBcIiAqL1xcblwiO1xyXG4gICAgICAgICAgICAgICAgdGV4dGR0cyArPSBcIiAgICAgICAgXCIgKyBmaWVsZC5uYW1lICsgXCIgPSBcIiArIGZpZWxkLnZhbHVlICsgXCIsXFxuXCI7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gXCIgICAgICAgIC8qKiBcIiArIGZpZWxkLmNvbW1lbnQgKyBcIiAqL1xcblwiO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBcIiAgICAgICAgXCIgKyBmaWVsZC5uYW1lICsgXCIgPSBcIiArIGZpZWxkLnZhbHVlICsgXCIsXFxuXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGV4dGR0cyArPSBcIiAgICB9XFxuXFxuXCI7XHJcbiAgICAgICAgICAgIHRleHQgICAgKz0gXCIgICAgfVxcblxcblwiO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIC8v5bCG5omA5pyJbWVzc2FnZeeahG5hbWXlhpnmiJBlbnVtXHJcbiAgICAgICAgdGV4dGR0cyArPSBcIiAgICBlbnVtIE1lc3NhZ2Uge1xcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgICAgZXhwb3J0IGVudW0gTWVzc2FnZSB7XFxuXCI7XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpPHByb3RvRmlsZS5tZXNzYWdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBwcm90b0ZpbGUubWVzc2FnZXNbaV07XHJcbiAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgICAgIC8qKiBcIiArIG1lc3NhZ2UuY29tbWVudCArIFwiICovXFxuXCI7XHJcbiAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgICAgIFwiICsgbWVzc2FnZS5uYW1lICsgXCIgPSAnXCIgKyBtZXNzYWdlLm5hbWUgKyBcIicsXFxuXCI7XHJcbiAgICBcclxuICAgICAgICAgICAgdGV4dCArPSBcIiAgICAgICAgLyoqIFwiICsgbWVzc2FnZS5jb21tZW50ICsgXCIgKi9cXG5cIjtcclxuICAgICAgICAgICAgdGV4dCArPSBcIiAgICAgICAgXCIgKyBtZXNzYWdlLm5hbWUgKyBcIiA9ICdcIiArIG1lc3NhZ2UubmFtZSArIFwiJyxcXG5cIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGV4dGR0cyArPSBcIiAgICB9XFxuXFxuXCI7XHJcbiAgICAgICAgdGV4dCAgICArPSBcIiAgICB9XFxuXFxuXCI7XHJcbiAgICAgICAgLy/lhpltZXNzYWdlXHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpPHByb3RvRmlsZS5tZXNzYWdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBwcm90b0ZpbGUubWVzc2FnZXNbaV07XHJcbiAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgLyoqIFwiICsgbWVzc2FnZS5jb21tZW50ICsgXCIgKi9cXG5cIjtcclxuICAgICAgICAgICAgdGV4dGR0cyArPSBcIiAgICBpbnRlcmZhY2UgXCIgKyBtZXNzYWdlLm5hbWUgKyBcIntcXG5cIjtcclxuICAgIFxyXG4gICAgICAgICAgICB0ZXh0ICs9IFwiICAgIC8qKiBcIiArIG1lc3NhZ2UuY29tbWVudCArIFwiICovXFxuXCI7XHJcbiAgICAgICAgICAgIHRleHQgKz0gXCIgICAgZXhwb3J0IGludGVyZmFjZSBcIiArIG1lc3NhZ2UubmFtZSArIFwie1xcblwiO1xyXG4gICAgXHJcbiAgICAgICAgICAgIGZvcihsZXQgaiA9IDA7ajxtZXNzYWdlLmZpZWxkcy5sZW5ndGg7aisrKXtcclxuICAgICAgICAgICAgICAgIGxldCBmaWVsZCA9IG1lc3NhZ2UuZmllbGRzW2pdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcFR5cGUgPSB0aGlzLl9nZXRGaWVsZFR5cGUoZmllbGQscHJvdG9GaWxlLm1lc3NhZ2VzKTtcclxuICAgICAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgICAgIC8qKiBcIiArIGZpZWxkLmNvbW1lbnQgKyBcIiAqL1xcblwiO1xyXG4gICAgICAgICAgICAgICAgdGV4dCAgICArPSBcIiAgICAgICAgLyoqIFwiICsgZmllbGQuY29tbWVudCArIFwiICovXFxuXCI7XHJcbiAgICAgICAgICAgICAgICBpZihmaWVsZC5vcHRpb25hbCA9PSAnb3B0aW9uYWwnKXtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgICAgICBcIiArIGZpZWxkLm5hbWUgKyBcIj8gOiBcIiArIHBUeXBlICsgXCI7XFxuXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCArPSBcIiAgICAgICAgXCIgKyBmaWVsZC5uYW1lICsgXCI/IDogXCIgKyBwVHlwZSArIFwiO1xcblwiO1xyXG4gICAgICAgICAgICAgICAgfWVsc2UgaWYoZmllbGQub3B0aW9uYWwgPT0gJ3JlcXVpcmVkJyB8fCBmaWVsZC5vcHRpb25hbCA9PSAncmVwZWF0ZWQnKXtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgICAgICBcIiArIGZpZWxkLm5hbWUgKyBcIiA6IFwiICsgcFR5cGUgKyBcIjtcXG5cIjtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ICs9IFwiICAgICAgICBcIiArIGZpZWxkLm5hbWUgKyBcIiA6IFwiICsgcFR5cGUgKyBcIjtcXG5cIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgIH1cXG5cXG5cIjtcclxuICAgICAgICAgICAgdGV4dCArPSBcIiAgICB9XFxuXFxuXCI7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgICAgICB0ZXh0ZHRzICs9IFwifVxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCJ9XFxuXCI7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGV4dCArPSBcIndpbmRvd1snXCIgKyBwcm90b0ZpbGVOYW1lICsgXCInXSA9IFwiICsgcHJvdG9GaWxlTmFtZSArIFwiO1xcblwiO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ3RleHQ6Jyx0ZXh0KTtcclxuICAgIFxyXG4gICAgICAgIGxldCBmaWxlVXJsID0gXCJcIjtcclxuICAgICAgICBsZXQgZHRzZmlsZU5hbWUgPSBwcm90b0ZpbGVOYW1lICsgJy5kLnRzJzsgXHJcbiAgICAgICAgbGV0IGZpbGVOYW1lICAgID0gcHJvdG9GaWxlTmFtZSArICcudHMnO1xyXG4gICAgICAgIGlmKGJ1bmRsZU5hbWUgPT0gJ3Jlc291cmNlcycpe1xyXG4gICAgICAgICAgICBmaWxlVXJsID0gcGF0aC5qb2luKCdhc3NldHMnLCdyZXNvdXJjZXMnLCdzY3JpcHRzJywnYXV0bycsJ21lc3NhZ2UnLCdkZWZpbmVzJyxmaWxlTmFtZSk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGZpbGVVcmwgPSBwYXRoLmpvaW4oJ2Fzc2V0cycsJ2J1bmRsZXMnLGJ1bmRsZU5hbWUsJ3NjcmlwdHMnLCdtZXNzYWdlJywnZGVmaW5lcycsZmlsZU5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaWxlVXJsID0gJ2RiOi8vJyArIGZpbGVVcmw7XHJcbiAgICAgICAgREVCVUcgJiYgY29uc29sZS53YXJuKCflr7zlh7pwcm90by0+ZmlsZVVybDonLGZpbGVVcmwpO1xyXG4gICAgICAgIEFzc2V0RGJVdGlscy5SZXF1ZXN0Q3JlYXRlTmV3QXNzZXQoZmlsZVVybCx0ZXh0KTtcclxuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCdkZWNsYXJlJyxkdHNmaWxlTmFtZSk7XHJcbiAgICAgICAgREVCVUcgJiYgY29uc29sZS53YXJuKCflr7zlh7pwcm90b19kLnRzLT5maWxlVXJsOicsZmlsZVBhdGgpO1xyXG4gICAgICAgIEZpbGVVdGlscy5Xcml0ZUZpbGUoZmlsZVBhdGgsdGV4dGR0cyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy/lsIbmr4/kuIDkuKpwcm90b+aWh+S7tuWvvOWHumQudHPlkox0c+aWh+S7tlxyXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBQcm9jZXNzaW5nRXhwb3J0UHJvdG9zRFRTKHRhcmdldE5hbWU/IDogc3RyaW5nKXtcclxuICAgICAgICAvLzEu5YWI6Kej5p6QcmVzb3VyY2Vz5paH5Lu25aS55LiL55qE5omA5pyJcHJvdG/mlofku7ZcclxuICAgICAgICB0aGlzLl9leHBvcnRPbmVGb2xkZXJQcm90b0ZpbGVzVG9EVFMoJ3Jlc291cmNlcycpO1xyXG4gICAgICAgIC8v5Zyo6Kej5p6QcHJvdG9z55uu5b2V5LiL55qE5YW25LuW5paH5Lu25aS5XHJcbiAgICAgICAgY29uc3QgZGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsJ3Byb3RvcycpO1xyXG4gICAgICAgIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoZGlyKTtcclxuICAgICAgICBmb3IobGV0IGZpbGUgb2YgZmlsZXMpe1xyXG4gICAgICAgICAgICBpZihmaWxlID09ICdyZXNvdXJjZXMnKXtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKHRhcmdldE5hbWUgJiYgdGFyZ2V0TmFtZSAhPSBmaWxlKXtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2V4cG9ydE9uZUZvbGRlclByb3RvRmlsZXNUb0RUUyhmaWxlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy/lvIDlp4vlhpnlhaXmlofku7ZcclxuICAgICAgICBUb29scy5mb3JFYWNoTWFwKHRoaXMuZmlsZXMsKGZpbGVOYW1lIDogc3RyaW5nLHByb3RvRmlsZSA6IFByb3RvRmlsZSkgPT4ge1xyXG4gICAgICAgICAgICBpZih0YXJnZXROYW1lICYmIHRhcmdldE5hbWUgIT0gcHJvdG9GaWxlLmJ1bmRsZU5hbWUpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3dyaXRlUHJvdG9GaWxlVG9EVFMocHJvdG9GaWxlKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvL+a4heepuuaVsOaNrlxyXG4gICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcclxuICAgIH1cclxufSJdfQ==