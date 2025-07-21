"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readI18nXlsxFileData = exports.onAssetMenu = exports.unload = exports.load = exports.methods = void 0;
const asset_db_utils_1 = require("./utils/asset-db-utils");
const define_1 = require("./define");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const prefab_utils_1 = __importDefault(require("./utils/prefab-utils"));
const tools_1 = __importDefault(require("./utils/tools"));
const component_utils_1 = __importDefault(require("./utils/component-utils"));
const file_utils_1 = __importDefault(require("./utils/file-utils"));
const node_xlsx_1 = __importDefault(require("node-xlsx"));
const export_statistical_1 = __importDefault(require("./statistial/export-statistical"));
const os = __importStar(require("os"));
const p_path = os.platform() === 'darwin' ? '\/' : '\\';
//import XLSXSTYLE from 'xlsx-style';
/**
 * @en Methods within the extension can be triggered by message
 * @zh 扩展内的方法，可以通过 message 触发
 */
exports.methods = {
    /**
     * @en A method that can be triggered by message
     * @zh 通过 message 触发的方法
     * @param str The string to be printed
     */
    async hello(str) {
        str = str || 'World';
        return console.log(`Hello ${str}`);
    },
};
/**
 * @en The method executed when the extension is started
 * @zh 扩展启动的时候执行的方法
 */
function load() {
    // Editor.Message.send('{name}', 'hello');
}
exports.load = load;
/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展触发的方法
 */
function unload() { }
exports.unload = unload;
/**
 * 多语言环境下对Prefab进行导出
 * @param assetInfo
 */
function onAssetMenu(assetInfo) {
    const importer = assetInfo.importer;
    const name = assetInfo.name;
    if (importer == "directory") {
        //用户想解析一个文件夹
        return;
    }
    else {
        //单个文件
        if (assetInfo.importer != "prefab") {
            //用户没有选中预制体
            define_1.DEBUG && console.log("请选择单个预制体~");
            return;
        }
        if (!assetInfo.name.startsWith("Panel") && !assetInfo.name.startsWith("Custom")) {
            return;
        }
    }
    //初始化resources
    const rBundleInfo = {
        url: path_1.default.join(Editor.Project.path, "assets", "resources").replaceAll("\\", "/"),
        db_url: "db://assets/resources",
        bundleName: "resources",
        prefabName: "",
        prefabSubUrl: "",
        i18n_labels: [],
    };
    prefab_utils_1.default.InitBundle(rBundleInfo);
    //ComponentUtils初始化
    component_utils_1.default.Init();
    const bundleInfo = asset_db_utils_1.AssetDbUtils.GetBundleNameWithDbUrl(assetInfo.url);
    if (!bundleInfo) {
        return;
    }
    return [
        {
            label: "导出[" + bundleInfo.prefabName + "]",
            async click() {
                //导出界面代码
                await export_prefab_view(bundleInfo);
                //导出多语言配置
                readI18nXlsxFileData(bundleInfo.bundleName, bundleInfo.prefabName);
                console.log("导出多语言配置表成功！", bundleInfo.bundleName, bundleInfo.prefabName);
                //打出打点统计
                const statistical = new export_statistical_1.default(bundleInfo.bundleName, bundleInfo.prefabName, _nodeInfos);
                console.log("导出统计数据：", statistical);
                //导出指定预制体的统计信息
                statistical.exportPanelStatics();
                define_1.DEBUG && console.warn("导出统计数据 = ", statistical.gameId, statistical.bundleName, statistical.prefabName);
                //导出该预制体的按钮的统计信息
                statistical.exportPrefabButtonStatistical();
                //收集自定义数据
                statistical.collectionCustomizeStatistical();
                //写出统计信息给策划
                //statistical.exportDataForPlan();
                //写出配置文件
                statistical.writeConfigToFile();
                //发送通知，要求导出配置表
                Editor.Message.send('export_xlsx_config_db', 'export_target_bundle_xlsx', bundleInfo.bundleName);
            }
        }
    ];
}
exports.onAssetMenu = onAssetMenu;
let _nodeInfos = [];
/**
 * 所有需要被i18n控制的label
 */
let _i18nLabels = [];
/**
 * 所有需要被i18n控制的sprite
 */
let _i18nSprites = [];
/**
 * 所有需要被i18n控制的富文本
 */
let _i18n_rich_texts = [];
/**
 * 导出指定的bundle
 * @param bundleInfo
 */
async function export_prefab_view(bundleInfo) {
    _nodeInfos = [];
    _i18nLabels = [];
    _i18nSprites = [];
    _i18n_rich_texts = [];
    //子目录
    const subUrl = bundleInfo.prefabSubUrl;
    let prefabFileUrl = path_1.default.join(bundleInfo.url, "prefabs"); //bundleInfo.url + `${p_path}prefabs${p_path}` + bundleInfo.prefabName + ".prefab";
    if (subUrl != "") {
        prefabFileUrl = path_1.default.join(prefabFileUrl, subUrl);
    }
    prefabFileUrl = path_1.default.join(prefabFileUrl, bundleInfo.prefabName + ".prefab").replaceAll("\\", "/");
    const text = fs_extra_1.default.readFileSync(prefabFileUrl, { encoding: "utf-8" });
    const data = JSON.parse(text);
    await _recursionLoad(data, data[1]);
    define_1.DEBUG && console.log("所有的节点信息：", _nodeInfos);
    let dbPath = bundleInfo.db_url;
    if (dbPath.endsWith("/")) {
        dbPath = dbPath.substring(0, dbPath.length - 1);
    }
    let scriptPath = '';
    if (bundleInfo.bundleName == "resources") {
        scriptPath = path_1.default.join(Editor.Project.path, "assets", "resources", "scripts", "view");
        dbPath = "db://assets/resources/scripts/view/";
        if (subUrl != "") {
            scriptPath = path_1.default.join(scriptPath, subUrl);
            dbPath = dbPath + subUrl + "/";
        }
    }
    else {
        scriptPath = path_1.default.join(bundleInfo.url, "scripts", "view");
        dbPath = "db://assets/bundles/" + bundleInfo.bundleName + "/scripts/view/";
        if (subUrl != "") {
            scriptPath = path_1.default.join(scriptPath, subUrl);
            dbPath = dbPath + subUrl + "/";
        }
    }
    scriptPath = path_1.default.join(scriptPath, bundleInfo.prefabName + ".ts").replaceAll("\\", "/");
    dbPath = (dbPath + bundleInfo.prefabName + ".ts").replaceAll("\\", "/");
    define_1.DEBUG && console.log("脚本路径：", scriptPath);
    define_1.DEBUG && console.log("db路径：", dbPath);
    if (fs_extra_1.default.existsSync(scriptPath)) {
        //如果文件已经存在
        const lines = file_utils_1.default.GetFileContentByLines(scriptPath);
        const text = _hotfixViewCode(lines, data, bundleInfo);
        await asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset(dbPath, text, true);
        define_1.DEBUG && console.log("更新脚本：" + bundleInfo.prefabName + "成功！");
    }
    else {
        const text = _makeNewViewCode(data, bundleInfo);
        //写入
        await asset_db_utils_1.AssetDbUtils.RequestCreateNewAsset(dbPath, text, true);
        define_1.DEBUG && console.log("写入新的脚本：" + bundleInfo.prefabName + "成功！");
    }
}
/**
     * 根据节点的名字，生成一个这个节点作为按钮的回调方法
     * @param nodeName cc_buttonClose -> onClickButtonClose
     */
function _getButtonEventByNodeName(nodeName) {
    const buttonName = nodeName.substring(9);
    return "onClickButton" + buttonName;
}
/**
 * 对已经存在的界面代码进行更新
 * @param data
 * @param bundleInfo
 */
function _hotfixViewCode(lines, data, bundleInfo) {
    const scriptPath = path_1.default.join(bundleInfo.url, "scripts", "view");
    const scriptName = bundleInfo.prefabName;
    let i1 = 0, i2 = 0;
    [i1, i2] = tools_1.default.findLineTag(lines, define_1.IMPORT_BEGIN_TAG, define_1.IMPORT_END_TAG);
    if (i1 == null || i2 == null) {
        console.warn("[警告] import区域tag未找到！请检查view代码！", scriptPath, scriptName);
    }
    else {
        // 删除已有元素
        lines.splice(i1 + 1, i2 - i1 - 1);
        let blockText = _makeImportBlockCode(bundleInfo);
        if (blockText) {
            blockText = blockText.substring(0, blockText.length - 1);
            // 插入import区域内容
            lines.splice(i1 + 1, 0, blockText);
        }
    }
    // 2. resource bloack
    [i1, i2] = tools_1.default.findLineTag(lines, define_1.RESOURCE_BEGIN_TAG, define_1.RESOURCE_END_TAG);
    if (i1 == null || i2 == null) {
        console.warn("[警告] resource区域tag未找到！请检查view代码！", scriptPath, scriptName);
    }
    else {
        // 删除已有元素
        lines.splice(i1 + 1, i2 - i1 - 1);
        let blockText = _makeResourceBlockCode(bundleInfo);
        if (blockText) {
            blockText = blockText.substring(0, blockText.length - 1);
            // 插入import区域内容
            lines.splice(i1 + 1, 0, blockText);
        }
    }
    //3.event block
    [i1, i2] = tools_1.default.findLineTag(lines, define_1.EVENT_BEGIN_TAG, define_1.EVENT_END_TAG);
    if (i1 == null || i2 == null) {
        console.warn("[警告] event区域tag未找到！请检查view代码！", scriptPath, scriptName);
    }
    else {
        //event需要特殊处理，因为不能删除已经出现的逻辑，只需要处理新增，不需要处理已经存在的
        let nodeNames = [];
        for (let i = 0; i < _nodeInfos.length; i++) {
            const info = _nodeInfos[i];
            const name = info.nodeName;
            if (name.startsWith("cc_button")) {
                nodeNames.push(name.substring(9));
            }
        }
        if (nodeNames.length > 0) {
            //如果发现有按钮，从当前数据中获取
            const arr = lines.splice(i1 + 1, i2 - i1 - 1);
            const result = _hotFixButtonEvent(arr, nodeNames);
            const text = result.join("\n");
            lines.splice(i1 + 1, 0, text);
        }
    }
    return lines.join("\n");
}
function _makeNewEventBlockCode() {
    //获取到所有以cc_button开头的玩意儿
    let nodeNames = [];
    for (let i = 0; i < _nodeInfos.length; i++) {
        const info = _nodeInfos[i];
        const name = info.nodeName;
        if (name.startsWith("cc_button")) {
            nodeNames.push(name);
        }
    }
    if (nodeNames.length == 0) {
        return '';
    }
    let text = '';
    for (let i = 0; i < nodeNames.length; i++) {
        const name = nodeNames[i];
        let clickFunc = _getButtonEventByNodeName(name);
        text += '    private ' + clickFunc + '(event : cc.EventTouch){\n';
        text += "        cc.log('on click event " + name + "');\n";
        text += '    }\n';
    }
    return text;
}
/**
 * 生成自动化锁定的内容
 * @param bundleInfo
 * @returns
 */
function _makeResourceBlockCode(bundleInfo) {
    const scriptUrl = path_1.default.join(bundleInfo.url, bundleInfo.prefabName);
    let nodeNames = [];
    let nodeName_2_nodeType = {};
    for (let i = 0; i < _nodeInfos.length; i++) {
        const nodeInfo = _nodeInfos[i];
        let nodeName = nodeInfo.nodeName;
        if (!nodeName.startsWith("cc_")) {
            continue;
        }
        if (nodeNames.includes(nodeName)) {
            //已经存在
            console.warn(tools_1.default.format("[警告] 预制件[%s]中发现节点名称重复：[%s]", scriptUrl, nodeName));
        }
        else {
            nodeNames.push(nodeName);
        }
        let nodeType = nodeInfo.nodeType;
        if (nodeType.startsWith("cc.") || nodeType.startsWith("sp.") || nodeType.startsWith("dragonBones.")) {
            nodeName_2_nodeType[nodeName] = nodeType;
            continue;
        }
        //非传统的预制体，那就是一个Custom预制体，一会在说怎么处理
        nodeName_2_nodeType[nodeName] = nodeType;
    }
    nodeNames = nodeNames.sort();
    let text = '';
    text += '    protected _getResourceBindingConfig(): ViewBindConfigResult {\n';
    text += '        return {\n';
    for (let i = 0; i < nodeNames.length; i++) {
        const nodeName = nodeNames[i];
        const nodeType = nodeName_2_nodeType[nodeName];
        if (nodeName.startsWith("cc_button")) {
            const clickFunc = _getButtonEventByNodeName(nodeName);
            text += '            ' + nodeName + "    : [" + nodeType + ",this." + clickFunc + ".bind(this)],\n";
        }
        else {
            text += '            ' + nodeName + "    : [" + nodeType + "],\n";
        }
    }
    text += '        };\n';
    text += '    }\n';
    text += '    //------------------------ 所有可用变量 ------------------------//\n';
    for (let i = 0; i < nodeNames.length; i++) {
        const nodeName = nodeNames[i];
        let varName = nodeName.substring(3, nodeName.length);
        let nodeType = nodeName_2_nodeType[nodeName];
        text += tools_1.default.format('   protected %s: %s    = null;\n', varName, nodeType);
    }
    text += "    /**\n";
    text += "     * 当前界面的名字\n";
    text += "     * 请勿修改，脚本自动生成\n";
    text += "    */\n";
    text += tools_1.default.format("   public static readonly VIEW_NAME    = '" + bundleInfo.prefabName + "';\n");
    text += "    /**\n";
    text += "     * 当前界面的所属的bundle名字\n";
    text += "     * 请勿修改，脚本自动生成\n";
    text += "    */\n";
    text += tools_1.default.format("   public static readonly BUNDLE_NAME  = '" + bundleInfo.bundleName + "';\n");
    text += "    /**\n";
    text += "     * 请勿修改，脚本自动生成\n";
    text += "    */\n";
    text += tools_1.default.format("   public get bundleName() {\n");
    text += "        return " + bundleInfo.prefabName + ".BUNDLE_NAME;\n";
    text += "    }\n";
    text += tools_1.default.format("   public get viewName(){\n");
    text += "        return " + bundleInfo.prefabName + ".VIEW_NAME;\n";
    text += "    }\n";
    return text;
}
/**
 * 生成 一段全新的代码
 * @param data
 * @param bundleInfo
 * @returns
 */
function _makeNewViewCode(data, bundleInfo) {
    let scriptName = bundleInfo.prefabName;
    let text = "";
    //1.import block
    text += tools_1.default.format('%s\n', define_1.IMPORT_BEGIN_TAG);
    text += _makeImportBlockCode(bundleInfo);
    text += tools_1.default.format('%s\n', define_1.IMPORT_END_TAG);
    text += '\n';
    text += 'const { ccclass, property } = cc._decorator;\n';
    text += '\n';
    //2.类名
    text += "@ccclass('" + scriptName + "')\n";
    text += 'export default class ' + scriptName + ' extends ViewBase {\n';
    //3.生命周期
    text += '\n';
    text += '    //------------------------ 生命周期 ------------------------//\n';
    text += '    protected onLoad(): void {\n';
    text += '        super.onLoad();\n';
    text += '    }\n';
    text += '\n';
    text += '    protected onDestroy(): void {\n';
    text += '        super.onDestroy();\n';
    text += '    }\n';
    text += '\n\n';
    text += '    //------------------------ 内部逻辑 ------------------------//\n';
    text += '\n\n\n\n\n\n\n\n\n\n';
    text += '    //------------------------ 网络消息 ------------------------//\n';
    text += tools_1.default.format('%s\n', define_1.NET_BEGIN_TAG);
    text += '\n';
    if (bundleInfo.prefabName.startsWith("Panel")) {
        text += '    public onNetworkMessage(msgType : string,data : any) : boolean {\n';
        text += '        return false;\n';
        text += '    }\n';
    }
    else if (bundleInfo.prefabName.startsWith("Custom")) {
        text += '//这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送\n';
    }
    text += '\n';
    text += tools_1.default.format('%s\n', define_1.EVENT_END_TAG);
    text += '\n';
    text += '    //------------------------ 事件定义 ------------------------//\n';
    text += tools_1.default.format('%s\n', define_1.EVENT_BEGIN_TAG);
    text += _makeNewEventBlockCode();
    text += tools_1.default.format('%s\n', define_1.EVENT_END_TAG);
    text += '\n\n';
    text += tools_1.default.format('%s\n', define_1.RESOURCE_BEGIN_TAG);
    text += '\n';
    text += _makeResourceBlockCode(bundleInfo);
    text += '\n';
    text += tools_1.default.format('%s\n', define_1.RESOURCE_END_TAG);
    text += '}\n';
    return text;
}
function _pushOnei18nLabel(labelName, value) {
    for (let i = 0; i < _i18nLabels.length; i++) {
        const info = _i18nLabels[i];
        if (info.name == labelName) {
            console.warn("发现重复的i18n标签：" + labelName);
            return;
        }
    }
    _i18nLabels.push({ name: labelName, value: value });
}
function _pushOneRichText(labelName, value) {
    for (let i = 0; i < _i18n_rich_texts.length; i++) {
        const info = _i18n_rich_texts[i];
        if (info.name == labelName) {
            console.warn("发现重复的i18n富文本标签：" + labelName);
            return;
        }
    }
    _i18n_rich_texts.push({ name: labelName, value: value });
}
/**
 * 处理预制体读取
 * @param data
 * @param tag
 * @param level
 */
async function _recursionLoad(data, tag, level = 0) {
    if (level > 0 && tag._prefab && !tag._name) {
        //这个玩意儿是一个Prefab的信息节点
        let nextIndex = tag._prefab.__id__;
        await _loadCustomPrefabInfo(data, data[nextIndex]);
        return;
    }
    define_1.DEBUG && console.log("开始解析tag->", tag);
    const nodeName = tag._name;
    const componentNames = [];
    let nodeType = "";
    let uiTransform = false;
    if (nodeName.includes('i18n')) {
        //需要被处理成多语言的label，检查下面有没有Label组件
        //console.warn('获取到多语言节点：',nodeName);
        if (!tag._components) {
            console.warn("被你标记为i18n的节点下面找不到任何组件的信息？", nodeName);
        }
        else {
            //检查时啥玩意儿
            for (let i = 0; i < tag._components.length; i++) {
                const componentIndex = tag._components[i].__id__;
                let componentTag = data[componentIndex];
                if (componentTag.__type__ == "cc.Label") {
                    _pushOnei18nLabel(nodeName, componentTag._string);
                    break;
                }
                else if (componentTag.__type__ == "cc.RichText") {
                    _pushOneRichText(nodeName, componentTag._string);
                    break;
                }
                else if (componentTag.__type__ == "cc.Sprite") {
                    const _spriteFrame = componentTag._spriteFrame;
                    const __uuid__ = _spriteFrame.__uuid__;
                    const assetInfo = await asset_db_utils_1.AssetDbUtils.RequestQueryAssetInfo(__uuid__);
                    if (assetInfo) {
                        const spfPath = assetInfo.path;
                        //找到textures的位置
                        const texturesIndex = spfPath.indexOf("textures");
                        if (texturesIndex < 0) {
                            //有问题
                            console.error("你的SpriteFrame资源不在textures目录下？", spfPath);
                        }
                        else {
                            //取包括textures的后面的部分
                            const texturePath = spfPath.substring(texturesIndex);
                            //console.log("找到一个i18n的SpriteFrame资源：",nodeName,texturePath);
                            _i18nSprites.push({ name: nodeName, value: texturePath });
                        }
                    }
                    break;
                }
            }
        }
    }
    if (nodeName.startsWith("cc_button")) {
        nodeType = "GButton";
    }
    else {
        if (tag._components) {
            for (let i = 0; i < tag._components.length; i++) {
                const componentIndex = tag._components[i].__id__;
                let componentTag = data[componentIndex];
                componentNames.push(componentTag.__type__);
                if (uiTransform && nodeType == '') {
                    nodeType = componentTag.__type__;
                }
                if (componentTag.__type__ == "cc.UITransform") {
                    uiTransform = true;
                }
            }
        }
    }
    nodeType = _convertNodeTypeSubNamespaceToCc(nodeType);
    nodeType = _checkSkipComponent(nodeType);
    if (level > 0 && nodeName.startsWith("cc_")) {
        const nodeInfo = {
            nodeName: nodeName,
            nodeType: nodeType || 'cc.Node',
            globalFileId: '',
        };
        const compInfo = component_utils_1.default.GetComponentInfo(nodeType);
        define_1.DEBUG && console.log("当前节点：" + nodeName + "导出类型：", nodeType);
        define_1.DEBUG && console.log("当前nodeType获取到的全局组件信息：", compInfo);
        if (compInfo) {
            nodeInfo.nodeType = compInfo.className;
            nodeInfo.globalFileId = nodeType;
        }
        _nodeInfos.push(nodeInfo);
    }
    ;
    if (tag._children) {
        for (let i = 0; i < tag._children.length; i++) {
            const childIndex = tag._children[i].__id__;
            await _recursionLoad(data, data[childIndex], level + 1);
        }
    }
}
/**
 * 根据一个预制体的完整路径，初始化整个bundle
 * @param pName
 * @returns 返回这个预制体的脚本路径
 */
function _initAssetBundleInfoByPrefabDir(pName) {
    define_1.DEBUG && console.log("预制体路径：", pName);
    let scriptPath = "";
    const assetBundleInfo = asset_db_utils_1.AssetDbUtils.getAsssetBundleInfoByPath(pName);
    prefab_utils_1.default.InitBundle(assetBundleInfo);
    define_1.DEBUG && console.warn("已知预制体Custom:", assetBundleInfo);
    const subFolder = assetBundleInfo.prefabSubUrl;
    if (assetBundleInfo.bundleName == "resources") {
        //resources下的全部导出到这个位置
        scriptPath = path_1.default.join('assets', 'resources', 'scripts', 'view');
    }
    else {
        //其他预制体
        scriptPath = path_1.default.join('assets', 'bundles', assetBundleInfo.bundleName, 'scripts', 'view');
    }
    if (subFolder != "") {
        scriptPath = path_1.default.join(scriptPath, subFolder);
    }
    scriptPath = path_1.default.join(scriptPath, assetBundleInfo.prefabName).replaceAll("\\", "/");
    return "db://" + scriptPath;
}
/**
 * 使用的是预制体，解析这个使用的预制体
 * @param data
 * @param tag
 */
async function _loadCustomPrefabInfo(data, tag) {
    let instanceIndex = tag.instance.__id__;
    let instanceTag = data[instanceIndex];
    define_1.DEBUG && console.log("尝试解析预制体嵌套：", instanceIndex, instanceTag);
    // 遍历propertyOverrides提取名称
    let propertyOverrides = instanceTag.propertyOverrides;
    // 提取节点名称
    let nodeName = "unknown";
    if (propertyOverrides) {
        for (let i = 0; i < propertyOverrides.length; i++) {
            const v = propertyOverrides[i];
            let subIndex = v.__id__;
            let subTag = data[subIndex];
            if (subTag.propertyPath && subTag.propertyPath[0] == "_name") {
                nodeName = subTag.value;
                break;
            }
        }
    }
    /** 提取节点类型 */
    let nodeType = "cc.Node";
    let scriptPath = "";
    if (tag.asset) {
        let prefabUuid = tag.asset.__uuid__;
        let prefabFilePath = prefab_utils_1.default.GetPrefabFilePath(prefabUuid);
        console.warn("使用预制体作为节点：", prefabUuid, prefabFilePath);
        if (prefabFilePath) {
            const pName = path_1.default.basename(prefabFilePath, ".prefab");
            if (pName.startsWith("Custom")) {
                //nodeType 就是预制体的路径
                nodeType = pName;
                scriptPath = _initAssetBundleInfoByPrefabDir(prefabFilePath);
            }
        }
        else {
            define_1.DEBUG && console.log("你使用了非本bundle中的预制体,需要查找。", prefabUuid);
            const prefabInfo = await asset_db_utils_1.AssetDbUtils.RequestQueryAssetInfo(prefabUuid);
            if (!prefabInfo) {
                console.error("错误，你引用了一个不存在的预制体资源：", tag, prefabUuid);
            }
            else {
                define_1.DEBUG && console.log("预制体资源加载成功：", prefabInfo);
                const pName = prefabInfo.name;
                if (pName.startsWith("Custom")) {
                    nodeType = path_1.default.basename(pName, ".prefab");
                    scriptPath = _initAssetBundleInfoByPrefabDir(prefabInfo.file);
                }
                else {
                    //非Custom开头的节点，默认为一个Node
                }
            }
        }
    }
    nodeType = _convertNodeTypeSubNamespaceToCc(nodeType);
    nodeType = _checkSkipComponent(nodeType);
    if (nodeName.startsWith("cc_button") && !nodeType.startsWith('Custom')) {
        nodeType = "GButton";
    }
    const compInfo = component_utils_1.default.GetComponentInfo(nodeType);
    const nodeInfo = {
        nodeName: nodeName,
        nodeType: nodeType || "cc.Node",
        scriptPath: scriptPath,
        globalFileId: '',
    };
    if (compInfo) {
        nodeInfo.nodeType = compInfo.className;
        nodeInfo.globalFileId = nodeType;
        define_1.DEBUG && console.log('解析嵌套预制体时，发现全局组件信息：', compInfo);
    }
    _nodeInfos.push(nodeInfo);
}
function _convertNodeTypeSubNamespaceToCc(nodeType) {
    if (nodeType.startsWith("sp.") || nodeType.startsWith("dragonBones.")) {
        nodeType = "cc." + nodeType;
    }
    return nodeType;
}
function _checkSkipComponent(name) {
    if (name == "cc.Layout" || name == "cc.Widget") {
        return "cc.Node";
    }
    return name;
}
/**
 * 初始化引入
 */
function _makeImportBlockCode(bundleInfo) {
    let importPrefabNames = [];
    let importComponentNames = [];
    const bundleName = bundleInfo.bundleName;
    let importComponentName_2_componentInfo = {};
    for (let i = 0; i < _nodeInfos.length; i++) {
        const nodeInfo = _nodeInfos[i];
        const nodeName = nodeInfo.nodeName;
        let nodeType = nodeInfo.nodeType;
        //仅处理以cc_开头的对象
        if (!nodeName.toLocaleLowerCase().startsWith("cc_")) {
            continue;
        }
        //原始类型不做处理
        if (nodeType.startsWith("cc.") || nodeType.startsWith("sp.") || nodeType.startsWith("dragonBones.")) {
            continue;
        }
        if (nodeType == "GButton") {
            //按钮类型特殊处理
        }
        else {
            //其他类型
            if (component_utils_1.default.IsContainComponentInfo(nodeType)) {
                //如果有这个类型
                const componentInfo = component_utils_1.default.GetComponentInfo(nodeType);
                const className = componentInfo.className;
                if (importComponentNames.indexOf(className) < 0) {
                    importComponentNames.push(className);
                    importComponentName_2_componentInfo[className] = componentInfo;
                }
            }
            else {
                //找不到的时候检查是否不是当前目录下的新增的Custom文件
                let cPath = "";
                //脚本路径
                let sPath = "";
                if (bundleName != "resources") {
                    cPath = path_1.default.join(Editor.Project.path, "assets", "bundles", bundleName, "prefabs", nodeType + ".prefab");
                    sPath = "db://assets/bundles/" + bundleName + "/scripts/view/" + nodeType; //path.join(Editor.Project.path,"assets","bundles",bundleName,"scripts","view",nodeType + ".ts");
                }
                else {
                    cPath = path_1.default.join(Editor.Project.path, "assets", "resources", "prefabs", nodeType + ".prefab");
                    sPath = "db://assets/resources/scripts/view/" + nodeType; //path.join(Editor.Project.path,"assets","scripts","view",nodeType + ".ts");
                }
                if (fs_extra_1.default.existsSync(cPath)) {
                    //存在
                    if (!importComponentNames.includes(nodeType)) {
                        importComponentNames.push(nodeType);
                        const componentInfo = {
                            className: nodeType,
                            scriptFilePath: sPath,
                            bDefaultExport: true,
                        };
                        importComponentName_2_componentInfo[nodeType] = componentInfo;
                    }
                }
                else {
                    if (nodeInfo.scriptPath && nodeInfo.scriptPath != '') {
                        if (!importComponentNames.includes(nodeType)) {
                            importComponentNames.push(nodeType);
                            const componentInfo = {
                                className: nodeType,
                                scriptFilePath: nodeInfo.scriptPath,
                                bDefaultExport: true,
                            };
                            importComponentName_2_componentInfo[nodeType] = componentInfo;
                        }
                    }
                    else {
                        if (nodeInfo.globalFileId != '') {
                            if (!importComponentNames.includes(nodeType)) {
                                const compInfo = component_utils_1.default.GetComponentInfo(nodeInfo.globalFileId);
                                define_1.DEBUG && console.log('引入一个全局的组件：', compInfo);
                                importComponentNames.push(compInfo.className);
                                importComponentName_2_componentInfo[compInfo.className] = compInfo;
                            }
                        }
                        else {
                            console.warn("你试图引入一个不存在的Custom预制体节点？", cPath, nodeInfo);
                        }
                    }
                }
            }
        }
    }
    importPrefabNames = importPrefabNames.sort();
    importComponentNames = importComponentNames.sort();
    define_1.DEBUG && console.log("特殊引用：", importComponentNames, importComponentName_2_componentInfo);
    //const scriptPath    = path.join(bundleInfo.url,'scripts','view');
    const scriptName = bundleInfo.prefabName;
    let text = "";
    //1.引入基类
    const basePath = "db://assets/resources/scripts/core/view/view-base";
    //const toPath    = path.join(scriptPath,scriptName);
    //define
    const definePath = "db://assets/resources/scripts/core/define"; //path.join(Editor.Project.path,"assets","scripts","core","define");
    //let dPath   = Tools.calcRelativePath(toPath,definePath).replaceAll("\\","/");
    //gbutton
    const gButtonPath = "db://assets/resources/scripts/core/view/gbutton"; //path.join(Editor.Project.path,"assets","scripts","core","view","gbutton");
    //let bPath   = Tools.calcRelativePath(toPath,gButtonPath).replaceAll("\\","/");
    text += "import ViewBase from '" + basePath + "';\n";
    text += "import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from '" + definePath + "';\n";
    text += "import { GButton } from '" + gButtonPath + "';\n";
    text += "import * as cc from 'cc';\n";
    if (importComponentNames.length > 0) {
        text += "//------------------------特殊引用开始----------------------------//\n";
        for (let i = 0; i < importComponentNames.length; i++) {
            const pName = importComponentNames[i];
            const componentInfo = importComponentName_2_componentInfo[pName];
            const url = componentInfo.scriptFilePath;
            //let purl    = Tools.calcRelativePath(toPath,url).replaceAll("\\","/");
            //const plen  = purl.length;
            //purl        = purl.substring(0,plen - 3);
            text += "import " + componentInfo.className + " from '" + url + "';\n";
        }
        text += "//------------------------特殊引用完毕----------------------------//\n";
    }
    text += "//------------------------上述内容请勿修改----------------------------//\n";
    return text;
}
/**
 * 热更新按钮事件
 * 只新增，不删除
 * @param lines
 * @param nodeNames
 * @returns
 */
function _hotFixButtonEvent(lines, nodeNames) {
    let re = [];
    for (let i = 0; i < lines.length; i++) {
        const str = lines[i];
        if (str.includes("onClickButton")) {
            //这是一个按钮事件方法的定义
            const st = str.indexOf("onClickButton");
            const et = str.indexOf("(");
            //还原按钮名字
            let name = str.substring(st + 13, et);
            define_1.DEBUG && console.log("找到一个已经存在的按钮：", name);
            const iIndex = nodeNames.indexOf(name);
            if (iIndex >= 0) {
                //这个按钮存在，删除
                nodeNames.splice(iIndex, 1);
            }
        }
    }
    //这个就是剩下的了
    if (nodeNames.length == 0) {
        return lines;
    }
    //如果有新增的按钮
    for (let i = 0; i < nodeNames.length; i++) {
        const name = nodeNames[i];
        console.log("新增按钮事件：" + name);
        let text = "\n";
        text += "    private onClickButton" + name + "(event : cc.EventTouch){\n";
        text += "        cc.log('on click event cc_button" + name + "');\n";
        text += "    }\n";
        lines.push(text);
    }
    return lines;
}
/**
 * 初始化一个新的i18n多语言文件
 * @param bundleName
 * @param prefabName
 * @returns
 */
function _initNewI18nXlsxFile(bundleName, prefabName) {
    const filePath = path_1.default.join(Editor.Project.path, "_config", bundleName, "i18n", "i18n_" + bundleName + "_" + prefabName + "_db.xlsx");
    if (fs_extra_1.default.existsSync(filePath)) {
        //如果文件已经存在
        console.error("i18n文件已经存在，请不要重复创建：", filePath);
        return;
    }
    //从_config/i18n_simple_db.xlsx复制一份
    const sourceFilePath = path_1.default.join(Editor.Project.path, "_config", "i18n_simple_db.xlsx");
    if (!fs_extra_1.default.existsSync(sourceFilePath)) {
        console.error("i18n_simple_db.xlsx文件不存在，请检查：", sourceFilePath);
        return;
    }
    //打开文件
    const sheets = node_xlsx_1.default.parse(fs_extra_1.default.readFileSync(sourceFilePath));
    const sheet = sheets[0];
    const datas = sheet.data;
    //读取datas的第一行
    if (datas.length == 0) {
        console.error("i18n_simple_db.xlsx文件没有数据，请检查：", sourceFilePath);
        return;
    }
    //检查第一行的内容
    let firstRow = datas[0];
    //修改db的名字
    firstRow[1] = "i18n_" + bundleName + "_db";
    //写入filePath
    //写入文件
    const sheetOptions = { '!cols': [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }] };
    const buffer = node_xlsx_1.default.build([{ name: sheet.name, data: datas, options: sheetOptions }]);
    fs_extra_1.default.writeFileSync(filePath, buffer, { encoding: "binary" });
    console.log("i18n多语言文件初始化成功：", filePath);
}
/**
 * 读取指定bundle下的i18n多语言文件
 * @param bundleName
 */
function readI18nXlsxFileData(bundleName, prefabName) {
    //首先判定是否需要有需要导出的labels/sprite
    if (_i18nLabels.length == 0 && _i18nSprites.length == 0) {
        console.warn("没有需要导出的多语言数据，请检查是否有cc_button开头的节点，或者i18n标签");
        return;
    }
    const filePath = path_1.default.join(Editor.Project.path, "_config", bundleName, "i18n", "i18n_" + bundleName + "_" + prefabName + "_db.xlsx");
    if (!fs_extra_1.default.existsSync(filePath)) {
        //console.error("请定义自己的i18n文件：",filePath);
        _initNewI18nXlsxFile(bundleName, prefabName);
    }
    //读表格
    const sheets = node_xlsx_1.default.parse(fs_extra_1.default.readFileSync(filePath));
    if (sheets.length == 0) {
        console.error("读取表格失败：", filePath);
        return;
    }
    //只认第一张sheet
    const sheet = sheets[0];
    const datas = sheet.data;
    console.log('处理多语言表格内容：', datas);
    //节点类型列索引
    let nodeTypeColumnIndex = -1;
    //面板名字列索引
    let panelNameColumnIndex = -1;
    //节点名字列索引
    let nodeNameColumnIndex = -1;
    //字段名字行的关键字
    const FLD_NAME = "FLD_NAME";
    const FLD_NAME_NODETYPE = 'nodeType';
    const FLD_NAME_PANELNAME = 'panelName';
    const FLD_NAME_NODENAME = 'nodeName';
    const AUTO_EXPORT_START_FLAG = '<<AUTO_EXPORT_DATA_BEGIN_DO_NOT_MODIFY>>';
    let auto_export_start_row_index = -1;
    for (let i = 0; i < datas.length; i++) {
        let data = datas[i];
        if (data[0] && data[0] == FLD_NAME) {
            //遍历这行，获取节点类型，面板名字，节点名字的列索引
            for (let j = 0; j < data.length; j++) {
                let name = data[j];
                if (name == FLD_NAME_NODETYPE) {
                    nodeTypeColumnIndex = j;
                }
                else if (name == FLD_NAME_PANELNAME) {
                    panelNameColumnIndex = j;
                }
                else if (name == FLD_NAME_NODENAME) {
                    nodeNameColumnIndex = j;
                }
            }
        }
        if (data.length > 1 && data[1] == AUTO_EXPORT_START_FLAG) {
            //获取自动导出标记字段
            auto_export_start_row_index = i;
        }
        //获取自动导出标记字段
    }
    //检查索引是否都获取到了
    if (nodeTypeColumnIndex == -1 || panelNameColumnIndex == -1 || nodeNameColumnIndex == -1) {
        console.error("表格格式不正确，请检查：", filePath, ',nodeType = ', nodeTypeColumnIndex, ',panelName = ', panelNameColumnIndex, ',nodeName = ', nodeNameColumnIndex);
        return;
    }
    //如果没有发现导出标记，就给表的数据后面延长10行后加入
    if (auto_export_start_row_index == -1) {
        auto_export_start_row_index = datas.length;
        for (let i = 0; i < 2; i++) {
            datas.push([]);
        }
        datas.push([, AUTO_EXPORT_START_FLAG]);
        auto_export_start_row_index = datas.length - 1;
    }
    //从 auto_export_start_row_index + 1开始找
    const PANEL_START_FLAG = '<<PANEL_START_FLAG_' + prefabName + '>>';
    let bPANELFOUND = false;
    let all_panel_node_row_data = [];
    let key_panel_node_row_data = {};
    let panel_row_start_index = -1;
    for (let i = auto_export_start_row_index + 1; i < datas.length; i++) {
        const data = datas[i];
        if (data.length == 0 || (data.length == 1 && data[0] == '')) {
            //找到一个空白的，说明没了
            if (!bPANELFOUND) {
                continue;
            }
            else {
                break;
            }
        }
        if (data.length > 1 && data[1] == PANEL_START_FLAG) {
            //找到这个预制体的标记
            bPANELFOUND = true;
            panel_row_start_index = i;
            continue;
        }
        if (bPANELFOUND) {
            key_panel_node_row_data[data[2]] = data;
            all_panel_node_row_data.push(data);
        }
    }
    if (!bPANELFOUND) {
        //如果没有找到这个预制体的标记，就加入
        datas.push([]);
        datas.push([, PANEL_START_FLAG]);
        panel_row_start_index = datas.length - 1;
    }
    let new_panel_node_row_data = [];
    for (let i = 0; i < _i18nLabels.length; i++) {
        const key_name = prefabName + "_" + _i18nLabels[i].name;
        const value = _i18nLabels[i].value;
        if (key_panel_node_row_data[key_name]) {
            //1.检查当前Label上的内容和原来的内容是否一致，如果不一致，要替换
            const old_data = key_panel_node_row_data[key_name];
            if (old_data[6] != value) {
                old_data[5] = _i18nLabels[i].name;
                //不一致，替换
                old_data[6] = value;
                old_data[7] = value;
                new_panel_node_row_data.push(old_data);
            }
            else {
                //原来就有的
                new_panel_node_row_data.push(key_panel_node_row_data[key_name]);
            }
        }
        else {
            //原来没有的,将zh_cn和en_us两个数据自动填充进去
            new_panel_node_row_data.push(['DATA', , key_name, '1', prefabName, _i18nLabels[i].name, value, value]);
        }
    }
    //开始输出富文本
    for (let i = 0; i < _i18n_rich_texts.length; i++) {
        const key_name = prefabName + "_" + _i18n_rich_texts[i].name;
        if (key_panel_node_row_data[key_name]) {
            //原来就有的
            new_panel_node_row_data.push(key_panel_node_row_data[key_name]);
        }
        else {
            //原来没有的
            new_panel_node_row_data.push(['DATA', '', key_name, '3', prefabName, _i18n_rich_texts[i].name, _i18n_rich_texts[i].value]);
        }
    }
    //开始输出sprite
    for (let i = 0; i < _i18nSprites.length; i++) {
        const spInfo = _i18nSprites[i];
        const key_name = prefabName + "_" + spInfo.name;
        if (key_panel_node_row_data[key_name]) {
            //原来就有的
            new_panel_node_row_data.push(key_panel_node_row_data[key_name]);
        }
        else {
            //原来没有的
            new_panel_node_row_data.push(['DATA', '', key_name, '2', prefabName, spInfo.name, spInfo.value]);
        }
    }
    //新增一行空白
    new_panel_node_row_data.push([]);
    //插入到datas表格中,替换掉从panel_row_start_index + 1 开始 共all_panel_node_row_data.length + 1 个数据
    datas.splice(panel_row_start_index + 1, all_panel_node_row_data.length + 1, ...new_panel_node_row_data);
    console.log('new datas = ', datas);
    //写入文件
    const sheetOptions = { '!cols': [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }] };
    const buffer = node_xlsx_1.default.build([{ name: sheet.name, data: datas, options: sheetOptions }]);
    fs_extra_1.default.writeFileSync(filePath, buffer, { encoding: "binary" });
}
exports.readI18nXlsxFileData = readI18nXlsxFileData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkRBQXNEO0FBQ3RELHFDQUFxTjtBQUNyTix3REFBMEI7QUFDMUIsZ0RBQXdCO0FBQ3hCLHdFQUErQztBQUMvQywwREFBa0M7QUFDbEMsOEVBQXFEO0FBQ3JELG9FQUEyQztBQUMzQywwREFBNkI7QUFDN0IseUZBQWdFO0FBQ2hFLHVDQUF5QjtBQUN6QixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUN4RCxxQ0FBcUM7QUFDckM7OztHQUdHO0FBQ1UsUUFBQSxPQUFPLEdBQTRDO0lBQzVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQVk7UUFDcEIsR0FBRyxHQUFHLEdBQUcsSUFBSSxPQUFPLENBQUM7UUFDckIsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUN2QyxDQUFDO0NBQ0osQ0FBQztBQUVGOzs7R0FHRztBQUNILFNBQWdCLElBQUk7SUFDaEIsMENBQTBDO0FBQzlDLENBQUM7QUFGRCxvQkFFQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLE1BQU0sS0FBSyxDQUFDO0FBQTVCLHdCQUE0QjtBQUU1Qjs7O0dBR0c7QUFDSCxTQUFnQixXQUFXLENBQUMsU0FBcUI7SUFDN0MsTUFBTSxRQUFRLEdBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQztJQUNyQyxNQUFNLElBQUksR0FBUSxTQUFTLENBQUMsSUFBSSxDQUFDO0lBQ2pDLElBQUcsUUFBUSxJQUFJLFdBQVcsRUFBQztRQUN2QixZQUFZO1FBQ1osT0FBTztLQUNWO1NBQUk7UUFDRCxNQUFNO1FBQ04sSUFBRyxTQUFTLENBQUMs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QUMsT0FBTyxFQUFHLFlBQVksRUFBQyxDQUFDLENBQUMsQ0FBQztJQUM1RixrQkFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUMsTUFBTSxFQUFDLEVBQUMsUUFBUSxFQUFHLFFBQVEsRUFBQyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQXRLRCxvREFzS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBc3NldEluZm8gfSBmcm9tIFwiQGNvY29zL2NyZWF0b3ItdHlwZXMvZWRpdG9yL3BhY2thZ2VzL2Fzc2V0LWRiL0B0eXBlcy9wdWJsaWNcIjtcclxuaW1wb3J0IHsgQXNzZXREYlV0aWxzIH0gZnJvbSBcIi4vdXRpbHMvYXNzZXQtZGItdXRpbHNcIjtcclxuaW1wb3J0IHsgQXNzZXRCdW5kbGVJbmZvLCBDb21wb25lbnRJbmZvLCBERUJVRywgRVZFTlRfQkVHSU5fVEFHLCBFVkVOVF9FTkRfVEFHLCBJTVBPUlRfQkVHSU5fVEFHLCBJTVBPUlRfRU5EX1RBRywgTkVUX0JFR0lOX1RBRywgTm9kZUluZm8sIFJFU09VUkNFX0JFR0lOX1RBRywgUkVTT1VSQ0VfRU5EX1RBRywgU3RhdGlzdGljYWxDb25maWcgfSBmcm9tIFwiLi9kZWZpbmVcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmcy1leHRyYVwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgUHJlZmFiVXRpbHMgZnJvbSBcIi4vdXRpbHMvcHJlZmFiLXV0aWxzXCI7XHJcbmltcG9ydCBUb29scyBmcm9tIFwiLi91dGlscy90b29sc1wiO1xyXG5pbXBvcnQgQ29tcG9uZW50VXRpbHMgZnJvbSBcIi4vdXRpbHMvY29tcG9uZW50LXV0aWxzXCI7XHJcbmltcG9ydCBGaWxlVXRpbHMgZnJvbSBcIi4vdXRpbHMvZmlsZS11dGlsc1wiO1xyXG5pbXBvcnQgeGxzeCBmcm9tIFwibm9kZS14bHN4XCI7XHJcbmltcG9ydCBFeHBvcnRTdGF0aXN0aWNhbCBmcm9tIFwiLi9zdGF0aXN0aWFsL2V4cG9ydC1zdGF0aXN0aWNhbFwiO1xyXG5pbXBvcnQgKiBhcyBvcyBmcm9tICdvcyc7XHJcbmNvbnN0IHBfcGF0aCA9IG9zLnBsYXRmb3JtKCkgPT09ICdkYXJ3aW4nID8gJ1xcLycgOiAnXFxcXCc7XHJcbi8vaW1wb3J0IFhMU1hTVFlMRSBmcm9tICd4bHN4LXN0eWxlJztcclxuLyoqXHJcbiAqIEBlbiBNZXRob2RzIHdpdGhpbiB0aGUgZXh0ZW5zaW9uIGNhbiBiZSB0cmlnZ2VyZWQgYnkgbWVzc2FnZVxyXG4gKiBAemgg5omp5bGV5YaF55qE5pa55rOV77yM5Y+v5Lul6YCa6L+HIG1lc3NhZ2Ug6Kem5Y+RXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgbWV0aG9kczogeyBba2V5OiBzdHJpbmddOiAoLi4uYW55OiBhbnkpID0+IGFueSB9ID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBAZW4gQSBtZXRob2QgdGhhdCBjYW4gYmUgdHJpZ2dlcmVkIGJ5IG1lc3NhZ2VcclxuICAgICAqIEB6aCDpgJrov4cgbWVzc2FnZSDop6blj5HnmoTmlrnms5VcclxuICAgICAqIEBwYXJhbSBzdHIgVGhlIHN0cmluZyB0byBiZSBwcmludGVkXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGhlbGxvKHN0cj86IHN0cmluZykge1xyXG4gICAgICAgIHN0ciA9IHN0ciB8fCAnV29ybGQnO1xyXG4gICAgICAgIHJldHVybiBjb25zb2xlLmxvZyhgSGVsbG8gJHtzdHJ9YCk7XHJcbiAgICB9LFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBlbiBUaGUgbWV0aG9kIGV4ZWN1dGVkIHdoZW4gdGhlIGV4dGVuc2lvbiBpcyBzdGFydGVkXHJcbiAqIEB6aCDmianlsZXlkK/liqjnmoTml7blgJnmiafooYznmoTmlrnms5VcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgLy8gRWRpdG9yLk1lc3NhZ2Uuc2VuZCgne25hbWV9JywgJ2hlbGxvJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAZW4gTWV0aG9kIHRyaWdnZXJlZCB3aGVuIHVuaW5zdGFsbGluZyB0aGUgZXh0ZW5zaW9uXHJcbiAqIEB6aCDljbjovb3mianlsZXop6blj5HnmoTmlrnms5VcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB1bmxvYWQoKSB7IH1cclxuXHJcbi8qKlxyXG4gKiDlpJror63oqIDnjq/looPkuIvlr7lQcmVmYWLov5vooYzlr7zlh7pcclxuICogQHBhcmFtIGFzc2V0SW5mbyBcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBvbkFzc2V0TWVudShhc3NldEluZm8gOiBBc3NldEluZm8pe1xyXG4gICAgY29uc3QgaW1wb3J0ZXIgID0gYXNzZXRJbmZvLmltcG9ydGVyO1xyXG4gICAgY29uc3QgbmFtZSAgICAgID0gYXNzZXRJbmZvLm5hbWU7XHJcbiAgICBpZihpbXBvcnRlciA9PSBcImRpcmVjdG9yeVwiKXtcclxuICAgICAgICAvL+eUqOaIt+aDs+ino+aekOS4gOS4quaWh+S7tuWkuVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8v5Y2V5Liq5paH5Lu2XHJcbiAgICAgICAgaWYoYXNzZXRJbmZvLmltcG9ydGVyICE9IFwicHJlZmFiXCIpe1xyXG4gICAgICAgICAgICAvL+eUqOaIt+ayoeaciemAieS4remihOWItuS9k1xyXG4gICAgICAgICAgICBERUJVRyAmJiBjb25zb2xlLmxvZyhcIuivt+mAieaLqeWNleS4qumihOWItuS9k35cIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoIWFzc2V0SW5mby5uYW1lLnN0YXJ0c1dpdGgoXCJQYW5lbFwiKSAmJiAhYXNzZXRJbmZvLm5hbWUuc3RhcnRzV2l0aChcIkN1c3RvbVwiKSl7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvL+WIneWni+WMlnJlc291cmNlc1xyXG4gICAgY29uc3QgckJ1bmRsZUluZm8gOiBBc3NldEJ1bmRsZUluZm8gPSB7XHJcbiAgICAgICAgdXJsIDogcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsXCJhc3NldHNcIixcInJlc291cmNlc1wiKS5yZXBsYWNlQWxsKFwiXFxcXFwiLFwiL1wiKSxcclxuICAgICAgICBkYl91cmwgOiBcImRiOi8vYXNzZXRzL3Jlc291cmNlc1wiLFxyXG4gICAgICAgIGJ1bmRsZU5hbWUgOiBcInJlc291cmNlc1wiLFxyXG4gICAgICAgIHByZWZhYk5hbWUgOiBcIlwiLFxyXG4gICAgICAgIHByZWZhYlN1YlVybCA6IFwiXCIsXHJcbiAgICAgICAgaTE4bl9sYWJlbHMgOiBbXSxcclxuICAgIH07XHJcbiAgICBQcmVmYWJVdGlscy5Jbml0QnVuZGxlKHJCdW5kbGVJbmZvKTtcclxuICAgIC8vQ29tcG9uZW50VXRpbHPliJ3lp4vljJZcclxuICAgIENvbXBvbmVudFV0aWxzLkluaXQoKTtcclxuICAgIGNvbnN0IGJ1bmRsZUluZm8gICAgPSBBc3NldERiVXRpbHMuR2V0QnVuZGxlTmFtZVdpdGhEYlVybChhc3NldEluZm8udXJsKTtcclxuICAgIGlmKCFidW5kbGVJbmZvKXtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsYWJlbCA6IFwi5a+85Ye6W1wiICsgYnVuZGxlSW5mby5wcmVmYWJOYW1lICsgXCJdXCIsXHJcbiAgICAgICAgICAgIGFzeW5jIGNsaWNrKCkge1xyXG4gICAgICAgICAgICAgICAgLy/lr7zlh7rnlYzpnaLku6PnoIFcclxuICAgICAgICAgICAgICAgIGF3YWl0IGV4cG9ydF9wcmVmYWJfdmlldyhidW5kbGVJbmZvKTtcclxuICAgICAgICAgICAgICAgIC8v5a+85Ye65aSa6K+t6KiA6YWN572uXHJcbiAgICAgICAgICAgICAgICByZWFkSTE4blhsc3hGaWxlRGF0YShidW5kbGVJbmZvLmJ1bmRsZU5hbWUsYnVuZGxlSW5mby5wcmVmYWJOYW1lKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5a+85Ye65aSa6K+t6KiA6YWN572u6KGo5oiQ5Yqf77yBXCIsYnVuZGxlSW5mby5idW5kbGVOYW1lLGJ1bmRsZUluZm8ucHJlZmFiTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAvL+aJk+WHuuaJk+eCuee7n+iuoVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhdGlzdGljYWwgICA9IG5ldyBFeHBvcnRTdGF0aXN0aWNhbChidW5kbGVJbmZvLmJ1bmRsZU5hbWUsYnVuZGxlSW5mby5wcmVmYWJOYW1lLF9ub2RlSW5mb3MpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLlr7zlh7rnu5/orqHmlbDmja7vvJpcIixzdGF0aXN0aWNhbCk7XHJcbiAgICAgICAgICAgICAgICAvL+WvvOWHuuaMh+WumumihOWItuS9k+eahOe7n+iuoeS/oeaBr1xyXG4gICAgICAgICAgICAgICAgc3RhdGlzdGljYWwuZXhwb3J0UGFuZWxTdGF0aWNzKCk7XHJcbiAgICAgICAgICAgICAgICBERUJVRyAmJiBjb25zb2xlLndhcm4oXCLlr7zlh7rnu5/orqHmlbDmja4gPSBcIixzdGF0aXN0aWNhbC5nYW1lSWQsc3RhdGlzdGljYWwuYnVuZGxlTmFtZSxzdGF0aXN0aWNhbC5wcmVmYWJOYW1lKTtcclxuICAgICAgICAgICAgICAgIC8v5a+85Ye66K+l6aKE5Yi25L2T55qE5oyJ6ZKu55qE57uf6K6h5L+h5oGvXHJcbiAgICAgICAgICAgICAgICBzdGF0aXN0aWNhbC5leHBvcnRQcmVmYWJCdXR0b25TdGF0aXN0aWNhbCgpO1xyXG4gICAgICAgICAgICAgICAgLy/mlLbpm4boh6rlrprkuYnmlbDmja5cclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpY2FsLmNvbGxlY3Rpb25DdXN0b21pemVTdGF0aXN0aWNhbCgpO1xyXG4gICAgICAgICAgICAgICAgLy/lhpnlh7rnu5/orqHkv6Hmga/nu5nnrZbliJJcclxuICAgICAgICAgICAgICAgIC8vc3RhdGlzdGljYWwuZXhwb3J0RGF0YUZvclBsYW4oKTtcclxuICAgICAgICAgICAgICAgIC8v5YaZ5Ye66YWN572u5paH5Lu2XHJcbiAgICAgICAgICAgICAgICBzdGF0aXN0aWNhbC53cml0ZUNvbmZpZ1RvRmlsZSgpO1xyXG4gICAgICAgICAgICAgICAgLy/lj5HpgIHpgJrnn6XvvIzopoHmsYLlr7zlh7rphY3nva7ooahcclxuICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2V4cG9ydF94bHN4X2NvbmZpZ19kYicsJ2V4cG9ydF90YXJnZXRfYnVuZGxlX3hsc3gnLGJ1bmRsZUluZm8uYnVuZGxlTmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICBdXHJcbn1cclxuXHJcblxyXG5cclxuXHJcbmxldCBfbm9kZUluZm9zIDogTm9kZUluZm9bXSA9IFtdO1xyXG4vKipcclxuICog5omA5pyJ6ZyA6KaB6KKraTE4buaOp+WItueahGxhYmVsXHJcbiAqL1xyXG5sZXQgX2kxOG5MYWJlbHMgOiB7bmFtZSA6IHN0cmluZyx2YWx1ZSA6IHN0cmluZ31bXSA9IFtdO1xyXG4vKipcclxuICog5omA5pyJ6ZyA6KaB6KKraTE4buaOp+WItueahHNwcml0ZVxyXG4gKi9cclxubGV0IF9pMThuU3ByaXRlcyA6IHtuYW1lIDogc3RyaW5nLHZhbHVlIDogc3RyaW5nfVtdID0gW107XHJcbi8qKlxyXG4gKiDmiYDmnInpnIDopoHooqtpMThu5o6n5Yi255qE5a+M5paH5pysXHJcbiAqL1xyXG5sZXQgX2kxOG5fcmljaF90ZXh0cyA6IHtuYW1lIDogc3RyaW5nLHZhbHVlIDogc3RyaW5nfVtdID0gW107XHJcblxyXG4vKipcclxuICog5a+85Ye65oyH5a6a55qEYnVuZGxlXHJcbiAqIEBwYXJhbSBidW5kbGVJbmZvIFxyXG4gKi9cclxuYXN5bmMgZnVuY3Rpb24gZXhwb3J0X3ByZWZhYl92aWV3KGJ1bmRsZUluZm8gOiBBc3NldEJ1bmRsZUluZm8pe1xyXG4gICAgX25vZGVJbmZvcyAgICAgID0gW107XHJcbiAgICBfaTE4bkxhYmVscyAgICAgPSBbXTtcclxuICAgIF9pMThuU3ByaXRlcyAgICA9IFtdO1xyXG4gICAgX2kxOG5fcmljaF90ZXh0cyA9IFtdO1xyXG4gICAgLy/lrZDnm67lvZVcclxuICAgIGNvbnN0IHN1YlVybCAgICA9IGJ1bmRsZUluZm8ucHJlZmFiU3ViVXJsO1xyXG5cclxuICAgIGxldCBwcmVmYWJGaWxlVXJsID0gcGF0aC5qb2luKGJ1bmRsZUluZm8udXJsLFwicHJlZmFic1wiKTsvL2J1bmRsZUluZm8udXJsICsgYCR7cF9wYXRofXByZWZhYnMke3BfcGF0aH1gICsgYnVuZGxlSW5mby5wcmVmYWJOYW1lICsgXCIucHJlZmFiXCI7XHJcbiAgICBpZihzdWJVcmwgIT0gXCJcIil7XHJcbiAgICAgICAgcHJlZmFiRmlsZVVybCA9IHBhdGguam9pbihwcmVmYWJGaWxlVXJsLHN1YlVybCk7XHJcbiAgICB9XHJcbiAgICBwcmVmYWJGaWxlVXJsID0gcGF0aC5qb2luKHByZWZhYkZpbGVVcmwsYnVuZGxlSW5mby5wcmVmYWJOYW1lICsgXCIucHJlZmFiXCIpLnJlcGxhY2VBbGwoXCJcXFxcXCIsXCIvXCIpO1xyXG4gICAgY29uc3QgdGV4dCAgPSBmcy5yZWFkRmlsZVN5bmMocHJlZmFiRmlsZVVybCx7ZW5jb2RpbmcgOiBcInV0Zi04XCJ9KTtcclxuICAgIGNvbnN0IGRhdGEgID0gSlNPTi5wYXJzZSh0ZXh0KTtcclxuICAgIGF3YWl0IF9yZWN1cnNpb25Mb2FkKGRhdGEsZGF0YVsxXSk7XHJcbiAgICBERUJVRyAmJiBjb25zb2xlLmxvZyhcIuaJgOacieeahOiKgueCueS/oeaBr++8mlwiLF9ub2RlSW5mb3MpO1xyXG4gICAgbGV0IGRiUGF0aCAgICAgICAgPSBidW5kbGVJbmZvLmRiX3VybDtcclxuICAgIGlmKGRiUGF0aC5lbmRzV2l0aChcIi9cIikpe1xyXG4gICAgICAgIGRiUGF0aCAgPSBkYlBhdGguc3Vic3RyaW5nKDAsZGJQYXRoLmxlbmd0aCAtIDEpO1xyXG4gICAgfVxyXG4gICAgbGV0IHNjcmlwdFBhdGggICAgPSAnJztcclxuICAgIGlmKGJ1bmRsZUluZm8uYnVuZGxlTmFtZSA9PSBcInJlc291cmNlc1wiKXtcclxuICAgICAgICBzY3JpcHRQYXRoICA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLFwiYXNzZXRzXCIsXCJyZXNvdXJjZXNcIixcInNjcmlwdHNcIixcInZpZXdcIik7XHJcbiAgICAgICAgZGJQYXRoICAgICAgPSBcImRiOi8vYXNzZXRzL3Jlc291cmNlcy9zY3JpcHRzL3ZpZXcvXCI7XHJcbiAgICAgICAgaWYoc3ViVXJsICE9IFwiXCIpe1xyXG4gICAgICAgICAgICBzY3JpcHRQYXRoID0gcGF0aC5qb2luKHNjcmlwdFBhdGgsc3ViVXJsKTtcclxuICAgICAgICAgICAgZGJQYXRoID0gZGJQYXRoICsgc3ViVXJsICsgXCIvXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgc2NyaXB0UGF0aCAgPSBwYXRoLmpvaW4oYnVuZGxlSW5mby51cmwsXCJzY3JpcHRzXCIsXCJ2aWV3XCIpO1xyXG4gICAgICAgIGRiUGF0aCAgICAgID0gXCJkYjovL2Fzc2V0cy9idW5kbGVzL1wiICsgYnVuZGxlSW5mby5idW5kbGVOYW1lICsgXCIvc2NyaXB0cy92aWV3L1wiO1xyXG4gICAgICAgIGlmKHN1YlVybCAhPSBcIlwiKXtcclxuICAgICAgICAgICAgc2NyaXB0UGF0aCA9IHBhdGguam9pbihzY3JpcHRQYXRoLHN1YlVybCk7XHJcbiAgICAgICAgICAgIGRiUGF0aCA9IGRiUGF0aCArIHN1YlVybCArIFwiL1wiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHNjcmlwdFBhdGggPSBwYXRoLmpvaW4oc2NyaXB0UGF0aCxidW5kbGVJbmZvLnByZWZhYk5hbWUgKyBcIi50c1wiKS5yZXBsYWNlQWxsKFwiXFxcXFwiLFwiL1wiKTtcclxuICAgIGRiUGF0aCA9IChkYlBhdGggKyBidW5kbGVJbmZvLnByZWZhYk5hbWUgKyBcIi50c1wiKS5yZXBsYWNlQWxsKFwiXFxcXFwiLFwiL1wiKTtcclxuXHJcbiAgICBERUJVRyAmJiBjb25zb2xlLmxvZyhcIuiEmuacrOi3r+W+hO+8mlwiLHNjcmlwdFBhdGgpO1xyXG4gICAgREVCVUcgJiYgY29uc29sZS5sb2coXCJkYui3r+W+hO+8mlwiLGRiUGF0aCk7XHJcbiAgICBcclxuXHJcbiAgICBpZihmcy5leGlzdHNTeW5jKHNjcmlwdFBhdGgpKXtcclxuICAgICAgICAvL+WmguaenOaWh+S7tuW3sue7j+WtmOWcqFxyXG4gICAgICAgIGNvbnN0IGxpbmVzID0gRmlsZVV0aWxzLkdldEZpbGVDb250ZW50QnlMaW5lcyhzY3JpcHRQYXRoKTtcclxuICAgICAgICBjb25zdCB0ZXh0ICA9IF9ob3RmaXhWaWV3Q29kZShsaW5lcyxkYXRhLGJ1bmRsZUluZm8pO1xyXG4gICAgICAgIGF3YWl0IEFzc2V0RGJVdGlscy5SZXF1ZXN0Q3JlYXRlTmV3QXNzZXQoZGJQYXRoLHRleHQsdHJ1ZSk7XHJcbiAgICAgICAgREVCVUcgJiYgY29uc29sZS5sb2coXCLmm7TmlrDohJrmnKzvvJpcIiArIGJ1bmRsZUluZm8ucHJlZmFiTmFtZSArIFwi5oiQ5Yqf77yBXCIpO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgY29uc3QgdGV4dCAgPSBfbWFrZU5ld1ZpZXdDb2RlKGRhdGEsYnVuZGxlSW5mbyk7XHJcbiAgICAgICAgLy/lhpnlhaVcclxuICAgICAgICBhd2FpdCBBc3NldERiVXRpbHMuUmVxdWVzdENyZWF0ZU5ld0Fzc2V0KGRiUGF0aCx0ZXh0LHRydWUpO1xyXG4gICAgICAgIERFQlVHICYmIGNvbnNvbGUubG9nKFwi5YaZ5YWl5paw55qE6ISa5pys77yaXCIgKyBidW5kbGVJbmZvLnByZWZhYk5hbWUgKyBcIuaIkOWKn++8gVwiKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAgICAgKiDmoLnmja7oioLngrnnmoTlkI3lrZfvvIznlJ/miJDkuIDkuKrov5nkuKroioLngrnkvZzkuLrmjInpkq7nmoTlm57osIPmlrnms5VcclxuICAgICAqIEBwYXJhbSBub2RlTmFtZSBjY19idXR0b25DbG9zZSAtPiBvbkNsaWNrQnV0dG9uQ2xvc2VcclxuICAgICAqL1xyXG5mdW5jdGlvbiBfZ2V0QnV0dG9uRXZlbnRCeU5vZGVOYW1lKG5vZGVOYW1lIDogc3RyaW5nKXtcclxuICAgIGNvbnN0IGJ1dHRvbk5hbWUgICAgPSBub2RlTmFtZS5zdWJzdHJpbmcoOSk7XHJcbiAgICByZXR1cm4gXCJvbkNsaWNrQnV0dG9uXCIgKyBidXR0b25OYW1lO1xyXG59XHJcblxyXG4vKipcclxuICog5a+55bey57uP5a2Y5Zyo55qE55WM6Z2i5Luj56CB6L+b6KGM5pu05pawXHJcbiAqIEBwYXJhbSBkYXRhIFxyXG4gKiBAcGFyYW0gYnVuZGxlSW5mbyBcclxuICovXHJcbmZ1bmN0aW9uIF9ob3RmaXhWaWV3Q29kZShsaW5lcyA6IHN0cmluZ1tdLGRhdGEgOiBhbnksYnVuZGxlSW5mbyA6IEFzc2V0QnVuZGxlSW5mbyl7XHJcbiAgICBjb25zdCBzY3JpcHRQYXRoICAgID0gcGF0aC5qb2luKGJ1bmRsZUluZm8udXJsLFwic2NyaXB0c1wiLFwidmlld1wiKTtcclxuICAgIGNvbnN0IHNjcmlwdE5hbWUgICAgPSBidW5kbGVJbmZvLnByZWZhYk5hbWU7XHJcbiAgICBsZXQgaTEgPSAwLCBpMiA9IDA7XHJcbiAgICBbaTEsIGkyXSA9IFRvb2xzLmZpbmRMaW5lVGFnKGxpbmVzLCBJTVBPUlRfQkVHSU5fVEFHLCBJTVBPUlRfRU5EX1RBRyk7XHJcbiAgICBpZiAoaTEgPT0gbnVsbCB8fCBpMiA9PSBudWxsKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwiW+itpuWRil0gaW1wb3J05Yy65Z+fdGFn5pyq5om+5Yiw77yB6K+35qOA5p+ldmlld+S7o+egge+8gVwiLCBzY3JpcHRQYXRoLHNjcmlwdE5hbWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyDliKDpmaTlt7LmnInlhYPntKBcclxuICAgICAgICBsaW5lcy5zcGxpY2UoaTEgKyAxLCBpMiAtIGkxIC0gMSlcclxuXHJcbiAgICAgICAgbGV0IGJsb2NrVGV4dCA9IF9tYWtlSW1wb3J0QmxvY2tDb2RlKGJ1bmRsZUluZm8pO1xyXG4gICAgICAgIGlmIChibG9ja1RleHQpIHtcclxuICAgICAgICAgICAgYmxvY2tUZXh0ID0gYmxvY2tUZXh0LnN1YnN0cmluZygwLCBibG9ja1RleHQubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgIC8vIOaPkuWFpWltcG9ydOWMuuWfn+WGheWuuVxyXG4gICAgICAgICAgICBsaW5lcy5zcGxpY2UoaTEgKyAxLCAwLCBibG9ja1RleHQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gMi4gcmVzb3VyY2UgYmxvYWNrXHJcbiAgICBbaTEsIGkyXSA9IFRvb2xzLmZpbmRMaW5lVGFnKGxpbmVzLCBSRVNPVVJDRV9CRUdJTl9UQUcsIFJFU09VUkNFX0VORF9UQUcpO1xyXG4gICAgaWYgKGkxID09IG51bGwgfHwgaTIgPT0gbnVsbCkge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihcIlvorablkYpdIHJlc291cmNl5Yy65Z+fdGFn5pyq5om+5Yiw77yB6K+35qOA5p+ldmlld+S7o+egge+8gVwiLCBzY3JpcHRQYXRoLHNjcmlwdE5hbWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyDliKDpmaTlt7LmnInlhYPntKBcclxuICAgICAgICBsaW5lcy5zcGxpY2UoaTEgKyAxLCBpMiAtIGkxIC0gMSlcclxuXHJcbiAgICAgICAgbGV0IGJsb2NrVGV4dCA9IF9tYWtlUmVzb3VyY2VCbG9ja0NvZGUoYnVuZGxlSW5mbyk7XHJcbiAgICAgICAgaWYgKGJsb2NrVGV4dCkge1xyXG4gICAgICAgICAgICBibG9ja1RleHQgPSBibG9ja1RleHQuc3Vic3RyaW5nKDAsIGJsb2NrVGV4dC5sZW5ndGggLSAxKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOaPkuWFpWltcG9ydOWMuuWfn+WGheWuuVxyXG4gICAgICAgICAgICBsaW5lcy5zcGxpY2UoaTEgKyAxLCAwLCBibG9ja1RleHQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLzMuZXZlbnQgYmxvY2tcclxuICAgIFtpMSwgaTJdID0gVG9vbHMuZmluZExpbmVUYWcobGluZXMsIEVWRU5UX0JFR0lOX1RBRywgRVZFTlRfRU5EX1RBRyk7XHJcbiAgICBpZiAoaTEgPT0gbnVsbCB8fCBpMiA9PSBudWxsKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwiW+itpuWRil0gZXZlbnTljLrln590YWfmnKrmib7liLDvvIHor7fmo4Dmn6V2aWV35Luj56CB77yBXCIsIHNjcmlwdFBhdGgsc2NyaXB0TmFtZSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICAvL2V2ZW506ZyA6KaB54m55q6K5aSE55CG77yM5Zug5Li65LiN6IO95Yig6Zmk5bey57uP5Ye6546w55qE6YC76L6R77yM5Y+q6ZyA6KaB5aSE55CG5paw5aKe77yM5LiN6ZyA6KaB5aSE55CG5bey57uP5a2Y5Zyo55qEXHJcbiAgICAgICAgbGV0IG5vZGVOYW1lcyAgIDogc3RyaW5nW10gID0gW107XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpPF9ub2RlSW5mb3MubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZm8gID0gX25vZGVJbmZvc1tpXTtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSAgPSBpbmZvLm5vZGVOYW1lO1xyXG4gICAgICAgICAgICBpZihuYW1lLnN0YXJ0c1dpdGgoXCJjY19idXR0b25cIikpe1xyXG4gICAgICAgICAgICAgICAgbm9kZU5hbWVzLnB1c2gobmFtZS5zdWJzdHJpbmcoOSkpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihub2RlTmFtZXMubGVuZ3RoID4gMCl7XHJcbiAgICAgICAgICAgIC8v5aaC5p6c5Y+R546w5pyJ5oyJ6ZKu77yM5LuO5b2T5YmN5pWw5o2u5Lit6I635Y+WXHJcbiAgICAgICAgICAgIGNvbnN0IGFyciAgICAgICA9IGxpbmVzLnNwbGljZShpMSArIDEsIGkyIC0gaTEgLSAxKTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ICAgID0gX2hvdEZpeEJ1dHRvbkV2ZW50KGFycixub2RlTmFtZXMpO1xyXG4gICAgICAgICAgICBjb25zdCB0ZXh0ICAgICAgPSByZXN1bHQuam9pbihcIlxcblwiKTtcclxuICAgICAgICAgICAgbGluZXMuc3BsaWNlKGkxICsgMSwwICx0ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIF9tYWtlTmV3RXZlbnRCbG9ja0NvZGUoKXtcclxuICAgIC8v6I635Y+W5Yiw5omA5pyJ5LulY2NfYnV0dG9u5byA5aS055qE546p5oSP5YS/XHJcbiAgICBsZXQgbm9kZU5hbWVzICAgOiBzdHJpbmdbXSAgPSBbXTtcclxuICAgIGZvcihsZXQgaSA9IDA7aTxfbm9kZUluZm9zLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGNvbnN0IGluZm8gID0gX25vZGVJbmZvc1tpXTtcclxuICAgICAgICBjb25zdCBuYW1lICA9IGluZm8ubm9kZU5hbWU7XHJcbiAgICAgICAgaWYobmFtZS5zdGFydHNXaXRoKFwiY2NfYnV0dG9uXCIpKXtcclxuICAgICAgICAgICAgbm9kZU5hbWVzLnB1c2gobmFtZSk7XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKG5vZGVOYW1lcy5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG4gICAgbGV0IHRleHQgICAgPSAnJztcclxuICAgIGZvcihsZXQgaSA9IDA7aTxub2RlTmFtZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgY29uc3QgbmFtZSAgPSBub2RlTmFtZXNbaV07XHJcbiAgICAgICAgbGV0IGNsaWNrRnVuYyA9IF9nZXRCdXR0b25FdmVudEJ5Tm9kZU5hbWUobmFtZSk7XHJcbiAgICAgICAgdGV4dCArPSAnICAgIHByaXZhdGUgJyArIGNsaWNrRnVuYyArICcoZXZlbnQgOiBjYy5FdmVudFRvdWNoKXtcXG4nO1xyXG4gICAgICAgIHRleHQgKz0gXCIgICAgICAgIGNjLmxvZygnb24gY2xpY2sgZXZlbnQgXCIgKyBuYW1lICsgXCInKTtcXG5cIjtcclxuICAgICAgICB0ZXh0ICs9ICcgICAgfVxcbic7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGV4dDtcclxufVxyXG5cclxuLyoqXHJcbiAqIOeUn+aIkOiHquWKqOWMlumUgeWumueahOWGheWuuVxyXG4gKiBAcGFyYW0gYnVuZGxlSW5mbyBcclxuICogQHJldHVybnMgXHJcbiAqL1xyXG5mdW5jdGlvbiBfbWFrZVJlc291cmNlQmxvY2tDb2RlKGJ1bmRsZUluZm8gOiBBc3NldEJ1bmRsZUluZm8pe1xyXG5cclxuICAgIGNvbnN0IHNjcmlwdFVybCA9IHBhdGguam9pbihidW5kbGVJbmZvLnVybCxidW5kbGVJbmZvLnByZWZhYk5hbWUpO1xyXG5cclxuICAgIGxldCBub2RlTmFtZXMgOiBzdHJpbmdbXSAgPSBbXTtcclxuICAgIGxldCBub2RlTmFtZV8yX25vZGVUeXBlIDoge1tuYW1lIDogc3RyaW5nXSA6IHN0cmluZ30gPSB7fTtcclxuICAgIGZvcihsZXQgaSA9IDA7aTxfbm9kZUluZm9zLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGNvbnN0IG5vZGVJbmZvID0gX25vZGVJbmZvc1tpXTtcclxuXHJcbiAgICAgICAgbGV0IG5vZGVOYW1lID0gbm9kZUluZm8ubm9kZU5hbWU7XHJcbiAgICAgICAgaWYoIW5vZGVOYW1lLnN0YXJ0c1dpdGgoXCJjY19cIikpe1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYobm9kZU5hbWVzLmluY2x1ZGVzKG5vZGVOYW1lKSl7XHJcbiAgICAgICAgICAgIC8v5bey57uP5a2Y5ZyoXHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihUb29scy5mb3JtYXQoXCJb6K2m5ZGKXSDpooTliLbku7ZbJXNd5Lit5Y+R546w6IqC54K55ZCN56ew6YeN5aSN77yaWyVzXVwiLCBzY3JpcHRVcmwsIG5vZGVOYW1lKSk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIG5vZGVOYW1lcy5wdXNoKG5vZGVOYW1lKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBsZXQgbm9kZVR5cGUgPSBub2RlSW5mby5ub2RlVHlwZTtcclxuICAgICAgICBpZihub2RlVHlwZS5zdGFydHNXaXRoKFwiY2MuXCIpIHx8IG5vZGVUeXBlLnN0YXJ0c1dpdGgoXCJzcC5cIikgfHwgbm9kZVR5cGUuc3RhcnRzV2l0aChcImRyYWdvbkJvbmVzLlwiKSl7XHJcbiAgICAgICAgICAgIG5vZGVOYW1lXzJfbm9kZVR5cGVbbm9kZU5hbWVdICAgPSBub2RlVHlwZTtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8v6Z2e5Lyg57uf55qE6aKE5Yi25L2T77yM6YKj5bCx5piv5LiA5LiqQ3VzdG9t6aKE5Yi25L2T77yM5LiA5Lya5Zyo6K+05oCO5LmI5aSE55CGXHJcbiAgICAgICAgbm9kZU5hbWVfMl9ub2RlVHlwZVtub2RlTmFtZV0gICA9IG5vZGVUeXBlO1xyXG5cclxuICAgIH1cclxuICAgIG5vZGVOYW1lcyA9IG5vZGVOYW1lcy5zb3J0KCk7XHJcblxyXG4gICAgbGV0IHRleHQgICAgPSAnJztcclxuICAgIHRleHQgKz0gJyAgICBwcm90ZWN0ZWQgX2dldFJlc291cmNlQmluZGluZ0NvbmZpZygpOiBWaWV3QmluZENvbmZpZ1Jlc3VsdCB7XFxuJztcclxuICAgIHRleHQgKz0gJyAgICAgICAgcmV0dXJuIHtcXG4nO1xyXG4gICAgZm9yKGxldCBpID0gMDtpPG5vZGVOYW1lcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICBjb25zdCBub2RlTmFtZSAgPSBub2RlTmFtZXNbaV07XHJcbiAgICAgICAgY29uc3Qgbm9kZVR5cGUgID0gbm9kZU5hbWVfMl9ub2RlVHlwZVtub2RlTmFtZV07XHJcbiAgICAgICAgaWYobm9kZU5hbWUuc3RhcnRzV2l0aChcImNjX2J1dHRvblwiKSl7XHJcbiAgICAgICAgICAgIGNvbnN0IGNsaWNrRnVuYyA9IF9nZXRCdXR0b25FdmVudEJ5Tm9kZU5hbWUobm9kZU5hbWUpO1xyXG4gICAgICAgICAgICB0ZXh0ICs9ICcgICAgICAgICAgICAnICsgbm9kZU5hbWUgKyBcIiAgICA6IFtcIiArIG5vZGVUeXBlK1wiLHRoaXMuXCIgKyBjbGlja0Z1bmMgKyBcIi5iaW5kKHRoaXMpXSxcXG5cIjtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGV4dCArPSAnICAgICAgICAgICAgJyArIG5vZGVOYW1lICsgXCIgICAgOiBbXCIgKyBub2RlVHlwZStcIl0sXFxuXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuICAgIHRleHQgKz0gJyAgICAgICAgfTtcXG4nO1xyXG4gICAgdGV4dCArPSAnICAgIH1cXG4nO1xyXG5cclxuICAgIHRleHQgKz0gJyAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSDmiYDmnInlj6/nlKjlj5jph48gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cXG4nO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlTmFtZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBub2RlTmFtZSA9IG5vZGVOYW1lc1tpXTtcclxuICAgICAgICBsZXQgdmFyTmFtZSA9IG5vZGVOYW1lLnN1YnN0cmluZygzLCBub2RlTmFtZS5sZW5ndGgpO1xyXG4gICAgICAgIGxldCBub2RlVHlwZSA9IG5vZGVOYW1lXzJfbm9kZVR5cGVbbm9kZU5hbWVdO1xyXG5cclxuICAgICAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnICAgcHJvdGVjdGVkICVzOiAlcyAgICA9IG51bGw7XFxuJywgdmFyTmFtZSwgbm9kZVR5cGUpO1xyXG4gICAgfVxyXG4gICAgdGV4dCArPSBcIiAgICAvKipcXG5cIjtcclxuICAgIHRleHQgKz0gXCIgICAgICog5b2T5YmN55WM6Z2i55qE5ZCN5a2XXFxuXCI7XHJcbiAgICB0ZXh0ICs9IFwiICAgICAqIOivt+WLv+S/ruaUue+8jOiEmuacrOiHquWKqOeUn+aIkFxcblwiO1xyXG4gICAgdGV4dCArPSBcIiAgICAqL1xcblwiO1xyXG4gICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFZJRVdfTkFNRSAgICA9ICdcIiArICBidW5kbGVJbmZvLnByZWZhYk5hbWUgKyBcIic7XFxuXCIpO1xyXG4gICAgdGV4dCArPSBcIiAgICAvKipcXG5cIjtcclxuICAgIHRleHQgKz0gXCIgICAgICog5b2T5YmN55WM6Z2i55qE5omA5bGe55qEYnVuZGxl5ZCN5a2XXFxuXCI7XHJcbiAgICB0ZXh0ICs9IFwiICAgICAqIOivt+WLv+S/ruaUue+8jOiEmuacrOiHquWKqOeUn+aIkFxcblwiO1xyXG4gICAgdGV4dCArPSBcIiAgICAqL1xcblwiO1xyXG4gICAgdGV4dCArPSBUb29scy5mb3JtYXQoXCIgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEJVTkRMRV9OQU1FICA9ICdcIiArIGJ1bmRsZUluZm8uYnVuZGxlTmFtZSArIFwiJztcXG5cIik7XHJcbiAgICB0ZXh0ICs9IFwiICAgIC8qKlxcblwiO1xyXG4gICAgdGV4dCArPSBcIiAgICAgKiDor7fli7/kv67mlLnvvIzohJrmnKzoh6rliqjnlJ/miJBcXG5cIjtcclxuICAgIHRleHQgKz0gXCIgICAgKi9cXG5cIjtcclxuICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KFwiICAgcHVibGljIGdldCBidW5kbGVOYW1lKCkge1xcblwiKTtcclxuICAgIHRleHQgKz0gXCIgICAgICAgIHJldHVybiBcIiArIGJ1bmRsZUluZm8ucHJlZmFiTmFtZSArIFwiLkJVTkRMRV9OQU1FO1xcblwiO1xyXG4gICAgdGV4dCArPSBcIiAgICB9XFxuXCI7XHJcbiAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdChcIiAgIHB1YmxpYyBnZXQgdmlld05hbWUoKXtcXG5cIik7XHJcbiAgICB0ZXh0ICs9IFwiICAgICAgICByZXR1cm4gXCIgKyBidW5kbGVJbmZvLnByZWZhYk5hbWUgKyBcIi5WSUVXX05BTUU7XFxuXCI7XHJcbiAgICB0ZXh0ICs9IFwiICAgIH1cXG5cIjtcclxuICAgIHJldHVybiB0ZXh0O1xyXG59XHJcblxyXG4vKipcclxuICog55Sf5oiQIOS4gOauteWFqOaWsOeahOS7o+eggVxyXG4gKiBAcGFyYW0gZGF0YSBcclxuICogQHBhcmFtIGJ1bmRsZUluZm8gXHJcbiAqIEByZXR1cm5zIFxyXG4gKi9cclxuZnVuY3Rpb24gX21ha2VOZXdWaWV3Q29kZShkYXRhIDogYW55LGJ1bmRsZUluZm8gOiBBc3NldEJ1bmRsZUluZm8pe1xyXG5cclxuICAgIGxldCBzY3JpcHROYW1lICA9IGJ1bmRsZUluZm8ucHJlZmFiTmFtZTtcclxuICAgIFxyXG5cclxuICAgIGxldCB0ZXh0ID0gXCJcIjtcclxuICAgIC8vMS5pbXBvcnQgYmxvY2tcclxuICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCclc1xcbicsIElNUE9SVF9CRUdJTl9UQUcpO1xyXG4gICAgdGV4dCArPSBfbWFrZUltcG9ydEJsb2NrQ29kZShidW5kbGVJbmZvKTtcclxuICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCclc1xcbicsIElNUE9SVF9FTkRfVEFHKTtcclxuICAgIHRleHQgKz0gJ1xcbic7XHJcbiAgICB0ZXh0ICs9ICdjb25zdCB7IGNjY2xhc3MsIHByb3BlcnR5IH0gPSBjYy5fZGVjb3JhdG9yO1xcbic7XHJcbiAgICB0ZXh0ICs9ICdcXG4nO1xyXG4gICAgLy8yLuexu+WQjVxyXG4gICAgdGV4dCArPSBcIkBjY2NsYXNzKCdcIiArIHNjcmlwdE5hbWUgKyBcIicpXFxuXCI7XHJcbiAgICB0ZXh0ICs9ICdleHBvcnQgZGVmYXVsdCBjbGFzcyAnICsgc2NyaXB0TmFtZSArICcgZXh0ZW5kcyBWaWV3QmFzZSB7XFxuJztcclxuICAgIC8vMy7nlJ/lkb3lkajmnJ9cclxuICAgIHRleHQgKz0gJ1xcbic7XHJcbiAgICB0ZXh0ICs9ICcgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0g55Sf5ZG95ZGo5pyfIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXFxuJztcclxuICAgIHRleHQgKz0gJyAgICBwcm90ZWN0ZWQgb25Mb2FkKCk6IHZvaWQge1xcbic7XHJcbiAgICB0ZXh0ICs9ICcgICAgICAgIHN1cGVyLm9uTG9hZCgpO1xcbic7XHJcbiAgICB0ZXh0ICs9ICcgICAgfVxcbic7XHJcbiAgICB0ZXh0ICs9ICdcXG4nO1xyXG4gICAgdGV4dCArPSAnICAgIHByb3RlY3RlZCBvbkRlc3Ryb3koKTogdm9pZCB7XFxuJztcclxuICAgIHRleHQgKz0gJyAgICAgICAgc3VwZXIub25EZXN0cm95KCk7XFxuJztcclxuICAgIHRleHQgKz0gJyAgICB9XFxuJztcclxuICAgIHRleHQgKz0gJ1xcblxcbic7XHJcbiAgICB0ZXh0ICs9ICcgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0g5YaF6YOo6YC76L6RIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXFxuJztcclxuICAgIHRleHQgKz0gJ1xcblxcblxcblxcblxcblxcblxcblxcblxcblxcbic7XHJcbiAgICB0ZXh0ICs9ICcgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0g572R57uc5raI5oGvIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXFxuJztcclxuICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCclc1xcbicsIE5FVF9CRUdJTl9UQUcpO1xyXG4gICAgdGV4dCArPSAnXFxuJztcclxuICAgIGlmKGJ1bmRsZUluZm8ucHJlZmFiTmFtZS5zdGFydHNXaXRoKFwiUGFuZWxcIikpe1xyXG4gICAgICAgIHRleHQgKz0gJyAgICBwdWJsaWMgb25OZXR3b3JrTWVzc2FnZShtc2dUeXBlIDogc3RyaW5nLGRhdGEgOiBhbnkpIDogYm9vbGVhbiB7XFxuJztcclxuICAgICAgICB0ZXh0ICs9ICcgICAgICAgIHJldHVybiBmYWxzZTtcXG4nO1xyXG4gICAgICAgIHRleHQgKz0gJyAgICB9XFxuJztcclxuICAgIH1lbHNlIGlmKGJ1bmRsZUluZm8ucHJlZmFiTmFtZS5zdGFydHNXaXRoKFwiQ3VzdG9tXCIpKXtcclxuICAgICAgICB0ZXh0ICs9ICcvL+i/meaYr+S4gOS4qkN1c3RvbemihOWItuS9k++8jOS4jeS8muiiq+S4u+WKqOaOqOmAgee9kee7nOa2iOaBr++8jOmcgOimgeiHquW3seWcqFBhbmVs5Lit5Li75Yqo5o6o6YCBXFxuJztcclxuICAgIH1cclxuICAgIHRleHQgKz0gJ1xcbic7XHJcbiAgICB0ZXh0ICs9IFRvb2xzLmZvcm1hdCgnJXNcXG4nLCBFVkVOVF9FTkRfVEFHKTtcclxuICAgIHRleHQgKz0gJ1xcbic7XHJcbiAgICB0ZXh0ICs9ICcgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0g5LqL5Lu25a6a5LmJIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXFxuJztcclxuICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCclc1xcbicsIEVWRU5UX0JFR0lOX1RBRyk7XHJcbiAgICB0ZXh0ICs9IF9tYWtlTmV3RXZlbnRCbG9ja0NvZGUoKTtcclxuICAgIHRleHQgKz0gVG9vbHMuZm9ybWF0KCclc1xcbicsIEVWRU5UX0VORF9UQUcpO1xyXG5cclxuICAgIHRleHQgKz0gJ1xcblxcbic7XHJcblxyXG4gICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyVzXFxuJywgUkVTT1VSQ0VfQkVHSU5fVEFHKTtcclxuICAgIHRleHQgKz0gJ1xcbic7XHJcbiAgICB0ZXh0ICs9IF9tYWtlUmVzb3VyY2VCbG9ja0NvZGUoYnVuZGxlSW5mbyk7XHJcbiAgICB0ZXh0ICs9ICdcXG4nO1xyXG4gICAgdGV4dCArPSBUb29scy5mb3JtYXQoJyVzXFxuJywgUkVTT1VSQ0VfRU5EX1RBRyk7XHJcblxyXG5cclxuICAgIHRleHQgKz0gJ31cXG4nO1xyXG4gICAgcmV0dXJuIHRleHQ7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBfcHVzaE9uZWkxOG5MYWJlbChsYWJlbE5hbWUgOiBzdHJpbmcsdmFsdWUgOiBzdHJpbmcpe1xyXG4gICAgZm9yKGxldCBpID0gMDtpPF9pMThuTGFiZWxzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGNvbnN0IGluZm8gPSBfaTE4bkxhYmVsc1tpXTtcclxuICAgICAgICBpZihpbmZvLm5hbWUgPT0gbGFiZWxOYW1lKXtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi5Y+R546w6YeN5aSN55qEaTE4buagh+etvu+8mlwiICsgbGFiZWxOYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9pMThuTGFiZWxzLnB1c2goe25hbWUgOiBsYWJlbE5hbWUsdmFsdWUgOiB2YWx1ZX0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBfcHVzaE9uZVJpY2hUZXh0KGxhYmVsTmFtZSA6IHN0cmluZyx2YWx1ZSA6IHN0cmluZyl7XHJcbiAgICBmb3IobGV0IGkgPSAwO2k8X2kxOG5fcmljaF90ZXh0cy5sZW5ndGg7aSsrKXtcclxuICAgICAgICBjb25zdCBpbmZvID0gX2kxOG5fcmljaF90ZXh0c1tpXTtcclxuICAgICAgICBpZihpbmZvLm5hbWUgPT0gbGFiZWxOYW1lKXtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi5Y+R546w6YeN5aSN55qEaTE4buWvjOaWh+acrOagh+etvu+8mlwiICsgbGFiZWxOYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIF9pMThuX3JpY2hfdGV4dHMucHVzaCh7bmFtZSA6IGxhYmVsTmFtZSx2YWx1ZSA6IHZhbHVlfSk7XHJcblxyXG59XHJcblxyXG4vKipcclxuICog5aSE55CG6aKE5Yi25L2T6K+75Y+WXHJcbiAqIEBwYXJhbSBkYXRhIFxyXG4gKiBAcGFyYW0gdGFnIFxyXG4gKiBAcGFyYW0gbGV2ZWwgXHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiBfcmVjdXJzaW9uTG9hZChkYXRhIDogYW55LHRhZyA6IGFueSxsZXZlbCA9IDApIHtcclxuICAgIGlmKGxldmVsID4gMCAmJiB0YWcuX3ByZWZhYiAmJiAhdGFnLl9uYW1lKXtcclxuICAgICAgICAvL+i/meS4queOqeaEj+WEv+aYr+S4gOS4qlByZWZhYueahOS/oeaBr+iKgueCuVxyXG4gICAgICAgIGxldCBuZXh0SW5kZXggPSB0YWcuX3ByZWZhYi5fX2lkX187XHJcbiAgICAgICAgYXdhaXQgX2xvYWRDdXN0b21QcmVmYWJJbmZvKGRhdGEsZGF0YVtuZXh0SW5kZXhdKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBERUJVRyAmJiBjb25zb2xlLmxvZyhcIuW8gOWni+ino+aekHRhZy0+XCIsdGFnKTtcclxuICAgIGNvbnN0IG5vZGVOYW1lICAgICAgICAgID0gdGFnLl9uYW1lO1xyXG4gICAgY29uc3QgY29tcG9uZW50TmFtZXMgICAgPSBbXTtcclxuICAgIGxldCBub2RlVHlwZSAgICAgICAgICAgID0gXCJcIjtcclxuICAgIGxldCB1aVRyYW5zZm9ybSA9IGZhbHNlO1xyXG5cclxuICAgIGlmKG5vZGVOYW1lLmluY2x1ZGVzKCdpMThuJykpe1xyXG4gICAgICAgIC8v6ZyA6KaB6KKr5aSE55CG5oiQ5aSa6K+t6KiA55qEbGFiZWzvvIzmo4Dmn6XkuIvpnaLmnInmsqHmnIlMYWJlbOe7hOS7tlxyXG4gICAgICAgIC8vY29uc29sZS53YXJuKCfojrflj5bliLDlpJror63oqIDoioLngrnvvJonLG5vZGVOYW1lKTtcclxuICAgICAgICBpZighdGFnLl9jb21wb25lbnRzKXtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi6KKr5L2g5qCH6K6w5Li6aTE4bueahOiKgueCueS4i+mdouaJvuS4jeWIsOS7u+S9lee7hOS7tueahOS/oeaBr++8n1wiLG5vZGVOYW1lKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgLy/mo4Dmn6Xml7bllaXnjqnmhI/lhL9cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YWcuX2NvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gdGFnLl9jb21wb25lbnRzW2ldLl9faWRfXztcclxuICAgICAgICAgICAgICAgIGxldCBjb21wb25lbnRUYWcgPSBkYXRhW2NvbXBvbmVudEluZGV4XTtcclxuICAgICAgICAgICAgICAgIGlmKGNvbXBvbmVudFRhZy5fX3R5cGVfXyA9PSBcImNjLkxhYmVsXCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIF9wdXNoT25laTE4bkxhYmVsKG5vZGVOYW1lLGNvbXBvbmVudFRhZy5fc3RyaW5nKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1lbHNlIGlmKGNvbXBvbmVudFRhZy5fX3R5cGVfXyA9PSBcImNjLlJpY2hUZXh0XCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIF9wdXNoT25lUmljaFRleHQobm9kZU5hbWUsY29tcG9uZW50VGFnLl9zdHJpbmcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfWVsc2UgaWYoY29tcG9uZW50VGFnLl9fdHlwZV9fID09IFwiY2MuU3ByaXRlXCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IF9zcHJpdGVGcmFtZSA9IGNvbXBvbmVudFRhZy5fc3ByaXRlRnJhbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgX191dWlkX18gID0gX3Nwcml0ZUZyYW1lLl9fdXVpZF9fO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IEFzc2V0RGJVdGlscy5SZXF1ZXN0UXVlcnlBc3NldEluZm8oX191dWlkX18pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGFzc2V0SW5mbyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwZlBhdGggPSBhc3NldEluZm8ucGF0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy/mib7liLB0ZXh0dXJlc+eahOS9jee9rlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0dXJlc0luZGV4ID0gc3BmUGF0aC5pbmRleE9mKFwidGV4dHVyZXNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHRleHR1cmVzSW5kZXggPCAwKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8v5pyJ6Zeu6aKYXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5L2g55qEU3ByaXRlRnJhbWXotYTmupDkuI3lnKh0ZXh0dXJlc+ebruW9leS4i++8n1wiLHNwZlBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8v5Y+W5YyF5ousdGV4dHVyZXPnmoTlkI7pnaLnmoTpg6jliIZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHR1cmVQYXRoID0gc3BmUGF0aC5zdWJzdHJpbmcodGV4dHVyZXNJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwi5om+5Yiw5LiA5LiqaTE4bueahFNwcml0ZUZyYW1l6LWE5rqQ77yaXCIsbm9kZU5hbWUsdGV4dHVyZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2kxOG5TcHJpdGVzLnB1c2goe25hbWUgOiBub2RlTmFtZSx2YWx1ZSA6IHRleHR1cmVQYXRofSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGlmKG5vZGVOYW1lLnN0YXJ0c1dpdGgoXCJjY19idXR0b25cIikpe1xyXG4gICAgICAgIG5vZGVUeXBlICAgICAgICAgICAgPSBcIkdCdXR0b25cIjtcclxuICAgIH1lbHNle1xyXG4gICAgICAgIGlmKHRhZy5fY29tcG9uZW50cyl7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFnLl9jb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wb25lbnRJbmRleCA9IHRhZy5fY29tcG9uZW50c1tpXS5fX2lkX187XHJcbiAgICAgICAgICAgICAgICBsZXQgY29tcG9uZW50VGFnID0gZGF0YVtjb21wb25lbnRJbmRleF07XHJcbiAgICAgICAgICAgICAgICBjb21wb25lbnROYW1lcy5wdXNoKGNvbXBvbmVudFRhZy5fX3R5cGVfXyk7XHJcbiAgICAgICAgICAgICAgICBpZih1aVRyYW5zZm9ybSAmJiBub2RlVHlwZSA9PSAnJyl7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZVR5cGUgICAgPSBjb21wb25lbnRUYWcuX190eXBlX187XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihjb21wb25lbnRUYWcuX190eXBlX18gPT0gXCJjYy5VSVRyYW5zZm9ybVwiKXtcclxuICAgICAgICAgICAgICAgICAgICB1aVRyYW5zZm9ybSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBub2RlVHlwZSAgICA9IF9jb252ZXJ0Tm9kZVR5cGVTdWJOYW1lc3BhY2VUb0NjKG5vZGVUeXBlKTtcclxuICAgIG5vZGVUeXBlICAgID0gX2NoZWNrU2tpcENvbXBvbmVudChub2RlVHlwZSk7XHJcbiAgICBpZihsZXZlbCA+IDAgJiYgbm9kZU5hbWUuc3RhcnRzV2l0aChcImNjX1wiKSl7XHJcbiAgICAgICAgY29uc3Qgbm9kZUluZm8gOiBOb2RlSW5mbyA9IHtcclxuICAgICAgICAgICAgbm9kZU5hbWUgOiBub2RlTmFtZSxcclxuICAgICAgICAgICAgbm9kZVR5cGUgOiBub2RlVHlwZSB8fCAnY2MuTm9kZScsXHJcbiAgICAgICAgICAgIGdsb2JhbEZpbGVJZCA6ICcnLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3QgY29tcEluZm8gPSBDb21wb25lbnRVdGlscy5HZXRDb21wb25lbnRJbmZvKG5vZGVUeXBlKTtcclxuICAgICAgICBERUJVRyAmJiBjb25zb2xlLmxvZyhcIuW9k+WJjeiKgueCue+8mlwiICsgbm9kZU5hbWUgKyBcIuWvvOWHuuexu+Wei++8mlwiLCBub2RlVHlwZSk7XHJcbiAgICAgICAgREVCVUcgJiYgY29uc29sZS5sb2coXCLlvZPliY1ub2RlVHlwZeiOt+WPluWIsOeahOWFqOWxgOe7hOS7tuS/oeaBr++8mlwiLGNvbXBJbmZvKTtcclxuICAgICAgICBpZihjb21wSW5mbyl7XHJcbiAgICAgICAgICAgIG5vZGVJbmZvLm5vZGVUeXBlID0gY29tcEluZm8uY2xhc3NOYW1lO1xyXG4gICAgICAgICAgICBub2RlSW5mby5nbG9iYWxGaWxlSWQgPSBub2RlVHlwZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgX25vZGVJbmZvcy5wdXNoKG5vZGVJbmZvKTtcclxuICAgIH07XHJcbiAgICBpZih0YWcuX2NoaWxkcmVuKXtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhZy5fY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgY2hpbGRJbmRleCA9IHRhZy5fY2hpbGRyZW5baV0uX19pZF9fO1xyXG4gICAgICAgICAgICBhd2FpdCBfcmVjdXJzaW9uTG9hZChkYXRhLGRhdGFbY2hpbGRJbmRleF0sIGxldmVsICsgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICog5qC55o2u5LiA5Liq6aKE5Yi25L2T55qE5a6M5pW06Lev5b6E77yM5Yid5aeL5YyW5pW05LiqYnVuZGxlXHJcbiAqIEBwYXJhbSBwTmFtZSBcclxuICogQHJldHVybnMg6L+U5Zue6L+Z5Liq6aKE5Yi25L2T55qE6ISa5pys6Lev5b6EXHJcbiAqL1xyXG5mdW5jdGlvbiBfaW5pdEFzc2V0QnVuZGxlSW5mb0J5UHJlZmFiRGlyKHBOYW1lIDogc3RyaW5nKXtcclxuICAgIERFQlVHICYmIGNvbnNvbGUubG9nKFwi6aKE5Yi25L2T6Lev5b6E77yaXCIscE5hbWUpO1xyXG4gICAgbGV0IHNjcmlwdFBhdGggICAgICAgICAgPSBcIlwiO1xyXG4gICAgY29uc3QgYXNzZXRCdW5kbGVJbmZvICAgPSBBc3NldERiVXRpbHMuZ2V0QXNzc2V0QnVuZGxlSW5mb0J5UGF0aChwTmFtZSk7XHJcbiAgICBQcmVmYWJVdGlscy5Jbml0QnVuZGxlKGFzc2V0QnVuZGxlSW5mbyk7XHJcbiAgICBERUJVRyAmJiBjb25zb2xlLndhcm4oXCLlt7Lnn6XpooTliLbkvZNDdXN0b206XCIsYXNzZXRCdW5kbGVJbmZvKTtcclxuICAgIGNvbnN0IHN1YkZvbGRlciA9IGFzc2V0QnVuZGxlSW5mby5wcmVmYWJTdWJVcmw7XHJcbiAgICBpZihhc3NldEJ1bmRsZUluZm8uYnVuZGxlTmFtZSA9PSBcInJlc291cmNlc1wiKXtcclxuICAgICAgICAvL3Jlc291cmNlc+S4i+eahOWFqOmDqOWvvOWHuuWIsOi/meS4quS9jee9rlxyXG4gICAgICAgIHNjcmlwdFBhdGggID0gcGF0aC5qb2luKCdhc3NldHMnLCdyZXNvdXJjZXMnLCdzY3JpcHRzJywndmlldycpO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgLy/lhbbku5bpooTliLbkvZNcclxuICAgICAgICBzY3JpcHRQYXRoICA9IHBhdGguam9pbignYXNzZXRzJywnYnVuZGxlcycsYXNzZXRCdW5kbGVJbmZvLmJ1bmRsZU5hbWUsJ3NjcmlwdHMnLCd2aWV3Jyk7XHJcbiAgICB9XHJcbiAgICBpZihzdWJGb2xkZXIgIT0gXCJcIil7XHJcbiAgICAgICAgc2NyaXB0UGF0aCAgPSBwYXRoLmpvaW4oc2NyaXB0UGF0aCxzdWJGb2xkZXIpO1xyXG4gICAgfVxyXG4gICAgc2NyaXB0UGF0aCAgPSBwYXRoLmpvaW4oc2NyaXB0UGF0aCxhc3NldEJ1bmRsZUluZm8ucHJlZmFiTmFtZSkucmVwbGFjZUFsbChcIlxcXFxcIixcIi9cIik7XHJcbiAgICByZXR1cm4gXCJkYjovL1wiICsgc2NyaXB0UGF0aDtcclxufSAgIFxyXG5cclxuLyoqXHJcbiAqIOS9v+eUqOeahOaYr+mihOWItuS9k++8jOino+aekOi/meS4quS9v+eUqOeahOmihOWItuS9k1xyXG4gKiBAcGFyYW0gZGF0YSBcclxuICogQHBhcmFtIHRhZyBcclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIF9sb2FkQ3VzdG9tUHJlZmFiSW5mbyhkYXRhIDogYW55LHRhZyA6IGFueSkge1xyXG4gICAgbGV0IGluc3RhbmNlSW5kZXggPSB0YWcuaW5zdGFuY2UuX19pZF9fO1xyXG4gICAgbGV0IGluc3RhbmNlVGFnID0gZGF0YVtpbnN0YW5jZUluZGV4XTtcclxuICAgIERFQlVHICYmIGNvbnNvbGUubG9nKFwi5bCd6K+V6Kej5p6Q6aKE5Yi25L2T5bWM5aWX77yaXCIsaW5zdGFuY2VJbmRleCxpbnN0YW5jZVRhZyk7XHJcbiAgICAvLyDpgY3ljoZwcm9wZXJ0eU92ZXJyaWRlc+aPkOWPluWQjeensFxyXG4gICAgbGV0IHByb3BlcnR5T3ZlcnJpZGVzID0gaW5zdGFuY2VUYWcucHJvcGVydHlPdmVycmlkZXM7XHJcbiAgICAvLyDmj5Dlj5boioLngrnlkI3np7BcclxuICAgIGxldCBub2RlTmFtZSA9IFwidW5rbm93blwiO1xyXG4gICAgaWYgKHByb3BlcnR5T3ZlcnJpZGVzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wZXJ0eU92ZXJyaWRlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCB2ID0gcHJvcGVydHlPdmVycmlkZXNbaV07XHJcbiAgICAgICAgICAgIGxldCBzdWJJbmRleCA9IHYuX19pZF9fO1xyXG4gICAgICAgICAgICBsZXQgc3ViVGFnID0gZGF0YVtzdWJJbmRleF07XHJcblxyXG4gICAgICAgICAgICBpZiAoc3ViVGFnLnByb3BlcnR5UGF0aCAmJiBzdWJUYWcucHJvcGVydHlQYXRoWzBdID09IFwiX25hbWVcIikge1xyXG4gICAgICAgICAgICAgICAgbm9kZU5hbWUgPSBzdWJUYWcudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKiDmj5Dlj5boioLngrnnsbvlnosgKi9cclxuICAgIGxldCBub2RlVHlwZSAgICA9IFwiY2MuTm9kZVwiO1xyXG4gICAgbGV0IHNjcmlwdFBhdGggID0gXCJcIjtcclxuICAgIGlmICh0YWcuYXNzZXQpIHtcclxuICAgICAgICBsZXQgcHJlZmFiVXVpZCA9IHRhZy5hc3NldC5fX3V1aWRfXztcclxuICAgICAgICBsZXQgcHJlZmFiRmlsZVBhdGggPSBQcmVmYWJVdGlscy5HZXRQcmVmYWJGaWxlUGF0aChwcmVmYWJVdWlkKTtcclxuICAgICAgICBjb25zb2xlLndhcm4oXCLkvb/nlKjpooTliLbkvZPkvZzkuLroioLngrnvvJpcIiAscHJlZmFiVXVpZCxwcmVmYWJGaWxlUGF0aCk7XHJcbiAgICAgICAgaWYgKHByZWZhYkZpbGVQYXRoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBOYW1lID0gcGF0aC5iYXNlbmFtZShwcmVmYWJGaWxlUGF0aCxcIi5wcmVmYWJcIik7XHJcbiAgICAgICAgICAgIGlmKHBOYW1lLnN0YXJ0c1dpdGgoXCJDdXN0b21cIikpe1xyXG4gICAgICAgICAgICAgICAgLy9ub2RlVHlwZSDlsLHmmK/pooTliLbkvZPnmoTot6/lvoRcclxuICAgICAgICAgICAgICAgIG5vZGVUeXBlICAgICAgICA9IHBOYW1lO1xyXG4gICAgICAgICAgICAgICAgc2NyaXB0UGF0aCAgICAgID0gX2luaXRBc3NldEJ1bmRsZUluZm9CeVByZWZhYkRpcihwcmVmYWJGaWxlUGF0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIERFQlVHICYmIGNvbnNvbGUubG9nKFwi5L2g5L2/55So5LqG6Z2e5pysYnVuZGxl5Lit55qE6aKE5Yi25L2TLOmcgOimgeafpeaJvuOAglwiLHByZWZhYlV1aWQpO1xyXG4gICAgICAgICAgICBjb25zdCBwcmVmYWJJbmZvICAgID0gYXdhaXQgQXNzZXREYlV0aWxzLlJlcXVlc3RRdWVyeUFzc2V0SW5mbyhwcmVmYWJVdWlkKTtcclxuICAgICAgICAgICAgaWYoIXByZWZhYkluZm8pe1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIumUmeivr++8jOS9oOW8leeUqOS6huS4gOS4quS4jeWtmOWcqOeahOmihOWItuS9k+i1hOa6kO+8mlwiLHRhZyxwcmVmYWJVdWlkKTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBERUJVRyAmJiBjb25zb2xlLmxvZyhcIumihOWItuS9k+i1hOa6kOWKoOi9veaIkOWKn++8mlwiLHByZWZhYkluZm8pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcE5hbWUgPSBwcmVmYWJJbmZvLm5hbWU7XHJcbiAgICAgICAgICAgICAgICBpZihwTmFtZS5zdGFydHNXaXRoKFwiQ3VzdG9tXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICBub2RlVHlwZSAgICAgICAgPSBwYXRoLmJhc2VuYW1lKHBOYW1lLFwiLnByZWZhYlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBzY3JpcHRQYXRoICAgICAgPSBfaW5pdEFzc2V0QnVuZGxlSW5mb0J5UHJlZmFiRGlyKHByZWZhYkluZm8uZmlsZSk7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAvL+mdnkN1c3RvbeW8gOWktOeahOiKgueCue+8jOm7mOiupOS4uuS4gOS4qk5vZGVcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbm9kZVR5cGUgPSBfY29udmVydE5vZGVUeXBlU3ViTmFtZXNwYWNlVG9DYyhub2RlVHlwZSk7XHJcbiAgICBub2RlVHlwZSA9IF9jaGVja1NraXBDb21wb25lbnQobm9kZVR5cGUpO1xyXG4gICAgaWYobm9kZU5hbWUuc3RhcnRzV2l0aChcImNjX2J1dHRvblwiKSAmJiAhbm9kZVR5cGUuc3RhcnRzV2l0aCgnQ3VzdG9tJykpe1xyXG4gICAgICAgIG5vZGVUeXBlID0gXCJHQnV0dG9uXCI7XHJcbiAgICB9XHJcbiAgICBjb25zdCBjb21wSW5mbyA9IENvbXBvbmVudFV0aWxzLkdldENvbXBvbmVudEluZm8obm9kZVR5cGUpO1xyXG4gICAgY29uc3Qgbm9kZUluZm8gOiBOb2RlSW5mbyA9IHtcclxuICAgICAgICBub2RlTmFtZSAgICA6IG5vZGVOYW1lLFxyXG4gICAgICAgIG5vZGVUeXBlICAgIDogbm9kZVR5cGUgfHwgXCJjYy5Ob2RlXCIsXHJcbiAgICAgICAgc2NyaXB0UGF0aCAgOiBzY3JpcHRQYXRoLFxyXG4gICAgICAgIGdsb2JhbEZpbGVJZCA6ICcnLFxyXG4gICAgfVxyXG4gICAgaWYoY29tcEluZm8pe1xyXG4gICAgICAgIG5vZGVJbmZvLm5vZGVUeXBlID0gY29tcEluZm8uY2xhc3NOYW1lO1xyXG4gICAgICAgIG5vZGVJbmZvLmdsb2JhbEZpbGVJZCA9IG5vZGVUeXBlO1xyXG4gICAgICAgIERFQlVHICYmIGNvbnNvbGUubG9nKCfop6PmnpDltYzlpZfpooTliLbkvZPml7bvvIzlj5HnjrDlhajlsYDnu4Tku7bkv6Hmga/vvJonLGNvbXBJbmZvKTtcclxuICAgIH1cclxuICAgIF9ub2RlSW5mb3MucHVzaChub2RlSW5mbyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9jb252ZXJ0Tm9kZVR5cGVTdWJOYW1lc3BhY2VUb0NjKG5vZGVUeXBlIDogYW55KXtcclxuICAgIGlmIChub2RlVHlwZS5zdGFydHNXaXRoKFwic3AuXCIpIHx8IG5vZGVUeXBlLnN0YXJ0c1dpdGgoXCJkcmFnb25Cb25lcy5cIikpIHtcclxuICAgICAgICBub2RlVHlwZSA9IFwiY2MuXCIgKyBub2RlVHlwZTtcclxuICAgIH1cclxuICAgIHJldHVybiBub2RlVHlwZTtcclxufVxyXG5cclxuZnVuY3Rpb24gX2NoZWNrU2tpcENvbXBvbmVudChuYW1lIDogc3RyaW5nKXtcclxuICAgIGlmKG5hbWUgPT0gXCJjYy5MYXlvdXRcIiB8fCBuYW1lID09IFwiY2MuV2lkZ2V0XCIpe1xyXG4gICAgICAgIHJldHVybiBcImNjLk5vZGVcIjtcclxuICAgIH1cclxuICAgIHJldHVybiBuYW1lO1xyXG59XHJcblxyXG4vKipcclxuICog5Yid5aeL5YyW5byV5YWlXHJcbiAqL1xyXG5mdW5jdGlvbiBfbWFrZUltcG9ydEJsb2NrQ29kZShidW5kbGVJbmZvIDogQXNzZXRCdW5kbGVJbmZvKXtcclxuICAgIGxldCBpbXBvcnRQcmVmYWJOYW1lcyA6IHN0cmluZ1tdICAgICAgICA9IFtdO1xyXG4gICAgbGV0IGltcG9ydENvbXBvbmVudE5hbWVzIDogc3RyaW5nW10gICAgID0gW107XHJcbiAgICBjb25zdCBidW5kbGVOYW1lICAgID0gYnVuZGxlSW5mby5idW5kbGVOYW1lO1xyXG4gICAgbGV0IGltcG9ydENvbXBvbmVudE5hbWVfMl9jb21wb25lbnRJbmZvIDoge1tuYW1lIDogc3RyaW5nXSA6IENvbXBvbmVudEluZm99ID0ge307XHJcbiAgICBmb3IobGV0IGkgPSAwO2k8X25vZGVJbmZvcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICBjb25zdCBub2RlSW5mbyAgPSBfbm9kZUluZm9zW2ldO1xyXG4gICAgICAgIGNvbnN0IG5vZGVOYW1lICA9IG5vZGVJbmZvLm5vZGVOYW1lO1xyXG4gICAgICAgIGxldCBub2RlVHlwZSAgICA9IG5vZGVJbmZvLm5vZGVUeXBlO1xyXG4gICAgICAgIC8v5LuF5aSE55CG5LulY2Nf5byA5aS055qE5a+56LGhXHJcbiAgICAgICAgaWYoIW5vZGVOYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChcImNjX1wiKSl7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL+WOn+Wni+exu+Wei+S4jeWBmuWkhOeQhlxyXG4gICAgICAgIGlmKG5vZGVUeXBlLnN0YXJ0c1dpdGgoXCJjYy5cIikgfHwgbm9kZVR5cGUuc3RhcnRzV2l0aChcInNwLlwiKSB8fCBub2RlVHlwZS5zdGFydHNXaXRoKFwiZHJhZ29uQm9uZXMuXCIpKXtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKG5vZGVUeXBlID09IFwiR0J1dHRvblwiKXtcclxuICAgICAgICAgICAgLy/mjInpkq7nsbvlnovnibnmrorlpITnkIZcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgLy/lhbbku5bnsbvlnotcclxuICAgICAgICAgICAgaWYoQ29tcG9uZW50VXRpbHMuSXNDb250YWluQ29tcG9uZW50SW5mbyhub2RlVHlwZSkpe1xyXG4gICAgICAgICAgICAgICAgLy/lpoLmnpzmnInov5nkuKrnsbvlnotcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudEluZm8gPSBDb21wb25lbnRVdGlscy5HZXRDb21wb25lbnRJbmZvKG5vZGVUeXBlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNsYXNzTmFtZSAgICAgPSBjb21wb25lbnRJbmZvLmNsYXNzTmFtZTtcclxuICAgICAgICAgICAgICAgIGlmIChpbXBvcnRDb21wb25lbnROYW1lcy5pbmRleE9mKGNsYXNzTmFtZSkgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0Q29tcG9uZW50TmFtZXMucHVzaChjbGFzc05hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGltcG9ydENvbXBvbmVudE5hbWVfMl9jb21wb25lbnRJbmZvW2NsYXNzTmFtZV0gPSBjb21wb25lbnRJbmZvO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIC8v5om+5LiN5Yiw55qE5pe25YCZ5qOA5p+l5piv5ZCm5LiN5piv5b2T5YmN55uu5b2V5LiL55qE5paw5aKe55qEQ3VzdG9t5paH5Lu2XHJcbiAgICAgICAgICAgICAgICBsZXQgY1BhdGggICA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAvL+iEmuacrOi3r+W+hFxyXG4gICAgICAgICAgICAgICAgbGV0IHNQYXRoICAgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgaWYoYnVuZGxlTmFtZSAhPSBcInJlc291cmNlc1wiKXtcclxuICAgICAgICAgICAgICAgICAgICBjUGF0aCAgID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsXCJhc3NldHNcIixcImJ1bmRsZXNcIixidW5kbGVOYW1lLFwicHJlZmFic1wiLG5vZGVUeXBlICsgXCIucHJlZmFiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNQYXRoICAgPSBcImRiOi8vYXNzZXRzL2J1bmRsZXMvXCIgKyBidW5kbGVOYW1lICsgXCIvc2NyaXB0cy92aWV3L1wiICsgbm9kZVR5cGU7Ly9wYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCxcImFzc2V0c1wiLFwiYnVuZGxlc1wiLGJ1bmRsZU5hbWUsXCJzY3JpcHRzXCIsXCJ2aWV3XCIsbm9kZVR5cGUgKyBcIi50c1wiKTtcclxuICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICAgIGNQYXRoICAgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCxcImFzc2V0c1wiLFwicmVzb3VyY2VzXCIsXCJwcmVmYWJzXCIsbm9kZVR5cGUgKyBcIi5wcmVmYWJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgc1BhdGggICA9IFwiZGI6Ly9hc3NldHMvcmVzb3VyY2VzL3NjcmlwdHMvdmlldy9cIiArIG5vZGVUeXBlOy8vcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsXCJhc3NldHNcIixcInNjcmlwdHNcIixcInZpZXdcIixub2RlVHlwZSArIFwiLnRzXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoZnMuZXhpc3RzU3luYyhjUGF0aCkpe1xyXG4gICAgICAgICAgICAgICAgICAgIC8v5a2Y5ZyoXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIWltcG9ydENvbXBvbmVudE5hbWVzLmluY2x1ZGVzKG5vZGVUeXBlKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydENvbXBvbmVudE5hbWVzLnB1c2gobm9kZVR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wb25lbnRJbmZvIDogQ29tcG9uZW50SW5mbyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA6IG5vZGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0RmlsZVBhdGggIDogc1BhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiRGVmYXVsdEV4cG9ydCAgOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydENvbXBvbmVudE5hbWVfMl9jb21wb25lbnRJbmZvW25vZGVUeXBlXSA9IGNvbXBvbmVudEluZm87XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYobm9kZUluZm8uc2NyaXB0UGF0aCAmJiBub2RlSW5mby5zY3JpcHRQYXRoICE9ICcnKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIWltcG9ydENvbXBvbmVudE5hbWVzLmluY2x1ZGVzKG5vZGVUeXBlKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRDb21wb25lbnROYW1lcy5wdXNoKG5vZGVUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudEluZm8gOiBDb21wb25lbnRJbmZvID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSAgICAgICA6IG5vZGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdEZpbGVQYXRoICA6IG5vZGVJbmZvLnNjcmlwdFBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYkRlZmF1bHRFeHBvcnQgIDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydENvbXBvbmVudE5hbWVfMl9jb21wb25lbnRJbmZvW25vZGVUeXBlXSA9IGNvbXBvbmVudEluZm87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKG5vZGVJbmZvLmdsb2JhbEZpbGVJZCAhPSAnJyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZighaW1wb3J0Q29tcG9uZW50TmFtZXMuaW5jbHVkZXMobm9kZVR5cGUpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wSW5mbyAgPSBDb21wb25lbnRVdGlscy5HZXRDb21wb25lbnRJbmZvKG5vZGVJbmZvLmdsb2JhbEZpbGVJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgREVCVUcgJiYgY29uc29sZS5sb2coJ+W8leWFpeS4gOS4quWFqOWxgOeahOe7hOS7tu+8micsY29tcEluZm8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydENvbXBvbmVudE5hbWVzLnB1c2goY29tcEluZm8uY2xhc3NOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRDb21wb25lbnROYW1lXzJfY29tcG9uZW50SW5mb1tjb21wSW5mby5jbGFzc05hbWVdID0gY29tcEluZm87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi5L2g6K+V5Zu+5byV5YWl5LiA5Liq5LiN5a2Y5Zyo55qEQ3VzdG9t6aKE5Yi25L2T6IqC54K577yfXCIsY1BhdGgsbm9kZUluZm8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbiAgICBpbXBvcnRQcmVmYWJOYW1lcyA9IGltcG9ydFByZWZhYk5hbWVzLnNvcnQoKTtcclxuICAgIGltcG9ydENvbXBvbmVudE5hbWVzID0gaW1wb3J0Q29tcG9uZW50TmFtZXMuc29ydCgpO1xyXG4gICAgXHJcblxyXG4gICAgREVCVUcgJiYgY29uc29sZS5sb2coXCLnibnmrorlvJXnlKjvvJpcIixpbXBvcnRDb21wb25lbnROYW1lcyxpbXBvcnRDb21wb25lbnROYW1lXzJfY29tcG9uZW50SW5mbyk7XHJcblxyXG4gICAgLy9jb25zdCBzY3JpcHRQYXRoICAgID0gcGF0aC5qb2luKGJ1bmRsZUluZm8udXJsLCdzY3JpcHRzJywndmlldycpO1xyXG4gICAgY29uc3Qgc2NyaXB0TmFtZSAgICA9IGJ1bmRsZUluZm8ucHJlZmFiTmFtZTtcclxuXHJcbiAgICBsZXQgdGV4dCAgICA9IFwiXCI7XHJcbiAgICAvLzEu5byV5YWl5Z+657G7XHJcbiAgICBjb25zdCBiYXNlUGF0aCAgPSBcImRiOi8vYXNzZXRzL3Jlc291cmNlcy9zY3JpcHRzL2NvcmUvdmlldy92aWV3LWJhc2VcIjtcclxuICAgIC8vY29uc3QgdG9QYXRoICAgID0gcGF0aC5qb2luKHNjcmlwdFBhdGgsc2NyaXB0TmFtZSk7XHJcblxyXG4gICAgLy9kZWZpbmVcclxuICAgIGNvbnN0IGRlZmluZVBhdGggICAgPSBcImRiOi8vYXNzZXRzL3Jlc291cmNlcy9zY3JpcHRzL2NvcmUvZGVmaW5lXCI7Ly9wYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCxcImFzc2V0c1wiLFwic2NyaXB0c1wiLFwiY29yZVwiLFwiZGVmaW5lXCIpO1xyXG5cclxuICAgIC8vbGV0IGRQYXRoICAgPSBUb29scy5jYWxjUmVsYXRpdmVQYXRoKHRvUGF0aCxkZWZpbmVQYXRoKS5yZXBsYWNlQWxsKFwiXFxcXFwiLFwiL1wiKTtcclxuXHJcbiAgICAvL2didXR0b25cclxuICAgIGNvbnN0IGdCdXR0b25QYXRoICAgPSBcImRiOi8vYXNzZXRzL3Jlc291cmNlcy9zY3JpcHRzL2NvcmUvdmlldy9nYnV0dG9uXCI7Ly9wYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCxcImFzc2V0c1wiLFwic2NyaXB0c1wiLFwiY29yZVwiLFwidmlld1wiLFwiZ2J1dHRvblwiKTtcclxuICAgIC8vbGV0IGJQYXRoICAgPSBUb29scy5jYWxjUmVsYXRpdmVQYXRoKHRvUGF0aCxnQnV0dG9uUGF0aCkucmVwbGFjZUFsbChcIlxcXFxcIixcIi9cIik7XHJcblxyXG4gICAgdGV4dCAgICAgICAgKz0gXCJpbXBvcnQgVmlld0Jhc2UgZnJvbSAnXCIgKyBiYXNlUGF0aCArIFwiJztcXG5cIjtcclxuICAgIHRleHQgICAgICAgICs9IFwiaW1wb3J0IHsgQ2xpY2tFdmVudENhbGxiYWNrLCBWaWV3QmluZENvbmZpZ1Jlc3VsdCwgRW1wdHlDYWxsYmFjaywgQXNzZXRUeXBlLCBiRGVidWcgfSBmcm9tICdcIiArIGRlZmluZVBhdGggKyBcIic7XFxuXCI7XHJcbiAgICB0ZXh0ICAgICAgICArPSBcImltcG9ydCB7IEdCdXR0b24gfSBmcm9tICdcIiArIGdCdXR0b25QYXRoICsgXCInO1xcblwiO1xyXG4gICAgdGV4dCAgICAgICAgKz0gXCJpbXBvcnQgKiBhcyBjYyBmcm9tICdjYyc7XFxuXCI7XHJcbiAgICBpZihpbXBvcnRDb21wb25lbnROYW1lcy5sZW5ndGggPiAwKXtcclxuICAgICAgICB0ZXh0ICAgICAgICArPSBcIi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0t54m55q6K5byV55So5byA5aeLLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXFxuXCI7XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpPGltcG9ydENvbXBvbmVudE5hbWVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBjb25zdCBwTmFtZSA9IGltcG9ydENvbXBvbmVudE5hbWVzW2ldO1xyXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRJbmZvID0gaW1wb3J0Q29tcG9uZW50TmFtZV8yX2NvbXBvbmVudEluZm9bcE5hbWVdO1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgICA9IGNvbXBvbmVudEluZm8uc2NyaXB0RmlsZVBhdGg7XHJcbiAgICAgICAgICAgIC8vbGV0IHB1cmwgICAgPSBUb29scy5jYWxjUmVsYXRpdmVQYXRoKHRvUGF0aCx1cmwpLnJlcGxhY2VBbGwoXCJcXFxcXCIsXCIvXCIpO1xyXG4gICAgICAgICAgICAvL2NvbnN0IHBsZW4gID0gcHVybC5sZW5ndGg7XHJcbiAgICAgICAgICAgIC8vcHVybCAgICAgICAgPSBwdXJsLnN1YnN0cmluZygwLHBsZW4gLSAzKTtcclxuICAgICAgICAgICAgdGV4dCArPSBcImltcG9ydCBcIiArIGNvbXBvbmVudEluZm8uY2xhc3NOYW1lICsgXCIgZnJvbSAnXCIgKyB1cmwgKyBcIic7XFxuXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRleHQgICAgICAgICs9IFwiLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS3nibnmrorlvJXnlKjlrozmr5UtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cXG5cIjtcclxuICAgIH1cclxuICAgIHRleHQgICAgICAgICs9IFwiLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS3kuIrov7DlhoXlrrnor7fli7/kv67mlLktLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cXG5cIjtcclxuICAgIHJldHVybiB0ZXh0O1xyXG59XHJcbi8qKlxyXG4gKiDng63mm7TmlrDmjInpkq7kuovku7ZcclxuICog5Y+q5paw5aKe77yM5LiN5Yig6ZmkXHJcbiAqIEBwYXJhbSBsaW5lcyBcclxuICogQHBhcmFtIG5vZGVOYW1lcyBcclxuICogQHJldHVybnMgXHJcbiAqL1xyXG5mdW5jdGlvbiBfaG90Rml4QnV0dG9uRXZlbnQobGluZXMgOiBzdHJpbmdbXSxub2RlTmFtZXMgOiBzdHJpbmdbXSl7XHJcbiAgICBsZXQgcmUgOiBzdHJpbmdbXSAgID0gW107XHJcbiAgICBmb3IobGV0IGkgPSAwO2k8bGluZXMubGVuZ3RoO2krKylcclxuICAgIHtcclxuICAgICAgICBjb25zdCBzdHIgICA9IGxpbmVzW2ldO1xyXG4gICAgICAgIGlmKHN0ci5pbmNsdWRlcyhcIm9uQ2xpY2tCdXR0b25cIikpe1xyXG4gICAgICAgICAgICAvL+i/meaYr+S4gOS4quaMiemSruS6i+S7tuaWueazleeahOWumuS5iVxyXG4gICAgICAgICAgICBjb25zdCBzdCAgICA9IHN0ci5pbmRleE9mKFwib25DbGlja0J1dHRvblwiKTtcclxuICAgICAgICAgICAgY29uc3QgZXQgICAgPSBzdHIuaW5kZXhPZihcIihcIik7XHJcbiAgICAgICAgICAgIC8v6L+Y5Y6f5oyJ6ZKu5ZCN5a2XXHJcbiAgICAgICAgICAgIGxldCBuYW1lICAgID0gc3RyLnN1YnN0cmluZyhzdCArIDEzLGV0KTtcclxuICAgICAgICAgICAgREVCVUcgJiYgY29uc29sZS5sb2coXCLmib7liLDkuIDkuKrlt7Lnu4/lrZjlnKjnmoTmjInpkq7vvJpcIixuYW1lKTtcclxuICAgICAgICAgICAgY29uc3QgaUluZGV4ICAgID0gbm9kZU5hbWVzLmluZGV4T2YobmFtZSk7XHJcbiAgICAgICAgICAgIGlmKGlJbmRleCA+PSAwKXtcclxuICAgICAgICAgICAgICAgIC8v6L+Z5Liq5oyJ6ZKu5a2Y5Zyo77yM5Yig6ZmkXHJcbiAgICAgICAgICAgICAgICBub2RlTmFtZXMuc3BsaWNlKGlJbmRleCwxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8v6L+Z5Liq5bCx5piv5Ymp5LiL55qE5LqGXHJcbiAgICBpZihub2RlTmFtZXMubGVuZ3RoID09IDApe1xyXG4gICAgICAgIHJldHVybiBsaW5lcztcclxuICAgIH1cclxuICAgIC8v5aaC5p6c5pyJ5paw5aKe55qE5oyJ6ZKuXHJcbiAgICBmb3IobGV0IGkgPSAwO2k8bm9kZU5hbWVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGNvbnN0IG5hbWUgID0gbm9kZU5hbWVzW2ldO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwi5paw5aKe5oyJ6ZKu5LqL5Lu277yaXCIgKyBuYW1lKTtcclxuICAgICAgICBsZXQgdGV4dCAgICA9IFwiXFxuXCI7XHJcbiAgICAgICAgdGV4dCAgICAgICAgKz0gXCIgICAgcHJpdmF0ZSBvbkNsaWNrQnV0dG9uXCIgKyBuYW1lICsgXCIoZXZlbnQgOiBjYy5FdmVudFRvdWNoKXtcXG5cIjtcclxuICAgICAgICB0ZXh0ICAgICAgICArPSBcIiAgICAgICAgY2MubG9nKCdvbiBjbGljayBldmVudCBjY19idXR0b25cIiArIG5hbWUgKyBcIicpO1xcblwiO1xyXG4gICAgICAgIHRleHQgICAgICAgICs9IFwiICAgIH1cXG5cIjtcclxuICAgICAgICBsaW5lcy5wdXNoKHRleHQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGxpbmVzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIOWIneWni+WMluS4gOS4quaWsOeahGkxOG7lpJror63oqIDmlofku7ZcclxuICogQHBhcmFtIGJ1bmRsZU5hbWUgXHJcbiAqIEBwYXJhbSBwcmVmYWJOYW1lIFxyXG4gKiBAcmV0dXJucyBcclxuICovXHJcbmZ1bmN0aW9uIF9pbml0TmV3STE4blhsc3hGaWxlKGJ1bmRsZU5hbWUgOiBzdHJpbmcscHJlZmFiTmFtZSA6IHN0cmluZyl7XHJcbiAgICBjb25zdCBmaWxlUGF0aCAgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCxcIl9jb25maWdcIixidW5kbGVOYW1lLFwiaTE4blwiLFwiaTE4bl9cIiArIGJ1bmRsZU5hbWUgKyBcIl9cIiArIHByZWZhYk5hbWUgKyBcIl9kYi54bHN4XCIpO1xyXG4gICAgaWYoZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpe1xyXG4gICAgICAgIC8v5aaC5p6c5paH5Lu25bey57uP5a2Y5ZyoXHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcImkxOG7mlofku7blt7Lnu4/lrZjlnKjvvIzor7fkuI3opoHph43lpI3liJvlu7rvvJpcIixmaWxlUGF0aCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy/ku45fY29uZmlnL2kxOG5fc2ltcGxlX2RiLnhsc3jlpI3liLbkuIDku71cclxuICAgIGNvbnN0IHNvdXJjZUZpbGVQYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsXCJfY29uZmlnXCIsXCJpMThuX3NpbXBsZV9kYi54bHN4XCIpO1xyXG4gICAgaWYoIWZzLmV4aXN0c1N5bmMoc291cmNlRmlsZVBhdGgpKXtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiaTE4bl9zaW1wbGVfZGIueGxzeOaWh+S7tuS4jeWtmOWcqO+8jOivt+ajgOafpe+8mlwiLHNvdXJjZUZpbGVQYXRoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICAvL+aJk+W8gOaWh+S7tlxyXG4gICAgY29uc3Qgc2hlZXRzICAgID0geGxzeC5wYXJzZShmcy5yZWFkRmlsZVN5bmMoc291cmNlRmlsZVBhdGgpKTtcclxuICAgIGNvbnN0IHNoZWV0ICAgICA9IHNoZWV0c1swXTtcclxuICAgIGNvbnN0IGRhdGFzICAgICA9IHNoZWV0LmRhdGE7XHJcbiAgICAvL+ivu+WPlmRhdGFz55qE56ys5LiA6KGMXHJcbiAgICBpZihkYXRhcy5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcImkxOG5fc2ltcGxlX2RiLnhsc3jmlofku7bmsqHmnInmlbDmja7vvIzor7fmo4Dmn6XvvJpcIixzb3VyY2VGaWxlUGF0aCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy/mo4Dmn6XnrKzkuIDooYznmoTlhoXlrrlcclxuICAgIGxldCBmaXJzdFJvdyA9IGRhdGFzWzBdO1xyXG4gICAgLy/kv67mlLlkYueahOWQjeWtl1xyXG4gICAgZmlyc3RSb3dbMV0gPSBcImkxOG5fXCIgKyBidW5kbGVOYW1lICsgXCJfZGJcIjtcclxuICAgIC8v5YaZ5YWlZmlsZVBhdGhcclxuICAgIC8v5YaZ5YWl5paH5Lu2XHJcbiAgICBjb25zdCBzaGVldE9wdGlvbnMgID0geychY29scyc6IFt7d2NoOiAyMH0sIHt3Y2g6IDIwfSwge3djaDogMjB9LCB7d2NoOiAyMH1dfTtcclxuICAgIGNvbnN0IGJ1ZmZlciAgICAgICAgPSB4bHN4LmJ1aWxkKFt7bmFtZSA6IHNoZWV0Lm5hbWUsZGF0YSA6IGRhdGFzLG9wdGlvbnMgOiBzaGVldE9wdGlvbnN9XSk7XHJcbiAgICBmcy53cml0ZUZpbGVTeW5jKGZpbGVQYXRoLGJ1ZmZlcix7ZW5jb2RpbmcgOiBcImJpbmFyeVwifSk7XHJcbiAgICBjb25zb2xlLmxvZyhcImkxOG7lpJror63oqIDmlofku7bliJ3lp4vljJbmiJDlip/vvJpcIixmaWxlUGF0aCk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICog6K+75Y+W5oyH5a6aYnVuZGxl5LiL55qEaTE4buWkmuivreiogOaWh+S7tlxyXG4gKiBAcGFyYW0gYnVuZGxlTmFtZSBcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiByZWFkSTE4blhsc3hGaWxlRGF0YShidW5kbGVOYW1lIDogc3RyaW5nLHByZWZhYk5hbWUgOiBzdHJpbmcpe1xyXG5cclxuICAgIC8v6aaW5YWI5Yik5a6a5piv5ZCm6ZyA6KaB5pyJ6ZyA6KaB5a+85Ye655qEbGFiZWxzL3Nwcml0ZVxyXG4gICAgaWYoX2kxOG5MYWJlbHMubGVuZ3RoID09IDAgJiYgX2kxOG5TcHJpdGVzLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICBjb25zb2xlLndhcm4oXCLmsqHmnInpnIDopoHlr7zlh7rnmoTlpJror63oqIDmlbDmja7vvIzor7fmo4Dmn6XmmK/lkKbmnIljY19idXR0b27lvIDlpLTnmoToioLngrnvvIzmiJbogIVpMThu5qCH562+XCIpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmaWxlUGF0aCAgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCxcIl9jb25maWdcIixidW5kbGVOYW1lLFwiaTE4blwiLFwiaTE4bl9cIiArIGJ1bmRsZU5hbWUgKyBcIl9cIiArIHByZWZhYk5hbWUgKyBcIl9kYi54bHN4XCIpO1xyXG4gICAgaWYoIWZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpKXtcclxuICAgICAgICAvL2NvbnNvbGUuZXJyb3IoXCLor7flrprkuYnoh6rlt7HnmoRpMThu5paH5Lu277yaXCIsZmlsZVBhdGgpO1xyXG4gICAgICAgIF9pbml0TmV3STE4blhsc3hGaWxlKGJ1bmRsZU5hbWUscHJlZmFiTmFtZSk7XHJcbiAgICB9XHJcbiAgICAvL+ivu+ihqOagvFxyXG4gICAgY29uc3Qgc2hlZXRzICAgID0geGxzeC5wYXJzZShmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgpKTtcclxuICAgIGlmKHNoZWV0cy5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIuivu+WPluihqOagvOWksei0pe+8mlwiLGZpbGVQYXRoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICAvL+WPquiupOesrOS4gOW8oHNoZWV0XHJcbiAgICBjb25zdCBzaGVldCAgICAgPSBzaGVldHNbMF07XHJcbiAgICBjb25zdCBkYXRhcyAgICAgID0gc2hlZXQuZGF0YTtcclxuICAgIGNvbnNvbGUubG9nKCflpITnkIblpJror63oqIDooajmoLzlhoXlrrnvvJonICAgICxkYXRhcyk7XHJcbiAgICAvL+iKgueCueexu+Wei+WIl+e0ouW8lVxyXG4gICAgbGV0IG5vZGVUeXBlQ29sdW1uSW5kZXggPSAtMTtcclxuICAgIC8v6Z2i5p2/5ZCN5a2X5YiX57Si5byVXHJcbiAgICBsZXQgcGFuZWxOYW1lQ29sdW1uSW5kZXggPSAtMTtcclxuICAgIC8v6IqC54K55ZCN5a2X5YiX57Si5byVXHJcbiAgICBsZXQgbm9kZU5hbWVDb2x1bW5JbmRleCA9IC0xO1xyXG4gICAgLy/lrZfmrrXlkI3lrZfooYznmoTlhbPplK7lrZdcclxuICAgIGNvbnN0IEZMRF9OQU1FID0gXCJGTERfTkFNRVwiO1xyXG4gICAgY29uc3QgRkxEX05BTUVfTk9ERVRZUEUgPSAnbm9kZVR5cGUnO1xyXG4gICAgY29uc3QgRkxEX05BTUVfUEFORUxOQU1FID0gJ3BhbmVsTmFtZSc7XHJcbiAgICBjb25zdCBGTERfTkFNRV9OT0RFTkFNRSA9ICdub2RlTmFtZSc7XHJcblxyXG4gICAgY29uc3QgQVVUT19FWFBPUlRfU1RBUlRfRkxBRyAgICA9ICc8PEFVVE9fRVhQT1JUX0RBVEFfQkVHSU5fRE9fTk9UX01PRElGWT4+JztcclxuXHJcbiAgICBsZXQgYXV0b19leHBvcnRfc3RhcnRfcm93X2luZGV4ID0gLTE7XHJcblxyXG4gICAgZm9yKGxldCBpID0gMDtpPGRhdGFzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGxldCBkYXRhID0gZGF0YXNbaV07XHJcbiAgICAgICAgaWYoZGF0YVswXSAmJiBkYXRhWzBdID09IEZMRF9OQU1FKXtcclxuICAgICAgICAgICAgLy/pgY3ljobov5nooYzvvIzojrflj5boioLngrnnsbvlnovvvIzpnaLmnb/lkI3lrZfvvIzoioLngrnlkI3lrZfnmoTliJfntKLlvJVcclxuICAgICAgICAgICAgZm9yKGxldCBqID0gMDtqPGRhdGEubGVuZ3RoO2orKyl7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IGRhdGFbal07XHJcbiAgICAgICAgICAgICAgICBpZihuYW1lID09IEZMRF9OQU1FX05PREVUWVBFKXtcclxuICAgICAgICAgICAgICAgICAgICBub2RlVHlwZUNvbHVtbkluZGV4ID0gajtcclxuICAgICAgICAgICAgICAgIH1lbHNlIGlmKG5hbWUgPT0gRkxEX05BTUVfUEFORUxOQU1FKXtcclxuICAgICAgICAgICAgICAgICAgICBwYW5lbE5hbWVDb2x1bW5JbmRleCA9IGo7XHJcbiAgICAgICAgICAgICAgICB9ZWxzZSBpZihuYW1lID09IEZMRF9OQU1FX05PREVOQU1FKXtcclxuICAgICAgICAgICAgICAgICAgICBub2RlTmFtZUNvbHVtbkluZGV4ID0gajtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihkYXRhLmxlbmd0aCA+IDEgJiYgZGF0YVsxXSA9PSBBVVRPX0VYUE9SVF9TVEFSVF9GTEFHKXtcclxuICAgICAgICAgICAgLy/ojrflj5boh6rliqjlr7zlh7rmoIforrDlrZfmrrVcclxuICAgICAgICAgICAgYXV0b19leHBvcnRfc3RhcnRfcm93X2luZGV4ID0gaTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy/ojrflj5boh6rliqjlr7zlh7rmoIforrDlrZfmrrVcclxuICAgIH1cclxuICAgIC8v5qOA5p+l57Si5byV5piv5ZCm6YO96I635Y+W5Yiw5LqGXHJcbiAgICBpZihub2RlVHlwZUNvbHVtbkluZGV4ID09IC0xIHx8IHBhbmVsTmFtZUNvbHVtbkluZGV4ID09IC0xIHx8IG5vZGVOYW1lQ29sdW1uSW5kZXggPT0gLTEpe1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCLooajmoLzmoLzlvI/kuI3mraPnoa7vvIzor7fmo4Dmn6XvvJpcIixmaWxlUGF0aCwnLG5vZGVUeXBlID0gJyxub2RlVHlwZUNvbHVtbkluZGV4LCcscGFuZWxOYW1lID0gJyxwYW5lbE5hbWVDb2x1bW5JbmRleCwnLG5vZGVOYW1lID0gJyxub2RlTmFtZUNvbHVtbkluZGV4KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICAvL+WmguaenOayoeacieWPkeeOsOWvvOWHuuagh+iusO+8jOWwsee7meihqOeahOaVsOaNruWQjumdouW7tumVvzEw6KGM5ZCO5Yqg5YWlXHJcbiAgICBpZihhdXRvX2V4cG9ydF9zdGFydF9yb3dfaW5kZXggPT0gLTEpe1xyXG4gICAgICAgIGF1dG9fZXhwb3J0X3N0YXJ0X3Jvd19pbmRleCA9IGRhdGFzLmxlbmd0aDtcclxuICAgICAgICBmb3IobGV0IGkgPSAwO2k8MjtpKyspe1xyXG4gICAgICAgICAgICBkYXRhcy5wdXNoKFtdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGF0YXMucHVzaChbLEFVVE9fRVhQT1JUX1NUQVJUX0ZMQUddKTtcclxuICAgICAgICBhdXRvX2V4cG9ydF9zdGFydF9yb3dfaW5kZXggPSBkYXRhcy5sZW5ndGggLSAxO1xyXG4gICAgfVxyXG5cclxuICAgIC8v5LuOIGF1dG9fZXhwb3J0X3N0YXJ0X3Jvd19pbmRleCArIDHlvIDlp4vmib5cclxuICAgIGNvbnN0IFBBTkVMX1NUQVJUX0ZMQUcgICAgICAgICAgICAgID0gJzw8UEFORUxfU1RBUlRfRkxBR18nICsgcHJlZmFiTmFtZSArICc+Pic7XHJcbiAgICBsZXQgYlBBTkVMRk9VTkQgPSBmYWxzZTtcclxuICAgIGxldCBhbGxfcGFuZWxfbm9kZV9yb3dfZGF0YSA6IGFueVtdID0gW107XHJcbiAgICBsZXQga2V5X3BhbmVsX25vZGVfcm93X2RhdGEgOiB7W2tleSA6IHN0cmluZ10gOiBhbnl9ID0ge307XHJcbiAgICBsZXQgcGFuZWxfcm93X3N0YXJ0X2luZGV4ICAgICAgICAgICA9IC0xO1xyXG4gICAgZm9yKGxldCBpID0gYXV0b19leHBvcnRfc3RhcnRfcm93X2luZGV4ICsgMTtpPGRhdGFzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBkYXRhc1tpXTtcclxuICAgICAgICBpZihkYXRhLmxlbmd0aCA9PSAwIHx8IChkYXRhLmxlbmd0aCA9PSAxICYmIGRhdGFbMF0gPT0gJycpKXtcclxuICAgICAgICAgICAgLy/mib7liLDkuIDkuKrnqbrnmb3nmoTvvIzor7TmmI7msqHkuoZcclxuICAgICAgICAgICAgaWYoIWJQQU5FTEZPVU5EKXtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGRhdGEubGVuZ3RoID4gMSAmJiBkYXRhWzFdID09IFBBTkVMX1NUQVJUX0ZMQUcpe1xyXG4gICAgICAgICAgICAvL+aJvuWIsOi/meS4qumihOWItuS9k+eahOagh+iusFxyXG4gICAgICAgICAgICBiUEFORUxGT1VORCA9IHRydWU7XHJcbiAgICAgICAgICAgIHBhbmVsX3Jvd19zdGFydF9pbmRleCA9IGk7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihiUEFORUxGT1VORCl7XHJcbiAgICAgICAgICAgIGtleV9wYW5lbF9ub2RlX3Jvd19kYXRhW2RhdGFbMl1dID0gZGF0YTtcclxuICAgICAgICAgICAgYWxsX3BhbmVsX25vZGVfcm93X2RhdGEucHVzaChkYXRhKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZighYlBBTkVMRk9VTkQpe1xyXG4gICAgICAgIC8v5aaC5p6c5rKh5pyJ5om+5Yiw6L+Z5Liq6aKE5Yi25L2T55qE5qCH6K6w77yM5bCx5Yqg5YWlXHJcbiAgICAgICAgZGF0YXMucHVzaChbXSk7XHJcbiAgICAgICAgZGF0YXMucHVzaChbLFBBTkVMX1NUQVJUX0ZMQUddKTtcclxuICAgICAgICBwYW5lbF9yb3dfc3RhcnRfaW5kZXggPSBkYXRhcy5sZW5ndGggLSAxO1xyXG4gICAgfVxyXG4gICAgbGV0IG5ld19wYW5lbF9ub2RlX3Jvd19kYXRhIDogYW55W10gPSBbXTtcclxuICAgIGZvcihsZXQgaSA9IDA7aTwgX2kxOG5MYWJlbHMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgY29uc3Qga2V5X25hbWUgID0gcHJlZmFiTmFtZSArIFwiX1wiICsgX2kxOG5MYWJlbHNbaV0ubmFtZTtcclxuICAgICAgICBjb25zdCB2YWx1ZSAgICAgPSBfaTE4bkxhYmVsc1tpXS52YWx1ZTtcclxuICAgICAgICBpZihrZXlfcGFuZWxfbm9kZV9yb3dfZGF0YVtrZXlfbmFtZV0pe1xyXG4gICAgICAgICAgICAvLzEu5qOA5p+l5b2T5YmNTGFiZWzkuIrnmoTlhoXlrrnlkozljp/mnaXnmoTlhoXlrrnmmK/lkKbkuIDoh7TvvIzlpoLmnpzkuI3kuIDoh7TvvIzopoHmm7/mjaJcclxuICAgICAgICAgICAgY29uc3Qgb2xkX2RhdGEgPSBrZXlfcGFuZWxfbm9kZV9yb3dfZGF0YVtrZXlfbmFtZV07XHJcbiAgICAgICAgICAgIGlmKG9sZF9kYXRhWzZdICE9IHZhbHVlKXtcclxuICAgICAgICAgICAgICAgIG9sZF9kYXRhWzVdID0gX2kxOG5MYWJlbHNbaV0ubmFtZTtcclxuICAgICAgICAgICAgICAgIC8v5LiN5LiA6Ie077yM5pu/5o2iXHJcbiAgICAgICAgICAgICAgICBvbGRfZGF0YVs2XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgb2xkX2RhdGFbN10gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIG5ld19wYW5lbF9ub2RlX3Jvd19kYXRhLnB1c2gob2xkX2RhdGEpO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIC8v5Y6f5p2l5bCx5pyJ55qEXHJcbiAgICAgICAgICAgICAgICBuZXdfcGFuZWxfbm9kZV9yb3dfZGF0YS5wdXNoKGtleV9wYW5lbF9ub2RlX3Jvd19kYXRhW2tleV9uYW1lXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIC8v5Y6f5p2l5rKh5pyJ55qELOWwhnpoX2Nu5ZKMZW5fdXPkuKTkuKrmlbDmja7oh6rliqjloavlhYXov5vljrtcclxuICAgICAgICAgICAgbmV3X3BhbmVsX25vZGVfcm93X2RhdGEucHVzaChbJ0RBVEEnLCxrZXlfbmFtZSwnMScscHJlZmFiTmFtZSxfaTE4bkxhYmVsc1tpXS5uYW1lLHZhbHVlLHZhbHVlXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8v5byA5aeL6L6T5Ye65a+M5paH5pysXHJcbiAgICBmb3IobGV0IGkgPSAwO2k8X2kxOG5fcmljaF90ZXh0cy5sZW5ndGg7aSsrKXtcclxuICAgICAgICBjb25zdCBrZXlfbmFtZSA9IHByZWZhYk5hbWUgKyBcIl9cIiArIF9pMThuX3JpY2hfdGV4dHNbaV0ubmFtZTtcclxuICAgICAgICBpZihrZXlfcGFuZWxfbm9kZV9yb3dfZGF0YVtrZXlfbmFtZV0pe1xyXG4gICAgICAgICAgICAvL+WOn+adpeWwseacieeahFxyXG4gICAgICAgICAgICBuZXdfcGFuZWxfbm9kZV9yb3dfZGF0YS5wdXNoKGtleV9wYW5lbF9ub2RlX3Jvd19kYXRhW2tleV9uYW1lXSk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIC8v5Y6f5p2l5rKh5pyJ55qEXHJcbiAgICAgICAgICAgIG5ld19wYW5lbF9ub2RlX3Jvd19kYXRhLnB1c2goWydEQVRBJywnJyxrZXlfbmFtZSwnMycscHJlZmFiTmFtZSxfaTE4bl9yaWNoX3RleHRzW2ldLm5hbWUsX2kxOG5fcmljaF90ZXh0c1tpXS52YWx1ZV0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgLy/lvIDlp4vovpPlh7pzcHJpdGVcclxuICAgIGZvcihsZXQgaSA9IDA7aTxfaTE4blNwcml0ZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgY29uc3Qgc3BJbmZvID0gX2kxOG5TcHJpdGVzW2ldO1xyXG4gICAgICAgIGNvbnN0IGtleV9uYW1lID0gcHJlZmFiTmFtZSArIFwiX1wiICsgc3BJbmZvLm5hbWU7XHJcbiAgICAgICAgaWYoa2V5X3BhbmVsX25vZGVfcm93X2RhdGFba2V5X25hbWVdKXtcclxuICAgICAgICAgICAgLy/ljp/mnaXlsLHmnInnmoRcclxuICAgICAgICAgICAgbmV3X3BhbmVsX25vZGVfcm93X2RhdGEucHVzaChrZXlfcGFuZWxfbm9kZV9yb3dfZGF0YVtrZXlfbmFtZV0pO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAvL+WOn+adpeayoeacieeahFxyXG4gICAgICAgICAgICBuZXdfcGFuZWxfbm9kZV9yb3dfZGF0YS5wdXNoKFsnREFUQScsJycsa2V5X25hbWUsJzInLHByZWZhYk5hbWUsc3BJbmZvLm5hbWUsc3BJbmZvLnZhbHVlXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy/mlrDlop7kuIDooYznqbrnmb1cclxuICAgIG5ld19wYW5lbF9ub2RlX3Jvd19kYXRhLnB1c2goW10pO1xyXG4gICAgLy/mj5LlhaXliLBkYXRhc+ihqOagvOS4rSzmm7/mjaLmjonku45wYW5lbF9yb3dfc3RhcnRfaW5kZXggKyAxIOW8gOWniyDlhbFhbGxfcGFuZWxfbm9kZV9yb3dfZGF0YS5sZW5ndGggKyAxIOS4quaVsOaNrlxyXG4gICAgZGF0YXMuc3BsaWNlKHBhbmVsX3Jvd19zdGFydF9pbmRleCArIDEsYWxsX3BhbmVsX25vZGVfcm93X2RhdGEubGVuZ3RoICsgMSwuLi5uZXdfcGFuZWxfbm9kZV9yb3dfZGF0YSk7XHJcbiAgICBjb25zb2xlLmxvZygnbmV3IGRhdGFzID0gJyxkYXRhcyk7XHJcbiAgICAvL+WGmeWFpeaWh+S7tlxyXG4gICAgY29uc3Qgc2hlZXRPcHRpb25zICA9IHsnIWNvbHMnOiBbe3djaDogMjB9LCB7d2NoOiAyMH0sIHt3Y2g6IDIwfSwge3djaDogMjB9XX07XHJcbiAgICBjb25zdCBidWZmZXIgICAgICAgID0geGxzeC5idWlsZChbe25hbWUgOiBzaGVldC5uYW1lLGRhdGEgOiBkYXRhcyxvcHRpb25zIDogc2hlZXRPcHRpb25zfV0pO1xyXG4gICAgZnMud3JpdGVGaWxlU3luYyhmaWxlUGF0aCxidWZmZXIse2VuY29kaW5nIDogXCJiaW5hcnlcIn0pO1xyXG59XHJcbiJdfQ==