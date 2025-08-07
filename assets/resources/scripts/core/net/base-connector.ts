import { bDebug } from '../define';
import BaseGlobal from '../message/base-global';
import { ByteArray, Endian } from '../utils/byte-array';
import { Net } from './net';
import WebSocketClient from './web-socket-client';
import { HTML5 } from 'cc/env';

/**
 * 最大缓存的字节长度
 */
const MAX_CACHE_BYTE_LENGTH = 1024 * 20; // 20k

const LOG_KEY = '[BaseConnector]';

/**
 * 网络连接器基类
 */
export default abstract class BaseConnector {
    /**
     * ping值
     */
    protected _ping: number = 0;

    protected _client: WebSocketClient | null = null;
    /**
     * 当前链接类型
     */
    protected _type: string = Net.ConnectorType.Lobby;
    /**
     * 自动心跳的时间
     */
    protected _auto_heart_beat_interval: number = 5;

    /**
     * 当前自动化心跳发送的时间
     */
    protected _now_auto_heart_beat_interval = 0;
    /**
     * 心跳超时次数
     */
    protected _max_heart_beat_timeout_count = 1;
    /**
     * 当前心跳已经超时的次数
     */
    protected _now_heart_beat_timeout_count = 0;

    /**
     * 缓存的网络消息
     */
    protected _bytes: ByteArray;
    /**
     * 缓存的网络消息
     */
    protected _tempBytes: ByteArray;
    /** 
     * 大小端模式
     */
    protected _endian: string = Endian.BIG_ENDIAN;
    /**
     * 单个消息的解析器
     */
    protected _analysisor: Net.MessageAnalysisor | null = null;

    constructor(_type: Net.ConnectorType | string) {
        this._type = _type;
        this._bytes = new ByteArray();
        this._tempBytes = new ByteArray();
        this._bytes.endian = this._endian;
        //this._registerEvent();
        this.init();
    }
    /**
     * 重置
     */
    protected _reset() {
        if (this._client) {
            this._client.reset('base-connector call');
        }
        this._bytes.clear();
        this._now_auto_heart_beat_interval = 0;
        this._now_heart_beat_timeout_count = 0;
        this._client = null;
    }

    /**
     * 每一帧调用一次，只解析一条消息
     * 你可以重写这个方法来做自己的消息解析
     * @returns
     */
    protected _analysisMessage() {
        //console.log('BaseConnector._analysisMessage->',this._bytes.length);
        if (!this._analysisor) {
            return;
        }
        const buffer = this._analysisor.analysis(this._bytes);
        if (!buffer) {
            return;
        }
        this.onOneMessage(buffer);
    }

    //===============================公共方法================================//
    /**
     * 获取当前的链接类型
     */
    public get type() {
        return this._type;
    }

    /**
     * 当前链接是否链接上了
     */
    public get isConnected() {
        if (!this._client) {
            //console.warn(LOG_KEY, 'base connector -> client is null!');
            return false;
        }
        return this._client.isConnected;
    }

    /**
     * 获取当前的网络状态
     */
    public get readyState() {
        if (!this._client) {
            return null;
        }
        return this._client.readyState;
    }

    /**
     * 异步函数
     * 开始链接
     * @param ip            开始链接的地址，可以携带协议和端口
     * @param port          端口 可选   如果ip中已经携带了端口，那么这个参数可以不传
     * @param protocol      协议类型 可选 如果ip中是以 ws 或者 wss 开头的，那么这个参数可以不传
     * @returns             返回是否链接成功
     */
    public async startConnect(ip: string, port: string | null = null, protocol: Net.Type = Net.Type.ws): Promise<boolean> {
        this._registerEvent();
        return this._client.initWebSocket(ip, port, protocol);
    }

    /**
     * 关闭
     * @param reson
     */
    public close(reson: Net.WebSocketCloseEventType = Net.WebSocketCloseEventType.CUSTOM_CLOSE) {
        const readyState = this.readyState;
        if (!readyState || readyState == WebSocket.CLOSED) {
            //没有状态或者已经关闭了
            console.warn(LOG_KEY, 'socket state is closed,return true!RESET');
            this._reset();
            return true;
        }

        if (readyState == WebSocket.CLOSING) {
            //正在关闭中 ，也需要等待
            console.warn(LOG_KEY, 'socket state is closing,please wait~');
            return false;
        }
        //其他状态，直接执行关闭
        this._client && this._client.close(reson);
        return false;
    }

    public get endian() {
        return this._endian;
    }
    /**
     * 设置当前链接的大小端模式
     */
    public set endian(val: string) {
        this._endian = val;
        this._bytes.endian = this._endian;
    }

    /**
     *
     * @param dt 每帧回调更新
     */
    public onLateUpdate(dt: number) {
        if (HTML5) {
            //检测网络状态
            //const online = navigator.onLine;
            //console.log('网络状态:',online);
        }


        if (this._client) {
            this._client.onLateUpdate(dt);
        }
        if (!this.isConnected) {
            return;
        }
        this._now_auto_heart_beat_interval += dt;
        if (this._now_auto_heart_beat_interval >= this._auto_heart_beat_interval) {
            this._now_heart_beat_timeout_count += 1;
            if (this._now_heart_beat_timeout_count > this._max_heart_beat_timeout_count) {
                //已经超时了
                this._now_heart_beat_timeout_count = 0;
                this.onHeartBeatTimeOut();
                this.close(Net.WebSocketCloseEventType.HEART_BEAT_TIMEOUT);
                return;
            }
            if (this.isStartSendHeartBeat) {
                //发送心跳
                this.sendHeartBeatMessage();
            }

            this._now_auto_heart_beat_interval = 0;
        }
        //每一帧解析一条消息，防止突然来很多网络消息将主线程卡住
        this._analysisMessage();
    }

    /**
     * 发送数据
     * @param datas 
     * @returns 
     */
    protected send(datas: Uint8Array | string) {
        if (!this.isConnected) {
            bDebug && console.error('socket unconnected!!!', this.type, datas);
            return;
        }
        this._client.send(datas);
    }

    //====================================私有方法==================================//
    /**
     * 初始化并注册事件
     */
    private _registerEvent() {
        this._client = new WebSocketClient();
        this._client.onClose = this.onClose.bind(this);
        this._client.onError = this.onError.bind(this);
        this._client.onMessage = this.onMessage.bind(this);
        this._client.onOpen = this.onOpen.bind(this);
    }

    //====================================事件监听==================================//

    /**
     * @description 网络打开
     */
    protected onOpen(ev: Event) {
        bDebug && console.log('网络消息打开成功,', this._type);
        //重置心跳
        this._now_heart_beat_timeout_count = 0;
        this.onSocketOpen();
        BaseGlobal.sendMsg(Net.NetFrameMessage.ON_CLIENT_OPEN, this._type);
    }

    /**
     * @description 网络关闭
     */
    protected onClose(event: Net.CloseEvent) {
        this._reset();
        bDebug && console.log('网络断开链接,', event);
        this.onSocketClose();
        BaseGlobal.sendMsg(Net.NetFrameMessage.ON_CLIENT_CLOSE, [this._type, event]);
    }

    /**
     * @description 网络错误
     */
    protected onError(ev: Event) {
        //网络连接出错误，停止心跳发送
        bDebug && console.log('网络链接出现错误', this._type);
        this._reset();
        this.onSocketError();
        BaseGlobal.sendMsg(Net.NetFrameMessage.ON_CLIENT_ERROR, this._type);
    }

    /**
     * @description 收到网络消息
     */
    protected onMessage(data: MessageEvent) {
        //恢复心跳超时次数，因为你收到服务器的消息了
        this._now_heart_beat_timeout_count = 0;
        //把消息的数据拿出来
        const bytes: ArrayBuffer = data.data;

        this._bytes.writeBytes(new ByteArray(bytes));

        if (!this._analysisor) {
            return;
        }
        let buffer = this._analysisor.analysis(this._bytes);
        while (buffer) {
            this.onOneMessage(buffer);
            buffer = this._analysisor.analysis(this._bytes);
        }
    }
    /**
     * 获取当前网络的ping值
     */
    public get ping() {
        return this._ping;
    }

    //==========================子类需要实现的方法============================//
    public isStartSendHeartBeat = false;
    /**
     * 初始化，在这里进行一些初始化的操作
     * 会在构造函数后被主动调用
     */
    protected abstract init();

    /**
     * 子类重写，当心跳超时的时候需要处理
     */
    protected abstract onHeartBeatTimeOut();

    /**
     * 当socket链接打开成功
     */
    protected abstract onSocketOpen();

    /**
     * 子类实现，当网络断开链接的时候需要处理
     */
    protected abstract onSocketClose();
    /**
     * 子类处理，当网络发生错误的时候需要处理
     */
    protected abstract onSocketError();
    /**
     * 基类解析到一个完成的消息，转发给子类进行单独的处理
     * 子类可能需要解密，解包等一系列操作，这个操作在子类中完成
     * @param buffer
     */
    protected abstract onOneMessage(buffer: Uint8Array);
    /**
     * 每一个链接需要单独处理，发送心跳包给服务器
     */
    public abstract sendHeartBeatMessage();
    /**
     * 是否是心跳包
     */
    protected abstract isHeartBeatMessage(msgId: string | number): boolean;
    /**
     * 发送消息
     * @param msgNameOrId
     * @param data
     * @param deskId
     */
    public abstract sendMsg(msgNameOrId: string | number, data: any, deskId?: number): void;
}
