import { defineConfig } from 'vite';
export default defineConfig({esbuild:{jsx:'automatic'},optimizeDeps:{esbuildOptions:{tsconfigRaw:{compilerOptions:{jsx:'react-jsx'}}}}});
