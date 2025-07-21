import pbf from 'protobufjs';
import pako from "pako";
import * as cc from 'cc';
import { bDebug } from '../../core/define';
/**
 * 此管理器不需要注册到Managers中
 */
export default class ProtoManager {
    /**
    * 当前所有已经加载的proto文件
    */
    private static _protos: { [name: string]: boolean } = {};

    /**
     * 所有消息协议的根
     */
    private static root: pbf.Root = new pbf.Root();
    /**
     * 所有字符串对应得消息Id
     */
    private static _key_to_code_protos: { [key: string]: number } = {};
    /**
     * 所有消息Id对应得字符串
     */
    private static _code_to_key_protos: { [code: number]: string } = {};
    /**
     * 此方法，会在protobuf-connector.ts中调用
     */
    public static initAllProtoInfos() {
        this._key_to_code_protos = {};
        this._code_to_key_protos = {};
        //  遍历所有的消息id
        // for (let key in msgid.MsgID) {
        //     const code = msgid.MsgID[key];
        //     if (isNaN(parseInt(key))) {
        //         const msgId = parseInt(code);
        //         this._key_to_code_protos[key] = msgId;
        //         this._code_to_key_protos[msgId] = key;
        //     }
        // }
    }

    /**
     * 通过消息号获取消息的id
     * @param msgId 
     * @returns 
     */
    public static getMessageNameById(msgId: number): string {
        return this._code_to_key_protos[msgId];
    }

    /**
     * 通过消息名获取消息的id
     * @param msgName 
     * @returns 
     */
    public static getMessageIdByName(msgName: string): number {
        return this._key_to_code_protos[msgName];
    }


    private static async _loadProtoBinSuccess(bundleName: string, res: cc.BufferAsset): Promise<boolean> {
        // db.bin，二进制数据
        const content = pako.inflate(res.buffer(), { to: "string" });
        if (!content) {
            console.error('ProtoManager._loadProtoBinSuccess: content is null: ', bundleName);
            return false;
        }
        const jsonData = JSON.parse(content);

        const probuf_priority_arr = resourcesDb.getArr_from_protobuf_load_priority_db(bundleName);
        if (probuf_priority_arr && probuf_priority_arr.length > 0) {
            //这是一个优先级的数组，里面存放的是需要加载的文件名
            for (let i = 0; i < probuf_priority_arr.length; i++) {
                //按顺序加载
                const pData = probuf_priority_arr[i];
                const protoName = pData.name + ".proto";
                if (this._protos[protoName]) {
                    continue;
                }
                if (!jsonData[protoName]) {
                    bDebug && console.warn('Can not find proto file : ', protoName);
                    continue;
                }
                const text = jsonData[protoName] as string;
                pbf.parse(text, this.root, { keepCase: true });
                //bDebug && console.log('Load proto file : ',protoName);
                this._protos[protoName] = true;
            }

            return true;
        }

        //进入无序加载

        for (let protoName in jsonData) {
            if (this._protos[protoName]) {
                continue;
            }
            const text = jsonData[protoName] as string;
            pbf.parse(text, this.root, { keepCase: true });
            bDebug && console.log('加载proto文件：', protoName);
            this._protos[protoName] = true;
        }
        return true;
    }
    /**
     * 使用已经加载好的内容初始化
     * @param bundleName 
     * @param res 
     */
    public static async LoadProtos(bundleName: string, res: cc.BufferAsset) {
        await this._loadProtoBinSuccess(bundleName, res);
    }

    /**
     * 查找指定名字的协议
     * @param className 需要查找的协议的名字
     */
    public static LookupType(className: string): pbf.Type | null {
        try {
            if (className == 'MsgSvrHorseRaceUpdateNtf' || className == 'MsgSvrReadPointNtf') {
                return null;
            }
            const pType = this.root.lookupType(className);
            return pType;
        } catch (e) {
            console.error('ProtoManager.LookupType: error:', e);
            return null;
        }
    }

    /**
     *  解码一个协议
     * @param className 
     * @param buffer 
     * GateHeartBeatReq
     * @returns 
     */
    public static Decode(className: string, buffer: Uint8Array): null | { [k: string]: any } {
        const message = this.LookupType(className);
        if (!message) {
            return null;
        }
        const msg = message.decode(buffer);
        //屌用protobufjs自带的转换方法，将枚举转换成数字
        return message.toObject(msg, { enums: Number,defaults : true, arrays: true, objects: true });
    }

    /**
     * 通过指定的code解析协议
     * @param msgId 
     * @param buffer 
     * @returns 
     */
    public static DecodeMessageId(msgId: number, buffer: Uint8Array): null | { [k: string]: any } {
        const clssName = this.getMessageNameById(msgId);
        if (!clssName) {
            return null;
        }
        return this.Decode(clssName, buffer);
    }

    /**
     * 编码一个协议
     * @param className 
     * @param obj 
     * @returns 
     */
    public static Encode(className: string, obj: any): Uint8Array | null {
        const message = this.LookupType(className);
        if (!message) {
            return null;
        }
        return message.encode(obj).finish();
    }
}