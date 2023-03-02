import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import postcss from "rollup-plugin-postcss";
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json'

const production = !process.env.ROLLUP_WATCH;
let spawnExecutor = false;

function serve() {
	let server;
	
	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			if (spawnExecutor) {
				server = require('child_process').spawn('npm', ['run', 'start:spawn-executor', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}
			else {
				server = require('child_process').spawn('npm', ['run', 'electron', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

function plugins(cssFile) {
	return [
	svelte({
		// enable run-time checks when not in production
		dev: !production,
		// we'll extract any component CSS out into
		// a separate file - better for performance
		css: css => {
			css.write(cssFile);
		},
		preprocess: sveltePreprocess(),
	}),

	// If you have external dependencies installed from
	// npm, you'll most likely need these plugins. In
	// some cases you'll need additional configuration -
	// consult the documentation for details:
	// https://github.com/rollup/plugins/tree/master/packages/commonjs
	resolve({
		browser: true,
		dedupe: ['svelte']
	}),
	commonjs(),
	postcss({
		extract: false,
		minimize: true,
		use: [
		  ['sass', {
			includePaths: [
			  './src/ui/theme',
			  './node_modules'
			]
		  }]
		]
	  }),
	//typescript({ sourceMap: !production }),

	// In dev mode, call `npm run start` once
	// the bundle has been generated
	!production && serve(),

	// Watch the `public` directory and refresh the
	// browser on changes when not in production
	!production && livereload('public'),

	// If we're building for production (npm run build
	// instead of npm run dev), minify
	production && terser()
]}

export default commandLineArgs => {
	if (commandLineArgs.configSpawnExecutor === true) {
			spawnExecutor = true;
			console.log('executor spawned')
		};
	return [
	{
		input: 'src/ui/Splash.svelte',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'PerspectivismSplash',
			file: 'public/build/splash.js'
		},
		plugins: [
			svelte({
				// enable run-time checks when not in production
				dev: !production,
				// we'll extract any component CSS out into
				// a separate file - better for performance
				css: css => {
					css.write('splash.css');
				},
				preprocess: sveltePreprocess(),
			}),
		
			// If you have external dependencies installed from
			// npm, you'll most likely need these plugins. In
			// some cases you'll need additional configuration -
			// consult the documentation for details:
			// https://github.com/rollup/plugins/tree/master/packages/commonjs
			resolve({
				browser: true,
				dedupe: ['svelte']
			}),
			commonjs(),
			postcss({
				extract: false,
				minimize: true,
				use: [
				  ['sass', {
					includePaths: [
					  './src/ui/theme',
					  './node_modules'
					]
				  }]
				]
			  }),
			json(),
		],
		watch: {
			clearScreen: false
		}
	},
	{
		input: 'src/ui/App.svelte',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'PerspectivismUi',
			file: 'public/build/bundle.js'
		},
		plugins: [
			svelte({
				// enable run-time checks when not in production
				dev: !production,
				// we'll extract any component CSS out into
				// a separate file - better for performance
				css: css => {
					css.write('bundle.css');
				},
				preprocess: sveltePreprocess(),
			}),
		
			// If you have external dependencies installed from
			// npm, you'll most likely need these plugins. In
			// some cases you'll need additional configuration -
			// consult the documentation for details:
			// https://github.com/rollup/plugins/tree/master/packages/commonjs
			resolve({
				browser: true,
				dedupe: ['svelte']
			}),
			commonjs(),
			postcss({
				extract: false,
				minimize: true,
				use: [
				['sass', {
					includePaths: [
					'./src/ui/theme',
					'./node_modules'
					]
				}]
				]
			}),
			typescript({ sourceMap: !production }),

			json(),
		
			// In dev mode, call `npm run start` once
			// the bundle has been generated
			!production && serve(),
		
			// Watch the `public` directory and refresh the
			// browser on changes when not in production
			!production && livereload('public'),
		
			// If we're building for production (npm run build
			// instead of npm run dev), minify
			production && terser()
		],
		watch: {
			clearScreen: false
		}
	}
]
}