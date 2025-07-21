'use strict';

import path from 'path';
import { ArrayItem, ICustomPanelThis, ITaskOptions } from '../@types';
import { PACKAGE_NAME } from './global';
import fs from 'fs-extra';
let panel: ICustomPanelThis;
let bundleNames: ArrayItem[] = [];
export const style = ``;

export const template = `
<div class="build-plugin">
    <ui-prop>
        <ui-label slot="label" value="Hide Link"></ui-label>
        <ui-checkbox slot="content"></ui-checkbox>
    </ui-prop>
    <ui-prop id="link">
        <ui-label slot="label" value="Docs"></ui-label>
        <ui-link slot="content" value=${Editor.Utils.Url.getDocUrl('editor/publish/custom-build-plugin.html')}></ui-link>
    </ui-prop>
    <ui-prop>
        <v-for v-bind="bundleNames" v-slot="{ item }">
            <ui-checkbox slot="content" value="item.value"></ui-checkbox>
            <ui-label slot="label" value="item.label"></ui-label>
        </v-for>
    </ui-prop>
</div>
`;

export const $ = {
    root: '.build-plugin',
    hideLink: 'ui-checkbox',
    link: '#link',
};

/**
 * all change of options dispatched will enter here
 * @param options 
 * @param key 
 * @returns 
 */
export async function update(options: ITaskOptions, key: string) {
    if (key) {
        return;
    }
    // when import build options, key will bey ''
    init();
}

export function ready(options: ITaskOptions) {
    // @ts-ignore
    panel = this as ICustomPanelThis;
    panel.options = options;
    init();
}

export function close() {
    panel.$.hideLink.removeEventListener('change', onHideLinkChange);
}

function init() {
    bundleNames = [];
    const bundleDir = path.join(Editor.Project.path, 'assets', 'bundles');
    //获取这个文件夹下所有的文件夹
    const bundles = fs.readdirSync(bundleDir);
    const names = bundles.filter((item) => {
        const stat = fs.statSync(path.join(bundleDir, item));
        return stat.isDirectory();
    });
    for (let i = 0; i < names.length; i++) {
        const bundleName = names[i];
        bundleNames.push({
            label: bundleName,
            value: bundleName,
        });
    }
    console.warn('bundleNames->', bundleNames);
    panel.$.hideLink.value = panel.options.hideLink;
    updateLink();
    panel.$.hideLink.addEventListener('change', onHideLinkChange);
}

function onHideLinkChange(event: any) {
    panel.options.hideLink = event.target.value;
    // Note: dispatch the change to build panel
    panel.dispatch('update', `packages.${PACKAGE_NAME}.hideLink`, panel.options.hideLink);
    updateLink();
}

function updateLink() {
    console.warn('bundleNames->', bundleNames);
    if (panel.options.hideLink) {
        panel.$.link.style.display = 'none';
    } else {
        panel.$.link.style.display = 'block';
    }
}
