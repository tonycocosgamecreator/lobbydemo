/// <reference path="@cocos/creator-types/editor/editor.d.ts"/>
/// <reference path="@cocos/creator-types/editor/message.d.ts"/>
/// <reference path="@cocos/creator-types/editor/utils.d.ts"/>

/// <reference path="@cocos/creator-types/editor/packages/builder/@types/public/global.d.ts"/>
export * from '@cocos/creator-types/editor/packages/builder/@types/public';

import { IPanelThis, IBuildTaskOption } from '@cocos/creator-types/editor/packages/builder/@types/public';
import { Link, Checkbox } from '@editor/creator-ui-kit/dist/renderer';

const PACKAGE_NAME = 'after_build_preload_jsbundle';
export interface ITaskOptions extends IBuildTaskOption {
    packages: {
        [PACKAGE_NAME]: IOptions;
    };
}

export interface ICustomPanelThis extends IPanelThis {
    options: ITaskOption;
    errorMap: any;
    pkgName: string;
    $: {
        root: HTMLElement;
        hideLink: Editor.UI.HTMLCustomElement<Checkbox>;
        link: Editor.UI.HTMLCustomElement<Link>;
    },
}

export interface IOptions {
    remoteAddress: string;
    enterCocos: string;
    selectChannel: string;
    selectEnv: string;
    objectTest: {
        number: number;
        string: string;
        boolean: boolean
    },
    arrayTest: [number, string, boolean];
    webTestOption: boolean;
}

export interface ITaskOptions extends IBuildTaskOption {
    packages: {
        ['cocos-build-template']: IOptions;
    };
}