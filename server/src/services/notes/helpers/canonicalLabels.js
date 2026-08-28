/**
 * Finds the topic label already used by another active note under the same
 * subject+topicNumber, if one exists — so a new/moved note adopts the
 * existing label instead of introducing a second, conflicting one.
 * @param {import("mongoose").Model} NoteModel
 * @param {object} params
 * @param {string} params.subject
 * @param {number} params.topicNumber
 * @param {string} [params.excludeNoteId] - Exclude this note (for edits, so it doesn't just find itself).
 * @returns {Promise<string|null>}
 */


const findCanonicalTopic = async (NoteModel, { subject, topicNumber, excludeNoteId } = {}) => {
    const filter = { subject, topicNumber, isDeleted: false };

    if (excludeNoteId) {
        filter._id = { $ne: excludeNoteId };
    }

    const match = await NoteModel.findOne(filter).select("topic").lean();

    return match?.topic ?? null;
};



/**
 * Same idea as {@link findCanonicalTopic}, one level deeper: the subTopic
 * label already used by another active note under the same
 * subject+topicNumber+subTopicNumber, if one exists.
 * @param {import("mongoose").Model} NoteModel
 * @param {object} params
 * @param {string} params.subject
 * @param {number} params.topicNumber
 * @param {number} params.subTopicNumber
 * @param {string} [params.excludeNoteId]
 * @returns {Promise<string|null>}
 */
const findCanonicalSubTopic = async (NoteModel, { subject, topicNumber, subTopicNumber, excludeNoteId } = {}) => {
    const filter = { subject, topicNumber, subTopicNumber, isDeleted: false };

    if (excludeNoteId) {
        filter._id = { $ne: excludeNoteId };
    }

    const match = await NoteModel.findOne(filter).select("subTopic").lean();

    return match?.subTopic ?? null;
};

export { findCanonicalTopic, findCanonicalSubTopic };
