import { bDebug } from "../define";
import { Tools } from "../utils/tools";
import { GButtonStatisticalInfo, PanelStatisticalInfo, StatisticalEvent } from "./statistical-define";

export default class StatisticalHelper {
    
    /**
     * 注册好的界面打点信息
     */
    private static _panel_statistical_infos : {[viewName : string] : PanelStatisticalInfo} = {};
    /**
     * 注册好的按钮打点信息
     */
    private static _button_statistical_infos : {[viewName : string] : {[buttonName : string] : GButtonStatisticalInfo}} = {};   

    /**
     * 注册指定bundleName的界面打点信息
     * @param bundleName 
     */
    public static registerStatisticalDatas(bundleName : string){
        let dbName      = bundleName + 'Db';
        const bundleDb  = window[dbName];
        if(!bundleDb){
            console.error('bundleName -> ' + bundleName + ' not found! register Panel statistical info fail!');
            return;
        }
        //PANEL
        const dbNameLower = bundleName.toLocaleLowerCase();
        let fName = 'get_panel_' + dbNameLower + '_statistical_db';
        let tFunc = bundleDb[fName];
        if(tFunc){
            const datas = tFunc();
            Tools.forEachMap(datas,(k,v)=>{
                this._panel_statistical_infos[k] = v;
            });
            bDebug && console.log('register panel statistical info success -> ' + bundleName);
        }else{
            console.error('can not found function -> ' + fName + ' in ' + dbName);
        }
        //BUTTON
        fName = 'get_gbutton_' + dbNameLower + '_statistical_db';
        tFunc = bundleDb[fName];
        if(tFunc){
            const datas = tFunc() as {
                [viewName: string]: {
                    [buttonName: string]: GButtonStatisticalInfo,
                },
            };
            Tools.forEachMap(datas,(k,vs)=>{
                if(!this._button_statistical_infos[k]){
                    this._button_statistical_infos[k] = {};
                }
                Tools.forEachMap(vs,(kk,v)=>{
                    this._button_statistical_infos[k][kk] = v;
                });
            });
            bDebug && console.log('register button statistical info success -> ' + bundleName);
        }else{
            console.error('can not found function -> ' + fName + ' in ' + dbName);
        }
    }
    /**
     * 获取指定界面的指定按钮的打点信息
     * @param viewName 
     * @param buttonName 
     * @returns 
     */
    public static getGButtonStatisticalInfo(viewName : string,buttonName : string) : GButtonStatisticalInfo{
        if(this._button_statistical_infos[viewName]){
            return this._button_statistical_infos[viewName][buttonName];
        }
        return null;
    }
    /**
     * 获取界面打点信息
     * @param viewName 
     * @returns 
     */
    public static getPanelStatisticalInfo(viewName : string) : PanelStatisticalInfo{
        return this._panel_statistical_infos[viewName];
    }
}