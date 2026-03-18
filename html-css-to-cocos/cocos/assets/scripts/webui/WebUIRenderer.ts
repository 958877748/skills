const { ccclass, property } = cc._decorator;
      
import WebUIBackground from './WebUIBackground';
import { WebUILayoutEngine } from './layout';
import { mergeStyle } from './style';
import { WebUINodeSchema } from './types';

@ccclass
export default class WebUIRenderer extends cc.Component {
  @property
  autoRenderOnLoad = false;

  private _engine = new WebUILayoutEngine();
  private _schema: WebUINodeSchema | null = null;

  onLoad() {
    if (this.autoRenderOnLoad && this._schema) {
      this.render(this._schema);
    }
  }

  render(schema: WebUINodeSchema) {
    this._schema = schema;
    this.node.removeAllChildren();
    this.node.setAnchorPoint(0, 1);

    // schema 里所有数值按 360 逻辑像素编写
    // fitWidth 模式下：Canvas 逻辑宽 = designWidth，物理宽 = designWidth × DPR
    // 所以 scale = (designWidth × DPR) / 360，让布局和字体都工作在物理像素坐标系
    const designSize = cc.view.getDesignResolutionSize();
    const dpr = cc.view.getDevicePixelRatio();
    const physicalWidth = designSize.width * dpr;
    const physicalHeight = designSize.height * dpr;

    // layoutScale：逻辑坐标换算，用于布局引擎的所有尺寸（padding/margin/width/height 等）
    const layoutScale = designSize.width / 360;
    // fontScale：物理像素换算，用于字体大小，保证清晰度
    const fontScale = physicalWidth / 360;

    this._engine.scale = layoutScale;

    const root = this.createNodeTree(schema, layoutScale, fontScale);
    this.node.addChild(root);

    // 布局容器尺寸用节点逻辑坐标系（设计分辨率），不用物理像素
    const size = this.node.getContentSize();
    const width = size.width || designSize.width;
    const height = size.height || designSize.height;
    this._engine.layoutTree(root, schema, width, height);

    this.refreshBackgrounds(root);
  }

  private createNodeTree(schema: WebUINodeSchema, layoutScale: number = 1, fontScale: number = 1): cc.Node {
    const node = new cc.Node(schema.name || schema.id || schema.type);
    const style = mergeStyle(schema.type, schema.style);

    node.opacity = Math.floor((style.opacity != null ? style.opacity : 1) * 255);
    node.zIndex = style.zIndex || 0;
    node.setAnchorPoint(0, 1);
    node.setContentSize(0, 0);

    if (schema.type === 'text') {
      this.applyText(node, schema, fontScale);
    } else if (schema.type === 'image') {
      this.applyImage(node, schema);
    } else {
      this.applyView(node, schema, layoutScale);
    }

    const children = schema.children || [];
    for (let i = 0; i < children.length; i++) {
      node.addChild(this.createNodeTree(children[i], layoutScale, fontScale));
    }

    return node;
  }

  private applyView(node: cc.Node, schema: WebUINodeSchema, scale: number = 1) {
    const style = mergeStyle(schema.type, schema.style);
    if (!style.backgroundColor) {
      return;
    }

    const background = node.addComponent(WebUIBackground);
    background.colorHex = style.backgroundColor;
    background.radius = (style.borderRadius || 0) * scale;
  }

  private applyText(node: cc.Node, schema: WebUINodeSchema, scale: number = 1) {
    const label = node.addComponent(cc.Label);
    const style = mergeStyle(schema.type, schema.style);
    const fontSize = Math.round((style.fontSize || 20) * scale);
    const lineHeight = style.lineHeight
      ? Math.round(style.lineHeight * scale)
      : Math.ceil(fontSize * 1.4);

    node.setContentSize(0, 0);
    label.string = (schema.props && schema.props.text) || '';
    label.fontSize = fontSize;
    label.lineHeight = lineHeight;
    label.horizontalAlign = this.toLabelAlign(style.textAlign || 'left');
    label.verticalAlign = cc.Label.VerticalAlign.CENTER;
    label.overflow = style.whiteSpace === 'nowrap' ? cc.Label.Overflow.NONE : cc.Label.Overflow.RESIZE_HEIGHT;
    label.enableWrapText = style.whiteSpace !== 'nowrap';

    if (style.fontWeight && Number(style.fontWeight) >= 600) {
      label.enableBold = true;
    }

    node.color = this.parseColor(style.color || '#ffffff');
  }

  private applyImage(node: cc.Node, schema: WebUINodeSchema) {
    const sprite = node.addComponent(cc.Sprite);
    const src = schema.props && schema.props.src;
    if (!src) {
      return;
    }

    cc.resources.load(src, cc.SpriteFrame, (error: Error, asset: cc.SpriteFrame) => {
      if (error) {
        cc.warn('[WebUIRenderer] image load failed:', src, error.message);
        return;
      }

      sprite.spriteFrame = asset;
    });
  }

  private refreshBackgrounds(node: cc.Node) {
    const background = node.getComponent(WebUIBackground);
    if (background) {
      background.updateGraphics();
    }

    for (let i = 0; i < node.childrenCount; i++) {
      this.refreshBackgrounds(node.children[i]);
    }
  }

  private parseColor(value: string): cc.Color {
    const color = new cc.Color();
    return color.fromHEX(value);
  }

  private toLabelAlign(value: string): number {
    switch (value) {
      case 'center':
        return cc.Label.HorizontalAlign.CENTER;
      case 'right':
        return cc.Label.HorizontalAlign.RIGHT;
      case 'left':
      default:
        return cc.Label.HorizontalAlign.LEFT;
    }
  }
}
