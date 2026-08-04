#!/usr/bin/env node

"use strict";

const DEFAULT_CDP_URL = "http://127.0.0.1:9222";
const DEFAULT_ORIGIN = "https://poe.game.qq.com";
const DEFAULT_LEAGUE = "S30赛季";
const DEFAULT_BATCH_DELAY_MS = 8000;

const FALLBACK_SKILLS = {
  "Tornado Shot": 8030,
  "Shrapnel Ballista": 61903
};

const FALLBACK_SUPPORTS = {
  "Arrow Nova III": 58429,
  "Greater Faster Attacks III": 50485,
  "Faster Attacks II": 987,
  "Greater Multiple Projectiles III": 49419,
  "Chain II": 31052,
  "Mirage Archer III": 37727,
  Brutality: 64271,
  "Lesser Brutality I": 55807,
  "Brutality I": 55807,
  "Brutality II": 64271,
  "Greater Brutality III": 59345
};

function printHelp() {
  console.log(`PoE 国服佣兵搜索

用法:
  node mercenary-search.js --skill "Tornado Shot" [选项]

选项:
  --build <name>               佣兵构建，例如 先锋；可单独使用
  --skill <name>              主佣兵技能；使用技能条件时必填
  --supports <a,b>            必须连接到主技能的辅助技能
  --any-supports <a,b>        至少一个连接到主技能的辅助技能
  --exclude-supports <a,b>    禁止连接到主技能的辅助技能
  --additional-skills <a,b>   佣兵还必须拥有的其他技能
  --support-count <n>         主技能的精确辅助技能数量
  --max-level <n>             佣兵等级上限
  --league <name>             交易联赛，默认 ${DEFAULT_LEAGUE}
  --limit <n>                 返回数量，默认 3，最大 10
  --min-price <n>             等价混沌价格下限
  --max-price <n>             等价混沌价格上限
  --price-currency <name>     价格货币；省略表示等价混沌
  --sort-field <name>         排序字段，默认 price
  --batch-delay <ms>          分批 Fetch 间隔，默认 ${DEFAULT_BATCH_DELAY_MS}
  --cdp-url <url>             CDP 地址，默认 ${DEFAULT_CDP_URL}
  --tab-url <url>             指定已打开页面 URL 的片段
  --list                      列出交易站当前可识别的佣兵技能和辅助技能
  --scan-all                  扫描当前已加载的全部候选，不受 --limit 停止条件影响
  --json                      只输出 JSON
  --help                      显示帮助

示例:
  node mercenary-search.js --skill "Tornado Shot" \\
    --supports "Greater Multiple Projectiles III,Mirage Archer III" \\
    --exclude-supports "Arrow Nova III" --max-level 75 --limit 5
`);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") args.help = true;
    else if (value === "--json") args.json = true;
    else if (value === "--list") args.list = true;
    else if (value === "--scan-all") args.scan_all = true;
    else if (value.startsWith("--")) {
      const key = value.slice(2).replaceAll("-", "_");
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) throw new Error(`缺少参数值: ${value}`);
      args[key] = next;
      index += 1;
    } else {
      throw new Error(`无法识别的位置参数: ${value}`);
    }
  }
  return args;
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part.toLowerCase() !== "none");
}

function normalizeName(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

function numberArg(args, key, { integer = false, min = -Infinity } = {}) {
  if (args[key] === undefined) return undefined;
  const value = Number(args[key]);
  if (!Number.isFinite(value) || (integer && !Number.isInteger(value)) || value < min) {
    throw new Error(`--${key.replaceAll("_", "-")} 参数无效: ${args[key]}`);
  }
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`CDP HTTP ${response.status}: ${url}`);
  return response.json();
}

class CdpPage {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      pending.resolve(message);
    });
    socket.addEventListener("close", () => {
      for (const pending of this.pending.values()) pending.reject(new Error("CDP WebSocket 已关闭"));
      this.pending.clear();
    });
  }

  command(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    }).then((message) => {
      if (message.error) throw new Error(`${message.error.code}: ${message.error.message}`);
      return message.result;
    });
  }

  async evaluate(expression) {
    const result = await this.command("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || "页面 JavaScript 执行失败");
    }
    if (result.result?.subtype === "error") {
      throw new Error(result.result.description || "页面返回错误");
    }
    return result.result?.value;
  }

  close() {
    this.socket.close();
  }
}

async function connectPage(cdpUrl, tabUrl) {
  const targets = await getJson(`${cdpUrl.replace(/\/$/, "")}/json/list`);
  const candidates = targets.filter((target) => target.type === "page" && target.webSocketDebuggerUrl);
  const target = candidates.find((item) => {
    try {
      const url = new URL(item.url);
      return url.hostname === "poe.game.qq.com" && (!tabUrl || item.url.includes(tabUrl));
    } catch {
      return false;
    }
  });
  if (!target) {
    const hint = tabUrl ? `匹配 URL 片段 ${tabUrl} 的` : "国服 PoE 交易";
    throw new Error(`没有找到${hint}页面。请先在 Chrome 打开 ${DEFAULT_ORIGIN}/trade/。`);
  }

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("连接 CDP 页面超时")), 5000);
    socket.addEventListener("open", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
    socket.addEventListener("error", (event) => {
      clearTimeout(timer);
      reject(new Error(`连接 CDP 页面失败: ${event.message || "WebSocket error"}`));
    }, { once: true });
  });
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { page: new CdpPage(socket), target };
}

function pageFetchExpression(path, init = {}) {
  return `(async () => {
    const response = await fetch(${JSON.stringify(path)}, ${JSON.stringify({ ...init, credentials: "include" })});
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { ok: response.ok, status: response.status, body };
  })()`;
}

async function pageFetch(page, path, init = {}) {
  return page.evaluate(pageFetchExpression(path, init));
}

async function rateLimitedPageFetch(page, path, init, { jsonOutput = false } = {}) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await pageFetch(page, path, init);
    const error = response.body?.error;
    if (error?.code === 3) {
      const match = String(error.message || "").match(/(\d+)\s*秒/);
      const waitSeconds = match ? Number(match[1]) + 5 : 30;
      if (!jsonOutput) console.error(`国服交易限流，等待 ${waitSeconds} 秒后重试 (${attempt}/5)`);
      await sleep(waitSeconds * 1000);
      continue;
    }
    return response;
  }
  throw new Error("国服交易接口连续 5 次触发限流");
}

function statEntries(payload) {
  const groups = Array.isArray(payload) ? payload : payload?.result || payload?.stats || [];
  if (!Array.isArray(groups)) return [];
  return groups.flatMap((group) => group.entries || group.stats || group.values || []);
}

function itemEntries(payload) {
  const groups = Array.isArray(payload) ? payload : payload?.result || payload?.items || [];
  if (!Array.isArray(groups)) return [];
  return groups.flatMap((group) => group.entries || group.items || group.values || []);
}

function makeStatMaps(payload) {
  const skills = new Map();
  const supports = new Map();
  for (const stat of statEntries(payload)) {
    const id = String(stat.id || "");
    const match = id.match(/^mercenary\.(skill|support)_(\d+)$/);
    if (!match) continue;
    const name = stat.text || stat.name || stat.label;
    if (!name) continue;
    const map = match[1] === "skill" ? skills : supports;
    map.set(normalizeName(name), { name: String(name), id: Number(match[2]) });
  }
  return { skills, supports };
}

function mergeFallback(map, fallback) {
  for (const [name, id] of Object.entries(fallback)) {
    const key = normalizeName(name);
    if (!map.has(key)) map.set(key, { name, id });
  }
}

function resolveName(map, name, kind) {
  const value = map.get(normalizeName(name));
  if (!value) throw new Error(`未知${kind}: ${name}。可用 --list 查看交易站当前识别的名称。`);
  return value;
}

function resolveBuild(entries, value) {
  const target = normalizeName(value);
  const entry = entries.find((candidate) => {
    if (candidate.disc !== "mercenary_warrant" || !candidate.type || !candidate.text) return false;
    const match = String(candidate.text).match(/^佣兵凭证[（(](.*)[）)]$/);
    return [candidate.text, match?.[1], candidate.type].some((name) => normalizeName(name) === target);
  });
  if (!entry) throw new Error(`未知佣兵构建: ${value}`);
  const match = String(entry.text).match(/^佣兵凭证[（(](.*)[）)]$/);
  return {
    name: match?.[1] || String(entry.text),
    text: String(entry.text),
    type: String(entry.type),
    discriminator: String(entry.disc)
  };
}

function parseCriteria(args, maps, build) {
  if (!args.skill && !build) throw new Error("必须提供 --build 或 --skill");
  const skill = args.skill ? resolveName(maps.skills, args.skill, "佣兵技能") : null;
  const required = splitList(args.supports).map((name) => resolveName(maps.supports, name, "辅助技能"));
  const any = splitList(args.any_supports).map((name) => resolveName(maps.supports, name, "辅助技能"));
  const excluded = splitList(args.exclude_supports).map((name) => resolveName(maps.supports, name, "辅助技能"));
  if (!skill && (required.length || any.length || excluded.length)) {
    throw new Error("使用辅助技能条件时必须同时提供 --skill");
  }
  const additionalSkills = splitList(args.additional_skills).map((name) => resolveName(maps.skills, name, "佣兵技能"));
  const maxLevel = numberArg(args, "max_level", { integer: true, min: 1 });
  const supportCount = numberArg(args, "support_count", { integer: true, min: 0 });
  const limit = Math.min(numberArg(args, "limit", { integer: true, min: 1 }) ?? 3, 10);
  const minPrice = numberArg(args, "min_price", { min: 0 });
  const maxPrice = numberArg(args, "max_price", { min: 0 });
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new Error("--min-price 不能大于 --max-price");
  }
  return { build, skill, required, any, excluded, additionalSkills, maxLevel, supportCount, limit, minPrice, maxPrice };
}

function buildQuery(criteria, args) {
  const skillFilters = [
    ...(criteria.skill ? [{ id: `mercenary.skill_${criteria.skill.id}` }] : []),
    ...criteria.additionalSkills.map((skill) => ({ id: `mercenary.skill_${skill.id}` })),
    ...criteria.required.map((support) => ({ id: `mercenary.support_${support.id}` }))
  ];
  const stats = [{
    type: "and",
    filters: skillFilters
  }];
  if (criteria.any.length) {
    stats.push({
      type: "count",
      value: { min: 1 },
      filters: criteria.any.map((support) => ({ id: `mercenary.support_${support.id}` }))
    });
  }
  const price = {};
  if (args.price_currency && args.price_currency !== "equivalent") price.option = args.price_currency;
  if (criteria.minPrice !== undefined) price.min = criteria.minPrice;
  if (criteria.maxPrice !== undefined) price.max = criteria.maxPrice;
  const filterGroups = {};
  if (criteria.maxLevel !== undefined) filterGroups.misc_filters = { filters: { ilvl: { max: criteria.maxLevel } } };
  if (Object.keys(price).length) filterGroups.trade_filters = { filters: { price } };
  return {
    query: {
      status: { option: "available" },
      ...(criteria.build ? { type: { option: criteria.build.type, discriminator: criteria.build.discriminator } } : {}),
      stats,
      ...(Object.keys(filterGroups).length ? { filters: filterGroups } : {})
    },
    sort: { [args.sort_field || "price"]: (args.sort_field || "price") === "price" ? "asc" : "desc" }
  };
}

function matchesEntry(entry, criteria) {
  const item = entry.item || {};
  const skills = item.mercenarySkills || [];
  const properties = item.properties || [];
  const buildProperty = properties.find((property) => property.name === "BD构建");
  const buildName = buildProperty?.values?.[0]?.[0];
  if (criteria.build && normalizeName(buildName) !== normalizeName(criteria.build.name)) {
    return { match: false, rejectedByMaxLevel: false };
  }
  const mainSkill = criteria.skill
    ? skills.find((skill) => String(skill.hash) === String(criteria.skill.id))
    : null;
  if (criteria.skill && !mainSkill) return { match: false, rejectedByMaxLevel: false };
  if (!criteria.additionalSkills.every((skill) => skills.some((value) => String(value.hash) === String(skill.id)))) {
    return { match: false, rejectedByMaxLevel: false };
  }
  const levelProperty = properties.find((property) => ["佣兵等级", "Mercenary Level"].includes(property.name));
  const level = Number(levelProperty?.values?.[0]?.[0]);
  if (criteria.maxLevel !== undefined && (!Number.isFinite(level) || level > criteria.maxLevel)) {
    return { match: false, rejectedByMaxLevel: true };
  }
  const supports = mainSkill?.supports || [];
  const hashes = new Set(supports.map((support) => String(support.hash)));
  if (criteria.supportCount !== undefined && supports.length !== criteria.supportCount) return { match: false, rejectedByMaxLevel: false };
  if (!criteria.required.every((support) => hashes.has(String(support.id)))) return { match: false, rejectedByMaxLevel: false };
  if (criteria.any.length && !criteria.any.some((support) => hashes.has(String(support.id)))) return { match: false, rejectedByMaxLevel: false };
  if (criteria.excluded.some((support) => hashes.has(String(support.id)) || supports.some((value) => value.name === support.name))) {
    return { match: false, rejectedByMaxLevel: false };
  }
  return {
    match: true,
    rejectedByMaxLevel: false,
    result: {
      id: entry.id,
      mercenary: properties.find((property) => property.name === "")?.values?.[0]?.[0],
      build: buildName || null,
      level,
      skill: criteria.skill?.name || null,
      supports: supports.map((support) => ({ name: support.name, tier: support.tier })),
      skills: skills.map((skill) => ({
        name: skill.name,
        supports: (skill.supports || []).map((support) => ({ name: support.name, tier: support.tier }))
      })),
      price: entry.listing?.price || null,
      seller: entry.listing?.account?.name || null,
      online: entry.listing?.account?.online || null,
      indexed: entry.listing?.indexed || null
    }
  };
}

async function runSearch(page, criteria, args, jsonOutput) {
  const league = String(args.league || DEFAULT_LEAGUE);
  const query = buildQuery(criteria, args);
  const searchResponse = await rateLimitedPageFetch(
    page,
    `/api/trade/search/${encodeURIComponent(league)}`,
    { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(query) },
    { jsonOutput }
  );
  if (!searchResponse.ok) throw new Error(`交易搜索失败 HTTP ${searchResponse.status}: ${JSON.stringify(searchResponse.body)}`);
  if (searchResponse.body?.error) throw new Error(`交易搜索失败: ${searchResponse.body.error.message || JSON.stringify(searchResponse.body.error)}`);

  const search = searchResponse.body;
  const ids = Array.isArray(search.result) ? search.result : [];
  const results = [];
  let scanned = 0;
  let rejectedByMaxLevel = 0;
  const batchDelay = numberArg(args, "batch_delay", { integer: true, min: 0 }) ?? DEFAULT_BATCH_DELAY_MS;
  for (let offset = 0; offset < ids.length && (args.scan_all || results.length < criteria.limit); offset += 10) {
    if (offset > 0) await sleep(batchDelay);
    const block = ids.slice(offset, offset + 10);
    const fetchedResponse = await rateLimitedPageFetch(
      page,
      `/api/trade/fetch/${block.join(",")}?query=${encodeURIComponent(search.id)}`,
      { headers: { Accept: "application/json" } },
      { jsonOutput }
    );
    if (!fetchedResponse.ok) throw new Error(`交易 Fetch 失败 HTTP ${fetchedResponse.status}: ${JSON.stringify(fetchedResponse.body)}`);
    if (fetchedResponse.body?.error) throw new Error(`交易 Fetch 失败: ${fetchedResponse.body.error.message || JSON.stringify(fetchedResponse.body.error)}`);
    for (const entry of fetchedResponse.body?.result || []) {
      scanned += 1;
      const match = matchesEntry(entry, criteria);
      if (match.rejectedByMaxLevel) rejectedByMaxLevel += 1;
      if (!match.match) continue;
      results.push(match.result);
      if (!args.scan_all && results.length >= criteria.limit) break;
    }
    if (!jsonOutput) console.error(`已检查 ${scanned}/${ids.length} 条候选，找到 ${results.length} 条`);
  }

  const tradeUrl = `${DEFAULT_ORIGIN}/trade/search/${encodeURIComponent(league)}/${search.id}`;
  for (const result of results) result.tradeUrl = tradeUrl;
  return {
    status: results.length ? "found" : "not_found_in_loaded_results",
    league,
    searchId: search.id,
    candidateTotal: search.total,
    candidateIdsLoaded: ids.length,
    scanned,
    rejectedByMaxLevel,
    criteria: {
      build: criteria.build?.name || null,
      skill: criteria.skill?.name || null,
      supports: criteria.required.map((support) => support.name),
      anySupports: criteria.any.map((support) => support.name),
      excludeSupports: criteria.excluded.map((support) => support.name),
      additionalSkills: criteria.additionalSkills.map((skill) => skill.name),
      supportCount: criteria.supportCount ?? null,
      maxLevel: criteria.maxLevel ?? null
    },
    results,
    note: ids.length < search.total
      ? "交易接口返回的候选 ID 少于匹配总数，结果只覆盖当前已加载候选。"
      : "已检查交易接口返回的全部候选 ID。"
  };
}

function output(value, jsonOutput) {
  if (jsonOutput) console.log(JSON.stringify(value, null, 2));
  else {
    console.log(`状态: ${value.status}`);
    if (value.searchId) console.log(`联赛: ${value.league}，候选: ${value.candidateTotal}，已检查: ${value.scanned}`);
    if (value.results) {
      for (const [index, result] of value.results.entries()) {
        console.log(`\n[${index + 1}] ${result.mercenary || "佣兵"} Lv.${result.level}`);
        if (result.build) console.log(`构建: ${result.build}`);
        if (result.skill) {
          console.log(`技能: ${result.skill}`);
          console.log(`辅助: ${result.supports.map((support) => `${support.name}${support.tier ? ` T${support.tier}` : ""}`).join(", ") || "无"}`);
        }
        if (result.skills?.length) {
          console.log(`完整技能: ${result.skills.map((skill) => {
            const supports = skill.supports.map((support) => `${support.name}${support.tier ? ` T${support.tier}` : ""}`).join(", ");
            return supports ? `${skill.name} [${supports}]` : skill.name;
          }).join("；")}`);
        }
        console.log(`价格: ${result.price ? `${result.price.amount} ${result.price.currency}` : "未知"}`);
        console.log(`卖家: ${result.seller || "未知"} (${result.online?.status || "未知在线状态"})`);
        console.log(`链接: ${result.tradeUrl}`);
      }
    }
    if (value.note) console.log(`\n${value.note}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return printHelp();
  const jsonOutput = Boolean(args.json);
  const cdpUrl = String(args.cdp_url || DEFAULT_CDP_URL);
  const connection = await connectPage(cdpUrl, args.tab_url);
  const { page, target } = connection;
  try {
    const statsResponse = await rateLimitedPageFetch(page, "/api/trade/data/stats", { headers: { Accept: "application/json" } }, { jsonOutput });
    const maps = makeStatMaps(statsResponse.body);
    mergeFallback(maps.skills, FALLBACK_SKILLS);
    mergeFallback(maps.supports, FALLBACK_SUPPORTS);
    if (args.list) {
      output({
        status: "ok",
        target: target.url,
        skills: [...maps.skills.values()].sort((a, b) => a.name.localeCompare(b.name)),
        supports: [...maps.supports.values()].sort((a, b) => a.name.localeCompare(b.name))
      }, jsonOutput);
      return;
    }
    let build;
    if (args.build) {
      const itemsResponse = await rateLimitedPageFetch(page, "/api/trade/data/items", { headers: { Accept: "application/json" } }, { jsonOutput });
      if (!itemsResponse.ok) throw new Error(`交易物品数据失败 HTTP ${itemsResponse.status}: ${JSON.stringify(itemsResponse.body)}`);
      build = resolveBuild(itemEntries(itemsResponse.body), args.build);
    }
    const criteria = parseCriteria(args, maps, build);
    const result = await runSearch(page, criteria, args, jsonOutput);
    output(result, jsonOutput);
  } finally {
    page.close();
  }
}

main().catch((error) => {
  if (process.argv.includes("--json")) console.log(JSON.stringify({ status: "error", error: error.message }, null, 2));
  else console.error(`错误: ${error.message}`);
  process.exitCode = 1;
});
