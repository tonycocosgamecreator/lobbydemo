import { _decorator, Color, Component, EventTouch, Node, SpriteFrame } from 'cc';
import { GButton } from './gbutton';
import { ClickEventCallback } from '../define';
import { TTFFont } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GButtonGroup')
export default class GButtonGroup extends Component {
    /**
     * 当前选择
     */
    private _iCurrentIndex = -1;
    /**
     * 当前下面所有的GButton
     */
    private _gbuttons: GButton[] = [];
    /**
     * 每一个按钮的回调函数
     */
    private _gbutton_calls: ClickEventCallback[] = [];

    private _bInited = false;
    /**
     * 是否手动改变了选中状态
     */
    private _bHandChange = false;

    onLoad() {
        this.init();
    }

    public init() {
        if (this._bInited) {
            return;
        }
        this._gbuttons = this.getComponentsInChildren(GButton);
        this._iCurrentIndex = -1;
        for (let i = 0; i < this._gbuttons.length; i++) {
            const gb = this._gbuttons[i];
            gb['__index__'] = i;
            this._gbutton_calls.push(gb.callback);
            gb.registerOneClickHandler(this._onGButtonClickback.bind(this));
        }
        this._bInited = true;
    }

    /**
     *
     * @param val 设置选中索引
     * 如果传入-1，表示全部取消选择
     */
    public set selectIndex(val: number) {
        if (this._iCurrentIndex == val) {
            return;
        }
        if (val < 0 || val >= this._gbuttons.length) {
            //全部取消选择
            for(let i = 0;i<this._gbutton_calls.length;i++){
                const button = this._gbuttons[i];
                button.isSelected = false;
            }
            this._iCurrentIndex = -1;
            return;
        }
        if (this._iCurrentIndex >= 0) {
            const old = this._gbuttons[this._iCurrentIndex];
            old.isSelected = false;
        }else{
            //以前没有，是一个全新的
            for(let i = 0;i<this._gbutton_calls.length;i++){
                const button = this._gbuttons[i];
                button.isSelected = false;
            }
        }

        const button = this._gbuttons[val];
        button.isSelected = true;

        this._iCurrentIndex = val;
    }

    public get selectIndex() {
        return this._iCurrentIndex;
    }

    /**
     * 设置 [未选中/选中] 状态下 icon的精灵
     */
    public set iconSpriteFrames(spfs: SpriteFrame[]) {
        for (let i = 0; i < this._gbuttons.length; i++) {
            this._gbuttons[i].spriteFramesOfIconWithSelected = spfs;
        }
    }

    /**
     * 设置 [未选中/选中] 状态下 title的字体
     */
    public set ttfFonts(fonts : TTFFont[]) {
        for (let i = 0; i < this._gbuttons.length; i++) {
            this._gbuttons[i].ttfFontOfTitleWithSelected = fonts;
        }
    }

    /**
     * 当两个按钮在启用和禁用时使用的精灵帧不一样时，调用这个方法
     * [[未选中/选中],[未选中/选中]]
     * @param spfs 
     */
    public setUnsameIconSpriteFrames(spfs: SpriteFrame[][]) {
        for (let i = 0; i < this._gbuttons.length; i++) {
            this._gbuttons[i].spriteFramesOfIconWithSelected = spfs[i];
        }
    }

    /**
     * 设置 [未选中/选中] 状态下 title的字体颜色
     */
    public set titleColors(colors: Color[]) {
        for (let i = 0; i < this._gbuttons.length; i++) {
            this._gbuttons[i].colorsOfTitleWithSelected = colors;
        }
    }
    /**
     * 获取所有按钮
     */
    public get buttons(){
        return this._gbuttons;
    }
    /**
     * 为了对按钮进行批处理合并渲染，所以 单独会有可能将GButtonGroup和GButton分开
     */
    public set buttons(val : GButton[]){
        this._gbuttons = val;
        for(let i = 0;i<val.length;i++){
            const gb = val[i];
            gb['__index__'] = i;
            this._gbutton_calls.push(gb.callback);
            gb.registerOneClickHandler(this._onGButtonClickback.bind(this));
        }
    }

    private _onGButtonClickback(event: EventTouch, button: GButton) {
        const index = button['__index__'];
        if(!this.isHandChange){
            //只有不是需要手动切换的时候才会自动切换
            this.selectIndex = index;
        }
        
        const call = this._gbutton_calls[index];
        call && call(event, button);
    }

    public get isHandChange(){
        return this._bHandChange;
    }
    /**
     * 设置是否手动切换
     */
    public set isHandChange(val : boolean){
        this._bHandChange = val;
    }

    /**
     * 当前界面的名字
     * 请勿修改，脚本自动生成
    */
   public static readonly VIEW_NAME    = 'GButtonGroup';
}
