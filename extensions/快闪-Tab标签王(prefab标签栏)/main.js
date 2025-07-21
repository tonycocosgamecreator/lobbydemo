"use strict";
const fs = require("fs");
const path = require("path");
const electron = require('electron')
// 获得Creator主窗口
function getMainWebContents(){
	let allwins = electron.BrowserWindow.getAllWindows();
	for (let i = 0; i < allwins.length; i++) {
		const win = allwins[i];
		const url = win.getURL()
		if (url.includes('windows/main.html') || win.title && win.title.includes('Cocos Creator')){
			return win.webContents;
		}
	}
	return;
}

module.exports = {
	load() {
		let webContents = getMainWebContents()
		try {
			// if (webContents.__injected_handle_prefab_tab) {
			// 	// in case plugin if reloaded
			// 	return;
			// }
		} catch (error) {
			// usually happen when creator is just started and main window is not created
			console.log(error);
			return
		}

		// 往web环境里写代码，添加键盘监听事件
		let hackCode = fs.readFileSync(path.join(__dirname, "panel", "hackCode.js")).toString();
		hackCode = hackCode.replace('?pos/targetPath',  __dirname.replace(/\\/g,'\\\\'));
		// Editor.log('hackCode', hackCode);
		// webContents.__injected_handle_prefab_tab = true;
		if(webContents){
			webContents.executeJavaScript(
				hackCode,function (result) { }
			);
		}else{
			console.warn("插件启动失败: webContents is null");
		}

	},

	unload() { 
		let webContents = getMainWebContents()
		if(webContents){
			webContents.executeJavaScript(
				`
				(()=>{
					let d = document.getElementById('prefab-tab');
					if(d){
						d.parentNode.removeChild(d);
					}
				})()
				`,function (result) { }
			);
		}
	},

	methods: {
		// setActive() {
		// 	Editor.Message.request("scene", "execute-scene-script", {
		// 		name: "simple-handle-node",
		// 		method: "set-active",
		// 		args: {},
		// 	});
		// },
		// setActiveRadio() {
		// 	Editor.Message.request("scene", "execute-scene-script", {
		// 		name: "simple-handle-node",
		// 		method: "set-active-radio",
		// 		args: {},
		// 	});
		// },
	},
};
