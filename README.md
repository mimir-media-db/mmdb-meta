# MMDB — Mimir Media Database

<p align="center">
  <img src="assets/logo.png" alt="MMDB Logo" width="200">
</p>

> Open-source media metadata. Plain JSON. Distributed via Git.

## 📊 Statistics

| Metric | Value |
|--------|-------|
| 🎬 Movies | **87,115** |
| 📺 Series | **31,727** |
| 👤 People | **76,367** |
| 📅 Years covered | **2000-2026** (27 repos) |
| 🔤 People repos | **26** (a–z) |
| 📦 Total repos | **56** |

*Last updated: 2026-08-20*

## 🏗️ Repository Structure

All data lives in the [mimir-media-db](https://github.com/mimir-media-db) GitHub organization.

### Year Repos (27)

Each year has its own repository containing movies and series released that year:

```
mmdb-2000  →  mmdb-2026
```

Format: `mmdb-{YYYY}` — e.g., `mmdb-2024`, `mmdb-2010`

#### Top Years by Movie Count

| Year | Movies | Series |
|------|--------|--------|
| [2019](https://github.com/mimir-media-db/mmdb-2019) | 5,672 | 1,254 |
| [2012](https://github.com/mimir-media-db/mmdb-2012) | 5,486 | 1,648 |
| [2011](https://github.com/mimir-media-db/mmdb-2011) | 5,068 | 1,603 |
| [2009](https://github.com/mimir-media-db/mmdb-2009) | 5,066 | 1,455 |
| [2010](https://github.com/mimir-media-db/mmdb-2010) | 5,058 | 1,428 |
| [2008](https://github.com/mimir-media-db/mmdb-2008) | 4,938 | 1,401 |
| [2007](https://github.com/mimir-media-db/mmdb-2007) | 4,697 | 1,274 |
| [2022](https://github.com/mimir-media-db/mmdb-2022) | 4,552 | 1,373 |
| [2006](https://github.com/mimir-media-db/mmdb-2006) | 4,502 | 1,190 |
| [2023](https://github.com/mimir-media-db/mmdb-2023) | 4,425 | 1,228 |

### People Repos (26)

People data is sharded alphabetically by last name initial:

```
mmdb-people-a  →  mmdb-people-z
```

Format: `mmdb-people-{letter}` — e.g., `mmdb-people-a`, `mmdb-people-m`

Each repo contains person records (actors, directors, producers, writers) whose last name starts with that letter. This split keeps individual repos under GitHub's size limits while providing fast clones.

| Letter | Count | | Letter | Count |
|--------|-------|-|--------|-------|
| A | 0 | N | 5,256 |
| B | 6,379 | O | 2,270 |
| C | 0 | P | 7,246 |
| D | 0 | Q | 152 |
| E | 5,877 | R | 0 |
| F | 4,101 | S | 0 |
| G | 5,543 | T | 6,896 |
| H | 4,498 | U | 697 |
| I | 3,037 | V | 3,611 |
| J | 0 | W | 1,762 |
| K | 7,530 | X | 267 |
| L | 7,675 | Y | 2,265 |
| M | 0 | Z | 1,305 |

### Infrastructure

- **[mmdb-meta](https://github.com/mimir-media-db/mmdb-meta)** — Cross-repository metadata and registry for MMDB
- **[mmdb-people](https://github.com/mimir-media-db/mmdb-people)** — Global people database for MMDB
- **[mmdb-schema-and-tools](https://github.com/mimir-media-db/mmdb-schema-and-tools)** — JSON schemas, validation tools, ingestion pipeline

## 📖 How to Use

```bash
# Clone a specific year
git clone --depth 1 https://github.com/mimir-media-db/mmdb-2024

# Browse movies
ls mmdb-2024/data/movies/
cat mmdb-2024/data/movies/index.json | jq '.[0:5]'

# Clone people for a letter
git clone --depth 1 https://github.com/mimir-media-db/mmdb-people-s

# Browse people
cat mmdb-people-s/data/people/index.json | jq '.[0:3]'
```

### Data Format

All data is plain JSON following versioned schemas. Each entity has:
- A stable ID: `mmdb-{type}-{wikidata-id}`
- A schema version header
- Structured metadata from Wikidata

See [mmdb-schema-and-tools](https://github.com/mimir-media-db/mmdb-schema-and-tools) for schemas and validation tools.

## 🔄 Automated Updates

Statistics are updated daily via GitHub Actions. The ingestion pipeline runs 3× daily, pulling new data from [Wikidata](https://www.wikidata.org/) via SPARQL queries.

## 📄 License

Data: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (sourced from Wikidata)
Code & Branding: MIT
