// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import GButtonGroup from 'db://assets/resources/scripts/core/view/gbutton-group';
import List from 'db://assets/resources/scripts/core/view/list-view';
import { MessageSender } from '../network/net/message-sender';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import Timer from '../core/utils/timer';
import WalletManager from '../manager/wallet-manager';
import { CurrencyHelper } from '../helper/currency-helper';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomRank')
export default class CustomRank extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }

    protected onEnable(): void {
        if (this._gid == 0) {
            this.changeState(4);
        }
    }

    //------------------------ 内部逻辑 ------------------------//
    _list: wheel.SevenUpDownRankData[] = [];
    _gid: number = 0;
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
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_RANK]: this.updateRank,
        });
    }

    reset() {
        this._list = [];
        this.rankList.numItems = 0;
    }

    changeState(_gid: number) {
        this.reset();
        if (this._gid == _gid) return;
        this._gid = _gid;
        MessageSender.SendMessage(wheel.Message.MsgGetRankReq, { rank_type: _gid });
    }

    updateRank(list: wheel.SevenUpDownRankData[]) {
        const currency = WalletManager.currency;
        this._list = list;
        this.rankList.stopScrollTo();
        this.rankList.itemRender = (item: cc.Node, i: number) => {
            const data = this._list[i];
            item.getChildByName('head').getChildByName('icon').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/avatars/av-${data.icon}`);
            item.getChildByName('name').getComponent(cc.Label).string = data.name;
            item.getChildByName('time').getComponent(cc.Label).string = Timer.formateDate(data.save_time * 1000, 'yyyy/MM/dd\nHH:mm:ss')
            item.getChildByName('bet').getComponent(cc.Label).string = 'Bet : ' + CurrencyHelper.format(+data.bet, currency);
            item.getChildByName('win').getComponent(cc.Label).string = 'Win : ' + CurrencyHelper.format(+data.win, currency);
        }
        this.rankList.numItems = this._list.length;
    }
    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    //这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin

    private onClickButtonallday(event: cc.EventTouch) {
        this.changeState(4);
    }


    private onClickButtonweek(event: cc.EventTouch) {
        this.changeState(5);
    }


    private onClickButtonmonth(event: cc.EventTouch) {
        this.changeState(6);
    }

    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttonallday: [GButton, this.onClickButtonallday.bind(this)],
            cc_buttonmonth: [GButton, this.onClickButtonmonth.bind(this)],
            cc_buttonweek: [GButton, this.onClickButtonweek.bind(this)],
            cc_rankList: [List],
            cc_tabGroup: [GButtonGroup],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected buttonallday: GButton = null;
    protected buttonmonth: GButton = null;
    protected buttonweek: GButton = null;
    protected rankList: List = null;
    protected tabGroup: GButtonGroup = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomRank';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomRank.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomRank.VIEW_NAME;
    }
    // @view export resource end
}
