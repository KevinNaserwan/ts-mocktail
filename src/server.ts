import * as http from 'http';
import * as url from 'url';
import { parseTypeScriptDefinitions, ModelDefinition } from './ts-parser';
import { MockGenerator } from './mock-generator';

export interface ServerOptions {
  port?: number;
}

export class StatefulMockServer {
  public models: Map<string, ModelDefinition> = new Map();
  public collections: Map<string, Array<Record<string, any>>> = new Map();
  public generator: MockGenerator = new MockGenerator();
  public port: number;
  private server?: http.Server;

  constructor(options: ServerOptions = {}) {
    this.port = options.port || 4000;
  }

  public loadTypeScript(tsCode: string): void {
    this.models = parseTypeScriptDefinitions(tsCode);
    for (const [modelName, modelDef] of this.models.entries()) {
      const collectionKey = modelName.toLowerCase();
      const initialItems: Array<Record<string, any>> = [];
      for (let i = 0; i < 5; i++) {
        initialItems.push(this.generator.generateModel(modelDef));
      }
      this.collections.set(collectionKey, initialItems);
    }
  }

  public handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const parsedUrl = url.parse(req.url || '/', true);
    const pathname = (parsedUrl.pathname || '').replace(/^\/api\//, '/').replace(/^\//, '');
    const segments = pathname.split('/').filter(Boolean);
    const method = (req.method || 'GET').toUpperCase();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (segments.length === 0) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const availableEndpoints = Array.from(this.models.keys()).map(m => `/${m.toLowerCase()}`);
      res.end(JSON.stringify({
        message: 'ts-mocktail stateful mock server running (TypeScript)',
        models: Array.from(this.models.keys()),
        endpoints: availableEndpoints
      }, null, 2));
      return;
    }

    const collectionName = segments[0].toLowerCase();
    const itemId = segments[1];
    const collection = this.collections.get(collectionName);

    if (!collection) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Resource /${collectionName} not found` }));
      return;
    }

    const matchingModel = Array.from(this.models.values()).find(m => m.name.toLowerCase() === collectionName);

    if (method === 'GET' && !itemId) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(collection, null, 2));
      return;
    }

    if (method === 'GET' && itemId) {
      const item = collection.find(x => String(x.id) === String(itemId));
      if (!item) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Item id ${itemId} not found` }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(item, null, 2));
      return;
    }

    let bodyData = '';
    req.on('data', (chunk: any) => bodyData += chunk);
    req.on('end', () => {
      let parsedPayload: Record<string, any> = {};
      try {
        if (bodyData.trim()) parsedPayload = JSON.parse(bodyData);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
        return;
      }

      if (method === 'POST') {
        const newItem = this.generator.generateModel(matchingModel, parsedPayload);
        collection.push(newItem);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newItem, null, 2));
        return;
      }

      if (method === 'PUT' && itemId) {
        const idx = collection.findIndex(x => String(x.id) === String(itemId));
        if (idx === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Item id ${itemId} not found` }));
          return;
        }
        collection[idx] = { ...collection[idx], ...parsedPayload, id: collection[idx].id };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(collection[idx], null, 2));
        return;
      }

      if (method === 'DELETE' && itemId) {
        const idx = collection.findIndex(x => String(x.id) === String(itemId));
        if (idx === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Item id ${itemId} not found` }));
          return;
        }
        const removed = collection.splice(idx, 1)[0];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, removed }, null, 2));
        return;
      }

      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Method ${method} not allowed` }));
    });
  }

  public start(cb?: (port: number) => void): void {
    this.server = http.createServer((req: any, res: any) => this.handleRequest(req, res));
    this.server.listen(this.port, () => {
      if (cb) cb(this.port);
    });
  }

  public stop(cb?: () => void): void {
    if (this.server) {
      this.server.close(cb);
    } else if (cb) {
      cb();
    }
  }
}
