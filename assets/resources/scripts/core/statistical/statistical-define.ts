export enum StatisticalReportMessage {
    //界面打点
    PANEL_STATISTICAL   = 'PANEL_STATISTICAL',
    //按钮打点
    BUTTON_STATISTICAL  = 'BUTTON_STATISTICAL',
}

/**
 * 按钮打点信息
 */
export declare type GButtonStatisticalInfo = {
    /**
     * 按钮属于哪个界面
     */
    viewName: string;
    /**
     * 按钮的名字
     */
    buttonName: string;
    /**
     * 按钮属于哪一个bundle
     */
    bundleName : string;
    /**
     * 按钮的描述是什么
     */
    desc: string;
    /**
     * 按钮打点的ID
     */
    statisticalId : number;
};

export declare type PanelStatisticalInfo = {
    /**
     * 界面名字
     */
    viewName : string;
    /**
     * 所在包名
     */
    bundleName : string;
    /**
     * 界面描述
     */
    desc : string;
    /**
     * 界面打点ID
     */
    statisticalId : number;
}

/**
 * 定义一些埋点类型
 */
export enum StatisticalEvent {
    /**
     * 界面持续时间
     */
    VIEW_DURATION   = 'VIEW_DURATION',
    /**
     * 按钮点击
     */
    BUTTON_CLICK    = 'BUTTON_CLICK',
}