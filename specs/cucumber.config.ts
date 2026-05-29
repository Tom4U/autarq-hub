import type { IConfiguration } from '@cucumber/cucumber'

const config: Partial<IConfiguration> = {
  paths: ['specs/features/**/*.feature'],
  require: ['specs/step-definitions/**/*.ts'],
  requireModule: ['ts-node/register'],
  format: [
    'progress-bar',
    '@cucumber/html-formatter:reports/cucumber-report.html',
    'json:reports/cucumber-report.json',
  ],
  formatOptions: { snippetInterface: 'async-await' },
}

export default config
