/**
 * Trims a string; returns `""` for anything that isn't a string.
 * @param {*} value
 * @returns {string}
 */
const normalizeString = (value) => {
    return typeof value === "string" ?
        value.trim() :
        "";
}

/**
 * Converts a string to title case (first character uppercased, the rest
 * lowercased); returns `""` for anything that isn't a string. Only
 * capitalizes the very first character — not each word in a multi-word string.
 * @param {*} value
 * @returns {string}
 */
const toTitleCase = (value) => {
    return typeof value === "string" ?
    value.charAt(0).toUpperCase() +
    value.slice(1).toLowerCase() :
    "";
}

/**
 * Trims and lowercases a string for consistent email comparisons/storage;
 * returns `""` for anything that isn't a string.
 * @param {*} value
 * @returns {string}
 */
const normalizeEmail = (value) => {
    return typeof value === "string" ?
    value.trim().toLowerCase() :
    "";
}

/**
 * Trims a string and collapses any run of internal whitespace (spaces,
 * tabs, newlines) down to a single space; returns `""` for anything that
 * isn't a string. Useful for free-text fields where a user might paste in
 * text with irregular spacing or line breaks.
 * @param {*} value
 * @returns {string}
 */
const normalizeText = (value) => {
    return typeof value === "string" ?
        value.trim().replace(/\s+/g, " ") :
        "";
}

export {
    normalizeString,
    toTitleCase,
    normalizeEmail,
    normalizeText,
}
