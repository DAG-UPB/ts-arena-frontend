# API Structure Documentation
## Structure

```
/src/app/api/v1/
├── definitions/
│   ├── route.ts                                  GET /api/v1/definitions
│   └── [definitionId]/
│       └── rounds/
│           └── route.ts                          GET /api/v1/definitions/{id}/rounds
├── rounds/
│   ├── route.ts                                  GET /api/v1/rounds
│   ├── metadata/
│   │   └── route.ts                              GET /api/v1/rounds/metadata
│   └── [roundId]/
│       ├── route.ts                              GET /api/v1/rounds/{id}
│       ├── leaderboard/
│       │   └── route.ts                          GET /api/v1/rounds/{id}/leaderboard
│       ├── models/
│       │   └── route.ts                          GET /api/v1/rounds/{id}/models
│       └── series/
│           ├── route.ts                          GET /api/v1/rounds/{id}/series
│           └── [seriesId]/
│               ├── data/
│               │   └── route.ts                  GET /api/v1/rounds/{id}/series/{id}/data
│               └── forecasts/
│                   └── route.ts                  GET /api/v1/rounds/{id}/series/{id}/forecasts
└── models/
    ├── arena-scores/
    │   └── route.ts                              GET /api/v1/models/arena-scores
    ├── arena-score-filters/
    │   └── route.ts                              GET /api/v1/models/arena-score-filters
    └── [modelId]/
        ├── route.ts                              GET /api/v1/models/{id}
        ├── arena-scores/
        │   └── route.ts                          GET /api/v1/models/{id}/arena-scores
        ├── series-by-definition/
        │   └── route.ts                          GET /api/v1/models/{id}/series-by-definition
        └── definitions/
            └── [definitionId]/
                └── series/
                    └── [seriesId]/
                        └── forecasts/
                            └── route.ts          GET /api/v1/models/{id}/definitions/{id}/series/{id}/forecasts
```

## Service Layer

The service layer has been organized into three domain-specific files:

### definitionService.ts
Handles challenge definition-related API calls:
- `getDefinitionRounds()` - Get rounds for a specific definition

### roundService.ts
Handles round-related API calls:
- `getChallenges()` - List all rounds (previously called challenges)
- `getRoundsMetadata()` - Get filter metadata
- `getChallengeSeries()` - Get series for a round
- `getSeriesData()` - Get time series data
- `getSeriesForecasts()` - Get forecasts for a series
- `getRoundModels()` - Get models participating in a round

### modelService.ts
Handles model-related API calls:
- `getArenaScores()` - Get Arena Score leaderboards with filters
- `getArenaScoreFilters()` - Get available Arena Score filters
- `getModelDetails()` - Get model details
- `getModelArenaScores()` - Get model Arena Score history
- `getModelSeriesByDefinition()` - Get series grouped by definition
- `getModelSeriesForecasts()` - Get model forecasts across rounds

## Authentication

All API routes forward the `X-API-Key` header to the backend API for authentication.
