import * as fs from 'fs';
import * as path from 'path';
import { generateFileId } from '../lib/fire-utils.js';
import { CCPrefab, CCPrefabInfo } from '../lib/cc/CCPrefab.js';
import CCNode from '../lib/cc/CCNode.js';
import CCComponent from '../lib/cc/CCComponent.js';
import CCCanvas from '../lib/cc/CCCanvas.js';
import CCWidget from '../lib/cc/CCWidget.js';
import CCSprite from '../lib/cc/CCSprite.js';
import CCLabel from '../lib/cc/CCLabel.js';
import CCButton from '../lib/cc/CCButton.js';

function createNodeFromJSON(json: any): CCNode {
    const node = new CCNode(json.name || 'Node');
    
    if (json.x !== undefined) node.x = json.x;
    if (json.y !== undefined) node.y = json.y;
    if (json.width !== undefined) node.width = json.width;
    if (json.height !== undefined) node.height = json.height;
    if (json.anchorX !== undefined) node.anchorX = json.anchorX;
    if (json.anchorY !== undefined) node.anchorY = json.anchorY;
    if (json.color !== undefined) {
        const color = hexToRgb(json.color);
        if (color) node.setColor(color.r, color.g, color.b);
    }
    if (json.active !== undefined) node._active = json.active;
    
    // 添加组件
    if (json.components) {
        for (const comp of json.components) {
            let component: CCComponent | null = null;
            if (typeof comp === 'string') {
                // 简单组件类型
                component = createComponent(comp);
            } else if (comp.type) {
                // 带配置的组件
                component = createComponent(comp.type, comp);
            }
            if (component) {
                (component.node as any) = node;  // 建立组件和节点的关联
                (node._components as any[]).push(component);
            }
        }
    }
    
    // 递归添加子节点
    if (json.children) {
        for (const childJson of json.children) {
            const childNode = createNodeFromJSON(childJson);
            (childNode._parent as any) = node;  // 建立父子关系
            (node._children as any[]).push(childNode);
        }
    }
    
    return node;
}

function createComponent(type: string, config?: any): CCComponent | null {
    switch (type.toLowerCase()) {
        case 'sprite':
            return new CCSprite();
        case 'label':
            const label = new CCLabel();
            if (config) {
                if (config.string) label.setString(config.string);
                if (config.fontSize) label._fontSize = config.fontSize;
                if (config.horizontalAlign) {
                    const alignMap: Record<string, number> = { left: 0, center: 1, right: 2 };
                    label._N$horizontalAlign = alignMap[config.horizontalAlign] ?? 1;
                }
            }
            return label;
        case 'button':
            return new CCButton();
        case 'canvas':
            return new CCCanvas();
        case 'widget':
            return new CCWidget();
        default:
            return null;
    }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function run(args: string[]): void {
    const jsonPath = args[0];
    const outputPath = args[1] || 'output.prefab';
    
    if (!jsonPath) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli create-prefab <json文件> [输出.prefab]' }));
        return;
    }
    
    try {
        // 读取 JSON
        const jsonContent = fs.readFileSync(jsonPath, 'utf8');
        const jsonData = JSON.parse(jsonContent);
        
        // 创建节点树
        const rootNode = createNodeFromJSON(jsonData);
        
        // 创建预制体
        const prefab = new CCPrefab();
        prefab.setRoot(rootNode);
        
        // 序列化为 JSON
        const prefabData = prefab.toJSON();
        
        // 保存文件
        fs.writeFileSync(outputPath, JSON.stringify(prefabData, null, 2), 'utf8');
        
        console.log(JSON.stringify({ success: true, outputPath }));
    } catch (err: any) {
        console.log(JSON.stringify({ error: err.message }));
    }
}
