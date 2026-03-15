import CCNode from './cc/CCNode.js';
import CCCanvas from './cc/CCCanvas.js';
import CCWidget from './cc/CCWidget.js';
import CCSprite from './cc/CCSprite.js';
import CCLabel from './cc/CCLabel.js';
import CCButton from './cc/CCButton.js';
import CCCamera from './cc/CCCamera.js';
import CCRichText from './cc/CCRichText.js';
import { parseColor } from './utils.js';

/**
 * 从 JSON 创建节点树
 */
export function fromJSON(json: any[]): CCNode {
    const nodes: (CCNode | null)[] = [];
    
    // 第一遍：创建所有节点
    json.forEach((item, index) => {
        nodes[index] = parseNode(item);
    });
    
    // 第二遍：建立父子关系
    json.forEach((item, index) => {
        if (item.children && nodes[index]) {
            item.children.forEach((childIdx: number) => {
                const child = nodes[childIdx];
                const parent = nodes[index];
                if (child && parent) {
                    parent.addChild(child);
                }
            });
        }
    });
    
    return nodes[0]!;
}

/**
 * 解析单个节点
 */
export function parseNode(item: any): CCNode {
    const node = new CCNode(item.name || 'Node');
    
    // 应用属性
    if (item.x !== undefined || item.y !== undefined) {
        node.setPosition(item.x ?? 0, item.y ?? 0);
    }
    if (item.width !== undefined || item.height !== undefined) {
        node.setContentSize(item.width ?? 100, item.height ?? 100);
    }
    if (item.scaleX !== undefined || item.scaleY !== undefined) {
        node.setScale(item.scaleX ?? 1, item.scaleY ?? 1);
    }
    if (item.rotation !== undefined) {
        node.setRotation(item.rotation);
    }
    if (item.opacity !== undefined) {
        node.setOpacity(item.opacity);
    }
    if (item.color) {
        const c = parseColor(item.color);
        if (c) node.setColor(c.r, c.g, c.b, c.a);
    }
    if (item.anchorX !== undefined || item.anchorY !== undefined) {
        node.setAnchorPoint(item.anchorX ?? 0.5, item.anchorY ?? 0.5);
    }
    if (item.active !== undefined) {
        node.setActive(item.active);
    }
    
    // 添加组件
    if (item.components) {
        item.components.forEach((comp: any) => {
            addComponentToNode(node, comp);
        });
    }
    
    return node;
}

/**
 * 添加组件到节点
 */
function addComponentToNode(node: CCNode, comp: any): void {
    switch (comp.type) {
        case 'Sprite':
            node.addComponent(new CCSprite());
            break;
        case 'Label':
            const label = new CCLabel();
            if (comp.string) label._string = comp.string;
            if (comp.fontSize) label._fontSize = comp.fontSize;
            node.addComponent(label);
            break;
        case 'Button':
            node.addComponent(new CCButton());
            break;
        case 'Canvas':
            node.addComponent(new CCCanvas());
            break;
        case 'Widget':
            node.addComponent(new CCWidget());
            break;
        case 'Camera':
            node.addComponent(new CCCamera());
            break;
        case 'RichText':
            node.addComponent(new CCRichText());
            break;
    }
}

/**
 * 应用节点属性
 */
export function applyNodeProps(node: CCNode, props: Record<string, any>): void {
    if (props.name !== undefined) node._name = props.name;
    if (props.x !== undefined) node.x = props.x;
    if (props.y !== undefined) node.y = props.y;
    if (props.width !== undefined) node.width = props.width;
    if (props.height !== undefined) node.height = props.height;
    if (props.scaleX !== undefined) node.scaleX = props.scaleX;
    if (props.scaleY !== undefined) node.scaleY = props.scaleY;
    if (props.rotation !== undefined) node.setRotation(props.rotation);
    if (props.opacity !== undefined) node._opacity = props.opacity;
    if (props.active !== undefined) node._active = props.active;
}
