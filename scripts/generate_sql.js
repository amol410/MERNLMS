const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'german_a1.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let sql = `-- ==============================================================
-- DolphinCoder LMS: German A1 Curriculum Database Seed
-- Target Table: curriculum_lessons (lowercase snake_case)
-- Compatible with Hostinger phpMyAdmin (MySQL / MariaDB)
-- ==============================================================

-- Drop the unused PascalCase duplicate table created earlier
DROP TABLE IF EXISTS \`CurriculumLessons\`;

-- 1. Ensure Table Exists (Safe CREATE TABLE IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS \`curriculum_lessons\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`owner\` int(11) NOT NULL DEFAULT 3,
  \`learningLanguage\` varchar(10) NOT NULL DEFAULT 'de',
  \`nativeLanguage\` varchar(10) NOT NULL DEFAULT 'en',
  \`level\` enum('A1','A2','B1','B2','C1','C2') NOT NULL DEFAULT 'A1',
  \`unitNumber\` int(11) NOT NULL DEFAULT 1,
  \`unitTitle\` varchar(200) NOT NULL DEFAULT 'Coral Reef',
  \`unitDescription\` varchar(300) DEFAULT 'Introductions & Daily Greetings',
  \`lessonIndex\` int(11) NOT NULL DEFAULT 0,
  \`title\` varchar(200) NOT NULL,
  \`subtitle\` varchar(300) DEFAULT '',
  \`nodeType\` enum('lesson','karaoke','speech','chest','match','quiz') NOT NULL DEFAULT 'lesson',
  \`xpReward\` int(11) DEFAULT 15,
  \`pearlsReward\` int(11) DEFAULT 5,
  \`isLive\` tinyint(1) NOT NULL DEFAULT 1,
  \`stages\` longtext,
  \`karaokeData\` longtext,
  \`audioUrl\` varchar(500) DEFAULT NULL,
  \`sourceNoteId\` int(11) DEFAULT NULL,
  \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Clear existing test lesson in unit 1 to prevent duplicates (optional)
DELETE FROM \`curriculum_lessons\` WHERE \`learningLanguage\` = 'de' AND \`level\` = 'A1';

-- 3. Insert German A1 Lessons (Units 1 & 2)
`;

let insertStatements = [];
let globalIndex = 0;

for (const unit of data.units) {
    for (let i = 0; i < unit.lessonsData.length; i++) {
        const l = unit.lessonsData[i];
        const escapeStr = (str) => str ? "'" + str.replace(/'/g, "''") + "'" : "NULL";
        const stagesJson = escapeStr(JSON.stringify(l.stages || []));
        const karaokeJson = l.karaokeData ? escapeStr(JSON.stringify(l.karaokeData)) : "NULL";
        
        // Map nodeType to valid ENUM in model ('boss' falls back to 'lesson' if enum restricted)
        const nodeTypeVal = l.nodeType === 'boss' ? 'lesson' : (l.nodeType || 'lesson');

        insertStatements.push(`INSERT INTO \`CurriculumLessons\` (\`owner\`, \`learningLanguage\`, \`nativeLanguage\`, \`level\`, \`unitNumber\`, \`unitTitle\`, \`unitDescription\`, \`lessonIndex\`, \`title\`, \`subtitle\`, \`nodeType\`, \`xpReward\`, \`pearlsReward\`, \`isLive\`, \`stages\`, \`karaokeData\`, \`audioUrl\`, \`createdAt\`, \`updatedAt\`) VALUES (1, 'de', 'en', 'A1', ${unit.unitNumber}, ${escapeStr(unit.unitTitle)}, ${escapeStr(unit.unitDescription)}, ${globalIndex}, ${escapeStr(l.title)}, ${escapeStr(l.subtitle)}, '${nodeTypeVal}', ${l.xpReward || 15}, ${l.pearlsReward || 5}, 1, ${stagesJson}, ${karaokeJson}, NULL, NOW(), NOW());`);
        
        globalIndex++;
    }
}

sql += insertStatements.join('\n\n') + '\n';

const outPath = path.join(__dirname, '..', 'seed_german_a1.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log('✅ Generated seed_german_a1.sql at:', outPath);
