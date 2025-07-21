export interface I18nResourceData {
    /** 唯一id */
    index: string,
    /** 印地语 */
    hi_in: string,
    /** 英文 */
    en_us: string,
    /** 界面名字 */
    panelName: string,
    /** 节点名字 */
    nodeName: string,
    /**
     * 节点类型
     * 0：无意义，1：Label，2：Sprite 3: RichText
     */
    nodeType: number,
}