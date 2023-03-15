import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  },
  server: {
    fs: {
      allow: ['public']
    }
  },
  build: {
    target: 'esnext',
    minify: false,
    // Or, if using terser (default minifier), you can try disabling certain optimizations:
    terserOptions: {
      compress: {
        drop_console: false,
        keep_infinity: true,
        // ... and any other options you'd like to disable
      },
    },
  },
});
