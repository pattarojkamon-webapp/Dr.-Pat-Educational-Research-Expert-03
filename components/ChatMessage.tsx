import React, { useState } from 'react';
import type { ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (!code) return;
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="relative bg-slate-800 text-slate-200 rounded-lg my-4 font-mono text-sm shadow-md overflow-hidden border border-slate-700">
            <div className="flex justify-between items-center px-4 py-2 bg-slate-900/50 backdrop-blur-sm">
                <span className="text-xs text-slate-400 font-medium">{language || 'code'}</span>
                <button onClick={handleCopy} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors p-1.5 rounded hover:bg-white/10">
                    {isCopied ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Copied
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Copy
                        </>
                    )}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"><code className={`language-${language}`}>{code}</code></pre>
        </div>
    );
};

const parseMarkdown = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';
    let inTable = false;
    let tableRows: string[][] = [];

    const parseLine = (line: string) => {
        const inlineCodeRegex = /`([^`]+)`/g;
        const parts = line.split(inlineCodeRegex).map((part, i) => {
            if (i % 2 === 1) {
                return <code key={`${i}-code`} className="bg-slate-100 border border-slate-200 text-pink-600 font-mono text-sm px-1.5 py-0.5 rounded mx-1">{part}</code>;
            }
            const linkRegex = /\[(.*?)\]\((.*?)\)/g;
            const boldRegex = /\*\*(.*?)\*\*/g;
            const italicRegex = /\*(.*?)\*/g;

            return part.split(linkRegex).reduce((arr, linkPart, j) => {
                if (j % 3 === 1) {
                    const url = part.split(linkRegex)[j + 1];
                    arr.push(
                        <a href={url} key={`${i}-${j}-link`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium decoration-indigo-300 underline-offset-2">
                            {linkPart}
                        </a>
                    );
                } else if (j % 3 === 0) {
                    const boldParts = linkPart.split(boldRegex).flatMap((boldPart, k) => {
                        if (k % 2 === 1) {
                            return [<strong key={`${i}-${j}-${k}-bold`} className="font-bold text-slate-800">{boldPart}</strong>];
                        }
                        // Handle italics within text that is not bold
                        return boldPart.split(italicRegex).map((italicPart, l) => {
                            if (l % 2 === 1) {
                                return <em key={`${i}-${j}-${k}-${l}-italic`} className="italic font-serif">{italicPart}</em>;
                            }
                            return italicPart;
                        });
                    });
                    arr.push(<React.Fragment key={`${i}-${j}-frag`}>{boldParts}</React.Fragment>);
                }
                return arr;
            }, [] as React.ReactNode[]);
        });
        return <>{parts}</>;
    };
    
    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc list-outside ml-5 space-y-1.5 my-3 text-slate-700 marker:text-indigo-400">
                    {listItems.map((item, index) => <li key={index}>{parseLine(item)}</li>)}
                </ul>
            );
            listItems = [];
        }
    };

    const flushCodeBlock = () => {
        if (codeBlockContent.length > 0) {
            elements.push(<CodeBlock key={`code-${elements.length}`} language={codeBlockLang} code={codeBlockContent.join('\n')} />);
            codeBlockContent = [];
            codeBlockLang = '';
        }
    };

    const flushTable = () => {
        if (tableRows.length > 0) {
            const header = tableRows[0];
            const body = tableRows.slice(1);
            elements.push(
                <div key={`table-${elements.length}`} className="table-container my-5 overflow-x-auto bg-white">
                    <table>
                        <thead>
                            <tr>{header.map((cell, i) => <th key={i}>{parseLine(cell.trim())}</th>)}</tr>
                        </thead>
                        {body.length > 0 && (
                            <tbody>
                                {body.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{parseLine(cell.trim())}</td>)}</tr>)}
                            </tbody>
                        )}
                    </table>
                </div>
            );
        }
        tableRows = [];
    };

    lines.forEach((line) => {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('```')) {
            flushList(); flushTable();
            if (inCodeBlock) {
                flushCodeBlock();
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
                codeBlockLang = trimmedLine.substring(3).trim();
            }
            return;
        }
        if (inCodeBlock) { codeBlockContent.push(line); return; }

        const isTableLine = trimmedLine.startsWith('|') && trimmedLine.endsWith('|');
        const isTableSeparator = /^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(trimmedLine);
        
        if (isTableLine) {
            if (!inTable) { flushList(); inTable = true; }
            if (!isTableSeparator) { tableRows.push(trimmedLine.split('|').slice(1, -1)); }
            return;
        }
        if (inTable) { flushTable(); inTable = false; }
        
        if (trimmedLine.startsWith('***') || trimmedLine.startsWith('---')) { 
            flushList(); 
            elements.push(<hr key={elements.length} className="my-6 border-slate-200 border-t-2" />); 
        }
        else if (trimmedLine.startsWith('## ')) { 
            flushList(); 
            elements.push(<h2 key={elements.length} className="text-xl font-bold text-indigo-900 mb-3 mt-6 pb-2 border-b border-indigo-100">{parseLine(trimmedLine.substring(3))}</h2>); 
        }
        else if (trimmedLine.startsWith('# ')) { 
            flushList(); 
            elements.push(<h1 key={elements.length} className="text-2xl font-extrabold text-indigo-800 mb-5 mt-8">{parseLine(trimmedLine.substring(2))}</h1>); 
        }
        else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || /^\d+\.\s/.test(trimmedLine)) { 
            listItems.push(trimmedLine.replace(/^(\* |- |\d+\.\s)/, '')); 
        }
        else if (trimmedLine === '') { 
            flushList(); 
            elements.push(<div key={elements.length} className="h-2" />); 
        }
        else { 
            flushList(); 
            elements.push(<p key={elements.length} className="text-slate-700 leading-7 mb-2">{parseLine(line)}</p>); 
        }
    });

    flushList(); flushCodeBlock(); flushTable();
    return <div className="prose prose-slate max-w-none">{elements}</div>;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { role, text } = message;
  const isUser = role === 'user';
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const avatar = (
    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden border-2 ${isUser ? 'border-blue-200' : 'border-indigo-200'} bg-white`}>
      {isUser ? (
        <span className="text-2xl">🧑‍🎓</span>
      ) : (
        <img src="https://i.postimg.cc/FRwPCtyb/Dr-Pattaroj-V-2.png" alt="Dr.Pat" className="w-full h-full object-cover" />
      )}
    </div>
  );

  // Loading state visualization
  if (role === 'model' && text === '...') {
      return (
        <div className="flex items-start gap-3 sm:gap-4 animate-fadeInUp">
            {avatar}
            <div className="bg-white border border-indigo-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
            </div>
        </div>
      );
  }

  return (
    <div className={`flex items-start gap-3 sm:gap-4 animate-fadeInUp group ${isUser ? 'justify-end' : ''}`}>
      {!isUser && avatar}
      <div className={`max-w-[90%] sm:max-w-[85%] rounded-2xl transition-all duration-300 relative shadow-sm hover:shadow-md ${isUser 
          ? 'bg-blue-100 border border-blue-200 p-3 sm:p-5 rounded-tr-none text-slate-800' 
          : 'bg-white border border-slate-100 px-3 pt-3 pb-8 sm:px-6 sm:pt-5 sm:pb-8 rounded-tl-none'}`
      }>
        <div className="text-slate-800">
          {text && parseMarkdown(text)}
        </div>
        {!isUser && text && (
            <div className="absolute bottom-2 right-2 flex gap-2">
                <button 
                    onClick={handleCopy}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Copy response"
                >
                    {isCopied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                </button>
            </div>
        )}
      </div>
      {isUser && avatar}
    </div>
  );
};
