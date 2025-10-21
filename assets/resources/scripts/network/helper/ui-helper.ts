import { Tween, UIOpacity, tween, v3 } from 'cc';
import ViewManager from '../../core/manager/view-manager';
import I18NManager from '../../core/manager/i18n-manager';
import { bDebug } from '../../core/define';
import { UIConfirmContext } from '../../core/view/view-define';
import PoolManager from '../../core/manager/pool-manager';
import BrowserUtils from '../../core/utils/browser-utils';
import PanelCircleLoading from '../../view/common/PanelCircleLoading';
import CustomToast from '../../view/common/CustomToast';
import PanelMessageBox from '../../view/common/PanelMessageBox';




const SCALE_NTO = v3(1.15, 1.15, 1.15);
const SCALE_NORMAL = v3(1, 1, 1);

/**
 * Tip的预制体加载状态
 */
enum TipPrefabLoadStatus {
    None,
    Loading,
    Loaded,
}

export default class UIHelper {
    /**
     * 当前正在显示的圆形加载界面
     */
    private static _circleLoading: PanelCircleLoading | null = null;
    private static _bCancelCircleLoading: boolean = false;
    /**
     * 当前的tip节点
     * 复用，不在销毁
     */
    private static _tipNode: CustomToast | null = null;
    private static _tipResLoadStatus: TipPrefabLoadStatus = TipPrefabLoadStatus.None;
    private static _tipIsWait: boolean = false; //是否有Toast在显示，是否等待
    /**
     * Toast任务队列
     */
    private static _tipInfoList: string[] = [];
    /**
     * PanelMessageBox队列
     */
    private static _confirmContexts: UIConfirmContext[] = [];
    /**
     * 当前正在显示的PanelMessageBox
     */
    private static _confirmPanel: PanelMessageBox | null = null;
    /**
     * 是否正在显示确认框
     */
    private static _bShowingConfirm: boolean = false;
    //===================================confirm===================================//
    /**
     * 打开一个确认-取消 的弹出框
     * @param context
     */
    public static showConfirm(context: UIConfirmContext) {
        this._confirmContexts.push(context);
        if (this._confirmPanel || this._bShowingConfirm) {
            return;
        }
        this._showFirstConfirm();
    }

    /**
     * 直接显示只有一个按钮的确认框
     * 玩家点击后，直接刷新浏览器
     * @param value         需要显示的内容
     * @param title         需要显示的标题，可选
     * @param buttonTitle   确定按钮的标题，可选
     * 
     */
    public static showConfirmOfOneButtonToRefreshBrowser(value: string, title?: string, buttonTitle?: string) {
        this.showConfirm({
            value: value,
            title: title,
            yesHandler: () => {
                //刷新浏览器
                BrowserUtils.refreshURL();
            },
            bSingleButton: true,
            bNotShowCloseButton: true,
            sButtonTitles: buttonTitle ? [buttonTitle] : null,
        });
    }

    /**
     * 只有一个关闭按钮的确认框，点击关闭以后啥也不干
     * @param value 
     * @param title 
     * @param buttonTitle 
     */
    public static showConfirmOfOneButtonToClose(value: string, title?: string, buttonTitle?: string) {
        this.showConfirm({
            value: value,
            title: title,
            yesHandler: () => {

            },
            bSingleButton: true,
            bNotShowCloseButton: true,
            sButtonTitles: buttonTitle ? [buttonTitle] : null,
        });
    }
    /**
     * 显示一个按钮，点击后返回主页
     * @param value 
     * @param title 
     * @param buttonTitle 
     */
    public static showConfirmOneButtonToBack(value: string, title?: string, buttonTitle?: string) {
        this.showConfirm({
            value: value,
            title: title,
            yesHandler: () => {
                BrowserUtils.back();
            },
            bSingleButton: true,
            bNotShowCloseButton: true,
            sButtonTitles: buttonTitle ? [buttonTitle] : null,
        });
    }

    /**
     * 显示第一个确认框
     */
    private static _showFirstConfirm() {
        const context = this._confirmContexts.shift();
        this._bShowingConfirm = true;
        this._confirmPanel = ViewManager.Open(PanelMessageBox, context, 'common') as PanelMessageBox;
        this._confirmPanel.onClose = () => {
            this._bShowingConfirm = false;
            this._confirmPanel = null;
            if (this._confirmContexts.length > 0) {
                this._showFirstConfirm();
            }
        };
    }


    //===================================circleLoading===================================//
    /**
     * 显示一个圆形加载动画
     * @param info
     */
    public static showCircleLoading(info?: string) {
        this._bCancelCircleLoading = false;
        bDebug && console.warn('showCircleLoading!');
        if (this._circleLoading) {
            if (info) {
                this._circleLoading.updateInfo(info);
            }
            return;
        }

        UIHelper._circleLoading = ViewManager.Open(PanelCircleLoading, {
            info: info
        }, 'common') as PanelCircleLoading;
    }

    /**
     * 关闭正在显示的圆形加载
     * @returns
     */
    public static hideCircleLoading() {
        bDebug && console.warn('closeCircleLoading!');
        this._bCancelCircleLoading = true;
        if (!this._circleLoading) {
            return;
        }
        this._circleLoading.close();
        this._circleLoading = null;
    }


    //===================================toast===================================//
    /**
     * 直接提示一个多语言id的内容
     * @param id
     * @returns
     */
    public static async showToastId(id: string) {
        const str = I18NManager.getText(id);
        if (!str || str == '') {
            return;
        }
        return this.showToast(str);
    }
    /**
     * 显示钱不够
     */
    public static showMoneyNotEnough() {
        this.showToastId(
            resourcesDb.I18N_RESOURCES_DB_INDEX.EC_COIN_NO_ENOUGH
        );2
    }

    /**
     * 直接显示当前缓存中的第一个信息
     * @private
     */
    private static _showFirstCachedTip() {
        if (this._tipInfoList.length > 0) {
            this.showToast(this._tipInfoList[0]);
        }
    }

    /**
     * 显示一个Toast
     * 注意，这里不会处理多语言内容，如果需要显示一个多语言，使用showToastId
     * @param info
     */
    public static async showToast(info: string) {
        if (!info || info == '') {
            return;
        }
        if (!this._tipNode) {
            const comp = PoolManager.Get(CustomToast, null, 'common');
            if (comp) {
                this._tipNode = comp;
                this._tipResLoadStatus = TipPrefabLoadStatus.Loaded;
                ViewManager.addCustomNode(comp);
            }
        }
        this._tipIsWait = true;
        const opacity = this._tipNode.getComponent(UIOpacity);
        Tween.stopAllByTarget(opacity);
        Tween.stopAllByTarget(this._tipNode.node);

        opacity.opacity = 255;
        this._tipNode.node.scale = SCALE_NORMAL;
        this._tipNode.fillData(info);

        tween(this._tipNode.node)
            .sequence(
                tween(this._tipNode.node)
                    .delay(1 / 30)
                    .call(() => {
                        UIHelper._tipNode.updateContentSize();
                    }),
                tween(this._tipNode.node)
                    .to(0.1, {
                        scale: SCALE_NTO
                    })
                    .call(() => {
                        UIHelper._tipNode.updateContentSize();
                        // if(iconSpf){
                        //     UIHelper._tipNode.showIcon(true);
                        // }
                    }),
                tween(this._tipNode.node).to(0.1, {
                    scale: SCALE_NORMAL
                }),
                tween(this._tipNode.node)
                    .delay(2.5)
                    .call(() => {
                        UIHelper._hideTipNode();
                    })
                //消失
            )
            .start();
    }

    private static _hideTipNode() {
        const opacity = this._tipNode.getComponent(UIOpacity);
        tween(opacity)
            .to(0.5, {
                opacity: 0
            })
            .call(() => {
                this._tipIsWait = false;
                this._showFirstCachedTip();
            })
            .start();
    }
}
