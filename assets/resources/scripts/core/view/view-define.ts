import { EmptyCallback } from "../define";

export enum PanelLayer {
    /**
     * 默认的面板
     */
    Default = 'Default',
    /**
     * 弹窗
     */
    Dialog = 'Dialog',
    /**
     * 顶部UI（例如加载页）
     */
    Top = 'Top',
    /**
     * 提示信息
     */
    Tips = 'Tips',
}

export enum ViewOpenAnimationType {
    NONE,
    /**
     * 使用bg这个节点，从底部出现，停留在底部
     * 1.确保bg | cc_bg节点的anchorPoint为(0.5,0)
     */
    BOTTOM_TO_UP_STAY_BOTTOM,
    /**
     *
     * 从底部滑行到 中心位置
     * 1.确保bg | cc_bg节点的anchorPoint为(0.5,0.5)
     */
    BOTTOM_TO_CENTER,
    /**
     * 从右边进来，并且停靠在最右边
     * 1.确保bg | cc_bg节点的anchorPoint为(1,0.5)
     */
    RIGHT_ENTER_AND_STAY_RIGHT_SIDE,
    /**
     * 右边进入，并且停靠在中间位置
     */
    RIGHT_ENTER_AND_STAY_CENTER,
    /**
     * 从左边进来，并且停靠在最左边
     * 1.确保bg | cc_bg节点的anchorPoint为(0,0.5)
     */
    LEFT_ENTER_AND_STAY_LEFT_SIDE,
   /**
     * 左边进入，并且停靠在中间位置
     */
    LEFT_ENTER_AND_STAY_CENTER,
    /**
     * 从中间缩放出现
     */ 
    CENTER_SCALE_IN,
}

/**
 * 按钮的点击效果
 */
export enum GButtonTouchStyle {
    /**
     * 按下之后没有任何效果
     */
    NONE = 0,
    /**
     * 按下后缩小
     */
    SCALE_SMALLER,
    /**
     * 按下后放大
     */
    SCALE_LARGER,
    /**
     * 按下后改变透明度
     */
    UIOPACITY,
    /**
     * 切换一张图
     */
    CHANGE_SPRITE,
}

export enum GButtonDisableStyle {
    
    NONE    = 0,

    OPACITY = 1,
    /**
     * 你需要在button上新建一个mask
     */
    MASK,
    /**
     * 变灰
     */
    GREY,
    /**
     * 禁用模式换图
     */
    CHANGE_SPRITE,
}

export enum GButtonState {
    /**
     * 可用
     * 显示
     * 可点击
     */
    SHOW_ENABLE = 0,
    /**
     * 显示         .node.active = true;
     * 不可点击 -> isEnabled = false;
     */
    SHOW_DISABLE = 1,

    /**
     * 不显示
     * 不可点击
     */
    HIDE_DISABLE = 2,
}

/**
 * 弹出的确定/取消窗口的上下文定义
 */
export declare type UIConfirmContext = {
    /**确定的回调 */
    yesHandler: EmptyCallback;
    /**取消或者点击关闭的回调 */
    noHandler?: EmptyCallback;
    /**需要显示的内容 */
    value: string;
    /**可选 标题 */
    title?: string;
    /**
     * 是否不显示closebutton
     */
    bNotShowCloseButton?: boolean;
    /**
     * 是否单按钮模式（只有一个确认按钮）
     */
    bSingleButton?: boolean;
    /**
     * 按钮的title，可选
     * 0 : 确定按钮
     * 1 : 取消按钮
     */
    sButtonTitles?: string[];
};
/**
 * 按钮点击音效的配置
 */
export declare type GButtonClickSoundConfig = {
    /**
     * 哪一个bundle
     */
    bundleName: string;
    /**
     * 哪一个音效
     */
    audioName: string;
};