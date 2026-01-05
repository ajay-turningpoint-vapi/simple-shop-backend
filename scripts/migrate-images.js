/*
Migration script: convert Product.images and variants[].images string entries into structured objects
Run with: node scripts/migrate-images.js
Make sure MONGODB_URI (or config) is set in env / .env
*/

const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const config = require('../src/config/config');
const logger = require('../src/utils/logger');

async function normalizeImagesArray(images) {
    if (!Array.isArray(images)) return images;
    return images.map((img) => {
        if (!img) return null;
        if (typeof img === 'string') {
            const filename = img.split('/').pop();
            return {
                filename,
                detail: { filename, url: img },
                thumb: { filename, url: img },
                uploadedAt: new Date(),
            };
        }
        // already structured
        return img;
    }).filter(Boolean);
}

async function run() {
    try {
        await mongoose.connect(config.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        logger.info('Connected to MongoDB for image migration');

        const cursor = Product.find().cursor();
        let count = 0;
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            let changed = false;

            if (doc.images && doc.images.length && typeof doc.images[0] === 'string') {
                doc.images = await normalizeImagesArray(doc.images);
                changed = true;
            }

            if (doc.variants && doc.variants.length) {
                doc.variants = doc.variants.map((v) => {
                    if (v.images && v.images.length && typeof v.images[0] === 'string') {
                        v.images = normalizeImagesArray(v.images);
                        changed = true;
                    }
                    return v;
                });
            }

            if (changed) {
                await doc.save();
                count++;
                logger.info(`Updated product ${doc._id}`);
            }
        }

        logger.info(`Product migration completed. Updated ${count} products.`);

        // --- Categories
        const Category = require('../src/models/Category');
        const catCursor = Category.find().cursor();
        let catCount = 0;
        for (let cat = await catCursor.next(); cat != null; cat = await catCursor.next()) {
            let catChanged = false;
            if (cat.image && typeof cat.image === 'string') {
                const url = cat.image;
                const filename = url.split('/').pop();
                cat.image = {
                    filename,
                    detail: { filename, url },
                    thumb: { filename, url },
                    uploadedAt: new Date(),
                };
                catChanged = true;
            }

            if (catChanged) {
                await cat.save();
                catCount++;
                logger.info(`Updated category ${cat._id}`);
            }
        }

        logger.info(`Category migration completed. Updated ${catCount} categories.`);

        logger.info('Migration finished.');
        run();
    } catch (err) {
        console.log(err);
    }
}