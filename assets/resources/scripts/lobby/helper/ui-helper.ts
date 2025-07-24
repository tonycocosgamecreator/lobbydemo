import { bDebug } from "../../core/define";
import ViewManager from "../../core/manager/view-manager";
import PanelCircleLoading from "../../view/PanelCircleLoading";

export default class UIHelper {
    /**
 * 当前正在显示的圆形加载界面
 */
    private static _circleLoading: PanelCircleLoading | null = null;
    private static _bCancelCircleLoading: boolean = false;
    //===================================circleLoading===================================//
    /**
     * 显示一个圆形加载动画
     * @param info
     */
    public static showCircleLoading(info?: string, timeout: number = 20) {
        bDebug && console.log('showCircleLoading!');
        this._bCancelCircleLoading = false;
        bDebug && console.warn('showCircleLoading!');
        if (this._circleLoading) {
            if (info) {
                this._circleLoading.updateInfo(info, timeout);
            } else {
                this._circleLoading.resetTimeOut(timeout);
            }
            return;
        }

        UIHelper._circleLoading = ViewManager.Open(PanelCircleLoading, {
            info: info,
            timeout: timeout
        }) as PanelCircleLoading;
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
}


