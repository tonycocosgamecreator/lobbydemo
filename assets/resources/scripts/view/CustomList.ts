// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomItem from 'db://assets/resources/scripts/view/CustomItem';
import { UITransform } from 'cc';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;
@ccclass('CustomList')
export default class CustomList extends ViewBase {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        this.buildUi();
    }

    protected onDestroy(): void {
        super.onDestroy();
    }


    //------------------------ 内部逻辑 ------------------------//
    _listName = ['10109_symbols_wild_3', '10109_symbols_wild_2', '10109_symbols_scatter', '10109_symbols_7_red', '10109_symbols_7_blue', '10109_symbols_bar_3', '10109_symbols_bar_2', '10109_symbols_bar_1', '10109_symbols_cherry']
    buildUi() {
        const _hight = this.node.children[0].getComponent(UITransform).height;
        const _anchorY = this.node.children[0].getComponent(UITransform).anchorY;
        for (let i = 0; i < this._listName.length; i++) {
            const node = this.node.children[i] || cc.instantiate(this.node.children[0]);
            let y = _hight * _anchorY + _hight * (i-1);
            node.setPosition(0, y, 0);
            node.getComponent(CustomItem).setData(this._listName[i]);
            node.parent = this.node;
        }
    }

    reset() {
        this.node.children.forEach(child => {
            child.getComponent(CustomItem).reset();
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
            cc_item_node: [CustomItem],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
    protected item_node: CustomItem = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CustomList';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
    public static readonly BUNDLE_NAME = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
    public get bundleName() {
        return CustomList.BUNDLE_NAME;
    }
    public get viewName() {
        return CustomList.VIEW_NAME;
    }
    // @view export resource end
}
