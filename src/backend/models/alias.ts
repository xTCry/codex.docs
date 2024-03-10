import crypto from '../utils/crypto';
import database from '../database/index';
import { EntityId } from '../database/types';

const binaryMD5 = crypto.binaryMD5;
const aliasesDb = database['aliases'];

/**
 * Describe an alias
 */
export interface AliasData {
  /**
   * Alias id
   */
  _id?: EntityId;

  /**
   * Alias binary hash
   */
  hash?: string;

  /**
   * Entity type
   */
  type?: string;

  /**
   * Indicate if alias deprecated
   */
  deprecated?: boolean;

  /**
   * Entity id
   */
  id?: EntityId;
}

/**
 * Alias model
 */
class Alias {
  /**
   * Alias id
   */
  public _id?: EntityId;

  /**
   * Alias binary hash
   */
  public hash?: string;

  /**
   * Entity type
   */
  public type?: string;

  /**
   * Indicate if alias deprecated
   */
  public deprecated?: boolean;

  /**
   * Entity id
   */
  public id?: EntityId;

  /**
   * @class
   * @param {AliasData} data - info about alias
   * @param {string} aliasName - alias of entity
   */
  constructor(data: AliasData = {}, aliasName = '') {
    if (data === null) {
      data = {};
    }
    if (data._id) {
      this._id = data._id;
    }
    if (aliasName) {
      this.hash = binaryMD5(aliasName);
    }
    this.data = data;
  }
  /**
   * Return Alias types
   *
   * @returns {object}
   */
  public static get types(): { PAGE: string } {
    return {
      PAGE: 'page',
    };
  }

  /**
   * Find and return alias with given alias
   *
   * @param {string} aliasName - alias of entity
   * @returns {Promise<Alias>}
   */
  public static async getByAliasName(aliasName: string): Promise<Alias> {
    const hash = binaryMD5(aliasName);
    let data = await aliasesDb.findOne({
      hash,
      deprecated: false,
    });

    if (!data) {
      data = await aliasesDb.findOne({ hash });
    }

    return new Alias(data);
  }

  /**
   * Find all Aliases which match passed query object
   *
   * @param {object} query - input query
   * @returns {Promise<Alias[]>}
   */
  public static async getAll(
    query: Record<string, unknown> = {},
  ): Promise<Alias[]> {
    const docs = await aliasesDb.find(query);

    return docs.map((doc) => new Alias(doc));
  }

  /**
   * Mark alias as deprecated
   *
   * @param {string} aliasName - alias of entity
   * @returns {Promise<Alias>}
   */
  public static async markAsDeprecated(aliasName: string): Promise<Alias> {
    const alias = await Alias.getByAliasName(aliasName);

    alias.deprecated = true;

    return alias.save();
  }

  /**
   * Save or update alias data in the database
   *
   * @returns {Promise<Alias>}
   */
  public async save(): Promise<Alias> {
    if (!this._id) {
      const insertedRow = (await aliasesDb.insert(this.data)) as {
        _id: EntityId;
      };

      this._id = insertedRow._id;
    } else {
      await aliasesDb.update({ _id: this._id }, this.data);
    }

    return this;
  }

  /**
   * Set AliasData object fields to internal model fields
   *
   * @param {AliasData} aliasData - info about alias
   */
  public set data(aliasData: AliasData) {
    const { id, type, hash, deprecated } = aliasData;

    this.id = id || this.id;
    this.type = type || this.type;
    this.hash = hash || this.hash;
    this.deprecated = deprecated || false;
  }

  /**
   * Return AliasData object
   *
   * @returns {AliasData}
   */
  public get data(): AliasData {
    return {
      _id: this._id,
      id: this.id,
      type: this.type,
      hash: this.hash,
      deprecated: this.deprecated,
    };
  }

  /**
   * @returns {Promise<Alias>}
   */
  public async destroy(): Promise<Alias> {
    await aliasesDb.remove({ _id: this._id });

    delete this._id;

    return this;
  }
}

export default Alias;
