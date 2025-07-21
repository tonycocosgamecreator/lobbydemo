"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbVerifyer = void 0;
const path_1 = __importDefault(require("path"));
const tools_1 = __importDefault(require("../utils/tools"));
const timer_1 = __importDefault(require("../utils/timer"));
const db_exporter_1 = __importDefault(require("./db-exporter"));
class DbVerifyer {
    static warn(text) {
        this.warnCount++;
        console.warn("[警告]", text);
    }
    /**
     * 校验配置表
     */
    static verifyDb() {
        console.log("\n---------------------- 开始校验配置表 ----------------------");
        this.dbName_2_idExists = {};
        this.warnCount = 0;
        let beginTime = timer_1.default.time();
        let rule_2_valid = {
            m: true,
            ma: true,
            mm: true,
            a: true,
        };
        // 1. 打印配置表自身的loading警告
        tools_1.default.forEachMap(db_exporter_1.default.dbName_2_db, (dbName, db) => {
            for (let i = 0; i < db.warnLog.length; i++) {
                const text = db.warnLog[i];
                DbVerifyer.warn(text);
            }
        });
        // 2. 收集所有的资源
        // 目前支持两种资源配置方式：
        // fgui资源：     ui://icon/gold
        // creator资源：  2d/spine/ui/saoba_d/saoba
        this.url_2_exists = {};
        let resourcesRootDir = path_1.default.join(db_exporter_1.default.prjRootDir, "assets", "resources");
        // console.log('resourcesRootDir', resourcesRootDir)
        tools_1.default.foreachDir(resourcesRootDir, (filePath) => {
            // 忽略meta
            if (filePath.endsWith(".meta"))
                return false;
            let relativePath = path_1.default.relative(resourcesRootDir, filePath);
            // relativePath = 2d\spine\ui\xinshouyindao_d\xinshouyindao.png
            let withoutExtPath = relativePath.substring(0, relativePath.indexOf("."));
            // withoutExtPath = 2d\spine\ui\xinshouyindao_d\xinshouyindao
            let unixStylePath = withoutExtPath.replace(/\\/g, "/");
            // unixStylePath = 2d/spine/ui/saoba_d/saoba
            // console.log("filePath", filePath);
            // console.log("relativePath", relativePath);
            // console.log("withoutExtPath", withoutExtPath);
            // console.log("unixFormatPath", unixStylePath)
            this.url_2_exists[unixStylePath] = true;
        });
        // let fguiRootDir = path.join(DbExporter.prjRootDir, "_fgui", "assets");
        // Tools.foreachDir(fguiRootDir, (filePath) => {
        //     if (path.basename(filePath) != "package.xml") return false;
        //     let packageName = /(\w+)\\package.xml/.exec(filePath)[1];
        //     // console.log("fgui filePath", filePath, packageName)
        //     let packageData = Tools.loadXmlDataFromPath(filePath);
        //     if (packageData) {
        //         // console.dir(packageData, { depth: null });
        //         let root = packageData.packageDescription || {};
        //         let resources = root.resources || {};
        //         Tools.forEachMap(resources, (tag, arr) => {
        //             // console.dir(arr)
        //             for (let i = 0; i < arr.length; i++) {
        //                 const v = arr[i];
        //                 if (v._attributes.exported == "true") {
        //                     let fileName = v._attributes.name;
        //                     fileName = fileName.substring(0, fileName.indexOf("."))
        //                     // console.log("资源", fileName)
        //                     let url = Tools.format("ui://%s/%s", packageName, fileName);
        //                     this.url_2_exists[url] = true;
        //                 }
        //             }
        //         });
        //     }
        // });
        // console.dir(this.url_2_exists)
        // 3. 收集各个表的majorId
        tools_1.default.forEachMap(db_exporter_1.default.dbName_2_db, (dbName, db) => {
            if (!rule_2_valid[db.rule]) {
                console.warn("配置表[%s] 未知规则：rule=[%s]，规则需要为：m, ma, mm, a中的一种", dbName, db.rule);
            }
            let id_2_exists = {};
            db.forDb((data, majorId) => {
                if (id_2_exists[majorId] != null) {
                    console.warn("配置表[%s]中出现重复id：[%s]", dbName, majorId);
                }
                id_2_exists[majorId] = true;
            }, true);
            this.dbName_2_idExists[dbName] = id_2_exists;
        });
        // 4. 处理idMergeTo的逻辑
        tools_1.default.forEachMap(db_exporter_1.default.dbName_2_db, (dbName, db) => {
            for (let i = 0; i < db.fields.length; i++) {
                const field = db.fields[i];
                if (field.idMergeTo) {
                    if (i > 0) {
                        console.warn("配置表[%s] ID合并功能【idMergeTo】 只有主id字段[%s]能配置idMergeTo！请删除字段[%s]的FLD_ID_MERGE_TO配置。", dbName, db.getMajorIdName(), field.name);
                        continue;
                    }
                    // this.warn("find idMergeTo dbName=[%s], field=[%s], idMergeTo=[%s]", dbName, field.name, field.idMergeTo);
                    let targetDb = db_exporter_1.default.dbName_2_db[field.idMergeTo];
                    if (!targetDb) {
                        console.warn("配置表[%s] ID合并功能【idMergeTo】 配置的目标表[%s]不存在！", dbName, field.idMergeTo);
                        continue;
                    }
                    let target_id_2_exists = this.dbName_2_idExists[targetDb.name];
                    db.forDb((data, majorId) => {
                        if (target_id_2_exists[majorId] != null) {
                            console.warn("配置表[%s] ID合并功能【idMergeTo】 目标配置表[%s]中出现重复id：[%s]", dbName, targetDb.name, majorId);
                        }
                        target_id_2_exists[majorId] = true;
                    }, true);
                }
            }
        });
        // console.dir(this.dbName_2_idExists)
        // 5. 收集alu信息
        let alu_db = db_exporter_1.default.dbName_2_db["origin_alu_db"];
        this.aluId_2_exists = {};
        if (alu_db) {
            // console.log(alu_db)
            tools_1.default.forEachMap(alu_db.datas, (k, v) => {
                this.aluId_2_exists[k] = true;
            });
        }
        // 6. 处理自定义校验逻辑
        tools_1.default.forEachMap(db_exporter_1.default.dbName_2_db, (dbName, db) => {
            for (let i = 0; i < db.fields.length; i++) {
                const field = db.fields[i];
                for (let j = 0; j < field.verifyers.length; j++) {
                    let verifyer = field.verifyers[j].toString();
                    // console.log("fild", i, field.name, j, verifyer)
                    // 替换所有空格
                    verifyer = verifyer.replace(/\s+/g, "");
                    let pipelines = [];
                    // 当前支持的格式
                    // 1. =>：分隔符
                    // 2. equal_len(id)：检查数组类型数据长度是否一致：equal_len(%TARGET_FIELD_NAME%)
                    // 3. item_db：检查数据是否为指定配置表的主要id：check_major_id_exists(%TARGET_DB_NAME%) -> 简写为 %TARGET_DB_NAME%
                    // 4. URL：检查资源是否存在
                    // 6. for：遍历，将遍历结果传递给下一个管线
                    // 7. [%INDEX]：索引
                    // 8. if：根据索引判定条件，只有条件通过才进入下一个管线 if([0] == 0)     if([0] >= 5)        if([name]==spine)
                    //          支持的符号：    字符串判断：[==, !=] 数值判断：[>, >=, <, <=]
                    // 管线概念，每个管线有自己的数据
                    // 举例：verifyer='URL'
                    // 通过=>拆分，得到一条 urlPipeline
                    // 遍历当前配置表所有datas，提取对应的data， let output = urlPipeline.execute(data)
                    // 使用分隔符拆分
                    let cmds = verifyer.split("=>");
                    for (let k = 0; k < cmds.length; k++) {
                        let cmd = cmds[k];
                        // console.log("配置表[%s] 开启字段校验。field=[%s] verifyer='%s' %d: '%s'", dbName, field.name, verifyer, k, cmd);
                        let pipeline = null;
                        let bNonEmpty = false;
                        if (cmd.endsWith("!")) {
                            cmd = cmd.substring(0, cmd.length - 1);
                            bNonEmpty = true;
                            // console.log("find !")
                        }
                        if (cmd.startsWith("equal_len")) {
                            pipeline = new PipelineEqualLen(this, db, field, verifyer);
                        }
                        else if (this.dbName_2_idExists[cmd] != null) {
                            // cmd为表名，验收主id
                            pipeline = new PipelineReferenceMajorId(this, db, field, verifyer);
                        }
                        else if (cmd.toLowerCase() == "url") {
                            pipeline = new PipelineUrl(this, db, field, verifyer);
                        }
                        else if (cmd.toLowerCase() == "alu_exp") {
                            pipeline = new PipelineAluExp(this, db, field, verifyer);
                        }
                        else if (cmd.toLowerCase() == "for") {
                            pipeline = new PipelineFor(this, db, field, verifyer);
                        }
                        else if (/if\(\[(.+)\]([\>\!\=\<]+)([^\)]+)/.exec(cmd)) {
                            pipeline = new PipelineIf(this, db, field, verifyer);
                        }
                        else if (/\[([^\]]+)\]/.exec(cmd)) {
                            pipeline = new PipelineIndex(this, db, field, verifyer);
                        }
                        else {
                            console.warn("配置表[%s] 字段[%s] verifyer解析错误， 未知cmd='%s'", dbName, field.name, cmd);
                            // pipleline一个环节出错，后续都有问题，直接中断
                            pipelines = [];
                            break;
                        }
                        if (pipeline) {
                            pipeline.init(cmd, bNonEmpty);
                            pipelines.push(pipeline);
                        }
                    }
                    // 串联管线（一定要执行一次，用于检测是否拥有后续管线）
                    for (let i = 0; i < pipelines.length; i++) {
                        let p1 = pipelines[i];
                        let p2 = pipelines[i + 1];
                        p1.setNextPipeline(p2);
                    }
                    let p1 = pipelines[0];
                    if (p1) {
                        // 执行校验管线
                        db.forDb((data, majorId, minorId) => {
                            let context = data[p1.field.name];
                            p1.execute(context, data, majorId, minorId);
                        });
                    }
                }
            }
        });
        console.log(tools_1.default.format("------------ 配置表校验完毕 发现%d处异常，用时%dms ------------\n", this.warnCount, timer_1.default.time() - beginTime));
    }
}
exports.DbVerifyer = DbVerifyer;
class Pipeline {
    constructor(verifyer, db, field, originVerify) {
        this.verifyer = verifyer;
        this.db = db;
        this.field = field;
        this.originVerify = originVerify;
        this.cmd = null;
        this.nextPipeline = null;
        this.bNonEmpty = false;
    }
    init(cmd, bNonEmpty) {
        this.cmd = cmd;
        this.bNonEmpty = !!bNonEmpty;
    }
    setNextPipeline(pipeline) {
        this.nextPipeline = pipeline;
    }
    execute(context, data, majorId, minorId) {
    }
    formatId(majorId, minorId) {
        let text = "";
        if (majorId != null) {
            text += "[" + majorId + "]";
        }
        if (minorId != null) {
            text += "[" + minorId + "]";
        }
        return text;
    }
}
class PipelineEqualLen extends Pipeline {
    init(cmd, bNonEmpty) {
        super.init(cmd, bNonEmpty);
        let ret = /equal_len\(([^\)]+)/.exec(cmd);
        if (ret && ret.length >= 1) {
            this.targetFieldName = ret[1];
        }
        if (!this.targetFieldName) {
            this.verifyer.warn("配置表[%s] 字段[%s] verifyer解析错误，【equal_len】目标字段名未找到。cmd='%s'", this.db.name, this.field.name, cmd);
        }
        else {
            // 检查字段名在db中是否存在
            let bExists = false;
            for (let i = 0; i < this.db.fields.length; i++) {
                const field = this.db.fields[i];
                if (field.name == this.targetFieldName) {
                    bExists = true;
                    break;
                }
            }
            if (!bExists) {
                this.verifyer.warn("配置表[%s] 字段[%s] verifyer解析错误，【equal_len】目标字段【%s】不存在！cmd='%s'", this.db.name, this.field.name, this.targetFieldName, cmd);
                this.targetFieldName = null;
            }
        }
    }
    setNextPipeline(pipeline) {
        super.setNextPipeline(pipeline);
        // 无法串联
        if (this.nextPipeline) {
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' equal_len不能接后续命令。", this.db.name, this.field.name, this.originVerify);
        }
    }
    execute(context, data, majorId, minorId) {
        if (!this.targetFieldName)
            return;
        // 检查当前字段数据类型
        if (!Array.isArray(context)) {
            this.verifyer.warn("配置表[%s] DATA%s.%s=%s不是数组类型，equal_len校验失败", this.db.name, this.formatId(majorId, minorId), this.field.name, context);
            return;
        }
        // 提取目标数据
        let targetData = data[this.targetFieldName];
        if (!Array.isArray(targetData)) {
            this.verifyer.warn("配置表[%s] DATA%s.%s=%s不是数组类型，equal_len校验失败", this.db.name, this.formatId(majorId, minorId), this.targetFieldName, targetData);
            return;
        }
        if (context.length != targetData.length) {
            this.verifyer.warn("配置表[%s] DATA%s.%s=[%s] 和 DATA%s.%s=[%s]长度不匹配", this.db.name, this.formatId(majorId, minorId), this.field.name, context, this.formatId(majorId, minorId), this.targetFieldName, targetData);
            return;
        }
    }
}
class PipelineReferenceMajorId extends Pipeline {
    init(cmd, bNonEmpty) {
        super.init(cmd, bNonEmpty);
        this.targetDbName = cmd;
        if (!this.verifyer.dbName_2_idExists[this.targetDbName]) {
            this.verifyer.warn("配置表[%s] 字段[%s] verifyer解析错误，目标表[%s]不存在或解析失败。cmd='%s'", this.db.name, this.field.name, this.targetDbName, cmd);
            this.targetDbName = null;
            return;
        }
    }
    setNextPipeline(pipeline) {
        super.setNextPipeline(pipeline);
        // 无法串联
        if (this.nextPipeline) {
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' %s不能接后续命令。", this.db.name, this.field.name, this.originVerify, this.targetDbName);
        }
    }
    execute(context, data, majorId, minorId) {
        // console.log("PipelineReferenceMajorId", this.db.name, this.field.name, majorId, minorId, this.bNonEmpty)
        if (!this.targetDbName)
            return;
        if (!this.bNonEmpty) {
            if (context == "" || context == null)
                return;
        }
        let id_2_exists = this.verifyer.dbName_2_idExists[this.targetDbName];
        if (id_2_exists[context] == null) {
            this.verifyer.warn("配置表[%s] DATA%s.%s='%s' 外链ID未找到：%s[%s]", this.db.name, this.formatId(majorId, minorId), this.field.name, data[this.field.name], this.targetDbName, context);
        }
    }
}
class PipelineUrl extends Pipeline {
    setNextPipeline(pipeline) {
        super.setNextPipeline(pipeline);
        // 无法串联
        if (this.nextPipeline) {
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' URL不能接后续命令。", this.db.name, this.field.name, this.originVerify);
        }
    }
    execute(context, data, majorId, minorId) {
        // console.log("校验url：", context);
        // 不校验没有填写的情况
        if (context == null || context === "") {
            // 配置为空
            if (this.bNonEmpty) {
                this.verifyer.warn("配置表[%s] DATA%s.%s='%s' url不能配置为空！", this.db.name, this.formatId(majorId, minorId), this.field.name, data[this.field.name]);
            }
            return;
        }
        if (!this.verifyer.url_2_exists[context]) {
            this.verifyer.warn("配置表[%s] DATA%s.%s='%s' url指向资源[%s]不存在或未导出！", this.db.name, this.formatId(majorId, minorId), this.field.name, data[this.field.name], context);
        }
    }
}
const ALU_EXP_KEY_WORDS = {
    and: true,
    or: true,
    not: true,
    true: true,
    false: true,
};
class PipelineAluExp extends Pipeline {
    setNextPipeline(pipeline) {
        super.setNextPipeline(pipeline);
        // 无法串联
        if (this.nextPipeline) {
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' alu_exp不能接后续命令。", this.db.name, this.field.name, this.originVerify);
        }
    }
    execute(context, data, majorId, minorId) {
        // 不校验没有填写的情况
        if (context == null || context === "")
            return;
        // console.log("校验alu_exp", context);
        // 按照空格拆分
        let fields = context.split(" ");
        // console.log("fields", fields)
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            let lowerField = field.toLowerCase();
            // 关键词忽略
            if (ALU_EXP_KEY_WORDS[lowerField])
                continue;
            // 剩余的是aluId
            if (!this.verifyer.aluId_2_exists[field]) {
                this.verifyer.warn("配置表[%s] DATA%s.%s='%s' aluId[%s]在origin_alu_db中未找到！", this.db.name, this.formatId(majorId, minorId), this.field.name, data[this.field.name], field);
            }
        }
    }
}
class PipelineIndex extends Pipeline {
    init(cmd, bNonEmpty) {
        super.init(cmd, bNonEmpty);
        let ret = /\[([^\]]+)\]/.exec(cmd);
        if (!ret || !ret[1]) {
            this.verifyer.warn("配置表[%s] 字段[%s] verifyer解析错误，索引命令解析错误。cmd='%s'。  sample：[0] [name] [type]", this.db.name, this.field.name, cmd);
            return;
        }
        this.key = ret[1];
    }
    setNextPipeline(pipeline) {
        super.setNextPipeline(pipeline);
        // 需要串联
        if (!this.nextPipeline) {
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' %s之后需要连接其他命令。", this.db.name, this.field.name, this.originVerify, this.cmd);
        }
    }
    execute(context, data, majorId, minorId) {
        if (!this.key)
            return;
        if (!context)
            return;
        if (!(context instanceof Object)) {
            this.verifyer.warn("配置表[%s] DATA%s.%s=%s %s索引失败，typeof('%s')='%s'", this.db.name, this.formatId(majorId, minorId), this.field.name, data[this.field.name], this.cmd, context, typeof context);
        }
        // console.log("PipelineIndex.execute", this.db.name, this.field.name, this.cmd, majorId, context);
        // console.log("  type", context instanceof Object);
        let value = context[this.key];
        if (this.nextPipeline) {
            this.nextPipeline.execute(value, data, majorId, minorId);
        }
    }
}
class PipelineFor extends Pipeline {
    setNextPipeline(pipeline) {
        super.setNextPipeline(pipeline);
        // 需要串联
        if (!this.nextPipeline) {
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' %s之后需要连接其他命令。", this.db.name, this.field.name, this.originVerify, this.cmd);
        }
    }
    execute(context, data, majorId, minorId) {
        if (!context)
            return;
        if (!(context instanceof Object)) {
            this.verifyer.warn("配置表[%s] DATA%s.%s=%s typeof('%s')='%s'遍历失败，需要为数组或对象。", this.db.name, this.formatId(majorId, minorId), this.field.name, data[this.field.name], context, typeof context);
            return;
        }
        if (this.nextPipeline) {
            if (Array.isArray(context)) {
                // 数组
                for (let i = 0; i < context.length; i++) {
                    const value = context[i];
                    this.nextPipeline.execute(value, data, majorId, minorId);
                }
            }
            else {
                tools_1.default.forEachMap(context, (k, value) => {
                    this.nextPipeline.execute(value, data, majorId, minorId);
                });
            }
        }
    }
}
class PipelineIf extends Pipeline {
    init(cmd, bNonEmpty) {
        super.init(cmd, bNonEmpty);
        let ret = /if\(\[(.+)\]([\>\!\=\<]+)([^\)]+)/.exec(cmd) || [];
        // console.log("ret", ret)
        this.key = ret[1];
        this.symbol = ret[2];
        this.targetValue = ret[3];
        // 理论上不会存在ret为空的情况
        if (!this.key || !this.symbol || !this.targetValue) {
            this.verifyer.warn("配置表[%s] 字段[%s] verifyer解析错误，if命令解析错误。cmd='%s'。  sample：[0] [name] [type]", this.db.name, this.field.name, cmd);
            return;
        }
        // 检查symbol
        if (!PipelineIf.SYMBOL_2_VAILD[this.symbol]) {
            this.verifyer.warn("配置表[%s] 字段[%s] if判断符号'%s'不可用。请使用!=, ==, <, <=, >, >=中的符号。", this.db.name, this.field.name, this.symbol);
            this.symbol = null;
            return;
        }
        // 检查targetValue类型
        if (PipelineIf.SYMBOL_2_REQUIRE_NUM[this.symbol]) {
            // 数值类型
            let numbervalue = parseFloat(this.targetValue);
            if (isNaN(numbervalue)) {
                this.verifyer.warn("配置表[%s] 字段[%s] if判断'%s'，目标值[%s]需要为数字。", this.db.name, this.field.name, this.cmd, this.targetValue);
                this.targetValue = null;
            }
            else {
                this.targetValue = numbervalue;
            }
        }
        else {
            this.targetValue = (this.targetValue || "").toString();
        }
    }
    setNextPipeline(pipeline) {
        super.setNextPipeline(pipeline);
        // 需要串联
        if (!this.nextPipeline) {
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' %s之后需要连接其他命令。", this.db.name, this.field.name, this.originVerify, this.cmd);
        }
    }
    execute(context, data, majorId, minorId) {
        // console.log("PipelineIf.execute", this.db.name, this.field.name, majorId, this.key, this.symbol, this.targetValue);
        if (!context)
            return;
        if (!this.key || !this.symbol || !this.targetValue)
            return;
        if (!(context instanceof Object)) {
            this.verifyer.warn("配置表[%s] DATA%s.%s=%s %s if判断索引失败，typeof('%s')='%s'", this.db.name, this.formatId(majorId, minorId), this.field.name, data[this.field.name], this.cmd, context, typeof context);
            return;
        }
        let value = context[this.key];
        if (PipelineIf.SYMBOL_2_REQUIRE_NUM[this.symbol]) {
            // 数值类型
            let numbervalue = parseFloat(value);
            if (isNaN(numbervalue)) {
                this.verifyer.warn("配置表[%s] DATA%s.%s='%s' if判断'%s'，%s[%s]='%s'需要为数字。", this.db.name, this.formatId(majorId, minorId), this.field.name, context, this.cmd, context, this.key, value);
                return;
            }
            else {
                value = numbervalue;
            }
        }
        else {
            value = (value || "").toString();
        }
        let handler = PipelineIf.SYMBOL_2_HANDLER[this.symbol];
        if (handler instanceof Function) {
            if (handler(value, this.targetValue)) {
                // 通过，向后传递
                if (this.nextPipeline) {
                    this.nextPipeline.execute(context, data, majorId, minorId);
                }
            }
        }
        else {
            console.error("handler not function?", this.symbol, handler);
        }
    }
    ;
}
PipelineIf.SYMBOL_2_VAILD = {
    "!=": true,
    "==": true,
    "<": true,
    "<=": true,
    ">": true,
    ">=": true,
};
PipelineIf.SYMBOL_2_REQUIRE_NUM = {
    "!=": false,
    "==": false,
    "<": true,
    "<=": true,
    ">": true,
    ">=": true,
};
PipelineIf.SYMBOL_2_HANDLER = {
    "!=": (a, b) => { return a != b; },
    "==": (a, b) => { return a == b; },
    "<": (a, b) => { return a < b; },
    "<=": (a, b) => { return a <= b; },
    ">": (a, b) => { return a > b; },
    ">=": (a, b) => { return a >= b; },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGItdmVyaWZ5ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvZGJleHBvcnQvZGItdmVyaWZ5ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDJEQUFtQztBQUNuQywyREFBbUM7QUFDbkMsZ0VBQXVDO0FBR3ZDLE1BQWEsVUFBVTtJQVluQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUk7UUFDWixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFFakIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUMsSUFBSSxDQUFDLENBQUE7SUFDN0IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLFFBQVE7UUFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7UUFFdkUsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUVuQixJQUFJLFNBQVMsR0FBRyxlQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFN0IsSUFBSSxZQUFZLEdBQUc7WUFDZixDQUFDLEVBQUUsSUFBSTtZQUNQLEVBQUUsRUFBRSxJQUFJO1lBQ1IsRUFBRSxFQUFFLElBQUk7WUFDUixDQUFDLEVBQUUsSUFBSTtTQUNWLENBQUE7UUFFRCx1QkFBdUI7UUFDdkIsZUFBSyxDQUFDLFVBQVUsQ0FBQyxxQkFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRTtZQUNwRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3hDLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNCLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFD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Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgVG9vbHMgZnJvbSBcIi4uL3V0aWxzL3Rvb2xzXCI7XHJcbmltcG9ydCBUaW1lciBmcm9tIFwiLi4vdXRpbHMvdGltZXJcIjtcclxuaW1wb3J0IERiRXhwb3J0ZXIgZnJvbSBcIi4vZGItZXhwb3J0ZXJcIjtcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRGJWZXJpZnllciB7XHJcbiAgICAvKipcclxuICAgICAqIHsgW2RiTmFtZTogc3RyaW5nXTogYm9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGRiTmFtZV8yX2lkRXhpc3RzO1xyXG5cclxuICAgIHN0YXRpYyBhbHVJZF8yX2V4aXN0cztcclxuXHJcbiAgICBzdGF0aWMgdXJsXzJfZXhpc3RzO1xyXG5cclxuICAgIHN0YXRpYyB3YXJuQ291bnQ7XHJcblxyXG4gICAgc3RhdGljIHdhcm4odGV4dCkge1xyXG4gICAgICAgIHRoaXMud2FybkNvdW50Kys7XHJcblxyXG4gICAgICAgIGNvbnNvbGUud2FybihcIlvorablkYpdXCIsdGV4dClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOagoemqjOmFjee9ruihqFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgdmVyaWZ5RGIoKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJcXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIOW8gOWni+agoemqjOmFjee9ruihqCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tXCIpO1xyXG5cclxuICAgICAgICB0aGlzLmRiTmFtZV8yX2lkRXhpc3RzID0ge307XHJcbiAgICAgICAgdGhpcy53YXJuQ291bnQgPSAwO1xyXG5cclxuICAgICAgICBsZXQgYmVnaW5UaW1lID0gVGltZXIudGltZSgpO1xyXG5cclxuICAgICAgICBsZXQgcnVsZV8yX3ZhbGlkID0ge1xyXG4gICAgICAgICAgICBtOiB0cnVlLFxyXG4gICAgICAgICAgICBtYTogdHJ1ZSxcclxuICAgICAgICAgICAgbW06IHRydWUsXHJcbiAgICAgICAgICAgIGE6IHRydWUsXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyAxLiDmiZPljbDphY3nva7ooajoh6rouqvnmoRsb2FkaW5n6K2m5ZGKXHJcbiAgICAgICAgVG9vbHMuZm9yRWFjaE1hcChEYkV4cG9ydGVyLmRiTmFtZV8yX2RiLCAoZGJOYW1lLCBkYikgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRiLndhcm5Mb2cubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBkYi53YXJuTG9nW2ldO1xyXG4gICAgICAgICAgICAgICAgRGJWZXJpZnllci53YXJuKHRleHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIDIuIOaUtumbhuaJgOacieeahOi1hOa6kFxyXG4gICAgICAgIC8vIOebruWJjeaUr+aMgeS4pOenjei1hOa6kOmFjee9ruaWueW8j++8mlxyXG4gICAgICAgIC8vIGZndWnotYTmupDvvJogICAgIHVpOi8vaWNvbi9nb2xkXHJcbiAgICAgICAgLy8gY3JlYXRvcui1hOa6kO+8miAgMmQvc3BpbmUvdWkvc2FvYmFfZC9zYW9iYVxyXG4gICAgICAgIHRoaXMudXJsXzJfZXhpc3RzID0ge307XHJcbiAgICAgICAgbGV0IHJlc291cmNlc1Jvb3REaXIgPSBwYXRoLmpvaW4oRGJFeHBvcnRlci5wcmpSb290RGlyLCBcImFzc2V0c1wiLCBcInJlc291cmNlc1wiKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygncmVzb3VyY2VzUm9vdERpcicsIHJlc291cmNlc1Jvb3REaXIpXHJcblxyXG4gICAgICAgIFRvb2xzLmZvcmVhY2hEaXIocmVzb3VyY2VzUm9vdERpciwgKGZpbGVQYXRoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAvLyDlv73nlaVtZXRhXHJcbiAgICAgICAgICAgIGlmIChmaWxlUGF0aC5lbmRzV2l0aChcIi5tZXRhXCIpKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBsZXQgcmVsYXRpdmVQYXRoID0gcGF0aC5yZWxhdGl2ZShyZXNvdXJjZXNSb290RGlyLCBmaWxlUGF0aCk7XHJcbiAgICAgICAgICAgIC8vIHJlbGF0aXZlUGF0aCA9IDJkXFxzcGluZVxcdWlcXHhpbnNob3V5aW5kYW9fZFxceGluc2hvdXlpbmRhby5wbmdcclxuXHJcbiAgICAgICAgICAgIGxldCB3aXRob3V0RXh0UGF0aCA9IHJlbGF0aXZlUGF0aC5zdWJzdHJpbmcoMCwgcmVsYXRpdmVQYXRoLmluZGV4T2YoXCIuXCIpKTtcclxuICAgICAgICAgICAgLy8gd2l0aG91dEV4dFBhdGggPSAyZFxcc3BpbmVcXHVpXFx4aW5zaG91eWluZGFvX2RcXHhpbnNob3V5aW5kYW9cclxuXHJcbiAgICAgICAgICAgIGxldCB1bml4U3R5bGVQYXRoID0gd2l0aG91dEV4dFBhdGgucmVwbGFjZSgvXFxcXC9nLCBcIi9cIilcclxuICAgICAgICAgICAgLy8gdW5peFN0eWxlUGF0aCA9IDJkL3NwaW5lL3VpL3Nhb2JhX2Qvc2FvYmFcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiZmlsZVBhdGhcIiwgZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcInJlbGF0aXZlUGF0aFwiLCByZWxhdGl2ZVBhdGgpO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIndpdGhvdXRFeHRQYXRoXCIsIHdpdGhvdXRFeHRQYXRoKTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJ1bml4Rm9ybWF0UGF0aFwiLCB1bml4U3R5bGVQYXRoKVxyXG5cclxuICAgICAgICAgICAgdGhpcy51cmxfMl9leGlzdHNbdW5peFN0eWxlUGF0aF0gPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBsZXQgZmd1aVJvb3REaXIgPSBwYXRoLmpvaW4oRGJFeHBvcnRlci5wcmpSb290RGlyLCBcIl9mZ3VpXCIsIFwiYXNzZXRzXCIpO1xyXG4gICAgICAgIC8vIFRvb2xzLmZvcmVhY2hEaXIoZmd1aVJvb3REaXIsIChmaWxlUGF0aCkgPT4ge1xyXG4gICAgICAgIC8vICAgICBpZiAocGF0aC5iYXNlbmFtZShmaWxlUGF0aCkgIT0gXCJwYWNrYWdlLnhtbFwiKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vICAgICBsZXQgcGFja2FnZU5hbWUgPSAvKFxcdyspXFxcXHBhY2thZ2UueG1sLy5leGVjKGZpbGVQYXRoKVsxXTtcclxuICAgICAgICAvLyAgICAgLy8gY29uc29sZS5sb2coXCJmZ3VpIGZpbGVQYXRoXCIsIGZpbGVQYXRoLCBwYWNrYWdlTmFtZSlcclxuXHJcbiAgICAgICAgLy8gICAgIGxldCBwYWNrYWdlRGF0YSA9IFRvb2xzLmxvYWRYbWxEYXRhRnJvbVBhdGgoZmlsZVBhdGgpO1xyXG4gICAgICAgIC8vICAgICBpZiAocGFja2FnZURhdGEpIHtcclxuICAgICAgICAvLyAgICAgICAgIC8vIGNvbnNvbGUuZGlyKHBhY2thZ2VEYXRhLCB7IGRlcHRoOiBudWxsIH0pO1xyXG5cclxuICAgICAgICAvLyAgICAgICAgIGxldCByb290ID0gcGFja2FnZURhdGEucGFja2FnZURlc2NyaXB0aW9uIHx8IHt9O1xyXG4gICAgICAgIC8vICAgICAgICAgbGV0IHJlc291cmNlcyA9IHJvb3QucmVzb3VyY2VzIHx8IHt9O1xyXG4gICAgICAgIC8vICAgICAgICAgVG9vbHMuZm9yRWFjaE1hcChyZXNvdXJjZXMsICh0YWcsIGFycikgPT4ge1xyXG4gICAgICAgIC8vICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKGFycilcclxuICAgICAgICAvLyAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBjb25zdCB2ID0gYXJyW2ldO1xyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBpZiAodi5fYXR0cmlidXRlcy5leHBvcnRlZCA9PSBcInRydWVcIikge1xyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgbGV0IGZpbGVOYW1lID0gdi5fYXR0cmlidXRlcy5uYW1lO1xyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgZmlsZU5hbWUgPSBmaWxlTmFtZS5zdWJzdHJpbmcoMCwgZmlsZU5hbWUuaW5kZXhPZihcIi5cIikpXHJcblxyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCLotYTmupBcIiwgZmlsZU5hbWUpXHJcblxyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgbGV0IHVybCA9IFRvb2xzLmZvcm1hdChcInVpOi8vJXMvJXNcIiwgcGFja2FnZU5hbWUsIGZpbGVOYW1lKTtcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgIHRoaXMudXJsXzJfZXhpc3RzW3VybF0gPSB0cnVlO1xyXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgLy8gICAgICAgICAgICAgfVxyXG4gICAgICAgIC8vICAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gICAgIH1cclxuXHJcbiAgICAgICAgLy8gfSk7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUuZGlyKHRoaXMudXJsXzJfZXhpc3RzKVxyXG5cclxuXHJcbiAgICAgICAgLy8gMy4g5pS26ZuG5ZCE5Liq6KGo55qEbWFqb3JJZFxyXG4gICAgICAgIFRvb2xzLmZvckVhY2hNYXAoRGJFeHBvcnRlci5kYk5hbWVfMl9kYiwgKGRiTmFtZSwgZGIpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGlmICghcnVsZV8yX3ZhbGlkW2RiLnJ1bGVdKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLphY3nva7ooahbJXNdIOacquefpeinhOWIme+8mnJ1bGU9WyVzXe+8jOinhOWImemcgOimgeS4uu+8mm0sIG1hLCBtbSwgYeS4reeahOS4gOenjVwiLCBkYk5hbWUsIGRiLnJ1bGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgaWRfMl9leGlzdHMgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIGRiLmZvckRiKChkYXRhLCBtYWpvcklkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaWRfMl9leGlzdHNbbWFqb3JJZF0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIumFjee9ruihqFslc13kuK3lh7rnjrDph43lpI1pZO+8mlslc11cIiwgZGJOYW1lLCBtYWpvcklkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlkXzJfZXhpc3RzW21ham9ySWRdID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmRiTmFtZV8yX2lkRXhpc3RzW2RiTmFtZV0gPSBpZF8yX2V4aXN0cztcclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIC8vIDQuIOWkhOeQhmlkTWVyZ2VUb+eahOmAu+i+kVxyXG4gICAgICAgIFRvb2xzLmZvckVhY2hNYXAoRGJFeHBvcnRlci5kYk5hbWVfMl9kYiwgKGRiTmFtZSwgZGIpID0+IHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYi5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZGIuZmllbGRzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmlkTWVyZ2VUbykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLphY3nva7ooahbJXNdIElE5ZCI5bm25Yqf6IO944CQaWRNZXJnZVRv44CRIOWPquacieS4u2lk5a2X5q61WyVzXeiDvemFjee9rmlkTWVyZ2VUb++8geivt+WIoOmZpOWtl+autVslc13nmoRGTERfSURfTUVSR0VfVE/phY3nva7jgIJcIiwgZGJOYW1lLCBkYi5nZXRNYWpvcklkTmFtZSgpLCBmaWVsZC5uYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLndhcm4oXCJmaW5kIGlkTWVyZ2VUbyBkYk5hbWU9WyVzXSwgZmllbGQ9WyVzXSwgaWRNZXJnZVRvPVslc11cIiwgZGJOYW1lLCBmaWVsZC5uYW1lLCBmaWVsZC5pZE1lcmdlVG8pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0RGIgPSBEYkV4cG9ydGVyLmRiTmFtZV8yX2RiW2ZpZWxkLmlkTWVyZ2VUb107XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0YXJnZXREYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLphY3nva7ooahbJXNdIElE5ZCI5bm25Yqf6IO944CQaWRNZXJnZVRv44CRIOmFjee9rueahOebruagh+ihqFslc13kuI3lrZjlnKjvvIFcIiwgZGJOYW1lLCBmaWVsZC5pZE1lcmdlVG8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0YXJnZXRfaWRfMl9leGlzdHMgPSB0aGlzLmRiTmFtZV8yX2lkRXhpc3RzW3RhcmdldERiLm5hbWVdO1xyXG4gICAgICAgICAgICAgICAgICAgIGRiLmZvckRiKChkYXRhLCBtYWpvcklkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXRfaWRfMl9leGlzdHNbbWFqb3JJZF0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi6YWN572u6KGoWyVzXSBJROWQiOW5tuWKn+iDveOAkGlkTWVyZ2VUb+OAkSDnm67moIfphY3nva7ooahbJXNd5Lit5Ye6546w6YeN5aSNaWTvvJpbJXNdXCIsIGRiTmFtZSwgdGFyZ2V0RGIubmFtZSwgbWFqb3JJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0X2lkXzJfZXhpc3RzW21ham9ySWRdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9LCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIGNvbnNvbGUuZGlyKHRoaXMuZGJOYW1lXzJfaWRFeGlzdHMpXHJcblxyXG4gICAgICAgIC8vIDUuIOaUtumbhmFsdeS/oeaBr1xyXG4gICAgICAgIGxldCBhbHVfZGIgPSBEYkV4cG9ydGVyLmRiTmFtZV8yX2RiW1wib3JpZ2luX2FsdV9kYlwiXTtcclxuICAgICAgICB0aGlzLmFsdUlkXzJfZXhpc3RzID0ge307XHJcbiAgICAgICAgaWYgKGFsdV9kYikge1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhbHVfZGIpXHJcblxyXG4gICAgICAgICAgICBUb29scy5mb3JFYWNoTWFwKGFsdV9kYi5kYXRhcywgKGssIHYpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWx1SWRfMl9leGlzdHNba10gPSB0cnVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIDYuIOWkhOeQhuiHquWumuS5ieagoemqjOmAu+i+kVxyXG4gICAgICAgIFRvb2xzLmZvckVhY2hNYXAoRGJFeHBvcnRlci5kYk5hbWVfMl9kYiwgKGRiTmFtZSwgZGIpID0+IHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYi5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZGIuZmllbGRzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZmllbGQudmVyaWZ5ZXJzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZlcmlmeWVyID0gZmllbGQudmVyaWZ5ZXJzW2pdLnRvU3RyaW5nKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiZmlsZFwiLCBpLCBmaWVsZC5uYW1lLCBqLCB2ZXJpZnllcilcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5pu/5o2i5omA5pyJ56m65qC8XHJcbiAgICAgICAgICAgICAgICAgICAgdmVyaWZ5ZXIgPSB2ZXJpZnllci5yZXBsYWNlKC9cXHMrL2csIFwiXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgcGlwZWxpbmVzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIOW9k+WJjeaUr+aMgeeahOagvOW8j1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIDEuID0+77ya5YiG6ZqU56ymXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gMi4gZXF1YWxfbGVuKGlkKe+8muajgOafpeaVsOe7hOexu+Wei+aVsOaNrumVv+W6puaYr+WQpuS4gOiHtO+8mmVxdWFsX2xlbiglVEFSR0VUX0ZJRUxEX05BTUUlKVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIDMuIGl0ZW1fZGLvvJrmo4Dmn6XmlbDmja7mmK/lkKbkuLrmjIflrprphY3nva7ooajnmoTkuLvopoFpZO+8mmNoZWNrX21ham9yX2lkX2V4aXN0cyglVEFSR0VUX0RCX05BTUUlKSAtPiDnroDlhpnkuLogJVRBUkdFVF9EQl9OQU1FJVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIDQuIFVSTO+8muajgOafpei1hOa6kOaYr+WQpuWtmOWcqFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIDYuIGZvcu+8mumBjeWOhu+8jOWwhumBjeWOhue7k+aenOS8oOmAkue7meS4i+S4gOS4queuoee6v1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIDcuIFslSU5ERVhd77ya57Si5byVXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gOC4gaWbvvJrmoLnmja7ntKLlvJXliKTlrprmnaHku7bvvIzlj6rmnInmnaHku7bpgJrov4fmiY3ov5vlhaXkuIvkuIDkuKrnrqHnur8gaWYoWzBdID09IDApICAgICBpZihbMF0gPj0gNSkgICAgICAgIGlmKFtuYW1lXT09c3BpbmUpXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAg5pSv5oyB55qE56ym5Y+377yaICAgIOWtl+espuS4suWIpOaWre+8mls9PSwgIT1dIOaVsOWAvOWIpOaWre+8mls+LCA+PSwgPCwgPD1dXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIOeuoee6v+amguW/te+8jOavj+S4queuoee6v+acieiHquW3seeahOaVsOaNrlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIOS4vuS+i++8mnZlcmlmeWVyPSdVUkwnXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g6YCa6L+HPT7mi4bliIbvvIzlvpfliLDkuIDmnaEgdXJsUGlwZWxpbmVcclxuICAgICAgICAgICAgICAgICAgICAvLyDpgY3ljoblvZPliY3phY3nva7ooajmiYDmnIlkYXRhc++8jOaPkOWPluWvueW6lOeahGRhdGHvvIwgbGV0IG91dHB1dCA9IHVybFBpcGVsaW5lLmV4ZWN1dGUoZGF0YSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5L2/55So5YiG6ZqU56ym5ouG5YiGXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNtZHMgPSB2ZXJpZnllci5zcGxpdChcIj0+XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgY21kcy5sZW5ndGg7IGsrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY21kID0gY21kc1trXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwi6YWN572u6KGoWyVzXSDlvIDlkK/lrZfmrrXmoKHpqozjgIJmaWVsZD1bJXNdIHZlcmlmeWVyPSclcycgJWQ6ICclcydcIiwgZGJOYW1lLCBmaWVsZC5uYW1lLCB2ZXJpZnllciwgaywgY21kKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwaXBlbGluZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYk5vbkVtcHR5ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY21kLmVuZHNXaXRoKFwiIVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY21kID0gY21kLnN1YnN0cmluZygwLCBjbWQubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiTm9uRW1wdHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJmaW5kICFcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNtZC5zdGFydHNXaXRoKFwiZXF1YWxfbGVuXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaXBlbGluZSA9IG5ldyBQaXBlbGluZUVxdWFsTGVuKHRoaXMsIGRiLCBmaWVsZCwgdmVyaWZ5ZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmRiTmFtZV8yX2lkRXhpc3RzW2NtZF0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY21k5Li66KGo5ZCN77yM6aqM5pS25Li7aWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpcGVsaW5lID0gbmV3IFBpcGVsaW5lUmVmZXJlbmNlTWFqb3JJZCh0aGlzLCBkYiwgZmllbGQsIHZlcmlmeWVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY21kLnRvTG93ZXJDYXNlKCkgPT0gXCJ1cmxcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZWxpbmUgPSBuZXcgUGlwZWxpbmVVcmwodGhpcywgZGIsIGZpZWxkLCB2ZXJpZnllcik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNtZC50b0xvd2VyQ2FzZSgpID09IFwiYWx1X2V4cFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaXBlbGluZSA9IG5ldyBQaXBlbGluZUFsdUV4cCh0aGlzLCBkYiwgZmllbGQsIHZlcmlmeWVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY21kLnRvTG93ZXJDYXNlKCkgPT0gXCJmb3JcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZWxpbmUgPSBuZXcgUGlwZWxpbmVGb3IodGhpcywgZGIsIGZpZWxkLCB2ZXJpZnllcik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9pZlxcKFxcWyguKylcXF0oW1xcPlxcIVxcPVxcPF0rKShbXlxcKV0rKS8uZXhlYyhjbWQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaXBlbGluZSA9IG5ldyBQaXBlbGluZUlmKHRoaXMsIGRiLCBmaWVsZCwgdmVyaWZ5ZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXFxbKFteXFxdXSspXFxdLy5leGVjKGNtZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpcGVsaW5lID0gbmV3IFBpcGVsaW5lSW5kZXgodGhpcywgZGIsIGZpZWxkLCB2ZXJpZnllcik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi6YWN572u6KGoWyVzXSDlrZfmrrVbJXNdIHZlcmlmeWVy6Kej5p6Q6ZSZ6K+v77yMIOacquefpWNtZD0nJXMnXCIsIGRiTmFtZSwgZmllbGQubmFtZSwgY21kKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBpcGxlbGluZeS4gOS4queOr+iKguWHuumUme+8jOWQjue7remDveaciemXrumimO+8jOebtOaOpeS4reaWrVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZWxpbmVzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBpcGVsaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaXBlbGluZS5pbml0KGNtZCwgYk5vbkVtcHR5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpcGVsaW5lcy5wdXNoKHBpcGVsaW5lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5Liy6IGU566h57q/77yI5LiA5a6a6KaB5omn6KGM5LiA5qyh77yM55So5LqO5qOA5rWL5piv5ZCm5oul5pyJ5ZCO57ut566h57q/77yJXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwaXBlbGluZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHAxID0gcGlwZWxpbmVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcDIgPSBwaXBlbGluZXNbaSArIDFdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcDEuc2V0TmV4dFBpcGVsaW5lKHAyKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwMSA9IHBpcGVsaW5lc1swXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5omn6KGM5qCh6aqM566h57q/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRiLmZvckRiKChkYXRhLCBtYWpvcklkLCBtaW5vcklkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29udGV4dCA9IGRhdGFbcDEuZmllbGQubmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwMS5leGVjdXRlKGNvbnRleHQsIGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcblxyXG5cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coVG9vbHMuZm9ybWF0KFwiLS0tLS0tLS0tLS0tIOmFjee9ruihqOagoemqjOWujOavlSDlj5HnjrAlZOWkhOW8guW4uO+8jOeUqOaXtiVkbXMgLS0tLS0tLS0tLS0tXFxuXCIsIHRoaXMud2FybkNvdW50LCBUaW1lci50aW1lKCkgLSBiZWdpblRpbWUpKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgUGlwZWxpbmUge1xyXG4gICAgdmVyaWZ5ZXI7XHJcbiAgICBkYjtcclxuICAgIGZpZWxkO1xyXG4gICAgY21kO1xyXG4gICAgbmV4dFBpcGVsaW5lO1xyXG4gICAgb3JpZ2luVmVyaWZ5O1xyXG5cclxuICAgIGJOb25FbXB0eTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvciAodmVyaWZ5ZXIsIGRiLCBmaWVsZCwgb3JpZ2luVmVyaWZ5KSB7XHJcbiAgICAgICAgdGhpcy52ZXJpZnllciA9IHZlcmlmeWVyO1xyXG4gICAgICAgIHRoaXMuZGIgPSBkYjtcclxuICAgICAgICB0aGlzLmZpZWxkID0gZmllbGQ7XHJcbiAgICAgICAgdGhpcy5vcmlnaW5WZXJpZnkgPSBvcmlnaW5WZXJpZnk7XHJcbiAgICAgICAgdGhpcy5jbWQgPSBudWxsO1xyXG4gICAgICAgIHRoaXMubmV4dFBpcGVsaW5lID0gbnVsbDtcclxuICAgICAgICB0aGlzLmJOb25FbXB0eSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXQoY21kLCBiTm9uRW1wdHkpIHtcclxuICAgICAgICB0aGlzLmNtZCA9IGNtZDtcclxuICAgICAgICB0aGlzLmJOb25FbXB0eSA9ICEhYk5vbkVtcHR5XHJcbiAgICB9XHJcblxyXG4gICAgc2V0TmV4dFBpcGVsaW5lKHBpcGVsaW5lKSB7XHJcbiAgICAgICAgdGhpcy5uZXh0UGlwZWxpbmUgPSBwaXBlbGluZTtcclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlKGNvbnRleHQsIGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZm9ybWF0SWQobWFqb3JJZCwgbWlub3JJZCkge1xyXG4gICAgICAgIGxldCB0ZXh0ID0gXCJcIjtcclxuICAgICAgICBpZiAobWFqb3JJZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRleHQgKz0gXCJbXCIgKyBtYWpvcklkICsgXCJdXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG1pbm9ySWQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0ZXh0ICs9IFwiW1wiICsgbWlub3JJZCArIFwiXVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0ZXh0XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFBpcGVsaW5lRXF1YWxMZW4gZXh0ZW5kcyBQaXBlbGluZSB7XHJcbiAgICB0YXJnZXRGaWVsZE5hbWU7XHJcblxyXG4gICAgaW5pdChjbWQsIGJOb25FbXB0eSkge1xyXG4gICAgICAgIHN1cGVyLmluaXQoY21kLCBiTm9uRW1wdHkpO1xyXG5cclxuICAgICAgICBsZXQgcmV0ID0gL2VxdWFsX2xlblxcKChbXlxcKV0rKS8uZXhlYyhjbWQpO1xyXG4gICAgICAgIGlmIChyZXQgJiYgcmV0Lmxlbmd0aCA+PSAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0RmllbGROYW1lID0gcmV0WzFdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnRhcmdldEZpZWxkTmFtZSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIOWtl+autVslc10gdmVyaWZ5ZXLop6PmnpDplJnor6/vvIzjgJBlcXVhbF9sZW7jgJHnm67moIflrZfmrrXlkI3mnKrmib7liLDjgIJjbWQ9JyVzJ1wiLCB0aGlzLmRiLm5hbWUsIHRoaXMuZmllbGQubmFtZSwgY21kKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyDmo4Dmn6XlrZfmrrXlkI3lnKhkYuS4reaYr+WQpuWtmOWcqFxyXG4gICAgICAgICAgICBsZXQgYkV4aXN0cyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZGIuZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZCA9IHRoaXMuZGIuZmllbGRzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLm5hbWUgPT0gdGhpcy50YXJnZXRGaWVsZE5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBiRXhpc3RzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFiRXhpc3RzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIOWtl+autVslc10gdmVyaWZ5ZXLop6PmnpDplJnor6/vvIzjgJBlcXVhbF9sZW7jgJHnm67moIflrZfmrrXjgJAlc+OAkeS4jeWtmOWcqO+8gWNtZD0nJXMnXCIsIHRoaXMuZGIubmFtZSwgdGhpcy5maWVsZC5uYW1lLCB0aGlzLnRhcmdldEZpZWxkTmFtZSwgY21kKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0RmllbGROYW1lID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpIHtcclxuICAgICAgICBzdXBlci5zZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpO1xyXG5cclxuICAgICAgICAvLyDml6Dms5XkuLLogZRcclxuICAgICAgICBpZiAodGhpcy5uZXh0UGlwZWxpbmUpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSDlrZfmrrVbJXNdLnZlcmlmeWVyPSclcycgZXF1YWxfbGVu5LiN6IO95o6l5ZCO57ut5ZG95Luk44CCXCIsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9yaWdpblZlcmlmeSxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZShjb250ZXh0LCBkYXRhLCBtYWpvcklkLCBtaW5vcklkKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnRhcmdldEZpZWxkTmFtZSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyDmo4Dmn6XlvZPliY3lrZfmrrXmlbDmja7nsbvlnotcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY29udGV4dCkpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSBEQVRBJXMuJXM9JXPkuI3mmK/mlbDnu4TnsbvlnovvvIxlcXVhbF9sZW7moKHpqozlpLHotKVcIiwgdGhpcy5kYi5uYW1lLCB0aGlzLmZvcm1hdElkKG1ham9ySWQsIG1pbm9ySWQpLCB0aGlzLmZpZWxkLm5hbWUsIGNvbnRleHQpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyDmj5Dlj5bnm67moIfmlbDmja5cclxuICAgICAgICBsZXQgdGFyZ2V0RGF0YSA9IGRhdGFbdGhpcy50YXJnZXRGaWVsZE5hbWVdO1xyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0YXJnZXREYXRhKSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIERBVEElcy4lcz0lc+S4jeaYr+aVsOe7hOexu+Wei++8jGVxdWFsX2xlbuagoemqjOWksei0pVwiLCB0aGlzLmRiLm5hbWUsIHRoaXMuZm9ybWF0SWQobWFqb3JJZCwgbWlub3JJZCksIHRoaXMudGFyZ2V0RmllbGROYW1lLCB0YXJnZXREYXRhKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGNvbnRleHQubGVuZ3RoICE9IHRhcmdldERhdGEubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10gREFUQSVzLiVzPVslc10g5ZKMIERBVEElcy4lcz1bJXNd6ZW/5bqm5LiN5Yy56YWNXCIsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm1hdElkKG1ham9ySWQsIG1pbm9ySWQpLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5maWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgY29udGV4dCxcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9ybWF0SWQobWFqb3JJZCwgbWlub3JJZCksXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhcmdldEZpZWxkTmFtZSxcclxuICAgICAgICAgICAgICAgIHRhcmdldERhdGFcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgUGlwZWxpbmVSZWZlcmVuY2VNYWpvcklkIGV4dGVuZHMgUGlwZWxpbmUge1xyXG4gICAgdGFyZ2V0RGJOYW1lO1xyXG5cclxuICAgIGluaXQoY21kLCBiTm9uRW1wdHkpIHtcclxuICAgICAgICBzdXBlci5pbml0KGNtZCwgYk5vbkVtcHR5KTtcclxuXHJcbiAgICAgICAgdGhpcy50YXJnZXREYk5hbWUgPSBjbWQ7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy52ZXJpZnllci5kYk5hbWVfMl9pZEV4aXN0c1t0aGlzLnRhcmdldERiTmFtZV0pIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSDlrZfmrrVbJXNdIHZlcmlmeWVy6Kej5p6Q6ZSZ6K+v77yM55uu5qCH6KGoWyVzXeS4jeWtmOWcqOaIluino+aekOWksei0peOAgmNtZD0nJXMnXCIsIHRoaXMuZGIubmFtZSwgdGhpcy5maWVsZC5uYW1lLCB0aGlzLnRhcmdldERiTmFtZSwgY21kKTtcclxuICAgICAgICAgICAgdGhpcy50YXJnZXREYk5hbWUgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpIHtcclxuICAgICAgICBzdXBlci5zZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpO1xyXG5cclxuICAgICAgICAvLyDml6Dms5XkuLLogZRcclxuICAgICAgICBpZiAodGhpcy5uZXh0UGlwZWxpbmUpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSDlrZfmrrVbJXNdLnZlcmlmeWVyPSclcycgJXPkuI3og73mjqXlkI7nu63lkb3ku6TjgIJcIixcclxuICAgICAgICAgICAgICAgIHRoaXMuZGIubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luVmVyaWZ5LFxyXG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXREYk5hbWUsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4ZWN1dGUoY29udGV4dCwgZGF0YSwgbWFqb3JJZCwgbWlub3JJZCkge1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiUGlwZWxpbmVSZWZlcmVuY2VNYWpvcklkXCIsIHRoaXMuZGIubmFtZSwgdGhpcy5maWVsZC5uYW1lLCBtYWpvcklkLCBtaW5vcklkLCB0aGlzLmJOb25FbXB0eSlcclxuICAgICAgICBpZiAoIXRoaXMudGFyZ2V0RGJOYW1lKSByZXR1cm47XHJcbiAgICAgICAgaWYgKCF0aGlzLmJOb25FbXB0eSkge1xyXG4gICAgICAgICAgICBpZiAoY29udGV4dCA9PSBcIlwiIHx8IGNvbnRleHQgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGlkXzJfZXhpc3RzID0gdGhpcy52ZXJpZnllci5kYk5hbWVfMl9pZEV4aXN0c1t0aGlzLnRhcmdldERiTmFtZV07XHJcblxyXG4gICAgICAgIGlmIChpZF8yX2V4aXN0c1tjb250ZXh0XSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10gREFUQSVzLiVzPSclcycg5aSW6ZO+SUTmnKrmib7liLDvvJolc1slc11cIixcclxuICAgICAgICAgICAgICAgIHRoaXMuZGIubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9ybWF0SWQobWFqb3JJZCwgbWlub3JJZCksXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhW3RoaXMuZmllbGQubmFtZV0sXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhcmdldERiTmFtZSxcclxuICAgICAgICAgICAgICAgIGNvbnRleHQsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBQaXBlbGluZVVybCBleHRlbmRzIFBpcGVsaW5lIHtcclxuICAgIHNldE5leHRQaXBlbGluZShwaXBlbGluZSkge1xyXG4gICAgICAgIHN1cGVyLnNldE5leHRQaXBlbGluZShwaXBlbGluZSk7XHJcblxyXG4gICAgICAgIC8vIOaXoOazleS4suiBlFxyXG4gICAgICAgIGlmICh0aGlzLm5leHRQaXBlbGluZSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIOWtl+autVslc10udmVyaWZ5ZXI9JyVzJyBVUkzkuI3og73mjqXlkI7nu63lkb3ku6TjgIJcIixcclxuICAgICAgICAgICAgICAgIHRoaXMuZGIubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luVmVyaWZ5LFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlKGNvbnRleHQsIGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpIHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIuagoemqjHVybO+8mlwiLCBjb250ZXh0KTtcclxuICAgICAgICAvLyDkuI3moKHpqozmsqHmnInloavlhpnnmoTmg4XlhrVcclxuICAgICAgICBpZiAoY29udGV4dCA9PSBudWxsIHx8IGNvbnRleHQgPT09IFwiXCIpIHtcclxuICAgICAgICAgICAgLy8g6YWN572u5Li656m6XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmJOb25FbXB0eSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSBEQVRBJXMuJXM9JyVzJyB1cmzkuI3og73phY3nva7kuLrnqbrvvIFcIixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb3JtYXRJZChtYWpvcklkLCBtaW5vcklkKSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YVt0aGlzLmZpZWxkLm5hbWVdXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy52ZXJpZnllci51cmxfMl9leGlzdHNbY29udGV4dF0pIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSBEQVRBJXMuJXM9JyVzJyB1cmzmjIflkJHotYTmupBbJXNd5LiN5a2Y5Zyo5oiW5pyq5a+85Ye677yBXCIsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm1hdElkKG1ham9ySWQsIG1pbm9ySWQpLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5maWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgZGF0YVt0aGlzLmZpZWxkLm5hbWVdLFxyXG4gICAgICAgICAgICAgICAgY29udGV4dFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY29uc3QgQUxVX0VYUF9LRVlfV09SRFMgPSB7XHJcbiAgICBhbmQ6IHRydWUsXHJcbiAgICBvcjogdHJ1ZSxcclxuICAgIG5vdDogdHJ1ZSxcclxuICAgIHRydWU6IHRydWUsXHJcbiAgICBmYWxzZTogdHJ1ZSxcclxufVxyXG5cclxuY2xhc3MgUGlwZWxpbmVBbHVFeHAgZXh0ZW5kcyBQaXBlbGluZSB7XHJcbiAgICBzZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpIHtcclxuICAgICAgICBzdXBlci5zZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpO1xyXG5cclxuICAgICAgICAvLyDml6Dms5XkuLLogZRcclxuICAgICAgICBpZiAodGhpcy5uZXh0UGlwZWxpbmUpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSDlrZfmrrVbJXNdLnZlcmlmeWVyPSclcycgYWx1X2V4cOS4jeiDveaOpeWQjue7reWRveS7pOOAglwiLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5maWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5WZXJpZnksXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4ZWN1dGUoY29udGV4dCwgZGF0YSwgbWFqb3JJZCwgbWlub3JJZCkge1xyXG4gICAgICAgIC8vIOS4jeagoemqjOayoeacieWhq+WGmeeahOaDheWGtVxyXG4gICAgICAgIGlmIChjb250ZXh0ID09IG51bGwgfHwgY29udGV4dCA9PT0gXCJcIikgcmV0dXJuO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwi5qCh6aqMYWx1X2V4cFwiLCBjb250ZXh0KTtcclxuXHJcbiAgICAgICAgLy8g5oyJ54Wn56m65qC85ouG5YiGXHJcbiAgICAgICAgbGV0IGZpZWxkcyA9IGNvbnRleHQuc3BsaXQoXCIgXCIpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiZmllbGRzXCIsIGZpZWxkcylcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgZmllbGQgPSBmaWVsZHNbaV07XHJcblxyXG4gICAgICAgICAgICBsZXQgbG93ZXJGaWVsZCA9IGZpZWxkLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICAvLyDlhbPplK7or43lv73nlaVcclxuICAgICAgICAgICAgaWYgKEFMVV9FWFBfS0VZX1dPUkRTW2xvd2VyRmllbGRdKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIOWJqeS9meeahOaYr2FsdUlkXHJcbiAgICAgICAgICAgIGlmICghdGhpcy52ZXJpZnllci5hbHVJZF8yX2V4aXN0c1tmaWVsZF0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10gREFUQSVzLiVzPSclcycgYWx1SWRbJXNd5Zyob3JpZ2luX2FsdV9kYuS4reacquaJvuWIsO+8gVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGIubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvcm1hdElkKG1ham9ySWQsIG1pbm9ySWQpLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhW3RoaXMuZmllbGQubmFtZV0sXHJcbiAgICAgICAgICAgICAgICAgICAgZmllbGRcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFBpcGVsaW5lSW5kZXggZXh0ZW5kcyBQaXBlbGluZSB7XHJcbiAgICBrZXk7XHJcblxyXG4gICAgaW5pdChjbWQsIGJOb25FbXB0eSkge1xyXG4gICAgICAgIHN1cGVyLmluaXQoY21kLCBiTm9uRW1wdHkpO1xyXG5cclxuICAgICAgICBsZXQgcmV0ID0gL1xcWyhbXlxcXV0rKVxcXS8uZXhlYyhjbWQpO1xyXG4gICAgICAgIGlmICghcmV0IHx8ICFyZXRbMV0pIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSDlrZfmrrVbJXNdIHZlcmlmeWVy6Kej5p6Q6ZSZ6K+v77yM57Si5byV5ZG95Luk6Kej5p6Q6ZSZ6K+v44CCY21kPSclcyfjgIIgIHNhbXBsZe+8mlswXSBbbmFtZV0gW3R5cGVdXCIsIHRoaXMuZGIubmFtZSwgdGhpcy5maWVsZC5uYW1lLCBjbWQpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmtleSA9IHJldFsxXTtcclxuICAgIH1cclxuXHJcbiAgICBzZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpIHtcclxuICAgICAgICBzdXBlci5zZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpO1xyXG5cclxuICAgICAgICAvLyDpnIDopoHkuLLogZRcclxuICAgICAgICBpZiAoIXRoaXMubmV4dFBpcGVsaW5lKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10g5a2X5q61WyVzXS52ZXJpZnllcj0nJXMnICVz5LmL5ZCO6ZyA6KaB6L+e5o6l5YW25LuW5ZG95Luk44CCXCIsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9yaWdpblZlcmlmeSxcclxuICAgICAgICAgICAgICAgIHRoaXMuY21kLFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlKGNvbnRleHQsIGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpIHtcclxuICAgICAgICBpZiAoIXRoaXMua2V5KSByZXR1cm47XHJcbiAgICAgICAgaWYgKCFjb250ZXh0KSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICghKGNvbnRleHQgaW5zdGFuY2VvZiBPYmplY3QpKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10gREFUQSVzLiVzPSVzICVz57Si5byV5aSx6LSl77yMdHlwZW9mKCclcycpPSclcydcIixcclxuICAgICAgICAgICAgICAgIHRoaXMuZGIubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9ybWF0SWQobWFqb3JJZCwgbWlub3JJZCksXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhW3RoaXMuZmllbGQubmFtZV0sXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNtZCxcclxuICAgICAgICAgICAgICAgIGNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgY29udGV4dCxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiUGlwZWxpbmVJbmRleC5leGVjdXRlXCIsIHRoaXMuZGIubmFtZSwgdGhpcy5maWVsZC5uYW1lLCB0aGlzLmNtZCwgbWFqb3JJZCwgY29udGV4dCk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCIgIHR5cGVcIiwgY29udGV4dCBpbnN0YW5jZW9mIE9iamVjdCk7XHJcbiAgICAgICAgbGV0IHZhbHVlID0gY29udGV4dFt0aGlzLmtleV07XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm5leHRQaXBlbGluZSkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRQaXBlbGluZS5leGVjdXRlKHZhbHVlLCBkYXRhLCBtYWpvcklkLCBtaW5vcklkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFBpcGVsaW5lRm9yIGV4dGVuZHMgUGlwZWxpbmUge1xyXG4gICAgc2V0TmV4dFBpcGVsaW5lKHBpcGVsaW5lKSB7XHJcbiAgICAgICAgc3VwZXIuc2V0TmV4dFBpcGVsaW5lKHBpcGVsaW5lKTtcclxuXHJcbiAgICAgICAgLy8g6ZyA6KaB5Liy6IGUXHJcbiAgICAgICAgaWYgKCF0aGlzLm5leHRQaXBlbGluZSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIOWtl+autVslc10udmVyaWZ5ZXI9JyVzJyAlc+S5i+WQjumcgOimgei/nuaOpeWFtuS7luWRveS7pOOAglwiLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5maWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5WZXJpZnksXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNtZCxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZShjb250ZXh0LCBkYXRhLCBtYWpvcklkLCBtaW5vcklkKSB7XHJcbiAgICAgICAgaWYgKCFjb250ZXh0KSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICghKGNvbnRleHQgaW5zdGFuY2VvZiBPYmplY3QpKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10gREFUQSVzLiVzPSVzIHR5cGVvZignJXMnKT0nJXMn6YGN5Y6G5aSx6LSl77yM6ZyA6KaB5Li65pWw57uE5oiW5a+56LGh44CCXCIsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm1hdElkKG1ham9ySWQsIG1pbm9ySWQpLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5maWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgZGF0YVt0aGlzLmZpZWxkLm5hbWVdLFxyXG4gICAgICAgICAgICAgICAgY29udGV4dCxcclxuICAgICAgICAgICAgICAgIHR5cGVvZiBjb250ZXh0LFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5uZXh0UGlwZWxpbmUpIHtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY29udGV4dCkpIHtcclxuICAgICAgICAgICAgICAgIC8vIOaVsOe7hFxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250ZXh0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBjb250ZXh0W2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dFBpcGVsaW5lLmV4ZWN1dGUodmFsdWUsIGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIFRvb2xzLmZvckVhY2hNYXAoY29udGV4dCwgKGssIHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0UGlwZWxpbmUuZXhlY3V0ZSh2YWx1ZSwgZGF0YSwgbWFqb3JJZCwgbWlub3JJZCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgUGlwZWxpbmVJZiBleHRlbmRzIFBpcGVsaW5lIHtcclxuICAgIHN0YXRpYyBTWU1CT0xfMl9WQUlMRCA9IHtcclxuICAgICAgICBcIiE9XCI6IHRydWUsXHJcbiAgICAgICAgXCI9PVwiOiB0cnVlLFxyXG4gICAgICAgIFwiPFwiOiB0cnVlLFxyXG4gICAgICAgIFwiPD1cIjogdHJ1ZSxcclxuICAgICAgICBcIj5cIjogdHJ1ZSxcclxuICAgICAgICBcIj49XCI6IHRydWUsXHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIFNZTUJPTF8yX1JFUVVJUkVfTlVNID0ge1xyXG4gICAgICAgIFwiIT1cIjogZmFsc2UsXHJcbiAgICAgICAgXCI9PVwiOiBmYWxzZSxcclxuICAgICAgICBcIjxcIjogdHJ1ZSxcclxuICAgICAgICBcIjw9XCI6IHRydWUsXHJcbiAgICAgICAgXCI+XCI6IHRydWUsXHJcbiAgICAgICAgXCI+PVwiOiB0cnVlLFxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBTWU1CT0xfMl9IQU5ETEVSID0ge1xyXG4gICAgICAgIFwiIT1cIjogKGEsIGIpID0+IHsgcmV0dXJuIGEgIT0gYjsgfSxcclxuICAgICAgICBcIj09XCI6IChhLCBiKSA9PiB7IHJldHVybiBhID09IGI7IH0sXHJcbiAgICAgICAgXCI8XCI6IChhLCBiKSA9PiB7IHJldHVybiBhIDwgYjsgfSxcclxuICAgICAgICBcIjw9XCI6IChhLCBiKSA9PiB7IHJldHVybiBhIDw9IGI7IH0sXHJcbiAgICAgICAgXCI+XCI6IChhLCBiKSA9PiB7IHJldHVybiBhID4gYjsgfSxcclxuICAgICAgICBcIj49XCI6IChhLCBiKSA9PiB7IHJldHVybiBhID49IGI7IH0sXHJcbiAgICB9XHJcblxyXG4gICAga2V5O1xyXG4gICAgc3ltYm9sO1xyXG4gICAgdGFyZ2V0VmFsdWU7XHJcblxyXG4gICAgaW5pdChjbWQsIGJOb25FbXB0eSkge1xyXG4gICAgICAgIHN1cGVyLmluaXQoY21kLCBiTm9uRW1wdHkpO1xyXG5cclxuICAgICAgICBsZXQgcmV0ID0gL2lmXFwoXFxbKC4rKVxcXShbXFw+XFwhXFw9XFw8XSspKFteXFwpXSspLy5leGVjKGNtZCkgfHwgW107XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwicmV0XCIsIHJldClcclxuXHJcbiAgICAgICAgdGhpcy5rZXkgPSByZXRbMV07XHJcbiAgICAgICAgdGhpcy5zeW1ib2wgPSByZXRbMl07XHJcbiAgICAgICAgdGhpcy50YXJnZXRWYWx1ZSA9IHJldFszXTtcclxuXHJcbiAgICAgICAgLy8g55CG6K665LiK5LiN5Lya5a2Y5ZyocmV05Li656m655qE5oOF5Ya1XHJcbiAgICAgICAgaWYgKCF0aGlzLmtleSB8fCAhdGhpcy5zeW1ib2wgfHwgIXRoaXMudGFyZ2V0VmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSDlrZfmrrVbJXNdIHZlcmlmeWVy6Kej5p6Q6ZSZ6K+v77yMaWblkb3ku6Top6PmnpDplJnor6/jgIJjbWQ9JyVzJ+OAgiAgc2FtcGxl77yaWzBdIFtuYW1lXSBbdHlwZV1cIiwgdGhpcy5kYi5uYW1lLCB0aGlzLmZpZWxkLm5hbWUsIGNtZCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIOajgOafpXN5bWJvbFxyXG4gICAgICAgIGlmICghUGlwZWxpbmVJZi5TWU1CT0xfMl9WQUlMRFt0aGlzLnN5bWJvbF0pIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSDlrZfmrrVbJXNdIGlm5Yik5pat56ym5Y+3JyVzJ+S4jeWPr+eUqOOAguivt+S9v+eUqCE9LCA9PSwgPCwgPD0sID4sID495Lit55qE56ym5Y+344CCXCIsIHRoaXMuZGIubmFtZSwgdGhpcy5maWVsZC5uYW1lLCB0aGlzLnN5bWJvbCk7XHJcbiAgICAgICAgICAgIHRoaXMuc3ltYm9sID0gbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g5qOA5p+ldGFyZ2V0VmFsdWXnsbvlnotcclxuICAgICAgICBpZiAoUGlwZWxpbmVJZi5TWU1CT0xfMl9SRVFVSVJFX05VTVt0aGlzLnN5bWJvbF0pIHtcclxuICAgICAgICAgICAgLy8g5pWw5YC857G75Z6LXHJcbiAgICAgICAgICAgIGxldCBudW1iZXJ2YWx1ZSA9IHBhcnNlRmxvYXQodGhpcy50YXJnZXRWYWx1ZSk7XHJcbiAgICAgICAgICAgIGlmIChpc05hTihudW1iZXJ2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10g5a2X5q61WyVzXSBpZuWIpOaWrSclcyfvvIznm67moIflgLxbJXNd6ZyA6KaB5Li65pWw5a2X44CCXCIsIHRoaXMuZGIubmFtZSwgdGhpcy5maWVsZC5uYW1lLCB0aGlzLmNtZCwgdGhpcy50YXJnZXRWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhcmdldFZhbHVlID0gbnVsbDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0VmFsdWUgPSBudW1iZXJ2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0VmFsdWUgPSAodGhpcy50YXJnZXRWYWx1ZSB8fCBcIlwiKS50b1N0cmluZygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpIHtcclxuICAgICAgICBzdXBlci5zZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpO1xyXG5cclxuICAgICAgICAvLyDpnIDopoHkuLLogZRcclxuICAgICAgICBpZiAoIXRoaXMubmV4dFBpcGVsaW5lKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10g5a2X5q61WyVzXS52ZXJpZnllcj0nJXMnICVz5LmL5ZCO6ZyA6KaB6L+e5o6l5YW25LuW5ZG95Luk44CCXCIsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9yaWdpblZlcmlmeSxcclxuICAgICAgICAgICAgICAgIHRoaXMuY21kLFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlKGNvbnRleHQsIGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpIHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlBpcGVsaW5lSWYuZXhlY3V0ZVwiLCB0aGlzLmRiLm5hbWUsIHRoaXMuZmllbGQubmFtZSwgbWFqb3JJZCwgdGhpcy5rZXksIHRoaXMuc3ltYm9sLCB0aGlzLnRhcmdldFZhbHVlKTtcclxuICAgICAgICBpZiAoIWNvbnRleHQpIHJldHVybjtcclxuICAgICAgICBpZiAoIXRoaXMua2V5IHx8ICF0aGlzLnN5bWJvbCB8fCAhdGhpcy50YXJnZXRWYWx1ZSkgcmV0dXJuO1xyXG5cclxuXHJcbiAgICAgICAgaWYgKCEoY29udGV4dCBpbnN0YW5jZW9mIE9iamVjdCkpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSBEQVRBJXMuJXM9JXMgJXMgaWbliKTmlq3ntKLlvJXlpLHotKXvvIx0eXBlb2YoJyVzJyk9JyVzJ1wiLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtYXRJZChtYWpvcklkLCBtaW5vcklkKSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgIGRhdGFbdGhpcy5maWVsZC5uYW1lXSxcclxuICAgICAgICAgICAgICAgIHRoaXMuY21kLFxyXG4gICAgICAgICAgICAgICAgY29udGV4dCxcclxuICAgICAgICAgICAgICAgIHR5cGVvZiBjb250ZXh0LFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdmFsdWUgPSBjb250ZXh0W3RoaXMua2V5XTtcclxuICAgICAgICBpZiAoUGlwZWxpbmVJZi5TWU1CT0xfMl9SRVFVSVJFX05VTVt0aGlzLnN5bWJvbF0pIHtcclxuICAgICAgICAgICAgLy8g5pWw5YC857G75Z6LXHJcbiAgICAgICAgICAgIGxldCBudW1iZXJ2YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpO1xyXG4gICAgICAgICAgICBpZiAoaXNOYU4obnVtYmVydmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIERBVEElcy4lcz0nJXMnIGlm5Yik5patJyVzJ++8jCVzWyVzXT0nJXMn6ZyA6KaB5Li65pWw5a2X44CCXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm9ybWF0SWQobWFqb3JJZCwgbWlub3JJZCksXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbWQsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmtleSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG51bWJlcnZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFsdWUgPSAodmFsdWUgfHwgXCJcIikudG9TdHJpbmcoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBoYW5kbGVyID0gUGlwZWxpbmVJZi5TWU1CT0xfMl9IQU5ETEVSW3RoaXMuc3ltYm9sXTtcclxuICAgICAgICBpZiAoaGFuZGxlciBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmIChoYW5kbGVyKHZhbHVlLCB0aGlzLnRhcmdldFZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgLy8g6YCa6L+H77yM5ZCR5ZCO5Lyg6YCSXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5uZXh0UGlwZWxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHRQaXBlbGluZS5leGVjdXRlKGNvbnRleHQsIGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImhhbmRsZXIgbm90IGZ1bmN0aW9uP1wiLCB0aGlzLnN5bWJvbCwgaGFuZGxlcilcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59Il19