const MONGOOSE_OPTIONS = Object.freeze({
    minPoolSize: 5,
    maxPoolSize: 50,
    serverSelectionTimeoutMS: 5000, //5000 milliseconds or 5 seconds
    socketTimeoutMS: 45000, //45000 milliseconds or 45 seconds
})

export {
    MONGOOSE_OPTIONS
}