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
  const blocks = text
    .split(/\n(?=\d+\.\s)/)
    .map(block => block.trim())
    .filter(Boolean);
  
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
  
  if (/☐|☑|selecciona todas|select all|checkbox|multiple select/i.test(block)) {
    return 'multiple_select';
  }
  
  if (/\([A-Z]\)|^[A-Z]\.\s|^[A-Z]\)\s/i.test(block)) {
    return 'multiple_choice';
  }
  
  if (/\bverdadero\b|\bfalso\b|\btrue\b|\bfalse\b/i.test(block) && 
      !/respuesta abierta|short answer/i.test(block)) {
    return 'true_false';
  }
  
  if (/respuesta abierta|essay|ensayo/i.test(block)) {
    return 'essay';
  }
  
  return 'short_answer';
}

// =====================
// Paso 4: Extraer el prompt
// =====================

export function extractPrompt(block: string): string {
  const lines = block.split('\n');
  
  let firstLine = lines[0].replace(/^\d+\.\s*/, '').trim();
  firstLine = firstLine.replace(/^(?:Question|Pregunta|Q\d*):\s*/i, '').trim();
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
    const letterMatch = line.match(/^\(?([A-Z])[\.)\]]\s*(.+)$/i);
    if (letterMatch) {
      options.push(letterMatch[2].trim());
      continue;
    }
    
    const checkboxMatch = line.match(/^[☐☑]\s*(.+)$/);
    if (checkboxMatch) {
      options.push(checkboxMatch[1].trim());
      continue;
    }
    
    if (/^(?:Opciones|Options):/i.test(line)) {
      continue;
    }
    
    const dashMatch = line.match(/^-\s*(.+)$/);
    if (dashMatch && options.length > 0 || /^(?:Opciones|Options):/i.test(lines[lines.indexOf(line) - 1] || '')) {
      options.push(dashMatch[1].trim());
    }
  }
  
  return options.filter(opt => opt.length > 0);
}

// =====================
// Paso 5b: Extraer la respuesta correcta (MC)
// =====================

export function extractCorrectAnswerIndex(block: string, options: string[]): number {
  const answerMatch = block.match(/(?:Answer|Respuesta):\s*([A-Z])\s*$/im);
  if (answerMatch) {
    const letter = answerMatch[1].toUpperCase();
    const idx = letter.charCodeAt(0) - 'A'.charCodeAt(0);
    if (idx >= 0 && idx < options.length) {
      return idx;
    }
  }

  const answerTextMatch = block.match(/(?:Answer|Respuesta):\s*(.+)$/im);
  if (answerTextMatch) {
    const answerText = answerTextMatch[1].trim();
    const idx = options.findIndex(opt => opt.toLowerCase() === answerText.toLowerCase());
    if (idx >= 0) {
      return idx;
    }
  }

  return 0;
}

export function extractCorrectAnswersIndices(block: string, options: string[]): number[] {
  const answerMatch = block.match(/(?:Answer|Respuesta):\s*(.+)$/im);
  if (answerMatch) {
    const letters = answerMatch[1].split(/[,\s]+/).filter(s => /^[A-Z]$/i.test(s));
    if (letters.length > 0) {
      return letters
        .map(l => l.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0))
        .filter(idx => idx >= 0 && idx < options.length);
    }
  }

  const lines = block.split('\n');
  const indices: number[] = [];
  let optIdx = 0;
  for (const line of lines) {
    if (/^☑/.test(line)) {
      indices.push(optIdx);
      optIdx++;
    } else if (/^☐/.test(line)) {
      optIdx++;
    }
  }
  return indices;
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
      const correctIdx = extractCorrectAnswerIndex(block, options);
      return {
        id,
        type,
        prompt,
        options: options.length > 0 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: correctIdx
      };
    }

    case 'multiple_select': {
      const options = extractOptions(block);
      const correctAnswers = extractCorrectAnswersIndices(block, options);
      return {
        id,
        type,
        prompt,
        options: options.length > 0 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswers
      };
    }

    case 'true_false': {
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
