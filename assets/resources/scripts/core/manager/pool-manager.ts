import { NodePool, Prefab, instantiate} from "cc";
import { AssetType, bDebug } from "../define";
import BaseManager from "./base-manager";
import ReusableBase from "../view/reusable-base";
import ModuleManager from "./module-manager";
import { Tools } from "../utils/tools";
import Module from "../struct/module";
/**
 * 复用管理器
 */
export default class PoolManager extends BaseManager {
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'PoolManager';

    /**
     * 你属于哪个bundle
     */
    public static BundleName = 'resources';



    /**
     * 每一个游戏中每一个可复用PREFAB URL对应的对象池
     * @private
     */
    private static _pools : {[bundleName : string] : {[prefabUrl : string] : NodePool}} = {};

    /**
    * 获取指定游戏的所有对象池，如果没有，就会新增一个{}
    * @param bundleName
    */
   private static _GetGamePools(bundleName : string){
       let datas = this._pools[bundleName];
       if(!datas){
          datas = {};
           this._pools[bundleName] = datas;
       }
       return datas;
   }

   /**
    * 清理指定bundleId的游戏的所有对象池
    * 当退出游戏的时候，需要主动调用
    * 只清理对象池，但是不会销毁NodePool对象，因为玩家可能会再次进入
    * @param bundleId
    */
   public static Clear(bundleId : string){
       const datas = this._GetGamePools(bundleId);
       Tools.forEachMap(datas,(k,v)=>{
           v.clear();
       });
   }
   /**
    * 当你不知道是否加载过这个资源的时候，使用异步
    * @param obj 
    * @returns 
    */
   public static async GetAsync<T extends ReusableBase>(obj : AssetType<T>) : Promise<T | null> {
       const bundleName    = obj['BUNDLE_NAME'] as string;
       const pools         = this._GetGamePools(bundleName);
       const viewName      = obj['VIEW_NAME'];
       let pool            = pools[viewName];  
       if(!pool){
           pool        = new NodePool(viewName);
           pools[viewName] = pool;
       }
       const count = pool.size();
       if(count > 0){
           const node = pool.get();
           return node.getComponent(viewName) as T;
       }
       const module    = ModuleManager.getModuleAlreadyExist(bundleName);
       if(!module){
           console.error('module not found:',bundleName);
           return null;
       }
       const prefabUrl = 'prefabs/' + viewName;
       let prefab    = module.getPrefab(prefabUrl);
       if(!prefab){
           console.error('prefab not found:',prefabUrl);
           return null;
       }
       const node  = instantiate(prefab);
       let comp    = node.getComponent(viewName) as T;
       if(!comp){
           comp    = node.addComponent(viewName) as T;
       }
       //自动调用一次reuse
       comp.reuse();
       return comp;
   }

   /**
    * 获取指定bundle下执行viewName的对象池的数量
    * @param bundleName 
    * @param viewName 
    * @returns 
    */
   public static GetCount(bundleName : string,viewName : string) {
        const pools = this._GetGamePools(bundleName);
        const pool = pools[viewName];
        if(!pool){
            return 0;
        }
        return pool.size();
   }

   /**
    * 
    * @param obj 
    * @param context 
    * @param subFolder 如果预制体是在子文件夹下，需要传入子文件夹的名字
    * @returns 
    */
   public static Get<T extends ReusableBase>(obj : AssetType<T>,context? : any,subFolder? : string) : T | null {
       const bundleName    = obj['BUNDLE_NAME'] as string;
       const pools         = this._GetGamePools(bundleName);
       const viewName      = obj['VIEW_NAME'];
       let pool            = pools[viewName];  
       if(!pool){
           pool        = new NodePool(viewName);
           pools[viewName] = pool;
       }
       const count = pool.size();
       if(count > 0){
           const node      = pool.get();
           const comp      = node.getComponent(viewName) as T;
           comp.context    = context;
           bDebug && console.log('get reusable:',viewName);
           return comp;
       }
       const module    = ModuleManager.getModuleAlreadyExist(bundleName);
       if(!module){
           console.error('module not found:',bundleName);
           return null;
       }
       let prefabUrl = 'prefabs/';
       if(subFolder){
           prefabUrl += subFolder + '/';
       }
        prefabUrl += viewName;
       const prefab    = module.getPrefab(prefabUrl);
       if(!prefab){
           console.error('prefab not found:',prefabUrl);
           return null;
       }
       const node  = instantiate(prefab);
       let comp    = node.getComponent(viewName) as T;
       if(!comp){
           comp = node.addComponent(viewName) as T;
           comp.bindResourceConfig();
       }
       comp.context    = context;
       //自动调用一次reuse
       comp.reuse();
       return comp;
   }

   /**
    * 归还一个对象
    * @param obj 
    */
   public static Put<T extends ReusableBase>(obj : T) {
       const viewName = obj.viewName;
       const bundleName = obj.bundleName;
       const pools = this._GetGamePools(bundleName);
       let pool = pools[viewName];
       if(!pool){
           pool = new NodePool(viewName);
           pools[viewName] = pool;
       }
       
       pool.put(obj.node);
       bDebug && console.log('put reusable:',viewName);
    }
}