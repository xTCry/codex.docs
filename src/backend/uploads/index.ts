import appConfig from '../utils/appConfig';
import S3UploadsDriver from './s3';
import LocalUploadsDriver from './local';

/**
 * Initialize the uploads driver based on the configuration
 */
export const uploadsDriver =
  appConfig.uploads.driver === 'local'
    ? new LocalUploadsDriver(appConfig.uploads)
    : new S3UploadsDriver(appConfig.uploads);
