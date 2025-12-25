import React, { useState } from 'react';
import { X, HelpCircle, Upload, CheckCircle, ExternalLink, Copy, AlertOctagon } from 'lucide-react';

interface ImportInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportInstructions: React.FC<ImportInstructionsProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const steps = [
    { title: "Go to your Canvas Course", desc: "Log in to Canvas and open the course where you want to import the quiz." },
    { title: "Navigate to Course Settings", desc: "Scroll down in the left-hand menu and click on Settings." },
    { title: "Click \"Import Course Content\"", desc: "You'll find this button on the right side of the page." },
    { title: "Set the Content Type", desc: "In the dropdown menu, choose: QTI .zip file" },
    { title: "Upload Your File", desc: "Click Choose File and select the .zip file you downloaded from this app." },
    { title: "(Optional) Create a Question Bank", desc: "Check the box if you want to store the questions in a specific question bank." },
    { title: "Click \"Import\"", desc: "Canvas will process the file. Once complete, you'll see a confirmation." },
    { title: "Go to the Quizzes Tab", desc: "Locate your newly imported quiz. Review and edit it as needed: Update the title, instructions, points, or settings. Use Preview to see how students will view it." },
    { title: "Click \"Publish\"", desc: "When you're ready, publish the quiz to make it available to students." }
  ];

  const handleCopy = () => {
    const text = `How to Import This Quiz into Canvas\n\n` + 
      steps.map((s, i) => `${i+1}. ${s.title}\n${s.desc}`).join('\n\n') + 
      `\n\nWARNING: Only upload files in .zip QTI format. Do not unzip before importing into Canvas.`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
       <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
       <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
             <div className="flex items-center gap-2 text-indigo-800">
                <Upload className="w-5 h-5" />
                <h2 className="text-lg font-bold">How to Import to Canvas</h2>
             </div>
             <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
             </button>
          </div>
          
          {/* Body */}
          <div className="overflow-y-auto p-6 space-y-6">
             <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
               <AlertOctagon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
               <div className="text-sm text-amber-800">
                 <strong>Important:</strong> Only upload files in <strong>.zip QTI format</strong>. Do not unzip the file before importing into Canvas.
               </div>
             </div>

             <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Step-by-Step Instructions
                </h3>
                <div className="space-y-4 pl-2 border-l-2 border-slate-100 ml-2">
                   {steps.map((step, i) => (
                      <div key={i} className="pl-4 relative">
                         <span className="absolute -left-[21px] top-0 w-5 h-5 rounded-full bg-indigo-100 border-2 border-white text-[10px] font-bold text-indigo-600 flex items-center justify-center">
                           {i + 1}
                         </span>
                         <h4 className="font-semibold text-slate-800 text-sm">{step.title}</h4>
                         <p className="text-sm text-slate-600 leading-relaxed mt-1">{step.desc}</p>
                      </div>
                   ))}
                </div>
             </div>
             
             <div className="pt-6 border-t border-slate-100">
               <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm">
                 <HelpCircle className="w-4 h-4 text-slate-400" /> Need Help?
               </h4>
               <p className="text-sm text-slate-600">
                 For more details, see Canvas's official documentation:<br/>
                 <a 
                   href="https://community.canvaslms.com/t5/Instructor-Guide/How-do-I-import-quizzes-from-QTI-packages/ta-p/1046" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline inline-flex items-center gap-1 mt-1"
                 >
                   👉 How do I import quizzes from QTI packages?
                   <ExternalLink className="w-3 h-3" />
                 </a>
               </p>
             </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
             <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
             >
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Instructions'}
             </button>
             <button 
                onClick={onClose}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm"
             >
                Done
             </button>
          </div>
       </div>
    </div>
  );
};

export default ImportInstructions;