import CustomSystemMenuHistory from "../view/CustomSystemMenuHistory";
import { Node } from "cc";
import { Prefab } from "cc";
import { SystemMenuHistoyItemRender } from "./system-menu-define";
import { SpriteFrame } from "cc";
import PoolManager from "../core/manager/pool-manager";
import { BooleanCallback, EmptyCallback } from "../core/define";
import { ListViewClickItemEventFunc } from "../core/view/list-view";



export class SystemMenuHelper {
    /**
     * 
     * @param titleNode 历史记录表头
     * @param itemPrefab 历史记录单个item的预制体
     * @param render 需要自定义自己渲染item的逻辑
     * @param requestMore 获取更多历史记录的回调 如果已经是最后一页了，返回false，发送成功返回true
     * @param getCount 获取当前历史记录的数量
     * @param clickItem 点击item的回调
     * @param background 背景图片，如果需要的话
     * @returns 
     */
    public static CreateSystemHistoryView(
        titleNode : Node,
        itemPrefab : Prefab,
        render : SystemMenuHistoyItemRender,
        requestMore : BooleanCallback,
        getCount : () => number,
        clickItem? : ListViewClickItemEventFunc,
        isLastPage? : BooleanCallback,
        background? : SpriteFrame
    ) : Node{
        const component = PoolManager.Get(CustomSystemMenuHistory);
        component.register(titleNode,itemPrefab,render,requestMore,getCount,clickItem,isLastPage,background);
        return component.node;
    }

}