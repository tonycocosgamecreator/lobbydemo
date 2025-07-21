import { Component } from 'cc';
//@ccclass('I18NBase')
export default abstract class I18NBase extends Component {
    /**
     * 根节点名字（仅i18n-root才会获得）
     */
    abstract rootName: string;
    /**
     * 所在bundle的名字
     */
    abstract bundleName: string;

    /**
     * 当语言环境发生变化的时候回调
     * @param language
     */
    abstract onLanguageChange(language: string): void;
    /**
     *
     * @param name 更新bundle信息
     */
    abstract updateBundleName(name: string): void;
}
