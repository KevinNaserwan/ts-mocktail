import { ModelDefinition } from './ts-parser';

export class MockGenerator {
  private idCounter: number = 1001;

  public generateModel(modelDef?: ModelDefinition, overrides: Record<string, any> = {}): Record<string, any> {
    if (!modelDef || !modelDef.fields) return {};
    const obj: Record<string, any> = {};

    for (const [fieldName, field] of Object.entries(modelDef.fields)) {
      if (overrides[fieldName] !== undefined) {
        obj[fieldName] = overrides[fieldName];
      } else {
        obj[fieldName] = this.generateField(fieldName, field.type);
      }
    }

    return obj;
  }

  public generateField(name: string, typeStr: string): any {
    const lowerName = name.toLowerCase();
    const cleanType = typeStr.trim();

    if (cleanType.includes('|') && cleanType.includes("'")) {
      const literals = cleanType.split('|').map(s => s.trim().replace(/^'|'$/g, ''));
      return literals[Math.floor(Math.random() * literals.length)];
    }

    if (cleanType === 'number') {
      if (lowerName === 'id' || lowerName.endsWith('id')) {
        return this.idCounter++;
      }
      if (lowerName.includes('price') || lowerName.includes('amount') || lowerName.includes('salary')) {
        return Math.floor(Math.random() * 5000000) + 100000;
      }
      if (lowerName.includes('age')) {
        return Math.floor(Math.random() * 45) + 20;
      }
      return Math.floor(Math.random() * 100) + 1;
    }

    if (cleanType === 'boolean') {
      return Math.random() > 0.3;
    }

    if (cleanType === 'string') {
      if (lowerName === 'id' || lowerName.endsWith('id')) {
        return `uuid-${Math.random().toString(36).substr(2, 9)}`;
      }
      if (lowerName.includes('email')) {
        const users = ['kevin', 'alex', 'sarah', 'dimas', 'ratna'];
        const domain = ['ptba.co.id', 'example.com', 'cisea.dev', 'company.id'];
        return `${users[Math.floor(Math.random() * users.length)]}.${Math.floor(Math.random()*900+100)}@${domain[Math.floor(Math.random()*domain.length)]}`;
      }
      if (lowerName.includes('name') || lowerName === 'author') {
        const names = ['Kevin Naserwan', 'Budi Santoso', 'Dewi Lestari', 'Agus Setiawan', 'Siti Rahma'];
        return names[Math.floor(Math.random() * names.length)];
      }
      if (lowerName.includes('phone')) {
        return `0812${Math.floor(Math.random() * 90000000 + 10000000)}`;
      }
      if (lowerName.includes('date') || lowerName.includes('at')) {
        return new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString();
      }
      if (lowerName.includes('title')) {
        return `System Optimization Report #${Math.floor(Math.random() * 900 + 100)}`;
      }
      return `${name}_val_${Math.random().toString(36).substr(2, 6)}`;
    }

    if (cleanType.endsWith('[]') || cleanType.startsWith('Array<')) {
      return [
        `${name}_item_1`,
        `${name}_item_2`
      ];
    }

    return null;
  }
}
