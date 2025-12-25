import React, { useState } from 'react';
import { QuizSettings, Difficulty, QuestionType } from '../types';
import { Settings, AlignLeft, Sliders, Type as TypeIcon, CheckSquare, List, HelpCircle, ChevronDown, ChevronUp, ClipboardCopy, Info } from 'lucide-react';

interface QuizFormProps {
  onSubmit: (settings: QuizSettings) => void;
  isGenerating: boolean;
}

// Sample input text demonstrating the expected format for pre-formatted questions
const SAMPLE_INPUT = `Question: Who painted the murals in the Hospicio Cabañas?
A. Diego Rivera
B. David Alfaro Siqueiros
C. José Clemente Orozco
D. Rufino Tamayo
Answer: C

Question: What painting technique uses hot wax?
A. Tempera
B. Fresco
C. Encáustica
D. Óleo
Answer: C`;

/**
 * QuizForm Component
 * 
 * Main form component for configuring quiz generation settings.
 * Handles user input for source text, question parameters, and generation options.
 * Supports multiple question types (multiple choice, true/false, short answer).
 */
const QuizForm: React.FC<QuizFormProps> = ({ onSubmit, isGenerating }) => {
  const [sourceText, setSourceText] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Medium);
  const [language, setLanguage] = useState('English');
  const [includeFeedback, setIncludeFeedback] = useState(true);
  const [randomize, setRandomize] = useState(false);
  const [topic, setTopic] = useState('');
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [showFormatHelp, setShowFormatHelp] = useState(false);
  
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    QuestionType.MultipleChoice
  ]);

  const handleTypeToggle = (type: QuestionType) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // Prevent deselecting the last one
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  const handlePasteSample = () => {
    setSourceText(SAMPLE_INPUT);
    // If the sample has 2 questions, let's adjust the count or leave it to user? 
    // Usually better to leave it, but we can set the help to visible to show what happened.
    setShowFormatHelp(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Source text is optional - if empty, we'll generate templates
    
    onSubmit({
      sourceText,
      questionCount,
      difficulty,
      language,
      includeFeedback,
      randomize,
      topic: topic.trim() || "Generated Quiz",
      questionTypes: selectedTypes,
      maxAttempts: maxAttempts > 0 ? maxAttempts : undefined
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <AlignLeft className="w-5 h-5 text-indigo-600" />
          Quiz Configuration
        </h2>
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
          Step 1 of 2
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Source Text Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
            <label htmlFor="sourceText" className="block text-sm font-medium text-slate-700">
              Source Material
            </label>
            <button
              type="button"
              onClick={() => setShowFormatHelp(!showFormatHelp)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              ❓ How should I format my questions?
            </button>
          </div>

          {/* Help Section Accordion */}
          {showFormatHelp && (
            <div className="bg-indigo-50/50 rounded-lg border border-indigo-100 p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <ClipboardCopy className="w-4 h-4" />
                  How to Format Your Questions for Best Results
                </h4>
                <button 
                  type="button" 
                  onClick={() => setShowFormatHelp(false)}
                  className="text-indigo-400 hover:text-indigo-600"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-xs text-indigo-800 mb-3 leading-relaxed">
                <strong>Option 1:</strong> Paste pre-formatted questions in this structure (will be parsed automatically):
              </p>
              
              <ol className="list-decimal list-inside text-xs text-indigo-700 space-y-1 mb-3 pl-1">
                <li>Start each question with <strong>Question:</strong></li>
                <li>Write options on new lines (A. B. C. D.)</li>
                <li>Indicate correct answer with <strong>Answer:</strong></li>
                <li>Separate blocks with a blank line.</li>
              </ol>
              
              <p className="text-xs text-indigo-800 mb-3 leading-relaxed">
                <strong>Option 2:</strong> Leave empty to generate template questions you can customize. No API key required!
              </p>

              <div className="bg-white border border-indigo-100 rounded p-3 text-xs font-mono text-slate-600 mb-3">
                <div className="opacity-50 mb-1">// Example Format</div>
                Question: Who painted the murals in the Hospicio Cabañas?<br/>
                A. Diego Rivera<br/>
                B. David Alfaro Siqueiros<br/>
                C. José Clemente Orozco<br/>
                D. Rufino Tamayo<br/>
                Answer: C
              </div>

              <button
                type="button"
                onClick={handlePasteSample}
                className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5"
              >
                <ClipboardCopy className="w-3 h-3" />
                Paste Sample
              </button>
            </div>
          )}

          <div className="relative">
            <textarea
              id="sourceText"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Option A: Paste pre-formatted questions (Question: ... Answer: C)&#10;Option B: Leave empty to generate template questions you can customize&#10;&#10;No API key required - works offline!"
              className="w-full h-48 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y text-sm leading-relaxed"
              required={false}
            />
            {sourceText.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-slate-400 flex flex-col items-center">
                  <TypeIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">Paste text to begin</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded">
              {sourceText.length} chars
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-500" />
              Parameters
            </h3>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Topic / Title (Optional)</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. History of Mexico"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Number of Questions: <span className="text-indigo-600 font-bold">{questionCount}</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1</span>
                <span>50</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Object.values(Difficulty).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Portuguese">Portuguese</option>
                </select>
              </div>
            </div>
            
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-600 mb-2">Question Types</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(QuestionType.MultipleChoice)}
                    onChange={() => handleTypeToggle(QuestionType.MultipleChoice)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <List className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700">Multiple Choice</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(QuestionType.TrueFalse)}
                    onChange={() => handleTypeToggle(QuestionType.TrueFalse)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <CheckSquare className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700">True / False</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(QuestionType.ShortAnswer)}
                    onChange={() => handleTypeToggle(QuestionType.ShortAnswer)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700">Short Answer (Fill-in-Blank)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              Advanced Options
            </h3>
            
            <div className="p-4 bg-slate-50 rounded-lg space-y-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Detailed Feedback</span>
                  <span className="text-xs text-slate-500">Add rationale for answers</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={includeFeedback}
                    onChange={(e) => setIncludeFeedback(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Randomize Choices</span>
                  <span className="text-xs text-slate-500">Shuffle answer order</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={randomize}
                    onChange={(e) => setRandomize(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Max Attempts: <span className="text-indigo-600 font-bold">{maxAttempts === 0 ? 'Unlimited' : maxAttempts}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Unlimited (0)</span>
                  <span>10</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Set maximum quiz attempts allowed. 0 = unlimited.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isGenerating || !sourceText.trim()}
            className={`
              px-8 py-3 rounded-lg text-white font-medium shadow-lg transition-all
              ${isGenerating || !sourceText.trim() 
                ? 'bg-slate-400 cursor-not-allowed opacity-70' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30 transform hover:-translate-y-0.5'}
            `}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Quiz...
              </div>
            ) : (
              'Generate Quiz'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizForm;