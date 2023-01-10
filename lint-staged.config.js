module.exports = {
  // https://github.com/prettier/prettier/issues/1358#issuecomment-297818188
  '{,!(node_modules)/**/}*.js': ['standard --fix'],
  './README.md': ['markdown-toc-gen insert']
}
