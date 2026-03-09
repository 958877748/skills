const { ccclass, property } = cc._decorator;

@ccclass
export default class DynamicNodeBuilder extends cc.Component {

    @property(cc.SpriteFrame)
    defaultSpriteFrame: cc.SpriteFrame = null;

    jsonString: string = ''; // 或直接提供 JSON 字符串

    start() {
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                this.buildFromJson(data);
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
                comp.horizontalAlign = cc.Label.HorizontalAlign.CENTER
                comp.verticalAlign = cc.Label.VerticalAlign.CENTER

                // Label 的颜色设置到节点上
                if (typeof config === 'object') {
                    if (config.color) {
                        node.color = this.parseColor(config.color);
                    }
                    if (config.string !== undefined) {
                        comp.string = config.string;
                    }
                    if (config.fontSize !== undefined) {
                        comp.fontSize = config.fontSize;
                    }
                }
                break;
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
