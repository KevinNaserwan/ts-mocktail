import * as http from 'http';
import { ModelDefinition } from './ts-parser';
import { MockGenerator } from './mock-generator';
export interface ServerOptions {
    port?: number;
}
export declare class StatefulMockServer {
    models: Map<string, ModelDefinition>;
    collections: Map<string, Array<Record<string, any>>>;
    generator: MockGenerator;
    port: number;
    private server?;
    constructor(options?: ServerOptions);
    loadTypeScript(tsCode: string): void;
    handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void;
    start(cb?: (port: number) => void): void;
    stop(cb?: () => void): void;
}
//# sourceMappingURL=server.d.ts.map