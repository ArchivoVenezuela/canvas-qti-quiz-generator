import React from 'react';
import { X, BookOpen, AlertTriangle, Mail, CheckCircle } from 'lucide-react';

interface DocumentationProps {
  isOpen: boolean;
  onClose: () => void;
}

const Documentation: React.FC<DocumentationProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-indigo-700">
            <BookOpen className="w-5 h-5" />
            <h2 className="text-lg font-bold">About This App</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8 text-sm text-slate-600 leading-relaxed">
          
          {/* Metadata */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1">
             <h3 className="font-bold text-slate-900 text-base">Text-to-QTI Quiz Generator for Canvas</h3>
             <p className="font-medium">Created by Prof. Patricia Valladares</p>
             <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
               License: CC BY-NC-SA 4.0 © 2026 Patricia Valladares<br/>
               Version 1.0 • Last Updated: 2026
             </p>
          </div>

          <p>
            This tool automatically transforms any instructional text (lecture notes, readings, articles, etc.) into Canvas-compatible multiple-choice, true/false, and short answer quizzes in QTI 1.2 format. It helps educators save time while ensuring pedagogical accuracy and Canvas importability.
          </p>

          {/* How to Use */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">📥</span>
              How to Use This App in 3 Steps
            </h3>
            
            <div className="space-y-6 pl-2">
              <div className="border-l-2 border-indigo-100 pl-4 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-100 border-2 border-white"></div>
                <h4 className="font-bold text-slate-800 mb-2">Step 1: Generate a Quiz</h4>
                <ul className="list-disc list-inside space-y-1 ml-1 marker:text-indigo-300">
                  <li>Copy and paste any educational text into the input box.</li>
                  <li>Choose settings: Number of questions, Difficulty, Language.</li>
                  <li>Click <strong>"Generate Quiz"</strong>.</li>
                  <li>Download as <strong>QTI .zip package</strong> (recommended).</li>
                </ul>
              </div>

              <div className="border-l-2 border-indigo-100 pl-4 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-100 border-2 border-white"></div>
                <h4 className="font-bold text-slate-800 mb-2">Step 2: Import into Canvas</h4>
                <ol className="list-decimal list-inside space-y-1 ml-1 marker:text-indigo-600 font-medium">
                  <li><span className="font-normal">Open your Canvas Course & go to <strong>Settings</strong>.</span></li>
                  <li><span className="font-normal">Click <strong>Import Course Content</strong>.</span></li>
                  <li><span className="font-normal">Select Content Type: <strong>QTI .zip file</strong>.</span></li>
                  <li><span className="font-normal">Upload the file you downloaded.</span></li>
                  <li><span className="font-normal">Click Import and wait for the green checkmark <span className="inline-flex align-middle"><CheckCircle className="w-3 h-3 text-green-500" /></span>.</span></li>
                </ol>
                <p className="mt-2 text-xs bg-indigo-50 text-indigo-700 p-2 rounded">
                  🔁 The imported quiz will appear under your “Quizzes” tab or “Question Banks” section.
                </p>
              </div>
            </div>
          </div>

          {/* Notes & Warnings */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
               <h4 className="font-bold text-green-800 mb-2 text-xs uppercase tracking-wide">🧪 Notes for Best Results</h4>
               <ul className="space-y-1 text-xs text-green-700">
                 <li className="flex items-start gap-1.5"><span className="mt-0.5">•</span> Compatible with IMS QTI 1.2 (Canvas Standard).</li>
                 <li className="flex items-start gap-1.5"><span className="mt-0.5">•</span> Each question has 1 correct answer.</li>
                 <li className="flex items-start gap-1.5"><span className="mt-0.5">•</span> Configure randomization in Canvas after import.</li>
               </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
               <h4 className="font-bold text-amber-800 mb-2 text-xs uppercase tracking-wide flex items-center gap-1">
                 <AlertTriangle className="w-3 h-3" /> Limitations
               </h4>
               <ul className="space-y-1 text-xs text-amber-700">
                 <li className="flex items-start gap-1.5"><span className="mt-0.5">•</span> Do not edit QTI files manually.</li>
                 <li className="flex items-start gap-1.5"><span className="mt-0.5">•</span> Canvas does not support embedded media in QTI import by default.</li>
                 <li className="flex items-start gap-1.5"><span className="mt-0.5">•</span> <strong>Always review AI-generated questions.</strong></li>
               </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="pt-6 border-t border-slate-100">
             <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
               <Mail className="w-4 h-4 text-slate-400" /> Contact / Support
             </h4>
             <p>For feedback or questions, contact: <a href="mailto:patricia.valladares.uc@gmail.com" className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline">patricia.valladares.uc@gmail.com</a></p>
          </div>

        </div>
        
        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Documentation;