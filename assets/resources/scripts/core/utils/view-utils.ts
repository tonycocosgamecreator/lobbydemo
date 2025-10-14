//import EffectAnimationReuse from "../reusable/effect-animation-reuse";
import * as cc from "cc";
import { EmptyCallback } from "../define";
import { ViewOpenAnimationType } from "../view/view-define";
import Coroutine from "../coroutine/coroutine";
import AudioManager from "../manager/audio-manager";
import Constant from "db://assets/resources/scripts/constant";

const SCALE_ZERO = new cc.Vec3(0, 0, 0);
const SCALE_ONE = new cc.Vec3(1, 1, 1);

export default class ViewUtils {
    /**
     * 对指定node执行打开动画效果
     * @param view          需要执行效果的节点
     * @param animationType 
     * @param duration 
     */
    public static async showViewOpenEffect(view: cc.Node, animationType: ViewOpenAnimationType, duration: number = 0.25, complete?: EmptyCallback) {
        view.active = true;
        if (animationType == ViewOpenAnimationType.NONE) {
            complete && complete();
            return;
        }
        switch (animationType) {
            case ViewOpenAnimationType.BOTTOM_TO_CENTER:
                this._showOpenAnimationBottomToCenter(view, duration, complete);
                break;
            case ViewOpenAnimationType.BOTTOM_TO_UP_STAY_BOTTOM:
                this._showOpenAnimationBottomToUpStayBottom(view, duration, complete);
                break;
            case ViewOpenAnimationType.RIGHT_ENTER_AND_STAY_RIGHT_SIDE:
                this._showOpenAnimationRightEnterAndStayRightSide(view, duration, complete);
                break;
            case ViewOpenAnimationType.RIGHT_ENTER_AND_STAY_CENTER:
                this._showOpenAnimationRightEnterAndStayCenter(view, duration, complete);
                break;
            case ViewOpenAnimationType.LEFT_ENTER_AND_STAY_LEFT_SIDE:
                this._showOpenAnimationLeftEnterAndStayLeftSide(view, duration, complete);
                break;
            case ViewOpenAnimationType.LEFT_ENTER_AND_STAY_CENTER:
                this._showOpenAnimationLeftEnterAndStayCenter(view, duration, complete);
                break;
            case ViewOpenAnimationType.CENTER_SCALE_IN:
                this._showOpenAnimationCenterScaleIn(view, duration, complete);
                break;
            default:
                complete && complete();
                break;
        }

    }
    /**
     *  从右边进入，停留在中间
     * @param node 
     * @param duration 
     * @param complete 
     */
    private static _showOpenAnimationRightEnterAndStayCenter(node: cc.Node, duration: number, complete?: EmptyCallback) {
        const parent = node.parent;
        const pWidth = parent.width;
        node.opacity = 0;
        node.x = pWidth / 2 + node.width;
        //AudioManager.playSound('resources', 'sidetocenter');
        cc.tween(node).to(duration, { x: 0, opacity: 255 }, { easing: cc.easing.backOut }).call(() => {
            complete && complete();
        }).start();
    }

    /**
     * 从底部向上打开，停留在中间
     * @param node 
     * @param duration 
     * @param complete 
     */
    private static _showOpenAnimationBottomToCenter(node: cc.Node, duration: number, complete?: EmptyCallback) {
        const height = node.height;
        const sy = -height;
        node.opacity = 0;
        node.y = sy;
        //AudioManager.playSound('resources', 'sidetocenter');
        cc.tween(node).to(duration, { y: 0, opacity: 255 }, { easing: cc.easing.backOut }).call(() => {
            complete && complete();
        }).start();
    }
    /**
     * 从下方出现，然后停留在下方
     * @param node 
     * @param duration 
     * @param complete 
     */
    private static _showOpenAnimationBottomToUpStayBottom(node: cc.Node, duration: number, complete?: EmptyCallback) {
        const height = node.height;
        node.opacity = 0;
        const sy = -Constant.height / 2;
        node.y = sy - height;
        //AudioManager.playSound('resources', 'sidetocenter');
        cc.tween(node).to(duration, { y: sy, opacity: 255 }).call(() => {
            complete && complete();
        }).start();
    }
    /**
     * 从右侧进入，停留在右侧
     * @param node 
     * @param duration 
     * @param complete 
     */
    private static _showOpenAnimationRightEnterAndStayRightSide(node: cc.Node, duration: number, complete?: EmptyCallback) {
        const parent = node.parent;
        const pWidth = parent.width;
        node.opacity = 0;
        node.x = pWidth + node.width;
        //AudioManager.playSound('resources', 'sidetocenter');
        cc.tween(node).to(duration, { x: pWidth / 2, opacity: 255 }).call(() => {
            complete && complete();
        }).start();
    }
    /**
   * 从左侧进入，停留在左侧
   * @param node 
   * @param duration 
   * @param complete 
   */
    private static _showOpenAnimationLeftEnterAndStayLeftSide(node: cc.Node, duration: number, complete?: EmptyCallback) {
        const parent = node.parent;
        const pWidth = parent.width;
        node.opacity = 0;
        node.x = -(node.width + pWidth); // 从左侧外部开始
        //AudioManager.playSound('resources', 'sidetocenter');
        cc.tween(node).to(duration, { x: -pWidth / 2, opacity: 255 }).call(() => {
            complete && complete();
        }).start();
    }

    /**
 *  从左边进入，停留在中间
 * @param node 
 * @param duration 
 * @param complete 
 */
    private static _showOpenAnimationLeftEnterAndStayCenter(node: cc.Node, duration: number, complete?: EmptyCallback) {
        const parent = node.parent;
        node.opacity = 0;
        node.x = -node.width; // 从左侧外部开始
        //AudioManager.playSound('resources', 'sidetocenter');
        cc.tween(node).to(duration, { x: 0, opacity: 255 }, { easing: cc.easing.backOut }).call(() => {
            complete && complete();
        }).start();
    }
    /**
     * 从中间缩放出现
     * @param node 
     * @param duration 
     * @param complete 
     */
    private static _showOpenAnimationCenterScaleIn(node: cc.Node, duration: number, complete?: EmptyCallback) {
        let scale = node.scale;
        node.setScale(SCALE_ZERO);
        cc.tween(node).to(duration, { scale: SCALE_ONE }, { easing: cc.easing.backOut }).call(() => {
            complete && complete();
        }).start();
    }


    //-----------------------------------------------------
    // 关闭动画
    //-----------------------------------------------------
    private static _showCloseAnimationBottomToCenter(node: cc.Node, duration: number, complete?: EmptyCallback) {
        const height = node.height;
        const sy = -height;
        node.opacity = 255;
        node.y = 0;
        //AudioManager.playSound('resources', 'sidetocenter');
        cc.tween(node).to(duration, { y: sy, opacity: 0 }, { easing: cc.easing.backIn }).call(() => {
            complete && complete();
        }).start();
    }

    private static _showCloseAnimationRightEnterAndStayRightSide(node: cc.Node, duration: number, complete?: EmptyCallback) {
        const parent = node.parent;
        const pWidth = parent.width;
        node.opacity = 255;
        node.x = pWidth / 2;
        //AudioManager.playSound('resources', 'sidetocenter');
        cc.tween(node).to(duration, { x: pWidth + node.width, opacity: 0 }).call(() => {
            complete && complete();
        }).start();
    }
    private static _showCloseAnimationRightEnterAndStayCenter(node: cc.Node, duration: number, complete?: EmptyCallback) {
        const parent = node.parent;
        const pWidth = parent.width;
        node.opacity = 255;
        node.x = 0;
        //AudioManager.playSound('resources', 'sidetocenter');
        cc.tween(node).to(duration, { x: pWidth / 2 + node.width, opacity: 0 }).call(() => {
            complete && complete();
        }).start();
    }

    /* 从左侧靠边关闭 */
    private static _showCloseAnimationLeftEnterAndStayLeftSide(node: cc.Node, duration: number, complete?: EmptyCallback) {
        const parent = node.parent;
        const pWidth = parent.width;
        node.opacity = 255;
        node.x = -pWidth / 2;
        //AudioManager.playSound('resources', 'sidetocenter');
        cc.tween(node).to(duration, { x: -pWidth - node.width, opacity: 0 }).call(() => {
            complete && complete();
        }).start();
    }
    // 中间，向左侧关闭
    private static _showCloseAnimationLeftEnterAndStayCenter(node: cc.Node, duration: number, complete?: EmptyCallback) {
        // 关闭动画与进入动画方向相反：从中间划出到左侧外部
        node.opacity = 255;
        node.x = 0;
        //AudioManager.playSound('resources', 'sidetocenter');
        cc.tween(node).to(duration, { x: -node.width, opacity: 0 }, { easing: cc.easing.backIn }).call(() => {
            complete && complete();
        }).start();
    }


    private static _showCloseAnimationBottomToUpStayBottom(node: cc.Node, duration: number, complete?: EmptyCallback) {
        const height = node.height;
        const sy = -Constant.height / 2;
        node.opacity = 255;
        node.y = sy;
        //AudioManager.playSound('resources', 'sidetocenter');
        cc.tween(node).to(duration, { y: sy - height, opacity: 0 }).call(() => {
            complete && complete();
        }).start();
    }

    private static _showCloseAnimationCenterScaleOut(node: cc.Node, duration: number, complete?: EmptyCallback) {
        //let scale = node.scale;
        //node.setScale(SCALE_ONE);
        cc.tween(node).to(duration, { scale: SCALE_ZERO }, { easing: cc.easing.backIn }).call(() => {
            complete && complete();
        }).start();
    }

    /**
     * 对指定node执行关闭动画效果
     * @param view          需要执行效果的节点
     * @param animationType 
     * @param duration 
     */
    public static async showViewCloseEffect(view: cc.Node, animationType: ViewOpenAnimationType, duration: number = 0.25, complete?: EmptyCallback) {
        if (animationType == ViewOpenAnimationType.NONE) {
            complete && complete();
            return;
        }

        switch (animationType) {
            case ViewOpenAnimationType.BOTTOM_TO_CENTER:
                this._showCloseAnimationBottomToCenter(view, duration, complete);
                break;
            case ViewOpenAnimationType.BOTTOM_TO_UP_STAY_BOTTOM:
                this._showCloseAnimationBottomToUpStayBottom(view, duration, complete);
                break;
            case ViewOpenAnimationType.RIGHT_ENTER_AND_STAY_RIGHT_SIDE:
                this._showCloseAnimationRightEnterAndStayRightSide(view, duration, complete);
                break;
            case ViewOpenAnimationType.RIGHT_ENTER_AND_STAY_CENTER:
                this._showCloseAnimationRightEnterAndStayCenter(view, duration, complete);
                break;
            case ViewOpenAnimationType.LEFT_ENTER_AND_STAY_LEFT_SIDE:
                this._showCloseAnimationLeftEnterAndStayLeftSide(view, duration, complete);
                break;
            case ViewOpenAnimationType.LEFT_ENTER_AND_STAY_CENTER:
                this._showCloseAnimationLeftEnterAndStayCenter(view, duration, complete);
                break;
            case ViewOpenAnimationType.CENTER_SCALE_IN:
                this._showCloseAnimationCenterScaleOut(view, duration, complete);
                break;
            default:
                duration = 0;
                complete && complete();
                break;
        }
        if (duration > 0) {
            await Coroutine.WaitTime(duration);
        }
    }
}
