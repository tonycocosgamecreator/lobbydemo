import DataBase from 'db://assets/resources/scripts/core/struct/data-base';
import DbManager from 'db://assets/resources/scripts/core/manager/db-manager';

/**
 * 此文件由dbExporter脚本自动生成！请勿手动修改本文件！
 * 
 * 封装配置表的各项getter函数
 */
let resourcesDb = {} as any;
window['resourcesDb'] = resourcesDb;

    /** 唯一id */
resourcesDb.CUSTOMIZE_RESOURCES_STATISTICAL_DB_CUSTOMEVENTKEY = {
    'LOGO_SHOWING': 'LOGO_SHOWING',
    'LOADING_PROGRESS_BAR_SHOWING': 'LOADING_PROGRESS_BAR_SHOWING',
    'LOADING_COMPLETED': 'LOADING_COMPLETED',
}

    /** 界面名字 */
resourcesDb.PANEL_RESOURCES_STATISTICAL_DB_VIEWNAME = {
    'CustomBigWinner': 'CustomBigWinner',
    'CustomChipItem': 'CustomChipItem',
    'CustomChip': 'CustomChip',
    'CustomDesk': 'CustomDesk',
    'CustomFlyChip': 'CustomFlyChip',
    'CustomGameItem': 'CustomGameItem',
    'CustomHandle': 'CustomHandle',
    'CustomHead': 'CustomHead',
    'CustomMainHistory': 'CustomMainHistory',
    'CustomOnline': 'CustomOnline',
    'CustomRank': 'CustomRank',
    'CustomRecord': 'CustomRecord',
    'CustomTime': 'CustomTime',
    'CustomToast': 'CustomToast',
    'CustomTop': 'CustomTop',
    'CustomWinTip': 'CustomWinTip',
    'PanelCircleLoading': 'PanelCircleLoading',
    'PanelLobby': 'PanelLobby',
    'PanelSevenUpSevenDownInit': 'PanelSevenUpSevenDownInit',
    'PanelSevenUpSevenDownMain': 'PanelSevenUpSevenDownMain',
    'PanelThirdGame': 'PanelThirdGame',
}

    /** 唯一id */
resourcesDb.I18N_RESOURCES_DB_INDEX = {
    'Tip_SocketConnectFaild': 'Tip_SocketConnectFaild',
    'EC_COIN_NO_ENOUGH': 'EC_COIN_NO_ENOUGH',
    'Error': 'Error',
    'Warn': 'Warn',
    'Notice': 'Notice',
    'Confirm': 'Confirm',
    'Cancel': 'Cancel',
    'Close': 'Close',
    'ExitGame': 'ExitGame',
    'Retry': 'Retry',
    'Tip_ReconnectFailed': 'Tip_ReconnectFailed',
    'Tip_Reconnecting': 'Tip_Reconnecting',
    'TIP_ENTER_GAME_FAILED': 'TIP_ENTER_GAME_FAILED',
    'TIP_AB_BET_FAILED': 'TIP_AB_BET_FAILED',
    'Tip_No_More_Historys': 'Tip_No_More_Historys',
    'TIP_HISTORY_GET_FAILED': 'TIP_HISTORY_GET_FAILED',
    'CustomSystemTopFoot_totalbet_info_i18n': 'CustomSystemTopFoot_totalbet_info_i18n',
    'CustomSystemTopFoot_balance_info_i18n': 'CustomSystemTopFoot_balance_info_i18n',
    'CustomSystemTopFoot_label_period_i18n_skin': 'CustomSystemTopFoot_label_period_i18n_skin',
    'PanelMessageBox_cc_title_i18n': 'PanelMessageBox_cc_title_i18n',
    'PanelMessageBox_cc_cancelTitle_i18n': 'PanelMessageBox_cc_cancelTitle_i18n',
    'PanelMessageBox_cc_okTitle_i18n': 'PanelMessageBox_cc_okTitle_i18n',
    'PanelSystemMenu_title_i18n_button_records': 'PanelSystemMenu_title_i18n_button_records',
    'PanelSystemMenu_title_i18n_button_rules': 'PanelSystemMenu_title_i18n_button_rules',
    'PanelSystemMenu_title_i18n_button_sound': 'PanelSystemMenu_title_i18n_button_sound',
    'PanelSystemMenu_title_i18n_button_exit': 'PanelSystemMenu_title_i18n_button_exit',
    'AVATAR_CHANGED_FAILED': 'AVATAR_CHANGED_FAILED',
}

    /** 游戏ID */
resourcesDb.GAME_THEMEID_BUNDLE = {
    '0': 'lobby',
    '1040': 'SevenUpSevenDown',
}
    /** 游戏id（bundleId） */
resourcesDb.GAME_ENTRANCE_CONFIG_DB_ID = {
    'SevenUpSevenDown': 'SevenUpSevenDown',
    'lobby': 'lobby',
}

    /** 变量的名字 */
resourcesDb.GAME_CONFIG_DB_ID = {
}

    /** 顶部菜单名字 */
resourcesDb.MENU_TITLE_ID = {
    'Records': 0,
    'Rules': 1,
    'Sound': 2,
    'Exit': 3,
}

    /** 服务器定义 */
resourcesDb.I18N_Language_Code = {
    'en-US': 'en_us',
    'zh-CN': 'zh_cn',
    'pt-BR': 'pt_br',
    'hi-IN': 'hi_in',
    'en-IN': 'en_in',
}
    /** 语言ID */
resourcesDb.I18N_LANGUAGE_CONFIG_DB_ID = {
    'en_us': 'en_us',
    'zh_cn': 'zh_cn',
    'pt_br': 'pt_br',
    'hi_in': 'hi_in',
    'en_in': 'en_in',
}

    /** 变量的名字 */
resourcesDb.LINK_URL_PARAM_DB_ID = {
    'language': 'language',
    'token': 'token',
    'api': 'api',
    'gid': 'gid',
    'env': 'env',
    'channel': 'channel',
    'inviteId': 'inviteId',
    'zoneId': 'zoneId',
    'return_url': 'return_url',
    'player_id': 'player_id',
    'account': 'account',
}


export function _AutoResourcesExportDb_init(){
    resourcesDb.getDataBase = (dbName: string): DataBase => { return DbManager.getDataBase(dbName); }

    resourcesDb.get_customize_resources_statistical_db = (): resourcesDb.customize_resources_statistical_db => { return DbManager.getDataBase('customize_resources_statistical_db').datas; }
    resourcesDb.get_from_customize_resources_statistical_db = (customEventKey: string, bQuiet?: boolean): resourcesDb.customize_resources_statistical_db_data => { return DbManager.getDataBase('customize_resources_statistical_db')._get1(customEventKey, bQuiet); }
    resourcesDb.foreach_from_customize_resources_statistical_db = (callback: (customEventKeyKey: string, data: resourcesDb.customize_resources_statistical_db_data) => (void | boolean)) => { DbManager.getDataBase('customize_resources_statistical_db')._foreachData1(callback); }

    resourcesDb.get_gbutton_resources_statistical_db = (): resourcesDb.gbutton_resources_statistical_db => { return DbManager.getDataBase('gbutton_resources_statistical_db').datas; }
    resourcesDb.get_from_gbutton_resources_statistical_db = (viewName: string, buttonName: string, bQuiet?: boolean): resourcesDb.gbutton_resources_statistical_db_data => { return DbManager.getDataBase('gbutton_resources_statistical_db')._get2(viewName, buttonName, bQuiet); }
    resourcesDb.foreach_from_gbutton_resources_statistical_db = (callback: (viewNameKey: string, buttonNameKey: string, data: resourcesDb.gbutton_resources_statistical_db_data) => (void | boolean)) => { DbManager.getDataBase('gbutton_resources_statistical_db')._foreachData2(callback); }
    resourcesDb.getMap_from_gbutton_resources_statistical_db = (viewName: string, bQuiet?: boolean): { [buttonName: string]: resourcesDb.gbutton_resources_statistical_db_data } => { return DbManager.getDataBase('gbutton_resources_statistical_db')._get1(viewName, bQuiet); }
    resourcesDb.foreachMap_from_gbutton_resources_statistical_db = (callback: (viewNameKey: string, datas: { [buttonName: string]: resourcesDb.gbutton_resources_statistical_db_data }) => (void | boolean)) => { DbManager.getDataBase('gbutton_resources_statistical_db')._foreachData1(callback); }

    resourcesDb.get_panel_resources_statistical_db = (): resourcesDb.panel_resources_statistical_db => { return DbManager.getDataBase('panel_resources_statistical_db').datas; }
    resourcesDb.get_from_panel_resources_statistical_db = (viewName: string, bQuiet?: boolean): resourcesDb.panel_resources_statistical_db_data => { return DbManager.getDataBase('panel_resources_statistical_db')._get1(viewName, bQuiet); }
    resourcesDb.foreach_from_panel_resources_statistical_db = (callback: (viewNameKey: string, data: resourcesDb.panel_resources_statistical_db_data) => (void | boolean)) => { DbManager.getDataBase('panel_resources_statistical_db')._foreachData1(callback); }

    resourcesDb.get_protobuf_load_priority_db = (): resourcesDb.protobuf_load_priority_db => { return DbManager.getDataBase('protobuf_load_priority_db').datas; }
    resourcesDb.get_from_protobuf_load_priority_db = (bundle: string, index: number, bQuiet?: boolean): resourcesDb.protobuf_load_priority_db_data => { return DbManager.getDataBase('protobuf_load_priority_db')._get2(bundle, index, bQuiet); }
    resourcesDb.foreach_from_protobuf_load_priority_db = (callback: (bundleKey: string, index: number, data: resourcesDb.protobuf_load_priority_db_data) => (void | boolean)) => { DbManager.getDataBase('protobuf_load_priority_db')._foreachData2(callback); }
    resourcesDb.getArr_from_protobuf_load_priority_db = (bundle: string, bQuiet?: boolean): resourcesDb.protobuf_load_priority_db_data[] => { return DbManager.getDataBase('protobuf_load_priority_db')._get1(bundle, bQuiet); }
    resourcesDb.foreachArr_from_protobuf_load_priority_db = (callback: (bundleKey: string, datas: resourcesDb.protobuf_load_priority_db_data[]) => (void | boolean)) => { DbManager.getDataBase('protobuf_load_priority_db')._foreachData1(callback); }

    resourcesDb.get_i18n_resources_db = (): resourcesDb.i18n_resources_db => { return DbManager.getDataBase('i18n_resources_db').datas; }
    resourcesDb.get_from_i18n_resources_db = (index: string, bQuiet?: boolean): resourcesDb.i18n_resources_db_data => { return DbManager.getDataBase('i18n_resources_db')._get1(index, bQuiet); }
    resourcesDb.foreach_from_i18n_resources_db = (callback: (indexKey: string, data: resourcesDb.i18n_resources_db_data) => (void | boolean)) => { DbManager.getDataBase('i18n_resources_db')._foreachData1(callback); }

    resourcesDb.get_game_entrance_config_db = (): resourcesDb.game_entrance_config_db => { return DbManager.getDataBase('game_entrance_config_db').datas; }
    resourcesDb.get_from_game_entrance_config_db = (id: string, bQuiet?: boolean): resourcesDb.game_entrance_config_db_data => { return DbManager.getDataBase('game_entrance_config_db')._get1(id, bQuiet); }
    resourcesDb.foreach_from_game_entrance_config_db = (callback: (idKey: string, data: resourcesDb.game_entrance_config_db_data) => (void | boolean)) => { DbManager.getDataBase('game_entrance_config_db')._foreachData1(callback); }

    resourcesDb.get_game_config_db = (): resourcesDb.game_config_db => { return DbManager.getDataBase('game_config_db').datas; }
    resourcesDb.get_from_game_config_db = (id: string, bQuiet?: boolean): resourcesDb.game_config_db_data => { return DbManager.getDataBase('game_config_db')._get1(id, bQuiet); }
    resourcesDb.foreach_from_game_config_db = (callback: (idKey: string, data: resourcesDb.game_config_db_data) => (void | boolean)) => { DbManager.getDataBase('game_config_db')._foreachData1(callback); }

    resourcesDb.get_skin_resources_db = (): resourcesDb.skin_resources_db => { return DbManager.getDataBase('skin_resources_db').datas; }
    resourcesDb.get_from_skin_resources_db = (prefabId: string, nodeName: string, bQuiet?: boolean): resourcesDb.skin_resources_db_data => { return DbManager.getDataBase('skin_resources_db')._get2(prefabId, nodeName, bQuiet); }
    resourcesDb.foreach_from_skin_resources_db = (callback: (prefabIdKey: string, nodeNameKey: string, data: resourcesDb.skin_resources_db_data) => (void | boolean)) => { DbManager.getDataBase('skin_resources_db')._foreachData2(callback); }
    resourcesDb.getMap_from_skin_resources_db = (prefabId: string, bQuiet?: boolean): { [nodeName: string]: resourcesDb.skin_resources_db_data } => { return DbManager.getDataBase('skin_resources_db')._get1(prefabId, bQuiet); }
    resourcesDb.foreachMap_from_skin_resources_db = (callback: (prefabIdKey: string, datas: { [nodeName: string]: resourcesDb.skin_resources_db_data }) => (void | boolean)) => { DbManager.getDataBase('skin_resources_db')._foreachData1(callback); }

    resourcesDb.get_system_menu_db = (): resourcesDb.system_menu_db => { return DbManager.getDataBase('system_menu_db').datas; }
    resourcesDb.get_from_system_menu_db = (index: number, bQuiet?: boolean): resourcesDb.system_menu_db_data => { return DbManager.getDataBase('system_menu_db')._get1(index, bQuiet); }
    resourcesDb.foreach_from_system_menu_db = (callback: (index: number, data: resourcesDb.system_menu_db_data) => (void | boolean)) => { DbManager.getDataBase('system_menu_db')._foreachData1(callback); }

    resourcesDb.get_prummy_event_message_config_db = (): resourcesDb.prummy_event_message_config_db => { return DbManager.getDataBase('prummy_event_message_config_db').datas; }
    resourcesDb.get_from_prummy_event_message_config_db = (id: number | string, bQuiet?: boolean): resourcesDb.prummy_event_message_config_db_data => { return DbManager.getDataBase('prummy_event_message_config_db')._get1(id, bQuiet); }
    resourcesDb.foreach_from_prummy_event_message_config_db = (callback: (idKey: string, data: resourcesDb.prummy_event_message_config_db_data) => (void | boolean)) => { DbManager.getDataBase('prummy_event_message_config_db')._foreachData1(callback); }

    resourcesDb.get_i18n_language_config_db = (): resourcesDb.i18n_language_config_db => { return DbManager.getDataBase('i18n_language_config_db').datas; }
    resourcesDb.get_from_i18n_language_config_db = (id: string, bQuiet?: boolean): resourcesDb.i18n_language_config_db_data => { return DbManager.getDataBase('i18n_language_config_db')._get1(id, bQuiet); }
    resourcesDb.foreach_from_i18n_language_config_db = (callback: (idKey: string, data: resourcesDb.i18n_language_config_db_data) => (void | boolean)) => { DbManager.getDataBase('i18n_language_config_db')._foreachData1(callback); }

    resourcesDb.get_link_url_param_db = (): resourcesDb.link_url_param_db => { return DbManager.getDataBase('link_url_param_db').datas; }
    resourcesDb.get_from_link_url_param_db = (id: string, bQuiet?: boolean): resourcesDb.link_url_param_db_data => { return DbManager.getDataBase('link_url_param_db')._get1(id, bQuiet); }
    resourcesDb.foreach_from_link_url_param_db = (callback: (idKey: string, data: resourcesDb.link_url_param_db_data) => (void | boolean)) => { DbManager.getDataBase('link_url_param_db')._foreachData1(callback); }

}

/**
 * 延迟1ms后自动注册
 * 
 */
setTimeout(() => {
    let bDisableAutoInit = !!window['_AutoExportDb_bDisableAutoInit'];
    if (!bDisableAutoInit) {
        // console.log('_AutoExportDb.ts 兼容代码启动，初始化所有getter接口');
        _AutoResourcesExportDb_init();
    }
}, 1);

window['_AutoResourcesExportDb_init'] = _AutoResourcesExportDb_init;
