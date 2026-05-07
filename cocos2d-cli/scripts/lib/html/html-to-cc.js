const DESIGN_WIDTH = 750;
const DESIGN_HEIGHT = 1334;
const LAYOUT_HORIZONTAL = 0;
const LAYOUT_VERTICAL = 1;
export function htmlToCocos(htmlRoot) {
    return convertNode(htmlRoot, undefined, htmlRoot.tag === 'body');
}
function convertNode(htmlNode, parent, isRoot = false) {
    const { tag, styles, text, children } = htmlNode;
    const config = {
        name: getNodeName(tag, htmlNode.attributes),
        anchorX: 0.5,
        anchorY: 0.5
    };
    const components = [];
    const width = parseSize(styles.width, 'width');
    const height = parseSize(styles.height, 'height');
    if (width !== undefined)
        config.width = width;
    if (height !== undefined)
        config.height = height;
    if (isRoot && config.width === undefined)
        config.width = DESIGN_WIDTH;
    if (isRoot && config.height === undefined)
        config.height = DESIGN_HEIGHT;
    const opacity = parseOpacity(styles.opacity);
    if (opacity !== undefined)
        config.opacity = opacity;
    const bgColor = parseColor(styles.backgroundColor);
    if (bgColor) {
        config.color = bgColor;
        components.push({ type: 'Sprite' });
    }
    const textColor = parseColor(styles.color);
    if (textColor) {
        config.color = textColor;
    }
    if ((isTextTag(tag) || tag === 'button') && text) {
        const fontSize = parsePixel(styles.fontSize) || defaultFontSize(tag);
        if (config.width === undefined) {
            config.width = estimateTextWidth(text, fontSize);
        }
        if (config.height === undefined) {
            config.height = parsePixel(styles.lineHeight) || Math.round(fontSize * 1.4);
        }
        components.push({
            type: 'Label',
            string: text,
            fontSize,
            horizontalAlign: parseTextAlign(styles.textAlign),
            lineHeight: parsePixel(styles.lineHeight) || Math.round(fontSize * 1.4),
            color: textColor
        });
    }
    if (tag === 'button') {
        components.push({ type: 'Button' });
        if (config.width === undefined)
            config.width = 160;
        if (config.height === undefined)
            config.height = 60;
    }
    const isFlex = styles.display === 'flex';
    if (isFlex) {
        const isRow = styles.flexDirection !== 'column';
        const padding = parsePadding(styles);
        const gap = parseGap(styles, isRow ? 'row' : 'column');
        components.push({
            type: 'Layout',
            layoutType: isRow ? LAYOUT_HORIZONTAL : LAYOUT_VERTICAL,
            resizeMode: 0,
            paddingLeft: padding.left,
            paddingRight: padding.right,
            paddingTop: padding.top,
            paddingBottom: padding.bottom,
            spacingX: isRow ? gap : 0,
            spacingY: isRow ? 0 : gap
        });
    }
    else if (shouldAutoVerticalStack(htmlNode)) {
        const padding = parsePadding(styles);
        components.push({
            type: 'Layout',
            layoutType: LAYOUT_VERTICAL,
            resizeMode: 0,
            paddingLeft: padding.left,
            paddingRight: padding.right,
            paddingTop: padding.top,
            paddingBottom: padding.bottom,
            spacingX: 0,
            spacingY: 0
        });
    }
    const widget = createWidgetFromStyles(styles, parent, isRoot);
    if (widget) {
        components.push(widget);
    }
    if (components.length > 0) {
        config.components = components;
    }
    if (children.length > 0) {
        config.children = children.map(child => convertNode(child, htmlNode, false));
    }
    return config;
}
function getNodeName(tag, attributes) {
    if (tag === 'body')
        return 'body';
    if (attributes.class) {
        const className = attributes.class.split(/\s+/)[0];
        return className.charAt(0).toUpperCase() + className.slice(1);
    }
    return tag.charAt(0).toUpperCase() + tag.slice(1);
}
function parsePixel(value) {
    if (!value)
        return undefined;
    const normalized = value.trim().toLowerCase();
    const pxMatch = normalized.match(/^(-?\d+(?:\.\d+)?)px?$/);
    if (pxMatch)
        return parseFloat(pxMatch[1]);
    const vhMatch = normalized.match(/^(-?\d+(?:\.\d+)?)vh$/);
    if (vhMatch)
        return Math.round(parseFloat(vhMatch[1]) * DESIGN_HEIGHT / 100);
    const vwMatch = normalized.match(/^(-?\d+(?:\.\d+)?)vw$/);
    if (vwMatch)
        return Math.round(parseFloat(vwMatch[1]) * DESIGN_WIDTH / 100);
    return undefined;
}
function parseSize(value, axis) {
    if (!value)
        return undefined;
    const normalized = value.trim().toLowerCase();
    if (normalized === '100%') {
        return axis === 'width' ? DESIGN_WIDTH : DESIGN_HEIGHT;
    }
    return parsePixel(normalized);
}
function parseColor(color) {
    if (!color)
        return undefined;
    if (color.startsWith('#')) {
        if (color.length === 4) {
            return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
        }
        return color;
    }
    const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    return undefined;
}
function parseOpacity(value) {
    if (!value)
        return undefined;
    const num = parseFloat(value);
    if (isNaN(num))
        return undefined;
    return Math.max(0, Math.min(255, Math.round(num * 255)));
}
function parseTextAlign(value) {
    switch (value) {
        case 'left': return 0;
        case 'center': return 1;
        case 'right': return 2;
        default: return 1;
    }
}
function isTextTag(tag) {
    return ['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag);
}
function parsePadding(styles) {
    const shorthand = expandBoxShorthand(styles.padding);
    return {
        top: parsePixel(styles.paddingTop) ?? shorthand.top,
        right: parsePixel(styles.paddingRight) ?? shorthand.right,
        bottom: parsePixel(styles.paddingBottom) ?? shorthand.bottom,
        left: parsePixel(styles.paddingLeft) ?? shorthand.left
    };
}
function parseGap(styles, direction) {
    if (direction === 'row') {
        return parsePixel(styles.columnGap) ?? parsePixel(styles.gap) ?? 0;
    }
    return parsePixel(styles.rowGap) ?? parsePixel(styles.gap) ?? 0;
}
function expandBoxShorthand(value) {
    if (!value) {
        return { top: 0, right: 0, bottom: 0, left: 0 };
    }
    const parts = value.trim().split(/\s+/).map(part => parsePixel(part) ?? 0);
    if (parts.length === 1) {
        return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    }
    if (parts.length === 2) {
        return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    }
    if (parts.length === 3) {
        return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
    }
    return {
        top: parts[0] ?? 0,
        right: parts[1] ?? 0,
        bottom: parts[2] ?? 0,
        left: parts[3] ?? 0
    };
}
function createWidgetFromStyles(styles, parent, isRoot) {
    const hasAbsolute = styles.position === 'absolute';
    const left = parsePixel(styles.left);
    const right = parsePixel(styles.right);
    const top = parsePixel(styles.top);
    const bottom = parsePixel(styles.bottom);
    const fullWidth = styles.width?.trim() === '100%';
    const fullHeight = styles.height?.trim() === '100%';
    if (isRoot || fullWidth || fullHeight || hasAbsolute) {
        const widget = { type: 'Widget' };
        if (isRoot || fullWidth) {
            widget.isAlignLeft = true;
            widget.isAlignRight = true;
            widget.left = left ?? 0;
            widget.right = right ?? 0;
        }
        else {
            if (left !== undefined) {
                widget.isAlignLeft = true;
                widget.left = left;
            }
            if (right !== undefined) {
                widget.isAlignRight = true;
                widget.right = right;
            }
        }
        if (isRoot || fullHeight) {
            widget.isAlignTop = true;
            widget.isAlignBottom = true;
            widget.top = top ?? 0;
            widget.bottom = bottom ?? 0;
        }
        else {
            if (top !== undefined) {
                widget.isAlignTop = true;
                widget.top = top;
            }
            if (bottom !== undefined) {
                widget.isAlignBottom = true;
                widget.bottom = bottom;
            }
        }
        return widget;
    }
    if (!parent) {
        return null;
    }
    return null;
}
function shouldAutoVerticalStack(node) {
    if (node.styles.display === 'flex') {
        return false;
    }
    return node.children.length > 1 && node.children.every(child => child.styles.position !== 'absolute');
}
function defaultFontSize(tag) {
    switch (tag) {
        case 'h1': return 40;
        case 'h2': return 36;
        case 'h3': return 32;
        case 'h4': return 28;
        case 'h5': return 24;
        case 'h6': return 22;
        default: return 24;
    }
}
function estimateTextWidth(text, fontSize) {
    return Math.max(fontSize, Math.ceil(text.length * fontSize * 0.6));
}
