#!/usr/bin/env node

/**
 * update-stats.mjs — Queries the mimir-media-db GitHub org to build
 * accurate repos.json and ingestion/state.json from live data.
 *
 * Auth: Uses GITHUB_TOKEN env var (CI) or falls back to GitHub App
 * credentials from ~/repos/mmdb/functions/.env (local development).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const ORG = 'mimir-media-db';
const API_BASE = 'https://api.github.com';
const DELAY_MS = 200;

// --- Auth ---

/**
 * Load GitHub App auth from .env file (same approach as mmdb/functions/scripts/lib/github-app-auth.mjs)
 */
async function getAppToken(envPath) {
  // Dynamic import of the shared auth library
  const authLib = await import(
    join(homedir(), 'repos', 'mmdb', 'functions', 'scripts', 'lib', 'github-app-auth.mjs')
  );

  const { token } = await authLib.loadGitHubAuth(envPath);
  if (!token) {
    throw new Error('Failed to get token from GitHub App auth');
  }
  return token;
}

async function getToken() {
  // Priority 1: GITHUB_TOKEN env var (CI / manual)
  if (process.env.GITHUB_TOKEN) {
    console.log('Using GITHUB_TOKEN from environment');
    return process.env.GITHUB_TOKEN;
  }

  // Priority 2: GitHub App credentials from mmdb functions .env
  const envPath = join(homedir(), 'repos', 'mmdb', 'functions', '.env');
  if (!existsSync(envPath)) {
    throw new Error(
      'No GITHUB_TOKEN set and no App credentials found at ' + envPath
    );
  }

  console.log('Using GitHub App credentials from', envPath);
  return getAppToken(envPath);
}

// --- API helpers ---

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiFetch(token, path) {
  await sleep(DELAY_MS);
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`API error ${res.status} for ${path}: ${await res.text()}`);
  }
  return res.json();
}

async function fetchAllRepos(token) {
  const repos = [];
  let page = 1;
  while (true) {
    const batch = await apiFetch(
      token,
      `/orgs/${ORG}/repos?per_page=100&page=${page}&type=public`
    );
    if (!batch || batch.length === 0) break;
    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return repos;
}

async function fetchIndexCount(token, repoName, indexPath) {
  const data = await apiFetch(
    token,
    `/repos/${ORG}/${repoName}/contents/${indexPath}`
  );
  if (!data || !data.content) return 0;

  const content = Buffer.from(data.content, 'base64').toString('utf8');
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

// --- Categorize repos ---

const INFRA_DESCRIPTIONS = {
  'mmdb-meta': 'Cross-repository metadata and registry',
  'mmdb-people': 'Legacy people repo (superseded by mmdb-people-{a-z})',
  'mmdb-schema-and-tools': 'JSON schemas, validation tools, ingestion pipeline',
};

function categorizeRepo(name) {
  const yearMatch = name.match(/^mmdb-(\d{4})$/);
  if (yearMatch) return { type: 'year', year: parseInt(yearMatch[1]) };

  const peopleMatch = name.match(/^mmdb-people-([a-z])$/);
  if (peopleMatch) return { type: 'people', letter: peopleMatch[1] };

  return { type: 'infrastructure' };
}

// --- Main ---

async function main() {
  console.log('🔄 Fetching statistics for mimir-media-db org...\n');

  const token = await getToken();
  const allRepos = await fetchAllRepos(token);

  console.log(`Found ${allRepos.length} repos in ${ORG}\n`);

  const repositories = [];
  let totalMovies = 0;
  let totalSeries = 0;
  let totalPeople = 0;
  let yearRepoCount = 0;
  let peopleRepoCount = 0;
  let minYear = Infinity;
  let maxYear = -Infinity;

  // Sort repos for consistent output
  const sortedRepos = allRepos
    .filter((r) => r.name.startsWith('mmdb'))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const repo of sortedRepos) {
    const cat = categorizeRepo(repo.name);

    if (cat.type === 'year') {
      const movies = await fetchIndexCount(
        token,
        repo.name,
        'data/movies/index.json'
      );
      const series = await fetchIndexCount(
        token,
        repo.name,
        'data/series/index.json'
      );

      repositories.push({
        name: repo.name,
        type: 'year',
        year: cat.year,
        url: repo.html_url,
        movies,
        series,
      });

      totalMovies += movies;
      totalSeries += series;
      yearRepoCount++;
      minYear = Math.min(minYear, cat.year);
      maxYear = Math.max(maxYear, cat.year);

      console.log(
        `  📅 ${repo.name}: ${movies} movies, ${series} series`
      );
    } else if (cat.type === 'people') {
      const count = await fetchIndexCount(
        token,
        repo.name,
        'data/people/index.json'
      );

      repositories.push({
        name: repo.name,
        type: 'people',
        letter: cat.letter,
        url: repo.html_url,
        count,
      });

      totalPeople += count;
      peopleRepoCount++;

      console.log(`  👤 ${repo.name}: ${count} people`);
    } else {
      repositories.push({
        name: repo.name,
        type: 'infrastructure',
        url: repo.html_url,
        description: repo.description || INFRA_DESCRIPTIONS[repo.name] || '',
      });

      console.log(`  🔧 ${repo.name}: infrastructure`);
    }
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // --- Write repos.json ---

  const reposJson = {
    version: '2.0.0',
    last_updated: dateStr,
    org: ORG,
    repositories,
    totals: {
      movies: totalMovies,
      series: totalSeries,
      people: totalPeople,
      year_repos: yearRepoCount,
      people_repos: peopleRepoCount,
      years_covered: `${minYear}-${maxYear}`,
    },
  };

  writeFileSync('repos.json', JSON.stringify(reposJson, null, 2) + '\n');
  console.log('\n✅ repos.json written');

  // --- Write ingestion/state.json ---

  if (!existsSync('ingestion')) {
    mkdirSync('ingestion');
  }

  const stateJson = {
    last_updated: now.toISOString(),
    totals: {
      movies: totalMovies,
      series: totalSeries,
      people: totalPeople,
    },
    year_range: { from: minYear, to: maxYear },
    people_repos: peopleRepoCount,
    year_repos: yearRepoCount,
  };

  writeFileSync(
    'ingestion/state.json',
    JSON.stringify(stateJson, null, 2) + '\n'
  );
  console.log('✅ ingestion/state.json written');

  // --- Summary ---

  console.log('\n📊 Final Statistics:');
  console.log(`   Movies:  ${totalMovies.toLocaleString()}`);
  console.log(`   Series:  ${totalSeries.toLocaleString()}`);
  console.log(`   People:  ${totalPeople.toLocaleString()}`);
  console.log(`   Year repos: ${yearRepoCount} (${minYear}–${maxYear})`);
  console.log(`   People repos: ${peopleRepoCount}`);
  console.log(`   Total repos: ${repositories.length}`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
