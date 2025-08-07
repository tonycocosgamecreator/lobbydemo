import { ByteArray, Endian } from '../utils/byte-array';

export namespace Net {
    /**
     * 每一个消息包体的头部长度
     */
    export const PACKAGE_HEADER_SIZE = 4;

    /**@description 网络数据全以大端方式进行处理 */
    export const USING_LITTLE_ENDIAN = Endian.LITTLE_ENDIAN;
    /**
     * 当前使用的网络类型
     */
    export enum Type {
        ws = 'ws',
        wss = 'wss',
    }

    export declare type SocketBuffer = string | Uint8Array;

    /**
     * 网络链接断开的类型
     */
    export enum WebSocketCloseEventType {
        /**
         * 主动关闭
         */
        CUSTOM_CLOSE        = 'CUSTOM_CLOSE',
        /**
         * 心跳超时导致的链接关闭
         */
        HEART_BEAT_TIMEOUT  = 'HEART_BEAT_TIMEOUT',
        
    }

    export const WebSocketCloseEventCode = {
        [WebSocketCloseEventType.CUSTOM_CLOSE] : 4000,
        [WebSocketCloseEventType.HEART_BEAT_TIMEOUT] : 4001,
    }

    /**
     * 网络关闭的时候的事件定义
     */
    export declare type CloseEvent = { type: string };

    /**
     * 网络链接类型
     */
    export enum ConnectorType {
        /**
         * 登陆验证
         */
        Login = 'Login',
        /**
         * 大厅
         */
        Lobby = 'Lobby',
        /**
         * 子游戏
         */
        Game = 'Game',
    }
    /**
     * 网络事件的通知
     */
    export enum NetFrameMessage {
        /**
         * 当网络链接成功时
         */
        ON_CLIENT_OPEN = 'ON_CLIENT_OPEN',
        /**
         * 当网络链接关闭时
         */
        ON_CLIENT_CLOSE = 'ON_CLIENT_CLOSE',
        /**
         * 当网络发生错误时
         */
        ON_CLIENT_ERROR = 'ON_CLIENT_ERROR',
        /**
         * 收到一条消息的时候，对当前环境中的所有界面进行推送
         */
        ON_NET_MESSAGE = 'ON_NET_MESSAGE',
    }

    /**
     * 单个消息解析器
     */
    export abstract class MessageAnalysisor {
        /**
         * 解析消息
         * @param data 消息数据
         */
        abstract analysis(data: ByteArray): Uint8Array | null;
    }

    /**
     * 网络消息定义
     * 发送消息时，首先进行 encode(),再进行pack处理(增加头部4个字节长度)
     * 接收消息时，先进行unpack(),解析到长度，再进行decode()
     */
    export abstract class Message {
        /**
         * 消息类型/消息ID
         */
        public msgType: string = '0';
        /**
         * 消息结构
         */
        public bytes: ByteArray | null = null;
        /**
         * 原始/被解析之后的数据
         */
        protected _data: any;

        constructor(_msgType?: string, _data?: any) {
            if (_msgType && _msgType != '') {
                this.msgType = _msgType;
            }
            this.bytes = new ByteArray();
            this._data = _data;
        }

        /**
         * 获取原始数据/解析之后的数据
         */
        public get data() {
            return this._data;
        }

        /**
         * 设置消息使用大小端
         */
        public set endian(value: string) {
            this.bytes.endian = value;
        }
        /**
         * 获取当前消息使用大小端
         */
        public get endian() {
            return this.bytes.endian;
        }

        /**
         * 对数据进行加密
         */
        abstract encode(buffer?: any): boolean;
        /**
         *
         * @param data 对数据进行解密
         */
        abstract decode(data: Uint8Array): boolean;
        /**
         * 销毁自己
         */
        abstract onDestroy(): void;
    }

    export class NetGlobal {
        /**
         * 当前使用的证书的nativeurl
         */
        public static WssCacertUrl: string | null = null;
    }
}
