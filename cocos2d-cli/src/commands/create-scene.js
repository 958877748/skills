/**
 * create-scene 命令 - 创建场景文件
 */

const fs = require('fs');
const path = require('path');
const { SceneParser, CCNode, CCCanvas, CCWidget, CCCamera, CCLabel, CCSprite, CCButton } = require('../lib/cc');
const { buildTree } = require('../lib/node-utils');
const { loadScriptMap } = require('../lib/fire-utils');

/**
 * 创建组件
 */
function createComponent(type) {
    switch (type.toLowerCase()) {
        case 'canvas':
            return new CCCanvas();
        case 'widget':
            return new CCWidget();
        case 'camera':
            return new CCCamera();
        case 'label':
            return new CCLabel();
        case 'sprite':
            return new CCSprite();
        case 'button':
            return new CCButton();
        default:
            return null;
    }
}

/**
 * 从 JSON 定义添加节点
 */
function addNodeFromDef(parser, def, parent) {
    const node = new CCNode(def.name || 'Node');
    
    // 应用属性
    if (def.active !== undefined) node._active = def.active;
    if (def.opacity !== undefined) node._opacity = def.opacity;
    if (def.width !== undefined) node._contentSize.width = def.width;
    if (def.height !== undefined) node._contentSize.height = def.height;
    if (def.x !== undefined) node._trs.array[0] = def.x;
    if (def.y !== undefined) node._trs.array[1] = def.y;
    if (def.rotation !== undefined) {
        node._trs.array[5] = def.rotation * Math.PI / 180;
        node._eulerAngles.z = def.rotation;
    }
    if (def.scaleX !== undefined) node._trs.array[7] = def.scaleX;
    if (def.scaleY !== undefined) node._trs.array[8] = def.scaleY;
    if (def.anchorX !== undefined) node._anchorPoint.x = def.anchorX;
    if (def.anchorY !== undefined) node._anchorPoint.y = def.anchorY;
    
    // 添加节点
    parser.addNode(node, parent);
    
    // 添加组件
    if (def.components) {
        for (const compDef of def.components) {
            let comp = null;
            if (typeof compDef === 'string') {
                comp = createComponent(compDef);
            } else if (compDef.type) {
                comp = createComponent(compDef.type);
                // 应用组件属性
                if (compDef.props) {
                    for (const [key, value] of Object.entries(compDef.props)) {
                        comp[key] = value;
                    }
                }
            }
            if (comp) {
                parser.addComponent(node, comp);
            }
        }
    }
    
    // 递归处理子节点
    if (def.children && def.children.length > 0) {
        for (const childDef of def.children) {
            addNodeFromDef(parser, childDef, node);
        }
    }
    
    return node;
}

/**
 * 从 meta 文件读取 uuid
 */
function readUuidFromMeta(scenePath) {
    const metaPath = scenePath + '.meta';
    if (fs.existsSync(metaPath)) {
        try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            return meta.uuid || null;
        } catch (e) {
            return null;
        }
    }
    return null;
}

function run(args) {
    if (args.length < 1) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli create-scene [JSON文件路径] <输出路径.fire>' }));
        console.log(JSON.stringify({ hint: '不传 JSON 则创建空场景' }));
        return;
    }

    let jsonPath = null;
    let outputPath;

    if (args.length === 1) {
        outputPath = args[0];
    } else {
        jsonPath = args[0];
        outputPath = args[1];
    }

    const sceneName = path.basename(outputPath, '.fire');

    try {
        // 创建空场景
        const parser = new SceneParser();
        parser.parseJSON([
            { __type__: 'cc.SceneAsset', _name: '', _objFlags: 0, _native: '', scene: { __id__: 1 } },
            { __type__: 'cc.Scene', _name: sceneName, _objFlags: 0, _parent: null, _children: [], _active: true, _components: [], _prefab: null, _opacity: 255, _color: { __type__: 'cc.Color', r: 255, g: 255, b: 255, a: 255 }, _contentSize: { __type__: 'cc.Size', width: 0, height: 0 }, _anchorPoint: { __type__: 'cc.Vec2', x: 0, y: 0 }, _trs: { __type__: 'TypedArray', ctor: 'Float64Array', array: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] }, _is3DNode: true, _groupIndex: 0, groupIndex: 0, autoReleaseAssets: false, _id: '' }
        ]);

        // 从 JSON 创建
        if (jsonPath && fs.existsSync(jsonPath)) {
            const input = fs.readFileSync(jsonPath, 'utf8');
            const cleanInput = input.replace(/^\uFEFF/, '').trim();
            const nodeDef = JSON.parse(cleanInput);
            
            const nodes = Array.isArray(nodeDef) ? nodeDef : [nodeDef];
            for (const def of nodes) {
                addNodeFromDef(parser, def, parser.scene);
            }
        }

        // 确保目录存在
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 读取 meta 文件中的 uuid
        const uuid = readUuidFromMeta(outputPath);
        if (uuid && parser.scene) {
            parser.scene._id = uuid;
        }

        // 保存
        parser.save(outputPath);

        // 输出 tree
        const data = parser.toJSON();
        const scriptMap = loadScriptMap(outputPath);
        console.log(buildTree(data, scriptMap, 1).trim());

    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };