# MMDB Meta

> Cross-repository metadata and registry for the MMDB ecosystem.

## What is This?

This repository contains:
- **repos.json** — Registry of all MMDB repositories
- **ingestion/state.json** — Ingestion pipeline state and progress

## Statistics

| Metric | Value |
|--------|-------|
| Total repositories | 6 |
| Data repositories | 4 |
| Movies ingested | 2,840 |
| Series ingested | 1,274 |
| People ingested | 5,595 |
| Years covered | 2009–2026 |
| Forward backlog | Year 2010 |
| Backward backlog | Year 2008 |
| Last ingestion | 2026-08-17 |

## Repository Registry

### Core Infrastructure

- **[mmdb-meta](https://github.com/mimir-media-db/mmdb-meta)** — Cross-repository metadata and registry
- **[mmdb-schema-and-tools](https://github.com/mimir-media-db/mmdb-schema-and-tools)** — JSON schemas, validation tools, and documentation

### Data Repositories

- **[mmdb-people](https://github.com/mimir-media-db/mmdb-people)** — Global people database
- **[mmdb-2009](https://github.com/mimir-media-db/mmdb-2009)** — Movies and series from 2009
- **[mmdb-2010](https://github.com/mimir-media-db/mmdb-2010)** — Movies and series from 2010
- **[mmdb-2026](https://github.com/mimir-media-db/mmdb-2026)** — Movies and series from 2026

## Ingestion Pipeline

The MMDB ingestion pipeline runs automatically:
- **3x daily** — Backlog ingestion (forward from 2010, backward from 2008)
- **Nightly at 2 AM** — Current year (2026) ingestion

Data is sourced from [Wikidata](https://www.wikidata.org/) via SPARQL queries.

## How to Use MMDB

```bash
# Clone the repos you need
git clone --depth 1 https://github.com/mimir-media-db/mmdb-people
git clone --depth 1 https://github.com/mimir-media-db/mmdb-2026

# Data is plain JSON — query locally
cat mmdb-2026/data/movies/index.json | jq '.[0]'
```

See [mmdb-schema-and-tools](https://github.com/mimir-media-db/mmdb-schema-and-tools) for schemas, validation, and tooling.

## License

MIT
