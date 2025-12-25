import React, { useState } from 'react';
import { QuizData, QuizSettings, AppStatus } from './types';
import { generateQuiz } from './services/quizService';
import QuizForm from './components/QuizForm';
import QuizPreview from './components/QuizPreview';
import Documentation from './components/Documentation';
import { GraduationCap, BookOpen, FileCode } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  const handleGenerate = async (settings: QuizSettings) => {
    setStatus('generating');
    setErrorMsg(null);
    try {
      // Generate quiz using unified service (core + optional AI)
      const data = await generateQuiz(settings);
      // Remove metadata before storing (clean QuizData)
      const { _meta, ...cleanData } = data as any;
      setQuizData(cleanData);
      setStatus('review');
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "An unexpected error occurred.");
      setStatus('error');
    }
  };

  const resetApp = () => {
    setStatus('idle');
    setQuizData(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Documentation isOpen={showDocs} onClose={() => setShowDocs(false)} />
      
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetApp}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Canvas<span className="text-indigo-600">QTI</span>
            </h1>
          </div>
          <button 
            onClick={() => setShowDocs(true)}
            className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 px-3 py-2 rounded-md hover:bg-slate-50"
          >
            <BookOpen className="w-3 h-3" />
            Documentation
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        
        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
            <span>Error: {errorMsg}</span>
            <button onClick={resetApp} className="text-red-800 font-medium underline">Try Again</button>
          </div>
        )}

        {status === 'idle' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900">Turn Text into Quizzes in Seconds</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Paste pre-formatted questions or source material below. Generate Canvas-compatible QTI quizzes 
                instantly—works with or without AI enhancement.
              </p>
              <div className="mt-4 inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <p className="text-sm text-blue-800">
                  ✨ <strong>No API key required</strong> — Core functionality works offline. AI enhancement is optional.
                </p>
              </div>
            </div>
            <QuizForm onSubmit={handleGenerate} isGenerating={false} />
          </div>
        )}

        {status === 'generating' && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="relative w-24 h-24 mb-8">
               <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
               <FileCode className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800">Analyzing Content...</h3>
            <p className="text-slate-500 mt-2 max-w-md text-center">
              We are extracting key concepts and formulating distractors. This usually takes about 10-20 seconds.
            </p>
          </div>
        )}

        {status === 'review' && quizData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <QuizPreview quizData={quizData} onReset={resetApp} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-2">
          <p className="text-slate-400 text-sm">
            Formats compliant with IMS QTI 1.2 • Designed for institutional deployment
          </p>
          <p className="text-slate-500 text-xs">
            Created by Prof. Patricia Valladares © {new Date().getFullYear()} — For Canvas QTI Quiz Generation
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;