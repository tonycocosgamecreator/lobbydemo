import { AudioClip, AudioSource, Node, error, warn } from 'cc';
import Timer from '../utils/timer';
import RecordManager from './record-manager';
import ModuleManager from './module-manager';
import { bDebug } from '../define';
import { Tools } from '../utils/tools';
import { log } from 'cc';
import BaseManager from './base-manager';
import BaseGlobal from '../message/base-global';
import { BaseMessage } from '../message/base-message';

declare type AudioManagerSaveInfo = {
    lastSavedTime: number;
    isMusicEnabled: boolean;
    isSoundEnabled: boolean;
};

declare type StopEnabledSoundInfo = {
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
}

export default class AudioManager extends BaseManager {
    //===============================变量定义==============================//
    /**
     * 需要存档的数据
     */
    private static _data: AudioManagerSaveInfo | null = null;

    private static bgmAudioSource: AudioSource;
    private static sfxAudioSource: AudioSource;
    /**
     * 当前正在播放的是哪一个模块的音乐音效
     */
    private static currentModuleName: string;
    /**
     * 当前正在播放的背景音乐的名字，只有名字没有路径哈
     */
    private static currentBgmName: string;
    /**
     * 背景音乐是否暂停
     */
    private static isPausing = false;
    /**
     * 可以停止的音效的uuid
     */
    private static _stopEnabledSoundUuid: number = 0;

    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'AudioManager';

    /**
     * 正在播放的，可以暂停的音效
     */
    private static _stopEnabledSoundMap: { [uuid: number]: StopEnabledSoundInfo } = {};
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
        this.bgmAudioSource = this._createAudioSource('__GLOBAL_BGM_AUDIO_SOURCE__');
        this.sfxAudioSource = this._createAudioSource('__GLOBAL_SFX_AUDIO_SOURCE__');
        this._stopEnabledSoundUuid = 0;
        BaseGlobal.registerListeners(this, {
            [BaseMessage.ON_ENTER_BACK_GROUND]: this._onMessageOnBackGround,
            [BaseMessage.ON_ENTER_FORGOUND]: this._onMessageOnForground,
        });
    }

    /**
     * 清理自己的数据结构
     * 此方法不会被主动调用，请在自己需要的时候自己调用
     */
    public static clear() {
        if (this.bgmAudioSource) {
            this.bgmAudioSource.stop();
        }
        this.isPausing = false;
        this.currentBgmName = '';
        this.currentModuleName = '';
        Tools.forEachMap(this._stopEnabledSoundMap, (uuid, info) => {
            const source = info.source;
            source.stop();
            source.node.destroy();
            info = null;
        });
        this._stopEnabledSoundMap = {};
        this._stopEnabledSoundUuid = 0;
    }

    /**
     * 加载自己的本地存档
     * 不需要自己主动调用，会在注册时调用一次，或者在重置存档的时候回调
     * 会在init方法后被调用
     */
    public static loadRecord() {
        this._getNewData();
        const record = RecordManager.getRecord(this.KEY);
        if (record) {
            this._data.isMusicEnabled = record.isMusicEnabled;
            this._data.isSoundEnabled = record.isSoundEnabled;
            this._data.lastSavedTime = record.lastSavedTime;
        }
    }
    /**
     * 存档
     * 此方法时一个protected的，所以，所有的存档操作都需要在manager内部处理，请勿在view中调用
     * 调用方式应该是,xxxManager.xxxx()->这个方法改变了一些需要存档的东西，主动触发存档操作
     */
    public static saveRecord() {
        this._data.lastSavedTime = Timer.time();
        RecordManager.setRecord(this.KEY, this._data);
    }
    /**
     * 每一帧回调一次
     * @param dt
     */
    public static update(dt: number) {
        if (this.isPausing) {
            return;
        }

        Tools.forEachMap(this._stopEnabledSoundMap, (uuid, info) => {
            if (info.isPaused) {
                return;
            }
            info.currentTime += dt;
            if (info.currentTime >= info.duration && !info.loop) {
                //时间到了，且不循环的
                //播放完毕
                this._destroyStopEnabledSound(uuid);
            }
        });
    }

    private static _destroyStopEnabledSound(uuid: number) {
        let info = this._stopEnabledSoundMap[uuid];
        bDebug && console.log('当前所有可停止的音效：', this._stopEnabledSoundMap);
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

    //====================================公共方法===============================//

    public static get isMusicEnabled() {
        return this._data.isMusicEnabled;
    }

    public static set isMusicEnabled(val: boolean) {
        if (val != this._data.isMusicEnabled) {
            this._data.isMusicEnabled = val;
            this._data.isMusicEnabled ? this.resumeMusic() : this.pauseMusic();
            this.saveRecord();
            BaseGlobal.sendMsg(BaseMessage.MUSIC_STATUS_CHANGED, val);
        }
    }

    public static get isSoundEnabled() {
        return this._data.isSoundEnabled;
    }

    public static set isSoundEnabled(val: boolean) {
        if (this._data.isSoundEnabled != val) {
            this._data.isSoundEnabled = val;
            this.saveRecord();
            if (!val) {
                this.sfxAudioSource.stop();
                this.sfxAudioSource.clip = null;
                this.sfxAudioSource.volume = 0;
            } else {
                this.sfxAudioSource.volume = 1;
            }
            BaseGlobal.sendMsg(BaseMessage.SOUND_STATUS_CHANGED, val);
        }
    }

    /**
     * 开始播放指定的背景音乐
     * 注意：无论现在是否主动关闭了音乐功能，都会去加载对应的资源
     * @param moduleName
     * @param fileName
     */
    public static playBgm(moduleName: string, fileName: string) {
        const module = ModuleManager.getModuleAlreadyExist(moduleName);
        if (!module) {
            return;
        }
        const path = 'audios/' + fileName;

        const clip = module.getAssetAlreadyExit(path, AudioClip);
        if (!clip) {
            bDebug && error('[' + this.KEY + ']错误：找不到指定背景音乐文件：' + path, moduleName);
            return;
        }
        this.bgmAudioSource.stop();
        this.bgmAudioSource.clip = clip;
        this.bgmAudioSource.loop = true;
        //this.bgmAudioSource.volume  = 1;
        if (!this.isPausing && this.isMusicEnabled) {
            //如果没有暂停的,直接开始播放
            this.bgmAudioSource.play();
        }
        this.currentBgmName = fileName;
        this.currentModuleName = moduleName;
    }

    /**
     * 播放一个音效
     * @param moduleName
     * @param fileName
     */
    public static playSound(moduleName: string, fileName: string) {
        if (!this.isSoundEnabled || this.isPausing) {
            //不支持或者暂停状态下，不再加载资源
            return;
        }
        const module = ModuleManager.getModuleAlreadyExist(moduleName);
        if (!module) {
            //有可能正在释放或者加载中
            bDebug && warn('[' + this.KEY + ']错误：播放音效，找不到模块：' + moduleName);
            return;
        }

        const path = 'audios/' + fileName;
        const clip = module.getAssetAlreadyExit(path, AudioClip);
        if (!clip) {
            bDebug && error('[' + this.KEY + ']错误：找不到指定音效文件：' + path, moduleName);
            return;
        }

        //因为异步加载，所有这个地方还需要做安全检查，防止中途玩家关闭音效，导致加载完毕后又播放出来了
        if (!this.isSoundEnabled || this.isPausing) {
            return;
        }
        bDebug && warn('play sound : ', fileName);
        //直接播放一次
        this.sfxAudioSource.playOneShot(clip);
    }
    /**
     * 播放一个可以暂停的音效
     * @param moduleName 
     * @param fileName 
     * @param bLoop 是否循环播放
     */
    public static playStopEnabledSound(moduleName: string, fileName: string, bLoop: boolean = false) {
        if (!this.isSoundEnabled || this.isPausing) {
            //不支持或者暂停状态下，不再加载资源
            return -1;
        }

        const module = ModuleManager.getModuleAlreadyExist(moduleName);
        if (!module) {
            //有可能正在释放或者加载中
            bDebug && warn('[' + this.KEY + ']错误：播放音效，找不到模块：' + moduleName);
            return -1;
        }

        const path = 'audios/' + fileName;
        const clip = module.getAssetAlreadyExit(path, AudioClip);
        if (!clip) {
            bDebug && error('[' + this.KEY + ']错误：找不到指定音效文件：' + path, moduleName);
            return -1;
        }

        const uuid = this._getNextStopEnabledSoundUuid();
        const source = this._createAudioSource('__STOP_ENABLED_SOUND__' + uuid);
        source.clip = clip;
        source.loop = bLoop;
        source.play();
        bDebug && console.log('play stopped sound : ', fileName, ',duration = ', clip.getDuration(), 's');
        this._stopEnabledSoundMap[uuid] = {
            uuid,
            source,
            clip,
            loop: bLoop,
            moduleName,
            duration: clip.getDuration(),
            currentTime: 0,
            isPaused: false,
        };
        bDebug && console.warn('play stop enabled sound : ', moduleName, clip.name, uuid);
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
     * 单独暂停一个音效
     * @param uuid 
     */
    public static pauseStopEnabledSound(uuid: number) {
        const info = this._stopEnabledSoundMap[uuid];
        if (info) {
            info.source.pause();
            info.isPaused = true;
            bDebug && console.log('pause enabled sound : ', info.moduleName, info.clip.name);
        }
    }
    /**
     * 恢复一个被主动暂停的音效
     * @param uuid 
     */
    public static resumeStopEnabledSound(uuid: number) {
        const info = this._stopEnabledSoundMap[uuid];
        if (info && info.isPaused) {
            info.source.play();
            info.isPaused = false;
            bDebug && console.log('resume enabled sound : ', info.moduleName, info.clip.name);
        }
    }

    /**
     * 暂停所有音乐
     */
    public static pauseMusic() {
        if (this.isMusicEnabled) {
            return;
        }
        this.bgmAudioSource.pause();
        this.isPausing = true;
    }
    /**
     * 恢复背景音乐
     */
    public static resumeMusic() {
        if (!this.isMusicEnabled) {
            return;
        }
        this.isPausing = false;
        this.bgmAudioSource.play();
    }

    //====================================私有方法==================================//
    /**
     * 获取全新的数据
     */
    private static _getNewData() {
        this._data = {
            lastSavedTime: Timer.time(),
            isMusicEnabled: true,
            isSoundEnabled: true,
        };
    }
    /**
     * 获取下一个可以停止的音效的uuid
     * @returns 
     */
    private static _getNextStopEnabledSoundUuid() {
        this._stopEnabledSoundUuid += 1;
        return this._stopEnabledSoundUuid;
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

    //====================================事件监听===========================//
    /**
     * 游戏进入后台
     */
    private static _onMessageOnBackGround() {
        this.pauseMusic();
        //将所有正在播放的音效暂停
        //这里只需要暂停，不需要设置isPaused标记，因为这不是被用户主动暂停，而是退到后台
        Tools.forEachMap(this._stopEnabledSoundMap, (uuid, info) => {
            if (!info.isPaused) {
                info.source.pause();
            }
        });
    }

    private static _onMessageOnForground() {
        this.resumeMusic();
        //将所有正在播放的音效恢复
        Tools.forEachMap(this._stopEnabledSoundMap, (uuid, info) => {
            if (!info.isPaused) {
                //所有非主动暂停的音效都恢复
                info.source.play();
            }
        });
    }
}
