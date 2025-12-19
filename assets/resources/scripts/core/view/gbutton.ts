import {
    _decorator,
    Color,
    Component,
    easing,
    error,
    EventTouch,
    Label,
    Node,
    NodeEventType,
    tween,
    Tween,
    UIOpacity,
    UITransform,
    v3,
    SpriteFrame, Sprite, AssetManager, log
} from 'cc';
import { bDebug, ClickEventCallback, EmptyCallback } from '../define';
import AudioManager from '../manager/audio-manager';
import { warn } from 'cc';
import { GButtonClickSoundConfig, GButtonDisableStyle, GButtonState, GButtonTouchStyle } from './view-define';
import BaseGlobal from '../message/base-global';
import StatisticalHelper from '../statistical/statistical-helper';
import { StatisticalReportMessage } from '../statistical/statistical-define';
import { v2 } from 'cc';
import { TTFFont } from 'cc';


const { ccclass, property } = _decorator;
/**
 * 长按检测
 * 当玩家按住，持续这个时间，就是长按了
 */
const LONG_TOUCH_CHECK_INTERVEL = 1;

const TOUCH_SCALE_COUNT = 0.08;
/**
 * 缩放动作持续多久
 */
const SCALE_ANIMATION_TIME_OUT = 0.5;
/**
 * 按下去的时间
 */
const SCALE_ANIMATION_TIME_IN = 0.05;

const _tempVec2 = v2(0, 0);
const _tempVec2_1 = v2(0, 0);

/**
 * 此脚本支持将任意node节点变为一个button使用
 */
@ccclass('GButton')
export class GButton extends Component {
    /**
     * 点击事件的回调函数
     */
    private _callback: ClickEventCallback | null = null;
    /**
     * 长按回调
     */
    private _longCallback: ClickEventCallback | null = null;
    /**
     * 原始的x缩放
     */
    private _origin_scale = v3(1, 1, 1);
    /**
     * 按下去的时候缩放到哪个成都
     */
    private _end_scale = v3(1, 1, 1);
    /**
     * 变化矩阵
     */
    private _uiTransform: UITransform | null = null;
    /**
     * 是否支持长按检测
     */
    private _isEnableLongClickCheck = false;
    /**
     * 长按检测时长
     */
    private _fLongClickInterval = -1;
    /**
     * 自定义title的Label组件
     */
    private _titleLabel: Label | null = null;
    /**
     * 图标ICON
     */
    private _icon: Sprite | null = null;

    /**
     * 当前按钮的按下效果，默认为按下后缩小
     */
    private _touch_effect_style: GButtonTouchStyle = GButtonTouchStyle.NONE;
    /**
     * 禁用时的表现
     */
    private _disable_effect_style: GButtonDisableStyle = GButtonDisableStyle.NONE;
    /**
     * 如果是需要使用到改变透明度效果的，这个按钮上必须要有这个组件
     */
    //private _uiOpacity: UIOpacity | null = null;
    /**
     * 是否吞噬点击
     */
    private _bSwallowTouches: boolean = true;
    /**
     * 当前按钮是否可用
     */
    private _bEnabled: boolean = true;
    /**
     * 当前按钮状态
     */
    private _state: GButtonState = GButtonState.SHOW_ENABLE;
    /**
     * 是否选中
     */
    private _bSelected: boolean = false;
    /**
     * [未选中，选中，禁用]效果的颜色
     */
    private _colors_of_title_with_selected: Color[] = [];
    /**
     * [未选中，选中] 时的TTF字体
     */
    private _ttf_font_of_title_with_selected: TTFFont[] = [];

    /**
     * [未选中，选中，禁用]时的icon的SpriteFrame变化
     */
    private _spfs_of_icon_with_selected: SpriteFrame[] = [];
    /**
     * [未选中，选中，禁用]时的背景的SpriteFrame变化
     */
    private _spfs_of_bg_with_selected: SpriteFrame[] = [];
    /**
     * [未选中，选中，禁用]时的icon的位置变化
     */
    private _icon_positions_of_selected: number[][] = [];
    /**
     * 按钮使用透明度效果时，默认的透明度数值
     * [正常, 按下, 禁用]
     */
    private _button_style_opacitys: number[] = [204, 255, 50];

    /**
     * 本次执行过一次长按后，就不再执行短按
     */
    private _longCallbackIsCall: boolean = false;
    /**
     * 是否在触摸过程中
     */
    private _isTouching: boolean = false;

    private _click_event_sound_config: GButtonClickSoundConfig | null = null;
    /**
     * 设置点击事件的音效
     */
    public set clickEventSoundConfig(val: GButtonClickSoundConfig | null) {
        this._click_event_sound_config = val;
    }

    protected onLoad(): void {
        this._uiTransform = this.getComponent(UITransform);
        const sps = this.getComponentsInChildren(Sprite);
        for (let i = 0; i < sps.length; i++) {
            const sp = sps[i];
            if (sp.node.name.includes('icon')) {
                this._icon = sp;
                break;
            }
        }
        const labels = this.getComponentsInChildren(Label);
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            if (label.node.name.includes('title')) {
                this._titleLabel = label;
                break;
            }
        }

        const scale = this.node.scale;
        this._origin_scale.set(scale.x, scale.y, scale.z);

        // this._uiOpacity = this.getComponent(UIOpacity);
        // if (!this._uiOpacity) {
        //     this._uiOpacity = this.addComponent(UIOpacity);
        // }

        this.touchEffectStyle = GButtonTouchStyle.NONE;
        this.node.on(NodeEventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(NodeEventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(NodeEventType.TOUCH_CANCEL, this._onTouchCancel, this);
        this.node.on(NodeEventType.TOUCH_MOVE, this._onTouchMove, this);
    }

    protected onDestroy(): void {
        this._callback = null;
        this.node.targetOff(this);
    }

    protected update(dt: number): void {
        if (this._fLongClickInterval < 0) {
            return;
        }
        this._fLongClickInterval += dt;
        if (this._fLongClickInterval >= LONG_TOUCH_CHECK_INTERVEL) {
            //长按触发
            this._fLongClickInterval = 0;
            this._longCallbackIsCall = true;
            this._longCallback && this._longCallback(null);
            if (!this._isEnableLongClickCheck) {
                this._fLongClickInterval = -1;
            }
        }
    }
    /**
     * 使用默认的效果
     * 1. 按下去缩小
     * 2. 禁用变灰
     */
    public useDefaultEffect() {
        this.touchEffectStyle = GButtonTouchStyle.SCALE_SMALLER;
        this.disableEffectStyle = GButtonDisableStyle.GREY;
    }

    public useDefaultOpacityEffect() {
        this.touchEffectStyle = GButtonTouchStyle.UIOPACITY;
        this.disableEffectStyle = GButtonDisableStyle.OPACITY;
    }

    /**
     * 显示一个呼吸的Tween效果
     */
    public showBreathTween() {
        Tween.stopAllByTarget(this.node);
        //恢复回去
        this.node.setScale(this._origin_scale.x, this._origin_scale.y, this._origin_scale.z);
        //开始一个呼吸的动画
        tween(this.node).sequence(
            tween(this.node).to(
                0.33,
                {
                    scale: v3(this._origin_scale.x - 0.05, this._origin_scale.y - 0.05, this._origin_scale.z - 0.05)
                },
                {
                    easing: easing.sineInOut
                }
            ),
            tween(this.node).to(
                0.33,
                {
                    scale: this._origin_scale
                },
                {
                    easing: easing.sineInOut
                }
            )
        ).repeatForever().start();
    }
    /**
     * 停止呼吸的Tween效果
     */
    public stopBreathTween() {
        Tween.stopAllByTarget(this.node);
        this.node.setScale(this._origin_scale.x, this._origin_scale.y, this._origin_scale.z);
    }

    /**
     * 稍微放大一点
     */
    public showBiggerScale() {
        Tween.stopAllByTarget(this.node);
        this.node.setScale(this._origin_scale.x + 0.05, this._origin_scale.y + 0.05, this._origin_scale.z + 0.05);
    }
    /**
     * 重置当前按钮的缩放
     */
    public resetBiggerScale() {
        Tween.stopAllByTarget(this.node);
        this.node.setScale(this._origin_scale.x, this._origin_scale.y, this._origin_scale.z);
    }

    /**
     * 按下去以后，是否每过一段时间就自动触发一次长按回调
     * 此变量默认为false
     */
    public get isEnableLongClickCheck() {
        return this._isEnableLongClickCheck;
    }

    /**
     * 按下去以后，是否每过一段时间就自动触发一次长按回调
     * 此变量默认为false
     */
    public set isEnableLongClickCheck(val: boolean) {
        this._isEnableLongClickCheck = val;
    }

    /**
     * 单次点击的回调函数
     * @param call
     */
    public registerOneClickHandler(call?: ClickEventCallback) {
        this._callback = call;
    }

    public get callback(): ClickEventCallback {
        return this._callback;
    }

    /**
     * 设置长按的回调函数
     * 如果传入回调函数，说明你需要执行长按回调
     * 长按回调和单次点击的回调是互斥的，所以一旦设置了长按回调，就不回触发单次点击回调了
     * @param call
     */
    public registerLongClickHandler(call?: ClickEventCallback) {
        this._longCallback = call;
    }

    /**
     * 设置按钮上显示的内容
     */
    public set title(val: string) {
        if (!this._titleLabel) {
            return;
        }
        this._titleLabel.string = val;
    }

    /**
     * 获取标题
     */
    public get title(): string {
        if (!this._titleLabel) {
            return '';
        }
        return this._titleLabel.string;
    }

    public get titleLabel() {
        return this._titleLabel;
    }

    /**
     * 获取按下后的效果
     */
    public get touchEffectStyle() {
        return this._touch_effect_style;
    }

    public get isSwallowTouches() {
        return this._bSwallowTouches;
    }

    public set isSwallowTouches(val: boolean) {
        this._bSwallowTouches = val;
    }

    /**
     * 设置按下后的效果
     */
    public set touchEffectStyle(val: GButtonTouchStyle) {
        const _origin_scale = this._origin_scale;
        if (val == GButtonTouchStyle.SCALE_SMALLER) {
            this._end_scale.set(_origin_scale.x - TOUCH_SCALE_COUNT, _origin_scale.y - TOUCH_SCALE_COUNT, _origin_scale.z - TOUCH_SCALE_COUNT);
        } else if (val == GButtonTouchStyle.SCALE_LARGER) {
            this._end_scale.set(_origin_scale.x + TOUCH_SCALE_COUNT, _origin_scale.y + TOUCH_SCALE_COUNT, _origin_scale.z + TOUCH_SCALE_COUNT);
        } else if (val == GButtonTouchStyle.UIOPACITY) {
            //改变这个按钮的Opacity
            this._end_scale.set(_origin_scale.x, _origin_scale.y, _origin_scale.z);
        }
        this._touch_effect_style = val;
    }

    public get disableEffectStyle() {
        return this._disable_effect_style;
    }

    /**
     * 设置禁用时候的效果
     */
    public set disableEffectStyle(val: GButtonDisableStyle) {
        this._disable_effect_style = val;
        if (val == GButtonDisableStyle.MASK) {
            const node = this.node.getChildByName('mask');
            if (!node) {
                bDebug && error('错误，你需要在按钮上增加一个mask的节点，用来覆盖禁用时的按钮');
                this._disable_effect_style = GButtonDisableStyle.OPACITY;
                return;
            }
        }
    }

    public get isEnabled() {
        return this._bEnabled;
    }

    public set isEnabled(val: boolean) {
        if (this._disable_effect_style == GButtonDisableStyle.OPACITY) {
            if (this._isTouching && val) {
                this._bEnabled = val;
                return;
            }
            this.node.opacity = val ? this._button_style_opacitys[0] : this._button_style_opacitys[2];
        } else if (this._disable_effect_style == GButtonDisableStyle.MASK) {
            const mask = this.node.getChildByName('mask');
            if (mask) {
                mask.active = !val;
            }
        } else if (this._disable_effect_style == GButtonDisableStyle.GREY) {
            const sps = this.node.getComponents(Sprite);
            for (let i = 0; i < sps.length; i++) {
                sps[i].grayscale = !val;
            }
            const childrenSps = this.node.getComponentsInChildren(Sprite);
            for (let i = 0; i < childrenSps.length; i++) {
                childrenSps[i].grayscale = !val;
            }
        } else if (this._disable_effect_style == GButtonDisableStyle.CHANGE_SPRITE) {
            if (this._spfs_of_icon_with_selected.length > 2) {
                const spf = val ? this._spfs_of_icon_with_selected[0] : this._spfs_of_icon_with_selected[2];
                if (this._icon) {
                    this._icon.spriteFrame = spf;
                }
            }
        }

        this._bEnabled = val;
    }

    /**
     * 获取透明度
     */
    public get opacity(): number {
        return this.node.opacity;
    }

    /**
     * 设置透明度
     */
    public set opacity(val: number) {
        this.node.opacity = val;
    }

    /**
     * 设置[未选中，选中，禁用]效果的title的字体颜色
     */
    public set colorsOfTitleWithSelected(colors: Color[]) {
        this._colors_of_title_with_selected = colors;
    }
    /**
     * 设置[未选中，选中]效果的不同的ttf
     */
    public set ttfFontOfTitleWithSelected(fonts: TTFFont[]) {
        this._ttf_font_of_title_with_selected = fonts;
    }

    /**
     * 设置[未选中，选中，禁用]时，icon的精灵变化
     */
    public set spriteFramesOfIconWithSelected(spfs: SpriteFrame[] | null) {
        this._spfs_of_icon_with_selected = spfs;
    }
    /**
     * 设置[未选中，选中，禁用]时，背景的精灵变化
     */
    public set spriteFramesOfBgWithSelected(spfs: SpriteFrame[] | null) {
        this._spfs_of_bg_with_selected = spfs;
    }
    /**
     * 设置[正常，按下，禁用]时，按钮的透明度
     */
    public set buttonStyleOpacitys(val: number[]) {
        this._button_style_opacitys = val;
    }

    /**
     * 设置[未选中，选中，禁用]时，icon的位置变化
     */
    public set iconPositionsOfSelected(pos: number[][] | null) {
        this._icon_positions_of_selected = pos;
    }

    /**
     * 设置[未选中，选中，禁用]时，icon的精灵变化
     */
    public setSpriteFrameUrlsOfIconWithSelected(bundle: AssetManager.Bundle, urls: string[]) {
        bundle.load(urls, SpriteFrame, (err, spfs) => {
            if (err || !spfs) {
                return;
            }
            if (!this.isValid || !this.node.isValid) {
                return;
            }
            this._spfs_of_icon_with_selected = spfs;
            //加载完毕后，执行一次切换任务
            const _bSelected = this._bSelected;
            this.isSelected = _bSelected;
        });
    }

    public get isSelected() {
        return this._bSelected;
    }

    /**
     * 设置是否选中
     */
    public set isSelected(val: boolean) {
        this._bSelected = val;
        const index = val ? 1 : 0;
        if (this._spfs_of_icon_with_selected.length >= 2) {
            if (this._icon) {
                this._icon.spriteFrame = this._spfs_of_icon_with_selected[index];
            } else {
                //看看根节点上是否有sprite
                const sp = this.getComponent(Sprite);
                if (sp) {
                    sp.spriteFrame = this._spfs_of_icon_with_selected[index];
                }
            }
        }
        if (this._spfs_of_bg_with_selected.length >= 2) {
            const sp = this.getComponent(Sprite);
            if (sp) {
                sp.spriteFrame = this._spfs_of_bg_with_selected[index];
            }
        }
        //如果设置了icon的位置
        if (this._icon_positions_of_selected.length >= 2) {
            Tween.stopAllByTarget(this.iconNode);
            const pos = this._icon_positions_of_selected[index];
            tween(this.iconNode)
                .to(0.15, { position: v3(pos[0], pos[1], pos[2] || 0) })
                .start();
        }

        if (!this._titleLabel) {
            return;
        }
        if (this._colors_of_title_with_selected.length >= 2) {
            const color = this._colors_of_title_with_selected[index];
            this._titleLabel.color = color;
        }

        if (this._ttf_font_of_title_with_selected.length >= 2) {
            const font = this._ttf_font_of_title_with_selected[index];
            this._titleLabel.useSystemFont = false;
            this._titleLabel.font = font;
        }
    }

    //设置title的颜色
    public set titleColor(val: Color) {
        if (!this._titleLabel) {
            return;
        }
        this._titleLabel.color = val;
    }

    /**
     * 设置icon的spriteFrame
     */
    public set icon(val: SpriteFrame) {
        if (!this._icon) {
            return;
        }
        this._icon.spriteFrame = val;
    }

    public get iconNode(): Node | null {
        if (!this._icon) {
            return null;
        }
        return this._icon.node;
    }

    /**
     * 设置title的描边颜色
     */
    public set titleOutlineColor(val: Color) {
        if (!this._titleLabel) {
            return;
        }
        this._titleLabel.enableOutline = true;
        this._titleLabel.outlineColor = val;
    }
    /**
     * 设置title的阴影颜色
     */
    public set tileShadowColor(val: Color) {
        if (!this._titleLabel) {
            return;
        }
        this._titleLabel.enableShadow = true;
        this._titleLabel.shadowColor = val;
    }
    /**
     * 获取按钮状态
     */
    public get state(): GButtonState {
        return this._state;
    }
    /**
     * 设置按钮的状态
     */
    public set state(val: GButtonState) {
        if (this._state == val) {
            return;
        }
        this._state = val;
        if (val == GButtonState.SHOW_ENABLE) {
            this.node.active = true;
            this.isEnabled = true;
        } else if (val == GButtonState.SHOW_DISABLE) {
            this.node.active = true;
            this.isEnabled = false;
        } else if (val == GButtonState.HIDE_DISABLE) {
            this.node.active = false;
            //this.isEnabled      = false;
        }
    }

    //================================事件定义===========================//

    private _resetButtonScale(event: EventTouch, call?: EmptyCallback) {
        this._fLongClickInterval = -1;
        Tween && Tween.stopAllByTarget(this.node);
        if (this._touch_effect_style == GButtonTouchStyle.SCALE_SMALLER || this._touch_effect_style == GButtonTouchStyle.SCALE_LARGER) {
            //对于放大缩小的操作，执行恢复缩放
            tween(this.node)
                .to(
                    SCALE_ANIMATION_TIME_OUT,
                    {
                        scale: this._origin_scale
                    },
                    {
                        easing: easing.elasticOut
                    }
                )
                .call(() => {
                    call && call();
                })
                .start();
        } else if (this._touch_effect_style == GButtonTouchStyle.UIOPACITY) {
            // tween(this._uiOpacity)
            //     .to(SCALE_ANIMATION_TIME_IN, {
            //         opacity: this._button_style_opacitys[0]
            //     })
            //     .call(() => {
            //         call && call();
            //     })
            //     .start();
            this.node.opacity = this._button_style_opacitys[0];
        } else if (this._touch_effect_style == GButtonTouchStyle.CHANGE_SPRITE) {
            //切换图片
            if (this._spfs_of_icon_with_selected.length > 2) {
                const spf = this._spfs_of_icon_with_selected[0];
                if (this._icon) {
                    this._icon.spriteFrame = spf;
                }
            }
            if (this._spfs_of_bg_with_selected.length > 2) {
                const spf = this._spfs_of_bg_with_selected[0];
                const sp = this.getComponent(Sprite);
                if (sp) {
                    sp.spriteFrame = spf;
                }
            }
        }
    }

    /**
     * 点击开始
     * @param event
     */
    private _onTouchStart(event: EventTouch) {
        this.stopBreathTween();
        this._longCallbackIsCall = false;

        Tween && Tween.stopAllByTarget(this.node);
        if (!this._bEnabled) {
            event.propagationStopped = this._bSwallowTouches;
            return;
        }
        this._isTouching = true;
        if (this._touch_effect_style == GButtonTouchStyle.SCALE_LARGER || this._touch_effect_style == GButtonTouchStyle.SCALE_SMALLER) {
            //只有效果是缩放的，才会执行这个效果
            tween(this.node)
                .to(SCALE_ANIMATION_TIME_IN, {
                    scale: this._end_scale
                })
                .start();
        } else if (this._touch_effect_style == GButtonTouchStyle.UIOPACITY) {
            //改变透明度，变暗
            // tween(this._uiOpacity)
            //     .to(SCALE_ANIMATION_TIME_IN, {
            //         opacity: this._button_style_opacitys[1]
            //     })
            //     .start();
            this.node.opacity = this._button_style_opacitys[1];
        } else if (this._touch_effect_style == GButtonTouchStyle.CHANGE_SPRITE) {
            //切换图片
            if (this._spfs_of_icon_with_selected.length > 2) {
                const spf = this._spfs_of_icon_with_selected[1];
                if (this._icon) {
                    this._icon.spriteFrame = spf;
                }
            }
            if (this._spfs_of_bg_with_selected.length > 2) {
                const spf = this._spfs_of_bg_with_selected[1];
                const sp = this.getComponent(Sprite);
                if (sp) {
                    sp.spriteFrame = spf;
                }
            }
        }

        if (this._longCallback) {
            this._fLongClickInterval = 0;
        }
        event.propagationStopped = this._bSwallowTouches;
    }

    /**
     * 点击结束
     * @param event
     */
    private _onTouchEnd(event: EventTouch) {
        if (!this._bEnabled) {
            event.propagationStopped = this._bSwallowTouches;
            return;
        }
        if (!this._isTouching) {
            //如果没有触摸过，直接返回
            event.propagationStopped = this._bSwallowTouches;
            return;
        }
        this._isTouching = false;
        this._resetButtonScale(event, null);
        if (!this._longCallbackIsCall) {
            //非长按才会触发单击
            if (this._callback) {
                this._callback(event, this);
            }
        }
        event.propagationStopped = this._bSwallowTouches;
        if (this._click_event_sound_config) {
            AudioManager.playSound(this._click_event_sound_config.bundleName, this._click_event_sound_config.audioName);
        } else {
            AudioManager.playSound('resources', 'button');
        }

        if (this.BUNDLE_NAME == '' || this.PANEL_NAME == '') {
            bDebug && warn('这可能是列表中的按钮，如果你需要打点，请手动打点');
            return;
        }

        const info = StatisticalHelper.getGButtonStatisticalInfo(this.PANEL_NAME, this.node.name);
        if (!info) {
            bDebug && warn('can not found button statistical info -> ' + this.node.name);
            return;
        }
        BaseGlobal.sendMsg(StatisticalReportMessage.BUTTON_STATISTICAL, info);
    }

    /**
     * 点击取消
     * @param event
     */
    private _onTouchCancel(event: EventTouch) {
        event.propagationStopped = this._bSwallowTouches;

        if (!this._bEnabled) {
            return;
        }
        this._isTouching = false;
        this._resetButtonScale(event);
    }

    private _onTouchMove(event: EventTouch) {
        event.propagationStopped = this._bSwallowTouches;

        if (!this._bEnabled) {
            return;
        }
        if (!this._isTouching) {
            return;
        }

        const deltaMove = event.getUILocation(_tempVec2);
        deltaMove.subtract(event.getUIStartLocation(_tempVec2_1));
        if (deltaMove.length() > 7) {
            this._isTouching = false;
            this._resetButtonScale(event);
        }
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
    public static readonly VIEW_NAME = 'GButton';
}
