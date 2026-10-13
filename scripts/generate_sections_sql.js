const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'german_a1.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Function to generate SQL file for a specific section
function generateSectionSQL(sectionNum, startUnit, endUnit, fileName, sectionName) {
  const units = data.units.filter(u => u.unitNumber >= startUnit && u.unitNumber <= endUnit);

  let sql = `-- ==============================================================\n`;
  sql += `-- DolphinCoder LMS: German A1 Database Seed\n`;
  sql += `-- SECTION ${sectionNum}: ${sectionName.toUpperCase()} (Units ${startUnit} to ${endUnit})\n`;
  sql += `-- Target Table: CurriculumLessons (PascalCase)\n`;
  sql += `-- Compatible with Hostinger phpMyAdmin (MySQL / MariaDB)\n`;
  sql += `-- ==============================================================\n\n`;

  sql += `-- 1. Remove previous lessons for these units to avoid duplicates\n`;
  sql += `DELETE FROM \`CurriculumLessons\` WHERE \`learningLanguage\` = 'de' AND \`level\` = 'A1' AND \`unitNumber\` BETWEEN ${startUnit} AND ${endUnit};\n\n`;

  sql += `-- 2. Insert Section ${sectionNum} Lessons (${units.length} Units x 16 Lessons = ${units.length * 16} Lessons)\n`;

  const batchSize = 50;
  let currentBatch = [];
  const insertStatements = [];

  for (const unit of units) {
    for (const l of unit.lessonsData) {
      const escapeStr = (str) => str ? "'" + str.replace(/'/g, "''") + "'" : "NULL";
      const stagesJson = escapeStr(JSON.stringify(l.stages || []));
      const nodeTypeVal = l.nodeType === 'boss' ? 'lesson' : (l.nodeType || 'lesson');

      currentBatch.push(`(1, 'de', 'en', 'A1', ${unit.unitNumber}, ${escapeStr(unit.unitTitle)}, ${escapeStr(unit.unitDescription)}, ${l.lessonIndex}, ${escapeStr(l.title)}, ${escapeStr(l.subtitle)}, '${nodeTypeVal}', ${l.xpReward || 15}, ${l.pearlsReward || 5}, 1, ${stagesJson}, NULL, NULL, NOW(), NOW())`);

      if (currentBatch.length >= batchSize) {
        insertStatements.push(`INSERT INTO \`CurriculumLessons\` (\`owner\`, \`learningLanguage\`, \`nativeLanguage\`, \`level\`, \`unitNumber\`, \`unitTitle\`, \`unitDescription\`, \`lessonIndex\`, \`title\`, \`subtitle\`, \`nodeType\`, \`xpReward\`, \`pearlsReward\`, \`isLive\`, \`stages\`, \`karaokeData\`, \`audioUrl\`, \`createdAt\`, \`updatedAt\`) VALUES\n` + currentBatch.join(',\n') + ';');
        currentBatch = [];
      }
    }
  }

  if (currentBatch.length > 0) {
    insertStatements.push(`INSERT INTO \`CurriculumLessons\` (\`owner\`, \`learningLanguage\`, \`nativeLanguage\`, \`level\`, \`unitNumber\`, \`unitTitle\`, \`unitDescription\`, \`lessonIndex\`, \`title\`, \`subtitle\`, \`nodeType\`, \`xpReward\`, \`pearlsReward\`, \`isLive\`, \`stages\`, \`karaokeData\`, \`audioUrl\`, \`createdAt\`, \`updatedAt\`) VALUES\n` + currentBatch.join(',\n') + ';');
  }

  sql += insertStatements.join('\n\n') + '\n';

  const outPath = path.join(__dirname, '..', fileName);
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`✅ Generated ${fileName} (${units.length * 16} lessons) at: ${outPath}`);
}

// Generate Section 1 (Units 1 to 35)
generateSectionSQL(1, 1, 35, 'seed_section1.sql', 'Rookie');

// Generate Section 2 (Units 36 to 70)
generateSectionSQL(2, 36, 70, 'seed_section2.sql', 'Explorer');

// Generate Section 3 (Units 71 to 105)
generateSectionSQL(3, 71, 105, 'seed_section3.sql', 'Traveler');
