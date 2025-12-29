/**
 * Core Quiz Generator Service
 * 
 * This module provides deterministic, template-based quiz generation WITHOUT any AI dependencies.
 * Designed for institutional deployment where external APIs may be restricted or unavailable.
 * 
 * The core generator:
 * - Parses pre-formatted questions from source text using the modular parser
 * - Creates template questions based on user settings
 * - Generates valid Canvas QTI XML without external dependencies
 */

import { QuizSettings, QuizData, Question, QuestionType } from '../types';
import { parseQuiz } from './parser';

/**
 * Parses pre-formatted questions from source text using the modular parser.
 * Falls back to legacy parsing if the new parser doesn't find questions.
 */
export function parsePreFormattedQuestions(sourceText: string, settings: QuizSettings): Question[] {
  if (!sourceText || !sourceText.trim()) {
    return [];
  }
  
  // Try the new modular parser first
  const parsed = parseQuiz(sourceText);
  if (parsed.length > 0) {
    return parsed;
  }
  
  // Fallback: return empty array, will generate templates
  return [];
}

/**
 * Generates template questions based on settings.
 * Creates placeholder questions that users can edit.
 */
export function generateTemplateQuestions(settings: QuizSettings): Question[] {
  const questions: Question[] = [];
  const topic = settings.topic || settings.title || 'Your Topic';
  const questionCount = settings.questionCount || 5;
  const questionTypes: QuestionType[] = settings.questionTypes || ['multiple_choice'];
  const includeFeedback = settings.includeFeedback !== false;
  
  for (let i = 0; i < questionCount; i++) {
    const questionNumber = i + 1;
    let question: Question;

    // Determine question type (rotate through selected types)
    const typeIndex = i % questionTypes.length;
    const questionType = questionTypes[typeIndex];

    switch (questionType) {
      case 'true_false':
        question = {
          id: crypto.randomUUID(),
          type: 'true_false',
          prompt: `True or False: This is a placeholder question about ${topic}. Please edit this question text.`,
          correctAnswer: true,
          feedback: includeFeedback ? 'Please review and set the correct answer and feedback.' : undefined
        };
        break;

      case 'short_answer':
        question = {
          id: crypto.randomUUID(),
          type: 'short_answer',
          prompt: `Short Answer: Describe or define a key concept related to ${topic}. Please edit this question text.`,
          correctAnswer: 'Expected Answer',
          feedback: includeFeedback ? 'Please review acceptable answers and feedback.' : undefined
        };
        break;

      case 'multiple_select':
        question = {
          id: crypto.randomUUID(),
          type: 'multiple_select',
          prompt: `Multiple Select: Select all that apply related to ${topic}. Please edit this question text.`,
          options: [
            'Option A - Edit this option',
            'Option B - Edit this option',
            'Option C - Edit this option',
            'Option D - Edit this option'
          ],
          correctAnswers: [0, 1], // Default to first two options, user should edit
          feedback: includeFeedback ? 'Please review options, set the correct answers, and add feedback.' : undefined
        };
        break;

      case 'essay':
        question = {
          id: crypto.randomUUID(),
          type: 'essay',
          prompt: `Essay: Write a comprehensive response about ${topic}. Please edit this question text.`,
          feedback: includeFeedback ? 'Please review and provide grading criteria.' : undefined
        };
        break;

      case 'multiple_choice':
      default:
        question = {
          id: crypto.randomUUID(),
          type: 'multiple_choice',
          prompt: `Multiple Choice: Which of the following best relates to ${topic}? Please edit this question text.`,
          options: [
            'Option A - Edit this option',
            'Option B - Edit this option',
            'Option C - Edit this option',
            'Option D - Edit this option'
          ],
          correctAnswer: 0,
          feedback: includeFeedback ? 'Please review options, set the correct answer, and add feedback.' : undefined
        };
        break;
    }

    questions.push(question);
  }

  return questions;
}

/**
 * Core quiz generation function (NO AI REQUIRED).
 * 
 * This function:
 * 1. Attempts to parse pre-formatted questions from source text (if provided)
 * 2. If no valid questions found or source text is empty, generates template questions
 * 3. Applies randomization if requested
 * 4. Returns valid QuizData ready for QTI export
 * 
 * @param settings - Quiz generation settings
 * @returns QuizData with questions ready for Canvas export
 */
export function generateQuizCore(settings: QuizSettings): QuizData {
  // Try to parse pre-formatted questions first (if source text provided)
  let questions: Question[] = [];
  
  const sourceText = settings.sourceText || '';
  if (sourceText.trim()) {
    const parsed = parsePreFormattedQuestions(sourceText, settings);
    if (parsed.length > 0) {
      questions = parsed;
    }
  }

  // If no questions were parsed, generate templates
  // This happens when:
  // - Source text is empty (user wants templates)
  // - Source text couldn't be parsed as pre-formatted questions
  if (questions.length === 0) {
    questions = generateTemplateQuestions(settings);
  }

  // Apply randomization if requested (for Multiple Choice and Multiple Selection)
  const shouldRandomize = settings.randomize || settings.shuffleAnswers;
  if (shouldRandomize) {
    questions = questions.map(q => {
      if (q.type === 'multiple_choice' && q.options && q.options.length > 1) {
        const combined = q.options.map((opt, i) => ({ text: opt, isCorrect: i === q.correctAnswer }));
        // Fisher-Yates shuffle
        for (let i = combined.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [combined[i], combined[j]] = [combined[j], combined[i]];
        }
        return {
          ...q,
          options: combined.map(c => c.text),
          correctAnswer: combined.findIndex(c => c.isCorrect)
        };
      } else if (q.type === 'multiple_select' && q.options && q.options.length > 1 && q.correctAnswers) {
        const combined = q.options.map((opt, i) => ({ text: opt, isCorrect: q.correctAnswers!.includes(i) }));
        // Fisher-Yates shuffle
        for (let i = combined.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [combined[i], combined[j]] = [combined[j], combined[i]];
        }
        const newCorrectAnswers = combined.map((c, idx) => c.isCorrect ? idx : -1).filter(idx => idx !== -1);
        return {
          ...q,
          options: combined.map(c => c.text),
          correctAnswers: newCorrectAnswers
        };
      }
      return q;
    });
  }

  // Get mode from settings (default to 'quiz' for backward compatibility)
  const mode = settings.mode || 'quiz';
  
  // Validation: In quiz mode, warn (but don't crash) if graded questions lack answers
  if (mode === 'quiz') {
    questions.forEach((q, idx) => {
      if (q.type === 'multiple_choice' && q.correctAnswer === undefined) {
        console.warn(`Question ${idx + 1} (multiple_choice) lacks correctAnswer in quiz mode. Defaulting to 0.`);
      } else if (q.type === 'multiple_select' && (!q.correctAnswers || q.correctAnswers.length === 0)) {
        console.warn(`Question ${idx + 1} (multiple_select) lacks correctAnswers in quiz mode.`);
      } else if (q.type === 'true_false' && q.correctAnswer === undefined) {
        console.warn(`Question ${idx + 1} (true_false) lacks correctAnswer in quiz mode. Defaulting to true.`);
      }
    });
  }
  // In survey mode, silently ignore correctAnswer/correctAnswers fields (no validation needed)

  return {
    title: settings.title || settings.topic || 'Generated Quiz',
    description: settings.description,
    mode: mode,
    questions: questions,
    maxAttempts: settings.maxAttempts
  };
}
