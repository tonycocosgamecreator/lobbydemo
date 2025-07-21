//此文件为自动导出，用于Component中动态选择语言时做自动切换用，无其他意义，自动修改后下次导出会被覆盖
//若想增加新的语言，请打开_config/D_多语言/语言配置_i18n_language_config_db.xlsx中增加
//多语言图片资源放到每个bundle下的i18n目录下，新建该语言的文件夹，文件夹名字为上诉xlsx表中的id列的名字。
//多语言图片资源请手动获取，或者在切换语言的时候全部加载后直接使用


export enum LanguageIndex {
    en_us = 0,
    zh_cn = 1,
    pt_br = 2,
    hi_in = 3,
    en_in = 4,
}; 

export const LanguageKey : string[] = [ 
    'en_us',
    'zh_cn',
    'pt_br',
    'hi_in',
    'en_in',
]; 

/** 
 * 根据传入的语言的key，返回语言的enum的索引，如果没有，则返回-1 
 * @param name 
 * @returns 
 */ 
export function getLanguageIndexByKey(name : string) : LanguageIndex | number { 
    return LanguageKey.indexOf(name); 
} 

/**
 * 将服务器传递过来的语言代码，转换为本地的语言代码
 * @param serverKey 
 */
export function serverLanguageKeyToLocal(serverKey : string) : string { 
    return resourcesDb.I18N_Language_Code[serverKey]; 
}
