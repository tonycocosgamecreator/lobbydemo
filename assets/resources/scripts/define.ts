/**
 * 协议方式
 */
export enum ProtoType {
    /**
     * 未知，无，没有初始化的
     */
    None        = 0,
    /**
     * 使用protobuf方式进行链接
     */
    Protobuf    = 1,
    /**
     * 使用json方式进行链接
     */
    Json        = 2,
}
