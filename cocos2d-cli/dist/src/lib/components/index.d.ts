export declare function getComponent(type: string): unknown;
export declare function createComponent(type: string, nodeId: number): unknown;
export declare function applyComponentProps(comp: unknown, props: unknown, node?: unknown): void;
export declare function extractComponentProps(comp: unknown): Record<string, unknown> | null;
declare function getComponentByCcType(ccType: string): unknown;
export declare function parseComponent(compDef: string | Record<string, unknown>): {
    type: string;
    props: Record<string, unknown>;
} | null;
declare const _default: {
    components: Record<string, unknown>;
    typeAliases: Record<string, string>;
    getComponent: typeof getComponent;
    getComponentByCcType: typeof getComponentByCcType;
    createComponent: typeof createComponent;
    applyComponentProps: typeof applyComponentProps;
    extractComponentProps: typeof extractComponentProps;
    parseComponent: typeof parseComponent;
};
export default _default;
//# sourceMappingURL=index.d.ts.map