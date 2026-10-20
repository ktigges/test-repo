import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const fixtures = JSON.parse(await fs.readFile(
  new URL('../samples/cases.json', import.meta.url), 'utf8'));

test('fixture count, classification and unique IDs', () => {
  assert.equal(fixtures.cases.length, 12);
  assert.ok(fixtures.classification.includes('SYNTHETIC'));
  assert.equal(new Set(fixtures.cases.map((c) => c.id)).size, fixtures.cases.length);
});

test('custom marker fixture expectations are consistent', () => {
  for (const { id, text, expectedPurviewMarker } of fixtures.cases) {
    assert.equal(/AIRLIFT-DEMO-CONFIDENTIAL-[0-9]{6}/.test(text),
      expectedPurviewMarker, id);
  }
});

// This approximates demo patterns for fixture consistency, not enforcement proof.
test('APIM fixture expectations agree with illustrative patterns', () => {
  for (const { id, text, expectedApim } of fixtures.cases) {
    let result = 'pass';
    if (/(?:sk-ant-[A-Za-z0-9_-]{12,}|github_pat_[A-Za-z0-9_]{12,}|gh[pousr]_[A-Za-z0-9]{20,})/i.test(text)) {
      result = 'sensitive:api-key';
    } else if (/(?:AccountKey|SharedAccessKey|Password)\s*=\s*[^;\s\x22]{8,}/i.test(text)) {
      result = 'sensitive:connection-string';
    } else if (/4111[ -]?1111[ -]?1111[ -]?1111/.test(text)) {
      result = 'sensitive:test-card';
    }
    assert.equal(result, expectedApim, id);
  }
});

test('JSON escape fixture decodes to the intended synthetic assignment', async () => {
  const payload = JSON.parse(await fs.readFile(
    new URL('../requests/escaped-password.json', import.meta.url), 'utf8'));
  assert.equal(payload.text, 'Password=DemoOnlyNotARealSecret123;');
});
