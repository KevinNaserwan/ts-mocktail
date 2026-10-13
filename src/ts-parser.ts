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

export function parseTypeScriptDefinitions(tsCode: string): Map<string, ModelDefinition> {
  const models = new Map<string, ModelDefinition>();
  const interfaceRegex = /(?:\/\*\*([\s\S]*?)\*\/\s*)?(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_]+)(?:\s*=\s*|\s*\{)([\s\S]*?)\}/g;
  let match: RegExpExecArray | null;

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

function parseFields(bodyText: string): Record<string, FieldDefinition> {
  const fields: Record<string, FieldDefinition> = {};
  const lines = bodyText.split(/[\n;]/);

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

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

function cleanType(rawType: string): string {
  let t = rawType.replace(/\/\/.*$/, '').trim();
  t = t.replace(/\|\s*undefined/g, '').trim();
  return t;
}
