const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), '.discord-bot.db');
const db = new Database(dbPath);

// 启用 WAL 模式避免锁定问题
db.pragma('journal_mode = WAL');

// 创建表
db.exec(`
  CREATE TABLE IF NOT EXISTS message_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME
  )
`);

function addMessage(userId, channelId, content) {
  const stmt = db.prepare('INSERT INTO message_queue (user_id, channel_id, content) VALUES (?, ?, ?)');
  const result = stmt.run(userId, channelId, content);
  return result.lastInsertRowid;
}

function getPendingMessage() {
  const stmt = db.prepare("SELECT * FROM message_queue WHERE status = 'pending' ORDER BY id ASC LIMIT 1");
  return stmt.get();
}

function hasProcessingMessage() {
  const stmt = db.prepare("SELECT COUNT(*) as count FROM message_queue WHERE status = 'processing'");
  const result = stmt.get();
  return result.count > 0;
}

function markAsProcessing(id) {
  const stmt = db.prepare("UPDATE message_queue SET status = 'processing' WHERE id = ?");
  stmt.run(id);
}

function markAsCompleted(id) {
  const stmt = db.prepare("UPDATE message_queue SET status = 'completed', processed_at = CURRENT_TIMESTAMP WHERE id = ?");
  stmt.run(id);
}

function clearPendingMessages() {
  db.prepare("DELETE FROM message_queue WHERE status IN ('pending', 'processing')").run();
}

// 用户 session 管理
db.exec(`
  CREATE TABLE IF NOT EXISTS user_sessions (
    user_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function getUserSession(userId) {
  const stmt = db.prepare("SELECT session_id FROM user_sessions WHERE user_id = ?");
  const result = stmt.get(userId);
  return result ? result.session_id : null;
}

function setUserSession(userId, sessionId) {
  const stmt = db.prepare(`
    INSERT INTO user_sessions (user_id, session_id) VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET session_id = ?, updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(userId, sessionId, sessionId);
}

function resetDatabase() {
  db.prepare("DELETE FROM message_queue").run();
  db.prepare("DELETE FROM user_sessions").run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name='message_queue'").run();
}

module.exports = {
  addMessage,
  getPendingMessage,
  hasProcessingMessage,
  markAsProcessing,
  markAsCompleted,
  clearPendingMessages,
  getUserSession,
  setUserSession,
  resetDatabase
};