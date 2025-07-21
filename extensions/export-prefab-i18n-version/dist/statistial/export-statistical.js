"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_xlsx_1 = __importDefault(require("node-xlsx"));
const statistical_utils_1 = __importDefault(require("./statistical-utils"));
const tools_1 = __importDefault(require("../utils/tools"));
class ExportStatistical {
    constructor(bundleName, prefabName, nodeInfos) {
        this.bundleName = bundleName;
        this.prefabName = prefabName;
        this.nodeInfos = nodeInfos;
        this.gameId = -1;
        /**
         * 当前界面在panel_$bundleName_statistical_db.xlsx中的索引
         */
        this.panelId = -1;
        /**
         * 页面统计数据
         */
        this._panelDatas = [];
        /**
         * 按钮统计数据
         */
        this._buttonDatas = [];
        /**
         * 自定义打点数据
         */
        this._customizeDatas = [];
        /**
         * 当前bundle的统计配置
         */
        this._bundle_statistical_config = null;
        /**
         * 当前预制体的统计ID
         * -1表示没有统计ID
         */
        this._prefab_statistical_id = -1;
        this.gameId = statistical_utils_1.default.getBundleGameId(bundleName);
        if (!this.gameId || this.gameId == -1) {
            console.error('********************************************');
            console.error('1.请在_config/statistical.config.json5中配置游戏ID');
            console.error('********************************************');
            return;
        }
        const configUrl = path_1.default.join(Editor.Project.path, "_config", bundleName, "statistical", "statistical_" + bundleName + "_config.json");
        if (fs_extra_1.default.existsSync(configUrl)) {
            this._bundle_statistical_config = fs_extra_1.default.readJSONSync(configUrl);
            if (this._bundle_statistical_config[prefabName]) {
                const prefabConfig = this._bundle_statistical_config[prefabName];
                this._prefab_statistical_id = prefabConfig.statisticalId;
                this.panelId = prefabConfig.panelId;
            }
            else {
                const keys = Object.keys(this._bundle_statistical_config);
                //遍历keys，找到最大的值
                let maxId = -1;
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const config = this._bundle_statistical_config[key];
                    if (config.statisticalId > maxId) {
                        maxId = config.statisticalId;
                    }
                }
                if (maxId == -1) {
                    //没有数据，说明是当前bundle第一个被导出的预制体
                    this._prefab_statistical_id = this.getPrefabStatisticalId();
                    this.panelId = 0;
                    this._bundle_statistical_config[prefabName] = {
                        statisticalId: this._prefab_statistical_id,
                        panelId: 0,
                    };
                }
                else {
                    //获取maxId最后两位转换为panelId
                    this._prefab_statistical_id = maxId + 1;
                    this.panelId = this._prefab_statistical_id % 1000;
                    console.warn("当前预制体的统计ID：", this._prefab_statistical_id, this.panelId);
                    this._bundle_statistical_config[prefabName] = {
                        statisticalId: this._prefab_statistical_id,
                        panelId: this.panelId,
                    };
                }
            }
        }
        else {
            //没有配置文件，创建一个新的
            this._bundle_statistical_config = {};
            this._prefab_statistical_id = this.getPrefabStatisticalId();
            this.panelId = 0;
            this._bundle_statistical_config[prefabName] = {
                statisticalId: this._prefab_statistical_id,
                panelId: 0,
            };
        }
    }
    /**
     * 获取新的预制体统计ID
     */
    getPrefabStatisticalId() {
        let stId = this.gameId * 100000 + 1000;
        return stId;
    }
    /**
     * 导出界面统计数据
     * @returns
     */
    exportPanelStatics() {
        if (!this.gameId || this.gameId == -1) {
            console.error('********************************************');
            console.error('2.请在_config/statistical.config.json5中配置游戏ID');
            console.error('********************************************');
            return;
        }
        //直接导出到_config/$bundleName/statistical/panels/panel_$bundleName_$prefabName_statistical_db.xlsx
        if (!this.bundleName || !this.prefabName) {
            console.error("bundleName或prefabName未设置，请检查");
            return;
        }
        const panelUrl = path_1.default.join(Editor.Project.path, "_config", this.bundleName, "statistical", "panels", "panel_" + this.bundleName + "_" + this.prefabName + "_statistical_db.xlsx");
        //如果文件存在，就不处理了
        if (fs_extra_1.default.existsSync(panelUrl)) {
            //console.warn("界面统计：文件已存在，不处理：",panelUrl);
            //return;
        }
        fs_extra_1.default.ensureDirSync(path_1.default.dirname(panelUrl));
        console.warn("导出界面统计数据：", this.prefabName, this.bundleName);
        const prefabName = this.prefabName;
        const bundleName = this.bundleName;
        //游戏开始的ID 1000，1001，1002，1003，1004
        const gameId = this.gameId;
        let sheetName = "Sheet1";
        let datas = [
            ['DB_NAME', 'panel_' + bundleName + '_statistical_db'],
            ['DB_RULE', 'm', 'export_key'],
            ['FLD_TYPE', , 'S', 'S', 'S', 'I'],
            ['FLD_NAME', , 'viewName', 'bundleName', 'desc', 'statisticalId'],
            ['FLD_DESC', , '界面名字', 'bundle名字', '描述内容(需要手动填写）', '统计ID'],
            ['FLD_VERIFYER'],
        ];
        //首先检查是否有这个界面
        let panelIndex = -1;
        const rowKeys = [
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
        let fldNameData = [];
        //找到FLD_NAME行
        for (let i = 0; i < rowKeys.length; i++) {
            const data = datas[i];
            if (data[0] == "FLD_NAME") {
                fldNameRowIndex = i;
                fldNameData = data;
                break;
            }
        }
        if (fldNameRowIndex == -1) {
            console.error("表格格式不正确，请检查：", panelUrl);
            return;
        }
        //找到statisticalId所在列
        let statisticalIdColumnIndex = -1;
        for (let i = 0; i < fldNameData.length; i++) {
            if (fldNameData[i] == "statisticalId") {
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
        datas.push(['DATA', , prefabName, bundleName, , this._prefab_statistical_id]);
        //写回去
        const sheetOptions = { '!cols': [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }] };
        const buffer = node_xlsx_1.default.build([{ name: sheetName, data: datas, options: sheetOptions }]);
        fs_extra_1.default.writeFileSync(panelUrl, buffer, { encoding: "binary" });
        if (prefabName.includes('Panel')) {
            this._panelDatas.push({
                viewName: prefabName,
                desc: '',
                statisticalId: this._prefab_statistical_id,
            });
        }
        console.log('导出面板统计成功：', prefabName, bundleName, this._prefab_statistical_id);
    }
    /**
     * 导出当前预制体所有的按钮统计信息
     * @param prefabName
     * @param bundleName
     * @returns
     */
    exportPrefabButtonStatistical() {
        if (!this.gameId || this.gameId == -1) {
            return;
        }
        const prefabName = this.prefabName;
        const bundleName = this.bundleName;
        const buttonUrl = path_1.default.join(Editor.Project.path, "_config", this.bundleName, "statistical", "gbuttons", "gbutton_" + this.bundleName + "_" + this.prefabName + "_statistical_db.xlsx");
        fs_extra_1.default.ensureDirSync(path_1.default.dirname(buttonUrl));
        //收集当前预制体中所有的按钮信息
        const gbuttons = {};
        let bFoundGbuttons = false;
        for (let i = 0; i < this.nodeInfos.length; i++) {
            const nodeInfo = this.nodeInfos[i];
            if (nodeInfo.nodeType == "GButton") {
                bFoundGbuttons = true;
                gbuttons[nodeInfo.nodeName] = nodeInfo;
            }
        }
        if (!bFoundGbuttons) {
            console.warn("当前预制体没有按钮信息：", prefabName);
            //return;
        }
        //游戏开始的ID 1000，1001，1002，1003，1004
        const gameId = this.gameId;
        let sheetName = "Sheet1";
        let datas = [];
        if (fs_extra_1.default.existsSync(buttonUrl)) {
            //读取按钮统计文件
            const buttonSheets = node_xlsx_1.default.parse(fs_extra_1.default.readFileSync(buttonUrl));
            if (buttonSheets.length > 0) {
                const sheet = buttonSheets[0];
                datas = sheet.data;
            }
        }
        if (datas.length == 0) {
            datas = [
                ['DB_NAME', 'gbutton_' + bundleName + '_statistical_db'],
                ['DB_RULE', 'mm'],
                ['FLD_TYPE', , 'S', 'S', 'S', 'S', 'I'],
                ['FLD_NAME', , 'viewName', 'buttonName', 'bundleName', 'desc', 'statisticalId'],
                ['FLD_DESC', , '界面名字', '按钮名字', 'bundle名字', '描述内容(需要手动填写）', '统计ID'],
                ['FLD_VERIFYER'],
            ];
        }
        //获取statisticalId所在列
        let statisticalIdColumnIndex = -1;
        let fldNameRowIndex = -1;
        let fldNameData = [];
        for (let i = 0; i < datas.length; i++) {
            const data = datas[i];
            if (data[0] == "FLD_NAME") {
                fldNameRowIndex = i;
                fldNameData = data;
                break;
            }
        }
        if (fldNameRowIndex == -1) {
            console.error("表格格式不正确，请检查：", buttonUrl);
            return;
        }
        for (let i = 0; i < fldNameData.length; i++) {
            if (fldNameData[i] == "statisticalId") {
                statisticalIdColumnIndex = i;
                break;
            }
        }
        //遍历当前的数据，找到这个预制体开始和结束的索引
        let start_index = -1;
        let end_index = -1;
        for (let i = 0; i < datas.length; i++) {
            const data = datas[i];
            if (data.length >= 3 && data[2] == prefabName) {
                if (start_index == -1) {
                    start_index = i;
                }
                end_index = i;
            }
        }
        //全新数据
        let newData = [];
        //已经存在的
        let alreadyExists = [];
        //已经被删除的
        let deleted = [];
        //新增的
        let newAdd = [];
        if (start_index != -1) {
            //如果找到了，先把这些数据从datas中删除
            newData = datas.splice(start_index, end_index - start_index + 1);
            let maxId = -1;
            //倒叙遍历newData
            for (let i = newData.length - 1; i >= 0; i--) {
                const data = newData[i];
                if (maxId == -1) {
                    maxId = data[6];
                }
                //预制体名字
                const viewName = data[2];
                //按钮名字
                const buttonName = data[3];
                if (!gbuttons[buttonName]) {
                    //这个按钮已经被删除了
                    data[1] = '<占位，已被删除>';
                    deleted.push(data);
                    //删除这个索引
                    newData.splice(i, 1);
                    delete gbuttons[buttonName];
                }
                else {
                    //已经存在的
                    data[1] = '';
                    alreadyExists.push(data);
                    //删除这个索引
                    newData.splice(i, 1);
                    delete gbuttons[buttonName];
                }
            }
            //遍历完成后，gbuttons中剩下的就是新增的
            tools_1.default.forEachMap(gbuttons, (name, gbutton) => {
                //第一个界面的第一个按钮的ID是1100
                const stId = maxId + 1;
                newAdd.push(['DATA', , prefabName, gbutton.nodeName, bundleName, , stId]);
            });
        }
        else {
            //如果找不到，说明是一个新的预制体，直接加到最后
            start_index = datas.length;
            let index = 0;
            //全部新增
            tools_1.default.forEachMap(gbuttons, (name, gbutton) => {
                //第一个界面的第一个按钮的ID是1100
                const stId = gameId * 100000 + 1100 + this.panelId * 100 + index;
                newAdd.push(['DATA', , prefabName, gbutton.nodeName, bundleName, , stId]);
                index += 1;
            });
            //newAdd后面新增一行空数据
            newAdd.push([]);
        }
        //合并数据
        newData = newData.concat(alreadyExists).concat(deleted).concat(newAdd);
        //以data[6]的大小进行从小到大排序
        newData.sort((a, b) => {
            return a[6] - b[6];
        });
        //将newData插入到datas中的start_index位置
        datas.splice(start_index, 0, ...newData);
        //写xlsx
        const sheetOptions = { '!cols': [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }] };
        const buffer = node_xlsx_1.default.build([{ name: sheetName, data: datas, options: sheetOptions }]);
        fs_extra_1.default.writeFileSync(buttonUrl, buffer, { encoding: "binary" });
        console.log('导出按钮统计成功：', prefabName, bundleName);
        for (let i = 6; i < datas.length; i++) {
            const data = datas[i];
            if (data[0] == 'DATA') {
                this._buttonDatas.push({
                    viewName: data[2],
                    buttonName: data[3],
                    desc: data[5],
                    statisticalId: data[6],
                });
            }
        }
    }
    /**
     * 收集当前bundle的自定义事件打点
     */
    collectionCustomizeStatistical() {
        if (!this.gameId || this.gameId == -1) {
            return;
        }
        const customizeUrl = path_1.default.join(Editor.Project.path, "_config", this.bundleName, "statistical", "customize_" + this.bundleName + "_statistical_db.xlsx");
        //读取这个配置表
        let sheetName = "Sheet1";
        let datas = [];
        if (fs_extra_1.default.existsSync(customizeUrl)) {
            const customizeSheets = node_xlsx_1.default.parse(fs_extra_1.default.readFileSync(customizeUrl));
            if (customizeSheets.length > 0) {
                const sheet = customizeSheets[0];
                datas = sheet.data;
            }
        }
        if (datas.length == 0) {
            datas = [
                ['DB_NAME', 'customize_' + this.bundleName + '_statistical_db'],
                ['DB_RULE', 'm', 'export_key'],
                ['FLD_TYPE', , 'S', 'S', 'I'],
                ['FLD_NAME', , 'customEventKey', 'desc', 'statisticalId'],
                ['FLD_DESC', , '自定义事件名字', '描述内容(需要手动填写）', '统计ID'],
                ['FLD_VERIFYER'],
            ];
            //写文件
            const sheetOptions = { '!cols': [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }] };
            const buffer = node_xlsx_1.default.build([{ name: sheetName, data: datas, options: sheetOptions }]);
            fs_extra_1.default.writeFileSync(customizeUrl, buffer, { encoding: "binary" });
        }
        //从第6行开始是数据
        for (let i = 6; i < datas.length; i++) {
            const data = datas[i];
            if (data[0] == 'DATA') {
                this._customizeDatas.push({
                    eventName: data[2],
                    desc: data[3],
                    statisticalId: data[4],
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
    exportDataForPlan() {
        if (!this.gameId || this.gameId == -1) {
            return;
        }
        const fileUrl = path_1.default.join(Editor.Project.path, "_config", "埋点导出", this.bundleName + "_statistical_export.xlsx");
        const sheet1 = {
            name: "界面统计",
            data: [
                ["界面名字", "描述", "统计ID"],
            ],
        };
        const sheet2 = {
            name: "按钮统计",
            data: [
                ["所属界面", "按钮名字", "描述", "统计ID"],
            ],
        };
        const sheet3 = {
            name: "自定义打点",
            data: [
                ["自定义事件名字", "描述", "统计ID"],
            ],
        };
        //填充数据
        for (let i = 0; i < this._panelDatas.length; i++) {
            const data = this._panelDatas[i];
            sheet1.data.push([data.viewName, data.desc, data.statisticalId.toString()]);
        }
        for (let i = 0; i < this._buttonDatas.length; i++) {
            const data = this._buttonDatas[i];
            sheet2.data.push([data.viewName, data.buttonName, data.desc, data.statisticalId.toString()]);
        }
        for (let i = 0; i < this._customizeDatas.length; i++) {
            const data = this._customizeDatas[i];
            sheet3.data.push([data.eventName, data.desc, data.statisticalId.toString()]);
        }
        const sheetOptions = { '!cols': [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }] };
        const buffer = node_xlsx_1.default.build([
            { name: sheet1.name, data: sheet1.data, options: sheetOptions },
            { name: sheet2.name, data: sheet2.data, options: sheetOptions },
            { name: sheet3.name, data: sheet3.data, options: sheetOptions }
        ]);
        //检测fileUrl是否存在，如果存在，则删除
        if (fs_extra_1.default.existsSync(fileUrl)) {
            fs_extra_1.default.removeSync(fileUrl);
        }
        //写入文件
        fs_extra_1.default.writeFileSync(fileUrl, buffer, { encoding: "binary" });
        console.warn("埋点导出成功-》", fileUrl);
    }
    /**
     * 将配置写入到_config/$bundleName/statistical/statistical_$bundleName_config.json
     */
    writeConfigToFile() {
        if (!this._bundle_statistical_config) {
            console.error("没有统计配置，无法写入文件");
            return;
        }
        const configUrl = path_1.default.join(Editor.Project.path, "_config", this.bundleName, "statistical", "statistical_" + this.bundleName + "_config.json");
        fs_extra_1.default.ensureDirSync(path_1.default.dirname(configUrl));
        fs_extra_1.default.writeJSONSync(configUrl, this._bundle_statistical_config, { spaces: 4 });
        console.warn("统计配置写入成功：", configUrl);
    }
}
exports.default = ExportStatistical;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0LXN0YXRpc3RpY2FsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3N0YXRpc3RpYWwvZXhwb3J0LXN0YXRpc3RpY2FsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLHdEQUEwQjtBQUMxQiwwREFBNkI7QUFFN0IsNEVBQW1EO0FBQ25ELDJEQUFtQztBQTREbkMsTUFBcUIsaUJBQWlCO0lBNkJsQyxZQUFtQixVQUFtQixFQUFRLFVBQW1CLEVBQVEsU0FBc0I7UUFBNUUsZUFBVSxHQUFWLFVBQVUsQ0FBUztRQUFRLGVBQVUsR0FBVixVQUFVLENBQVM7UUFBUSxjQUFTLEdBQVQsU0FBUyxDQUFhO1FBM0J4RixXQUFNLEdBQVksQ0FBQyxDQUFDLENBQUM7UUFDNUI7O1dBRUc7UUFDSSxZQUFPLEdBQVksQ0FBQyxDQUFDLENBQUM7UUFDN0I7O1dBRUc7UUFDSyxnQkFBVyxHQUFtQyxFQUFFLENBQUM7UUFDekQ7O1dBRUc7UUFDSyxpQkFBWSxHQUFrQyxFQUFFLENBQUM7UUFDekQ7O1dBRUc7UUFDSyxvQkFBZSxHQUErQixFQUFFLENBQUM7UUFDekQ7O1dBRUc7UUFDTywrQkFBMEIsR0FBOEIsSUFBSSxDQUFDO1FBQ3ZFOzs7V0FHRztRQUNPLDJCQUFzQixHQUFZLENBQUMsQ0FBQyxDQUFDO1FBRzNDLElBQUksQ0FBQyxNQUFNLEdBQUcsMkJBQWdCLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzNELElBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLEVBQUM7WUFDakMsT0FBTyxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO1lBQzlELE9BQU8sQ0FBQyxLQUFLLENBQUMsNkNBQTZDLENBQUMsQ0FBQztZQUM3RCxPQUFPLENBQUMsS0FBSyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7WUFDOUQsT0FBTztT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LElBQUksQ0FBQyxRQUFRLEVBQUMsSUFBSSxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUM3RTtRQUNELEtBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsR0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUUsRUFBQztZQUN6QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBQyxJQUFJLENBQUMsVUFBVSxFQUFDLElBQUksQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDN0Y7UUFDRCxLQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLEVBQUM7WUFDNUMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUMsSUFBSSxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUM5RTtRQUNELE1BQU0sWUFBWSxHQUFJLEVBQUMsT0FBTyxFQUFFLENBQUMsRUFBQyxHQUFHLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBQyxHQUFHLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBQyxHQUFHLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBQyxHQUFHLEVBQUUsRUFBRSxFQUFDLENBQUMsRUFBQyxDQUFDO1FBQzlFLE1BQU0sTUFBTSxHQUFVLG1CQUFJLENBQUMsS0FBSyxDQUM1QjtZQUNJLEVBQUMsSUFBSSxFQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUMsSUFBSSxFQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUMsT0FBTyxFQUFHLFlBQVksRUFBQztZQUM5RCxFQUFDLElBQUksRUFBRyxNQUFNLENBQUMsSUFBSSxFQUFDLElBQUksRUFBRyxNQUFNLENBQUMsSUFBSSxFQUFDLE9BQU8sRUFBRyxZQUFZLEVBQUM7WUFDOUQsRUFBQyxJQUFJLEVBQUcsTUFBTSxDQUFDLElBQUksRUFBQyxJQUFJLEVBQUcsTUFBTSxDQUFDLElBQUksRUFBQyxPQUFPLEVBQUcsWUFBWSxFQUFDO1NBQ2pFLENBQ0osQ0FBQztRQUNGLHdCQUF3QjtRQUN4QixJQUFHLGtCQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFDO1lBQ3RCLGtCQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzFCO1FBQ0QsTUFBTTtRQUNOLGtCQUFFLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBQyxNQUFNLEVBQUMsRUFBQyxRQUFRLEVBQUcsUUFBUSxFQUFDLENBQUMsQ0FBQztRQUN2RCxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBQyxPQUFPLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQ7O09BRUc7SUFDSSxpQkFBaUI7UUFDcEIsSUFBRyxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBQztZQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQy9CLE9BQU87U0FDVjtRQUNELE1BQU0sU0FBUyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUMsU0FBUyxFQUFDLElBQUksQ0FBQyxVQUFVLEVBQUMsYUFBYSxFQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLGNBQWMsQ0FBQyxDQUFDO1FBQzNJLGtCQUFFLENBQUMsYUFBYSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUMxQyxrQkFBRSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUMsSUFBSSxDQUFDLDBCQUEwQixFQUFDLEVBQUMsTUFBTSxFQUFHLENBQUMsRUFBQyxDQUFDLENBQUM7UUFDekUsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUMsU0FBUyxDQUFDLENBQUM7SUFDeEMsQ0FBQztDQUNKO0FBbmdCRCxvQ0FtZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmcy1leHRyYVwiO1xyXG5pbXBvcnQgeGxzeCBmcm9tIFwibm9kZS14bHN4XCI7XHJcbmltcG9ydCB7IE5vZGVJbmZvIH0gZnJvbSBcIi4uL2RlZmluZVwiO1xyXG5pbXBvcnQgU3RhdGlzdGljYWxVdGlscyBmcm9tIFwiLi9zdGF0aXN0aWNhbC11dGlsc1wiO1xyXG5pbXBvcnQgVG9vbHMgZnJvbSBcIi4uL3V0aWxzL3Rvb2xzXCI7XHJcblxyXG4vL+e7n+iuoeaVsOaNruagvOW8j1xyXG5kZWNsYXJlIHR5cGUgU3RhdGlzdGljYWxQYW5lbERhdGEgPSB7XHJcbiAgICAvKipcclxuICAgICAqIOeVjOmdouWQjeWtl1xyXG4gICAgICovXHJcbiAgICB2aWV3TmFtZSAgICAgICAgOiBzdHJpbmc7XHJcbiAgICAvKipcclxuICAgICAqIOeVjOmdouaPj+i/sFxyXG4gICAgICovXHJcbiAgICBkZXNjICAgICAgICAgICAgOiBzdHJpbmc7XHJcbiAgICAvKipcclxuICAgICAqIOe7n+iuoUlEXHJcbiAgICAgKi9cclxuICAgIHN0YXRpc3RpY2FsSWQgICA6IG51bWJlcjtcclxufVxyXG4vL+e7n+iuoeaMiemSruagvOW8j1xyXG5kZWNsYXJlIHR5cGUgU3RhdGlzdGljYWxCdXR0b25EYXRhID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiDmiYDlsZ7nlYzpnaJcclxuICAgICAqL1xyXG4gICAgdmlld05hbWUgICAgICAgIDogc3RyaW5nLFxyXG4gICAgLyoqXHJcbiAgICAgKiDmjInpkq7lkI3lrZdcclxuICAgICAqL1xyXG4gICAgYnV0dG9uTmFtZSAgICAgIDogc3RyaW5nLFxyXG4gICAgLyoqXHJcbiAgICAgKiDmj4/ov7BcclxuICAgICAqL1xyXG4gICAgZGVzYyAgICAgICAgICAgIDogc3RyaW5nLFxyXG4gICAgLyoqXHJcbiAgICAgKiDnu5/orqFJRFxyXG4gICAgICovXHJcbiAgICBzdGF0aXN0aWNhbElkICAgOiBudW1iZXIsXHJcbn1cclxuXHJcbi8v6Ieq5a6a5LmJ5omT54K55pWw5o2uXHJcbmRlY2xhcmUgdHlwZSBTdGF0aXN0YWxDdXN0b21pemVEYXRhID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiDoh6rlrprkuYnkuovku7blkI3lrZdcclxuICAgICAqL1xyXG4gICAgZXZlbnROYW1lICAgICAgIDogc3RyaW5nLFxyXG4gICAgLyoqXHJcbiAgICAgKiDoh6rlrprkuYnkuovku7bmj4/ov7BcclxuICAgICAqL1xyXG4gICAgZGVzYyAgICAgICAgICAgIDogc3RyaW5nLFxyXG4gICAgLyoqXHJcbiAgICAgKiDoh6rlrprkuYnkuovku7bmiZPngrlJRFxyXG4gICAgICovXHJcbiAgICBzdGF0aXN0aWNhbElkICAgOiBudW1iZXIsXHJcbn1cclxuXHJcbmRlY2xhcmUgdHlwZSAgU3RhdGlzdGljYWxDb25maWcgPSB7XHJcbiAgICBbcGFuZWxOYW1lIDogc3RyaW5nXSA6IHtcclxuICAgICAgICBzdGF0aXN0aWNhbElkIDogbnVtYmVyLFxyXG4gICAgICAgIHBhbmVsSWQgOiBudW1iZXJcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEV4cG9ydFN0YXRpc3RpY2FsIHtcclxuXHJcbiAgICBwdWJsaWMgZ2FtZUlkIDogbnVtYmVyID0gLTE7XHJcbiAgICAvKipcclxuICAgICAqIOW9k+WJjeeVjOmdouWcqHBhbmVsXyRidW5kbGVOYW1lX3N0YXRpc3RpY2FsX2RiLnhsc3jkuK3nmoTntKLlvJVcclxuICAgICAqL1xyXG4gICAgcHVibGljIHBhbmVsSWQgOiBudW1iZXIgPSAtMTtcclxuICAgIC8qKlxyXG4gICAgICog6aG16Z2i57uf6K6h5pWw5o2uXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgX3BhbmVsRGF0YXMgOiBTdGF0aXN0aWNhbFBhbmVsRGF0YVtdICAgICAgICA9IFtdO1xyXG4gICAgLyoqXHJcbiAgICAgKiDmjInpkq7nu5/orqHmlbDmja5cclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSBfYnV0dG9uRGF0YXMgOiBTdGF0aXN0aWNhbEJ1dHRvbkRhdGFbXSAgICAgID0gW107XHJcbiAgICAvKipcclxuICAgICAqIOiHquWumuS5ieaJk+eCueaVsOaNrlxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIF9jdXN0b21pemVEYXRhcyA6IFN0YXRpc3RhbEN1c3RvbWl6ZURhdGFbXSAgPSBbXTtcclxuICAgIC8qKlxyXG4gICAgICog5b2T5YmNYnVuZGxl55qE57uf6K6h6YWN572uXHJcbiAgICAgKi9cclxuICAgIHByb3RlY3RlZCBfYnVuZGxlX3N0YXRpc3RpY2FsX2NvbmZpZyA6IFN0YXRpc3RpY2FsQ29uZmlnIHwgbnVsbCA9IG51bGw7XHJcbiAgICAvKipcclxuICAgICAqIOW9k+WJjemihOWItuS9k+eahOe7n+iuoUlEXHJcbiAgICAgKiAtMeihqOekuuayoeaciee7n+iuoUlEXHJcbiAgICAgKi9cclxuICAgIHByb3RlY3RlZCBfcHJlZmFiX3N0YXRpc3RpY2FsX2lkIDogbnVtYmVyID0gLTE7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIGJ1bmRsZU5hbWUgOiBzdHJpbmcscHVibGljIHByZWZhYk5hbWUgOiBzdHJpbmcscHVibGljIG5vZGVJbmZvcyA6IE5vZGVJbmZvW10pe1xyXG4gICAgICAgIHRoaXMuZ2FtZUlkID0gU3RhdGlzdGljYWxVdGlscy5nZXRCdW5kbGVHYW1lSWQoYnVuZGxlTmFtZSk7XHJcbiAgICAgICAgaWYoIXRoaXMuZ2FtZUlkIHx8IHRoaXMuZ2FtZUlkID09IC0xKXtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKionKTtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignMS7or7flnKhfY29uZmlnL3N0YXRpc3RpY2FsLmNvbmZpZy5qc29uNeS4remFjee9rua4uOaIj0lEJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqJyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgY29uZmlnVXJsID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsXCJfY29uZmlnXCIsYnVuZGxlTmFtZSxcInN0YXRpc3RpY2FsXCIsXCJzdGF0aXN0aWNhbF9cIiArIGJ1bmRsZU5hbWUgKyBcIl9jb25maWcuanNvblwiKTtcclxuICAgICAgICBpZihmcy5leGlzdHNTeW5jKGNvbmZpZ1VybCkpe1xyXG4gICAgICAgICAgIHRoaXMuX2J1bmRsZV9zdGF0aXN0aWNhbF9jb25maWcgPSBmcy5yZWFkSlNPTlN5bmMoY29uZmlnVXJsKTtcclxuICAgICAgICAgICBpZih0aGlzLl9idW5kbGVfc3RhdGlzdGljYWxfY29uZmlnW3ByZWZhYk5hbWVdKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZhYkNvbmZpZyA9IHRoaXMuX2J1bmRsZV9zdGF0aXN0aWNhbF9jb25maWdbcHJlZmFiTmFtZV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVmYWJfc3RhdGlzdGljYWxfaWQgPSBwcmVmYWJDb25maWcuc3RhdGlzdGljYWxJZDtcclxuICAgICAgICAgICAgICAgIHRoaXMucGFuZWxJZCA9IHByZWZhYkNvbmZpZy5wYW5lbElkO1xyXG4gICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuX2J1bmRsZV9zdGF0aXN0aWNhbF9jb25maWcpO1xyXG4gICAgICAgICAgICAgICAgLy/pgY3ljoZrZXlz77yM5om+5Yiw5pyA5aSn55qE5YC8XHJcbiAgICAgICAgICAgICAgICBsZXQgbWF4SWQgPSAtMTtcclxuICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7aTxrZXlzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IGtleXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29uZmlnICA9IHRoaXMuX2J1bmRsZV9zdGF0aXN0aWNhbF9jb25maWdba2V5XTtcclxuICAgICAgICAgICAgICAgICAgICBpZihjb25maWcuc3RhdGlzdGljYWxJZCA+IG1heElkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4SWQgPSBjb25maWcuc3RhdGlzdGljYWxJZDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihtYXhJZCA9PSAtMSl7XHJcbiAgICAgICAgICAgICAgICAgICAgLy/msqHmnInmlbDmja7vvIzor7TmmI7mmK/lvZPliY1idW5kbGXnrKzkuIDkuKrooqvlr7zlh7rnmoTpooTliLbkvZNcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcmVmYWJfc3RhdGlzdGljYWxfaWQgPSB0aGlzLmdldFByZWZhYlN0YXRpc3RpY2FsSWQoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhbmVsSWQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1bmRsZV9zdGF0aXN0aWNhbF9jb25maWdbcHJlZmFiTmFtZV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRpc3RpY2FsSWQgOiB0aGlzLl9wcmVmYWJfc3RhdGlzdGljYWxfaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbmVsSWQgICAgICAgOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAvL+iOt+WPlm1heElk5pyA5ZCO5Lik5L2N6L2s5o2i5Li6cGFuZWxJZFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ByZWZhYl9zdGF0aXN0aWNhbF9pZCA9IG1heElkICsgMTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhbmVsSWQgPSB0aGlzLl9wcmVmYWJfc3RhdGlzdGljYWxfaWQgJSAxMDAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIuW9k+WJjemihOWItuS9k+eahOe7n+iuoUlE77yaXCIsdGhpcy5fcHJlZmFiX3N0YXRpc3RpY2FsX2lkLHRoaXMucGFuZWxJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnVuZGxlX3N0YXRpc3RpY2FsX2NvbmZpZ1twcmVmYWJOYW1lXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGlzdGljYWxJZCA6IHRoaXMuX3ByZWZhYl9zdGF0aXN0aWNhbF9pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFuZWxJZCAgICAgICA6IHRoaXMucGFuZWxJZCxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIH1cclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgLy/msqHmnInphY3nva7mlofku7bvvIzliJvlu7rkuIDkuKrmlrDnmoRcclxuICAgICAgICAgICAgdGhpcy5fYnVuZGxlX3N0YXRpc3RpY2FsX2NvbmZpZyA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLl9wcmVmYWJfc3RhdGlzdGljYWxfaWQgPSB0aGlzLmdldFByZWZhYlN0YXRpc3RpY2FsSWQoKTtcclxuICAgICAgICAgICAgdGhpcy5wYW5lbElkID0gMDtcclxuICAgICAgICAgICAgdGhpcy5fYnVuZGxlX3N0YXRpc3RpY2FsX2NvbmZpZ1twcmVmYWJOYW1lXSA9IHtcclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpY2FsSWQgOiB0aGlzLl9wcmVmYWJfc3RhdGlzdGljYWxfaWQsXHJcbiAgICAgICAgICAgICAgICBwYW5lbElkICAgICAgIDogMCxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOiOt+WPluaWsOeahOmihOWItuS9k+e7n+iuoUlEXHJcbiAgICAgKi9cclxuICAgIHByb3RlY3RlZCBnZXRQcmVmYWJTdGF0aXN0aWNhbElkKCkgOiBudW1iZXIge1xyXG4gICAgICAgIGxldCBzdElkID0gdGhpcy5nYW1lSWQgKiAxMDAwMDAgKyAxMDAwO1xyXG4gICAgICAgIHJldHVybiBzdElkO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5a+85Ye655WM6Z2i57uf6K6h5pWw5o2uXHJcbiAgICAgKiBAcmV0dXJucyBcclxuICAgICAqL1xyXG4gICAgcHVibGljIGV4cG9ydFBhbmVsU3RhdGljcygpe1xyXG4gICAgICAgIGlmKCF0aGlzLmdhbWVJZCB8fCB0aGlzLmdhbWVJZCA9PSAtMSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJzIu6K+35ZyoX2NvbmZpZy9zdGF0aXN0aWNhbC5jb25maWcuanNvbjXkuK3phY3nva7muLjmiI9JRCcpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCcqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKicpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL+ebtOaOpeWvvOWHuuWIsF9jb25maWcvJGJ1bmRsZU5hbWUvc3RhdGlzdGljYWwvcGFuZWxzL3BhbmVsXyRidW5kbGVOYW1lXyRwcmVmYWJOYW1lX3N0YXRpc3RpY2FsX2RiLnhsc3hcclxuICAgICAgICBpZighdGhpcy5idW5kbGVOYW1lIHx8ICF0aGlzLnByZWZhYk5hbWUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiYnVuZGxlTmFtZeaIlnByZWZhYk5hbWXmnKrorr7nva7vvIzor7fmo4Dmn6VcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcGFuZWxVcmwgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCxcIl9jb25maWdcIix0aGlzLmJ1bmRsZU5hbWUsXCJzdGF0aXN0aWNhbFwiLFwicGFuZWxzXCIsXCJwYW5lbF9cIiArIHRoaXMuYnVuZGxlTmFtZSArIFwiX1wiICsgdGhpcy5wcmVmYWJOYW1lICsgXCJfc3RhdGlzdGljYWxfZGIueGxzeFwiKTtcclxuICAgICAgICAvL+WmguaenOaWh+S7tuWtmOWcqO+8jOWwseS4jeWkhOeQhuS6hlxyXG4gICAgICAgIGlmKGZzLmV4aXN0c1N5bmMocGFuZWxVcmwpKXtcclxuICAgICAgICAgICAgLy9jb25zb2xlLndhcm4oXCLnlYzpnaLnu5/orqHvvJrmlofku7blt7LlrZjlnKjvvIzkuI3lpITnkIbvvJpcIixwYW5lbFVybCk7XHJcbiAgICAgICAgICAgIC8vcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmcy5lbnN1cmVEaXJTeW5jKHBhdGguZGlybmFtZShwYW5lbFVybCkpO1xyXG5cclxuICAgICAgICBjb25zb2xlLndhcm4oXCLlr7zlh7rnlYzpnaLnu5/orqHmlbDmja7vvJpcIix0aGlzLnByZWZhYk5hbWUsdGhpcy5idW5kbGVOYW1lKTtcclxuICAgICAgICBjb25zdCBwcmVmYWJOYW1lID0gdGhpcy5wcmVmYWJOYW1lO1xyXG4gICAgICAgIGNvbnN0IGJ1bmRsZU5hbWUgPSB0aGlzLmJ1bmRsZU5hbWU7IFxyXG4gICAgICAgIC8v5ri45oiP5byA5aeL55qESUQgMTAwMO+8jDEwMDHvvIwxMDAy77yMMTAwM++8jDEwMDRcclxuICAgICAgICBjb25zdCBnYW1lSWQgICAgPSB0aGlzLmdhbWVJZDtcclxuICAgICAgICBsZXQgc2hlZXROYW1lICAgPSBcIlNoZWV0MVwiO1xyXG4gICAgICAgIGxldCBkYXRhcyA6IGFueVtdW10gPSBbXHJcbiAgICAgICAgICAgIFsnREJfTkFNRScsJ3BhbmVsXycgKyBidW5kbGVOYW1lICsgJ19zdGF0aXN0aWNhbF9kYiddLFxyXG4gICAgICAgICAgICBbJ0RCX1JVTEUnLCdtJywnZXhwb3J0X2tleSddLFxyXG4gICAgICAgICAgICBbJ0ZMRF9UWVBFJywsJ1MnLCdTJywnUycsJ0knXSxcclxuICAgICAgICAgICAgWydGTERfTkFNRScsLCd2aWV3TmFtZScsJ2J1bmRsZU5hbWUnLCdkZXNjJywnc3RhdGlzdGljYWxJZCddLFxyXG4gICAgICAgICAgICBbJ0ZMRF9ERVNDJywsJ+eVjOmdouWQjeWtlycsJ2J1bmRsZeWQjeWtlycsJ+aPj+i/sOWGheWuuSjpnIDopoHmiYvliqjloavlhpnvvIknLCfnu5/orqFJRCddLFxyXG4gICAgICAgICAgICBbJ0ZMRF9WRVJJRllFUiddLFxyXG4gICAgICAgIF07XHJcbiAgICBcclxuICAgICAgICAvL+mmluWFiOajgOafpeaYr+WQpuaciei/meS4queVjOmdolxyXG4gICAgICAgIGxldCBwYW5lbEluZGV4ID0gLTE7XHJcbiAgICAgICAgY29uc3Qgcm93S2V5cyA6IHN0cmluZ1tdID0gW1xyXG4gICAgICAgICAgICBcIkRCX05BTUVcIixcclxuICAgICAgICAgICAgXCJEQl9SVUxFXCIsXHJcbiAgICAgICAgICAgIFwiRVhQT1JUX0NPTlNUXCIsXHJcbiAgICAgICAgICAgIFwiRkxEX1RZUEVcIixcclxuICAgICAgICAgICAgXCJGTERfTkFNRVwiLFxyXG4gICAgICAgICAgICBcIkZMRF9ERVNDXCIsXHJcbiAgICAgICAgICAgIFwiRkxEX1ZFUklGWUVSXCIsXHJcbiAgICAgICAgXTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBGTERfTkFNReihjOe0ouW8lVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGxldCBmbGROYW1lUm93SW5kZXggPSAtMTtcclxuICAgICAgICBsZXQgZmxkTmFtZURhdGEgOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgIC8v5om+5YiwRkxEX05BTUXooYxcclxuICAgICAgICBmb3IobGV0IGkgPSAwO2k8cm93S2V5cy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGRhdGFzW2ldO1xyXG4gICAgICAgICAgICBpZihkYXRhWzBdID09IFwiRkxEX05BTUVcIil7XHJcbiAgICAgICAgICAgICAgICBmbGROYW1lUm93SW5kZXggPSBpO1xyXG4gICAgICAgICAgICAgICAgZmxkTmFtZURhdGEgPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZmxkTmFtZVJvd0luZGV4ID09IC0xKXtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuihqOagvOagvOW8j+S4jeato+ehru+8jOivt+ajgOafpe+8mlwiLHBhbmVsVXJsKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIC8v5om+5Yiwc3RhdGlzdGljYWxJZOaJgOWcqOWIl1xyXG4gICAgICAgIGxldCBzdGF0aXN0aWNhbElkQ29sdW1uSW5kZXggPSAtMTtcclxuICAgICAgICBmb3IobGV0IGkgPSAwO2k8ZmxkTmFtZURhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIGlmKGZsZE5hbWVEYXRhW2ldID09IFwic3RhdGlzdGljYWxJZFwiKXtcclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpY2FsSWRDb2x1bW5JbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIC8v5YmN6Z2iNeihjOmDveaYr+mFjee9ruS/oeaBr++8jOWPr+S7peW/veeVpVxyXG4gICAgICAgIC8vIGxldCBtYXhJZCA9IC0xO1xyXG4gICAgICAgIC8vIGZvcihsZXQgaSA9IDY7aTxkYXRhcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAvLyAgICAgbGV0IGRhdGEgPSBkYXRhc1tpXTtcclxuICAgICAgICAvLyAgICAgaWYoZGF0YS5sZW5ndGggPj0gMyAmJiBkYXRhWzJdID09IHByZWZhYk5hbWUpe1xyXG4gICAgICAgIC8vICAgICAgICAgcGFuZWxJbmRleCA9IGk7XHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyAgICAgaWYoZGF0YVtzdGF0aXN0aWNhbElkQ29sdW1uSW5kZXhdID4gbWF4SWQpe1xyXG4gICAgICAgIC8vICAgICAgICAgbWF4SWQgPSBkYXRhW3N0YXRpc3RpY2FsSWRDb2x1bW5JbmRleF07XHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyAgICAgaWYoZGF0YVswXSA9PSAnREFUQScgJiYgZGF0YVsyXS5zdGFydHNXaXRoKCdQYW5lbCcpKXtcclxuICAgICAgICAvLyAgICAgICAgIHRoaXMuX3BhbmVsRGF0YXMucHVzaCh7XHJcbiAgICAgICAgLy8gICAgICAgICAgICAgdmlld05hbWUgICAgICAgIDogZGF0YVsyXSxcclxuICAgICAgICAvLyAgICAgICAgICAgICBkZXNjICAgICAgICAgICAgOiBkYXRhWzRdLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIHN0YXRpc3RpY2FsSWQgICA6IGRhdGFbNV0sXHJcbiAgICAgICAgLy8gICAgICAgICB9KTtcclxuICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgIC8vIH1cclxuICAgIFxyXG4gICAgICAgIC8vIGlmKHBhbmVsSW5kZXggPj0gMCl7XHJcbiAgICAgICAgLy8gICAgIC8v5pyJ5om+5Yiw6L+Z5Liq55WM6Z2i77yM5bCx5LiN5aSE55CG5LqGXHJcbiAgICAgICAgLy8gICAgIHJldHVybjtcclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgLy8gbGV0IHN0SWQgPSAtMTtcclxuICAgICAgICAvLyBpZihtYXhJZCA9PSAtMSl7XHJcbiAgICAgICAgLy8gICAgIC8v6L+Z5piv56ys5LiA5Liq5Yqg5YWl55qEXHJcbiAgICAgICAgLy8gICAgIC8vMTAwMCAxMDAwMDAgPSAxMDAwMDAwMDBcclxuICAgICAgICAvLyAgICAgc3RJZCA9IGdhbWVJZCAqIDEwMDAwMCArIDEwMDA7XHJcbiAgICAgICAgLy8gICAgIHRoaXMucGFuZWxJZCAgICA9IDA7XHJcbiAgICAgICAgLy8gfWVsc2V7XHJcbiAgICAgICAgLy8gICAgIHN0SWQgPSBtYXhJZCArIDE7XHJcbiAgICAgICAgLy8gICAgIC8v6I635Y+Wc3RJZOacgOWQjuS4pOS9jei9rOaNouWWgnBhbmVsSWRcclxuICAgICAgICAvLyAgICAgdGhpcy5wYW5lbElkID0gc3RJZCAlIDEwMDA7XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIC8v5rKh5pyJ5om+5Yiw55qE77yM5aGe5LiA5Liq5paw55qEXHJcbiAgICAgICAgZGF0YXMucHVzaChbJ0RBVEEnLCxwcmVmYWJOYW1lLGJ1bmRsZU5hbWUsLHRoaXMuX3ByZWZhYl9zdGF0aXN0aWNhbF9pZF0pO1xyXG4gICAgICAgIC8v5YaZ5Zue5Y67XHJcbiAgICAgICAgY29uc3Qgc2hlZXRPcHRpb25zICA9IHsnIWNvbHMnOiBbe3djaDogMjB9LCB7d2NoOiAyMH0sIHt3Y2g6IDIwfSwge3djaDogMjB9XX07XHJcbiAgICAgICAgY29uc3QgYnVmZmVyICAgICAgICA9IHhsc3guYnVpbGQoW3tuYW1lIDogc2hlZXROYW1lLGRhdGEgOiBkYXRhcyxvcHRpb25zIDogc2hlZXRPcHRpb25zfV0pO1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMocGFuZWxVcmwsYnVmZmVyLHtlbmNvZGluZyA6IFwiYmluYXJ5XCJ9KTtcclxuICAgICAgICBpZihwcmVmYWJOYW1lLmluY2x1ZGVzKCdQYW5lbCcpKXtcclxuICAgICAgICAgICAgdGhpcy5fcGFuZWxEYXRhcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHZpZXdOYW1lICAgICAgICA6IHByZWZhYk5hbWUsXHJcbiAgICAgICAgICAgICAgICBkZXNjICAgICAgICAgICAgOiAnJyxcclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpY2FsSWQgICA6IHRoaXMuX3ByZWZhYl9zdGF0aXN0aWNhbF9pZCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUubG9nKCflr7zlh7rpnaLmnb/nu5/orqHmiJDlip/vvJonLHByZWZhYk5hbWUsYnVuZGxlTmFtZSx0aGlzLl9wcmVmYWJfc3RhdGlzdGljYWxfaWQpO1xyXG4gICAgfVxyXG4gICAgXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5a+85Ye65b2T5YmN6aKE5Yi25L2T5omA5pyJ55qE5oyJ6ZKu57uf6K6h5L+h5oGvXHJcbiAgICAgKiBAcGFyYW0gcHJlZmFiTmFtZSBcclxuICAgICAqIEBwYXJhbSBidW5kbGVOYW1lIFxyXG4gICAgICogQHJldHVybnMgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBleHBvcnRQcmVmYWJCdXR0b25TdGF0aXN0aWNhbCgpe1xyXG4gICAgICAgIGlmKCF0aGlzLmdhbWVJZCB8fCB0aGlzLmdhbWVJZCA9PSAtMSl7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcHJlZmFiTmFtZSA9IHRoaXMucHJlZmFiTmFtZTtcclxuICAgICAgICBjb25zdCBidW5kbGVOYW1lID0gdGhpcy5idW5kbGVOYW1lO1xyXG4gICAgICAgIGNvbnN0IGJ1dHRvblVybCA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLFwiX2NvbmZpZ1wiLHRoaXMuYnVuZGxlTmFtZSxcInN0YXRpc3RpY2FsXCIsXCJnYnV0dG9uc1wiLFwiZ2J1dHRvbl9cIiArIHRoaXMuYnVuZGxlTmFtZSArIFwiX1wiICsgdGhpcy5wcmVmYWJOYW1lICsgXCJfc3RhdGlzdGljYWxfZGIueGxzeFwiKTtcclxuICAgICAgICBmcy5lbnN1cmVEaXJTeW5jKHBhdGguZGlybmFtZShidXR0b25VcmwpKTtcclxuICAgICAgICAvL+aUtumbhuW9k+WJjemihOWItuS9k+S4reaJgOacieeahOaMiemSruS/oeaBr1xyXG4gICAgICAgIGNvbnN0IGdidXR0b25zIDoge1tuYW1lIDogc3RyaW5nXSA6IE5vZGVJbmZvfSA9IHt9OyBcclxuICAgICAgICBsZXQgYkZvdW5kR2J1dHRvbnMgOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpPHRoaXMubm9kZUluZm9zLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBjb25zdCBub2RlSW5mbyA9IHRoaXMubm9kZUluZm9zW2ldO1xyXG4gICAgICAgICAgICBpZihub2RlSW5mby5ub2RlVHlwZSA9PSBcIkdCdXR0b25cIil7XHJcbiAgICAgICAgICAgICAgICBiRm91bmRHYnV0dG9ucyAgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgZ2J1dHRvbnNbbm9kZUluZm8ubm9kZU5hbWVdID0gbm9kZUluZm87XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoIWJGb3VuZEdidXR0b25zKXtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi5b2T5YmN6aKE5Yi25L2T5rKh5pyJ5oyJ6ZKu5L+h5oGv77yaXCIscHJlZmFiTmFtZSk7XHJcbiAgICAgICAgICAgIC8vcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL+a4uOaIj+W8gOWni+eahElEIDEwMDDvvIwxMDAx77yMMTAwMu+8jDEwMDPvvIwxMDA0XHJcbiAgICAgICAgY29uc3QgZ2FtZUlkICAgID0gdGhpcy5nYW1lSWQ7XHJcbiAgICAgICAgbGV0IHNoZWV0TmFtZSAgID0gXCJTaGVldDFcIjtcclxuICAgICAgICBsZXQgZGF0YXMgOiBhbnlbXVtdID0gW107XHJcbiAgICAgICAgaWYoZnMuZXhpc3RzU3luYyhidXR0b25VcmwpKXtcclxuICAgICAgICAgICAgLy/or7vlj5bmjInpkq7nu5/orqHmlofku7ZcclxuICAgICAgICAgICAgY29uc3QgYnV0dG9uU2hlZXRzICA9IHhsc3gucGFyc2UoZnMucmVhZEZpbGVTeW5jKGJ1dHRvblVybCkpO1xyXG4gICAgICAgICAgICBpZihidXR0b25TaGVldHMubGVuZ3RoID4gMCl7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzaGVldCAgID0gYnV0dG9uU2hlZXRzWzBdO1xyXG4gICAgICAgICAgICAgICAgZGF0YXMgICAgICAgICA9IHNoZWV0LmRhdGE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZGF0YXMubGVuZ3RoID09IDApe1xyXG4gICAgICAgICAgICBkYXRhcyA9IFtcclxuICAgICAgICAgICAgICAgIFsnREJfTkFNRScsJ2didXR0b25fJyArIGJ1bmRsZU5hbWUgKyAnX3N0YXRpc3RpY2FsX2RiJ10sXHJcbiAgICAgICAgICAgICAgICBbJ0RCX1JVTEUnLCdtbSddLFxyXG4gICAgICAgICAgICAgICAgWydGTERfVFlQRScsLCdTJywnUycsJ1MnLCdTJywnSSddLFxyXG4gICAgICAgICAgICAgICAgWydGTERfTkFNRScsLCd2aWV3TmFtZScsJ2J1dHRvbk5hbWUnLCdidW5kbGVOYW1lJywnZGVzYycsJ3N0YXRpc3RpY2FsSWQnXSxcclxuICAgICAgICAgICAgICAgIFsnRkxEX0RFU0MnLCwn55WM6Z2i5ZCN5a2XJywn5oyJ6ZKu5ZCN5a2XJywnYnVuZGxl5ZCN5a2XJywn5o+P6L+w5YaF5a65KOmcgOimgeaJi+WKqOWhq+WGme+8iScsJ+e7n+iuoUlEJ10sXHJcbiAgICAgICAgICAgICAgICBbJ0ZMRF9WRVJJRllFUiddLFxyXG4gICAgICAgICAgICBdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvL+iOt+WPlnN0YXRpc3RpY2FsSWTmiYDlnKjliJdcclxuICAgICAgICBsZXQgc3RhdGlzdGljYWxJZENvbHVtbkluZGV4ID0gLTE7XHJcbiAgICAgICAgbGV0IGZsZE5hbWVSb3dJbmRleCA9IC0xO1xyXG4gICAgICAgIGxldCBmbGROYW1lRGF0YSA6IGFueVtdID0gW107XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpPGRhdGFzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gZGF0YXNbaV07XHJcbiAgICAgICAgICAgIGlmKGRhdGFbMF0gPT0gXCJGTERfTkFNRVwiKXtcclxuICAgICAgICAgICAgICAgIGZsZE5hbWVSb3dJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICBmbGROYW1lRGF0YSA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihmbGROYW1lUm93SW5kZXggPT0gLTEpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi6KGo5qC85qC85byP5LiN5q2j56Gu77yM6K+35qOA5p+l77yaXCIsYnV0dG9uVXJsKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IobGV0IGkgPSAwO2k8ZmxkTmFtZURhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIGlmKGZsZE5hbWVEYXRhW2ldID09IFwic3RhdGlzdGljYWxJZFwiKXtcclxuICAgICAgICAgICAgICAgIHN0YXRpc3RpY2FsSWRDb2x1bW5JbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvL+mBjeWOhuW9k+WJjeeahOaVsOaNru+8jOaJvuWIsOi/meS4qumihOWItuS9k+W8gOWni+WSjOe7k+adn+eahOe0ouW8lVxyXG4gICAgICAgIGxldCBzdGFydF9pbmRleCA9IC0xO1xyXG4gICAgICAgIGxldCBlbmRfaW5kZXggICA9IC0xO1xyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7aTxkYXRhcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGRhdGFzW2ldO1xyXG4gICAgICAgICAgICBpZihkYXRhLmxlbmd0aCA+PSAzICYmIGRhdGFbMl0gPT0gcHJlZmFiTmFtZSl7XHJcbiAgICAgICAgICAgICAgICBpZihzdGFydF9pbmRleCA9PSAtMSl7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRfaW5kZXggPSBpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZW5kX2luZGV4ID0gaTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvL+WFqOaWsOaVsOaNrlxyXG4gICAgICAgIGxldCBuZXdEYXRhIDogYW55W10gPSBbXTtcclxuICAgICAgICAvL+W3sue7j+WtmOWcqOeahFxyXG4gICAgICAgIGxldCBhbHJlYWR5RXhpc3RzIDogYW55W10gICA9IFtdO1xyXG4gICAgICAgIC8v5bey57uP6KKr5Yig6Zmk55qEXHJcbiAgICAgICAgbGV0IGRlbGV0ZWQgOiBhbnlbXSAgICAgICAgID0gW107XHJcbiAgICAgICAgLy/mlrDlop7nmoRcclxuICAgICAgICBsZXQgbmV3QWRkIDogYW55W10gICAgICAgICAgPSBbXTtcclxuICAgICAgICBpZihzdGFydF9pbmRleCAhPSAtMSl7XHJcbiAgICAgICAgICAgIC8v5aaC5p6c5om+5Yiw5LqG77yM5YWI5oqK6L+Z5Lqb5pWw5o2u5LuOZGF0YXPkuK3liKDpmaRcclxuICAgICAgICAgICAgbmV3RGF0YSAgICAgPSBkYXRhcy5zcGxpY2Uoc3RhcnRfaW5kZXgsZW5kX2luZGV4IC0gc3RhcnRfaW5kZXggKyAxKTtcclxuICAgICAgICAgICAgbGV0IG1heElkICAgPSAtMTtcclxuICAgICAgICAgICAgLy/lgJLlj5npgY3ljoZuZXdEYXRhXHJcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IG5ld0RhdGEubGVuZ3RoIC0gMTtpPj0wO2ktLSl7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhICAgICAgICAgID0gbmV3RGF0YVtpXTtcclxuICAgICAgICAgICAgICAgIGlmKG1heElkID09IC0xKXtcclxuICAgICAgICAgICAgICAgICAgICBtYXhJZCAgID0gZGF0YVs2XTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8v6aKE5Yi25L2T5ZCN5a2XXHJcbiAgICAgICAgICAgICAgICBjb25zdCB2aWV3TmFtZSAgICAgID0gZGF0YVsyXTtcclxuICAgICAgICAgICAgICAgIC8v5oyJ6ZKu5ZCN5a2XXHJcbiAgICAgICAgICAgICAgICBjb25zdCBidXR0b25OYW1lICAgID0gZGF0YVszXTtcclxuICAgICAgICAgICAgICAgIGlmKCFnYnV0dG9uc1tidXR0b25OYW1lXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgLy/ov5nkuKrmjInpkq7lt7Lnu4/ooqvliKDpmaTkuoZcclxuICAgICAgICAgICAgICAgICAgICBkYXRhWzFdICAgICA9ICc85Y2g5L2N77yM5bey6KKr5Yig6ZmkPic7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlZC5wdXNoKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8v5Yig6Zmk6L+Z5Liq57Si5byVXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3RGF0YS5zcGxpY2UoaSwxKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZ2J1dHRvbnNbYnV0dG9uTmFtZV07XHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAvL+W3sue7j+WtmOWcqOeahFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbMV0gICAgID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxyZWFkeUV4aXN0cy5wdXNoKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8v5Yig6Zmk6L+Z5Liq57Si5byVXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3RGF0YS5zcGxpY2UoaSwxKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZ2J1dHRvbnNbYnV0dG9uTmFtZV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy/pgY3ljoblrozmiJDlkI7vvIxnYnV0dG9uc+S4reWJqeS4i+eahOWwseaYr+aWsOWinueahFxyXG4gICAgICAgICAgICBUb29scy5mb3JFYWNoTWFwKGdidXR0b25zLChuYW1lLGdidXR0b24pID0+IHtcclxuICAgICAgICAgICAgICAgIC8v56ys5LiA5Liq55WM6Z2i55qE56ys5LiA5Liq5oyJ6ZKu55qESUTmmK8xMTAwXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdElkID0gbWF4SWQgKyAxO1xyXG4gICAgICAgICAgICAgICAgbmV3QWRkLnB1c2goWydEQVRBJywscHJlZmFiTmFtZSxnYnV0dG9uLm5vZGVOYW1lLGJ1bmRsZU5hbWUsLHN0SWRdKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIC8v5aaC5p6c5om+5LiN5Yiw77yM6K+05piO5piv5LiA5Liq5paw55qE6aKE5Yi25L2T77yM55u05o6l5Yqg5Yiw5pyA5ZCOXHJcbiAgICAgICAgICAgIHN0YXJ0X2luZGV4ID0gZGF0YXMubGVuZ3RoO1xyXG4gICAgICAgICAgICBsZXQgaW5kZXggICA9IDA7XHJcbiAgICAgICAgICAgIC8v5YWo6YOo5paw5aKeXHJcbiAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAoZ2J1dHRvbnMsKG5hbWUsZ2J1dHRvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy/nrKzkuIDkuKrnlYzpnaLnmoTnrKzkuIDkuKrmjInpkq7nmoRJROaYrzExMDBcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0SWQgPSBnYW1lSWQgKiAxMDAwMDAgKyAxMTAwICsgdGhpcy5wYW5lbElkICogMTAwICsgaW5kZXg7XHJcbiAgICAgICAgICAgICAgICBuZXdBZGQucHVzaChbJ0RBVEEnLCxwcmVmYWJOYW1lLGdidXR0b24ubm9kZU5hbWUsYnVuZGxlTmFtZSwsc3RJZF0pO1xyXG4gICAgICAgICAgICAgICAgaW5kZXggKz0gMTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vbmV3QWRk5ZCO6Z2i5paw5aKe5LiA6KGM56m65pWw5o2uXHJcbiAgICAgICAgICAgIG5ld0FkZC5wdXNoKFtdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8v5ZCI5bm25pWw5o2uXHJcbiAgICAgICAgbmV3RGF0YSA9IG5ld0RhdGEuY29uY2F0KGFscmVhZHlFeGlzdHMpLmNvbmNhdChkZWxldGVkKS5jb25jYXQobmV3QWRkKTtcclxuICAgICAgICAvL+S7pWRhdGFbNl3nmoTlpKflsI/ov5vooYzku47lsI/liLDlpKfmjpLluo9cclxuICAgICAgICBuZXdEYXRhLnNvcnQoKGEsYikgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gYVs2XSAtIGJbNl07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy/lsIZuZXdEYXRh5o+S5YWl5YiwZGF0YXPkuK3nmoRzdGFydF9pbmRleOS9jee9rlxyXG4gICAgICAgIGRhdGFzLnNwbGljZShzdGFydF9pbmRleCwwLC4uLm5ld0RhdGEpO1xyXG4gICAgICAgIC8v5YaZeGxzeFxyXG4gICAgICAgIGNvbnN0IHNoZWV0T3B0aW9ucyAgPSB7JyFjb2xzJzogW3t3Y2g6IDIwfSwge3djaDogMjB9LCB7d2NoOiAyMH0sIHt3Y2g6IDIwfV19O1xyXG4gICAgICAgIGNvbnN0IGJ1ZmZlciAgICAgICAgPSB4bHN4LmJ1aWxkKFt7bmFtZSA6IHNoZWV0TmFtZSxkYXRhIDogZGF0YXMsb3B0aW9ucyA6IHNoZWV0T3B0aW9uc31dKTtcclxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGJ1dHRvblVybCxidWZmZXIse2VuY29kaW5nIDogXCJiaW5hcnlcIn0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCflr7zlh7rmjInpkq7nu5/orqHmiJDlip/vvJonLHByZWZhYk5hbWUsYnVuZGxlTmFtZSk7XHJcbiAgICAgICAgZm9yKGxldCBpID0gNjtpPGRhdGFzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gZGF0YXNbaV07XHJcbiAgICAgICAgICAgIGlmKGRhdGFbMF0gPT0gJ0RBVEEnKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2J1dHRvbkRhdGFzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHZpZXdOYW1lICAgICAgICA6IGRhdGFbMl0sXHJcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uTmFtZSAgICAgIDogZGF0YVszXSxcclxuICAgICAgICAgICAgICAgICAgICBkZXNjICAgICAgICAgICAgOiBkYXRhWzVdLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRpc3RpY2FsSWQgICA6IGRhdGFbNl0sXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOaUtumbhuW9k+WJjWJ1bmRsZeeahOiHquWumuS5ieS6i+S7tuaJk+eCuVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgY29sbGVjdGlvbkN1c3RvbWl6ZVN0YXRpc3RpY2FsKCl7XHJcbiAgICAgICAgaWYoIXRoaXMuZ2FtZUlkIHx8IHRoaXMuZ2FtZUlkID09IC0xKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBjdXN0b21pemVVcmwgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCxcIl9jb25maWdcIix0aGlzLmJ1bmRsZU5hbWUsXCJzdGF0aXN0aWNhbFwiLFwiY3VzdG9taXplX1wiICsgdGhpcy5idW5kbGVOYW1lICsgXCJfc3RhdGlzdGljYWxfZGIueGxzeFwiKTtcclxuICAgICAgICAvL+ivu+WPlui/meS4qumFjee9ruihqFxyXG4gICAgICAgIGxldCBzaGVldE5hbWUgPSBcIlNoZWV0MVwiO1xyXG4gICAgICAgIGxldCBkYXRhcyA6IGFueVtdW10gPSBbXTtcclxuICAgICAgICBpZihmcy5leGlzdHNTeW5jKGN1c3RvbWl6ZVVybCkpe1xyXG4gICAgICAgICAgICBjb25zdCBjdXN0b21pemVTaGVldHMgPSB4bHN4LnBhcnNlKGZzLnJlYWRGaWxlU3luYyhjdXN0b21pemVVcmwpKTtcclxuICAgICAgICAgICAgaWYoY3VzdG9taXplU2hlZXRzLmxlbmd0aCA+IDApe1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2hlZXQgPSBjdXN0b21pemVTaGVldHNbMF07XHJcbiAgICAgICAgICAgICAgICBkYXRhcyA9IHNoZWV0LmRhdGE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICBcclxuICAgICAgICBpZihkYXRhcy5sZW5ndGggPT0gMCl7XHJcbiAgICAgICAgICAgIGRhdGFzID0gW1xyXG4gICAgICAgICAgICAgICAgWydEQl9OQU1FJywnY3VzdG9taXplXycgKyB0aGlzLmJ1bmRsZU5hbWUgKyAnX3N0YXRpc3RpY2FsX2RiJ10sXHJcbiAgICAgICAgICAgICAgICBbJ0RCX1JVTEUnLCdtJywnZXhwb3J0X2tleSddLFxyXG4gICAgICAgICAgICAgICAgWydGTERfVFlQRScsLCdTJywnUycsJ0knXSxcclxuICAgICAgICAgICAgICAgIFsnRkxEX05BTUUnLCwnY3VzdG9tRXZlbnRLZXknLCdkZXNjJywnc3RhdGlzdGljYWxJZCddLFxyXG4gICAgICAgICAgICAgICAgWydGTERfREVTQycsLCfoh6rlrprkuYnkuovku7blkI3lrZcnLCfmj4/ov7DlhoXlrrko6ZyA6KaB5omL5Yqo5aGr5YaZ77yJJywn57uf6K6hSUQnXSxcclxuICAgICAgICAgICAgICAgIFsnRkxEX1ZFUklGWUVSJ10sXHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIC8v5YaZ5paH5Lu2XHJcbiAgICAgICAgICAgIGNvbnN0IHNoZWV0T3B0aW9ucyAgPSB7JyFjb2xzJzogW3t3Y2g6IDIwfSwge3djaDogMjB9LCB7d2NoOiAyMH0sIHt3Y2g6IDIwfV19O1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXIgICAgICAgID0geGxzeC5idWlsZChbe25hbWUgOiBzaGVldE5hbWUsZGF0YSA6IGRhdGFzLG9wdGlvbnMgOiBzaGVldE9wdGlvbnN9XSk7XHJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoY3VzdG9taXplVXJsLGJ1ZmZlcix7ZW5jb2RpbmcgOiBcImJpbmFyeVwifSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8v5LuO56ysNuihjOW8gOWni+aYr+aVsOaNrlxyXG4gICAgICAgIGZvcihsZXQgaSA9IDY7aTxkYXRhcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGRhdGFzW2ldO1xyXG4gICAgICAgICAgICBpZihkYXRhWzBdID09ICdEQVRBJyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXN0b21pemVEYXRhcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudE5hbWUgICAgICAgOiBkYXRhWzJdLFxyXG4gICAgICAgICAgICAgICAgICAgIGRlc2MgICAgICAgICAgICA6IGRhdGFbM10sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGlzdGljYWxJZCAgIDogZGF0YVs0XSxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5bCG6L+Z5Lqb5pWw5o2u5a+85Ye65Yiw5LiA5Liq5paw55qEeGxzeOaWh+S7tuS4re+8jOeUqOS6jue7meetluWIkuWQjOS6i+afpeeci1xyXG4gICAgICogMS7mlofku7bot6/lvoTvvJpfY29uZmlnL+Wfi+eCueWvvOWHui8kYnVuZGxlTmFtZV9zdGF0aXN0aWNhbF9leHBvcnQueGxzeFxyXG4gICAgICogMi54bHN45YWx5pyJ5LiJ5Liqc2hlZXTvvIzliIbliKvlloLvvJrnlYzpnaLnu5/orqHvvIzmjInpkq7nu5/orqHvvIzoh6rlrprkuYnmiZPngrlcclxuICAgICAqIDMu5LiJ5Liqc2hlZXTnmoTmlbDmja7liIbliKvmmK/vvJp0aGlzLl9wYW5lbERhdGFzLHRoaXMuX2J1dHRvbkRhdGFzLHRoaXMuX2N1c3RvbWl6ZURhdGFzXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBleHBvcnREYXRhRm9yUGxhbigpe1xyXG4gICAgICAgIGlmKCF0aGlzLmdhbWVJZCB8fCB0aGlzLmdhbWVJZCA9PSAtMSl7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZmlsZVVybCAgID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsXCJfY29uZmlnXCIsXCLln4vngrnlr7zlh7pcIix0aGlzLmJ1bmRsZU5hbWUgKyBcIl9zdGF0aXN0aWNhbF9leHBvcnQueGxzeFwiKTtcclxuICAgICAgICBjb25zdCBzaGVldDEgICAgPSB7XHJcbiAgICAgICAgICAgIG5hbWUgICAgOiBcIueVjOmdoue7n+iuoVwiLFxyXG4gICAgICAgICAgICBkYXRhICAgIDogW1xyXG4gICAgICAgICAgICAgICAgW1wi55WM6Z2i5ZCN5a2XXCIsXCLmj4/ov7BcIixcIue7n+iuoUlEXCJdLFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3Qgc2hlZXQyICAgID0ge1xyXG4gICAgICAgICAgICBuYW1lICAgIDogXCLmjInpkq7nu5/orqFcIixcclxuICAgICAgICAgICAgZGF0YSAgICA6IFtcclxuICAgICAgICAgICAgICAgIFtcIuaJgOWxnueVjOmdolwiLFwi5oyJ6ZKu5ZCN5a2XXCIsXCLmj4/ov7BcIixcIue7n+iuoUlEXCJdLFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3Qgc2hlZXQzICAgID0ge1xyXG4gICAgICAgICAgICBuYW1lICAgIDogXCLoh6rlrprkuYnmiZPngrlcIixcclxuICAgICAgICAgICAgZGF0YSAgICA6IFtcclxuICAgICAgICAgICAgICAgIFtcIuiHquWumuS5ieS6i+S7tuWQjeWtl1wiLFwi5o+P6L+wXCIsXCLnu5/orqFJRFwiXSxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8v5aGr5YWF5pWw5o2uXHJcbiAgICAgICAgZm9yKGxldCBpID0gMDtpPHRoaXMuX3BhbmVsRGF0YXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLl9wYW5lbERhdGFzW2ldO1xyXG4gICAgICAgICAgICBzaGVldDEuZGF0YS5wdXNoKFtkYXRhLnZpZXdOYW1lLGRhdGEuZGVzYyxkYXRhLnN0YXRpc3RpY2FsSWQudG9TdHJpbmcoKV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IobGV0IGkgPSAwO2k8dGhpcy5fYnV0dG9uRGF0YXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLl9idXR0b25EYXRhc1tpXTtcclxuICAgICAgICAgICAgc2hlZXQyLmRhdGEucHVzaChbZGF0YS52aWV3TmFtZSxkYXRhLmJ1dHRvbk5hbWUsZGF0YS5kZXNjLGRhdGEuc3RhdGlzdGljYWxJZC50b1N0cmluZygpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7aTx0aGlzLl9jdXN0b21pemVEYXRhcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuX2N1c3RvbWl6ZURhdGFzW2ldO1xyXG4gICAgICAgICAgICBzaGVldDMuZGF0YS5wdXNoKFtkYXRhLmV2ZW50TmFtZSxkYXRhLmRlc2MsZGF0YS5zdGF0aXN0aWNhbElkLnRvU3RyaW5nKCldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc2hlZXRPcHRpb25zICA9IHsnIWNvbHMnOiBbe3djaDogMjB9LCB7d2NoOiAyMH0sIHt3Y2g6IDIwfSwge3djaDogMjB9XX07XHJcbiAgICAgICAgY29uc3QgYnVmZmVyICAgICAgICA9IHhsc3guYnVpbGQoXHJcbiAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgIHtuYW1lIDogc2hlZXQxLm5hbWUsZGF0YSA6IHNoZWV0MS5kYXRhLG9wdGlvbnMgOiBzaGVldE9wdGlvbnN9LFxyXG4gICAgICAgICAgICAgICAge25hbWUgOiBzaGVldDIubmFtZSxkYXRhIDogc2hlZXQyLmRhdGEsb3B0aW9ucyA6IHNoZWV0T3B0aW9uc30sXHJcbiAgICAgICAgICAgICAgICB7bmFtZSA6IHNoZWV0My5uYW1lLGRhdGEgOiBzaGVldDMuZGF0YSxvcHRpb25zIDogc2hlZXRPcHRpb25zfVxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgLy/mo4DmtYtmaWxlVXJs5piv5ZCm5a2Y5Zyo77yM5aaC5p6c5a2Y5Zyo77yM5YiZ5Yig6ZmkXHJcbiAgICAgICAgaWYoZnMuZXhpc3RzU3luYyhmaWxlVXJsKSl7XHJcbiAgICAgICAgICAgIGZzLnJlbW92ZVN5bmMoZmlsZVVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8v5YaZ5YWl5paH5Lu2XHJcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhmaWxlVXJsLGJ1ZmZlcix7ZW5jb2RpbmcgOiBcImJpbmFyeVwifSk7XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwi5Z+L54K55a+85Ye65oiQ5YqfLeOAi1wiLGZpbGVVcmwpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5bCG6YWN572u5YaZ5YWl5YiwX2NvbmZpZy8kYnVuZGxlTmFtZS9zdGF0aXN0aWNhbC9zdGF0aXN0aWNhbF8kYnVuZGxlTmFtZV9jb25maWcuanNvblxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgd3JpdGVDb25maWdUb0ZpbGUoKXtcclxuICAgICAgICBpZighdGhpcy5fYnVuZGxlX3N0YXRpc3RpY2FsX2NvbmZpZyl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLmsqHmnInnu5/orqHphY3nva7vvIzml6Dms5XlhpnlhaXmlofku7ZcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgY29uZmlnVXJsID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsXCJfY29uZmlnXCIsdGhpcy5idW5kbGVOYW1lLFwic3RhdGlzdGljYWxcIixcInN0YXRpc3RpY2FsX1wiICsgdGhpcy5idW5kbGVOYW1lICsgXCJfY29uZmlnLmpzb25cIik7XHJcbiAgICAgICAgZnMuZW5zdXJlRGlyU3luYyhwYXRoLmRpcm5hbWUoY29uZmlnVXJsKSk7XHJcbiAgICAgICAgZnMud3JpdGVKU09OU3luYyhjb25maWdVcmwsdGhpcy5fYnVuZGxlX3N0YXRpc3RpY2FsX2NvbmZpZyx7c3BhY2VzIDogNH0pO1xyXG4gICAgICAgIGNvbnNvbGUud2FybihcIue7n+iuoemFjee9ruWGmeWFpeaIkOWKn++8mlwiLGNvbmZpZ1VybCk7XHJcbiAgICB9XHJcbn0iXX0=