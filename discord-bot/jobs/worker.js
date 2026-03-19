const { parentPort, workerData } = require('worker_threads');
const db = require('../db');

/**
 * 通用任务执行器
 */
async function executeTask() {
  try {
    const { taskId, userId, channelId, taskContent, taskType, message } = workerData;
    const content = taskContent || message || '定时任务触发';
    
    console.log(`[任务执行] 类型: ${taskType}, 内容: ${content}`);
    
    // 统一逻辑：所有任务最终都通过消息队列触发 AI 逻辑或通知
    // 如果需要针对 'delayed' 类型做特殊 UI 提示，可以在这里分支
    const msgId = db.addMessage(userId, channelId, content);
    console.log(`[任务成功] 已存入消息队列 ID: ${msgId}`);
    
    if (parentPort) {
      parentPort.postMessage('done');
    }
  } catch (error) {
    console.error(`[任务执行失败]`, error);
    if (parentPort) {
      parentPort.postMessage('error');
    } else {
      process.exit(1);
    }
  }
}

if (require.main === module || parentPort) {
  executeTask();
}

module.exports = executeTask;
