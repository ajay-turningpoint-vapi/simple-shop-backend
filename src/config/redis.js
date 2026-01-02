const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({ url: redisUrl });

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Redis connecting...'));
client.on('ready', () => logger.info('Redis is ready'));

const connectRedis = async () => {
    try {
        if (!client.isOpen) await client.connect();
        logger.info('Connected to Redis');
    } catch (err) {
        logger.error('Failed to connect to Redis', err);
    }
};

module.exports = { client, connectRedis };
