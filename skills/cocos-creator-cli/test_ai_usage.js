#!/usr/bin/env node
/**
 * 测试案例：模拟 AI 使用 Cocos CLI 操作场景
 * 
 * 场景：创建一个游戏主菜单界面
 * - 背景图 (Sprite)
 * - 标题文字 (Label)
 * - 开始游戏按钮 (Button)
 * - 设置按钮 (Button)
 * - 版权信息 (Label)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLI_DIR = 'C:/Users/Administrator/Documents/GitHub/skills/skills/cocos-creator-cli';
const ASSETS_DIR = path.join(CLI_DIR, 'NewProject/assets');
const TEST_SCENE = path.join(ASSETS_DIR, 'test_menu.fire');

// 工具函数：执行 CLI 命令
function run(cmd) {
    console.log(`$ ${cmd}`);
    const result = execSync(cmd, { cwd: CLI_DIR, encoding: 'utf8' });
    console.log(result);
    return result;
}

// 工具函数：解析 JSON 输出
function parseJson(output) {
    try {
        return JSON.parse(output.trim());
    } catch (e) {
        return null;
    }
}

async function main() {
    console.log('=== 测试案例：AI 使用 Cocos CLI 创建游戏菜单 ===\n');

    // 1. 复制基础场景
    console.log('1. 复制基础场景...');
    const mainFire = path.join(ASSETS_DIR, 'main.fire');
    const mainData = JSON.parse(fs.readFileSync(mainFire, 'utf8'));
    // 简化场景，只保留 Canvas
    const testData = [mainData[0], mainData[1], mainData[2]];
    fs.writeFileSync(TEST_SCENE, JSON.stringify(testData, null, 2));
    console.log(`   创建测试场景: test_menu.fire\n`);

    // 2. 打开会话（使用相对于 CLI 目录的路径）
    console.log('2. 打开会话...');
    const openResult = run(`node scene_session.js open NewProject/assets/test_menu.fire`);
    const openJson = parseJson(openResult);
    const sessionId = openJson.sessionId;
    console.log(`   会话ID: ${sessionId}\n`);

    // 3. 添加背景图 (Sprite)
    console.log('3. 添加背景图 (Sprite)...');
    run(`node scene_session.js add Canvas BG --session=${sessionId} --type=sprite --x=480 --y=320`);
    console.log('');

    // 4. 添加标题文字 (Label)
    console.log('4. 添加标题文字 (Label)...');
    run(`node scene_session.js add Canvas Title --session=${sessionId} --type=label --x=480 --y=500`);
    console.log('');

    // 5. 添加开始游戏按钮 (Button)
    console.log('5. 添加开始游戏按钮 (Button)...');
    run(`node scene_session.js add Canvas StartBtn --session=${sessionId} --type=button --x=480 --y=350`);
    console.log('');

    // 6. 添加设置按钮 (Button)
    console.log('6. 添加设置按钮 (Button)...');
    run(`node scene_session.js add Canvas SettingsBtn --session=${sessionId} --type=button --x=480 --y=280`);
    console.log('');

    // 7. 添加版权信息 (Label)
    console.log('7. 添加版权信息 (Label)...');
    run(`node scene_session.js add Canvas Copyright --session=${sessionId} --type=label --x=480 --y=50`);
    console.log('');

    // 8. 查看节点树
    console.log('8. 查看节点树:');
    run(`node scene_session.js tree --session=${sessionId}`);
    console.log('');

    // 9. 获取节点属性
    console.log('9. 获取开始按钮属性:');
    run(`node scene_session.js get StartBtn --session=${sessionId}`);
    console.log('');

    // 10. 修改节点属性
    console.log('10. 修改标题文字内容...');
    run(`node scene_session.js set Title --session=${sessionId} --_string="游戏标题"`);
    console.log('');

    // 11. 修改按钮属性
    console.log('11. 修改开始按钮缩放...');
    run(`node scene_session.js set StartBtn --session=${sessionId} --scaleX=1.2 --scaleY=1.2`);
    console.log('');

    // 12. 插入节点（测试 --at 参数）
    console.log('12. 在开始按钮前添加一个分隔线...');
    run(`node scene_session.js add Canvas Divider --session=${sessionId} --type=sprite --at=3`);
    console.log('');

    // 13. 删除节点
    console.log('13. 删除设置按钮...');
    run(`node scene_session.js delete SettingsBtn --session=${sessionId}`);
    console.log('');

    // 14. 再次查看节点树
    console.log('14. 最终节点树:');
    run(`node scene_session.js tree --session=${sessionId}`);
    console.log('');

    // 15. 关闭会话保存
    console.log('15. 关闭会话...');
    run(`node scene_session.js close --session=${sessionId}`);

    // 16. 验证文件
    console.log('16. 验证生成的场景文件...');
    const testData2 = JSON.parse(fs.readFileSync(TEST_SCENE, 'utf8'));
    console.log(`   场景文件长度: ${testData2.length} 个元素`);
    
    // 统计节点
    let nodeCount = 0;
    for (const item of testData2) {
        if (item.__type__ === 'cc.Node') {
            nodeCount++;
        }
    }
    console.log(`   节点数量: ${nodeCount}`);

    console.log('\n=== 测试完成 ===');
    console.log(`场景文件: ${TEST_SCENE}`);
}

main().catch(console.error);
