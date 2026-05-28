import { defineConfig } from '@cucumber/cucumber'

export default defineConfig({
  paths: ['specs/features/**/*.feature'],
  require: ['specs/step-definitions/**/*.ts'],
  requireModule: ['ts-node/register'],
  format: [
    'progress-bar',
    '@cucumber/html-formatter:reports/cucumber-report.html',
    'json:reports/cucumber-report.json',
  ],
  formatOptions: { snippetInterface: 'async-await' },
  publishQuiet: true,
})
