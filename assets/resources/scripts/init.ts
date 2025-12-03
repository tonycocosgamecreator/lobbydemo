import { NATIVE } from "cc/env";
import { getLanguageIndexByKey, LanguageKey, serverLanguageKeyToLocal } from "./auto/i18n-define";
import Coroutine from "./core/coroutine/coroutine";
import { bDebug } from "./core/define";
import LanguageManager from "./core/manager/language-manager";
import ViewManager from "./core/manager/view-manager";
import BrowserUtils from "./core/utils/browser-utils";
import * as cc from "cc";
import BaseDefine from "./base-define";
import { Tools } from "./core/utils/tools";
import { CoreInit, CoreOnLateUpdate } from "./core/core-init";
import Constant from "./constant";
import TaskManager from "./core/utils/task-manager";
import ModuleManager from "./core/manager/module-manager";
import DbManager from "./core/manager/db-manager";
import I18nManager from "./core/manager/i18n-manager";
import { AsyncWaitInfo } from "./core/coroutine/coroutine-define";
import Managers from "./core/manager/managers";
import JsonLoginManager from "./network/managers/json-login-manager";
import { EnterGameManager } from "./network/managers/enter-game-manager";
import WalletManager from "./manager/wallet-manager";
import { ReconnectManager } from "./network/managers/reconnect-manager";
import AudioManager from "./core/manager/audio-manager";
import { MessageSender } from "./network/net/message-sender";
export default class Initializer {


    protected static registerManagers() {
        //注册管理器
        // Managers.registe(ProtoManager);
        // Managers.registe(StatisticalHelper);
        // Managers.registe(ProtoLoginManager);
        Managers.registe(JsonLoginManager);
        Managers.registe(EnterGameManager);
        Managers.registe(WalletManager);
        Managers.registe(ReconnectManager);
        Managers.registe(AudioManager);

    }

    /**
     * 初始化语言
     */
    protected static initLanguage() {
        let l = BrowserUtils.getParam('language');
        if (!l) {
            //如果找不到默认使用英文
            l = resourcesDb.I18N_LANGUAGE_CONFIG_DB_ID.en_us;
        } else {
            //检查是否不是使用了en-US这种类型
            if (l.indexOf('-') > -1) {
                l = serverLanguageKeyToLocal(l);
            }
        }
        //检查最终的l是否在LanguageKey中
        if (LanguageKey.indexOf(l) < 0) {
            //如果不在，则使用en_us
            l = resourcesDb.I18N_LANGUAGE_CONFIG_DB_ID.en_us;
            bDebug && console.warn(`语言 ${l} 不在支持的语言列表中，使用默认语言 en_us`);
        }
        const index = getLanguageIndexByKey(l);
        LanguageManager.language = index;
        if (l == resourcesDb.I18N_LANGUAGE_CONFIG_DB_ID.hi_in) {
            //如果是印地语，需要禁用charMode
            //FontHelper.disableCharMode();
        }
    }

    /**
     * 初始化
     * @param canvas 
     * @param camera 
     */
    public static Init(canvas: cc.Canvas, camera: cc.Camera) {
        BrowserUtils.Init();
        this.registerManagers();
        const playerId = BrowserUtils.getParam('player_id') || Tools.Uuid;
        CoreInit(BaseDefine.APP_NAME, playerId);
        this.initLanguage();
        //GameInit();
        ViewManager.Init(canvas, camera);
        if (!NATIVE) {
            window.addEventListener('resize', () => { ViewManager.updateResolution(); });
        }
    }

    public static OnLateUpdate(dt: number) {
        // CoreOnLateUpdate(dt);
        //GameOnLateUpdate(dt);
        ViewManager.OnLateUpdate(dt);
        MessageSender.onLateUpdate(dt);
    }
    /**
     * 在这里加载resources模块的所有资源
     */
    public static async LoadResources() {
        //设置当前在resources中
        Constant.CurrentBundleId = cc.AssetManager.BuiltinBundleName.RESOURCES;
        const task = new TaskManager(Constant.CurrentBundleId);
        const module = await ModuleManager.getModule(Constant.CurrentBundleId);
        if (!module) {
            throw new Error(`无法加载模块 ${Constant.CurrentBundleId}`);
        }
        // const pr = await module.loadPrefab("prefabs/PanelLoading");
        // if (!pr) {
        //     throw new Error(`无法加载资源 ${Constant.CurrentBundleId}/prefabs/PanelLoading`);
        // }
        //打开加载界面
        //ViewManager.OpenPanel(module, "PanelLoading");
        //加载资源
        module.analyzeBundle(task);
        //加载完毕后，注册db和proto
        task.addCall((fnext) => {
            bDebug && console.log('开始注册db');
            const dbcfg = module.bundle.get('cfg/db', cc.BufferAsset);
            if (!dbcfg) {
                fnext();
                return;
            }
            DbManager.loadDb(Constant.CurrentBundleId, dbcfg).then(() => {
                fnext();
            });
        });
        task.addCall((fnext) => {
            bDebug && console.log('开始注册proto');
            // const protos = module.bundle.get('protos/proto', cc.BufferAsset);
            // if (!protos) {
            //     fnext();
            //     return;
            // }
            // ProtoManager.LoadProtos(Constant.CurrentBundleId, protos).then(() => {
            //     fnext();
            // });
            fnext(); //不需要加载proto了
        });
        //最后注册多语言包
        task.addCall(async (fnext) => {
            bDebug && console.log('开始注册多语言包');
            const datas = resourcesDb.get_i18n_resources_db();
            I18nManager.registerI18nResourceDatas(datas);
            //注册打点信息
            //StatisticalHelper.registerStatisticalDatas(cc.AssetManager.BuiltinBundleName.RESOURCES);
            fnext();
        });
        //设置进度展示
        const updateProgress = window['updateProgress'];
        task.setProgressCallback((completedCount: number, totalCount: number) => {
            updateProgress && updateProgress(completedCount, totalCount);
        });

        let asyncInfo: AsyncWaitInfo = {
            name: '资源加载-' + Constant.CurrentBundleId,
            isCompleted: false,
            isSuccess: false,
            checkFrameCount: 1,
            isTimeOut: false,
            timeout: -1
        };

        task.start((used: number) => {
            bDebug && console.log(`资源加载完成，耗时 ${used * 1000} ms`);
            asyncInfo.isCompleted = true;
            asyncInfo.isSuccess = true;
            module.onLoadSuccessToInit();
            window['updateProgress'] = null;
        });
        await Coroutine.WaitForComplete(asyncInfo);
        bDebug && console.log('资源加载完成');
        asyncInfo = null;
    }
}