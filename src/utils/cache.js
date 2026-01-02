const { client } = require('../config/redis');
const logger = require('./logger');

module.exports = {
    async get(key) {
        try {
            const val = await client.get(key);
            return val ? JSON.parse(val) : null;
        } catch (err) {
            logger.error('Redis get error', err);
            return null;
        }
    },

    async set(key, data, ttl = 600) {
        try {
            const value = JSON.stringify(data);
            await client.setEx(key, ttl, value);
        } catch (err) {
            logger.error('Redis set error', err);
        }
    },

    async del(key) {
        try {
            await client.del(key);
        } catch (err) {
            logger.error('Redis del error', err);
        }
    },

    async delPattern(pattern) {
        try {
            // WARNING: KEYS can be expensive on large datasets; acceptable for small apps
            const keys = await client.keys(pattern);
            if (keys.length) {
                await client.del(keys);
            }
        } catch (err) {
            logger.error('Redis delPattern error', err);
        }
    },

    async flushAll() {
        try {
            await client.flushAll();
        } catch (err) {
            logger.error('Redis flush error', err);
        }
    },
};
