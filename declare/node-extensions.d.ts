import * as cc from 'cc';

declare module 'cc' {

	export interface Node {
        /**
         * 获取当前Node的x坐标
         */
        get x() : number;
        /**
         * 设置当前Node的x坐标
         */
        set x(val : number);
        /**
         * 获取y坐标
         */
        get y() : number;
        /**
         * 设置y坐标
         */
        set y(val : number);
        /**
         * 获取UITransform
         */
        get transform() : UITransform;
        /**
         * 获取宽度
         */
        get width() : number;
        /**
         * 设置宽度
         */
        set width(val : number);
        /**
         * 获取高度
         */
        get height() : number;
        /**
         * 设置高度
         */
        set height(val : number);
        /**
         * 获取透明度
         */
        get opacity() : number;
        /**
         * 设置透明度
         */
        set opacity(val : number);
    }
}
