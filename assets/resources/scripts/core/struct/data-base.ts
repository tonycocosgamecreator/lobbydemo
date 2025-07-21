import { bDebug } from "../define";
import { Tools } from "../utils/tools";

/**
 * 配置表在内存中的组织结构，提供基础的遍历、取值接口
 */
export default class DataBase {
    /**
     * 配置表名称，如item_db
     */
    public name: string;

    /**
     * 配置表规则：
     * - m: { [majorId]: data }
     * - mm: { [majorId]: { [minorId]: data } }
     * - a: data[]
     * - ma: { [majorId]: data[] }
     */
    public rule: string;

    /**
     * 数据区，按照rule进行组织
     */
    public datas: any;

    /**
     * 字段名-字段类型
     */
    public fieldName_2_type: { [fieldName: string]: string };

    /**
     * 遍历数据
     * @param callback
     */
    public _foreachData1(callback: any) {
        switch (this.rule) {
            case 'm': {
                Tools.forEachMap(this.datas, (majorIdKey, data) => {
                    return callback(majorIdKey, data);
                });
                break;
            }
            case 'mm': {
                Tools.forEachMap(this.datas, (majorIdKey, v) => {
                    return callback(majorIdKey, v);
                });
                break;
            }
            case 'ma': {
                Tools.forEachMap(this.datas, (majorIdKey, v) => {
                    return callback(majorIdKey, v);
                });
                break;
            }
            case 'a': {
                for (let i = 0; i < this.datas.length; i++) {
                    const data = this.datas[i];
                    if (callback(i, data)) {
                        break;
                    }
                }
                break;
            }
        }
    }

    /**
     * 遍历数据
     * @param callback
     */
    public _foreachData2(callback: any) {
        switch (this.rule) {
            case 'm': {
                Tools.forEachMap(this.datas, (majorIdKey, data) => {
                    return callback(majorIdKey, data);
                });
                break;
            }
            case 'mm': {
                Tools.forEachMap(this.datas, (majorIdKey, v) => {
                    let bBreak = false;
                    Tools.forEachMap(v, (minorIdKey, data) => {
                        if (callback(majorIdKey, minorIdKey, data)) {
                            bBreak = true;
                            return true;
                        }
                    });
                    if (bBreak) return true;
                });
                break;
            }
            case 'ma': {
                Tools.forEachMap(this.datas, (majorIdKey, v) => {
                    for (let i = 0; i < v.length; i++) {
                        const data = v[i];
                        if (callback(majorIdKey, i, data)) {
                            return true;
                        }
                    }
                });
                break;
            }
            case 'a': {
                for (let i = 0; i < this.datas.length; i++) {
                    const data = this.datas[i];
                    if (callback(i, data)) {
                        break;
                    }
                }
                break;
            }
        }
    }

    /**
     * 获取任意一个数据
     * @returns
     */
    public _getAnyData() {
        let anyData = null;
        switch (this.rule) {
            case 'm': {
                Tools.forEachMap(this.datas, (majorIdKey, data) => {
                    anyData = data;
                    return true;
                });
                break;
            }
            case 'mm': {
                Tools.forEachMap(this.datas, (majorIdKey, v) => {
                    Tools.forEachMap(v, (minorIdKey, data) => {
                        anyData = data;
                        return true;
                    });
                    if (anyData) return true;
                });
                break;
            }
            case 'ma': {
                Tools.forEachMap(this.datas, (majorIdKey, v) => {
                    for (let i = 0; i < v.length; i++) {
                        anyData = v[i];
                        return true;
                    }
                });
                break;
            }
            case 'a': {
                for (let i = 0; i < this.datas.length; i++) {
                    anyData = this.datas[i];
                    break;
                }
                break;
            }
        }

        return anyData;
    }

    /**
     * 取值1
     * @param majorId
     * @returns
     */
    public _get1(majorId: any, bQuiet?: boolean) {
        const data = this.datas[majorId];
        if (data == null) {
            !bQuiet && bDebug && console.error(Tools.format('在表[%s]中找不到id[%s]', this.name, majorId));
            return null;
        }

        return data;
    }

    /**
     * 取值2
     * @param majorId
     * @param minorId
     * @returns
     */
    public _get2(majorId: any, minorId: any, bQuiet?: boolean) {
        const v = this.datas[majorId];
        if (v == null) {
            !bQuiet && bDebug && console.error(Tools.format('在表[%s]中找不到id[%s]', this.name, majorId));
            return null;
        }

        const vv = v[minorId];
        if (vv == null) {
            !bQuiet && bDebug && console.error(Tools.format('在表[%s][%s]中找不到id[%s]', this.name, majorId, minorId));
            return null;
        }

        return vv;
    }
}
