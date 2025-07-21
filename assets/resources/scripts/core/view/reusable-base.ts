import { Component, Prefab, _decorator } from 'cc';
import IReusable from './ireusable';
import ViewBase from './view-base';

const { ccclass, property } = _decorator;
/**
 * 可复用对象（用于模板）
 */
@ccclass('ReusableBase')
export default abstract class ReusableBase extends ViewBase implements IReusable {
    //==========================需要自己实现的方法========================//
    /**
     * 被放回对象池的时候触发
     * 你需要在这个方法中写上自己销毁的逻辑
     */
    abstract unuse(): void;
    /**
     * 重复使用时，或者当第一次被初始化的时候，都会被调用
     * 你需要在这个方法中写上自己的初始化内容
     */
    abstract reuse(): void;
}
