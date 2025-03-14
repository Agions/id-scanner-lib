import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/id-scanner.js',
      format: 'umd',
      name: 'IDScanner',
      sourcemap: true
    },
    {
      file: 'dist/id-scanner.min.js',
      format: 'umd',
      name: 'IDScanner',
      plugins: [terser()],
      sourcemap: true
    },
    {
      file: 'dist/id-scanner.esm.js',
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [
    typescript({ tsconfig: './tsconfig.json' }),
    resolve(),
    commonjs(),
    json()
  ]
}; 