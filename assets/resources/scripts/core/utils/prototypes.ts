interface Number {
    add: (num: number) => number;
    sub: (num: number) => number;
    mul: (num: number) => number;
    div: (num: number) => number;
}

Number.prototype.add = function (arg: number) {
    return floatAdd(this.valueOf(), arg);
}
Number.prototype.sub = function (arg: number) {
    return floatSub(this.valueOf(), arg);
}
Number.prototype.mul = function (arg: number) {
    return floatMul(this.valueOf(), arg);
}
Number.prototype.div = function (arg: number) {
    return floatDiv(this.valueOf(), arg);
}


function floatAdd(arg1: number, arg2: number): number {
    if (arg2 < 0) return floatSub(arg1, -arg2);
    let r1 = _getLength(arg1), r2 = _getLength(arg2), m;
    m = Math.pow(10, Math.max(r1, r2));
    return parseFloat(((arg1 * m + arg2 * m) / m).toFixed(2));
}

//减
function floatSub(arg1: number, arg2: number): number {
    if (arg2 < 0) return floatAdd(arg1, -arg2);
    let r1 = _getLength(arg1), r2 = _getLength(arg2), m, n;
    m = Math.pow(10, Math.max(r1, r2));
    //动态控制精度长度
    n = (r1 >= r2) ? r1 : r2;
    return parseFloat(((arg1 * m - arg2 * m) / m).toFixed(2));
}

//乘
function floatMul(arg1: number, arg2: number) {
    let m = _getLength(arg1) + _getLength(arg2), s1 = arg1.toString(), s2 = arg2.toString();
    return parseFloat((Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)).toFixed(2));
}


//除
function floatDiv(arg1: number, arg2: number) {
    let t1 = _getLength(arg1), t2 = _getLength(arg2), r1, r2;
    r1 = Number(arg1.toString().replace(".", ""));
    r2 = Number(arg2.toString().replace(".", ""));
    return parseFloat(((r1 / r2) * Math.pow(10, t2 - t1)).toFixed(2));
}

function _getLength(arg: number) {
    let length = 0;
    try {
        length = arg.toString().split(".")[1].length
    } catch (e) {
        length = 0
    }
    return length;
}

