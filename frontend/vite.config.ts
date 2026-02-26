import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	ssr: {
		// Bundle pocketbase into SSR output so it doesn't need to be in node_modules at runtime
		noExternal: ['pocketbase']
	},
	server: {
		host: '0.0.0.0',
		allowedHosts: true,
		fs: {
			allow: ['..']
		},
		proxy: {
			'/pb': {
				target: 'http://localhost:8090',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/pb/, '')
			}
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/tests/setup.ts']
	}
});
