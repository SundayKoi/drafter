import { nanoid } from 'nanoid';

export function generateSeriesId(): string {
  return nanoid(8);
}
