#!/usr/bin/env node

/**
 * generate-readme.mjs — Generates README.md from the new repos.json format.
 *
 * Features:
 * - Total stats prominently displayed
 * - Year repos as a range (not individual listing)
 * - People repos as a range (not individual listing)
 * - Top years by movie count
 * - Last updated timestamp
 * - People alphabetical split explanation
 */

import { readFileSync, writeFileSync } from 'fs';

const repos = JSON.parse(readFileSync('repos.json', 'utf8'));

const yearRepos = repos.repositories
  .filter((r) => r.type === 'year')
  .sort((a, b) => a.year - b.year);

const peopleRepos = repos.repositories
  .filter((r) => r.type === 'people')
  .sort((a, b) => a.letter.localeCompare(b.letter));

const infraRepos = repos.repositories.filter((r) => r.type === 'infrastructure');

const { totals } = repos;

// Top 10 years by movie count
const topYears = [...yearRepos]
  .sort((a, b) => b.movies - a.movies)
  .slice(0, 10);

// People letter range
const letters = peopleRepos.map((r) => r.letter);
const letterRange =
  letters.length > 0
    ? `${letters[0]}–${letters[letters.length - 1]}`
    : 'none';

const readme = `# MMDB — Mimir Media Database

<p align="center">
  <img src="assets/logo.png" alt="MMDB Logo" width="200">
</p>

> Open-source media metadata. Plain JSON. Distributed via Git.

## 📊 Statistics

| Metric | Value |
|--------|-------|
| 🎬 Movies | **${totals.movies.toLocaleString()}** |
| 📺 Series | **${totals.series.toLocaleString()}** |
| 👤 People | **${totals.people.toLocaleString()}** |
| 📅 Years covered | **${totals.years_covered}** (${totals.year_repos} repos) |
| 🔤 People repos | **${totals.people_repos}** (a–z) |
| 📦 Total repos | **${repos.repositories.length}** |

*Last updated: ${repos.last_updated}*

## 🏗️ Repository Structure

All data lives in the [mimir-media-db](https://github.com/${repos.org}) GitHub organization.

### Year Repos (${totals.year_repos})

Each year has its own repository containing movies and series released that year:

\`\`\`
mmdb-${yearRepos[0]?.year || 2000}  →  mmdb-${yearRepos[yearRepos.length - 1]?.year || 2026}
\`\`\`

Format: \`mmdb-{YYYY}\` — e.g., \`mmdb-2024\`, \`mmdb-2010\`

#### Top Years by Movie Count

| Year | Movies | Series |
|------|--------|--------|
${topYears.map((r) => `| [${r.year}](${r.url}) | ${r.movies.toLocaleString()} | ${r.series.toLocaleString()} |`).join('\n')}

### People Repos (${totals.people_repos})

People data is sharded alphabetically by last name initial:

\`\`\`
mmdb-people-a  →  mmdb-people-z
\`\`\`

Format: \`mmdb-people-{letter}\` — e.g., \`mmdb-people-a\`, \`mmdb-people-m\`

Each repo contains person records (actors, directors, producers, writers) whose last name starts with that letter. This split keeps individual repos under GitHub's size limits while providing fast clones.

| Letter | Count | | Letter | Count |
|--------|-------|-|--------|-------|
${formatPeopleTable(peopleRepos)}

### Infrastructure

${infraRepos.map((r) => `- **[${r.name}](${r.url})** — ${r.description || 'Infrastructure'}`).join('\n')}

## 📖 How to Use

\`\`\`bash
# Clone a specific year
git clone --depth 1 https://github.com/${repos.org}/mmdb-2024

# Browse movies
ls mmdb-2024/data/movies/
cat mmdb-2024/data/movies/index.json | jq '.[0:5]'

# Clone people for a letter
git clone --depth 1 https://github.com/${repos.org}/mmdb-people-s

# Browse people
cat mmdb-people-s/data/people/index.json | jq '.[0:3]'
\`\`\`

### Data Format

All data is plain JSON following versioned schemas. Each entity has:
- A stable ID: \`mmdb-{type}-{wikidata-id}\`
- A schema version header
- Structured metadata from Wikidata

See [mmdb-schema-and-tools](https://github.com/${repos.org}/mmdb-schema-and-tools) for schemas and validation tools.

## 🔄 Automated Updates

Statistics are updated daily via GitHub Actions. The ingestion pipeline runs 3× daily, pulling new data from [Wikidata](https://www.wikidata.org/) via SPARQL queries.

## 📄 License

Data: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (sourced from Wikidata)
Code & Branding: MIT
`;

writeFileSync('README.md', readme);
console.log('✅ README.md generated');
console.log(
  `   ${totals.movies.toLocaleString()} movies, ${totals.series.toLocaleString()} series, ${totals.people.toLocaleString()} people`
);

// --- Helpers ---

function formatPeopleTable(peopleRepos) {
  const rows = [];
  const half = Math.ceil(peopleRepos.length / 2);
  for (let i = 0; i < half; i++) {
    const left = peopleRepos[i];
    const right = peopleRepos[i + half];
    const leftStr = left
      ? `| ${left.letter.toUpperCase()} | ${left.count.toLocaleString()} |`
      : '| | |';
    const rightStr = right
      ? ` ${right.letter.toUpperCase()} | ${right.count.toLocaleString()} |`
      : ' | |';
    rows.push(`${leftStr}${rightStr}`);
  }
  return rows.join('\n');
}
