# Airlift synthetic AI gateway test repository

Publish this directory as a dedicated GitHub repository for authorized AI/MCP
governance testing. **Everything here is synthetic. There are no working API
keys, PATs, connection strings or real customer records.**

This is a fixture repository, not an application or a live secret scanner.
Do not put real credentials in it. Start with a **private** repository and a
short-lived, fine-grained PAT restricted to this repository, with read-only
Contents and required Metadata permissions. Store the real PAT only in the
gateway's Key Vault.

## Start with a clean read

Connect VS Code to the governed GitHub MCP endpoint, initialize the session,
and list tools. Ask:

> Read samples/clean/inventory.json in OWNER/REPO on its default branch.
> Summarize which items are out of stock.

Expected answer: the green demo widget is out of stock. This is a clean
connectivity and repository-access check.

Other clean prompts:

- Summarize [release-notes.md](./samples/clean/release-notes.md).
- Explain the nonsecret settings in [service-config.json](./samples/clean/service-config.json).
- List the files under `samples/clean` without reading the other sample folders.

Use actual owner/repository/branch values when calling tools. Tool names and
arguments should come from the server's `tools/list`, not assumptions.

## Important: inbound requests versus returned file contents

The accompanying gateway demo inspects **outbound request bodies sent by the
developer**. It does not inspect MCP response bodies.

Reading a file whose *path* looks sensitive does not send that file's contents
in the request. GitHub returns those contents in a response. Therefore:

- Reading a synthetic-secret file can succeed with this request-only setup.
- A returned synthetic value may trigger inspection on a **later** request if
  the client puts that value into a tool argument or model prompt.
- To prove an inbound block reliably, place the actual marker/value in an
  outgoing JSON request, not only in a repository file.
- A local file or tool response becoming model context does not prove it
  traveled through the governed model endpoint. Verify the client's routing.
- Do not claim repository-wide scanning, download protection, response DLP or
  sensitivity-label enforcement from these fixtures.

## Sample map and expected results

Expectations assume the supplied APIM demo regex and the custom Purview SIT
`AIRLIFT-DEMO-CONFIDENTIAL-[0-9]{6}`. Other tenant policies can change results.
Results below apply when the **content** is sent in an inspected JSON upload.

| Sample | APIM regex alone | Custom Purview marker rule |
| --- | --- | --- |
| [Inventory](./samples/clean/inventory.json) | Pass | No match |
| [Service configuration](./samples/clean/service-config.json) | Pass | No match |
| [Release notes](./samples/clean/release-notes.md) | Pass | No match |
| [Design note](./samples/purview-only/design-note.txt) | Pass | Match |
| [Synthetic key/token values](./samples/apim-only/credentials.txt) | API-key block | No match |
| [Synthetic connection strings](./samples/apim-only/connections.txt) | Connection-string block | No match |
| [Payment test number](./samples/pii/payment-test.txt) | Test-card block | No custom marker match |
| [Invented contacts](./samples/pii/synthetic-contacts.csv) | Pass | No custom marker match |
| [Combined note](./samples/both-layers/combined-note.txt) | Connection-string block | Match; blocks first when enabled |
| [Short-prefix controls](./samples/boundaries/short-prefixes.txt) | Pass | No match |
| [Escaped JSON assignment](./requests/escaped-password.json) | Connection-string block after JSON normalization | No match |

The payment number is a public payment-test value, and contacts use reserved
example domains and fictional phone numbers. These do not establish detection
of real-world PII. Configure and validate separate built-in Purview SITs to
demonstrate credit-card/email detection.

[cases.json](./samples/cases.json) contains 12 labeled cases for single-value
tests. **Do not upload that entire file to demonstrate a clean request**: it
contains multiple positive fixtures.

## Deterministic MCP request tests

1. Initialize with [mcp-initialize.json](./requests/mcp-initialize.json).
2. Send `notifications/initialized`, then
   [mcp-tools-list.json](./requests/mcp-tools-list.json).
3. Preserve negotiated protocol/session headers on subsequent calls.
4. Verify `search_code` is actually available and confirm its argument schema.
   If a different tool is exposed, adapt the request accordingly.
5. Replace `<OWNER>/<REPO>` in the two request samples:
   - [mcp-purview-block.json](./requests/mcp-purview-block.json): the custom
     Purview marker is in the outgoing query. With verified Purview blocking,
     require a DLP event and no APIM arrival.
   - [mcp-apim-block.json](./requests/mcp-apim-block.json): the synthetic password
     assignment is in the outgoing query. Require APIM JSON 403 and
     `AIGateway-SensitiveDataBlocked`.

Do not add real GitHub credentials to these JSON files. The client uses a
short-lived gateway Entra token; APIM injects the GitHub credential.
For these blocked cases, the request should not reach GitHub, so a search
result is not required evidence. Successful clean GitHub code search may
depend on repository indexing; a direct clean file read is a better initial
connectivity test.

## Useful demo exercises

1. **Clean workflow:** read and summarize only the clean inventory files.
2. **Purview-only:** send the exact marker from the design note as a JSON prompt
   or tool argument. Require a real Purview policy/rule match.
3. **APIM-only:** send one synthetic key or connection-string value as a JSON
   prompt or tool argument. Show APIM's category and request ID.
4. **Layer ordering:** send the combined note. With Purview Block active, APIM
   should not see it. In an isolated audit-mode test, APIM should block it.
5. **Negative controls:** send the short-prefix controls. They should pass these
   two demo detectors; that is not a general safety guarantee.
6. **JSON normalization:** submit the escaped assignment inside an otherwise
   valid backend request. The illustrative APIM expression should detect it.

The request containing the combined content and this README itself include
positive examples. Avoid asking the assistant to summarize the entire repo
when you want a clean control.

## Offline fixture checks

With Node.js 20 or later:

```sh
npm test
```

No install is required: tests use Node built-ins and make no network calls.
They verify fixture labels and a JavaScript approximation of the demo regexes,
not live APIM/Purview enforcement.

## Publish to GitHub

Review every file before publishing, then run from this directory:

```sh
git init -b main
git add .
git commit -m "Add synthetic AI gateway test fixtures"
gh repo create <REPO_NAME> --private --source=. --remote=origin --push
```

These commands are instructions only; this directory has not been initialized,
committed or published automatically. Never bypass a GitHub secret-scanning
warning without verifying that the flagged value is one of these documented
nonfunctional fixtures. Remove the fixture if your organization's policy
prohibits publishing token-shaped strings.

## Provenance

The local Ollama model supplied the initial case catalog and consistency-test
draft. Both were reviewed and corrected; the remaining samples and instructions
were assembled for this demo. No real repository content or account data was used.
