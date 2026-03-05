module.exports = {
  '*.md': ['prettier --write'],
  '*.ts': [() => 'npm run lint:ts'],
  '*.{ts,json}': ['prettier --write', 'eslint --fix'],
};
