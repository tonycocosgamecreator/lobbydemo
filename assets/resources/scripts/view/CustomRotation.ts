// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomList from 'db://assets/resources/scripts/view/CustomList';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('CustomRotation')
export default class CustomRotation extends ViewBase {

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
        this.reset();
    }

    reset() {
        this.spStar.node.active = false;
        this.spRotation.node.active = false;
        this.spjzlunzi.node.active = false;
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
            cc_list0_node    : [CustomList],
            cc_list1_node    : [CustomList],
            cc_list2_node    : [CustomList],
            cc_rotation_list_node    : [cc.Node],
            cc_spRotation    : [cc.sp.Skeleton],
            cc_spStar    : [cc.sp.Skeleton],
            cc_spjzlunzi    : [cc.sp.Skeleton],
            cc_star_node    : [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected list0_node: CustomList    = null;
   protected list1_node: CustomList    = null;
   protected list2_node: CustomList    = null;
   protected rotation_list_node: cc.Node    = null;
   protected spRotation: cc.sp.Skeleton    = null;
   protected spStar: cc.sp.Skeleton    = null;
   protected spjzlunzi: cc.sp.Skeleton    = null;
   protected star_node: cc.Node    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'CustomRotation';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return CustomRotation.BUNDLE_NAME;
    }
   public get viewName(){
        return CustomRotation.VIEW_NAME;
    }
    // @view export resource end
}
