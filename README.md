---
title: TS-Arena
emoji: 🚀
colorFrom: red
colorTo: red
sdk: docker
pinned: false
app_port: 3000
short_description: Time Series Forecasting Arena
---
# TS-Arena Frontend

## Concept

TS-Arena is a live forecasting benchmarking platform designed for **pre-registered forecasts into the real future**. This approach ensures rigorous, information leakage-free evaluations by comparing model predictions against data that did not exist at the time of the forecast.


For more information visit our [Git repository](https://github.com/DAG-UPB/ts-arena) or have a look at our paper at [arxiv.org/abs/2512.20761](https://arxiv.org/abs/2512.20761).

## News section

`/news` renders platform announcements from Markdown files in `content/news/`. That
directory is **not** part of this repository — it is populated from a separate content
repo when the image is built, so an instance you run does not inherit TS-Arena's own
announcements. With no content repo configured, the directory stays empty and the News
tab does not appear.

Point a build at a content repo with two build args:

| Build arg | Default | Meaning |
|---|---|---|
| `NEWS_CONTENT_REPO` | *(empty)* | Clone URL of the content repo. Empty = no news section. |
| `NEWS_CONTENT_REF` | `main` | Branch or tag to clone. |

Use a **public** repo: build args are recorded in the image history, so a URL carrying an
access token would be readable by anyone who can pull the image.

The content repo is just Markdown files at its root, one per post. The file name is the
URL slug (`elo-to-arena-score.md` → `/news/elo-to-arena-score`):

```markdown
---
title: Ranking switches from Elo to Arena Score
date: 2026-07-23
summary: Optional one-line teaser shown in the listing.
author: Optional byline
---

Body in Markdown. Headings, lists, links, tables, code and block quotes are styled.
```

`title` and `date` are required; a post missing either is skipped with a build warning.
Posts are listed newest first by `date`.

Publishing a post is a push to the content repo followed by a redeploy of the frontend —
the Markdown is baked into the image, so a rebuild is what makes a new post appear.

For local development, drop `.md` files straight into `content/news/` (it is gitignored)
and run `npm run dev`.
