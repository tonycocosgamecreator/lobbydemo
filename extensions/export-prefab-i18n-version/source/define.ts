export const IMPORT_BEGIN_TAG   = "// @view export import begin";
export const IMPORT_END_TAG     = "// @view export import end";

export const RESOURCE_BEGIN_TAG = "// @view export resource begin";
export const RESOURCE_END_TAG   = "// @view export resource end";

//按钮事件的回调函数
export const EVENT_BEGIN_TAG    = "// @view export event begin";
export const EVENT_END_TAG      = "// @view export event end";

//网络消息通知的定义，注意，这个标记内的东西只会在第一次初始化的时候生成，再次生成时不会被覆盖
export const NET_BEGIN_TAG      = "// @view export net begin";
export const NET_EN_TAG         = "// @view export net end";


export const DEBUG              = true;

export declare type AssetBundleInfo = {
    /**
     * bundle的绝对路径
     * D:/xxx/xxx/assets/xxx?/bundleName
     */
    url : string,
    /**
     * bundle在dbasset中的路径
     * dbasset路径：db://assets/xxx?/bundleName
     */
    db_url : string,
    /**
     * bundle名字
     */
    bundleName : string,
    /**
     * 预制体的名字
     */
    prefabName : string,
    /**
     * 预制体的子路径，相对于prefabs目录
     * 如果就在prefabs目录下，那么就为空
     * 如果是在prefabs目录的子目录下，那么就为子目录的名字
     */
    prefabSubUrl : string,
    /**
     * 所有需要被多语言控制的labels
     */
    i18n_labels? : string[],
}

/**
 * 内部bundle定义
 */
export enum BuiltinBundleName {
    RESOURCES   = "resources",
}

/**
 * 组件信息
 */
export declare type ComponentInfo = {
    /**
     * 类名
     */
    className       : string,
    /**
     * 脚本文件路径
     */
    scriptFilePath  : string,
    /**
     * 是否被默认导出的
     */
    bDefaultExport  : boolean,
}

export declare type NodeInfo = {
    nodeName    : string,
    nodeType    : string,
    scriptPath? : string,
    /**
     * 全局组件ID，可选，如果有的话
     * 
     */
    globalFileId : string,
}

/**
 * 打点映射统计配置的结构
 */
export declare type StatisticalConfig = {
    bundles : {
        [name : string] : number,
    },
    configs : {
        [name : string] : {
            start_statistical_id : number,
            end_statistical_id : number
        }
    }
} 