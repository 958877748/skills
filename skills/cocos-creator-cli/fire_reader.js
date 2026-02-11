/**
 * Cocos Creator 场景(.fire)读取工具
 * 输出节点树结构，类似 list_directory 的格式
 *
 * 用法：
 * node fire_reader.js <场景文件路径>
 * node fire_reader.js ../cocos/assets/main.fire
 * node fire_reader.js ../cocos/assets/scene/100.fire
 */

const fs = require('fs');
const path = require('path');

function readFireFile(firePath) {
    if (!fs.existsSync(firePath)) {
        console.log(`场景文件 ${firePath} 不存在`);
        return;
    }

    const content = fs.readFileSync(firePath, 'utf8');
    const data = JSON.parse(content);

    // .fire 文件是一个数组，包含所有对象
    if (!Array.isArray(data)) {
        console.log('无效的场景文件：不是数组格式');
        return;
    }

    // 第一个元素通常是 cc.SceneAsset
    const sceneAsset = data[0];
    if (!sceneAsset || sceneAsset.__type__ !== 'cc.SceneAsset') {
        console.log('无效的场景文件：未找到 SceneAsset');
        return;
    }

    // 构建脚本哈希映射
    const scriptMap = buildScriptMap(data);

    // __id__ 是数组索引，直接通过索引访问对象
    const sceneRef = sceneAsset.scene;
    const sceneIndex = typeof sceneRef === 'object' ? sceneRef.__id__ : sceneRef;
    const sceneNode = data[sceneIndex];

    if (!sceneNode) {
        console.log('无效的场景文件：未找到场景根节点 (索引 ' + sceneIndex + ')');
        return;
    }

    // 从文件路径提取场景名称
    const fileName = path.basename(firePath, '.fire');
    const sceneName = sceneAsset._name || fileName;

    console.log(`\n=== 场景: ${sceneName} ===\n`);

    // 打印节点树（根节点传入 isRoot=true）
    printNodeTree(sceneNode, sceneIndex, data, scriptMap, [], true, true);
    console.log();
}

function buildScriptMap(data) {
    // 尝试从 script_map.json 加载映射
    const mapPath = path.join(__dirname, 'script_map.json');
    let map = {};
    
    if (fs.existsSync(mapPath)) {
        try {
            const content = fs.readFileSync(mapPath, 'utf8');
            map = JSON.parse(content);
        } catch (err) {
            console.warn('无法加载 script_map.json:', err.message);
        }
    }
    
    // 如果映射为空，使用硬编码的备用映射
    if (Object.keys(map).length === 0) {
        data.forEach(obj => {
            if (obj.__type__) {
                const hash = obj.__type__;
                // 映射已知的脚本哈希
                if (hash === '887derEHD1DWLlMgXBdnOo/') map[hash] = 'Tilemap';
                else if (hash === 'd6396RDsjZMsKpvMSJYRXs0') map[hash] = 'TilemapCamera';
                else if (hash === '0c1120T6UNNk5mllwLCpN0/') map[hash] = 'GameScene';
                else if (hash === 'a4e62KPZVNEbZO1mvkzyOQt') map[hash] = 'FilmEffect';
            }
        });
    }
    
    return map;
}

/**
 * 获取节点的组件信息字符串
 */
function getComponentsStr(node, arrayData, scriptMap) {
    if (!node._components || node._components.length === 0) return '';
    
    const components = node._components
        .map(c => {
            const compIndex = typeof c === 'object' ? c.__id__ : c;
            const comp = arrayData[compIndex];
            let typeName = comp?.__type__ || 'Component';
            // 转换哈希为类名
            if (typeName.endsWith('/')) {
                typeName = scriptMap[typeName] || typeName.slice(0, -1);
            } else if (scriptMap[typeName]) {
                typeName = scriptMap[typeName];
            } else if (typeName.startsWith('cc.')) {
                typeName = typeName.replace('cc.', '');
            }
            return `${typeName}#${compIndex}`;
        })
        .filter(c => c !== 'Node' && c !== 'Component');
    
    return components.length > 0 ? ` (${components.join(', ')})` : '';
}

/**
 * 打印节点树（使用前缀数组来正确处理连接符）
 * @param {Object} node - 当前节点
 * @param {number} nodeIndex - 节点索引
 * @param {Array} arrayData - 场景数据数组
 * @param {Object} scriptMap - 脚本映射
 * @param {Array} prefixes - 前缀数组，每个元素表示一层的连接符类型
 * @param {boolean} isLast - 是否是同级最后一个节点
 * @param {boolean} isRoot - 是否是根节点
 */
function printNodeTree(node, nodeIndex, arrayData, scriptMap, prefixes = [], isLast = true, isRoot = false) {
    const nodeName = node._name || '(unnamed)';
    const componentsStr = getComponentsStr(node, arrayData, scriptMap);
    
    // 节点激活状态：● = active, ○ = inactive（根节点不显示）
    const activeSymbol = isRoot ? '' : (node._active !== false ? '● ' : '○ ');
    
    // 构建前缀
    let line = '';
    for (let i = 0; i < prefixes.length; i++) {
        line += prefixes[i];
    }
    
    // 添加当前节点的连接符（根节点不需要）
    if (!isRoot) {
        line += isLast ? '└── ' : '├── ';
    }
    
    // 输出节点（根节点显示为 Root）
    const displayName = isRoot ? 'Root' : nodeName;
    console.log(`${line}${activeSymbol}${displayName} #${nodeIndex}${componentsStr}`);
    
    // 处理子节点
    if (node._children && node._children.length > 0) {
        const children = node._children
            .map(childId => {
                const index = typeof childId === 'object' ? childId.__id__ : childId;
                return { node: arrayData[index], index: index };
            })
            .filter(c => c.node !== null);
        
        children.forEach((child, idx) => {
            const childIsLast = idx === children.length - 1;
            // 计算子节点的前缀数组
            const childPrefixes = [...prefixes];
            // 根节点的子节点：不需要额外前缀
            // 其他节点的子节点：根据当前节点是否是最后一个，添加竖线或空格
            if (!isRoot) {
                childPrefixes.push(isLast ? '    ' : '│   ');
            }
            printNodeTree(child.node, child.index, arrayData, scriptMap, childPrefixes, childIsLast, false);
        });
    }
}

function findNodeById(arrayData, id) {
    if (!id) return null;

    // __id__ 是数组索引
    let index = id;
    if (typeof id === 'object' && id.__id__ !== undefined) {
        index = id.__id__;
    }

    return arrayData[index] || null;
}

// 列出所有 .fire 文件
function listFireFiles(dir) {
    const fireFiles = [];
    
    function scanDir(currentDir) {
        const items = fs.readdirSync(currentDir);
        items.forEach(item => {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDir(fullPath);
            } else if (item.endsWith('.fire')) {
                fireFiles.push(fullPath);
            }
        });
    }

    scanDir(dir);
    return fireFiles;
}

// 主程序
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('用法: node fire_reader.js <场景文件路径>');
    console.log('      node fire_reader.js ../cocos/assets/main.fire');
    console.log('\n列出所有场景文件:');
    console.log('      node fire_reader.js --list');
    process.exit(1);
}

if (args[0] === '--list') {
    const sceneDir = path.join(__dirname, '../cocos/assets');
    const fireFiles = listFireFiles(sceneDir);
    console.log('\n=== 所有场景文件 ===\n');
    fireFiles.forEach(f => {
        console.log(f);
    });
    console.log();
} else {
    const firePath = args[0];
    // 如果是相对路径，转换为绝对路径
    const absolutePath = path.isAbsolute(firePath) ? firePath : path.join(__dirname, firePath);
    readFireFile(absolutePath);
}
