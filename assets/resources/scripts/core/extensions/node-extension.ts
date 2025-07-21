import { UITransform, Node, Component, Sprite, UIOpacity, Animation, Label, RichText, EditBox, Mask, Graphics, ParticleSystem2D, ParticleSystem, TiledMap, sp, ProgressBar, PageView, ScrollView, ScrollBar, Toggle, VideoPlayer } from 'cc';
import { EDITOR } from 'cc/env';
import { AssetType } from '../define';
import { Tools } from '../utils/tools';
import { WebView } from 'cc';

export default class NodeExtensions {
    public static registerExtensions() {
        if (EDITOR) {
            return;
        }

        const descriptorWidth = Object.getOwnPropertyDescriptor(Node.prototype, 'width');
        //console.log(descriptorWidth);
        //如果宽度的定义存在就不会再次定义
        if (!descriptorWidth) {
            Object.defineProperty(Node.prototype, 'width', {
                configurable: true,
                get() {
                    const transform = this.transform as UITransform;
                    return transform.contentSize.width;
                },
                set(val: number) {
                    const transform = this.transform as UITransform;
                    const size = transform.contentSize;
                    size.set(val, size.height);
                    transform.contentSize = size;
                },
            });
        }

        //如果高度的定义存在就不会再次定义
        const descriptorHeight = Object.getOwnPropertyDescriptor(Node.prototype, 'height');
        if (!descriptorHeight) {
            Object.defineProperty(Node.prototype, 'height', {
                configurable: true,
                get() {
                    const transform = this.transform as UITransform;
                    return transform.contentSize.height;
                },
                set(val: number) {
                    const transform = this.transform as UITransform;
                    const size = transform.contentSize;
                    size.set(size.width, val);
                    transform.contentSize = size;
                },
            });
        }

        Object.defineProperties(Node.prototype, {
            ['x']: {
                get() {
                    return this.position.x;
                },
                set(val: number) {
                    const pos = this.position;
                    this.setPosition(val, pos.y, pos.z);
                },
            },
            ['y']: {
                get() {
                    return this.position.y;
                },
                set(val: number) {
                    const pos = this.position;
                    this.setPosition(pos.x, val, pos.z);
                },
            },
            ['transform']: {
                get() {
                    return this.getComponent(UITransform);
                },
            },
            ['opacity']: {
                get() {
                    let op = this.getComponent(UIOpacity);
                    if (!op) {
                        op = this.addComponent(UIOpacity);
                    }
                    return op.opacity;
                },
                set(val: number) {
                    let op = this.getComponent(UIOpacity);
                    if (!op) {
                        op = this.addComponent(UIOpacity);
                    }
                    op.opacity = val;
                },
            },
        });

        const components: { [varName: string]: AssetType<Component | Node> } = {
            Sprite: Sprite,
            Animation: Animation,
            UIOpacity: UIOpacity,
            Label: Label,
            RichText: RichText,
            EditBox: EditBox,
            Mask: Mask,
            Graphics: Graphics,
            "ParticleSystem2D"  : ParticleSystem2D,
            "ParticleSystem"    : ParticleSystem,
            //"TiledMap"      : TiledMap,
            //"sp.Skeleton"   : sp.Skeleton,
            ProgressBar: ProgressBar,
            PageView: PageView,
            ScrollView: ScrollView,
            ScrollBar: ScrollBar,
            Toggle: Toggle,
            //VideoPlayer   : VideoPlayer,
            Node: Node,
            "WebView": WebView,
        };
        Tools.forEachMap(components, (k, v) => {
            Object.defineProperty(v, 'VIEW_NAME', {
                configurable: true,
                get() {
                    return k;
                },
            });
        });
    }
}
