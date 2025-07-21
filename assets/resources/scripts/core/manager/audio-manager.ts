import { AudioSource, AudioClip, Node } from "cc";
import BaseManager from "./base-manager";
import RecordManager from "./record-manager";
import { bDebug, EmptyCallback } from "../define";
import ModuleManager from "./module-manager";

interface CONTEXT {
    isMusicEnabled: boolean;
    isSoundEnabled: boolean;
    musicVolume: number;
    soundVolume: number;
}

interface StopEnabledSoundInfo {
    uuid: number;
    source: AudioSource;
    /**
     * 音频剪辑
     */
    clip: AudioClip;
    /**
     * 是否循环
     */
    loop: boolean;
    /**
     * 模块名
     */
    moduleName: string;
    /**
     * 持续时间 ，秒
     */
    duration: number;
    /**
     * 已经经过的时间
     */
    currentTime: number;
    /**
     * 是否暂停了
     */
    isPaused: boolean;
    /**
     * 播放完毕的回调函数
     */
    call?: EmptyCallback;
}

export default class AudioManager extends BaseManager {
    public static KEY = 'AudioManager';
    public static BundleName = 'resources';

    protected static datas: CONTEXT = {
        isMusicEnabled: true,
        isSoundEnabled: true,
        musicVolume: 1,
        soundVolume: 1,
    };

    public static init() {
        super.init();
        this.bgmAudioSource = this._createAudioSource("bgmAudioSource");
        this.sfxAudioSource = this._createAudioSource("sfxAudioSource");
    }

    /**
     * 加载自己的本地存档
     * 不需要自己主动调用，会在注册时调用一次，或者在重置存档的时候回调
     * 会在init方法后被调用
     */
    public static loadRecord() {
        const data = localStorage.getItem(this.KEY);
        if (data) {
            const record = JSON.parse(data);
            if (record) {
                const keys = Object.keys(record);
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const value = record[key];
                    this.datas[key] = value;
                }
            }
        }
    }
    /**
     * 存档
     * 此方法时一个protected的，所以，所有的存档操作都需要在manager内部处理，请勿在view中调用
     * 调用方式应该是,xxxManager.xxxx()->这个方法改变了一些需要存档的东西，主动触发存档操作
     */
    protected static saveRecord() {
        RecordManager.setRecord(this.KEY, this.datas);
        localStorage.setItem(this.KEY, JSON.stringify(this.datas));
    }

    /**
     * 背景音乐是否开启
     * @returns 
     */
    public static isMusicEnabled(): boolean {
        return this.datas.isMusicEnabled;
    }
    /**
     * 设置背景音乐是否开启
     * @param b 
     */
    public static setMusicEnabled(b: boolean) {
        this.datas.isMusicEnabled = b;
        this.saveRecord();
    }
    /**
     * 音效是否开启
     * @returns 
     */
    public static isSoundEnabled(): boolean {
        return this.datas.isSoundEnabled;
    }
    /**
     * 设置音效是否开启
     * @param b 
     */
    public static setSoundEnabled(b: boolean) {
        this.datas.isSoundEnabled = b;
        this.saveRecord();
    }

    //====================================音频管理=================================//
    private static bgmAudioSource: AudioSource | null = null;
    private static sfxAudioSource: AudioSource | null = null;
    /**
     * 可暂停/停止的音效的uuid
     */
    protected static _stopEnabledSoundUuid = 0;

    /**
     * 正在播放的，可以暂停的音效
     */
    private static _stopEnabledSoundMap: { [uuid: number]: StopEnabledSoundInfo } = {};
    /**
     * 背景音乐是否暂停
     */
    protected static _isMusicPause: boolean = false;
    /**
     * 当前播放的背景音乐信息
     */
    protected static _bmgInfo: {
        bundleName: string;
        path: string;
    } | null = null;

    /**
     * 播放指定模块，指定路径的背景音乐
     * @param bundleName 
     * @param path 完整路径 audios/xxx.mp3
     * @param loop 
     */
    public static playMusic(bundleName: string, path: string, loop: boolean = true, valume: number = 1) {
        if (!this.isMusicEnabled()) {
            bDebug && console.warn("BGM is disabled,can't play music -> ", bundleName, path);
            return;
        }
        if (this._isMusicPause) {
            bDebug && console.warn("BGM is paused,can't play music -> ", bundleName, path);
            return;
        }
        const module = ModuleManager.getModuleAlreadyExist(bundleName);
        if (!module) {
            bDebug && console.warn("BGM module not exist,can't play music -> ", bundleName, path);
            return;
        }
        const clip = module.getAudio(path);
        if (!clip) {
            bDebug && console.warn("BGM clip not exist,can't play music -> ", bundleName, path);
            return;
        }
        if (this._bmgInfo) {
            //检查是否要求播放同一首歌
            if (this._bmgInfo.bundleName === bundleName && this._bmgInfo.path === path) {
                bDebug && console.warn("BGM is already playing,can't play music -> ", bundleName, path);
                return;
            }
        }
        this.bgmAudioSource.stop();
        this.bgmAudioSource.clip = clip;
        this.bgmAudioSource.loop = loop;
        this.bgmAudioSource.volume = valume;
        this.bgmAudioSource.play();
        this._bmgInfo = {
            bundleName,
            path,
        }
    }

    public static pauseMusic() {
        if (!this._bmgInfo) {
            bDebug && console.warn("BGM is not playing,can't pause music");
            return;
        }
        if (this.bgmAudioSource && this.bgmAudioSource.playing) {
            this.bgmAudioSource.pause();
            this._isMusicPause = true;
        }
    }

    public static resumeMusic() {
        if (!this._bmgInfo) {
            bDebug && console.warn("BGM is not playing,can't resume music");
            return;
        }
        if (this.bgmAudioSource && this._isMusicPause && !this.bgmAudioSource.playing) {
            this.bgmAudioSource.play();
            this._isMusicPause = false;
        }
    }
    /**
     * 播放指定模块，指定路径的音效
     * @param bundleName 
     * @param path  完整路径 audios/xxx.mp3
     * @param valume 
     * @returns 
     */
    public static playSfx(bundleName: string, path: string, valume: number = 1) {
        if (!this.isSoundEnabled()) {
            bDebug && console.warn("SFX is disabled,can't play sfx -> ", bundleName, path);
            return;
        }
        const module = ModuleManager.getModuleAlreadyExist(bundleName);
        if (!module) {
            bDebug && console.warn("SFX module not exist,can't play sfx -> ", bundleName, path);
            return;
        }
        const clip = module.getAudio("audios/" + path);
        if (!clip) {
            bDebug && console.warn("SFX clip not exist,can't play sfx -> ", bundleName, path);
            return;
        }
        const audioSource = this.sfxAudioSource;
        audioSource.playOneShot(clip, valume);
    }
    /**
     * 播放一个可暂停的音效
     * @param bundleName 
     * @param path 完整路径 audios/xxx.mp3
     * @param loop 
     * @param valume 
     * @param call 播放完毕的回调函数,可选，且仅对非循环有效
     * @returns 
     */
    public static playStopEnabledSfx(bundleName: string, path: string, loop: boolean = false, valume: number = 1, call?: EmptyCallback) {
        if (!this.isSoundEnabled()) {
            bDebug && console.warn("SFX is disabled,can't play sfx -> ", bundleName, path);
            return;
        }
        const module = ModuleManager.getModuleAlreadyExist(bundleName);
        if (!module) {
            bDebug && console.warn("SFX module not exist,can't play sfx -> ", bundleName, path);
            return;
        }
        const clip = module.getAudio("audios/" + path);
        if (!clip) {
            bDebug && console.warn("SFX clip not exist,can't play sfx -> ", bundleName, path);
            return;
        }
        const uuid = this._getNextStopEnabledSoundUuid();
        const source = this._createAudioSource(`stopEnabledSfx_${uuid}`);
        source.clip = clip;
        source.volume = valume;
        source.loop = loop;
        source.play();
        this._stopEnabledSoundMap[uuid] = {
            uuid,
            source,
            clip,
            loop,
            duration: clip.getDuration(),
            currentTime: 0,
            isPaused: false,
            moduleName: bundleName,
            call,
        }
        if (call && !loop) {
            source.node.once(AudioSource.EventType.ENDED, () => {
                call();
                this._destroyStopEnabledSound(uuid);
            });
        }
        return uuid;
    }
    /**
     * 
     * @param uuid 直接停止播放指定的音效
     */
    public static stopStopEnabledSound(uuid: number) {
        this._destroyStopEnabledSound(uuid);
    }

    /**
     * 创建一个音乐音效/音效播放器
     * @param name
     * @returns
     */
    private static _createAudioSource(name: string) {
        const node = new Node(name);
        const audioSource = node.addComponent(AudioSource);
        return audioSource;
    }

    /**
     * 获取下一个可以停止的音效的uuid
     * @returns 
     */
    private static _getNextStopEnabledSoundUuid() {
        this._stopEnabledSoundUuid += 1;
        return this._stopEnabledSoundUuid;
    }

    private static _destroyStopEnabledSound(uuid: number) {
        let info = this._stopEnabledSoundMap[uuid];
        //bDebug && console.log('当前所有可停止的音效：',this._stopEnabledSoundMap);
        if (info) {
            const node = info.source.node;
            info.source.stop();
            info.source.clip = null;
            info.source.volume = 0;
            //info.clip.destroy();
            info.clip = null;
            //info.source.destroy();
            info.source = null;
            node.destroy();
            delete this._stopEnabledSoundMap[uuid];
            info = null;
            bDebug && console.warn('destroy stop enabled sound : ', uuid);
        } else {
            //bDebug && console.error('destroy stop enabled sound error : ',uuid);
        }
    }
}