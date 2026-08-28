import { normalizeValue } from "./normalizeValue.js";
import { coerceBooleanField, coerceOrderNumber } from "./coerce.js";

const notesDefaultSort = {
    subject: 1,
    topicNumber: 1,
    topic: 1,
    subTopicNumber: 1,
    subTopic: 1,
    updatedAt: -1,
};

/**
 * Turns raw, unvalidated filter input (typically `request.query`) into a
 * safe MongoDB filter — only copies over fields that were actually
 * provided, normalizing/coercing each one to match how it's actually stored.
 * @param {object} [filter={}]
 * @param {boolean|{$in: boolean[]}} [filter.isDeleted]
 * @param {string} [filter.subject]
 * @param {string} [filter.topic]
 * @param {string} [filter.subTopic]
 * @param {number|string} [filter.topicNumber]
 * @param {number|string} [filter.subTopicNumber]
 * @param {boolean|string} [filter.isPremium]
 * @returns {object} A safe MongoDB filter object.
 * @throws {BadRequestError} Via coerceOrderNumber, if topicNumber/subTopicNumber is invalid.
 */
const buildNotesFilter = (filter = {}) => {
    const safeFilter = {};

    if (filter.isDeleted !== undefined) {
        safeFilter.isDeleted = filter.isDeleted;
    }

    if (filter.subject) {
        safeFilter.subject = normalizeValue(String(filter.subject));
    }

    if (filter.topic) {
        safeFilter.topic = normalizeValue(String(filter.topic));
    }

    if (filter.subTopic) {
        safeFilter.subTopic = normalizeValue(String(filter.subTopic));
    }

    if (filter.topicNumber !== undefined && filter.topicNumber !== "") {
        safeFilter.topicNumber = coerceOrderNumber(filter.topicNumber, "Topic number");
    }

    if (filter.subTopicNumber !== undefined && filter.subTopicNumber !== "") {
        safeFilter.subTopicNumber = coerceOrderNumber(filter.subTopicNumber, "Sub topic number");
    }

    if (filter.isPremium !== undefined && filter.isPremium !== "") {
        safeFilter.isPremium = coerceBooleanField(filter.isPremium);
    }

    return safeFilter;
};

/**
 * buildNotesFilter, forcing isDeleted: false — active notes only.
 */
const buildActiveNotesFilter = (filter = {}) => {
    return buildNotesFilter({
        ...filter,
        isDeleted: false,
    });
};

/**
 * buildNotesFilter, forcing isDeleted: {$in: [true, false]} — active
 * and deleted notes both.
 */
const buildAllNotesFilter = (filter = {}) => {
    return buildNotesFilter({
        ...filter,
        isDeleted: { $in: [true, false] },
    });
};

/**
 * buildNotesFilter, forcing isDeleted: true — deleted notes only.
 */
const buildDeletedNotesFilter = (filter = {}) => {
    return buildNotesFilter({
        ...filter,
        isDeleted: true,
    });
};

export {
    notesDefaultSort,
    buildNotesFilter,
    buildActiveNotesFilter,
    buildAllNotesFilter,
    buildDeletedNotesFilter,
};
