# Memact Schema

Schema organizes semantic evidence into reusable memory packets.

Schemas work like cognitive schemas: related evidence gets grouped into a
category and, when useful, a sub-schema. For example, discount-related shopping
signals can become a shopping schema with a discount sub-schema.

## Owns

- Grouping semantic records.
- Schema packets.
- Categories and sub-schema direction.
- Source trails for memory.

## Does Not Own

- Capture.
- Raw semantic understanding.
- Memory storage.
- Feature runtime.
- API gateway behavior.

## Flow

```text
Inference records -> Schema packets -> Memory -> Studio features
```

## Current Code

The v0 engine supports:

- `formSchemaPackets(records, options)`
- `groupByCategory(records)`
- `inferSchemaType(record)`
- `createSchemaPacket(group)`

Schema packets include category, schema type, optional sub-schema, confidence,
attributes, and source trails. They are technical objects for Memory and Studio,
not basic landing-page copy.

## Development

```powershell
npm install
npm run check
```
