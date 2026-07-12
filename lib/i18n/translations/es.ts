import type { DeepPartial, UIStrings } from "../types";

// Verse quotes (result.verse) intentionally omitted so they fall back to the
// reviewed English text — see the note in lib/i18n/types.ts about not
// auto-translating Scripture without human review.
export const es: DeepPartial<UIStrings> = {
  tagline: "Aprende la Palabra. Pon a prueba tu fe. Crece en sabiduría.",
  slogan: "Pon a prueba tu conocimiento bíblico y acércate más a Dios, una pregunta a la vez.",
  nav: { home: "Inicio", categories: "Categorías", leaderboard: "Clasificación" },
  hero: {
    eyebrow: "Trivia Bíblica Premium",
    startButton: "Comenzar un Quiz",
    leaderboardButton: "Ver Clasificación",
    statCategories: "Categorías",
    statQuestions: "Banco de Preguntas",
    statFree: "Gratis",
  },
  categoriesSection: {
    heading: "Elige tu Categoría",
    subheading: "Opción múltiple · preguntas cronometradas · elige tu camino por las Escrituras",
    questionSingular: "Pregunta",
    questionPlural: "Preguntas",
  },
  categories: {
    "old-testament": { title: "Antiguo Testamento", blurb: "La creación, la Ley y la historia de Israel" },
    "new-testament": { title: "Nuevo Testamento", blurb: "La iglesia primitiva y las cartas de los apóstoles" },
    "life-of-jesus": { title: "Vida de Jesús", blurb: "Su nacimiento, ministerio, milagros y resurrección" },
    apostles: { title: "Apóstoles", blurb: "Los doce que Jesús llamó a seguirle" },
    "bible-characters": { title: "Personajes Bíblicos", blurb: "Las personas cuya fe marcó la historia" },
    "youth-challenge": { title: "Desafío Juvenil", blurb: "Pensado para adolescentes y jóvenes creyentes" },
    "psalms-proverbs": { title: "Salmos y Proverbios", blurb: "Sabiduría, adoración y cántico" },
    "faith-prayer": { title: "Fe y Oración", blurb: "Confiar y hablar con Dios" },
    "gospel-challenge": { title: "Desafío del Evangelio", blurb: "Las buenas nuevas de salvación" },
    "hard-questions": { title: "Preguntas Bíblicas Difíciles", blurb: "Para estudiantes serios de la Escritura" },
  },
  quiz: {
    quit: "Salir",
    questionLabel: "Pregunta",
    ofLabel: "de",
    streak: "racha",
    difficulty: { Easy: "Fácil", Medium: "Medio", Hard: "Difícil" },
    nextQuestion: "Siguiente Pregunta",
    seeResults: "Ver Resultados",
    noQuestions: "Esta categoría aún no tiene preguntas.",
    backToCategories: "Volver a Categorías",
    fallbackNotice: "Mostrando preguntas en inglés — la traducción llegará pronto para este idioma.",
  },
  result: {
    tier: {
      master: "Maestro del Menorá",
      scholar: "Erudito Fiel",
      believer: "Creyente en Crecimiento",
      keepStudying: "Sigue Estudiando",
    },
    correct: "Correctas",
    accuracy: "Precisión",
    score: "Puntuación",
    points: "puntos",
    namePlaceholder: "Escribe tu nombre",
    saveButton: "Guardar en la Clasificación",
    savedMessage: "Puntuación guardada ✓",
    restartButton: "Reiniciar Quiz",
    backToCategoriesButton: "Volver a Categorías",
    leaderboardButton: "Clasificación",
  },
  leaderboard: {
    heading: "Clasificación",
    subheading: "Guardada en este dispositivo — juega un quiz para añadir tu puntuación",
    empty: "Aún no hay puntuaciones. Termina un quiz y guarda tu puntuación para verla aquí.",
  },
  footer: {
    verse: "«Tu palabra es lámpara a mis pies y lumbrera a mi camino.» — Salmo 119:105",
    tagline: "Menorah Bible Quiz · Hecho para iglesias, grupos juveniles y familias",
  },
};
