import { load } from 'cheerio';
import * as csstree from 'css-tree';
const SUPPORTED_TAGS = new Set(['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'img', 'body']);
export function parseHtml(htmlContent) {
    const $ = load(htmlContent);
    const cssRules = extractCssRules($);
    let rootEl = $('body');
    if (rootEl.length === 0) {
        rootEl = $('html');
    }
    if (rootEl.length === 0) {
        rootEl = $.root().children().first();
    }
    const root = parseElement($, rootEl.get(0), cssRules);
    if (!root) {
        throw new Error('No valid root node found');
    }
    return { root, cssRules };
}
function extractCssRules($) {
    const rules = [];
    $('style').each((_, element) => {
        const cssText = $(element).html();
        if (!cssText)
            return;
        try {
            const ast = csstree.parse(cssText);
            csstree.walk(ast, {
                visit: 'Rule',
                enter(node) {
                    const selector = csstree.generate(node.prelude);
                    const styles = parseCssDeclaration(node.block);
                    if (selector && styles) {
                        rules.push({ selector: selector.trim(), styles });
                    }
                }
            });
        }
        catch (e) {
        }
    });
    return rules;
}
function parseCssDeclaration(block) {
    const styles = {};
    if (!block || !block.children)
        return styles;
    csstree.walk(block, {
        visit: 'Declaration',
        enter(node) {
            const prop = node.property;
            const value = csstree.generate(node.value);
            applyCssProperty(styles, prop, value);
        }
    });
    return styles;
}
function applyCssProperty(styles, prop, value) {
    switch (prop) {
        case 'width':
            styles.width = value;
            break;
        case 'height':
            styles.height = value;
            break;
        case 'padding':
            styles.padding = value;
            break;
        case 'padding-top':
            styles.paddingTop = value;
            break;
        case 'padding-right':
            styles.paddingRight = value;
            break;
        case 'padding-bottom':
            styles.paddingBottom = value;
            break;
        case 'padding-left':
            styles.paddingLeft = value;
            break;
        case 'gap':
            styles.gap = value;
            break;
        case 'row-gap':
            styles.rowGap = value;
            break;
        case 'column-gap':
            styles.columnGap = value;
            break;
        case 'display':
            styles.display = value;
            break;
        case 'flex-direction':
            styles.flexDirection = value;
            break;
        case 'position':
            styles.position = value;
            break;
        case 'top':
            styles.top = value;
            break;
        case 'right':
            styles.right = value;
            break;
        case 'bottom':
            styles.bottom = value;
            break;
        case 'left':
            styles.left = value;
            break;
        case 'background-color':
            styles.backgroundColor = value;
            break;
        case 'color':
            styles.color = value;
            break;
        case 'font-size':
            styles.fontSize = value;
            break;
        case 'text-align':
            styles.textAlign = value;
            break;
        case 'line-height':
            styles.lineHeight = value;
            break;
        case 'opacity':
            styles.opacity = value;
            break;
    }
}
function parseInlineStyle(styleStr) {
    const styles = {};
    if (!styleStr)
        return styles;
    const declarations = styleStr.split(';');
    for (const decl of declarations) {
        const [property, value] = decl.split(':').map(s => s.trim());
        if (!property || !value)
            continue;
        const kebabProp = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        applyCssProperty(styles, kebabProp, value);
    }
    return styles;
}
function matchSelector(selector, tagName, classAttr, idAttr) {
    const trimmed = selector.trim();
    if (!trimmed || /\s|>|\+|~|:|\[/.test(trimmed)) {
        return false;
    }
    if (trimmed.startsWith('.')) {
        const className = trimmed.slice(1);
        const classes = classAttr.split(/\s+/).filter(Boolean);
        return classes.includes(className);
    }
    if (trimmed.startsWith('#')) {
        return idAttr === trimmed.slice(1);
    }
    return trimmed.toLowerCase() === tagName.toLowerCase();
}
function findMatchingStyles(tagName, classAttr, idAttr, cssRules) {
    const matched = {};
    for (const rule of cssRules) {
        if (matchSelector(rule.selector, tagName, classAttr, idAttr)) {
            Object.assign(matched, rule.styles);
        }
    }
    return matched;
}
function parseElement($, element, cssRules) {
    if (!element || element.type !== 'tag')
        return null;
    const tagName = (element.name || '').toLowerCase();
    if (['head', 'style', 'script', 'html'].includes(tagName)) {
        return null;
    }
    const attribs = element.attribs || {};
    const classAttr = attribs.class || '';
    const idAttr = attribs.id || '';
    const classStyles = findMatchingStyles(tagName, classAttr, idAttr, cssRules);
    const inlineStyles = parseInlineStyle(attribs.style || '');
    const mergedStyles = { ...classStyles, ...inlineStyles };
    let text;
    if (element.children) {
        for (const child of element.children) {
            if (child.type === 'text') {
                const content = (child.data || '').trim();
                if (content) {
                    text = (text || '') + content;
                }
            }
        }
    }
    const children = [];
    if (element.children) {
        for (const child of element.children) {
            const childNode = parseElement($, child, cssRules);
            if (childNode) {
                children.push(childNode);
            }
        }
    }
    const finalTag = SUPPORTED_TAGS.has(tagName) ? tagName : 'div';
    return {
        tag: finalTag,
        attributes: { class: classAttr, id: attribs.id || '' },
        styles: mergedStyles,
        children,
        text: text || undefined
    };
}
