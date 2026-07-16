You are generating Bible quiz questions for Menorah Bible Quiz.

Generate {{COUNT}} unique questions.

Settings:
- Level: {{LEVEL}}
- Bible book: {{BOOK}}
- Chapter: {{CHAPTER}}
- Category: {{CATEGORY}}
- Difficulty: {{DIFFICULTY}}
- Languages: {{LANGUAGES}}

Rules:

1. Use only facts clearly supported by Scripture.
2. Do not include denominational opinions.
3. Do not create trick questions.
4. Every question must have one correct answer.
5. Include exactly three believable but clearly wrong answers.
6. Do not repeat the same fact with different wording.
7. Do not use “all of the above” or “none of the above.”
8. Keep the same meaning, answer, difficulty, and Bible reference in every language.
9. Use natural native wording.
10. Return JSON only.
11. Do not decide the answer position.
12. Include a short explanation and reflection.
13. Avoid these existing questions:

{{EXISTING_QUESTIONS}}

Return an array with this exact structure:

[
  {
    "book": "Genesis",
    "chapter": 1,
    "category": "Creation",
    "level": 1,
    "difficulty": "very-easy",
    "reference": "Genesis 1:1",
    "translations": [
      {
        "languageCode": "en",
        "question": "Who created the heavens and the earth?",
        "correctAnswer": "God",
        "wrongAnswers": [
          "Moses",
          "Noah",
          "Abraham"
        ],
        "explanation": "Genesis teaches that God created the heavens and the earth.",
        "reflection": "Creation points us to God's power and authority."
      }
    ]
  }
]