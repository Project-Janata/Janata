#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repo = process.env.RALPH_REPO || 'Project-Janata/Janata';
const milestoneTitle = process.env.RALPH_MILESTONE || 'MSC v2 Beta';
const targetBranch = process.env.RALPH_TARGET_BRANCH || 'v2';
const branchName = process.env.RALPH_BRANCH || 'ralph/msc-v2-train';
const slackChannel = process.env.RALPH_SLACK_CHANNEL || '#priduct-updates';

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function api(pathname) {
  return JSON.parse(gh(['api', pathname]));
}

function labelNames(item) {
  return (item.labels || []).map((label) => label.name);
}

function firstLabel(labels, prefix) {
  return labels.find((label) => label.startsWith(prefix)) || '';
}

function priorityRank(item) {
  const labels = labelNames(item);
  const label = firstLabel(labels, 'priority:');
  if (label === 'priority:p0') return 0;
  if (label === 'priority:p1') return 1;
  if (label === 'priority:p2') return 2;
  if (label === 'priority:p3') return 3;
  return 9;
}

function areaRank(item) {
  const labels = labelNames(item);
  const order = [
    'area:ops',
    'area:feed',
    'area:navigation',
    'area:trust',
    'area:ios',
    'area:moderation',
    'area:beta',
    'area:profile',
    'area:performance',
    'area:accessibility',
    'area:presentation',
    'area:docs',
  ];
  const index = order.findIndex((area) => labels.includes(area));
  return index === -1 ? order.length : index;
}

function storyTitle(item) {
  return item.pull_request ? `PR #${item.number}: ${item.title}` : `Issue #${item.number}: ${item.title}`;
}

function storyDescription(item) {
  const kind = item.pull_request ? 'pull request' : 'issue';
  return `Work through GitHub ${kind} #${item.number}: ${item.title}`;
}

function criteriaFor(item) {
  const labels = labelNames(item);
  const criteria = [
    `GitHub item #${item.number} is updated with implementation status`,
    'Automated verification passes through .ralph/verify.sh',
    `If UI-facing, end-to-end UI smoke is recorded and posted to ${slackChannel}`,
    'PR includes test evidence, residual risk, and links to the GitHub issue or sprint item',
  ];

  if (item.pull_request) {
    criteria.unshift('PR is reviewed as merge, split, rebase, hold, or close');
  }
  if (labels.includes('area:ios')) {
    criteria.push('No App Store submit or publish command is run');
  }
  if (labels.includes('area:ops')) {
    criteria.push('Production secret changes are documented for human handoff if required');
  }
  if (labels.includes('area:feed')) {
    criteria.push('Empty, loading, error, signed-out, and signed-in states are checked where relevant');
  }
  if (labels.includes('area:trust')) {
    criteria.push('Unauthorized, expired, duplicate, and invalid-token edge cases are checked where relevant');
  }
  return criteria;
}

const milestones = api(`repos/${repo}/milestones?state=open&per_page=100`);
const milestone = milestones.find((entry) => entry.title === milestoneTitle);
if (!milestone) {
  throw new Error(`Milestone not found: ${milestoneTitle}`);
}

const items = api(`repos/${repo}/issues?milestone=${milestone.number}&state=open&per_page=100`);
items.sort((a, b) => {
  return (
    priorityRank(a) - priorityRank(b) ||
    areaRank(a) - areaRank(b) ||
    a.number - b.number
  );
});

const userStories = items.map((item, index) => {
  const labels = labelNames(item);
  return {
    id: `GH-${String(item.number).padStart(3, '0')}`,
    githubNumber: item.number,
    githubUrl: item.html_url,
    githubType: item.pull_request ? 'pull_request' : 'issue',
    title: storyTitle(item),
    description: storyDescription(item),
    labels,
    acceptanceCriteria: criteriaFor(item),
    priority: index + 1,
    passes: false,
    notes: '',
    requiredForBeta: true,
    mergeGate: `E2E UI test pass plus recorded video posted to ${slackChannel} before merge to ${targetBranch}`,
  };
});

const prd = {
  project: 'Project Janata MSC v2',
  branchName,
  targetBranch,
  sourceContext: {
    repo,
    milestone: milestoneTitle,
    milestoneNumber: milestone.number,
    milestoneUrl: milestone.html_url,
    generatedAt: new Date().toISOString(),
    slackChannel,
    launchWindow: 'MSC 2026, July 30-August 4',
    presentationSlot: '2026-08-01 20:30-20:45',
  },
  executionPolicy: {
    targetBranch,
    prdPersistence: 'local-only; do not commit .ralph/prd.json',
    mergePolicy: `A feature PR may be merged into ${targetBranch} only after automated checks, end-to-end UI testing, design review, and recorded video evidence posted to ${slackChannel}.`,
    appStorePolicy: 'Do not submit or publish to the iOS App Store. Prepare everything up to the handoff point for a human submission.',
    slackPolicy: `Use the Janata developer agent Slack bot in ${slackChannel} for daily updates and video evidence.`,
    secretsPolicy: 'Investigate, document, and prepare safe changes, but human owns any manual production secret cleanup.',
    betaScope: 'All listed stories are required for beta unless the user explicitly changes scope.',
  },
  verificationCommand: 'bash .ralph/verify.sh',
  userStories,
};

fs.mkdirSync(path.join(process.cwd(), '.ralph'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), '.ralph', 'prd.json'), `${JSON.stringify(prd, null, 2)}\n`);
console.log(`Wrote .ralph/prd.json with ${userStories.length} stories from ${milestoneTitle}.`);

