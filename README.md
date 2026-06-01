# Memact Schema

Schema defines app category schemas for Memact.

Apps do not always send clean user context. Sometimes they send signals: orders, skips, saves, exports, replays, searches, repeated settings, and other app activity.

Schema is where Memact decides what those signals mean, what category they belong to, and what kind of user-readable context can be proposed from them.

## For SSoC26 Contributors

Start here if you are new to Memact.

Schema is the main beginner-friendly contribution path. Pick an app category you understand and define how signals and context should work there.

Before starting, read:

- [`MEMACT.md`](./MEMACT.md) for the contributor handoff.
- [`CONTRIBUTING.md`](https://github.com/Memact/.github/blob/main/CONTRIBUTING.md) for the org-wide contributor guide.

Good first issues are labeled:

- `SSoC26`
- `good first issue`
- `Easy`
- `schema`

Please comment on an issue before starting so work does not get duplicated.

A good category schema contribution should include:

- useful context fields
- raw app signal examples
- normalized context examples
- user-facing Wiki entry templates
- fields that require extra care
- category-level permission suggestions
- basic tests

Important rule: apps can send signals or propose context, but users control what becomes accepted memory.

Prefer user-readable summaries over raw personal data. Do not infer sensitive traits. Do not write fake certainty.

## Owns

- App category schemas.
- Useful context fields for each app category.
- Example app signal dumps.
- Normalization rules.
- User-facing Wiki entry templates.
- User prompts for missing context.
- Access suggestions for category-level permissions.
- Tests for safe context shaping.

## Does Not Own

- Consent, apps, API keys, or permission checks.
- Wiki storage or user editing.
- Memory retrieval.
- SDK network calls.
- Retired Capture, Inference, or Intent pipelines.

## Flow

```text
App signals or proposed context -> Category schema -> Wiki entry proposal -> User review -> Memory
```

## Contributor Work

Contributors should pick an app category and define how signals become useful context there.

Examples:

- music
- video-streaming
- movie-booking
- shopping
- learning
- news-articles
- fitness
- travel
- food-delivery
- creator-tools
- productivity
- AI assistants

For each category, contributors can add schemas, signal examples, context fields, normalization rules, Wiki entry templates, access suggestions, and tests.

Example: a food app may send repeated sushi orders. Schema should help Memact treat that as possible food preference, not as raw order history that every app gets to read.

## Current Code

The existing v0 engine is still present for compatibility while Schema moves toward category schemas.

Current exports include:

- `formSchemaPackets(records, options)`
- `groupByCategory(records)`
- `inferSchemaType(record)`
- `createSchemaPacket(group)`

Do not treat Capture or Inference as current core product language. New work should prefer app category schemas and Wiki entry outputs.

## Development

```powershell
npm install
npm run check
```
