'use strict';

const assert = require('assert');
const http = require('http');
const { parseTypeScriptDefinitions } = require('../dist/ts-parser');
const { MockGenerator } = require('../dist/mock-generator');
const { StatefulMockServer } = require('../dist/server');

console.log('Running ts-mocktail Test Suite...');

// Test 1: Parser
{
  const ts = `
    export interface Employee {
      id: number;
      name: string;
      email: string;
      isManager: boolean;
      status: 'ACTIVE' | 'ON_LEAVE';
    }
  `;
  const models = parseTypeScriptDefinitions(ts);
  assert(models.has('Employee'), 'Must parse Employee interface');
  const emp = models.get('Employee');
  assert.strictEqual(emp.fields.name.type, 'string');
  assert.strictEqual(emp.fields.status.type, "'ACTIVE' | 'ON_LEAVE'");
  console.log('✔ Test 1: TypeScript AST Parser passed');
}

// Test 2: Stateful Server CRUD End-to-End
{
  const ts = `
    export interface Item {
      id: number;
      title: string;
      price: number;
    }
  `;

  const server = new StatefulMockServer({ port: 4999 });
  server.loadTypeScript(ts);

  server.start(() => {
    // 1. GET /item
    http.get('http://localhost:4999/item', (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const items = JSON.parse(data);
        assert(Array.isArray(items), 'GET /item should return list');
        assert(items.length >= 5, 'Should contain pre-seeded items');

        // 2. POST /item (Stateful mutation)
        const postData = JSON.stringify({ title: 'New Custom Gadget', price: 9999 });
        const postReq = http.request({
          hostname: 'localhost',
          port: 4999,
          path: '/item',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (postRes) => {
          let postBody = '';
          postRes.on('data', c => postBody += c);
          postRes.on('end', () => {
            const created = JSON.parse(postBody);
            assert.strictEqual(created.title, 'New Custom Gadget');

            // 3. Verify created item is persisted in next GET
            http.get('http://localhost:4999/item', (verifyRes) => {
              let verifyData = '';
              verifyRes.on('data', c => verifyData += c);
              verifyRes.on('end', () => {
                const listAfter = JSON.parse(verifyData);
                const found = listAfter.find(x => x.title === 'New Custom Gadget');
                assert(found, 'Created item must persist in in-memory state');
                console.log('✔ Test 2: Stateful Mock Server CRUD operations passed');

                server.stop(() => {
                  console.log('All tests passed successfully (2/2)!');
                  process.exit(0);
                });
              });
            });
          });
        });
        postReq.write(postData);
        postReq.end();
      });
    });
  });
}
