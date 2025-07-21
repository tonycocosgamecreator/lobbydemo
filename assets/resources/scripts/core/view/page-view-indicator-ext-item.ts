import { ProgressBar } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PageViewIndicatorExtItem')
export class PageViewIndicatorExtItem extends Component {
    
    @property({ type: Node, tooltip: '普通状态' })
    indicatorNode: Node;

    @property({ type: Node, tooltip: '已通过状态' })
    passedNode : Node;

    @property({type : ProgressBar, tooltip: '进度条状态'})
    progressBar: ProgressBar;

    /**
     * 当前状态：0-普通状态，1-进度条状态
     */
    private _state : number = 0;
    /**
     * 设置当前状态
     * @param state 0-普通状态，1-进度条状态 2.已通过状态
     */
    public set state(state: number) {
        this._state = state;
        let width = 0;
        if(state == 0){
            width = this.indicatorNode.width;
        }else if(state == 1){
            width = this.progressBar.node.width;
        }else if(state == 2){
            width = this.passedNode.width;
        }
        this.progressBar.progress = 0;
        this.indicatorNode.active = (state == 0);
        this.progressBar.node.active = (state == 1);
        this.passedNode.active = (state == 2);
        this.node.width = width;
    }

    public get state(): number {
        return this._state;
    }

    /**
     * 设置进度条的当前值
     * @param value 进度条的当前值
     */
    public setProgress(value: number) {
        if(value < 0) value = 0;
        if(value > 1) value = 1;
        this.progressBar.progress = value;
    }
}


