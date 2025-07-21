import fs from "fs-extra";
import path from "path";
import Uuid from "./uuid";


export default class Tools {
    static hello() {
        console.log("hello")
    }

    

    /**
     * 针对element进行排序
     * @param array 
     * @param fields 
     */
    static sortArrayByField(array, fields) {
        // 重载，允许只有一个字符串
        // cc.log("---typeof( fields )=",typeof( fields ))
        if (typeof (fields) == "string") {
            fields = [fields];
        } else {
            fields = fields;
        }

        // 处理一次fields
        let fieldConfig = [];
        for (let k in fields) {
            let v = fields[k];
            if (v && v != "") {
                // cc.log(v)
                if (v.substring(0, 1) === "-") {
                    let tmpField = v.substring(1, v.length);
                    if (tmpField && tmpField != "") {
                        fieldConfig.push([tmpField, true]);
                    }
                }
                else {
                    fieldConfig.push([v, false]);
                }
            }
        }

        // -- 按照优先级进行排序
        let sorter = (a, b) => {
            let ret = 0

            for (let k in fieldConfig) {
                let v = fieldConfig[k];
                let field = v[0];
                let desc = v[1];

                let v1 = a[field];
                let v2 = b[field];
                if (v1 != null) {
                    if (desc) {
                        ret = v2 - v1;
                    } else {
                        ret = v1 - v2;
                    }

                    if (ret != 0) {
                        return ret;
                    }
                }
            }
            return ret;
        }

        let sorted = [];
        for (let i = 0; i < array.length; i++) {
            const v = array[i];
            sorted.push(v);
        }
        sorted.sort(sorter);
        return sorted
    }

    private static _convert(match?, nosign?) {
        if (nosign) {
            match.sign = '';
        } else {
            match.sign = match.negative ? '-' : match.sign;
        }
        var l = match.min - match.argument.length + 1 - match.sign.length;
        var pad = new Array(l < 0 ? 0 : l).join(match.pad);
        if (!match.left) {
            if (match.pad == "0" || nosign) {
                return match.sign + pad + match.argument;
            } else {
                return pad + match.sign + match.argument;
            }
        } else {
            if (match.pad == "0" || nosign) {
                return match.sign + match.argument + pad.replace(/0/g, ' ');
            } else {
                return match.sign + match.argument + pad;
            }
        }
    }

    /**
     * 格式化字符串
     * @param args c风格的format参数：format("%02d-%s", 1, "a")
     */
    public static format(...args): string;
    public static format(): string {
        if (typeof arguments == "undefined") { return null; }
        if (arguments.length < 1) { return null; }
        if (typeof arguments[0] != "string") { return null; }
        if (typeof RegExp == "undefined") { return null; }
        var string = arguments[0];
        var exp = new RegExp(/(%([%]|(\-)?(\+|\x20)?(0)?(\d+)?(\.(\d)?)?([bcdfosxX])))/g);
        var matches = new Array();
        var strings = new Array();
        var convCount = 0;
        var stringPosStart = 0;
        var stringPosEnd = 0;
        var matchPosEnd = 0;
        var newString = '';
        var match = null;
        while (match = exp.exec(string)) {
            if (match[9]) { convCount += 1; }
            stringPosStart = matchPosEnd;
            stringPosEnd = exp.lastIndex - match[0].length;
            strings[strings.length] = string.substring(stringPosStart, stringPosEnd);
            matchPosEnd = exp.lastIndex;
            matches[matches.length] = {
                match: match[0],
                left: match[3] ? true : false,
                sign: match[4] || '',
                pad: match[5] || ' ',
                min: match[6] || 0,
                precision: match[8],
                code: match[9] || '%',
                negative: parseInt(arguments[convCount]) < 0 ? true : false,
                argument: String(arguments[convCount])
            };
        }
        strings[strings.length] = string.substring(matchPosEnd);
        if (matches.length == 0) { return string; }
        if ((arguments.length - 1) < convCount) { return null; }
        var code = null;
        var match = null;
        var substitution = null;
        var i = null;
        for (i = 0; i < matches.length; i++) {
            if (matches[i].code == '%') { substitution = '%' }
            else if (matches[i].code == 'b') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(2));
                substitution = this._convert(matches[i], true);
            }
            else if (matches[i].code == 'c') {
                matches[i].argument = String(String.fromCharCode(Math.abs(parseInt(matches[i].argument))));
                substitution = this._convert(matches[i], true);
            }
            else if (matches[i].code == 'd') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)));
                substitution = this._convert(matches[i]);
            }
            else if (matches[i].code == 'f') {
                matches[i].argument = String(Math.abs(parseFloat(matches[i].argument)).toFixed(matches[i].precision ? matches[i].precision : 6));
                substitution = this._convert(matches[i]);
            }
            else if (matches[i].code == 'o') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(8));
                substitution = this._convert(matches[i]);
            }
            else if (matches[i].code == 's') {
                matches[i].argument = matches[i].argument.substring(0, matches[i].precision ? matches[i].precision : matches[i].argument.length)
                substitution = this._convert(matches[i], true);
            }
            else if (matches[i].code == 'x') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
                substitution = this._convert(matches[i]);
            }
            else if (matches[i].code == 'X') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
                substitution = this._convert(matches[i]).toUpperCase();
            }
            else {
                substitution = matches[i].match;
            }
            newString += strings[i];
            newString += substitution;
        }
        newString += strings[i];
        return newString;
    }

    /**
     * 遍历[key-value]结构的map
     * @param map
     * @param callback return tuue：中断循环
     */
    public static forEachMap<TValue>(map: { [k: number]: TValue }, callback: (key: string, value: TValue) => boolean | void, bSortKey?: boolean): void;

    /**
     * 遍历[key-value]结构的map
     * @param map
     * @param callback return tuue：中断循环
     */
    public static forEachMap<TValue>(map: { [k: string]: TValue }, callback: (key: string, value: TValue) => boolean | void, bSortKey?: boolean): void;

    /**
     * 遍历[key-value]结构的map
     * @param map
     * @param callback return tuue：中断循环
     */
    public static forEachMap(map: any, callback: (key: string, value: any) => boolean | void, bSortKey?: boolean): void;

    /**
     * 遍历[key-value]结构的map
     * @param map
     * @param callback return tuue：中断循环
     */
    public static forEachMap<TKey, TValue>(map: any, callback: (key: any, value: any) => boolean | void, bSortKey?: boolean): void {
        if (!map) return;

        let keys = Object.keys(map);
        if (bSortKey) {
            keys = keys.sort();
        }
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = map[key];

            if (value != null) {
                if (callback(key, value)) break;
            }
        }
    }

    /**
     * 遍历数据结构，返回长度
     * @param obj 数组 or obj
     */
    static getObjSize(obj) {
        if (!obj) {
            return 0;
        }

        if (Array.isArray(obj)) {
            return obj.length;
        }

        let count = 0;
        Tools.forEachMap(obj, (k, v) => {
            count++;
        });
        return count;
    }

    static foreachDir(dir, callback, bNotRecursion?) {
        if (!fs.existsSync(dir)){
            console.error("找不到指定文件夹：",dir);
            return;
        }

        fs.readdirSync(dir).forEach((fileName) => {
            if (fileName.startsWith("~")) {
                // 忽略隐藏文件
                return;
            }

            let pathName = path.join(dir, fileName);

            try {
                if (fs.statSync(pathName).isDirectory() && bNotRecursion != true) {
                    this.foreachDir(pathName, callback,bNotRecursion);
                } else {
                    callback(path.normalize(pathName));
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    static foreachDirs(dirs, callback) {
        if (!Array.isArray(dirs)) {
            console.error("Tools.foreachDirs dirs not array!");
            return;
        }

        for (let dir of dirs) {
            this.foreachDir(dir, callback,false);
        }
    }


    /**
     * 计算两个path的相对目录
     */
    static calcRelativePath(path1, path2) {
        path1 = path.normalize(path1);
        path2 = path.normalize(path2);
        //console.log("path1 = ",path1);
        //console.log("path2 = ",path2);
        // 当前位置
        let arr1 = path1.split(path.sep);
        // 目标位置
        let arr2 = path2.split(path.sep);

        let arr = [];

        for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
            let f1 = arr1[i];
            let f2 = arr2[i];

            if (f1 != f2) {
                // 将当前位置剩余的字段替换为 ..
                for (let j = i + 1; j < arr1.length; j++) {
                    arr.push("..");
                }

                // 将目标位置剩余的字段压栈
                for (let j = i; j < arr2.length; j++) {
                    arr.push(arr2[j]);
                }

                break;
            }
        }
        if(arr.length == 1){
            return "./" + arr[0];
        }
        return arr.join(path.sep);
    }

    static findLineTag(lines, beginTag, endTag) {
        let index1 = null;
        let index2 = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line == beginTag) {
                index1 = i;
            } else if (line == endTag) {
                index2 = i;
            }
        }

        return [index1, index2]
    }


    ///// uuid相关 /////
    static loadUuidFromMetaFilePath(metaFilePath) {
        try {
            let text = fs.readFileSync(metaFilePath, { encoding: "utf-8" });
            let data = JSON.parse(text);
            return data.uuid;
        } catch (error) {
            console.error("Tools.loadUuidFromMetaFilePath has error", error);
            return null;
        }
    }

    static compressUuid(uuid) {
        return Uuid.compressUuid(uuid);
    }

    static decompressUuid(uuid) {
        return Uuid.decompressUuid(uuid);
    }

}