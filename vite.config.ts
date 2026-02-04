import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente (do .env ou do sistema/Netlify)
  // Casting process to any to avoid TypeScript error about 'cwd' missing on Process type
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // Define variáveis globais para o navegador
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': {} // Previne crash se 'process' for acessado diretamente
    },
    server: {
      host: true
    }
  };
});