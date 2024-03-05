/**
 * Utility class to handle interaction with local storage
 */
export class Storage {
  /**
   * @param {string} key - storage key
   */
  constructor(protected readonly key: string) {}

  /**
   * Saves value to storage
   *
   * @param {string} value - value to be saved
   */
  set(value: string) {
    localStorage.setItem(this.key, value);
  }

  /**
   * Retreives value from storage
   */
  get() {
    return localStorage.getItem(this.key);
  }
}
