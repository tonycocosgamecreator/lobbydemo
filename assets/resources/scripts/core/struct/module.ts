import { resources } from "cc";
import { assetManager } from "cc";
import { Prefab } from "cc";
import { AssetManager, SpriteFrame } from "cc";
import { Tools } from "../utils/tools";
import TaskManager from "../utils/task-manager";
import { AudioClip } from "cc";
import { BufferAsset } from "cc";
import LanguageManager from "../manager/language-manager";
import { Asset } from "cc";
import { AssetType } from "../define";
import { SpriteAtlas } from "cc";
/**
 * 当前bundle状态
 */
export enum ModuleState {
    /**没有状态-未加载 */
    None,
    /**
     * 加载中
     */
    Loading,
    /**
     * 加载完成
     */
    Loaded,
}

export default class Module {
    /**
     * 当前模块的名称
     */
    protected _name: string;
    /**
     * 当前模块的bundle
     */
    protected _bundle: AssetManager.Bundle | null = null;
    /**
     * 当前模块的状态
     */
    protected _state: ModuleState = ModuleState.None;
    /**
     * 当前模块的prefab
     */
    protected _prefabs: { [path: string]: Prefab } = {};

    /**
     * 当前模块的spriteframe
     */
    protected _spriteframes: { [path: string]: SpriteFrame } = {};
    /**
     * 当前模块的spriteAtlas
     */
    protected _spriteAtlas: { [path: string]: SpriteAtlas } = {};
    /**
     * 当前模块的audio
     */
    protected _audios: { [path: string]: AudioClip } = {};
    /**
     * 所有预加载的spriteframe的路径
     * 用于加载完成后，从bundle中读出来
     */
    protected _spriteframe_urls: string[] = [];
    /**
     * 所有预加载的audio的路径
     * 用于加载完成后，从bundle中读出来
     */
    protected _audio_urls: string[] = [];
    /**
     * 所有预加载的prefab的路径
     * 用于加载完成后，从bundle中读出来
     */
    protected _prefab_urls: string[] = [];

    /**
     * 所有预加载的spriteAtlas的路径
     * 用于加载完成后，从bundle中读出来
     */
    protected _spriteAtlas_urls: string[] = [];


    public get name(): string {
        return this._name;
    }

    public get bundle(): AssetManager.Bundle | null {
        return this._bundle;
    }

    public get state(): ModuleState {
        return this._state;
    }
    /**
     * 当前模块是否已经加载完成
     */
    public get isLoaded(): boolean {
        return this._state == ModuleState.Loaded;
    }

    constructor(name: string) {
        this._name = name;
        if (name == AssetManager.BuiltinBundleName.RESOURCES) {
            this._bundle = resources;
            this._state = ModuleState.Loaded;
        }
    }

    /**
     * 卸载这个bundle
     */
    public releaseBundle() {
        if (!this.isValid) {
            return;
        }
        this._bundle.releaseAll();
        //卸载已经缓存起来的
        assetManager.removeBundle(this._bundle);
        this._bundle = null;
        this._state = ModuleState.None;
        this._prefabs = {};
        this._spriteframes = {};
        this._audios = {};
        this._prefab_urls = [];
        this._spriteframe_urls = [];
        this._audio_urls = [];
        this._spriteAtlas = {};
    }

    public get isValid(): boolean {
        if (!this._bundle || this._state != ModuleState.Loaded) {
            return false;
        }
        return true;
    }
    /**
     * 根据路径返回预制体
     * @param path 
     * @returns 
     */
    public getPrefab(path: string): Prefab {
        if (!this.isValid) {
            return null;
        }
        const prefab = this._prefabs[path];
        if (!prefab) {
            return null;
        }
        return prefab;
    }
    /**
     * 根据路径加载预制体
     * @param path 
     * @returns 
     */
    public async loadPrefab(path: string): Promise<Prefab | null> {
        if (!this.isValid) {
            return null;
        }
        const prefab = this._prefabs[path];
        if (prefab) {
            return prefab;
        }
        return new Promise((resolve) => {
            this._bundle?.load(path, Prefab, (err, prefab) => {
                if (err || !prefab) {
                    console.error(`Module.loadPrefab ${path} error: ` + err);
                    resolve(null);
                    return;
                }
                this._prefabs[path] = prefab;
                resolve(prefab);
            });
        });
    }

    /**
     * 根据路径返回spriteAtlas
     * @param path 
     * @returns 
     */
    public getSpriteAtlas(path: string): SpriteAtlas | null {
        if (!this.isValid) {
            return null;
        }
        if (!path || path == '') {
            console.error('Module.getSpriteAtlas path is empty');
            return null;
        }
        const spriteAtlas = this._spriteAtlas[path];
        if (!spriteAtlas) {
            console.error(`Module.getSpriteAtlas ${path} not found`);
            return null;
        }
        return spriteAtlas;
    }
    /**
     * 根据路径返回spriteframe
     * @param path 
     * @returns 
     */
    public getSpriteFrame(path: string): SpriteFrame | null {
        if (!this.isValid) {
            return null;
        }
        if (!path || path == '') {
            console.error('Module.getSpriteFrame path is empty');
            return null;
        }
        if (!path.endsWith('spriteFrame')) {
            path += '/spriteFrame';
        }
        const spriteFrame = this._spriteframes[path];
        if (!spriteFrame) {
            console.error(`Module.getSpriteFrame ${path} not found`);
            return null;
        }
        return spriteFrame;
    }
    /**
     * 根据路径返回spriteframes,如果找不到，返回null
     * 返回时，会按照传入的urls的顺序返回
     * @param urls 
     * @returns 
     */
    public getSpriteFrames(urls: string[]): SpriteFrame[] {
        if (!this.isValid) {
            return [];
        }
        const spriteFrames: SpriteFrame[] = [];
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const spriteFrame = this._spriteframes[url];
            if (spriteFrame) {
                spriteFrames.push(spriteFrame);
            } else {
                spriteFrames.push(null);
            }
        }
        return spriteFrames;
    }
    /**
     * 根据路径返回audio
     * @param path 
     * @returns 
     */
    public getAudio(path: string): AudioClip | null {
        if (!this.isValid) {
            return null;
        }
        const audio = this._audios[path];
        if (!audio) {
            return null;
        }
        return audio;
    }


    /**
     * 仅加载bundle的脚本和配置，不加载bundle中的所有资源
     * config.json和index.js
     */
    public async loadBundle() {
        if (this.state != ModuleState.None) {
            console.warn('module [' + this._name + '] is ' + ModuleState[this.state]);
            return;
        }
        this._state = ModuleState.Loading;
        const self = this;
        return new Promise((resolve) => {
            assetManager.loadBundle(self._name, (err, bundle) => {
                if (err || !bundle) {
                    console.error('module [' + self._name + '] load bundle error : ' + err);
                    self._state = ModuleState.None;
                    resolve(false);
                    return;
                }
                self._bundle = bundle;
                self._state = ModuleState.Loaded;
                resolve(true);
            });
        });
    }

    /**
     * 分析bundle中的资源
     * @param task 
     */
    public analyzeBundle(task: TaskManager) {
        const bundle = this._bundle;

        if (!bundle) {
            return;
        }
        const config = bundle['config'];
        //path-uuid
        const maps = config['paths']['map'];

        const self = this;

        const languageKey = LanguageManager.languageKey;
        let prefabs: string[] = [];
        Tools.forEachMap(maps, (k, info) => {
            if (k.startsWith('prefabs')) {
                //预加载所有预制体
                prefabs.push(k);
                self._prefab_urls.push(k);
            } else if (k.startsWith('audios')) {
                //预加载音效
                task.addResource(k, AudioClip, null, true, bundle);
                self._audio_urls.push(k);
            } else if (k.startsWith('textures') || k.startsWith('BigTextures')) {
                if (k.endsWith('spriteFrame')) {
                    task.addResource(k, SpriteFrame, null, true, bundle);
                    self._spriteframe_urls.push(k);
                }
            } else if (k.includes("spine")) {

            } else if (k.startsWith('protos') || k.startsWith('cfg')) {
                task.addResource(k, BufferAsset, null, true, bundle);
            } else if (k.startsWith('i18n')) {
                if (k.includes('textures') && k.endsWith('spriteFrame')) {
                    if (k.includes(languageKey)) {
                        self._spriteframe_urls.push(k);
                        task.addResource(k, SpriteFrame, null, true, bundle);
                    }
                } else {
                    //spine
                    //console.error(`Module.doAnalysisBundle i18n ${k} not support,快找bobo`);
                }
            } else if (k.startsWith('plists')) {
                if (k.split('/').length == 2) {
                    task.addResource(k, SpriteAtlas, null, true, bundle);
                    self._spriteAtlas_urls.push(k);
                }
            }
        });
        //将所有预制体放到最后处理
        for (let i = 0; i < prefabs.length; i++) {
            const url = prefabs[i];
            task.addResource(url, Prefab, null, true, bundle);
        }
    }
    /**
     * 当加载完成以后，调用初始化
     */
    public onLoadSuccessToInit() {
        const bundle = this._bundle;
        if (!bundle) {
            return;
        }
        for (let i = 0; i < this._prefab_urls.length; i++) {
            const url = this._prefab_urls[i];
            const prefab = bundle.get(url, Prefab);
            if (prefab) {
                this._prefabs[url] = prefab;
            } else {
                console.error(`Module.onLoadSuccessToInit ${url} not found`);
            }
        }
        for (let i = 0; i < this._spriteframe_urls.length; i++) {
            const url = this._spriteframe_urls[i];
            const spriteFrame = bundle.get(url, SpriteFrame);
            if (spriteFrame) {
                this._spriteframes[url] = spriteFrame;
            } else {
                console.error(`Module.onLoadSuccessToInit ${url} not found`);
            }
        }
        for (let i = 0; i < this._audio_urls.length; i++) {
            const url = this._audio_urls[i];
            const audio = bundle.get(url, AudioClip);
            if (audio) {
                this._audios[url] = audio;
            } else {
                console.error(`Module.onLoadSuccessToInit ${url} not found`);
            }
        }
        for (let i = 0; i < this._spriteAtlas_urls.length; i++) {
            let url = this._spriteAtlas_urls[i];
            const spriteAtlas = bundle.get(url, SpriteAtlas);
            if (spriteAtlas) {
                this._spriteAtlas[url] = spriteAtlas;
            } else {
                console.error(`Module.onLoadSuccessToInit ${url} not found`);
            }
        }
    }
    /**
     * 直接获取一个已经加载的资源
     * 调用的时候需要注意你自己要预先加载到内存中
     * @param url
     * @param assetType
     */
    public getAssetAlreadyExit<T extends Asset>(url: string, assetType: AssetType<T>): T | null {
        if (!this.isValid) {
            return null;
        }
        return this.bundle.get(url, assetType);
    }
}
