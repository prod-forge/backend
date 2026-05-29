/// <reference types="node" />
import './eslint-plugin.d';
import type { Linter } from 'eslint';

import js from '@eslint/js';
import json from '@eslint/json';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import gitignore from 'eslint-config-flat-gitignore';
import checkFile from 'eslint-plugin-check-file';
import importLite from 'eslint-plugin-import-lite';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import packageJson from 'eslint-plugin-package-json';
import perfectionist from 'eslint-plugin-perfectionist';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import * as regexpPlugin from 'eslint-plugin-regexp';
import sonar from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const jsFiles = ['**/*.{js,jsx,mjs,cjs}'];

const tsFiles = ['**/*.{ts,tsx}'];

const sourceFiles = ['**/*.{js,jsx,mjs,cjs,ts,tsx}'];

const languageOptions = {
  ecmaVersion: 2024,
  globals: {
    ...globals.node,
    ...globals.jest,
  },
  sourceType: 'module',
};

const customTypescriptConfig = {
  files: tsFiles,
  languageOptions: {
    ...languageOptions,
    parser: tsParser,
    parserOptions: {
      project: './tsconfig.eslint.json',
      tsconfigRootDir: __dirname,
    },
  },
  plugins: {
    '@check-file': checkFile,
    '@import-lite': importLite,
    '@no-only-tests': noOnlyTests,
    '@sonar': sonar,
    '@typescript-eslint': tseslintPlugin,
    '@unicorn': unicorn,
    'import/parsers': tsParser,
  },
  rules: {
    '@check-file/filename-naming-convention': [
      'error',
      {
        'src/**/*.{ts,tsx}': 'KEBAB_CASE',
      },
      {
        ignoreMiddleExtensions: true,
      },
    ],
    '@check-file/folder-naming-convention': [
      'error',
      {
        'src/**/': 'KEBAB_CASE',
      },
    ],

    '@import-lite/no-default-export': 'error',

    '@no-only-tests/no-only-tests': 'error',

    '@sonar/cognitive-complexity': ['error', 20],
    '@sonar/no-collapsible-if': 'error',
    '@sonar/no-identical-expressions': 'error',
    '@sonar/no-identical-functions': 'error',
    '@sonar/no-inverted-boolean-check': 'error',
    '@sonar/no-redundant-boolean': 'error',
    '@sonar/no-small-switch': 'error',
    '@sonar/no-unused-collection': 'error',
    '@sonar/prefer-immediate-return': 'error',

    '@typescript-eslint/ban-ts-comment': 'error',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        format: ['UPPER_CASE', 'StrictPascalCase'],
        selector: 'interface',
      },
      {
        format: ['PascalCase'],
        selector: 'typeLike',
      },
      {
        format: ['UPPER_CASE', 'StrictPascalCase'],
        selector: 'class',
      },
    ],
    '@typescript-eslint/no-empty-interface': [
      'error',
      {
        allowSingleExtends: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'after-used',
        ignoreRestSiblings: false,
        vars: 'all',
      },
    ],
    '@typescript-eslint/return-await': 'off',

    '@unicorn/no-useless-undefined': ['error', { checkArguments: false, checkArrowFunctionBody: false }],
    '@unicorn/prefer-array-flat': 'error',
    '@unicorn/prefer-modern-dom-apis': 'error',
    '@unicorn/prefer-node-protocol': 'error',
    '@unicorn/prefer-string-starts-ends-with': 'error',
    '@unicorn/throw-new-error': 'error',

    'array-callback-return': [
      'error',
      {
        allowImplicit: true,
      },
    ],
    camelcase: ['error', { properties: 'always' }],
    'class-methods-use-this': 'off',
    'getter-return': [
      'error',
      {
        allowImplicit: true,
      },
    ],
    'newline-before-return': 'error',
    'no-alert': 'error',
    'no-await-in-loop': 'off',
    'no-console': 'error',
    'no-debugger': 'error',
    'no-param-reassign': 'off',
    'no-plusplus': 'off',
    'no-return-await': 'off',
    'no-underscore-dangle': 'off',
    'no-unused-vars': 'off',
    'no-warning-comments': 'warn',
  },
};

// Add the files for applying the recommended TypeScript configs
// only for the Typescript files.
// This is necessary when we have the multiple extensions files
// (e.g. .ts, .tsx, .js, .cjs, .mjs, etc.).
const recommendedTypeScriptConfigs = [
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: tsFiles,
  })),
  ...tseslint.configs.stylistic.map((config) => ({
    ...config,
    files: tsFiles,
  })),
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: tsFiles,
  })),
];

const jsonCustomConfig: Linter.Config = {
  ...json.configs.recommended,
  files: ['**/*.json'],
  ignores: ['**/*-lock.json', 'package.json'],
  language: 'json/json',
};

const customPackageJsonConfig = {
  files: ['package.json'],
  ignores: ['**/*-lock.json'],
  rules: {
    'package-json/require-exports': 'off',
    'package-json/require-files': 'off',
    'package-json/require-repository': 'off',
    'package-json/require-sideEffects': 'off',
    'package-json/require-type': 'off',
  },
};

const customJsConfig = {
  files: jsFiles,
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.jest,
    },
  },
  ...js.configs.recommended,
};

const perfectionistConfig = {
  files: sourceFiles,
  ...perfectionist.configs['recommended-natural'],
};

const regexpConfig = {
  files: sourceFiles,
  ...regexpPlugin.configs['flat/recommended'],
};

const dtsOverrides: Linter.Config = {
  files: ['**/*.d.ts'],
  rules: {
    '@import-lite/no-default-export': 'off',
    '@typescript-eslint/naming-convention': 'off',
  },
};

const disableDefaultExportBlockingForStorybook = {
  files: [
    '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '**/playwright*.config.ts',
    '**/.storybook/**',
    '**/vite.config.ts',
    '**/vitest.config.ts',
    '**/eslint.config.ts',
  ],
  rules: {
    '@import-lite/no-default-export': 'off',
  },
};

export default [
  gitignore({
    files: ['.eslintflatignore'],
  }),
  ...recommendedTypeScriptConfigs,
  prettierRecommended,
  perfectionistConfig,
  regexpConfig,
  customTypescriptConfig,
  jsonCustomConfig,
  packageJson.configs.recommended,
  customPackageJsonConfig,
  packageJson.configs.stylistic,
  customJsConfig,
  disableDefaultExportBlockingForStorybook,
  dtsOverrides,
];
