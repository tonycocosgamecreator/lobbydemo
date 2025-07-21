import { Label } from "cc";
import { Md5 } from "./md5";

/**
 * 格式化字符串
 * @param template 
 * @param args 
 * @returns 
 */
export function format(template: string, ...args: Array<string | number>): string {
  return template.replace(/\{(\d+)\}/g, (match, index) => {
    const value = args[Number(index)];
    return value !== undefined ? String(value) : '';
  });
}

export function encodeToBase64(input: string): string {
  const utf8Bytes = new TextEncoder().encode(input); // UTF-8 编码
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary); // base64 编码
}

export class StringUtils {


  /**
     * 格式化一个数字
     * @param number       需要被格式化的数字
     * @param digitCount  每间隔多少个数字给与一个
     * @param delimiter  间隔符号
     */
    public static splitNumber(number: number | string, delimiter: string = ',', digitCount: number = 3): string {
        const delimiterPattern = new RegExp(`\\B(?=(\\d{${digitCount}})+(?!\\d))`, 'g');
        return number.toString().replace(delimiterPattern, delimiter);
    }

  /**
   *  将传入的时间格式化为 YYYY-MM-DD HH:mm:ss 格式
   * @param input 时间戳（秒或毫秒）
   * @returns  格式化后的时间字符串
   */
  public static formatTime(input: number,format : string = "YYYY-MM-DD HH:mm:ss"): string {
    // 判断是否是毫秒（时间戳大于当前时间戳的一部分）
    const timestamp = input > 1e12 ? input : input * 1000; // 如果是秒则乘1000

    const date = new Date(timestamp);

    const pad = (n: number) => n.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // 月份从0开始
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    //根据format参数来返回

    //将format中的YYYY,MM,DD,HH,mm,ss替换成对应的值
    let result = format;
    result = result.replace(/YYYY/g, year.toString());
    result = result.replace(/MM/g, month);
    result = result.replace(/DD/g, day);
    result = result.replace(/HH/g, hours);
    result = result.replace(/mm/g, minutes);
    result = result.replace(/ss/g, seconds);
    return result;
  }

  /**
   *  创建签名
   *  按照字典序对参数进行排序，然后拼接成 key=value
   * @param param  需要签名的参数对象
   * @param key  签名秘钥
   * @returns 
   */
  public static createSign(param: object, key: string): string {
    const fields: string[] = [];

    for (const [key, value] of Object.entries(param)) {
      if (key !== 'sign' && value !== '') {
        fields.push(key);
      }
    }
    // 字典序排序
    fields.sort();
    // 拼接成 key=value 的格式
    const keyValuePairs = fields.map(key => `${key}=${param[key]}`);

    // 加上 key=secret
    keyValuePairs.push(`key=${key}`);

    const str = keyValuePairs.join('&');
    // 计算签名
    let sign = Md5.hashStr(str);
    return sign;
  }
  /**
     * 将一个传入的数字val转换成带单位的字符串,需要保留fixedCount位小数
     * 小于1000的时候直接使用数字转换为字符串
     * 大于1000的时候转换为K,M,B,T
     * @param val 
     */
    public static formatNumberWithUnit(val : number | string,fixedCount: number = 2) : string{
        let num = Math.abs(Number(val));
        if(num < 1000){
            return num.toFixed(fixedCount);
        }
        let unit = ['','K','M','B','T'];
        let index = 0;
        while(num >= 1000 && index < unit.length){
            num = num / 1000;
            index++;
        }
        return num.toFixed(fixedCount) + unit[index];
    }

    /**
     * 使用指定模式更新这个label的显示,没有动效的处理，直接
     * @param label
     * @param val           数值
     * @param seprateCount  多少个数字进行分割，默认3，千分位
     * @param seprate       分割符号是什么，默认","
     * @param pMulte        需要除以多少倍，默认1
     * @param fixedCount    最后保留几位小数，默认2
     */
    public static updateNumberTextWithSperateAndFixed(label: Label, val: number, seprateCount: number = 3, seprate: string = ',', pMulte: number = 1, fixedCount: number = 2) {
        const floater = (val / pMulte).toFixed(fixedCount);
        const text = this.splitNumber(floater, seprate, seprateCount);
        label.string = text;
    }
}