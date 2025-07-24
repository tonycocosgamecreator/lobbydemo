export namespace lobbyhttp {

    export const AccessKeyId = 'devtest';
    export const AccessKeySecret = 'devtest';

    export enum Message {
        /** 获取游戏分类 */
        CATES = '/api/v1/gameList',

        /** 游戏登陆 */
        LOGIN = '/api/v1/gameLogin',
    }

    /**
   * 分类游戏列表
   */
    export interface ICateGameListsRsp {
        /** 是否成功 */
        code: number;
        /** 游戏列表 */
        data: {
            code: number;
            list: ICateGame[];
        }
    }

    /**
    * 分类游戏列表
    */
    export interface ICateGame {
        /** 游戏类型 */
        type: string;
        /** 游戏代码 */
        game_code: string;
        /** icon url */
        pic_url: string;
        /** 游戏名称 */
        name: string;
    }

    export interface ICateGameLoginRsp {
        /** 是否成功 */
        code: number;
        /** 游戏列表 */
        data: {
            code: number;
            list: string;
        }
    }
}


