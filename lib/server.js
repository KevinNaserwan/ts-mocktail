'use strict';

const http = require('http');
const url = require('url');
const { parseTypeScriptDefinitions } = require('./ts-parser');
const { MockGenerator } = require('./mock-generator');

class StatefulMockServer {
  constructor(options = {}) {
    this.models = new Map();
    this.collections = new Map();
    this.generator = new MockGenerator();
    this.port = options.port || 4000;
  }

  loadTypeScript(tsCode) {
    this.models = parseTypeScriptDefinitions(tsCode);
    // Initialize mock database collections
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
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname.replace(/^\/api\//, '/').replace(/^\//, '');
    const segments = pathname.split('/').filter(Boolean);
    const method = req.method.toUpperCase();

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (segments.length === 0) {
      // Root info
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const availableEndpoints = Array.from(this.models.keys()).map(m => `/${m.toLowerCase()}`);
      res.end(JSON.stringify({
        message: 'ts-mocktail stateful mock server running',
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
      res.end(JSON.stringify({ error: `Resource /${collectionName} not found in TypeScript definitions` }));
      return;
    }

    const matchingModel = Array.from(this.models.values()).find(m => m.name.toLowerCase() === collectionName);

    // GET /collection
    if (method === 'GET' && !itemId) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(collection, null, 2));
      return;
    }

    // GET /collection/:id
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

    // Read Body for POST/PUT
    let bodyData = '';
    req.on('data', chunk => bodyData += chunk);
    req.on('end', () => {
      let parsedPayload = {};
      try {
        if (bodyData.trim()) parsedPayload = JSON.parse(bodyData);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
        return;
      }

      // POST /collection
      if (method === 'POST') {
        const newItem = this.generator.generateModel(matchingModel, parsedPayload);
        collection.push(newItem);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newItem, null, 2));
        return;
      }

      // PUT /collection/:id
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

      // DELETE /collection/:id
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
      if (cb) cb(this.port);
    });
  }

  stop(cb) {
    if (this.server) {
      this.server.close(cb);
    } else if (cb) {
      cb();
    }
  }
}

module.exports = { StatefulMockServer };
