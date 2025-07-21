import { AssetInfo } from "@cocos/creator-types/editor/packages/asset-db/@types/public";
import { AssetDbUtils } from "./utils/asset-db-utils";
import { AssetBundleInfo, ComponentInfo, DEBUG, EVENT_BEGIN_TAG, EVENT_END_TAG, IMPORT_BEGIN_TAG, IMPORT_END_TAG, NET_BEGIN_TAG, NodeInfo, RESOURCE_BEGIN_TAG, RESOURCE_END_TAG, StatisticalConfig } from "./define";
import fs from "fs-extra";
import path from "path";
import PrefabUtils from "./utils/prefab-utils";
import Tools from "./utils/tools";
import ComponentUtils from "./utils/component-utils";
import FileUtils from "./utils/file-utils";
import xlsx from "node-xlsx";
import ExportStatistical from "./statistial/export-statistical";
import * as os from 'os';
const p_path = os.platform() === 'darwin' ? '\/' : '\\';
//import XLSXSTYLE from 'xlsx-style';
/**
 * @en Methods within the extension can be triggered by message
 * @zh 扩展内的方法，可以通过 message 触发
 */
export const methods: { [key: string]: (...any: any) => any } = {
    /**
     * @en A method that can be triggered by message
     * @zh 通过 message 触发的方法
     * @param str The string to be printed
     */
    async hello(str?: string) {
        str = str || 'World';
        return console.log(`Hello ${str}`);
    },
};

/**
 * @en The method executed when the extension is started
 * @zh 扩展启动的时候执行的方法
 */
export function load() {
    // Editor.Message.send('{name}', 'hello');
}

/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展触发的方法
 */
export function unload() { }

/**
 * 多语言环境下对Prefab进行导出
 * @param assetInfo 
 */
export function onAssetMenu(assetInfo : AssetInfo){
    const importer  = assetInfo.importer;
    const name      = assetInfo.name;
    if(importer == "directory"){
        //用户想解析一个文件夹
        return;
    }else{
        //单个文件
        if(assetInfo.importer != "prefab"){
            //用户没有选中预制体
            DEBUG && console.log("请选择单个预制体~");
            return;
        }
        if(!assetInfo.name.startsWith("Panel") && !assetInfo.name.startsWith("Custom")){
            return;
        }
    }
    //初始化resources
    const rBundleInfo : AssetBundleInfo = {
        url : path.join(Editor.Project.path,"assets","resources").replaceAll("\\","/"),
        db_url : "db://assets/resources",
        bundleName : "resources",
        prefabName : "",
        prefabSubUrl : "",
        i18n_labels : [],
    };
    PrefabUtils.InitBundle(rBundleInfo);
    //ComponentUtils初始化
    ComponentUtils.Init();
    const bundleInfo    = AssetDbUtils.GetBundleNameWithDbUrl(assetInfo.url);
    if(!bundleInfo){
        return;
    }
    
    return [
        {
            label : "导出[" + bundleInfo.prefabName + "]",
            async click() {
                //导出界面代码
                await export_prefab_view(bundleInfo);
                //导出多语言配置
                readI18nXlsxFileData(bundleInfo.bundleName,bundleInfo.prefabName);
                console.log("导出多语言配置表成功！",bundleInfo.bundleName,bundleInfo.prefabName);
                //打出打点统计
                const statistical   = new ExportStatistical(bundleInfo.bundleName,bundleInfo.prefabName,_nodeInfos);
                console.log("导出统计数据：",statistical);
                //导出指定预制体的统计信息
                statistical.exportPanelStatics();
                DEBUG && console.warn("导出统计数据 = ",statistical.gameId,statistical.bundleName,statistical.prefabName);
                //导出该预制体的按钮的统计信息
                statistical.exportPrefabButtonStatistical();
                //收集自定义数据
                statistical.collectionCustomizeStatistical();
                //写出统计信息给策划
                //statistical.exportDataForPlan();
                //写出配置文件
                statistical.writeConfigToFile();
                //发送通知，要求导出配置表
                Editor.Message.send('export_xlsx_config_db','export_target_bundle_xlsx',bundleInfo.bundleName);
            }
        }
    ]
}




let _nodeInfos : NodeInfo[] = [];
/**
 * 所有需要被i18n控制的label
 */
let _i18nLabels : {name : string,value : string}[] = [];
/**
 * 所有需要被i18n控制的sprite
 */
let _i18nSprites : {name : string,value : string}[] = [];
/**
 * 所有需要被i18n控制的富文本
 */
let _i18n_rich_texts : {name : string,value : string}[] = [];

/**
 * 导出指定的bundle
 * @param bundleInfo 
 */
async function export_prefab_view(bundleInfo : AssetBundleInfo){
    _nodeInfos      = [];
    _i18nLabels     = [];
    _i18nSprites    = [];
    _i18n_rich_texts = [];
    //子目录
    const subUrl    = bundleInfo.prefabSubUrl;

    let prefabFileUrl = path.join(bundleInfo.url,"prefabs");//bundleInfo.url + `${p_path}prefabs${p_path}` + bundleInfo.prefabName + ".prefab";
    if(subUrl != ""){
        prefabFileUrl = path.join(prefabFileUrl,subUrl);
    }
    prefabFileUrl = path.join(prefabFileUrl,bundleInfo.prefabName + ".prefab").replaceAll("\\","/");
    const text  = fs.readFileSync(prefabFileUrl,{encoding : "utf-8"});
    const data  = JSON.parse(text);
    await _recursionLoad(data,data[1]);
    DEBUG && console.log("所有的节点信息：",_nodeInfos);
    let dbPath        = bundleInfo.db_url;
    if(dbPath.endsWith("/")){
        dbPath  = dbPath.substring(0,dbPath.length - 1);
    }
    let scriptPath    = '';
    if(bundleInfo.bundleName == "resources"){
        scriptPath  = path.join(Editor.Project.path,"assets","resources","scripts","view");
        dbPath      = "db://assets/resources/scripts/view/";
        if(subUrl != ""){
            scriptPath = path.join(scriptPath,subUrl);
            dbPath = dbPath + subUrl + "/";
        }
        
    }else{
        scriptPath  = path.join(bundleInfo.url,"scripts","view");
        dbPath      = "db://assets/bundles/" + bundleInfo.bundleName + "/scripts/view/";
        if(subUrl != ""){
            scriptPath = path.join(scriptPath,subUrl);
            dbPath = dbPath + subUrl + "/";
        }
    }
    scriptPath = path.join(scriptPath,bundleInfo.prefabName + ".ts").replaceAll("\\","/");
    dbPath = (dbPath + bundleInfo.prefabName + ".ts").replaceAll("\\","/");

    DEBUG && console.log("脚本路径：",scriptPath);
    DEBUG && console.log("db路径：",dbPath);
    

    if(fs.existsSync(scriptPath)){
        //如果文件已经存在
        const lines = FileUtils.GetFileContentByLines(scriptPath);
        const text  = _hotfixViewCode(lines,data,bundleInfo);
        await AssetDbUtils.RequestCreateNewAsset(dbPath,text,true);
        DEBUG && console.log("更新脚本：" + bundleInfo.prefabName + "成功！");
    }else{
        const text  = _makeNewViewCode(data,bundleInfo);
        //写入
        await AssetDbUtils.RequestCreateNewAsset(dbPath,text,true);
        DEBUG && console.log("写入新的脚本：" + bundleInfo.prefabName + "成功！");
    }
}

/**
     * 根据节点的名字，生成一个这个节点作为按钮的回调方法
     * @param nodeName cc_buttonClose -> onClickButtonClose
     */
function _getButtonEventByNodeName(nodeName : string){
    const buttonName    = nodeName.substring(9);
    return "onClickButton" + buttonName;
}

/**
 * 对已经存在的界面代码进行更新
 * @param data 
 * @param bundleInfo 
 */
function _hotfixViewCode(lines : string[],data : any,bundleInfo : AssetBundleInfo){
    const scriptPath    = path.join(bundleInfo.url,"scripts","view");
    const scriptName    = bundleInfo.prefabName;
    let i1 = 0, i2 = 0;
    [i1, i2] = Tools.findLineTag(lines, IMPORT_BEGIN_TAG, IMPORT_END_TAG);
    if (i1 == null || i2 == null) {
        console.warn("[警告] import区域tag未找到！请检查view代码！", scriptPath,scriptName);
    } else {
        // 删除已有元素
        lines.splice(i1 + 1, i2 - i1 - 1)

        let blockText = _makeImportBlockCode(bundleInfo);
        if (blockText) {
            blockText = blockText.substring(0, blockText.length - 1);
            // 插入import区域内容
            lines.splice(i1 + 1, 0, blockText);
        }
    }
    
    // 2. resource bloack
    [i1, i2] = Tools.findLineTag(lines, RESOURCE_BEGIN_TAG, RESOURCE_END_TAG);
    if (i1 == null || i2 == null) {
        console.warn("[警告] resource区域tag未找到！请检查view代码！", scriptPath,scriptName);
    } else {
        // 删除已有元素
        lines.splice(i1 + 1, i2 - i1 - 1)

        let blockText = _makeResourceBlockCode(bundleInfo);
        if (blockText) {
            blockText = blockText.substring(0, blockText.length - 1);

            // 插入import区域内容
            lines.splice(i1 + 1, 0, blockText);
        }
    }

    //3.event block
    [i1, i2] = Tools.findLineTag(lines, EVENT_BEGIN_TAG, EVENT_END_TAG);
    if (i1 == null || i2 == null) {
        console.warn("[警告] event区域tag未找到！请检查view代码！", scriptPath,scriptName);
    }else{
        //event需要特殊处理，因为不能删除已经出现的逻辑，只需要处理新增，不需要处理已经存在的
        let nodeNames   : string[]  = [];
        for(let i = 0;i<_nodeInfos.length;i++){
            const info  = _nodeInfos[i];
            const name  = info.nodeName;
            if(name.startsWith("cc_button")){
                nodeNames.push(name.substring(9));

            }
        }
        if(nodeNames.length > 0){
            //如果发现有按钮，从当前数据中获取
            const arr       = lines.splice(i1 + 1, i2 - i1 - 1);
            const result    = _hotFixButtonEvent(arr,nodeNames);
            const text      = result.join("\n");
            lines.splice(i1 + 1,0 ,text);
        }
    }
    return lines.join("\n");
}


function _makeNewEventBlockCode(){
    //获取到所有以cc_button开头的玩意儿
    let nodeNames   : string[]  = [];
    for(let i = 0;i<_nodeInfos.length;i++){
        const info  = _nodeInfos[i];
        const name  = info.nodeName;
        if(name.startsWith("cc_button")){
            nodeNames.push(name);

        }
    }
    if(nodeNames.length == 0){
        return '';
    }
    let text    = '';
    for(let i = 0;i<nodeNames.length;i++){
        const name  = nodeNames[i];
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
function _makeResourceBlockCode(bundleInfo : AssetBundleInfo){

    const scriptUrl = path.join(bundleInfo.url,bundleInfo.prefabName);

    let nodeNames : string[]  = [];
    let nodeName_2_nodeType : {[name : string] : string} = {};
    for(let i = 0;i<_nodeInfos.length;i++){
        const nodeInfo = _nodeInfos[i];

        let nodeName = nodeInfo.nodeName;
        if(!nodeName.startsWith("cc_")){
            continue;
        }
        if(nodeNames.includes(nodeName)){
            //已经存在
            console.warn(Tools.format("[警告] 预制件[%s]中发现节点名称重复：[%s]", scriptUrl, nodeName));
        }else{
            nodeNames.push(nodeName);
        }


        let nodeType = nodeInfo.nodeType;
        if(nodeType.startsWith("cc.") || nodeType.startsWith("sp.") || nodeType.startsWith("dragonBones.")){
            nodeName_2_nodeType[nodeName]   = nodeType;
            continue;
        }
        //非传统的预制体，那就是一个Custom预制体，一会在说怎么处理
        nodeName_2_nodeType[nodeName]   = nodeType;

    }
    nodeNames = nodeNames.sort();

    let text    = '';
    text += '    protected _getResourceBindingConfig(): ViewBindConfigResult {\n';
    text += '        return {\n';
    for(let i = 0;i<nodeNames.length;i++){
        const nodeName  = nodeNames[i];
        const nodeType  = nodeName_2_nodeType[nodeName];
        if(nodeName.startsWith("cc_button")){
            const clickFunc = _getButtonEventByNodeName(nodeName);
            text += '            ' + nodeName + "    : [" + nodeType+",this." + clickFunc + ".bind(this)],\n";
        }else{
            text += '            ' + nodeName + "    : [" + nodeType+"],\n";
        }

    }
    text += '        };\n';
    text += '    }\n';

    text += '    //------------------------ 所有可用变量 ------------------------//\n';
    for (let i = 0; i < nodeNames.length; i++) {
        const nodeName = nodeNames[i];
        let varName = nodeName.substring(3, nodeName.length);
        let nodeType = nodeName_2_nodeType[nodeName];

        text += Tools.format('   protected %s: %s    = null;\n', varName, nodeType);
    }
    text += "    /**\n";
    text += "     * 当前界面的名字\n";
    text += "     * 请勿修改，脚本自动生成\n";
    text += "    */\n";
    text += Tools.format("   public static readonly VIEW_NAME    = '" +  bundleInfo.prefabName + "';\n");
    text += "    /**\n";
    text += "     * 当前界面的所属的bundle名字\n";
    text += "     * 请勿修改，脚本自动生成\n";
    text += "    */\n";
    text += Tools.format("   public static readonly BUNDLE_NAME  = '" + bundleInfo.bundleName + "';\n");
    text += "    /**\n";
    text += "     * 请勿修改，脚本自动生成\n";
    text += "    */\n";
    text += Tools.format("   public get bundleName() {\n");
    text += "        return " + bundleInfo.prefabName + ".BUNDLE_NAME;\n";
    text += "    }\n";
    text += Tools.format("   public get viewName(){\n");
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
function _makeNewViewCode(data : any,bundleInfo : AssetBundleInfo){

    let scriptName  = bundleInfo.prefabName;
    

    let text = "";
    //1.import block
    text += Tools.format('%s\n', IMPORT_BEGIN_TAG);
    text += _makeImportBlockCode(bundleInfo);
    text += Tools.format('%s\n', IMPORT_END_TAG);
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
    text += Tools.format('%s\n', NET_BEGIN_TAG);
    text += '\n';
    if(bundleInfo.prefabName.startsWith("Panel")){
        text += '    public onNetworkMessage(msgType : string,data : any) : boolean {\n';
        text += '        return false;\n';
        text += '    }\n';
    }else if(bundleInfo.prefabName.startsWith("Custom")){
        text += '//这是一个Custom预制体，不会被主动推送网络消息，需要自己在Panel中主动推送\n';
    }
    text += '\n';
    text += Tools.format('%s\n', EVENT_END_TAG);
    text += '\n';
    text += '    //------------------------ 事件定义 ------------------------//\n';
    text += Tools.format('%s\n', EVENT_BEGIN_TAG);
    text += _makeNewEventBlockCode();
    text += Tools.format('%s\n', EVENT_END_TAG);

    text += '\n\n';

    text += Tools.format('%s\n', RESOURCE_BEGIN_TAG);
    text += '\n';
    text += _makeResourceBlockCode(bundleInfo);
    text += '\n';
    text += Tools.format('%s\n', RESOURCE_END_TAG);


    text += '}\n';
    return text;
}


function _pushOnei18nLabel(labelName : string,value : string){
    for(let i = 0;i<_i18nLabels.length;i++){
        const info = _i18nLabels[i];
        if(info.name == labelName){
            console.warn("发现重复的i18n标签：" + labelName);
            return;
        }
    }
    _i18nLabels.push({name : labelName,value : value});
}

function _pushOneRichText(labelName : string,value : string){
    for(let i = 0;i<_i18n_rich_texts.length;i++){
        const info = _i18n_rich_texts[i];
        if(info.name == labelName){
            console.warn("发现重复的i18n富文本标签：" + labelName);
            return;
        }
    }
    _i18n_rich_texts.push({name : labelName,value : value});

}

/**
 * 处理预制体读取
 * @param data 
 * @param tag 
 * @param level 
 */
async function _recursionLoad(data : any,tag : any,level = 0) {
    if(level > 0 && tag._prefab && !tag._name){
        //这个玩意儿是一个Prefab的信息节点
        let nextIndex = tag._prefab.__id__;
        await _loadCustomPrefabInfo(data,data[nextIndex]);
        return;
    }
    DEBUG && console.log("开始解析tag->",tag);
    const nodeName          = tag._name;
    const componentNames    = [];
    let nodeType            = "";
    let uiTransform = false;

    if(nodeName.includes('i18n')){
        //需要被处理成多语言的label，检查下面有没有Label组件
        //console.warn('获取到多语言节点：',nodeName);
        if(!tag._components){
            console.warn("被你标记为i18n的节点下面找不到任何组件的信息？",nodeName);
        }else{
            //检查时啥玩意儿
            for (let i = 0; i < tag._components.length; i++) {
                const componentIndex = tag._components[i].__id__;
                let componentTag = data[componentIndex];
                if(componentTag.__type__ == "cc.Label"){
                    _pushOnei18nLabel(nodeName,componentTag._string);
                    break;
                }else if(componentTag.__type__ == "cc.RichText"){
                    _pushOneRichText(nodeName,componentTag._string);
                    break;
                }else if(componentTag.__type__ == "cc.Sprite"){
                    const _spriteFrame = componentTag._spriteFrame;
                    const __uuid__  = _spriteFrame.__uuid__;
                    const assetInfo = await AssetDbUtils.RequestQueryAssetInfo(__uuid__);
                    if(assetInfo){
                        const spfPath = assetInfo.path;
                        //找到textures的位置
                        const texturesIndex = spfPath.indexOf("textures");
                        if(texturesIndex < 0){
                            //有问题
                            console.error("你的SpriteFrame资源不在textures目录下？",spfPath);
                        }else{
                            //取包括textures的后面的部分
                            const texturePath = spfPath.substring(texturesIndex);
                            //console.log("找到一个i18n的SpriteFrame资源：",nodeName,texturePath);
                            _i18nSprites.push({name : nodeName,value : texturePath});
                        }
                    }
                    break;
                }
            }
        }
    }


    if(nodeName.startsWith("cc_button")){
        nodeType            = "GButton";
    }else{
        if(tag._components){
            for (let i = 0; i < tag._components.length; i++) {
                const componentIndex = tag._components[i].__id__;
                let componentTag = data[componentIndex];
                componentNames.push(componentTag.__type__);
                if(uiTransform && nodeType == ''){
                    nodeType    = componentTag.__type__;
                }
                if(componentTag.__type__ == "cc.UITransform"){
                    uiTransform = true;
                }
            }
        }
    }
    nodeType    = _convertNodeTypeSubNamespaceToCc(nodeType);
    nodeType    = _checkSkipComponent(nodeType);
    if(level > 0 && nodeName.startsWith("cc_")){
        const nodeInfo : NodeInfo = {
            nodeName : nodeName,
            nodeType : nodeType || 'cc.Node',
            globalFileId : '',
        };
        const compInfo = ComponentUtils.GetComponentInfo(nodeType);
        DEBUG && console.log("当前节点：" + nodeName + "导出类型：", nodeType);
        DEBUG && console.log("当前nodeType获取到的全局组件信息：",compInfo);
        if(compInfo){
            nodeInfo.nodeType = compInfo.className;
            nodeInfo.globalFileId = nodeType;
        }
        
        _nodeInfos.push(nodeInfo);
    };
    if(tag._children){
        for (let i = 0; i < tag._children.length; i++) {
            const childIndex = tag._children[i].__id__;
            await _recursionLoad(data,data[childIndex], level + 1);
        }
    }
}

/**
 * 根据一个预制体的完整路径，初始化整个bundle
 * @param pName 
 * @returns 返回这个预制体的脚本路径
 */
function _initAssetBundleInfoByPrefabDir(pName : string){
    DEBUG && console.log("预制体路径：",pName);
    let scriptPath          = "";
    const assetBundleInfo   = AssetDbUtils.getAsssetBundleInfoByPath(pName);
    PrefabUtils.InitBundle(assetBundleInfo);
    DEBUG && console.warn("已知预制体Custom:",assetBundleInfo);
    const subFolder = assetBundleInfo.prefabSubUrl;
    if(assetBundleInfo.bundleName == "resources"){
        //resources下的全部导出到这个位置
        scriptPath  = path.join('assets','resources','scripts','view');
    }else{
        //其他预制体
        scriptPath  = path.join('assets','bundles',assetBundleInfo.bundleName,'scripts','view');
    }
    if(subFolder != ""){
        scriptPath  = path.join(scriptPath,subFolder);
    }
    scriptPath  = path.join(scriptPath,assetBundleInfo.prefabName).replaceAll("\\","/");
    return "db://" + scriptPath;
}   

/**
 * 使用的是预制体，解析这个使用的预制体
 * @param data 
 * @param tag 
 */
async function _loadCustomPrefabInfo(data : any,tag : any) {
    let instanceIndex = tag.instance.__id__;
    let instanceTag = data[instanceIndex];
    DEBUG && console.log("尝试解析预制体嵌套：",instanceIndex,instanceTag);
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
    let nodeType    = "cc.Node";
    let scriptPath  = "";
    if (tag.asset) {
        let prefabUuid = tag.asset.__uuid__;
        let prefabFilePath = PrefabUtils.GetPrefabFilePath(prefabUuid);
        console.warn("使用预制体作为节点：" ,prefabUuid,prefabFilePath);
        if (prefabFilePath) {
            const pName = path.basename(prefabFilePath,".prefab");
            if(pName.startsWith("Custom")){
                //nodeType 就是预制体的路径
                nodeType        = pName;
                scriptPath      = _initAssetBundleInfoByPrefabDir(prefabFilePath);
            }
            
        }else{
            DEBUG && console.log("你使用了非本bundle中的预制体,需要查找。",prefabUuid);
            const prefabInfo    = await AssetDbUtils.RequestQueryAssetInfo(prefabUuid);
            if(!prefabInfo){
                console.error("错误，你引用了一个不存在的预制体资源：",tag,prefabUuid);
            }else{
                DEBUG && console.log("预制体资源加载成功：",prefabInfo);
                const pName = prefabInfo.name;
                if(pName.startsWith("Custom")){
                    nodeType        = path.basename(pName,".prefab");
                    scriptPath      = _initAssetBundleInfoByPrefabDir(prefabInfo.file);
                }else{
                    //非Custom开头的节点，默认为一个Node
                }

            }
        }
    }

    nodeType = _convertNodeTypeSubNamespaceToCc(nodeType);
    nodeType = _checkSkipComponent(nodeType);
    if(nodeName.startsWith("cc_button") && !nodeType.startsWith('Custom')){
        nodeType = "GButton";
    }
    const compInfo = ComponentUtils.GetComponentInfo(nodeType);
    const nodeInfo : NodeInfo = {
        nodeName    : nodeName,
        nodeType    : nodeType || "cc.Node",
        scriptPath  : scriptPath,
        globalFileId : '',
    }
    if(compInfo){
        nodeInfo.nodeType = compInfo.className;
        nodeInfo.globalFileId = nodeType;
        DEBUG && console.log('解析嵌套预制体时，发现全局组件信息：',compInfo);
    }
    _nodeInfos.push(nodeInfo);
}

function _convertNodeTypeSubNamespaceToCc(nodeType : any){
    if (nodeType.startsWith("sp.") || nodeType.startsWith("dragonBones.")) {
        nodeType = "cc." + nodeType;
    }
    return nodeType;
}

function _checkSkipComponent(name : string){
    if(name == "cc.Layout" || name == "cc.Widget"){
        return "cc.Node";
    }
    return name;
}

/**
 * 初始化引入
 */
function _makeImportBlockCode(bundleInfo : AssetBundleInfo){
    let importPrefabNames : string[]        = [];
    let importComponentNames : string[]     = [];
    const bundleName    = bundleInfo.bundleName;
    let importComponentName_2_componentInfo : {[name : string] : ComponentInfo} = {};
    for(let i = 0;i<_nodeInfos.length;i++){
        const nodeInfo  = _nodeInfos[i];
        const nodeName  = nodeInfo.nodeName;
        let nodeType    = nodeInfo.nodeType;
        //仅处理以cc_开头的对象
        if(!nodeName.toLocaleLowerCase().startsWith("cc_")){
            continue;
        }
        //原始类型不做处理
        if(nodeType.startsWith("cc.") || nodeType.startsWith("sp.") || nodeType.startsWith("dragonBones.")){
            continue;
        }
        if(nodeType == "GButton"){
            //按钮类型特殊处理
        }else{
            //其他类型
            if(ComponentUtils.IsContainComponentInfo(nodeType)){
                //如果有这个类型
                const componentInfo = ComponentUtils.GetComponentInfo(nodeType);
                const className     = componentInfo.className;
                if (importComponentNames.indexOf(className) < 0) {
                    importComponentNames.push(className);
                    importComponentName_2_componentInfo[className] = componentInfo;
                }
            }else{
                //找不到的时候检查是否不是当前目录下的新增的Custom文件
                let cPath   = "";
                //脚本路径
                let sPath   = "";
                if(bundleName != "resources"){
                    cPath   = path.join(Editor.Project.path,"assets","bundles",bundleName,"prefabs",nodeType + ".prefab");
                    sPath   = "db://assets/bundles/" + bundleName + "/scripts/view/" + nodeType;//path.join(Editor.Project.path,"assets","bundles",bundleName,"scripts","view",nodeType + ".ts");
                }else{
                    cPath   = path.join(Editor.Project.path,"assets","resources","prefabs",nodeType + ".prefab");
                    sPath   = "db://assets/resources/scripts/view/" + nodeType;//path.join(Editor.Project.path,"assets","scripts","view",nodeType + ".ts");
                }
                if(fs.existsSync(cPath)){
                    //存在
                    if(!importComponentNames.includes(nodeType)){
                        importComponentNames.push(nodeType);
                        const componentInfo : ComponentInfo = {
                            className : nodeType,
                            scriptFilePath  : sPath,
                            bDefaultExport  : true,
                        }
                        importComponentName_2_componentInfo[nodeType] = componentInfo;
                    }
                }else{
                    if(nodeInfo.scriptPath && nodeInfo.scriptPath != ''){
                        if(!importComponentNames.includes(nodeType)){
                            importComponentNames.push(nodeType);
                            const componentInfo : ComponentInfo = {
                                className       : nodeType,
                                scriptFilePath  : nodeInfo.scriptPath,
                                bDefaultExport  : true,
                            }
                            importComponentName_2_componentInfo[nodeType] = componentInfo;
                        }
                    }else{
                        
                        if(nodeInfo.globalFileId != ''){
                            if(!importComponentNames.includes(nodeType)){
                                const compInfo  = ComponentUtils.GetComponentInfo(nodeInfo.globalFileId);
                                DEBUG && console.log('引入一个全局的组件：',compInfo);
                                importComponentNames.push(compInfo.className);
                                importComponentName_2_componentInfo[compInfo.className] = compInfo;
                            }
                        }else{
                            console.warn("你试图引入一个不存在的Custom预制体节点？",cPath,nodeInfo);
                        }
                    }

                }
            }
        }

    }
    importPrefabNames = importPrefabNames.sort();
    importComponentNames = importComponentNames.sort();
    

    DEBUG && console.log("特殊引用：",importComponentNames,importComponentName_2_componentInfo);

    //const scriptPath    = path.join(bundleInfo.url,'scripts','view');
    const scriptName    = bundleInfo.prefabName;

    let text    = "";
    //1.引入基类
    const basePath  = "db://assets/resources/scripts/core/view/view-base";
    //const toPath    = path.join(scriptPath,scriptName);

    //define
    const definePath    = "db://assets/resources/scripts/core/define";//path.join(Editor.Project.path,"assets","scripts","core","define");

    //let dPath   = Tools.calcRelativePath(toPath,definePath).replaceAll("\\","/");

    //gbutton
    const gButtonPath   = "db://assets/resources/scripts/core/view/gbutton";//path.join(Editor.Project.path,"assets","scripts","core","view","gbutton");
    //let bPath   = Tools.calcRelativePath(toPath,gButtonPath).replaceAll("\\","/");

    text        += "import ViewBase from '" + basePath + "';\n";
    text        += "import { ClickEventCallback, ViewBindConfigResult, EmptyCallback, AssetType, bDebug } from '" + definePath + "';\n";
    text        += "import { GButton } from '" + gButtonPath + "';\n";
    text        += "import * as cc from 'cc';\n";
    if(importComponentNames.length > 0){
        text        += "//------------------------特殊引用开始----------------------------//\n";
        for(let i = 0;i<importComponentNames.length;i++){
            const pName = importComponentNames[i];
            const componentInfo = importComponentName_2_componentInfo[pName];
            const url   = componentInfo.scriptFilePath;
            //let purl    = Tools.calcRelativePath(toPath,url).replaceAll("\\","/");
            //const plen  = purl.length;
            //purl        = purl.substring(0,plen - 3);
            text += "import " + componentInfo.className + " from '" + url + "';\n";
        }
        text        += "//------------------------特殊引用完毕----------------------------//\n";
    }
    text        += "//------------------------上述内容请勿修改----------------------------//\n";
    return text;
}
/**
 * 热更新按钮事件
 * 只新增，不删除
 * @param lines 
 * @param nodeNames 
 * @returns 
 */
function _hotFixButtonEvent(lines : string[],nodeNames : string[]){
    let re : string[]   = [];
    for(let i = 0;i<lines.length;i++)
    {
        const str   = lines[i];
        if(str.includes("onClickButton")){
            //这是一个按钮事件方法的定义
            const st    = str.indexOf("onClickButton");
            const et    = str.indexOf("(");
            //还原按钮名字
            let name    = str.substring(st + 13,et);
            DEBUG && console.log("找到一个已经存在的按钮：",name);
            const iIndex    = nodeNames.indexOf(name);
            if(iIndex >= 0){
                //这个按钮存在，删除
                nodeNames.splice(iIndex,1);
            }
        }
    }
    //这个就是剩下的了
    if(nodeNames.length == 0){
        return lines;
    }
    //如果有新增的按钮
    for(let i = 0;i<nodeNames.length;i++){
        const name  = nodeNames[i];
        console.log("新增按钮事件：" + name);
        let text    = "\n";
        text        += "    private onClickButton" + name + "(event : cc.EventTouch){\n";
        text        += "        cc.log('on click event cc_button" + name + "');\n";
        text        += "    }\n";
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
function _initNewI18nXlsxFile(bundleName : string,prefabName : string){
    const filePath  = path.join(Editor.Project.path,"_config",bundleName,"i18n","i18n_" + bundleName + "_" + prefabName + "_db.xlsx");
    if(fs.existsSync(filePath)){
        //如果文件已经存在
        console.error("i18n文件已经存在，请不要重复创建：",filePath);
        return;
    }
    //从_config/i18n_simple_db.xlsx复制一份
    const sourceFilePath = path.join(Editor.Project.path,"_config","i18n_simple_db.xlsx");
    if(!fs.existsSync(sourceFilePath)){
        console.error("i18n_simple_db.xlsx文件不存在，请检查：",sourceFilePath);
        return;
    }
    //打开文件
    const sheets    = xlsx.parse(fs.readFileSync(sourceFilePath));
    const sheet     = sheets[0];
    const datas     = sheet.data;
    //读取datas的第一行
    if(datas.length == 0){
        console.error("i18n_simple_db.xlsx文件没有数据，请检查：",sourceFilePath);
        return;
    }
    //检查第一行的内容
    let firstRow = datas[0];
    //修改db的名字
    firstRow[1] = "i18n_" + bundleName + "_db";
    //写入filePath
    //写入文件
    const sheetOptions  = {'!cols': [{wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}]};
    const buffer        = xlsx.build([{name : sheet.name,data : datas,options : sheetOptions}]);
    fs.writeFileSync(filePath,buffer,{encoding : "binary"});
    console.log("i18n多语言文件初始化成功：",filePath);
}


/**
 * 读取指定bundle下的i18n多语言文件
 * @param bundleName 
 */
export function readI18nXlsxFileData(bundleName : string,prefabName : string){

    //首先判定是否需要有需要导出的labels/sprite
    if(_i18nLabels.length == 0 && _i18nSprites.length == 0){
        console.warn("没有需要导出的多语言数据，请检查是否有cc_button开头的节点，或者i18n标签");
        return;
    }

    const filePath  = path.join(Editor.Project.path,"_config",bundleName,"i18n","i18n_" + bundleName + "_" + prefabName + "_db.xlsx");
    if(!fs.existsSync(filePath)){
        //console.error("请定义自己的i18n文件：",filePath);
        _initNewI18nXlsxFile(bundleName,prefabName);
    }
    //读表格
    const sheets    = xlsx.parse(fs.readFileSync(filePath));
    if(sheets.length == 0){
        console.error("读取表格失败：",filePath);
        return;
    }
    //只认第一张sheet
    const sheet     = sheets[0];
    const datas      = sheet.data;
    console.log('处理多语言表格内容：'    ,datas);
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

    const AUTO_EXPORT_START_FLAG    = '<<AUTO_EXPORT_DATA_BEGIN_DO_NOT_MODIFY>>';

    let auto_export_start_row_index = -1;

    for(let i = 0;i<datas.length;i++){
        let data = datas[i];
        if(data[0] && data[0] == FLD_NAME){
            //遍历这行，获取节点类型，面板名字，节点名字的列索引
            for(let j = 0;j<data.length;j++){
                let name = data[j];
                if(name == FLD_NAME_NODETYPE){
                    nodeTypeColumnIndex = j;
                }else if(name == FLD_NAME_PANELNAME){
                    panelNameColumnIndex = j;
                }else if(name == FLD_NAME_NODENAME){
                    nodeNameColumnIndex = j;
                }
            }
        }
        if(data.length > 1 && data[1] == AUTO_EXPORT_START_FLAG){
            //获取自动导出标记字段
            auto_export_start_row_index = i;
        }
        //获取自动导出标记字段
    }
    //检查索引是否都获取到了
    if(nodeTypeColumnIndex == -1 || panelNameColumnIndex == -1 || nodeNameColumnIndex == -1){
        console.error("表格格式不正确，请检查：",filePath,',nodeType = ',nodeTypeColumnIndex,',panelName = ',panelNameColumnIndex,',nodeName = ',nodeNameColumnIndex);
        return;
    }
    //如果没有发现导出标记，就给表的数据后面延长10行后加入
    if(auto_export_start_row_index == -1){
        auto_export_start_row_index = datas.length;
        for(let i = 0;i<2;i++){
            datas.push([]);
        }
        datas.push([,AUTO_EXPORT_START_FLAG]);
        auto_export_start_row_index = datas.length - 1;
    }

    //从 auto_export_start_row_index + 1开始找
    const PANEL_START_FLAG              = '<<PANEL_START_FLAG_' + prefabName + '>>';
    let bPANELFOUND = false;
    let all_panel_node_row_data : any[] = [];
    let key_panel_node_row_data : {[key : string] : any} = {};
    let panel_row_start_index           = -1;
    for(let i = auto_export_start_row_index + 1;i<datas.length;i++){
        const data = datas[i];
        if(data.length == 0 || (data.length == 1 && data[0] == '')){
            //找到一个空白的，说明没了
            if(!bPANELFOUND){
                continue;
            }else{
                break;
            }
        }
        if(data.length > 1 && data[1] == PANEL_START_FLAG){
            //找到这个预制体的标记
            bPANELFOUND = true;
            panel_row_start_index = i;
            continue;
        }
        if(bPANELFOUND){
            key_panel_node_row_data[data[2]] = data;
            all_panel_node_row_data.push(data);
        }
    }
    if(!bPANELFOUND){
        //如果没有找到这个预制体的标记，就加入
        datas.push([]);
        datas.push([,PANEL_START_FLAG]);
        panel_row_start_index = datas.length - 1;
    }
    let new_panel_node_row_data : any[] = [];
    for(let i = 0;i< _i18nLabels.length;i++){
        const key_name  = prefabName + "_" + _i18nLabels[i].name;
        const value     = _i18nLabels[i].value;
        if(key_panel_node_row_data[key_name]){
            //1.检查当前Label上的内容和原来的内容是否一致，如果不一致，要替换
            const old_data = key_panel_node_row_data[key_name];
            if(old_data[6] != value){
                old_data[5] = _i18nLabels[i].name;
                //不一致，替换
                old_data[6] = value;
                old_data[7] = value;
                new_panel_node_row_data.push(old_data);
            }else{
                //原来就有的
                new_panel_node_row_data.push(key_panel_node_row_data[key_name]);
            }
            
        }else{
            //原来没有的,将zh_cn和en_us两个数据自动填充进去
            new_panel_node_row_data.push(['DATA',,key_name,'1',prefabName,_i18nLabels[i].name,value,value]);
        }
    }

    //开始输出富文本
    for(let i = 0;i<_i18n_rich_texts.length;i++){
        const key_name = prefabName + "_" + _i18n_rich_texts[i].name;
        if(key_panel_node_row_data[key_name]){
            //原来就有的
            new_panel_node_row_data.push(key_panel_node_row_data[key_name]);
        }else{
            //原来没有的
            new_panel_node_row_data.push(['DATA','',key_name,'3',prefabName,_i18n_rich_texts[i].name,_i18n_rich_texts[i].value]);
        }
    }


    //开始输出sprite
    for(let i = 0;i<_i18nSprites.length;i++){
        const spInfo = _i18nSprites[i];
        const key_name = prefabName + "_" + spInfo.name;
        if(key_panel_node_row_data[key_name]){
            //原来就有的
            new_panel_node_row_data.push(key_panel_node_row_data[key_name]);
        }else{
            //原来没有的
            new_panel_node_row_data.push(['DATA','',key_name,'2',prefabName,spInfo.name,spInfo.value]);
        }
    }
    //新增一行空白
    new_panel_node_row_data.push([]);
    //插入到datas表格中,替换掉从panel_row_start_index + 1 开始 共all_panel_node_row_data.length + 1 个数据
    datas.splice(panel_row_start_index + 1,all_panel_node_row_data.length + 1,...new_panel_node_row_data);
    console.log('new datas = ',datas);
    //写入文件
    const sheetOptions  = {'!cols': [{wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}]};
    const buffer        = xlsx.build([{name : sheet.name,data : datas,options : sheetOptions}]);
    fs.writeFileSync(filePath,buffer,{encoding : "binary"});
}
