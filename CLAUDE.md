# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the **ts-arena-frontend** submodule of the TS-Arena meta-repo. For the full architectural picture (how this fits with `ts-arena-backend`, `ts-arena-models`, and the FPRP concept), see `../CLAUDE.md` in the meta-repo.

## Component summary

Next.js 16 + React 19 + Tailwind 4 + TypeScript dashboard. The upstream `README.md` still describes the project as "Streamlit" — that is outdated.

```bash
npm run dev          # local dev
npm run build        # production build (used by Dockerfile)
npm run lint         # eslint
npm run lint:fix     # eslint --fix
```

Layout:
- `src/app/` — App Router routes (`models/`, `challenges/`, `add-model/`, `backtesting-archive/`, `about/`, `impressum/`, plus an `api/` route handler).
- `src/services/` — wrappers around `dashboard-api` calls.
- `src/components/` — shared UI (Plotly charts, ranking tables, breadcrumbs, etc.).
- `src/types/challenge.ts` — type contracts.

The Dockerfile builds a Next.js standalone image. Deployment target is HuggingFace Spaces (`app_port: 3000`, see `README.md` frontmatter); `https://huggingface.co/spaces/DAG-UPB/TS-Arena` is whitelisted in the `dashboard-api` CORS list on the backend.

## Workflow rules

- **Always use the GitHub CLI (`gh`) instead of `git` for remote operations.** The git remote is SSH with a passphrase-protected key — there is no passphrase available, so `git fetch`/`pull`/`push`/`clone` will hang. Use `gh repo clone`, `gh pr create`, `gh pr checkout`, `gh api …`. Local-only git (`status`, `diff`, `log`, `add`, `commit`, `branch`, `checkout` of existing refs) is fine.
- **Always work on the `dev` branch.** Before starting any task, ensure `dev` is checked out and synced with the remote. Commit and push on `dev` — never on `main`/`master`.
- **Redeploy flow.** When asked to redeploy, first push the change to `dev`, then redeploy the matching container via `../cc_scripts/coolify.py redeploy <name>` (use `../cc_scripts/coolify.py list` to find the exact resource name).
- **"Work on the next issue" flow.** Use `../cc_scripts/gitlab_issues.py` to list open issues (defaults to group `13019` on `git.uni-paderborn.de`) and `--project <id> --issue <iid>` to fetch a specific issue with comments.
