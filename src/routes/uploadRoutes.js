const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto'); // ✅ built-in UUID
const { uploadToS3, validateS3Config, objectExists, getUrlForKey } = require('../config/s3');
const logger = require('../utils/logger');

const router = express.Router();

// ✅ Allowed image MIME types
const allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/v1/uploads/upload
router.post('/', upload.array('images'), async (req, res) => {
    try {
        validateS3Config();

        // ESM-safe dynamic import
        const { fileTypeFromBuffer } = await import('file-type');

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const width = req.query.width ? parseInt(req.query.width, 10) : null;
        const height = req.query.height ? parseInt(req.query.height, 10) : null;

        const results = await Promise.all(
            req.files.map(async (file) => {
                try {
                    const detected = await fileTypeFromBuffer(file.buffer);
                    const mimeType = detected?.mime || file.mimetype;

                    if (!allowedImageTypes.includes(mimeType)) {
                        return {
                            ok: false,
                            error: `Unsupported image type: ${mimeType}`,
                            originalName: file.originalname,
                        };
                    }

                    // Generate two variants: detail (1200x1200) and thumb (400x400)
                    const origHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

                    async function processVariant({ width, height, tag }) {
                        // Resize & convert to WebP quality ~80
                        let img = sharp(file.buffer).webp({ quality: 80 });
                        img = img.resize(width, height, { fit: 'inside' });
                        const buf = await img.toBuffer();

                        const filename = `${origHash}-${tag}.webp`;

                        const exists = await objectExists(filename);
                        if (exists) {
                            const url = getUrlForKey(filename);
                            return { filename, url, reused: true };
                        }

                        const url = await uploadToS3({ Key: filename, Body: buf, ContentType: 'image/webp' });
                        return { filename, url, reused: false };
                    }

                    const [detail, thumb] = await Promise.all([
                        processVariant({ width: 1200, height: 1200, tag: 'detail' }),
                        processVariant({ width: 400, height: 400, tag: 'thumb' }),
                    ]);

                    return {
                        ok: true,
                        originalName: file.originalname,
                        detail,
                        thumb,
                    };
                } catch (err) {
                    logger.error('File upload failed', err);
                    return {
                        ok: false,
                        error: err.message || 'Upload failed',
                        originalName: file.originalname,
                    };
                }
            })
        );

        const failed = results.filter((r) => !r.ok);

        if (failed.length > 0 && failed.length < results.length) {
            return res.status(207).json({ results }); // partial success
        }

        if (failed.length === results.length) {
            return res.status(400).json({ error: 'All uploads failed', results });
        }

        return res.status(200).json({ results });
    } catch (err) {
        logger.error('Upload endpoint error', err);
        return res.status(500).json({ error: err.message || 'Upload failed' });
    }
});

module.exports = router;
