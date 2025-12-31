import React from 'react';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
}

const QuestionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ questions, onSelectQuestion }) => {
  return (
    <div className="w-full animate-fadeInUp">
      <p className="text-md font-semibold text-slate-700 mb-4">คำถามที่น่าสนใจต่อไป:</p>
      <div className="grid grid-cols-1 gap-3">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(question)}
            className="w-full text-left p-4 bg-white/80 border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex items-center group backdrop-blur-sm"
          >
            <QuestionIcon />
            <span className="text-slate-800 group-hover:text-indigo-700 font-medium">{question}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
