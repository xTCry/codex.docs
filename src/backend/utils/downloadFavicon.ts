import path from 'path';
import fs from 'fs-extra';
import fetch, { RequestInit } from 'node-fetch';
import appConfig from './appConfig';

/**
 * Uploaded favicon data
 */
export interface FaviconData {
  filename: string;

  // Uploaded favicon path
  destination: string;

  // File type
  type: string;
}

// Initiate controller for aborting request
const controller = new AbortController();

/**
 * Check if string is url
 *
 * @param  str - string to check
 */
function checkIsUrl(str: string): boolean {
  const re = new RegExp('https?://');

  return re.test(str);
}

/**
 * Upload favicon by url, or get it by path
 *
 * @param destination - url or path of favicon
 * @param faviconFolder - folder to save favicon
 * @returns { Promise<FaviconData> } - Promise with data about favicon
 */
export async function downloadFavicon(
  destination: string,
  faviconFolder: string,
): Promise<FaviconData> {
  // Check of destination is empty
  if (!destination) {
    throw Error('Favicon destination is empty');
  }

  // Get file name by destination
  const srcFilename = destination.substring(destination.lastIndexOf('/') + 1);

  // Get file format
  const format = srcFilename.split('.').pop();

  const distFilename = `favicon.${format}`;
  // Get file path in temporary directory
  const filePath = path.join(faviconFolder, distFilename);

  // Check if string is url
  if (!checkIsUrl(destination)) {
    destination = path.join(__dirname + '/../../../', destination);
    if (!fs.existsSync(destination)) {
      throw Error(`Favicon does not exist (${destination})`);
    }
    // Save file
    await fs.copyFile(destination, filePath);
  } else {
    // Create timeout to abort request
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log('Favicon request has timed out.');
    }, 5000);

    // Make get request to url
    const res = await fetch(destination, {
      signal: controller.signal as RequestInit['signal'],
    });
    // Get buffer data from response
    const fileData = await res.buffer();

    // Clear timeout, if data was got
    clearTimeout(timeoutId);

    // Save file
    await fs.writeFile(filePath, fileData);
  }

  return {
    filename: distFilename,
    destination: appConfig.frontend.basePath + `/favicon/${distFilename}`,
    type: `image/${format}`,
  } as FaviconData;
}
