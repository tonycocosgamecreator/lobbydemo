import * as cc from 'cc';
/**
 * 异步等待的信息
 */
export declare type AsyncWaitInfo = {
    /**
     * 作为打印输出调试，可以是任意你需要的名字
     */
    name : string;

    /**
     * 是否达到了你想要的结果，达到后请设置为true
     */
    isCompleted : boolean;
    /**
     * 是否成功，如果成功，则设置为true
     */
    isSuccess : boolean;
    /**
     * 是否超时，如果超时，则设置为true
     * 如果你不设置这个值，则默认是false
     * 如果你设置了这个值，则在超时后会自动设置isCompleted为true,isSuccess为false
     */
    isTimeOut : boolean;
    /**
     * 你希望多少帧检测一次结果。默认为1
     */
    checkFrameCount? : number;
    /**
     * 这个是你自己需要传递到其他地方的参数,或者你需要自己判定是否成功的参数
     */
    args? : any;
    /**
     * 绑定的节点，如果不传递，则默认没有
     * 如果你不绑定节点，你需要自己在合适的地方，销毁这个异步状态
     * 设置isCompleted为true，或者销毁节点都可以
     */
    bindNode? : cc.Node;
    /**
     * 超时时间，如果超时，则自动设置isCompleted为true,isSuccess为false 单位毫秒 ms
     */
    timeout? : number;
}