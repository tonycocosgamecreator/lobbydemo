'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = exports.template = exports.style = void 0;
exports.update = update;
exports.ready = ready;
exports.close = close;
const path_1 = __importDefault(require("path"));
const global_1 = require("./global");
const fs_extra_1 = __importDefault(require("fs-extra"));
let panel;
let bundleNames = [];
exports.style = ``;
exports.template = `
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
exports.$ = {
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
function update(options, key) {
    return __awaiter(this, void 0, void 0, function* () {
        if (key) {
            return;
        }
        // when import build options, key will bey ''
        init();
    });
}
function ready(options) {
    // @ts-ignore
    panel = this;
    panel.options = options;
    init();
}
function close() {
    panel.$.hideLink.removeEventListener('change', onHideLinkChange);
}
function init() {
    bundleNames = [];
    const bundleDir = path_1.default.join(Editor.Project.path, 'assets', 'bundles');
    //获取这个文件夹下所有的文件夹
    const bundles = fs_extra_1.default.readdirSync(bundleDir);
    const names = bundles.filter((item) => {
        const stat = fs_extra_1.default.statSync(path_1.default.join(bundleDir, item));
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
function onHideLinkChange(event) {
    panel.options.hideLink = event.target.value;
    // Note: dispatch the change to build panel
    panel.dispatch('update', `packages.${global_1.PACKAGE_NAME}.hideLink`, panel.options.hideLink);
    updateLink();
}
function updateLink() {
    console.warn('bundleNames->', bundleNames);
    if (panel.options.hideLink) {
        panel.$.link.style.display = 'none';
    }
    else {
        panel.$.link.style.display = 'block';
    }
}
