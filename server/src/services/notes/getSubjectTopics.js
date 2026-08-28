import { Note } from "../../models/index.js";
import { validateSubject, normalizeValue } from "./helpers/index.js";

/**
 * Lists the distinct topicNumber/topic pairs already in use for a subject
 * — so a client can show a picker of existing topics before creating a
 * note, instead of letting topicNumber be freely typed and drift apart
 * from the canonical labels findCanonicalTopic/findCanonicalSubTopic
 * enforce. An empty `topics` array is a valid result (the subject has no
 * notes yet), not an error.
 * @param {object} params
 * @param {string} params.subject
 * @returns {Promise<{subject: string, topics: {topicNumber: number, topic: string}[]}>}
 * @throws {BadRequestError} If subject isn't one of the model's SUBJECTS enum.
 */
const getSubjectTopicsService = async({ subject } = {}) => {
    validateSubject(subject);
    const normalizedSubject = normalizeValue(subject);

    const topics = await Note.aggregate([
        { $match: { subject: normalizedSubject, isDeleted: false } },
        { $sort: { topicNumber: 1, createdAt: 1 } },
        {
            $group: {
                _id: "$topicNumber",
                topic: { $first: "$topic" },
            },
        },
        { $project: { _id: 0, topicNumber: "$_id", topic: 1 } },
        { $sort: { topicNumber: 1 } },
    ]);

    return { subject: normalizedSubject, topics };
};

export { getSubjectTopicsService };
