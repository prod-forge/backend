/// <reference types="node" />
import './eslint-plugin.d';
import type { Linter } from 'eslint';

import js from '@eslint/js';
import json from '@eslint/json';
import tsParser from '@typescript-eslint/parser';
import gitignore from 'eslint-config-flat-gitignore';
import checkFile from 'eslint-plugin-check-file';
import importLite from 'eslint-plugin-import-lite';
import jestPlugin from 'eslint-plugin-jest';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import packageJsonConfig from 'eslint-plugin-package-json';
import perfectionist from 'eslint-plugin-perfectionist';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import regexpPlugin from 'eslint-plugin-regexp';
import sonar from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// The rules mirror @rockpack/codestyle; project-specific changes live in projectOverrides at the end.

const jsFiles = ['**/*.{js,jsx,mjs,cjs}'];

const tsFiles = ['**/*.{ts,tsx,mts,cts}'];

const sourceFiles = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'];
const testFiles = ['**/*.{spec,test}.{js,jsx,ts,tsx}'];

const languageOptions: Linter.Config['languageOptions'] = {
  ecmaVersion: 2024,
  globals: {
    ...globals.browser,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  sourceType: 'module',
};

const recommendedTypescriptConfigs = [
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: tsFiles,
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: tsFiles,
  })),
] as Linter.Config[];

const perfectionistConfig: Linter.Config = {
  files: sourceFiles,
  ...perfectionist.configs['recommended-natural'],
};

const regexpConfig: Linter.Config = {
  files: sourceFiles,
  ...regexpPlugin.configs['flat/recommended'],
};

const typescriptConfig: Linter.Config = {
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
    '@typescript-eslint': tseslint.plugin,
    '@unicorn': unicorn,
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
    '@sonar/no-all-duplicated-branches': 'error',
    '@sonar/no-collapsible-if': 'error',
    '@sonar/no-collection-size-mischeck': 'error',
    '@sonar/no-duplicated-branches': 'error',
    '@sonar/no-element-overwrite': 'error',
    '@sonar/no-empty-collection': 'error',
    '@sonar/no-gratuitous-expressions': 'error',
    '@sonar/no-identical-conditions': 'error',
    '@sonar/no-identical-expressions': 'error',
    '@sonar/no-identical-functions': 'error',
    '@sonar/no-ignored-return': 'error',
    '@sonar/no-inverted-boolean-check': 'error',
    '@sonar/no-redundant-boolean': 'error',
    '@sonar/no-small-switch': 'error',
    '@sonar/no-unthrown-error': 'error',
    '@sonar/no-unused-collection': 'error',
    '@sonar/no-use-of-empty-return-value': 'error',
    '@sonar/non-existent-operator': 'error',
    '@sonar/prefer-immediate-return': 'error',
    '@sonar/reduce-initial-value': 'error',

    '@typescript-eslint/ban-ts-comment': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        format: ['PascalCase'],
        selector: 'typeLike',
      },
      {
        format: ['UPPER_CASE', 'StrictPascalCase'],
        selector: 'class',
      },
    ],
    '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
    // Records used as dictionaries (collections, process.env) are deleted from by key.
    '@typescript-eslint/no-dynamic-delete': 'off',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'after-used',
        ignoreRestSiblings: false,
        vars: 'all',
      },
    ],
    // Conflicts with no-non-null-assertion from the strict preset: keep explicit `as` casts.
    '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    // An empty string means "not set" in configs, so `||` stays allowed for strings.
    '@typescript-eslint/prefer-nullish-coalescing': ['error', { ignorePrimitives: { string: true } }],
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    '@typescript-eslint/return-await': 'off',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',

    '@unicorn/error-message': 'error',
    '@unicorn/no-await-in-promise-methods': 'error',
    '@unicorn/no-instanceof-builtins': 'error',
    '@unicorn/no-single-promise-in-promise-methods': 'error',
    '@unicorn/no-thenable': 'error',
    '@unicorn/no-useless-promise-resolve-reject': 'error',
    '@unicorn/no-useless-spread': 'error',
    '@unicorn/no-useless-undefined': ['error', { checkArguments: false, checkArrowFunctionBody: false }],
    '@unicorn/prefer-array-flat': 'error',
    '@unicorn/prefer-modern-dom-apis': 'error',
    '@unicorn/prefer-node-protocol': 'error',
    '@unicorn/prefer-number-properties': 'error',
    '@unicorn/prefer-string-starts-ends-with': 'error',
    '@unicorn/prefer-structured-clone': 'error',
    '@unicorn/prefer-type-error': 'error',
    '@unicorn/throw-new-error': 'error',

    'array-callback-return': [
      'error',
      {
        allowImplicit: true,
      },
    ],
    camelcase: ['error', { properties: 'always' }],
    'class-methods-use-this': 'off',
    // `== null` still covers both null and undefined.
    eqeqeq: ['error', 'always', { null: 'ignore' }],
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

const jsonCustomConfig: Linter.Config = {
  ...json.configs.recommended,
  files: ['**/*.json'],
  ignores: ['**/*-lock.json', 'package.json'],
  language: 'json/json',
};

const customPackageJsonConfig: Linter.Config = {
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

const customJsConfig: Linter.Config = {
  files: jsFiles,
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.jest,
      ...globals.browser,
    },
  },
  ...js.configs.recommended,
};

const disableDefaultExportBlockingForStorybook: Linter.Config = {
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

const dtsOverrides: Linter.Config = {
  files: ['**/*.d.ts'],
  rules: {
    '@import-lite/no-default-export': 'off',
    '@typescript-eslint/naming-convention': 'off',
    // Ambient declarations of third-party classes often list only the constructor.
    '@typescript-eslint/no-extraneous-class': 'off',
  },
};

const testOverrides: Linter.Config = {
  files: [...testFiles, '**/__fixtures__/**'],
  languageOptions: {
    globals: {
      ...globals.jest,
    },
  },
  plugins: {
    jest: jestPlugin,
  },
  rules: {
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/unbound-method': 'off',
    'jest/no-alias-methods': 'error',
    'jest/no-conditional-expect': 'error',
    'jest/no-disabled-tests': 'error',
    'jest/no-done-callback': 'error',
    'jest/no-export': 'error',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/no-interpolation-in-snapshots': 'error',
    'jest/no-jasmine-globals': 'error',
    'jest/no-mocks-import': 'error',
    'jest/no-standalone-expect': 'error',
    'jest/no-test-prefixes': 'error',
    'jest/prefer-to-have-length': 'error',
    'jest/valid-describe-callback': 'error',
    'jest/valid-expect': 'error',
    'jest/valid-expect-in-promise': 'error',
    'jest/valid-title': 'error',
  },
};

const fixturesOverrides: Linter.Config = {
  files: ['**/__fixtures__/**'],
  rules: {
    '@check-file/folder-naming-convention': 'off',
  },
};

// Differences from @rockpack/codestyle.
const projectOverrides: Linter.Config[] = [
  {
    files: tsFiles,
    ignores: ['**/*.d.ts'],
    rules: {
      // NestJS modules are empty classes configured by the @Module decorator.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },
];

export default [
  gitignore({ files: `${__dirname}/.eslintflatignore`, strict: false }),
  ...recommendedTypescriptConfigs,
  prettierRecommended,
  perfectionistConfig,
  regexpConfig,
  typescriptConfig,
  jsonCustomConfig,
  packageJsonConfig.configs.recommended,
  customPackageJsonConfig,
  packageJsonConfig.configs.stylistic,
  customJsConfig,
  disableDefaultExportBlockingForStorybook,
  dtsOverrides,
  testOverrides,
  fixturesOverrides,
  ...projectOverrides,
];
