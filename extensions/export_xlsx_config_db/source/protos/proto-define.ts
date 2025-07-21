interface ProtoField {
    /**
     * 名字
     */
    name    : string;
    /**
     * 类型
     */
    type    : string;
    /**
     * 原始类型
     */
    oldType : string;
    /**
     * 索引
     */
    index   : number;
    /**
     * 注释
     */
    comment : string;
    /**
     * 类型
     */
    optional : string;
}


interface ProtoMessage {
    name    : string;
    comment : string;
    fields  : ProtoField[];
}

interface ProtoEnum {
    name    : string;
    comment : string;
    fields  : {name : string,value : number,comment : string}[];
}
/**
 * 一个proto文件
 */
interface ProtoFile {
    packageName : string;
    fileName    : string;
    importFiles : string[];
    messages    : ProtoMessage[];
    enums       : ProtoEnum[];
    bundleName  : string;
}
/**
 * 一个proto包
 */
interface ProtoPackage {
    /**包名字 */
    name : string;
    /**当前所有的文件*/
    files : {[fileName : string] : ProtoFile};
}