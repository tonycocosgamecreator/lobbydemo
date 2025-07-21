import { sys, warn } from 'cc';
import { bDebug } from '../define';
import { native } from 'cc';

export default class ClipboardUtil {
    private static copyFromWeb(str: string) {
        const input = str.toString();
        const el = document.createElement('textarea');
        el.setAttribute('readonly', '');
        el.style.contain = 'strict';
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        el.style.fontSize = '12pt';
        const selection = getSelection();
        let originalRange: Range | boolean = false;
        if (selection.rangeCount > 0) {
            originalRange = selection.getRangeAt(0);
        }
        document.body.appendChild(el);
        el.value = input;
        el.select();
        el.setSelectionRange(0, input.length);
        let success = false;
        try {
            success = document.execCommand('copy');
        } catch (err) {
            bDebug && console.error('Error copying text:', err);
        }
        document.body.removeChild(el);
        if (originalRange) {
            selection.removeAllRanges();
            selection.addRange(originalRange);
        }
        return success;
    }

    private static copyFromiOSWeb(str: string) {
        const textString = str + '';
        let input: any = document.querySelector('#copy-input');
        if (!input) {
            input = document.createElement('input');
            input.id = 'copy-input';
            // 防止ios聚焦触发键盘事件
            input.readOnly = true;
            input.style.position = 'absolute';
            input.style.left = '-1000px';
            input.style.zIndex = '-1000';
            document.body.appendChild(input);
        }

        input.value = textString;
        input.select();

        function selectText(textbox, startIndex, stopIndex) {
            if (textbox.createTextRange) {
                const range = textbox.createTextRange();
                range.collapse(true);
                // 起始光标
                range.moveStart('character', startIndex);
                // 结束光标
                range.moveEnd('character', stopIndex - startIndex);
                range.select();
            } else {
                textbox.setSelectionRange(startIndex, stopIndex);
                textbox.focus();
            }
        }

        selectText(input, 0, textString.length);
        bDebug && console.log(document.execCommand('copy'), 'execCommand');
        if (document.execCommand('copy')) {
            document.execCommand('copy');
        }
        // input 自带的 select() 方法在苹果端无法进行选择，所以需要自己去写一个类似的方法
        input.blur();
    }
    /**
     * 将指定文本copy到剪切板
     * @param str
     */
    public static copyToClipboard(str: string) {
        if (sys.isNative) {
            native.copyTextToClipboard(str);
            return;
        }
        const userAgent = navigator.userAgent;
        if (/iPad|iPhone|iPod/.test(userAgent)) {
            this.copyFromiOSWeb(str);
        } else {
            this.copyFromWeb(str);
        }
    }
}
