export enum Difficulty {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard"
}

export enum QuestionType {
  MultipleChoice = "multiple_choice",
  TrueFalse = "true_false",
  ShortAnswer = "short_answer",
  MultipleSelection = "multiple_selection"
}

export interface QuizSettings {
  topic: string;
  sourceText: string;
  questionCount: number;
  difficulty: Difficulty;
  language: string;
  questionTypes: QuestionType[];
  includeFeedback: boolean;
  randomize: boolean;
  maxAttempts?: number; // Optional: Maximum number of quiz attempts (default: 1)
}

export interface Question {
  id: string;
  type: QuestionType;
  stem: string;
  options: string[]; // For Short Answer, this contains valid correct answers
  correctIndex: number; // -1 or ignored for Short Answer; for MultipleSelection, this is the first correct index (use correctIndices instead)
  correctIndices?: number[]; // For Multiple Selection questions, array of correct option indices
  feedback?: string;
}

export interface QuizData {
  title: string;
  questions: Question[];
  maxAttempts?: number; // Maximum number of quiz attempts allowed
}

export type AppStatus = 'idle' | 'generating' | 'review' | 'error';