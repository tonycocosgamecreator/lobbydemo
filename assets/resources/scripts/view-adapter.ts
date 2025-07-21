import { _decorator, Component, Node, Canvas, screen, Camera, ResolutionPolicy, view, UITransform, size, v3, macro, log, sys, SafeArea, native } from 'cc';
import BaseDefine from './base-define';
import Constant from './constant';
import { Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ViewAdaptor')
export class ViewAdaptor extends Component {

    @property({ type: Camera })
    camera: Camera;

    @property({ type: Canvas })
    canvas: Canvas;

    start() {
        window["viewadapter"] = this;
        this.updateResulation();

        this.node.getComponent(Widget).bottom = 0;
    }

    update(deltaTime: number) {

    }
    //========================================分辨率相关=================================//
    private _adapterWidth: number;
    private _adapterHeight: number;
    private _fullWidth: number;
    private _fullHeight: number;
    public get width() {
        return this._adapterWidth;
    }
    public get height() {
        return this._adapterHeight;
    }
    public get fullWidth() {
        return this._fullWidth;
    }
    public get fullHeight() {
        return this._fullHeight;
    }
    public get aspectRatio() {
        return this.width / this.height;
    }
    //=====================================私有方法====================================//

    public async updateResulation() {
        /*let sz = screen.windowSize;
        let swidth = sz.width;
        let sheight = sz.height;
        let orientation = BaseDefine.orientation;
        if (orientation == macro.ORIENTATION_PORTRAIT) {
            //需要竖屏
            view.setOrientation(macro.ORIENTATION_PORTRAIT);
            sz = size(swidth > sheight ? sheight : swidth, swidth > sheight ? swidth : sheight);
            if (sys.platform == sys.Platform.MOBILE_BROWSER || sys.platform == sys.Platform.DESKTOP_BROWSER) {
                screen.windowSize = sz;
            } else if (sys.platform == sys.Platform.ANDROID) {
                // console.error("Fish，你需要在这里调用android原生的横竖屏切换到竖屏的代码！");
                JsbridgeUtil.changeScene(Orientation.PORTRAIT);
                await BaseDefine.WaitFrame(5);
            }
            log("Portrait screen.");
        } else {
            //需要横屏
            view.setOrientation(macro.ORIENTATION_LANDSCAPE);
            sz = size(swidth > sheight ? swidth : sheight, swidth > sheight ? sheight : swidth);
            if (sys.platform == sys.Platform.MOBILE_BROWSER || sys.platform == sys.Platform.DESKTOP_BROWSER) {
                screen.windowSize = sz;
            } else if (sys.platform == sys.Platform.ANDROID) {
                // console.error("Fish，你需要在这里调用android原生的横竖屏切换到横屏的代码！");
                JsbridgeUtil.changeScene(Orientation.LANDSCAPE);
                await BaseDefine.WaitFrame(5);
            }
            log('Horizontal screen.');
        }

        let deviceSize = screen.windowSize;
        if (deviceSize.width > deviceSize.height) {
            //目前是横屏
            BaseDefine.ResolutionWidth = BaseDefine.ResolutionMinLongestSide;
            BaseDefine.ResolutionHeight = BaseDefine.ResolutionMinShortestSide;
            view.setDesignResolutionSize(BaseDefine.ResolutionWidth, BaseDefine.ResolutionHeight, ResolutionPolicy.FIXED_WIDTH);

        } else {
            //目前是竖屏
            BaseDefine.ResolutionWidth = BaseDefine.ResolutionMinShortestSide;
            BaseDefine.ResolutionHeight = BaseDefine.ResolutionMinLongestSide;
            view.setDesignResolutionSize(BaseDefine.ResolutionWidth, BaseDefine.ResolutionHeight, ResolutionPolicy.FIXED_HEIGHT);
        }

        const deviceRatio = deviceSize.width / deviceSize.height;
        console.log('Current screen aspect ratio:', deviceRatio, deviceSize);
        let adapterWidth: number;
        let adapterHeight: number;
        let fullWidth: number;
        let fullHeight: number;
        let policy: number;

        if (deviceRatio <= BaseDefine.ResolutionWidth / BaseDefine.ResolutionHeight) {
            log('height ', deviceRatio);
            adapterWidth = BaseDefine.ResolutionWidth;
            adapterHeight = BaseDefine.ResolutionWidth / deviceRatio;
            fullWidth = adapterWidth;
            fullHeight = adapterHeight;
            policy = ResolutionPolicy.FIXED_WIDTH;
        } else {
            log('width ', deviceRatio);
            adapterWidth = BaseDefine.ResolutionHeight * deviceRatio;
            adapterHeight = BaseDefine.ResolutionHeight;
            fullWidth = adapterWidth;
            fullHeight = adapterHeight;
            policy = ResolutionPolicy.FIXED_HEIGHT;
        }

        if (policy != null) {
            view.setDesignResolutionSize(adapterWidth, adapterHeight, policy);
        }

        // 保存分辨率信息
        this._adapterWidth = adapterWidth;
        this._adapterHeight = adapterHeight;
        this._fullWidth = fullWidth;
        this._fullHeight = fullHeight;
        //设置当前的分辨率信息到Constant中
        BaseDefine.width = adapterWidth;
        BaseDefine.height = adapterHeight;
        Constant.width = adapterWidth;
        Constant.height = adapterHeight;
        //根据最终分辨率信息，更新Canvas的大小和位置
        const canvasNode = this.canvas.node;
        //重新激活safearea组件

        const safeAreaComp = canvasNode.getChildByName("viewRoot").getComponent(SafeArea);
        safeAreaComp.enabled = false;
        safeAreaComp.enabled = true;
        const uiTrans = canvasNode.getComponent(UITransform);
        uiTrans.setContentSize(size(adapterWidth, adapterHeight));
        canvasNode.position = v3(adapterWidth / 2, adapterHeight / 2, 0);*/

        let frameSize = sys.getSafeAreaRect();
        let frameRaite = frameSize.width / frameSize.height;


        let adapterWidth = frameSize.width;
        let adapterHeight = frameSize.height;
        this._adapterWidth = adapterWidth;
        this._adapterHeight = adapterHeight;
        this._fullWidth = adapterWidth;
        this._fullHeight = adapterHeight;
        //设置当前的分辨率信息到Constant中
        BaseDefine.width = adapterWidth;
        BaseDefine.height = adapterHeight;
        Constant.width = adapterWidth;
        Constant.height = adapterHeight;

        let resolutionSize = view.getDesignResolutionSize();
        let recotRaite = resolutionSize.width / resolutionSize.height;
        let isFitWidth: boolean = true;
        if (frameRaite < recotRaite) {//窄屏
            isFitWidth = true;
            log("窄屏适配", frameRaite, recotRaite, isFitWidth)
        } else {//宽屏
            isFitWidth = false;
            log("宽屏适配", frameRaite, recotRaite, isFitWidth)
        }

        let policy: number;
        if (isFitWidth) {
            policy = ResolutionPolicy.FIXED_WIDTH;
        } else policy = ResolutionPolicy.FIXED_HEIGHT;
        view.setDesignResolutionSize(resolutionSize.width, resolutionSize.height, policy);
    }
}


