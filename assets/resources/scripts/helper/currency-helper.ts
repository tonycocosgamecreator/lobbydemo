// CurrencyHelper.ts

export type Grouping = number[];

export interface NumberFormatSpec {
  grouping: Grouping;
  thousandSep: string;
  decimalSep: string;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  symbol?: string;
  useArabicIndicDigits?: boolean;
}

export class CurrencyHelper {
  private static readonly DEFAULT_SPEC: NumberFormatSpec = {
    grouping: [3],
    thousandSep: ",",
    decimalSep: ".",
    minFractionDigits: 2,
    maxFractionDigits: 2,
  };

  private static readonly CURRENCY_FORMAT_MAP: Record<string, NumberFormatSpec> = {
    // --- 美式/英联邦 ---
    USD: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "$" },
    GBP: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "£" },
    CAD: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "$" },
    AUD: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "$" },
    NZD: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "$" },
    HKD: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "$" },
    SGD: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "$" },

    // --- 欧陆（空格 + 逗号）---
    EUR: { grouping: [3], thousandSep: " ", decimalSep: ",", symbol: "€" },
    RUB: { grouping: [3], thousandSep: " ", decimalSep: ",", symbol: "₽" },
    PLN: { grouping: [3], thousandSep: " ", decimalSep: ",", symbol: "zł" },
    SEK: { grouping: [3], thousandSep: " ", decimalSep: ",", symbol: "kr" },
    NOK: { grouping: [3], thousandSep: " ", decimalSep: ",", symbol: "kr" },
    HUF: { grouping: [3], thousandSep: " ", decimalSep: ",", symbol: "Ft" },

    // --- 德语系/拉美 ---
    BRL: { grouping: [3], thousandSep: ".", decimalSep: ",", symbol: "R$" },
    ARS: { grouping: [3], thousandSep: ".", decimalSep: ",", symbol: "$" },
    CLP: { grouping: [3], thousandSep: ".", decimalSep: ",", symbol: "$" },
    IDR: { grouping: [3], thousandSep: ".", decimalSep: ",", symbol: "Rp" },
    CHF: { grouping: [3], thousandSep: "’", decimalSep: ".", symbol: "Fr" },

    // --- 亚洲 ---
    CNY: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "¥" },
    TWD: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "NT$" },
    JPY: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "¥" },
    KRW: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "₩" },
    THB: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "฿" },
    VND: { grouping: [3], thousandSep: ",", decimalSep: ".", symbol: "₫" },

    // --- 印度制 ---
    INR: { grouping: [3, 2], thousandSep: ",", decimalSep: ".", symbol: "₹" },
    LKR: { grouping: [3, 2], thousandSep: ",", decimalSep: ".", symbol: "Rs" },
    BDT: { grouping: [3, 2], thousandSep: ",", decimalSep: ".", symbol: "৳" },
    PKR: { grouping: [3, 2], thousandSep: ",", decimalSep: ".", symbol: "Rs" },
    NPR: { grouping: [3, 2], thousandSep: ",", decimalSep: ".", symbol: "Rs" },

    // --- 阿拉伯语区 ---
    SAR: { grouping: [3], thousandSep: "٬", decimalSep: "٫", symbol: "ر.س", useArabicIndicDigits: true },
    AED: { grouping: [3], thousandSep: "٬", decimalSep: "٫", symbol: "د.إ", useArabicIndicDigits: true },
    EGP: { grouping: [3], thousandSep: "٬", decimalSep: "٫", symbol: "ج.م", useArabicIndicDigits: true },
  };

  /** 获取货币格式定义 */
  static getFormatSpec(currencyCode: string): NumberFormatSpec {
    return this.CURRENCY_FORMAT_MAP[currencyCode.toUpperCase()] || this.DEFAULT_SPEC;
  }

  /** 格式化金额为指定货币样式 */
  static format(
    value: number,
    currencyCode: string,
    options?: {
      showSymbol?: boolean;
      symbolPosition?: "prefix" | "suffix";
      minFractionDigits?: number;
      maxFractionDigits?: number;
    }
  ): string {
    const spec = this.getFormatSpec(currencyCode);
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    const minFrac = options?.minFractionDigits ?? spec.minFractionDigits ?? 2;
    const maxFrac = options?.maxFractionDigits ?? spec.maxFractionDigits ?? minFrac;

    const fixed = absValue.toFixed(maxFrac);
    let [intPart, fracPart = ""] = fixed.split(".");

    const groupedInt = this.groupInteger(intPart, spec.grouping, spec.thousandSep);
    let formatted = fracPart ? `${groupedInt}${spec.decimalSep}${fracPart}` : groupedInt;

    if (spec.useArabicIndicDigits) formatted = this.toArabicIndicDigits(formatted);

    if (options?.showSymbol && spec.symbol) {
      formatted =
        options.symbolPosition === "suffix"
          ? `${formatted} ${spec.symbol}`
          : `${spec.symbol} ${formatted}`;
    }

    return isNegative ? `-${formatted}` : formatted;
  }

  /** 将整数部分按分组规则插入千位分隔符 */
  private static groupInteger(intStr: string, grouping: Grouping, sep: string): string {
    if (intStr.length <= grouping[0]) return intStr;

    const result: string[] = [];
    let i = intStr.length;

    result.unshift(intStr.slice(i - grouping[0], i));
    i -= grouping[0];
    const repeatSize = grouping.length > 1 ? grouping[1] : grouping[0];

    while (i > 0) {
      const start = Math.max(0, i - repeatSize);
      result.unshift(intStr.slice(start, i));
      i = start;
    }

    return result.join(sep);
  }

  /** 数字转为阿拉伯-印度数字字符 */
  private static toArabicIndicDigits(input: string): string {
    const map = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
    return input.replace(/\d/g, d => map[Number(d)]);
  }
}
