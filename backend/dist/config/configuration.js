"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || '3001', 10),
    database: {
        url: process.env.DATABASE_URL,
    },
    redis: {
        url: process.env.REDIS_URL,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default_secret',
        expiresIn: '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
        refreshExpiresIn: '7d',
    },
});
//# sourceMappingURL=configuration.js.map