const { ccclass } = cc._decorator;

@ccclass
export default class WebUIBackground extends cc.Component {
  colorHex = '#ffffff';
  radius = 0;

  onEnable() {
    this.updateGraphics();
  }

  updateGraphics() {
    const graphics = this.getComponent(cc.Graphics) || this.addComponent(cc.Graphics);
    graphics.clear();
    graphics.fillColor = this.parseColor(this.colorHex);

    const width = this.node.width || 1;
    const height = this.node.height || 1;
    const radius = Math.max(0, Math.min(this.radius, width * 0.5, height * 0.5));

    if (radius <= 0) {
      graphics.rect(0, -height, width, height);
      graphics.fill();
      return;
    }

    const left = 0;
    const top = 0;
    const right = width;
    const bottom = -height;

    graphics.moveTo(left + radius, top);
    graphics.lineTo(right - radius, top);
    graphics.quadraticCurveTo(right, top, right, top - radius);
    graphics.lineTo(right, bottom + radius);
    graphics.quadraticCurveTo(right, bottom, right - radius, bottom);
    graphics.lineTo(left + radius, bottom);
    graphics.quadraticCurveTo(left, bottom, left, bottom + radius);
    graphics.lineTo(left, top - radius);
    graphics.quadraticCurveTo(left, top, left + radius, top);
    graphics.close();
    graphics.fill();
  }

  private parseColor(value: string): cc.Color {
    const color = new cc.Color();
    return color.fromHEX(value);
  }
}
