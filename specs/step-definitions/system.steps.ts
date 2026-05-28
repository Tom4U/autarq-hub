import { Given, When, Then } from '@cucumber/cucumber'
import { strict as assert } from 'node:assert'

// Base URL for the running app (set via environment or default to local dev)
const BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:3000'

let responseStatus: number
let responseText: string

Given('the autarq-hub application is running', async function () {
  // Health check — if this step fails, the app is not running
  const response = await fetch(`${BASE_URL}/`)
  assert.ok(response.ok || response.status < 500, `App is not running at ${BASE_URL}`)
})

When('I visit the root URL {string}', async function (path: string) {
  const response = await fetch(`${BASE_URL}${path}`)
  responseStatus = response.status
  responseText = await response.text()
})

Then('I should see the autarq-hub start page', function () {
  assert.ok(
    responseText.includes('autarq-hub'),
    `Expected page to contain "autarq-hub", got: ${responseText.substring(0, 200)}`
  )
})

Then('the response status should be {int}', function (expectedStatus: number) {
  assert.strictEqual(
    responseStatus,
    expectedStatus,
    `Expected HTTP ${expectedStatus}, got ${responseStatus}`
  )
})
