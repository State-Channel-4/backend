const path = require('path');

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Channel4 API",
            version: "1.0.0",
            description: "Channel4 discovery API",
        },
        servers: [
            {
                url: process.env.SERVER_URL || "http://localhost:8000",
            },
        ],
    },
    apis: [path.resolve(__dirname, '../src/routes/*.ts')],
};

module.exports = options;
