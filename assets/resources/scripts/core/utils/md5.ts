/*

TypeScript Md5
==============

Based on work by
* Joseph Myers: http://www.myersdaily.org/joseph/javascript/md5-text.html
* André Cruz: https://github.com/satazor/SparkMD5
* Raymond Hill: https://github.com/gorhill/yamd5.js

Effectively a TypeScrypt re-write of Raymond Hill JS Library

The MIT License (MIT)

Copyright (C) 2014 Raymond Hill

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.



            DO WHAT YOU WANT TO PUBLIC LICENSE
                    Version 2, December 2004

 Copyright (C) 2015 André Cruz <amdfcruz@gmail.com>

 Everyone is permitted to copy and distribute verbatim or modified
 copies of this license document, and changing it is allowed as long
 as the name is changed.

            DO WHAT YOU WANT TO PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. You just DO WHAT YOU WANT TO.


*/

interface HasherState {
  buffer: string;
  buflen: number;
  length: number;
  state: number[];
}

const EMPTY_STATE = new Int32Array(4);

export class Md5 {
  /**
   * Hash a UTF-8 string on the spot
   * @param str String to hash
   * @param raw Whether to return the value as an `Int32Array`
   */
  public static hashStr(str: string, raw?: false): string;
  public static hashStr(str: string, raw: true): Int32Array;
  public static hashStr(str: string, raw: boolean = false) {
      return this.onePassHasher.start().appendStr(str).end(raw);
  }

  /**
   * Hash a ASCII string on the spot
   * @param str String to hash
   * @param raw Whether to return the value as an `Int32Array`
   */
  public static hashAsciiStr(str: string, raw?: false): string;
  public static hashAsciiStr(str: string, raw: true): Int32Array;
  public static hashAsciiStr(str: string, raw: boolean = false) {
      return this.onePassHasher.start().appendAsciiStr(str).end(raw);
  }
  // Private Static Variables
  private static stateIdentity = new Int32Array([
      1732584193, -271733879, -1732584194, 271733878,
  ]);
  private static buffer32Identity = new Int32Array([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
  private static hexChars = '0123456789abcdef';
  private static hexOut: string[] = [];

  // Permanent instance is to use for one-call hashing
  private static onePassHasher = new Md5();

  private static _hex(x: Int32Array): string {
      const hc = Md5.hexChars;
      const ho = Md5.hexOut;
      let n;
      let offset;
      let j;
      let i;

      for (i = 0; i < 4; i += 1) {
          offset = i * 8;
          n = x[i];
          for (j = 0; j < 8; j += 2) {
              ho[offset + 1 + j] = hc.charAt(n & 0x0f);
              n >>>= 4;
              ho[offset + 0 + j] = hc.charAt(n & 0x0f);
              n >>>= 4;
          }
      }
      return ho.join('');
  }

  private static _md5cycle(
      x: Int32Array | Uint32Array,
      k: Int32Array | Uint32Array,
  ) {
      let a = x[0];
      let b = x[1];
      let c = x[2];
      let d = x[3];
      // ff()
      a += (((b & c) | (~b & d)) + k[0] - 680876936) | 0;
      a = (((a << 7) | (a >>> 25)) + b) | 0;
      d += (((a & b) | (~a & c)) + k[1] - 389564586) | 0;
      d = (((d << 12) | (d >>> 20)) + a) | 0;
      c += (((d & a) | (~d & b)) + k[2] + 606105819) | 0;
      c = (((c << 17) | (c >>> 15)) + d) | 0;
      b += (((c & d) | (~c & a)) + k[3] - 1044525330) | 0;
      b = (((b << 22) | (b >>> 10)) + c) | 0;
      a += (((b & c) | (~b & d)) + k[4] - 176418897) | 0;
      a = (((a << 7) | (a >>> 25)) + b) | 0;
      d += (((a & b) | (~a & c)) + k[5] + 1200080426) | 0;
      d = (((d << 12) | (d >>> 20)) + a) | 0;
      c += (((d & a) | (~d & b)) + k[6] - 1473231341) | 0;
      c = (((c << 17) | (c >>> 15)) + d) | 0;
      b += (((c & d) | (~c & a)) + k[7] - 45705983) | 0;
      b = (((b << 22) | (b >>> 10)) + c) | 0;
      a += (((b & c) | (~b & d)) + k[8] + 1770035416) | 0;
      a = (((a << 7) | (a >>> 25)) + b) | 0;
      d += (((a & b) | (~a & c)) + k[9] - 1958414417) | 0;
      d = (((d << 12) | (d >>> 20)) + a) | 0;
      c += (((d & a) | (~d & b)) + k[10] - 42063) | 0;
      c = (((c << 17) | (c >>> 15)) + d) | 0;
      b += (((c & d) | (~c & a)) + k[11] - 1990404162) | 0;
      b = (((b << 22) | (b >>> 10)) + c) | 0;
      a += (((b & c) | (~b & d)) + k[12] + 1804603682) | 0;
      a = (((a << 7) | (a >>> 25)) + b) | 0;
      d += (((a & b) | (~a & c)) + k[13] - 40341101) | 0;
      d = (((d << 12) | (d >>> 20)) + a) | 0;
      c += (((d & a) | (~d & b)) + k[14] - 1502002290) | 0;
      c = (((c << 17) | (c >>> 15)) + d) | 0;
      b += (((c & d) | (~c & a)) + k[15] + 1236535329) | 0;
      b = (((b << 22) | (b >>> 10)) + c) | 0;
      // gg()
      a += (((b & d) | (c & ~d)) + k[1] - 165796510) | 0;
      a = (((a << 5) | (a >>> 27)) + b) | 0;
      d += (((a & c) | (b & ~c)) + k[6] - 1069501632) | 0;
      d = (((d << 9) | (d >>> 23)) + a) | 0;
      c += (((d & b) | (a & ~b)) + k[11] + 643717713) | 0;
      c = (((c << 14) | (c >>> 18)) + d) | 0;
      b += (((c & a) | (d & ~a)) + k[0] - 373897302) | 0;
      b = (((b << 20) | (b >>> 12)) + c) | 0;
      a += (((b & d) | (c & ~d)) + k[5] - 701558691) | 0;
      a = (((a << 5) | (a >>> 27)) + b) | 0;
      d += (((a & c) | (b & ~c)) + k[10] + 38016083) | 0;
      d = (((d << 9) | (d >>> 23)) + a) | 0;
      c += (((d & b) | (a & ~b)) + k[15] - 660478335) | 0;
      c = (((c << 14) | (c >>> 18)) + d) | 0;
      b += (((c & a) | (d & ~a)) + k[4] - 405537848) | 0;
      b = (((b << 20) | (b >>> 12)) + c) | 0;
      a += (((b & d) | (c & ~d)) + k[9] + 568446438) | 0;
      a = (((a << 5) | (a >>> 27)) + b) | 0;
      d += (((a & c) | (b & ~c)) + k[14] - 1019803690) | 0;
      d = (((d << 9) | (d >>> 23)) + a) | 0;
      c += (((d & b) | (a & ~b)) + k[3] - 187363961) | 0;
      c = (((c << 14) | (c >>> 18)) + d) | 0;
      b += (((c & a) | (d & ~a)) + k[8] + 1163531501) | 0;
      b = (((b << 20) | (b >>> 12)) + c) | 0;
      a += (((b & d) | (c & ~d)) + k[13] - 1444681467) | 0;
      a = (((a << 5) | (a >>> 27)) + b) | 0;
      d += (((a & c) | (b & ~c)) + k[2] - 51403784) | 0;
      d = (((d << 9) | (d >>> 23)) + a) | 0;
      c += (((d & b) | (a & ~b)) + k[7] + 1735328473) | 0;
      c = (((c << 14) | (c >>> 18)) + d) | 0;
      b += (((c & a) | (d & ~a)) + k[12] - 1926607734) | 0;
      b = (((b << 20) | (b >>> 12)) + c) | 0;
      // hh()
      a += ((b ^ c ^ d) + k[5] - 378558) | 0;
      a = (((a << 4) | (a >>> 28)) + b) | 0;
      d += ((a ^ b ^ c) + k[8] - 2022574463) | 0;
      d = (((d << 11) | (d >>> 21)) + a) | 0;
      c += ((d ^ a ^ b) + k[11] + 1839030562) | 0;
      c = (((c << 16) | (c >>> 16)) + d) | 0;
      b += ((c ^ d ^ a) + k[14] - 35309556) | 0;
      b = (((b << 23) | (b >>> 9)) + c) | 0;
      a += ((b ^ c ^ d) + k[1] - 1530992060) | 0;
      a = (((a << 4) | (a >>> 28)) + b) | 0;
      d += ((a ^ b ^ c) + k[4] + 1272893353) | 0;
      d = (((d << 11) | (d >>> 21)) + a) | 0;
      c += ((d ^ a ^ b) + k[7] - 155497632) | 0;
      c = (((c << 16) | (c >>> 16)) + d) | 0;
      b += ((c ^ d ^ a) + k[10] - 1094730640) | 0;
      b = (((b << 23) | (b >>> 9)) + c) | 0;
      a += ((b ^ c ^ d) + k[13] + 681279174) | 0;
      a = (((a << 4) | (a >>> 28)) + b) | 0;
      d += ((a ^ b ^ c) + k[0] - 358537222) | 0;
      d = (((d << 11) | (d >>> 21)) + a) | 0;
      c += ((d ^ a ^ b) + k[3] - 722521979) | 0;
      c = (((c << 16) | (c >>> 16)) + d) | 0;
      b += ((c ^ d ^ a) + k[6] + 76029189) | 0;
      b = (((b << 23) | (b >>> 9)) + c) | 0;
      a += ((b ^ c ^ d) + k[9] - 640364487) | 0;
      a = (((a << 4) | (a >>> 28)) + b) | 0;
      d += ((a ^ b ^ c) + k[12] - 421815835) | 0;
      d = (((d << 11) | (d >>> 21)) + a) | 0;
      c += ((d ^ a ^ b) + k[15] + 530742520) | 0;
      c = (((c << 16) | (c >>> 16)) + d) | 0;
      b += ((c ^ d ^ a) + k[2] - 995338651) | 0;
      b = (((b << 23) | (b >>> 9)) + c) | 0;
      // ii()
      a += ((c ^ (b | ~d)) + k[0] - 198630844) | 0;
      a = (((a << 6) | (a >>> 26)) + b) | 0;
      d += ((b ^ (a | ~c)) + k[7] + 1126891415) | 0;
      d = (((d << 10) | (d >>> 22)) + a) | 0;
      c += ((a ^ (d | ~b)) + k[14] - 1416354905) | 0;
      c = (((c << 15) | (c >>> 17)) + d) | 0;
      b += ((d ^ (c | ~a)) + k[5] - 57434055) | 0;
      b = (((b << 21) | (b >>> 11)) + c) | 0;
      a += ((c ^ (b | ~d)) + k[12] + 1700485571) | 0;
      a = (((a << 6) | (a >>> 26)) + b) | 0;
      d += ((b ^ (a | ~c)) + k[3] - 1894986606) | 0;
      d = (((d << 10) | (d >>> 22)) + a) | 0;
      c += ((a ^ (d | ~b)) + k[10] - 1051523) | 0;
      c = (((c << 15) | (c >>> 17)) + d) | 0;
      b += ((d ^ (c | ~a)) + k[1] - 2054922799) | 0;
      b = (((b << 21) | (b >>> 11)) + c) | 0;
      a += ((c ^ (b | ~d)) + k[8] + 1873313359) | 0;
      a = (((a << 6) | (a >>> 26)) + b) | 0;
      d += ((b ^ (a | ~c)) + k[15] - 30611744) | 0;
      d = (((d << 10) | (d >>> 22)) + a) | 0;
      c += ((a ^ (d | ~b)) + k[6] - 1560198380) | 0;
      c = (((c << 15) | (c >>> 17)) + d) | 0;
      b += ((d ^ (c | ~a)) + k[13] + 1309151649) | 0;
      b = (((b << 21) | (b >>> 11)) + c) | 0;
      a += ((c ^ (b | ~d)) + k[4] - 145523070) | 0;
      a = (((a << 6) | (a >>> 26)) + b) | 0;
      d += ((b ^ (a | ~c)) + k[11] - 1120210379) | 0;
      d = (((d << 10) | (d >>> 22)) + a) | 0;
      c += ((a ^ (d | ~b)) + k[2] + 718787259) | 0;
      c = (((c << 15) | (c >>> 17)) + d) | 0;
      b += ((d ^ (c | ~a)) + k[9] - 343485551) | 0;
      b = (((b << 21) | (b >>> 11)) + c) | 0;

      x[0] = (a + x[0]) | 0;
      x[1] = (b + x[1]) | 0;
      x[2] = (c + x[2]) | 0;
      x[3] = (d + x[3]) | 0;
  }

  private _dataLength = 0;
  private _bufferLength = 0;

  private _state: Int32Array = new Int32Array(4);
  private _buffer: ArrayBuffer = new ArrayBuffer(68);
  private _buffer8: Uint8Array;
  private _buffer32: Uint32Array;

  constructor() {
      this._buffer8 = new Uint8Array(this._buffer, 0, 68);
      this._buffer32 = new Uint32Array(this._buffer, 0, 17);
      this.start();
  }

  /**
   * Initialise buffer to be hashed
   */
  public start() {
      this._dataLength = 0;
      this._bufferLength = 0;
      this._state.set(Md5.stateIdentity);
      return this;
  }

  // Char to code point to to array conversion:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt
  // #Example.3A_Fixing_charCodeAt_to_handle_non-Basic-Multilingual-Plane_characters_if_their_presence_earlier_in_the_string_is_unknown

  /**
   * Append a UTF-8 string to the hash buffer
   * @param str String to append
   */
  public appendStr(str: string) {
      const buf8 = this._buffer8;
      const buf32 = this._buffer32;
      let bufLen = this._bufferLength;
      let code;
      let i;

      for (i = 0; i < str.length; i += 1) {
          code = str.charCodeAt(i);
          if (code < 128) {
              buf8[bufLen++] = code;
          } else if (code < 0x800) {
              buf8[bufLen++] = (code >>> 6) + 0xc0;
              buf8[bufLen++] = (code & 0x3f) | 0x80;
          } else if (code < 0xd800 || code > 0xdbff) {
              buf8[bufLen++] = (code >>> 12) + 0xe0;
              buf8[bufLen++] = ((code >>> 6) & 0x3f) | 0x80;
              buf8[bufLen++] = (code & 0x3f) | 0x80;
          } else {
              code =
                  (code - 0xd800) * 0x400 +
                  (str.charCodeAt(++i) - 0xdc00) +
                  0x10000;
              if (code > 0x10ffff) {
                  throw new Error(
                      'Unicode standard supports code points up to U+10FFFF',
                  );
              }
              buf8[bufLen++] = (code >>> 18) + 0xf0;
              buf8[bufLen++] = ((code >>> 12) & 0x3f) | 0x80;
              buf8[bufLen++] = ((code >>> 6) & 0x3f) | 0x80;
              buf8[bufLen++] = (code & 0x3f) | 0x80;
          }
          if (bufLen >= 64) {
              this._dataLength += 64;
              Md5._md5cycle(this._state, buf32);
              bufLen -= 64;
              buf32[0] = buf32[16];
          }
      }
      this._bufferLength = bufLen;
      return this;
  }

  /**
   * Append an ASCII string to the hash buffer
   * @param str String to append
   */
  public appendAsciiStr(str: string) {
      const buf8 = this._buffer8;
      const buf32 = this._buffer32;
      let bufLen = this._bufferLength;
      let i;
      let j = 0;

      for (;;) {
          i = Math.min(str.length - j, 64 - bufLen);
          while (i--) {
              buf8[bufLen++] = str.charCodeAt(j++);
          }
          if (bufLen < 64) {
              break;
          }
          this._dataLength += 64;
          Md5._md5cycle(this._state, buf32);
          bufLen = 0;
      }
      this._bufferLength = bufLen;
      return this;
  }

  /**
   * Append a byte array to the hash buffer
   * @param input array to append
   */
  public appendByteArray(input: Uint8Array) {
      const buf8 = this._buffer8;
      const buf32 = this._buffer32;
      let bufLen = this._bufferLength;
      let i;
      let j = 0;

      for (;;) {
          i = Math.min(input.length - j, 64 - bufLen);
          while (i--) {
              buf8[bufLen++] = input[j++];
          }
          if (bufLen < 64) {
              break;
          }
          this._dataLength += 64;
          Md5._md5cycle(this._state, buf32);
          bufLen = 0;
      }
      this._bufferLength = bufLen;
      return this;
  }

  /**
   * Get the state of the hash buffer
   */
  public getState(): HasherState {
      const s = this._state;

      return {
          buffer: String.fromCharCode.apply(null, Array.from(this._buffer8)),
          buflen: this._bufferLength,
          length: this._dataLength,
          state: [s[0], s[1], s[2], s[3]],
      };
  }

  /**
   * Override the current state of the hash buffer
   * @param state New hash buffer state
   */
  public setState(state: HasherState) {
      const buf = state.buffer;
      const x = state.state;
      const s = this._state;
      let i;

      this._dataLength = state.length;
      this._bufferLength = state.buflen;
      s[0] = x[0];
      s[1] = x[1];
      s[2] = x[2];
      s[3] = x[3];

      for (i = 0; i < buf.length; i += 1) {
          this._buffer8[i] = buf.charCodeAt(i);
      }
  }

  /**
   * Hash the current state of the hash buffer and return the result
   * @param raw Whether to return the value as an `Int32Array`
   */
  public end(raw: boolean = false): Int32Array | string {
      const bufLen = this._bufferLength;
      const buf8 = this._buffer8;
      const buf32 = this._buffer32;
      const i = (bufLen >> 2) + 1;

      this._dataLength += bufLen;
      const dataBitsLen = this._dataLength * 8;

      buf8[bufLen] = 0x80;
      buf8[bufLen + 1] = buf8[bufLen + 2] = buf8[bufLen + 3] = 0;
      buf32.set(Md5.buffer32Identity.subarray(i), i);

      if (bufLen > 55) {
          Md5._md5cycle(this._state, buf32);
          buf32.set(Md5.buffer32Identity);
      }

      // Do the final computation based on the tail and length
      // Beware that the final length may not fit in 32 bits so we take care of that
      if (dataBitsLen <= 0xffffffff) {
          buf32[14] = dataBitsLen;
      } else {
          const matches = dataBitsLen.toString(16).match(/(.*?)(.{0,8})$/);
          if (matches === null) return raw ? EMPTY_STATE : '';

          const lo = parseInt(matches[2], 16);
          const hi = parseInt(matches[1], 16) || 0;

          buf32[14] = lo;
          buf32[15] = hi;
      }

      Md5._md5cycle(this._state, buf32);

      return raw ? this._state : Md5._hex(this._state);
  }
}

if (Md5.hashStr('hello') !== '5d41402abc4b2a76b9719d911017c592') {
  throw new Error('Md5 self test failed.');
}