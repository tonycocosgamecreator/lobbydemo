"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlTag = void 0;
const fast_xml_parser_1 = require("fast-xml-parser");
const fs_1 = __importDefault(require("fs"));
const he_1 = __importDefault(require("he"));
const tools_1 = __importDefault(require("./tools"));
class Xml {
    /**
     * 从xml文件加载数据
     * @param {*} filePath
     */
    load(filePath) {
        let parser = new fast_xml_parser_1.XMLParser({
            ignoreAttributes: false,
            preserveOrder: true,
            attributeValueProcessor: (attributeName, val) => {
                return he_1.default.decode(val);
            }
        });
        let xmlText = fs_1.default.readFileSync(filePath, { encoding: "utf-8" });
        let xmlData = parser.parse(xmlText);
        // console.log("xmlData", xmlData)
        let rootTag = new XmlTag();
        // 解析xmlData
        //this.tags = [];
        for (let i = 0; i < xmlData.length; i++) {
            const tagData = xmlData[i];
            let tag = new XmlTag();
            tag.parseFxpTagData(tagData);
            rootTag.children.push(tag);
        }
        this.rootTag = rootTag;
        // console.log(JSON.stringify(this.tags, null, 4));
    }
    /**
     * 将xml数据写入文件
     * 1. 可保留tag顺序
     * 2. 不保留attrs顺序
     * @param {*} filePath
     */
    write(filePath) {
        let fxpData = [];
        for (let i = 0; i < this.rootTag.children.length; i++) {
            const tag = this.rootTag.children[i];
            fxpData.push(tag.generateFxpTagData());
        }
        let builder = new fast_xml_parser_1.XMLBuilder({
            ignoreAttributes: false,
            preserveOrder: true,
            format: true,
            suppressEmptyNode: true,
            attributeValueProcessor: (attributeName, val) => {
                // console.log(Tools.format("attributeValueProcessor [%s]=[%s] he.decode=[%s]", attributeName, val, he.decode(val)));
                return he_1.default.decode(val);
            }
        });
        // console.log("write", filePath)
        let outputText = builder.build(fxpData);
        fs_1.default.writeFileSync(filePath, outputText, { encoding: "utf-8" });
    }
    findTagByName(tagName, bRecursion = true) {
        return this.rootTag.findTagByName(tagName, bRecursion);
    }
}
exports.default = Xml;
class XmlTag {
    constructor() {
        this.attrs = {};
        this.children = [];
    }
    /** 解析fxp格式数据 */
    parseFxpTagData(tagData) {
        // key不是":@"的，是tagName，对应的值是children列表
        tools_1.default.forEachMap(tagData, (k, v) => {
            if (k != ":@") {
                this.name = k;
                return true;
            }
        });
        if (tagData[":@"]) {
            tools_1.default.forEachMap(tagData[":@"], (k, v) => {
                if (k.startsWith("@_")) {
                    let attrName = k.substring(2, k.length);
                    this.attrs[attrName] = v;
                }
            });
        }
        let childrenData = tagData[this.name] || [];
        for (let i = 0; i < childrenData.length; i++) {
            const childTagData = childrenData[i];
            let childTag = new XmlTag();
            childTag.parseFxpTagData(childTagData);
            this.children.push(childTag);
        }
    }
    /** 重新生成fxp格式的数据 */
    generateFxpTagData() {
        let tagData = {};
        // attr
        let attrsData = {};
        tools_1.default.forEachMap(this.attrs, (k, v) => {
            attrsData["@_" + k] = v;
        });
        tagData[":@"] = attrsData;
        // tagName、children
        let childrenData = [];
        for (let i = 0; i < this.children.length; i++) {
            const childTag = this.children[i];
            childrenData.push(childTag.generateFxpTagData());
        }
        tagData[this.name] = childrenData;
        return tagData;
    }
    findTagByName(name, bRecursion = true) {
        let tags = [];
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child.name == name) {
                tags.push(child);
            }
            if (bRecursion) {
                let ret = child.findTagByName(name, bRecursion);
                tags = tags.concat(ret);
            }
        }
        return tags;
    }
}
exports.XmlTag = XmlTag;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieG1sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3V0aWxzL3htbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxREFBc0U7QUFDdEUsNENBQW9CO0FBQ3BCLDRDQUFvQjtBQUNwQixvREFBNEI7QUFFNUIsTUFBcUIsR0FBRztJQUdwQjs7O09BR0c7SUFDSCxJQUFJLENBQUMsUUFBUTtRQUVULElBQUksTUFBTSxHQUFHLElBQUksMkJBQVMsQ0FBQztZQUN2QixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLGFBQWEsRUFBRSxJQUFJO1lBQ25CLHVCQUF1QixFQUFFLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUM1QyxPQUFPLFlBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUIsQ0FBQztTQUNKLENBQUMsQ0FBQztRQUNILElBQUksT0FBTyxHQUFHLFlBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDL0QsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVwQyxrQ0FBa0M7UUFFbEMsSUFBSSxPQUFPLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUUzQixZQUFZO1FBQ1osaUJBQWlCO1FBQ2pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUzQixJQUFJLEdBQUcsR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ3ZCLEdBQUcsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0IsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDOUI7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LElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFL0IsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRTtnQkFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNwQjtZQUVELElBQUksVUFBVSxFQUFFO2dCQUNaLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUMzQjtTQUNKO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUNKO0FBaEZELHdCQWdGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFhNTFBhcnNlciwgWE1MQnVpbGRlciwgWE1MVmFsaWRhdG9yIH0gZnJvbSBcImZhc3QteG1sLXBhcnNlclwiO1xyXG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XHJcbmltcG9ydCBoZSBmcm9tIFwiaGVcIjtcclxuaW1wb3J0IFRvb2xzIGZyb20gXCIuL3Rvb2xzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBYbWwge1xyXG4gICAgcm9vdFRhZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIOS7jnhtbOaWh+S7tuWKoOi9veaVsOaNrlxyXG4gICAgICogQHBhcmFtIHsqfSBmaWxlUGF0aCBcclxuICAgICAqL1xyXG4gICAgbG9hZChmaWxlUGF0aCkge1xyXG5cclxuICAgICAgICBsZXQgcGFyc2VyID0gbmV3IFhNTFBhcnNlcih7XHJcbiAgICAgICAgICAgIGlnbm9yZUF0dHJpYnV0ZXM6IGZhbHNlLFxyXG4gICAgICAgICAgICBwcmVzZXJ2ZU9yZGVyOiB0cnVlLFxyXG4gICAgICAgICAgICBhdHRyaWJ1dGVWYWx1ZVByb2Nlc3NvcjogKGF0dHJpYnV0ZU5hbWUsIHZhbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhlLmRlY29kZSh2YWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgbGV0IHhtbFRleHQgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsIHsgZW5jb2Rpbmc6IFwidXRmLThcIiB9KTtcclxuICAgICAgICBsZXQgeG1sRGF0YSA9IHBhcnNlci5wYXJzZSh4bWxUZXh0KTtcclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJ4bWxEYXRhXCIsIHhtbERhdGEpXHJcblxyXG4gICAgICAgIGxldCByb290VGFnID0gbmV3IFhtbFRhZygpO1xyXG5cclxuICAgICAgICAvLyDop6PmnpB4bWxEYXRhXHJcbiAgICAgICAgLy90aGlzLnRhZ3MgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHhtbERhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgdGFnRGF0YSA9IHhtbERhdGFbaV07XHJcblxyXG4gICAgICAgICAgICBsZXQgdGFnID0gbmV3IFhtbFRhZygpO1xyXG4gICAgICAgICAgICB0YWcucGFyc2VGeHBUYWdEYXRhKHRhZ0RhdGEpO1xyXG4gICAgICAgICAgICByb290VGFnLmNoaWxkcmVuLnB1c2godGFnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucm9vdFRhZyA9IHJvb3RUYWc7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMudGFncywgbnVsbCwgNCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5bCGeG1s5pWw5o2u5YaZ5YWl5paH5Lu2XHJcbiAgICAgKiAxLiDlj6/kv53nlZl0YWfpobrluo9cclxuICAgICAqIDIuIOS4jeS/neeVmWF0dHJz6aG65bqPXHJcbiAgICAgKiBAcGFyYW0geyp9IGZpbGVQYXRoIFxyXG4gICAgICovXHJcbiAgICB3cml0ZShmaWxlUGF0aCkge1xyXG4gICAgICAgIGxldCBmeHBEYXRhID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnJvb3RUYWcuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgdGFnID0gdGhpcy5yb290VGFnLmNoaWxkcmVuW2ldO1xyXG4gICAgICAgICAgICBmeHBEYXRhLnB1c2godGFnLmdlbmVyYXRlRnhwVGFnRGF0YSgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBidWlsZGVyID0gbmV3IFhNTEJ1aWxkZXIoe1xyXG4gICAgICAgICAgICBpZ25vcmVBdHRyaWJ1dGVzOiBmYWxzZSxcclxuICAgICAgICAgICAgcHJlc2VydmVPcmRlcjogdHJ1ZSxcclxuICAgICAgICAgICAgZm9ybWF0OiB0cnVlLFxyXG4gICAgICAgICAgICBzdXBwcmVzc0VtcHR5Tm9kZTogdHJ1ZSxcclxuICAgICAgICAgICAgYXR0cmlidXRlVmFsdWVQcm9jZXNzb3I6IChhdHRyaWJ1dGVOYW1lLCB2YWwpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFRvb2xzLmZvcm1hdChcImF0dHJpYnV0ZVZhbHVlUHJvY2Vzc29yIFslc109WyVzXSBoZS5kZWNvZGU9WyVzXVwiLCBhdHRyaWJ1dGVOYW1lLCB2YWwsIGhlLmRlY29kZSh2YWwpKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaGUuZGVjb2RlKHZhbCBhcyBzdHJpbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJ3cml0ZVwiLCBmaWxlUGF0aClcclxuICAgICAgICBsZXQgb3V0cHV0VGV4dCA9IGJ1aWxkZXIuYnVpbGQoZnhwRGF0YSk7XHJcblxyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIG91dHB1dFRleHQsIHsgZW5jb2Rpbmc6IFwidXRmLThcIiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmaW5kVGFnQnlOYW1lKHRhZ05hbWUsIGJSZWN1cnNpb24gPSB0cnVlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdFRhZy5maW5kVGFnQnlOYW1lKHRhZ05hbWUsIGJSZWN1cnNpb24pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgWG1sVGFnIHtcclxuICAgIG5hbWU7XHJcbiAgICBhdHRycztcclxuICAgIGNoaWxkcmVuO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yICgpIHtcclxuICAgICAgICB0aGlzLmF0dHJzID0ge307XHJcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiDop6PmnpBmeHDmoLzlvI/mlbDmja4gKi9cclxuICAgIHBhcnNlRnhwVGFnRGF0YSh0YWdEYXRhKSB7XHJcblxyXG4gICAgICAgIC8vIGtleeS4jeaYr1wiOkBcIueahO+8jOaYr3RhZ05hbWXvvIzlr7nlupTnmoTlgLzmmK9jaGlsZHJlbuWIl+ihqFxyXG4gICAgICAgIFRvb2xzLmZvckVhY2hNYXAodGFnRGF0YSwgKGssIHYpID0+IHtcclxuICAgICAgICAgICAgaWYgKGsgIT0gXCI6QFwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUgPSBrO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHRhZ0RhdGFbXCI6QFwiXSkge1xyXG4gICAgICAgICAgICBUb29scy5mb3JFYWNoTWFwKHRhZ0RhdGFbXCI6QFwiXSwgKGssIHYpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChrLnN0YXJ0c1dpdGgoXCJAX1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBhdHRyTmFtZSA9IGsuc3Vic3RyaW5nKDIsIGsubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dHJzW2F0dHJOYW1lXSA9IHY7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGNoaWxkcmVuRGF0YSA9IHRhZ0RhdGFbdGhpcy5uYW1lXSB8fCBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuRGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBjaGlsZFRhZ0RhdGEgPSBjaGlsZHJlbkRhdGFbaV07XHJcbiAgICAgICAgICAgIGxldCBjaGlsZFRhZyA9IG5ldyBYbWxUYWcoKTtcclxuICAgICAgICAgICAgY2hpbGRUYWcucGFyc2VGeHBUYWdEYXRhKGNoaWxkVGFnRGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZFRhZyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKiDph43mlrDnlJ/miJBmeHDmoLzlvI/nmoTmlbDmja4gKi9cclxuICAgIGdlbmVyYXRlRnhwVGFnRGF0YSgpIHtcclxuICAgICAgICBsZXQgdGFnRGF0YSA9IHt9O1xyXG5cclxuICAgICAgICAvLyBhdHRyXHJcbiAgICAgICAgbGV0IGF0dHJzRGF0YSA9IHt9O1xyXG4gICAgICAgIFRvb2xzLmZvckVhY2hNYXAodGhpcy5hdHRycywgKGssIHYpID0+IHtcclxuICAgICAgICAgICAgYXR0cnNEYXRhW1wiQF9cIiArIGtdID0gdjtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0YWdEYXRhW1wiOkBcIl0gPSBhdHRyc0RhdGE7XHJcblxyXG5cclxuICAgICAgICAvLyB0YWdOYW1l44CBY2hpbGRyZW5cclxuICAgICAgICBsZXQgY2hpbGRyZW5EYXRhID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkVGFnID0gdGhpcy5jaGlsZHJlbltpXTtcclxuICAgICAgICAgICAgY2hpbGRyZW5EYXRhLnB1c2goY2hpbGRUYWcuZ2VuZXJhdGVGeHBUYWdEYXRhKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0YWdEYXRhW3RoaXMubmFtZV0gPSBjaGlsZHJlbkRhdGE7XHJcblxyXG4gICAgICAgIHJldHVybiB0YWdEYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIGZpbmRUYWdCeU5hbWUobmFtZSwgYlJlY3Vyc2lvbiA9IHRydWUpIHtcclxuICAgICAgICBsZXQgdGFncyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNoaWxkLm5hbWUgPT0gbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdGFncy5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGJSZWN1cnNpb24pIHtcclxuICAgICAgICAgICAgICAgIGxldCByZXQgPSBjaGlsZC5maW5kVGFnQnlOYW1lKG5hbWUsIGJSZWN1cnNpb24pO1xyXG4gICAgICAgICAgICAgICAgdGFncyA9IHRhZ3MuY29uY2F0KHJldCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0YWdzO1xyXG4gICAgfVxyXG59Il19