import { JSB } from 'cc/env';
import {bDebug, WaitTime } from '../define';
import BaseGlobal from '../message/base-global';
import { Net } from './net';

/**
 * 网络连接器基类
 * 1. 用于处理网络连接的基础类
 * 2. 链接发生错误，或者断开连接时，会清空当前对象中的websocket对象和所有缓存的数据，包括回调方法，需要重新初始化
 */
export default class WebSocketClient {
    private _tag: string = '[WebSocketClinet]';
    /**
     * 当前的ip
     */
    private _ip: string = '';
    /**
     * 当前的端口
     */
    private _port: string | null = null;
    /**
     * 当前的协议
     */
    private _protocol: Net.Type = Net.Type.wss;
    /**
     * 发送数据的队列
     */
    private _dataArr: any[] = [];
    /**
     * 网络链接超时时间，默认为10
     */
    public connectTimeOut: number = 10;

    /**
     * 当前的网络
     */
    private _ws: WebSocket | null = null;

    private _onOpen: (ev: Event) => void = null!;
    public set onOpen(value) {
        this._onOpen = value;
    }
    /**@description 网络连接成功 */
    public get onOpen() {
        return this._onOpen;
    }

    private _onClose: (ev: Net.CloseEvent) => void = null!;
    public set onClose(value: (ev: Net.CloseEvent) => void) {
        this._onClose = value;
    }
    /**@description 网络关闭 */
    public get onClose() {
        return this._onClose;
    }

    private _onMessage: (data: MessageEvent) => void = null!;
    public set onMessage(value: (data: MessageEvent) => void) {
        this._onMessage = value;
    }
    /**@description 接收网络数据 */
    public get onMessage() {
        return this._onMessage;
    }

    private _onError: (ev: Event) => void = null!;
    public set onError(value: (ev: Event) => void) {
        this._onError = value;
    }
    /**@description 网络连接错误 */
    public get onError() {
        return this._onError;
    }

    private _closeEvent: Net.CloseEvent | null = null;

    //=========================================公共方法==================================//
    private _lastReadyState : number = -1;
    public onLateUpdate(dt : number){
        if(!this._ws){
            return;
        }
        const state = this._ws.readyState;
        if(this._lastReadyState != state){
            this._lastReadyState = state;
            bDebug && console.log(this._tag,`onLateUpdate state : ${state}`);
        }
    }

    /**
     *
     * @param ip ip
     * @param port 端口
     */
    public async initWebSocket(ip: string, port: string | null, protocol: Net.Type = Net.Type.ws) {
        if (ip == undefined || ip == null || ip.length < 0) {
            if (bDebug) console.error(this._tag, `init websocket error ip : ${ip} port : ${port}`);
            return false;
        }
        if(this._ws){
            if(this.isConnected){
                bDebug && console.error(this._tag,`网络已经连接，不需要再次连接`);
                return true;
            }
            if(this._ws.readyState == WebSocket.CONNECTING){
                bDebug && console.error(this._tag,`网络正在连接中，不需要再次连接`);
                return false;
            }
            if(this._ws.readyState == WebSocket.CLOSING){
                bDebug && console.error(this._tag,`网络正在关闭中，不需要再次连接`);
                return false;
            }
            //如果网络已经关闭了，就不用在处理了
        }

        this._connectWebSocket(ip, port, protocol);
        let duration = 0;
        const perWaitTime   = 0.05;
        let bConnectSuccess = false;
        while (duration < this.connectTimeOut) {
            if (this.isConnected) {
                bConnectSuccess = true;
                break;
            }
            await WaitTime(perWaitTime);
            duration    += perWaitTime;
        }
        return bConnectSuccess;
    }

    /**@description 网络是否连接成功 */
    public get isConnected() {
        if(!this._ws){
            //bDebug && console.warn('THIS WEBSOCKET IS NULL!');
            return false;
        }
        if (this._ws.readyState === WebSocket.OPEN) {
            return true;
        }
        return false;
    }

    /**
     * 获取当前的网络状态
     */
    public get readyState(){
        if(!this._ws){
            return null;
        }
        return this._ws.readyState;
    }

    /**
     * 发送消息
     * @param data
     * @returns
     */
    public send(data: Net.SocketBuffer) {
        if (!this._ws || !data) {
            console.error(this._tag, 'send data error');
            return;
        }
        if (this._ws.readyState === WebSocket.OPEN) {
            //console.log(this._tag, `send data : ${data}`);
            this._ws.send(data);
        } else {
            //如果当前连接正在连接中
            if (this._ws.readyState == WebSocket.CONNECTING) {
                this._dataArr.push(data);
            } else {
                //关闭或者正在关闭状态
                const content = this._ws.readyState == WebSocket.CLOSING ? '网络正在关闭' : '网络已经关闭';
                if (bDebug) console.warn(this._tag, `发送消息失败: ${content}`);
            }
        }
    }

    private _reson : Net.WebSocketCloseEventType = Net.WebSocketCloseEventType.HEART_BEAT_TIMEOUT;
    /**@description 关闭网络
     * @param isEnd 只有在程序的关闭销毁时调用，
     * 在MainController.onDestroy中使用
     */
    public close(reson?: Net.WebSocketCloseEventType) {
        //清空发送
        this._dataArr = []; 
        reson = reson || Net.WebSocketCloseEventType.CUSTOM_CLOSE;
        if (this._ws) {
            this._reson         = reson;
            this._closeEvent    = { type: reson };
            const code  = Net.WebSocketCloseEventCode[reson];
            this._ws.close(code,reson);
            if (bDebug) console.warn(this._tag, 'close websocket,reson = ',reson);
            if(reson == Net.WebSocketCloseEventType.CUSTOM_CLOSE){
                this.reset('web-socket-client custom close');
            }else if(reson == Net.WebSocketCloseEventType.HEART_BEAT_TIMEOUT){
                const callback = this.onClose;
                this.reset('web-socket-client heart beat timeout');
                callback && callback(this._closeEvent);
            }
        }
        
    }

    /**
     * 重置当前所有的内容
     */
    public reset(reson : string){
        bDebug && console.warn(this._tag,`reset websocket,reason : ${reson}`);
        this._ws        = null;
        this.onClose    = null!;
        this.onError    = null!;
        this.onOpen     = null!;
        this.onMessage  = null!;
        this._ip        = null;
        this._port      = null;
        this._dataArr   = [];
        this._protocol  = null;
    }

    //========================================私有方法=====================================//

    /**
     * 初始化
     * @param ip
     * @param port
     * @param protocol
     */
    private _init(ip: string, port: string | null, protocol: Net.Type = Net.Type.ws) {
        this._ip = ip;
        this._port = port;
        this._protocol = protocol;
        this._dataArr = [];

        this._closeEvent = null;
    }

    private _connectWebSocket(ip: string, port: string | null, protocol: Net.Type = Net.Type.ws) {
        //ip = "ws://192.168.1.179:36001/ws";
        this._init(ip, port, protocol);
        if (!this._ip) return;
        let fullUrl = '';
        if(ip.startsWith('ws') || ip.startsWith('wss')){
            fullUrl = ip;
        }else{
            fullUrl = `${protocol}://${this._ip}`;
        }
        if (this._port) {
            fullUrl = fullUrl + `:${this._port}`;
        }
        if (bDebug) console.log(this._tag, `initWebSocket : ${fullUrl}`);

        if (JSB && protocol == 'wss') {
            if (!Net.NetGlobal.WssCacertUrl) {
                bDebug && console.log('请先设置wss的证书url,main脚本中直接挂载证书');
            }
            this._ws = new (<any>WebSocket)(fullUrl, [], Net.NetGlobal.WssCacertUrl);
        } else {
            this._ws = new WebSocket(fullUrl);
        }
        if (this._ws) {
            //cc.log(this._tag,`new websocket readyState : ${this._ws.readyState}`);
            this._ws.binaryType = 'arraybuffer';

            //打开socket
            this._ws.onopen = this.__onConected.bind(this);

            //收消息
            this._ws.onmessage = this.__onMessage.bind(this);

            //socket关闭
            this._ws.onclose = this.__onClose.bind(this);

            //错误处理
            this._ws.onerror = this.__onError.bind(this);
        }
    }

    

    //=======================================事件定义=========================================//

    private __onConected(event: any) {
        if (this._ws) {
            if (bDebug) console.log(this._tag, `onConected state : ${this._ws.readyState}`);
        }
        if (this._dataArr.length > 0) {
            for (let i = 0; i < this._dataArr.length; i++) {
                this.send(this._dataArr[i]);
            }
            this._dataArr = [];
        }
        if (this.onOpen) this.onOpen(event);
    }

    private __onMessage(event: MessageEvent) {
        if (this.onMessage) this.onMessage(event);
    }

    private __onClose(event: any) {
        bDebug && console.log(this._tag, 'onClose', event,this._ws);
        this.reset('web-socket-client __onClose');
        if(this._reson == Net.WebSocketCloseEventType.HEART_BEAT_TIMEOUT){
            BaseGlobal.sendMsg(Net.NetFrameMessage.ON_CLIENT_CLOSE,[null,{
                type : Net.WebSocketCloseEventType.HEART_BEAT_TIMEOUT,
            }]);
        }
        
        // this._ws = null;
        // if (this._closeEvent) {
        //     event = this._closeEvent;
        //     this._closeEvent = null;
        // }
        
        // const callback = this.onClose;
        // this.reset();
        // console.warn('websocket receive close event', event,callback);
        // callback && callback(event);
    }

    private __onError(event: Event) {
        if (event) {
            if (bDebug) console.error(this._tag, 'onError', event);
        } else {
            if (bDebug) console.error(this._tag, 'onError');
        }
        this.reset('web-socket-client __onError');
        if (this.onError) this.onError(event);
        
    }
}
