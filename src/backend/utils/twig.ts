/**
 * Twig extensions
 */
import twig from 'twig';
import fs from 'fs-extra';
import urlify from './urlify';
import path from 'path';

export default (function () {
  'use strict';

  /**
   * Function for include svg on page
   *
   * @example svg('path/from/root/dir')
   * @param {string} filename - name of icon
   * @returns {string} - svg code
   */
  twig.extendFunction('svg', function (filename: string) {
    return fs.readFileSync(
      path.join(__dirname, `./../../frontend/svg/${filename}.svg`),
      'utf-8',
    );
  });

  /**
   * Convert text to URL-like string
   * Example: "What is <mark>clean data</mark>" -> "what-is-clean-data"
   *
   * @param {string} string - source string with HTML
   * @returns {string} alias-like string
   */
  twig.extendFilter('urlify', function (string: string) {
    return urlify(string);
  });

  /**
   * Parse link as URL object
   *
   * @param {string} linkUrl - link to be processed
   * @returns {string} url — url data
   */
  twig.extendFunction('parseLink', function (linkUrl: string): string {
    try {
      return new URL(linkUrl).toString();
    } catch (e) {
      console.log(e);

      return '';
    }
  });

  /**
   * Get link hostname
   *
   * @param {string} linkUrl - link to be processed
   * @returns {string} hostname
   */
  twig.extendFunction('linkHostname', function (linkUrl: string): string {
    try {
      return new URL(linkUrl).hostname;
    } catch (e) {
      return linkUrl;
    }
  });

  /**
   * Converts object to string
   *
   * @param {object} object - object to be converted
   * @returns {string} stringified object
   */
  twig.extendFunction('toString', function (object: object): string {
    if (!object) {
      return '';
    }

    return object.toString();
  });

  /**
   * Converts JSON to string
   *
   * @param {string} data - data to be converted
   * @returns {string} - converted data
   */
  twig.extendFilter('json_stringify', function (data: any): string {
    return JSON.stringify(data);
  });
})();
