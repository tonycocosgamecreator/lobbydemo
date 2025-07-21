import { Node } from 'cc';
import { _decorator, CCBoolean, PageView, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CirculatePageView')
export default class CirculatePageView extends PageView {
    public circulate = true;


    onLoad(): void {
        super.onLoad();
        this.node.on(PageView.EventType.SCROLL_ENDED, this.onScrollEnded, this);
    }

    private onScrollEnded() {
        //console.log('CirculatePageView onScrollEnded');
        const pageIndex = this.curPageIdx;
        if(pageIndex == 0){
            this.scrollToPage(this._pages.length - 2, 0);
            this.node.emit(PageView.EventType.SCROLL_ENDED, this);
            return;
        }
        if(pageIndex == this._pages.length - 1){
            this.scrollToPage(1, 0);
            this.node.emit(PageView.EventType.SCROLL_ENDED, this);
            return;
        }
    }

    /**
     * 一次性增加多个页面
     * @param pages 
     */
    public addPages(pages : Node[]){
        this.removeAllPages();
        for(let i = 0;i<pages.length;i++){
            const page = pages[i];
            this.addPage(page);
        }
        this.scrollToPage(1, 0);
        this._indicator?._updateLayout();
    }


    /**
     * 按钮所属的bundle的名字
     */
    public BUNDLE_NAME = '';
    /**
     * 按钮所属的面板的名字（Panel或者Custom)
     */
    public PANEL_NAME = '';

    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
    public static readonly VIEW_NAME = 'CirculatePageView';
}


