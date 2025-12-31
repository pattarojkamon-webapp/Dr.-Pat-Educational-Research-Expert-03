import React from 'react';
import type { Conversation, Theme } from '../types';
import { ResearchGuide } from './ResearchGuide';

interface ConversationHistoryProps {
  conversations: Conversation[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onSelectGuideTopic: (title: string, content: string) => void;
  theme: Theme;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversations,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isOpen,
  onToggle,
  onSelectGuideTopic,
  theme,
}) => {
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบการสนทนานี้?')) {
      onDeleteChat(id);
    }
  };

  // Determine styles based on theme
  const getThemeStyles = () => {
    switch (theme) {
      case 'pink':
        return {
          btn: 'bg-pink-600 hover:bg-pink-700',
          activeChat: 'bg-pink-100 text-pink-900',
        };
      case 'purple':
        return {
          btn: 'bg-purple-600 hover:bg-purple-700',
          activeChat: 'bg-purple-100 text-purple-900',
        };
      case 'red':
        return {
          btn: 'bg-red-600 hover:bg-red-700',
          activeChat: 'bg-red-100 text-red-900',
        };
      default: // blue
        return {
          btn: 'bg-indigo-600 hover:bg-indigo-700',
          activeChat: 'bg-indigo-100 text-indigo-900',
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <>
      <div className={`fixed inset-0 bg-black/30 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onToggle}></div>
      <aside className={`absolute md:relative z-40 h-full bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} w-80 shrink-0`}>
        <div className="p-3 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-lg text-slate-700">เมนู</h2>
          <button onClick={onNewChat} className={`flex items-center gap-2 text-sm text-white px-3 py-1.5 rounded-md transition-colors ${themeStyles.btn}`} title="New Chat">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span>แชทใหม่</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 border-b border-slate-200">
            <h3 className="font-semibold text-md text-slate-700 mb-2">คู่มือการวิจัย</h3>
            <ResearchGuide onSelectGuideTopic={onSelectGuideTopic} />
          </div>
          
          <div className="p-3">
             <h3 className="font-semibold text-md text-slate-700 mb-2">ประวัติการสนทนา</h3>
          </div>
          {conversations.length > 0 ? (
            <ul className="px-2 pb-2 space-y-1">
              {conversations.slice().sort((a,b) => b.createdAt - a.createdAt).map((conv) => (
                <li key={conv.id}>
                  <button
                    onClick={() => onSelectChat(conv.id)}
                    className={`w-full text-left p-2.5 rounded-md transition-colors group flex justify-between items-start gap-2 ${activeChatId === conv.id ? themeStyles.activeChat : 'hover:bg-slate-200 text-slate-700'}`}
                  >
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium text-sm truncate">{conv.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(conv.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={(e) => handleDelete(e, conv.id)} className="p-1 rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" title="Delete Chat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 text-sm text-slate-500">ยังไม่มีการสนทนา</p>
          )}

        </div>
      </aside>
    </>
  );
};