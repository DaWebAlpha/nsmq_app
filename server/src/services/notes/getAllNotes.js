import { Note } from "../../models/index.js";
import { NotFoundError } from "../../errors/index.js"

const getAllNotes = async() => {
    const notes = await Note.paginate({
        Note,
        filter: {$or: [{isDeleted: true}, {isDeleted: false}]},       
    })

    if(notes.length === 0){
        throw new NotFoundError({
            message: "No notes exist",
            code: "NO_NOTES_EXISTS"
        })
    };

}