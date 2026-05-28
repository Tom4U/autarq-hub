/** @type {import('@cucumber/cucumber').IConfiguration} */
const config = {
  paths: ['specs/features/**/*.feature'],
  require: ['specs/step-definitions/**/*.ts'],
  requireModule: ['ts-node/register'],
  format: [
    'progress-bar',
    'html:reports/cucumber-report.html',
    'json:reports/cucumber-report.json',
  ],
  formatOptions: { snippetInterface: 'async-await' },
}

module.exports = { default: config }
