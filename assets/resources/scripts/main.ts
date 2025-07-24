import { director } from 'cc';
import { Canvas } from 'cc';
import { AssetManager } from 'cc';
import { Camera } from 'cc';
import { _decorator, Component, Node } from 'cc';
import Constant from './constant';
import Initializer from './init';
import BrowserUtils from './core/utils/browser-utils';
import ViewManager from './core/manager/view-manager';
import ModuleManager from './core/manager/module-manager';
import LobbyManager from './lobby/managers/lobby-manager';
import { StringUtils } from './core/utils/string-utils';
const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {

    public uiCamera: Camera;


    protected onLoad(): void {
        this.uiCamera = director.getScene().getComponentInChildren(Camera);
        //游戏事件注册
        director.addPersistRootNode(this.node);
        //game.on(Game.EVENT_HIDE, this.onEnterBackground, this);
        //game.on(Game.EVENT_SHOW, this.onEnterForgeground, this);
    }

    start() {
        BrowserUtils.Init();
        const fadeOutLogo = window['fadeOutLogo'];
        const canvas = this.uiCamera.node.parent.getComponent(Canvas);
        Constant.CurrentBundleId = AssetManager.BuiltinBundleName.MAIN;
        Initializer.Init(canvas, this.uiCamera);
        Initializer.LoadResources().then(() => {
            fadeOutLogo && fadeOutLogo();
            Constant.CurrentBundleId = AssetManager.BuiltinBundleName.RESOURCES;
            const module = ModuleManager.getModuleAlreadyExist(AssetManager.BuiltinBundleName.RESOURCES);
            LobbyManager.account = StringUtils.getSecureRandomString(16);
            ViewManager.OpenPanel(module, "PanelLobby");
        });
    }

    lateUpdate(dt: number) {
        Initializer.OnLateUpdate(dt);
    }
}


