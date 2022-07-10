export class DOM {
    static getElementById(id: string): HTMLElement {
        return document.getElementById(id);
    }
    static getElementByClass(parentElement: Element, className: string): HTMLElement {
        const elements = parentElement.getElementsByClassName(className);
        if (elements.length === 0)
            return null;
        return elements.item(0) as HTMLElement;
    }
    static getElementByName(name: string): HTMLElement {
        const elements = document.getElementsByName(name);
        if (elements.length === 0)
            return null;
        return elements.item(0) as HTMLElement;
    }
    static getElementByTagName(parentElement: Element, tagName: string): HTMLElement {
        const elements = parentElement.getElementsByTagName(tagName);
        if (elements.length === 0)
            return null;
        return elements.item(0) as HTMLElement;
    }
    static getElementsByTagName(parentElement: Element, tagName: string) {
        return parentElement.getElementsByTagName(tagName);
    }
    static queryElement(parentElement: Element, query: string): HTMLElement {
        return parentElement.querySelector(query);
    }
    static queryElements(parentElement: Element, query: string): NodeListOf<HTMLElement> {
        return parentElement.querySelectorAll(query);
    }
    static nextElementByClass(currentElement: Element, className: string): HTMLElement {
        let n = currentElement.nextSibling;
        while (n) {
            if (n.nodeType === 1) {
                if ((n as HTMLElement).classList.contains(className))
                    return n as HTMLElement;
            }

            n = n.nextSibling;
        }
        return null;
    }
    static prevElementByClass(currentElement: Element, className: string): HTMLElement {
        let n = currentElement.previousSibling;
        while (n) {
            if (n.nodeType === 1) {
                if ((n as HTMLElement).classList.contains(className))
                    return n as HTMLElement;
            }

            n = n.previousSibling;
        }
        return null;
    }
    static prevElement(currentElement: Element): HTMLElement {
        let n = currentElement.previousSibling;
        while (n) {
            if (n.nodeType === 1) {
                return n as HTMLElement;
            }

            n = n.previousSibling;
        }
        return null;
    }
    static nextElement(currentElement: Element): HTMLElement {
        let n = currentElement.nextSibling;
        while (n) {
            if (n.nodeType === 1) {
                return n as HTMLElement;
            }

            n = n.nextSibling;
        }
        return null;
    }

    static tag(tagName: string, options?: ElementOptions | string, children?: ((elem: Element) => void) | Element | string | Array<Element | string | ((parent: Element) => Element)>): HTMLElement {
        const elem = document.createElement(tagName);

        if (options) {
            if (typeof options === "string") {
                elem.className = options as string;
            }
            else {
                for (let key in options) {
                    const value = options[key];

                    switch (key) {
                        case "id": {
                            elem.id = value as string;
                            break;
                        }
                        case "styles": {
                            for (const sKey in value as object) {
                                elem.style[sKey] = value[sKey];
                            }
                            break;
                        }
                        case "class": {
                            if (typeof value === "string")
                                elem.className = value as string;
                            else if (value instanceof Array) {
                                for (let iClass = 0; iClass < value.length; iClass++) {
                                    elem.classList.add(value[iClass]);
                                }
                            }
                            else
                                throw "Invalid element class value.";
                            break;
                        }
                        case "command": {
                            elem.dataset["command"] = value as string;
                            break;
                        }
                        case "dataset": {
                            for (const dataName in value as object) {
                                elem.dataset[dataName] = value[dataName];
                            }
                            break;
                        }
                        case "events": {
                            for (const eventName in value as object) {
                                elem.addEventListener(eventName, value[eventName]);
                            }
                            break;
                        }
                        default: {
                            if (typeof value === "object") {
                                elem.setAttribute(key, value !== null ? JSON.stringify(value) : "");
                            }
                            else if (typeof value === "string") {
                                elem.setAttribute(key, value !== null ? value as string : "");
                            }
                            else {
                                elem.setAttribute(key, value !== null ? value.toString() : "");
                            }
                            break;
                        }
                    }
                }
            }
        }

        if (children) {
            if (children instanceof Element) {
                elem.insertAdjacentElement("beforeend", children);
            }
            else if (children instanceof Array) {
                for (let i = 0; i < children.length; i++) {
                    const chd = children[i];
                    if (chd instanceof Element)
                        elem.insertAdjacentElement("beforeend", chd);
                    else if (typeof chd === "function") {
                        const chdElem = chd(elem);
                        if (chdElem)
                            elem.insertAdjacentElement("beforeend", chdElem);
                    }
                    else if (typeof chd === "string") {
                        elem.insertAdjacentHTML("beforeend", chd);
                    }
                }
            }
            else if (typeof children === "string") {
                elem.innerHTML = children;
            }
            else if (typeof children === "function") {
                children(elem);
            }
            else
                throw new Error();
        }

        return elem;
    }

    static addClass(container: Element, selectors: string, className: string) {
        const nodes = container.querySelectorAll(selectors);
        for (let i = 0; i < nodes.length; i++) {
            nodes.item(i).classList.add(className);
        }
    }
    static removeClass(container: Element, selectors: string, className: string) {
        const nodes = container.querySelectorAll(selectors);
        for (let i = 0; i < nodes.length; i++) {
            nodes.item(i).classList.remove(className);
        }
    }

    static empty(element: Element) {
        while (element.hasChildNodes()) {
            element.removeChild(element.firstChild);
        }
    }
}

export interface ElementOptions {
    id?: string,
    dataset?: ElementData;
    styles?: ElementStyles;
    class?: string | Array<string>;
    events?: { [name: string]: EventListenerOrEventListenerObject };
    command?: string;
    [name: string]: string | number | boolean | object; // attributes
}

export interface ElementData {
    [name: string]: string | undefined;
}

export interface ElementStyles {
    alignContent?: string;
    alignItems?: string;
    alignSelf?: string;
    alignmentBaseline?: string;
    all?: string;
    animation?: string;
    animationDelay?: string;
    animationDirection?: string;
    animationDuration?: string;
    animationFillMode?: string;
    animationIterationCount?: string;
    animationName?: string;
    animationPlayState?: string;
    animationTimingFunction?: string;
    backfaceVisibility?: string;
    background?: string;
    backgroundAttachment?: string;
    backgroundClip?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundOrigin?: string;
    backgroundPosition?: string;
    backgroundPositionX?: string;
    backgroundPositionY?: string;
    backgroundRepeat?: string;
    backgroundSize?: string;
    baselineShift?: string;
    blockSize?: string;
    border?: string;
    borderBlockEnd?: string;
    borderBlockEndColor?: string;
    borderBlockEndStyle?: string;
    borderBlockEndWidth?: string;
    borderBlockStart?: string;
    borderBlockStartColor?: string;
    borderBlockStartStyle?: string;
    borderBlockStartWidth?: string;
    borderBottom?: string;
    borderBottomColor?: string;
    borderBottomLeftRadius?: string;
    borderBottomRightRadius?: string;
    borderBottomStyle?: string;
    borderBottomWidth?: string;
    borderCollapse?: string;
    borderColor?: string;
    borderImage?: string;
    borderImageOutset?: string;
    borderImageRepeat?: string;
    borderImageSlice?: string;
    borderImageSource?: string;
    borderImageWidth?: string;
    borderInlineEnd?: string;
    borderInlineEndColor?: string;
    borderInlineEndStyle?: string;
    borderInlineEndWidth?: string;
    borderInlineStart?: string;
    borderInlineStartColor?: string;
    borderInlineStartStyle?: string;
    borderInlineStartWidth?: string;
    borderLeft?: string;
    borderLeftColor?: string;
    borderLeftStyle?: string;
    borderLeftWidth?: string;
    borderRadius?: string;
    borderRight?: string;
    borderRightColor?: string;
    borderRightStyle?: string;
    borderRightWidth?: string;
    borderSpacing?: string;
    borderStyle?: string;
    borderTop?: string;
    borderTopColor?: string;
    borderTopLeftRadius?: string;
    borderTopRightRadius?: string;
    borderTopStyle?: string;
    borderTopWidth?: string;
    borderWidth?: string;
    bottom?: string;
    boxShadow?: string;
    boxSizing?: string;
    breakAfter?: string;
    breakBefore?: string;
    breakInside?: string;
    captionSide?: string;
    caretColor?: string;
    clear?: string;
    clip?: string;
    clipPath?: string;
    clipRule?: string;
    color?: string;
    colorInterpolation?: string;
    colorInterpolationFilters?: string;
    columnCount?: string;
    columnFill?: string;
    columnGap?: string;
    columnRule?: string;
    columnRuleColor?: string;
    columnRuleStyle?: string;
    columnRuleWidth?: string;
    columnSpan?: string;
    columnWidth?: string;
    columns?: string;
    content?: string;
    counterIncrement?: string;
    counterReset?: string;
    cssFloat?: string;
    cssText?: string;
    cursor?: string;
    direction?: string;
    display?: string;
    dominantBaseline?: string;
    emptyCells?: string;
    fill?: string;
    fillOpacity?: string;
    fillRule?: string;
    filter?: string;
    flex?: string;
    flexBasis?: string;
    flexDirection?: string;
    flexFlow?: string;
    flexGrow?: string;
    flexShrink?: string;
    flexWrap?: string;
    float?: string;
    floodColor?: string;
    floodOpacity?: string;
    font?: string;
    fontFamily?: string;
    fontFeatureSettings?: string;
    fontKerning?: string;
    fontSize?: string;
    fontSizeAdjust?: string;
    fontStretch?: string;
    fontStyle?: string;
    fontSynthesis?: string;
    fontVariant?: string;
    fontVariantCaps?: string;
    fontVariantEastAsian?: string;
    fontVariantLigatures?: string;
    fontVariantNumeric?: string;
    fontVariantPosition?: string;
    fontWeight?: string;
    gap?: string;
    glyphOrientationVertical?: string;
    grid?: string;
    gridArea?: string;
    gridAutoColumns?: string;
    gridAutoFlow?: string;
    gridAutoRows?: string;
    gridColumn?: string;
    gridColumnEnd?: string;
    gridColumnGap?: string;
    gridColumnStart?: string;
    gridGap?: string;
    gridRow?: string;
    gridRowEnd?: string;
    gridRowGap?: string;
    gridRowStart?: string;
    gridTemplate?: string;
    gridTemplateAreas?: string;
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
    height?: string;
    hyphens?: string;
    imageOrientation?: string;
    imageRendering?: string;
    inlineSize?: string;
    justifyContent?: string;
    justifyItems?: string;
    justifySelf?: string;
    left?: string;
    letterSpacing?: string;
    lightingColor?: string;
    lineBreak?: string;
    lineHeight?: string;
    listStyle?: string;
    listStyleImage?: string;
    listStylePosition?: string;
    listStyleType?: string;
    margin?: string;
    marginBlockEnd?: string;
    marginBlockStart?: string;
    marginBottom?: string;
    marginInlineEnd?: string;
    marginInlineStart?: string;
    marginLeft?: string;
    marginRight?: string;
    marginTop?: string;
    marker?: string;
    markerEnd?: string;
    markerMid?: string;
    markerStart?: string;
    mask?: string;
    maskComposite?: string;
    maskImage?: string;
    maskPosition?: string;
    maskRepeat?: string;
    maskSize?: string;
    maskType?: string;
    maxBlockSize?: string;
    maxHeight?: string;
    maxInlineSize?: string;
    maxWidth?: string;
    minBlockSize?: string;
    minHeight?: string;
    minInlineSize?: string;
    minWidth?: string;
    objectFit?: string;
    objectPosition?: string;
    opacity?: string;
    order?: string;
    orphans?: string;
    outline?: string;
    outlineColor?: string;
    outlineOffset?: string;
    outlineStyle?: string;
    outlineWidth?: string;
    overflow?: string;
    overflowAnchor?: string;
    overflowWrap?: string;
    overflowX?: string;
    overflowY?: string;
    padding?: string;
    paddingBlockEnd?: string;
    paddingBlockStart?: string;
    paddingBottom?: string;
    paddingInlineEnd?: string;
    paddingInlineStart?: string;
    paddingLeft?: string;
    paddingRight?: string;
    paddingTop?: string;
    pageBreakAfter?: string;
    pageBreakBefore?: string;
    pageBreakInside?: string;
    paintOrder?: string;
    perspective?: string;
    perspectiveOrigin?: string;
    placeContent?: string;
    placeItems?: string;
    placeSelf?: string;
    pointerEvents?: string;
    position?: string;
    quotes?: string;
    resize?: string;
    right?: string;
    rotate?: string;
    rowGap?: string;
    rubyAlign?: string;
    rubyPosition?: string;
    scale?: string;
    scrollBehavior?: string;
    shapeRendering?: string;
    stopColor?: string;
    stopOpacity?: string;
    stroke?: string;
    strokeDasharray?: string;
    strokeDashoffset?: string;
    strokeLinecap?: string;
    strokeLinejoin?: string;
    strokeMiterlimit?: string;
    strokeOpacity?: string;
    strokeWidth?: string;
    tabSize?: string;
    tableLayout?: string;
    textAlign?: string;
    textAlignLast?: string;
    textAnchor?: string;
    textCombineUpright?: string;
    textDecoration?: string;
    textDecorationColor?: string;
    textDecorationLine?: string;
    textDecorationStyle?: string;
    textEmphasis?: string;
    textEmphasisColor?: string;
    textEmphasisPosition?: string;
    textEmphasisStyle?: string;
    textIndent?: string;
    textJustify?: string;
    textOrientation?: string;
    textOverflow?: string;
    textRendering?: string;
    textShadow?: string;
    textTransform?: string;
    textUnderlinePosition?: string;
    top?: string;
    touchAction?: string;
    transform?: string;
    transformBox?: string;
    transformOrigin?: string;
    transformStyle?: string;
    transition?: string;
    transitionDelay?: string;
    transitionDuration?: string;
    transitionProperty?: string;
    transitionTimingFunction?: string;
    translate?: string;
    unicodeBidi?: string;
    userSelect?: string;
    verticalAlign?: string;
    visibility?: string;
    webkitTapHighlightColor?: string;
    whiteSpace?: string;
    widows?: string;
    width?: string;
    willChange?: string;
    wordBreak?: string;
    wordSpacing?: string;
    wordWrap?: string;
    writingMode?: string;
    zIndex?: string;
}