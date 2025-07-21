"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbBundleVerifyer = void 0;
const path_1 = __importDefault(require("path"));
const timer_1 = __importDefault(require("../utils/timer"));
const tools_1 = __importDefault(require("../utils/tools"));
class DbBundleVerifyer {
    constructor(exporter) {
        this.exporter = exporter;
        this.warnCount = 0;
        this.dbName_2_idExists = {};
        /**
         * 资源路径是否找到
         */
        this.url_2_exists = {};
    }
    warn(text) {
        this.warnCount++;
        console.warn("[警告]", text);
    }
    verifyDb() {
        const bundleName = this.exporter.bundleName;
        console.log("\n---------------------- 开始校验配置表[" + bundleName + "] ----------------------");
        this.dbName_2_idExists = {};
        this.warnCount = 0;
        let beginTime = timer_1.default.time();
        let rule_2_valid = {
            m: true,
            ma: true,
            mm: true,
            a: true,
        };
        const dbName_2_db = this.exporter.dbName_2_db;
        // 1. 打印配置表自身的loading警告
        tools_1.default.forEachMap(dbName_2_db, (dbName, db) => {
            for (let i = 0; i < db.warnLog.length; i++) {
                const text = db.warnLog[i];
                this.warn(text);
            }
        });
        this.url_2_exists = {};
        let resourcesRootDir = path_1.default.join(Editor.Project.path, "assets", "resources");
        if (bundleName != 'resources') {
            //只检查当前bundle的资源
            resourcesRootDir = path_1.default.join(Editor.Project.path, "assets", "bundles", bundleName);
        }
        tools_1.default.foreachDir(resourcesRootDir, (filePath) => {
            // 忽略meta
            if (filePath.endsWith(".meta"))
                return false;
            let relativePath = path_1.default.relative(resourcesRootDir, filePath);
            let withoutExtPath = relativePath.substring(0, relativePath.indexOf("."));
            let unixStylePath = withoutExtPath.replace(/\\/g, "/");
            this.url_2_exists[unixStylePath] = true;
        });
        // 3. 收集各个表的majorId
        tools_1.default.forEachMap(dbName_2_db, (dbName, db) => {
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
        tools_1.default.forEachMap(dbName_2_db, (dbName, db) => {
            for (let i = 0; i < db.fields.length; i++) {
                const field = db.fields[i];
                if (field.idMergeTo) {
                    if (i > 0) {
                        console.warn("配置表[%s] ID合并功能【idMergeTo】 只有主id字段[%s]能配置idMergeTo！请删除字段[%s]的FLD_ID_MERGE_TO配置。", dbName, db.getMajorIdName(), field.name);
                        continue;
                    }
                    let targetDb = dbName_2_db[field.idMergeTo];
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
        // 5. 收集alu信息
        let alu_db = dbName_2_db["origin_alu_db"];
        this.aluId_2_exists = {};
        if (alu_db) {
            // console.log(alu_db)
            tools_1.default.forEachMap(alu_db.datas, (k, v) => {
                this.aluId_2_exists[k] = true;
            });
        }
        // 6. 处理自定义校验逻辑
        tools_1.default.forEachMap(dbName_2_db, (dbName, db) => {
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
exports.DbBundleVerifyer = DbBundleVerifyer;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGItYnVuZGxlLXZlcmlmeWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2RiX2J1bmRsZV9leHBvcnRlci9kYi1idW5kbGUtdmVyaWZ5ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDJEQUFtQztBQUNuQywyREFBbUM7QUFJbkMsTUFBYSxnQkFBZ0I7SUFZekIsWUFBbUIsUUFBMkI7UUFBM0IsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7UUFWdEMsY0FBUyxHQUFhLENBQUMsQ0FBQztRQUV4QixzQkFBaUIsR0FBaUMsRUFBRSxDQUFDO1FBRzdEOztXQUVHO1FBQ0ssaUJBQVksR0FBZ0MsRUFBRSxDQUFDO0lBSXZELENBQUM7SUFHTyxJQUFJLENBQUMsSUFBYTtRQUN0QixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDakIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVNLFFBQVE7UUFDWCxNQUFNLFVBQVUsR0FBTSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztRQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxHQUFHLFVBQVUsR0FBRywwQkFBMEIsQ0FBQyxDQUFDO1FBQzNGLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7UUFDNUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFFbkIsSUFBSSxTQUFTLEdBQUcsZUFBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBRTdCLElBQUksWUFBWSxHQUFHO1lBQ2YsQ0FBQyxFQUFFLElBQUk7WUFDUCxFQUFFLEVBQUUsSUFBSTtZQUNSLEVBQUUsRUFBRSxJQUFJO1lBQ1IsQ0FBQyxFQUFFLElBQUk7U0FDVixDQUFBO1FBQ0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUM7UUFDOUMsdUJBQXVCO1FBQ3ZC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QUUsSUFBSTtJQUNWLEdBQUcsRUFBRSxJQUFJO0lBQ1QsSUFBSSxFQUFFLElBQUk7Q0FDYixDQUFBO0FBRU0sK0JBQW9CLEdBQUc7SUFDMUIsSUFBSSxFQUFFLEtBQUs7SUFDWCxJQUFJLEVBQUUsS0FBSztJQUNYLEdBQUcsRUFBRSxJQUFJO0lBQ1QsSUFBSSxFQUFFLElBQUk7SUFDVixHQUFHLEVBQUUsSUFBSTtJQUNULElBQUksRUFBRSxJQUFJO0NBQ2IsQ0FBQTtBQUVNLDJCQUFnQixHQUFHO0lBQ3RCLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3JDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgVGltZXIgZnJvbSBcIi4uL3V0aWxzL3RpbWVyXCI7XHJcbmltcG9ydCBUb29scyBmcm9tIFwiLi4vdXRpbHMvdG9vbHNcIjtcclxuaW1wb3J0IERiQnVuZGxlRXhwb3J0ZXIgZnJvbSBcIi4vZGItYnVuZGxlLWV4cG9ydGVyXCI7XHJcbmltcG9ydCB7IERiQnVuZGxlRGF0YUJhc2UgfSBmcm9tIFwiLi9kYi1idW5kbGUtZGF0YS1iYXNlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRGJCdW5kbGVWZXJpZnllciB7XHJcblxyXG4gICAgcHJpdmF0ZSB3YXJuQ291bnQgOiBudW1iZXIgID0gMDtcclxuXHJcbiAgICBwcml2YXRlIGRiTmFtZV8yX2lkRXhpc3RzIDoge1tkYk5hbWUgOiBzdHJpbmddIDogYW55fSAgID0ge307XHJcblxyXG4gICAgcHJpdmF0ZSBhbHVJZF8yX2V4aXN0cztcclxuICAgIC8qKlxyXG4gICAgICog6LWE5rqQ6Lev5b6E5piv5ZCm5om+5YiwXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgdXJsXzJfZXhpc3RzIDoge1t1cmwgOiBzdHJpbmddIDogYm9vbGVhbn0gPSB7fTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZXhwb3J0ZXIgOiBEYkJ1bmRsZUV4cG9ydGVyKXtcclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgd2Fybih0ZXh0IDogc3RyaW5nKXtcclxuICAgICAgICB0aGlzLndhcm5Db3VudCsrO1xyXG4gICAgICAgIGNvbnNvbGUud2FybihcIlvorablkYpdXCIsdGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZlcmlmeURiKCl7XHJcbiAgICAgICAgY29uc3QgYnVuZGxlTmFtZSAgICA9IHRoaXMuZXhwb3J0ZXIuYnVuZGxlTmFtZTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlxcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0g5byA5aeL5qCh6aqM6YWN572u6KGoW1wiICsgYnVuZGxlTmFtZSArIFwiXSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tXCIpO1xyXG4gICAgICAgIHRoaXMuZGJOYW1lXzJfaWRFeGlzdHMgPSB7fTtcclxuICAgICAgICB0aGlzLndhcm5Db3VudCA9IDA7XHJcblxyXG4gICAgICAgIGxldCBiZWdpblRpbWUgPSBUaW1lci50aW1lKCk7XHJcblxyXG4gICAgICAgIGxldCBydWxlXzJfdmFsaWQgPSB7XHJcbiAgICAgICAgICAgIG06IHRydWUsXHJcbiAgICAgICAgICAgIG1hOiB0cnVlLFxyXG4gICAgICAgICAgICBtbTogdHJ1ZSxcclxuICAgICAgICAgICAgYTogdHJ1ZSxcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZGJOYW1lXzJfZGIgPSB0aGlzLmV4cG9ydGVyLmRiTmFtZV8yX2RiO1xyXG4gICAgICAgIC8vIDEuIOaJk+WNsOmFjee9ruihqOiHqui6q+eahGxvYWRpbmforablkYpcclxuICAgICAgICBUb29scy5mb3JFYWNoTWFwKGRiTmFtZV8yX2RiLCAoZGJOYW1lLCBkYikgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRiLndhcm5Mb2cubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBkYi53YXJuTG9nW2ldO1xyXG4gICAgICAgICAgICAgICAgdGhpcy53YXJuKHRleHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy51cmxfMl9leGlzdHMgPSB7fTtcclxuICAgICAgICBsZXQgcmVzb3VyY2VzUm9vdERpciA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcImFzc2V0c1wiLCBcInJlc291cmNlc1wiKTtcclxuICAgICAgICBpZihidW5kbGVOYW1lICE9ICdyZXNvdXJjZXMnKXtcclxuICAgICAgICAgICAgLy/lj6rmo4Dmn6XlvZPliY1idW5kbGXnmoTotYTmupBcclxuICAgICAgICAgICAgcmVzb3VyY2VzUm9vdERpciA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcImFzc2V0c1wiLCBcImJ1bmRsZXNcIiwgYnVuZGxlTmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFRvb2xzLmZvcmVhY2hEaXIocmVzb3VyY2VzUm9vdERpciwgKGZpbGVQYXRoIDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIOW/veeVpW1ldGFcclxuICAgICAgICAgICAgaWYgKGZpbGVQYXRoLmVuZHNXaXRoKFwiLm1ldGFcIikpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgbGV0IHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUocmVzb3VyY2VzUm9vdERpciwgZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICBsZXQgd2l0aG91dEV4dFBhdGggPSByZWxhdGl2ZVBhdGguc3Vic3RyaW5nKDAsIHJlbGF0aXZlUGF0aC5pbmRleE9mKFwiLlwiKSk7XHJcbiAgICAgICAgICAgIGxldCB1bml4U3R5bGVQYXRoID0gd2l0aG91dEV4dFBhdGgucmVwbGFjZSgvXFxcXC9nLCBcIi9cIik7XHJcbiAgICAgICAgICAgIHRoaXMudXJsXzJfZXhpc3RzW3VuaXhTdHlsZVBhdGhdID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyAzLiDmlLbpm4blkITkuKrooajnmoRtYWpvcklkXHJcbiAgICAgICAgVG9vbHMuZm9yRWFjaE1hcChkYk5hbWVfMl9kYiwgKGRiTmFtZSA6IHN0cmluZywgZGIgOiBEYkJ1bmRsZURhdGFCYXNlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghcnVsZV8yX3ZhbGlkW2RiLnJ1bGVdKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLphY3nva7ooahbJXNdIOacquefpeinhOWIme+8mnJ1bGU9WyVzXe+8jOinhOWImemcgOimgeS4uu+8mm0sIG1hLCBtbSwgYeS4reeahOS4gOenjVwiLCBkYk5hbWUsIGRiLnJ1bGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBpZF8yX2V4aXN0cyA9IHt9O1xyXG4gICAgICAgICAgICBkYi5mb3JEYigoZGF0YSxtYWpvcklkKT0+e1xyXG4gICAgICAgICAgICAgICAgaWYgKGlkXzJfZXhpc3RzW21ham9ySWRdICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLphY3nva7ooahbJXNd5Lit5Ye6546w6YeN5aSNaWTvvJpbJXNdXCIsIGRiTmFtZSwgbWFqb3JJZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZF8yX2V4aXN0c1ttYWpvcklkXSA9IHRydWU7XHJcbiAgICAgICAgICAgIH0sdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmRiTmFtZV8yX2lkRXhpc3RzW2RiTmFtZV0gPSBpZF8yX2V4aXN0cztcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyA0LiDlpITnkIZpZE1lcmdlVG/nmoTpgLvovpFcclxuICAgICAgICBUb29scy5mb3JFYWNoTWFwKGRiTmFtZV8yX2RiLCAoZGJOYW1lIDogc3RyaW5nLCBkYiA6IERiQnVuZGxlRGF0YUJhc2UpID0+IHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYi5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gZGIuZmllbGRzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLmlkTWVyZ2VUbykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLphY3nva7ooahbJXNdIElE5ZCI5bm25Yqf6IO944CQaWRNZXJnZVRv44CRIOWPquacieS4u2lk5a2X5q61WyVzXeiDvemFjee9rmlkTWVyZ2VUb++8geivt+WIoOmZpOWtl+autVslc13nmoRGTERfSURfTUVSR0VfVE/phY3nva7jgIJcIiwgZGJOYW1lLCBkYi5nZXRNYWpvcklkTmFtZSgpLCBmaWVsZC5uYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0YXJnZXREYiA9IGRiTmFtZV8yX2RiW2ZpZWxkLmlkTWVyZ2VUb107XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0YXJnZXREYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLphY3nva7ooahbJXNdIElE5ZCI5bm25Yqf6IO944CQaWRNZXJnZVRv44CRIOmFjee9rueahOebruagh+ihqFslc13kuI3lrZjlnKjvvIFcIiwgZGJOYW1lLCBmaWVsZC5pZE1lcmdlVG8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRhcmdldF9pZF8yX2V4aXN0cyA9IHRoaXMuZGJOYW1lXzJfaWRFeGlzdHNbdGFyZ2V0RGIubmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgZGIuZm9yRGIoKGRhdGEsIG1ham9ySWQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldF9pZF8yX2V4aXN0c1ttYWpvcklkXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLphY3nva7ooahbJXNdIElE5ZCI5bm25Yqf6IO944CQaWRNZXJnZVRv44CRIOebruagh+mFjee9ruihqFslc13kuK3lh7rnjrDph43lpI1pZO+8mlslc11cIiwgZGJOYW1lLCB0YXJnZXREYi5uYW1lLCBtYWpvcklkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRfaWRfMl9leGlzdHNbbWFqb3JJZF0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIDUuIOaUtumbhmFsdeS/oeaBr1xyXG4gICAgICAgIGxldCBhbHVfZGIgPSBkYk5hbWVfMl9kYltcIm9yaWdpbl9hbHVfZGJcIl07XHJcbiAgICAgICAgdGhpcy5hbHVJZF8yX2V4aXN0cyA9IHt9O1xyXG4gICAgICAgIGlmIChhbHVfZGIpIHtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYWx1X2RiKVxyXG5cclxuICAgICAgICAgICAgVG9vbHMuZm9yRWFjaE1hcChhbHVfZGIuZGF0YXMsIChrLCB2KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsdUlkXzJfZXhpc3RzW2tdID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyA2LiDlpITnkIboh6rlrprkuYnmoKHpqozpgLvovpFcclxuICAgICAgICBUb29scy5mb3JFYWNoTWFwKGRiTmFtZV8yX2RiLCAoZGJOYW1lLCBkYikgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRiLmZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQgPSBkYi5maWVsZHNbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBmaWVsZC52ZXJpZnllcnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmVyaWZ5ZXIgPSBmaWVsZC52ZXJpZnllcnNbal0udG9TdHJpbmcoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJmaWxkXCIsIGksIGZpZWxkLm5hbWUsIGosIHZlcmlmeWVyKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyDmm7/mjaLmiYDmnInnqbrmoLxcclxuICAgICAgICAgICAgICAgICAgICB2ZXJpZnllciA9IHZlcmlmeWVyLnJlcGxhY2UoL1xccysvZywgXCJcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwaXBlbGluZXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5b2T5YmN5pSv5oyB55qE5qC85byPXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gMS4gPT7vvJrliIbpmpTnrKZcclxuICAgICAgICAgICAgICAgICAgICAvLyAyLiBlcXVhbF9sZW4oaWQp77ya5qOA5p+l5pWw57uE57G75Z6L5pWw5o2u6ZW/5bqm5piv5ZCm5LiA6Ie077yaZXF1YWxfbGVuKCVUQVJHRVRfRklFTERfTkFNRSUpXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gMy4gaXRlbV9kYu+8muajgOafpeaVsOaNruaYr+WQpuS4uuaMh+WumumFjee9ruihqOeahOS4u+imgWlk77yaY2hlY2tfbWFqb3JfaWRfZXhpc3RzKCVUQVJHRVRfREJfTkFNRSUpIC0+IOeugOWGmeS4uiAlVEFSR0VUX0RCX05BTUUlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gNC4gVVJM77ya5qOA5p+l6LWE5rqQ5piv5ZCm5a2Y5ZyoXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gNi4gZm9y77ya6YGN5Y6G77yM5bCG6YGN5Y6G57uT5p6c5Lyg6YCS57uZ5LiL5LiA5Liq566h57q/XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gNy4gWyVJTkRFWF3vvJrntKLlvJVcclxuICAgICAgICAgICAgICAgICAgICAvLyA4LiBpZu+8muagueaNrue0ouW8leWIpOWumuadoeS7tu+8jOWPquacieadoeS7tumAmui/h+aJjei/m+WFpeS4i+S4gOS4queuoee6vyBpZihbMF0gPT0gMCkgICAgIGlmKFswXSA+PSA1KSAgICAgICAgaWYoW25hbWVdPT1zcGluZSlcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICDmlK/mjIHnmoTnrKblj7fvvJogICAg5a2X56ym5Liy5Yik5pat77yaWz09LCAhPV0g5pWw5YC85Yik5pat77yaWz4sID49LCA8LCA8PV1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g566h57q/5qaC5b+177yM5q+P5Liq566h57q/5pyJ6Ieq5bex55qE5pWw5o2uXHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5Li+5L6L77yadmVyaWZ5ZXI9J1VSTCdcclxuICAgICAgICAgICAgICAgICAgICAvLyDpgJrov4c9PuaLhuWIhu+8jOW+l+WIsOS4gOadoSB1cmxQaXBlbGluZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIOmBjeWOhuW9k+WJjemFjee9ruihqOaJgOaciWRhdGFz77yM5o+Q5Y+W5a+55bqU55qEZGF0Ye+8jCBsZXQgb3V0cHV0ID0gdXJsUGlwZWxpbmUuZXhlY3V0ZShkYXRhKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyDkvb/nlKjliIbpmpTnrKbmi4bliIZcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY21kcyA9IHZlcmlmeWVyLnNwbGl0KFwiPT5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBjbWRzLmxlbmd0aDsgaysrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjbWQgPSBjbWRzW2tdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCLphY3nva7ooahbJXNdIOW8gOWQr+Wtl+auteagoemqjOOAgmZpZWxkPVslc10gdmVyaWZ5ZXI9JyVzJyAlZDogJyVzJ1wiLCBkYk5hbWUsIGZpZWxkLm5hbWUsIHZlcmlmeWVyLCBrLCBjbWQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBpcGVsaW5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBiTm9uRW1wdHkgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbWQuZW5kc1dpdGgoXCIhXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbWQgPSBjbWQuc3Vic3RyaW5nKDAsIGNtZC5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJOb25FbXB0eSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImZpbmQgIVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY21kLnN0YXJ0c1dpdGgoXCJlcXVhbF9sZW5cIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpcGVsaW5lID0gbmV3IFBpcGVsaW5lRXF1YWxMZW4odGhpcywgZGIsIGZpZWxkLCB2ZXJpZnllcik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZGJOYW1lXzJfaWRFeGlzdHNbY21kXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjbWTkuLrooajlkI3vvIzpqozmlLbkuLtpZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZWxpbmUgPSBuZXcgUGlwZWxpbmVSZWZlcmVuY2VNYWpvcklkKHRoaXMsIGRiLCBmaWVsZCwgdmVyaWZ5ZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjbWQudG9Mb3dlckNhc2UoKSA9PSBcInVybFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaXBlbGluZSA9IG5ldyBQaXBlbGluZVVybCh0aGlzLCBkYiwgZmllbGQsIHZlcmlmeWVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY21kLnRvTG93ZXJDYXNlKCkgPT0gXCJhbHVfZXhwXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpcGVsaW5lID0gbmV3IFBpcGVsaW5lQWx1RXhwKHRoaXMsIGRiLCBmaWVsZCwgdmVyaWZ5ZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjbWQudG9Mb3dlckNhc2UoKSA9PSBcImZvclwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaXBlbGluZSA9IG5ldyBQaXBlbGluZUZvcih0aGlzLCBkYiwgZmllbGQsIHZlcmlmeWVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoL2lmXFwoXFxbKC4rKVxcXShbXFw+XFwhXFw9XFw8XSspKFteXFwpXSspLy5leGVjKGNtZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpcGVsaW5lID0gbmV3IFBpcGVsaW5lSWYodGhpcywgZGIsIGZpZWxkLCB2ZXJpZnllcik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9cXFsoW15cXF1dKylcXF0vLmV4ZWMoY21kKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZWxpbmUgPSBuZXcgUGlwZWxpbmVJbmRleCh0aGlzLCBkYiwgZmllbGQsIHZlcmlmeWVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLphY3nva7ooahbJXNdIOWtl+autVslc10gdmVyaWZ5ZXLop6PmnpDplJnor6/vvIwg5pyq55+lY21kPSclcydcIiwgZGJOYW1lLCBmaWVsZC5uYW1lLCBjbWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGlwbGVsaW5l5LiA5Liq546v6IqC5Ye66ZSZ77yM5ZCO57ut6YO95pyJ6Zeu6aKY77yM55u05o6l5Lit5patXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaXBlbGluZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGlwZWxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpcGVsaW5lLmluaXQoY21kLCBiTm9uRW1wdHkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZWxpbmVzLnB1c2gocGlwZWxpbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyDkuLLogZTnrqHnur/vvIjkuIDlrpropoHmiafooYzkuIDmrKHvvIznlKjkuo7mo4DmtYvmmK/lkKbmi6XmnInlkI7nu63nrqHnur/vvIlcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBpcGVsaW5lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcDEgPSBwaXBlbGluZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwMiA9IHBpcGVsaW5lc1tpICsgMV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwMS5zZXROZXh0UGlwZWxpbmUocDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHAxID0gcGlwZWxpbmVzWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmiafooYzmoKHpqoznrqHnur9cclxuICAgICAgICAgICAgICAgICAgICAgICAgZGIuZm9yRGIoKGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjb250ZXh0ID0gZGF0YVtwMS5maWVsZC5uYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAxLmV4ZWN1dGUoY29udGV4dCwgZGF0YSwgbWFqb3JJZCwgbWlub3JJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcblxyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhUb29scy5mb3JtYXQoXCItLS0tLS0tLS0tLS0g6YWN572u6KGo5qCh6aqM5a6M5q+VIOWPkeeOsCVk5aSE5byC5bi477yM55So5pe2JWRtcyAtLS0tLS0tLS0tLS1cXG5cIiwgdGhpcy53YXJuQ291bnQsIFRpbWVyLnRpbWUoKSAtIGJlZ2luVGltZSkpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBQaXBlbGluZSB7XHJcbiAgICB2ZXJpZnllcjtcclxuICAgIGRiO1xyXG4gICAgZmllbGQ7XHJcbiAgICBjbWQ7XHJcbiAgICBuZXh0UGlwZWxpbmU7XHJcbiAgICBvcmlnaW5WZXJpZnk7XHJcblxyXG4gICAgYk5vbkVtcHR5O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yICh2ZXJpZnllciwgZGIsIGZpZWxkLCBvcmlnaW5WZXJpZnkpIHtcclxuICAgICAgICB0aGlzLnZlcmlmeWVyID0gdmVyaWZ5ZXI7XHJcbiAgICAgICAgdGhpcy5kYiA9IGRiO1xyXG4gICAgICAgIHRoaXMuZmllbGQgPSBmaWVsZDtcclxuICAgICAgICB0aGlzLm9yaWdpblZlcmlmeSA9IG9yaWdpblZlcmlmeTtcclxuICAgICAgICB0aGlzLmNtZCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5uZXh0UGlwZWxpbmUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuYk5vbkVtcHR5ID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdChjbWQsIGJOb25FbXB0eSkge1xyXG4gICAgICAgIHRoaXMuY21kID0gY21kO1xyXG4gICAgICAgIHRoaXMuYk5vbkVtcHR5ID0gISFiTm9uRW1wdHlcclxuICAgIH1cclxuXHJcbiAgICBzZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpIHtcclxuICAgICAgICB0aGlzLm5leHRQaXBlbGluZSA9IHBpcGVsaW5lO1xyXG4gICAgfVxyXG5cclxuICAgIGV4ZWN1dGUoY29udGV4dCwgZGF0YSwgbWFqb3JJZCwgbWlub3JJZCkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBmb3JtYXRJZChtYWpvcklkLCBtaW5vcklkKSB7XHJcbiAgICAgICAgbGV0IHRleHQgPSBcIlwiO1xyXG4gICAgICAgIGlmIChtYWpvcklkICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGV4dCArPSBcIltcIiArIG1ham9ySWQgKyBcIl1cIlxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobWlub3JJZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRleHQgKz0gXCJbXCIgKyBtaW5vcklkICsgXCJdXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRleHRcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgUGlwZWxpbmVFcXVhbExlbiBleHRlbmRzIFBpcGVsaW5lIHtcclxuICAgIHRhcmdldEZpZWxkTmFtZTtcclxuXHJcbiAgICBpbml0KGNtZCwgYk5vbkVtcHR5KSB7XHJcbiAgICAgICAgc3VwZXIuaW5pdChjbWQsIGJOb25FbXB0eSk7XHJcblxyXG4gICAgICAgIGxldCByZXQgPSAvZXF1YWxfbGVuXFwoKFteXFwpXSspLy5leGVjKGNtZCk7XHJcbiAgICAgICAgaWYgKHJldCAmJiByZXQubGVuZ3RoID49IDEpIHtcclxuICAgICAgICAgICAgdGhpcy50YXJnZXRGaWVsZE5hbWUgPSByZXRbMV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMudGFyZ2V0RmllbGROYW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10g5a2X5q61WyVzXSB2ZXJpZnllcuino+aekOmUmeivr++8jOOAkGVxdWFsX2xlbuOAkeebruagh+Wtl+auteWQjeacquaJvuWIsOOAgmNtZD0nJXMnXCIsIHRoaXMuZGIubmFtZSwgdGhpcy5maWVsZC5uYW1lLCBjbWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIOajgOafpeWtl+auteWQjeWcqGRi5Lit5piv5ZCm5a2Y5ZyoXHJcbiAgICAgICAgICAgIGxldCBiRXhpc3RzID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5kYi5maWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkID0gdGhpcy5kYi5maWVsZHNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQubmFtZSA9PSB0aGlzLnRhcmdldEZpZWxkTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJFeGlzdHMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWJFeGlzdHMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10g5a2X5q61WyVzXSB2ZXJpZnllcuino+aekOmUmeivr++8jOOAkGVxdWFsX2xlbuOAkeebruagh+Wtl+auteOAkCVz44CR5LiN5a2Y5Zyo77yBY21kPSclcydcIiwgdGhpcy5kYi5uYW1lLCB0aGlzLmZpZWxkLm5hbWUsIHRoaXMudGFyZ2V0RmllbGROYW1lLCBjbWQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXRGaWVsZE5hbWUgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldE5leHRQaXBlbGluZShwaXBlbGluZSkge1xyXG4gICAgICAgIHN1cGVyLnNldE5leHRQaXBlbGluZShwaXBlbGluZSk7XHJcblxyXG4gICAgICAgIC8vIOaXoOazleS4suiBlFxyXG4gICAgICAgIGlmICh0aGlzLm5leHRQaXBlbGluZSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIOWtl+autVslc10udmVyaWZ5ZXI9JyVzJyBlcXVhbF9sZW7kuI3og73mjqXlkI7nu63lkb3ku6TjgIJcIixcclxuICAgICAgICAgICAgICAgIHRoaXMuZGIubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luVmVyaWZ5LFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlKGNvbnRleHQsIGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpIHtcclxuICAgICAgICBpZiAoIXRoaXMudGFyZ2V0RmllbGROYW1lKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIOajgOafpeW9k+WJjeWtl+auteaVsOaNruexu+Wei1xyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShjb250ZXh0KSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIERBVEElcy4lcz0lc+S4jeaYr+aVsOe7hOexu+Wei++8jGVxdWFsX2xlbuagoemqjOWksei0pVwiLCB0aGlzLmRiLm5hbWUsIHRoaXMuZm9ybWF0SWQobWFqb3JJZCwgbWlub3JJZCksIHRoaXMuZmllbGQubmFtZSwgY29udGV4dCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIOaPkOWPluebruagh+aVsOaNrlxyXG4gICAgICAgIGxldCB0YXJnZXREYXRhID0gZGF0YVt0aGlzLnRhcmdldEZpZWxkTmFtZV07XHJcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRhcmdldERhdGEpKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10gREFUQSVzLiVzPSVz5LiN5piv5pWw57uE57G75Z6L77yMZXF1YWxfbGVu5qCh6aqM5aSx6LSlXCIsIHRoaXMuZGIubmFtZSwgdGhpcy5mb3JtYXRJZChtYWpvcklkLCBtaW5vcklkKSwgdGhpcy50YXJnZXRGaWVsZE5hbWUsIHRhcmdldERhdGEpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY29udGV4dC5sZW5ndGggIT0gdGFyZ2V0RGF0YS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSBEQVRBJXMuJXM9WyVzXSDlkowgREFUQSVzLiVzPVslc13plb/luqbkuI3ljLnphY1cIixcclxuICAgICAgICAgICAgICAgIHRoaXMuZGIubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9ybWF0SWQobWFqb3JJZCwgbWlub3JJZCksXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtYXRJZChtYWpvcklkLCBtaW5vcklkKSxcclxuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0RmllbGROYW1lLFxyXG4gICAgICAgICAgICAgICAgdGFyZ2V0RGF0YVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBQaXBlbGluZVJlZmVyZW5jZU1ham9ySWQgZXh0ZW5kcyBQaXBlbGluZSB7XHJcbiAgICB0YXJnZXREYk5hbWU7XHJcblxyXG4gICAgaW5pdChjbWQsIGJOb25FbXB0eSkge1xyXG4gICAgICAgIHN1cGVyLmluaXQoY21kLCBiTm9uRW1wdHkpO1xyXG5cclxuICAgICAgICB0aGlzLnRhcmdldERiTmFtZSA9IGNtZDtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnZlcmlmeWVyLmRiTmFtZV8yX2lkRXhpc3RzW3RoaXMudGFyZ2V0RGJOYW1lXSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIOWtl+autVslc10gdmVyaWZ5ZXLop6PmnpDplJnor6/vvIznm67moIfooahbJXNd5LiN5a2Y5Zyo5oiW6Kej5p6Q5aSx6LSl44CCY21kPSclcydcIiwgdGhpcy5kYi5uYW1lLCB0aGlzLmZpZWxkLm5hbWUsIHRoaXMudGFyZ2V0RGJOYW1lLCBjbWQpO1xyXG4gICAgICAgICAgICB0aGlzLnRhcmdldERiTmFtZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldE5leHRQaXBlbGluZShwaXBlbGluZSkge1xyXG4gICAgICAgIHN1cGVyLnNldE5leHRQaXBlbGluZShwaXBlbGluZSk7XHJcblxyXG4gICAgICAgIC8vIOaXoOazleS4suiBlFxyXG4gICAgICAgIGlmICh0aGlzLm5leHRQaXBlbGluZSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIOWtl+autVslc10udmVyaWZ5ZXI9JyVzJyAlc+S4jeiDveaOpeWQjue7reWRveS7pOOAglwiLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5maWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5WZXJpZnksXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhcmdldERiTmFtZSxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZShjb250ZXh0LCBkYXRhLCBtYWpvcklkLCBtaW5vcklkKSB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJQaXBlbGluZVJlZmVyZW5jZU1ham9ySWRcIiwgdGhpcy5kYi5uYW1lLCB0aGlzLmZpZWxkLm5hbWUsIG1ham9ySWQsIG1pbm9ySWQsIHRoaXMuYk5vbkVtcHR5KVxyXG4gICAgICAgIGlmICghdGhpcy50YXJnZXREYk5hbWUpIHJldHVybjtcclxuICAgICAgICBpZiAoIXRoaXMuYk5vbkVtcHR5KSB7XHJcbiAgICAgICAgICAgIGlmIChjb250ZXh0ID09IFwiXCIgfHwgY29udGV4dCA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgaWRfMl9leGlzdHMgPSB0aGlzLnZlcmlmeWVyLmRiTmFtZV8yX2lkRXhpc3RzW3RoaXMudGFyZ2V0RGJOYW1lXTtcclxuXHJcbiAgICAgICAgaWYgKGlkXzJfZXhpc3RzW2NvbnRleHRdID09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSBEQVRBJXMuJXM9JyVzJyDlpJbpk75JROacquaJvuWIsO+8miVzWyVzXVwiLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtYXRJZChtYWpvcklkLCBtaW5vcklkKSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgIGRhdGFbdGhpcy5maWVsZC5uYW1lXSxcclxuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0RGJOYW1lLFxyXG4gICAgICAgICAgICAgICAgY29udGV4dCxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFBpcGVsaW5lVXJsIGV4dGVuZHMgUGlwZWxpbmUge1xyXG4gICAgc2V0TmV4dFBpcGVsaW5lKHBpcGVsaW5lKSB7XHJcbiAgICAgICAgc3VwZXIuc2V0TmV4dFBpcGVsaW5lKHBpcGVsaW5lKTtcclxuXHJcbiAgICAgICAgLy8g5peg5rOV5Liy6IGUXHJcbiAgICAgICAgaWYgKHRoaXMubmV4dFBpcGVsaW5lKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10g5a2X5q61WyVzXS52ZXJpZnllcj0nJXMnIFVSTOS4jeiDveaOpeWQjue7reWRveS7pOOAglwiLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5maWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5vcmlnaW5WZXJpZnksXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4ZWN1dGUoY29udGV4dCwgZGF0YSwgbWFqb3JJZCwgbWlub3JJZCkge1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwi5qCh6aqMdXJs77yaXCIsIGNvbnRleHQpO1xyXG4gICAgICAgIC8vIOS4jeagoemqjOayoeacieWhq+WGmeeahOaDheWGtVxyXG4gICAgICAgIGlmIChjb250ZXh0ID09IG51bGwgfHwgY29udGV4dCA9PT0gXCJcIikge1xyXG4gICAgICAgICAgICAvLyDphY3nva7kuLrnqbpcclxuICAgICAgICAgICAgaWYgKHRoaXMuYk5vbkVtcHR5KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIERBVEElcy4lcz0nJXMnIHVybOS4jeiDvemFjee9ruS4uuepuu+8gVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGIubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvcm1hdElkKG1ham9ySWQsIG1pbm9ySWQpLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhW3RoaXMuZmllbGQubmFtZV1cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnZlcmlmeWVyLnVybF8yX2V4aXN0c1tjb250ZXh0XSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIERBVEElcy4lcz0nJXMnIHVybOaMh+WQkei1hOa6kFslc13kuI3lrZjlnKjmiJbmnKrlr7zlh7rvvIFcIixcclxuICAgICAgICAgICAgICAgIHRoaXMuZGIubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9ybWF0SWQobWFqb3JJZCwgbWlub3JJZCksXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhW3RoaXMuZmllbGQubmFtZV0sXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jb25zdCBBTFVfRVhQX0tFWV9XT1JEUyA9IHtcclxuICAgIGFuZDogdHJ1ZSxcclxuICAgIG9yOiB0cnVlLFxyXG4gICAgbm90OiB0cnVlLFxyXG4gICAgdHJ1ZTogdHJ1ZSxcclxuICAgIGZhbHNlOiB0cnVlLFxyXG59XHJcblxyXG5jbGFzcyBQaXBlbGluZUFsdUV4cCBleHRlbmRzIFBpcGVsaW5lIHtcclxuICAgIHNldE5leHRQaXBlbGluZShwaXBlbGluZSkge1xyXG4gICAgICAgIHN1cGVyLnNldE5leHRQaXBlbGluZShwaXBlbGluZSk7XHJcblxyXG4gICAgICAgIC8vIOaXoOazleS4suiBlFxyXG4gICAgICAgIGlmICh0aGlzLm5leHRQaXBlbGluZSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIOWtl+autVslc10udmVyaWZ5ZXI9JyVzJyBhbHVfZXhw5LiN6IO95o6l5ZCO57ut5ZG95Luk44CCXCIsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9yaWdpblZlcmlmeSxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZShjb250ZXh0LCBkYXRhLCBtYWpvcklkLCBtaW5vcklkKSB7XHJcbiAgICAgICAgLy8g5LiN5qCh6aqM5rKh5pyJ5aGr5YaZ55qE5oOF5Ya1XHJcbiAgICAgICAgaWYgKGNvbnRleHQgPT0gbnVsbCB8fCBjb250ZXh0ID09PSBcIlwiKSByZXR1cm47XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCLmoKHpqoxhbHVfZXhwXCIsIGNvbnRleHQpO1xyXG5cclxuICAgICAgICAvLyDmjInnhafnqbrmoLzmi4bliIZcclxuICAgICAgICBsZXQgZmllbGRzID0gY29udGV4dC5zcGxpdChcIiBcIik7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJmaWVsZHNcIiwgZmllbGRzKVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBmaWVsZCA9IGZpZWxkc1tpXTtcclxuXHJcbiAgICAgICAgICAgIGxldCBsb3dlckZpZWxkID0gZmllbGQudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIOWFs+mUruivjeW/veeVpVxyXG4gICAgICAgICAgICBpZiAoQUxVX0VYUF9LRVlfV09SRFNbbG93ZXJGaWVsZF0pIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgLy8g5Ymp5L2Z55qE5pivYWx1SWRcclxuICAgICAgICAgICAgaWYgKCF0aGlzLnZlcmlmeWVyLmFsdUlkXzJfZXhpc3RzW2ZpZWxkXSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSBEQVRBJXMuJXM9JyVzJyBhbHVJZFslc13lnKhvcmlnaW5fYWx1X2Ri5Lit5pyq5om+5Yiw77yBXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm9ybWF0SWQobWFqb3JJZCwgbWlub3JJZCksXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbdGhpcy5maWVsZC5uYW1lXSxcclxuICAgICAgICAgICAgICAgICAgICBmaWVsZFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgUGlwZWxpbmVJbmRleCBleHRlbmRzIFBpcGVsaW5lIHtcclxuICAgIGtleTtcclxuXHJcbiAgICBpbml0KGNtZCwgYk5vbkVtcHR5KSB7XHJcbiAgICAgICAgc3VwZXIuaW5pdChjbWQsIGJOb25FbXB0eSk7XHJcblxyXG4gICAgICAgIGxldCByZXQgPSAvXFxbKFteXFxdXSspXFxdLy5leGVjKGNtZCk7XHJcbiAgICAgICAgaWYgKCFyZXQgfHwgIXJldFsxXSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIOWtl+autVslc10gdmVyaWZ5ZXLop6PmnpDplJnor6/vvIzntKLlvJXlkb3ku6Top6PmnpDplJnor6/jgIJjbWQ9JyVzJ+OAgiAgc2FtcGxl77yaWzBdIFtuYW1lXSBbdHlwZV1cIiwgdGhpcy5kYi5uYW1lLCB0aGlzLmZpZWxkLm5hbWUsIGNtZCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMua2V5ID0gcmV0WzFdO1xyXG4gICAgfVxyXG5cclxuICAgIHNldE5leHRQaXBlbGluZShwaXBlbGluZSkge1xyXG4gICAgICAgIHN1cGVyLnNldE5leHRQaXBlbGluZShwaXBlbGluZSk7XHJcblxyXG4gICAgICAgIC8vIOmcgOimgeS4suiBlFxyXG4gICAgICAgIGlmICghdGhpcy5uZXh0UGlwZWxpbmUpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSDlrZfmrrVbJXNdLnZlcmlmeWVyPSclcycgJXPkuYvlkI7pnIDopoHov57mjqXlhbbku5blkb3ku6TjgIJcIixcclxuICAgICAgICAgICAgICAgIHRoaXMuZGIubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luVmVyaWZ5LFxyXG4gICAgICAgICAgICAgICAgdGhpcy5jbWQsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4ZWN1dGUoY29udGV4dCwgZGF0YSwgbWFqb3JJZCwgbWlub3JJZCkge1xyXG4gICAgICAgIGlmICghdGhpcy5rZXkpIHJldHVybjtcclxuICAgICAgICBpZiAoIWNvbnRleHQpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKCEoY29udGV4dCBpbnN0YW5jZW9mIE9iamVjdCkpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSBEQVRBJXMuJXM9JXMgJXPntKLlvJXlpLHotKXvvIx0eXBlb2YoJyVzJyk9JyVzJ1wiLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtYXRJZChtYWpvcklkLCBtaW5vcklkKSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgIGRhdGFbdGhpcy5maWVsZC5uYW1lXSxcclxuICAgICAgICAgICAgICAgIHRoaXMuY21kLFxyXG4gICAgICAgICAgICAgICAgY29udGV4dCxcclxuICAgICAgICAgICAgICAgIHR5cGVvZiBjb250ZXh0LFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJQaXBlbGluZUluZGV4LmV4ZWN1dGVcIiwgdGhpcy5kYi5uYW1lLCB0aGlzLmZpZWxkLm5hbWUsIHRoaXMuY21kLCBtYWpvcklkLCBjb250ZXh0KTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIiAgdHlwZVwiLCBjb250ZXh0IGluc3RhbmNlb2YgT2JqZWN0KTtcclxuICAgICAgICBsZXQgdmFsdWUgPSBjb250ZXh0W3RoaXMua2V5XTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMubmV4dFBpcGVsaW5lKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dFBpcGVsaW5lLmV4ZWN1dGUodmFsdWUsIGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgUGlwZWxpbmVGb3IgZXh0ZW5kcyBQaXBlbGluZSB7XHJcbiAgICBzZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpIHtcclxuICAgICAgICBzdXBlci5zZXROZXh0UGlwZWxpbmUocGlwZWxpbmUpO1xyXG5cclxuICAgICAgICAvLyDpnIDopoHkuLLogZRcclxuICAgICAgICBpZiAoIXRoaXMubmV4dFBpcGVsaW5lKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10g5a2X5q61WyVzXS52ZXJpZnllcj0nJXMnICVz5LmL5ZCO6ZyA6KaB6L+e5o6l5YW25LuW5ZG95Luk44CCXCIsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9yaWdpblZlcmlmeSxcclxuICAgICAgICAgICAgICAgIHRoaXMuY21kLFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlKGNvbnRleHQsIGRhdGEsIG1ham9ySWQsIG1pbm9ySWQpIHtcclxuICAgICAgICBpZiAoIWNvbnRleHQpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKCEoY29udGV4dCBpbnN0YW5jZW9mIE9iamVjdCkpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSBEQVRBJXMuJXM9JXMgdHlwZW9mKCclcycpPSclcyfpgY3ljoblpLHotKXvvIzpnIDopoHkuLrmlbDnu4TmiJblr7nosaHjgIJcIixcclxuICAgICAgICAgICAgICAgIHRoaXMuZGIubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9ybWF0SWQobWFqb3JJZCwgbWlub3JJZCksXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhW3RoaXMuZmllbGQubmFtZV0sXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIGNvbnRleHQsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm5leHRQaXBlbGluZSkge1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjb250ZXh0KSkge1xyXG4gICAgICAgICAgICAgICAgLy8g5pWw57uEXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRleHQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGNvbnRleHRbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0UGlwZWxpbmUuZXhlY3V0ZSh2YWx1ZSwgZGF0YSwgbWFqb3JJZCwgbWlub3JJZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgVG9vbHMuZm9yRWFjaE1hcChjb250ZXh0LCAoaywgdmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHRQaXBlbGluZS5leGVjdXRlKHZhbHVlLCBkYXRhLCBtYWpvcklkLCBtaW5vcklkKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBQaXBlbGluZUlmIGV4dGVuZHMgUGlwZWxpbmUge1xyXG4gICAgc3RhdGljIFNZTUJPTF8yX1ZBSUxEID0ge1xyXG4gICAgICAgIFwiIT1cIjogdHJ1ZSxcclxuICAgICAgICBcIj09XCI6IHRydWUsXHJcbiAgICAgICAgXCI8XCI6IHRydWUsXHJcbiAgICAgICAgXCI8PVwiOiB0cnVlLFxyXG4gICAgICAgIFwiPlwiOiB0cnVlLFxyXG4gICAgICAgIFwiPj1cIjogdHJ1ZSxcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgU1lNQk9MXzJfUkVRVUlSRV9OVU0gPSB7XHJcbiAgICAgICAgXCIhPVwiOiBmYWxzZSxcclxuICAgICAgICBcIj09XCI6IGZhbHNlLFxyXG4gICAgICAgIFwiPFwiOiB0cnVlLFxyXG4gICAgICAgIFwiPD1cIjogdHJ1ZSxcclxuICAgICAgICBcIj5cIjogdHJ1ZSxcclxuICAgICAgICBcIj49XCI6IHRydWUsXHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIFNZTUJPTF8yX0hBTkRMRVIgPSB7XHJcbiAgICAgICAgXCIhPVwiOiAoYSwgYikgPT4geyByZXR1cm4gYSAhPSBiOyB9LFxyXG4gICAgICAgIFwiPT1cIjogKGEsIGIpID0+IHsgcmV0dXJuIGEgPT0gYjsgfSxcclxuICAgICAgICBcIjxcIjogKGEsIGIpID0+IHsgcmV0dXJuIGEgPCBiOyB9LFxyXG4gICAgICAgIFwiPD1cIjogKGEsIGIpID0+IHsgcmV0dXJuIGEgPD0gYjsgfSxcclxuICAgICAgICBcIj5cIjogKGEsIGIpID0+IHsgcmV0dXJuIGEgPiBiOyB9LFxyXG4gICAgICAgIFwiPj1cIjogKGEsIGIpID0+IHsgcmV0dXJuIGEgPj0gYjsgfSxcclxuICAgIH1cclxuXHJcbiAgICBrZXk7XHJcbiAgICBzeW1ib2w7XHJcbiAgICB0YXJnZXRWYWx1ZTtcclxuXHJcbiAgICBpbml0KGNtZCwgYk5vbkVtcHR5KSB7XHJcbiAgICAgICAgc3VwZXIuaW5pdChjbWQsIGJOb25FbXB0eSk7XHJcblxyXG4gICAgICAgIGxldCByZXQgPSAvaWZcXChcXFsoLispXFxdKFtcXD5cXCFcXD1cXDxdKykoW15cXCldKykvLmV4ZWMoY21kKSB8fCBbXTtcclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJyZXRcIiwgcmV0KVxyXG5cclxuICAgICAgICB0aGlzLmtleSA9IHJldFsxXTtcclxuICAgICAgICB0aGlzLnN5bWJvbCA9IHJldFsyXTtcclxuICAgICAgICB0aGlzLnRhcmdldFZhbHVlID0gcmV0WzNdO1xyXG5cclxuICAgICAgICAvLyDnkIborrrkuIrkuI3kvJrlrZjlnKhyZXTkuLrnqbrnmoTmg4XlhrVcclxuICAgICAgICBpZiAoIXRoaXMua2V5IHx8ICF0aGlzLnN5bWJvbCB8fCAhdGhpcy50YXJnZXRWYWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIOWtl+autVslc10gdmVyaWZ5ZXLop6PmnpDplJnor6/vvIxpZuWRveS7pOino+aekOmUmeivr+OAgmNtZD0nJXMn44CCICBzYW1wbGXvvJpbMF0gW25hbWVdIFt0eXBlXVwiLCB0aGlzLmRiLm5hbWUsIHRoaXMuZmllbGQubmFtZSwgY21kKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g5qOA5p+lc3ltYm9sXHJcbiAgICAgICAgaWYgKCFQaXBlbGluZUlmLlNZTUJPTF8yX1ZBSUxEW3RoaXMuc3ltYm9sXSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIOWtl+autVslc10gaWbliKTmlq3nrKblj7cnJXMn5LiN5Y+v55So44CC6K+35L2/55SoIT0sID09LCA8LCA8PSwgPiwgPj3kuK3nmoTnrKblj7fjgIJcIiwgdGhpcy5kYi5uYW1lLCB0aGlzLmZpZWxkLm5hbWUsIHRoaXMuc3ltYm9sKTtcclxuICAgICAgICAgICAgdGhpcy5zeW1ib2wgPSBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyDmo4Dmn6V0YXJnZXRWYWx1Zeexu+Wei1xyXG4gICAgICAgIGlmIChQaXBlbGluZUlmLlNZTUJPTF8yX1JFUVVJUkVfTlVNW3RoaXMuc3ltYm9sXSkge1xyXG4gICAgICAgICAgICAvLyDmlbDlgLznsbvlnotcclxuICAgICAgICAgICAgbGV0IG51bWJlcnZhbHVlID0gcGFyc2VGbG9hdCh0aGlzLnRhcmdldFZhbHVlKTtcclxuICAgICAgICAgICAgaWYgKGlzTmFOKG51bWJlcnZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSDlrZfmrrVbJXNdIGlm5Yik5patJyVzJ++8jOebruagh+WAvFslc13pnIDopoHkuLrmlbDlrZfjgIJcIiwgdGhpcy5kYi5uYW1lLCB0aGlzLmZpZWxkLm5hbWUsIHRoaXMuY21kLCB0aGlzLnRhcmdldFZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0VmFsdWUgPSBudWxsO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXRWYWx1ZSA9IG51bWJlcnZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy50YXJnZXRWYWx1ZSA9ICh0aGlzLnRhcmdldFZhbHVlIHx8IFwiXCIpLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldE5leHRQaXBlbGluZShwaXBlbGluZSkge1xyXG4gICAgICAgIHN1cGVyLnNldE5leHRQaXBlbGluZShwaXBlbGluZSk7XHJcblxyXG4gICAgICAgIC8vIOmcgOimgeS4suiBlFxyXG4gICAgICAgIGlmICghdGhpcy5uZXh0UGlwZWxpbmUpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJpZnllci53YXJuKFwi6YWN572u6KGoWyVzXSDlrZfmrrVbJXNdLnZlcmlmeWVyPSclcycgJXPkuYvlkI7pnIDopoHov57mjqXlhbbku5blkb3ku6TjgIJcIixcclxuICAgICAgICAgICAgICAgIHRoaXMuZGIubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMuZmllbGQubmFtZSxcclxuICAgICAgICAgICAgICAgIHRoaXMub3JpZ2luVmVyaWZ5LFxyXG4gICAgICAgICAgICAgICAgdGhpcy5jbWQsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4ZWN1dGUoY29udGV4dCwgZGF0YSwgbWFqb3JJZCwgbWlub3JJZCkge1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiUGlwZWxpbmVJZi5leGVjdXRlXCIsIHRoaXMuZGIubmFtZSwgdGhpcy5maWVsZC5uYW1lLCBtYWpvcklkLCB0aGlzLmtleSwgdGhpcy5zeW1ib2wsIHRoaXMudGFyZ2V0VmFsdWUpO1xyXG4gICAgICAgIGlmICghY29udGV4dCkgcmV0dXJuO1xyXG4gICAgICAgIGlmICghdGhpcy5rZXkgfHwgIXRoaXMuc3ltYm9sIHx8ICF0aGlzLnRhcmdldFZhbHVlKSByZXR1cm47XHJcblxyXG5cclxuICAgICAgICBpZiAoIShjb250ZXh0IGluc3RhbmNlb2YgT2JqZWN0KSkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcmlmeWVyLndhcm4oXCLphY3nva7ooahbJXNdIERBVEElcy4lcz0lcyAlcyBpZuWIpOaWree0ouW8leWksei0pe+8jHR5cGVvZignJXMnKT0nJXMnXCIsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm1hdElkKG1ham9ySWQsIG1pbm9ySWQpLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5maWVsZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgZGF0YVt0aGlzLmZpZWxkLm5hbWVdLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5jbWQsXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIGNvbnRleHQsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB2YWx1ZSA9IGNvbnRleHRbdGhpcy5rZXldO1xyXG4gICAgICAgIGlmIChQaXBlbGluZUlmLlNZTUJPTF8yX1JFUVVJUkVfTlVNW3RoaXMuc3ltYm9sXSkge1xyXG4gICAgICAgICAgICAvLyDmlbDlgLznsbvlnotcclxuICAgICAgICAgICAgbGV0IG51bWJlcnZhbHVlID0gcGFyc2VGbG9hdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIGlmIChpc05hTihudW1iZXJ2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmVyaWZ5ZXIud2FybihcIumFjee9ruihqFslc10gREFUQSVzLiVzPSclcycgaWbliKTmlq0nJXMn77yMJXNbJXNdPSclcyfpnIDopoHkuLrmlbDlrZfjgIJcIixcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRiLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb3JtYXRJZChtYWpvcklkLCBtaW5vcklkKSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpZWxkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNtZCxcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMua2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gbnVtYmVydmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YWx1ZSA9ICh2YWx1ZSB8fCBcIlwiKS50b1N0cmluZygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGhhbmRsZXIgPSBQaXBlbGluZUlmLlNZTUJPTF8yX0hBTkRMRVJbdGhpcy5zeW1ib2xdO1xyXG4gICAgICAgIGlmIChoYW5kbGVyIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKGhhbmRsZXIodmFsdWUsIHRoaXMudGFyZ2V0VmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDpgJrov4fvvIzlkJHlkI7kvKDpgJJcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHRQaXBlbGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dFBpcGVsaW5lLmV4ZWN1dGUoY29udGV4dCwgZGF0YSwgbWFqb3JJZCwgbWlub3JJZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiaGFuZGxlciBub3QgZnVuY3Rpb24/XCIsIHRoaXMuc3ltYm9sLCBoYW5kbGVyKVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0iXX0=