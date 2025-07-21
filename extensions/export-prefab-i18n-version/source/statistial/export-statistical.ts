import path from "path";
import fs from "fs-extra";
import xlsx from "node-xlsx";
import { NodeInfo } from "../define";
import StatisticalUtils from "./statistical-utils";
import Tools from "../utils/tools";

//统计数据格式
declare type StatisticalPanelData = {
    /**
     * 界面名字
     */
    viewName        : string;
    /**
     * 界面描述
     */
    desc            : string;
    /**
     * 统计ID
     */
    statisticalId   : number;
}
//统计按钮格式
declare type StatisticalButtonData = {
    /**
     * 所属界面
     */
    viewName        : string,
    /**
     * 按钮名字
     */
    buttonName      : string,
    /**
     * 描述
     */
    desc            : string,
    /**
     * 统计ID
     */
    statisticalId   : number,
}

//自定义打点数据
declare type StatistalCustomizeData = {
    /**
     * 自定义事件名字
     */
    eventName       : string,
    /**
     * 自定义事件描述
     */
    desc            : string,
    /**
     * 自定义事件打点ID
     */
    statisticalId   : number,
}

declare type  StatisticalConfig = {
    [panelName : string] : {
        statisticalId : number,
        panelId : number
    }
};

export default class ExportStatistical {

    public gameId : number = -1;
    /**
     * 当前界面在panel_$bundleName_statistical_db.xlsx中的索引
     */
    public panelId : number = -1;
    /**
     * 页面统计数据
     */
    private _panelDatas : StatisticalPanelData[]        = [];
    /**
     * 按钮统计数据
     */
    private _buttonDatas : StatisticalButtonData[]      = [];
    /**
     * 自定义打点数据
     */
    private _customizeDatas : StatistalCustomizeData[]  = [];
    /**
     * 当前bundle的统计配置
     */
    protected _bundle_statistical_config : StatisticalConfig | null = null;
    /**
     * 当前预制体的统计ID
     * -1表示没有统计ID
     */
    protected _prefab_statistical_id : number = -1;

    constructor(public bundleName : string,public prefabName : string,public nodeInfos : NodeInfo[]){
        this.gameId = StatisticalUtils.getBundleGameId(bundleName);
        if(!this.gameId || this.gameId == -1){
            console.error('********************************************');
            console.error('1.请在_config/statistical.config.json5中配置游戏ID');
            console.error('********************************************');
            return;
        }
        const configUrl = path.join(Editor.Project.path,"_config",bundleName,"statistical","statistical_" + bundleName + "_config.json");
        if(fs.existsSync(configUrl)){
           this._bundle_statistical_config = fs.readJSONSync(configUrl);
           if(this._bundle_statistical_config[prefabName]){
                const prefabConfig = this._bundle_statistical_config[prefabName];
                this._prefab_statistical_id = prefabConfig.statisticalId;
                this.panelId = prefabConfig.panelId;
           }else{
                const keys = Object.keys(this._bundle_statistical_config);
                //遍历keys，找到最大的值
                let maxId = -1;
                for(let i = 0;i<keys.length;i++){
                    const key = keys[i];
                    const config  = this._bundle_statistical_config[key];
                    if(config.statisticalId > maxId){
                        maxId = config.statisticalId;
                    }
                }
                if(maxId == -1){
                    //没有数据，说明是当前bundle第一个被导出的预制体
                    this._prefab_statistical_id = this.getPrefabStatisticalId();
                    this.panelId = 0;
                    this._bundle_statistical_config[prefabName] = {
                        statisticalId : this._prefab_statistical_id,
                        panelId       : 0,
                    };
                }else{
                    //获取maxId最后两位转换为panelId
                    this._prefab_statistical_id = maxId + 1;
                    this.panelId = this._prefab_statistical_id % 1000;
                    console.warn("当前预制体的统计ID：",this._prefab_statistical_id,this.panelId);
                    this._bundle_statistical_config[prefabName] = {
                        statisticalId : this._prefab_statistical_id,
                        panelId       : this.panelId,
                    };
                }
           }
        }else{
            //没有配置文件，创建一个新的
            this._bundle_statistical_config = {};
            this._prefab_statistical_id = this.getPrefabStatisticalId();
            this.panelId = 0;
            this._bundle_statistical_config[prefabName] = {
                statisticalId : this._prefab_statistical_id,
                panelId       : 0,
            };
        }
        
    }
    /**
     * 获取新的预制体统计ID
     */
    protected getPrefabStatisticalId() : number {
        let stId = this.gameId * 100000 + 1000;
        return stId;
    }

    /**
     * 导出界面统计数据
     * @returns 
     */
    public exportPanelStatics(){
        if(!this.gameId || this.gameId == -1){
            console.error('********************************************');
            console.error('2.请在_config/statistical.config.json5中配置游戏ID');
            console.error('********************************************');
            return;
        }

        //直接导出到_config/$bundleName/statistical/panels/panel_$bundleName_$prefabName_statistical_db.xlsx
        if(!this.bundleName || !this.prefabName){
            console.error("bundleName或prefabName未设置，请检查");
            return;
        }
        const panelUrl = path.join(Editor.Project.path,"_config",this.bundleName,"statistical","panels","panel_" + this.bundleName + "_" + this.prefabName + "_statistical_db.xlsx");
        //如果文件存在，就不处理了
        if(fs.existsSync(panelUrl)){
            //console.warn("界面统计：文件已存在，不处理：",panelUrl);
            //return;
        }
        fs.ensureDirSync(path.dirname(panelUrl));

        console.warn("导出界面统计数据：",this.prefabName,this.bundleName);
        const prefabName = this.prefabName;
        const bundleName = this.bundleName; 
        //游戏开始的ID 1000，1001，1002，1003，1004
        const gameId    = this.gameId;
        let sheetName   = "Sheet1";
        let datas : any[][] = [
            ['DB_NAME','panel_' + bundleName + '_statistical_db'],
            ['DB_RULE','m','export_key'],
            ['FLD_TYPE',,'S','S','S','I'],
            ['FLD_NAME',,'viewName','bundleName','desc','statisticalId'],
            ['FLD_DESC',,'界面名字','bundle名字','描述内容(需要手动填写）','统计ID'],
            ['FLD_VERIFYER'],
        ];
    
        //首先检查是否有这个界面
        let panelIndex = -1;
        const rowKeys : string[] = [
            "DB_NAME",
            "DB_RULE",
            "EXPORT_CONST",
            "FLD_TYPE",
            "FLD_NAME",
            "FLD_DESC",
            "FLD_VERIFYER",
        ];
        /**
         * FLD_NAME行索引
         */
        let fldNameRowIndex = -1;
        let fldNameData : any[] = [];
        //找到FLD_NAME行
        for(let i = 0;i<rowKeys.length;i++){
            const data = datas[i];
            if(data[0] == "FLD_NAME"){
                fldNameRowIndex = i;
                fldNameData = data;
                break;
            }
        }
        if(fldNameRowIndex == -1){
            console.error("表格格式不正确，请检查：",panelUrl);
            return;
        }
    
        //找到statisticalId所在列
        let statisticalIdColumnIndex = -1;
        for(let i = 0;i<fldNameData.length;i++){
            if(fldNameData[i] == "statisticalId"){
                statisticalIdColumnIndex = i;
                break;
            }
        }
    
        //前面5行都是配置信息，可以忽略
        // let maxId = -1;
        // for(let i = 6;i<datas.length;i++){
        //     let data = datas[i];
        //     if(data.length >= 3 && data[2] == prefabName){
        //         panelIndex = i;
        //     }
        //     if(data[statisticalIdColumnIndex] > maxId){
        //         maxId = data[statisticalIdColumnIndex];
        //     }
        //     if(data[0] == 'DATA' && data[2].startsWith('Panel')){
        //         this._panelDatas.push({
        //             viewName        : data[2],
        //             desc            : data[4],
        //             statisticalId   : data[5],
        //         });
        //     }
        // }
    
        // if(panelIndex >= 0){
        //     //有找到这个界面，就不处理了
        //     return;
        // }
        // let stId = -1;
        // if(maxId == -1){
        //     //这是第一个加入的
        //     //1000 100000 = 100000000
        //     stId = gameId * 100000 + 1000;
        //     this.panelId    = 0;
        // }else{
        //     stId = maxId + 1;
        //     //获取stId最后两位转换喂panelId
        //     this.panelId = stId % 1000;
        // }
        //没有找到的，塞一个新的
        datas.push(['DATA',,prefabName,bundleName,,this._prefab_statistical_id]);
        //写回去
        const sheetOptions  = {'!cols': [{wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}]};
        const buffer        = xlsx.build([{name : sheetName,data : datas,options : sheetOptions}]);
        fs.writeFileSync(panelUrl,buffer,{encoding : "binary"});
        if(prefabName.includes('Panel')){
            this._panelDatas.push({
                viewName        : prefabName,
                desc            : '',
                statisticalId   : this._prefab_statistical_id,
            });
        }
        
        console.log('导出面板统计成功：',prefabName,bundleName,this._prefab_statistical_id);
    }
    


    /**
     * 导出当前预制体所有的按钮统计信息
     * @param prefabName 
     * @param bundleName 
     * @returns 
     */
    public exportPrefabButtonStatistical(){
        if(!this.gameId || this.gameId == -1){
            return;
        }
        const prefabName = this.prefabName;
        const bundleName = this.bundleName;
        const buttonUrl = path.join(Editor.Project.path,"_config",this.bundleName,"statistical","gbuttons","gbutton_" + this.bundleName + "_" + this.prefabName + "_statistical_db.xlsx");
        fs.ensureDirSync(path.dirname(buttonUrl));
        //收集当前预制体中所有的按钮信息
        const gbuttons : {[name : string] : NodeInfo} = {}; 
        let bFoundGbuttons : boolean = false;
        for(let i = 0;i<this.nodeInfos.length;i++){
            const nodeInfo = this.nodeInfos[i];
            if(nodeInfo.nodeType == "GButton"){
                bFoundGbuttons  = true;
                gbuttons[nodeInfo.nodeName] = nodeInfo;
            }
        }
        if(!bFoundGbuttons){
            console.warn("当前预制体没有按钮信息：",prefabName);
            //return;
        }
        //游戏开始的ID 1000，1001，1002，1003，1004
        const gameId    = this.gameId;
        let sheetName   = "Sheet1";
        let datas : any[][] = [];
        if(fs.existsSync(buttonUrl)){
            //读取按钮统计文件
            const buttonSheets  = xlsx.parse(fs.readFileSync(buttonUrl));
            if(buttonSheets.length > 0){
                const sheet   = buttonSheets[0];
                datas         = sheet.data;
            }
        }
        if(datas.length == 0){
            datas = [
                ['DB_NAME','gbutton_' + bundleName + '_statistical_db'],
                ['DB_RULE','mm'],
                ['FLD_TYPE',,'S','S','S','S','I'],
                ['FLD_NAME',,'viewName','buttonName','bundleName','desc','statisticalId'],
                ['FLD_DESC',,'界面名字','按钮名字','bundle名字','描述内容(需要手动填写）','统计ID'],
                ['FLD_VERIFYER'],
            ];
        }
        
        //获取statisticalId所在列
        let statisticalIdColumnIndex = -1;
        let fldNameRowIndex = -1;
        let fldNameData : any[] = [];
        for(let i = 0;i<datas.length;i++){
            const data = datas[i];
            if(data[0] == "FLD_NAME"){
                fldNameRowIndex = i;
                fldNameData = data;
                break;
            }
        }
        if(fldNameRowIndex == -1){
            console.error("表格格式不正确，请检查：",buttonUrl);
            return;
        }
        for(let i = 0;i<fldNameData.length;i++){
            if(fldNameData[i] == "statisticalId"){
                statisticalIdColumnIndex = i;
                break;
            }
        }
        //遍历当前的数据，找到这个预制体开始和结束的索引
        let start_index = -1;
        let end_index   = -1;
        for(let i = 0;i<datas.length;i++){
            const data = datas[i];
            if(data.length >= 3 && data[2] == prefabName){
                if(start_index == -1){
                    start_index = i;
                }
                end_index = i;
            }
        }
        //全新数据
        let newData : any[] = [];
        //已经存在的
        let alreadyExists : any[]   = [];
        //已经被删除的
        let deleted : any[]         = [];
        //新增的
        let newAdd : any[]          = [];
        if(start_index != -1){
            //如果找到了，先把这些数据从datas中删除
            newData     = datas.splice(start_index,end_index - start_index + 1);
            let maxId   = -1;
            //倒叙遍历newData
            for(let i = newData.length - 1;i>=0;i--){
                const data          = newData[i];
                if(maxId == -1){
                    maxId   = data[6];
                }
                //预制体名字
                const viewName      = data[2];
                //按钮名字
                const buttonName    = data[3];
                if(!gbuttons[buttonName]){
                    //这个按钮已经被删除了
                    data[1]     = '<占位，已被删除>';
                    deleted.push(data);
                    //删除这个索引
                    newData.splice(i,1);
                    delete gbuttons[buttonName];
                }else{
                    //已经存在的
                    data[1]     = '';
                    alreadyExists.push(data);
                    //删除这个索引
                    newData.splice(i,1);
                    delete gbuttons[buttonName];
                }
            }
            //遍历完成后，gbuttons中剩下的就是新增的
            Tools.forEachMap(gbuttons,(name,gbutton) => {
                //第一个界面的第一个按钮的ID是1100
                const stId = maxId + 1;
                newAdd.push(['DATA',,prefabName,gbutton.nodeName,bundleName,,stId]);
            });
        }else{
            //如果找不到，说明是一个新的预制体，直接加到最后
            start_index = datas.length;
            let index   = 0;
            //全部新增
            Tools.forEachMap(gbuttons,(name,gbutton) => {
                //第一个界面的第一个按钮的ID是1100
                const stId = gameId * 100000 + 1100 + this.panelId * 100 + index;
                newAdd.push(['DATA',,prefabName,gbutton.nodeName,bundleName,,stId]);
                index += 1;
            });
            //newAdd后面新增一行空数据
            newAdd.push([]);
        }

        //合并数据
        newData = newData.concat(alreadyExists).concat(deleted).concat(newAdd);
        //以data[6]的大小进行从小到大排序
        newData.sort((a,b) => {
            return a[6] - b[6];
        });
        //将newData插入到datas中的start_index位置
        datas.splice(start_index,0,...newData);
        //写xlsx
        const sheetOptions  = {'!cols': [{wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}]};
        const buffer        = xlsx.build([{name : sheetName,data : datas,options : sheetOptions}]);
        fs.writeFileSync(buttonUrl,buffer,{encoding : "binary"});
        console.log('导出按钮统计成功：',prefabName,bundleName);
        for(let i = 6;i<datas.length;i++){
            const data = datas[i];
            if(data[0] == 'DATA'){
                this._buttonDatas.push({
                    viewName        : data[2],
                    buttonName      : data[3],
                    desc            : data[5],
                    statisticalId   : data[6],
                });
            }
        }
    }

    /**
     * 收集当前bundle的自定义事件打点
     */
    public collectionCustomizeStatistical(){
        if(!this.gameId || this.gameId == -1){
            return;
        }
        const customizeUrl = path.join(Editor.Project.path,"_config",this.bundleName,"statistical","customize_" + this.bundleName + "_statistical_db.xlsx");
        //读取这个配置表
        let sheetName = "Sheet1";
        let datas : any[][] = [];
        if(fs.existsSync(customizeUrl)){
            const customizeSheets = xlsx.parse(fs.readFileSync(customizeUrl));
            if(customizeSheets.length > 0){
                const sheet = customizeSheets[0];
                datas = sheet.data;
            }
        }
       
        if(datas.length == 0){
            datas = [
                ['DB_NAME','customize_' + this.bundleName + '_statistical_db'],
                ['DB_RULE','m','export_key'],
                ['FLD_TYPE',,'S','S','I'],
                ['FLD_NAME',,'customEventKey','desc','statisticalId'],
                ['FLD_DESC',,'自定义事件名字','描述内容(需要手动填写）','统计ID'],
                ['FLD_VERIFYER'],
            ];
            //写文件
            const sheetOptions  = {'!cols': [{wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}]};
            const buffer        = xlsx.build([{name : sheetName,data : datas,options : sheetOptions}]);
            fs.writeFileSync(customizeUrl,buffer,{encoding : "binary"});
        }
        
        //从第6行开始是数据
        for(let i = 6;i<datas.length;i++){
            const data = datas[i];
            if(data[0] == 'DATA'){
                this._customizeDatas.push({
                    eventName       : data[2],
                    desc            : data[3],
                    statisticalId   : data[4],
                });
            }
        }
    }

    /**
     * 将这些数据导出到一个新的xlsx文件中，用于给策划同事查看
     * 1.文件路径：_config/埋点导出/$bundleName_statistical_export.xlsx
     * 2.xlsx共有三个sheet，分别喂：界面统计，按钮统计，自定义打点
     * 3.三个sheet的数据分别是：this._panelDatas,this._buttonDatas,this._customizeDatas
     */
    public exportDataForPlan(){
        if(!this.gameId || this.gameId == -1){
            return;
        }
        const fileUrl   = path.join(Editor.Project.path,"_config","埋点导出",this.bundleName + "_statistical_export.xlsx");
        const sheet1    = {
            name    : "界面统计",
            data    : [
                ["界面名字","描述","统计ID"],
            ],
        };
        const sheet2    = {
            name    : "按钮统计",
            data    : [
                ["所属界面","按钮名字","描述","统计ID"],
            ],
        };
        const sheet3    = {
            name    : "自定义打点",
            data    : [
                ["自定义事件名字","描述","统计ID"],
            ],
        };
        //填充数据
        for(let i = 0;i<this._panelDatas.length;i++){
            const data = this._panelDatas[i];
            sheet1.data.push([data.viewName,data.desc,data.statisticalId.toString()]);
        }
        for(let i = 0;i<this._buttonDatas.length;i++){
            const data = this._buttonDatas[i];
            sheet2.data.push([data.viewName,data.buttonName,data.desc,data.statisticalId.toString()]);
        }
        for(let i = 0;i<this._customizeDatas.length;i++){
            const data = this._customizeDatas[i];
            sheet3.data.push([data.eventName,data.desc,data.statisticalId.toString()]);
        }
        const sheetOptions  = {'!cols': [{wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}]};
        const buffer        = xlsx.build(
            [
                {name : sheet1.name,data : sheet1.data,options : sheetOptions},
                {name : sheet2.name,data : sheet2.data,options : sheetOptions},
                {name : sheet3.name,data : sheet3.data,options : sheetOptions}
            ],
        );
        //检测fileUrl是否存在，如果存在，则删除
        if(fs.existsSync(fileUrl)){
            fs.removeSync(fileUrl);
        }
        //写入文件
        fs.writeFileSync(fileUrl,buffer,{encoding : "binary"});
        console.warn("埋点导出成功-》",fileUrl);
    }

    /**
     * 将配置写入到_config/$bundleName/statistical/statistical_$bundleName_config.json
     */
    public writeConfigToFile(){
        if(!this._bundle_statistical_config){
            console.error("没有统计配置，无法写入文件");
            return;
        }
        const configUrl = path.join(Editor.Project.path,"_config",this.bundleName,"statistical","statistical_" + this.bundleName + "_config.json");
        fs.ensureDirSync(path.dirname(configUrl));
        fs.writeJSONSync(configUrl,this._bundle_statistical_config,{spaces : 4});
        console.warn("统计配置写入成功：",configUrl);
    }
}