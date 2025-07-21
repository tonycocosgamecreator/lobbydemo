(() => 
{
	let dirname = "?pos/targetPath"
	const fs_extra_1 = require("fs-extra")
	const path_1 = require("path")
	const vue_1 = require(path_1.join(dirname,'node_modules' ,"vue"))
    const exec 			= require('child_process').exec;
    
    let d = document.getElementById('prefab-tab');
    if(d){
        d.parentNode.removeChild(d);
    }
    let div = document.createElement('div');
    let ht = fs_extra_1.readFileSync(path_1.join(dirname, "./static/template/default/index.html"), "utf-8");
    div.innerHTML = ht;
    div.style.cssText = 'height: 21px; border: 1px solid #040404; z-index: 1;'
    div.id = 'prefab-tab'
    document.body.insertBefore(div, document.getElementById('dock'))
	window.vue_1 = vue_1;
    console.log("显示")
    const e = vue_1.createApp({
        el: div,
        data() {
          return {
            tabs: [],//[{ name:'test', uuid:'2' },{ name:'test3', uuid:'3' }],
            uiCfg: {},
            menuItems: [
                { label: '关闭', id: 'close' },
                { label: '关闭右侧', id: 'close-rights' },
                { label: '关闭其他', id: 'close-others' },
                { label: '全部关闭', id: 'close-all' },
                { label: '在文件夹中显示', id: 'reveal-in-finder' },
                { label: '跳到资源管理器', id: 'reveal-in-side-bar' },
            ],
            openUuid:'',
            menuShow: false,
            selectMenuItem: null,
            menuPos: { x: 0, y: 0, isLeft: true },
          }
        },
        watch:{
            menuShow(val){
                div.style.zIndex = val ? '99' : '1';
            },
        },
        mounted(){
            vueObj = this;
            var style = document.createElement("style");
            style.innerHTML = fs_extra_1.readFileSync(path_1.join(dirname, "./static/style/default/index.css"), "utf-8");
            div.appendChild(style)
            
            this._openScene1 = this.openScene.bind(this);
            Editor.Message.addBroadcastListener('scene:ready',this._openScene1)
            
            this.tabs = JSON.parse(localStorage.getItem('prefabTab') || '[]');
            this.openUuid = localStorage.getItem('prefabOpenUuid');
        },
        unmounted(){
            Editor.Message.removeBroadcastListener('scene:ready',this._openScene1)
        },
        methods:{
            openBtn(item){
                // this.openUuid = item.uuid
                Editor.Message.request("scene",'open-scene',item.uuid)
            },
            closeBtn(item){
                let idx = this.tabs.indexOf(item);
                idx != -1 && this.tabs.splice(idx,1)
                localStorage.setItem('prefabTab',JSON.stringify(this.tabs))
            },
            async openScene(uuid){
                let filePath = await Editor.Message.request("asset-db",'query-path',uuid);
                if(!filePath) return;

                let name = path_1.basename(filePath).split('.')[0];
                let tab = this.tabs.find((v)=>v.uuid == uuid)
                if(!tab){
                    this.tabs.push({
                        uuid:uuid,
                        name:name,
                        extname: path_1.extname(filePath),
                    })
                    localStorage.setItem('prefabTab',JSON.stringify(this.tabs))
                }else{
                    tab.name = name;
                }
                this.openUuid = uuid;
                localStorage.setItem('prefabOpenUuid',uuid)
            },
            enterTab(item){
                this.uiCfg[item.uuid] = true;
            },
            
            leaveTab(item){
                this.uiCfg[item.uuid] = false;
            },

            openMenu(item, event){
                this.selectMenuItem = item;
                this.menuShow = true;
                this.menuPos.isLeft = event.clientX < window.innerWidth * 0.85;
                this.menuPos.x = this.menuPos.isLeft ? event.clientX : window.innerWidth - event.clientX;
                this.menuPos.y = event.clientY;
                for(let v of this.menuItems){
                    v.mouseenter = false;
                }
            },

            async clickMenu(menuItem){
                this.menuShow = false;
                if(!this.selectMenuItem) return console.warn('not selectMenuItem');
                if(menuItem.id == 'close'){
                    this.closeBtn(this.selectMenuItem)
                }else if(menuItem.id == 'close-rights'){
                    let idx = this.tabs.indexOf(this.selectMenuItem);
                    if(idx != -1){
                        this.tabs = this.tabs.slice(0,idx+1);
                        localStorage.setItem('prefabTab',JSON.stringify(this.tabs))
                    }
                }else if(menuItem.id == 'close-others'){
                    this.tabs = [this.selectMenuItem];
                    localStorage.setItem('prefabTab',JSON.stringify(this.tabs))
                }else if(menuItem.id == 'close-all'){
                    this.tabs = [];
                    localStorage.setItem('prefabTab',JSON.stringify(this.tabs))
                }else if(menuItem.id == 'reveal-in-finder'){
                    let url = await Editor.Message.request('asset-db','query-path',this.selectMenuItem.uuid)
                    let isWin32 = path_1.sep == '\\';
                    url && exec(isWin32 ? 'Explorer /select,"'+url+'"' : "open -R " + url)
                }else if(menuItem.id == 'reveal-in-side-bar'){
                    Editor.Message.broadcast('twinkle',this.selectMenuItem.uuid)
                }
            },
        }
    });
    
    // e.config.compilerOptions.isCustomElement = (e) => e.startsWith("ui-") || e.startsWith("nobr");
    e.mount(div);
})();
