import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";
import fs from "fs";
import he from "he";
import Tools from "./tools";

export default class Xml {
    rootTag;

    /**
     * 从xml文件加载数据
     * @param {*} filePath 
     */
    load(filePath) {

        let parser = new XMLParser({
            ignoreAttributes: false,
            preserveOrder: true,
            attributeValueProcessor: (attributeName, val) => {
                return he.decode(val);
            }
        });
        let xmlText = fs.readFileSync(filePath, { encoding: "utf-8" });
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

        let builder = new XMLBuilder({
            ignoreAttributes: false,
            preserveOrder: true,
            format: true,
            suppressEmptyNode: true,
            attributeValueProcessor: (attributeName, val) => {
                // console.log(Tools.format("attributeValueProcessor [%s]=[%s] he.decode=[%s]", attributeName, val, he.decode(val)));
                return he.decode(val as string);
            }
        });
        // console.log("write", filePath)
        let outputText = builder.build(fxpData);

        fs.writeFileSync(filePath, outputText, { encoding: "utf-8" });
    }

    findTagByName(tagName, bRecursion = true) {
        return this.rootTag.findTagByName(tagName, bRecursion);
    }
}

export class XmlTag {
    name;
    attrs;
    children;

    constructor () {
        this.attrs = {};
        this.children = [];
    }

    /** 解析fxp格式数据 */
    parseFxpTagData(tagData) {

        // key不是":@"的，是tagName，对应的值是children列表
        Tools.forEachMap(tagData, (k, v) => {
            if (k != ":@") {
                this.name = k;
                return true;
            }
        });

        if (tagData[":@"]) {
            Tools.forEachMap(tagData[":@"], (k, v) => {
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
        Tools.forEachMap(this.attrs, (k, v) => {
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