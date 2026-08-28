import { normalizeString } from "../../../utils/normalizer.js";

/**
 * Trims and lowercases, so filter/create values match the
 * lowercase-stored subject/topic/subTopic fields.
 */
const normalizeValue = (value) => normalizeString(value).toLowerCase();

export { normalizeValue };
