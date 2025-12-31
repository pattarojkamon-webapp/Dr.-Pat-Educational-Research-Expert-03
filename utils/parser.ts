export const parseResponse = (text: string): { content: string; suggestions: string[] } => {
  const suggestionsHeading = '### คำถามที่น่าสนใจต่อไป:';
  const suggestions: string[] = [];
  
  const headingIndex = text.indexOf(suggestionsHeading);
  
  if (headingIndex === -1) {
    return { content: text, suggestions: [] };
  }
  
  const content = text.substring(0, headingIndex).trim();
  const suggestionsBlock = text.substring(headingIndex + suggestionsHeading.length).trim();
  
  const suggestionLines = suggestionsBlock.split('\n');
  
  for (const line of suggestionLines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      suggestions.push(trimmedLine.substring(2).trim());
    }
  }
  
  return { content, suggestions };
};
