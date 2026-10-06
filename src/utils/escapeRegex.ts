// used to escape special characters in a string for use in a regular expression
export const escapeRegex = (term: string) =>
  term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
