// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomBetAreaItem from 'db://assets/resources/scripts/view/CustomBetAreaItem';
import BaseGlobal from '../core/message/base-global';
import { GameEvent } from '../define';
import JmManager from '../manager/jm-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomBetArea')
export default class CustomBetArea extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    buildUi() {
        this._init();
        BaseGlobal.registerListeners(this, {
            [GameEvent.UPDATE_HISTORY]: this._resetRecords
        });
    }

    _init() {
        this._resetRecords();
    }

    _resetRecords() {
        let _data = JmManager.records;
        if (!_data) {
            this.node.children.forEach(t => {
                t.getComponent(CustomBetAreaItem).resetRecord();
            })
        } else {
            for (let i = 0; i < 5; i++) {
                let arr = this.countNumbers(_data.award[i] ? _data.award[i] : []);
                this.node.children.forEach((t,idx) => {
                t.getComponent(CustomBetAreaItem).setRecord(i,arr[idx]);
            })
            }
            
        }
    }

    reset() {
        this.node.children.forEach(t => {
            t.getComponent(CustomBetAreaItem).reset();
        })
    }

    countNumbers(arr: number[]): number[] {
        // 初始化计数器对象，记录 1~6 的出现次数
        const countMap: Record<number, number> = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
        };
        // 遍历数组，统计每个数字的出现次数
        arr.forEach((num) => {
            if (num >= 1 && num <= 6) {
                countMap[num]++;
            }
        });
        // 将统计结果转换为字符串数组
        const result = Object.entries(countMap).map(
            ([num, count]) => count
        );

        return result;
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
            cc_bet_area0_node: [CustomBetAreaItem],
            cc_bet_area1_node: [CustomBetAreaItem],
            cc_bet_area2_node: [CustomBetAreaItem],
            cc_bet_area3_node: [CustomBetAreaItem],
            cc_bet_area4_node: [CustomBetAreaItem],
            cc_bet_area5_node: [CustomBetAreaItem],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected bet_area0_node: CustomBetAreaItem = null;
    protected bet_area1_node: CustomBetAreaItem = null;
    protected bet_area2_node: CustomBetAreaItem = null;
    protected bet_area3_node: CustomBetAreaItem = null;
    protected bet_area4_node: CustomBetAreaItem = null;
    protected bet_area5_node: CustomBetAreaItem = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomBetArea';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomBetArea.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomBetArea.VIEW_NAME;
    }
    // @view export resource end
}
