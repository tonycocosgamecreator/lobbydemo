import * as cc from 'cc';

/**
 * 为 cc.sp.Skeleton 补丁事件监听器（仅非 Native 环境）
 */
export default class SkeletonListenerPatch {
    /**
     * 打补丁，重复调用无副作用
     */
    static patch() {
        // 用 Symbol 防止类型报错和属性冲突
        const PATCHED = Symbol.for('__skeletonListenerPatched');
        const proto: any = cc.sp.Skeleton.prototype;
        if (!cc.sys.isNative && !proto[PATCHED]) {
            cc.sp.Skeleton.prototype["setCompleteListener"] = function (listener: cc.__private._cocos_spine_skeleton__TrackListener) {
                this._ensureListener();
                let savelistenerID = this["_listenerID"];
                if (savelistenerID) {
                    this._instance!.setListener(savelistenerID, null);
                    if (globalThis.TrackEntryListeners._listenerSet) {
                        globalThis.TrackEntryListeners._listenerSet.delete(savelistenerID);
                    }
                }
                if (listener) {
                    const listenerID = globalThis.TrackEntryListeners.addListener(listener);
                    this["_listenerID"] = listenerID;
                    this._instance!.setListener(listenerID, cc.sp.spine.EventType.complete);
                }
                if (this._listener) {
                    this._listener!.complete = listener;
                }
            };
            cc.sp.Skeleton.prototype["setEventListener"] = function (listener: cc.__private._cocos_spine_skeleton__TrackListener2) {
                this._ensureListener();
                let savelistenerID = this["_listenerID2"];
                if (savelistenerID) {
                    this._instance!.setListener(savelistenerID, null);
                    if (globalThis.TrackEntryListeners._listenerSet) {
                        globalThis.TrackEntryListeners._listenerSet.delete(savelistenerID);
                    }
                }
                if (listener) {
                    const listenerID = globalThis.TrackEntryListeners.addListener(listener);
                    this["_listenerID2"] = listenerID;
                    this._instance!.setListener(listenerID, cc.sp.spine.EventType.event);
                }
                if (this._listener) {
                    this._listener!.event = listener;
                }
            };
            cc.sp.Skeleton.prototype["onDestroyClone"] = cc.sp.Skeleton.prototype["onDestroy"];
            cc.sp.Skeleton.prototype["onDestroy"] = function () {
                this.setEventListener(null);
                this.setCompleteListener(null);
                this.onDestroyClone();
            };
            proto[PATCHED] = true;
        }
    }
}
