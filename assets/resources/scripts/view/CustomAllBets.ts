// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import List from 'db://assets/resources/scripts/core/view/list-view';
import { v3 } from 'cc';
import WheelManager from '../manager/wheel-manager';
import WalletManager from '../manager/wallet-manager';
import { CurrencyHelper } from '../helper/currency-helper';
import CommonManager from '../manager/common-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomAllBets')
export default class CustomAllBets extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }
    protected onEnable(): void {
        this.updateGameStage(this._stage, true);
    }

    //------------------------ 内部逻辑 ------------------------//
    _stage = -1;
    _positionArr = [v3(25, 0, 0), v3(0, 0, 0), v3(-25, 0, 0)]
    _currency = '';
    buildUi() {
        this.reset();
        this._currency = WalletManager.currency;
    }

    updateData(result: boolean = false) {
        if (result) {
            this.updateBetsPlayer();
            let list = WheelManager.getBetInfoByPlay();
            let arr = [];
            let allwin = 0;
            for (let i = 0; i < list.length; i++) {
                let item = list[i];
                let win = 0;
                item.forEach(d => {
                    win = win.add(+d.win);
                    allwin = allwin.add(+d.win);
                })
                if (win > 0) {
                    arr.push({ playid: item[0].player_id, win: win, icon: item[0].icon });
                }
            }
            let result = arr.sort((a, b) => b.win - a.win);
            let icon = []
            for (let i = 0; i < 3; i++) {
                if (result[i]) {
                    icon.push(result[i].icon)
                }
            }
            this.updateBetPlayerHead(icon);
            this.labelBets.string = arr.length + '/' + this.recordList.numItems + ' Bets';
            this.labelWin.string = allwin + '';
        } else {
            this.updateBetsPlayer();
            this.updateBetPlayerHead();
            this.labelBets.string = '0/' + this.recordList.numItems + ' Bets';
            this.labelWin.string = '';
        }
    }

    updateGameStage(stage: baccarat.DeskStage.StartBetStage, reconnect: boolean = false) {
        this._stage = stage;
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this.reset();
            case baccarat.DeskStage.StartBetStage:
            case baccarat.DeskStage.EndBetStage:
            case baccarat.DeskStage.OpenStage:
                if (reconnect) {
                    this.updateData();
                }
                break;
            case baccarat.DeskStage.SettleStage:
                this.updateData(true);
                break;
        }
    }

    updateBetsPlayer() {
        let list = WheelManager.getBetInfoByPlay();
        this.recordList.stopScrollTo();
        this.recordList.itemRender = (item: cc.Node, i: number) => {
            const data = list[i];
            if (!!data) {
                item.getChildByName('playId').getComponent(cc.Label).string = CommonManager.showName(data[0].player_id);
                item.getChildByName('head').getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${data[0].icon}`);
                let win = 0;
                let bet = 0;
                data.forEach(d => {
                    win = win.add(+d.win);
                    bet = bet.add(+d.bet_coin);
                })
                item.getChildByName('bet').getComponent(cc.Label).string = CurrencyHelper.format(bet, this._currency);
                item.getChildByName('win').getComponent(cc.Label).string = win ? CurrencyHelper.format(win, this._currency) : this._stage == baccarat.DeskStage.SettleStage ? '0.00' : '';
            }
        }
        this.recordList.numItems = list.length;
    }

    updateBetPlayerHead(result: number[] = null) {
        const info = result ? result : WheelManager.BetOrderIcon;
        const displayUsers = this.getDisplayUsers(info);
        this.ndHead.children.forEach((child, idx) => {
            const user = displayUsers[idx];
            if (user) {
                const spriteFrame = this.getSpriteFrame(`textures/avatars/av-${user}`);
                child.getChildByName('icon').getComponent(cc.Sprite).spriteFrame = spriteFrame;
                child.active = true;
            } else {
                child.active = false;
            }
            child.setPosition(this._positionArr[idx]);
        });
    }

    getDisplayUsers(info: number[]) {
        const count = info.length;
        const result = [null, null, null];
        if (count === 0) return result;
        if (count === 1) {
            result[2] = info[0];  // 显示在第三个位置
            return result;
        }
        if (count === 2) {
            result[1] = info[0];  // 显示在后两个位置
            result[2] = info[1];
            return result;
        }
        // count >= 3
        const lastThree = info.slice(-3);
        return lastThree;  // 直接显示最后三个
    }

    reset() {
        this.labelWin.string = '';
        this.labelBets.string = '0/0 Bets';
        this.recordList.stopScrollTo();
        this.recordList.numItems = 0;
        this.ndHead.children.forEach(child => {
            child.active = false;
        })
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
            cc_labelBets: [cc.Label],
            cc_labelWin: [cc.Label],
            cc_ndHead: [cc.Node],
            cc_recordList: [List],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected labelBets: cc.Label = null;
    protected labelWin: cc.Label = null;
    protected ndHead: cc.Node = null;
    protected recordList: List = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomAllBets';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomAllBets.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomAllBets.VIEW_NAME;
    }
    // @view export resource end
}
