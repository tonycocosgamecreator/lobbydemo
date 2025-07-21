/**
 * 浏览器参数的帮助类
 */
export default class BrowserUtils {
    /**
     * 当前浏览器的参数
     */
    private static _params : {[key : string] : string}  = {};
    /**
     * 主页
     */
    public static home_url : string = '';
    /**
     * 初始化
     */
    public static Init(){
        this._params    = {};
        if (window == null || window.location == null) return null;
        const search = window.location.search;
        if (search == null || search.length == 0) return null;
        const params = search.substring(1).split('&');
        for (let i = 0; i < params.length; i++) {
            const param = params[i].split('=');
            this._params[param[0]]  = param[1];
        }

        // const url = top?.location?.href;
        // if(url){
        //     this.home_url = url;
        // }
    }
    /**
     * 获取当前所有的参数
     */
    public static get params(){
        return this._params;
    }

    /**
     * 查询url参数
     * @param key
     */
    public static getParam(key: string): string {
        if(this._params[key]){
            return this._params[key];
        }
        return null;
    }

    /**
     * 设置当前 URL 的参数（修改历史记录，不会刷新当前网页）
     * @param param 参数
     */
    public static setParam(param: string): void {
        if (window == null || window.history == null) return;
        window?.history?.replaceState?.({}, null, `?${param}`);
    }

    /**
     * 清除当前 URL 的参数（修改历史记录，不会刷新当前网页）
     */
    public static clearParam(): void {
        window?.history?.replaceState?.({}, null, '.');
    }

    /** 页面内跳转 */
    public static openURL(url: string, mode: 'Current' | 'Parent' | 'Top' = 'Top') {
        switch (mode) {
            case 'Current':
                window?.location?.assign?.(url);
                break;
            case 'Parent':
                parent?.location?.assign?.(url);
                break;
            case 'Top':
                top?.location?.assign?.(url);
                break;
        }
    }

    /** 刷新页面 */
    public static refreshURL() {
        window?.location?.reload?.();
    }

    /**
     * 返回主页
     */
    public static back(){
       const return_url = this.getParam("return_url");
       if(return_url && return_url != ''){
            const url = decodeURIComponent(return_url);
            console.warn('find return url,so replace it!',url);
            top?.location?.replace(url);
       }else{
            console.warn('can not find return url,so refresh target page!');
            this.refreshURL();
       }
    }

}