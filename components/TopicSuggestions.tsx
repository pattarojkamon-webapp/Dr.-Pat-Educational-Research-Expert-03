import React from 'react';

interface TopicSuggestionsProps {
  topics: string[];
  onSelectTopic: (topic: string) => void;
}

const TopicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

export const TopicSuggestions: React.FC<TopicSuggestionsProps> = ({ topics, onSelectTopic }) => {
  return (
    <div className="w-full animate-fadeInUp">
      <p className="text-md font-semibold text-slate-700 mb-4">หรือเริ่มต้นสำรวจหัวข้อเหล่านี้:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {topics.map((topic, index) => (
          <button
            key={index}
            onClick={() => onSelectTopic(topic)}
            className="w-full text-left p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex items-center group"
          >
            <TopicIcon />
            <span className="text-slate-800 group-hover:text-indigo-700 font-medium">{topic}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
