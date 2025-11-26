// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomRank from 'db://assets/resources/scripts/view/CustomRank';
import GButtonGroup from 'db://assets/resources/scripts/core/view/gbutton-group';
import List from 'db://assets/resources/scripts/core/view/list-view';
import SevenUpSevenDownManager, { betInfo } from '../manager/sevenupsevendown-manager';
import WalletManager from '../manager/wallet-manager';
import { CurrencyHelper } from '../helper/currency-helper';
import { v3 } from 'cc';
import { Tween } from 'cc';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomRecord')
export default class CustomRecord extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//

    _list: { playid: string; win: number; bet: number; icon: number }[] = [];
    _stage = -1;
    _positionArr = [v3(25, 0, 0), v3(0, 0, 0), v3(-25, 0, 0)]

    buildUi() {
        this.tabGroup.init();
        this.tabGroup.iconSpriteFrames = [
            null,
            this.getSpriteFrame("textures/ui/7up_Img_27"),
        ];
        this.tabGroup.titleColors = [
            cc.color("#A4AAB3"),
            cc.Color.WHITE,
        ];
        this.tabGroup.selectIndex = 0;
        this.top_node.node.active = false;
        this.reset();
    }

    updateGameStage(reconnect: boolean = false) {
        this._stage = SevenUpSevenDownManager.Stage;
        switch (this._stage) {
            case baccarat.DeskStage.ReadyStage:
                this.reset();
                break;
            case baccarat.DeskStage.StartBetStage:
            case baccarat.DeskStage.EndBetStage:
            case baccarat.DeskStage.OpenStage:
            case baccarat.DeskStage.SettleStage:
                if (reconnect) {
                    this.reset();
                }
                let listMap = SevenUpSevenDownManager.BetsList
                this._list = Array.from(listMap.values())
                this.updateRecord();
                let winNum = 0;
                if (this._stage == baccarat.DeskStage.SettleStage) {
                    let bigD = Array.from(listMap.values()).sort((a, b) => b.win - a.win);
                    let winGold = 0;
                    bigD.forEach(t => {
                        if (t.win > 0) {
                            winNum++;
                            winGold = winGold.add(t.win)
                        }
                    })
                    this.head_node.children.forEach((child, idx) => {
                        let data = idx == 0 ? bigD[2] : idx == 2 ? bigD[0] : bigD[1];
                        child.active = !!data;
                        // Tween.stopAllByTarget(child)
                        child.setPosition(this._positionArr[idx]);
                        if (data) {
                            child.getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${data.icon}`);
                        }
                    })
                    this.labelwin.string = winGold + '';
                } else {
                    this.updateHead();
                }
                this.labelbets.string = winNum + '/' + this._list.length + ' Bets';
                break;
        }
    }

    changeState(isAllBet: boolean) {
        this.top_node.node.active = !isAllBet;
        this.allbet_node.active = isAllBet;
    }

    updateList() {
        let listMap = SevenUpSevenDownManager.BetsList
        this._list = Array.from(listMap.values());
        this.labelbets.string = '0/' + this._list.length + ' Bets';
        this.updateRecord();
        this.updateHead();
    }

    updateRecord() {
        const currency = WalletManager.currency;
        this.recordList.stopScrollTo();
        this.recordList.itemRender = (item: cc.Node, i: number) => {
            const data = this._list[i];
            let str = data.playid;
            if (str.length > 6) str = str.slice(0, 6) + '...';
            item.getChildByName('head').getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${data.icon}`);
            item.getChildByName('playId').getComponent(cc.Label).string = "Player_" + str;
            item.getChildByName('bet').getComponent(cc.Label).string = CurrencyHelper.format(+data.bet, currency);
            item.getChildByName('win').getComponent(cc.Label).string = +data.win ? CurrencyHelper.format(+data.win, currency) : this._stage == baccarat.DeskStage.SettleStage ? '0.00' : '';
        }
        this.recordList.numItems = this._list.length;
    }

    updateHead() {
        if (this._stage == baccarat.DeskStage.ReadyStage || this._stage == baccarat.DeskStage.SettleStage) return;
        const info = SevenUpSevenDownManager.AllbetInfo;
        if (info.length == 0) {
            this.head_node.children.forEach((child, idx) => {
                child.active = false;
                child.setPosition(this._positionArr[idx]);
            })
        } else if (info.length == 1) {
            this.head_node.children.forEach((child, idx) => {
                if (idx === 2) {
                    child.getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${info[0].icon}`);
                    child.active = true;
                    child.setPosition(this._positionArr[idx]);
                } else {
                    child.active = false;
                }
            });

        } else if (info.length == 2) {
            this.head_node.children.forEach((child, idx) => {
                if (idx > 0) {
                    child.getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${info[idx - 1].icon}`);
                    child.active = true;
                    child.setPosition(this._positionArr[idx]);
                } else {
                    child.active = false;
                }
            });
        } else if (info.length >= 3) {
            let arr = info.slice(-3)
            this.head_node.children.forEach((child, idx) => {
                child.getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${arr[idx].icon}`);
                child.active = true;
                child.setPosition(this._positionArr[idx]);
            });
        }
    }

    reset() {
        this._list = [];
        this.recordList.numItems = 0;
        this.labelbets.string = '';
        this.labelwin.string = '';
        this.head_node.children.forEach((child, idx) => {
            child.active = false;
            child.setPosition(this._positionArr[idx]);
        })
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    private onClickButtonallbets(event: cc.EventTouch) {
        this.changeState(true)
    }
    private onClickButtontop(event: cc.EventTouch) {
        this.changeState(false)
    }
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_allbet_node: [cc.Node],
            cc_buttonallbets: [GButton, this.onClickButtonallbets.bind(this)],
            cc_buttontop: [GButton, this.onClickButtontop.bind(this)],
            cc_head_node: [cc.Node],
            cc_labelbets: [cc.Label],
            cc_labelwin: [cc.Label],
            cc_recordList: [List],
            cc_tabGroup: [GButtonGroup],
            cc_top_node: [CustomRank],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected allbet_node: cc.Node = null;
    protected buttonallbets: GButton = null;
    protected buttontop: GButton = null;
    protected head_node: cc.Node = null;
    protected labelbets: cc.Label = null;
    protected labelwin: cc.Label = null;
    protected recordList: List = null;
    protected tabGroup: GButtonGroup = null;
    protected top_node: CustomRank = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomRecord';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomRecord.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomRecord.VIEW_NAME;
    }
    // @view export resource end
}
