module.exports = {
  '*.ts': ['prettier --write', 'git add'],
  '**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
}
