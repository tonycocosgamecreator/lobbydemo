export class Base64 {
    private static _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    public static decode(input: string): string {
        let output = "";
        let chr1, chr2, chr3;
        let enc1, enc2, enc3, enc4;
        let i = 0;

        input = input.replace(/[^A-Za-z0-9+/=]/g, "");

        while (i < input.length) {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output += String.fromCharCode(chr1);

            if (enc3 !== 64) {
                output += String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
                output += String.fromCharCode(chr3);
            }
        }

        return output;
    }

    public static base64ToUint8Array(base64: string): Uint8Array {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let str = base64.replace(/=+$/, '');
        let output = [];

        for (let i = 0, buffer = 0, bits = 0; i < str.length; ++i) {
            const value = chars.indexOf(str.charAt(i));
            if (value === -1) continue;

            buffer = (buffer << 6) | value;
            bits += 6;

            if (bits >= 8) {
                bits -= 8;
                output.push((buffer >> bits) & 0xff);
            }
        }

        return new Uint8Array(output);
    }

}