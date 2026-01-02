const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../utils/logger');

function validateS3Config() {
    const required = ['AWS_REGION', 'AWS_S3_BUCKET_NAME'];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) {
        throw new Error(`Missing AWS config: ${missing.join(', ')}`);
    }
}

let s3Client;

function getS3Client() {
    if (s3Client) return s3Client;

    validateS3Config();

    s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: process.env.AWS_ACCESS_KEY_ID
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
            : undefined,
    });

    return s3Client;
}

async function uploadToS3({ Key, Body, ContentType, CacheControl = 'public, max-age=5184000', Expires = new Date(Date.now() + 5184000 * 1000) }) {
    const client = getS3Client();
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key,
        Body,
        ContentType,
        CacheControl,
        Expires,
    };

    await client.send(new PutObjectCommand(params));

    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;
}

async function objectExists(Key) {
    const client = getS3Client();
    try {
        await client.send(new HeadObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key }));
        return true;
    } catch (err) {
        // AWS SDK throws a 404-like error if object does not exist
        if (err && (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404)) {
            return false;
        }
        logger.error('HeadObject error', err);
        throw err;
    }
}

function getUrlForKey(Key) {
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;
}

module.exports = { getS3Client, uploadToS3, validateS3Config, objectExists, getUrlForKey };
