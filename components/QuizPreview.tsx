import React, { useState } from 'react';
import { QuizData, QuestionType } from '../types';
import { Download, CheckCircle, RefreshCcw, FileText, CheckSquare, List, HelpCircle } from 'lucide-react';
import { createQuizPackage } from '../services/qtiGenerator';
import ImportInstructions from './ImportInstructions';

interface QuizPreviewProps {
  quizData: QuizData;
  onReset: () => void;
}

/**
 * QuizPreview Component
 * 
 * Displays the generated quiz questions and provides download functionality.
 * Shows a formatted preview of all questions with their correct answers highlighted,
 * and allows users to download the quiz as a Canvas-compatible QTI ZIP package.
 */
const QuizPreview: React.FC<QuizPreviewProps> = ({ quizData, onReset }) => {
  const [downloading, setDownloading] = useState(false);
  const [showImportHelp, setShowImportHelp] = useState(false);

  /**
   * Handles the download of the quiz as a QTI ZIP package.
   * Creates the ZIP file using the QTI generator service and triggers browser download.
   */
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const zipBlob = await createQuizPackage(quizData);
      const fileName = `${quizData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_canvas_quiz.zip`;
      
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Optionally show import help after download starts
      setTimeout(() => setShowImportHelp(true), 1500);
    } catch (e) {
      console.error("Download failed", e);
      alert("Failed to generate download package. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const getIconForType = (type: QuestionType) => {
    switch (type) {
      case QuestionType.MultipleChoice: return <List className="w-3 h-3" />;
      case QuestionType.TrueFalse: return <CheckSquare className="w-3 h-3" />;
      case QuestionType.ShortAnswer: return <HelpCircle className="w-3 h-3" />;
      default: return <List className="w-3 h-3" />;
    }
  };

  const getLabelForType = (type: QuestionType) => {
    switch (type) {
      case QuestionType.MultipleChoice: return "Multiple Choice";
      case QuestionType.TrueFalse: return "True / False";
      case QuestionType.ShortAnswer: return "Short Answer";
      default: return "Question";
    }
  };

  return (
    <div className="space-y-6">
      <ImportInstructions isOpen={showImportHelp} onClose={() => setShowImportHelp(false)} />
      
      {/* Header Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">{quizData.title}</h2>
          <p className="text-slate-500 text-sm mt-1">{quizData.questions.length} Questions Generated</p>
          <div className="mt-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-1 inline-block">
            💡 <strong>Note:</strong> These are editable template questions. Review and customize before exporting to Canvas.
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            <RefreshCcw className="w-4 h-4" />
            Start Over
          </button>
          
          <button
            onClick={() => setShowImportHelp(true)}
            className="flex items-center gap-2 px-4 py-2 text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
          >
            <HelpCircle className="w-4 h-4" />
            How to Import?
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all text-sm font-medium disabled:opacity-70"
          >
            {downloading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download QTI ZIP
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="grid gap-6">
        {quizData.questions.map((q, qIdx) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                {qIdx + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600 uppercase tracking-wide">
                    {getIconForType(q.type)}
                    {getLabelForType(q.type)}
                  </span>
                </div>
                <h3 className="text-slate-800 font-medium leading-relaxed">{q.stem}</h3>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              {q.type === QuestionType.ShortAnswer ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Acceptable Answers:</p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((ans, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                        {ans}
                        <CheckCircle className="w-3 h-3 ml-1.5 text-green-500" />
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                // Multiple Choice and True/False rendering
                q.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === q.correctIndex;
                  return (
                    <div 
                      key={oIdx}
                      className={`
                        relative p-3 rounded-lg border flex items-center gap-3 text-sm
                        ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}
                      `}
                    >
                      <div className={`
                        w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold
                        ${isCorrect ? 'border-green-500 text-green-600 bg-white' : 'border-slate-300 text-slate-400'}
                      `}>
                        {String.fromCharCode(65 + oIdx)}
                      </div>
                      <span className={isCorrect ? 'text-green-800 font-medium' : 'text-slate-600'}>
                        {opt}
                      </span>
                      {isCorrect && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                    </div>
                  );
                })
              )}
            </div>

            {q.feedback && (
              <div className="px-4 py-3 bg-indigo-50/50 border-t border-indigo-50 text-xs text-indigo-800 flex items-start gap-2">
                <FileText className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p><span className="font-semibold">Rationale:</span> {q.feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizPreview;