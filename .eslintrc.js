module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/typescript',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: [
      './tsconfig.json',
      './tsconfig.eslint.json'
    ]
  },
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  rules: {
    '@typescript-eslint/indent': ['error', 2],
    indent: 'off', // required as 'off' by @typescript-eslint/indent
    'no-console': 'off',
    'no-restricted-syntax': 'off',
    'max-len': ['error', { code: 150 }],
    'comma-dangle': ['error', 'always-multiline'],
    'no-mixed-operators': 'off',
    'object-curly-newline': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/await-thenable': 'off', // not accurate for many web3 types
    'no-await-in-loop': 'off',
    'implicit-arrow-linebreak': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-loop-func': 'off',
    'no-underscore-dangle': 'off',
    'no-unused-expressions': 'off',
    'lines-between-class-members': 'off',
  },
};
