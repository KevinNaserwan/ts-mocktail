'use strict';

/**
 * Lightweight TypeScript Interface/Type AST Extractor
 * Parses TypeScript interfaces and type aliases without heavyweight ts-node dependency.
 */
function parseTypeScriptDefinitions(tsCode) {
  const models = new Map();

  // Clean comments but keep JSDoc annotations
  const interfaceRegex = /(?:\/\*\*([\s\S]*?)\*\/\s*)?(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_]+)(?:\s*=\s*|\s*\{)([\s\S]*?)\}/g;
  let match;

  while ((match = interfaceRegex.exec(tsCode)) !== null) {
    const jsDoc = match[1] || '';
    const name = match[2];
    const body = match[3];

    const fields = parseFields(body);
    models.set(name, {
      name,
      jsDoc,
      fields
    });
  }

  return models;
}

function parseFields(bodyText) {
  const fields = {};
  const lines = bodyText.split(/[\n;]/);

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

    // Field: name?: type
    const fieldMatch = line.match(/^([A-Za-z0-9_]+)(\?)?:\s*([^;]+)/);
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      const isOptional = !!fieldMatch[2];
      const rawType = fieldMatch[3].trim();

      fields[fieldName] = {
        name: fieldName,
        optional: isOptional,
        type: cleanType(rawType)
      };
    }
  }

  return fields;
}

function cleanType(rawType) {
  // Strip trailing comments
  let t = rawType.replace(/\/\/.*$/, '').trim();
  // Strip union with undefined
  t = t.replace(/\|\s*undefined/g, '').trim();
  return t;
}

module.exports = {
  parseTypeScriptDefinitions
};
