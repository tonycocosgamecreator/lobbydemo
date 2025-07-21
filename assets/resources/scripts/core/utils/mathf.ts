import { IVec2Like, IVec3Like, Rect, v2, v3, Vec2, Vec3 } from 'cc';

/**
 * 以e为底，10的自然对数
 */
const LOG10: number = Math.log(10);

/** 临时变量，使用的时候需要非常确定这个变量在结束使用前不会再次被其他地方使用 */
const v2_temp1 = v2();
const v2_temp2 = v2();
const v2_temp3 = v2();
const v2_temp4 = v2();
const v2_temp5 = v2();
const v2_temp6 = v2();
const v2_temp7 = v2();
const v2_temp8 = v2();

/** 正态分布的随机结果 */
let random_ret_cache = 12345;

const v2_sub = Vec2.subtract;
const v2_set2 = function <T extends IVec2Like>(v2: T, x: number, y: number) {
    v2.x = x;
    v2.y = y;
    return v2;
};

export default class Mathf {
    public static readonly roundPower10Double: number[] = [
        1.0, 10.0, 100.0, 1000.0, 10000.0, 100000.0, 1000000.0, 10000000.0, 100000000.0, 1000000000.0, 10000000000.0, 100000000000.0, 1000000000000.0, 10000000000000.0, 100000000000000.0, 1e15,
    ];

    public static readonly PI: number = Math.PI;

    public static readonly Deg2Rad: number = Math.PI / 180;

    public static readonly Rad2Deg: number = 180 / Math.PI;

    private static readonly EPSILON = 1e-6;

    /**
     * 默认返回10为底，value的自然对数
     * @param value
     * @param newBase 以newBase为底
     */
    public static log(value: number, newBase?: number) {
        if (newBase == null) {
            return Math.log(value) / LOG10;
        } else {
            return Math.log(value) / Math.log(newBase);
        }
    }

    public static getDigits(num: number) {
        return Math.floor(this.log(num));
    }

    /**
     * 获取一个随机数
     * random() => [0, 1)
     */
    public static random(): number {
        return Math.random();
    }

    /**
     * 获取一个【整数】随机数
     * random(2, 5) => [2, 5]
     * @param min 最小值
     * @param max 最大值
     */
    public static randomInt(min: number, max: number) {
        return (Math.random() * (max - min + 1) + min) | 0;
    }

    /** 获取一个【浮点数】随机数 */
    public static randomFloat(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    /**
     * @return 返回 +1 或者 -1
     */
    public static randomPlusOrMinus() {
        return (this.randomInt(1, 2) - 1) * 2 - 1;
    }

    /**
     * 返回一个半径为1的圆上随机一个点
     */
    public static randomOnUnitCircle<T extends IVec2Like>(out: T): T {
        const r = this.random() * Mathf.PI * 2;
        out.x = Math.cos(r);
        out.y = Math.sin(r);
        return out;
    }

    /**
     * 等概率返回true或者false
     */
    public static trueOrFalse() {
        return Math.random() > 0.5;
    }

    /**
     * 概率是否有效(百分比概率)
     * @param rate [0, 100]
     */
    public static randomEnableInt(rate: number) {
        if (!rate) return false;
        return this.randomInt(1, 100) <= rate;
    }

    /**
     * 概率是否有效(浮点概率)
     * @param rate [0, 1]
     */
    public static randomEnableFloat(rate: number) {
        if (!rate) return false;
        return Math.random() <= rate;
    }

    public static randomNormalDistribution() {
        // 12345是一个永远不可能随机到的值，表示这个值是空
        if (random_ret_cache == 12345) {
            let u = 0,
                v = 0,
                w = 0,
                c = 0;
            do {
                u = Math.random() * 2 - 1;
                v = Math.random() * 2 - 1;
                w = u * u + v * v;
            } while (w == 0 || w >= 1);
            //Box-Muller转换
            c = Math.sqrt((-2 * Math.log(w)) / w);

            // 会产生2个标准正态分布的随机数，缓存一个下次用
            random_ret_cache = v * c;
            return u * c;
        }

        const ret = random_ret_cache;
        random_ret_cache = 12345;
        return ret;
    }

    /** 返回两个标准正态分布的数 */
    public static randomNormalDistribution2(out: number[]): void {
        let u = 0,
            v = 0,
            w = 0,
            c = 0;
        do {
            u = Math.random() * 2 - 1;
            v = Math.random() * 2 - 1;
            w = u * u + v * v;
        } while (w == 0 || w >= 1);
        c = Math.sqrt((-2 * Math.log(w)) / w);
        out[0] = u * c;
        out[1] = v * c;
    }

    public static clamp01(value: number): number {
        if (value > 1) return 1;
        else if (value < 0) return 0;
        else return value;
    }

    public static clamp(value: number, min: number, max: number): number {
        if (value < min) return min;
        else if (value > max) return max;
        else return value;
    }

    /**
     * 获取value的符号，返回1或者-1，0返回1（通常符号位是用来做乘法的，所以0表示不会变化，故返回1）
     */
    public static sign(value: number): number {
        if (value >= 0) return 1;
        else return -1;
    }

    /**
     * 两个浮点数的差的绝对值小于EPSILON则认为是相等的
     */
    public static fuzzyEquals(value1: number, value2: number): boolean {
        return Math.abs(value1 - value2) < this.EPSILON;
    }

    public static lerp(min: number, max: number, t: number): number {
        return min + (max - min) * this.clamp01(t);
    }

    public static inverseLerp(min: number, max: number, cur: number): number {
        if (min != max) {
            return this.clamp01((cur - min) / (max - min));
        } else {
            return 0;
        }
    }

    public static lerpFromInverseLerp(valueMin: number, valueMax: number, fromMin: number, fromMax: number, fromValue: number): number {
        return this.lerp(valueMin, valueMax, this.inverseLerp(fromMin, fromMax, fromValue));
    }

    /** 求把x和y按照缩放到max尺寸内缩放值 */
    public static getFitScale(x: number, y: number, maxX: number, maxY: number) {
        const scaleX = maxX / x;
        const scaleY = maxY / y;
        return Math.min(scaleX, scaleY);
    }

    /**
     * 保留指定小数位数四舍五入后的值，默认为整数
     * @param value 数值
     * @param digits 小数位数
     */
    public static round(value: number, digits?: number): number {
        digits = digits || 0;
        const num = this.roundPower10Double[digits];
        value *= num;
        return Math.round(value) / num;
    }

    /**
     * value在min和max之间loop  (min,max]
     * 若只有min，则相当于求余
     */
    public static loop(value: number, min: number, max?: number): number {
        if (max == null) {
            max = min;
            min = 0;
        }

        if (value < min) {
            return min;
        } else {
            const v = (value - min) % (max - min);
            return min + v;
        }
    }

    public static pingPong(value: number, min: number, max?: number): number {
        if (max == null) {
            max = min;
            min = 0;
        }

        if (value < min) {
            return min;
        } else {
            const d = max - min;
            const v1 = value - min;
            const s = Math.floor(v1 / d);
            const v2 = v1 % d;
            if (s % 2 == 0) {
                return v2 + min;
            } else {
                return max - v2;
            }
        }
    }

    public static nextGaussian(mean: number, std_dev: number): number {
        return mean + this.uniform2NormalDistribution() * std_dev;
        // return mean + (this.randomNormalDistribution() * std_dev);
    }

    public static uniform2NormalDistribution(): number {
        let sum = 0.0;
        for (let i = 0; i < 12; i++) {
            sum = sum + Math.random();
        }
        return sum - 6.0;
    }

    // public static randomNormalDistribution() {
    //     var u = 0.0, v = 0.0, w = 0.0, c = 0.0;
    //     do {
    //         //获得两个（-1,1）的独立随机变量
    //         u = Math.random() * 2 - 1.0;
    //         v = Math.random() * 2 - 1.0;
    //         w = u * u + v * v;
    //     } while (w == 0.0 || w >= 1.0)
    //     //这里就是 Box-Muller转换
    //     c = Math.sqrt((-2 * Math.log(w)) / w);
    //     //返回2个标准正态分布的随机数，封装进一个数组返回
    //     //当然，因为这个函数运行较快，也可以扔掉一个
    //     //return [u*c,v*c];
    //     return u * c;
    // }

    /**
     * 圆盘概率掉落
     * @param weights 权重列表(不定参数)
     */
    public static circleRandom(...weights: number[]): number {
        return this.arrCircleRandom(weights);
    }

    /**
     * 圆盘概率掉落
     * @param weights 权重列表(数组)
     * @returns 索引，失败返回-1
     */
    public static arrCircleRandom(weights: number[]): number {
        let sum = 0;
        for (let i = 0; i < weights.length; i++) {
            sum += weights[i];
        }
        if (sum <= 0) return -1;

        let random = Math.random() * sum;
        // 遍历所有掉落物品
        for (let i = 0; i < weights.length; i++) {
            if (random <= weights[i]) {
                //需要掉落
                return i;
            }

            random -= weights[i];
        }

        return -1;
    }

    /**
     * 创建一个从0开始指定长度的数列[0, 1, 2, ...]
     * @param len
     * @param shuffle 是否随机，默认true
     */
    public static makeArray(len: number, shuffle = true): number[] {
        const arr = new Array(len);
        for (let i = 0; i < len; i++) {
            arr[i] = i;
        }
        shuffle && this.shuffle(arr);
        return arr;
    }

    /**
     * 随机返回数组里面的一个元素
     * @param removeIt 是否删除该元素，默认false
     */
    public static randomFromArray<T>(arr: T[], removeIt?: boolean): T | null {
        if (arr && arr.length) {
            const idx = this.randomInt(1, arr.length) - 1;
            if (removeIt) {
                return arr.splice(idx, 1)[0];
            } else {
                return arr[idx];
            }
        } else {
            return null;
        }
    }

    /**
     * 随机返回数组里面的指定个数的元素(不会重复，如果数量不足，则有多少返回多少)
     * @param removeIt 是否删除该元素，默认false
     */
    public static randomArrFromArray<T>(arr: T[], count: number, removeIt?: boolean): T[] {
        const result: T[] = [];
        if (arr) {
            if (!removeIt) {
                arr = arr.slice();
            }

            for (let i = Math.min(arr.length, count); i > 0; i--) {
                const p = this.randomFromArray(arr, true);
                if (p) {
                    result.push(p);
                }
            }
        }
        return result;
    }

    /**
     * 打乱数组顺序
     */
    public static shuffle(data: any[]): void {
        let temp: any;
        let rnd: any;
        for (let i = data.length - 1; i > 0; i--) {
            rnd = this.randomInt(0, i);
            temp = data[i];
            data[i] = data[rnd];
            data[rnd] = temp;
        }
    }

    public static swap(data: any[], i: number, j: number) {
        const temp = data[i];
        data[i] = data[j];
        data[j] = temp;
    }

    /** 求最小值的索引，如果有相等的，则返回最后一个的索引 */
    public static minIndex(values: number[]) {
        let minValue = Number.MAX_SAFE_INTEGER;
        let index = -1;
        for (let i = values.length - 1; i >= 0; i--) {
            if (values[i] <= minValue) {
                minValue = values[i];
                index = i;
            }
        }
        return index;
    }

    /**
     * 返回 Math.sqrt(dx * dx + dy * dy)
     */
    public static distance(p1: IVec2Like, p2: IVec2Like): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 返回 Math.sqrt(dx * dx + dy * dy)
     */
    public static distance2(dx: number, dy: number): number {
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 返回 dx * dx + dy * dy
     */
    public static distanceSqr(p1: IVec2Like, p2: IVec2Like): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return dx * dx + dy * dy;
    }

    /**
     * 返回 dx * dx + dy * dy
     */
    public static distanceSqr2(dx: number, dy: number): number {
        return dx * dx + dy * dy;
    }

    /**
     * 获取两点之间的距离
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     */
    public static getDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    /** s到ab的距离 */
    public static point2line(a: IVec3Like, b: IVec3Like, s: IVec3Like) {
        const sqrt = Math.sqrt;
        const pow = Math.pow;
        const ab = sqrt(pow(a.x - b.x, 2) + pow(a.y - b.y, 2) + pow(a.z - b.z, 2));
        const as = sqrt(pow(a.x - s.x, 2) + pow(a.y - s.y, 2) + pow(a.z - s.z, 2));
        const bs = sqrt(pow(s.x - b.x, 2) + pow(s.y - b.y, 2) + pow(s.z - b.z, 2));

        const cos_A = (pow(as, 2) + pow(ab, 2) - pow(bs, 2)) / (2 * ab * as);
        const sin_A = sqrt(1 - pow(cos_A, 2));
        return as * sin_A;
    }

    /** 插值算法，由慢到快 */
    public static easeInLogic(val: number): number {
        return 1 - Math.sin(0.5 * Math.PI * (1 - val));
    }

    /** 插值算法，由快到慢 */
    public static easeOutLogic(val: number): number {
        return Math.sin(0.5 * Math.PI * val);
    }

    /** 插值算法 */
    public static easeInOutLogic(val: number): number {
        const pi2 = Math.PI * 2;
        return val - Math.sin(val * pi2) / pi2;
    }

    /** 插值算法，回弹 */
    public static bounceLogic(val: number): number {
        if (val < 0.363636) {
            // 0.363636 = (1 / 2.75)
            val = 7.5685 * val * val;
        } else if (val < 0.727272) {
            // 0.727272 = (2 / 2.75)
            val = 7.5625 * (val -= 0.545454) * val + 0.75; // 0.545454f = (1.5 / 2.75)
        } else if (val < 0.90909) {
            // 0.909090 = (2.5 / 2.75)
            val = 7.5625 * (val -= 0.818181) * val + 0.9375; // 0.818181 = (2.25 / 2.75)
        } else {
            val = 7.5625 * (val -= 0.9545454) * val + 0.984375; // 0.9545454 = (2.625 / 2.75)
        }
        return val;
    }

    /**
     * 计算向量角度 返回欧拉角
     * @param A
     * @param B
     */
    public static calcAngleA2B(A: IVec3Like, B: IVec3Like) {
        if (!A) return 0;
        if (!B) return 0;

        const magA = Vec3.len(A);
        const magB = Vec3.len(B);
        if (!magA) return 0;
        if (!magB) return 0;

        const cos_angle = Vec3.dot(A, B) / (magA * magB);
        const angle = Math.acos(cos_angle);
        return angle;
    }

    /**
     * 已知三角形三条边长，求ab的夹角，余弦定理(弧度[0,PI])
     * @param a
     * @param b
     * @param c
     */
    public static calcAngle(a: number, b: number, c: number) {
        if (a * b == 0) return 0;
        if (a + b <= c) return 180;

        // 余弦定理
        const cos_angle = (a * a + b * b - c * c) / (2 * a * b);
        return Math.acos(cos_angle);
    }

    public static cross_vec2(a: Vec2, b: Vec2) {
        return a.x * b.y - b.x * a.y;
    }

    public static segment_segment(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2, ret: Vec2) {
        //v1×v2=x1y2-y1x2
        //以线段ab为准，是否c，d在同一侧
        const ab = v2_sub(v2_temp1, a2, a1);
        const ac = v2_sub(v2_temp2, b1, a1);
        const abXac = this.cross_vec2(ab, ac);

        const ad = v2_sub(v2_temp3, b2, a1);
        const abXad = this.cross_vec2(ab, ad);

        if (abXac * abXad >= 0) {
            return false;
        }

        //以线段cd为准，是否ab在同一侧
        const cd = v2_sub(v2_temp1, b2, b1);
        const ca = v2_sub(v2_temp2, a1, b1);
        const cb = v2_sub(v2_temp3, a2, b1);

        const cdXca = this.cross_vec2(cd, ca);
        const cdXcb = this.cross_vec2(cd, cb);
        if (cdXca * cdXcb >= 0) {
            return false;
        }

        //计算交点坐标
        const t = this.cross_vec2(v2_sub(v2_temp1, a1, b1), v2_sub(v2_temp2, b2, b1)) / this.cross_vec2(v2_sub(v2_temp3, b2, b1), v2_sub(v2_temp4, a2, a1));
        const dx = t * (a2.x - a1.x);
        const dy = t * (a2.y - a1.y);

        ret.x = a1.x + dx;
        ret.y = a1.y + dy;
        return true;
    }

    /**
     * 求线段和轴对称矩形的交点
     * @param a1
     * @param a2
     * @param rect
     * @param ret
     * @returns
     */
    public static segment_rect(a1: Vec2, a2: Vec2, rect: Rect, ret: Vec2): boolean {
        const topLeft = v2_set2(v2_temp5, rect.x, rect.yMax);
        const bottomLeft = v2_set2(v2_temp6, rect.x, rect.y);

        if (this.segment_segment(a1, a2, bottomLeft, topLeft, ret)) {
            return true;
        }

        const topRight = v2_set2(v2_temp7, rect.xMax, rect.yMax);
        if (this.segment_segment(a1, a2, topLeft, topRight, ret)) {
            return true;
        }

        const bottomRight = v2_set2(v2_temp8, rect.xMax, rect.y);
        if (this.segment_segment(a1, a2, topRight, bottomRight, ret)) {
            return true;
        }

        if (this.segment_segment(a1, a2, bottomRight, bottomLeft, ret)) {
            return true;
        }

        return false;
    }

    // 角度转弧度
    public static angle_to_radian(angle: number): number {
        // 角度转弧度公式
        // π / 180 * 角度

        // 计算出弧度
        const radian = (Math.PI / 180) * angle;
        // 返回弧度
        return radian;
    }

    // 弧度转角度
    public static radian_to_angle(radian: number): number {
        // 弧度转角度公式
        // 180 / π * 弧度

        // 计算出角度
        const angle = (180 / Math.PI) * radian;
        // 返回弧度
        return angle;
    }

    // 角度转向量
    public static angle_to_vector3(angle: number, out?: Vec3): Vec3 {
        // tan = sin / cos
        if (!out) {
            out = v3(0, 0, 0);
        }
        // 将传入的角度转为弧度
        const radian = this.angle_to_radian(angle);
        // 算出cos,sin和tan
        const cos = Math.cos(radian); // 邻边 / 斜边
        const sin = Math.sin(radian); // 对边 / 斜边
        //let tan = sin / cos;// 对边 / 邻边
        // 结合在一起并归一化
        out.x = cos;
        out.y = sin;
        //out     = out.normalize();
        //let vec = new Vec2(cos, sin).normalize();
        // 返回向量
        return out;
    }

    // 向量转角度
    public static vector_to_angle(vector: Vec2): number {
        // 将传入的向量归一化
        const dir = vector.normalize();
        // 计算出目标角度的弧度
        const radian = dir.signAngle(new Vec2(1, 0));
        // 把弧度计算成角度
        const angle = -this.radian_to_angle(radian);
        // 返回角度
        return angle;
    }

    /**
     * 给定正整数N，求出所有可能相加等于N的正整数的集合
     * 例如： 给定正整数6，求出所有的结果为：
     * [6],[5,1],[4,2],[4,1,1],[3,3],[3,2,1],[3,1,1,1],[2,2,2],[2,2,1,1],[2,1,1,1,1],[1,1,1,1,1,1]
     * @param n         需要拆分的正整数N
     * @param m         请传入和N相同的数值
     * @param max       请传入和N相同的数值
     * @param results   结果的二位数组
     * @param i         无需关心，默认0
     * @param set       无需关心，默认空数组，用于加速
     * @returns
     */
    public static integerBreak(n: number, m: number, max: number, results: number[][], i: number = 0, set: number[] = []) {
        if (set.length == 0 && results.length == 0) {
            results.push([]);
        }
        if (n == max && n != m) {
            i = 0;
            //console.log("\n");
        }
        if (n == 1) {
            //console.log("1 end1");
            results[results.length - 1].push(1);
            results.push([]);
            return;
        } else if (m == 1) {
            for (let j = 0; j < n - 1; j++) {
                //console.log("1+");
                results[results.length - 1].push(1);
            }
            //console.log("1 end2");
            results[results.length - 1].push(1);
            results.push([]);
            return;
        }
        if (n < m) {
            this.integerBreak(n, n, max, results, i, set);
        }
        if (n == m) {
            //console.log(n + " end3");
            results[results.length - 1].push(n);
            results.push([]);
            for (let j = 0; j < i; j++) {
                //console.log(set[j] + "+");
                results[results.length - 1].push(set[j]);
            }
            this.integerBreak(n, m - 1, max, results, i, set);
        }
        if (n > m) {
            //console.log(m + "+");
            results[results.length - 1].push(m);
            set[i++] = m;
            this.integerBreak(n - m, m, max, results, i, set);
            i--;
            for (let j = 0; j < i; j++) {
                //console.log(set[j] + "+");
                results[results.length - 1].push(set[j]);
            }
            this.integerBreak(n, m - 1, max, results, i, set);
        }
    }

    /**
     * 生成一个指定范围内的随机数，且与上一次的结果差别尽量大
     * @param min 最小值
     * @param max 最大值
     * @param lastValue 上一次生成的值，可选
     * @param minDiff 最小差值（与上一次的结果），可选
     */
 public static randomDistinct(min: number, max: number, lastValue?: number, minDiff: number = 30): number {
    let result: number;
    let tries = 0;
    do {
        result = Math.random() * (max - min) + min;
        tries++;
        // 如果没有lastValue，或差值足够大，或尝试次数太多就返回
        if (lastValue === undefined || Math.abs(result - lastValue) >= minDiff || tries > 10) {
            break;
        }
    } while (true);
    return Math.round(result * 100) / 100; // 保留两位小数
}
}
