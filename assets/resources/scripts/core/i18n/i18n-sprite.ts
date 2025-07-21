import { _decorator, Component, Node, Sprite } from 'cc';
import I18NBase from './i18n-base';
import { bDebug } from '../define';
import ModuleManager from '../manager/module-manager';
const { ccclass, property,executeInEditMode } = _decorator;


@ccclass('I18NSprite')
@executeInEditMode(true)
export class I18NSprite extends I18NBase {
    rootName: string;

    bundleName: string;

    private _sp: Sprite | null = null;


    protected onLoad(): void {
        this._sp = this.getComponent(Sprite);
        if (!this._sp) {
            bDebug &&  console.error('你想采用图片形式的I18N，但是你为啥没有Sprite组件？');
            return;
        }
        console.log('找到一张i18n的图：',this._sp.spriteFrame.name);
        this.onLanguageChange('');
    }
    /**
     * 获取当前的sprite对象
     */
    public get sprite(){
        if(!this._sp){
            this._sp = this.getComponent(Sprite);
        }
        return this._sp;
    }

    onLanguageChange(language: string): void {
        const oldSpf    = this.sprite.spriteFrame;
        if(!oldSpf || this.bundleName == ''){
            return;
        }
        const spfName   = oldSpf.name;
        const module    = ModuleManager.getModuleAlreadyExist(this.bundleName);
        if(!module){
            return;
        }
        const spf   = module.getSpriteFrame('i18n/' + language + '/' + spfName);
        if(!spf){
            return;
        }
        bDebug && console.warn('切换图片的多语言：',spfName);
        this.sprite.spriteFrame = spf;
    }

    updateBundleName(name: string) {
        this.bundleName = name;
    }
}
