/** 配置表数据结构描述文件，本文件由导出器自动生成，请勿手动修改 */
declare module resourcesDb {
    function getDataBase(dbName: string): any;
    type customize_resources_statistical_db_data = {
        /** 唯一id */
        readonly customEventKey: string,
        /** 描述内容(需要手动填写） */
        readonly desc: string,
        /** 打点-时长统计ID */
        readonly statisticalId: number,
    };

    type customize_resources_statistical_db = {
        [customEventKey: string]: customize_resources_statistical_db_data,
    };

    function get_customize_resources_statistical_db(): resourcesDb.customize_resources_statistical_db;
    function get_from_customize_resources_statistical_db(customEventKey: string, bQuiet?: boolean): resourcesDb.customize_resources_statistical_db_data;
    function foreach_from_customize_resources_statistical_db(callback: (customEventKeyKey: string, data: resourcesDb.customize_resources_statistical_db_data) => (void | boolean)): void;
    /** 唯一id */
    export const CUSTOMIZE_RESOURCES_STATISTICAL_DB_CUSTOMEVENTKEY: {
        ['LOGO_SHOWING']: 'LOGO_SHOWING',
        ['LOADING_PROGRESS_BAR_SHOWING']: 'LOADING_PROGRESS_BAR_SHOWING',
        ['LOADING_COMPLETED']: 'LOADING_COMPLETED',
}
    type gbutton_resources_statistical_db_data = {
        /** 界面名字 */
        readonly viewName: string,
        /** 按钮名字 */
        readonly buttonName: string,
        /** bundle名字 */
        readonly bundleName: string,
        /** 描述内容(需要手动填写） */
        readonly desc: string,
        /** 统计ID */
        readonly statisticalId: number,
    };

    type gbutton_resources_statistical_db = {
        [viewName: string]: {
            [buttonName: string]: gbutton_resources_statistical_db_data,
        },
    };

    function get_gbutton_resources_statistical_db(): resourcesDb.gbutton_resources_statistical_db;
    function get_from_gbutton_resources_statistical_db(viewName: string, buttonName: string, bQuiet?: boolean): resourcesDb.gbutton_resources_statistical_db_data;
    function foreach_from_gbutton_resources_statistical_db(callback: (viewNameKey: string, buttonNameKey: string, data: resourcesDb.gbutton_resources_statistical_db_data) => (void | boolean)): void;
    function getMap_from_gbutton_resources_statistical_db(viewName: string, bQuiet?: boolean): { [buttonName: string]: resourcesDb.gbutton_resources_statistical_db_data };
    function foreachMap_from_gbutton_resources_statistical_db(callback: (viewNameKey: string, datas: { [buttonName: string]: resourcesDb.gbutton_resources_statistical_db_data }) => (void | boolean)): void;
    type panel_resources_statistical_db_data = {
        /** 界面名字 */
        readonly viewName: string,
        /** bundle名字 */
        readonly bundleName: string,
        /** 描述内容(需要手动填写） */
        readonly desc: string,
        /** 统计ID */
        readonly statisticalId: number,
    };

    type panel_resources_statistical_db = {
        [viewName: string]: panel_resources_statistical_db_data,
    };

    function get_panel_resources_statistical_db(): resourcesDb.panel_resources_statistical_db;
    function get_from_panel_resources_statistical_db(viewName: string, bQuiet?: boolean): resourcesDb.panel_resources_statistical_db_data;
    function foreach_from_panel_resources_statistical_db(callback: (viewNameKey: string, data: resourcesDb.panel_resources_statistical_db_data) => (void | boolean)): void;
    /** 界面名字 */
    export const PANEL_RESOURCES_STATISTICAL_DB_VIEWNAME: {
        ['CustomBetAreaItem']: 'CustomBetAreaItem',
        ['CustomBetArea']: 'CustomBetArea',
        ['CustomChip']: 'CustomChip',
        ['CustomChooseChip']: 'CustomChooseChip',
        ['CustomFlyChip']: 'CustomFlyChip',
        ['CustomGameItem']: 'CustomGameItem',
        ['CustomHistory']: 'CustomHistory',
        ['CustomMenuHistoryItem']: 'CustomMenuHistoryItem',
        ['CustomSystemMenuHistory']: 'CustomSystemMenuHistory',
        ['CustomToast']: 'CustomToast',
        ['PanelCircleLoading']: 'PanelCircleLoading',
        ['PanelGame']: 'PanelGame',
        ['PanelGMMainView']: 'PanelGMMainView',
        ['PanelJmInit']: 'PanelJmInit',
        ['PanelJmMainView']: 'PanelJmMainView',
        ['PanelLobby']: 'PanelLobby',
        ['PanelThirdGame']: 'PanelThirdGame',
}
    type protobuf_load_priority_db_data = {
        /** 包体 */
        readonly bundle: string,
        /** 优先级 */
        readonly priority: number,
        /** 协议名字 */
        readonly name: string,
        /** 包名 */
        readonly package: string,
    };

    type protobuf_load_priority_db = {
        [bundle: string]: protobuf_load_priority_db_data[],
    };

    function get_protobuf_load_priority_db(): resourcesDb.protobuf_load_priority_db;
    function get_from_protobuf_load_priority_db(bundle: string, index: number, bQuiet?: boolean): resourcesDb.protobuf_load_priority_db_data;
    function foreach_from_protobuf_load_priority_db(callback: (bundleKey: string, index: number, data: resourcesDb.protobuf_load_priority_db_data) => (void | boolean)): void;
    function getArr_from_protobuf_load_priority_db(bundle: string, bQuiet?: boolean): resourcesDb.protobuf_load_priority_db_data[];
    function foreachArr_from_protobuf_load_priority_db(callback: (bundleKey: string, datas: resourcesDb.protobuf_load_priority_db_data[]) => (void | boolean)): void;
    type i18n_resources_db_data = {
        /** 唯一id */
        readonly index: string,
        /** 节点类型 0|不填->无，1：Label。2：Sprite */
        readonly nodeType: number,
        /** 界面名字 */
        readonly panelName: string,
        /** 节点名字 */
        readonly nodeName: string,
        /** 中文简体 */
        readonly zh_cn: string,
        /** 英文 */
        readonly en_us: string,
        /** 印地语 */
        readonly hi_in: string,
        /** 英语-印度 */
        readonly en_in: string,
    };

    type i18n_resources_db = {
        [index: string]: i18n_resources_db_data,
    };

    function get_i18n_resources_db(): resourcesDb.i18n_resources_db;
    function get_from_i18n_resources_db(index: string, bQuiet?: boolean): resourcesDb.i18n_resources_db_data;
    function foreach_from_i18n_resources_db(callback: (indexKey: string, data: resourcesDb.i18n_resources_db_data) => (void | boolean)): void;
    /** 唯一id */
    export const I18N_RESOURCES_DB_INDEX: {
        ['Tip_SocketConnectFaild']: 'Tip_SocketConnectFaild',
        ['EC_COIN_NO_ENOUGH']: 'EC_COIN_NO_ENOUGH',
        ['Error']: 'Error',
        ['Warn']: 'Warn',
        ['Notice']: 'Notice',
        ['Confirm']: 'Confirm',
        ['Cancel']: 'Cancel',
        ['Close']: 'Close',
        ['ExitGame']: 'ExitGame',
        ['Retry']: 'Retry',
        ['Tip_ReconnectFailed']: 'Tip_ReconnectFailed',
        ['Tip_Reconnecting']: 'Tip_Reconnecting',
        ['TIP_ENTER_GAME_FAILED']: 'TIP_ENTER_GAME_FAILED',
        ['TIP_AB_BET_FAILED']: 'TIP_AB_BET_FAILED',
        ['Tip_No_More_Historys']: 'Tip_No_More_Historys',
        ['TIP_HISTORY_GET_FAILED']: 'TIP_HISTORY_GET_FAILED',
        ['CustomSystemTopFoot_totalbet_info_i18n']: 'CustomSystemTopFoot_totalbet_info_i18n',
        ['CustomSystemTopFoot_balance_info_i18n']: 'CustomSystemTopFoot_balance_info_i18n',
        ['CustomSystemTopFoot_label_period_i18n_skin']: 'CustomSystemTopFoot_label_period_i18n_skin',
        ['PanelMessageBox_cc_title_i18n']: 'PanelMessageBox_cc_title_i18n',
        ['PanelMessageBox_cc_cancelTitle_i18n']: 'PanelMessageBox_cc_cancelTitle_i18n',
        ['PanelMessageBox_cc_okTitle_i18n']: 'PanelMessageBox_cc_okTitle_i18n',
        ['PanelSystemMenu_title_i18n_button_records']: 'PanelSystemMenu_title_i18n_button_records',
        ['PanelSystemMenu_title_i18n_button_rules']: 'PanelSystemMenu_title_i18n_button_rules',
        ['PanelSystemMenu_title_i18n_button_sound']: 'PanelSystemMenu_title_i18n_button_sound',
        ['PanelSystemMenu_title_i18n_button_exit']: 'PanelSystemMenu_title_i18n_button_exit',
}
    type game_entrance_config_db_data = {
        /** 游戏id（bundleId） */
        readonly id: string,
        /** 入口Panel名称 */
        readonly entrancePanelName: string,
        /** 游戏内部菜单 */
        readonly systemMenus: number[],
        /** 进入模式 */
        readonly enterMode: number,
        /** 游戏ID */
        readonly themeId: number,
        /** 进入游戏的请求ID */
        readonly enterReq: string,
        /** 是否自定义进入游戏得请求 */
        readonly isOverrideEnterMsg: number,
    };

    type game_entrance_config_db = {
        [id: string]: game_entrance_config_db_data,
    };

    function get_game_entrance_config_db(): resourcesDb.game_entrance_config_db;
    function get_from_game_entrance_config_db(id: string, bQuiet?: boolean): resourcesDb.game_entrance_config_db_data;
    function foreach_from_game_entrance_config_db(callback: (idKey: string, data: resourcesDb.game_entrance_config_db_data) => (void | boolean)): void;
    /** 游戏ID */
    export const GAME_THEMEID_BUNDLE: {
        ['0']: 'lobby',
        ['1025']: 'Jhandimunda',
}
    /** 游戏id（bundleId） */
    export const GAME_ENTRANCE_CONFIG_DB_ID: {
        ['Jhandimunda']: 'Jhandimunda',
        ['lobby']: 'lobby',
}
    type game_config_db_data = {
        /** 变量的名字 */
        readonly id: string,
        /** 变量类型 */
        readonly type: string,
        /** 变量数值 */
        readonly value: string,
    };

    type game_config_db = {
        [id: string]: game_config_db_data,
    };

    function get_game_config_db(): resourcesDb.game_config_db;
    function get_from_game_config_db(id: string, bQuiet?: boolean): resourcesDb.game_config_db_data;
    function foreach_from_game_config_db(callback: (idKey: string, data: resourcesDb.game_config_db_data) => (void | boolean)): void;
    /** 变量的名字 */
    export const GAME_CONFIG_DB_ID: {
}
    type skin_resources_db_data = {
        /** 预制体ID */
        readonly prefabId: string,
        /** 节点名字 */
        readonly nodeName: string,
        /** 类型（0：label，1：Sprite) */
        readonly type: number,
        readonly bundleName: string,
        /** sprite路径 */
        readonly spfurl: string,
        /** 是否使用9宫格 */
        readonly isNineBox: number,
        /** label颜色 */
        readonly color: string,
        /** 描边颜色 */
        readonly outlineColor: string,
        /** 阴影颜色 */
        readonly shadowColor: string,
    };

    type skin_resources_db = {
        [prefabId: string]: {
            [nodeName: string]: skin_resources_db_data,
        },
    };

    function get_skin_resources_db(): resourcesDb.skin_resources_db;
    function get_from_skin_resources_db(prefabId: string, nodeName: string, bQuiet?: boolean): resourcesDb.skin_resources_db_data;
    function foreach_from_skin_resources_db(callback: (prefabIdKey: string, nodeNameKey: string, data: resourcesDb.skin_resources_db_data) => (void | boolean)): void;
    function getMap_from_skin_resources_db(prefabId: string, bQuiet?: boolean): { [nodeName: string]: resourcesDb.skin_resources_db_data };
    function foreachMap_from_skin_resources_db(callback: (prefabIdKey: string, datas: { [nodeName: string]: resourcesDb.skin_resources_db_data }) => (void | boolean)): void;
    type system_menu_db_data = {
        /** 菜单名字 */
        readonly id: number,
        /** 顶部菜单名字 */
        readonly title: string,
        /** 使用的spriteFrame的地址 */
        readonly spfUrls: string[],
        /** 节点名字 */
        readonly nodeName: string,
        /** title翻译的key */
        readonly i18n_key: string,
    };

    type system_menu_db = system_menu_db_data[];

    function get_system_menu_db(): resourcesDb.system_menu_db;
    function get_from_system_menu_db(index: number, bQuiet?: boolean): resourcesDb.system_menu_db_data;
    function foreach_from_system_menu_db(callback: (index: number, data: resourcesDb.system_menu_db_data) => (void | boolean)): void;
    /** 顶部菜单名字 */
    export const MENU_TITLE_ID: {
        ['Records']: 0,
        ['Rules']: 1,
        ['Sound']: 2,
        ['Exit']: 3,
}
    type prummy_event_message_config_db_data = {
        /** 事件ID */
        readonly id: number,
        /** 事件名字 */
        readonly name: string,
        /** 结构体名字 */
        readonly messageName: string,
    };

    type prummy_event_message_config_db = {
        [id: number]: prummy_event_message_config_db_data,
    };

    function get_prummy_event_message_config_db(): resourcesDb.prummy_event_message_config_db;
    function get_from_prummy_event_message_config_db(id: number | string, bQuiet?: boolean): resourcesDb.prummy_event_message_config_db_data;
    function foreach_from_prummy_event_message_config_db(callback: (idKey: string, data: resourcesDb.prummy_event_message_config_db_data) => (void | boolean)): void;
    type i18n_language_config_db_data = {
        /** 语言ID */
        readonly id: string,
        /** 服务器定义 */
        readonly serverKey: string,
    };

    type i18n_language_config_db = {
        [id: string]: i18n_language_config_db_data,
    };

    function get_i18n_language_config_db(): resourcesDb.i18n_language_config_db;
    function get_from_i18n_language_config_db(id: string, bQuiet?: boolean): resourcesDb.i18n_language_config_db_data;
    function foreach_from_i18n_language_config_db(callback: (idKey: string, data: resourcesDb.i18n_language_config_db_data) => (void | boolean)): void;
    /** 服务器定义 */
    export const I18N_Language_Code: {
        ['en-US']: 'en_us',
        ['zh-CN']: 'zh_cn',
        ['pt-BR']: 'pt_br',
        ['hi-IN']: 'hi_in',
        ['en-IN']: 'en_in',
}
    /** 语言ID */
    export const I18N_LANGUAGE_CONFIG_DB_ID: {
        ['en_us']: 'en_us',
        ['zh_cn']: 'zh_cn',
        ['pt_br']: 'pt_br',
        ['hi_in']: 'hi_in',
        ['en_in']: 'en_in',
}
    type link_url_param_db_data = {
        /** 变量的名字 */
        readonly id: string,
    };

    type link_url_param_db = {
        [id: string]: link_url_param_db_data,
    };

    function get_link_url_param_db(): resourcesDb.link_url_param_db;
    function get_from_link_url_param_db(id: string, bQuiet?: boolean): resourcesDb.link_url_param_db_data;
    function foreach_from_link_url_param_db(callback: (idKey: string, data: resourcesDb.link_url_param_db_data) => (void | boolean)): void;
    /** 变量的名字 */
    export const LINK_URL_PARAM_DB_ID: {
        ['language']: 'language',
        ['token']: 'token',
        ['api']: 'api',
        ['gid']: 'gid',
        ['env']: 'env',
        ['channel']: 'channel',
        ['inviteId']: 'inviteId',
        ['zoneId']: 'zoneId',
        ['return_url']: 'return_url',
        ['player_id']: 'player_id',
        ['account']: 'account',
}
}