module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react'],
  rules: {
    'react/jsx-uses-vars': 'error',
    'react/jsx-uses-react': 'off',
    'no-unused-vars': 'warn',
    'no-undef': 'error',
    'no-unreachable': 'error',
  },
};
