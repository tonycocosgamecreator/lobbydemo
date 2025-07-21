import NodeExtensions from "./extensions/node-extension";
import DbManager from "./manager/db-manager";
import DeviceManager from "./manager/device-manager";
import I18nManager from "./manager/i18n-manager";
import Managers from "./manager/managers";
import ModuleManager from "./manager/module-manager";
import PoolManager from "./manager/pool-manager";
import RecordManager from "./manager/record-manager";
//import SkeletonListenerPatch from "./utils/SkeletonListenerPatch";
/**
 * 核心初始化
 * @param APP_SAVE_KEY 存档的key前缀
 * @param playerId 玩家id
 */
export function CoreInit(APP_SAVE_KEY : string,playerId : string) {
    // 注册拓展
    NodeExtensions.registerExtensions();
    //打补丁，修复 cc.sp.Skeleton 的事件监听器问题
    //SkeletonListenerPatch.patch();
    //设置存档的key
    RecordManager.setStorageKey(APP_SAVE_KEY + "_" + playerId);
    // 注册配置表管理器
    Managers.registe(RecordManager);
    Managers.registe(DeviceManager);
    Managers.registe(ModuleManager);
    Managers.registe(DbManager);
    Managers.registe(I18nManager);
    Managers.registe(PoolManager);
}

/**
 * 核心帧结束时
 * @param dt 
 */
export function CoreOnLateUpdate(dt: number) {
    Managers.onLateUpdate(dt);
}
