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
import { StringUtils } from './core/utils/string-utils';
import I18NManager from './core/manager/i18n-manager';
import { lobbyhttp } from './network/net/lobby-https-interface-define';
import { Global } from './global';
import { MessageSender } from './network/net/message-sender';
import UIHelper from './network/helper/ui-helper';
import { ProtoType } from './network/define/define';
import JsonLoginManager from './network/managers/json-login-manager';
const { ccclass, property } = _decorator;

enum NetWorkStatus {
    FAIL_TO_CONNECT = -1,
    NONE = 0,
    SUCCESS_CONNECT = 1,
}
@ccclass('main')
export class main extends Component {

    public uiCamera: Camera;

    private _network_status: NetWorkStatus = NetWorkStatus.NONE;

    protected onLoad(): void {
        this.uiCamera = director.getScene().getComponentInChildren(Camera);
        //游戏事件注册
        director.addPersistRootNode(this.node);
        //game.on(Game.EVENT_HIDE, this.onEnterBackground, this);
        //game.on(Game.EVENT_SHOW, this.onEnterForgeground, this);
    }

    start() {
        //初始化浏览器参数
        BrowserUtils.Init();
        const fadeOutLogo = window['fadeOutLogo'];
        const canvas = this.uiCamera.node.parent.getComponent(Canvas);
        Constant.CurrentBundleId = AssetManager.BuiltinBundleName.MAIN;
        Initializer.Init(canvas, this.uiCamera);
        Initializer.LoadResources().then(async () => {
            Constant.CurrentBundleId = AssetManager.BuiltinBundleName.RESOURCES;
            const module = ModuleManager.getModuleAlreadyExist(AssetManager.BuiltinBundleName.RESOURCES);
            // let bSuccess = false;
            // if (Global.NetWorkProtoType == ProtoType.Protobuf) {
            //     bSuccess = false;
            //     // bSuccess = await ProtoLoginManager.ConnectToServer(false);
            // } else {
            //     bSuccess = await JsonLoginManager.ConnectToServer(false);
            // }
            // this._network_status = bSuccess ? NetWorkStatus.SUCCESS_CONNECT : NetWorkStatus.FAIL_TO_CONNECT;
            // if (bSuccess) {
            //     MessageSender.SendHeartBeatMessage();
            // }

            // if (this._network_status == NetWorkStatus.FAIL_TO_CONNECT) {
            //     fadeOutLogo && fadeOutLogo();
            //     //连接服务器失败
            //     UIHelper.showConfirmOneButtonToBack(I18NManager.getText(resourcesDb.I18N_RESOURCES_DB_INDEX.Tip_SocketConnectFaild));
            //     return;
            // }
            ViewManager.OpenPanel(module, "PanelJmInit");
            fadeOutLogo && fadeOutLogo();
        });
    }

    lateUpdate(dt: number) {
        Initializer.OnLateUpdate(dt);
    }

}


