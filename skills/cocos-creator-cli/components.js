/**
 * Cocos Creator 2.4.x 组件模板
 * 从编辑器导出的默认组件属性
 */

function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const DEFAULT_MATERIAL = { "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" };
const DEFAULT_SPRITE_FRAME = { "__uuid__": "8cdb44ac-a3f6-449f-b354-7cd48cf84061" };
const SPLASH_SPRITE_FRAME = { "__uuid__": "a23235d1-15db-4b95-8439-a2e005bfff91" };
const LAYOUT_SPRITE_FRAME = { "__uuid__": "9bbda31e-ad49-43c9-aaf2-f7d9896bac69" };
const BUTTON_NORMAL_SPRITE = { "__uuid__": "f0048c10-f03e-4c97-b9d3-3506e1d58952" };
const BUTTON_PRESSED_SPRITE = { "__uuid__": "e9ec654c-97a2-4787-9325-e6a10375219a" };
const BUTTON_DISABLED_SPRITE = { "__uuid__": "29158224-f8dd-4661-a796-1ffab537140e" };
const PARTICLE_FILE = { "__uuid__": "b2687ac4-099e-403c-a192-ff477686f4f5" };
const PARTICLE_SPRITE = { "__uuid__": "472df5d3-35e7-4184-9e6c-7f41bee65ee3" };

const Components = {
    sprite: (nodeId) => ({
        "__type__": "cc.Sprite",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_materials": [DEFAULT_MATERIAL],
        "_srcBlendFactor": 770,
        "_dstBlendFactor": 771,
        "_spriteFrame": DEFAULT_SPRITE_FRAME,
        "_type": 0,
        "_sizeMode": 1,
        "_fillType": 0,
        "_fillCenter": { "__type__": "cc.Vec2", "x": 0, "y": 0 },
        "_fillStart": 0,
        "_fillRange": 0,
        "_isTrimmedMode": true,
        "_atlas": null,
        "_id": generateId()
    }),

    spriteSplash: (nodeId) => ({
        "__type__": "cc.Sprite",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_materials": [DEFAULT_MATERIAL],
        "_srcBlendFactor": 770,
        "_dstBlendFactor": 771,
        "_spriteFrame": SPLASH_SPRITE_FRAME,
        "_type": 0,
        "_sizeMode": 0,
        "_fillType": 0,
        "_fillCenter": { "__type__": "cc.Vec2", "x": 0, "y": 0 },
        "_fillStart": 0,
        "_fillRange": 0,
        "_isTrimmedMode": true,
        "_atlas": null,
        "_id": generateId()
    }),

    label: (nodeId) => ({
        "__type__": "cc.Label",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_materials": [DEFAULT_MATERIAL],
        "_srcBlendFactor": 770,
        "_dstBlendFactor": 771,
        "_string": "Label",
        "_N$string": "Label",
        "_fontSize": 40,
        "_lineHeight": 40,
        "_enableWrapText": true,
        "_N$file": null,
        "_isSystemFontUsed": true,
        "_spacingX": 0,
        "_batchAsBitmap": false,
        "_styleFlags": 0,
        "_underlineHeight": 0,
        "_N$horizontalAlign": 1,
        "_N$verticalAlign": 1,
        "_N$fontFamily": "Arial",
        "_N$overflow": 0,
        "_N$cacheMode": 0,
        "_id": generateId()
    }),

    button: (nodeId) => ({
        "__type__": "cc.Button",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_normalMaterial": null,
        "_grayMaterial": null,
        "duration": 0.1,
        "zoomScale": 1.2,
        "clickEvents": [],
        "_N$interactable": true,
        "_N$enableAutoGrayEffect": false,
        "_N$transition": 3,
        "transition": 3,
        "_N$normalColor": {
            "__type__": "cc.Color",
            "r": 255,
            "g": 255,
            "b": 255,
            "a": 255
        },
        "_N$pressedColor": {
            "__type__": "cc.Color",
            "r": 200,
            "g": 200,
            "b": 200,
            "a": 255
        },
        "pressedColor": {
            "__type__": "cc.Color",
            "r": 200,
            "g": 200,
            "b": 200,
            "a": 255
        },
        "_N$hoverColor": {
            "__type__": "cc.Color",
            "r": 255,
            "g": 255,
            "b": 255,
            "a": 255
        },
        "hoverColor": {
            "__type__": "cc.Color",
            "r": 255,
            "g": 255,
            "b": 255,
            "a": 255
        },
        "_N$disabledColor": {
            "__type__": "cc.Color",
            "r": 120,
            "g": 120,
            "b": 120,
            "a": 200
        },
        "_N$normalSprite": BUTTON_NORMAL_SPRITE,
        "_N$pressedSprite": BUTTON_PRESSED_SPRITE,
        "pressedSprite": BUTTON_PRESSED_SPRITE,
        "_N$hoverSprite": BUTTON_NORMAL_SPRITE,
        "hoverSprite": BUTTON_NORMAL_SPRITE,
        "_N$disabledSprite": BUTTON_DISABLED_SPRITE,
        "_N$target": null,
        "_id": generateId()
    }),

    layout: (nodeId) => ({
        "__type__": "cc.Layout",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_layoutSize": {
            "__type__": "cc.Size",
            "width": 200,
            "height": 150
        },
        "_resize": 1,
        "_N$layoutType": 2,
        "_N$cellSize": {
            "__type__": "cc.Size",
            "width": 40,
            "height": 40
        },
        "_N$startAxis": 0,
        "_N$paddingLeft": 0,
        "_N$paddingRight": 0,
        "_N$paddingTop": 0,
        "_N$paddingBottom": 0,
        "_N$spacingX": 0,
        "_N$spacingY": 0,
        "_N$verticalDirection": 1,
        "_N$horizontalDirection": 0,
        "_N$affectedByScale": false,
        "_id": generateId()
    }),

    widget: (nodeId) => ({
        "__type__": "cc.Widget",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "alignMode": 1,
        "_target": null,
        "_alignFlags": 0,
        "_left": 0,
        "_right": 0,
        "_top": 0,
        "_bottom": 0,
        "_verticalCenter": 0,
        "_horizontalCenter": 0,
        "_isAbsLeft": true,
        "_isAbsRight": true,
        "_isAbsTop": true,
        "_isAbsBottom": true,
        "_isAbsHorizontalCenter": true,
        "_isAbsVerticalCenter": true,
        "_originalWidth": 0,
        "_originalHeight": 0,
        "_id": generateId()
    }),

    particleSystem: (nodeId) => ({
        "__type__": "cc.ParticleSystem",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_materials": [DEFAULT_MATERIAL],
        "_srcBlendFactor": 770,
        "_dstBlendFactor": 1,
        "_custom": false,
        "_file": PARTICLE_FILE,
        "_spriteFrame": PARTICLE_SPRITE,
        "_texture": null,
        "_stopped": true,
        "playOnLoad": true,
        "autoRemoveOnFinish": false,
        "totalParticles": 200,
        "duration": -1,
        "emissionRate": 999.999985098839,
        "life": 0.20000000298023224,
        "lifeVar": 0.5,
        "_startColor": {
            "__type__": "cc.Color",
            "r": 202,
            "g": 200,
            "b": 86,
            "a": 163
        },
        "_startColorVar": {
            "__type__": "cc.Color",
            "r": 229,
            "g": 255,
            "b": 173,
            "a": 198
        },
        "_endColor": {
            "__type__": "cc.Color",
            "r": 173,
            "g": 161,
            "b": 19,
            "a": 214
        },
        "_endColorVar": {
            "__type__": "cc.Color",
            "r": 107,
            "g": 249,
            "b": 249,
            "a": 188
        },
        "angle": 360,
        "angleVar": 360,
        "startSize": 3.369999885559082,
        "startSizeVar": 50,
        "endSize": 30.31999969482422,
        "endSizeVar": 0,
        "startSpin": -47.369998931884766,
        "startSpinVar": 0,
        "endSpin": -47.369998931884766,
        "endSpinVar": -142.11000061035156,
        "sourcePos": {
            "__type__": "cc.Vec2",
            "x": 0,
            "y": 0
        },
        "posVar": {
            "__type__": "cc.Vec2",
            "x": 7,
            "y": 7
        },
        "_positionType": 1,
        "positionType": 1,
        "emitterMode": 0,
        "gravity": {
            "__type__": "cc.Vec2",
            "x": 0.25,
            "y": 0.8600000143051147
        },
        "speed": 0,
        "speedVar": 190.7899932861328,
        "tangentialAccel": -92.11000061035156,
        "tangentialAccelVar": 65.79000091552734,
        "radialAccel": -671.0499877929688,
        "radialAccelVar": 65.79000091552734,
        "rotationIsDir": false,
        "startRadius": 0,
        "startRadiusVar": 0,
        "endRadius": 0,
        "endRadiusVar": 0,
        "rotatePerS": 0,
        "rotatePerSVar": 0,
        "_N$preview": true,
        "_id": generateId()
    }),

    camera: (nodeId) => ({
        "__type__": "cc.Camera",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_cullingMask": 4294967295,
        "_clearFlags": 7,
        "_backgroundColor": {
            "__type__": "cc.Color",
            "r": 0,
            "g": 0,
            "b": 0,
            "a": 255
        },
        "_depth": -1,
        "_zoomRatio": 1,
        "_targetTexture": null,
        "_fov": 60,
        "_orthoSize": 10,
        "_nearClip": 1,
        "_farClip": 4096,
        "_ortho": true,
        "_rect": {
            "__type__": "cc.Rect",
            "x": 0,
            "y": 0,
            "width": 1,
            "height": 1
        },
        "_renderStages": 1,
        "_alignWithScreen": true,
        "_id": generateId()
    }),

    canvas: (nodeId) => ({
        "__type__": "cc.Canvas",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_designResolution": {
            "__type__": "cc.Size",
            "width": 960,
            "height": 640
        },
        "_fitWidth": false,
        "_fitHeight": true,
        "_id": generateId()
    })
};

module.exports = { Components, generateId };
