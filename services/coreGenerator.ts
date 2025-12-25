/**
 * Core Quiz Generator Service
 * 
 * This module provides deterministic, template-based quiz generation WITHOUT any AI dependencies.
 * Designed for institutional deployment where external APIs may be restricted or unavailable.
 * 
 * The core generator:
 * - Parses pre-formatted questions from source text
 * - Creates template questions based on user settings
 * - Generates valid Canvas QTI XML without external dependencies
 */

import { QuizSettings, QuizData, Question, QuestionType } from '../types';

/**
 * Parses pre-formatted questions from source text.
 * Supports formats like:
 * - "Question: ... A. ... B. ... Answer: C"
 * - "Q1: ...\nA) ...\nB) ...\nAnswer: A"
 * - Numbered questions with multiple choice options
 */
export function parsePreFormattedQuestions(sourceText: string, settings: QuizSettings): Question[] {
  const questions: Question[] = [];
  const lines = sourceText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentQuestion: Partial<Question> | null = null;
  let currentOptions: string[] = [];
  let questionNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Detect question start
    if (lowerLine.startsWith('question:') || lowerLine.startsWith('q:') || 
        lowerLine.match(/^q\d+:/) || lowerLine.match(/^\d+\.\s/)) {
      // Save previous question if exists
      if (currentQuestion && currentQuestion.stem && currentOptions.length > 0) {
        questions.push(createQuestionFromParsed(
          currentQuestion.stem,
          currentOptions,
          currentQuestion.type || QuestionType.MultipleChoice,
          settings.includeFeedback,
          questionNumber++
        ));
      }

      // Start new question
      const questionText = line.replace(/^(question:|q:|q\d+:|^\d+\.\s)/i, '').trim();
      currentQuestion = {
        stem: questionText,
        type: settings.questionTypes[0] || QuestionType.MultipleChoice
      };
      currentOptions = [];
    }
    // Detect answer options (A., B., C., D., etc. or A), B), etc.)
    else if (line.match(/^[A-Z][\.\)]\s/) && currentQuestion) {
      const optionText = line.replace(/^[A-Z][\.\)]\s/, '').trim();
      currentOptions.push(optionText);
    }
    // Detect correct answer
    else if ((lowerLine.startsWith('answer:') || lowerLine.startsWith('correct:')) && currentQuestion) {
      const answerMatch = line.match(/^answer:\s*([A-Z])/i);
      if (answerMatch && currentOptions.length > 0) {
        const correctLetter = answerMatch[1].toUpperCase();
        const correctIndex = correctLetter.charCodeAt(0) - 65; // A=0, B=1, etc.
        
        if (correctIndex >= 0 && correctIndex < currentOptions.length) {
          questions.push({
            id: `q_${Date.now()}_${questionNumber}`,
            type: currentQuestion.type || QuestionType.MultipleChoice,
            stem: currentQuestion.stem || 'Question',
            options: [...currentOptions],
            correctIndex: correctIndex,
            feedback: settings.includeFeedback ? `The correct answer is ${correctLetter}: ${currentOptions[correctIndex]}` : undefined
          });
          questionNumber++;
        }
      }
      currentQuestion = null;
      currentOptions = [];
    }
  }

  // Handle last question if file doesn't end with Answer:
  if (currentQuestion && currentQuestion.stem && currentOptions.length > 0) {
    questions.push(createQuestionFromParsed(
      currentQuestion.stem,
      currentOptions,
      currentQuestion.type || QuestionType.MultipleChoice,
      settings.includeFeedback,
      questionNumber
    ));
  }

  return questions;
}

/**
 * Creates a question from parsed components.
 */
function createQuestionFromParsed(
  stem: string,
  options: string[],
  type: QuestionType,
  includeFeedback: boolean,
  index: number
): Question {
  // If it's True/False, ensure we have exactly True/False options
  if (type === QuestionType.TrueFalse) {
    return {
      id: `q_${Date.now()}_${index}`,
      type: QuestionType.TrueFalse,
      stem: stem,
      options: ['True', 'False'],
      correctIndex: 0, // Default to True, user should edit
      feedback: includeFeedback ? 'Review the correct answer and edit as needed.' : undefined
    };
  }

  // For multiple choice, use parsed options or create template
  if (options.length === 0) {
    options = ['Option A', 'Option B', 'Option C', 'Option D'];
  }

  return {
    id: `q_${Date.now()}_${index}`,
    type: type,
    stem: stem,
    options: options,
    correctIndex: 0, // Default to first option, user should edit
    feedback: includeFeedback ? 'Please review and set the correct answer.' : undefined
  };
}

/**
 * Generates template questions based on settings.
 * Creates placeholder questions that users can edit.
 */
export function generateTemplateQuestions(settings: QuizSettings): Question[] {
  const questions: Question[] = [];
  const topic = settings.topic || 'Your Topic';
  
  for (let i = 0; i < settings.questionCount; i++) {
    const questionNumber = i + 1;
    let question: Question;

    // Determine question type (rotate through selected types)
    const typeIndex = i % settings.questionTypes.length;
    const questionType = settings.questionTypes[typeIndex];

    switch (questionType) {
      case QuestionType.TrueFalse:
        question = {
          id: `q_${Date.now()}_${i}`,
          type: QuestionType.TrueFalse,
          stem: `True or False: This is a placeholder question about ${topic}. Please edit this question text.`,
          options: ['True', 'False'],
          correctIndex: 0,
          feedback: settings.includeFeedback ? 'Please review and set the correct answer and feedback.' : undefined
        };
        break;

      case QuestionType.ShortAnswer:
        question = {
          id: `q_${Date.now()}_${i}`,
          type: QuestionType.ShortAnswer,
          stem: `Short Answer: Describe or define a key concept related to ${topic}. Please edit this question text.`,
          options: ['Expected Answer 1', 'Expected Answer 2'], // Acceptable answers
          correctIndex: 0, // Ignored for short answer
          feedback: settings.includeFeedback ? 'Please review acceptable answers and feedback.' : undefined
        };
        break;

      case QuestionType.MultipleChoice:
      default:
        question = {
          id: `q_${Date.now()}_${i}`,
          type: QuestionType.MultipleChoice,
          stem: `Multiple Choice: Which of the following best relates to ${topic}? Please edit this question text.`,
          options: [
            'Option A - Edit this option',
            'Option B - Edit this option',
            'Option C - Edit this option',
            'Option D - Edit this option'
          ],
          correctIndex: 0,
          feedback: settings.includeFeedback ? 'Please review options, set the correct answer, and add feedback.' : undefined
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
  
  if (settings.sourceText && settings.sourceText.trim()) {
    const parsed = parsePreFormattedQuestions(settings.sourceText, settings);
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

  // Apply randomization if requested (only for Multiple Choice)
  if (settings.randomize) {
    questions = questions.map(q => {
      if (q.type === QuestionType.MultipleChoice && q.options.length > 1) {
        const combined = q.options.map((opt, i) => ({ text: opt, isCorrect: i === q.correctIndex }));
        // Fisher-Yates shuffle
        for (let i = combined.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [combined[i], combined[j]] = [combined[j], combined[i]];
        }
        return {
          ...q,
          options: combined.map(c => c.text),
          correctIndex: combined.findIndex(c => c.isCorrect)
        };
      }
      return q;
    });
  }

  return {
    title: settings.topic || 'Generated Quiz',
    questions: questions,
    maxAttempts: settings.maxAttempts
  };
}

