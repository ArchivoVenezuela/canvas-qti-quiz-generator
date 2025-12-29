// =====================
// App-level types
// =====================

export type AppStatus = 'idle' | 'generating' | 'review' | 'error';

export enum Difficulty {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard"
}

export interface QuizSettings {
  mode: 'survey' | 'quiz'; // Required: distinguishes survey (ungraded) from quiz (graded)
  title?: string;
  description?: string;
  shuffleAnswers?: boolean;
  pointsPerQuestion?: number;
  // Legacy fields for backward compatibility
  topic?: string;
  sourceText?: string;
  questionCount?: number;
  difficulty?: string;
  language?: string;
  questionTypes?: QuestionType[];
  includeFeedback?: boolean;
  randomize?: boolean;
  maxAttempts?: number;
}

// =====================
// Base Question
// =====================

interface BaseQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points?: number;
  feedback?: string;
}

// =====================
// Question Type Union
// =====================

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | MultipleSelectQuestion
  | ShortAnswerQuestion
  | EssayQuestion;

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'multiple_select'
  | 'short_answer'
  | 'essay';

// =====================
// Question Variants
// =====================

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: string[];
  correctAnswer: number;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  correctAnswer: boolean;
}

export interface MultipleSelectQuestion extends BaseQuestion {
  type: 'multiple_select';
  options: string[];
  correctAnswers: number[];
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  correctAnswer?: string | string[];
}

export interface EssayQuestion extends BaseQuestion {
  type: 'essay';
}

// =====================
// Quiz Data
// =====================

export interface QuizData {
  title: string;
  description?: string;
  mode: 'survey' | 'quiz'; // Mode determines if grading logic is included
  questions: Question[];
  maxAttempts?: number;
}
