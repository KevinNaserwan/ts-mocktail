import { ModelDefinition } from './ts-parser';
export declare class MockGenerator {
    private idCounter;
    generateModel(modelDef?: ModelDefinition, overrides?: Record<string, any>): Record<string, any>;
    generateField(name: string, typeStr: string): any;
}
//# sourceMappingURL=mock-generator.d.ts.map