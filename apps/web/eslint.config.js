import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow unused vars prefixed with _
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      // Warn on any (pre-existing debt, will fix progressively)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow exporting non-components alongside components
      'react-refresh/only-export-components': ['warn', { allowExportNames: ['loader', 'action'] }],
      // Allow empty interfaces extending other types
      '@typescript-eslint/no-empty-object-type': 'off',
      // Allow require() in config files
      '@typescript-eslint/no-require-imports': 'off',
      // Disable no-useless-escape (false positives on regex)
      'no-useless-escape': 'warn',
      // Constant binary expression (false positive in test utils)
      'no-constant-binary-expression': 'warn',
      // React Compiler rules — too strict for existing codebase
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  // Relaxed rules for test files
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'e2e/**/*.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-refresh/only-export-components': 'off',
    },
  },
])
