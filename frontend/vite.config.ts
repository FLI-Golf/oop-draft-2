import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		host: '0.0.0.0',
		allowedHosts: ['.gitpod.dev', '.gitpod.io'],
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
