import path from "path";
import fs from "fs-extra";
import Pako from "pako";
import { AssetDbUtils } from "../utils/asset-db-utils";
import FileUtils from "../utils/file-utils";

const DEBUG = true;

export default class ProtosExporterPackage {

    private static packages : {[packageName : string] : ProtoPackage} = {};
    private static bundleName : string = '';
    public static async exportProtos(bundleName : string) {
        this.bundleName = bundleName;
        this.packages = {};
        const rootPath = path.join(Editor.Project.path,'protos', bundleName);
        if(!fs.existsSync(rootPath)){
            console.error(`bundle ${bundleName} not exists`);
            return;
        }
        const jsonObject: { [name: string]: string } = {};
        const folders = fs.readdirSync(rootPath);
        //默认下面都是文件夹
        for(let i = 0;i<folders.length;i++){
            const folderName = folders[i];
            if(folderName.startsWith('.')){
                continue;
            }
            this.packages[folderName] = {
                name : folderName,
                files : {}
            };
            //获取folerName下面的所有文件
            const folderPath = path.join(rootPath,folderName);
            if(!fs.statSync(folderPath).isDirectory()){
                console.error(`folder ${folderName} not exists`);
                continue;
            }

            //默认所有都是文件
            const files = fs.readdirSync(folderPath);
            for(let j = 0;j<files.length;j++){
                const fileName = files[j];
                if(fileName.startsWith('.')){
                    continue;
                }
                const filePath = path.join(folderPath,fileName);
                if(!fs.statSync(filePath).isFile()){
                    console.error(`file ${fileName} not exists`);
                    continue;
                }
                //获取文件的后缀名
                const extname = path.extname(fileName);
                if(extname != '.proto'){
                    console.error(`file ${fileName} not a proto file`);
                    continue;
                }
                //读取文件内容
                const content = fs.readFileSync(filePath,'utf-8');
                jsonObject[fileName] = content;
                let protoFile : ProtoFile = {
                    packageName : folderName,
                    fileName    : fileName,
                    importFiles : [],
                    messages    : [],
                    enums       : [],
                    bundleName  : bundleName,
                };
                await this.parseProtoFile(protoFile,filePath);
                let pPackage : ProtoPackage = this.packages[folderName];
                if(!pPackage){
                    pPackage = {
                        name : folderName,
                        files : {}
                    };
                    this.packages[folderName] = pPackage;
                }
                pPackage.files[fileName] = protoFile;
            }
        }
        const proto_all_string = JSON.stringify(jsonObject);
        const content = Pako.deflate(proto_all_string, { level: 9});
        //写入文件
        let outPath = "db://assets";
        if(bundleName == "resources"){
            outPath += "/resources/protos/proto.bin";
        }else{
            outPath += "/bundles/" + bundleName + "/protos/proto.bin";
        }
        await AssetDbUtils.RequestCreateNewAsset(outPath, content as any, true);
        console.log("导出协议文件成功 -> ", bundleName);
        this.exportProtoPackageDTS();
    }


    /**
     * 导出单个proto文件
     * @param protoFile 
     * @param filePath 文件路径，需要一行一行的解析 
     */
    private static async parseProtoFile(protoFile : ProtoFile,filePath : string) {
        //1.无需解析import，如果遇到非正常类型，一律认为是其他包体的文件
        const lines = FileUtils.GetFileContentByLines(filePath);
        
        //当前包体名字
        const packageName = protoFile.packageName;
        console.log("开始解析协议 -> ",packageName,",",filePath);
        let pcomment = '';
        for(let i = 0;i<lines.length;i++){
            let line = lines[i];
            if(line.endsWith("\r")){
                line = line.substring(0,line.length-1);
            }
            line = line.trimStart();
            if (line.startsWith("//")) {
                //这是一个注释行
                pcomment = line.substring(2).trim();
                continue;
            }
            DEBUG && console.log("line -> ", line);
            if(line.startsWith("message")){
                //这是一个消息体
                let messageName = line.split(" ")[1].trim();
                if(messageName.endsWith("{")){
                    messageName = messageName.substring(0,messageName.length-1).trim();
                }
                const message : ProtoMessage = {
                    name : messageName,
                    comment : pcomment,
                    fields : [],
                }
                if(line.endsWith("}")){
                    //这个消息没有任何字段
                    DEBUG && console.log("没有任何字段的消息：",messageName);
                }else{
                    i = this.parseOneMessage(i, lines, message); 
                }
                protoFile.messages.push(message);
            }else if(line.startsWith("enum")){
                //这是一个枚举体
                let enumName = line.split(" ")[1].trim();
                if (enumName.endsWith("{")) {
                    enumName = enumName.substring(0, enumName.length - 1);
                }
                let enumd: ProtoEnum = {
                    name: enumName,
                    comment: pcomment,
                    fields: []
                };
                i = this.parseOneEnum(i,lines,enumd);
                protoFile.enums.push(enumd);
            }
        }
    }

    private static parseOneMessage(i : number,lines : string[], message : ProtoMessage){
        //直接开始读取下一行
        let j = i + 1;
        let comment = '';
        for(;j<lines.length;j++){
            let fieldLine = lines[j].trimStart();
            if (fieldLine.endsWith("\r")) {
                fieldLine = fieldLine.substring(0, fieldLine.length - 1);
            }
            if(fieldLine.startsWith("}")){
                //message结束了
                i = j;
                break;
            }
            if(fieldLine.startsWith("//")){
                //这是一个注释行
                comment = fieldLine.substring(2).trim();
                continue;
            }
            if(fieldLine.startsWith("{")){
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
            if(arr.length > 1) {
                let str = arr[1].trimStart();
                if (str.startsWith("//")) {
                    //注释拿到
                    arr[1] = str.substring(2);
                    comment = arr[1].trim();
                }
            }
            // = 后面的数据不需要，因为fieldId对客户端导出来说没有意义
            arr[0] = arr[0].split("=")[0];
            if(arr[0].trimStart().startsWith("map")){
                console.warn("协议字段 map ",fieldLine);
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
                    console.log("map中自定义类型：",valueType);
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
        return i;
    }

    private static parseOneEnum(i : number,lines : string[], enumObj : ProtoEnum){
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

    private static async exportProtoPackageDTS() {
        const packages = Object.values(this.packages);
        const declarePath = path.join(Editor.Project.path,"declare");
        let tsFilePath = "db://assets/";
        if(this.bundleName == "resources"){
            tsFilePath += "resources/scripts/auto/message/defines/";
        }else{
            
            tsFilePath += "bundles/" + this.bundleName + "/scripts/auto/message/defines/";
        }
        
        for(let i = 0;i<packages.length;i++){
            const p = packages[i];
            let allMessageNames : {name : string,comment : string}[] = [];
            const files = Object.values(p.files);
            const packageName   = p.name;
            const dtsfileName   = path.join(declarePath,packageName + ".d.ts");
            const tsFileName    = tsFilePath + packageName + ".ts";
            let textdts = '';
            let text = '';
            textdts += "declare module " + packageName + "{\n\n";
            text += "export namespace " + packageName + "{\n\n";
            textdts += "    const PACKAGE_NAME = '" + packageName + "';\n\n";
            text += "    export const PACKAGE_NAME = '" + packageName + "';\n\n";
            //将当前包体里面所有的proto文件写入到一个文件中
            for(let j = 0;j<files.length;j++){
                const protoFile = files[j];
                const results = this.writeOneProtoFileDTS(protoFile,text,textdts);
                text = results.text;
                textdts = results.textdts;
                allMessageNames = allMessageNames.concat(results.messageNames);
            }
            console.log("allMessageNames = ",allMessageNames.length,allMessageNames);
            //将allMessageNames写成一个enum
            textdts += "    enum Message {\n";
            text += "    export enum Message {\n";
            for(let j = 0;j<allMessageNames.length;j++){
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
            fs.writeFileSync(dtsfileName, textdts);
            await AssetDbUtils.RequestCreateNewAsset(tsFileName, text as any, true);
            console.log("导出协议文件成功 -> ", packageName);
        }
    }


    private static writeOneProtoFileDTS(protoFile : ProtoFile,text : string, textdts : string){
        const enums = protoFile.enums;
        let messageNames : {name : string,comment:string}[] = [];
        //先写enum
        for(let i = 0;i<enums.length;i++){
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
            return {name : message.name,comment: message.comment};
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
                } else if (field.optional == 'required' || field.optional == 'repeated') {
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
        }
    }

    private static _getFieldType(field : ProtoField) {
        let type = field.type;
        const filedPtype = field.optional;
        const oldType = field.oldType;
        if(type.includes(".")){
            //例如common.Result 被认为是引用common包体里面的enum/message
            
        }
        if(filedPtype == 'repeated'){
            type = type + "[]";
        }
        return type;
    }   
}