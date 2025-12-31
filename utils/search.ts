import { SYSTEM_INSTRUCTION } from '../constants';

export interface SearchResultItem {
  title: string;
  snippet: string;
}

// Simple cache for the parsed data
let parsedKnowledgeBase: { title: string; fullText: string }[] | null = null;

const parseAndCache = (): { title: string; fullText: string }[] => {
    if (parsedKnowledgeBase) return parsedKnowledgeBase;

    const sections: { title: string; fullText: string }[] = [];
    const content = SYSTEM_INSTRUCTION.substring(SYSTEM_INSTRUCTION.indexOf('**ฐานข้อมูลความรู้:**'));
    
    // Split by lines that start with # or ##, which denote new sections
    const blocks = content.split(/\n(?=#\s|##\s)/);

    blocks.forEach(block => {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return;
        
        const lines = trimmedBlock.split('\n');
        // The first line is the title, remove the markdown characters
        const title = lines[0].replace(/^[#]+/, '').trim();
        const fullText = trimmedBlock;

        if (title) {
            sections.push({ title, fullText });
        }
    });
    
    parsedKnowledgeBase = sections;
    return sections;
};

export const searchKnowledgeBase = (query: string): SearchResultItem[] => {
    if (!query.trim() || query.length < 2) {
        return [];
    }
    const lowerCaseQuery = query.toLowerCase();
    const knowledgeBase = parseAndCache();
    
    const results: SearchResultItem[] = [];

    knowledgeBase.forEach(section => {
        const fullTextLower = section.fullText.toLowerCase();
        if (fullTextLower.includes(lowerCaseQuery)) {
            const snippetIndex = fullTextLower.indexOf(lowerCaseQuery);
            // Create a snippet around the found query
            const start = Math.max(0, snippetIndex - 50);
            const end = Math.min(section.fullText.length, snippetIndex + lowerCaseQuery.length + 50);
            
            let snippet = section.fullText.substring(start, end);
            if (start > 0) snippet = `...${snippet}`;
            if (end < section.fullText.length) snippet = `${snippet}...`;
            
            // Highlight the query in the snippet using a regex for case-insensitive replacement
            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            snippet = snippet.replace(regex, '<strong class="text-indigo-700 bg-indigo-100">$1</strong>');

            results.push({
                title: section.title,
                snippet: snippet
            });
        }
    });

    return results;
};