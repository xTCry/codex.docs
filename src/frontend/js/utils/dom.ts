/**
 * Helper method for elements creation
 *
 * @param {string} tagName - name of tag to create
 * @param {string | string[]} classNames - list of CSS classes
 * @param {object} attributes - any properties to add
 * @returns {HTMLElement}
 */
export function make(
  tagName: string,
  classNames: string | string[] | null = null,
  attributes: any = {},
) {
  const el = document.createElement(tagName);

  if (Array.isArray(classNames)) {
    el.classList.add(...classNames);
  } else if (classNames) {
    el.classList.add(classNames);
  }

  for (const attrName in attributes) {
    (el as any)[attrName as keyof HTMLElement] = attributes[attrName];
  }

  return el;
}
