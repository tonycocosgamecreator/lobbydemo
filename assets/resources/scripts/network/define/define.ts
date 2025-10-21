/**
 * 协议方式
 */
export enum ProtoType {
    /**
     * 未知，无，没有初始化的
     */
    None = 0,
    /**
     * 使用protobuf方式进行链接
     */
    Protobuf = 1,
    /**
     * 使用json方式进行链接
     */
    Json = 2,
}
/**
 * 网络重连状态
 */
export enum ReconnectState {
    /**
     * 开始时处于状态无
     */
    None = 0,
    /**
     * 开始链接服务器中
     */
    Reconnecting,
    /**
     * 登录中
     */
    Login,
    /**
     * 正在进入游戏
     */
    EnteringGame,
    /**
     * 重连成功
     */
    Done,
    /**
     * 重连失败
     */
    Failed,
}
/**
 * 游戏内部通知
 */
export enum GameEvent {

    /**
     * 收到登录成功
     */
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
}