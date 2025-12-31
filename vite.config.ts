import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cast process to any to avoid TS errors in specific build environments
  const currentProcess = process as any;

  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, currentProcess.cwd(), '');

  // Priority: 
  // 1. Environment variable loaded by Vite (from .env)
  // 2. System process.env (Critical for Netlify/CI environments)
  const apiKey = env.API_KEY || currentProcess.env?.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Define process.env.API_KEY so it can be accessed in the browser code.
      // JSON.stringify is essential to wrap the string in quotes.
      // If apiKey is undefined, we default to an empty string to prevent runtime crashes,
      // though the app will still throw an error if the key is missing.
      'process.env.API_KEY': JSON.stringify(apiKey || ''),
    },
  };
});