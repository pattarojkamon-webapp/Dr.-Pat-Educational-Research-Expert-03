import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Content, Part } from '@google/genai';
import type { ChatMessageType, Conversation, Language, Theme } from './types';
import { streamDrPatResponse } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { TopicSuggestions } from './components/TopicSuggestions';
import { ConversationHistory } from './components/ConversationHistory';
import { SuggestedQuestions } from './components/SuggestedQuestions';
import { parseResponse } from './utils/parser';

const INITIAL_MESSAGE_TH: ChatMessageType = {
    role: 'model',
    text: 'สวัสดีครับ ผม **Dr.Pat** ท่านอยากรู้เรื่องวิจัยทางการบริหารการศึกษาใช่ไหมครับ อยากรู้อะไรสอบถามมาได้เลยครับ หรือเลือกดูหัวข้อจาก "คู่มือการวิจัย" ด้านซ้ายได้เลยครับ'
};

const INITIAL_MESSAGE_EN: ChatMessageType = {
    role: 'model',
    text: 'Hello, I am **Dr.Pat**. Are you interested in educational administration research? Feel free to ask me anything, or browse the "Research Guide" on the left.'
};

const INITIAL_MESSAGE_ZH: ChatMessageType = {
    role: 'model',
    text: '您好，我是 **Dr.Pat**。您对教育管理研究感兴趣吗？请随时提问，或者查看左侧的“研究指南”。'
};

// UI Translations
const UI_TEXT = {
    th: {
        title: 'Dr.Pat',
        subtitle: 'Educational Research Specialist',
        placeholder: 'สอบถาม Dr.Pat ได้ที่นี่...',
        newChat: 'แชทใหม่',
        export: 'Export to PDF',
        attach: 'แนบไฟล์',
        send: 'ส่งข้อความ',
        history: 'ประวัติการสนทนา',
        guide: 'คู่มือการวิจัย',
        error: 'ขออภัยครับ เกิดข้อผิดพลาด: ',
        processing: 'กำลังประมวลผล...',
        files: 'ไฟล์แนบ:',
        clear: 'ล้างประวัติ'
    },
    en: {
        title: 'Dr.Pat',
        subtitle: 'Educational Research Specialist',
        placeholder: 'Ask Dr.Pat anything here...',
        newChat: 'New Chat',
        export: 'Export to PDF',
        attach: 'Attach files',
        send: 'Send',
        history: 'History',
        guide: 'Research Guide',
        error: 'Sorry, an error occurred: ',
        processing: 'Processing...',
        files: 'Attachments:',
        clear: 'Clear History'
    },
    zh: {
        title: 'Dr.Pat',
        subtitle: '教育研究专家',
        placeholder: '在这里询问 Dr.Pat...',
        newChat: '新对话',
        export: '导出 PDF',
        attach: '附加文件',
        send: '发送',
        history: '历史记录',
        guide: '研究指南',
        error: '抱歉，发生了error：',
        processing: '处理中...',
        files: '附件：',
        clear: '清除历史'
    }
};

const SUGGESTED_TOPICS = [
    'หัวข้อวิจัยบริหารการศึกษาที่ทันสมัย',
    'แนวคิด "ภาวะผู้นำดิจิทัล" ในสถานศึกษา',
    'เทคนิคการกำหนดขนาดกลุ่มตัวอย่าง (Sample Size)',
    'การตรวจสอบคุณภาพเครื่องมือวิจัย (IOC & Reliability)',
    'สถิติที่เหมาะสมสำหรับการเปรียบเทียบผลสัมฤทธิ์',
    'แนวทางการเขียนอภิปรายผลให้สอดคล้องกับทฤษฎี',
];

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
};

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(window.innerWidth > 1024);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  
  // New State for Settings
  const [language, setLanguage] = useState<Language>('th');
  const [theme, setTheme] = useState<Theme>('blue');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConversation = conversations.find(c => c.id === activeChatId);
  const messages = activeConversation?.messages ?? [];

  // Initial Message based on Language
  const getInitialMessage = (lang: Language) => {
      if (lang === 'en') return INITIAL_MESSAGE_EN;
      if (lang === 'zh') return INITIAL_MESSAGE_ZH;
      return INITIAL_MESSAGE_TH;
  };

  useEffect(() => {
    const handleResize = () => setIsHistoryPanelOpen(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const createNewChat = () => {
    const newChat: Conversation = {
        id: Date.now().toString() + Math.random().toString(),
        title: language === 'th' ? 'การสนทนาใหม่' : (language === 'en' ? 'New Chat' : '新对话'),
        createdAt: Date.now(),
        messages: [getInitialMessage(language)],
    };
    setConversations(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setSuggestedQuestions([]);
    return newChat.id;
  };

  // Load from LocalStorage only once on mount
  useEffect(() => {
    try {
        const savedData = localStorage.getItem('drPatConversations');
        const lastActiveId = localStorage.getItem('drPatLastActiveId');
        
        if (savedData) {
            const parsedData = JSON.parse(savedData) as Conversation[];
            if (Array.isArray(parsedData) && parsedData.length > 0) {
                setConversations(parsedData);
                const chatExists = parsedData.some(c => c.id === lastActiveId);
                setActiveChatId(lastActiveId && chatExists ? lastActiveId : parsedData[0].id);
            } else {
                createNewChat();
            }
        } else {
            createNewChat();
        }
        
        const savedLang = localStorage.getItem('drPatLanguage') as Language;
        if (savedLang) setLanguage(savedLang);
        
        const savedTheme = localStorage.getItem('drPatTheme') as Theme;
        if (savedTheme) setTheme(savedTheme);
        
    } catch(e) { 
        console.error("Failed to load from storage", e); 
        createNewChat(); 
    }
  }, []);

  // Sync to LocalStorage whenever state changes
  useEffect(() => {
    if (conversations.length > 0) {
        localStorage.setItem('drPatConversations', JSON.stringify(conversations));
    } else {
        localStorage.removeItem('drPatConversations');
    }
  }, [conversations]);

  useEffect(() => {
    if (activeChatId) {
        localStorage.setItem('drPatLastActiveId', activeChatId);
    }
  }, [activeChatId]);

  useEffect(() => {
    localStorage.setItem('drPatLanguage', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('drPatTheme', theme);
  }, [theme]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, suggestedQuestions, isLoading]);
  
  const updateConversationMessages = (chatId: string, messages: ChatMessageType[] | ((prev: ChatMessageType[]) => ChatMessageType[])) => {
    setConversations(prev => prev.map(c => c.id === chatId ? { ...c, messages: typeof messages === 'function' ? messages(c.messages) : messages } : c));
  };

  const sendMessage = async (prompt: string, files: File[] = []) => {
    if ((!prompt.trim() && files.length === 0) || isLoading) return;
    
    let currentChatId = activeChatId;
    let currentConversation = activeConversation;

    if (!currentChatId || !currentConversation || (currentConversation.messages.length > 1 && prompt.trim() && !activeChatId)) {
        currentChatId = createNewChat();
        currentConversation = {
            id: currentChatId,
            title: UI_TEXT[language].newChat,
            createdAt: Date.now(),
            messages: [getInitialMessage(language)],
        };
    }
    
    setIsLoading(true);
    setError(null);
    setSuggestedQuestions([]);

    const userMessage: ChatMessageType = { role: 'user', text: prompt };
    
    if (currentConversation && currentConversation.messages.length === 1) {
        const newTitle = prompt.trim() ? prompt.substring(0, 40) : (files.length > 0 ? files[0].name.substring(0, 40) : UI_TEXT[language].newChat);
        setConversations(prev => prev.map(c => c.id === currentChatId ? { ...c, title: newTitle } : c));
    }
    
    if (currentChatId) {
        updateConversationMessages(currentChatId, prev => [...prev, userMessage]);
    }
    
    try {
      if (!currentConversation) return;
      const historyForApi: Content[] = currentConversation.messages
        .slice(1)
        .filter(msg => msg.role === 'user' || msg.role === 'model')
        .map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));

      const userParts: Part[] = [];
      if (prompt.trim()) {
          userParts.push({ text: prompt });
      }
      for (const file of files) {
          const base64Data = await fileToBase64(file);
          userParts.push({
              inlineData: {
                  mimeType: file.type,
                  data: base64Data,
              }
          });
      }
      historyForApi.push({ role: 'user', parts: userParts });
      
      // Add placeholder for streaming
      if (currentChatId) {
          updateConversationMessages(currentChatId, prev => [...prev, { role: 'model', text: '...' }]);
      }
      
      const stream = await streamDrPatResponse(historyForApi, language);

      let botResponseText = '';
      
      for await (const chunk of stream) {
        botResponseText += chunk.text;
        if (currentChatId) {
            updateConversationMessages(currentChatId, prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', text: botResponseText };
                return newMessages;
            });
        }
      }

      const { content, suggestions } = parseResponse(botResponseText);
      if (currentChatId) {
          updateConversationMessages(currentChatId, prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { role: 'model', text: content };
              return newMessages;
          });
      }
      setSuggestedQuestions(suggestions);

    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`${UI_TEXT[language].error}${errorMessage}`);
      if (currentChatId) {
          updateConversationMessages(currentChatId, prev => {
               const msgs = [...prev];
               if (msgs[msgs.length - 1].text === '...') msgs.pop();
               return [...msgs, { role: 'model', text: `${UI_TEXT[language].error} ${errorMessage}` }];
          });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage(userInput, stagedFiles);
    setUserInput('');
    setStagedFiles([]);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleSelectTopic = async (topic: string) => {
    await sendMessage(topic);
    setUserInput('');
    setStagedFiles([]);
  };

  const handleSelectGuideTopic = (title: string, fullContent: string) => {
    let currentId = activeChatId;
    
    // If no chat is active, create a new one first
    if (!currentId) {
        currentId = createNewChat();
    }
    
    // Parse the guide content for suggestions
    const { content, suggestions } = parseResponse(fullContent);

    // Add as a continuous message in the existing chat
    updateConversationMessages(currentId, prev => [
        ...prev,
        { role: 'user', text: `ดูหัวข้อ: ${title}` },
        { role: 'model', text: content }
    ]);

    setSuggestedQuestions(suggestions);
    setError(null);

    if (window.innerWidth <= 1024) {
      setIsHistoryPanelOpen(false);
    }
  };

  const handleDeleteChat = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
        const remainingChats = conversations.filter(c => c.id !== id);
        if (remainingChats.length > 0) {
            setActiveChatId(remainingChats[0].id);
        } else {
            setActiveChatId(null);
            createNewChat();
        }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('คุณต้องการลบประวัติการสนทนาทั้งหมดหรือไม่?')) {
        setConversations([]);
        setActiveChatId(null);
        localStorage.removeItem('drPatConversations');
        localStorage.removeItem('drPatLastActiveId');
        createNewChat();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setStagedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeStagedFile = (indexToRemove: number) => {
    setStagedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleExportPDF = () => {
    window.print();
  };

  const isActionDisabled = isLoading;

  // Theme classes logic
  const getThemeClasses = () => {
      switch(theme) {
          case 'pink':
              return {
                  bg: 'bg-pink-50',
                  header: 'bg-white/80 backdrop-blur-md border-pink-100',
                  title: 'text-pink-800',
                  subtitle: 'text-pink-600',
                  main: 'bg-pink-50/50',
                  inputRing: 'focus:ring-pink-500',
                  sendBtn: 'bg-pink-600 hover:bg-pink-700',
                  stagedFiles: 'bg-white border-pink-100 text-slate-700',
                  fileTag: 'bg-pink-50 text-pink-800 border-pink-100',
              };
          case 'purple':
              return {
                  bg: 'bg-purple-50',
                  header: 'bg-white/80 backdrop-blur-md border-purple-100',
                  title: 'text-purple-800',
                  subtitle: 'text-purple-600',
                  main: 'bg-purple-50/50',
                  inputRing: 'focus:ring-purple-500',
                  sendBtn: 'bg-purple-600 hover:bg-purple-700',
                  stagedFiles: 'bg-white border-purple-100 text-slate-700',
                  fileTag: 'bg-purple-50 text-purple-800 border-purple-100',
              };
          case 'red':
              return {
                  bg: 'bg-red-50',
                  header: 'bg-white/80 backdrop-blur-md border-red-100',
                  title: 'text-red-800',
                  subtitle: 'text-red-600',
                  main: 'bg-red-50/50',
                  inputRing: 'focus:ring-red-500',
                  sendBtn: 'bg-red-600 hover:bg-red-700',
                  stagedFiles: 'bg-white border-red-100 text-slate-700',
                  fileTag: 'bg-red-50 text-red-800 border-red-100',
              };
          default: // blue
              return {
                  bg: 'bg-slate-50',
                  header: 'bg-white/80 backdrop-blur-md border-indigo-100',
                  title: 'text-indigo-800',
                  subtitle: 'text-indigo-600',
                  main: 'bg-slate-100/50',
                  inputRing: 'focus:ring-indigo-500',
                  sendBtn: 'bg-indigo-600 hover:bg-indigo-700',
                  stagedFiles: 'bg-slate-50 border-slate-200 text-slate-700',
                  fileTag: 'bg-white border shadow-sm text-slate-700',
              };
      }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`flex h-screen font-sans overflow-hidden ${themeClasses.bg}`}>
        <div className="no-print">
            <ConversationHistory 
              conversations={conversations} 
              activeChatId={activeChatId} 
              onSelectChat={(id) => {setActiveChatId(id); setSuggestedQuestions([]);}} 
              onNewChat={createNewChat} 
              onDeleteChat={handleDeleteChat} 
              isOpen={isHistoryPanelOpen} 
              onToggle={() => setIsHistoryPanelOpen(o => !o)}
              onSelectGuideTopic={handleSelectGuideTopic}
              theme={theme}
            />
        </div>
        <div className="flex flex-col flex-1 h-screen min-w-0 relative">
            {/* Header */}
            <header className={`p-4 shadow-sm flex flex-col sm:flex-row justify-center items-center z-20 border-b transition-colors duration-300 no-print ${themeClasses.header}`}>
                <div className="w-full lg:max-w-[85%] xl:max-w-[75%] flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsHistoryPanelOpen(o => !o)} className="lg:hidden p-2 text-slate-500 rounded-lg hover:bg-black/5 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                            <div className="relative">
                                <img src="https://i.postimg.cc/FRwPCtyb/Dr-Pattaroj-V-2.png" alt="Dr. Pat Profile" className="h-12 w-12 rounded-full object-cover ring-2 ring-offset-2 ring-indigo-100 shadow-sm" />
                                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-400"></span>
                            </div>
                            <div className="flex flex-col">
                                <h1 className={`text-xl font-bold tracking-tight ${themeClasses.title}`}>{UI_TEXT[language].title}</h1>
                                <span className={`text-sm font-medium ${themeClasses.subtitle}`}>{UI_TEXT[language].subtitle}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto justify-end">
                        {/* Language Toggle */}
                        <div className="flex bg-black/5 p-1 rounded-lg">
                            {(['th', 'en', 'zh'] as Language[]).map(lang => (
                                <button 
                                    key={lang}
                                    onClick={() => setLanguage(lang)}
                                    className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${language === lang ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* Theme Toggle */}
                        <div className="flex gap-1 ml-2">
                            <button onClick={() => setTheme('blue')} className={`w-6 h-6 rounded-full bg-indigo-500 border-2 ${theme === 'blue' ? 'border-white ring-2 ring-indigo-300' : 'border-transparent opacity-50 hover:opacity-100'}`} title="Blue Theme"></button>
                            <button onClick={() => setTheme('pink')} className={`w-6 h-6 rounded-full bg-pink-500 border-2 ${theme === 'pink' ? 'border-white ring-2 ring-pink-300' : 'border-transparent opacity-50 hover:opacity-100'}`} title="Pink Theme"></button>
                            <button onClick={() => setTheme('purple')} className={`w-6 h-6 rounded-full bg-purple-500 border-2 ${theme === 'purple' ? 'border-white ring-2 ring-purple-300' : 'border-transparent opacity-50 hover:opacity-100'}`} title="Purple Theme"></button>
                            <button onClick={() => setTheme('red')} className={`w-6 h-6 rounded-full bg-red-500 border-2 ${theme === 'red' ? 'border-white ring-2 ring-red-300' : 'border-transparent opacity-50 hover:opacity-100'}`} title="Red Theme"></button>
                        </div>

                        <div className="flex gap-2">
                            {messages.length > 1 && (
                                <button onClick={handleExportPDF} className="flex items-center gap-1.5 text-xs font-medium bg-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-300 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    <span className="hidden xl:inline">{UI_TEXT[language].export}</span>
                                </button>
                            )}
                            <button onClick={handleClearHistory} className="flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors" title={UI_TEXT[language].clear}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                <span className="hidden xl:inline">{UI_TEXT[language].clear}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Chat Area */}
            <main ref={chatContainerRef} className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth ${themeClasses.main}`}>
                <div className="w-full lg:max-w-[85%] xl:max-w-[75%] mx-auto flex flex-col space-y-6">
                    <div className="print-only p-4 border-b border-slate-300 mb-4">
                        <div className="flex items-center gap-4 mb-4">
                            <img src="https://i.postimg.cc/FRwPCtyb/Dr-Pattaroj-V-2.png" alt="Dr. Pat" className="h-16 w-16 rounded-full" />
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{UI_TEXT[language].title}</h1>
                                <p className="text-slate-600">{UI_TEXT[language].subtitle}</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-700 font-bold">Topic: {activeConversation?.title || 'Chat'}</p>
                        <p className="text-sm text-slate-500">Date: {new Date().toLocaleString()}</p>
                    </div>

                    {messages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
                    
                    {messages.length === 1 && !isLoading && <TopicSuggestions topics={SUGGESTED_TOPICS} onSelectTopic={handleSelectTopic} />}
                    
                    {!isLoading && suggestedQuestions.length > 0 && <SuggestedQuestions questions={suggestedQuestions} onSelectQuestion={handleSelectTopic} />}
                    
                    <div className="h-4"></div>
                </div>
            </main>

            {/* Input Area */}
            <footer className={`p-4 no-print bg-white/80 backdrop-blur-md border-t border-slate-200`}>
                <div className="w-full lg:max-w-[85%] xl:max-w-[75%] mx-auto">
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm text-center mb-3">{error}</div>}
                    
                    {stagedFiles.length > 0 && (
                        <div className={`p-3 mb-3 border rounded-xl ${themeClasses.stagedFiles}`}>
                            <p className={`text-xs font-bold mb-2 text-slate-500`}>{UI_TEXT[language].files}</p>
                            <div className="flex flex-wrap gap-2">
                                {stagedFiles.map((file, index) => (
                                    <div key={index} className={`relative rounded-lg py-1.5 pl-3 pr-8 text-xs flex items-center gap-2 max-w-xs ${themeClasses.fileTag}`}>
                                        <span className="truncate font-medium" title={file.name}>{file.name}</span>
                                        <button onClick={() => removeStagedFile(index)} className="absolute top-1/2 right-1 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-slate-200/50 hover:text-red-500 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-2 focus-within:ring-2 focus-within:ring-offset-2 transition-all duration-300 input-area relative overflow-hidden">
                        <label htmlFor="file-input" className={`cursor-pointer p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors rounded-xl z-10 ${isActionDisabled ? 'opacity-50' : ''}`} aria-label={UI_TEXT[language].attach}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </label>
                        <input
                            id="file-input"
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*,application/pdf"
                            disabled={isActionDisabled}
                        />
                        <input 
                            type="text" 
                            value={userInput} 
                            onChange={(e) => setUserInput(e.target.value)} 
                            placeholder={UI_TEXT[language].placeholder}
                            className={`w-full p-3 bg-transparent border-none focus:ring-0 text-base resize-none z-10 placeholder-slate-400 text-slate-800`} 
                            disabled={isActionDisabled}
                        />
                        <button 
                            type="submit" 
                            disabled={isActionDisabled || (!userInput.trim() && stagedFiles.length === 0)} 
                            className={`p-3 rounded-xl text-white shadow-md transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none z-10 ${themeClasses.sendBtn}`} 
                            aria-label={UI_TEXT[language].send}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </form>
                    <div className="text-center mt-2 flex flex-col items-center gap-1">
                       <p className={`text-[10px] text-slate-400`}>Powered by Google Gemini 2.5 Flash</p>
                       <p className={`text-[10px] text-slate-400 font-medium`}>Developed and Copyright © 2024 by Dr. Pattharote Kamonrotesiri. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    </div>
  );
};

export default App;
