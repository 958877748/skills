/**
 * create-scene 命令 - 创建场景
 * @module commands/create-scene
 * @param {string[]} args - [JSON文件路径] [输出.fire]
 */

import * as fs from 'fs';
import * as path from 'path';
import CCNode from './lib/cc/CCNode.js';
import CCScene from './lib/cc/CCScene.js';
import CCSceneAsset from './lib/cc/CCSceneAsset.js';
import CCCanvas from './lib/cc/CCCanvas.js';
import CCWidget from './lib/cc/CCWidget.js';
import CCCamera from './lib/cc/CCCamera.js';
import CCSprite from './lib/cc/CCSprite.js';
import CCLabel from './lib/cc/CCLabel.js';
import CCButton from './lib/cc/CCButton.js';
import CCLayout from './lib/cc/CCLayout.js';
import { parseHtml } from './lib/html/html-parser.js';
import { htmlToCocos } from './lib/html/html-to-cc.js';
function createNodeFromConfig(config) {
    const node = new CCNode(config.name || 'Node');
    if (config.x !== undefined)
        node.x = config.x;
    if (config.y !== undefined)
        node.y = config.y;
    if (config.width !== undefined)
        node.width = config.width;
    if (config.height !== undefined)
        node.height = config.height;
    if (config.anchorX !== undefined)
        node.anchorX = config.anchorX;
    if (config.anchorY !== undefined)
        node.anchorY = config.anchorY;
    if (config.opacity !== undefined)
        node._opacity = config.opacity;
    if (config.active !== undefined)
        node._active = config.active;
    if (config.color) {
        const hex = config.color.replace('#', '');
        if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            node.setColor(r, g, b);
        }
    }
    if (config.components) {
        for (const comp of config.components) {
            const component = createComponent(comp);
            if (component) {
                component.node = node;
                node._components.push(component);
            }
        }
    }
    if (config.children) {
        for (const childConfig of config.children) {
            const childNode = createNodeFromConfig(childConfig);
            childNode._parent = node;
            node._children.push(childNode);
        }
    }
    return node;
}
function createComponent(config) {
    switch (config.type) {
        case 'Sprite':
            return new CCSprite();
        case 'Label': {
            const label = new CCLabel();
            if (config.string !== undefined)
                label.setString(config.string);
            if (config.fontSize !== undefined)
                label._fontSize = config.fontSize;
            if (config.horizontalAlign !== undefined)
                label._N$horizontalAlign = config.horizontalAlign;
            if (config.lineHeight !== undefined)
                label._lineHeight = config.lineHeight;
            return label;
        }
        case 'Button':
            return new CCButton();
        case 'Widget': {
            const widget = new CCWidget();
            widget._alignFlags = 0;
            widget._isAbsLeft = true;
            widget._isAbsRight = true;
            widget._isAbsTop = true;
            widget._isAbsBottom = true;
            if (config.isAlignLeft)
                widget._alignFlags |= 1 << 0;
            if (config.isAlignRight)
                widget._alignFlags |= 1 << 1;
            if (config.isAlignTop)
                widget._alignFlags |= 1 << 2;
            if (config.isAlignBottom)
                widget._alignFlags |= 1 << 3;
            if (config.left !== undefined)
                widget._left = config.left;
            if (config.right !== undefined)
                widget._right = config.right;
            if (config.top !== undefined)
                widget._top = config.top;
            if (config.bottom !== undefined)
                widget._bottom = config.bottom;
            return widget;
        }
        case 'Layout': {
            const layout = new CCLayout();
            if (config.layoutType !== undefined)
                layout._N$layoutType = config.layoutType;
            if (config.resizeMode !== undefined)
                layout._resize = config.resizeMode;
            if (config.paddingLeft !== undefined)
                layout._N$paddingLeft = config.paddingLeft;
            if (config.paddingRight !== undefined)
                layout._N$paddingRight = config.paddingRight;
            if (config.paddingTop !== undefined)
                layout._N$paddingTop = config.paddingTop;
            if (config.paddingBottom !== undefined)
                layout._N$paddingBottom = config.paddingBottom;
            if (config.spacingX !== undefined)
                layout._N$spacingX = config.spacingX;
            if (config.spacingY !== undefined)
                layout._N$spacingY = config.spacingY;
            return layout;
        }
        default:
            return null;
    }
}
export function run(args) {
    const inputPath = args[0];
    const outputPath = args[1] || 'output.fire';
    if (!inputPath) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli create-scene <html|json> [输出.fire]' }));
        return;
    }
    try {
        const ext = path.extname(inputPath).toLowerCase();
        const content = fs.readFileSync(inputPath, 'utf8');
        let rootNode;
        if (ext === '.html' || ext === '.htm') {
            const parsed = parseHtml(content);
            const cocosConfig = htmlToCocos(parsed.root);
            rootNode = createNodeFromConfig(cocosConfig);
        }
        else {
            const jsonData = JSON.parse(content);
            rootNode = createNodeFromConfig(jsonData);
        }
        const scene = new CCScene();
        scene._name = path.basename(outputPath, '.fire');
        const canvas = new CCNode('Canvas');
        canvas.addComponent(new CCCanvas());
        const canvasWidget = new CCWidget();
        canvasWidget._alignFlags = 45;
        canvasWidget._left = 0;
        canvasWidget._right = 0;
        canvasWidget._top = 0;
        canvasWidget._bottom = 0;
        canvas.addComponent(canvasWidget);
        canvas.width = 750;
        canvas.height = 1334;
        const camera = new CCNode('Main Camera');
        camera.addComponent(new CCCamera());
        camera._parent = canvas;
        canvas._children.push(camera);
        rootNode._parent = canvas;
        canvas._children.push(rootNode);
        canvas._parent = scene;
        scene._children.push(canvas);
        const sceneAsset = new CCSceneAsset();
        sceneAsset._scene = scene;
        const sceneData = sceneAsset.toJSON();
        fs.writeFileSync(outputPath, JSON.stringify(sceneData, null, 2), 'utf8');
        console.log(JSON.stringify({ success: true, outputPath }));
    }
    catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}
