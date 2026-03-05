"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function run(args) {
    if (args.length < 1) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli build <项目目录>' }));
        return;
    }
    const projectDir = args[0];
    const importsDir = path.join(projectDir, 'library', 'imports');
    const outputFile = path.join(__dirname, '../../data/script_map.json');
    if (!fs.existsSync(importsDir)) {
        console.log(JSON.stringify({ error: `imports 目录不存在: ${importsDir}` }));
        return;
    }
    const scriptMap = {};
    function scanDirectory(dir) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            }
            else if (item.endsWith('.js')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const match = content.match(/cc\._RF\.push\(module,\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/);
                    if (match) {
                        const hash = match[1];
                        const className = match[2];
                        if (!className.startsWith('cc.')) {
                            scriptMap[hash] = className;
                        }
                    }
                }
                catch (err) {
                }
            }
        }
    }
    scanDirectory(importsDir);
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputFile, JSON.stringify(scriptMap, null, 2), 'utf8');
    console.log(JSON.stringify({
        success: true,
        count: Object.keys(scriptMap).length,
        outputFile,
        message: `构建完成，共 ${Object.keys(scriptMap).length} 个脚本映射`
    }, null, 2));
}
exports.default = { run };
//# sourceMappingURL=build.js.map