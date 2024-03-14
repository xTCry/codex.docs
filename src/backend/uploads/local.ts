import fs from 'fs-extra';
import mkdirp from 'mkdirp';
import multer from 'multer';
import mime from 'mime';
import fileType from 'file-type';
import { UploadsDriver } from './types';
import { random16 } from '../utils/crypto';
import { LocalUploadsConfig } from '../utils/appConfig';
import { FileData } from '../models/file';

/**
 * Uploads driver for local storage
 */
export default class LocalUploadsDriver implements UploadsDriver {
  /**
   * Configuration for local uploads
   */
  private readonly config: LocalUploadsConfig;

  /**
   * Create a new instance of LocalUploadsDriver
   *
   * @param config - configuration for local uploads
   */
  constructor(config: LocalUploadsConfig) {
    this.config = config;
  }

  /**
   * Creates multer storage engine for local uploads
   */
  public createStorageEngine(): multer.StorageEngine {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const dir: string = this.config.local.path;

        mkdirp(dir);
        cb(null, dir);
      },
      filename: async (req, file, cb) => {
        const filename = await random16();

        cb(null, `${filename}.${mime.getExtension(file.mimetype)}`);
      },
    });
  }

  /**
   * Saves passed file to the local storage
   *
   * @param data - file data to save
   * @param mimetype - file mimetype
   * @param possibleExtension
   */
  public async save(
    data: Buffer,
    mimetype?: string,
    possibleExtension?: string,
  ): Promise<FileData> {
    const filename = await random16();

    const type = await fileType.fromBuffer(data);
    const ext = type ? type.ext : possibleExtension;
    const fullName = `${filename}.${ext}`;

    await fs.writeFile(`${this.config.local.path}/${fullName}`, data);

    return {
      name: fullName,
      filename: fullName,
      size: data.length,
      mimetype,
    };
  }
}
