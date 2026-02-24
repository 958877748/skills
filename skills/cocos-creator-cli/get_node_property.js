/**
 * Cocos Creator 节点属性读取工具
 * 
 * 用法：
 * node get_node_property.js <场景文件路径> <节点索引|节点名称|节点路径> [组件名]
 * 
 * 示例：
 * # 按索引获取节点
 * node get_node_property.js ../cocos/assets/main.fire 3
 * 
 * # 按名称获取节点
 * node get_node_property.js ../cocos/assets/main.fire Canvas
 * 
 * # 按路径获取节点
 * node get_node_property.js ../cocos/assets/main.fire Canvas/Tilemap
 * node get_node_property.js ../cocos/assets/main.fire Canvas.Tilemap
 * 
 * # 获取组件
 * node get_node_property.js ../cocos/assets/main.fire 5 Tilemap
 * node get_node_property.js ../cocos/assets/main.fire Canvas/Tilemap Tilemap
 */

const fs = require('fs');
const path = require('path');

// 全局 uuid 到 URL 的映射缓存
let uuidToUrlCache = null;

/**
 * 构建 uuid 到 URL 的映射
 * @param {string} cocosDir - cocos 项目根目录（包含 assets 子目录）
 * @returns {object} uuid -> url 映射
 */
function buildUuidMap(cocosDir) {
    if (uuidToUrlCache) return uuidToUrlCache;
    
    uuidToUrlCache = {};
    
    const assetsDir = path.join(cocosDir, 'assets');
    const libraryDir = path.join(cocosDir, 'library', 'imports');
    
    // 1. 扫描 assets 目录获取 uuid -> assets 路径
    if (fs.existsSync(assetsDir)) {
        function scanDir(dir, urlPrefix) {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.readdirSync ? fs.statSync(fullPath) : null;
                if (!stat) continue;
                
                if (stat.isDirectory()) {
                    scanDir(fullPath, urlPrefix + item + '/');
                } else if (item.endsWith('.meta')) {
                    try {
                        const metaContent = fs.readFileSync(fullPath, 'utf8');
                        const meta = JSON.parse(metaContent);
                        
                        if (meta.uuid) {
                            const resourcePath = urlPrefix + item.slice(0, -5);
                            uuidToUrlCache[meta.uuid] = `assets/${resourcePath}`;
                        }
                    } catch (err) {}
                }
            }
        }
        
        scanDir(assetsDir, '');
    }
    
    // 2. 扫描 library/imports 获取内置资源名称（只填充 assets 中没有的 uuid）
    if (fs.existsSync(libraryDir)) {
        function scanLibrary(dir) {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.readdirSync ? fs.statSync(fullPath) : null;
                if (!stat) continue;
                
                if (stat.isDirectory()) {
                    scanLibrary(fullPath);
                } else if (item.endsWith('.json')) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const data = JSON.parse(content);
                        
                        // 从文件名获取 uuid
                        const uuid = item.replace('.json', '');
                        
                        // 只填充还没有路径的 uuid（即内置资源）
                        if (!uuidToUrlCache[uuid]) {
                            let name = null;
                            if (data.name) {
                                name = data.name;
                            } else if (data.content && data.content.name) {
                                name = data.content.name;
                            }
                            
                            if (name) {
                                uuidToUrlCache[uuid] = name;
                            }
                        }
                    } catch (err) {}
                }
            }
        }
        
        scanLibrary(libraryDir);
    }
    
    return uuidToUrlCache;
}

/**
 * 根据 uuid 获取 URL
 * @param {string} uuid - 资源 uuid
 * @param {string} cocosDir - cocos 项目根目录
 * @returns {string} URL 或 null
 */
function uuidToUrl(uuid, cocosDir) {
    if (!uuid) return uuid;
    
    const map = buildUuidMap(cocosDir);
    return map[uuid] || null;
}

/**
 * 根据路径查找节点
 * @param {Array} data - 场景数据数组
 * @param {string} nodePath - 节点路径，如 "Canvas/Tilemap" 或 "Canvas.Tilemap"
 * @returns {object|null} { node, index } 或 null
 */
function findNodeByPath(data, nodePath) {
    if (!Array.isArray(data) || !nodePath) return null;
    
    // 支持 / 和 . 作为分隔符
    const parts = nodePath.split(/[\/.]/).filter(p => p.length > 0);
    if (parts.length === 0) return null;
    
    // 找到场景根节点
    const sceneAsset = data[0];
    if (!sceneAsset || sceneAsset.__type__ !== 'cc.SceneAsset') return null;
    
    const sceneIndex = typeof sceneAsset.scene === 'object' ? sceneAsset.scene.__id__ : sceneAsset.scene;
    const sceneNode = data[sceneIndex];
    if (!sceneNode) return null;
    
    // 如果路径只有一个部分，直接在场景的子节点中查找
    let currentParts = parts;
    let currentNode = sceneNode;
    let currentIndex = sceneIndex;
    
    // 如果第一部分是 "Root" 或场景名，跳过它
    const sceneName = sceneAsset._name || '';
    if (parts[0] === 'Root' || parts[0] === sceneName) {
        currentParts = parts.slice(1);
    }
    
    // 逐层查找
    for (const part of currentParts) {
        if (!currentNode._children || currentNode._children.length === 0) {
            return null;
        }
        
        let found = false;
        for (const childRef of currentNode._children) {
            const childIndex = typeof childRef === 'object' ? childRef.__id__ : childRef;
            const childNode = data[childIndex];
            
            if (childNode && childNode._name === part) {
                currentNode = childNode;
                currentIndex = childIndex;
                found = true;
                break;
            }
        }
        
        if (!found) {
            return null;
        }
    }
    
    return { node: currentNode, index: currentIndex };
}

/**
 * 根据名称查找节点（递归搜索）
 * @param {Array} data - 场景数据数组
 * @param {string} nodeName - 节点名称
 * @returns {object|null} { node, index } 或 null
 */
function findNodeByName(data, nodeName) {
    if (!Array.isArray(data) || !nodeName) return null;
    
    // 遍历所有对象，查找匹配的节点
    for (let i = 0; i < data.length; i++) {
        const obj = data[i];
        // 检查是否是节点（有 _name 和 _children 属性）
        if (obj && obj._name === nodeName && obj._children !== undefined) {
            return { node: obj, index: i };
        }
    }
    
    return null;
}

/**
 * 获取节点属性
 * @param {string} firePath - 场景文件路径
 * @param {string} nodeId - 节点索引、名称或路径
 * @param {string} componentName - 可选，组件名称
 * @returns {object|null} 节点数据或组件数据
 */
function getNodeProperty(firePath, nodeId, componentName) {
    // 检查文件是否存在
    if (!fs.existsSync(firePath)) {
        console.error(`场景文件不存在: ${firePath}`);
        return null;
    }

    // 读取场景文件
    const content = fs.readFileSync(firePath, 'utf8');
    const data = JSON.parse(content);

    // 查找节点
    let node = null;
    let nodeIndex = null;
    
    if (Array.isArray(data)) {
        // 尝试按索引查找
        const index = parseInt(nodeId);
        if (!isNaN(index) && index >= 0 && index < data.length) {
            node = data[index];
            nodeIndex = index;
        }
        
        // 如果不是纯数字，尝试按路径或名称查找
        if (!node) {
            // 如果包含分隔符，按路径查找
            if (nodeId.includes('/') || nodeId.includes('.')) {
                const result = findNodeByPath(data, nodeId);
                if (result) {
                    node = result.node;
                    nodeIndex = result.index;
                }
            } else {
                // 先尝试按路径查找（单层）
                const pathResult = findNodeByPath(data, nodeId);
                if (pathResult) {
                    node = pathResult.node;
                    nodeIndex = pathResult.index;
                } else {
                    // 再尝试按名称递归查找
                    const nameResult = findNodeByName(data, nodeId);
                    if (nameResult) {
                        node = nameResult.node;
                        nodeIndex = nameResult.index;
                    }
                }
            }
        }
    } else {
        node = data;
        nodeIndex = 0;
    }

    if (!node) {
        console.error(`未找到节点: ${nodeId}`);
        return null;
    }

    // 如果指定了组件名，查找组件
    if (componentName) {
        // 加载脚本哈希映射
        let scriptMap = {};
        const mapPath = path.join(__dirname, 'script_map.json');
        if (fs.existsSync(mapPath)) {
            try {
                const mapContent = fs.readFileSync(mapPath, 'utf8');
                scriptMap = JSON.parse(mapContent);
            } catch (err) {
                console.warn('无法加载 script_map.json:', err.message);
            }
        }
        
        // 创建反向映射：类名 -> 哈希列表
        const hashMap = {};
        for (const [hash, className] of Object.entries(scriptMap)) {
            if (!hashMap[className]) {
                hashMap[className] = [];
            }
            hashMap[className].push(hash);
        }
        
        if (node._components) {
            for (const c of node._components) {
                const compIndex = typeof c === 'object' ? c.__id__ : c;
                const comp = data[compIndex];
                if (comp) {
                    const type = comp.__type__ || '';
                    // 清理类型名称
                    const cleanType = type.replace('cc.', '').replace(/\/$/, '');
                    
                    // 检查是否匹配
                    if (cleanType === componentName || type.includes(componentName)) {
                        return comp;
                    }
                    
                    // 检查哈希映射
                    if (hashMap[componentName]) {
                        for (const hash of hashMap[componentName]) {
                            if (type === hash || type === hash + '/') {
                                return comp;
                            }
                        }
                    }
                }
            }
        }
        console.error(`未找到组件: ${componentName}`);
        console.error('可用组件:', node._components ? node._components.map(c => {
            const idx = typeof c === 'object' ? c.__id__ : c;
            const comp = data[idx];
            return comp ? comp.__type__ : 'Unknown';
        }) : '无');
        return null;
    }

    return node;
}

/**
 * 格式化颜色为十六进制
 * @param {object} color - cc.Color对象
 * @returns {string} 十六进制颜色字符串
 */
function colorToHex(color) {
    if (!color) return '#FFFFFF';
    const r = Math.min(255, Math.max(0, color.r || 0));
    const g = Math.min(255, Math.max(0, color.g || 0));
    const b = Math.min(255, Math.max(0, color.b || 0));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

/**
 * 格式化节点属性为简洁JSON（与 Cocos 属性面板一致）
 * @param {object} node - 节点数据
 * @param {Array} groupList - 分组列表
 * @returns {object} 格式化后的节点数据
 */
function formatNodeInfo(node, groupList = ['default']) {
    const trs = node._trs?.array || [0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
    const color = node._color || { r: 255, g: 255, b: 255 };
    
    // 获取分组名称
    const groupIndex = node._groupIndex ?? node.groupIndex ?? 0;
    const groupName = groupList[groupIndex] || 'default';
    
    // 获取旋转角度（从 _eulerAngles.z）
    const rotation = node._eulerAngles?.z || 0;
    
    return {
        node: {
            active: node._active !== false,
            name: node._name || 'Node',
            position: { x: trs[0], y: trs[1] },
            rotation: rotation,
            scale: { x: trs[7], y: trs[8] },
            anchor: { x: node._anchorPoint?.x || 0.5, y: node._anchorPoint?.y || 0.5 },
            size: { width: node._contentSize?.width || 0, height: node._contentSize?.height || 0 },
            color: colorToHex(color),
            opacity: node._opacity || 255,
            skew: { x: node._skewX || 0, y: node._skewY || 0 },
            group: groupName
        }
    };
}

/**
 * 格式化组件属性为简洁JSON
 * @param {object} comp - 组件数据
 * @param {string} scriptMap - 脚本哈希映射
 * @param {string} cocosDir - cocos 项目根目录（用于 uuid 转 URL）
 * @returns {object} 格式化后的组件数据
 */
function formatComponentInfo(comp, scriptMap = {}, cocosDir = null) {
    if (!comp) return null;
    
    // 获取组件类型名
    let typeName = comp.__type__ || 'Component';
    if (typeName.endsWith('/')) {
        typeName = scriptMap[typeName] || typeName.slice(0, -1);
    } else if (scriptMap[typeName]) {
        typeName = scriptMap[typeName];
    } else if (typeName.startsWith('cc.')) {
        typeName = typeName.replace('cc.', '');
    }
    
    // 基础信息
    const result = {
        component: {
            type: typeName,
            enabled: comp._enabled !== false
        }
    };
    
    // 根据组件类型提取关键属性
    const type = typeName.toLowerCase();
    
    // cc.Camera
    if (type === 'camera') {
        result.component.zoomRatio = comp._zoomRatio ?? 1;
        result.component.orthoSize = comp._orthoSize ?? 10;
        result.component.ortho = comp._ortho ?? true;
        result.component.depth = comp._depth ?? 1;
        result.component.backgroundColor = colorToHex(comp._backgroundColor);
        result.component.alignWithScreen = comp._alignWithScreen ?? true;
    }
    // cc.Canvas
    else if (type === 'canvas') {
        const dr = comp._designResolution || { width: 750, height: 1334 };
        result.component.designResolution = { width: dr.width, height: dr.height };
        result.component.fitWidth = comp._fitWidth ?? false;
        result.component.fitHeight = comp._fitHeight ?? false;
    }
    // cc.Widget
    else if (type === 'widget') {
        result.component.isAlignTop = comp._isAlignTop ?? false;
        result.component.isAlignBottom = comp._isAlignBottom ?? false;
        result.component.isAlignLeft = comp._isAlignLeft ?? false;
        result.component.isAlignRight = comp._isAlignRight ?? false;
        result.component.isAlignHorizontalCenter = comp._isAlignHorizontalCenter ?? false;
        result.component.isAlignVerticalCenter = comp._isAlignVerticalCenter ?? false;
        if (comp._top !== undefined) result.component.top = comp._top;
        if (comp._bottom !== undefined) result.component.bottom = comp._bottom;
        if (comp._left !== undefined) result.component.left = comp._left;
        if (comp._right !== undefined) result.component.right = comp._right;
    }
    // cc.Sprite
    else if (type === 'sprite') {
        result.component.sizeMode = comp._sizeMode ?? 0;
        result.component.type = comp._type ?? 0;
        const spriteFrameUuid = comp._spriteFrame?.__uuid__ || comp._spriteFrame;
        if (spriteFrameUuid) {
            const url = cocosDir ? uuidToUrl(spriteFrameUuid, cocosDir) : null;
            result.component.spriteFrame = url || (spriteFrameUuid.includes('-') ? `assets/${spriteFrameUuid}` : spriteFrameUuid);
        } else {
            result.component.spriteFrame = null;
        }
        result.component.trim = comp._isTrimmedMode ?? true;
    }
    // cc.Label
    else if (type === 'label') {
        result.component.string = comp._string ?? '';
        result.component.fontSize = comp._fontSize ?? 40;
        result.component.lineHeight = comp._lineHeight ?? 40;
        result.component.horizontalAlign = comp._horizontalAlign ?? 0;
        result.component.verticalAlign = comp._verticalAlign ?? 0;
        result.component.overflow = comp._overflow ?? 0;
        result.component.enableWrapText = comp._enableWrapText ?? true;
        const fontUuid = comp._font?.__uuid__ || comp._font;
        if (fontUuid) {
            const url = cocosDir ? uuidToUrl(fontUuid, cocosDir) : null;
            result.component.font = url || (fontUuid.includes('-') ? `assets/${fontUuid}` : fontUuid);
        } else {
            result.component.font = null;
        }
    }
    // cc.Button
    else if (type === 'button') {
        result.component.interactable = comp._N$interactable ?? true;
        result.component.transition = comp._N$transition ?? 0;
        result.component.duration = comp.duration ?? 0.1;
        result.component.zoomScale = comp.zoomScale ?? 1.2;
        result.component.enableAutoGrayEffect = comp._N$enableAutoGrayEffect ?? false;
        
        // Colors
        if (comp._N$normalColor) {
            result.component.normalColor = colorToHex(comp._N$normalColor);
        }
        if (comp._N$pressedColor) {
            result.component.pressedColor = colorToHex(comp._N$pressedColor);
        }
        if (comp._N$hoverColor) {
            result.component.hoverColor = colorToHex(comp._N$hoverColor);
        }
        if (comp._N$disabledColor) {
            result.component.disabledColor = colorToHex(comp._N$disabledColor);
        }
        
        // Sprites
        const normalSpriteUuid = comp._N$normalSprite?.__uuid__;
        if (normalSpriteUuid) {
            const url = cocosDir ? uuidToUrl(normalSpriteUuid, cocosDir) : null;
            result.component.normalSprite = url || normalSpriteUuid;
        }
        const pressedSpriteUuid = comp._N$pressedSprite?.__uuid__;
        if (pressedSpriteUuid) {
            const url = cocosDir ? uuidToUrl(pressedSpriteUuid, cocosDir) : null;
            result.component.pressedSprite = url || pressedSpriteUuid;
        }
        const hoverSpriteUuid = comp._N$hoverSprite?.__uuid__;
        if (hoverSpriteUuid) {
            const url = cocosDir ? uuidToUrl(hoverSpriteUuid, cocosDir) : null;
            result.component.hoverSprite = url || hoverSpriteUuid;
        }
        const disabledSpriteUuid = comp._N$disabledSprite?.__uuid__;
        if (disabledSpriteUuid) {
            const url = cocosDir ? uuidToUrl(disabledSpriteUuid, cocosDir) : null;
            result.component.disabledSprite = url || disabledSpriteUuid;
        }
        
        // Target
        if (comp._N$target) {
            result.component.target = `node #${comp._N$target.__id__}`;
        } else {
            result.component.target = null;
        }
    }
    // cc.Layout
    else if (type === 'layout') {
        result.component.layoutType = comp._N$layoutType ?? 0;
        result.component.resizeMode = comp._resize ?? 0;
        result.component.startAxis = comp._N$startAxis ?? 0;
        result.component.paddingLeft = comp._N$paddingLeft ?? 0;
        result.component.paddingRight = comp._N$paddingRight ?? 0;
        result.component.paddingTop = comp._N$paddingTop ?? 0;
        result.component.paddingBottom = comp._N$paddingBottom ?? 0;
        result.component.spacingX = comp._N$spacingX ?? 0;
        result.component.spacingY = comp._N$spacingY ?? 0;
        result.component.verticalDirection = comp._N$verticalDirection ?? 1;
        result.component.horizontalDirection = comp._N$horizontalDirection ?? 0;
        result.component.affectedByScale = comp._N$affectedByScale ?? false;
        
        // Layout Size
        if (comp._layoutSize) {
            result.component.layoutSize = { width: comp._layoutSize.width, height: comp._layoutSize.height };
        }
        // Cell Size
        if (comp._N$cellSize) {
            result.component.cellSize = { width: comp._N$cellSize.width, height: comp._N$cellSize.height };
        }
    }
    // cc.Widget
    else if (type === 'widget') {
        result.component.alignMode = comp.alignMode ?? 0;
        
        // Alignment flags
        const flags = comp._alignFlags ?? 0;
        result.component.isAlignTop = (flags & 1) !== 0;
        result.component.isAlignBottom = (flags & 2) !== 0;
        result.component.isAlignLeft = (flags & 4) !== 0;
        result.component.isAlignRight = (flags & 8) !== 0;
        result.component.isAlignHorizontalCenter = (flags & 16) !== 0;
        result.component.isAlignVerticalCenter = (flags & 32) !== 0;
        
        result.component.top = comp._top ?? 0;
        result.component.bottom = comp._bottom ?? 0;
        result.component.left = comp._left ?? 0;
        result.component.right = comp._right ?? 0;
        result.component.horizontalCenter = comp._horizontalCenter ?? 0;
        result.component.verticalCenter = comp._verticalCenter ?? 0;
    }
    // 自定义组件 - 提取所有非内部属性
    else {
        const skipKeys = ['__type__', '_name', '_objFlags', 'node', '_id', '_enabled', '_components', '_children', '_parent'];
        
        for (const [key, value] of Object.entries(comp)) {
            // 跳过内部属性
            if (skipKeys.includes(key)) {
                continue;
            }
            // 跳过以 __ 开头的属性
            if (key.startsWith('__')) {
                continue;
            }
            // 格式化值
            if (value === null || value === undefined) {
                continue;
            } else if (typeof value === 'object' && value.__uuid__) {
                const url = cocosDir ? uuidToUrl(value.__uuid__, cocosDir) : null;
                if (url) {
                    result.component[key] = url;
                } else if (value.__uuid__.includes('-')) {
                    result.component[key] = `assets/${value.__uuid__}`;
                } else {
                    result.component[key] = `uuid:${value.__uuid__}`;
                }
            } else if (typeof value === 'object' && value.__id__ !== undefined) {
                result.component[key] = `ref:#${value.__id__}`;
            } else if (typeof value === 'object' && value.__type__ === 'cc.Color') {
                result.component[key] = colorToHex(value);
            } else if (typeof value === 'object' && value.__type__ === 'cc.Size') {
                result.component[key] = { width: value.width, height: value.height };
            } else if (typeof value === 'object' && value.__type__ === 'cc.Vec2') {
                result.component[key] = { x: value.x, y: value.y };
            } else if (typeof value === 'object' && value.__type__ === 'cc.Rect') {
                result.component[key] = { x: value.x, y: value.y, width: value.width, height: value.height };
            } else if (!Array.isArray(value) && typeof value !== 'object') {
                result.component[key] = value;
            }
        }
    }
    
    return result;
}

// 主程序
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('用法: node get_node_property.js <场景文件路径> <节点索引|节点名称|节点路径> [组件名]');
    console.log('');
    console.log('示例:');
    console.log('  # 按索引');
    console.log('  node get_node_property.js ../cocos/assets/main.fire 3');
    console.log('');
    console.log('  # 按名称');
    console.log('  node get_node_property.js ../cocos/assets/main.fire Canvas');
    console.log('');
    console.log('  # 按路径');
    console.log('  node get_node_property.js ../cocos/assets/main.fire Canvas/Tilemap');
    console.log('  node get_node_property.js ../cocos/assets/main.fire Canvas.Tilemap');
    console.log('');
    console.log('  # 获取组件');
    console.log('  node get_node_property.js ../cocos/assets/main.fire 5 Tilemap');
    console.log('  node get_node_property.js ../cocos/assets/main.fire Canvas/Tilemap Tilemap');
    process.exit(1);
}

const firePath = args[0];
const nodeId = args[1];
const componentName = args[2] || null;

// 确定 cocos 项目根目录（fire 文件在 assets 目录下）
const cocosDir = path.resolve(path.join(path.dirname(firePath), '..'));

// 读取 project.json 获取分组列表
let groupList = ['default'];
const projectJsonPath = path.join(cocosDir, 'settings', 'project.json');
if (fs.existsSync(projectJsonPath)) {
    try {
        const projectContent = fs.readFileSync(projectJsonPath, 'utf8');
        const projectData = JSON.parse(projectContent);
        if (projectData['group-list'] && Array.isArray(projectData['group-list'])) {
            groupList = projectData['group-list'];
        }
    } catch (err) {
        console.warn('无法加载 project.json:', err.message);
    }
}

// 加载脚本哈希映射
let scriptMap = {};
const mapPath = path.join(__dirname, 'script_map.json');
if (fs.existsSync(mapPath)) {
    try {
        const mapContent = fs.readFileSync(mapPath, 'utf8');
        scriptMap = JSON.parse(mapContent);
    } catch (err) {
        console.warn('无法加载 script_map.json:', err.message);
    }
}

const result = getNodeProperty(firePath, nodeId, componentName);

if (result) {
    if (componentName) {
        // 组件输出格式化数据
        const formatted = formatComponentInfo(result, scriptMap, cocosDir);
        console.log(JSON.stringify(formatted, null, 2));
    } else {
        // 节点输出简洁格式
        const formatted = formatNodeInfo(result, groupList);
        console.log(JSON.stringify(formatted, null, 2));
    }
} else {
    process.exit(1);
}

module.exports = { getNodeProperty, formatComponentInfo, uuidToUrl };
