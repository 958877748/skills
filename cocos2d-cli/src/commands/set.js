/**
 * set 命令 - 修改节点属性
 */

const path = require('path');
const { SceneParser, PrefabParser } = require('../lib/cc');

/**
 * 解析属性键
 * 支持格式：x, name, label.string, sprite.sizeMode
 */
function parsePropertyKey(key) {
    const parts = key.split('.');
    if (parts.length === 1) {
        return { type: 'node', key: parts[0] };
    }
    return { type: 'component', compName: parts[0], prop: parts[1] };
}

/**
 * 设置节点属性
 */
function setNodeProp(node, key, value) {
    switch (key) {
        case 'name':
            node._name = value;
            break;
        case 'active':
            node._active = value === 'true' || value === true;
            break;
        case 'x':
            node._trs.array[0] = parseFloat(value);
            break;
        case 'y':
            node._trs.array[1] = parseFloat(value);
            break;
        case 'width':
            node._contentSize.width = parseFloat(value);
            break;
        case 'height':
            node._contentSize.height = parseFloat(value);
            break;
        case 'anchorX':
            node._anchorPoint.x = parseFloat(value);
            break;
        case 'anchorY':
            node._anchorPoint.y = parseFloat(value);
            break;
        case 'opacity':
            node._opacity = Math.max(0, Math.min(255, parseInt(value)));
            break;
        case 'scaleX':
            node._trs.array[7] = parseFloat(value);
            break;
        case 'scaleY':
            node._trs.array[8] = parseFloat(value);
            break;
        case 'rotation':
            node._trs.array[5] = parseFloat(value) * Math.PI / 180;
            node._eulerAngles.z = parseFloat(value);
            break;
        case 'group':
            node._groupIndex = parseInt(value);
            node.groupIndex = node._groupIndex;
            break;
        default:
            return false;
    }
    return true;
}

/**
 * 设置组件属性
 */
function setComponentProp(comp, prop, value) {
    const type = comp.__type__;
    
    if (prop === 'enabled') {
        comp._enabled = value === 'true' || value === true;
        return true;
    }
    
    if (type === 'cc.Label') {
        switch (prop) {
            case 'string':
                comp._string = value;
                comp['_N$string'] = value;
                return true;
            case 'fontSize':
                comp._fontSize = parseInt(value);
                return true;
            case 'lineHeight':
                comp._lineHeight = parseInt(value);
                return true;
        }
    }
    
    if (type === 'cc.Sprite') {
        switch (prop) {
            case 'sizeMode':
                comp._sizeMode = parseInt(value);
                return true;
            case 'type':
                comp._type = parseInt(value);
                return true;
        }
    }
    
    if (type === 'cc.Button') {
        switch (prop) {
            case 'interactable':
                comp['_N$interactable'] = value === 'true' || value === true;
                return true;
            case 'transition':
                comp.transition = parseInt(value);
                comp['_N$transition'] = parseInt(value);
                return true;
            case 'zoomScale':
                comp.zoomScale = parseFloat(value);
                return true;
        }
    }
    
    if (type === 'cc.Widget') {
        switch (prop) {
            case 'top':
                comp._top = parseFloat(value);
                return true;
            case 'bottom':
                comp._bottom = parseFloat(value);
                return true;
            case 'left':
                comp._left = parseFloat(value);
                return true;
            case 'right':
                comp._right = parseFloat(value);
                return true;
        }
    }
    
    if (type === 'cc.Canvas') {
        if (prop === 'designWidth') {
            comp._designResolution.width = parseInt(value);
            return true;
        }
        if (prop === 'designHeight') {
            comp._designResolution.height = parseInt(value);
            return true;
        }
    }
    
    return false;
}

/**
 * 解析命令行选项
 */
function parseOptions(args, startIndex) {
    const options = {};
    for (let i = startIndex; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const eqIndex = arg.indexOf('=');
            if (eqIndex > 0) {
                const key = arg.substring(2, eqIndex);
                const value = arg.substring(eqIndex + 1);
                options[key] = value;
            }
        }
    }
    return options;
}

function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli set <场景.fire|预制体.prefab> <节点路径> --属性=值' }));
        return;
    }
    
    const filePath = args[0];
    const nodePath = args[1];
    const options = parseOptions(args, 2);
    
    if (Object.keys(options).length === 0) {
        console.log(JSON.stringify({ error: '请指定要设置的属性，如 --x=100 --name=NewName' }));
        return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        let parser;
        
        if (ext === '.fire') {
            parser = SceneParser.parse(filePath);
        } else if (ext === '.prefab') {
            parser = PrefabParser.parse(filePath);
        } else {
            console.log(JSON.stringify({ error: '不支持的文件类型，仅支持 .fire 和 .prefab' }));
            return;
        }
        
        const node = parser.resolveNode(nodePath);
        
        if (!node) {
            console.log(JSON.stringify({ error: `节点不存在: ${nodePath}` }));
            return;
        }
        
        const changes = [];
        
        for (const [key, value] of Object.entries(options)) {
            const parsed = parsePropertyKey(key);
            
            if (parsed.type === 'node') {
                if (setNodeProp(node, parsed.key, value)) {
                    changes.push({ property: key, value });
                } else {
                    console.log(JSON.stringify({ error: `未知节点属性: ${key}` }));
                    return;
                }
            } else {
                // 组件属性
                const compName = parsed.compName.toLowerCase();
                const comp = node._components.find(c => 
                    c.__type__.toLowerCase().includes(compName)
                );
                
                if (!comp) {
                    console.log(JSON.stringify({ error: `节点 ${nodePath} 没有组件: ${parsed.compName}` }));
                    return;
                }
                
                if (setComponentProp(comp, parsed.prop, value)) {
                    changes.push({ property: key, value });
                } else {
                    console.log(JSON.stringify({ error: `未知组件属性: ${key}` }));
                    return;
                }
            }
        }
        
        // 保存
        parser.save(filePath);
        
        console.log(JSON.stringify({
            success: true,
            node: node._name,
            changes
        }, null, 2));
        
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };