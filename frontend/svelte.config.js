import adapterAuto from '@sveltejs/adapter-auto';
import adapterNode from '@sveltejs/adapter-node';

const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: isProduction ? adapterNode({ out: 'build' }) : adapterAuto()
	}
};

export default config;
