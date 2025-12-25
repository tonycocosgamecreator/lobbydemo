// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomRouletteBall from 'db://assets/resources/scripts/view/CustomRouletteBall';
import CustomRoulettePointer from 'db://assets/resources/scripts/view/CustomRoulettePointer';
import CustomRouletteResult from 'db://assets/resources/scripts/view/CustomRouletteResult';
import CustomRouletteWheel from 'db://assets/resources/scripts/view/CustomRouletteWheel';
import { UIOpacity } from 'cc';
import { tween } from 'cc';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomRoulette')
export default class CustomRoulette extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    //------------------------ 内部逻辑 ------------------------//
    isRunning = false;
    _uiOpacity: UIOpacity = null;
    buildUi() {
        this._uiOpacity = this.bg.node.getComponent(UIOpacity);
        this.reset();
        this.pointer.init(this.wheel);
        this.ball.init(this.wheel);
    }

    reset() {
        this.isRunning = false;
        this.result.node.active = false;
        this.ball.reset();
        this.wheel.reset();
        this._uiOpacity.opacity = 0;
    }

    async startGame(targetNumber: number) {
        if (!this.wheel || !this.ball || this.isRunning) return;
        this.isRunning = true;
        // phase1：轮盘出现+快速旋转到指定速度
        this.playBgEnter(0.45)
        await this.wheel.playEnter(0.5);
        await this.wheel.startSpin(0.6, 0.5);

        // phase2：球出现 + 快速旋转
        await this.ball.appearOnOuterRing();
        await this.ball.startFastRotation();
        await this.delay(1200);

        // phase3：对准目标并球减速
        this.ball.setTargetOnWheel(targetNumber);
        await this.ball.targetDecelerationPosition();
        this.wheel.softSlowDown(0.5, 0.8);
        await this.ball.slowDownAndStop(1);

        // phase4：球锁定到轮盘，一起减速
        this.ball.lockToWheel();
        await this.wheel.slowDownAndStop(1);

        this.result.showResult(targetNumber);
        await this.delay(1000);
        await this.ball.fadeOutBall(0.28);
        await this.wheel.playExit(0.5);
        this.isRunning = false;
    }

    playBgEnter(duration: number) {
        tween(this._uiOpacity)
            .stop()
            .set({ opacity: 0 })
            .to(duration, { opacity: 204 }, { easing: 'quadOut' })
            .start();
    }

    delay(ms: number) {
        return new Promise<void>(r => setTimeout(r, ms));
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin


    private onClickButtonA(event: cc.EventTouch) {
        this.reset();
        this.startGame(5)
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_ball    : [CustomRouletteBall],
            cc_bg    : [cc.Sprite],
            cc_pointer    : [CustomRoulettePointer],
            cc_result    : [CustomRouletteResult],
            cc_wheel    : [CustomRouletteWheel],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected ball: CustomRouletteBall    = null;
   protected bg: cc.Sprite    = null;
   protected pointer: CustomRoulettePointer    = null;
   protected result: CustomRouletteResult    = null;
   protected wheel: CustomRouletteWheel    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomRoulette';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomRoulette.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomRoulette.VIEW_NAME;
    }
    // @view export resource end
}
