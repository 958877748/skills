#!/usr/bin/env node
/**
 * 测试案例2：修改组件属性
 * 
 * 场景：修改各种组件的属性
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLI_DIR = 'C:/Users/Administrator/Documents/GitHub/skills/skills/cocos-creator-cli';
const ASSETS_DIR = path.join(CLI_DIR, 'NewProject/assets');
const TEST_SCENE = path.join(ASSETS_DIR, 'test_props.fire');

function run(cmd) {
    console.log(`$ ${cmd}`);
    const result = execSync(cmd, { cwd: CLI_DIR, encoding: 'utf8' });
    console.log(result);
    return result;
}

function parseJson(output) {
    try {
        return JSON.parse(output.trim());
    } catch (e) {
        return null;
    }
}

async function main() {
    console.log('=== 测试案例2：修改组件属性 ===\n');

    // 1. 准备场景
    console.log('1. 准备测试场景...');
    const mainFire = path.join(ASSETS_DIR, 'main.fire');
    const mainData = JSON.parse(fs.readFileSync(mainFire, 'utf8'));
    const testData = [mainData[0], mainData[1], mainData[2]];
    fs.writeFileSync(TEST_SCENE, JSON.stringify(testData, null, 2));

    // 2. 打开会话
    console.log('2. 打开会话...');
    const openJson = parseJson(run(`node scene_session.js open NewProject/assets/test_props.fire`));
    const sessionId = openJson.sessionId;
    console.log(`   会话ID: ${sessionId}\n`);

    // 3. 添加测试节点
    console.log('3. 添加测试节点...');
    run(`node scene_session.js add Canvas MyLabel --session=${sessionId} --type=label --x=100 --y=200`);
    run(`node scene_session.js add Canvas MyButton --session=${sessionId} --type=button --x=100 --y=100`);
    run(`node scene_session.js add Canvas MySprite --session=${sessionId} --type=sprite --x=300 --y=200`);

    // 4. 获取节点属性
    console.log('4. 获取 Label 节点属性:');
    run(`node scene_session.js get MyLabel --session=${sessionId}`);

    console.log('\n5. 获取 Button 节点属性:');
    run(`node scene_session.js get MyButton --session=${sessionId}`);

    console.log('\n6. 获取 Sprite 节点属性:');
    run(`node scene_session.js get MySprite --session=${sessionId}`);

    // 7. 先关闭会话保存，然后再获取组件属性
    console.log('\n7. 保存并关闭会话...');
    run(`node scene_session.js close --session=${sessionId}`);

    console.log('\n8. 使用 get_node_property.js 获取组件属性:');
    run(`node get_node_property.js NewProject/assets/test_props.fire 6 Label`);
    run(`node get_node_property.js NewProject/assets/test_props.fire 11 Button`);
    run(`node get_node_property.js NewProject/assets/test_props.fire 16 Sprite`);

    // 9. 打开会话继续测试修改
    console.log('\n9. 重新打开会话...');
    const openJson2 = parseJson(run(`node scene_session.js open NewProject/assets/test_props.fire`));
    const sessionId2 = openJson2.sessionId;

    // 8. 尝试修改 Label 组件属性
    console.log('\n10. 尝试修改 Label 组件属性 (_string)...');
    // 由于 set 命令还不支持组件属性，这里只展示期望的用法
    console.log(`   期望用法: node scene_session.js set 6 --session=${sessionId2} --_string="新文本"`);
    console.log(`   期望用法: node scene_session.js set 6 --session=${sessionId2} --_fontSize=30`);

    // 9. 尝试修改 Button 组件属性
    console.log('\n11. 期望修改 Button 组件属性:');
    console.log(`   期望用法: node scene_session.js set 11 --session=${sessionId2} --_N$interactable=false`);

    // 10. 关闭会话
    console.log('\n12. 关闭会话...');
    run(`node scene_session.js close --session=${sessionId2}`);

    console.log('\n=== 测试完成 ===');
}

main().catch(console.error);
