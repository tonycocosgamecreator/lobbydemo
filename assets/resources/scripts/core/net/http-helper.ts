import { bDebug, EmptyCallback } from "../define";

/**
 * http请求帮助类
 */
export class HttpHelper {

    /**
     *  发送一个get请求
     * @param url   请求地址
     * @param params    请求参数
     * @param timeoutTime   超时时间,默认5秒
     * @returns 
     */
    public static async Get(url : string,params : object = {},timeoutTime : number = 5000) : Promise<string> {
        return new Promise<string>((resolve)=>{
            let xhr = new XMLHttpRequest();
            xhr.responseType = 'text';
            xhr.timeout = timeoutTime;
            xhr.onreadystatechange = function(){
                if(xhr.readyState == 4){
                    if(xhr.status == 200){
                        resolve(xhr.responseText);
                    }else{
                        resolve('');
                    }
                    console.log('xhr.status',xhr.status);
                }
            }
            xhr.open('GET',url,true);
            xhr.setRequestHeader('Content-Type','application/json');
            xhr.send(JSON.stringify(params));
        });
    }
    /**
     *  发送一个post请求
     * @param url  请求地址
     * @param params  请求参数
     * @param timeoutTime  超时时间,默认5秒
     * @returns 
     */
    public static async Post(url : string,params : object = {},timeoutTime : number = 5000,headers : object = {}) : Promise<string> {
        return new Promise<string>((resolve)=>{
            let xhr = new XMLHttpRequest();
            xhr.responseType = 'text';
            xhr.timeout = timeoutTime;
            
            xhr.open('POST',url,true);
            xhr.setRequestHeader('Content-Type','application/json');
            //设置xhr请求头
            for(const key in headers){
                xhr.setRequestHeader(key,headers[key]);
            }

            xhr.ontimeout = function(e){
                bDebug && console.error(`HttpHelper.Post ${url} timeout`);  
                resolve('ontimeout');
            }

            xhr.onload = function(){
                resolve(xhr.responseText);
            }

            xhr.onerror = function(e){
                bDebug && console.error(`HttpHelper.Post ${url} error`);  
                resolve('onerror');
            }

            xhr.send(JSON.stringify(params));
            
        });
    }

}