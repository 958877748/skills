const { ccclass, property } = cc._decorator;

@ccclass
export default class DynamicNodeBuilder extends cc.Component {

    @property(cc.SpriteFrame)
    defaultSpriteFrame: cc.SpriteFrame = null;

    jsonString: string = ''; // 或直接提供 JSON 字符串

    start() {
        // 读取 URL query 参数
        const params = new URLSearchParams(window.location.search);
        const debugBounds = params.get('debugBounds') === 'true';
        const widthParam = params.get('width');

        // 解析参数为数字，如果无效则使用默认值
        const width = widthParam ? parseInt(widthParam, 10) : 0;
        if (width > 0) {
            cc.view.setDesignResolutionSize(width, 100, cc.ResolutionPolicy.FIXED_WIDTH);
        }

        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                this.buildFromJson(data);
                if (debugBounds) {
                    // 等一帧让节点树布局稳定后再绘制
                    this.scheduleOnce(() => {
                        this.drawDebugBounds(this.node);
                    }, 0.1);
                }
            });
    }

    buildFromJson(data: any) {

        if (!data) {
            cc.warn('DynamicNodeBuilder: 未提供 JSON 数据');
            return;
        }

        // 开始递归构建
        // 注意：JSON 根节点描述的是一个节点，我们将其属性应用到当前脚本挂载的节点上，
        // 或者创建一个新节点作为根。这里为了符合“在当前节点下生成”，
        // 我们将 JSON 根节点视为当前节点本身的配置，或者创建第一个子节点。
        // 根据 CLI 逻辑，JSON 描述的是一个完整节点。
        // 方案：将 JSON 根节点配置应用到 this.node 本身，然后创建 children。

        this.applyNodeConfig(this.node, data);

        // 如果 JSON 里有 children，则创建子节点
        if (data.children && data.children.length > 0) {
            this.createChildren(this.node, data.children);
        }

        cc.log('DynamicNodeBuilder: 节点树构建完成');
    }

    // 递归创建子节点
    createChildren(parentNode: cc.Node, childrenData: any[]) {
        if (!childrenData) return;

        for (let i = 0; i < childrenData.length; i++) {
            let childData = childrenData[i];
            let childNode = new cc.Node(childData.name || 'NewNode');

            parentNode.addChild(childNode);

            // 应用配置
            this.applyNodeConfig(childNode, childData);

            // 递归处理孙节点
            if (childData.children && childData.children.length > 0) {
                this.createChildren(childNode, childData.children);
            }
        }
    }

    // 应用节点属性和组件
    applyNodeConfig(node: cc.Node, data: any) {
        // --- 1. 设置节点基础属性 ---
        if (data.name !== undefined) node.name = data.name;
        if (data.x !== undefined) node.x = data.x;
        if (data.y !== undefined) node.y = data.y;
        if (data.width !== undefined) node.width = data.width;
        if (data.height !== undefined) node.height = data.height;
        if (data.anchorX !== undefined) node.anchorX = data.anchorX;
        if (data.anchorY !== undefined) node.anchorY = data.anchorY;
        if (data.rotation !== undefined) node.rotation = data.rotation;
        if (data.scaleX !== undefined) node.scaleX = data.scaleX;
        if (data.scaleY !== undefined) node.scaleY = data.scaleY;
        if (data.opacity !== undefined) node.opacity = data.opacity;
        if (data.active !== undefined) node.active = data.active;

        if (data.color) {
            node.color = this.parseColor(data.color);
        }

        // --- 2. 添加组件 ---
        if (data.components && data.components.length > 0) {
            for (let i = 0; i < data.components.length; i++) {
                let compConfig = data.components[i];
                this.addComponentByConfig(node, compConfig);
            }
        }
    }

    // 添加并配置组件
    addComponentByConfig(node: cc.Node, config: any) {
        let type = '';

        // 兼容简写 "sprite" 和详写 { "type": "sprite", ... }
        if (typeof config === 'string') {
            type = config;
        } else if (typeof config === 'object') {
            type = config.type;
        } else {
            return;
        }

        if (!type) return;

        let comp = null;
        type = type.toLowerCase();

        // --- 组件映射 ---
        switch (type) {
            case 'sprite':
                comp = node.addComponent(cc.Sprite);
                comp.sizeMode = cc.Sprite.SizeMode.CUSTOM
                if (this.defaultSpriteFrame) {
                    comp.spriteFrame = this.defaultSpriteFrame;
                }
                break;
            case 'label':
                comp = node.addComponent(cc.Label);
                // 默认居中，可通过 horizontalAlign / verticalAlign 覆盖
                comp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
                comp.verticalAlign = cc.Label.VerticalAlign.CENTER;

                if (typeof config === 'object') {
                    // color 写在组件内是兼容写法，实际同步到节点颜色
                    // （Cocos 中文字颜色由节点 color 控制，不是组件属性）
                    if (config.color) {
                        node.color = this.parseColor(config.color);
                    }
                    if (config.string !== undefined) {
                        comp.string = config.string;
                    }
                    if (config.fontSize !== undefined) {
                        comp.fontSize = config.fontSize;
                        comp.lineHeight = config.fontSize;
                    }
                    if (config.lineHeight !== undefined) {
                        comp.lineHeight = config.lineHeight;
                    }
                    if (config.horizontalAlign !== undefined) {
                        comp.horizontalAlign = this.parseHAlign(config.horizontalAlign);
                    }
                    if (config.verticalAlign !== undefined) {
                        comp.verticalAlign = this.parseVAlign(config.verticalAlign);
                    }
                }
                break;
            case 'richtext': {
                const richComp = node.addComponent(cc.RichText);
                if (richComp && typeof config === 'object') {
                    if (config.string !== undefined) {
                        richComp.string = config.string;
                    }
                    if (config.fontSize !== undefined) {
                        richComp.fontSize = config.fontSize;
                    }
                    if (config.lineHeight !== undefined) {
                        richComp.lineHeight = config.lineHeight;
                    }
                    if (config.maxWidth !== undefined) {
                        richComp.maxWidth = config.maxWidth;
                    }
                    if (config.horizontalAlign !== undefined) {
                        richComp.horizontalAlign = this.parseRichTextHAlign(config.horizontalAlign);
                    }
                }
                break;
            }
            case 'button':
                comp = node.addComponent(cc.Button);
                break;
            case 'widget':
                comp = node.addComponent(cc.Widget);
                if (typeof config === 'object') {
                    if (config.isAlignTop !== undefined) comp.isAlignTop = config.isAlignTop;
                    if (config.isAlignBottom !== undefined) comp.isAlignBottom = config.isAlignBottom;
                    if (config.isAlignLeft !== undefined) comp.isAlignLeft = config.isAlignLeft;
                    if (config.isAlignRight !== undefined) comp.isAlignRight = config.isAlignRight;
                    if (config.isAlignHorizontalCenter !== undefined) comp.isAlignHorizontalCenter = config.isAlignHorizontalCenter;
                    if (config.isAlignVerticalCenter !== undefined) comp.isAlignVerticalCenter = config.isAlignVerticalCenter;
                    if (config.top !== undefined) comp.top = config.top;
                    if (config.bottom !== undefined) comp.bottom = config.bottom;
                    if (config.left !== undefined) comp.left = config.left;
                    if (config.right !== undefined) comp.right = config.right;
                    comp.updateAlignment();
                }
                break;
            case 'layout':
                comp = node.addComponent(cc.Layout);
                break;
            case 'canvas':
                // 注意：场景通常只有一个 Canvas，动态添加需谨慎
                comp = node.addComponent(cc.Canvas);
                break;
            case 'camera':
                comp = node.addComponent(cc.Camera);
                break;
            case 'particle':
                // 粒子系统通常需要预制的 .plist 或 纹理，这里仅添加组件
                comp = node.addComponent(cc.ParticleSystem);
                break;
            default:
                cc.warn('DynamicNodeBuilder: 未知的组件类型', type);
                return;
        }

    }

    // debug-bounds：递归给所有节点叠加半透明边界框 + 节点名标签
    drawDebugBounds(node: cc.Node) {
        // 随机但固定的颜色（用节点名 hash）
        const hash = node.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const hue = (hash * 137) % 360;
        const borderColor = cc.color().fromHEX(this.hslToHex(hue, 80, 50));
        const bgColor = cc.color().fromHEX(this.hslToHex(hue, 80, 50));
        bgColor.a = 30;

        // 创建边界框覆盖层节点
        const overlay = new cc.Node('__debug__');
        overlay.width = node.width;
        overlay.height = node.height;
        overlay.anchorX = node.anchorX;
        overlay.anchorY = node.anchorY;
        overlay.x = 0;
        overlay.y = 0;
        node.addChild(overlay);

        // 半透明背景
        const bg = overlay.addComponent(cc.Graphics);
        bg.fillColor = bgColor;
        bg.rect(-node.width * node.anchorX, -node.height * node.anchorY, node.width, node.height);
        bg.fill();

        // 边框
        bg.strokeColor = borderColor;
        bg.lineWidth = 2;
        bg.rect(-node.width * node.anchorX, -node.height * node.anchorY, node.width, node.height);
        bg.stroke();

        // 节点名标签（左上角）
        const labelNode = new cc.Node('__debug_label__');
        labelNode.anchorX = 0;
        labelNode.anchorY = 1;
        labelNode.x = -node.width * node.anchorX + 2;
        labelNode.y = node.height * (1 - node.anchorY) - 2;
        node.addChild(labelNode);

        const label = labelNode.addComponent(cc.Label);
        label.string = node.name;
        label.fontSize = 18;
        label.lineHeight = 20;
        labelNode.color = borderColor;

        // 递归处理子节点（跳过 debug 节点自身）
        for (const child of node.children) {
            if (!child.name.startsWith('__debug__') && !child.name.startsWith('__debug_label__')) {
                this.drawDebugBounds(child);
            }
        }
    }

    // HSL 转 Hex 字符串
    hslToHex(h: number, s: number, l: number): string {
        s /= 100;
        l /= 100;
        const k = (n: number) => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = (n: number) => {
            const val = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
            return Math.round(255 * val).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    // 辅助：语义化水平对齐 left/center/right → cc.macro.TextAlignment（用于 RichText）
    parseRichTextHAlign(value: string | number): cc.macro.TextAlignment {
        if (typeof value === 'number') return value;
        switch (String(value).toLowerCase()) {
            case 'left': return cc.macro.TextAlignment.LEFT;
            case 'right': return cc.macro.TextAlignment.RIGHT;
            case 'center':
            default: return cc.macro.TextAlignment.CENTER;
        }
    }

    // 辅助：语义化水平对齐 left/center/right → cc.Label.HorizontalAlign（用于 Label）
    parseHAlign(value: string | number): cc.Label.HorizontalAlign {
        if (typeof value === 'number') return value;
        switch (String(value).toLowerCase()) {
            case 'left': return cc.Label.HorizontalAlign.LEFT;
            case 'right': return cc.Label.HorizontalAlign.RIGHT;
            case 'center':
            default: return cc.Label.HorizontalAlign.CENTER;
        }
    }

    // 辅助：语义化垂直对齐 top/center/bottom → cc.Label.VerticalAlign
    parseVAlign(value: string | number): cc.Label.VerticalAlign {
        if (typeof value === 'number') return value;
        switch (String(value).toLowerCase()) {
            case 'top': return cc.Label.VerticalAlign.TOP;
            case 'bottom': return cc.Label.VerticalAlign.BOTTOM;
            case 'center':
            default: return cc.Label.VerticalAlign.CENTER;
        }
    }

    // 辅助：解析 Hex 颜色 #RRGGBB 或 #RRGGBBAA
    parseColor(hex: string | cc.Color): cc.Color {
        if (!hex) return cc.Color.WHITE;
        if (hex instanceof cc.Color) return hex;

        let result = cc.Color.WHITE;
        hex = hex.replace('#', '');

        if (hex.length === 6) {
            let r = parseInt(hex.substring(0, 2), 16);
            let g = parseInt(hex.substring(2, 4), 16);
            let b = parseInt(hex.substring(4, 6), 16);
            result = new cc.Color(r, g, b, 255);
        } else if (hex.length === 8) {
            let r = parseInt(hex.substring(0, 2), 16);
            let g = parseInt(hex.substring(2, 4), 16);
            let b = parseInt(hex.substring(4, 6), 16);
            let a = parseInt(hex.substring(6, 8), 16);
            result = new cc.Color(r, g, b, a);
        }
        return result;
    }
}
