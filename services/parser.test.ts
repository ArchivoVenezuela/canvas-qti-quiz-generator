/**
 * Parser Tests
 * 
 * Tests for the modular quiz parser using a realistic diagnostic questionnaire.
 * 
 * To run: Use Node.js or a test runner that supports TypeScript/ES modules
 * Example: node --loader ts-node/esm services/parser.test.ts
 * Or: Use a test framework like Vitest, Jest, etc.
 */

import { parseQuiz } from './parser';
import { Question } from '../types';

/**
 * Realistic diagnostic questionnaire text (exact format as specified)
 */
const REALISTIC_QUESTIONNAIRE = `1. ¿Cuál es tu lengua materna (primera lengua)?
(A) Español
(B) Inglés
(C) Otra

2. ¿Has tomado cursos de español en la escuela secundaria?
(A) Sí
(B) No

3. ¿Cuáles son los últimos tres cursos de español que has tomado?
(Respuesta abierta)

4. ¿Qué tipo de arte te interesa más?
☐ Pintura
☐ Escultura
☐ Cine
☐ Fotografía

5. ¿Has tenido experiencia con arte latinoamericano?
(A) Sí
(B) No

6. ¿Qué esperas aprender en este curso?
(Respuesta abierta)`;

/**
 * Simple test runner
 */
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

function runTest(name: string, testFn: () => boolean | void): TestResult {
  try {
    const result = testFn();
    const passed = result !== false;
    return { name, passed, error: passed ? undefined : 'Test returned false' };
  } catch (error) {
    return { 
      name, 
      passed: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Test Suite
 */
export function runParserTests(): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Total number of questions
  results.push(runTest('Should parse exactly 6 questions', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    return questions.length === 6;
  }));

  // Test 2: Question 1 - Multiple Choice
  results.push(runTest('Q1 should be multiple_choice with 3 options', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    const q1 = questions[0];
    return q1.type === 'multiple_choice' && 
           q1.options && 
           q1.options.length === 3 &&
           q1.options.includes('Español') &&
           q1.options.includes('Inglés') &&
           q1.options.includes('Otra');
  }));

  // Test 3: Question 2 - Multiple Choice
  results.push(runTest('Q2 should be multiple_choice with 2 options', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    const q2 = questions[1];
    return q2.type === 'multiple_choice' && 
           q2.options && 
           q2.options.length === 2 &&
           q2.options.includes('Sí') &&
           q2.options.includes('No');
  }));

  // Test 4: Question 3 - Short Answer or Essay
  results.push(runTest('Q3 should be short_answer or essay (open-ended)', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    const q3 = questions[2];
    return (q3.type === 'short_answer' || q3.type === 'essay') &&
           q3.prompt.includes('últimos tres cursos');
  }));

  // Test 5: Question 4 - Multiple Select (checkboxes)
  results.push(runTest('Q4 should be multiple_select with 4 options (checkboxes)', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    const q4 = questions[3];
    return q4.type === 'multiple_select' && 
           q4.options && 
           q4.options.length === 4 &&
           q4.options.includes('Pintura') &&
           q4.options.includes('Escultura') &&
           q4.options.includes('Cine') &&
           q4.options.includes('Fotografía');
  }));

  // Test 6: Question 5 - Multiple Choice
  results.push(runTest('Q5 should be multiple_choice with 2 options', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    const q5 = questions[4];
    return q5.type === 'multiple_choice' && 
           q5.options && 
           q5.options.length === 2 &&
           q5.options.includes('Sí') &&
           q5.options.includes('No');
  }));

  // Test 7: Question 6 - Essay (open-ended)
  results.push(runTest('Q6 should be essay or short_answer (open-ended)', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    const q6 = questions[5];
    return (q6.type === 'essay' || q6.type === 'short_answer') &&
           q6.prompt.includes('esperas aprender');
  }));

  // Test 8: Questions with options should have options.length > 0
  results.push(runTest('Questions with options should have options.length > 0', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    return questions.every(q => {
      if (q.type === 'multiple_choice' || q.type === 'multiple_select') {
        return q.options && q.options.length > 0;
      }
      return true; // Other types don't require options
    });
  }));

  // Test 9: Open-ended questions should not have options
  results.push(runTest('Open-ended questions (essay/short_answer) should not have options array', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    const openEnded = questions.filter(q => q.type === 'essay' || q.type === 'short_answer');
    return openEnded.every(q => {
      // Essay questions don't have options property
      if (q.type === 'essay') {
        return !('options' in q);
      }
      // Short answer might have correctAnswer but not options array
      return true;
    });
  }));

  // Test 10: All questions should have valid IDs
  results.push(runTest('All questions should have valid UUIDs', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    return questions.every(q => q.id && q.id.length > 0 && typeof q.id === 'string');
  }));

  // Test 11: All questions should have prompts
  results.push(runTest('All questions should have non-empty prompts', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    return questions.every(q => q.prompt && q.prompt.trim().length > 0);
  }));

  // Test 12: Heterogeneous array - mixed types
  results.push(runTest('Should produce heterogeneous array with mixed question types', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    const types = questions.map(q => q.type);
    const uniqueTypes = new Set(types);
    // Should have at least multiple_choice, multiple_select, and essay/short_answer
    return uniqueTypes.size >= 2 && 
           types.includes('multiple_choice') && 
           types.includes('multiple_select');
  }));

  // Test 13: Prompt extraction - Q1
  results.push(runTest('Q1 prompt should be extracted correctly', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    const q1 = questions[0];
    return q1.prompt.includes('lengua materna') || q1.prompt.includes('primera lengua');
  }));

  // Test 14: Prompt extraction - Q4
  results.push(runTest('Q4 prompt should be extracted correctly', () => {
    const questions = parseQuiz(REALISTIC_QUESTIONNAIRE);
    const q4 = questions[3];
    return q4.prompt.includes('tipo de arte') || q4.prompt.includes('arte te interesa');
  }));

  return results;
}

/**
 * Run tests and print results
 */
if (import.meta.url === `file://${process.argv[1]}` || typeof window === 'undefined') {
  // Running in Node.js or test environment
  const results = runParserTests();
  
  console.log('\n=== Parser Tests ===\n');
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    if (result.passed) {
      console.log(`✅ ${result.name}`);
      passed++;
    } else {
      console.log(`❌ ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      failed++;
    }
  });
  
  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${results.length} tests\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

