
import * as cc from 'cc';
import { PageViewIndicatorExtItem } from './page-view-indicator-ext-item';
import { CCFloat, CCBoolean } from 'cc';
const { ccclass, property } = cc._decorator;
/**
 * 带有定时器功能的PageView指示器
 */
@ccclass('PageViewIndicatorExt')
export class PageViewIndicatorExt extends cc.PageViewIndicator {
    @property({ type: cc.Prefab, tooltip: '预制体(需要进度条)' })
    prefab: cc.Prefab;

    @property({ type: CCFloat, tooltip: '自动切换间隔(秒)' })
    autoChangeTime: number = 3;

    @property({ type: CCFloat, tooltip: '手动切换间隔(秒)' })
    handleChangeTime: number = 5;

    @property({ type: CCBoolean, tooltip: '是否循环pageview' })
    isCirculate: boolean;
    /**
     * 当前指示器项
     */
    protected _indicator_items: PageViewIndicatorExtItem[] = [];

    /**
     * 进度条使用的最大时间
     */
    protected _fprogress_change_time: number = 0;
    /**
     * 进度条当前时间
     */
    protected _fprogress_now_time: number = 0;

    /**
     * 当前pageview索引，默认0
     */
    protected _page_view_index: number = 0;

    /**
     * 是否是因为时间到了自动切换的
     */
    protected _is_auto_change: boolean = true;

    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    public _createIndicator(): cc.Node {
        const node = cc.instantiate(this.prefab);
        const item = node.getComponent(PageViewIndicatorExtItem);
        if (item) {
            item.state = 0; // 设置为普通状态
            this._indicator_items.push(item);
            node.parent = this.node;
            return node;
        } else {
            cc.error('PageViewIndicatorExt: Failed to create indicator item, prefab must have PageViewIndicatorExtItem component.');
        }
        return null;
    }

    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    public _changedState(): void {
        const indicators = this._indicators;
        if (indicators.length === 0 || !this._pageView) { return; }
        let idx = this._pageView.curPageIdx;
        if (this.isCirculate) {
            idx -= 1; // 如果是循环PageView，则实际索引需要减去1
        }
        if (idx >= indicators.length) { return; }
        for (let i = 0; i < indicators.length; ++i) {
            const item = this._indicator_items[i];
            if (i < idx) {
                item.state = 2; // 设置为已通过状态
            } else {
                item.state = (i === idx) ? 1 : 0; // 设置当前状态
            }
        }
        this._page_view_index = idx; // 更新当前pageview索引
        if (this._is_auto_change) {
            this._fprogress_change_time = this.autoChangeTime; // 重置自动切换时间
        } else {
            this._fprogress_change_time = this.handleChangeTime; // 重置手动切换时间
        }
        //console.log(`PageViewIndicatorExt: Changed state to index ${idx}, auto change time: ${this._fprogress_change_time}`);
        this._is_auto_change = false; // 重置自动切换状态
        this._fprogress_now_time = 0; // 重置当前时间
    }

    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     * 此方法会被PageView主动调用，在当前PageView的页面发生变化时调用。
     */
    public _refresh(): void {
        if (!this._pageView) { return; }
        const indicators = this._indicators;
        const indicatorItems = this._indicator_items;
        const pages = this._pageView.getPages();
        let pageCount = pages.length;
        if (this.isCirculate) {
            // 如果是循环PageView，则实际页面数为页面数 - 2
            pageCount = Math.max(0, pageCount - 2);
        }
        if (pageCount === indicators.length) {
            return;
        }
        let i = 0;
        if (pageCount > indicators.length) {
            for (i = 0; i < pageCount; ++i) {
                if (!indicators[i]) {
                    indicators[i] = this._createIndicator();
                }
            }
        } else {
            const count = indicators.length - pageCount;
            for (i = count; i > 0; --i) {
                const node = indicators[i - 1];
                this.node.removeChild(node);
                indicators.splice(i - 1, 1);
                indicatorItems.splice(i - 1, 1);
            }
        }
        if (this._layout && this._layout.enabledInHierarchy) {
            this._layout.updateLayout();
        }
        this._changedState();
    }


    protected lateUpdate(dt: number): void {
        if (!this._pageView) {
            return;
        }
        if (!this.node.active) {
            return;
        }
        this._fprogress_now_time += dt;
        if (this._fprogress_now_time >= this._fprogress_change_time && !this._is_auto_change) {
            this._is_auto_change = true; // 标记为自动切换
            const count = this._pageView.getPages().length;
            let idx = this._pageView.curPageIdx;
            if (idx < count - 1) {
                this._pageView.scrollToPage(idx + 1, 0.5);
            } else {
                this._pageView.scrollToPage(0, 0.5); // 如果到最后一页，则回到第一页
            }
        } else {
            const percent = this._fprogress_now_time / this._fprogress_change_time;
            let idx = this._pageView.curPageIdx;
            if (this.isCirculate) {
                idx -= 1; // 如果是循环PageView，则实际索引需要减去1
            }
            const item = this._indicator_items[idx];
            if (item) {
                item.setProgress(percent); // 设置当前进度条的进度
            }
        }
    }
}


