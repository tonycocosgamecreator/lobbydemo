// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
import AudioManager from '../core/manager/audio-manager';
import { Global } from '../global';
import { BaseMessage } from '../core/message/base-message';
import GameManager from '../manager/game-manager';
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomTime')
export default class CustomTime extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    _stage = -1;
    _isGameInBackground: boolean = false;
    buildUi() {
        this.node.active = false;
        Global.registerListeners(
            this,
            {
                [BaseMessage.ON_ENTER_FORGOUND]: () => {
                    this._isGameInBackground = false;
                },
                [BaseMessage.ON_ENTER_BACK_GROUND]: () => {
                    this._isGameInBackground = true;
                }
            }
        );
    }

    updateGameStage() {
        this._stage = GameManager.Stage;
        this.node.active = (this._stage == baccarat.DeskStage.StartBetStage || this._stage == baccarat.DeskStage.SettleStage) ? true : false;
    }

    private _currentHaveSec: number = 0;
    protected lateUpdate(dt: number): void {
        if (this._stage != baccarat.DeskStage.StartBetStage && this._stage != baccarat.DeskStage.SettleStage) return;
        const left = GameManager.minusHaveSec(dt);
        const maxSec = GameManager.Dur;
        const secNow = Math.ceil(left);
        if (secNow !== this._currentHaveSec) {
            this._currentHaveSec = secNow;
            this.labeltime.string = secNow.toString();
            if (GameManager.Stage == baccarat.DeskStage.StartBetStage) {
                if (this._isGameInBackground == false) {
                    if (secNow == 5) {
                        AudioManager.playSound(this.bundleName, '倒计时剩余五秒时候播放');
                    } else if (secNow < 5 && secNow > 0) {
                        AudioManager.playSound(this.bundleName, '剩余4秒，倒计时提示音，每秒播放一次');
                    }
                }
            }
        }
        this.timeCounterBar.progress = left / maxSec;
    }


    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    // @view export event end


    // @view export resource begin

    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_labeltime: [cc.Label],
            cc_timeCounterBar: [cc.ProgressBar],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected labeltime: cc.Label = null;
    protected timeCounterBar: cc.ProgressBar = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomTime';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomTime.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomTime.VIEW_NAME;
    }

    // @view export resource end
}
