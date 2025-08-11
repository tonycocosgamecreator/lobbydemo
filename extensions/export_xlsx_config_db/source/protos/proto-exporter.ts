import path from "path";
import fs from "fs-extra";
import JSZip from "jszip";
import { AssetDbUtils } from "../utils/asset-db-utils";
import FileUtils from "../utils/file-utils";
import Tools from "../utils/tools";
import pako from "pako";
const DEBUG = true;

export class ProtoExporter {

    /**
     *  将protobuf文件合并到一个json格式的字符串中，然后使用jszip压缩成二进制文件
     */
    public static async ProcessingExportProtos(targetName?: string) {
        const dir = path.join(Editor.Project.path, 'protos');
        //遍历dir下所有的文件夹
        const files = fs.readdirSync(dir);
        //每个文件夹下的proto文件合并到一个json对象中
        let datas: { [name: string]: string } = {};
        for (let bundleName of files) {
            if (targetName && targetName != bundleName) {
                continue;
            }
            const filePath = path.join(dir, bundleName);
            if (fs.statSync(filePath).isDirectory()) {
                //遍历文件夹下的所有proto文件
                const protoFiles = fs.readdirSync(filePath);
                const jsonObject: { [name: string]: string } = {};
                for (let protoFile of protoFiles) {
                    //检查是否以.proto结尾
                    if (!protoFile.endsWith('.proto')) {
                        continue;
                    }
                    const protoFilePath = path.join(filePath, protoFile);
                    //读取proto文件内容
                    const protoContent = fs.readFileSync(protoFilePath).toString();
                    jsonObject[protoFile] = protoContent;
                }
                const jsonStr = JSON.stringify(jsonObject);
                datas[bundleName] = jsonStr;
                const content = pako.deflate(jsonStr, { level: 0 });
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
                let jsonPath = path.join(Editor.Project.path, 'assets');
                if (bundleName == 'resources') {
                    outPath = 'db://assets/resources/protos/proto.bin';
                    jsonPath = path.join(Editor.Project.path, 'assets', 'resources', 'protos', 'proto.bin');
                } else {
                    outPath = `db://assets/bundles/${bundleName}/protos/proto.bin`;
                    jsonPath = path.join(Editor.Project.path, 'assets', 'bundles', bundleName, 'protos', 'proto.bin');
                }
                //fs.writeJsonSync(jsonPath,jsonObject,{spaces : 4});
                // 输出的二进制，文件头+压缩后的数据
                await AssetDbUtils.RequestCreateNewAsset(outPath, content as any, true);
            }
        }

    }



    private static files: { [name: string]: ProtoFile } = {};

    private static changeProtoFieldTypeToTsType(fieldType: string) {
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

    private static getScriptNameAndNamespaceNameFromProtoFileName(protoFileName: string) {
        let fileName = protoFileName;
        if (fileName.endsWith('.proto')) {
            fileName = path.basename(fileName, '.proto');
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
    private static _getProtoImportFileNames(filePath: string) {
        const lines = FileUtils.GetFileContentByLines(filePath);
        let importFiles: string[] = [];
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
    private static _analyzeProtoFile(filePath: string, bundleName: string, bAnalysisImport: boolean = true) {
        const name = path.basename(filePath, '.proto');
        const lines = FileUtils.GetFileContentByLines(filePath);
        const files = this.files;
        //包名字
        let protoFile: ProtoFile = {
            packageName: '',
            fileName: path.basename(name, '.proto'),
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
                let message: ProtoMessage = {
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
                            } else {
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
                            let fieldInfo: ProtoField = {
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
                        let filedName: string = '';
                        if (field.length == 2) {
                            oldType = field[0].trim();
                            filedName = field[1].trim();
                        } else if (field.length >= 3) {
                            filedPtype = field[0].trim();
                            oldType = field[1].trim();
                            filedName = field[2].trim();
                        }

                        let type = this.changeProtoFieldTypeToTsType(oldType);

                        let fieldInfo: ProtoField = {
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
                let enumd: ProtoEnum = {
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


    private static _exportOneProtoFile(file: string, folderName: string, filePath: string) {

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
            } else {
                //说明不在files中，继续循环
                const importFilePath = path.join(Editor.Project.path, 'protos', folderName, importFile);
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
    private static _exportOneFolderProtoFilesToDTS(folerName: string) {
        const dir = path.join(Editor.Project.path, 'protos', folerName);
        if (!fs.existsSync(dir)) {
            return;
        }
        let files = fs.readdirSync(dir);

        let count = files.length;


        for (let file of files) {
            if (file.endsWith('.proto')) {
                const filePath = path.join(dir, file);
                this._exportOneProtoFile(file, folerName, filePath);
                // const protoFile = this._analyzeProtoFile(filePath,folerName,false);
                // this.files[file] = protoFile;
            }
        }
    }

    private static _getObjectFiledValueType(valueType: any) {
        const files = this.files;
        const values = Object.values(files);
        let found: boolean = false;
        //如果type和oldType相等，且不是string类型，说明是自定义类型
        Tools.forEachMap(files, (fileName: string, protoFile: ProtoFile) => {
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

    private static _getFieldType(field: ProtoField, messages: ProtoMessage[]) {
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
        } else {
            if (type == oldType && type != 'string') {
                let sameFile: boolean = false;
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
                    Tools.forEachMap(files, (fileName: string, protoFile: ProtoFile) => {
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


    private static _writeProtoFileToDTS(protoFile: ProtoFile) {
        let protoFileName = protoFile.fileName;
        if (protoFileName.endsWith('.proto')) {
            protoFileName = path.basename(protoFileName, '.proto');
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
                } else if (field.optional == 'required' || field.optional == 'repeated') {
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
            fileUrl = path.join('assets', 'resources', 'scripts', 'auto', 'message', 'defines', fileName);
        } else {
            fileUrl = path.join('assets', 'bundles', bundleName, 'scripts', 'message', 'defines', fileName);
        }
        fileUrl = 'db://' + fileUrl;
        DEBUG && console.warn('导出proto->fileUrl:', fileUrl);
        AssetDbUtils.RequestCreateNewAsset(fileUrl, text);
        const filePath = path.join(Editor.Project.path, 'declare', dtsfileName);
        DEBUG && console.warn('导出proto_d.ts->fileUrl:', filePath);
        FileUtils.WriteFile(filePath, textdts);
    }

    //将每一个proto文件导出d.ts和ts文件
    public static async ProcessingExportProtosDTS(targetName?: string) {
        //1.先解析resources文件夹下的所有proto文件
        this._exportOneFolderProtoFilesToDTS('resources');
        //在解析protos目录下的其他文件夹
        const dir = path.join(Editor.Project.path, 'protos');
        const files = fs.readdirSync(dir);
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
        Tools.forEachMap(this.files, (fileName: string, protoFile: ProtoFile) => {
            if (targetName && targetName != protoFile.bundleName) {
                return;
            }
            this._writeProtoFileToDTS(protoFile);
        });
        //清空数据
        this.files = {};
    }
}