// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const oxlint = require('../../.oxlintrc.json')

// Size, complexity and style limits shared with the rest of the repository through .oxlintrc.json.
const sharedRuleNames = [
  'max-lines',
  'max-lines-per-function',
  'complexity',
  'max-depth',
  'no-console',
  'curly',
]
const sharedRules = Object.fromEntries(sharedRuleNames.map((name) => [name, oxlint.rules[name]]))

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  { ignores: ['.expo/*', 'ios/*', 'android/*', 'coverage/*'] },
  {
    rules: {
      ...sharedRules,
      'no-shadow': oxlint.rules['no-shadow'],
      'import/no-cycle': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react-dom', 'react-dom/*'],
              message: 'Mobile does not use react-dom or DOM-based UI.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': oxlint.rules['typescript/no-explicit-any'],
      '@typescript-eslint/no-non-null-assertion': oxlint.rules['typescript/no-non-null-assertion'],
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': oxlint.rules['no-shadow'],
    },
  },
])
