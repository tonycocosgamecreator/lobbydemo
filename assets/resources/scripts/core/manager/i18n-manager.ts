import { Label } from "cc";
import I18NBase from "../i18n/i18n-base";
import { I18nResourceData } from "../i18n/i18n-resource-data";
import { Tools } from "../utils/tools";
import BaseManager from "./base-manager";
import { EDITOR } from "cc/env";
import { bDebug } from "../define";
import LanguageManager from "./language-manager";
import { isValid } from "cc";
import { format } from "../utils/string-utils";

export default class I18nManager extends BaseManager {
    public static KEY = 'I18nManager';
    public static BundleName = 'resources';

    public static clear() {}

    /**
     * 加载自己的本地存档
     * 不需要自己主动调用，会在注册时调用一次，或者在重置存档的时候回调
     * 会在init方法后被调用
     */
    public static loadRecord() {}
    /**
     * 存档
     * 此方法时一个protected的，所以，所有的存档操作都需要在manager内部处理，请勿在view中调用
     * 调用方式应该是,xxxManager.xxxx()->这个方法改变了一些需要存档的东西，主动触发存档操作
     */
    protected static saveRecord() {}
    

    //====================================全局方法===================================//
        /**
     * 所有注册到这里的i18n管理器
     */
    protected static _i18ns: { [name: string]: I18NBase } = {};

    /**
     * 所有的i18n配置文件
     */
    protected static _i18nResources: { [name: string]: I18nResourceData } = {};

    /**
     * 缓存已经分析过的数据，避免疯狂的遍历
     */ 
    protected static _cache_panel_label_datas : {[panelName : string] : { [labelName: string]: I18nResourceData }} = {};

    /**
     * 注册新的i18n资源
     * @param datas 
     */
    public static registerI18nResourceDatas(datas: { [name: string]: I18nResourceData }) {
        Tools.forEachMap(datas, (k, data) => {  
            this._i18nResources[k] = data;
        });
    }

    /**
     * 从指定的配置表中获取和指定界面相关的所有Label的数据
     * @param viewName
     */
    public static getAllI18NLabalDatasInPanel(viewName: string): { [labelName: string]: I18nResourceData } {
        if(this._cache_panel_label_datas[viewName]){
            return this._cache_panel_label_datas[viewName];
        }
        const result: { [labelName: string]: I18nResourceData } = {};
        //console.log('this._i18nResources = ',this._i18nResources);
        Tools.forEachMap(this._i18nResources, (k, data) => {
            if (data.panelName != viewName) {
                return;
            }
            result[data.nodeName] = data;
        });
        this._cache_panel_label_datas[viewName] = result;
        return result;
    }

    /**
     * 注册
     * @param obj
     */
    public static registerI18N<T extends I18NBase>(obj: T) {
        this._i18ns[obj.rootName] = obj;
    }
    /**
     * 反注册
     * @param rootName
     */
    public static unregisterI18N(rootName: string) {
        delete this._i18ns[rootName];
    }

    /**
     * 手动将指定的label切换到指定的语言
     * @param label
     * @param i18nId
     */
    public static handChangeLabelText(label: Label, i18nId: string) {
        if (EDITOR) {
            //Editor模式下不可用
            return;
        }
        const data = this._i18nResources[i18nId];
        if (!data) {
            bDebug && console.error('错误，无法在多语言配置表中找到对应id的内容：', label.node.name, i18nId);
            return;
        }
        label.string = data[LanguageManager.languageKey];
    }

    /**
     * 根据当前的语言，返回指定id的文档的内容
     * @param i18nId
     */
    public static getText(i18nId: string,...args: Array<string | number>): string {
        let data = this._i18nResources[i18nId];
        if (!data) {
            console.error('错误，无法在多语言配置表中找到对应id的内容：', i18nId);
            return '';
        }
        if (args && args.length > 0) {
            //如果有参数，则进行格式化
            return format(data[LanguageManager.languageKey], ...args);
        }
        return data[LanguageManager.languageKey];
    }

    /**
     * 根据当前的语言，返回指定id的文档的内容（支持对象参数替换）
     * @param i18nId
     * @param params 对象参数，如 {aaa:"xxx", bbb:"yyy"} 
     * @ 语言包中可以使用 hi!! {aaa} , wellcom {bbb}  !! 的形式
     */
    public static getTextWithParams(i18nId: string, params: Record<string, string | number>): string {
        let data = this._i18nResources[i18nId];
        if (!data) {
            console.error('错误，无法在多语言配置表中找到对应id的内容：', i18nId);
            return '';
        }
        let text = data[LanguageManager.languageKey];
        if (params) {
            text = text.replace(/\{(\w+)\}/g, (match, key) => {
                return params[key] !== undefined ? String(params[key]) : match;
            });
        }
        return text;
    }
    
    /**
     * 更新指定module的语言配置
     * 当多语言资源加载完毕后，会主动调用
     * @param moduleName 
     */
    public static updateTargetModule(moduleName : string){
        const language      = LanguageManager.languageKey;
        Tools.forEachMap(this._i18ns, (k, root) => {
            if (!isValid(root) || !isValid(root.node)) {
                //这个已经没用了，但是写代码的人没有销毁
                delete this._i18ns[k];
                return;
            }
            if(root.bundleName != moduleName){
                //只能更新属于这个bundle的对象
                return;
            }
            root.onLanguageChange(language);
        });
    }
}
