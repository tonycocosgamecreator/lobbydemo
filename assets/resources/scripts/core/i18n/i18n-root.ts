import { _decorator, Sprite, SpriteFrame, Enum, error, Label } from 'cc';
import { EDITOR } from 'cc/env';
import I18NBase from './i18n-base';
import { Tools } from '../utils/tools';
import { bDebug } from '../define';
import { getLanguageIndexByKey, LanguageIndex, LanguageKey } from '../../auto/i18n-define';
import { I18nResourceData } from './i18n-resource-data';
import DbManager from '../manager/db-manager';
import I18nManager from '../manager/i18n-manager';
import LanguageManager from '../manager/language-manager';
import ModuleManager from '../manager/module-manager';
import { RichText } from 'cc';



const { ccclass, property, executeInEditMode } = _decorator;

declare type I18NLabelInfo = {
    data: I18nResourceData;
    label: Label;
};

declare type I18NSpriteInfo = {
    data: I18nResourceData;
    sprite: Sprite;
};

declare type I18NRichTextInfo = {
    data: I18nResourceData;
    richText: RichText;
};

@ccclass('I18NRoot')
@executeInEditMode(true)
export class I18NRoot extends I18NBase {
    @property
    private _language: LanguageIndex = LanguageIndex.en_us;

    public get language(): LanguageIndex {
        return this._language;
    }
    @property(
        {
            type: Enum(LanguageIndex),
        }
    )
    public set language(val: LanguageIndex) {
        this._language = val;
        if (EDITOR) {
            //console.warn("1.切换到语言 ： ",val);
            this.onLanguageChange(LanguageKey[val]);
        }
    }

    /**
     * 当前作为根节点的名字
     */
    public rootName: string;
    /**
     * 所在bundle的名字
     */
    public bundleName: string;

    /**
     * 当前界面下，所有需要被i18n控制的label
     */
    private _i18n_labels: { [name: string]: I18NLabelInfo } = {};
    /**
     * 当前界面下，所有需要被i18n控制的Sprite
     */
    private _i18n_sprites: { [name: string]: I18NSpriteInfo } = {};
    /**
     * 当前界面下，所有需要被i18n控制的RichText
     */
    private _i18n_richTexts: { [name: string]: I18NRichTextInfo } = {};

    protected onLoad(): void {


        this.rootName = this.node.name;
        if (EDITOR) {
            
        } else {
            //this._init();
        }
    }

    protected onDestroy(): void {
        I18nManager.unregisterI18N(this.rootName);
    }

    /**
     * 初始化
     */
    public init(VIEW_NAME: string) {
        this.rootName = VIEW_NAME;
        const pIndex = LanguageManager.language;
        this.language = pIndex >= 0 ? pIndex : LanguageIndex.en_us;
        const labels = this.getComponentsInChildren(Label);
        const datas = I18nManager.getAllI18NLabalDatasInPanel(this.rootName);
        //console.log(this.rootName + '->所有的datas：', datas);
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            const name = label.node.name;
            const data = datas[name];
            if (data) {
                label.cacheMode = Label.CacheMode.BITMAP;
                this._i18n_labels[name] = {
                    data: data,
                    label: label,
                };
            }
        }

        const sprites = this.getComponentsInChildren(Sprite);
        for (let i = 0; i < sprites.length; i++) {
            const sp = sprites[i];
            const name = sp.node.name;
            const data = datas[name];
            if (data) {
                this._i18n_sprites[name] = {
                    data: datas[name],
                    sprite: sp,
                };
            }
        }

        const richTexts = this.getComponentsInChildren(RichText);
        for (let i = 0; i < richTexts.length; i++) {
            const richText = richTexts[i];
            const name = richText.node.name;
            const data = datas[name];
            if (data) {
                this._i18n_richTexts[name] = {
                    data: data,
                    richText: richText,
                };
            }
        }

        I18nManager.registerI18N(this);
        const lp = LanguageKey[this.language];
        if(lp != LanguageKey[LanguageIndex.en_us]){
            this.onLanguageChange(lp);
        }
    }

    /**
     * 
     * @param name 更新当前所属的bundle的名字
     */
    public updateBundleName(name: string) {
        this.bundleName = name;
        // Tools.forEachMap(this._i18n_sprites,(k,v)=>{
        //     v.updateBundleName(name);
        // });
    }

    //====================================实现父类方法=================================//
    /**
     * 管理器主动回调，切换当前的语言
     * @param language
     */
    onLanguageChange(language: string): void {
        //bDebug && console.warn('change language to ', language);
        if (language == '') {
            //未知语言直接显示英文
            language = resourcesDb.I18N_LANGUAGE_CONFIG_DB_ID.en_us;
        }
        //console.warn(this.node.name + ' -> : 所有需要关注的label：', this._i18n_labels);
        //1.修改所有的label
        Tools.forEachMap(this._i18n_labels, (name, info) => {
            const label = info.label;
            const data = info.data;
            const text = data[language];
            //bDebug && console.log('change label [' + name + '] content to ：', text);
            if (!text) {
                bDebug && error('language does not supported ', language);
                return;
            }

            label.string = text as string;
            //label.updateRenderData(true);
        });

        //2.修改所有的richText
        Tools.forEachMap(this._i18n_richTexts, (name, info) => {
            const richText = info.richText;
            const data = info.data;
            const text = data[language];
            //bDebug && console.log('change richText [' + name + '] content to ：', text);
            if (!text) {
                bDebug && error('language does not supported ', language);
                return;
            }

            richText.string = text as string;
            //bDebug && console.log('change richText [' + name + '] content to ：', richText.string);
            //richText.updateRenderData(true);
        });

        const module = ModuleManager.getModuleAlreadyExist(this.bundleName);
        //更新所有的Sprite
        Tools.forEachMap(this._i18n_sprites, (k, v) => {
            if (v && v.sprite.isValid) {
                const data = v.data;
                const spfPath = data[LanguageKey[LanguageIndex.en_us]];
                if (spfPath && spfPath != '') {
                    const url = 'i18n/' + language + '/' + spfPath;
                    const spf = module.getSpriteFrame(url);
                    if(spf){
                        v.sprite.spriteFrame = spf;
                    }else{
                        console.error('can not fount sprite [' + v.sprite.node.name + '] in i18n spriteFrame url in' + language + ', url : ' + url);
                    }
                } else {
                    console.error('can not fount sprite [' + v.sprite.node.name + '] in i18n spriteFrame url in en_us!');
                }
            }
        });
    }

    //====================================编辑器相关===================================//
}
