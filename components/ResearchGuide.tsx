import React, { useState } from 'react';
import { researchGuideMenu, researchGuideContent, GuideMenuItem } from '../data/researchGuideData';

interface ResearchGuideProps {
  onSelectGuideTopic: (title: string, content: string) => void;
}

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
);

export const ResearchGuide: React.FC<ResearchGuideProps> = ({ onSelectGuideTopic }) => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelect = (id: string, title: string) => {
    const content = researchGuideContent[id];
    if (content) {
        onSelectGuideTopic(title, content);
    }
  };

  const renderMenuItem = (item: GuideMenuItem, isSubItem = false) => {
    const isOpen = openItems.includes(item.id);

    if (item.subItems) {
      return (
        <div key={item.id}>
          <button 
            onClick={() => toggleItem(item.id)} 
            className="w-full text-left flex justify-between items-center py-2 px-3 text-sm font-semibold text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors my-1"
          >
            <span>{item.title}</span>
            <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                <ChevronRightIcon />
            </span>
          </button>
          {isOpen && (
            <div className="pl-3 my-1 ml-2 border-l-2 border-indigo-200 bg-slate-100 rounded-r-md">
              {item.subItems.map(subItem => renderMenuItem(subItem, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.id} className="py-0.5">
        <button 
          onClick={() => handleSelect(item.id, item.title)} 
          className="w-full text-left py-1.5 px-3 text-sm text-slate-600 hover:bg-indigo-100 hover:text-indigo-800 rounded-md transition-colors"
        >
          {item.title}
        </button>
      </div>
    );
  };

  return (
    <nav className="space-y-1">
      {researchGuideMenu.map(item => renderMenuItem(item))}
    </nav>
  );
};