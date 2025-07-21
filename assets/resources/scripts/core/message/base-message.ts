/**
 * 框架内部的通知
 */
export enum BaseMessage {
    /**
     * 游戏进入后台
     */
    ON_ENTER_BACK_GROUND = 'ON_ENTER_BACK_GROUND',
    /**
     * 游戏恢复前台
     */
    ON_ENTER_FORGOUND = 'ON_ENTER_FORGOUND',
    /**
     * 当Canvas的大小发生变化
     */
    ON_CANVAS_RESIZE = 'ON_CANVAS_RESIZE',
    /**
     * 当存档被重置的时候触发
     */
    RESET_RECORD = 'RESET_RECORD',
    /**
     * 当前语言发生变化的时候触发
     */
    I18N_LANGUAGE_CHANGED = 'I18N_LANGUAGE_CHANGED',
    /**
     * 当前语言环境的资源加载完毕
     */
    I18N_RESOURCES_LOADED   = 'I18N_RESOURCES_LOADED',
    /**
     * 背景音乐开关发生改变
     */
    MUSIC_STATUS_CHANGED = 'MUSIC_STATUS_CHANGED',
    /**
     * 音效开关状态发生改变
     */
    SOUND_STATUS_CHANGED = 'SOUND_STATUS_CHANGED',
    /**
     * 需要重新连接服务器
     */
    NEED_RECONNECT = 'NEED_RECONNECT',
}
