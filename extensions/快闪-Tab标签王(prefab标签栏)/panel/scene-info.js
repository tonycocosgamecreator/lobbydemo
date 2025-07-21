'use strict';

let eventFuncs = 
{
	'setActive'(event){
		let nodes = Editor.Selection.getSelected('node');
		if (nodes && nodes.length != 0)
		{
			let active = this.findNode(nodes[0]).active;
			for (let i = 0; i < nodes.length; i++) 
			{
				const id = nodes[i];
				let node = this.findNode(id)
				if(node){
					// node.active = active;
					this.setNodeActive(node.uuid,!active)
				}
			}
			// Editor.Ipc.sendToAll('scene:undo-commit'); 
			Editor.Message.send('scene','snapshot')
		}
	},

	// 显示选择node同时隐藏同层node
	'setActiveRadio'(event){
		let nodes = Editor.Selection.getSelected('node');
		if (nodes && nodes.length != 0)
		{
			let node = this.findNode(nodes[0]);
			if(node.parent){
				for (let i = 0; i < node.parent.children.length; i++) 
				{
					const childrenNode = node.parent.children[i];
					if(!childrenNode._objFlags){
						// childrenNode.active = childrenNode != node ? !active : active;
						const isSelectUuid = nodes.includes(childrenNode.uuid)
						this.setNodeActive(childrenNode.uuid,isSelectUuid ? true : false)
					}
				}
				// Editor.Ipc.sendToAll('scene:undo-commit'); 
				Editor.Message.send('scene','snapshot')
			}
		}
	},
	

	setNodeActive(uuid,active){
		Editor.Message.send('scene', 'set-property',{
			uuid: uuid,
			path: 'active',//要修改的属性
			dump: {
				type: typeof active, // "bool",
				isArray: false,//是否数组
				value: active // uuid
			}
		});
	},

	
	// 检测场景是否存在该子节点并返回相关信息
	findNode(select_uuid)
	{
		var canvas = cc.director.getScene();
		var ret_node 
		if (canvas && select_uuid) {
			this.getNodeChildren(canvas,(node)=>{
				if (node.uuid == select_uuid){
					ret_node = node;
					return ret_node;
				}
			})
		}
		return ret_node;
	},
	
	// 遍历所有深层子节点
	getNodeChildren(node,callFunc)
	{
		if (!node) return;
		let nodes = node.children;
		nodes.forEach((v)=>{
			this.getNodeChildren(v,callFunc)
		});
		callFunc(node)
	},

};



// 模块加载的时候触发的函数
exports.load = function() {};
// 模块卸载的时候触发的函数
exports.unload = function() {};

exports.methods = eventFuncs;