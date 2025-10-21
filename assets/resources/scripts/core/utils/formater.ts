export default class Formater {
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
     * 以指定格式 YYYY-MM-DD HH:mm:ss 格式化时间
     * 不足两位数的补0
     */
    public static formatTimeNow(): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const second = date.getSeconds();
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
    }
}
