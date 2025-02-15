import { AliasData } from '../models/alias';
import { FileData } from '../models/file';
import { PageData } from '../models/page';
import { PageOrderData } from '../models/pageOrder';
import appConfig from '../utils/appConfig';
import LocalDatabaseDriver from './local';
import MongoDatabaseDriver from './mongodb';
import { EntityId } from './types';
import { ObjectId } from 'mongodb';

const Database =
  appConfig.database.driver === 'mongodb'
    ? MongoDatabaseDriver
    : LocalDatabaseDriver;

/**
 * Convert a string to an EntityId (string or ObjectId depending on the database driver)
 *
 * @param id - id to convert
 */
export function toEntityId(id: string): EntityId {
  if (id === '0') {
    return id as EntityId;
  }

  return (
    appConfig.database.driver === 'mongodb' ? new ObjectId(id) : id
  ) as EntityId;
}

/**
 * Check if provided ids are equal
 *
 * @param id1 - first id
 * @param id2 - second id
 */
export function isEqualIds(id1?: EntityId, id2?: EntityId): boolean {
  return id1?.toString() === id2?.toString();
}

/**
 * Check if provided ids are valid
 *
 * @param id - id to check
 */
export function isEntityId(id?: EntityId): id is EntityId {
  return typeof id === 'string' || id instanceof ObjectId;
}

export default {
  pages: new Database<PageData>('pages'),
  aliases: new Database<AliasData>('aliases'),
  pagesOrder: new Database<PageOrderData>('pagesOrder'),
  files: new Database<FileData>('files'),
};
