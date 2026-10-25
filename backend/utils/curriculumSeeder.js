const fs = require('fs');
const path = require('path');

// Safe, idempotent MySQL migration for UserNodeProgress
async function migrateUserNodeProgress(sequelize) {
    try {
        const [columns] = await sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'user_node_progress' 
              AND COLUMN_NAME = 'course_id'
        `);

        if (!columns || columns.length === 0) {
            console.log('🔄 Migrating user_node_progress: Adding course_id column...');
            await sequelize.query(`
                ALTER TABLE user_node_progress 
                ADD COLUMN course_id VARCHAR(32) NOT NULL DEFAULT 'de_en_a1' AFTER user_id
            `);
            console.log('✅ Column course_id added to user_node_progress');
        }

        // Inspect existing indexes to clean up legacy non-course unique constraint
        const [indexes] = await sequelize.query(`
            SHOW INDEX FROM user_node_progress
        `);

        for (const idx of indexes) {
            if (
                idx.Key_name !== 'PRIMARY' &&
                idx.Key_name !== 'unique_user_course_node' &&
                idx.Key_name !== 'idx_user_course'
            ) {
                // Drop if it is a unique index on user_id + node_index without course_id
                if (idx.Non_unique === 0 && (idx.Key_name.includes('node') || idx.Key_name.includes('user_id'))) {
                    try {
                        await sequelize.query(`ALTER TABLE user_node_progress DROP INDEX \`${idx.Key_name}\``);
                        console.log(`✅ Dropped legacy unique index: ${idx.Key_name}`);
                    } catch (e) {
                        // Ignore if already dropped
                    }
                }
            }
        }

        // Ensure new composite unique index exists
        try {
            await sequelize.query(`
                CREATE UNIQUE INDEX unique_user_course_node 
                ON user_node_progress (user_id, course_id, node_index)
            `);
            console.log('✅ Created composite unique index: unique_user_course_node');
        } catch (e) {
            // Index already exists
        }

        // Ensure lookup index exists
        try {
            await sequelize.query(`
                CREATE INDEX idx_user_course 
                ON user_node_progress (user_id, course_id)
            `);
            console.log('✅ Created fast lookup index: idx_user_course');
        } catch (e) {
            // Index already exists
        }

        // Ensure user_activities supports 'lesson' in activityType ENUM
        try {
            await sequelize.query(`
                ALTER TABLE user_activities 
                MODIFY COLUMN activityType ENUM('quiz', 'note', 'flashcard', 'lesson') NOT NULL
            `);
            console.log('✅ Updated user_activities activityType ENUM to include lesson');
        } catch (e) {
            // Already updated or column has correct enum
        }

        // Ensure users pearls default is 10
        try {
            await sequelize.query(`
                ALTER TABLE users ALTER COLUMN pearls SET DEFAULT 10
            `);
        } catch (e) {
            // Already set or syntax variation
        }
    } catch (err) {
        console.warn('⚠️ user_node_progress auto-migration notice:', err.message);
    }
}

// Convert JSON course curriculum into flat CurriculumLesson records
function flattenCurriculumJson(jsonData, ownerId = 1) {
    if (!jsonData || !Array.isArray(jsonData.units)) return [];
    const lessons = [];

    for (const unit of jsonData.units) {
        if (!Array.isArray(unit.lessonsData)) continue;

        for (const l of unit.lessonsData) {
            lessons.push({
                owner: ownerId,
                learningLanguage: jsonData.learningLanguage || 'en',
                nativeLanguage: jsonData.nativeLanguage || 'hi',
                level: jsonData.level || 'A1',
                unitNumber: unit.unitNumber || 1,
                unitTitle: unit.unitTitle || 'Unit',
                unitDescription: unit.unitDescription || '',
                lessonIndex: l.lessonIndex !== undefined ? l.lessonIndex : 0,
                title: l.title || 'Lesson',
                subtitle: l.subtitle || '',
                nodeType: l.nodeType || 'lesson',
                xpReward: l.xpReward || 15,
                pearlsReward: l.pearlsReward || 5,
                isLive: true,
                stages: l.stages || [],
                karaokeData: null,
                audioUrl: null,
            });
        }
    }

    return lessons;
}

// Auto-seed English A1 Hindi & Marathi curriculum if missing from DB
async function seedEnglishCurriculumIfMissing(CurriculumLesson) {
    try {
        let ownerId = 1;
        try {
            const User = require('../models/User');
            const firstUser = await User.findOne({ order: [['id', 'ASC']] });
            if (firstUser) ownerId = firstUser.id;
        } catch (e) {
            // fallback to 1
        }

        // 1. English A1 (Hindi Instruction)
        const countEnHi = await CurriculumLesson.count({
            where: { learningLanguage: 'en', nativeLanguage: 'hi' },
        });

        if (countEnHi === 0) {
            console.log('🌱 Seeding English A1 (Hindi Instruction) curriculum...');
            const candidatePaths = [
                path.join(__dirname, '../data/english_a1_hindi.json'),
                path.join(__dirname, '../../english_a1_hindi.json'),
                path.join(process.cwd(), 'english_a1_hindi.json'),
                path.join(process.cwd(), 'backend/data/english_a1_hindi.json'),
            ];

            let rawJson = null;
            for (const p of candidatePaths) {
                if (fs.existsSync(p)) {
                    rawJson = JSON.parse(fs.readFileSync(p, 'utf8'));
                    break;
                }
            }

            if (rawJson) {
                const records = flattenCurriculumJson(rawJson, ownerId);
                if (records.length > 0) {
                    // Chunk inserts in batches of 100 for MySQL reliability
                    const chunkSize = 100;
                    for (let i = 0; i < records.length; i += chunkSize) {
                        const chunk = records.slice(i, i + chunkSize);
                        await CurriculumLesson.bulkCreate(chunk, { ignoreDuplicates: true });
                    }
                    console.log(`✅ Seeded ${records.length} lessons for English A1 (Hindi).`);
                }
            }
        }

        // 2. English A1 (Marathi Instruction)
        const countEnMr = await CurriculumLesson.count({
            where: { learningLanguage: 'en', nativeLanguage: 'mr' },
        });

        if (countEnMr === 0) {
            console.log('🌱 Seeding English A1 (Marathi Instruction) curriculum...');
            const candidatePaths = [
                path.join(__dirname, '../data/english_a1_marathi.json'),
                path.join(__dirname, '../../english_a1_marathi.json'),
                path.join(process.cwd(), 'english_a1_marathi.json'),
                path.join(process.cwd(), 'backend/data/english_a1_marathi.json'),
            ];

            let rawJson = null;
            for (const p of candidatePaths) {
                if (fs.existsSync(p)) {
                    rawJson = JSON.parse(fs.readFileSync(p, 'utf8'));
                    break;
                }
            }

            if (rawJson) {
                const records = flattenCurriculumJson(rawJson, ownerId);
                if (records.length > 0) {
                    const chunkSize = 100;
                    for (let i = 0; i < records.length; i += chunkSize) {
                        const chunk = records.slice(i, i + chunkSize);
                        await CurriculumLesson.bulkCreate(chunk, { ignoreDuplicates: true });
                    }
                    console.log(`✅ Seeded ${records.length} lessons for English A1 (Marathi).`);
                }
            }
        }
    } catch (err) {
        console.warn('⚠️ English curriculum auto-seed notice:', err.message);
    }
}

module.exports = {
    migrateUserNodeProgress,
    seedEnglishCurriculumIfMissing,
    flattenCurriculumJson,
};
