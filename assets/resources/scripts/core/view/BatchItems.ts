import { Component, director, Director, geometry, Mask, Node, UITransform, _decorator, macro, dynamicAtlasManager, isValid } from 'cc';
const { ccclass, property } = _decorator;

export const BatchItemsConfig : any = {
    enable : false,
}

let _nodeID = 0;
let _draws:Array<Draw> = [];
//绘画层
class Draw {

    mask: boolean = false; //是否有mask遮盖组件
    nodes: Array<Node> = []; //绘画节点容器
    localOpacitys: Array<number> = [];
    childrens: Array<Array<Node>> = []; //绘图节点原子节点数据


    constructor() {
        this.nodes = [];
        this.mask = false;
        this.childrens = [];
    }
}



@ccclass('BatchItems')
export class BatchItems extends Component {

    //全局合批队列记录
    static queues = [];
    static nodes: Array<Node> = [];
    

    quene:Array<Draw> = []; //优先级分层队列
    children: Array<Node> = []; //记录原节点结构

    @property(UITransform)
    culling: UITransform = null;

    protected start(): void {
        
    }

    lateUpdate(dt: number) {
        if(!isValid(this.node) || !BatchItemsConfig.enable) return;
        BatchItems.nodes.push(this.node);
        BatchItems.queues.push(this.quene);
    }
}


//遍历建立绘图层队，并收集绘画节点
const DFS = function (prev: Draw | null, node: Node, active: boolean, level: number = 0, opacity: number = 1.0) {

    const uiProps = node._uiProps;
    const render: any = uiProps.uiComp; // as Renderable2D;
    opacity = opacity * uiProps.localOpacity;

    let key = _nodeID++;
    let draw = _draws[key];

    if (!draw) {
        draw = _draws[key]  = new Draw();
        //检测是否带有mask组件，不建议item内有mask
        draw.mask = (node.getComponent(Mask) != null);
    };

    prev = draw;
    let nodes = draw.nodes;
    let localOpacitys = draw.localOpacitys;
    if (render) {
        let selfOpacity = render.color ? render.color.a / 255 : 1;
        if (active && opacity > 0) { //node.active && active
            nodes.push(node); //收集节点
            localOpacitys.push(uiProps.localOpacity);//保存透明度
            uiProps.localOpacity = opacity; //opacity * uiProps.localOpacity; //设置当前透明度
        }
        opacity = opacity * selfOpacity;
    }
    else{
        if (active && opacity > 0) { //node.active && active
            nodes.push(node); //收集节点
            localOpacitys.push(-1);//保存透明度
        }
    }

    if (draw.mask) return;
    
    let childs = node.children;
    for (let i = 0; i < childs.length; i++) {
        let n = childs[i];
        let isActive =  active? isValid(n,true) : false;
        DFS(prev, n, isActive, level + 1, opacity);
    }

}

const changeTree = function (parent: Node, queue:Array<Draw>) {

    // queue.clear();
    queue.length = 0;
    let aabb0 = new geometry.AABB();
    let aabb1 = new geometry.AABB();
    let batchItem = parent.getComponent(BatchItems)!;
    batchItem.culling && batchItem.culling.getComputeAABB(aabb0);

    _draws = queue;
    //遍历所有绘画节点，按顺序分层
    let children = parent.children;
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (isValid(child,true)) { //node.activeInHierarchy

            //剔除显示范围外的item
            if (batchItem.culling) {
                let uiProps = child._uiProps;
                let trans = uiProps.uiTransformComp;
                if (trans) {
                    trans.getComputeAABB(aabb1);
                    if (!geometry.intersect.aabbWithAABB(aabb0, aabb1)) continue
                }
            }

            _nodeID = 0;
            DFS(null, child, true);
        }
    }

    // //记录item的父节点的子节点结构
    // let btn = parent.getComponent(BatchItems)!;
    batchItem.children = parent['_children']; //记录原来节点结构
    let childs: Array<Node> = parent['_children'] = []; //创建动态分层节点结构

    //拼接动态分层的绘画节点
    for(let i = 0;i < _draws.length ; i++){
        let curr = _draws[i];
        let mask = curr.mask;
        let nodes = curr.nodes;
        let childrens = curr.childrens;
        for (let i = 0; i < nodes.length; i++) {
            childrens[i] = nodes[i]['_children']; //记录原来节点结构
            !mask && (nodes[i]['_children'] = []);//清空切断下层节点
        }

        //按顺序拼接分层节点
        childs.push(...nodes);
    }
    
}

const resetTree = function (parent: Node, queue:Array<Draw>) {

    //恢复父节点结构
    let btn = parent.getComponent(BatchItems)!;
    parent['_children'].length = 0; //清空动态分层节点结构
    parent['_children'] = btn.children; //恢复原来节点结构

    //恢复原来节点结构
    _draws = queue;
    for(let i = 0 ;i < _draws.length ;i++){
        let curr = _draws[i];
        let nodes = curr.nodes;
        let childrens = curr.childrens;
        let localOpacitys = curr.localOpacitys;
        for (let i = 0; i < nodes.length; i++) {
            nodes[i]['_children'] = childrens[i]; //恢复原来节点结构
            //恢复原来透明度
            let lo = localOpacitys[i];
            if(lo >= 0){
                let uiProps = nodes[i]._uiProps
                uiProps.localOpacity = lo;
            }
        }
        childrens.length = 0;
        nodes.length = 0;
    }

    _draws.length = 0;
}


director.on(Director.EVENT_BEFORE_DRAW, (dt) => {
    if(!BatchItemsConfig.enable){
        return;
    }
    //绘画前拦截修改节点结构
    let nodes = BatchItems.nodes;
    let queues = BatchItems.queues;
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.active && node.isValid) {
            changeTree(node, queues[i]);
        }
    }
});


director.on(Director.EVENT_AFTER_DRAW, (dt) => {
    if(!BatchItemsConfig.enable){
        return;
    }
    //绘画结束后恢复节点结构
    let nodes = BatchItems.nodes;
    let queues = BatchItems.queues;
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node && node.isValid) {
            resetTree(node, queues[i]);
        }
    }

   
    nodes.length = 0;
    queues.length = 0;
    _draws.length = 0;
});
