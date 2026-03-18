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

    const root = this.createNodeTree(schema);
    this.node.addChild(root);

    const size = this.node.getContentSize();
    const width = size.width || 720;
    const height = size.height || 1280;
    this._engine.layoutTree(root, schema, width, height);

    this.refreshBackgrounds(root);
  }

  private createNodeTree(schema: WebUINodeSchema): cc.Node {
    const node = new cc.Node(schema.name || schema.id || schema.type);
    const style = mergeStyle(schema.type, schema.style);

    node.opacity = Math.floor((style.opacity != null ? style.opacity : 1) * 255);
    node.zIndex = style.zIndex || 0;
    node.setAnchorPoint(0, 1);
    node.setContentSize(0, 0);

    if (schema.type === 'text') {
      this.applyText(node, schema);
    } else if (schema.type === 'image') {
      this.applyImage(node, schema);
    } else {
      this.applyView(node, schema);
    }

    const children = schema.children || [];
    for (let i = 0; i < children.length; i++) {
      node.addChild(this.createNodeTree(children[i]));
    }

    return node;
  }

  private applyView(node: cc.Node, schema: WebUINodeSchema) {
    const style = mergeStyle(schema.type, schema.style);
    if (!style.backgroundColor) {
      return;
    }

    const background = node.addComponent(WebUIBackground);
    background.colorHex = style.backgroundColor;
    background.radius = style.borderRadius || 0;
  }

  private applyText(node: cc.Node, schema: WebUINodeSchema) {
    const label = node.addComponent(cc.Label);
    const style = mergeStyle(schema.type, schema.style);

    node.setContentSize(0, 0);
    label.string = (schema.props && schema.props.text) || '';
    label.fontSize = style.fontSize || 20;
    label.lineHeight = style.lineHeight || Math.ceil((style.fontSize || 20) * 1.4);
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
