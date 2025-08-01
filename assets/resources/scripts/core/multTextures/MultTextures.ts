//*//
import { __private, approx, assert, BaseRenderData, BitmapFont, CacheMode, cclegacy, Color, Component, Director, director, EPSILON, Game, game, gfx, ImageAsset, Label, Material, MotionStreak, murmurhash2_32_gc, Node, NodeEventType, renderer, resources, Root, Sprite, SpriteFrame, StencilManager, Texture2D, TiledLayer, TiledRenderData, UIMeshRenderer, UIOpacity, UIRenderer } from 'cc';
import { DEBUG, EDITOR, JSB } from 'cc/env';

const VER = "2.0.7";

//最大纹理,固定8张
const MAX_TEX = 8

//原生开关,根据需要开启或关闭
const SUPPORT_NATIVE = true;


//@ts-ignore
gfx.Texture.prototype.texID = -1; //当前纹理id
//@ts-ignore
Material.prototype.isMult = false; //多纹理材质的标记
//@ts-ignore
Component.prototype.useMult = false; //组件多纹理开关



export const MultBatch2D: any = {
    native: !SUPPORT_NATIVE && JSB,
    enable: false,
    parent: null,
    incID: 0,
    count: 0,
    hash: 0,
    reset: function () {
        this.incID += this.count;
        this.count = 0;
    }
};


const _image = new ImageAsset({
    width: 1,
    height: 1,
    _compressed: false,
    format: gfx.Format.RGBA32F,
    _data: new Float32Array(4).fill(0),
});

const Texture = new Texture2D();
Texture.setFilters(1, 1);
Texture.image = _image;
Texture.addRef();


//预加载多纹理材质
const loadMultTextures = function () {
    MultBatch2D.enable = false;
    resources.load("multTextures/Mult-material", Material, (err, material) => {
        if (!err) {
            let mat = cclegacy.builtinResMgr.get('ui-sprite-material');
            if (mat) {
                mat._hash = MultBatch2D.hash = Material.getHash(mat);
                MultBatch2D.parent = material;
                MultBatch2D.enable = true;
                material.addRef();
            }
        }
    });
}

//填补原生纹理数据
const endBatcher = function () {
    if (!JSB) return;
    let batcher: any = director.root?.batcher2D;
    if (batcher && batcher.isMult) {
        let mat = batcher._currMaterial;
        if (mat && MultBatch2D.count > 0) {
            let tid = Texture.getGFXTexture();//?.objectID;
            let cache = batcher.cacheTextures;
            for (let i = MultBatch2D.count; i < 8; i++) {
                if (cache[i] !== tid) {
                    mat.setProperty("texture" + i, Texture);
                    cache[i] = tid;
                }
            }
        }
    }
}

//多纹理材质缓存队列
let _cacheUseCount: number = 0;
let _cacheMaterials: Array<Material> = [];
const getMultMaterial = function (oldMat: any, rd: any = null) {

    let MB = MultBatch2D;

    endBatcher();
    MB.reset();
    if (!MB.enable || !oldMat || !rd || !rd.isMult) {
        return oldMat;
    }

    if (!MB.parent || !MB.parent.isValid) {
        loadMultTextures();
        return oldMat;
    }

    let newMat: any = _cacheMaterials[_cacheUseCount++];
    if (!newMat || !newMat.isValid) {
        let material = { parent: MB.parent };
        newMat = new renderer.MaterialInstance(material);
        _cacheMaterials[_cacheUseCount - 1] = newMat;
        newMat['cacheTextures'] = [];
        newMat['isMult'] = true;
        newMat.addRef();
    }

    return newMat;
}



//游戏启动前，务必加载多纹理材质
game.once(Game.EVENT_GAME_INITED, () => {
    if (EDITOR || MultBatch2D.native) return; //|| JSB

    loadMultTextures();

});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 多纹理合批，sprite , label , renderdata ，等其他组件的重写和监听
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const inject_Renderdata = function () {

    const RenderData = cclegacy.UI.RenderData.prototype;

    RenderData.texID = -1;
    RenderData.isMult = false;
    RenderData.matDirty = true;
    RenderData.texDirty = true;
    RenderData.dataDirty = 0x0;

    //兼容多纹理hash计算
    RenderData.updateHash = function () {

        if (this.isMult && MultBatch2D.enable) {
            const bid = this.chunk ? this.chunk.bufferId : -1;
            const hashString = `${bid}${this.layer}` + '98k';
            this.dataHash = murmurhash2_32_gc(hashString, 666);
            this.hashDirty = false;
        } else {
            const bid = this.chunk ? this.chunk.bufferId : -1;
            const hashString = `${bid}${this.layer} ${this.textureHash}`;
            this.dataHash = murmurhash2_32_gc(hashString, 666);
            this.hashDirty = false;
        }

        this.matDirty = false;
    }

    //监听纹理的变更
    Object.defineProperty(RenderData, "textureDirty", {
        get: function () {
            return this.texDirty;
        },
        set: function (val: boolean) {
            this.texDirty = val;
            if (val === true) {
                this.texID = -1;
            }
        }
    });



    //检测是否支持多纹理合批
    const isMultTextures = function (rd: any, uir: UIRenderer) {

        rd.isMult = false;
        let material: any = uir.getRenderMaterial(0);
        if (!material || !MultBatch2D.enable) {
            return;
        }

        //@ts-ignore
        //组件控制开关 useMult: 可以开启自定义组件参与多纹理
        if (uir.useMult  && !rd._isMeshBuffer) {
            if (!material.hash || rd.passDirty || JSB) {
                material._hash = Material.getHash(material);
            }
            rd.isMult = (MultBatch2D.hash == material._hash);
        }

    }

    //监听pass变更，检测是否多纹理支持
    const updatePass = RenderData.updatePass;
    RenderData.updatePass = function (comp: UIRenderer): void {
        isMultTextures(this, comp);
        updatePass.call(this, comp);
    }

    //监听pass变更，检测是否多纹理支持
    const updateRenderData = RenderData.updateRenderData;
    RenderData.updateRenderData = function (comp: UIRenderer, frame: any): void {
        // if (this.passDirty) {
        //     isMultTextures(this, comp);
        // }
        isMultTextures(this, comp);
        updateRenderData.call(this, comp, frame);
    }


}


const fillMeshVertices3D = function (node: Node, renderer: any, cmp: any, color: Color): void {

    const renderData = cmp.renderData!
    const chunk = renderData.chunk;
    const dataList = renderData.data;
    const vData = chunk.vb;
    const vertexCount = renderData.vertexCount;


    if (node.hasChangedFlags || renderData.dataDirty === 1) {

        let m = node.worldMatrix; // node.getWorldMatrix(m);
        let m00 = m.m00, m01 = m.m01, m02 = m.m02, m03 = m.m03,
            m04 = m.m04, m05 = m.m05, m06 = m.m06, m07 = m.m07,
            m12 = m.m12, m13 = m.m13, m14 = m.m14, m15 = m.m15;

        let scale = 1.0 / 255;
        let vertexOffset = 0;
        for (let i = 0; i < vertexCount; i++) {
            const vert = dataList[i];
            const x = vert.x;
            const y = vert.y;
            let rhw = m03 * x + m07 * y + m15;
            rhw = rhw ? 1 / rhw : 1;
            vData[vertexOffset + 0] = (m00 * x + m04 * y + m12) * rhw;
            vData[vertexOffset + 1] = (m01 * x + m05 * y + m13) * rhw;
            vData[vertexOffset + 2] = (m02 * x + m06 * y + m14) * rhw;
            //Color.toArray(vData, color, vertexOffset + 5);
            //const scale = (a instanceof Color || a.a > 1) ? 1 / 255 : 1;
            vData[vertexOffset + 5] = color.r * scale;
            vData[vertexOffset + 6] = color.g * scale;
            vData[vertexOffset + 7] = color.b * scale;
            vData[vertexOffset + 8] = color.a * scale;

            vertexOffset += 9;
        }

    }

    // fill index data
    const bid = chunk.bufferId;
    const vid = chunk.vertexOffset;
    const meshBuffer = chunk.meshBuffer;
    const ib = chunk.meshBuffer.iData;
    let indexOffset = meshBuffer.indexOffset;

    for (let i = 0, count = vertexCount / 4; i < count; i++) {
        const start = vid + i * 4;
        ib[indexOffset++] = start;
        ib[indexOffset++] = start + 1;
        ib[indexOffset++] = start + 2;
        ib[indexOffset++] = start + 1;
        ib[indexOffset++] = start + 3;
        ib[indexOffset++] = start + 2;
    }
    meshBuffer.setDirty();
    meshBuffer.indexOffset += renderData.indexCount;

}

const inject_Label = function () {

    const tempColor0 = new Color(255, 255, 255, 255);
    const tempColor1 = new Color(255, 255, 255, 255);
    const bmfillBuffers = function (comp: Label, renderer: any) {
        const node = comp.node;
        tempColor0.set(comp.color);
        tempColor0.a = node._uiProps.opacity * 255;
        // Fill All
        fillMeshVertices3D(node, renderer, comp, tempColor0);
    };
    const lefillBuffers = function (comp: Label, renderer: any): void {
        if (!comp.renderData) {
            return;
        }
        const node = comp.node;
        tempColor1.a = node._uiProps.opacity * 255;
        // Fill All
        fillMeshVertices3D(node, renderer, comp, tempColor1);
    };

    //@ts-ignore
    Label.prototype.useMult = true;
    //监听 Label 的 uv 变更
    const label = Label.Assembler;
    if (label) {
        const getAssembler = label.getAssembler;
        label.getAssembler = function (comp: Label) {
            const assembler:any = getAssembler.call(this, comp);
            if (assembler.changeUV == undefined) {
                assembler.changeUV = function (s: any) {
                    let rd = s.renderData;
                    rd && (rd.dataDirty = 1);
                };

                const UVs = assembler.updateUVs;
                if (UVs) {
                    if (comp.font instanceof BitmapFont) {
                        assembler.updateUVs = function (comp: Label) {
                            UVs.call(this, comp);
                            this.changeUV(comp);
                        }
                    } else if (comp.cacheMode === Label.CacheMode.CHAR) {
                        assembler.updateUVs = function (comp: Label) {
                            UVs.call(this, comp);
                            this.changeUV(comp);
                        }
                    } else {
                        assembler.updateUVs = function (comp: Label) {
                            UVs.call(this, comp);
                            const renderData = comp.renderData;
                            if (!renderData || !comp.ttfSpriteFrame) {
                                return;
                            }
                            this.changeUV(comp);
                        }
                    }
                }
            }

            if (comp.font instanceof BitmapFont) {
                assembler.fillBuffers = bmfillBuffers;
            } else {
                assembler.fillBuffers = lefillBuffers;
            }

            return assembler;
        }

    }

}

const inject_Sprite = function () {
    //@ts-ignore
    Sprite.prototype.useMult = true;
    //监听 sprite 的 uv 变更
    const sprite = Sprite.Assembler;
    if (sprite) {
        const getAssembler = sprite.getAssembler;
        sprite.getAssembler = function (comp: Sprite) {
            const assembler:any = getAssembler.call(this, comp);
            if (assembler.changeUV == undefined) {
                assembler.changeUV = function (s: any) {
                    let rd = s.renderData;
                    rd && (rd.dataDirty = 1);
                };

                const UVs = assembler.updateUVs;
                if (UVs) {
                    if (comp.type == Sprite.Type.FILLED) {
                        if (comp.fillType != Sprite.FillType.RADIAL) {
                            assembler.updateUVs = function (s: any, f0: number, f1: number) {
                                UVs.call(this, s, f0, f1);
                                this.changeUV(s);
                            }
                        }
                    } else {
                        if (comp.type != Sprite.Type.TILED) {
                            assembler.updateUVs = function (s: any) {
                                UVs.call(this, s);
                                if (s.spriteFrame)
                                    this.changeUV(s);
                            }
                        }
                    }
                }

                if (JSB) {
                    const wUV = assembler.updateWorldUVData;
                    if (wUV) {
                        assembler.updateWorldUVData = function (s: any) {
                            wUV.call(this, s);
                            this.changeUV(s);
                        }
                    }
                }

                const verUV = assembler.updateWorldVertexAndUVData;
                if (verUV) {
                    assembler.updateWorldVertexAndUVData = function (s: any, c: any) {
                        verUV.call(this, s, c);
                        this.changeUV(s);
                    }
                }
            }

            return assembler;
        }
    }
}

const inject_MotionStreak = function () {
    if (MotionStreak) {

        const motionStreak: any = MotionStreak.prototype;
        motionStreak.useMult = true; //参与多纹理合批

        const lateUpdate = motionStreak.lateUpdate;
        motionStreak.lateUpdate = function (dt: number) {
            lateUpdate.call(this, dt);
            if (this._assembler) {
                if (this.points.length >= 2) {
                    let rd = this.renderData;
                    //全局标记刷新纹理uv
                    rd && (rd.dataDirty = 1);
                }
            }
        }
    }
}


const inject_TiledLayer = function () {
    if (TiledLayer && !JSB) {

        const Tiled: any = TiledLayer.prototype;;
        Tiled.useMult = true; //参与多纹理合批
        Tiled.dataDirty = false; //全局标记刷新纹理uv

        const setUserNodeDirty = Tiled.setUserNodeDirty
        Tiled.setUserNodeDirty = function (dirty: boolean) {
            setUserNodeDirty.call(this, dirty);
            if (!dirty) {
                //全局标记刷新纹理uv
                this.dataDirty = true;
            }
        }

        Tiled._render = function (ui: any): void {
            const layer = this.node.layer;
            for (let i = 0, j = 0; i < this._tiledDataArray.length; i++) {
                this._tiledDataArrayIdx = i;
                const m = this._tiledDataArray[i];
                const info = this._drawInfoList[j];
                if (m.subNodes) {
                    // 提前处理 User Nodes
                    m.subNodes.forEach((c: any) => {
                        if (c) {
                            ui.walk(c.node);
                            j++;
                        }
                    });
                } else {
                    const td = m as TiledRenderData;
                    if (td.texture) {

                        let isDirty = false;
                        let rd: any = td.renderData!;
                        rd.material = this.getRenderMaterial(0);
                        if (rd.texture !== td.texture) {
                            rd.texture = td.texture;
                            // isDirty = true;
                        }

                        if (rd.layer !== layer) {
                            rd.layer = layer;
                            isDirty = true;
                        }

                        rd.isMult = true; //强制参与多纹理

                        // if (JSB) rd._renderDrawInfo = info;

                        //更新renderdata hash
                        isDirty && rd.updateHash();

                        if (this.dataDirty) rd.dataDirty = 1;

                        // NOTE: 由于 commitComp 只支持单张纹理, 故分多次提交
                        ui.commitComp(this, td.renderData, td.texture, this._assembler, null);

                        j++;

                    }
                }
            }

            this.dataDirty = false;
            this.node._static = true;
        }
    }
}


game.once(Game.EVENT_ENGINE_INITED, () => {
    if (EDITOR || MultBatch2D.native) return; //|| JSB

    inject_Label();
    inject_Sprite();
    inject_Renderdata();
    inject_TiledLayer();
    inject_MotionStreak();

    director.on(Director.EVENT_AFTER_DRAW, (dt) => {
        MultBatch2D.reset();
        _cacheUseCount = 0;
    });


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 多纹理合批，合批核心过程修改
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const Batcher2D: any = cclegacy.internal.Batcher2D.prototype;

    Batcher2D.isMult = false; //多纹理标记
    Batcher2D.isNative = JSB; //原生的开关
    Batcher2D.cacheTextures = []; //纹理缓存数据
    Batcher2D.currMaterial = null;//当前指定材质
    Object.defineProperty(Batcher2D, "_currMaterial", {
        get: function () {
            return this.currMaterial;
        },
        set: function (material: any) {

            //检测多纹理材质，接替 _currMaterial
            let rd = this._currRenderData; //重置检测
            if (material == this._emptyMaterial) rd = null;
            // if (this.currMaterial === material) return;
            this.currMaterial = getMultMaterial(material, rd);
            this.isMult = false;
            if (MultBatch2D.enable) {
                if (this.currMaterial && this.currMaterial.isMult) {
                    this.cacheTextures = this.currMaterial.cacheTextures;
                    this.isMult = true; //当前 batcher 多纹理标记
                }
            }
        }
    });


    const Stage_ENTER_LEVEL = 2;
    const Stage_ENTER_LEVEL_INVERTED = 6;
    //@ts-ignore
    type TextureBase = __private._cocos_asset_assets_texture_base__TextureBase;
    Batcher2D.commitComp = function (comp: UIRenderer, renderData: BaseRenderData | null, frame: TextureBase | SpriteFrame | null, assembler: any, transform: Node | null) {


        let dataHash = 0;
        let mat: any = null;
        let bufferID = -1;

        if (renderData && renderData.chunk) {
            if (!renderData.isValid()) return;
            dataHash = renderData.dataHash;
            mat = renderData.material;
            bufferID = renderData.chunk.bufferId;
        }

        // Notice: A little hack, if it is for mask, not need update here, while control by stencilManger
        if (comp.stencilStage === Stage_ENTER_LEVEL || comp.stencilStage === Stage_ENTER_LEVEL_INVERTED) {
            this._insertMaskBatch(comp);
        } else {
            //@ts-ignore
            comp._stencilStage = StencilManager.sharedManager!.stage;
        }
        const depthStencilStateStage = comp.stencilStage;



        let texID = -1;
        let texture = null;
        let MB = MultBatch2D;
        let flushBatch = false;
        let isNative = this.isNative;
        //@ts-ignore
        if (MB.enable && renderData && renderData.isMult) {

            if(frame && frame.isValid)
                texture = frame.getGFXTexture();

            if(texture){
                //@ts-ignore
                if (texture.texID === undefined) texture.texID = -1;
                //@ts-ignore
                texID = texture.texID - MB.incID;
                flushBatch = texID < 0 && MB.count >= MAX_TEX;
                if (this.isMult) mat = this._currMaterial;
            }
        }

        if (flushBatch
            || this._currHash !== dataHash || dataHash === 0 || this._currMaterial !== mat
            || this._currDepthStencilStateStage !== depthStencilStateStage) {
            // Merge all previous data to a render batch, and update buffer for next render data
            this.autoMergeBatches(this._currComponent!);

            if (!isNative && renderData && !renderData._isMeshBuffer) {
                this.updateBuffer(renderData.vertexFormat, bufferID);
            }


            this._currRenderData = renderData;
            this._currHash = renderData ? renderData.dataHash : 0;
            this._currComponent = comp;
            this._currTransform = transform;
            this._currMaterial = comp.getRenderMaterial(0)!;
            this._currDepthStencilStateStage = depthStencilStateStage;
            this._currLayer = comp.node.layer;
            if (frame) {
                if (DEBUG) {
                    assert(frame.isValid, 'frame should not be invalid, it may have been released');
                }
                this._currTexture = frame.getGFXTexture();
                this._currSampler = frame.getGFXSampler();
                this._currTextureHash = frame.getHash();
                this._currSamplerHash = this._currSampler.hash;
            } else {
                this._currTexture = null;
                this._currSampler = null;
                this._currTextureHash = 0;
                this._currSamplerHash = 0;
            }
        }

        if (!isNative && assembler.fillBuffers) assembler.fillBuffers(comp, this);


        if (texture && this.isMult) {

            if (texID < 0 || MB.count === 0) {

                texID = MB.count++;
                //@ts-ignore
                //let id = texture.objectID;
                //@ts-ignore
                texture.texID = texID + MB.incID;

                let caches = this.cacheTextures;
                if (caches[texID] !== texture) {
                    caches[texID] = texture;
                    //@ts-ignore
                    texture = frame.texture;
                    if (!texture) texture = frame;
                    this._currMaterial.setProperty("texture" + texID, texture);

                }
            }

            this.fillTextureID(renderData, texID);

            if (isNative) {
                renderData!.renderDrawInfo.setMaterial(this._currMaterial);
            }

        }

    }

    //填充多纹理 id 到顶点数据
    Batcher2D.fillTextureID = function (renderData: any, texID: number) {

        // if (!renderData) return;
        let vbuf = renderData.chunk.vb;
        let uvX = 0, length = vbuf.length;
        if (renderData.dataDirty === 1) {
            for (let i = 0; i < length; i += 9) {
                uvX = ~~(vbuf[i + 3] * 100000);
                vbuf[i + 3] = uvX * 10 + texID;
            }

        } else {
            if (renderData.texID !== texID) {
                for (let i = 0; i < length; i += 9) {
                    uvX = ~~(vbuf[i + 3] * 0.1);
                    vbuf[i + 3] = uvX * 10 + texID;
                }
            }
        }
        renderData.dataDirty = 0;
        renderData.texID = texID;
    };




    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 多纹理合批，原生平台支持的修改
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    if (!EDITOR && JSB) {

        const rootProto: any = Root.prototype;
        const oldFrameMove = rootProto.frameMove;
        rootProto.frameMove = function (deltaTime: number) {
            //@ts-ignore
            director.root?.batcher2D.update();
            //director.root?.batcher2D.reset();
            oldFrameMove.call(this, deltaTime, director.getTotalFrames());

        };


        Batcher2D.update = function update() {

            const screens = this._screens;
            for (let i = 0; i < screens.length; ++i) {
                const screen = screens[i];
                const scene = screen._getRenderScene();
                if (!screen.enabledInHierarchy || !scene) {
                    continue;
                }

                // Reset state and walk
                this._opacityDirty = 0;
                this._pOpacity = 1;
                this._batchRootDepth = 0;

                this.walk(screen.node);

                this.resetRenderStates();

            }

            this._batches.clear();
            this.resetRenderStates();
            StencilManager.sharedManager!.reset();
        }

        Batcher2D.walk = function walk(node: Node, level = 0): void {
            if (!node.activeInHierarchy) {
                return;
            }
            const children = node.children;
            const uiProps = node._uiProps;
            const render = uiProps.uiComp as UIRenderer;


            // Save opacity
            const parentOpacity = this._pOpacity;
            let opacity = parentOpacity;
            // TODO Always cascade ui property's local opacity before remove it
            const selfOpacity = render && render.color ? render.color.a / 255 : 1;
            this._pOpacity = opacity *= selfOpacity * uiProps.localOpacity;
            // TODO Set opacity to ui property's opacity before remove it

            //@ts-ignore
            uiProps._opacity = opacity;  //uiProps.setOpacity(opacity);


            if (!approx(opacity, 0, EPSILON)) {

                // Render assembler update logic
                if (render && render.enabledInHierarchy) {
                    //@ts-ignore
                    if (render.useMult) render.fillBuffers(this);// for rendering
                    else {
                        this.resetRenderStates();
                    }
                }

                if (children.length > 0 && !node._static) {
                    for (let i = 0; i < children.length; ++i) {
                        const child = children[i];
                        this.walk(child, level);
                    }
                }
            }
            // Restore opacity
            this._pOpacity = parentOpacity;

            // Post render assembler update logic
            // ATTENTION: Will also reset colorDirty inside postUpdateAssembler
            if (render && render.enabledInHierarchy) {
                render.postUpdateAssembler(this);
                if ((render.stencilStage === Stage_ENTER_LEVEL || render.stencilStage === Stage_ENTER_LEVEL_INVERTED)
                    && (StencilManager.sharedManager!.getMaskStackSize() > 0)) {
                    this.autoMergeBatches(this._currComponent!);
                    this.resetRenderStates();
                    StencilManager.sharedManager!.exitMask();
                }
            }


            level += 1;
        }



        Batcher2D._insertMaskBatch = function (comp: UIRenderer | UIMeshRenderer): void {
            this.autoMergeBatches(this._currComponent!);
            this.resetRenderStates();
            //this._createClearModel();
            //this._maskClearModel!.node = this._maskClearModel!.transform = comp.node;
            const _stencilManager = StencilManager.sharedManager!;
            _stencilManager.pushMask(1);//not need object，only use length
            //_stencilManager.clear(comp); //invert
            _stencilManager.enableMask();
        }

        Batcher2D.commitModel = function (comp: UIMeshRenderer | UIRenderer, model: any, mat: Material | null): void {
            // if the last comp is spriteComp, previous comps should be batched.
            if (this._currMaterial !== this._emptyMaterial) {
                this.autoMergeBatches(this._currComponent!);
                this.resetRenderStates();
            }

            if (mat) {
                // Notice: A little hack, if it is for mask, not need update here, while control by stencilManger
                if (comp.stencilStage === Stage_ENTER_LEVEL || comp.stencilStage === Stage_ENTER_LEVEL_INVERTED) {
                    this._insertMaskBatch(comp);
                } else {
                    //@ts-ignore
                    comp._stencilStage = StencilManager.sharedManager!.stage;
                }
            }

        }

        Batcher2D.commitIA = function (renderComp: UIRenderer, ia: any, tex?: TextureBase, mat?: Material, transform?: Node): void {
            // if the last comp is spriteComp, previous comps should be batched.
            if (this._currMaterial !== this._emptyMaterial) {
                this.autoMergeBatches(this._currComponent!);
                this.resetRenderStates();
            }

            if (renderComp) {
                //@ts-ignore
                renderComp._stencilStage = StencilManager.sharedManager!.stage;
            }
        }

        Batcher2D.autoMergeBatches = function (renderComp?: UIRenderer): void { }

    }
});

//*/