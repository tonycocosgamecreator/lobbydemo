import path from "path";
import Timer from "../utils/timer";
import Tools from "../utils/tools";
import DbBundleExporter from "./db-bundle-exporter";
import { DbBundleDataBase } from "./db-bundle-data-base";

export class DbBundleVerifyer {

    private warnCount : number  = 0;

    private dbName_2_idExists : {[dbName : string] : any}   = {};

    private aluId_2_exists;
    /**
     * 资源路径是否找到
     */
    private url_2_exists : {[url : string] : boolean} = {};

    constructor(public exporter : DbBundleExporter){

    }


    private warn(text : string){
        this.warnCount++;
        console.warn("[警告]",text);
    }

    public verifyDb(){
        const bundleName    = this.exporter.bundleName;
        console.log("\n---------------------- 开始校验配置表[" + bundleName + "] ----------------------");
        this.dbName_2_idExists = {};
        this.warnCount = 0;

        let beginTime = Timer.time();

        let rule_2_valid = {
            m: true,
            ma: true,
            mm: true,
            a: true,
        }
        const dbName_2_db = this.exporter.dbName_2_db;
        // 1. 打印配置表自身的loading警告
        Tools.forEachMap(dbName_2_db, (dbName, db) => {
            for (let i = 0; i < db.warnLog.length; i++) {
                const text = db.warnLog[i];
                this.warn(text);
            }
        });
        this.url_2_exists = {};
        let resourcesRootDir = path.join(Editor.Project.path, "assets", "resources");
        if(bundleName != 'resources'){
            //只检查当前bundle的资源
            resourcesRootDir = path.join(Editor.Project.path, "assets", "bundles", bundleName);
        }
        Tools.foreachDir(resourcesRootDir, (filePath : string) => {
            // 忽略meta
            if (filePath.endsWith(".meta")) return false;
            let relativePath = path.relative(resourcesRootDir, filePath);
            let withoutExtPath = relativePath.substring(0, relativePath.indexOf("."));
            let unixStylePath = withoutExtPath.replace(/\\/g, "/");
            this.url_2_exists[unixStylePath] = true;
        });
        // 3. 收集各个表的majorId
        Tools.forEachMap(dbName_2_db, (dbName : string, db : DbBundleDataBase) => {
            if (!rule_2_valid[db.rule]) {
                console.warn("配置表[%s] 未知规则：rule=[%s]，规则需要为：m, ma, mm, a中的一种", dbName, db.rule);
            }
            let id_2_exists = {};
            db.forDb((data,majorId)=>{
                if (id_2_exists[majorId] != null) {
                    console.warn("配置表[%s]中出现重复id：[%s]", dbName, majorId);
                }
                id_2_exists[majorId] = true;
            },true);

            this.dbName_2_idExists[dbName] = id_2_exists;
        });
        // 4. 处理idMergeTo的逻辑
        Tools.forEachMap(dbName_2_db, (dbName : string, db : DbBundleDataBase) => {
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

            Tools.forEachMap(alu_db.datas, (k, v) => {
                this.aluId_2_exists[k] = true;
            });
        }

        // 6. 处理自定义校验逻辑
        Tools.forEachMap(dbName_2_db, (dbName, db) => {
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

                        } else if (this.dbName_2_idExists[cmd] != null) {
                            // cmd为表名，验收主id
                            pipeline = new PipelineReferenceMajorId(this, db, field, verifyer);

                        } else if (cmd.toLowerCase() == "url") {
                            pipeline = new PipelineUrl(this, db, field, verifyer);

                        } else if (cmd.toLowerCase() == "alu_exp") {
                            pipeline = new PipelineAluExp(this, db, field, verifyer);

                        } else if (cmd.toLowerCase() == "for") {
                            pipeline = new PipelineFor(this, db, field, verifyer);

                        } else if (/if\(\[(.+)\]([\>\!\=\<]+)([^\)]+)/.exec(cmd)) {
                            pipeline = new PipelineIf(this, db, field, verifyer);

                        } else if (/\[([^\]]+)\]/.exec(cmd)) {
                            pipeline = new PipelineIndex(this, db, field, verifyer);

                        } else {
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




        console.log(Tools.format("------------ 配置表校验完毕 发现%d处异常，用时%dms ------------\n", this.warnCount, Timer.time() - beginTime));
    }
}

class Pipeline {
    verifyer;
    db;
    field;
    cmd;
    nextPipeline;
    originVerify;

    bNonEmpty;

    constructor (verifyer, db, field, originVerify) {
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
        this.bNonEmpty = !!bNonEmpty
    }

    setNextPipeline(pipeline) {
        this.nextPipeline = pipeline;
    }

    execute(context, data, majorId, minorId) {

    }

    formatId(majorId, minorId) {
        let text = "";
        if (majorId != null) {
            text += "[" + majorId + "]"
        }
        if (minorId != null) {
            text += "[" + minorId + "]"
        }
        return text
    }
}

class PipelineEqualLen extends Pipeline {
    targetFieldName;

    init(cmd, bNonEmpty) {
        super.init(cmd, bNonEmpty);

        let ret = /equal_len\(([^\)]+)/.exec(cmd);
        if (ret && ret.length >= 1) {
            this.targetFieldName = ret[1];
        }

        if (!this.targetFieldName) {
            this.verifyer.warn("配置表[%s] 字段[%s] verifyer解析错误，【equal_len】目标字段名未找到。cmd='%s'", this.db.name, this.field.name, cmd);
        } else {
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
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' equal_len不能接后续命令。",
                this.db.name,
                this.field.name,
                this.originVerify,
            );
        }
    }

    execute(context, data, majorId, minorId) {
        if (!this.targetFieldName) return;

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
            this.verifyer.warn("配置表[%s] DATA%s.%s=[%s] 和 DATA%s.%s=[%s]长度不匹配",
                this.db.name,
                this.formatId(majorId, minorId),
                this.field.name,
                context,
                this.formatId(majorId, minorId),
                this.targetFieldName,
                targetData
            );
            return;
        }
    }
}

class PipelineReferenceMajorId extends Pipeline {
    targetDbName;

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
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' %s不能接后续命令。",
                this.db.name,
                this.field.name,
                this.originVerify,
                this.targetDbName,
            );
        }
    }

    execute(context, data, majorId, minorId) {
        // console.log("PipelineReferenceMajorId", this.db.name, this.field.name, majorId, minorId, this.bNonEmpty)
        if (!this.targetDbName) return;
        if (!this.bNonEmpty) {
            if (context == "" || context == null) return;
        }

        let id_2_exists = this.verifyer.dbName_2_idExists[this.targetDbName];

        if (id_2_exists[context] == null) {
            this.verifyer.warn("配置表[%s] DATA%s.%s='%s' 外链ID未找到：%s[%s]",
                this.db.name,
                this.formatId(majorId, minorId),
                this.field.name,
                data[this.field.name],
                this.targetDbName,
                context,
            );
        }
    }
}

class PipelineUrl extends Pipeline {
    setNextPipeline(pipeline) {
        super.setNextPipeline(pipeline);

        // 无法串联
        if (this.nextPipeline) {
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' URL不能接后续命令。",
                this.db.name,
                this.field.name,
                this.originVerify,
            );
        }
    }

    execute(context, data, majorId, minorId) {
        // console.log("校验url：", context);
        // 不校验没有填写的情况
        if (context == null || context === "") {
            // 配置为空
            if (this.bNonEmpty) {
                this.verifyer.warn("配置表[%s] DATA%s.%s='%s' url不能配置为空！",
                    this.db.name,
                    this.formatId(majorId, minorId),
                    this.field.name,
                    data[this.field.name]
                );
            }
            return;
        }

        if (!this.verifyer.url_2_exists[context]) {
            this.verifyer.warn("配置表[%s] DATA%s.%s='%s' url指向资源[%s]不存在或未导出！",
                this.db.name,
                this.formatId(majorId, minorId),
                this.field.name,
                data[this.field.name],
                context
            );
        }
    }
}

const ALU_EXP_KEY_WORDS = {
    and: true,
    or: true,
    not: true,
    true: true,
    false: true,
}

class PipelineAluExp extends Pipeline {
    setNextPipeline(pipeline) {
        super.setNextPipeline(pipeline);

        // 无法串联
        if (this.nextPipeline) {
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' alu_exp不能接后续命令。",
                this.db.name,
                this.field.name,
                this.originVerify,
            );
        }
    }

    execute(context, data, majorId, minorId) {
        // 不校验没有填写的情况
        if (context == null || context === "") return;
        // console.log("校验alu_exp", context);

        // 按照空格拆分
        let fields = context.split(" ");
        // console.log("fields", fields)

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];

            let lowerField = field.toLowerCase();

            // 关键词忽略
            if (ALU_EXP_KEY_WORDS[lowerField]) continue;

            // 剩余的是aluId
            if (!this.verifyer.aluId_2_exists[field]) {
                this.verifyer.warn("配置表[%s] DATA%s.%s='%s' aluId[%s]在origin_alu_db中未找到！",
                    this.db.name,
                    this.formatId(majorId, minorId),
                    this.field.name,
                    data[this.field.name],
                    field
                );
            }
        }
    }
}

class PipelineIndex extends Pipeline {
    key;

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
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' %s之后需要连接其他命令。",
                this.db.name,
                this.field.name,
                this.originVerify,
                this.cmd,
            );
        }
    }

    execute(context, data, majorId, minorId) {
        if (!this.key) return;
        if (!context) return;

        if (!(context instanceof Object)) {
            this.verifyer.warn("配置表[%s] DATA%s.%s=%s %s索引失败，typeof('%s')='%s'",
                this.db.name,
                this.formatId(majorId, minorId),
                this.field.name,
                data[this.field.name],
                this.cmd,
                context,
                typeof context,
            );
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
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' %s之后需要连接其他命令。",
                this.db.name,
                this.field.name,
                this.originVerify,
                this.cmd,
            );
        }
    }

    execute(context, data, majorId, minorId) {
        if (!context) return;

        if (!(context instanceof Object)) {
            this.verifyer.warn("配置表[%s] DATA%s.%s=%s typeof('%s')='%s'遍历失败，需要为数组或对象。",
                this.db.name,
                this.formatId(majorId, minorId),
                this.field.name,
                data[this.field.name],
                context,
                typeof context,
            );
            return;
        }

        if (this.nextPipeline) {
            if (Array.isArray(context)) {
                // 数组
                for (let i = 0; i < context.length; i++) {
                    const value = context[i];
                    this.nextPipeline.execute(value, data, majorId, minorId);
                }

            } else {
                Tools.forEachMap(context, (k, value) => {
                    this.nextPipeline.execute(value, data, majorId, minorId);
                });
            }
        }
    }
}

class PipelineIf extends Pipeline {
    static SYMBOL_2_VAILD = {
        "!=": true,
        "==": true,
        "<": true,
        "<=": true,
        ">": true,
        ">=": true,
    }

    static SYMBOL_2_REQUIRE_NUM = {
        "!=": false,
        "==": false,
        "<": true,
        "<=": true,
        ">": true,
        ">=": true,
    }

    static SYMBOL_2_HANDLER = {
        "!=": (a, b) => { return a != b; },
        "==": (a, b) => { return a == b; },
        "<": (a, b) => { return a < b; },
        "<=": (a, b) => { return a <= b; },
        ">": (a, b) => { return a > b; },
        ">=": (a, b) => { return a >= b; },
    }

    key;
    symbol;
    targetValue;

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
            } else {
                this.targetValue = numbervalue;
            }
        } else {
            this.targetValue = (this.targetValue || "").toString();
        }
    }

    setNextPipeline(pipeline) {
        super.setNextPipeline(pipeline);

        // 需要串联
        if (!this.nextPipeline) {
            this.verifyer.warn("配置表[%s] 字段[%s].verifyer='%s' %s之后需要连接其他命令。",
                this.db.name,
                this.field.name,
                this.originVerify,
                this.cmd,
            );
        }
    }

    execute(context, data, majorId, minorId) {
        // console.log("PipelineIf.execute", this.db.name, this.field.name, majorId, this.key, this.symbol, this.targetValue);
        if (!context) return;
        if (!this.key || !this.symbol || !this.targetValue) return;


        if (!(context instanceof Object)) {
            this.verifyer.warn("配置表[%s] DATA%s.%s=%s %s if判断索引失败，typeof('%s')='%s'",
                this.db.name,
                this.formatId(majorId, minorId),
                this.field.name,
                data[this.field.name],
                this.cmd,
                context,
                typeof context,
            );
            return;
        }

        let value = context[this.key];
        if (PipelineIf.SYMBOL_2_REQUIRE_NUM[this.symbol]) {
            // 数值类型
            let numbervalue = parseFloat(value);
            if (isNaN(numbervalue)) {
                this.verifyer.warn("配置表[%s] DATA%s.%s='%s' if判断'%s'，%s[%s]='%s'需要为数字。",
                    this.db.name,
                    this.formatId(majorId, minorId),
                    this.field.name,
                    context,
                    this.cmd,
                    context,
                    this.key,
                    value,
                );
                return;
            } else {
                value = numbervalue;
            }
        } else {
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
        } else {
            console.error("handler not function?", this.symbol, handler)
        }
    };
}