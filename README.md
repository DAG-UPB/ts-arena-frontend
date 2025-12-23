---
title: TS Arena
emoji: 🚀
colorFrom: red
colorTo: red
sdk: docker
app_port: 8501
tags:
- streamlit
models:
- google/timesfm-2.0-500m-pytorch
- Maple728/TimeMoE-50M
- Salesforce/moirai-1.1-R-large
- thuml/sundial-base-128m

pinned: false
short_description: Time Series Forecasting Arena
---

# TS-Arena Streamlit Dashboard

This is a Streamlit version of the TS-Arena Challenge Dashboard.

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
export X_API_URL="your_api_url_here"
export X_API_KEY="your_api_key_here"
```

Or create a `.env` file with:
```
X_API_URL=your_api_url_here
X_API_KEY=your_api_key_here
```

## Running the App

```bash
streamlit run app.py
```

The app will be available at `http://localhost:8501`

## Features

- **Model Ranking**: View and filter model rankings based on performance metrics (Tab 1)
- **Challenge Visualization**: Select and visualize active and completed challenges (Tab 2)
- **Time Series Selection**: Choose specific time series to analyze within a challenge
- **Interactive Plots**: Plotly charts with zoom, pan, and hover features
- **Upcoming Challenges**: View upcoming challenges in the sidebar
- **Add Model**: Information on how to participate and register your models (Tab 3)

## Differences from Gradio Version

Streamlit has some differences in behavior compared to Gradio:

1. **State Management**: Streamlit uses session state and reruns the entire script on interaction
2. **Layout**: Streamlit uses `st.sidebar` for the sidebar and columns for layout
3. **Interactivity**: Dropdowns and multiselect widgets automatically trigger reruns
4. **Tabs**: Uses `st.tabs()` instead of Gradio's `gr.Tab()`

## File Structure

- `app.py` - Main Streamlit application
- `utils/api_client.py` - API client for fetching challenge data
- `utils/utils.py` - Utility functions for parsing durations
- `requirements.txt` - Python dependencies
