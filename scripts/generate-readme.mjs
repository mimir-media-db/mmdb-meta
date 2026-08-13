#!/usr/bin/env node

/**
 * Generates README.md from repos.json and ingestion/state.json
 */

import { readFileSync, writeFileSync } from 'fs';

const repos = JSON.parse(readFileSync('repos.json', 'utf8'));
const state = JSON.parse(readFileSync('ingestion/state.json', 'utf8'));

const dataRepos = repos.repositories.filter(r => r.type === 'data');
const infraRepos = repos.repositories.filter(r => r.type === 'infrastructure');
const yearRepos = dataRepos.filter(r => r.year);
const years = yearRepos.map(r => r.year).sort((a, b) => a - b);

const totalMovies = state.total_ingested?.movies || 0;
const totalSeries = state.total_ingested?.series || 0;
const totalPeople = state.total_ingested?.people || 0;
const lastRun = state.last_run ? new Date(state.last_run).toISOString().split('T')[0] : 'never';
const forwardYear = state.backlog_current_year || '?';
const backwardYear = state.backward_year || '?';
const currentYear = new Date().getFullYear();

const readme = `# MMDB Meta

> Cross-repository metadata and registry for the MMDB ecosystem.

## What is This?

This repository contains:
- **repos.json** — Registry of all MMDB repositories
- **ingestion/state.json** — Ingestion pipeline state and progress

## Statistics

| Metric | Value |
|--------|-------|
| Total repositories | ${repos.repositories.length} |
| Data repositories | ${dataRepos.length} |
| Movies ingested | ${totalMovies.toLocaleString()} |
| Series ingested | ${totalSeries.toLocaleString()} |
| People ingested | ${totalPeople.toLocaleString()} |
| Years covered | ${years.length > 0 ? `${years[0]}\u2013${years[years.length - 1]}` : 'none'} |
| Forward backlog | Year ${forwardYear} |
| Backward backlog | Year ${backwardYear} |
| Last ingestion | ${lastRun} |

## Repository Registry

### Core Infrastructure

${infraRepos.map(r => `- **[${r.name}](${r.url})** \u2014 ${r.description}`).join('\n')}

### Data Repositories

${dataRepos.map(r => `- **[${r.name}](${r.url})** \u2014 ${r.description}`).join('\n')}

## Ingestion Pipeline

The MMDB ingestion pipeline runs automatically:
- **3x daily** \u2014 Backlog ingestion (forward from ${forwardYear}, backward from ${backwardYear})
- **Nightly at 2 AM** \u2014 Current year (${currentYear}) ingestion

Data is sourced from [Wikidata](https://www.wikidata.org/) via SPARQL queries.

## How to Use MMDB

\`\`\`bash
# Clone the repos you need
git clone --depth 1 https://github.com/mimir-media-db/mmdb-people
git clone --depth 1 https://github.com/mimir-media-db/mmdb-2026

# Data is plain JSON \u2014 query locally
cat mmdb-2026/data/movies/index.json | jq '.[0]'
\`\`\`

See [mmdb-schema-and-tools](https://github.com/mimir-media-db/mmdb-schema-and-tools) for schemas, validation, and tooling.

## License

MIT
`;

writeFileSync('README.md', readme);
console.log('README.md generated');
console.log(`  Repos: ${repos.repositories.length}, Movies: ${totalMovies}, Series: ${totalSeries}, People: ${totalPeople}`);
