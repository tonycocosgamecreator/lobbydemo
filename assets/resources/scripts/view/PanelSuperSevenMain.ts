// @view export import begin
import ViewBase from 'db://assets/resources/scripts/core/view/view-base';
import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from 'db://assets/resources/scripts/core/define';
import { GButton } from 'db://assets/resources/scripts/core/view/gbutton';
import * as cc from 'cc';
//------------------------特殊引用开始----------------------------//
import CustomButtom from 'db://assets/resources/scripts/view/CustomButtom';
import CustomDetail from 'db://assets/resources/scripts/view/CustomDetail';
import CustomRotation from 'db://assets/resources/scripts/view/CustomRotation';
import CustomScore from 'db://assets/resources/scripts/view/CustomScore';
import { IPanelSuperSevenMainView } from '../define/ipanel-ss-main-view';
import SuperSevenManager from '../manager/ss-manager';
//------------------------特殊引用完毕----------------------------//
//------------------------上述内容请勿修改----------------------------//
// @view export import end

const { ccclass, property } = cc._decorator;

@ccclass('PanelSuperSevenMain')
export default class PanelSuperSevenMain extends ViewBase implements IPanelSuperSevenMainView {

    //------------------------ 生命周期 ------------------------//
    protected onLoad(): void {
        super.onLoad();
        SuperSevenManager.View = this;
    }

    protected onDestroy(): void {
        super.onDestroy();
        SuperSevenManager.View = null;
    }


    //------------------------ 内部逻辑 ------------------------//










    //------------------------ 网络消息 ------------------------//
    // @view export net begin

    public onNetworkMessage(msgType: string, data: any): boolean {
        return false;
    }

    // @view export event end

    //------------------------ 事件定义 ------------------------//
    // @view export event begin
    // @view export event end


    // @view export resource begin
    protected _getResourceBindingConfig(): ViewBindConfigResult {
        return {
            cc_buttom_node    : [CustomButtom],
            cc_detail_node    : [CustomDetail],
            cc_rotation_node    : [CustomRotation],
            cc_score_node    : [CustomScore],
            cc_sphandShank    : [cc.sp.Skeleton],
            cc_top_node    : [cc.Node],
        };
    }
    //------------------------ 所有可用变量 ------------------------//
   protected buttom_node: CustomButtom    = null;
   protected detail_node: CustomDetail    = null;
   protected rotation_node: CustomRotation    = null;
   protected score_node: CustomScore    = null;
   protected sphandShank: cc.sp.Skeleton    = null;
   protected top_node: cc.Node    = null;
    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'PanelSuperSevenMain';
    /**
     * 当前界面的所属的bundle名字
     * 请勿修改，脚本自动生成
    */
   public static readonly BUNDLE_NAME  = 'resources';
    /**
     * 请勿修改，脚本自动生成
    */
   public get bundleName() {
        return PanelSuperSevenMain.BUNDLE_NAME;
    }
   public get viewName(){
        return PanelSuperSevenMain.VIEW_NAME;
    }
    // @view export resource end
}
