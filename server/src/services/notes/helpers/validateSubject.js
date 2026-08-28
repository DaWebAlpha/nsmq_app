import { SUBJECTS } from "../../../constants/index.js";
import { BadRequestError } from "../../../errors/index.js";
import { normalizeValue } from "./normalizeValue.js";

/** Throws unless `subject` (compared case/whitespace-insensitively) is one of the Note model's allowed SUBJECTS. */
const validateSubject = (subject) => {
    if (!SUBJECTS.includes(normalizeValue(subject))) {
        throw new BadRequestError({
            message: `Subject must be one of: ${SUBJECTS.join(", ")}`,
            code: "INVALID_SUBJECT",
        });
    }
};

export { validateSubject };
