import sanitizeHtml from "sanitize-html";
import { BadRequestError } from "../../../errors/index.js";

const MAX_NOTE_CONTENT_LENGTH = 100000;

/** Sanitizes rich-text note content, allowing the formatting tags/attributes the notes editor produces. */
const sanitizeNoteContent = (value = "") => {
    const rawContent = String(value ?? "").trim();

    if (rawContent.length > MAX_NOTE_CONTENT_LENGTH) {
        throw new BadRequestError({
            message: `Content cannot be more than ${MAX_NOTE_CONTENT_LENGTH} characters`,
        });
    }

    return sanitizeHtml(rawContent, {
        allowedTags: [
            ...sanitizeHtml.defaults.allowedTags,

            "b",
            "strong",
            "i",
            "em",
            "u",
            "s",
            "span",
            "div",

            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",

            "br",
            "hr",
            "pre",
            "code",
            "blockquote",

            "ul",
            "ol",
            "li",

            "table",
            "thead",
            "tbody",
            "tfoot",
            "tr",
            "th",
            "td",
            "caption",
            "colgroup",
            "col",

            "a",
            "img",
            "sub",
            "sup",
        ],

        allowedAttributes: {
            "*": [
                "class",
                "style",
                "title",
                "id",
                "dir",
                "lang",
            ],

            a: [
                "href",
                "name",
                "target",
                "rel",
                "title",
            ],

            img: [
                "src",
                "alt",
                "title",
                "width",
                "height",
                "loading",
                "style",
                "class",
            ],

            table: [
                "border",
                "cellpadding",
                "cellspacing",
                "width",
                "height",
                "style",
                "class",
            ],

            th: [
                "colspan",
                "rowspan",
                "scope",
                "width",
                "height",
                "style",
                "class",
            ],

            td: [
                "colspan",
                "rowspan",
                "width",
                "height",
                "style",
                "class",
            ],

            col: [
                "span",
                "width",
                "style",
                "class",
            ],
        },

        allowedSchemes: [
            "http",
            "https",
            "mailto",
            "tel",
            "data",
        ],

        allowedSchemesByTag: {
            img: [
                "http",
                "https",
                "data",
            ],
        },

        allowedStyles: {
            "*": {
                color: [/^.*$/],
                "background-color": [/^.*$/],

                "font-family": [/^.*$/],
                "font-size": [/^.*$/],
                "font-weight": [/^.*$/],
                "font-style": [/^.*$/],

                "text-align": [/^left$/, /^center$/, /^right$/, /^justify$/],
                "text-decoration": [/^.*$/],
                "text-indent": [/^.*$/],
                "text-transform": [/^.*$/],

                "line-height": [/^.*$/],
                "letter-spacing": [/^.*$/],
                "word-spacing": [/^.*$/],

                margin: [/^.*$/],
                "margin-top": [/^.*$/],
                "margin-right": [/^.*$/],
                "margin-bottom": [/^.*$/],
                "margin-left": [/^.*$/],

                padding: [/^.*$/],
                "padding-top": [/^.*$/],
                "padding-right": [/^.*$/],
                "padding-bottom": [/^.*$/],
                "padding-left": [/^.*$/],

                border: [/^.*$/],
                "border-top": [/^.*$/],
                "border-right": [/^.*$/],
                "border-bottom": [/^.*$/],
                "border-left": [/^.*$/],
                "border-color": [/^.*$/],
                "border-style": [/^.*$/],
                "border-width": [/^.*$/],
                "border-collapse": [/^collapse$/, /^separate$/],
                "border-spacing": [/^.*$/],

                width: [/^.*$/],
                height: [/^.*$/],
                "max-width": [/^.*$/],
                "min-width": [/^.*$/],
                "max-height": [/^.*$/],
                "min-height": [/^.*$/],

                display: [/^.*$/],
                float: [/^left$/, /^right$/, /^none$/],
                clear: [/^.*$/],

                "vertical-align": [/^.*$/],
                "white-space": [/^.*$/],
            },
        },

        transformTags: {
            a: sanitizeHtml.simpleTransform("a", {
                rel: "noopener noreferrer",
            }),
        },
    }).trim();
};

export { sanitizeNoteContent, MAX_NOTE_CONTENT_LENGTH };
