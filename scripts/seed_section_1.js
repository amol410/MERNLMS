#!/usr/bin/env node
/**
 * Seed Section 1 Curriculum (12 Units x 12 Lessons = 144 Lessons) into MySQL
 * Usage: node scripts/seed_section_1.js [--force]
 */

const path = require('path');
try {
    require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
} catch (_) {
    try {
        require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });
    } catch (e) {
        console.warn('⚠️ Could not load dotenv:', e.message);
    }
}
if (!process.env.DB_NAME) {
    try {
        require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../.env') });
    } catch (_) {}
}

const fs = require('fs');
const { sequelize } = require('../backend/config/database');
const CurriculumLesson = require('../backend/models/CurriculumLesson');
const User = require('../backend/models/User');
const { flattenCurriculumJson } = require('../backend/utils/curriculumSeeder');
const { validateLessonStages } = require('../backend/utils/stageSanitizer');

async function main() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected to database successfully.');

        let ownerId = 1;
        try {
            const firstUser = await User.findOne({ order: [['id', 'ASC']] });
            if (firstUser) ownerId = firstUser.id;
        } catch (_) {}

        const jsonPath = path.join(__dirname, '../syllabus/section_1_english_hindi.json');
        if (!fs.existsSync(jsonPath)) {
            console.error('❌ Section 1 curriculum JSON file not found at:', jsonPath);
            process.exit(1);
        }

        const rawJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`📦 Loaded Section 1: ${rawJson.units.length} Units, ${rawJson.totalLessons} Lessons.`);

        const force = process.argv.includes('--force');

        if (force) {
            console.log('⚠️ --force flag supplied: Removing existing Section 1 units (1 to 12) for en_hi...');
            const deleted = await CurriculumLesson.destroy({
                where: {
                    learningLanguage: 'en',
                    nativeLanguage: 'hi',
                    level: 'A1',
                    unitNumber: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                }
            });
            console.log(`🗑️ Deleted ${deleted} existing lesson records.`);
        }

        const records = flattenCurriculumJson(rawJson, ownerId);
        console.log(`📝 Prepared ${records.length} lesson records to seed.`);

        // Validate all stages prior to insertion
        for (const rec of records) {
            if (rec.stages && rec.stages.length > 0) {
                const val = validateLessonStages(rec.stages);
                if (!val.isValid) {
                    throw new Error(`Validation failed for Unit ${rec.unitNumber} Lesson ${rec.lessonIndex}: ${val.errors.join('; ')}`);
                }
            }
        }

        const chunkSize = 50;
        let inserted = 0;
        for (let i = 0; i < records.length; i += chunkSize) {
            const chunk = records.slice(i, i + chunkSize);
            await CurriculumLesson.bulkCreate(chunk, {
                updateOnDuplicate: ['title', 'subtitle', 'nodeType', 'xpReward', 'pearlsReward', 'stages', 'isLive']
            });
            inserted += chunk.length;
            console.log(`  Seeded ${inserted}/${records.length} records...`);
        }

        console.log(`🎉 Successfully seeded all ${inserted} lessons for Section 1 (en_hi_a1)!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

main();
