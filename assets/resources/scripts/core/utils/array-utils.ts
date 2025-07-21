import { error } from 'cc';
import { bDebug } from '../define';
import Mathf from './mathf';

export class ArrayUtils {
    /**
     * 求两个数组的并集
     * a : [1,2,3,4,5]
     * b : [5,6,7,8,9]
     * out : [1,2,3,4,5,6,7,8,9]
     * @param a
     * @param b
     */
    public static union<T>(a: T[], b: T[]): T[] {
        if (b.length == 0) {
            return a;
        }
        if (a.length == 0) {
            return b;
        }
        const ra: T[] = a.concat(b);
        const ba: T[] = [];
        for (let i = 0; i < ra.length; i++) {
            const p = ra[i];
            if (ba.indexOf(p) == -1) {
                ba.push(p);
            }
        }
        return ba;
    }
    /**
     * 两个数组的交集
     * a : [1,2,3,4,5]
     * b : [5,6,7,8,9]
     * out : [5]
     * @param a
     * @param b
     *
     */
    public static intersection<T>(a: T[], b: T[]): T[] {
        return a.filter(function (val) {
            return b.indexOf(val) > -1;
        });
    }
    /**
     * 两个数组的补集
     * a : [1,2,3,4,5]
     * b : [5,6,7,8,9]
     * out : [1,2,3,4,6,7,8,9]
     * 删除两个数组中重复的
     * @param a
     * @param b
     */
    public static complement<T>(a: T[], b: T[]): T[] {
        return a
            .filter(function (val) {
                return !(b.indexOf(val) > -1);
            })
            .concat(
                b.filter(function (val) {
                    return !(a.indexOf(val) > -1);
                }),
            );
    }
    /**
     * 两个数组的差集
     * 数组a相对于数组b所没有的
     * a : [1,2,3,4,5]
     * b : [5,6,7,8,9]
     * out : [1,2,3,4]
     * @param a
     * @param b
     */
    public static diff<T>(a: T[], b: T[]): T[] {
        return a.filter(function (val) {
            return b.indexOf(val) == -1;
        });
    }

    /** 随机获取数据中的元素，不改变源数组 */
    public static randomGotArrayDatas<T>(arr: T[], expectNum: number, bChangeOriginArr?: boolean): T[] {
        if (!arr || arr.length <= 0 || !expectNum || expectNum < 0) {
            return [];
        }

        const newArr = [];

        expectNum = Math.min(expectNum, arr.length);

        const indexArr = [];
        for (let i = 0; i < arr.length; i++) {
            indexArr.push(i);
        }

        let gotNum = 0;
        while (gotNum < expectNum) {
            const index = Mathf.randomInt(0, indexArr.length - 1);
            const indexValue = indexArr[index];
            const data = arr[indexValue];
            newArr.push(data);

            indexArr.splice(index, 1);
            if (bChangeOriginArr) {
                arr.splice(index, 1);
            }

            gotNum += 1;
        }

        // //cc.log("=====randomGotArrayDatas=", newArr)

        return newArr;
    }

    /**
     * 从指定数组中获取排除except后的指定数量的数据
     * @param array 源数组
     * @param count 需求数量
     * @param except 排除
     */
    public static randomGotArrayDataExcept<T>(array: T[], count: number, except: T[]): T[] {
        const left: T[] = this.diff(array, except);
        return this.randomGotArrayDatas(left, count);
    }

    /**
     * 从指定数组中随机一个数值出来
     * @param array     需要进行随机的数组
     * @param except    如果需要排除
     * 注意：
     *      1.如果你传入的数组长度为0，返回null
     *      2.不会改变原数组
     */
    public static randomArray<T>(array: T[], except?: T): T | null {
        if (!array) {
            return null;
        }
        let len = array.length;
        if (len == 0) {
            return null;
        }
        if (except != undefined && except != null) {
            const copyed: T[] = [];
            for (let i = 0; i < len; i++) {
                const n = array[i];
                if (n == except) {
                    continue;
                }
                copyed.push(n);
            }
            len = copyed.length;
            if (len == 0) {
                return null;
            }
            const rd = Mathf.randomInt(1, len);
            return copyed[rd - 1];
        } else {
            //不需要排除的，直接返回
            const rd = Mathf.randomInt(1, len);
            return array[rd - 1];
        }
    }

    /**
     * 从数组中删除指定的数据
     * @param arr
     * @param value
     * @returns 返回被删除的内容
     */
    public static removeValue<T>(arr: T[], value: T) {
        const index = arr.indexOf(value);
        if (index == -1) {
            return [];
        }
        return arr.splice(index, 1);
    }

    public static isArrayEquals<T>(a: T[], b: T[]): boolean {
        return a.sort().toString() === b.sort().toString();
    }

    /**
     * 克隆指定的数组
     * @param a
     */
    public static clone<T>(a: T[]) {
        const b: T[] = [];
        for (let i = 0; i < a.length; i++) {
            b.push(a[i]);
        }
        return b;
    }

    /**
     * 将string数组转换为int[]
     * @param a
     * @param b
     */
    public static covertStringArrayToIntArray(a: string[], b: number[]) {
        for (let i = 0; i < a.length; i++) {
            const n = parseInt(a[i]);
            if (!isNaN(n)) {
                b.push(n);
            } else {
                bDebug && error('无法转换string:' + a[i] + '为数字！');
            }
        }
    }
    /**
     * 随机打乱一个数组
     * @param arr
     */
    public static shuffle<T>(arr: T[]): T[] {
        return arr.sort(() => {
            return Math.random() - 0.5;
        });
    }

    /**
     * 随机的将 total 分为 n 份
     * @param n
     * @param total
     */
    public static getRandomNumberArrayInNumber(total: number, n: number, bUseSign: boolean = false): number[] {
        const res: number[] = [];
        let range = total;
        let preTotal = 0;
        for (let i = 0; i < n - 1; i++) {
            let sign = Mathf.randomInt(1, 100);
            if (sign <= 50) {
                sign = 1;
            } else {
                sign = -1;
            }
            if (!bUseSign) {
                sign = 1;
            }
            const item = sign * Math.ceil(Math.random() * (range / 3));
            res.push(item);
            range -= item;
            preTotal += item;
        }
        res.push(total - preTotal);
        return res;
    }
}
