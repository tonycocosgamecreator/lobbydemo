// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import List from 'db://assets/resources/scripts/core/view/list-view';
import GameManager from '../manager/game-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomMainHistory')
export default class CustomMainHistory extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    updateHistory() {
        const _data = GameManager.Records;
        const _records = [..._data].reverse();
        this.historyList.itemRender = (item: cc.Node, i: number) => {
            item.getChildByName('labeldice').getComponent(cc.Label).string = `${_records[i].win_type[0]}`;
            item.getChildByName('sprbg').getComponent(cc.Sprite).spriteFrame = this.getSpriteFrame(`textures/ui/LP_Img_${this.getColorByIdx(_records[i].win_type[0])}/spriteFrame`);
        }

        let len = _data.length;
        this.historyList.numItems = len;
        this.historyList.stopScrollTo();
        this.historyList.scrollTo(0, 0.1);
    }
    
    //1 红色 2黑色 3绿色
    getColorByIdx(idx: number): number {
        if (idx == 0) return 3;
        if (idx <= 10) {
            return idx % 2 == 1 ? 1 : 2;
        }
        if (idx <= 18) {
            return idx % 2 == 1 ? 2 : 1;
        }
        if (idx <= 28) {
            return idx % 2 == 1 ? 1 : 2;
        }
        if (idx <= 36) {
            return idx % 2 == 1 ? 2 : 1;
        }
        return 3;
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
            cc_historyList    : [List],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected historyList: List    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomMainHistory';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomMainHistory.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomMainHistory.VIEW_NAME;
    }
    // @view export resource end
}
