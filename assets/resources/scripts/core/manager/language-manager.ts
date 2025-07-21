import { LanguageIndex, LanguageKey, serverLanguageKeyToLocal } from "../../auto/i18n-define";
import BaseManager from "./base-manager";

export default class LanguageManager extends BaseManager {
    public static KEY = 'LanguageManager';
    public static BundleName = 'resources';
    
    /**
     * 当前语言编号
     */
    protected static _language : LanguageIndex = LanguageIndex.en_us;
    /**
     * 获取当前语言的索引
     */
    public static get language() : LanguageIndex {
        return this._language;
    }
    /**
     * 设置当前语言的索引
     */
    public static set language(val : LanguageIndex) {
        this._language = val;
    }
    /**
     * 获取当前语言的key
     * 这个key用于在配置表中读取i18n的资源
     * en_us/hi_in/pt_br ...
     */
    public static get languageKey() : string {
        return LanguageKey[this._language];
    }
}
