export const QUIZ_CATEGORIES = ['brain', 'relationships', 'alco-facts', 'sport'] as const;
export type QuizCategory = typeof QUIZ_CATEGORIES[number];
