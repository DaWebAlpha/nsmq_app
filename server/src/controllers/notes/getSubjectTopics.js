import { getSubjectTopicsService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";

/**
 * GET /notes/subject/:subject/topics — lists the distinct topicNumber/topic
 * pairs already in use for a subject, for a create/edit-note topic picker.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getSubjectTopicsController = async (request, response) => {
    const { subject } = request.params;

    const { subject: normalizedSubject, topics } = await getSubjectTopicsService({ subject });

    return sendResponse(
        request,
        response,
        {
            view: "notes/subjectTopics",
            data: {
                subject: normalizedSubject,
                topics,
            },
            jsonData: {
                success: true,
            }
        }
    )
}

export { getSubjectTopicsController }
