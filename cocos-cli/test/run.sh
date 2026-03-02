#!/bin/bash
set -e

echo "=== Cocos CLI 结构验证测试 ==="
echo ""

CLI="node bin/cocos-cli.js"
VERIFY="node test/verify_structure.js"
FIXTURE_DIR="test/fixtures"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 计数器
PASSED=0
FAILED=0

run_test() {
  local name=$1
  local command=$2
  
  echo -n "测试: $name ... "
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}通过${NC}"
    ((PASSED++))
  else
    echo -e "${RED}失败${NC}"
    ((FAILED++))
  fi
}

# 检查是否有测试场景文件
if [ ! -f "$FIXTURE_DIR/base.fire" ]; then
  echo "警告: 未找到测试场景文件 $FIXTURE_DIR/base.fire"
  echo "请先创建测试场景或使用真实项目场景进行测试"
  echo ""
fi

# 1. 验证现有数据文件（如果存在）
if [ -f "data/test.fire" ]; then
  run_test "验证 data/test.fire 结构" "$VERIFY data/test.fire"
fi

# 2. 如果有测试场景，进行完整流程测试
if [ -f "$FIXTURE_DIR/base.fire" ]; then
  echo ""
  echo "=== 完整流程测试 ==="
  
  TEST_FIRE="$FIXTURE_DIR/test_temp.fire"
  cp "$FIXTURE_DIR/base.fire" "$TEST_FIRE"
  
  # 2.1 验证原始文件
  run_test "验证原始场景结构" "$VERIFY $TEST_FIRE"
  
  # 2.2 打开会话
  echo -n "打开会话 ... "
  SESSION_OUTPUT=$($CLI open "$TEST_FIRE" 2>&1)
  SESSION_ID=$(echo "$SESSION_OUTPUT" | grep -oP '"sessionId": "\K[^"]+')
  if [ -n "$SESSION_ID" ]; then
    echo -e "${GREEN}成功${NC} (ID: $SESSION_ID)"
    ((PASSED++))
  else
    echo -e "${RED}失败${NC}"
    ((FAILED++))
  fi
  
  # 2.3 查看节点树
  run_test "查看节点树" "$CLI tree --session=$SESSION_ID"
  
  # 2.4 添加节点
  run_test "添加节点" "$CLI add Canvas TestNode --session=$SESSION_ID --type=sprite"
  run_test "验证添加后结构" "$VERIFY $TEST_FIRE"
  
  # 2.5 修改属性
  run_test "修改节点属性" "$CLI set 'Canvas/TestNode' --session=$SESSION_ID --x=100 --y=200"
  
  # 2.6 删除节点
  run_test "删除节点" "$CLI delete 'Canvas/TestNode' --session=$SESSION_ID"
  run_test "验证删除后结构" "$VERIFY $TEST_FIRE"
  
  # 2.7 关闭会话
  run_test "关闭会话" "$CLI close --session=$SESSION_ID"
  
  # 清理
  rm -f "$TEST_FIRE"
fi

# 3. 验证 src/lib 下的工具函数（如果有）
if [ -d "src/lib" ]; then
  echo ""
  echo "=== 单元测试 ==="
  
  # 运行所有 .test.js 文件
  for test_file in test/*.test.js; do
    if [ -f "$test_file" ]; then
      run_test "$(basename $test_file)" "node $test_file"
    fi
  done
fi

echo ""
echo "=== 测试结果 ==="
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}所有测试通过!${NC}"
  exit 0
else
  echo -e "${RED}有测试失败${NC}"
  exit 1
fi
