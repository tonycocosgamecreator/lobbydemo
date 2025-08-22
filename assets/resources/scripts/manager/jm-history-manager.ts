import { bDebug } from "db://assets/resources/scripts/core/define";
import { GameEvent } from "db://assets/resources/scripts/define";
import { Global } from "db://assets/resources/scripts/global";
import BaseManager from "../core/manager/base-manager";
import UIHelper from "../network/helper/ui-helper";
import { MessageSender } from "../network/net/message-sender";

export default class JmHistoryManager extends BaseManager{
    
    //=============================子类需要自己实现的方法===========================//
    /**
     * 存档的KEY,也是管理器的key
     */
    public static KEY = 'JmHistoryManager';

    /**
     * 清理自己的数据结构
     * 此方法不会被主动调用，请在自己需要的时候自己调用
     */
    public static clear() {
        this._pageIndex = 1;
        this._maxPageIndex = 1;
        this._isLastPage = false;
        this._datas = [];
    }

    /**
     * 加载自己的本地存档
     * 不需要自己主动调用，会在注册时调用一次，或者在重置存档的时候回调
     * 会在init方法后被调用
     */
    public static loadRecord() {}
    /**
     * 存档
     * 此方法时一个protected的，所以，所有的存档操作都需要在manager内部处理，请勿在view中调用
     * 调用方式应该是,xxxManager.xxxx()->这个方法改变了一些需要存档的东西，主动触发存档操作
     */
    protected static saveRecord() {}
    /**
     * 每一帧回调一次
     * @param dt
     */
    public static update(dt: number) {}
    /**
     * 网络消息拦截器
     * @param msgType
     * @param data
     * @returns 如果返回true，说明消息被框架拦截了，不需要继续向下传递
     */
    public static onNetMessage(msgType: string, data: any): boolean {
        if(msgType == jmbaccarat.Message.MsgSevenUpDownPlayerHistoryRsp){
            const msg = data as jmbaccarat.MsgPlayerHistoryRsp;
            const result = msg.result;
            if(result && result.err_code != commonrummy.RummyErrCode.EC_SUCCESS){
                //处理错误
                bDebug && console.error('JmHistoryManager onNetMessage error', result.err_code, result.err_desc);
                UIHelper.showToastId(resourcesDb.I18N_RESOURCES_DB_INDEX.TIP_HISTORY_GET_FAILED);
                return true;
            }
            let is_last = msg.IsLast;
            if(is_last == undefined || is_last == null){
                is_last = false;
            }
            this._isLastPage = is_last;
            const max_page_num = msg.max_page_num;
            if(max_page_num == undefined || max_page_num == null){
                this._maxPageIndex = 1;
            }else{
                this._maxPageIndex = max_page_num;
            }
            this._pageIndex++;
            const history = msg.history;
            if(history && history.length > 0){
               this._datas.push(...history); 
               Global.sendMsg(GameEvent.REQUEST_REFRESH_GAME_HISTORY);
            }
        }
        return false;
    }



    public static doNetGetHistory() {
        if(this._isLastPage) {
            //如果已经是最后一页了，就不需要再请求了
            return false;
        }
        const xlsx_config = resourcesDb.get_from_game_entrance_config_db('Jhandimunda');
        const theme_id = xlsx_config.themeId;
        const data : jmbaccarat.MsgPlayerHistoryReq ={
            theme_id,
            page : this._pageIndex
        };
        MessageSender.SendMessage(jmbaccarat.Message.MsgPlayerHistoryReq, data);
        return true;
    }


    /**
     * 当前页
     */
    private static _pageIndex : number = 1;
    /**
     * 最大页数
     */
    private static _maxPageIndex : number = 1;
    /**
     * 是否最后一页
     */
    private static _isLastPage : boolean = false;


    public static get isLastPage() : boolean {
        return this._isLastPage;
    }

    private static _datas : jmbaccarat.PlayerHistory[] = [];

    public static get datas() : jmbaccarat.PlayerHistory[] {
        return this._datas;
    }

    public static get count() : number {
        return this._datas.length;
    }

    static getIndex(index: number) {
        return this._datas[index];
    }
}