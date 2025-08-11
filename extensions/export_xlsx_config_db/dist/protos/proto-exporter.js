"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtoExporter = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const asset_db_utils_1 = require("../utils/asset-db-utils");
const file_utils_1 = __importDefault(require("../utils/file-utils"));
const tools_1 = __importDefault(require("../utils/tools"));
const pako_1 = __importDefault(require("pako"));
const DEBUG = true;
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
                const content = pako_1.default.deflate(jsonStr, { level: 0 });
                //const zip       = new JSZip();
                //zip.file(bundleName,jsonStr);
                // 压缩后的数据
                // const content = await zip.generateAsync({
                //     type: "uint8array",//nodejs用
                //     compression: "DEFLATE",
                //     compressionOptions: {
                //         level : 9,
                //     }
                // });
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
                                type: "{ key : " + keyType + ", value : " + valueType + "}",
                                oldType: "{ key : " + keyType + ", value : " + valueType + "}",
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
            // const arr = type.split('.');
            // const pName = arr[0];
            // const pType = arr[1];
            // //找到packageName对应的namespace
            // Tools.forEachMap(files,(fileName : string,protoFile : ProtoFile) => {
            //     if(protoFile.packageName == pName){
            //         const info = this.getScriptNameAndNamespaceNameFromProtoFileName(fileName);
            //         type = info.namespaceName + '.' + pType;
            //         return true;
            //     }
            // });
            return type;
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
        textdts += "declare module " + protoFileName + "{\n\n";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdG8tZXhwb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvcHJvdG9zL3Byb3RvLWV4cG9ydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUN4Qix3REFBMEI7QUFFMUIsNERBQXVEO0FBQ3ZELHFFQUE0QztBQUM1QywyREFBbUM7QUFDbkMsZ0RBQXdCO0FBQ3hCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQztBQUVuQixNQUFhLGFBQWE7SUFFdEI7O09BRUc7SUFDSSxNQUFNLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLFVBQW1CO1FBQzFELE1BQU0sR0FBRyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDckQsY0FBYztRQUNkLE1BQU0sS0FBSyxHQUFHLGtCQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLDRCQUE0QjtRQUM1QixJQUFJLEtBQUssR0FBK0IsRUFBRSxDQUFDO1FBQzNDLEtBQUssSUFBSSxVQUFVLElBQUksS0FBSyxFQUFFO1lBQzFCLElBQUksVUFBVSxJQUFJLFVBQVUsSUFBSSxVQUFVLEVBQUU7Z0JBQ3hDLFNBQVM7YUFDWjtZQUNELE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzVDLElBQUksa0JBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUU7Z0JBQ3JDLGtCQUFrQjtnQkFDbEIsTUFBTSxVQUFVLEdBQUcsa0JBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzVDLE1BQU0sVUFBVSxHQUErQixFQUFFLENBQUM7Z0JBQ2xELEtBQUssSUFBSSxTQUFTLElBQUksVUFBVSxFQUFFO29CQUM5QixlQUFlO29CQUNmLElBQUks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QUM7U0FDOUM7UUFDRCxRQUFRO1FBQ1IsZUFBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsUUFBZ0IsRUFBRSxTQUFvQixFQUFFLEVBQUU7WUFDcEUsSUFBSSxVQUFVLElBQUksVUFBVSxJQUFJLFNBQVMsQ0FBQyxVQUFVLEVBQUU7Z0JBQ2xELE9BQU87YUFDVjtZQUNELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU07UUFDTixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUNwQixDQUFDOztBQWxwQkwsc0NBbXBCQztBQXJsQmtCLG1CQUFLLEdBQWtDLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCBmcyBmcm9tIFwiZnMtZXh0cmFcIjtcclxuaW1wb3J0IEpTWmlwIGZyb20gXCJqc3ppcFwiO1xyXG5pbXBvcnQgeyBBc3NldERiVXRpbHMgfSBmcm9tIFwiLi4vdXRpbHMvYXNzZXQtZGItdXRpbHNcIjtcclxuaW1wb3J0IEZpbGVVdGlscyBmcm9tIFwiLi4vdXRpbHMvZmlsZS11dGlsc1wiO1xyXG5pbXBvcnQgVG9vbHMgZnJvbSBcIi4uL3V0aWxzL3Rvb2xzXCI7XHJcbmltcG9ydCBwYWtvIGZyb20gXCJwYWtvXCI7XHJcbmNvbnN0IERFQlVHID0gdHJ1ZTtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm90b0V4cG9ydGVyIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqICDlsIZwcm90b2J1ZuaWh+S7tuWQiOW5tuWIsOS4gOS4qmpzb27moLzlvI/nmoTlrZfnrKbkuLLkuK3vvIznhLblkI7kvb/nlKhqc3ppcOWOi+e8qeaIkOS6jOi/m+WItuaWh+S7tlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGFzeW5jIFByb2Nlc3NpbmdFeHBvcnRQcm90b3ModGFyZ2V0TmFtZT86IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IGRpciA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCAncHJvdG9zJyk7XHJcbiAgICAgICAgLy/pgY3ljoZkaXLkuIvmiYDmnInnmoTmlofku7blpLlcclxuICAgICAgICBjb25zdCBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jKGRpcik7XHJcbiAgICAgICAgLy/mr4/kuKrmlofku7blpLnkuIvnmoRwcm90b+aWh+S7tuWQiOW5tuWIsOS4gOS4qmpzb27lr7nosaHkuK1cclxuICAgICAgICBsZXQgZGF0YXM6IHsgW25hbWU6IHN0cmluZ106IHN0cmluZyB9ID0ge307XHJcbiAgICAgICAgZm9yIChsZXQgYnVuZGxlTmFtZSBvZiBmaWxlcykge1xyXG4gICAgICAgICAgICBpZiAodGFyZ2V0TmFtZSAmJiB0YXJnZXROYW1lICE9IGJ1bmRsZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGRpciwgYnVuZGxlTmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChmcy5zdGF0U3luYyhmaWxlUGF0aCkuaXNEaXJlY3RvcnkoKSkge1xyXG4gICAgICAgICAgICAgICAgLy/pgY3ljobmlofku7blpLnkuIvnmoTmiYDmnIlwcm90b+aWh+S7tlxyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvdG9GaWxlcyA9IGZzLnJlYWRkaXJTeW5jKGZpbGVQYXRoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGpzb25PYmplY3Q6IHsgW25hbWU6IHN0cmluZ106IHN0cmluZyB9ID0ge307XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBwcm90b0ZpbGUgb2YgcHJvdG9GaWxlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8v5qOA5p+l5piv5ZCm5LulLnByb3Rv57uT5bC+XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwcm90b0ZpbGUuZW5kc1dpdGgoJy5wcm90bycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm90b0ZpbGVQYXRoID0gcGF0aC5qb2luKGZpbGVQYXRoLCBwcm90b0ZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8v6K+75Y+WcHJvdG/mlofku7blhoXlrrlcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm90b0NvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMocHJvdG9GaWxlUGF0aCkudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgICAgICBqc29uT2JqZWN0W3Byb3RvRmlsZV0gPSBwcm90b0NvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zdCBqc29uU3RyID0gSlNPTi5zdHJpbmdpZnkoanNvbk9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICBkYXRhc1tidW5kbGVOYW1lXSA9IGpzb25TdHI7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gcGFrby5kZWZsYXRlKGpzb25TdHIsIHsgbGV2ZWw6IDAgfSk7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnN0IHppcCAgICAgICA9IG5ldyBKU1ppcCgpO1xyXG4gICAgICAgICAgICAgICAgLy96aXAuZmlsZShidW5kbGVOYW1lLGpzb25TdHIpO1xyXG4gICAgICAgICAgICAgICAgLy8g5Y6L57yp5ZCO55qE5pWw5o2uXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zdCBjb250ZW50ID0gYXdhaXQgemlwLmdlbmVyYXRlQXN5bmMoe1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIHR5cGU6IFwidWludDhhcnJheVwiLC8vbm9kZWpz55SoXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgY29tcHJlc3Npb246IFwiREVGTEFURVwiLFxyXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbXByZXNzaW9uT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBsZXZlbCA6IDksXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gfSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgb3V0UGF0aCA9ICdkYjovL2Fzc2V0cyc7XHJcbiAgICAgICAgICAgICAgICBsZXQganNvblBhdGggPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ2Fzc2V0cycpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGJ1bmRsZU5hbWUgPT0gJ3Jlc291cmNlcycpIHtcclxuICAgICAgICAgICAgICAgICAgICBvdXRQYXRoID0gJ2RiOi8vYXNzZXRzL3Jlc291cmNlcy9wcm90b3MvcHJvdG8uYmluJztcclxuICAgICAgICAgICAgICAgICAgICBqc29uUGF0aCA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCAnYXNzZXRzJywgJ3Jlc291cmNlcycsICdwcm90b3MnLCAncHJvdG8uYmluJyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG91dFBhdGggPSBgZGI6Ly9hc3NldHMvYnVuZGxlcy8ke2J1bmRsZU5hbWV9L3Byb3Rvcy9wcm90by5iaW5gO1xyXG4gICAgICAgICAgICAgICAgICAgIGpzb25QYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdhc3NldHMnLCAnYnVuZGxlcycsIGJ1bmRsZU5hbWUsICdwcm90b3MnLCAncHJvdG8uYmluJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2ZzLndyaXRlSnNvblN5bmMoanNvblBhdGgsanNvbk9iamVjdCx7c3BhY2VzIDogNH0pO1xyXG4gICAgICAgICAgICAgICAgLy8g6L6T5Ye655qE5LqM6L+b5Yi277yM5paH5Lu25aS0K+WOi+e8qeWQjueahOaVsOaNrlxyXG4gICAgICAgICAgICAgICAgYXdhaXQgQXNzZXREYlV0aWxzLlJlcXVlc3RDcmVhdGVOZXdBc3NldChvdXRQYXRoLCBjb250ZW50IGFzIGFueSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgZmlsZXM6IHsgW25hbWU6IHN0cmluZ106IFByb3RvRmlsZSB9ID0ge307XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY2hhbmdlUHJvdG9GaWVsZFR5cGVUb1RzVHlwZShmaWVsZFR5cGU6IHN0cmluZykge1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ2NoYW5nZVByb3RvRmllbGRUeXBlVG9Uc1R5cGUtPmZpZWxkVHlwZTonLGZpZWxkVHlwZSk7XHJcbiAgICAgICAgc3dpdGNoIChmaWVsZFR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnaW50MzInOlxyXG4gICAgICAgICAgICBjYXNlICdpbnQ2NCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ3VpbnQzMic6XHJcbiAgICAgICAgICAgIGNhc2UgJ3VpbnQ2NCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ3NpbnQzMic6XHJcbiAgICAgICAgICAgIGNhc2UgJ3NpbnQ2NCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ2ZpeGVkMzInOlxyXG4gICAgICAgICAgICBjYXNlICdmaXhlZDY0JzpcclxuICAgICAgICAgICAgY2FzZSAnc2ZpeGVkMzInOlxyXG4gICAgICAgICAgICBjYXNlICdzZml4ZWQ2NCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ2Zsb2F0JzpcclxuICAgICAgICAgICAgY2FzZSAnZG91YmxlJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiAnbnVtYmVyJztcclxuICAgICAgICAgICAgY2FzZSAnYm9vbCc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2Jvb2xlYW4nO1xyXG4gICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuICdzdHJpbmcnO1xyXG4gICAgICAgICAgICBjYXNlICdieXRlcyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1VpbnQ4QXJyYXknO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgZ2V0U2NyaXB0TmFtZUFuZE5hbWVzcGFjZU5hbWVGcm9tUHJvdG9GaWxlTmFtZShwcm90b0ZpbGVOYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBsZXQgZmlsZU5hbWUgPSBwcm90b0ZpbGVOYW1lO1xyXG4gICAgICAgIGlmIChmaWxlTmFtZS5lbmRzV2l0aCgnLnByb3RvJykpIHtcclxuICAgICAgICAgICAgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVOYW1lLCAnLnByb3RvJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERFQlVHICYmIGNvbnNvbGUubG9nKCdnZXRTY3JpcHROYW1lQW5kTmFtZXNwYWNlTmFtZUZyb21Qcm90b0ZpbGVOYW1lLT5maWxlTmFtZTonLCBmaWxlTmFtZSk7XHJcbiAgICAgICAgLy/ljrvmjolwcm90b0ZpbGVOYW1l5Lit55qE54m55q6K56ym5Y+3LOavlOWmguWMheaLrF9cclxuICAgICAgICBmaWxlTmFtZSA9IGZpbGVOYW1lLnJlcGxhY2UoL18vZywgJycpO1xyXG4gICAgICAgIGxldCBwYWNrYWdlTmFtZSA9IGZpbGVOYW1lO1xyXG4gICAgICAgIC8vcGFja2FnZU5hbWXpppblrZfmr43lpKflhplcclxuICAgICAgICAvL3BhY2thZ2VOYW1lID0gcGFja2FnZU5hbWUuc3Vic3RyaW5nKDAsMSkudG9VcHBlckNhc2UoKSArIHBhY2thZ2VOYW1lLnN1YnN0cmluZygxKTtcclxuICAgICAgICAvL3JldHVybiB7c2NyaXB0TmFtZSA6IGZpbGVOYW1lICsgXCItbWVzc2FnZS1kZWZpbmVzXCIsbmFtZXNwYWNlTmFtZSA6IFwiUHJvdG9cIiArIHBhY2thZ2VOYW1lfTtcclxuICAgICAgICByZXR1cm4geyBzY3JpcHROYW1lOiBmaWxlTmFtZSArIFwiLW1lc3NhZ2UtZGVmaW5lc1wiLCBuYW1lc3BhY2VOYW1lOiBwYWNrYWdlTmFtZSB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog6I635Y+W5oyH5a6acHJvdG/mlofku7bnmoTlr7zlhaXmlofku7blkI1cclxuICAgICAqIEBwYXJhbSBmaWxlUGF0aCBcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2dldFByb3RvSW1wb3J0RmlsZU5hbWVzKGZpbGVQYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBsaW5lcyA9IEZpbGVVdGlscy5HZXRGaWxlQ29udGVudEJ5TGluZXMoZmlsZVBhdGgpO1xyXG4gICAgICAgIGxldCBpbXBvcnRGaWxlczogc3RyaW5nW10gPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBsaW5lID0gbGluZXNbaV07XHJcbiAgICAgICAgICAgIGlmIChsaW5lLmVuZHNXaXRoKFwiXFxyXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAvL+WOu+aOiVxcclxyXG4gICAgICAgICAgICAgICAgbGluZSA9IGxpbmUuc3Vic3RyaW5nKDAsIGxpbmUubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcImltcG9ydFwiKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGltcG9ydEZpbGUgPSBsaW5lLnNwbGl0KFwiIFwiKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmIChpbXBvcnRGaWxlLmVuZHNXaXRoKFwiO1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydEZpbGUgPSBpbXBvcnRGaWxlLnN1YnN0cmluZygwLCBpbXBvcnRGaWxlLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGltcG9ydEZpbGUuc3RhcnRzV2l0aCgnXCInKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydEZpbGUgPSBpbXBvcnRGaWxlLnN1YnN0cmluZygxLCBpbXBvcnRGaWxlLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGltcG9ydEZpbGUuZW5kc1dpdGgoJ1wiJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRGaWxlID0gaW1wb3J0RmlsZS5zdWJzdHJpbmcoMCwgaW1wb3J0RmlsZS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGltcG9ydEZpbGVzLnB1c2goaW1wb3J0RmlsZSk7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaW1wb3J0RmlsZXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDop6PmnpDmjIflrprnmoRwcm90b+aWh+S7tlxyXG4gICAgICogQHBhcmFtIGZpbGVQYXRoIFxyXG4gICAgICogQHBhcmFtIGJ1bmRsZU5hbWUgXHJcbiAgICAgKiBAcGFyYW0gYkFuYWx5c2lzSW1wb3J0IFxyXG4gICAgICogQHJldHVybnMgXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgc3RhdGljIF9hbmFseXplUHJvdG9GaWxlKGZpbGVQYXRoOiBzdHJpbmcsIGJ1bmRsZU5hbWU6IHN0cmluZywgYkFuYWx5c2lzSW1wb3J0OiBib29sZWFuID0gdHJ1ZSkge1xyXG4gICAgICAgIGNvbnN0IG5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoLCAnLnByb3RvJyk7XHJcbiAgICAgICAgY29uc3QgbGluZXMgPSBGaWxlVXRpbHMuR2V0RmlsZUNvbnRlbnRCeUxpbmVzKGZpbGVQYXRoKTtcclxuICAgICAgICBjb25zdCBmaWxlcyA9IHRoaXMuZmlsZXM7XHJcbiAgICAgICAgLy/ljIXlkI3lrZdcclxuICAgICAgICBsZXQgcHJvdG9GaWxlOiBQcm90b0ZpbGUgPSB7XHJcbiAgICAgICAgICAgIHBhY2thZ2VOYW1lOiAnJyxcclxuICAgICAgICAgICAgZmlsZU5hbWU6IHBhdGguYmFzZW5hbWUobmFtZSwgJy5wcm90bycpLFxyXG4gICAgICAgICAgICBpbXBvcnRGaWxlczogW10sXHJcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBbXSxcclxuICAgICAgICAgICAgZW51bXM6IFtdLFxyXG4gICAgICAgICAgICBidW5kbGVOYW1lLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgbGV0IHBjb21tZW50ID0gJyc7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgbGluZSA9IGxpbmVzW2ldO1xyXG4gICAgICAgICAgICBpZiAobGluZS5lbmRzV2l0aChcIlxcclwiKSkge1xyXG4gICAgICAgICAgICAgICAgLy/ljrvmjolcXHJcclxuICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lLnN1YnN0cmluZygwLCBsaW5lLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCJpbXBvcnRcIikpIHtcclxuICAgICAgICAgICAgICAgIGxldCBpbXBvcnRGaWxlID0gbGluZS5zcGxpdChcIiBcIilbMV07XHJcbiAgICAgICAgICAgICAgICBpZiAoaW1wb3J0RmlsZS5lbmRzV2l0aChcIjtcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRGaWxlID0gaW1wb3J0RmlsZS5zdWJzdHJpbmcoMCwgaW1wb3J0RmlsZS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChpbXBvcnRGaWxlLnN0YXJ0c1dpdGgoJ1wiJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRGaWxlID0gaW1wb3J0RmlsZS5zdWJzdHJpbmcoMSwgaW1wb3J0RmlsZS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChpbXBvcnRGaWxlLmVuZHNXaXRoKCdcIicpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0RmlsZSA9IGltcG9ydEZpbGUuc3Vic3RyaW5nKDAsIGltcG9ydEZpbGUubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwcm90b0ZpbGUuaW1wb3J0RmlsZXMucHVzaChpbXBvcnRGaWxlKTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCJwYWNrYWdlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcGFja2FnZU5hbWUgPSBsaW5lLnNwbGl0KFwiIFwiKVsxXTtcclxuICAgICAgICAgICAgICAgIGlmIChwYWNrYWdlTmFtZS5lbmRzV2l0aChcIjtcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYWNrYWdlTmFtZSA9IHBhY2thZ2VOYW1lLnN1YnN0cmluZygwLCBwYWNrYWdlTmFtZS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHByb3RvRmlsZS5wYWNrYWdlTmFtZSA9IHBhY2thZ2VOYW1lO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGluZSA9IGxpbmUudHJpbVN0YXJ0KCk7XHJcbiAgICAgICAgICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoXCIvL1wiKSkge1xyXG4gICAgICAgICAgICAgICAgcGNvbW1lbnQgPSBsaW5lLnN1YnN0cmluZygyKS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBERUJVRyAmJiBjb25zb2xlLmxvZygnbGluZTonLCBsaW5lKTtcclxuICAgICAgICAgICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcIm1lc3NhZ2VcIikpIHtcclxuICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlTmFtZSA9IGxpbmUuc3BsaXQoXCIgXCIpWzFdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlTmFtZS5lbmRzV2l0aChcIntcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlTmFtZSA9IG1lc3NhZ2VOYW1lLnN1YnN0cmluZygwLCBtZXNzYWdlTmFtZS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlOiBQcm90b01lc3NhZ2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbWVzc2FnZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWVudDogcGNvbW1lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgZmllbGRzOiBbXVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGxldCBqID0gaSArIDE7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWxpbmUudHJpbUVuZCgpLmVuZHNXaXRoKFwifVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjb21tZW50ID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICg7IGogPCBsaW5lcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGRMaW5lID0gbGluZXNbal0udHJpbVN0YXJ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZExpbmUuc3RhcnRzV2l0aChcIn1cIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZExpbmUuc3RhcnRzV2l0aChcIntcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZExpbmUuc3RhcnRzV2l0aChcIi8vXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gZmllbGRMaW5lLnN1YnN0cmluZygyKS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGRMaW5lLmVuZHNXaXRoKFwiXFxyXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZExpbmUgPSBmaWVsZExpbmUuc3Vic3RyaW5nKDAsIGZpZWxkTGluZS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGRMaW5lID09ICcnIHx8IGZpZWxkTGluZS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8v5YWI5bCGZmllbGRMaW5l5LulO+WIhuWJslxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYXJyID0gZmllbGRMaW5lLnNwbGl0KFwiO1wiKS5maWx0ZXIoKHZhbHVlKSA9PiB2YWx1ZS50cmltU3RhcnQoKSAhPSAnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcnIubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcnIubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHN0ciA9IGFyclsxXS50cmltU3RhcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHIuc3RhcnRzV2l0aChcIi8vXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyWzFdID0gc3RyLnN1YnN0cmluZygyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL+WQjumdoueahOaVsOaNruS4jeimgVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJbMF0gPSBhcnJbMF0uc3BsaXQoXCI9XCIpWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBERUJVRyAmJiBjb25zb2xlLmxvZygnbWVzc2FnZSBmaWVsZDonLCBhcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYXJyMCA9IGFyclswXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFycjAudHJpbVN0YXJ0KCkuc3RhcnRzV2l0aChcIm1hcFwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/ov5nmmK/kuIDkuKrnibnmrornmoRtYXA8dHlwZTEsdHlwZTI+IGZpbGVkTmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/mib7liLA8PuS4reeahOWGheWuuVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHN0YXJ0ID0gYXJyMC5pbmRleE9mKFwiPFwiKSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW5kID0gYXJyMC5pbmRleE9mKFwiPlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFydCA9PSAtMSB8fCBlbmQgPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdtYXDnsbvlnovplJnor686JywgYXJyMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWFwVHlwZSA9IGFycjAuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8v5L2/55SoLOWIhuWJsm1hcFR5cGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtYXBUeXBlcyA9IG1hcFR5cGUuc3BsaXQoXCIsXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hcFR5cGVzLmxlbmd0aCAhPSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignbWFw57G75Z6L6ZSZ6K+vOicsIGFycjApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGtleVR5cGUgPSBtYXBUeXBlc1swXS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWVUeXBlID0gbWFwVHlwZXNbMV0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5VHlwZSA9IHRoaXMuY2hhbmdlUHJvdG9GaWVsZFR5cGVUb1RzVHlwZShrZXlUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZVR5cGUxID0gdGhpcy5jaGFuZ2VQcm90b0ZpZWxkVHlwZVRvVHNUeXBlKHZhbHVlVHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWVUeXBlMSAhPSAnc3RyaW5nJyAmJiB2YWx1ZVR5cGUxICE9IFwibnVtYmVyXCIgJiYgdmFsdWVUeXBlMSAhPSBcImJvb2xlYW5cIiAmJiB2YWx1ZVR5cGUxICE9IFwiVWludDhBcnJheVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/or7TmmI7mmK/oh6rlrprkuYnnsbvlnotcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVR5cGUgPSB0aGlzLl9nZXRPYmplY3RGaWxlZFZhbHVlVHlwZSh2YWx1ZVR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVR5cGUgPSB2YWx1ZVR5cGUxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/ojrflj5bliLA+5ZCO6Z2i55qE5YaF5a65XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnIwID0gYXJyMC5zdWJzdHJpbmcoZW5kICsgMSkudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy/ku6U95YiG5YmyYXJyMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGFycjEgPSBhcnIwLnNwbGl0KFwiPVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWxlZE5hbWUgPSBhcnIxWzBdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcnIxLmxlbmd0aCA+IDIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gYXJyMVsyXS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGRJbmZvOiBQcm90b0ZpZWxkID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGZpbGVkTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInsga2V5IDogXCIgKyBrZXlUeXBlICsgXCIsIHZhbHVlIDogXCIgKyB2YWx1ZVR5cGUgKyBcIn1cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRUeXBlOiBcInsga2V5IDogXCIgKyBrZXlUeXBlICsgXCIsIHZhbHVlIDogXCIgKyB2YWx1ZVR5cGUgKyBcIn1cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25hbDogJ3JlcXVpcmVkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmaWVsZEluZm86JywgZmllbGRJbmZvKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UuZmllbGRzLnB1c2goZmllbGRJbmZvKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZCA9IGFyclswXS50cmltU3RhcnQoKS5zcGxpdChcIiBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8v5Yig6ZmkZmllbGTmlbDnu4TkuK3nmoTnqbrmoLzlhYPntKBcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQgPSBmaWVsZC5maWx0ZXIoKHZhbHVlKSA9PiB2YWx1ZS50cmltKCkgIT0gJycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBERUJVRyAmJiBjb25zb2xlLmxvZygnZmllbGQ6JywgZmllbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL29wdGlvbmFsIHJlcGVhdGVkIHJlcXVpcmVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWxlZFB0eXBlID0gXCJvcHRpb25hbFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgb2xkVHlwZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmlsZWROYW1lOiBzdHJpbmcgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkLmxlbmd0aCA9PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRUeXBlID0gZmllbGRbMF0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZWROYW1lID0gZmllbGRbMV0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLmxlbmd0aCA+PSAzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlZFB0eXBlID0gZmllbGRbMF0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVHlwZSA9IGZpZWxkWzFdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVkTmFtZSA9IGZpZWxkWzJdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSB0aGlzLmNoYW5nZVByb3RvRmllbGRUeXBlVG9Uc1R5cGUob2xkVHlwZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGRJbmZvOiBQcm90b0ZpZWxkID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZmlsZWROYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmFsOiBmaWxlZFB0eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudDogYXJyLmxlbmd0aCA+IDEgPyBhcnJbMV0gOiBjb21tZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBERUJVRyAmJiBjb25zb2xlLmxvZygnZmllbGRJbmZvOicsIGZpZWxkSW5mbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UuZmllbGRzLnB1c2goZmllbGRJbmZvKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdtZXNzYWdlOicsbWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBwcm90b0ZpbGUubWVzc2FnZXMucHVzaChtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGkgPSBqO1xyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgaWYgKGxpbmUuc3RhcnRzV2l0aChcImVudW1cIikpIHtcclxuICAgICAgICAgICAgICAgIGxldCBlbnVtTmFtZSA9IGxpbmUuc3BsaXQoXCIgXCIpWzFdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIGlmIChlbnVtTmFtZS5lbmRzV2l0aChcIntcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbnVtTmFtZSA9IGVudW1OYW1lLnN1YnN0cmluZygwLCBlbnVtTmFtZS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxldCBlbnVtZDogUHJvdG9FbnVtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGVudW1OYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQ6IHBjb21tZW50LFxyXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkczogW11cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBsZXQgaiA9IGkgKyAxO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbW1lbnQgPSAnJztcclxuICAgICAgICAgICAgICAgIGZvciAoOyBqIDwgbGluZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGRMaW5lID0gbGluZXNbal0udHJpbVN0YXJ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkTGluZS5zdGFydHNXaXRoKFwifVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpZWxkTGluZS5zdGFydHNXaXRoKFwie1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZExpbmUuc3RhcnRzV2l0aChcIi8vXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSBmaWVsZExpbmUuc3Vic3RyaW5nKDIpLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZExpbmUuZW5kc1dpdGgoXCJcXHJcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRMaW5lID0gZmllbGRMaW5lLnN1YnN0cmluZygwLCBmaWVsZExpbmUubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWVsZExpbmUgPT0gJycgfHwgZmllbGRMaW5lLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvL+WFiOWwhmZpZWxkTGluZeS7pTvliIblibJcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYXJyID0gZmllbGRMaW5lLnNwbGl0KFwiO1wiKS5maWx0ZXIoKHZhbHVlKSA9PiB2YWx1ZS50cmltU3RhcnQoKSAhPSAnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyci5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcnIubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc3RyID0gYXJyWzFdLnRyaW1TdGFydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RyLnN0YXJ0c1dpdGgoXCIvL1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyWzFdID0gc3RyLnN1YnN0cmluZygyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBhcnJbMF0udHJpbVN0YXJ0KCkuc3BsaXQoXCI9XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2ZpZWxkOicsZmllbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBmaWVsZEluZm8gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGZpZWxkWzBdLnRyaW0oKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHBhcnNlSW50KGZpZWxkWzFdLnRyaW0oKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQ6IGFyci5sZW5ndGggPiAxID8gYXJyWzFdIDogY29tbWVudCxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIC8vREVCVUcgJiYgY29uc29sZS5sb2coJ2VudW0gZmllbGRJbmZvOicsZmllbGRJbmZvKTtcclxuICAgICAgICAgICAgICAgICAgICBlbnVtZC5maWVsZHMucHVzaChmaWVsZEluZm8pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJvdG9GaWxlLmVudW1zLnB1c2goZW51bWQpO1xyXG4gICAgICAgICAgICAgICAgaSA9IGo7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgREVCVUcgJiYgY29uc29sZS5sb2coJ3Byb3Rv5paH5Lu277yaJywgcHJvdG9GaWxlKTtcclxuICAgICAgICByZXR1cm4gcHJvdG9GaWxlO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfZXhwb3J0T25lUHJvdG9GaWxlKGZpbGU6IHN0cmluZywgZm9sZGVyTmFtZTogc3RyaW5nLCBmaWxlUGF0aDogc3RyaW5nKSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmZpbGVzW2ZpbGVdKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaW1wb3J0RmlsZXMgPSB0aGlzLl9nZXRQcm90b0ltcG9ydEZpbGVOYW1lcyhmaWxlUGF0aCk7XHJcbiAgICAgICAgaWYgKGltcG9ydEZpbGVzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmsqHmnInlr7zlhaXmlofku7Ys5byA5aeL6Kej5p6QOicsIGZpbGVQYXRoKTtcclxuICAgICAgICAgICAgY29uc3QgcHJvdG9GaWxlID0gdGhpcy5fYW5hbHl6ZVByb3RvRmlsZShmaWxlUGF0aCwgZm9sZGVyTmFtZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLmZpbGVzW2ZpbGVdID0gcHJvdG9GaWxlO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGltcG9ydEZpbGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGltcG9ydEZpbGUgPSBpbXBvcnRGaWxlc1tpXTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZmlsZXNbaW1wb3J0RmlsZV0pIHtcclxuICAgICAgICAgICAgICAgIC8v6K+05piO5ZyoZmlsZXPkuK1cclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy/or7TmmI7kuI3lnKhmaWxlc+S4re+8jOe7p+e7reW+queOr1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW1wb3J0RmlsZVBhdGggPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ3Byb3RvcycsIGZvbGRlck5hbWUsIGltcG9ydEZpbGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZXhwb3J0T25lUHJvdG9GaWxlKGltcG9ydEZpbGUsIGZvbGRlck5hbWUsIGltcG9ydEZpbGVQYXRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZygn6ZyA6KaB5a+85YWl55qE5paH5Lu26Kej5p6Q5a6M5q+VLOW8gOWni+ino+aekDonLCBmaWxlUGF0aCk7XHJcbiAgICAgICAgY29uc3QgcHJvdG9GaWxlID0gdGhpcy5fYW5hbHl6ZVByb3RvRmlsZShmaWxlUGF0aCwgZm9sZGVyTmFtZSwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuZmlsZXNbZmlsZV0gPSBwcm90b0ZpbGU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDop6PmnpDmjIflrprlkI3lrZfnmoTmlofku7blpLnkuIvnmoTmiYDmnIlwcm90b+aWh+S7tlxyXG4gICAgICogQHBhcmFtIGZvbGVyTmFtZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfZXhwb3J0T25lRm9sZGVyUHJvdG9GaWxlc1RvRFRTKGZvbGVyTmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgZGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdwcm90b3MnLCBmb2xlck5hbWUpO1xyXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhkaXIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGZpbGVzID0gZnMucmVhZGRpclN5bmMoZGlyKTtcclxuXHJcbiAgICAgICAgbGV0IGNvdW50ID0gZmlsZXMubGVuZ3RoO1xyXG5cclxuXHJcbiAgICAgICAgZm9yIChsZXQgZmlsZSBvZiBmaWxlcykge1xyXG4gICAgICAgICAgICBpZiAoZmlsZS5lbmRzV2l0aCgnLnByb3RvJykpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGRpciwgZmlsZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9leHBvcnRPbmVQcm90b0ZpbGUoZmlsZSwgZm9sZXJOYW1lLCBmaWxlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zdCBwcm90b0ZpbGUgPSB0aGlzLl9hbmFseXplUHJvdG9GaWxlKGZpbGVQYXRoLGZvbGVyTmFtZSxmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmZpbGVzW2ZpbGVdID0gcHJvdG9GaWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIF9nZXRPYmplY3RGaWxlZFZhbHVlVHlwZSh2YWx1ZVR5cGU6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IGZpbGVzID0gdGhpcy5maWxlcztcclxuICAgICAgICBjb25zdCB2YWx1ZXMgPSBPYmplY3QudmFsdWVzKGZpbGVzKTtcclxuICAgICAgICBsZXQgZm91bmQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgICAgICAvL+WmguaenHR5cGXlkoxvbGRUeXBl55u4562J77yM5LiU5LiN5pivc3RyaW5n57G75Z6L77yM6K+05piO5piv6Ieq5a6a5LmJ57G75Z6LXHJcbiAgICAgICAgVG9vbHMuZm9yRWFjaE1hcChmaWxlcywgKGZpbGVOYW1lOiBzdHJpbmcsIHByb3RvRmlsZTogUHJvdG9GaWxlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVudW1zID0gcHJvdG9GaWxlLmVudW1zO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudW1zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZW51bXNbaV0ubmFtZSA9PSB2YWx1ZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5nZXRTY3JpcHROYW1lQW5kTmFtZXNwYWNlTmFtZUZyb21Qcm90b0ZpbGVOYW1lKGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZVR5cGUgPSBpbmZvLm5hbWVzcGFjZU5hbWUgKyAnLicgKyB2YWx1ZVR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2VzID0gcHJvdG9GaWxlLm1lc3NhZ2VzO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lc3NhZ2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobWVzc2FnZXNbaV0ubmFtZSA9PSB2YWx1ZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5nZXRTY3JpcHROYW1lQW5kTmFtZXNwYWNlTmFtZUZyb21Qcm90b0ZpbGVOYW1lKGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZVR5cGUgPSBpbmZvLm5hbWVzcGFjZU5hbWUgKyAnLicgKyB2YWx1ZVR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlVHlwZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfZ2V0RmllbGRUeXBlKGZpZWxkOiBQcm90b0ZpZWxkLCBtZXNzYWdlczogUHJvdG9NZXNzYWdlW10pIHtcclxuICAgICAgICBsZXQgdHlwZSA9IGZpZWxkLnR5cGU7XHJcbiAgICAgICAgY29uc3QgZmlsZXMgPSB0aGlzLmZpbGVzO1xyXG4gICAgICAgIGNvbnN0IGZpbGVkUHR5cGUgPSBmaWVsZC5vcHRpb25hbDtcclxuICAgICAgICBjb25zdCBvbGRUeXBlID0gZmllbGQub2xkVHlwZTtcclxuICAgICAgICBpZiAodHlwZS5pbmNsdWRlcygnLicpKSB7XHJcbiAgICAgICAgICAgIC8v5aaC5p6c5YyF5ZCrLuivtOaYjuaYr+WIq+eahOWMheeahOexu+Wei1xyXG4gICAgICAgICAgICAvLyBjb25zdCBhcnIgPSB0eXBlLnNwbGl0KCcuJyk7XHJcbiAgICAgICAgICAgIC8vIGNvbnN0IHBOYW1lID0gYXJyWzBdO1xyXG4gICAgICAgICAgICAvLyBjb25zdCBwVHlwZSA9IGFyclsxXTtcclxuICAgICAgICAgICAgLy8gLy/mib7liLBwYWNrYWdlTmFtZeWvueW6lOeahG5hbWVzcGFjZVxyXG4gICAgICAgICAgICAvLyBUb29scy5mb3JFYWNoTWFwKGZpbGVzLChmaWxlTmFtZSA6IHN0cmluZyxwcm90b0ZpbGUgOiBQcm90b0ZpbGUpID0+IHtcclxuICAgICAgICAgICAgLy8gICAgIGlmKHByb3RvRmlsZS5wYWNrYWdlTmFtZSA9PSBwTmFtZSl7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgY29uc3QgaW5mbyA9IHRoaXMuZ2V0U2NyaXB0TmFtZUFuZE5hbWVzcGFjZU5hbWVGcm9tUHJvdG9GaWxlTmFtZShmaWxlTmFtZSk7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgdHlwZSA9IGluZm8ubmFtZXNwYWNlTmFtZSArICcuJyArIHBUeXBlO1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAvLyB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHR5cGU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gb2xkVHlwZSAmJiB0eXBlICE9ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2FtZUZpbGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIC8v6aaW5YWI5qOA5p+lbWVzc2FnZXPmmK/lkKbmnIlcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVzc2FnZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWVzc2FnZXNbaV0ubmFtZSA9PSB0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIERFQlVHICYmIGNvbnNvbGUubG9nKCdJTiBTQU1FIEZJTEU6JywgdHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhbWVGaWxlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFzYW1lRmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8v5aaC5p6cdHlwZeWSjG9sZFR5cGXnm7jnrYnvvIzkuJTkuI3mmK9zdHJpbmfnsbvlnovvvIzor7TmmI7mmK/oh6rlrprkuYnnsbvlnotcclxuICAgICAgICAgICAgICAgICAgICBUb29scy5mb3JFYWNoTWFwKGZpbGVzLCAoZmlsZU5hbWU6IHN0cmluZywgcHJvdG9GaWxlOiBQcm90b0ZpbGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZW51bXMgPSBwcm90b0ZpbGUuZW51bXM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW51bXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnVtc1tpXS5uYW1lID09IHR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5nZXRTY3JpcHROYW1lQW5kTmFtZXNwYWNlTmFtZUZyb21Qcm90b0ZpbGVOYW1lKGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gaW5mby5uYW1lc3BhY2VOYW1lICsgJy4nICsgdHlwZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXNzYWdlcyA9IHByb3RvRmlsZS5tZXNzYWdlcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXNzYWdlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1lc3NhZ2VzW2ldLm5hbWUgPT0gdHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSB0aGlzLmdldFNjcmlwdE5hbWVBbmROYW1lc3BhY2VOYW1lRnJvbVByb3RvRmlsZU5hbWUoZmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBpbmZvLm5hbWVzcGFjZU5hbWUgKyAnLicgKyB0eXBlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmaWxlZFB0eXBlID09ICdyZXBlYXRlZCcpIHtcclxuICAgICAgICAgICAgdHlwZSA9IHR5cGUgKyAnW10nO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHlwZTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3dyaXRlUHJvdG9GaWxlVG9EVFMocHJvdG9GaWxlOiBQcm90b0ZpbGUpIHtcclxuICAgICAgICBsZXQgcHJvdG9GaWxlTmFtZSA9IHByb3RvRmlsZS5maWxlTmFtZTtcclxuICAgICAgICBpZiAocHJvdG9GaWxlTmFtZS5lbmRzV2l0aCgnLnByb3RvJykpIHtcclxuICAgICAgICAgICAgcHJvdG9GaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUocHJvdG9GaWxlTmFtZSwgJy5wcm90bycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBidW5kbGVOYW1lID0gcHJvdG9GaWxlLmJ1bmRsZU5hbWU7XHJcbiAgICAgICAgY29uc3QgZmlsZXMgPSB0aGlzLmZpbGVzO1xyXG4gICAgICAgIC8v5Y675o6JcHJvdG9GaWxlTmFtZeS4reeahOeJueauiuespuWPtyzmr5TlpoLljIXmi6xfXHJcbiAgICAgICAgcHJvdG9GaWxlTmFtZSA9IHByb3RvRmlsZU5hbWUucmVwbGFjZSgvXy9nLCAnJykudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDmj4/ov7Dmlofku7ZcclxuICAgICAgICAgKi9cclxuICAgICAgICBsZXQgdGV4dGR0cyA9ICcnO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOWvvOWHuuaWh+S7tlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGxldCB0ZXh0ID0gJyc7XHJcblxyXG4gICAgICAgIHRleHRkdHMgKz0gXCJkZWNsYXJlIG1vZHVsZSBcIiArIHByb3RvRmlsZU5hbWUgKyBcIntcXG5cXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiZXhwb3J0IG5hbWVzcGFjZSBcIiArIHByb3RvRmlsZU5hbWUgKyBcIntcXG5cXG5cIjtcclxuICAgICAgICAvL+WGmeecn+ato+eahHBhY2thZ2XlkI3lrZdcclxuICAgICAgICB0ZXh0ZHRzICs9IFwiICAgIGNvbnN0IFBBQ0tBR0VfTkFNRSA9ICdcIiArIHByb3RvRmlsZS5wYWNrYWdlTmFtZSArIFwiJztcXG5cXG5cIjtcclxuICAgICAgICB0ZXh0ICs9IFwiICAgIGV4cG9ydCBjb25zdCBQQUNLQUdFX05BTUUgPSAnXCIgKyBwcm90b0ZpbGUucGFja2FnZU5hbWUgKyBcIic7XFxuXFxuXCI7XHJcbiAgICAgICAgLy/lhpllbnVtXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm90b0ZpbGUuZW51bXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGVudW1kID0gcHJvdG9GaWxlLmVudW1zW2ldO1xyXG5cclxuICAgICAgICAgICAgdGV4dGR0cyArPSBcIiAgICAvKiogXCIgKyBlbnVtZC5jb21tZW50ICsgXCIgKi9cXG5cIjtcclxuICAgICAgICAgICAgdGV4dGR0cyArPSBcIiAgICBlbnVtIFwiICsgZW51bWQubmFtZSArIFwie1xcblwiO1xyXG5cclxuICAgICAgICAgICAgdGV4dCArPSBcIiAgICAvKiogXCIgKyBlbnVtZC5jb21tZW50ICsgXCIgKi9cXG5cIjtcclxuICAgICAgICAgICAgdGV4dCArPSBcIiAgICBleHBvcnQgZW51bSBcIiArIGVudW1kLm5hbWUgKyBcIntcXG5cIjtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZW51bWQuZmllbGRzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZmllbGQgPSBlbnVtZC5maWVsZHNbal07XHJcbiAgICAgICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgICAgICAvKiogXCIgKyBmaWVsZC5jb21tZW50ICsgXCIgKi9cXG5cIjtcclxuICAgICAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgICAgIFwiICsgZmllbGQubmFtZSArIFwiID0gXCIgKyBmaWVsZC52YWx1ZSArIFwiLFxcblwiO1xyXG5cclxuICAgICAgICAgICAgICAgIHRleHQgKz0gXCIgICAgICAgIC8qKiBcIiArIGZpZWxkLmNvbW1lbnQgKyBcIiAqL1xcblwiO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBcIiAgICAgICAgXCIgKyBmaWVsZC5uYW1lICsgXCIgPSBcIiArIGZpZWxkLnZhbHVlICsgXCIsXFxuXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGV4dGR0cyArPSBcIiAgICB9XFxuXFxuXCI7XHJcbiAgICAgICAgICAgIHRleHQgKz0gXCIgICAgfVxcblxcblwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy/lsIbmiYDmnIltZXNzYWdl55qEbmFtZeWGmeaIkGVudW1cclxuICAgICAgICB0ZXh0ZHRzICs9IFwiICAgIGVudW0gTWVzc2FnZSB7XFxuXCI7XHJcbiAgICAgICAgdGV4dCArPSBcIiAgICBleHBvcnQgZW51bSBNZXNzYWdlIHtcXG5cIjtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3RvRmlsZS5tZXNzYWdlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9IHByb3RvRmlsZS5tZXNzYWdlc1tpXTtcclxuICAgICAgICAgICAgdGV4dGR0cyArPSBcIiAgICAgICAgLyoqIFwiICsgbWVzc2FnZS5jb21tZW50ICsgXCIgKi9cXG5cIjtcclxuICAgICAgICAgICAgdGV4dGR0cyArPSBcIiAgICAgICAgXCIgKyBtZXNzYWdlLm5hbWUgKyBcIiA9ICdcIiArIG1lc3NhZ2UubmFtZSArIFwiJyxcXG5cIjtcclxuXHJcbiAgICAgICAgICAgIHRleHQgKz0gXCIgICAgICAgIC8qKiBcIiArIG1lc3NhZ2UuY29tbWVudCArIFwiICovXFxuXCI7XHJcbiAgICAgICAgICAgIHRleHQgKz0gXCIgICAgICAgIFwiICsgbWVzc2FnZS5uYW1lICsgXCIgPSAnXCIgKyBtZXNzYWdlLm5hbWUgKyBcIicsXFxuXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRleHRkdHMgKz0gXCIgICAgfVxcblxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCIgICAgfVxcblxcblwiO1xyXG4gICAgICAgIC8v5YaZbWVzc2FnZVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdG9GaWxlLm1lc3NhZ2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gcHJvdG9GaWxlLm1lc3NhZ2VzW2ldO1xyXG4gICAgICAgICAgICB0ZXh0ZHRzICs9IFwiICAgIC8qKiBcIiArIG1lc3NhZ2UuY29tbWVudCArIFwiICovXFxuXCI7XHJcbiAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgaW50ZXJmYWNlIFwiICsgbWVzc2FnZS5uYW1lICsgXCJ7XFxuXCI7XHJcblxyXG4gICAgICAgICAgICB0ZXh0ICs9IFwiICAgIC8qKiBcIiArIG1lc3NhZ2UuY29tbWVudCArIFwiICovXFxuXCI7XHJcbiAgICAgICAgICAgIHRleHQgKz0gXCIgICAgZXhwb3J0IGludGVyZmFjZSBcIiArIG1lc3NhZ2UubmFtZSArIFwie1xcblwiO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBtZXNzYWdlLmZpZWxkcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGZpZWxkID0gbWVzc2FnZS5maWVsZHNbal07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwVHlwZSA9IHRoaXMuX2dldEZpZWxkVHlwZShmaWVsZCwgcHJvdG9GaWxlLm1lc3NhZ2VzKTtcclxuICAgICAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgICAgIC8qKiBcIiArIGZpZWxkLmNvbW1lbnQgKyBcIiAqL1xcblwiO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBcIiAgICAgICAgLyoqIFwiICsgZmllbGQuY29tbWVudCArIFwiICovXFxuXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQub3B0aW9uYWwgPT0gJ29wdGlvbmFsJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgICAgIFwiICsgZmllbGQubmFtZSArIFwiPyA6IFwiICsgcFR5cGUgKyBcIjtcXG5cIjtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ICs9IFwiICAgICAgICBcIiArIGZpZWxkLm5hbWUgKyBcIj8gOiBcIiArIHBUeXBlICsgXCI7XFxuXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLm9wdGlvbmFsID09ICdyZXF1aXJlZCcgfHwgZmllbGQub3B0aW9uYWwgPT0gJ3JlcGVhdGVkJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgICAgIFwiICsgZmllbGQubmFtZSArIFwiIDogXCIgKyBwVHlwZSArIFwiO1xcblwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgKz0gXCIgICAgICAgIFwiICsgZmllbGQubmFtZSArIFwiIDogXCIgKyBwVHlwZSArIFwiO1xcblwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRleHRkdHMgKz0gXCIgICAgfVxcblxcblwiO1xyXG4gICAgICAgICAgICB0ZXh0ICs9IFwiICAgIH1cXG5cXG5cIjtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB0ZXh0ZHRzICs9IFwifVxcblwiO1xyXG4gICAgICAgIHRleHQgKz0gXCJ9XFxuXCI7XHJcblxyXG4gICAgICAgIHRleHQgKz0gXCJ3aW5kb3dbJ1wiICsgcHJvdG9GaWxlTmFtZSArIFwiJ10gPSBcIiArIHByb3RvRmlsZU5hbWUgKyBcIjtcXG5cIjtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCd0ZXh0OicsdGV4dCk7XHJcblxyXG4gICAgICAgIGxldCBmaWxlVXJsID0gXCJcIjtcclxuICAgICAgICBsZXQgZHRzZmlsZU5hbWUgPSBwcm90b0ZpbGVOYW1lICsgJy5kLnRzJztcclxuICAgICAgICBsZXQgZmlsZU5hbWUgPSBwcm90b0ZpbGVOYW1lICsgJy50cyc7XHJcbiAgICAgICAgaWYgKGJ1bmRsZU5hbWUgPT0gJ3Jlc291cmNlcycpIHtcclxuICAgICAgICAgICAgZmlsZVVybCA9IHBhdGguam9pbignYXNzZXRzJywgJ3Jlc291cmNlcycsICdzY3JpcHRzJywgJ2F1dG8nLCAnbWVzc2FnZScsICdkZWZpbmVzJywgZmlsZU5hbWUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZpbGVVcmwgPSBwYXRoLmpvaW4oJ2Fzc2V0cycsICdidW5kbGVzJywgYnVuZGxlTmFtZSwgJ3NjcmlwdHMnLCAnbWVzc2FnZScsICdkZWZpbmVzJywgZmlsZU5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaWxlVXJsID0gJ2RiOi8vJyArIGZpbGVVcmw7XHJcbiAgICAgICAgREVCVUcgJiYgY29uc29sZS53YXJuKCflr7zlh7pwcm90by0+ZmlsZVVybDonLCBmaWxlVXJsKTtcclxuICAgICAgICBBc3NldERiVXRpbHMuUmVxdWVzdENyZWF0ZU5ld0Fzc2V0KGZpbGVVcmwsIHRleHQpO1xyXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdkZWNsYXJlJywgZHRzZmlsZU5hbWUpO1xyXG4gICAgICAgIERFQlVHICYmIGNvbnNvbGUud2Fybign5a+85Ye6cHJvdG9fZC50cy0+ZmlsZVVybDonLCBmaWxlUGF0aCk7XHJcbiAgICAgICAgRmlsZVV0aWxzLldyaXRlRmlsZShmaWxlUGF0aCwgdGV4dGR0cyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy/lsIbmr4/kuIDkuKpwcm90b+aWh+S7tuWvvOWHumQudHPlkox0c+aWh+S7tlxyXG4gICAgcHVibGljIHN0YXRpYyBhc3luYyBQcm9jZXNzaW5nRXhwb3J0UHJvdG9zRFRTKHRhcmdldE5hbWU/OiBzdHJpbmcpIHtcclxuICAgICAgICAvLzEu5YWI6Kej5p6QcmVzb3VyY2Vz5paH5Lu25aS55LiL55qE5omA5pyJcHJvdG/mlofku7ZcclxuICAgICAgICB0aGlzLl9leHBvcnRPbmVGb2xkZXJQcm90b0ZpbGVzVG9EVFMoJ3Jlc291cmNlcycpO1xyXG4gICAgICAgIC8v5Zyo6Kej5p6QcHJvdG9z55uu5b2V5LiL55qE5YW25LuW5paH5Lu25aS5XHJcbiAgICAgICAgY29uc3QgZGlyID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdwcm90b3MnKTtcclxuICAgICAgICBjb25zdCBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jKGRpcik7XHJcbiAgICAgICAgZm9yIChsZXQgZmlsZSBvZiBmaWxlcykge1xyXG4gICAgICAgICAgICBpZiAoZmlsZSA9PSAncmVzb3VyY2VzJykge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRhcmdldE5hbWUgJiYgdGFyZ2V0TmFtZSAhPSBmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9leHBvcnRPbmVGb2xkZXJQcm90b0ZpbGVzVG9EVFMoZmlsZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8v5byA5aeL5YaZ5YWl5paH5Lu2XHJcbiAgICAgICAgVG9vbHMuZm9yRWFjaE1hcCh0aGlzLmZpbGVzLCAoZmlsZU5hbWU6IHN0cmluZywgcHJvdG9GaWxlOiBQcm90b0ZpbGUpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRhcmdldE5hbWUgJiYgdGFyZ2V0TmFtZSAhPSBwcm90b0ZpbGUuYnVuZGxlTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3dyaXRlUHJvdG9GaWxlVG9EVFMocHJvdG9GaWxlKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvL+a4heepuuaVsOaNrlxyXG4gICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcclxuICAgIH1cclxufSJdfQ==