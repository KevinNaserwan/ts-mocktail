"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatefulMockServer = void 0;
const http = __importStar(require("http"));
const url = __importStar(require("url"));
const ts_parser_1 = require("./ts-parser");
const mock_generator_1 = require("./mock-generator");
class StatefulMockServer {
    models = new Map();
    collections = new Map();
    generator = new mock_generator_1.MockGenerator();
    port;
    server;
    constructor(options = {}) {
        this.port = options.port || 4000;
    }
    loadTypeScript(tsCode) {
        this.models = (0, ts_parser_1.parseTypeScriptDefinitions)(tsCode);
        for (const [modelName, modelDef] of this.models.entries()) {
            const collectionKey = modelName.toLowerCase();
            const initialItems = [];
            for (let i = 0; i < 5; i++) {
                initialItems.push(this.generator.generateModel(modelDef));
            }
            this.collections.set(collectionKey, initialItems);
        }
    }
    handleRequest(req, res) {
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
        req.on('data', (chunk) => bodyData += chunk);
        req.on('end', () => {
            let parsedPayload = {};
            try {
                if (bodyData.trim())
                    parsedPayload = JSON.parse(bodyData);
            }
            catch {
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
    start(cb) {
        this.server = http.createServer((req, res) => this.handleRequest(req, res));
        this.server.listen(this.port, () => {
            if (cb)
                cb(this.port);
        });
    }
    stop(cb) {
        if (this.server) {
            this.server.close(cb);
        }
        else if (cb) {
            cb();
        }
    }
}
exports.StatefulMockServer = StatefulMockServer;
