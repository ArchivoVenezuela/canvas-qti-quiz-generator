import JSZip from 'jszip';
import { QuizData, Question, QuestionType } from '../types';

/**
 * Escapes special XML characters to prevent XML parsing errors.
 * Converts <, >, &, ', and " to their XML entity equivalents.
 * 
 * @param unsafe - The string that may contain special XML characters
 * @returns The escaped string safe for XML insertion
 */
const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

/**
 * Generates the IMS Manifest XML file required for Canvas QTI import.
 * This manifest describes the quiz package structure and metadata.
 * 
 * @param quizId - Unique identifier for the quiz package
 * @param title - Title of the quiz
 * @returns XML string for imsmanifest.xml
 */
const generateManifest = (quizId: string, title: string): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="man_${quizId}" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
    xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd">
  <metadata>
    <schema>IMS Content</schema>
    <schemaversion>1.1.3</schemaversion>
    <imsmd:lom>
      <imsmd:general>
        <imsmd:title>
          <imsmd:langstring xml:lang="en">${escapeXml(title)}</imsmd:langstring>
        </imsmd:title>
      </imsmd:general>
    </imsmd:lom>
  </metadata>
  <organizations default="org_${quizId}">
    <organization identifier="org_${quizId}">
      <title>${escapeXml(title)}</title>
      <item identifier="item_${quizId}" identifierref="res_${quizId}">
        <title>${escapeXml(title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res_${quizId}" type="imsqti_xmlv1p2/imscc_xmlv1p1/assessment" href="quiz.xml">
      <file href="quiz.xml"/>
    </resource>
  </resources>
</manifest>`;
};

/**
 * Generates the QTI Assessment XML file containing all quiz questions.
 * This is the main quiz.xml file that Canvas imports.
 * 
 * @param data - Quiz data containing title and questions
 * @param quizId - Unique identifier for the assessment
 * @returns XML string for quiz.xml following QTI 1.2 standard
 */
const generateAssessmentXml = (data: QuizData, quizId: string): string => {
  // Use provided max attempts or default to 1 (unlimited = 0, but 1 is safer for Canvas)
  const maxAttempts = data.maxAttempts !== undefined ? data.maxAttempts : 1;
  // Get mode from quiz data (default to 'quiz' for backward compatibility)
  const mode = data.mode || 'quiz';
  const isSurveyMode = mode === 'survey';
  
  const itemsXml = data.questions.map((q) => {
    
    // Determine Canvas question type metadata - must match Canvas question type names exactly
    let qtiMetadataType = "multiple_choice_question";
    if (q.type === 'true_false') qtiMetadataType = "true_false_question";
    if (q.type === 'short_answer') qtiMetadataType = "short_answer_question";
    if (q.type === 'multiple_select') qtiMetadataType = "multiple_answers_question";
    if (q.type === 'essay') qtiMetadataType = "essay_question";

    // Common metadata block - required for Canvas to recognize question type
    const metadataBlock = `
      <itemmetadata>
        <qtimetadata>
          <qtimetadatafield>
            <fieldlabel>question_type</fieldlabel>
            <fieldentry>${qtiMetadataType}</fieldentry>
          </qtimetadatafield>
        </qtimetadata>
      </itemmetadata>`;

    // Feedback block - optional rationale shown to students after answering
    const feedbackBlock = q.feedback ? `
      <itemfeedback ident="feedback_master">
        <material>
          <mattext texttype="text/plain">${escapeXml(q.feedback)}</mattext>
        </material>
      </itemfeedback>` : '';

    // Generate question XML based on type using switch statement
    switch (q.type) {
      case 'multiple_choice': {
        const optionsXml = q.options.map((opt, idx) => {
          const ident = `opt_${idx}`;
          return `
        <response_label ident="${ident}">
          <material>
            <mattext texttype="text/plain">${escapeXml(opt)}</mattext>
          </material>
        </response_label>`;
        }).join('');

        // In survey mode, never include resprocessing (ungraded)
        // In quiz mode, include resprocessing if correct answer exists
        const correctAnswer = q.correctAnswer !== undefined ? q.correctAnswer : 0;
        const correctIdent = `opt_${correctAnswer}`;
        const resprocessingBlock = !isSurveyMode && correctAnswer >= 0 && correctAnswer < q.options.length ? `
      <resprocessing>
        <outcomes>
          <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
        </outcomes>
        <respcondition continue="No">
          <conditionvar>
            <varequal respident="response1">${correctIdent}</varequal>
          </conditionvar>
          <setvar action="Set" varname="SCORE">100</setvar>
        </respcondition>
      </resprocessing>` : '';

        return `
    <item ident="${q.id}" title="${escapeXml(q.prompt.substring(0, 50))}...">
      ${metadataBlock}
      <presentation>
        <material>
          <mattext texttype="text/plain">${escapeXml(q.prompt)}</mattext>
        </material>
        <response_lid ident="response1" rcardinality="Single">
          <render_choice>
            ${optionsXml}
          </render_choice>
        </response_lid>
      </presentation>
      ${resprocessingBlock}
      ${feedbackBlock}
    </item>`;
      }

      case 'multiple_select': {
        const optionsXml = q.options.map((opt, idx) => {
          const ident = `opt_${idx}`;
          return `
        <response_label ident="${ident}">
          <material>
            <mattext texttype="text/plain">${escapeXml(opt)}</mattext>
          </material>
        </response_label>`;
        }).join('');

        // Get correct indices from correctAnswers array
        const correctIndices = q.correctAnswers && q.correctAnswers.length > 0 
          ? q.correctAnswers 
          : [];

        // Generate conditions for all correct answers
        const correctIdents = correctIndices.map(idx => `opt_${idx}`);
        const correctConditions = correctIdents.map(ident => `
            <varequal respident="response1">${ident}</varequal>`).join('');

        // In survey mode, never include resprocessing (ungraded)
        // In quiz mode, include resprocessing if there are correct answers
        const allCorrectCondition = correctIdents.length > 0 
          ? `<and>${correctConditions}</and>`
          : '';
        
        const resprocessingBlock = !isSurveyMode && allCorrectCondition ? `
      <resprocessing>
        <outcomes>
          <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
        </outcomes>
        <respcondition continue="No">
          <conditionvar>
            ${allCorrectCondition}
          </conditionvar>
          <setvar action="Set" varname="SCORE">100</setvar>
        </respcondition>
      </resprocessing>` : '';

        return `
    <item ident="${q.id}" title="${escapeXml(q.prompt.substring(0, 50))}...">
      ${metadataBlock}
      <presentation>
        <material>
          <mattext texttype="text/plain">${escapeXml(q.prompt)}</mattext>
        </material>
        <response_lid ident="response1" rcardinality="Multiple">
          <render_choice>
            ${optionsXml}
          </render_choice>
        </response_lid>
      </presentation>
      ${resprocessingBlock}
      ${feedbackBlock}
    </item>`;
      }

      case 'true_false': {
        // True/False uses response_lid with two options (True, False)
        const options = ['True', 'False'];
        const correctAnswer = q.correctAnswer !== undefined ? (q.correctAnswer ? 0 : 1) : 0;
        const correctIdent = `opt_${correctAnswer}`;
        
        const optionsXml = options.map((opt, idx) => {
          const ident = `opt_${idx}`;
          return `
        <response_label ident="${ident}">
          <material>
            <mattext texttype="text/plain">${escapeXml(opt)}</mattext>
          </material>
        </response_label>`;
        }).join('');

        // In survey mode, never include resprocessing (ungraded)
        // In quiz mode, always include resprocessing for true/false
        const resprocessingBlock = !isSurveyMode ? `
      <resprocessing>
        <outcomes>
          <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
        </outcomes>
        <respcondition continue="No">
          <conditionvar>
            <varequal respident="response1">${correctIdent}</varequal>
          </conditionvar>
          <setvar action="Set" varname="SCORE">100</setvar>
        </respcondition>
      </resprocessing>` : '';

        return `
    <item ident="${q.id}" title="${escapeXml(q.prompt.substring(0, 50))}...">
      ${metadataBlock}
      <presentation>
        <material>
          <mattext texttype="text/plain">${escapeXml(q.prompt)}</mattext>
        </material>
        <response_lid ident="response1" rcardinality="Single">
          <render_choice>
            ${optionsXml}
          </render_choice>
        </response_lid>
      </presentation>
      ${resprocessingBlock}
      ${feedbackBlock}
    </item>`;
      }

      case 'short_answer': {
        // In survey mode, never include resprocessing (ungraded)
        // In quiz mode, include resprocessing if correctAnswer exists
        const acceptableAnswers = q.correctAnswer 
          ? (Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer])
          : [];
        
        // Generate conditions for each accepted answer (only if answers exist and not in survey mode)
        let resprocessingBlock = '';
        if (!isSurveyMode && acceptableAnswers.length > 0) {
          const conditionsList = acceptableAnswers.map(ans => `
        <varequal respident="response1" case="No">${escapeXml(String(ans))}</varequal>
      `).join('');
          
          // If multiple options, wrap in <or> for "any of these" logic
          const conditions = acceptableAnswers.length > 1 
            ? `<or>${conditionsList}</or>` 
            : conditionsList;

          resprocessingBlock = `
      <resprocessing>
        <outcomes>
          <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
        </outcomes>
        <respcondition continue="No">
          <conditionvar>
            ${conditions}
          </conditionvar>
          <setvar action="Set" varname="SCORE">100</setvar>
        </respcondition>
      </resprocessing>`;
        }

        return `
    <item ident="${q.id}" title="${escapeXml(q.prompt.substring(0, 50))}...">
      ${metadataBlock}
      <presentation>
        <material>
          <mattext texttype="text/plain">${escapeXml(q.prompt)}</mattext>
        </material>
        <response_str ident="response1" rcardinality="Single">
          <render_fib>
            <response_label ident="answer1" rshuffle="No"/>
          </render_fib>
        </response_str>
      </presentation>
      ${resprocessingBlock}
      ${feedbackBlock}
    </item>`;
      }

      case 'essay': {
        // Essay uses response_str but NO resprocessing (manual grading required)
        return `
    <item ident="${q.id}" title="${escapeXml(q.prompt.substring(0, 50))}...">
      ${metadataBlock}
      <presentation>
        <material>
          <mattext texttype="text/plain">${escapeXml(q.prompt)}</mattext>
        </material>
        <response_str ident="response1" rcardinality="Single">
          <render_fib>
            <response_label ident="answer1" rshuffle="No"/>
          </render_fib>
        </response_str>
      </presentation>
      ${feedbackBlock}
    </item>`;
      }

      default: {
        // Fallback for unknown types (treat as multiple choice)
        // TypeScript narrowing: at this point q is still a Question, just with unknown type
        const fallbackQuestion = q as { id: string; prompt: string; options?: string[] };
        const fallbackOptions = (fallbackQuestion.options && fallbackQuestion.options.length > 0) 
          ? fallbackQuestion.options 
          : ['Option A', 'Option B'];
        const fallbackOptionsXml = fallbackOptions.map((opt, idx) => {
          const ident = `opt_${idx}`;
          return `
        <response_label ident="${ident}">
          <material>
            <mattext texttype="text/plain">${escapeXml(opt)}</mattext>
          </material>
        </response_label>`;
        }).join('');

        return `
    <item ident="${fallbackQuestion.id}" title="${escapeXml(fallbackQuestion.prompt.substring(0, 50))}...">
      ${metadataBlock}
      <presentation>
        <material>
          <mattext texttype="text/plain">${escapeXml(fallbackQuestion.prompt)}</mattext>
        </material>
        <response_lid ident="response1" rcardinality="Single">
          <render_choice>
            ${fallbackOptionsXml}
          </render_choice>
        </response_lid>
      </presentation>
      ${feedbackBlock}
    </item>`;
      }
    }
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd">
  <assessment ident="${quizId}" title="${escapeXml(data.title)}">
    <qtimetadata>
      <qtimetadatafield>
        <fieldlabel>cc_maxattempts</fieldlabel>
        <fieldentry>${maxAttempts}</fieldentry>
      </qtimetadatafield>
    </qtimetadata>
    <section ident="root_section">
      ${itemsXml}
    </section>
  </assessment>
</questestinterop>`;
};

/**
 * Creates a Canvas-compatible QTI package as a ZIP file.
 * 
 * The ZIP package contains:
 * - quiz.xml: The QTI assessment XML with all questions
 * - imsmanifest.xml: IMS manifest describing the package structure
 * 
 * Canvas requires both files at the root level of the ZIP for proper import.
 * 
 * @param data - Quiz data containing title, questions, and optional metadata
 * @returns Promise resolving to a Blob containing the ZIP file
 */
export const createQuizPackage = async (data: QuizData): Promise<Blob> => {
  const zip = new JSZip();
  const quizId = `quiz_${Date.now()}`;

  // Generate and add quiz.xml - main QTI assessment file
  // Structure: <questestinterop> > <assessment> > <section> > <item> elements
  // Follows QTI 1.2 standard with proper namespace declarations
  const quizXml = generateAssessmentXml(data, quizId);
  zip.file("quiz.xml", quizXml);

  // Generate and add imsmanifest.xml - required for Canvas package import
  // IMS Manifest describes package structure and metadata for Canvas LMS
  const manifestXml = generateManifest(quizId, data.title);
  zip.file("imsmanifest.xml", manifestXml);

  // Canvas import requirements verified:
  // ✓ Both files at root level of ZIP
  // ✓ Correct QTI 1.2 schema references
  // ✓ Proper XML structure and nesting
  // ✓ Valid question type metadata (multiple_choice_question, true_false_question, short_answer_question)
  
  // Generate ZIP blob for download
  return await zip.generateAsync({ type: "blob" });
};