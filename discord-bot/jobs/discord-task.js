const { parentPort, workerData } = require('worker_threads');
const db = require('../db');

(async () => {
  try {
    const { taskId, userId, channelId, taskContent, taskType } = workerData;
    
    console.log(`[任务执行] ID: ${taskId}, 类型: ${taskType}, 内容: ${taskContent}`);
    
    // 根据任务类型执行不同的逻辑
    switch (taskType) {
      case 'schedule':
        // 定时任务：添加到消息队列
        db.addMessage(userId, channelId, taskContent);
        console.log(`[定时任务] 已添加到消息队列: ${taskContent}`);
        break;
        
      case 'delayed':
        // 延迟任务：执行特定逻辑
        console.log(`[延迟任务] 执行延迟任务: ${taskContent}`);
        // 这里可以添加延迟任务的具体逻辑
        // 例如：发送通知、执行特定操作等
        break;
        
      default:
        console.log(`[未知任务类型] ${taskType}`);
    }
    
    // 通知主线程任务完成
    if (parentPort) {
      parentPort.postMessage('done');
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error(`[任务执行失败]`, error);
    
    // 如果是定时任务，可以考虑重试逻辑
    if (parentPort) {
      parentPort.postMessage('error');
    } else {
      process.exit(1);
    }
  }
})();