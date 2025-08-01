const {
    readFileSync: readFileSync
}

=require("fs"),
{
join: join
}

=require("path"),
{
spawnSync: spawnSync
}

=require("child_process"),
PATH= {
    packageJSON: join(__dirname, "../package.json")
}

;

function checkCreatorTypesVersion(e) {
	
    const o="win32"===process.platform?"npm.cmd": "npm";
	
    let n=spawnSync(o, ["view", "@cocos/creator-types", "versions"],{shell : true}).stdout.toString();
	//console.log(Object.keys(n));
    try {
        n=JSON.parse(listString)
		console.log('result -> ',n);
    }

    catch(e) {}

    return ! !n.includes(e)
}

try {
    const e=readFileSync(PATH.packageJSON, "utf8"),
    o=JSON.parse(e).devDependencies["@cocos/creator-types"].replace(/^[^\d]+/, "");
    checkCreatorTypesVersion(o)||(console.log("[33mWarning:[0m"), console.log("  @en"), console.log("    Version check of @cocos/creator-types failed."), console.log(` The definition of ${o} has not been released yet. Please export the definition to the ./node_modules directory by selecting "Developer -> Export Interface Definition" in the menu of the Creator editor.`), console.log("    The definition of the corresponding version will be released on npm after the editor is officially released."), console.log("  @zh"), console.log("    @cocos/creator-types 版本检查失败。"), console.log(` ${o} 定义还未发布，请先通过 Creator 编辑器菜单 "开发者 -> 导出接口定义" ，导出定义到 ./node_modules 目录。`), console.log("    对应版本的定义会在编辑器正式发布后同步发布到 npm 上。"))
}

catch(e) {
    console.error(e)
}