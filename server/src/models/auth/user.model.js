import mongoose from "mongoose";
import { createSchema } from "../base/mongoose.schema.js";

import {
    USER_ROLES
} from "../../constants/index.js";
import {
    hashPassword,
    verifyPassword,
    normalizeString,
    toTitleCase,
    normalizeEmail,
    normalizePhoneNumber
} from "../../utils/index.js";

import {
    AppError,
    BadRequestError,
    InternalServerError
} from "../../errors/index.js";
import { systemLogger } from "../../logger/pino.logger.js";


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * The core account record — one document per user, whether they signed up
 * with a password or via Google (`googleId`). Built with `createSchema`
 * (see models/base/mongoose.schema.js), so it inherits the full audit trail,
 * sanitization, and soft-delete/restore/update/paginate behavior every
 * mutable model in this app shares. Login-attempt state, bans, and
 * suspensions live in the separate UserSecurity model, not here, so
 * high-frequency failed-login writes never collide with profile edits.
 */
const userSchemaDefinition = {
    firstName: {
        type: String,
        trim: true,
        required: [true, "First name is required"],
        maxlength: [50, "First name is too long"],
    },
    lastName: {
        type: String,
        trim: true,
        required: true,
        maxlength: [50, "Last name is too long"]
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: [true, "Email is required"],
        validate: {
            validator(value){
                if(!value){
                    return true
                }
                return EMAIL_REGEX.test(value);
            },
            message: "Enter a valid email address",
        }
    },
    phoneNumber:{
        type: String,
        trim: true,
        required: [true, "Phone number is required"],
        validate: {
            validator(value){
                if(!value){
                    return true
                }
                return normalizePhoneNumber(value, "GH") !== null
            },
            message: "Enter a valid phoneNumber"
        }
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "password must be atleast 8 characters"],
        select: false
    },
    passwordResetTokenHash: {
        type: String,
        default: null,
        select: false
    },
    passwordResetExpiresAt: {
        type: Date,
        default: null,
        select: false,
    },
    role: {
        type: String,
        enum: Object.values(USER_ROLES),
        default: USER_ROLES.USER,
    },
    isPremiumAccess: {
        type: Boolean,
        default: false
    },
    paidUntil: {
        type: Date,
        default: null,
    }
}

const userSchema = createSchema(userSchemaDefinition);


userSchema.index({email: 1}, {unique: true});
userSchema.index({phoneNumber: 1}, {unique: true});

userSchema.index({email: 1, role: 1});
userSchema.index({phoneNumber: 1, role: 1});

userSchema.index({isDeleted: 1, createdAt: -1});
userSchema.index({role: 1, isDeleted: 1});

userSchema.index({deletedBy: 1});
userSchema.index({restoredBy: 1});
userSchema.index({deletedAt: 1});
userSchema.index({createdBy: 1});

/**
 * Computed display name — not stored, derived from firstName/lastName
 * on every read.
 */
userSchema.virtual("fullName").get(function(){
    return toTitleCase(this.firstName) + " " + toTitleCase(this.lastName);
})

/**
 * Hashes the password with Argon2id before save — only runs when the
 * password field actually changed, so re-saving an unrelated field
 * never re-hashes it.
 */
userSchema.pre("save", async function(){
    // GUARD: only re-hash if `password` was actually just set/changed on
    // THIS save. Without this check, every save (even one only touching
    // `firstName`) would re-hash whatever's already in `this.password` —
    // hashing an already-hashed value, which breaks the next login.
    if(!this.isModified("password")){
        return;
    }

    this.password = await hashPassword(this.password);
})

/**
 * Verifies a plaintext password against the stored Argon2 hash.
 * Requires `password` to have been explicitly `.select("+password")`ed on
 * the query this document came from, since the schema hides it by default.
 * @param {string} plainPassword
 * @returns {Promise<boolean>} True only if the password matches.
 */
userSchema.methods.comparePassword = async function(plainPassword){
    // IF the caller passed something that isn't even a string, it can
    // never be a valid password — fail closed, don't bother comparing.
    if(typeof plainPassword !== "string"){
        return false;
    };

    // GUARD: `password` is `select: false` by default, so a document
    // fetched WITHOUT `.select("+password")` won't have it loaded at all.
    // This is a programmer-error safety net, not a normal user-facing
    // failure — it means the query that loaded `this` forgot to opt in.
    if(!this.isSelected("password")){
        if(!this.password){
            return false;
        }

        systemLogger.error(
            {
                userId: this._id,
            },
            "Password field not selected in query."
        );

       throw new InternalServerError({
            message: "Internal authentication error",
            code: "PASSWORD_NOT_SELECTED"
       })
    }

    // Do the actual Argon2 comparison.
    try{
            return await verifyPassword(
                plainPassword,
                this.password
            )
        }catch(error){
            // IF this is already one of our own typed errors, let it
            // propagate unchanged (e.g. the PASSWORD_NOT_SELECTED case above).
            if (error instanceof AppError) {
                throw error;
            }

            // Otherwise this is a genuinely unexpected Argon2 failure — log
            // it for debugging, but don't leak internal details to the caller.
            systemLogger.error({ err: error }, "Password comparison failed.");

            throw new InternalServerError({
                message: "Internal authentication error.",
                code: "PASSWORD_VERIFICATION_FAILED",
            });
        }
}

/**
 * Normalizes name/email/phone on every save that touched them —
 * trims/cases text fields and coerces phoneNumber to E.164 (rejecting
 * it with a BadRequestError if it can't be parsed as a valid GH
 * number).
 */
userSchema.pre("save", function(){
    // Each block below is independent — it only runs if THAT specific
    // field was modified on this save, so editing just `firstName` never
    // touches `email`/`phoneNumber` and vice versa.

    if(this.isModified("firstName") && this.firstName){
        this.firstName = normalizeString(this.firstName);
    }

    if(this.isModified("lastName") && this.lastName){
        this.lastName = normalizeString(this.lastName);
    }

    if(this.isModified("email") && this.email){
        this.email =  normalizeEmail(this.email);
    }

    if(this.isModified("phoneNumber") && this.phoneNumber){
            // IF it's not ALREADY in E.164 format (e.g. "+233241234567"),
            // try to parse/normalize it into that shape.
            if(!E164_REGEX.test(this.phoneNumber)){
                const normalizedPhoneNumber = normalizePhoneNumber(
                    normalizeString(this.phoneNumber),
                    "GH"
                );

                // IF it still can't be parsed as a valid Ghanaian number,
                // reject the save entirely — this is what actually enforces
                // the phoneNumber `validate` rule further up in the schema
                // for numbers that only become invalid after normalization.
                if(!normalizedPhoneNumber){
                    throw new BadRequestError({
                        message: "Enter a valid phone number",
                        code: "INVALID_PHONE_NUMBER"
                    })
                }

                this.phoneNumber = normalizedPhoneNumber.e164;
            }
        }
})

/**
 * The User Mongoose Model — collection `users`.
 */
const User = mongoose.model("User", userSchema);

export {
    User,
}
