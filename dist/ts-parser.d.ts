export interface FieldDefinition {
    name: string;
    optional: boolean;
    type: string;
}
export interface ModelDefinition {
    name: string;
    jsDoc: string;
    fields: Record<string, FieldDefinition>;
}
export declare function parseTypeScriptDefinitions(tsCode: string): Map<string, ModelDefinition>;
//# sourceMappingURL=ts-parser.d.ts.map