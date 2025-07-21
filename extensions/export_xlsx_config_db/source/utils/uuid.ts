const BASE64_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const values = new Array(123); // max char code in base64Keys
for (let i = 0; i < 123; ++i) { values[i] = 64; } // fill with placeholder('=') index
for (let i = 0; i < 64; ++i) { values[BASE64_KEYS.charCodeAt(i)] = i; }

// decoded value indexed by base64 char code
const BASE64_VALUES = values;

const HexChars = '0123456789abcdef'.split('');

const _t = ['', '', '', ''];
const UuidTemplate = _t.concat(_t, '-', _t, '-', _t, '-', _t, '-', _t, _t, _t);
const Indices = UuidTemplate.map((x, i) => x === '-' ? NaN : i).filter(isFinite);

// const uuid = 'fcmR3XADNLgJ1ByKhqcC5Z';
// const originalUuid = decodeUuid(uuid); // fc991dd7-0033-4b80-9d41-c8a86a702e59

function _decodeUuid(base64) {
    const strs = base64.split('@');
    const uuid = strs[0];
    if (uuid.length !== 22) {
        return base64;
    }
    UuidTemplate[0] = base64[0];
    UuidTemplate[1] = base64[1];
    for (let i = 2, j = 2; i < 22; i += 2) {
        const lhs = BASE64_VALUES[base64.charCodeAt(i)];
        const rhs = BASE64_VALUES[base64.charCodeAt(i + 1)];
        UuidTemplate[Indices[j++]] = HexChars[lhs >> 2];
        UuidTemplate[Indices[j++]] = HexChars[((lhs & 3) << 2) | rhs >> 4];
        UuidTemplate[Indices[j++]] = HexChars[rhs & 0xF];
    }
    return base64.replace(uuid, UuidTemplate.join(''));
}

let HexMap = {}
{
    for (let i = 0; i < HexChars.length; i++) {
        let char = HexChars[i]
        HexMap[char] = i
    }
}
// 压缩uuid
function _compressUuid(fullUuid) {
    const strs = fullUuid.split('@');
    const uuid = strs[0];
    if (uuid.length !== 36) {
        return fullUuid;
    }

    let zipUuid = []
    zipUuid[0] = uuid[0];
    zipUuid[1] = uuid[1];
    let cleanUuid = uuid.replace('-', '').replace('-', '').replace('-', '').replace('-', '')

    for (let i = 2, j = 2; i < 32; i += 3) {

        const left = HexMap[String.fromCharCode(cleanUuid.charCodeAt(i))];
        const mid = HexMap[String.fromCharCode(cleanUuid.charCodeAt(i + 1))];
        const right = HexMap[String.fromCharCode(cleanUuid.charCodeAt(i + 2))];

        zipUuid[j++] = BASE64_KEYS[(left << 2) + (mid >> 2)]
        zipUuid[j++] = BASE64_KEYS[((mid & 3) << 4) + right]
    }
    return fullUuid.replace(uuid, zipUuid.join(''));
}

/**
 * https://forum.cocos.org/t/uuid/96047
 * 直接使用cocos论坛的算法
 */
export default class Uuid {
    static compressUuid(uuid) {
        return _compressUuid(uuid);
    }
    static decompressUuid(uuid) {
        return _decodeUuid(uuid);
    }
}