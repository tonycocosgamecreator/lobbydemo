import { Component, Node, NodeEventType, _decorator, __private, CCObject, Animation, Asset, tween, UIOpacity, warn, View, Tween, BlockInputEvents } from 'cc';
import { AssetType, ClickEventCallback, EmptyCallback, ModuleLoadInfo, ViewBindConfigResult, bDebug } from '../define';
import Coroutine from '../coroutine/coroutine';
import { Tools } from '../utils/tools';
import { GButton } from './gbutton';
import { PanelLayer, ViewOpenAnimationType } from './view-define';
import ModuleManager from '../manager/module-manager';
import Module from '../struct/module';
import { I18NRoot } from '../i18n/i18n-root';
import { Sprite } from 'cc';
import { SpriteFrame } from 'cc';
import { Prefab } from 'cc';
import Timer from '../utils/timer';
import ICaller from '../message/icaller';
import { Widget } from 'cc';
import { ConnectorType } from '../net/net-define';
import ViewUtils from '../utils/view-utils';
import StatisticalHelper from '../statistical/statistical-helper';
import { StatisticalEvent, StatisticalReportMessage } from '../statistical/statistical-define';
import BaseGlobal from '../message/base-global';

const { ccclass, property } = _decorator;

declare type CONTEXT = {};



export enum ViewEvent {
    /**
     * 打开效果已经结束
     */
    OPEN_ANIMTION_END = 'OPEN_ANIMTION_END',
}

@ccclass('ViewBase')
export default abstract class ViewBase extends Component implements ICaller {
    /**
     * 是否关闭了，或者在关闭的过程中
     * 例如：有的界面会有一个关闭的动效，而这个动效播放过程中，也会认为这个界面关闭了
     */
    protected _isClosing = false;
    /**
     * 是否点击mask关闭此界面
     */
    private _bclick_mask_close = false;
    /**
     * mask的透明度
     * 默认0.25
     */
    protected _mask_opacity = 160;
    
    /**
     * 界面开启效果
     */
    protected _open_animation_type: ViewOpenAnimationType = ViewOpenAnimationType.NONE;

    /**
     * 是否吞噬点击，仅对Panel生效
     */
    protected _isSwallowTouch = true;
    /**
     * 是否已经调用了onLoaded
     */
    protected _isOnLoadedCalled = false;
    /**
     * onLoaded调用回调
     */
    private _onLoadedCall: EmptyCallback | null = null;

    /**
     * 弹窗的MASK背景
     */
    public maskNode: Node | null = null;

    /**
     * 关闭后的回调函数
     */
    public onClose : EmptyCallback | null   = null;
    /**
     * 完全打开以后的回调函数
     */
    public onOpenComplete: EmptyCallback | null = null;

    /**
     * 是否是有效的调用者
     */
    public isCallerValid: boolean = false;
    /**
     * 当前上下文参数
     */
    public context: CONTEXT | null = null;

    /**
     * 是否已经绑定了资源配置
     */
    private _bConfigBinded = false;

    /**
     * 请重写，以加入不同的层级
     */
    public panelLayer: PanelLayer = PanelLayer.Default;
    /**
     * 打开的时间，毫秒
     */
    private _enter_panel_time : number  = -1;

    protected onLoad(): void {
        this._enter_panel_time  = Timer.now;
        this._isClosing = false;
        this.isCallerValid = true;
        this.bindResourceConfig();
        let i18n = this.getComponent(I18NRoot);
        if(!i18n){
            //如果没有，就主动加上
            i18n = this.node.addComponent(I18NRoot);
        }
        //更新bundle名字
        i18n.updateBundleName(this.bundleName);
        //初始化
        i18n.init(this.viewName);
        //更新皮肤
        //SkinHelper.changeSkin(this.viewName,this._nodes);

        if(this.context) {
            if(this.context['onOpenComplete']){
                this.onOpenComplete = this.context['onOpenComplete'];
            }
        }

        const mask = this.node.getChildByName('mask');
        if (mask) {
            let opacity = mask.getComponent(UIOpacity);
            if (!opacity) {
                opacity = mask.addComponent(UIOpacity);
            }
            if (this._open_animation_type != ViewOpenAnimationType.NONE) {
                opacity.opacity = 0;
            }

            mask.on(
                NodeEventType.TOUCH_END,
                (event : Event) => {
                    if (!this._bclick_mask_close) {
                        return true;
                    }
                    this.close();
                },
                this,
            );
            this.maskNode = mask;
        }
        const bg = this.node.getChildByName('bg') || this.node.getChildByName('cc_bg');
        if(this.viewName.startsWith('Panel') && this._isSwallowTouch){
            //被BG加上 一个吞噬事件的组件
            if (bg) {
                const bgb = bg.getComponent(BlockInputEvents);
                if (!bgb) {
                    bg.addComponent(BlockInputEvents);
                }
            }else{
                //如果没有bg，就在根节点上加
                const bgb   = this.getComponent(BlockInputEvents);
                if(!bgb){
                    this.addComponent(BlockInputEvents);
                }
            }
        }
        

        if (this._open_animation_type != ViewOpenAnimationType.NONE && bg) {
            //this.showOpenAnimation();
            this.showMaskFadeIn();
            ViewUtils.showViewOpenEffect(bg,this._open_animation_type,0.25,()=>{
                this.onOpenComplete && this.onOpenComplete();
            });
        }
        this._isOnLoadedCalled = true;
        if (this._onLoadedCall) {
            this._onLoadedCall();
            this._onLoadedCall = null;
        }
        if (this.viewName.startsWith('Panel') && this._isSwallowTouch) {
            let comp = this.getComponent(BlockInputEvents);
            if (!comp) {
                comp = this.addComponent(BlockInputEvents);
            }
        }
    }

    protected onDestroy(): void {
        const time = Timer.now - this._enter_panel_time;
        
        if(this.viewName.startsWith('Panel')){
            bDebug && console.log('界面：',this.viewName,'->停留时间：',time,'打点需要监听->',StatisticalReportMessage.BUTTON_STATISTICAL);
            const info = StatisticalHelper.getPanelStatisticalInfo(this.viewName);
            if(info){
                const res = Tools.deepClone(info);
                res['duration'] = time / 1000 + 'S';
                //StatisticalHelper.report(StatisticalEvent.VIEW_DURATION,res);
                BaseGlobal.sendMsg(StatisticalReportMessage.BUTTON_STATISTICAL,res);
            }else{
                console.warn('Can not find panel statistical info for view -> ',this.viewName);
            }
        }
        this.node.targetOff(this);
        this.isCallerValid  = false;
        this.onClose        = null;
        BaseGlobal.removeAllListeners(this);
    }

    /**
     * 根据名字获得一个子节点
     * @param name
     * @returns
     */
    protected getChildByName(name: string): Node | null {
        const node = this._nodes[name];
        if (!node) {
            return null;
        }
        return node;
    }

    //===========================装饰器方法==========================//
    /**
     * 使用此 装饰器 标记一个方法
     * 1.拦截被标记的方法，使之该方法必须在onLoad函数调用之后才能被调用
     * @param targetClassPrototype
     * @param methodName
     * @param decri
     */
    public static requireResourceLoaded(targetClassPrototype: any, methodName: any, decri: PropertyDescriptor) {
        // 保存原始方法
        const datapropsmethod = decri.value;

        decri.value = function (...args: any) {
            if (this._isOnLoadedCalled) {
                // 执行原方法
                datapropsmethod.call(this, ...args);
            } else {
                this._onLoadedCall = () => {
                    // 执行原方法
                    datapropsmethod.call(this, ...args);
                };
            }
        };
    }

    //===========================公共方法============================//
    /**
     * 等待这个界面关闭
     */
    public async WaitPanelClosed() : Promise<void> {
        return new Promise<void>((resolve) => {
            this.onClose = () => {
                resolve();
            };
        });
    }

    /**
     * 监听一个view的消息
     * @param event
     * @param call
     * @param target
     */
    public registeEventListener<T extends ViewBase>(event: ViewEvent, call: Function, target?: T) {
        this.node.on(event, call, target);
    }
    /**
     * 取消监听
     * @param target
     */
    public unregisteEventListenerAll<T extends ViewBase>(target: T) {
        this.node.targetOff(target);
    }

    /**
     * 直接关闭
     * @todo : 这里可以重构，关闭的时候可选关闭动效
     */
    public close(bImmediately: boolean = false) {
        if (this._isClosing) {
            return;
        }
        this._isClosing = true;
        if (bImmediately) {
            this.node.removeFromParent();
            this.node.destroy();
            this.onClose && this.onClose();
        }else{
            this.showCloseAnimation().then(() => {
                this.node.removeFromParent();
                this.node.destroy();
                this.onClose && this.onClose();
            });
        }
    }
    /**
     * mask渐出
     */
    public async showMaskFadeOut(tm: number = 0.15) {
        if (!this.maskNode) {
            return;
        }
        const opacity = this.maskNode.getComponent(UIOpacity);
        tween(opacity)
            .to(tm, {
                opacity: 0,
            })
            .start();
        await Coroutine.WaitTime(tm);
    }

    public async showMaskFadeIn(tm: number = 0.15) {
        if (!this.maskNode) {
            return;
        }
        const opacity = this.maskNode.getComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity)
            .to(tm, {
                opacity: this._mask_opacity,
            })
            .start();
        await Coroutine.WaitTime(tm);
    }
    
    /**
     * 关闭
     */
    public async showCloseAnimation(tm: number = 0.25) {
        const bg = this.node.getChildByName('bg') || this.node.getChildByName('cc_bg');
        if (!bg) {
            return;
        }
        if (this._open_animation_type == ViewOpenAnimationType.NONE) {
            warn('目前只写了从下到上冒出，停留在底部的逻辑！~');
            return;
        }
        Tween.stopAllByTarget(bg);
        await ViewUtils.showViewCloseEffect(bg, this._open_animation_type, tm);
        // const h = bg.height;
        // let targetY = -BaseGlobal.height / 2 - h;
        // if (this._open_animation_type == ViewOpenAnimationType.BOTTOM_TO_CENTER) {
        //     targetY = -BaseGlobal.height / 2 - h / 2;
        // }
        // tween(bg)
        //     .to(tm, {
        //         y: targetY,
        //     })
        //     .start();
        // await WaitTime(tm - 0.15);
        // await this.showMaskFadeOut();
    }

    /**
     * 是否已经销毁了（关闭动效过程也将被认为关闭）
     */
    public get isDestroyed() {
        return this._isClosing;
    }

    

    /**
     *
     * @returns 是否允许点击Mask关闭此界面
     * 注意:
     *      1.必须要有一个名字叫做 mask 的Node
     *      2.除了mask以外的其他内容需要放在同一个Node上，且该Node需要添加BlockInputEvents组件，拦截点击事件,如果你没有加，我会自动加上
     */
    public get isCloseByClickMask() {
        return this._bclick_mask_close;
    }

    public set isCloseByClickMask(val: boolean) {
        this._bclick_mask_close = val;
    }

    //============================资源相关方法=============================//
    /**
     * 获取当前界面所属的Module
     */
    public get module(): Module {
        return ModuleManager.getModuleAlreadyExist(this.bundleName);
    }
    /**
     * 从当前界面所属的bundle中获取一个资源
     * @param path 以bundle根目录为起点 例如：prefabs/xxx
     * @param type 类型
     * @param call
     * @warn 注意：
     * 1.如果你需要获取SpriteFrame，请在path后加上/spriteFrame.
     * 2.如果你需要获取Texture2d,请在path后加上/texture
     * 3.其余类型不需要加后缀
     */
    public getAsset<T extends Asset>(path: string, type: AssetType<T>, call: (asset: T) => void) {
        const bunlde = this.module.bundle;
        const data = bunlde.get(path, type);
        if (data) {
            call && call(data);
            return;
        }
        bunlde.load(path, type, (err, ast) => {
            if (err || !ast) {
                call && call(null);
                return;
            }
            call && call(ast);
        });
    }

    /**
     * 异步获取一个资源
     * @param url
     * @param type
     * @returns
     */
    public async get<T extends Asset>(url: string, type: AssetType<T>): Promise<T | null> {
        const bunlde = this.module.bundle;
        const data = bunlde.get(url, type);
        if (data) {
            return data;
        }
        return new Promise<T>((resolve) => {
            bunlde.load(url, type, (err, data) => {
                if (err || !data) {
                    console.error('this.get has error => ',err);
                    resolve(null);
                    return;
                }
                resolve(data);
            });
        });
    }

    /**
     * 获取很多个资源
     * @param urls
     * @param type
     * @param call
     */
    public getAssets<T extends Asset>(urls: string[], type: AssetType<T>, call: (assets: T[] | null) => void) {
        const bunlde = this.module.bundle;

        let results : T[] = [];
        let bSuccess = true;
        for(let i = 0; i < urls.length; i++){
            const data = bunlde.get(urls[i], type);
            if(data){
                results.push(data);
            }else{
                bSuccess = false;
                break;
            }
        }
        if(bSuccess){
            call && call(results);
            return;
        }
        //没有就去加载
        bunlde.load(urls, type, (err, dats) => {
            if (err) {
                call(null);
                return;
            }
            call(dats);
        });
    }   
    /**
     * 直接获取一个图片，如果没有返回undefined
     * @param url 
     * @returns 
     */
    public getSpriteFrame(url: string): SpriteFrame | undefined {
        const module    = this.module;
        const spf       = module.getSpriteFrame(url);
        return spf;
    }
    /**
     * 获取指定数量的图片，如果找不到 会在数组对应位置填充null
     * @param urls 
     * @returns 
     */
    public getSpriteFrames(urls: string[]): SpriteFrame[] {
        const module = this.module;
        return module.getSpriteFrames(urls);
    }

    /**
     * 调用此方法，你肯定知道自己在做什么，对吧
     * 已经加载过的方法，可以使用此方法直接获得
     * 否则，请使用上面的getAsset方法
     * @param path
     * @param type
     */
    public getAssetAlreadyExit<T extends Asset>(path: string, type: AssetType<T>): T {
        const bundle = this.module.bundle;
        return bundle.get(path, type);
    }

    /**
     * 设置一张图片的SpriteFrame
     * @param sp 
     * @param url 
     */
    public changeSpriteFrame(sp : Sprite,url : string,bActive : boolean = true){
        const data = this.getSpriteFrame(url);
        if(this && data && this.isValid && sp && sp.isValid){
            sp.node.active  = bActive;
            sp.spriteFrame  = data;
        }
    }
    /**
     * 获取指定名字的预制体
     * @param name 
     * @returns 
     */
    public getPrefab(name: string): Prefab | undefined {
        return this.module.getPrefab(name);
    }

    /**
     * 手动添加一个Widget组件
     * @param top 
     * @param bottom 
     * @param left 
     * @param right 
     */
    public addWidget(top?: number, bottom?: number, left?: number, right?: number) {
        let widget = this.node.getComponent(Widget) || this.node.addComponent(Widget);
        if(top != undefined){
            widget.isAlignTop = true;
            widget.top = top;
        }
        if(bottom != undefined){
            widget.isAlignBottom = true;
            widget.bottom = bottom;
        }
        if(left != undefined){
            widget.isAlignLeft = true;
            widget.left = left;
        }
        if(right != undefined){
            widget.isAlignRight = true;
            widget.right = right;
        }
        widget.updateAlignment();
    }

    //============================私有方法=============================//

    /**
     * 当前所有的节点
     */
    private _nodes: { [name: string]: Node } = {};
    /**
     * 绑定
     */
    public bindResourceConfig() {
        if(this._bConfigBinded){
            return;
        }
        this._nodes = {};
        this._markAllNodes(this.node);
        //console.log("找到当前所有的节点：",this._nodes);
        const config = this._getResourceBindingConfig();
        //console.log("所有配置：",config);
        Tools.forEachMap(config, (varname : string, v) => {
            const node = this._nodes[varname];
            if (!node) {
                bDebug && console.warn('警告，无法找到节点：' + varname + '->' + this.node.name);
                return;
            }
            const vartype = v[0];
            const call = v[1];

            const argName = varname.substring(3);
            //console.log(varname + "->类型：",vartype['VIEW_NAME']);
            const typeName = vartype['VIEW_NAME'];
            if (!typeName) {
                bDebug && console.error('找不到这个类型(直接赋值node)：', varname);
                this[argName] = node;
                return;
            }
            if (typeName.startsWith('Custom')) {
                this[argName] = node.addComponent(typeName);
                //主动调用一次
                this[argName].bindResourceConfig();
                if (call) {
                    const btn = node.addComponent(GButton);
                    btn.registerOneClickHandler(call);
                    //=========FOR STATISTICS BEGIN=========//
                    btn.BUNDLE_NAME = this.bundleName;
                    btn.PANEL_NAME  = this.viewName;
                    //=========FOR STATISTICS END=========//
                }
            }

            if (typeName == 'GButton') {
                if (call) {
                    const btn = node.addComponent(GButton);
                    btn.registerOneClickHandler(call);
                    this[argName]   = btn;
                    //=========FOR STATISTICS BEGIN=========//
                    btn.BUNDLE_NAME = this.bundleName;
                    btn.PANEL_NAME  = this.viewName;
                    //=========FOR STATISTICS END=========//
                }
            } else {
                if (typeName != 'Node') {
                    const obj = node.getComponent(vartype as any);
                    //console.log("获取组件结束：",obj);
                    this[argName] = obj;
                } else {
                    //Node
                    this[argName] = node;
                }
            }
        });
        this._bConfigBinded = true;
    }
    /**
     * 递归
     * @param node
     * @param level
     */
    private _markAllNodes(node: Node, level: number = 0) {
        if (node.name) {
            this._nodes[node.name] = node;
        }
        if (level > 0 && node['_prefab'] && node['_prefab']['root'] == node) {
            return;
        }
        const children = node.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            this._markAllNodes(child, level + 1);
        }
    }

    /**
     * 重构，当重复打开一个已经存在的界面时，会调用此方法
     * 你可以重写这个方法，来处理自己的逻辑
     */
    public reBuild(){
        bDebug && console.log('reBuildView -> ',this.viewName);
    }

    //===========================子类自动重写方法，自动生成，请勿修改=====================//
    /**
     * 子类重写
     * 请勿修改，脚本自动生成
     */
    protected abstract _getResourceBindingConfig(): ViewBindConfigResult;

    /**
     * 来自网络消息的通知
     * 如果你处理完成，不需要其他人再处理的，请返回true，否则，返回false
     * @param msgType
     * @param data
     * @param connectorType 来自哪个连接器
     */
    public onNetworkMessage(msgType: string, data: any,connectorType : ConnectorType | string = ConnectorType.Lobby): boolean {
        return false;
    };
    /**
     * 子类重写，返回true表示已经处理，不需要继续传递，否则，继续传递
     * @returns 
     */
    public onNativeBackButtonClicked() : boolean {
        return false;
    }

    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
     */
    public static VIEW_NAME = '';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
     */
    public static BUNDLE_NAME = 'resources';
    /**
     * 导出脚本自动生成，不要管
     */
    public abstract bundleName: string;
    /**
     * 导出脚本自动生成，不要管
     */
    public abstract viewName: string;
}
