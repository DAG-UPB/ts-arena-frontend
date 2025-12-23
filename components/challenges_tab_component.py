from datetime import datetime, timezone
import sys
import traceback
from typing import Any, Dict, List, Optional
import pandas as pd
from components.filter_models_component import render_filter_models_component
import plotly.graph_objects as go
import plotly.express as px
import numpy as np
import streamlit as st

from components.filter_component import render_filter_component, set_challenges_session_state
from utils.api_client import ChallengeStatus, DashboardAPIClient, hash_func_dashboard_api_client
from utils.utils import duration_to_max_unit, parse_iso8601_duration

    
def get_challenge_horizon_steps_from_series(series_list):
    """
    Uses the series list to determine the forecast horizon in steps.
    """
    frequency_iso = series_list[0].get('frequency', 'PT1H')
    horizon_iso = series_list[0].get('horizon')
    return get_challenge_horizon(frequency_iso, horizon_iso)
    

def get_challenge_horizon_steps_from_challenge(challenge):
    frequency_iso = challenge.get('frequency', 'PT1H')
    horizon_iso = challenge.get('horizon')
    return get_challenge_horizon(frequency_iso, horizon_iso)


def get_challenge_horizon(frequency_iso: str, horizon_iso: str) -> int:
    if horizon_iso and frequency_iso:
        try:
            _, horizon_seconds = parse_iso8601_duration(horizon_iso)
            _, frequency_seconds = parse_iso8601_duration(frequency_iso)
            if frequency_seconds > 0:
                steps = int(horizon_seconds / frequency_seconds)
                return steps
        except Exception as parse_e:
            print(f"Error parsing horizon: {parse_e}", file=sys.stderr)
    return -1
    

@st.cache_data(hash_funcs={DashboardAPIClient: hash_func_dashboard_api_client}, show_spinner="Loading forecasts...")
def get_forecasts(api_client: DashboardAPIClient, challenge_id: str, series_id: int) -> Dict[str, Any]:
    forecasts = api_client.get_series_forecasts(challenge_id, series_id)
    forecasts = dict(
        sorted(forecasts.items(), key=lambda item: item[1]["current_mase"])
    )
    return forecasts


def get_series_choices_for_challenge(challenge_id, api_client: DashboardAPIClient) -> List[Dict[str, Any]]:
    """Get list of time series for a given challenge."""
    if not challenge_id:
        return []
    
    try:
        # Don't try to get series for mock challenges
        if str(challenge_id).startswith('mock'):
            return []
        
        # Get series list from API
        series_list = api_client.get_challenge_series(challenge_id)
        if not series_list:
            return []
        
        # Format series choices with ID and name
        choices = []
        for series_info in series_list:
            series_id = series_info.get('series_id')
            series_name = series_info.get('name', f'Series {series_id}')
            series_description = series_info.get('description', series_id)
            choices.append({
                'id': series_id,
                'name': series_name,
                'description': series_description,
                'display': f"{series_description} (ID: {series_id})"
            })
        
        return choices
    except Exception as e:
        print(f"Error getting series choices: {e}", file=sys.stderr)
        return []
    

@st.cache_data(show_spinner="Drawing plots...")
def make_demo_forecast_plot(forecast_horizon, challenge_desc="Demo Challenge"):
    """Generate demo forecast plot with synthetic data."""
    np.random.seed(42)
    
    historical_len = 50
    forecast_len = int(forecast_horizon)
    time = np.arange(historical_len + forecast_len)
    
    historical_data = 100 + 10 * np.sin(np.linspace(0, 4 * np.pi, historical_len)) + np.random.normal(0, 2, historical_len)
    
    fig = go.Figure()
    
    # Add historical data
    fig.add_trace(go.Scatter(
        x=time[:historical_len],
        y=historical_data,
        mode='lines',
        name='Historical Data',
        line=dict(color='black', width=3),
        legendgroup='historical',
    ))
    
    model_names = [
        "ARIMA", "Prophet", "LSTM", "XGBoost", 
        "Random Forest", "ETS", "Theta", "TBATS",
        "Neural Prophet", "Ensemble"
    ]
    
    colors = px.colors.qualitative.Plotly + px.colors.qualitative.Set2
    
    for i, model_name in enumerate(model_names):
        base_forecast = 100 + 10 * np.sin(np.linspace(4 * np.pi, 4 * np.pi + 2 * np.pi, forecast_len))
        noise = np.random.normal(0, 1 + i * 0.3, forecast_len)
        trend = np.linspace(0, i * 0.5, forecast_len)
        forecast = base_forecast + noise + trend
        
        forecast_x = np.concatenate([[time[historical_len - 1]], time[historical_len:]])
        forecast_y = np.concatenate([[historical_data[-1]], forecast])
        
        fig.add_trace(go.Scatter(
            x=forecast_x,
            y=forecast_y,
            mode='lines',
            name=model_name,
            line=dict(color=colors[i % len(colors)], width=2, dash='solid'),
            legendgroup=f'model_{i}',
            hovertemplate=f'<b>{model_name}</b><br>Time: %{{x}}<br>Value: %{{y:.2f}}<extra></extra>'
        ))
        
        upper_bound = forecast + (3 + i * 0.5)
        lower_bound = forecast - (3 + i * 0.5)
        
        fig.add_trace(go.Scatter(
            x=np.concatenate([time[historical_len:], time[historical_len:][::-1]]),
            y=np.concatenate([upper_bound, lower_bound[::-1]]),
            fill='toself',
            fillcolor=colors[i % len(colors)],
            opacity=0.15,
            line=dict(width=0),
            name=f'{model_name} CI',
            legendgroup=f'model_{i}',
            showlegend=False,
            hoverinfo='skip'
        ))
    
    fig.add_vline(
        x=historical_len - 0.5,
        line_dash="dash",
        line_color="gray",
        opacity=0.7,
        annotation_text="Forecast Start",
        annotation_position="top"
    )
    
    fig.update_layout(
        title={
            'text': f'📈 {challenge_desc} - Forecast Comparison ({forecast_len} steps ahead)',
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 20, 'color': '#2c3e50'}
        },
        xaxis_title='Time',
        yaxis_title='Value',
        hovermode='x unified',
        template='plotly_white',
        height=600,
        font=dict(family="Arial, sans-serif", size=12),
        plot_bgcolor='rgba(245, 245, 245, 0.5)',
    )
    
    fig.update_xaxes(
        showgrid=True,
        gridwidth=1,
        gridcolor='lightgray',
        showline=True,
        linewidth=2,
        linecolor='gray'
    )
    
    fig.update_yaxes(
        showgrid=True,
        gridwidth=1,
        gridcolor='lightgray',
        showline=True,
        linewidth=2,
        linecolor='gray'
    )
    
    return fig


@st.cache_data(hash_funcs={DashboardAPIClient: hash_func_dashboard_api_client}, show_spinner="Drawing plots...")
def plot_real_challenge_data(challenge: Dict[str, Any], forecast_horizon: int, api_client: DashboardAPIClient, selected_series_ids: List[int] = None, selected_readable_model_ids: List[str] = None) -> Optional[go.Figure]:
    """Plot real challenge data from API with selected series and forecasts."""
    try:
        challenge_id = challenge.get('challenge_id')
        challenge_desc = challenge.get('description', 'Challenge')
        
        # Get all series for this challenge
        series_list = api_client.get_challenge_series(challenge_id)
        if not series_list:
            return None
        
        # Filter series based on selection
        if selected_series_ids:
            series_list = [s for s in series_list if s.get('series_id') in selected_series_ids]
        
        if not series_list:
            fig = go.Figure()
            fig.add_annotation(
                text="No series selected or found",
                xref="paper", yref="paper",
                x=0.5, y=0.5, showarrow=False,
                font=dict(size=16, color="gray")
            )
            return fig
        
        # Create figure
        fig = go.Figure()
        
        # Color palette for models
        colors = px.colors.qualitative.Plotly + px.colors.qualitative.Set2 + px.colors.qualitative.Set3
        model_color_map = {}
        color_idx = 0
        
        inferred_frequency = None
        steps_to_show = forecast_horizon
        
        # Process each series
        for series_idx, series_info in enumerate(series_list):
            series_id = series_info.get('series_id')
            series_name = series_info.get('name', f'Series {series_id}')
            
            # Get context data (historical)
            context_df = api_client.get_challenge_data_for_series(
                challenge_id, series_id,
                series_info.get('context_start_time'),
                series_info.get('context_end_time')
            )
            
            # Get actual data (test/live data)
            actual_df = api_client.get_challenge_data_for_series(
                challenge_id, series_id,
                series_info.get('context_end_time'),
                series_info.get('end_time')
            )
            
            # Infer frequency
            if inferred_frequency is None and not context_df.empty and len(context_df) >= 2:
                try:
                    frequency_iso = series_info.get('frequency', 'PT1H')
                    horizon_iso = series_info.get('horizon') or challenge.get('horizon')
                    
                    if horizon_iso and frequency_iso:
                        _, horizon_seconds = parse_iso8601_duration(horizon_iso)
                        _, frequency_seconds = parse_iso8601_duration(frequency_iso)
                        
                        if frequency_seconds > 0:
                            steps_to_show = int(horizon_seconds / frequency_seconds)
                            freq_parts, _ = parse_iso8601_duration(frequency_iso)
                            inferred_frequency = duration_to_max_unit(freq_parts)
                except Exception as e:
                    print(f"Error calculating steps: {e}", file=sys.stderr)
            
            # Add context data (historical)
            if not context_df.empty:
                hist_name = "Historical Data" if len(series_list) == 1 else f"Historical - {series_name}"
                fig.add_trace(go.Scatter(
                    x=context_df["ts"],
                    y=context_df["value"],
                    name=hist_name,
                    mode="lines",
                    line=dict(color="black", width=3),
                    legendgroup=f"series_{series_id}",
                    hovertemplate=f"<b>{hist_name}</b><br>Time: %{{x}}<br>Value: %{{y}}<extra></extra>",
                ))
            
            # Get forecasts for this series
            forecasts = get_forecasts(api_client, challenge_id, series_id) 
            
            # Add forecasts
            for model_readable_id, data in forecasts.items():
                df = data["data"]
                model_label = data.get("label", model_readable_id)
                if df.empty:
                    continue

                if not model_readable_id in selected_readable_model_ids:
                    continue
                
                if model_label not in model_color_map:
                    model_color_map[model_label] = colors[color_idx % len(colors)]
                    color_idx += 1
                
                color = model_color_map[model_label]
                prelim_mase = data.get('current_mase')
                if prelim_mase is None:
                    prelim_mase = "N/A"
                else:
                    prelim_mase = f"{prelim_mase:.2f}"
                display_name = f"{model_label} - Prelim MASE: {prelim_mase}"
                if len(series_list) > 1:
                    display_name += f" ({series_name})"
                
                # Connect forecast to last historical point
                if not context_df.empty and not df.empty:
                    last_hist_ts = context_df["ts"].iloc[-1]
                    last_hist_val = context_df["value"].iloc[-1]
                    forecast_x = pd.concat([pd.Series([last_hist_ts]), df["ts"]]).reset_index(drop=True)
                    forecast_y = pd.concat([pd.Series([last_hist_val]), df["y"]]).reset_index(drop=True)
                else:
                    forecast_x = df["ts"]
                    forecast_y = df["y"]
                
                fig.add_trace(go.Scatter(
                    x=forecast_x,
                    y=forecast_y,
                    name=display_name,
                    mode="lines+markers",
                    line=dict(color=color, width=2),
                    marker=dict(size=4),
                    legendgroup=model_label,
                    hovertemplate=f"<b>{display_name}</b><br>Time: %{{x}}<br>Value: %{{y:.2f}}<extra></extra>",
                ))
            
            # Add actual data for first series only
            if series_idx == 0 and not actual_df.empty:
                actual_df_limited = actual_df.head(steps_to_show)
                if not actual_df_limited.empty:
                    fig.add_trace(go.Scatter(
                        x=actual_df_limited["ts"],
                        y=actual_df_limited["value"],
                        name=f"Actual - {series_name}",
                        mode="lines",
                        line=dict(color="grey", width=3, dash="dot"),
                        marker=dict(size=6, symbol="diamond"),
                        legendgroup=f"series_{series_id}",
                        hovertemplate=f"<b>Actual - {series_name}</b><br>Time: %{{x}}<br>Value: %{{y}}<extra></extra>",
                    ))
        
        # Update layout
        fig.update_layout(
            xaxis_title='Time',
            yaxis_title='Value',
            hovermode='x unified',
            template='plotly_white',
            height=600,
            font=dict(family="Arial, sans-serif", size=12),
            plot_bgcolor='rgba(245, 245, 245, 0.5)',
        )
        
        fig.update_xaxes(
            showgrid=True,
            gridwidth=1,
            gridcolor='lightgray',
            showline=True,
            linewidth=2,
            linecolor='gray'
        )
        
        fig.update_yaxes(
            showgrid=True,
            gridwidth=1,
            gridcolor='lightgray',
            showline=True,
            linewidth=2,
            linecolor='gray'
        )
        
        return fig
        
    except Exception as e:
        print(f"Error plotting real challenge data: {e}", file=sys.stderr)
        traceback.print_exc()
        return None    
    

def render_challenges_tab_component(api_client: DashboardAPIClient):
    render_filter_component(api_client=api_client, filter_type="active_challenges")
    st.markdown("---")
        
    # Main content area
    st.header("🎯 Visualize a Challenge")
    
    # Challenge selection
    if st.session_state.get('filtered_challenges') is None:
        with st.spinner("Loading active challenges..."):
            now = datetime.now(timezone.utc).strftime("%Y-%m-%dT") 
            set_challenges_session_state(
                api_client=api_client,
                selected_from_date=now+ "00:00:00.000Z",
                selected_to_date=now + "23:59:59.999Z",
                selected_statuses=[ChallengeStatus.ACTIVE.value],
            )
            st.rerun()
    active_completed_challenges = st.session_state['filtered_challenges']
    challenge_options = {f"{c.get('status')} • {c.get('description')}, Start Date: {datetime.strptime(c.get('start_time'), '%Y-%m-%dT%H:%M:%S.%fZ').strftime('%Y-%m-%d %H:%M:%S') if c.get('start_time') else 'N/A'} ({str(c.get('challenge_id', ''))[:8]})": c 
                        for c in active_completed_challenges}
    
    if challenge_options:
        selected_challenge_key = st.selectbox(
            "Challenge Selection",
            options=list(challenge_options.keys()),
            key="challenge_select"
        )
        
        selected_challenge = challenge_options[selected_challenge_key]
        challenge_id = str(selected_challenge.get('challenge_id', ''))
        challenge_id_short = challenge_id[:8] if challenge_id != '' else ''
        challenge_name = selected_challenge.get('description', 'Challenge')
        
        # Series selection
        series_options = get_series_choices_for_challenge(challenge_id, api_client)
        
        # Display challenge heading
        st.subheader(f"📊 {challenge_name}")
        
        # Get detailed challenge info
        status = selected_challenge.get('status', 'unknown')
        n_series = selected_challenge.get('n_time_series', 0)
        model_count = selected_challenge.get('model_count', 0)

        if status == ChallengeStatus.ANNOUNCED.value:
            if n_series == 0:
                n_series = "tbd"
            if model_count == 0:
                model_count = "tbd"

        challenge_id = str(selected_challenge.get('challenge_id', ''))[:8]
        
        # Get frequency and calculate horizon/context in steps
        frequency_iso = 'PT1H'  # Default
        context_length_num = 'N/A'
        frequency_display = 'N/A'
        
        try:
            challenge_id_full = selected_challenge.get('challenge_id')
            series_list = api_client.get_challenge_series(challenge_id_full)
            forecast_horizon_steps_num = get_challenge_horizon_steps_from_series(series_list)
            if forecast_horizon_steps_num == -1:
                forecast_horizon_steps_num = get_challenge_horizon_steps_from_challenge(selected_challenge)
            if series_list and len(series_list) > 0:
                frequency_iso = series_list[0].get('frequency', 'PT1H')
                context_iso = series_list[0].get('context_length') or selected_challenge.get('context_length')
                
                # Parse frequency for display
                try:
                    freq_parts, _ = parse_iso8601_duration(frequency_iso)
                    frequency_display = duration_to_max_unit(freq_parts)
                except:
                    frequency_display = frequency_iso
                
                context_length_num = context_iso
        except Exception as e:
            print(f"Error getting series data for challenge info: {e}", file=sys.stderr)
        
        # Status color
        status_color = '#16a34a' if status == ChallengeStatus.ACTIVE.value else '#2563eb'
        
        # Compact single-line info display matching Gradio version
        st.markdown(f"""
        <div style='display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;'>
            <div style='background: {status_color}; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.8em; font-weight: 600;'>{status.upper()}</div>
            <div style='color: #6b7280; font-size: 0.9em;'>ID: <strong>{challenge_id}</strong></div>
            <div style='height: 20px; width: 1px; background: #d1d5db;'></div>
            <div style='color: #6b7280; font-size: 0.9em;'>Series: <strong style='color: #1f2937;'>{n_series}</strong></div>
            <div style='color: #6b7280; font-size: 0.9em;'>Models: <strong style='color: #1f2937;'>{model_count}</strong></div>
            <div style='color: #6b7280; font-size: 0.9em;'>Horizon: <strong style='color: #1f2937;'>{forecast_horizon_steps_num if forecast_horizon_steps_num != -1 else 'N/A'  } Steps</strong></div>
            <div style='color: #6b7280; font-size: 0.9em;'>Context: <strong style='color: #1f2937;'>{context_length_num}</strong></div>
            <div style='color: #6b7280; font-size: 0.9em;'>Frequency: <strong style='color: #1f2937;'>{frequency_display}</strong></div>
        </div>
        """, unsafe_allow_html=True)
  
        models = api_client.list_models_for_challenge(challenge_id)
        selected_series_ids, selected_readable_model_ids = render_filter_models_component(series_options, models)
        
        # Individual plots for each series (default)
        with st.spinner("Loading individual series plots..."):
            try:
                challenge_id_full = selected_challenge.get('challenge_id')
                
                if not str(challenge_id_full).startswith('mock'):
                    # Get series list
                    series_list = api_client.get_challenge_series(challenge_id_full)
                    
                    if series_list and selected_series_ids:
                        # Filter to selected series
                        filtered_series = [s for s in series_list if s.get('series_id') in selected_series_ids]
                        
                        if filtered_series:
                            # Create scrollable container for individual plots
                            individual_plots_container = st.container(height=800)
                            with individual_plots_container:
                                for series_info in filtered_series:
                                    series_id = series_info.get('series_id')
                                    series_name = series_info.get('name', f'Series {series_id}')
                                    series_desc = series_info.get('description', '')
                                    if series_desc:
                                        expander_title = f"📈 {series_desc} (ID: {series_id})"
                                    else:
                                        expander_title = f"📈 {series_name} (ID: {series_id})"
                                    with st.expander(expander_title, expanded=True):
                                        # Plot this individual series
                                        fig = plot_real_challenge_data(
                                            challenge=selected_challenge,
                                            forecast_horizon=forecast_horizon_steps_num,
                                            api_client=api_client,
                                            selected_series_ids=[series_id],
                                            selected_readable_model_ids=selected_readable_model_ids,
                                        )
                                        if fig:
                                            st.plotly_chart(fig, width="stretch")
                                        else:
                                            st.warning(f"Could not load data for {series_name}")
                        else:
                            st.info("No series selected")
                    else:
                        st.info("No series available or none selected")
                else:
                    st.info("Individual series plots not available for demo data")
                    fig = make_demo_forecast_plot(forecast_horizon_steps_num, challenge_name)
                    st.plotly_chart(fig, width="stretch")
                    
            except Exception as e:
                st.error(f"Error loading individual plots: {str(e)}")
                traceback.print_exc()
        # Interactive features info
        st.markdown("""
        **Interactive Features:**
        - 🖱️ **Click legend items** to show/hide individual models
        - 🔍 **Zoom** by dragging a box on the chart
        - 👆 **Pan** by clicking and dragging
        - 🔄 **Reset** by double-clicking the chart
        - 📊 **Hover** to see exact values
        """)
    else:
        st.info("No challenges available")