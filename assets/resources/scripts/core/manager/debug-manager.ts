import { input, Input, EventKeyboard, KeyCode } from "cc";
import BaseGlobal from "../message/base-global";
import BaseManager from "./base-manager";
import ViewManager from "./view-manager";


export default class DebugManager extends BaseManager {
    public static KEY = 'DebugManager';

    public static BundleName = 'resources';

    /**
     * 初始化
     * 框架会主动调用，此处初始化自己的listeners，例如：
     * Global.registerListeners(
     *      this,
     *      {
     *          [xxx] : this.xxx
     *      }
     * )
     */
    public static init() {
        super.init();
        this.registerKeyboardListener();
    }

    /**
     * 清理自己的数据结构
     * 此方法不会被主动调用，请在自己需要的时候自己调用
     */
    public static clear() {}

    /**
     * 加载自己的本地存档
     * 不需要自己主动调用，会在注册时调用一次，或者在重置存档的时候回调
     */
    public static loadRecord() {}

    public static saveRecord(): void {}

    //===================================成员变量以及方法==================================//
    ///// 成员变量 /////
    /** 是否按下了ctrl键 */
    public static bPressedCtrl = false;
    /** 是否按下了Alt键 */
    public static bPressedAlt = false;
    /** 是否按下了Shift键 */
    public static bPressedShift = false;

    /**
     * 调试开关，是否解锁所有关卡
     */
    public static bUnlockAllStage = false;

    private static registerKeyboardListener() {
        input.on(Input.EventType.KEY_DOWN, this.onSystemKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onSystemkeyUp, this);
    }

    private static onSystemKeyDown(e: EventKeyboard) {
        const keyCode = e.keyCode;
        switch (keyCode) {
            case KeyCode.ALT_LEFT:
                this.bPressedAlt = true;
                break;
            case KeyCode.CTRL_LEFT:
                this.bPressedCtrl = true;
                break;
            case KeyCode.SHIFT_LEFT:
                this.bPressedShift = true;
                break;
            default:
                const keyDesc = this._genKeyDesc(keyCode);
                this.onKeyDown(keyDesc);
                break;
        }
    }

    private static onSystemkeyUp(e: EventKeyboard) {
        const keyCode = e.keyCode;
        switch (keyCode) {
            case KeyCode.ALT_LEFT:
                this.bPressedAlt = false;
                break;
            case KeyCode.CTRL_LEFT:
                this.bPressedCtrl = false;
                break;
            case KeyCode.SHIFT_LEFT:
                this.bPressedShift = false;
                break;
            default:
                const keyDesc = this._genKeyDesc(keyCode);
                this.onKeyUp(keyDesc);
                break;
        }
    }

    private static _genKeyDesc(keyCode: number): string {
        let text = '';

        if (this.bPressedCtrl) text += 'ctrl_';
        if (this.bPressedAlt) text += 'alt_';
        if (this.bPressedShift) text += 'shift_';

        let keyName = KeyCode[keyCode];

        if (keyName.startsWith('KEY_')) {
            keyName = keyName.substring(4, keyName.length).toLowerCase();
        } else if (keyName.startsWith('NUM_')) {
            keyName = keyName.substring(4, keyName.length).toLowerCase();
        } else if (keyName.startsWith('DIGIT_')) {
            keyName = keyName.substring(6, keyName.length).toLowerCase();
        }

        text += keyName;

        return text;
    }

    private static onKeyDown(keyDesc: string) {
        switch (keyDesc) {
            // case "a":
            //     break;
            // case "s":
            //     break;
            // case "d":
            //     break;
            // case "w":
            //     break;
            case 'b':
                break;

            case 'c':
                break;

            case 'e':
                break;
            case 'f':
                break;
            case 'g':
                break;
            case 'ctrl_g':
                break;
            case 'ctrl_q':
                break;
            case 'h':
                break;
            case 'i':
                break;
            case 'j':
                break;
            case 'k':
                break;
            case 'l':
                break;
            case 'm':
                break;
            case 'n':
                break;
            case 'o':
                break;
            case 'p':
                break;
            case 'q':
                break;
            case 'r':
                break;

            case 't':
                break;
            case 'u':
                break;
            case 'v':
                break;

            case 'x':
                break;
            case 'y':
                break;
            case 'z':
                break;
        }

        BaseGlobal.sendMsg('DEBUG_KEY_DOWN', keyDesc);
    }

    private static onKeyUp(keyDesc: string) {
        switch (keyDesc) {
            case "a":
                break;
            case "s":
                break;
            case "d":
                break;
            case "w":
                break;
            case "ESCAPE":
                ViewManager.onNativeBackButtonClicked();
                break;
        }
    }
}