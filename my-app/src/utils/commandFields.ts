
import type { CommandMetadata } from '../models/device.dto';

type FieldMeta = CommandMetadata['fields'][number];

export function groupFieldsByPath(fields: FieldMeta[]): Record<string, FieldMeta[]> {
  return fields.reduce<Record<string, FieldMeta[]>>((groups, field) => {
    const groupKey = field.path.includes('.') ? field.path.split('.')[0] : '_root';
    groups[groupKey] ??= [];
    groups[groupKey].push(field);
    return groups;
  }, {});
}

export function buildPayloadFromCommandFields(
  commandPayload: Record<string, any>,
  allowedPaths: Set<string>
): Record<string, any> {
  const payload: Record<string, any> = {};

  Object.entries(commandPayload)
    .filter(([path]) => allowedPaths.has(path))
    .forEach(([path, value]) => {
      const parts = path.split('.');
      let current = payload;
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] ??= {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    });

  return payload;
}