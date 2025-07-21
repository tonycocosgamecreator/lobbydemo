import { ImageAsset, Texture2D, assetManager,Node } from 'cc';
import { bDebug } from '../define';
export const headImgExt = '.head';
export class Tools {
    /**
     * 遍历[key-value]结构的map
     * @param map
     * @param callback return tuue：中断循环
     */
    public static forEachMap<TValue>(map: { [k: number]: TValue }, callback: (key: number, value: TValue) => boolean | void, bSortKey?: boolean): void;

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
     * 获取一个全新得uuid
     */
    public static get Uuid(): string {
        const longUuid = this._generateUUID();
        return this._compressUuid(longUuid);
    }

    /**
     * 动态加载渠道用户的头像
     * @param call
     */
    public static LoadChannelPlayerHead(url: string, call: (asset: ImageAsset | null) => void) {
        if (!url || url == '') {
            call && call(null);
            return;
        }
        assetManager.loadRemote(url, { ext: headImgExt }, (err, texture: Texture2D) => {
            bDebug && console.log('头像下载成功：', texture, err);
            if (err || !texture) {
                call && call(null);
                return;
            }
            call && call(texture.image);
        });
    }
    /**
     * 注册渠道头像下载
     */
    public static RegisterHeadImgLoader() {
        assetManager.downloader.register(headImgExt, (content, options, onComplete) => {
            onComplete(null, content);
        });
        assetManager.parser.register(headImgExt, this._downloadDomImage.bind(this));
        assetManager.factory.register(headImgExt, this._createTexture.bind(this));
    }

    /**
     * 格式化字符串
     * @param args c风格的format参数：format("%02d-%s", 1, "a")
     */
    public static format(...args: (string | number)[]): string;
    public static format(): string | null {
        if (typeof arguments == 'undefined') {
            return null;
        }
        if (arguments.length < 1) {
            return null;
        }
        if (typeof arguments[0] != 'string') {
            return null;
        }
        if (typeof RegExp == 'undefined') {
            return null;
        }
        const string = arguments[0];
        const exp = new RegExp(/(%([%]|(\-)?(\+|\x20)?(0)?(\d+)?(\.(\d)?)?([bcdfosxX])))/g);
        const matches = [];
        const strings = [];
        let convCount = 0;
        let stringPosStart = 0;
        let stringPosEnd = 0;
        let matchPosEnd = 0;
        let newString = '';
        var match = null;
        while ((match = exp.exec(string))) {
            if (match[9]) {
                convCount += 1;
            }
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
                argument: String(arguments[convCount]),
            };
        }
        strings[strings.length] = string.substring(matchPosEnd);
        if (matches.length == 0) {
            return string;
        }
        if (arguments.length - 1 < convCount) {
            return null;
        }
        const code = null;
        var match = null;
        let substitution = null;
        let i = null;
        for (i = 0; i < matches.length; i++) {
            if (matches[i].code == '%') {
                substitution = '%';
            } else if (matches[i].code == 'b') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(2));
                substitution = this._convert(matches[i], true);
            } else if (matches[i].code == 'c') {
                matches[i].argument = String(String.fromCharCode(Math.abs(parseInt(matches[i].argument))));
                substitution = this._convert(matches[i], true);
            } else if (matches[i].code == 'd') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)));
                substitution = this._convert(matches[i]);
            } else if (matches[i].code == 'f') {
                matches[i].argument = String(Math.abs(parseFloat(matches[i].argument)).toFixed(matches[i].precision ? matches[i].precision : 6));
                substitution = this._convert(matches[i]);
            } else if (matches[i].code == 'o') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(8));
                substitution = this._convert(matches[i]);
            } else if (matches[i].code == 's') {
                matches[i].argument = matches[i].argument.substring(0, matches[i].precision ? matches[i].precision : matches[i].argument.length);
                substitution = this._convert(matches[i], true);
            } else if (matches[i].code == 'x') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
                substitution = this._convert(matches[i]);
            } else if (matches[i].code == 'X') {
                matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
                substitution = this._convert(matches[i]).toUpperCase();
            } else {
                substitution = matches[i].match;
            }
            newString += strings[i];
            newString += substitution;
        }
        newString += strings[i];
        return newString;
    }

    //=======================================私有方法=================================//

    private static _generateUUID(): string {
        let d = Date.now();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });

        return uuid;
    }

    /** 压缩uuid */
    private static _compressUuid(uuid: string): string {
        // 准备参数
        const hexChars: string[] = '0123456789abcdef'.split('');
        const hexMap: { [key: string]: number } = {};
        for (let i = 0; i < hexChars.length; i++) {
            hexMap[hexChars[i]] = i;
        }

        const base64KeyToChars: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.split('');
        const base64CharToKey: { [key: string]: number } = {};
        for (let i = 0; i < base64KeyToChars.length; i++) {
            base64CharToKey[base64KeyToChars[i]] = i;
        }

        uuid = uuid.replace(/-/g, '');

        const arr = uuid.split('');

        const outArr = [];

        outArr.push(arr[0]);
        outArr.push(arr[1]);

        for (let i = 2; i < arr.length; i += 3) {
            const hex1 = hexMap[arr[i]];
            const hex2 = hexMap[arr[i + 1]];
            const hex3 = hexMap[arr[i + 2]];

            outArr.push(base64KeyToChars[(hex1 << 2) | (hex2 >> 2)]);
            outArr.push(base64KeyToChars[((hex2 & 3) << 4) | hex3]);
        }

        return outArr.join('');
    }

    private static _downloadDomImage(url: string, options: any, onComplete: Function) {
        const img = new Image();
        if (window.location.protocol !== 'file:') {
            img.crossOrigin = 'anonymous';
        }
        function loadCallback() {
            img.removeEventListener('load', loadCallback);
            img.removeEventListener('error', errorCallback);
            if (onComplete) {
                onComplete(null, img);
            }
        }

        function errorCallback() {
            img.removeEventListener('load', loadCallback);
            img.removeEventListener('error', errorCallback);
            if (onComplete) {
                onComplete(new Error(url));
            }
        }

        img.addEventListener('load', loadCallback);
        img.addEventListener('error', errorCallback);
        img.src = url;
        return img;
    }

    private static _createTexture(id: string, data: any, options: any, onComplete: Function) {
        let out: Texture2D | null = null;
        let err: Error | null = null;
        try {
            out = new Texture2D();
            const imageAsset = new ImageAsset(data);
            out.image = imageAsset;
        } catch (e) {
            err = e as any as Error;
        }
        onComplete && onComplete(err, out);
    }

    private static _convert(match?, nosign?) {
        if (nosign) {
            match.sign = '';
        } else {
            match.sign = match.negative ? '-' : match.sign;
        }
        const l = match.min - match.argument.length + 1 - match.sign.length;
        const pad = new Array(l < 0 ? 0 : l).join(match.pad);
        if (!match.left) {
            if (match.pad == '0' || nosign) {
                return match.sign + pad + match.argument;
            } else {
                return pad + match.sign + match.argument;
            }
        } else {
            if (match.pad == '0' || nosign) {
                return match.sign + match.argument + pad.replace(/0/g, ' ');
            } else {
                return match.sign + match.argument + pad;
            }
        }
    }

    private static MAP = {
        '[object Boolean]': 'boolean',
        '[object Number]': 'number',
        '[object String]': 'string',
        '[object Function]': 'function',
        '[object Array]': 'array',
        '[object Date]': 'date',
        '[object RegExp]': 'regExp',
        '[object Undefined]': 'undefined',
        '[object Null]': 'null',
        '[object Object]': 'object',
    };

    private static _getType(obj) {
        const toString = Object.prototype.toString;
        return this.MAP[toString.call(obj)];
    }

    /**深度拷贝 */
    public static deepClone<T>(data: T): T {
        const type = this._getType(data);
        let obj;
        if (data instanceof Node) {
            //节点数据过大, 使用引用, 避免栈溢出
            return data;
        } else if (type === 'object') {
            obj = {};
        } else if (type === 'array') {
            obj = [];
        } else {
            //不再具有下一层次
            return data;
        }
        if (type === 'array') {
            for (let i = 0, len = (data as any).length; i < len; i++) {
                obj.push(this.deepClone(data[i]));
            }
        } else if (type === 'object') {
            for (const key in data) {
                obj[key] = this.deepClone(data[key]);
            }
        }
        return obj;
    }

    
}
