import { Label, isValid, tween } from 'cc';
import Formater from './formater';
import { EmptyCallback } from '../define';

export default class TextUtils {
    /**
     * 使用指定模式更新这个label的显示,没有动效的处理，直接
     * @param label
     * @param val           数值
     * @param seprateCount  多少个数字进行分割，默认3，千分位
     * @param seprate       分割符号是什么，默认","
     * @param pMulte        需要除以多少倍，默认1
     * @param fixedCount    最后保留几位小数，默认2
     */
    public static updateNumberTextWithSperateAndFixed(label: Label, val: number, seprateCount: number = 3, seprate: string = ',', pMulte: number = 1, fixedCount: number = 2) {
        const floater = (val / pMulte).toFixed(fixedCount);
        const text = Formater.splitNumber(floater, seprate, seprateCount);
        label.string = text;
    }

    /**
     * @param curentCount   当前数值
     * @param targetCount   目标数值
     * @param duaring       需要时间
     * @param call          完成回调
     * 注意：默认使用千分位，且默认单位分
     */
    public static updateMoneyLabelCountWithAnim(label: Label, curentCount: number, targetCount: number, duaring: number, call?: EmptyCallback) {
        const info = {
            count: curentCount,
        };
        if (curentCount == targetCount) {
            call && call();
            return;
        }
        tween(info)
            .to(
                duaring,
                {
                    count: targetCount,
                },
                {
                    onUpdate(target, ratio) {
                        const pcount = target['count'];
                        if (!label || !isValid(label)) {
                            return;
                        }
                        TextUtils.updateNumberTextWithSperateAndFixed(label, pcount);
                    },
                },
            )
            .call(() => {
                call && call();
            })
            .start();
    }

    /**
     * 在指定时间内，将一个label的数值从curentCount变成targetCount，倍数显示，会有x符号在前面，且保留两位小数
     * @param label 
     * @param curentCount 
     * @param targetCount 
     * @param duaring 
     * @param call 
     * @returns 
     */
    public static updateLabelMultiplierWithAnim(label: Label, curentCount: number, targetCount: number, duaring: number, call?: EmptyCallback,strFront : string = 'x') {

        if (curentCount == targetCount) {
            call && call();
            return;
        }
        let infos = {
            currrent: curentCount * 100,
            targetCount: targetCount * 100,
        };
        let start = curentCount * 100;
        let end = targetCount * 100;
        //console.log('curentCount', curentCount,targetCount,duaring);
        label.string = 'x' + (curentCount).toFixed(2);
        tween(infos).to(
                duaring,
                {
                    currrent: targetCount,
                },
                {
                    onUpdate(target : any, ratio) {
                        //console.log('target', target.currrent);
                        const pcount = start + (end - start) * ratio;
                        if (!label || !isValid(label)) {
                            return;
                        }
                        //console.log('pcount', pcount);
                        label.string = strFront + (pcount / 100).toFixed(2);
                    },
                },
            ).call(() => {
                if(label && label.isValid){
                    label.string = strFront + (targetCount).toFixed(2);
                }
                call && call();
            }).start();
    }


    /**
     * 将一个传入的数字val转换成带单位的字符串,需要保留fixedCount位小数
     * 小于1000的时候直接使用数字转换为字符串
     * 大于1000的时候转换为K,M,B,T
     * @param val 
     */
    public static formatNumberWithUnit(val : number | string,fixedCount: number = 2) : string{
        let preNum : number = 0;
        if(typeof val == 'string'){
            preNum = parseFloat(val);
        }else{
            preNum = val;
        }
        let front = '';
        if(preNum < 0){
            front = '-';
        }
        let num = Math.abs(preNum);
        if(num < 1000){
            return front + num.toFixed(fixedCount);
        }
        let unit = ['','K','M','B','T'];
        let index = 0;
        while(num >= 1000 && index < unit.length){
            num = num / 1000;
            index++;
        }
        return front + num.toFixed(fixedCount) + unit[index];
    }

    
}
