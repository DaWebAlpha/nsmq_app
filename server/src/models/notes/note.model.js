import mongoose from "mongoose";
import { createSchema } from "../base/mongoose.schema.js";
import { SUBJECTS } from "../../constants/index.js";

const { ObjectId } = mongoose.Schema.Types;

/**
 * One piece of study content, organized subject → topic → subTopic.
 * Built with `createSchema` (see models/base/mongoose.schema.js), so it
 * inherits the full audit trail, sanitization, and soft-delete/restore/
 * update/paginate behavior every mutable model in this app shares.
 */
const noteSchemaDefinition = {
    userId: {
        type: ObjectId,
        ref: "User",
        required: [true, "User id is required"],
    },
    subject: {
        type: String,
        enum: SUBJECTS,
        trim: true,
        lowercase: true,
        required: [true, "Subject is required"],
    },
    topic: {
        type: String,
        required: [true, "Topic is required"],
        trim: true,
        lowercase: true,
        minlength: [2, "Topic is too short"],
        maxlength: [120, "Topic is too long"],
        // `minlength: 2` alone isn't enough here — it counts the RAW string
        // length, so "  " (two spaces) would pass minlength but is still
        // meaningless content. This validator explicitly checks the TRIMMED
        // length instead, catching whitespace-only input that minlength misses.
        validate: {
            validator: (val) => val.trim().length >= 2,
            message: "Topic cannot be whitespace only",
        },
    },
    topicNumber : {
        type: Number,
        default: 0,
        required: [true, "Topic number is required"],
        min: [0, "Topic number cannot be negative"],
    },
    subTopic: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        minlength: [2, "Sub topic is too short"],
        maxlength: [120, "Sub topic is too long"],
        validate: {
            validator: (val) => val.trim().length >= 2,
            message: "Sub topic cannot be whitespace only",
        },
    },

    subTopicNumber: {
        type: Number,
        default: 0,
        required: [true, "Sub topic number is required"],
        min: [0, "Sub topic number cannot be negative"],
    },

    content: {
        type: String,
        required: true,
        trim: true,
        minlength: [30, "Content is too short"],
        maxlength: [200000, "Content is too long"],
        validate: {
            validator: (val) => val.trim().length >= 30,
            message: "Content cannot be whitespace only",
        },
    },

    isPremium: {
        type: Boolean,
        default: true,
    },
}

const notesSchema = createSchema(noteSchemaDefinition);

/** Combined full-text search index over topic/subTopic/content, weighted so a topic-name match ranks above a content match. */
notesSchema.index(
    {
        topic: "text",
        subTopic: "text",
        content: "text",
    },
    {
        weights: {
            topic: 5,
            subTopic: 3,
            content: 1,
        },
    }
);

notesSchema.index({ isDeleted: 1, createdBy: 1, subject: 1 });
notesSchema.index({ isDeleted: 1, subject: 1, topicNumber: 1, topic: 1, subTopicNumber: 1, subTopic: 1 });
notesSchema.index({ isDeleted: 1, subject: 1, topic: 1, subTopic: 1 });
notesSchema.index({ isDeleted: 1, subTopic: 1, isPremium: 1 });

/** The Note Mongoose Model — collection `notes`. */
const Note = mongoose.model("Note", notesSchema);

export { Note };
