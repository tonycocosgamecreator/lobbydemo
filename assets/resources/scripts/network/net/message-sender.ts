import { log } from "cc";
import { WaitTime, bDebug } from "../../core/define";
import BaseConnector from "../../core/net/base-connector";
import { Net } from "../../core/net/net";
import { ProtoType } from "../define/define";
import { Global } from "../../global";
import { JsonConnector } from "./json/json-connector";
import BrowserUtils from "../../core/utils/browser-utils";

/**
 * 用于发送消息
 * 对于其他客户端程序员来说，他们不需要关心底层使用的是什么通信方式
 */
export class MessageSender {

    private static _protoType: ProtoType = ProtoType.None;

    /**
     * 已经被使用过的链接地址
     */
    private static _usedUrls: string[] = [];

    /**
     * 获取一个未使用的链接地址
     */
    private static get unusedUrl() {
        if (Global.NetWorkProtoType == ProtoType.Protobuf) {
            log('暂不支持protobuf')
            // const urls = GameApiManager.config.ws_list;
            // for(let i = 0; i < urls.length; i++){
            //     if(this._usedUrls.indexOf(urls[i]) == -1){
            //         this._usedUrls.push(urls[i]);
            //         return urls[i];
            //     }
            // }
        } else if (Global.NetWorkProtoType == ProtoType.Json) {
            // const url = BrowserUtils.getParam(resourcesDb.LINK_URL_PARAM_DB_ID.server_url);
            let url = BrowserUtils.getParam('server_url');
            if (!url || url == '') {
                return '';
            }
            url = decodeURIComponent(url);
            if (this._usedUrls.indexOf(url) == -1) {
                this._usedUrls.push(url);
                return url;
            }
        }
        return '';
    }

    /**
     * 初始化链接
     * @param _protoType 选择消息发送的方式
     */
    public static async InitConnector(_protoType: ProtoType): Promise<boolean> {
        this._protoType = _protoType;
        const url = this.unusedUrl;
        if (url == '') {
            console.error('no available url');
            this._usedUrls = [];
            return false;
        }
        let connector: BaseConnector | null = null;
        if (_protoType == ProtoType.Protobuf) {
            log('暂不支持protobuf')
            // connector = ProtobufConnector.instance;
            // if(!connector){
            //     connector   = new ProtobufConnector(Net.ConnectorType.Login);
            // }
        } else if (_protoType == ProtoType.Json) {
            connector = JsonConnector.instance;
            if (!connector) {
                connector = new JsonConnector(Net.ConnectorType.Login);
            }
        }
        if (!connector) {
            console.error('connector is null');
            return false;
        }
        const bSuccess = await connector.startConnect(url);
        if (!bSuccess) {
            return await this.InitConnector(_protoType);
        }
        this._usedUrls = [];
        //成功的
        return true;
    }
    /**
     * 关闭链接
     * @param _typeName 
     */
    public static async CloseConnector(_typeName: string = Net.ConnectorType.Login, reson: Net.WebSocketCloseEventType = Net.WebSocketCloseEventType.CUSTOM_CLOSE) {
        let connector: BaseConnector | null = null;
        if (this._protoType == ProtoType.Protobuf) {
            log('暂不支持protobuf')
            // connector = ProtobufConnector.instance;
        } else if (this._protoType == ProtoType.Json) {
            connector = JsonConnector.instance;
        }
        if (connector) {
            const bSuccess = connector.close(reson);
            if (bSuccess) {
                if (reson == Net.WebSocketCloseEventType.HEART_BEAT_TIMEOUT) {
                    //是直接处于关闭状态，这时，如果是因为心跳问题，那么需要重新连接
                    Global.sendMsg(Net.NetFrameMessage.ON_CLIENT_CLOSE, [_typeName, { type: reson }]);
                }
                return true;
            }
            while (connector.readyState != null && connector.readyState != WebSocket.CLOSED) {
                bDebug && console.log('waiting for connector state ~', connector.readyState);
                await WaitTime(0.1);
            }
            bDebug && console.log('connector close successes!');
        } else {
            console.error('MessageSender.CloseConnector: connector is null');
        }
        return false;
    }
    /**
     * 
     * @returns 是否链接上了
     */
    public static IsConnected(): boolean {
        let connector: BaseConnector | null = null;
        if (this._protoType == ProtoType.Protobuf) {
            log('暂不支持protobuf')
            // connector = ProtobufConnector.instance;
        } else if (this._protoType == ProtoType.Json) {
            connector = JsonConnector.instance;
        }
        if (connector) {
            return connector.isConnected;
        }
        return false;
    }

    public static SendHeartBeatMessage() {
        const connector: BaseConnector | null = JsonConnector.instance;
        log('暂不支持protobuf')
        // const connector: BaseConnector | null = this._protoType == ProtoType.Protobuf ? ProtobufConnector.instance : JsonConnector.instance;
        if (connector) {
            connector.isStartSendHeartBeat = true;
            connector.sendHeartBeatMessage();
        }
    }

    /**
     * 发送消息
     * @param msgType 
     * @param data 
     * @param deskId 
     */
    public static SendMessage(msgType: string | number, data: any, deskId: number = 0) {
        let connector: BaseConnector | null = null;
        if (this._protoType == ProtoType.Protobuf) {
            log('暂不支持protobuf')
            // connector = ProtobufConnector.instance;
        } else if (this._protoType == ProtoType.Json) {
            connector = JsonConnector.instance;
        }
        if (!connector) {
            console.error('MessageSender.SendMessage: connector is null');
            return;
        }
        if (connector.isConnected) {
            connector.sendMsg(msgType, data, deskId);
        } else {
            console.error('MessageSender.SendMessage: not connected', connector);
            //开启断线重连
            connector.close();
            Global.sendMsg(
                Net.NetFrameMessage.ON_CLIENT_CLOSE,
                [Net.ConnectorType.Login, { type: Net.WebSocketCloseEventType.HEART_BEAT_TIMEOUT }]
            );
        }
    }

    /**
     * 每帧更新
     * @param dt 
     */
    public static onLateUpdate(dt: number) {
        let connector: BaseConnector | null = null;
        if (this._protoType == ProtoType.Protobuf) {
            log('暂不支持protobuf')
            // connector = ProtobufConnector.instance;
        } else if (this._protoType == ProtoType.Json) {
            connector = JsonConnector.instance;
        }
        if (!connector) {
            return;
        }
        connector.onLateUpdate(dt);
    }
}