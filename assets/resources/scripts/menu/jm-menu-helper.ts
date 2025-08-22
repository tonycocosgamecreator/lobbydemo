import ModuleManager from "db://assets/resources/scripts/core/manager/module-manager";
import PoolManager from "db://assets/resources/scripts/core/manager/pool-manager";
import ViewManager from "db://assets/resources/scripts/core/manager/view-manager";
import * as cc from "cc";
import CustomRule from "db://assets/resources/scripts/view/CustomRule";
import CustomMenuHistoryItem from "db://assets/resources/scripts/view/CustomMenuHistoryItem";
import CustomMenuHistoryTitle from "db://assets/resources/scripts/view/CustomMenuHistoryTitle";
import PanelSystemMenu from "../view/PanelSystemMenu";
import JmHistoryManager from "../manager/jm-history-manager";
import { SystemMenuHelper } from "../helper/system-menu-helper";
export default class JmMenuHelper {
    public static OpenMenu(targetId = 0) {
        ViewManager.Open(
            PanelSystemMenu,
            {
                game_bundle_name: 'Jhandimunda',
                menuRender: this._menuRender.bind(this),
                targetId: targetId,
                bDestoryItem: true,
            }
        );
    }

    /**
     * 渲染指定id的菜单
     * @param menuId 
     * @returns 
     */
    private static async _menuRender(menuId: number): Promise<cc.Node | null> {
        //根据menuId渲染菜单
        if (menuId == 0) {
            const module = ModuleManager.getModuleAlreadyExist('resources');
            JmHistoryManager.clear();
            const titleNode = PoolManager.Get(CustomMenuHistoryTitle).node;
            const itemPrefab = module.getPrefab('prefabs/CustomMenuHistoryItem');
            const render = (node: cc.Node, index: number) => {
                //渲染逻辑
                let comp = node.getComponent(CustomMenuHistoryItem);
                if (!comp) {
                    comp = node.addComponent(CustomMenuHistoryItem);
                    comp.bindResourceConfig();
                }
                const data = JmHistoryManager.getIndex(index);
                comp.fillData(data);
            }
            const requestMore = () => {
                //请求更多历史记录
                return JmHistoryManager.doNetGetHistory();
            }
            const getCount = () => {
                //获取当前历史记录的数量
                return JmHistoryManager.count;
            }
            const clickItem = (item: cc.Node, index: number, lastIndex: number, bSelected?: boolean) => {
                // bDebug && console.log('clickItem',index);
                // const data = SpeedCashPlayerHistoryHelper.getIndex(index);
                // const info = Tools.deepClone(data);
                // ViewManager.Open(
                //     PanelFairness,
                //     {
                //         history : info
                //     }
                // );
            }
            /**
             * 
             * @returns 是否是最后一页
             */
            const isLastPage = () => {
                return JmHistoryManager.isLastPage;
            }
            return SystemMenuHelper.CreateSystemHistoryView(titleNode, itemPrefab, render, requestMore, getCount, clickItem, isLastPage);
        } else if (menuId == 1) {
            const comp = PoolManager.Get(CustomRule);
            if (comp) {
                comp.bindResourceConfig();
                return comp.node;
            }
            return null;
        } else if (menuId == 5) {
            // const comp = PoolManager.Get(CustomFairnessRule);
            // if(comp){
            //     comp.bindResourceConfig();
            //     return comp.node;
            // }
            return null;
        }
        return null;
    }
}