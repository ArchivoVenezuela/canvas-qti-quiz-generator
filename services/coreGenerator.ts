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
 * - English: "Question: ... A. ... B. ... Answer: C"
 * - English: "Q1: ...\nA) ...\nB) ...\nAnswer: A"
 * - Spanish: "Tipo: Verdadero/Falso\nPregunta: ...\nRespuesta correcta: Falso"
 * - Spanish: "Tipo: Opción múltiple\nPregunta: ...\nOpciones:\nA. ...\nB. ...\nRespuesta correcta: C"
 * - Spanish: "Tipo: Selección múltiple\nPregunta: ...\nOpciones:\n- ...\n- ...\nRespuestas correctas: ..."
 */
export function parsePreFormattedQuestions(sourceText: string, settings: QuizSettings): Question[] {
  const questions: Question[] = [];
  const lines = sourceText.split('\n').map(l => l.trim());
  
  let currentQuestion: Partial<Question> & { questionText?: string } | null = null;
  let currentOptions: string[] = [];
  let questionNumber = 0;
  let inOptionsSection = false;
  let inQuestionText = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Detect question type (Spanish format)
    if (lowerLine.startsWith('tipo:')) {
      // Save previous question if exists
      if (currentQuestion && currentQuestion.stem) {
        const question = finalizeQuestion(currentQuestion, currentOptions, questionNumber++, settings);
        if (question) questions.push(question);
      }

      // Determine question type from Spanish keywords
      const typeText = line.substring(5).trim().toLowerCase();
      let questionType = QuestionType.MultipleChoice;
      
      if (typeText.includes('verdadero') || typeText.includes('falso') || typeText.includes('true') || typeText.includes('false')) {
        questionType = QuestionType.TrueFalse;
      } else if (typeText.includes('selección múltiple') || typeText.includes('seleccion multiple') || typeText.includes('multiple selection')) {
        questionType = QuestionType.MultipleSelection;
      } else if (typeText.includes('opción múltiple') || typeText.includes('opcion multiple') || typeText.includes('multiple choice')) {
        questionType = QuestionType.MultipleChoice;
      }

      currentQuestion = {
        type: questionType,
        questionText: ''
      };
      currentOptions = [];
      inOptionsSection = false;
      inQuestionText = false;
    }
    // Detect question text (Spanish: "Pregunta:" or English: "Question:", "Q:", etc.)
    else if (lowerLine.startsWith('pregunta:') || lowerLine.startsWith('question:') || 
             lowerLine.startsWith('q:') || lowerLine.match(/^q\d+:/) || lowerLine.match(/^\d+\.\s/)) {
      if (currentQuestion) {
        // If "Pregunta:" is on its own line, the question text is on the next line
        const questionText = line.replace(/^(pregunta:|question:|q:|q\d+:|^\d+\.\s)/i, '').trim();
        if (questionText) {
          currentQuestion.questionText = questionText;
          currentQuestion.stem = questionText;
          inQuestionText = false;
        } else {
          // "Pregunta:" on its own line, next line(s) will be question text
          inQuestionText = true;
        }
      } else {
        // English format without "Tipo:" - create new question
        const questionText = line.replace(/^(question:|q:|q\d+:|^\d+\.\s)/i, '').trim();
        currentQuestion = {
          type: settings.questionTypes[0] || QuestionType.MultipleChoice,
          questionText: questionText,
          stem: questionText
        };
        currentOptions = [];
        inQuestionText = questionText.length === 0; // If empty, expect next line
      }
      inOptionsSection = false;
    }
    // Detect options section start (Spanish: "Opciones:" or English: "Options:")
    else if (lowerLine.startsWith('opciones:') || lowerLine.startsWith('options:')) {
      inOptionsSection = true;
      inQuestionText = false;
    }
    // If we're in question text mode and line is not empty, add to question text
    else if (inQuestionText && line.length > 0 && currentQuestion) {
      if (currentQuestion.questionText) {
        currentQuestion.questionText += ' ' + line;
      } else {
        currentQuestion.questionText = line;
      }
      currentQuestion.stem = currentQuestion.questionText;
    }
    // Detect answer options (A., B., C., D., etc. or A), B), etc. or - format)
    // Only process if we're not in question text mode
    else if (!inQuestionText && (line.match(/^[A-Z][\.\)]\s/) || line.match(/^-\s/) || (inOptionsSection && line.length > 0)) && currentQuestion) {
      let optionText = '';
      if (line.match(/^[A-Z][\.\)]\s/)) {
        optionText = line.replace(/^[A-Z][\.\)]\s/, '').trim();
      } else if (line.match(/^-\s/)) {
        optionText = line.replace(/^-\s/, '').trim();
      } else if (inOptionsSection) {
        optionText = line;
      }
      
      if (optionText) {
        currentOptions.push(optionText);
        inQuestionText = false; // Once we see options, we're done with question text
      }
    }
    // Detect correct answer (Spanish: "Respuesta correcta:" or "Respuestas correctas:" or English: "Answer:", "Correct:")
    else if ((lowerLine.startsWith('respuesta correcta:') || lowerLine.startsWith('respuestas correctas:') ||
              lowerLine.startsWith('answer:') || lowerLine.startsWith('correct:')) && currentQuestion) {
      if (currentQuestion.questionText && !currentQuestion.stem) {
        currentQuestion.stem = currentQuestion.questionText;
      }
      
      const answerText = line.replace(/^(respuesta correcta:|respuestas correctas:|answer:|correct:)/i, '').trim();
      
      // Handle True/False
      if (currentQuestion.type === QuestionType.TrueFalse) {
        const isTrue = answerText.toLowerCase().includes('true') || 
                      answerText.toLowerCase().includes('verdadero') ||
                      answerText.toLowerCase().includes('cierto');
        const question = {
          id: `q_${Date.now()}_${questionNumber}`,
          type: QuestionType.TrueFalse,
          stem: currentQuestion.stem || 'Question',
          options: ['True', 'False'],
          correctIndex: isTrue ? 0 : 1,
          feedback: settings.includeFeedback ? `The correct answer is ${isTrue ? 'True' : 'False'}.` : undefined
        };
        questions.push(question);
        questionNumber++;
      }
      // Handle Multiple Selection (multiple correct answers)
      else if (currentQuestion.type === QuestionType.MultipleSelection) {
        // Parse comma-separated correct answers
        const correctAnswers = answerText.split(',').map(a => a.trim());
        const correctIndices: number[] = [];
        
        // Find indices of correct options
        currentOptions.forEach((opt, idx) => {
          if (correctAnswers.some(correct => opt.toLowerCase().includes(correct.toLowerCase()) || 
                                     correct.toLowerCase().includes(opt.toLowerCase()))) {
            correctIndices.push(idx);
          }
        });
        
        // Also try letter-based matching (A, B, C, etc.)
        if (correctIndices.length === 0) {
          correctAnswers.forEach(answer => {
            const letterMatch = answer.match(/^([A-Z])/i);
            if (letterMatch) {
              const index = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
              if (index >= 0 && index < currentOptions.length) {
                correctIndices.push(index);
              }
            }
          });
        }
        
        if (correctIndices.length > 0) {
          const question = {
            id: `q_${Date.now()}_${questionNumber}`,
            type: QuestionType.MultipleSelection,
            stem: currentQuestion.stem || 'Question',
            options: [...currentOptions],
            correctIndex: correctIndices[0],
            correctIndices: correctIndices,
            feedback: settings.includeFeedback ? `Correct answers: ${correctIndices.map(i => currentOptions[i]).join(', ')}` : undefined
          };
          questions.push(question);
          questionNumber++;
        }
      }
      // Handle Multiple Choice (single correct answer)
      else {
        // Try letter-based answer (A, B, C, D)
        const letterMatch = answerText.match(/^([A-Z])/i);
        if (letterMatch && currentOptions.length > 0) {
          const correctLetter = letterMatch[1].toUpperCase();
          const correctIndex = correctLetter.charCodeAt(0) - 65; // A=0, B=1, etc.
          
          if (correctIndex >= 0 && correctIndex < currentOptions.length) {
            const question = {
              id: `q_${Date.now()}_${questionNumber}`,
              type: currentQuestion.type || QuestionType.MultipleChoice,
              stem: currentQuestion.stem || 'Question',
              options: [...currentOptions],
              correctIndex: correctIndex,
              feedback: settings.includeFeedback ? `The correct answer is ${correctLetter}: ${currentOptions[correctIndex]}` : undefined
            };
            questions.push(question);
            questionNumber++;
          }
        }
      }
      
      // Reset all state for next question
      currentQuestion = null;
      currentOptions = [];
      inOptionsSection = false;
      inQuestionText = false;
    }
    // If we have a current question but no options yet, and line is not empty, treat as question text continuation
    // This handles cases where question text spans multiple lines
    else if (currentQuestion && line.length > 0 && !inOptionsSection && !inQuestionText && 
             !lowerLine.startsWith('respuesta') && !lowerLine.startsWith('answer') && !lowerLine.startsWith('correct')) {
      // Only add to question text if we haven't started collecting options yet
      if (currentOptions.length === 0) {
        if (currentQuestion.questionText) {
          currentQuestion.questionText += ' ' + line;
        } else {
          currentQuestion.questionText = line;
        }
        currentQuestion.stem = currentQuestion.questionText;
      }
    }
    // Handle case where we're explicitly in question text mode (after "Pregunta:" on its own line)
    else if (inQuestionText && line.length > 0 && currentQuestion) {
      if (currentQuestion.questionText) {
        currentQuestion.questionText += ' ' + line;
      } else {
        currentQuestion.questionText = line;
      }
      currentQuestion.stem = currentQuestion.questionText;
      // Continue in question text mode until we see "Opciones:" or an answer
    }
  }

  // Handle last question if file doesn't end with answer
  if (currentQuestion && currentQuestion.stem) {
    const question = finalizeQuestion(currentQuestion, currentOptions, questionNumber, settings);
    if (question) questions.push(question);
  }

  return questions;
}

/**
 * Finalizes a question from parsed components.
 */
function finalizeQuestion(
  currentQuestion: Partial<Question> & { questionText?: string },
  currentOptions: string[],
  questionNumber: number,
  settings: QuizSettings
): Question | null {
  if (!currentQuestion.stem) return null;
  
  const stem = currentQuestion.stem;
  const type = currentQuestion.type || QuestionType.MultipleChoice;
  
  // If it's True/False, ensure we have exactly True/False options
  if (type === QuestionType.TrueFalse) {
    return {
      id: `q_${Date.now()}_${questionNumber}`,
      type: QuestionType.TrueFalse,
      stem: stem,
      options: ['True', 'False'],
      correctIndex: 0, // Default to True, user should edit
      feedback: settings.includeFeedback ? 'Review the correct answer and edit as needed.' : undefined
    };
  }

  // For multiple choice, use parsed options or create template
  if (currentOptions.length === 0) {
    currentOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
  }

  return {
    id: `q_${Date.now()}_${questionNumber}`,
    type: type,
    stem: stem,
    options: currentOptions,
    correctIndex: 0, // Default to first option, user should edit
    feedback: settings.includeFeedback ? 'Please review and set the correct answer.' : undefined
  };
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

