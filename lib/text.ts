export function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
