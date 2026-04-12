const { Document, Paragraph, TextRun, Packer } = require('docx');

const p = (text) => new Paragraph({ children: [new TextRun(text)] });
const blank = () => new Paragraph({ children: [new TextRun('')] });

exports.generateQuizSample = async () => {
  const doc = new Document({
    sections: [{
      children: [
        p('TITLE: Sample Quiz Title'),
        p('DESCRIPTION: A short description of this quiz'),
        p('PASSING_SCORE: 70'),
        p('TIME_LIMIT: 30'),
        p('TAGS: python, programming'),
        blank(),
        p('Q: What is the correct way to declare a variable in Python?'),
        p('A) var x = 10'),
        p('B) int x = 10'),
        p('C) x = 10'),
        p('D) declare x = 10'),
        p('ANSWER: C'),
        p('EXPLANATION: Python uses dynamic typing — just assign a value directly.'),
        p('POINTS: 1'),
        blank(),
        p('Q: What is the output of: 10 // 3?'),
        p('A) 3.33'),
        p('B) 3'),
        p('C) 4'),
        p('D) 1'),
        p('ANSWER: B'),
        p('EXPLANATION: The // operator is floor division, so 10 // 3 = 3.'),
        p('POINTS: 1'),
        blank(),
        p('Q: Is Python case-sensitive?'),
        p('TRUE_FALSE'),
        p('ANSWER: TRUE'),
        p('EXPLANATION: Python is case-sensitive. myVar and myvar are different variables.'),
        p('POINTS: 1'),
      ],
    }],
  });
  return Packer.toBuffer(doc);
};

exports.generateFlashcardSample = async () => {
  const doc = new Document({
    sections: [{
      children: [
        p('DECK_NAME: Sample Flashcard Deck'),
        p('DESCRIPTION: A short description of this deck'),
        p('COLOR: blue'),
        blank(),
        p('Q: What is RAM?'),
        p('A: Random Access Memory — temporary storage used by the CPU while running programs'),
        p('HINT: Think about what gets cleared when you restart your computer'),
        blank(),
        p('Q: What is an API?'),
        p('A: Application Programming Interface — a way for two applications to communicate'),
        p('HINT: Think of it as a waiter taking your order to the kitchen'),
        blank(),
        p('Q: What is Python?'),
        p('A: A high-level, interpreted programming language known for its simple and readable syntax'),
        p('HINT: Named after Monty Python, not the snake'),
      ],
    }],
  });
  return Packer.toBuffer(doc);
};
