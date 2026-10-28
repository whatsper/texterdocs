import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createJiti} from 'jiti';

const jiti = createJiti(import.meta.url);
const {runTemplatesImport} = await jiti.import('../src/lib/templatesJsonToTexter.ts');

const config = {
  projectId: 'test', apiKey: 'test-key', accountId: 'test-account',
  keepNames: true, nameSuffix: '', delayMsBetweenCalls: 0,
  proxyUrl: 'https://proxy.example.test', submitMode: 'draft',
};

function fixture(format = 'IMAGE') {
  return {
    name: 'media_test', title: 'Media test', category: 'UTILITY',
    usage: 'inbox', chatStatus: 0,
    defaults: {he: {
      header: {type: format.toLowerCase(), url: 'https://media.example.test/stable'},
      body: ['Default body'],
      buttons: [{type: 'url', payload: 'default-path'}],
    }},
    provider_template: {localizations: [{language: 'he', components: [
      {type: 'HEADER', format, example: {header_handle: ['https://media.example.test/expired']}},
      {type: 'BODY', text: 'Hello {{1}}', example: {body_text: [['Example body']]}},
      {type: 'BUTTONS', buttons: [{type: 'URL', text: 'Open', url: 'https://example.test/{{1}}', example: ['example-path']}]},
    ]}]},
  };
}

async function captureImport(t, template, submitMode = 'draft') {
  const requests = [];
  const original = structuredClone(template);
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const request = JSON.parse(options.body);
    requests.push(request);
    return new Response(JSON.stringify({name: 'media_test'}), {
      headers: {'content-type': 'application/json'},
    });
  });
  const summary = await runTemplatesImport({...config, submitMode}, [template], () => {});
  assert.equal(summary.createResults[0].status, 'success');
  assert.ok(summary.localizationResults.every(result => result.status === 'success'));
  assert.deepEqual(template, original, 'Import must not mutate the source JSON');
  return {requests, summary, payloads: requests
    .filter(request => request.url.endsWith('/localizations'))
    .map(request => request.payload)};
}

for (const format of ['IMAGE', 'VIDEO', 'DOCUMENT']) {
  for (const mode of ['draft', 'submit']) {
    test(`${format} preserves defaults and uses their URL for approval in ${mode} mode`, async t => {
      const template = fixture(format);
      if (format === 'DOCUMENT') template.defaults.he.header.filename = 'invoice.pdf';
      const {payloads: [payload], requests, summary} = await captureImport(t, template, mode);
      assert.deepEqual(payload.defaults, template.defaults.he);
      assert.deepEqual(payload.components[0].example.header_handle, [template.defaults.he.header.url]);
      assert.deepEqual(payload.components.slice(1), template.provider_template.localizations[0].components.slice(1));
      assert.equal(requests.length, mode === 'submit' ? 3 : 2);
      assert.equal(summary.submissionResults.length, mode === 'submit' ? 1 : 0);
      if (mode === 'submit') {
        assert.equal(summary.submissionResults[0].status, 'success');
        assert.ok(requests[2].url.endsWith('/localizations/he/submit'));
      }
    });
  }
}

test('selects defaults independently for each localization', async t => {
  const template = fixture();
  template.defaults.en_US = {header: {type: 'image', url: 'https://media.example.test/english'}};
  template.provider_template.localizations.push({
    ...structuredClone(template.provider_template.localizations[0]), language: 'en_US',
  });
  const {payloads} = await captureImport(t, template);
  assert.equal(payloads.length, 2);
  for (const payload of payloads) {
    assert.deepEqual(payload.defaults, template.defaults[payload.language]);
    assert.deepEqual(payload.components[0].example.header_handle, [template.defaults[payload.language].header.url]);
  }
});

for (const missing of ['all defaults', 'matching language']) {
  test(`preserves example-only behavior without ${missing}`, async t => {
    const template = fixture();
    if (missing === 'all defaults') delete template.defaults;
    else template.defaults = {en_US: template.defaults.he};
    const {payloads: [payload]} = await captureImport(t, template);
    assert.equal(Object.hasOwn(payload, 'defaults'), false);
    assert.deepEqual(payload.components, template.provider_template.localizations[0].components);
  });
}

test('preserves text headers and their defaults', async t => {
  const template = fixture();
  template.defaults.he.header = {type: 'text', text: ['Default header']};
  template.provider_template.localizations[0].components[0] = {
    type: 'HEADER', format: 'TEXT', text: 'Hello {{1}}', example: {header_text: ['Example header']},
  };
  const {payloads: [payload]} = await captureImport(t, template);
  assert.deepEqual(payload.defaults, template.defaults.he);
  assert.deepEqual(payload.components, template.provider_template.localizations[0].components);
});

test('keeps the media example when defaults contain no header URL', async t => {
  const template = fixture();
  delete template.defaults.he.header;
  const {payloads: [payload]} = await captureImport(t, template);
  assert.deepEqual(payload.defaults, template.defaults.he);
  assert.deepEqual(payload.components, template.provider_template.localizations[0].components);
});
