export namespace head{

    export const PACKAGE_NAME = 'base';

    /** MsgEncode 协议编码 */
    export enum MsgEncode{
        /**  明文编码 */
        ME_PLAIN = 0,
        /**  GZIP压缩编码 */
        ME_GZIP = 1,
        /**  加密 */
        ME_ENCRYPT = 2,
    }

    export enum Message {
        /** MsgEncode 协议编码 */
        Header = 'Header',
    }

    /** MsgEncode 协议编码 */
    export interface Header{
        /**  消息ID */
        msg_id? : number;
        /**  发送序号 */
        send_seq? : number;
        /**  最后一次收到的消息序号 */
        recv_seq? : number;
        /**  最后一次收到消息的时间戳 */
        stamp_time? : number;
        /**  消息体长度 */
        body_length? : number;
        /**  回复序号 */
        rsp_seq? : number;
        /**  发送方的版本号 */
        version? : string;
        /**  路由, room-->deskID */
        routine? : number;
        /**  协议编码 */
        encode_type? : head.MsgEncode;
        /**  消息名称 */
        msg_name? : string;
    }

}
window['head'] = head;
