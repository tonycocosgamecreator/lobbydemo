import Module from "../struct/module";
import BaseManager from "./base-manager";

export default class ModuleManager extends BaseManager{
    public static KEY = 'ModuleManager';
    public static BundleName = 'resources';

    public static clear() {}


    /**
     * 当前所有的模块
     */
    protected static _modules : {[name : string] : Module} = {};

    /**
     * 获取已经已经存在的模块
     * @param name 
     * @returns 
     */
    public static getModuleAlreadyExist(name : string) : Module | null {
        return this._modules[name] || null;
    }
    /**
     * 获取一个模块，这个模块可能没有被加载
     * @param name 
     * @returns 
     */
    public static async getModule(name : string) : Promise<Module | null> {
        let module = this.getModuleAlreadyExist(name);
        if(module){
            return module;
        }
        module = new Module(name);
        await module.loadBundle();
        this._modules[name] = module;
        return module;
    }
}