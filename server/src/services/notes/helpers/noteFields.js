/**
 * The Note fields a client is allowed to set directly through
 * create/update input.
 */
const NOTE_ALLOWED_FIELDS = [
    "userId",
    "subject",
    "topic",
    "topicNumber",
    "subTopic",
    "subTopicNumber",
    "content",
    "isPremium",
];

export { NOTE_ALLOWED_FIELDS };
