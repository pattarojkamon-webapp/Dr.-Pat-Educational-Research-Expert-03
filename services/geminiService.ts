import { GoogleGenAI, Content } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import type { Language } from '../types';

const getGenAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey });
};

export const streamDrPatResponse = async (
  history: Content[],
  language: Language = 'th'
) => {
  const ai = getGenAI();

  // Append language instruction
  let langInstruction = "";
  if (language === 'en') {
    langInstruction = "\nIMPORTANT: Please respond in English.";
  } else if (language === 'zh') {
    langInstruction = "\nIMPORTANT: Please respond in Chinese (Simplified).";
  } else {
    langInstruction = "\nIMPORTANT: Please respond in Thai.";
  }

  const modelConfig = {
      systemInstruction: SYSTEM_INSTRUCTION + langInstruction,
  };

  return ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: history,
      config: modelConfig,
  });
};
