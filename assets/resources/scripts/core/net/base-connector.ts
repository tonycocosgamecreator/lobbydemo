import { ConnectorType } from "./net-define";

const LOG_KEY = '[BaseConnector]';

export interface SocketEventCallbacks {
    onOpen?: (event: Event) => void;
    onMessage: (event: MessageEvent) => void;
    onClose: (event: CloseEvent) => void;
    onError: (event: Event) => void;
}

export class BaseConnector {
    /**
     * 当前链接类型
     */
    protected _type: ConnectorType = ConnectorType.None;
    /**
     * 当前的客户端
     */
    protected _client: WebSocket | null = null;
    /**
     * 当前链接地址
     */
    protected _url: string = '';
    /**
     * 注册的网络事件回调函数
     */
    protected _registedEventCallbacks: SocketEventCallbacks = {
        onOpen: null,
        onMessage: null,
        onClose: null,
        onError: null
    }

    public get type(): ConnectorType {
        return this._type;
    }

    constructor(connectorType: ConnectorType) {
        this._type = connectorType;
    }
    /**
     * 重置/关闭链接，主动并不会触发断线重连
     */
    public reset(): void {
        this._registedEventCallbacks = {
            onOpen: null,
            onMessage: null,
            onClose: null,
            onError: null
        };
        if (this._client) {
            //首先将这些方法设置为null，主动关闭得时候，就不会触发
            this._client.onmessage = null;
            this._client.onclose = null;
            this._client.onerror = null;
            this._client.onopen = null;
            this._client.close();
        }

        this._client = null;
    }
    /**
     * 网络是否链接了
     */
    public get isConnected(): boolean {
        if (!this._client) {
            return false;
        }
        return this._client.readyState === WebSocket.OPEN;
    }
    /**
     * 获取当前的链接状态
     */
    public get readyState(): number {
        if (!this._client) {
            return WebSocket.CLOSED;
        }
        return this._client.readyState;
    }
    /**
     * 开始链接服务器
     * @param url 
     */
    public startConnect(url: string, eventCallbacks: SocketEventCallbacks, binaryType: BinaryType = "arraybuffer"): void {
        if (this._client) {
            console.warn(`${LOG_KEY} startConnect, but the client is already exsit!`);
            return;
        }
        this._registedEventCallbacks = eventCallbacks;
        this.initWebSocket(url, binaryType);
        this.registerEvent();
    }
    /**
     * 获取链接地址
     */
    public get url(): string {
        return this._url;
    }

    /**
     * 发送消息
     * @param datas 
     */
    public send(datas: Uint8Array | string) {
        if (!this._client) {
            console.error(`${LOG_KEY} send, but the client is null!`);
            return;
        }
        if (this._client.readyState !== WebSocket.OPEN) {
            console.error(`${LOG_KEY} send, but the client is not open!`);
            return;
        }
        this._client.send(datas);
    }

    //------------------------------------内部方法------------------------------------//
    /**
     * 初始化websocket链接
     * @param url 
     */
    protected initWebSocket(url: string, binaryType: BinaryType) {
        this._client = new WebSocket(url, "net");
        this._client.binaryType = binaryType;
        this._url = url;
    }

    /**
     * 注册网络消息
     */
    protected registerEvent(): void {
        if (!this._client) {
            console.error(`${LOG_KEY} registerEvent, but the client is null!`);
            return;
        }
        this._client.onmessage = (event: MessageEvent) => {
            this.onMessage(event);
        };
        this._client.onclose = (event: CloseEvent) => {
            this.onClose(event);
        };
        this._client.onerror = (event: Event) => {
            this.onError(event);
        };
        this._client.onopen = (event: Event) => {
            this.onOpen(event);
        };
    }


    //----------------------------私有方法--------------------------------//

    private onMessage(event: MessageEvent): void {
        if (this._registedEventCallbacks.onMessage) {
            this._registedEventCallbacks.onMessage(event);
        }
    }

    private onClose(event: CloseEvent): void {
        //this.reset();
        if (this._registedEventCallbacks.onClose) {
            this._registedEventCallbacks.onClose(event);
        } else {
            this.reset();
        }
    }

    private onError(event: Event): void {
        //this.reset();
        if (this._registedEventCallbacks.onError) {
            this._registedEventCallbacks.onError(event);
        } else {
            this.reset();
        }
    }

    private onOpen(event: Event): void {
        if (this._registedEventCallbacks.onOpen) {
            this._registedEventCallbacks.onOpen(event);
        }
    }
}