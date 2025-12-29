/**
 * Modular Quiz Parser
 * 
 * Pipeline-based parser that segments text into question blocks,
 * detects question types, and extracts structured question data.
 */

import { Question, QuestionType } from '../types';

// =====================
// Paso 1: Normalización del texto
// =====================

export function normalizeInput(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\u00A0/g, ' ')
    .trim();
}

// =====================
// Paso 2: Segmentación en bloques de preguntas
// =====================

export function splitIntoQuestionBlocks(text: string): string[] {
  // Split by question numbers (1., 2., etc.) or by explicit question markers
  const blocks = text
    .split(/\n(?=\d+\.\s)/)
    .map(block => block.trim())
    .filter(Boolean);
  
  // If no numbered questions found, try splitting by "Question:" or "Pregunta:"
  if (blocks.length === 1 && blocks[0] === text.trim()) {
    return text
      .split(/\n(?=(?:Question|Pregunta|Q\d*):)/i)
      .map(block => block.trim())
      .filter(Boolean);
  }
  
  return blocks;
}

// =====================
// Paso 3: Detección del tipo de pregunta
// =====================

export function detectQuestionType(block: string): QuestionType {
  const lowerBlock = block.toLowerCase();
  
  // Order: most specific to most general
  
  // Multiple Select: checkboxes or "selecciona todas" / "select all"
  if (/☐|☑|selecciona todas|select all|checkbox|multiple select/i.test(block)) {
    return 'multiple_select';
  }
  
  // Multiple Choice: lettered options (A), (B), (C) or A. B. C.
  if (/\([A-Z]\)|^[A-Z]\.\s|^[A-Z]\)\s/i.test(block)) {
    return 'multiple_choice';
  }
  
  // True/False: explicit true/false keywords
  if (/\bverdadero\b|\bfalso\b|\btrue\b|\bfalse\b/i.test(block) && 
      !/respuesta abierta|short answer/i.test(block)) {
    return 'true_false';
  }
  
  // Essay: explicit "respuesta abierta" or "essay"
  if (/respuesta abierta|essay|ensayo/i.test(block)) {
    return 'essay';
  }
  
  // Default: short answer
  return 'short_answer';
}

// =====================
// Paso 4: Extraer el prompt
// =====================

export function extractPrompt(block: string): string {
  const lines = block.split('\n');
  
  // Remove question number prefix (1., 2., etc.)
  let firstLine = lines[0].replace(/^\d+\.\s*/, '').trim();
  
  // Remove "Question:" or "Pregunta:" prefix
  firstLine = firstLine.replace(/^(?:Question|Pregunta|Q\d*):\s*/i, '').trim();
  
  // Remove type indicators from the prompt
  firstLine = firstLine.replace(/\s*\(respuesta\s+abierta\)/i, '').trim();
  firstLine = firstLine.replace(/\s*\(short\s+answer\)/i, '').trim();
  
  return firstLine;
}

// =====================
// Paso 5: Extraer opciones (MC / Multiple Select)
// =====================

export function extractOptions(block: string): string[] {
  const lines = block.split('\n');
  const options: string[] = [];
  
  for (const line of lines) {
    // Match lettered options: (A), (B), A), B), A. B.
    const letterMatch = line.match(/^\(?([A-Z])[\.\)]\s*(.+)$/i);
    if (letterMatch) {
      options.push(letterMatch[2].trim());
      continue;
    }
    
    // Match checkbox options: ☐ or ☑
    const checkboxMatch = line.match(/^[☐☑]\s*(.+)$/);
    if (checkboxMatch) {
      options.push(checkboxMatch[1].trim());
      continue;
    }
    
    // Match dash/bullet options after "Opciones:" or "Options:"
    if (/^(?:Opciones|Options):/i.test(line)) {
      // Next lines are options
      continue;
    }
    
    // Match simple dash format: - Option text
    const dashMatch = line.match(/^-\s*(.+)$/);
    if (dashMatch && options.length > 0 || /^(?:Opciones|Options):/i.test(lines[lines.indexOf(line) - 1] || '')) {
      options.push(dashMatch[1].trim());
    }
  }
  
  return options.filter(opt => opt.length > 0);
}

// =====================
// Paso 6: Construcción tipada de la pregunta
// =====================

export function parseQuestion(block: string): Question {
  const type = detectQuestionType(block);
  const prompt = extractPrompt(block);
  const id = crypto.randomUUID();

  switch (type) {
    case 'multiple_choice': {
      const options = extractOptions(block);
      return {
        id,
        type,
        prompt,
        options: options.length > 0 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0 // Default, should be set by user
      };
    }

    case 'multiple_select': {
      const options = extractOptions(block);
      return {
        id,
        type,
        prompt,
        options: options.length > 0 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswers: [] // Default, should be set by user
      };
    }

    case 'true_false': {
      // Try to detect correct answer from block
      const lowerBlock = block.toLowerCase();
      const isTrue = /verdadero|true|cierto/i.test(lowerBlock) && 
                     !/falso|false|incorrecto/i.test(lowerBlock);
      
      return {
        id,
        type,
        prompt,
        correctAnswer: isTrue
      };
    }

    case 'essay': {
      return {
        id,
        type,
        prompt
      };
    }

    case 'short_answer':
    default: {
      // Try to extract acceptable answers if present
      const answerMatch = block.match(/(?:Answer|Respuesta):\s*(.+)/i);
      const correctAnswer = answerMatch 
        ? answerMatch[1].trim().split(',').map(a => a.trim()).filter(Boolean)
        : undefined;
      
      return {
        id,
        type: 'short_answer',
        prompt,
        correctAnswer: correctAnswer && correctAnswer.length === 1 
          ? correctAnswer[0] 
          : correctAnswer
      };
    }
  }
}

// =====================
// Paso 7: Parser principal
// =====================

export function parseQuiz(text: string): Question[] {
  if (!text || !text.trim()) {
    return [];
  }
  
  const normalized = normalizeInput(text);
  const blocks = splitIntoQuestionBlocks(normalized);
  
  if (blocks.length === 0) {
    return [];
  }
  
  return blocks.map(parseQuestion);
}

