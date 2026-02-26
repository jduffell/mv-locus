import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import glslify from 'rollup-plugin-glslify';

import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/locus.min.js',
      format: 'iife',
      name: 'Locus', // Export as Locus namespace
      exports: 'default', // Expose the default export directly
      plugins: [terser()]
    },
    { file: pkg.module, format: 'es' },
    { file: pkg.main, format: 'cjs' }
  ],
  plugins: [
    glslify({ compress: true }), // Inlines and minifies .glsl files
    resolve(),
    commonjs()
  ]
};
