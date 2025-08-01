const { ccclass, property, disallowMultiple, menu, executionOrder, requireComponent } = _decorator;
import { Node, Component, Enum, tween, _decorator, EventHandler, Tween, ScrollView, Prefab, Layout, Vec2, Size, NodePool, isValid, instantiate, Vec3, Widget, UITransform, CCFloat, CCBoolean, CCInteger, v3 } from 'cc';
import { DEV } from 'cc/env';
import ListItem from './list-item';
import { bDebug } from '../define';
import { log } from 'cc';
import { EventTouch } from 'cc';
import { v2 } from 'cc';

const SCALE_OVER_STRESS = v3(1.05, 1.05, 1.05);
const SCALE_NORMAL = v3(1, 1, 1);

export enum ScrollDirection {
    None = 0,
    Down = 1,
    Up = 2,
    Left = 3,
    Right = 4,
}
/**
 * 点击开始的坐标
 */
const SCROLLING_TOUCH_START_V2 = v2(0, 0);
const SCROLLING_TOUCH_NOW_V2 = v2(0, 0);

const TEMP_V3 = v3(0, 0, 0); //临时向量

const SCROLL_DIRECTION_CHECK_DISTANCE = 8; //滚动方向判断的距离阈值

enum TemplateType {
    NODE = 1,
    PREFAB = 2,
}

enum SlideType {
    NORMAL = 1, //普通
    ADHERING = 2, //粘附模式，将强制关闭滚动惯性
    PAGE = 3, //页面模式，将强制关闭滚动惯性
}

enum SelectedType {
    NONE = 0,
    SINGLE = 1, //单选
    MULT = 2, //多选
}
/**
 * item : 被选中的Node
 * index : 被选中的索引
 * lastIndex : 之前的索引
 * bSelected : 仅多选有效，是否选中
 */
export declare type ListViewClickItemEventFunc = (item: Node, index: number, lastIndex: number, bSelected?: boolean) => void;

export enum ListViewEvent {
    /**
     * 点击子节点
     */
    CLICK_ITEM = 'CLICK_ITEM',
    /**
     * 滚动结束
     */
    SCROLL_END = 'SCROLL_END',
    /**
     * 当滚动方向发生改变时
     */
    SCROLL_DIRECTION_CHANGED = 'SCROLL_DIRECTION_CHANGED',
}

export declare type ListItemRender = (item: Node, id: number) => void;

@ccclass('List')
@disallowMultiple()
@requireComponent(ScrollView)
//脚本生命周期回调的执行优先级。小于 0 的脚本将优先执行，大于 0 的脚本将最后执行。该优先级只对 onLoad, onEnable, start, update 和 lateUpdate 有效，对 onDisable 和 onDestroy 无效。
@executionOrder(-5000)
export default class List extends Component {
    //模板类型
    @property({ type: Enum(TemplateType), tooltip: DEV && '模板类型' })
    private templateType: TemplateType = TemplateType.NODE;
    //模板Item（Node）
    @property({
        type: Node,
        tooltip: DEV && '模板Item',
        visible() {
            return this.templateType == TemplateType.NODE;
        },
    })
    tmpNode: Node = null;
    //模板Item（Prefab）
    @property({
        type: Prefab,
        tooltip: DEV && '模板Item',
        visible() {
            return this.templateType == TemplateType.PREFAB;
        },
    })
    tmpPrefab: Prefab = null;
    //滑动模式
    @property({})
    private _slideMode: SlideType = SlideType.NORMAL;
    @property({
        type: Enum(SlideType),
        tooltip: DEV && '滑动模式',
    })
    set slideMode(val: SlideType) {
        this._slideMode = val;
    }
    get slideMode() {
        return this._slideMode;
    }
    //翻页作用距离
    @property({
        type: CCFloat,
        range: [0, 1, 0.1],
        tooltip: DEV && '翻页作用距离',
        slide: true,
        visible() {
            return this._slideMode == SlideType.PAGE;
        },
    })
    public pageDistance: number = 0.3;
    //页面改变事件
    @property({
        type: EventHandler,
        tooltip: DEV && '页面改变事件',
        visible() {
            return this._slideMode == SlideType.PAGE;
        },
    })
    private pageChangeEvent: EventHandler = new EventHandler();
    //是否为虚拟列表（动态列表）
    @property({})
    private _virtual: boolean = true;
    @property({
        type: CCBoolean,
        tooltip: DEV && '是否为虚拟列表（动态列表）',
    })
    set virtual(val: boolean) {
        if (val != null) this._virtual = val;
        if (!DEV && this._numItems != 0) {
            this._onScrolling();
        }
    }
    get virtual() {
        return this._virtual;
    }
    //是否为循环列表
    @property({
        tooltip: DEV && '是否为循环列表',
        visible() {
            const val: boolean = /*this.virtual &&*/ this.slideMode == SlideType.NORMAL;
            if (!val) this.cyclic = false;
            return val;
        },
    })
    public cyclic: boolean = false;
    //缺省居中
    @property({
        tooltip: DEV && 'Item数量不足以填满Content时，是否居中显示Item（不支持Grid布局）',
        visible() {
            return this.virtual;
        },
    })
    public lackCenter: boolean = false;
    //缺省可滑动
    @property({
        tooltip: DEV && 'Item数量不足以填满Content时，是否可滑动',
        visible() {
            const val: boolean = this.virtual && !this.lackCenter;
            if (!val) this.lackSlide = false;
            return val;
        },
    })
    public lackSlide: boolean = false;
    //刷新频率
    @property({ type: CCInteger })
    private _updateRate: number = 0;
    @property({
        type: CCInteger,
        range: [0, 6, 1],
        tooltip: DEV && '刷新频率（值越大刷新频率越低、性能越高）',
        slide: true,
    })
    set updateRate(val: number) {
        if (val >= 0 && val <= 6) {
            this._updateRate = val;
        }
    }
    get updateRate() {
        return this._updateRate;
    }
    //分帧渲染（每帧渲染的Item数量（<=0时关闭分帧渲染））
    @property({
        type: CCInteger,
        range: [0, 12, 1],
        tooltip: DEV && '逐帧渲染时，每帧渲染的Item数量（<=0时关闭分帧渲染）',
        slide: true,
    })
    public frameByFrameRenderNum: number = 0;
    //渲染事件（渲染器）
    // @property({
    //     type: EventHandler,
    //     tooltip: DEV && '渲染事件（渲染器）',
    // })
    // public renderEvent: EventHandler = new EventHandler();

    public itemRender: ListItemRender | null = null;
    //选择模式
    @property({
        type: Enum(SelectedType),
        tooltip: DEV && '选择模式',
    })
    public selectedMode: SelectedType = SelectedType.NONE;
    //触发选择事件
    // @property({
    //     type: EventHandler,
    //     tooltip: DEV && '触发选择事件',
    //     visible() { return this.selectedMode > SelectedType.NONE; }
    // })
    // public selectedEvent: EventHandler = new EventHandler();

    @property({
        tooltip: DEV && '是否重复响应单选事件',
        visible() {
            return this.selectedMode == SelectedType.SINGLE;
        },
    })
    public repeatEventSingle: boolean = false;

    //当前选择id
    private _selectedId: number = -1;
    private _lastSelectedId: number;
    private multSelected: number[];
    set selectedId(val: number) {
        let item: Node;
        switch (this.selectedMode) {
            case SelectedType.SINGLE: {
                if (!this.repeatEventSingle && val == this._selectedId) return;
                item = this.getItemByListId(val);
                // if (!item && val >= 0)
                //     return;
                let listItem: ListItem;
                if (this._selectedId >= 0) this._lastSelectedId = this._selectedId;
                //如果＜0则取消选择，把_lastSelectedId也置空吧，如果以后有特殊需求再改吧。
                else this._lastSelectedId = null;
                this._selectedId = val;
                if (item) {
                    listItem = item.getComponent(ListItem);
                    listItem.selected = true;
                }
                if (this._lastSelectedId >= 0 && this._lastSelectedId != this._selectedId) {
                    const lastItem = this.getItemByListId(this._lastSelectedId);
                    if (lastItem) {
                        lastItem.getComponent(ListItem).selected = false;
                    }
                }
                //if (this.selectedEvent) {
                //EventHandler.emitEvents([this.selectedEvent], item, val % this._actualNumItems, this._lastSelectedId == null ? null : (this._lastSelectedId % this._actualNumItems));
                //}
                this.node.emit(ListViewEvent.CLICK_ITEM, item, val % this._actualNumItems, this._lastSelectedId == null ? null : this._lastSelectedId % this._actualNumItems);
                break;
            }
            case SelectedType.MULT: {
                item = this.getItemByListId(val);
                if (!item) return;
                const listItem = item.getComponent(ListItem);
                if (this._selectedId >= 0) this._lastSelectedId = this._selectedId;
                this._selectedId = val;
                const bool: boolean = !listItem.selected;
                listItem.selected = bool;
                const sub: number = this.multSelected.indexOf(val);
                if (bool && sub < 0) {
                    this.multSelected.push(val);
                } else if (!bool && sub >= 0) {
                    this.multSelected.splice(sub, 1);
                }
                // if (this.selectedEvent) {
                //     EventHandler.emitEvents([this.selectedEvent], item, val % this._actualNumItems, this._lastSelectedId == null ? null : (this._lastSelectedId % this._actualNumItems), bool);
                // }
                this.node.emit(ListViewEvent.CLICK_ITEM, item, val % this._actualNumItems, this._lastSelectedId == null ? null : this._lastSelectedId % this._actualNumItems, bool);
                break;
            }
        }
    }
    get selectedId() {
        return this._selectedId;
    }
    private _forceUpdate: boolean = false;
    private _align: number;
    private _horizontalDir: number;
    private _verticalDir: number;
    private _startAxis: number;
    private _alignCalcType: number;
    public content: Node;
    private _contentUt: UITransform;
    private firstListId: number;
    public displayItemNum: number;
    private _updateDone: boolean = true;
    private _updateCounter: number;
    public _actualNumItems: number;
    private _cyclicNum: number;
    private _cyclicPos1: number;
    private _cyclicPos2: number;
    //列表数量
    @property({
        serializable: false,
    })
    private _numItems: number = 0;
    set numItems(val: number) {
        if (!this.checkInited(false)) return;
        if (val == null || val < 0) {
            bDebug && console.error('numItems set the wrong::', val);
            return;
        }
        this._actualNumItems = this._numItems = val;
        this._forceUpdate = true;

        if (this._virtual) {
            this._resizeContent();
            if (this.cyclic) {
                this._numItems = this._cyclicNum * this._numItems;
            }
            this._onScrolling();
            if (!this.frameByFrameRenderNum && this.slideMode == SlideType.PAGE) this.curPageNum = this.nearestListId;
        } else {
            if (this.cyclic) {
                this._resizeContent();
                this._numItems = this._cyclicNum * this._numItems;
            }
            const layout: Layout = this.content.getComponent(Layout);
            if (layout) {
                layout.enabled = true;
            }
            this._delRedundantItem();

            this.firstListId = 0;
            if (this.frameByFrameRenderNum > 0) {
                //先渲染几个出来
                const len: number = this.frameByFrameRenderNum > this._numItems ? this._numItems : this.frameByFrameRenderNum;
                for (let n: number = 0; n < len; n++) {
                    this._createOrUpdateItem2(n);
                }
                if (this.frameByFrameRenderNum < this._numItems) {
                    this._updateCounter = this.frameByFrameRenderNum;
                    this._updateDone = false;
                }
            } else {
                for (let n: number = 0; n < this._numItems; n++) {
                    this._createOrUpdateItem2(n);
                }
                this.displayItemNum = this._numItems;
            }
        }
    }
    get numItems() {
        return this._actualNumItems;
    }

    private _inited: boolean = false;
    private _scrollView: ScrollView;
    get scrollView() {
        return this._scrollView;
    }
    private _layout: Layout;
    private _resizeMode: number;
    private _topGap: number;
    private _rightGap: number;
    private _bottomGap: number;
    private _leftGap: number;

    private _columnGap: number;
    private _lineGap: number;
    private _colLineNum: number;

    private _lastDisplayData: number[];
    public displayData: any[];
    private _pool: NodePool;

    private _itemTmp: Node;
    private _itemTmpUt: UITransform;
    private _needUpdateWidget: boolean = false;
    private _itemSize: Size;
    private _sizeType: boolean;

    public _customSize: any;

    private frameCount: number;
    private _aniDelRuning: boolean = false;
    private _aniDelCB: Function;
    private _aniDelItem: Node;
    private _aniDelBeforePos: Vec3;
    private _aniDelBeforeScale: Vec3;
    private viewTop: number;
    private viewRight: number;
    private viewBottom: number;
    private viewLeft: number;

    private _doneAfterUpdate: boolean = false;

    private elasticTop: number;
    private elasticRight: number;
    private elasticBottom: number;
    private elasticLeft: number;

    private scrollToListId: number;

    private adhering: boolean = false;

    private _adheringBarrier: boolean = false;
    private nearestListId: number;

    public curPageNum: number = 0;
    private _beganPos: number;
    private _scrollPos: number;
    private _curScrollIsTouch: boolean; //当前滑动是否为手动

    private _scrollToListId: number;
    private _scrollToEndTime: number;
    private _scrollToSo: any;

    private _lack: boolean;
    private _allItemSize: number;
    private _allItemSizeNoEdge: number;

    private _scrollItem: any; //当前控制 ScrollView 滚动的 Item

    private _thisNodeUt: UITransform;
    /**
     * 当前列表中的最后一个的索引
     * 注意，目前仅支持虚拟列表类型
     */
    private _lastIdInView: number = -1;

    public get lastIdInView() {
        return this._lastIdInView;
    }   
    /**
     * 当前滑动的方向
     */
    private _scrollDirection: ScrollDirection = ScrollDirection.None;

    public get scrollDirection() {
        return this._scrollDirection;
    }
    //----------------------------------------------------------------------------

    onLoad() {
        this._init();
    }

    onDestroy() {
        if (isValid(this._itemTmp)) this._itemTmp.destroy();
        if (isValid(this.tmpNode)) this.tmpNode.destroy();
        this._pool && this._pool.clear();
    }

    onEnable() {
        // if (!EDITOR)
        this._registerEvent();
        this._init();
        // 处理重新显示后，有可能上一次的动画移除还未播放完毕，导致动画卡住的问题
        if (this._aniDelRuning) {
            this._aniDelRuning = false;
            if (this._aniDelItem) {
                if (this._aniDelBeforePos) {
                    this._aniDelItem.position = this._aniDelBeforePos;
                    delete this._aniDelBeforePos;
                }
                if (this._aniDelBeforeScale) {
                    this._aniDelItem.scale = this._aniDelBeforeScale;
                    delete this._aniDelBeforeScale;
                }
                delete this._aniDelItem;
            }
            if (this._aniDelCB) {
                this._aniDelCB();
                delete this._aniDelCB;
            }
        }
    }

    onDisable() {
        // if (!EDITOR)
        this._unregisterEvent();
    }
    //注册事件
    _registerEvent() {
        this.node.on(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(ScrollView.EventType.TOUCH_UP, this._onTouchUp, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this._onTouchCancelled, this);
        this.node.on(ScrollView.EventType.SCROLL_BEGAN, this._onScrollBegan, this);
        this.node.on(ScrollView.EventType.SCROLL_ENDED, this._onScrollEnded, this);
        this.node.on(ScrollView.EventType.SCROLLING, this._onScrolling, this);
        this.node.on(Node.EventType.SIZE_CHANGED, this._onSizeChanged, this);
    }
    //卸载事件
    _unregisterEvent() {
        this.node.off(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.off(ScrollView.EventType.TOUCH_UP, this._onTouchUp, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this._onTouchCancelled, this);
        this.node.off(ScrollView.EventType.SCROLL_BEGAN, this._onScrollBegan, this);
        this.node.off(ScrollView.EventType.SCROLL_ENDED, this._onScrollEnded, this);
        this.node.off(ScrollView.EventType.SCROLLING, this._onScrolling, this);
        this.node.off(Node.EventType.SIZE_CHANGED, this._onSizeChanged, this);
    }

    public registerItemClickCallback(call: ListViewClickItemEventFunc, target?: any) {
        this.node.on(ListViewEvent.CLICK_ITEM, call, target);
    }

    public unregisterItemClickCallback(call: ListViewClickItemEventFunc, target?: any) {
        this.node.off(ListViewEvent.CLICK_ITEM, call, target);
    }

    public on(eventType: ListViewEvent, call: Function, target?: any) {
        this.node.on(eventType, call, target);
    }

    public off(eventType: ListViewEvent, call: Function, target?: any) {
        this.node.off(eventType, call, target);
    }
    /**
     * 移除目标上注册的所有事件
     * @param target
     */
    public targetOff(target: any) {
        this.node?.targetOff(target);
    }

    //初始化各种..
    _init() {
        if (this._inited) return;
        if(this.templateType == TemplateType.PREFAB && !this.tmpPrefab){
            return;
        }

        this._thisNodeUt = this.node.getComponent(UITransform);
        this._scrollView = this.node.getComponent(ScrollView);

        this.content = this._scrollView.content;
        this._contentUt = this.content.getComponent(UITransform);
        if (!this.content) {
            bDebug && console.error(this.node.name + "'s ScrollView unset content!");
            return;
        }

        this._layout = this.content.getComponent(Layout);

        this._align = this._layout.type; //排列模式
        this._resizeMode = this._layout.resizeMode; //自适应模式
        this._startAxis = this._layout.startAxis;

        this._topGap = this._layout.paddingTop; //顶边距
        this._rightGap = this._layout.paddingRight; //右边距
        this._bottomGap = this._layout.paddingBottom; //底边距
        this._leftGap = this._layout.paddingLeft; //左边距

        this._columnGap = this._layout.spacingX; //列距
        this._lineGap = this._layout.spacingY; //行距

        this._colLineNum; //列数或行数（非GRID模式则=1，表示单列或单行）;

        this._verticalDir = this._layout.verticalDirection; //垂直排列子节点的方向
        this._horizontalDir = this._layout.horizontalDirection; //水平排列子节点的方向
        let tmp: Node | null = null;
        //instantiate(this.templateType == TemplateType.PREFAB ? this.tmpPrefab : this.tmpNode);
        if (this.templateType == TemplateType.PREFAB) {
            if(this.tmpPrefab){
                tmp = instantiate(this.tmpPrefab);
            }else{
                bDebug && log('tmpPrefab is null,please set it after your get one!');
            }
            
        } else {
            tmp = instantiate(this.tmpNode);
        }
        tmp && this.setTemplateItem(tmp);

        // 特定的滑动模式处理
        if (this._slideMode == SlideType.ADHERING || this._slideMode == SlideType.PAGE) {
            this._scrollView.inertia = false;
            this._scrollView['_onMouseWheel'] = function () {
                return;
            };
        }
        if (!this.virtual)
            // lackCenter 仅支持 Virtual 模式
            this.lackCenter = false;

        this._lastDisplayData = []; //最后一次刷新的数据
        this.displayData = []; //当前数据
        this._pool = new NodePool(); //这是个池子..
        this._forceUpdate = false; //是否强制更新
        this._updateCounter = 0; //当前分帧渲染帧数
        this._updateDone = true; //分帧渲染是否完成

        this.curPageNum = 0; //当前页数

        if (this.cyclic || 0) {
            this._scrollView['_processAutoScrolling'] = this._processAutoScrolling.bind(this);
            this._scrollView['_startBounceBackIfNeeded'] = function () {
                return false;
            };
        }

        switch (this._align) {
            case Layout.Type.HORIZONTAL: {
                switch (this._horizontalDir) {
                    case Layout.HorizontalDirection.LEFT_TO_RIGHT:
                        this._alignCalcType = 1;
                        break;
                    case Layout.HorizontalDirection.RIGHT_TO_LEFT:
                        this._alignCalcType = 2;
                        break;
                }
                break;
            }
            case Layout.Type.VERTICAL: {
                switch (this._verticalDir) {
                    case Layout.VerticalDirection.TOP_TO_BOTTOM:
                        this._alignCalcType = 3;
                        break;
                    case Layout.VerticalDirection.BOTTOM_TO_TOP:
                        this._alignCalcType = 4;
                        break;
                }
                break;
            }
            case Layout.Type.GRID: {
                switch (this._startAxis) {
                    case Layout.AxisDirection.HORIZONTAL:
                        switch (this._verticalDir) {
                            case Layout.VerticalDirection.TOP_TO_BOTTOM:
                                this._alignCalcType = 3;
                                break;
                            case Layout.VerticalDirection.BOTTOM_TO_TOP:
                                this._alignCalcType = 4;
                                break;
                        }
                        break;
                    case Layout.AxisDirection.VERTICAL:
                        switch (this._horizontalDir) {
                            case Layout.HorizontalDirection.LEFT_TO_RIGHT:
                                this._alignCalcType = 1;
                                break;
                            case Layout.HorizontalDirection.RIGHT_TO_LEFT:
                                this._alignCalcType = 2;
                                break;
                        }
                        break;
                }
                break;
            }
        }
        // 清空 content
        // this.content.children.forEach((child: Node) => {
        //     child.removeFromParent();
        //     if (child != this.tmpNode && child.isValid)
        //         child.destroy();
        // });
        this.content.removeAllChildren();
        this._inited = true;
    }
    /**
     * 为了实现循环列表，必须覆写cc.ScrollView的某些函数
     * @param {Number} dt
     */
    _processAutoScrolling(dt: number) {
        // ------------- scroll-view 里定义的一些常量 -------------
        const OUT_OF_BOUNDARY_BREAKING_FACTOR = 0.05;
        const EPSILON = 1e-4;
        const ZERO = new Vec3();
        const quintEaseOut = (time: number) => {
            time -= 1;
            return time * time * time * time * time + 1;
        };
        // ------------- scroll-view 里定义的一些常量 -------------

        const sv: ScrollView = this._scrollView;

        const isAutoScrollBrake = sv['_isNecessaryAutoScrollBrake']();
        const brakingFactor = isAutoScrollBrake ? OUT_OF_BOUNDARY_BREAKING_FACTOR : 1;
        sv['_autoScrollAccumulatedTime'] += dt * (1 / brakingFactor);

        let percentage = Math.min(1, sv['_autoScrollAccumulatedTime'] / sv['_autoScrollTotalTime']);
        if (sv['_autoScrollAttenuate']) {
            percentage = quintEaseOut(percentage);
        }

        const clonedAutoScrollTargetDelta = sv['_autoScrollTargetDelta'].clone();
        clonedAutoScrollTargetDelta.multiplyScalar(percentage);
        const clonedAutoScrollStartPosition = sv['_autoScrollStartPosition'].clone();
        clonedAutoScrollStartPosition.add(clonedAutoScrollTargetDelta);
        let reachedEnd = Math.abs(percentage - 1) <= EPSILON;

        const fireEvent = Math.abs(percentage - 1) <= sv['getScrollEndedEventTiming']();
        if (fireEvent && !sv['_isScrollEndedWithThresholdEventFired']) {
            sv['_dispatchEvent'](ScrollView.EventType.SCROLL_ENG_WITH_THRESHOLD);
            sv['_isScrollEndedWithThresholdEventFired'] = true;
        }

        if (sv['elastic']) {
            const brakeOffsetPosition = clonedAutoScrollStartPosition.clone();
            brakeOffsetPosition.subtract(sv['_autoScrollBrakingStartPosition']);
            if (isAutoScrollBrake) {
                brakeOffsetPosition.multiplyScalar(brakingFactor);
            }
            clonedAutoScrollStartPosition.set(sv['_autoScrollBrakingStartPosition']);
            clonedAutoScrollStartPosition.add(brakeOffsetPosition);
        } else {
            const moveDelta = clonedAutoScrollStartPosition.clone();
            moveDelta.subtract(sv['_getContentPosition']());
            const outOfBoundary = sv['_getHowMuchOutOfBoundary'](moveDelta);
            if (!outOfBoundary.equals(ZERO, EPSILON)) {
                clonedAutoScrollStartPosition.add(outOfBoundary);
                reachedEnd = true;
            }
        }

        if (reachedEnd) {
            sv['_autoScrolling'] = false;
        }

        const deltaMove = new Vec3(clonedAutoScrollStartPosition);
        deltaMove.subtract(sv['_getContentPosition']());
        sv['_clampDelta'](deltaMove);
        sv['_moveContent'](deltaMove, reachedEnd);
        sv['_dispatchEvent'](ScrollView.EventType.SCROLLING);

        if (!sv['_autoScrolling']) {
            sv['_isBouncing'] = false;
            sv['_scrolling'] = false;
            sv['_dispatchEvent'](ScrollView.EventType.SCROLL_ENDED);
        }
    }
    //设置模板Item
    setTemplateItem(item: Node) {
        if (!item) {
            return;
        }
        this._itemTmp   = item;
        this._itemTmpUt = item.getComponent(UITransform);

        if (this._resizeMode == Layout.ResizeMode.CHILDREN) this._itemSize = this._layout.cellSize;
        else {
            const itemUt: UITransform = item.getComponent(UITransform);
            this._itemSize = new Size(itemUt.width, itemUt.height);
        }

        //获取ListItem，如果没有就取消选择模式
        let com = item.getComponent(ListItem);

        if (!com) {
            com = item.addComponent(ListItem);
        }
        const widget = item.getComponent(Widget);
        if (widget && widget.enabled) {
            this._needUpdateWidget = true;
        }
        if (this.selectedMode == SelectedType.MULT) this.multSelected = [];

        switch (this._align) {
            case Layout.Type.HORIZONTAL:
                this._colLineNum = 1;
                this._sizeType = false;
                break;
            case Layout.Type.VERTICAL:
                this._colLineNum = 1;
                this._sizeType = true;
                break;
            case Layout.Type.GRID:
                switch (this._startAxis) {
                    case Layout.AxisDirection.HORIZONTAL:
                        //计算列数
                        const trimW: number = this._contentUt.width - this._leftGap - this._rightGap;
                        this._colLineNum = Math.floor((trimW + this._columnGap) / (this._itemSize.width + this._columnGap));
                        this._sizeType = true;
                        break;
                    case Layout.AxisDirection.VERTICAL:
                        //计算行数
                        const trimH: number = this._contentUt.height - this._topGap - this._bottomGap;
                        this._colLineNum = Math.floor((trimH + this._lineGap) / (this._itemSize.height + this._lineGap));
                        this._sizeType = false;
                        break;
                }
                break;
        }
    }
    /**
     * 检查是否初始化
     * @param {Boolean} printLog 是否打印错误信息
     * @returns
     */
    checkInited(printLog: boolean = true) {
        if (!this._inited) {
            if (bDebug && printLog) console.error('List initialization not completed!');
            return false;
        }
        return true;
    }
    //禁用 Layout 组件，自行计算 Content Size
    _resizeContent() {
        const t: any = this;
        let result: number;

        switch (t._align) {
            case Layout.Type.HORIZONTAL: {
                if (t._customSize) {
                    const fixed: any = t._getFixedSize(null);
                    result = t._leftGap + fixed.val + t._itemSize.width * (t._numItems - fixed.count) + t._columnGap * (t._numItems - 1) + t._rightGap;
                } else {
                    result = t._leftGap + t._itemSize.width * t._numItems + t._columnGap * (t._numItems - 1) + t._rightGap;
                }
                break;
            }
            case Layout.Type.VERTICAL: {
                if (t._customSize) {
                    const fixed: any = t._getFixedSize(null);
                    result = t._topGap + fixed.val + t._itemSize.height * (t._numItems - fixed.count) + t._lineGap * (t._numItems - 1) + t._bottomGap;
                } else {
                    result = t._topGap + t._itemSize.height * t._numItems + t._lineGap * (t._numItems - 1) + t._bottomGap;
                }
                break;
            }
            case Layout.Type.GRID: {
                //网格模式不支持居中
                if (t.lackCenter) t.lackCenter = false;
                switch (t._startAxis) {
                    case Layout.AxisDirection.HORIZONTAL:
                        const lineNum: number = Math.ceil(t._numItems / t._colLineNum);
                        result = t._topGap + t._itemSize.height * lineNum + t._lineGap * (lineNum - 1) + t._bottomGap;
                        break;
                    case Layout.AxisDirection.VERTICAL:
                        const colNum: number = Math.ceil(t._numItems / t._colLineNum);
                        result = t._leftGap + t._itemSize.width * colNum + t._columnGap * (colNum - 1) + t._rightGap;
                        break;
                }
                break;
            }
        }

        const layout: Layout = t.content.getComponent(Layout);
        if (layout) layout.enabled = false;

        t._allItemSize = result;
        t._allItemSizeNoEdge = t._allItemSize - (t._sizeType ? t._topGap + t._bottomGap : t._leftGap + t._rightGap);

        if (t.cyclic) {
            let totalSize: number = t._sizeType ? t._thisNodeUt.height : t._thisNodeUt.width;

            t._cyclicPos1 = 0;
            totalSize -= t._cyclicPos1;
            t._cyclicNum = Math.ceil(totalSize / t._allItemSizeNoEdge) + 1;
            const spacing: number = t._sizeType ? t._lineGap : t._columnGap;
            t._cyclicPos2 = t._cyclicPos1 + t._allItemSizeNoEdge + spacing;
            t._cyclicAllItemSize = t._allItemSize + t._allItemSizeNoEdge * (t._cyclicNum - 1) + spacing * (t._cyclicNum - 1);
            t._cycilcAllItemSizeNoEdge = t._allItemSizeNoEdge * t._cyclicNum;
            t._cycilcAllItemSizeNoEdge += spacing * (t._cyclicNum - 1);
            // cc.log('_cyclicNum ->', t._cyclicNum, t._allItemSizeNoEdge, t._allItemSize, t._cyclicPos1, t._cyclicPos2);
        }

        t._lack = !t.cyclic && t._allItemSize < (t._sizeType ? t._thisNodeUt.height : t._thisNodeUt.width);
        const slideOffset: number = (!t._lack || !t.lackCenter) && t.lackSlide ? 0 : 0.1;

        let targetWH: number = t._lack ? (t._sizeType ? t._thisNodeUt.height : t._thisNodeUt.width) - slideOffset : t.cyclic ? t._cyclicAllItemSize : t._allItemSize;
        if (targetWH < 0) targetWH = 0;

        if (t._sizeType) {
            t._contentUt.height = targetWH;
        } else {
            t._contentUt.width = targetWH;
        }

        // cc.log('_resizeContent()  numItems =', t._numItems, '，content =', t.content);
    }

    //滚动进行时...
    _onScrolling(ev: Event = null) {
        this.content.getPosition(TEMP_V3);
        if (this.frameCount == null) this.frameCount = this._updateRate;
        if (!this._forceUpdate && ev && ev.type != 'scroll-ended' && this.frameCount > 0) {
            this.frameCount--;
            return;
        } else this.frameCount = this._updateRate;

        if (this._aniDelRuning) return;

        //循环列表处理
        if (this.cyclic) {
            //let scrollPos: any = this.content.getPosition();
            let scrollPos = this._sizeType ? TEMP_V3.y : TEMP_V3.x;

            const addVal = this._allItemSizeNoEdge + (this._sizeType ? this._lineGap : this._columnGap);
            const add: any = this._sizeType ? new Vec3(0, addVal, 0) : new Vec3(addVal, 0, 0);

            const contentPos = this.content.getPosition();

            switch (this._alignCalcType) {
                case 1: //单行HORIZONTAL（LEFT_TO_RIGHT）、网格VERTICAL（LEFT_TO_RIGHT）
                    if (scrollPos > -this._cyclicPos1) {
                        contentPos.set(-this._cyclicPos2, contentPos.y, contentPos.z);
                        this.content.setPosition(contentPos);
                        if (this._scrollView.isAutoScrolling()) {
                            this._scrollView['_autoScrollStartPosition'] = this._scrollView['_autoScrollStartPosition'].subtract(add);
                        }
                        // if (this._beganPos) {
                        //     this._beganPos += add;
                        // }
                    } else if (scrollPos < -this._cyclicPos2) {
                        contentPos.set(-this._cyclicPos1, contentPos.y, contentPos.z);
                        this.content.setPosition(contentPos);
                        if (this._scrollView.isAutoScrolling()) {
                            this._scrollView['_autoScrollStartPosition'] = this._scrollView['_autoScrollStartPosition'].add(add);
                        }
                        // if (this._beganPos) {
                        //     this._beganPos -= add;
                        // }
                    }
                    break;
                case 2: //单行HORIZONTAL（RIGHT_TO_LEFT）、网格VERTICAL（RIGHT_TO_LEFT）
                    if (scrollPos < this._cyclicPos1) {
                        contentPos.set(this._cyclicPos2, contentPos.y, contentPos.z);
                        this.content.setPosition(contentPos);
                        if (this._scrollView.isAutoScrolling()) {
                            this._scrollView['_autoScrollStartPosition'] = this._scrollView['_autoScrollStartPosition'].add(add);
                        }
                    } else if (scrollPos > this._cyclicPos2) {
                        contentPos.set(this._cyclicPos1, contentPos.y, contentPos.z);
                        this.content.setPosition(contentPos);
                        if (this._scrollView.isAutoScrolling()) {
                            this._scrollView['_autoScrollStartPosition'] = this._scrollView['_autoScrollStartPosition'].subtract(add);
                        }
                    }
                    break;
                case 3: //单列VERTICAL（TOP_TO_BOTTOM）、网格HORIZONTAL（TOP_TO_BOTTOM）
                    if (scrollPos < this._cyclicPos1) {
                        contentPos.set(contentPos.x, this._cyclicPos2, contentPos.z);
                        this.content.setPosition(contentPos);
                        if (this._scrollView.isAutoScrolling()) {
                            this._scrollView['_autoScrollStartPosition'] = this._scrollView['_autoScrollStartPosition'].add(add);
                        }
                    } else if (scrollPos > this._cyclicPos2) {
                        contentPos.set(contentPos.x, this._cyclicPos1, contentPos.z);
                        this.content.setPosition(contentPos);
                        if (this._scrollView.isAutoScrolling()) {
                            this._scrollView['_autoScrollStartPosition'] = this._scrollView['_autoScrollStartPosition'].subtract(add);
                        }
                    }
                    break;
                case 4: //单列VERTICAL（BOTTOM_TO_TOP）、网格HORIZONTAL（BOTTOM_TO_TOP）
                    if (scrollPos > -this._cyclicPos1) {
                        contentPos.set(contentPos.x, -this._cyclicPos2, contentPos.z);
                        this.content.setPosition(contentPos);
                        if (this._scrollView.isAutoScrolling()) {
                            this._scrollView['_autoScrollStartPosition'] = this._scrollView['_autoScrollStartPosition'].subtract(add);
                        }
                    } else if (scrollPos < -this._cyclicPos2) {
                        contentPos.set(contentPos.x, -this._cyclicPos1, contentPos.z);
                        this.content.setPosition(contentPos);
                        if (this._scrollView.isAutoScrolling()) {
                            this._scrollView['_autoScrollStartPosition'] = this._scrollView['_autoScrollStartPosition'].add(add);
                        }
                    }
                    break;
            }
        }

        this._calcViewPos();

        let vTop: number, vRight: number, vBottom: number, vLeft: number;
        if (this._sizeType) {
            vTop = this.viewTop;
            vBottom = this.viewBottom;
        } else {
            vRight = this.viewRight;
            vLeft = this.viewLeft;
        }

        if (this._virtual) {
            this.displayData = [];
            let itemPos: any;

            let curId: number = 0;
            let endId: number = this._numItems - 1;

            if (this._customSize) {
                let breakFor: boolean = false;
                //如果该item的位置在可视区域内，就推入displayData
                for (; curId <= endId && !breakFor; curId++) {
                    itemPos = this._calcItemPos(curId);
                    switch (this._align) {
                        case Layout.Type.HORIZONTAL:
                            if (itemPos.right >= vLeft && itemPos.left <= vRight) {
                                this.displayData.push(itemPos);
                            } else if (curId != 0 && this.displayData.length > 0) {
                                breakFor = true;
                            }
                            break;
                        case Layout.Type.VERTICAL:
                            if (itemPos.bottom <= vTop && itemPos.top >= vBottom) {
                                this.displayData.push(itemPos);
                            } else if (curId != 0 && this.displayData.length > 0) {
                                breakFor = true;
                            }
                            break;
                        case Layout.Type.GRID:
                            switch (this._startAxis) {
                                case Layout.AxisDirection.HORIZONTAL:
                                    if (itemPos.bottom <= vTop && itemPos.top >= vBottom) {
                                        this.displayData.push(itemPos);
                                    } else if (curId != 0 && this.displayData.length > 0) {
                                        breakFor = true;
                                    }
                                    break;
                                case Layout.AxisDirection.VERTICAL:
                                    if (itemPos.right >= vLeft && itemPos.left <= vRight) {
                                        this.displayData.push(itemPos);
                                    } else if (curId != 0 && this.displayData.length > 0) {
                                        breakFor = true;
                                    }
                                    break;
                            }
                            break;
                    }
                }
            } else {
                const ww: number = this._itemSize.width + this._columnGap;
                const hh: number = this._itemSize.height + this._lineGap;
                switch (this._alignCalcType) {
                    case 1: //单行HORIZONTAL（LEFT_TO_RIGHT）、网格VERTICAL（LEFT_TO_RIGHT）
                        curId = (vLeft - this._leftGap) / ww;
                        endId = (vRight - this._leftGap) / ww;
                        break;
                    case 2: //单行HORIZONTAL（RIGHT_TO_LEFT）、网格VERTICAL（RIGHT_TO_LEFT）
                        curId = (-vRight - this._rightGap) / ww;
                        endId = (-vLeft - this._rightGap) / ww;
                        break;
                    case 3: //单列VERTICAL（TOP_TO_BOTTOM）、网格HORIZONTAL（TOP_TO_BOTTOM）
                        curId = (-vTop - this._topGap) / hh;
                        endId = (-vBottom - this._topGap) / hh;
                        break;
                    case 4: //单列VERTICAL（BOTTOM_TO_TOP）、网格HORIZONTAL（BOTTOM_TO_TOP）
                        curId = (vBottom - this._bottomGap) / hh;
                        endId = (vTop - this._bottomGap) / hh;
                        break;
                }
                curId = Math.floor(curId) * this._colLineNum;
                endId = Math.ceil(endId) * this._colLineNum;
                endId--;
                if (curId < 0) curId = 0;
                if (endId >= this._numItems) endId = this._numItems - 1;
                for (; curId <= endId; curId++) {
                    this.displayData.push(this._calcItemPos(curId));
                }
            }
            this._delRedundantItem();
            if (this.displayData.length <= 0 || !this._numItems) {
                //if none, delete all.
                this._lastDisplayData = [];
                return;
            }
            this.firstListId = this.displayData[0].id;
            this.displayItemNum = this.displayData.length;

            const len: number = this._lastDisplayData.length;

            let haveDataChange: boolean = this.displayItemNum != len;
            if (haveDataChange) {
                // 如果是逐帧渲染，需要排序
                if (this.frameByFrameRenderNum > 0) {
                    this._lastDisplayData.sort((a, b) => {
                        return a - b;
                    });
                }
                // 因List的显示数据是有序的，所以只需要判断数组长度是否相等，以及头、尾两个元素是否相等即可。
                haveDataChange = this.firstListId != this._lastDisplayData[0] || this.displayData[this.displayItemNum - 1].id != this._lastDisplayData[len - 1];
            }

            if (this._forceUpdate || haveDataChange) {
                //如果是强制更新
                if (this.frameByFrameRenderNum > 0) {
                    // if (this._updateDone) {
                    // this._lastDisplayData = [];
                    //逐帧渲染
                    if (this._numItems > 0) {
                        if (!this._updateDone) {
                            this._doneAfterUpdate = true;
                        } else {
                            this._updateCounter = 0;
                        }
                        this._updateDone = false;
                    } else {
                        this._updateCounter = 0;
                        this._updateDone = true;
                    }
                    // }
                } else {
                    //直接渲染
                    this._lastDisplayData = [];
                    // cc.log('List Display Data II::', this.displayData);
                    for (let c = 0; c < this.displayItemNum; c++) {
                        this._createOrUpdateItem(this.displayData[c]);
                    }
                    this._forceUpdate = false;
                }
            }
            this._calcNearestItem();
            this._lastIdInView = endId;
            //console.log("curId = " + curId + ",endId = " + endId);
        }
    }
    //计算可视范围
    _calcViewPos() {
        const scrollPos: any = this.content.getPosition();
        switch (this._alignCalcType) {
            case 1: //单行HORIZONTAL（LEFT_TO_RIGHT）、网格VERTICAL（LEFT_TO_RIGHT）
                this.elasticLeft = scrollPos.x > 0 ? scrollPos.x : 0;
                this.viewLeft = (scrollPos.x < 0 ? -scrollPos.x : 0) - this.elasticLeft;

                this.viewRight = this.viewLeft + this._thisNodeUt.width;
                this.elasticRight = this.viewRight > this._contentUt.width ? Math.abs(this.viewRight - this._contentUt.width) : 0;
                this.viewRight += this.elasticRight;
                // cc.log(this.elasticLeft, this.elasticRight, this.viewLeft, this.viewRight);
                break;
            case 2: //单行HORIZONTAL（RIGHT_TO_LEFT）、网格VERTICAL（RIGHT_TO_LEFT）
                this.elasticRight = scrollPos.x < 0 ? -scrollPos.x : 0;
                this.viewRight = (scrollPos.x > 0 ? -scrollPos.x : 0) + this.elasticRight;
                this.viewLeft = this.viewRight - this._thisNodeUt.width;
                this.elasticLeft = this.viewLeft < -this._contentUt.width ? Math.abs(this.viewLeft + this._contentUt.width) : 0;
                this.viewLeft -= this.elasticLeft;
                // cc.log(this.elasticLeft, this.elasticRight, this.viewLeft, this.viewRight);
                break;
            case 3: //单列VERTICAL（TOP_TO_BOTTOM）、网格HORIZONTAL（TOP_TO_BOTTOM）
                this.elasticTop = scrollPos.y < 0 ? Math.abs(scrollPos.y) : 0;
                this.viewTop = (scrollPos.y > 0 ? -scrollPos.y : 0) + this.elasticTop;
                this.viewBottom = this.viewTop - this._thisNodeUt.height;
                this.elasticBottom = this.viewBottom < -this._contentUt.height ? Math.abs(this.viewBottom + this._contentUt.height) : 0;
                this.viewBottom += this.elasticBottom;
                // cc.log(this.elasticTop, this.elasticBottom, this.viewTop, this.viewBottom);
                break;
            case 4: //单列VERTICAL（BOTTOM_TO_TOP）、网格HORIZONTAL（BOTTOM_TO_TOP）
                this.elasticBottom = scrollPos.y > 0 ? Math.abs(scrollPos.y) : 0;
                this.viewBottom = (scrollPos.y < 0 ? -scrollPos.y : 0) - this.elasticBottom;
                this.viewTop = this.viewBottom + this._thisNodeUt.height;
                this.elasticTop = this.viewTop > this._contentUt.height ? Math.abs(this.viewTop - this._contentUt.height) : 0;
                this.viewTop -= this.elasticTop;
                // cc.log(this.elasticTop, this.elasticBottom, this.viewTop, this.viewBottom);
                break;
        }
    }
    //计算位置 根据id
    _calcItemPos(id: number) {
        let width: number, height: number, top: number, bottom: number, left: number, right: number, itemX: number, itemY: number;
        switch (this._align) {
            case Layout.Type.HORIZONTAL:
                switch (this._horizontalDir) {
                    case Layout.HorizontalDirection.LEFT_TO_RIGHT: {
                        if (this._customSize) {
                            const fixed: any = this._getFixedSize(id);
                            left = this._leftGap + (this._itemSize.width + this._columnGap) * (id - fixed.count) + (fixed.val + this._columnGap * fixed.count);
                            const cs: number = this._customSize[id];
                            width = cs > 0 ? cs : this._itemSize.width;
                        } else {
                            left = this._leftGap + (this._itemSize.width + this._columnGap) * id;
                            width = this._itemSize.width;
                        }
                        if (this.lackCenter) {
                            left -= this._leftGap;
                            const offset: number = this._contentUt.width / 2 - this._allItemSizeNoEdge / 2;
                            left += offset;
                        }
                        right = left + width;
                        return {
                            id: id,
                            left: left,
                            right: right,
                            x: left + this._itemTmpUt.anchorX * width,
                            y: this._itemTmp.y,
                        };
                    }
                    case Layout.HorizontalDirection.RIGHT_TO_LEFT: {
                        if (this._customSize) {
                            const fixed: any = this._getFixedSize(id);
                            right = -this._rightGap - (this._itemSize.width + this._columnGap) * (id - fixed.count) - (fixed.val + this._columnGap * fixed.count);
                            const cs: number = this._customSize[id];
                            width = cs > 0 ? cs : this._itemSize.width;
                        } else {
                            right = -this._rightGap - (this._itemSize.width + this._columnGap) * id;
                            width = this._itemSize.width;
                        }
                        if (this.lackCenter) {
                            right += this._rightGap;
                            const offset: number = this._contentUt.width / 2 - this._allItemSizeNoEdge / 2;
                            right -= offset;
                        }
                        left = right - width;
                        return {
                            id: id,
                            right: right,
                            left: left,
                            x: left + this._itemTmpUt.anchorX * width,
                            y: this._itemTmp.y,
                        };
                    }
                }
                break;
            case Layout.Type.VERTICAL: {
                switch (this._verticalDir) {
                    case Layout.VerticalDirection.TOP_TO_BOTTOM: {
                        if (this._customSize) {
                            const fixed: any = this._getFixedSize(id);
                            top = -this._topGap - (this._itemSize.height + this._lineGap) * (id - fixed.count) - (fixed.val + this._lineGap * fixed.count);
                            const cs: number = this._customSize[id];
                            height = cs > 0 ? cs : this._itemSize.height;
                        } else {
                            top = -this._topGap - (this._itemSize.height + this._lineGap) * id;
                            height = this._itemSize.height;
                        }
                        if (this.lackCenter) {
                            top += this._topGap;
                            const offset: number = this._contentUt.height / 2 - this._allItemSizeNoEdge / 2;
                            top -= offset;
                        }
                        bottom = top - height;
                        return {
                            id: id,
                            top: top,
                            bottom: bottom,
                            x: this._itemTmp.x,
                            y: bottom + this._itemTmpUt.anchorY * height,
                        };
                    }
                    case Layout.VerticalDirection.BOTTOM_TO_TOP: {
                        if (this._customSize) {
                            const fixed: any = this._getFixedSize(id);
                            bottom = this._bottomGap + (this._itemSize.height + this._lineGap) * (id - fixed.count) + (fixed.val + this._lineGap * fixed.count);
                            const cs: number = this._customSize[id];
                            height = cs > 0 ? cs : this._itemSize.height;
                        } else {
                            bottom = this._bottomGap + (this._itemSize.height + this._lineGap) * id;
                            height = this._itemSize.height;
                        }
                        if (this.lackCenter) {
                            bottom -= this._bottomGap;
                            const offset: number = this._contentUt.height / 2 - this._allItemSizeNoEdge / 2;
                            bottom += offset;
                        }
                        top = bottom + height;
                        return {
                            id: id,
                            top: top,
                            bottom: bottom,
                            x: this._itemTmp.x,
                            y: bottom + this._itemTmpUt.anchorY * height,
                        };
                        break;
                    }
                }
            }
            case Layout.Type.GRID: {
                const colLine: number = Math.floor(id / this._colLineNum);
                switch (this._startAxis) {
                    case Layout.AxisDirection.HORIZONTAL: {
                        switch (this._verticalDir) {
                            case Layout.VerticalDirection.TOP_TO_BOTTOM: {
                                top = -this._topGap - (this._itemSize.height + this._lineGap) * colLine;
                                bottom = top - this._itemSize.height;
                                itemY = bottom + this._itemTmpUt.anchorY * this._itemSize.height;
                                break;
                            }
                            case Layout.VerticalDirection.BOTTOM_TO_TOP: {
                                bottom = this._bottomGap + (this._itemSize.height + this._lineGap) * colLine;
                                top = bottom + this._itemSize.height;
                                itemY = bottom + this._itemTmpUt.anchorY * this._itemSize.height;
                                break;
                            }
                        }
                        itemX = this._leftGap + (id % this._colLineNum) * (this._itemSize.width + this._columnGap);
                        switch (this._horizontalDir) {
                            case Layout.HorizontalDirection.LEFT_TO_RIGHT: {
                                itemX += this._itemTmpUt.anchorX * this._itemSize.width;
                                itemX -= this._contentUt.anchorX * this._contentUt.width;
                                break;
                            }
                            case Layout.HorizontalDirection.RIGHT_TO_LEFT: {
                                itemX += (1 - this._itemTmpUt.anchorX) * this._itemSize.width;
                                itemX -= (1 - this._contentUt.anchorX) * this._contentUt.width;
                                itemX *= -1;
                                break;
                            }
                        }
                        return {
                            id: id,
                            top: top,
                            bottom: bottom,
                            x: itemX,
                            y: itemY,
                        };
                    }
                    case Layout.AxisDirection.VERTICAL: {
                        switch (this._horizontalDir) {
                            case Layout.HorizontalDirection.LEFT_TO_RIGHT: {
                                left = this._leftGap + (this._itemSize.width + this._columnGap) * colLine;
                                right = left + this._itemSize.width;
                                itemX = left + this._itemTmpUt.anchorX * this._itemSize.width;
                                itemX -= this._contentUt.anchorX * this._contentUt.width;
                                break;
                            }
                            case Layout.HorizontalDirection.RIGHT_TO_LEFT: {
                                right = -this._rightGap - (this._itemSize.width + this._columnGap) * colLine;
                                left = right - this._itemSize.width;
                                itemX = left + this._itemTmpUt.anchorX * this._itemSize.width;
                                itemX += (1 - this._contentUt.anchorX) * this._contentUt.width;
                                break;
                            }
                        }
                        itemY = -this._topGap - (id % this._colLineNum) * (this._itemSize.height + this._lineGap);
                        switch (this._verticalDir) {
                            case Layout.VerticalDirection.TOP_TO_BOTTOM: {
                                itemY -= (1 - this._itemTmpUt.anchorY) * this._itemSize.height;
                                itemY += (1 - this._contentUt.anchorY) * this._contentUt.height;
                                break;
                            }
                            case Layout.VerticalDirection.BOTTOM_TO_TOP: {
                                itemY -= this._itemTmpUt.anchorY * this._itemSize.height;
                                itemY += this._contentUt.anchorY * this._contentUt.height;
                                itemY *= -1;
                                break;
                            }
                        }
                        return {
                            id: id,
                            left: left,
                            right: right,
                            x: itemX,
                            y: itemY,
                        };
                    }
                }
                break;
            }
        }
    }
    //计算已存在的Item的位置
    _calcExistItemPos(id: number) {
        const item: Node = this.getItemByListId(id);
        if (!item) return null;
        const ut: UITransform = item.getComponent(UITransform);
        const pos: Vec3 = item.getPosition();
        const data: any = {
            id: id,
            x: pos.x,
            y: pos.y,
        };
        if (this._sizeType) {
            data.top = pos.y + ut.height * (1 - ut.anchorY);
            data.bottom = pos.y - ut.height * ut.anchorY;
        } else {
            data.left = pos.x - ut.width * ut.anchorX;
            data.right = pos.x + ut.width * (1 - ut.anchorX);
        }
        return data;
    }
    //获取Item位置
    getItemPos(id: number) {
        if (this._virtual) return this._calcItemPos(id);
        else {
            if (this.frameByFrameRenderNum) return this._calcItemPos(id);
            else return this._calcExistItemPos(id);
        }
    }
    //获取固定尺寸
    _getFixedSize(listId: number) {
        if (!this._customSize) return null;
        if (listId == null) listId = this._numItems;
        let fixed: number = 0;
        let count: number = 0;
        for (const id in this._customSize) {
            if (parseInt(id) < listId) {
                fixed += this._customSize[id];
                count++;
            }
        }
        return {
            val: fixed,
            count: count,
        };
    }
    //滚动结束时..
    _onScrollBegan() {
        this._beganPos = this._sizeType ? this.viewTop : this.viewLeft;
    }
    //滚动结束时..
    _onScrollEnded() {
        this._curScrollIsTouch = false;
        if (this.scrollToListId != null && this.scrollToListId != undefined) {
            const item: any = this.getItemByListId(this.scrollToListId);
            this.scrollToListId = null;
            if (item) {
                tween(item).to(0.1, { scale: 1.06 }).to(0.1, { scale: 1 }).start();
            }
        }
        this._onScrolling();

        if (this._slideMode == SlideType.ADHERING && !this.adhering) {
            //cc.log(t.adhering, t._scrollView.isAutoScrolling(), t._scrollView.isScrolling());
            this.adhere();
        } else if (this._slideMode == SlideType.PAGE) {
            if (this._beganPos != null && this._curScrollIsTouch) {
                this._pageAdhere();
            } else {
                this.adhere();
            }
        }
        this.node.emit(ListViewEvent.SCROLL_END);
        this._scrollDirection = ScrollDirection.None;
    }
    // 触摸时
    _onTouchStart(ev : EventTouch, captureListeners) {
        if (this._scrollView['_hasNestedViewGroup'](ev, captureListeners)) return;
        this._curScrollIsTouch = true;
        
        const isMe = ev.eventPhase === Event.AT_TARGET && ev.target === this.node;
        if (!isMe) {
            let itemNode: any = ev.target;
            while (itemNode._listId == null && itemNode.parent) itemNode = itemNode.parent;
            this._scrollItem = itemNode._listId != null ? itemNode : ev.target;
        }
    }

    _onTouchMove(event : EventTouch, captureListeners) {
        let touch = event.touch;
        const deltaMove = touch.getUILocation(SCROLLING_TOUCH_NOW_V2);
        deltaMove.subtract(touch.getUIStartLocation(SCROLLING_TOUCH_START_V2));
        const oldDirection = this._scrollDirection;
        if(this._sizeType){
            if(Math.abs(deltaMove.y) < SCROLL_DIRECTION_CHECK_DISTANCE){
                return;
            }
            if(deltaMove.y > 0){
                this._scrollDirection = ScrollDirection.Up; 
            }else{
                this._scrollDirection = ScrollDirection.Down;
            }
        }else{
            if(Math.abs(deltaMove.x) < SCROLL_DIRECTION_CHECK_DISTANCE){
                return;
            }
            if(deltaMove.x > 0){
                this._scrollDirection = ScrollDirection.Right;
            }else{
                this._scrollDirection = ScrollDirection.Left;
            }
        }
        if(this._scrollDirection != oldDirection) {
            this.node.emit(ListViewEvent.SCROLL_DIRECTION_CHANGED, this._scrollDirection);
        }
    }

    //触摸抬起时..
    _onTouchUp() {
        this._scrollPos = null;
        
        if (this._slideMode == SlideType.ADHERING) {
            if (this.adhering) this._adheringBarrier = true;
            this.adhere();
        } else if (this._slideMode == SlideType.PAGE) {
            if (this._beganPos != null) {
                this._pageAdhere();
            } else {
                this.adhere();
            }
        }
        this._scrollItem = null;
        if(!this.scrollView.isAutoScrolling()) {
            this.node.emit(ListViewEvent.SCROLL_END);
        }
    }

    _onTouchCancelled(ev, captureListeners) {
        const t = this;
        if (t._scrollView['_hasNestedViewGroup'](ev, captureListeners) || ev.simulate) return;

        t._scrollPos = null;
        if (t._slideMode == SlideType.ADHERING) {
            if (t.adhering) t._adheringBarrier = true;
            t.adhere();
        } else if (t._slideMode == SlideType.PAGE) {
            if (t._beganPos != null) {
                t._pageAdhere();
            } else {
                t.adhere();
            }
        }
        this._scrollItem = null;
    }
    //当尺寸改变
    _onSizeChanged() {
        if (this.checkInited(false)) this._onScrolling();
    }
    //当Item自适应
    _onItemAdaptive(item: any) {
        const ut: UITransform = item.getComponent(UITransform);
        // if (this.checkInited(false)) {
        if ((!this._sizeType && ut.width != this._itemSize.width) || (this._sizeType && ut.height != this._itemSize.height)) {
            if (!this._customSize) this._customSize = {};
            const val = this._sizeType ? ut.height : ut.width;
            if (this._customSize[item._listId] != val) {
                this._customSize[item._listId] = val;
                this._resizeContent();
                // this.content.children.forEach((child: Node) => {
                //     this._updateItemPos(child);
                // });
                this.updateAll();
                // 如果当前正在运行 scrollTo，肯定会不准确，在这里做修正
                if (this._scrollToListId != null) {
                    this._scrollPos = null;
                    this.unschedule(this._scrollToSo);
                    this.scrollTo(this._scrollToListId, Math.max(0, this._scrollToEndTime - new Date().getTime() / 1000));
                }
            }
        }
        // }
    }
    //PAGE粘附
    _pageAdhere() {
        const t = this;
        if (!t.cyclic && (t.elasticTop > 0 || t.elasticRight > 0 || t.elasticBottom > 0 || t.elasticLeft > 0)) return;
        const curPos = t._sizeType ? t.viewTop : t.viewLeft;
        const dis = (t._sizeType ? t._thisNodeUt.height : t._thisNodeUt.width) * t.pageDistance;
        const canSkip = Math.abs(t._beganPos - curPos) > dis;
        if (canSkip) {
            const timeInSecond = 0.5;
            switch (t._alignCalcType) {
                case 1: //单行HORIZONTAL（LEFT_TO_RIGHT）、网格VERTICAL（LEFT_TO_RIGHT）
                case 4: //单列VERTICAL（BOTTOM_TO_TOP）、网格HORIZONTAL（BOTTOM_TO_TOP）
                    if (t._beganPos > curPos) {
                        t.prePage(timeInSecond);
                        // cc.log('_pageAdhere   PPPPPPPPPPPPPPP');
                    } else {
                        t.nextPage(timeInSecond);
                        // cc.log('_pageAdhere   NNNNNNNNNNNNNNN');
                    }
                    break;
                case 2: //单行HORIZONTAL（RIGHT_TO_LEFT）、网格VERTICAL（RIGHT_TO_LEFT）
                case 3: //单列VERTICAL（TOP_TO_BOTTOM）、网格HORIZONTAL（TOP_TO_BOTTOM）
                    if (t._beganPos < curPos) {
                        t.prePage(timeInSecond);
                    } else {
                        t.nextPage(timeInSecond);
                    }
                    break;
            }
        } else if (t.elasticTop <= 0 && t.elasticRight <= 0 && t.elasticBottom <= 0 && t.elasticLeft <= 0) {
            t.adhere();
        }
        t._beganPos = null;
    }
    //粘附
    adhere() {
        if (!this.checkInited()) return;
        if (this.elasticTop > 0 || this.elasticRight > 0 || this.elasticBottom > 0 || this.elasticLeft > 0) return;
        this.adhering = true;
        this._calcNearestItem();
        const offset: number = (this._sizeType ? this._topGap : this._leftGap) / (this._sizeType ? this._thisNodeUt.height : this._thisNodeUt.width);
        const timeInSecond: number = 0.7;
        this.scrollTo(this.nearestListId, timeInSecond, offset);
    }
    //Update..
    update() {
        if (this.frameByFrameRenderNum <= 0 || this._updateDone) return;
        // cc.log(this.displayData.length, this._updateCounter, this.displayData[this._updateCounter]);
        if (this._virtual) {
            const len: number = this._updateCounter + this.frameByFrameRenderNum > this.displayItemNum ? this.displayItemNum : this._updateCounter + this.frameByFrameRenderNum;
            for (let n: number = this._updateCounter; n < len; n++) {
                const data: any = this.displayData[n];
                if (data) {
                    this._createOrUpdateItem(data);
                }
            }

            if (this._updateCounter >= this.displayItemNum - 1) {
                //最后一个
                if (this._doneAfterUpdate) {
                    this._updateCounter = 0;
                    this._updateDone = false;
                    // if (!this._scrollView.isScrolling())
                    this._doneAfterUpdate = false;
                } else {
                    this._updateDone = true;
                    this._delRedundantItem();
                    this._forceUpdate = false;
                    this._calcNearestItem();
                    if (this.slideMode == SlideType.PAGE) this.curPageNum = this.nearestListId;
                }
            } else {
                this._updateCounter += this.frameByFrameRenderNum;
            }
        } else {
            if (this._updateCounter < this._numItems) {
                const len: number = this._updateCounter + this.frameByFrameRenderNum > this._numItems ? this._numItems : this._updateCounter + this.frameByFrameRenderNum;
                for (let n: number = this._updateCounter; n < len; n++) {
                    this._createOrUpdateItem2(n);
                }
                this._updateCounter += this.frameByFrameRenderNum;
            } else {
                this._updateDone = true;
                this._calcNearestItem();
                if (this.slideMode == SlideType.PAGE) this.curPageNum = this.nearestListId;
            }
        }
    }
    /**
     * 选中某个item的回调函数
     * @param itemId
     */
    _onSelectedItemCallback(itemId: number) {
        this.selectedId = itemId;
    }



    /**
     * 获取全新的Item
     */
    private _getNewItemNode(){
        let node : Node | null    = null;
        if (this.templateType == TemplateType.PREFAB) {
            node =  instantiate(this.tmpPrefab);
        }else{
            node =  instantiate(this.tmpNode);
        }
        let com = node.getComponent(ListItem);
        if (!com) {
            com = node.addComponent(ListItem);
        }

        return node;    
    }

    /**
     * 创建或更新Item（虚拟列表用）
     * @param {Object} data 数据
     */
    _createOrUpdateItem(data: any) {
        //cjb:此处使用any是不正确的做法，不要这么干
        let item = this.getItemByListId(data.id);
        if (!item) {
            //如果不存在
            let canGet: boolean = this._pool.size() > 0;
            if (canGet) {
                item = this._pool.get();
                item.active = true;
                //bDebug && console.log('从池中取出::   旧id =', item['_listId'], '，新id =', data.id, item);
            } else {
                item = this._getNewItemNode();//instantiate(this._itemTmp);
                //bDebug && console.log('1新建::', data.id, item);
            }
            
            if (item['_listId'] != data.id) {
                item['_listId'] = data.id;
                const ut: UITransform = item.getComponent(UITransform);
                ut.setContentSize(this._itemSize);
            }
            item.name = 'item_' + data.id;
            item.setPosition(new Vec3(data.x, data.y, 0));
            this._resetItemSize(item);
            this.content.addChild(item);
            if (canGet && this._needUpdateWidget) {
                const widget: Widget = item.getComponent(Widget);
                if (widget) widget.updateAlignment();
            }
            item.setSiblingIndex(this.content.children.length - 1);

            let listItem: ListItem = item.getComponent(ListItem);
            if (!listItem) {
                listItem = item.addComponent(ListItem);
            }
            listItem.listId = data.id;

            const onSelectedCallback = this.selectedMode > SelectedType.NONE ? this._onSelectedItemCallback.bind(this) : null;

            listItem._registerEvent(onSelectedCallback, this._onItemAdaptive.bind(this));
            item['listItem'] = listItem;
            this.itemRender && this.itemRender(item, Math.abs(data.id % this._actualNumItems));
        } else if (this._forceUpdate && this.itemRender) {
            //强制更新
            item.setPosition(new Vec3(data.x, data.y, 0));
            this._resetItemSize(item);

            this.itemRender && this.itemRender(item, Math.abs(data.id % this._actualNumItems));
        }
        this._resetItemSize(item);

        this._updateListItem(item['listItem']);
        if (this._lastDisplayData.indexOf(data.id) < 0) {
            this._lastDisplayData.push(data.id);
        }
    }
    //创建或更新Item（非虚拟列表用）
    _createOrUpdateItem2(listId: number) {
        let item: any = this.content.children[listId];
        let listItem: ListItem;
        if (!item) {
            //如果不存在
            item = this._getNewItemNode();//instantiate(this._itemTmp);
            // bDebug && console.log('2新建::', listId, item);
            item._listId = listId;
            item.name = 'item_' + listId;
            this.content.addChild(item);
            listItem = item.getComponent(ListItem);
            item['listItem'] = listItem;
            if (listItem) {
                listItem.listId = listId;
                //listItem.list = this;
                const onSelectedCallback = this.selectedMode > SelectedType.NONE ? this._onSelectedItemCallback.bind(this) : null;
                listItem._registerEvent(onSelectedCallback, this._onItemAdaptive.bind(this));
            }
            
            this.itemRender && this.itemRender(item, Math.abs(listId % this._actualNumItems));
        } else if (this._forceUpdate && this.itemRender) {
            //强制更新
            item._listId = listId;
            item.name = 'item_' + listId;
            if (listItem) listItem.listId = listId;
            this.itemRender && this.itemRender(item, Math.abs(listId % this._actualNumItems));
        }
        this._updateListItem(listItem);
        if (this._lastDisplayData.indexOf(listId) < 0) {
            this._lastDisplayData.push(listId);
        }
    }

    _updateListItem(listItem: ListItem) {
        if (!listItem) return;
        if (this.selectedMode > SelectedType.NONE) {
            const item: any = listItem.node;
            switch (this.selectedMode) {
                case SelectedType.SINGLE:
                    listItem.selected = this.selectedId == item._listId;
                    break;
                case SelectedType.MULT:
                    listItem.selected = this.multSelected.indexOf(item._listId) >= 0;
                    break;
            }
        }
    }
    //仅虚拟列表用
    _resetItemSize(item: any) {
        return;
        let size: number;
        const ut: UITransform = item.getComponent(UITransform);
        if (this._customSize && this._customSize[item._listId]) {
            size = this._customSize[item._listId];
        } else {
            if (this._colLineNum > 1) ut.setContentSize(this._itemSize);
            else size = this._sizeType ? this._itemSize.height : this._itemSize.width;
        }
        if (size) {
            if (this._sizeType) ut.height = size;
            else ut.width = size;
        }
    }
    /**
     * 更新Item位置
     * @param {Number||Node} listIdOrItem
     */
    _updateItemPos(listIdOrItem: any) {
        const item: any = isNaN(listIdOrItem) ? listIdOrItem : this.getItemByListId(listIdOrItem);
        const pos: any = this.getItemPos(item._listId);
        item.setPosition(pos.x, pos.y);
    }
    /**
     * 设置多选
     * @param {Array} args 可以是单个listId，也可是个listId数组
     * @param {Boolean} bool 值，如果为null的话，则直接用args覆盖
     */
    setMultSelected(args: any, bool: boolean) {
        const t: any = this;
        if (!t.checkInited()) return;
        if (!Array.isArray(args)) {
            args = [args];
        }
        if (bool == null) {
            t.multSelected = args;
        } else {
            let listId: number, sub: number;
            if (bool) {
                for (let n: number = args.length - 1; n >= 0; n--) {
                    listId = args[n];
                    sub = t.multSelected.indexOf(listId);
                    if (sub < 0) {
                        t.multSelected.push(listId);
                    }
                }
            } else {
                for (let n: number = args.length - 1; n >= 0; n--) {
                    listId = args[n];
                    sub = t.multSelected.indexOf(listId);
                    if (sub >= 0) {
                        t.multSelected.splice(sub, 1);
                    }
                }
            }
        }
        t._forceUpdate = true;
        t._onScrolling();
    }
    /**
     * 获取多选数据
     * @returns
     */
    getMultSelected() {
        return this.multSelected;
    }
    /**
     * 多选是否有选择
     * @param {number} listId 索引
     * @returns
     */
    hasMultSelected(listId: number) {
        return this.multSelected && this.multSelected.indexOf(listId) >= 0;
    }
    /**
     * 更新指定的Item
     * @param {Array} args 单个listId，或者数组
     * @returns
     */
    updateItem(args: any) {
        if (!this.checkInited()) return;
        if (!Array.isArray(args)) {
            args = [args];
        }
        for (let n: number = 0, len: number = args.length; n < len; n++) {
            const listId: number = args[n];
            const item: any = this.getItemByListId(listId);
            if (item)
                //EventHandler.emitEvents([this.renderEvent], item, listId % this._actualNumItems);
                this.itemRender && this.itemRender(item, Math.abs(listId % this._actualNumItems));
        }
    }
    /**
     * 更新全部
     */
    updateAll() {
        if (!this.checkInited()) return;
        this.numItems = this.numItems;
    }
    /**
     * 根据ListID获取Item
     * @param {Number} listId
     * @returns
     */
    getItemByListId(listId: number) {
        if (this.content) {
            for (let n: number = this.content.children.length - 1; n >= 0; n--) {
                const item = this.content.children[n];
                if (item['_listId'] == listId) return item;
            }
        }
    }
    /**
     * 获取在显示区域外的Item
     * @returns
     */
    _getOutsideItem() {
        let item: any;
        const result: any[] = [];
        for (let n: number = this.content.children.length - 1; n >= 0; n--) {
            item = this.content.children[n];
            if (!this.displayData.find((d) => d.id == item._listId)) {
                result.push(item);
            }
        }
        return result;
    }

    /**
     * 获取正在现实中Items
     * @returns
     */
    public getShowingItems(): Node[] {
        const results: Node[] = [];
        for (let n: number = this.content.children.length - 1; n >= 0; n--) {
            const item = this.content.children[n];
            if (this.displayData.find((d) => d.id == item['_listId'])) {
                results.push(item);
            }
        }

        return results;
    }

    public getShowingItemIds(): number[] {
        const results: number[] = [];
        for (let n: number = this.content.children.length - 1; n >= 0; n--) {
            const item = this.content.children[n];
            if (this.displayData.find((d) => d.id == item['_listId'])) {
                results.push(item['_listId']);
            }
        }

        return results;
    }

    //删除显示区域以外的Item
    _delRedundantItem() {
        if (this._virtual) {
            const arr: any[] = this._getOutsideItem();
            for (let n: number = arr.length - 1; n >= 0; n--) {
                const item: any = arr[n];
                if (this._scrollItem && item._listId == this._scrollItem._listId) continue;
                item.isCached = true;
                this._pool.put(item);
                item.active = false;
                for (let m: number = this._lastDisplayData.length - 1; m >= 0; m--) {
                    if (this._lastDisplayData[m] == item._listId) {
                        this._lastDisplayData.splice(m, 1);
                        break;
                    }
                }
            }
            // cc.log('存入::', str, '    pool.length =', this._pool.length);
        } else {
            while (this.content.children.length > this._numItems) {
                this._delSingleItem(this.content.children[this.content.children.length - 1]);
            }
        }
    }
    //删除单个Item
    _delSingleItem(item: any) {
        // cc.log('DEL::', item['_listId'], item);
        item.removeFromParent();
        if (item.destroy) item.destroy();
        item = null;
    }
    /**
     * 动效删除Item（此方法只适用于虚拟列表，即_virtual=true）
     * 一定要在回调函数里重新设置新的numItems进行刷新，毕竟本List是靠数据驱动的。
     */
    aniDelItem(listId: number, callFunc: Function, aniType: number) {
        const t = this;

        if (!t.checkInited() || t.cyclic || !t._virtual) return console.error('This function is not allowed to be called!');

        if (!callFunc) return console.error('CallFunc are not allowed to be NULL, You need to delete the corresponding index in the data array in the CallFunc!');

        if (t._aniDelRuning) return console.warn('Please wait for the current deletion to finish!');

        let item = t.getItemByListId(listId);
        let listItem: ListItem;
        if (!item) {
            callFunc(listId);
            return;
        } else {
            listItem = item.getComponent(ListItem);
        }
        t._aniDelRuning = true;
        t._aniDelCB = callFunc;
        t._aniDelItem = item;
        t._aniDelBeforePos = item.position;
        t._aniDelBeforeScale = item.scale;
        const curLastId: number = t.displayData[t.displayData.length - 1].id;
        const resetSelectedId: boolean = listItem.selected;
        listItem.showAni(
            aniType,
            () => {
                //判断有没有下一个，如果有的话，创建粗来
                let newId: number;
                if (curLastId < t._numItems - 2) {
                    newId = curLastId + 1;
                }
                if (newId != null) {
                    const newData: any = t._calcItemPos(newId);
                    t.displayData.push(newData);
                    if (t._virtual) t._createOrUpdateItem(newData);
                    else t._createOrUpdateItem2(newId);
                } else t._numItems--;
                if (t.selectedMode == SelectedType.SINGLE) {
                    if (resetSelectedId) {
                        t._selectedId = -1;
                    } else if (t._selectedId - 1 >= 0) {
                        t._selectedId--;
                    }
                } else if (t.selectedMode == SelectedType.MULT && t.multSelected.length) {
                    const sub: number = t.multSelected.indexOf(listId);
                    if (sub >= 0) {
                        t.multSelected.splice(sub, 1);
                    }
                    //多选的数据，在其后的全部减一
                    for (let n: number = t.multSelected.length - 1; n >= 0; n--) {
                        const id: number = t.multSelected[n];
                        if (id >= listId) t.multSelected[n]--;
                    }
                }
                if (t._customSize) {
                    if (t._customSize[listId]) delete t._customSize[listId];
                    const newCustomSize: any = {};
                    let size: number;
                    for (const id in t._customSize) {
                        size = t._customSize[id];
                        const idNumber: number = parseInt(id);
                        newCustomSize[idNumber - (idNumber >= listId ? 1 : 0)] = size;
                    }
                    t._customSize = newCustomSize;
                }
                //后面的Item向前怼的动效
                const sec: number = 0.2333;
                let twe: Tween<Node>, haveCB: boolean;
                for (let n: number = newId != null ? newId : curLastId; n >= listId + 1; n--) {
                    item = t.getItemByListId(n);
                    if (item) {
                        const posData: any = t._calcItemPos(n - 1);
                        twe = tween(item).to(sec, { position: new Vec3(posData.x, posData.y, 0) });

                        if (n <= listId + 1) {
                            haveCB = true;
                            twe.call(() => {
                                t._aniDelRuning = false;
                                callFunc(listId);
                                delete t._aniDelCB;
                            });
                        }
                        twe.start();
                    }
                }
                if (!haveCB) {
                    t._aniDelRuning = false;
                    callFunc(listId);
                    t._aniDelCB = null;
                }
            },
            true,
        );
    }
    /**
     * 滚动到..
     * @param {Number} listId 索引（如果<0，则滚到首个Item位置，如果>=_numItems，则滚到最末Item位置）
     * @param {Number} timeInSecond 时间
     * @param {Number} offset 索引目标位置偏移，0-1
     * @param {Boolean} overStress 滚动后是否强调该Item（这只是个实验功能）
     * @param {Boolean} attenuated 滚动是否衰减，默认为true
     */
    scrollTo(listId: number, timeInSecond: number = 0.5, offset: number = null, overStress: boolean = false, attenuated?: boolean) {
        if (!this.checkInited(false)) return;
        // this._scrollView.stopAutoScroll();
        if (timeInSecond == null)
            //默认0.5
            timeInSecond = 0.5;
        else if (timeInSecond < 0) timeInSecond = 0;
        if (listId < 0) listId = 0;
        else if (listId >= this._numItems) listId = this._numItems - 1;
        // 以防设置了numItems之后layout的尺寸还未更新
        if (!this._virtual && this._layout && this._layout.enabled) this._layout.updateLayout();

        let pos = this.getItemPos(listId);
        if (!pos) {
            return DEV && console.error('pos is null', listId);
        }

        const itemPos = pos;
        let targetX: number, targetY: number;

        switch (this._alignCalcType) {
            case 1: //单行HORIZONTAL（LEFT_TO_RIGHT）、网格VERTICAL（LEFT_TO_RIGHT）
                targetX = pos.left;
                if (offset != null) targetX -= this._thisNodeUt.width * offset;
                else targetX -= this._leftGap;
                pos = new Vec3(targetX, 0, 0);
                break;
            case 2: //单行HORIZONTAL（RIGHT_TO_LEFT）、网格VERTICAL（RIGHT_TO_LEFT）
                targetX = pos.right - this._thisNodeUt.width;
                if (offset != null) targetX += this._thisNodeUt.width * offset;
                else targetX += this._rightGap;
                pos = new Vec3(targetX + this._contentUt.width, 0, 0);
                break;
            case 3: //单列VERTICAL（TOP_TO_BOTTOM）、网格HORIZONTAL（TOP_TO_BOTTOM）
                targetY = pos.top;
                if (offset != null) targetY += this._thisNodeUt.height * offset;
                else targetY += this._topGap;
                pos = new Vec3(0, -targetY, 0);
                break;
            case 4: //单列VERTICAL（BOTTOM_TO_TOP）、网格HORIZONTAL（BOTTOM_TO_TOP）
                targetY = pos.bottom + this._thisNodeUt.height;
                if (offset != null) targetY -= this._thisNodeUt.height * offset;
                else targetY -= this._bottomGap;
                pos = new Vec3(0, -targetY + this._contentUt.height, 0);
                break;
        }
        let viewPos: any = this.content.getPosition();
        viewPos = Math.abs(this._sizeType ? viewPos.y : viewPos.x);

        //let comparePos = this._sizeType ? pos.y : pos.x;

        // 原先的 comparePos 在 Page 滚动模式下（仅在Page模式下会有问题、其它模式不会）
        // 从右往左(RIGHT_TO_LEFT)、从下往上(BOTTOM_TO_TOP)布局下计算有问题
        // 导致runScroll永远为true，进而会不断执行 _onScrolling 方法
        // 这里提供一个临时解决数值问题方法，针对两种布局特定判断，还可以优化
        let comparePos: number;
        if (this._alignCalcType === 2) {
            comparePos = -itemPos.right - this._rightGap;
        } else if (this._alignCalcType === 4) {
            comparePos = itemPos.bottom - this._bottomGap;
        } else {
            comparePos = this._sizeType ? pos.y : pos.x;
        }

        const runScroll = Math.abs((this._scrollPos != null ? this._scrollPos : viewPos) - comparePos) > 0.5;
        // cc.log(runScroll, this._scrollPos, viewPos, comparePos)

        // this._scrollView.stopAutoScroll();
        if (runScroll) {
            this._scrollView.scrollToOffset(pos, timeInSecond, attenuated);
            this._scrollToListId = listId;
            this._scrollToEndTime = new Date().getTime() / 1000 + timeInSecond;
            // cc.log(listId, this.content.width, this.content.getPosition(), pos);
            this._scrollToSo = this.scheduleOnce(() => {
                if (!this._adheringBarrier) {
                    this.adhering = this._adheringBarrier = false;
                }
                this._scrollPos = this._scrollToListId = this._scrollToEndTime = this._scrollToSo = null;
                //cc.log('2222222222', this._adheringBarrier)
                if (overStress) {
                    const item = this.getItemByListId(listId);
                    if (item) {
                        tween(item).to(0.1, { scale: SCALE_OVER_STRESS }).to(0.1, { scale: SCALE_NORMAL }).start();
                    }
                }
            }, timeInSecond + 0.1);

            if (timeInSecond <= 0) {
                this._onScrolling();
            }
        }
    }

    //停止自动滚动
    //但是不推荐这么骚操作
    stopScrollTo(){
        this._scrollView.stopAutoScroll();
        this._scrollToSo = null;
        this._scrollToListId = null;
        this._scrollToEndTime = null;
    }

    /**
     * 计算当前滚动窗最近的Item
     */
    _calcNearestItem() {
        const t: any = this;
        t.nearestListId = null;
        let data: any, center: number;

        if (t._virtual) t._calcViewPos();

        let vTop: number, vRight: number, vBottom: number, vLeft: number;
        vTop = t.viewTop;
        vRight = t.viewRight;
        vBottom = t.viewBottom;
        vLeft = t.viewLeft;

        let breakFor: boolean = false;
        for (let n = 0; n < t.content.children.length && !breakFor; n += t._colLineNum) {
            data = t._virtual ? t.displayData[n] : t._calcExistItemPos(n);
            if (data) {
                center = t._sizeType ? (data.top + data.bottom) / 2 : (center = (data.left + data.right) / 2);
                switch (t._alignCalcType) {
                    case 1: //单行HORIZONTAL（LEFT_TO_RIGHT）、网格VERTICAL（LEFT_TO_RIGHT）
                        if (data.right >= vLeft) {
                            t.nearestListId = data.id;
                            if (vLeft > center) t.nearestListId += t._colLineNum;
                            breakFor = true;
                        }
                        break;
                    case 2: //单行HORIZONTAL（RIGHT_TO_LEFT）、网格VERTICAL（RIGHT_TO_LEFT）
                        if (data.left <= vRight) {
                            t.nearestListId = data.id;
                            if (vRight < center) t.nearestListId += t._colLineNum;
                            breakFor = true;
                        }
                        break;
                    case 3: //单列VERTICAL（TOP_TO_BOTTOM）、网格HORIZONTAL（TOP_TO_BOTTOM）
                        if (data.bottom <= vTop) {
                            t.nearestListId = data.id;
                            if (vTop < center) t.nearestListId += t._colLineNum;
                            breakFor = true;
                        }
                        break;
                    case 4: //单列VERTICAL（BOTTOM_TO_TOP）、网格HORIZONTAL（BOTTOM_TO_TOP）
                        if (data.top >= vBottom) {
                            t.nearestListId = data.id;
                            if (vBottom > center) t.nearestListId += t._colLineNum;
                            breakFor = true;
                        }
                        break;
                }
            }
        }
        //判断最后一个Item。。。（哎，这些判断真心恶心，判断了前面的还要判断最后一个。。。一开始呢，就只有一个布局（单列布局），那时候代码才三百行，后来就想着完善啊，艹..这坑真深，现在这行数都一千五了= =||）
        data = t._virtual ? t.displayData[t.displayItemNum - 1] : t._calcExistItemPos(t._numItems - 1);
        if (data && data.id == t._numItems - 1) {
            center = t._sizeType ? (data.top + data.bottom) / 2 : (center = (data.left + data.right) / 2);
            switch (t._alignCalcType) {
                case 1: //单行HORIZONTAL（LEFT_TO_RIGHT）、网格VERTICAL（LEFT_TO_RIGHT）
                    if (vRight > center) t.nearestListId = data.id;
                    break;
                case 2: //单行HORIZONTAL（RIGHT_TO_LEFT）、网格VERTICAL（RIGHT_TO_LEFT）
                    if (vLeft < center) t.nearestListId = data.id;
                    break;
                case 3: //单列VERTICAL（TOP_TO_BOTTOM）、网格HORIZONTAL（TOP_TO_BOTTOM）
                    if (vBottom < center) t.nearestListId = data.id;
                    break;
                case 4: //单列VERTICAL（BOTTOM_TO_TOP）、网格HORIZONTAL（BOTTOM_TO_TOP）
                    if (vTop > center) t.nearestListId = data.id;
                    break;
            }
        }
        // cc.log('t.nearestListId =', t.nearestListId);
    }
    //上一页
    prePage(timeInSecond: number = 0.5) {
        // cc.log('👈');
        if (!this.checkInited()) return;
        this.skipPage(this.curPageNum - 1, timeInSecond);
    }
    //下一页
    nextPage(timeInSecond: number = 0.5) {
        // cc.log('👉');
        if (!this.checkInited()) return;
        this.skipPage(this.curPageNum + 1, timeInSecond);
    }
    //跳转到第几页
    skipPage(pageNum: number, timeInSecond: number) {
        const t: any = this;
        if (!t.checkInited()) return;
        if (t._slideMode != SlideType.PAGE) return console.error('This function is not allowed to be called, Must SlideMode = PAGE!');
        if (pageNum < 0 || pageNum >= t._numItems) return;
        if (t.curPageNum == pageNum) return;
        // cc.log(pageNum);
        t.curPageNum = pageNum;
        if (t.pageChangeEvent) {
            EventHandler.emitEvents([t.pageChangeEvent], pageNum);
        }
        t.scrollTo(pageNum, timeInSecond);
    }
    //计算 CustomSize（这个函数还是保留吧，某些罕见的情况的确还是需要手动计算customSize的）
    // calcCustomSize(numItems: number) {
    //     const t = this;
    //     if (!t.checkInited()) return;
    //     if (!t._itemTmp) return console.error('Unset template item!');
    //     if (!t.itemRender) return console.error('Unset Render-Event!');
    //     t._customSize = {};
    //     const temp: any = instantiate(t._itemTmp);
    //     const ut: UITransform = temp.getComponent(UITransform);
    //     t.content.addChild(temp);
    //     for (let n: number = 0; n < numItems; n++) {
    //         EventHandler.emitEvents([t.itemRender], temp, n);
    //         if (ut.height != t._itemSize.height || ut.width != t._itemSize.width) {
    //             t._customSize[n] = t._sizeType ? ut.height : ut.width;
    //         }
    //     }
    //     if (!Object.keys(t._customSize).length) t._customSize = null;
    //     temp.removeFromParent();
    //     if (temp.destroy) temp.destroy();
    //     return t._customSize;
    // }


    public static readonly VIEW_NAME = 'List';
}
