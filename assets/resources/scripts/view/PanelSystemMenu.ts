// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug, WaitTime } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------上述内容请勿修改----------------------------//
// @view export import end
import { Global } from '../global';
import PoolManager from '../core/manager/pool-manager';
import CustomSystemMenuBase from './CustomSystemMenuBase';
import AudioManager from '../core/manager/audio-manager';
import I18NManager from '../core/manager/i18n-manager';
import { ViewOpenAnimationType } from '../core/view/view-define';
import { BaseMessage } from '../core/message/base-message';
import { WaitFrame } from '../define';
import BrowserHelper from '../helper/browser-helper';
const { ccclass, property } = cc._decorator;
/**
 * 世界坐标
 */
const TEMP_WPS = new cc.Vec3(0, 0, 0);
/**
 * 局部坐标
 */
const TEMP_LPS = new cc.Vec3(0, 0, 0);

declare type CONTEXT = {
    /**
     * 属于哪一个游戏的菜单，每个游戏的菜单是要定制的
     */
    game_bundle_name: string,
    /**
     * 菜单内容渲染
     * @param menuId 
     */
    menuRender: (menuId: number) => Promise<cc.Node>,
    /**
     * 是否销毁
     */
    bDestoryItem?: boolean,
    /**
     * 进来以后指定选中的ID。可选
     */
    targetId?: number,
};


@ccclass('PanelSystemMenu')
export default class PanelSystemMenu extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    /**
         * 界面开启效果
         */
    protected _open_animation_type: ViewOpenAnimationType = ViewOpenAnimationType.NONE;
    public context: CONTEXT;
    /**
     * 所有的菜单按钮
     */
    private allButtons: GButton[] = [];
    /**
     * 当前显示的按钮
     */
    private showingButtons: { [menuId: number]: GButton } = {};
    /**
     * 当前选中
     */
    private _currentId: number = -1;
    /**
     * 当前菜单中显示的节点
     */
    private _currentNode: cc.Node | null = null;
    /**
     * 是否正在加载
     */
    private _bLoading: boolean = false;

    /**
     * 将一个按钮逐渐显示出来
     * @param gButton 
     */
    private _showOneButtonOut(gButton: GButton) {
        const node = gButton.node;
        node.opacity = 0;
        const scale = node.scale.clone();
        node.setScale(scale.x + 1.5, scale.y + 1.5, scale.z + 1.5);
        node.active = true;
        cc.tween(node).to(
            0.2,
            {
                opacity: 255,
                scale: scale,
            }
        ).start();
    }

    private _recycle(node?: cc.Node) {
        let bCurrent = false;
        if (!node) {
            node = this._currentNode;
            bCurrent = true;
        }
        if (!node) {
            return;
        }
        if (this.context.bDestoryItem) {
            node.destroy();
            if (bCurrent) {
                this._currentNode = null;
            }
            return;
        }
        const comp = node.getComponent(CustomSystemMenuBase);
        if (comp) {
            //归还
            PoolManager.Put(comp);
        } else {
            console.error('can not find CustomSystemMenuBase component,destroy it -> ', node.name);
            node.destroy();
        }
        if (bCurrent) {
            this._currentNode = null;
        }

    }

    /**
     * 移除当前节点
     */
    private async _removeCurrentNode() {
        if (!this._currentNode) {
            return;
        }
        const node = this._currentNode;
        //向右边移动出去的同时，逐渐消失
        const width = this.root.transform.width;
        const self = this;
        cc.tween(node).to(
            0.2,
            {
                x: width + width * 0.5,
                opacity: 0,
            }
        ).call(() => {
            self._recycle(node);
        }).start();
        await WaitTime(0.2);
    }


    private async buildUi() {
        //先隐藏

        Global.registerListeners(
            this,
            {
                [BaseMessage.MUSIC_STATUS_CHANGED]: this._initSoundButton,
                [BaseMessage.ON_CANVAS_RESIZE]: this._onMessageWindowResize,
            }
        );

        const mDatas = resourcesDb.get_system_menu_db();
        for (let i = 0; i < mDatas.length; i++) {
            const mData = mDatas[i];
            const nodeName = mData.nodeName;
            const gButton = this[nodeName] as GButton;
            if (!gButton) {
                console.error('can not find button by nodeName:', nodeName);
                continue;
            }
            gButton['__menu_id__'] = mData.id;
            this.allButtons.push(gButton);
            //先把所有的按钮全部隐藏了，根据当前需求来开
            gButton.node.active = false;
            if (mData.spfUrls.length > 1) {
                //这玩意儿要切换
                //gButton.setSpriteFrameUrlsOfIconWithSelected(cc.resources,mData.spfUrls); 
                //const spfs = SkinHelper.getSkinSpriteFrames(this.viewName,gButton.iconNode.name,mData.spfUrls);
                //gButton.spriteFramesOfIconWithSelected = spfs;
            }
        }

        this.buttonSound.spriteFramesOfIconWithSelected = [
            this.getSpriteFrame('textures/menu/menu_sound_close'),
            this.getSpriteFrame('textures/menu/menu_sound_open')

        ];

        //将bg从最右侧移动进来

        const game_bundle_name = this.context.game_bundle_name;
        const data = resourcesDb.get_from_game_entrance_config_db(game_bundle_name);
        const systemMenus = data.systemMenus;
        for (let i = 0; i < systemMenus.length; i++) {
            const id = systemMenus[i];
            const mData = resourcesDb.get_from_system_menu_db(id);
            if (!mData) {
                console.error('can not find system menu data by id:', id);
                continue;
            }
            const gButton = this.allButtons[id];
            if (!gButton) {
                console.error('can not find button by id:', id);
                continue;
            }
            //显示出来
            this._showOneButtonOut(gButton);
            this.showingButtons[id] = gButton;
            if (id == resourcesDb.MENU_TITLE_ID.Sound) {
                this._initSoundButton();
            }
            await WaitTime(0.15);
            if (!this.isValid) {
                return;
            }
        }

        await WaitFrame(2);
        if (!this.isValid) {
            return;
        }
        let targetId = this.context.targetId;
        if (targetId == undefined || targetId == null) {
            targetId = 0;
        }
        this._changeMenu(targetId);
    }

    //初始化音乐音效按钮
    private _initSoundButton() {
        const soundId = resourcesDb.MENU_TITLE_ID.Sound;
        const gButton = this.showingButtons[soundId];
        if (!gButton) {
            return;
        }
        const isMusicEnabled = AudioManager.isMusicEnabled;
        //const isSoundEnabled    = AudioManager.isSoundEnabled;
        gButton.isSelected = isMusicEnabled;

        bDebug && console.log('The music button is selected:', isMusicEnabled);
    }

    /**
     * 
     * @param id 
     */
    private async _changeMenu(id: number) {
        if (id == this._currentId) {
            return;
        }
        const gButton = this.showingButtons[id];
        if (!gButton) {
            return;
        }
        if (this._bLoading) {
            return;
        }
        this._bLoading = true;
        if (this._currentId >= 0) {
            const button = this.showingButtons[this._currentId];
            button.isSelected = false;
            this._currentId = -1;
        }

        const mData = resourcesDb.get_from_system_menu_db(id);
        const i18n_key = mData.i18n_key;
        const str = I18NManager.getText(i18n_key);
        this.labelTitle.string = str;
        //获取gButton的世界坐标
        gButton.node.getWorldPosition(TEMP_WPS);
        //设置到menuSelected上
        this.menuSelected.node.setWorldPosition(TEMP_WPS);
        gButton.isSelected = true;
        await this._removeCurrentNode();
        if (!this.isValid) {
            return;
        }
        this._currentNode = null;
        if (!this.context.menuRender) {
            console.error('can not find menuRender in context');
            this._bLoading = false;
            return;
        }

        const node = await this.context.menuRender(id);
        if (!node || !this.node.isValid) {
            console.error('can not find node by menuRender');
            this._bLoading = false;
            return;
        }
        this._currentId = id;
        node.x = this.root.transform.width + this.root.transform.width * 0.5;
        node.opacity = 0;
        cc.tween(node).to(
            0.2,
            {
                x: 0,
                opacity: 255,
            }
        ).start();

        this._currentNode = node;
        this.root.addChild(node);
        this._bLoading = false;

    }
    /**
     * 当屏幕大小发生改变的时候
     */
    private async _onMessageWindowResize() {
        const id = this._currentId;
        const gButton = this.showingButtons[id];
        if (!gButton) {
            return;
        }
        await WaitFrame(2);
        if (!this.isValid || !gButton.isValid) {
            return;
        }
        //获取gButton的世界坐标
        gButton.node.getWorldPosition(TEMP_WPS);
        //设置到menuSelected上
        this.menuSelected.node.setWorldPosition(TEMP_WPS);
    }


    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonClose(event: cc.EventTouch) {
        if (this._isClosing) {
            return;
        }
        this._recycle();
        this.close();
    }
    private onClickButtonGameRecords(event: cc.EventTouch) {
        this._changeMenu(0);
    }
    private onClickButtonRules(event: cc.EventTouch) {
        this._changeMenu(1);
    }
    private onClickButtonSound(event: cc.EventTouch) {
        //这个不用切换，直接开关音效
        AudioManager.isMusicEnabled = !AudioManager.isMusicEnabled;
        AudioManager.isSoundEnabled = !AudioManager.isSoundEnabled;
    }
    private onClickButtonExit(event: cc.EventTouch) {
        //退出游戏
        BrowserHelper.back();
    }

    private onClickButtonTest(event: cc.EventTouch) {
        cc.log('on click event cc_buttonTest');
    }


    private onClickButtonTest1(event: cc.EventTouch) {
        cc.log('on click event cc_buttonTest1');
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_bg    : [cc.Node],
            cc_buttonClose    : [GButton,this.onClickButtonClose.bind(this)],
            cc_buttonExit    : [GButton,this.onClickButtonExit.bind(this)],
            cc_buttonGameRecords    : [GButton,this.onClickButtonGameRecords.bind(this)],
            cc_buttonRules    : [GButton,this.onClickButtonRules.bind(this)],
            cc_buttonSound    : [GButton,this.onClickButtonSound.bind(this)],
            cc_labelTitle    : [cc.Label],
            cc_menuSelected    : [cc.Sprite],
            cc_menus    : [cc.Node],
            cc_root    : [cc.Node],
            cc_totalBg    : [cc.Sprite],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected bg: cc.Node    = null;
   protected buttonClose: GButton    = null;
   protected buttonExit: GButton    = null;
   protected buttonGameRecords: GButton    = null;
   protected buttonRules: GButton    = null;
   protected buttonSound: GButton    = null;
   protected labelTitle: cc.Label    = null;
   protected menuSelected: cc.Sprite    = null;
   protected menus: cc.Node    = null;
   protected root: cc.Node    = null;
   protected totalBg: cc.Sprite    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'PanelSystemMenu';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return PanelSystemMenu.BUNDLE_NAME;
    }
   public get viewName(){
        return PanelSystemMenu.VIEW_NAME;
    }
    // @view export resource end
}
