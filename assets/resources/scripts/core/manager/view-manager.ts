import * as cc from 'cc';
import { AssetType, bDebug } from '../define';
import { PanelLayer } from '../view/view-define';
import ViewBase from '../view/view-base';
import Module from '../struct/module';
import ModuleManager from './module-manager';
import { ViewAdaptor } from 'db://assets/resources/scripts/view-adapter';
import BaseGlobal from '../message/base-global';
import { BaseMessage } from '../message/base-message';
import { ConnectorType } from '../net/net-define';
import PoolManager from './pool-manager';
import ReusableBase from '../view/reusable-base';
/**
 * 这是一个纯粹的管理器，和Manager没有关系
 * 消息分发时，需要首先将消息推送到所有的管理器进行处理
 * 然后再推送到界面上，所以ViewManager不能继承BaseManager
 */
export default class ViewManager {
    /**
     * 当前的UI相机
     */
    protected static _camera: cc.Camera | null = null;

    public static get camera(): cc.Camera | null {
        return this._camera;
    }

    public static set camera(camera: cc.Camera | null) {
        this._camera = camera;
    }

    /**
     * 当前所有界面的所有层级
     */
    private static _viewRoots: { [type: string]: cc.Node } = {};

    /**
     * 当前所有界面的所有层级
     */
    private static _panels: { [layer: string]: ViewBase[] } = {};
    /**
     * 是否初始化
     */
    protected static _isInit = false;

    public static Init(canvas: cc.Canvas, camera: cc.Camera) {
        this._camera = camera;
        const viewRoot = canvas.node.getChildByName('viewRoot');
        if (!viewRoot) {
            bDebug && console.error("Error, unable to find the node: viewRoot under canvas!");
            return;
        }
        const uiTrans = viewRoot.getComponent(cc.UITransform);
        const width = uiTrans.width;
        const height = uiTrans.height;
        const visibleSize = cc.view.getVisibleSize();
        const designPxToScreenPxRatio = Math.min(width / visibleSize.width, height / visibleSize.height);
        bDebug && console.log('Current resolution ratio：' + designPxToScreenPxRatio);
        for (const k in PanelLayer) {
            const node = viewRoot.getChildByName(k);
            if (!node) {
                bDebug && console.error('Error: Unable to find the hierarchical node under viewRoot:', k);
                continue;
            }
            this._viewRoots[k] = node;
        }
        window['toClickNativeBackButton'] = this.onNativeBackButtonClicked.bind(this);
        this._isInit = true;
    }

    /**
     * 有的Custom节点需要直接挂在到ViewRoot上，而不是Panel上
     * 例如：Tip
     * @param comp 
     * @param context 
     */
    public static AddCustomNode<T extends ViewBase>(comp: T, context?: any) {
        const layer = comp.panelLayer;
        const root = this._viewRoots[layer];
        root.addChild(comp.node);
        comp.context = context;
        const panels = this.GetPanels(layer);
        panels.push(comp);
    }
    /**
     * 你传入一个完整的Panel的类型（不是字符串）来打开它
     * 这个方法一般不常用，容易导致循环引用
     * @param panel 
     * @param context 
     */
    public static Open<T extends ViewBase>(panel: AssetType<T>, context?: any): ViewBase | null {
        const bundleName = panel['BUNDLE_NAME'];
        const viewName = panel['VIEW_NAME'];
        const module = ModuleManager.getModuleAlreadyExist(bundleName);
        if (!module) {
            bDebug && console.error('The module does not exist, unable to open the interface:', bundleName, viewName);
            return null;
        }
        return this.OpenPanel(module, viewName, context);
    }

    /**
     * 从指定模块中，打开一个界面
     * 注意，默认所有的预制体都已经放到prefabs目录下且已经被加载到内存中
     * @param module 模块（即bundleId）
     * @param viewName 预制体名字
     * @param context 需要丢过去的参数吗，这个可选
     * @param subFolder 子文件夹，如果为空，则默认是prefabs目录
     */
    public static OpenPanel(module: Module, viewName: string, context?: any, subFolder?: string): ViewBase | null {
        if (!this._isInit) {
            bDebug && console.error('ViewManager not initialized, unable to open the interface:', module, viewName);
            return null;
        }
        if (!module || !module.isLoaded) {
            bDebug && console.error('Module not loaded, unable to open interface:', module, viewName);
            return null;
        }
        //不接受有空格的东西
        viewName = viewName.trim();
        //检查是否已经打开这个界面了，如果有，直接把context传进去
        let panel = this.GetPanelByName(viewName);
        if (panel) {
            bDebug && console.warn('The interface is already open, just pass in the context directly.', viewName, context, "，The interface will trigger the reBuild method, please override this method.");
            panel.context = context;
            panel.reBuild();
            return panel;
        }
        let url = "prefabs/";
        if (subFolder && subFolder.length > 0) {
            url += subFolder + "/";
        }
        url += viewName;
        const prefab = module.getPrefab(url);
        if (!prefab) {
            bDebug && console.error('The prefab does not exist, unable to open the interface.：', module, url, viewName);
            return null;
        }
        if (viewName.includes("/")) {
            let paths = viewName.split("/");
            viewName = paths[paths.length - 1]; //如果有斜杠，取最后一个部分
        }
        //重新实例化
        const node = cc.instantiate(prefab);
        panel = node.addComponent(viewName) as ViewBase;
        panel.context = context;
        const layer = panel.panelLayer;
        const root = this._viewRoots[layer];
        root.addChild(node);
        const panels = this.GetPanels(layer);
        //缓存到本地
        panels.push(panel);
        bDebug && console.log('Open View Success', module.name, viewName, "，context:", context);
        return panel;
    }
    /**
     * 打开一个复用界面
     * @param panel 
     * @param context 
     * @returns 
     */
    public static OpenReuseablePanel<T extends ReusableBase>(panel: AssetType<T>, context?: any): ReusableBase | null {
        const view = PoolManager.Get(panel);
        if (!view) {
            bDebug && console.error('Failed to obtain reusable interface:：', panel, context);
            return null;
        }
        view.context = context;
        const node = view.node;
        const layer = view.panelLayer;
        const root = this._viewRoots[layer];
        root.addChild(node);
        const panels = this.GetPanels(layer);
        //缓存到本地
        panels.push(view);
        return view;
    }

    /**
     * 关闭一个界面
     * @param viewName 
     */
    public static ClosePanel(viewName: string) {
        const panel = this.GetPanelByName(viewName);
        if (!panel) {
            bDebug && console.warn('No interface to close was found:', viewName);
            return;
        }
        if (panel.isDestroyed || !cc.isValid(panel) || !cc.isValid(panel.node)) {
            bDebug && console.warn('The interface has been destroyed and cannot be closed:', viewName);
            return;
        }
        panel.close();
        bDebug && console.log('Interface closed successfully:', viewName);
    }
    /**
     * 隐藏一个界面
     * @param viewName 
     * @returns 
     */
    public static HidePanel(viewName: string): void {
        const panel = this.GetPanelByName(viewName);
        if (!panel) {
            bDebug && console.warn('No interface to hide was found:', viewName);
            return;
        }
        if (panel.isDestroyed || !cc.isValid(panel) || !cc.isValid(panel.node)) {
            bDebug && console.warn('The interface has been destroyed and cannot be hidden:', viewName);
            return;
        }
        panel.node.active = false;
        bDebug && console.log('Successfully hidden the interface:', viewName);
    }

    /**
     * 显示一个界面
     * @param viewName 
     * @returns 
     */
    public static ShowPanel(viewName: string): void {
        const panel = this.GetPanelByName(viewName);
        if (!panel) {
            bDebug && console.warn('The required interface to display was not found:', viewName);
            return;
        }
        if (panel.isDestroyed || !cc.isValid(panel) || !cc.isValid(panel.node)) {
            bDebug && console.warn('The interface has been destroyed and cannot be displayed:', viewName);
            return;
        }
        panel.node.active = true;
        bDebug && console.log('Display interface successful:', viewName);
    }


    /**
     * 获取指定模块所有的界面
     * @param bunleId 
     * @returns 
     */
    public static GetPanelsByBundle(bunleId: string): ViewBase[] {
        if (!this._isInit) {
            bDebug && console.error('ViewManager not initialized, unable to access the interface:', bunleId);
            return [];
        }
        let panels: ViewBase[] = [];
        for (const k in this._panels) {
            const p = this._panels[k];
            for (let i = 0; i < p.length; i++) {
                const panel = p[i];
                if (panel && panel.bundleName === bunleId) {
                    panels.push(panel);
                }
            }
        }
        return panels;
    }
    /**
     * 关闭指定bundle的所有界面
     * 注意：这个方法会触发直接关闭，不会有关闭的动画效果
     * @param bunleId 
     * @returns 
     */
    public static ClosePanelsByBundle(bunleId: string): void {
        if (!this._isInit) {
            bDebug && console.error('ViewManager not initialized, unable to close the interface:', bunleId);
            return;
        }
        let panels = this.GetPanelsByBundle(bunleId);
        if (panels.length <= 0) {
            bDebug && console.warn('No interface to close was found:', bunleId);
            return;
        }
        for (let i = panels.length - 1; i >= 0; i--) {
            const panel = panels[i];
            if (panel && !panel.isDestroyed && cc.isValid(panel) && cc.isValid(panel.node)) {
                panel.close(true);
            }
        }
    }
    /**
      * 新增一个CustomNode到指定的Layer上
      * @param comp 
      * @param context 
      */
    public static addCustomNode<T extends ViewBase>(comp: T, context?: any) {
        const layer = comp.panelLayer;
        const root = this._viewRoots[layer];
        root.addChild(comp.node);
        comp.context = context;
        const panels = this.getPanels(layer);
        panels.push(comp);
    }

    /**
     * 获取当前指定层级上的所有ViewBase
     * @param panel
     * @returns
     */
    public static getPanels(panel: PanelLayer): ViewBase[] {
        let panels = this._panels[panel];
        if (!panels) {
            panels = [];
            this._panels[panel] = panels;
        }
        return panels;
    }

    /**
     * 再每一帧结束后，检测是否需要销毁
     * @param dt 
     */
    public static OnLateUpdate(dt: number) {
        if (!this._isInit) {
            return;
        }
        for (const k in this._panels) {
            const panels = this._panels[k];
            //倒叙遍历panels
            for (let i = panels.length - 1; i >= 0; i--) {
                const panel = panels[i];
                if (!panel || panel.isDestroyed || !cc.isValid(panel) || !cc.isValid(panel.node)) {
                    panels.splice(i, 1);
                    //检测到已经销毁，则删除
                    continue;
                }
                if (panel.node.parent == null) {
                    //如果节点没有父节点了，说明已经被销毁了
                    panels.splice(i, 1);
                    continue;
                }
            }
        }
    }
    /**
     * 收到网络消息
     * @param msgType 
     * @param data 
     */
    public static onNetworkMessage(msgType: string, data: any, connectorType: ConnectorType | string = ConnectorType.Lobby): boolean {
        //以层级，从上到下，依次查找，找到第一个返回true的，就停止
        let panelLayers = [PanelLayer.Top, PanelLayer.Dialog, PanelLayer.Default];
        for (let i = 0; i < panelLayers.length; i++) {
            const layer = panelLayers[i];
            const panels = this.GetPanels(layer);
            for (let j = panels.length - 1; j >= 0; j--) {
                const p = panels[j];
                //存在，且没有被销毁，且有效，且存在node
                if (p && !p.isDestroyed && cc.isValid(p) && cc.isValid(p.node) && p.onNetworkMessage(msgType, data, connectorType)) {
                    return true;
                }
            }
        }

        return false;
    }


    /**
     * 获取当前层级的所有界面
     * @param layer 
     * @returns 
     */
    public static GetPanels(layer: PanelLayer): ViewBase[] {
        if (!this._isInit) {
            return [];
        }
        if (!this._panels[layer]) {
            this._panels[layer] = [];
        }
        return this._panels[layer];
    }
    /**
     *  根据viewName获取当前所有层级的界面
     * @param viewName 
     * @returns 
     */
    public static GetPanelByName(viewName: string): ViewBase | null {
        let panelLayers = [PanelLayer.Tips, PanelLayer.Top, PanelLayer.Dialog, PanelLayer.Default];
        for (let i = 0; i < panelLayers.length; i++) {
            const layer = panelLayers[i];
            const panels = this.GetPanels(layer);
            for (let j = panels.length - 1; j >= 0; j--) {
                const p = panels[j];
                if (p && p.viewName === viewName) {
                    return p;
                }
            }
        }
        return null;
    }


    /**
     * 当点击了原生返回键/web-mobile的esc时，触发
     */
    public static onNativeBackButtonClicked() {
        //这里有很多层级，从最上层开始，依次往下找，找到第一个返回true的，就停止    
        let panelLayers = [PanelLayer.Top, PanelLayer.Dialog, PanelLayer.Default];
        for (let i = 0; i < panelLayers.length; i++) {
            const layer = panelLayers[i];
            const panels = this.GetPanels(layer);
            for (let j = panels.length - 1; j >= 0; j--) {
                const p = panels[j];
                if (p && p.onNativeBackButtonClicked()) {
                    return true;
                }
            }
        }
        return false;
    }

    //----------------------------分辨率相关-----------------------//

    protected static _width: number = 0;
    protected static _height: number = 0;

    public static get width(): number {
        return this._width;
    }
    public static get height(): number {
        return this._height;
    }
    /**
     * 更新分辨率
     */
    public static async updateResolution() {
        const adapter = window["viewadapter"] as ViewAdaptor;
        if (!adapter) {
            console.error('Adapter not found, please check!');
            return;
        }
        await adapter.updateResulation();
        this._width = adapter.width;
        this._height = adapter.height;
        BaseGlobal.sendMsg(BaseMessage.ON_CANVAS_RESIZE);
    }
}