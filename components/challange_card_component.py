import sys
import streamlit as st
import time
from datetime import datetime, timezone

from utils.api_client import ChallengeStatus
from utils.utils import duration_to_max_unit, parse_iso8601_duration, to_local

@st.fragment(run_every="1s")
def timer_fragment():
    now = datetime.now(timezone.utc)

    st.markdown(
        f"""
        <div style='font-size:1.1em; font-weight:bold; color:#1f2937;'>
            ⏱️ {now.strftime("%Y-%m-%d %H:%M:%S %Z")}
        </div>
        """,
        unsafe_allow_html=True,
    )

def render_challenge_card(challenge, api_client):
    """Render a challenge card in the sidebar."""
    status = challenge.get('status', 'unknown')
    desc = challenge.get('description', 'TBA')
    challenge_id = str(challenge.get('challenge_id', ''))[:8]
    n_series = challenge.get('n_time_series', 0)
    model_count = challenge.get('model_count', 0)
    forecast_horizon_interval = challenge.get('horizon', 'TBA')
    context_length_interval = challenge.get('context_length', 'TBA')
    
    # Try to get frequency from series data for accurate parsing
    frequency_iso = 'PT1H'  # Default to 1 hour
    forecast_horizon_from_series = None
    context_length_from_series = None
    
    try:
        challenge_id_full = challenge.get('challenge_id')
        series_list = api_client.get_challenge_series(challenge_id_full)
        if series_list and len(series_list) > 0:
            frequency_iso = series_list[0].get('frequency', 'PT1H')
            # Get forecast_horizon and context from series level (more accurate)
            forecast_horizon_from_series = series_list[0].get('horizon')
    except Exception as e:
        print(f"DEBUG: Could not get series data for {challenge_id}: {e}", file=sys.stderr)
    
    # Use series-level horizon if available, otherwise fall back to challenge-level
    horizon_to_parse = forecast_horizon_from_series or forecast_horizon_interval
    context_to_parse = context_length_from_series or context_length_interval
    
    # Parse intervals with frequency - handle both string intervals and numeric values
    if horizon_to_parse != 'TBA' and horizon_to_parse is not None:
        if isinstance(horizon_to_parse, (int, float)):
            forecast_horizon_num = int(horizon_to_parse)
        elif isinstance(horizon_to_parse, str):
            try:
                _, horizon_seconds = parse_iso8601_duration(horizon_to_parse)
                _, frequency_seconds = parse_iso8601_duration(frequency_iso)
                if frequency_seconds > 0:
                    forecast_horizon_num = int(horizon_seconds / frequency_seconds)
                else:
                    forecast_horizon_num = 'TBA'
            except Exception as parse_e:
                forecast_horizon_num = 'TBA'
        else:
            forecast_horizon_num = 'TBA'
    else:
        forecast_horizon_num = 'TBA'

    if context_to_parse != 'TBA' and context_to_parse is not None:
        if isinstance(context_to_parse, (int, float)):
            context_length_num = int(context_to_parse)
        elif isinstance(context_to_parse, str):
            try:
                _, context_seconds = parse_iso8601_duration(context_to_parse)
                _, frequency_seconds = parse_iso8601_duration(frequency_iso)
                if frequency_seconds > 0:
                    context_length_num = int(context_seconds / frequency_seconds)
                else:
                    context_length_num = 'TBA'
            except Exception as parse_e:
                context_length_num = 'TBA'
        else:
            context_length_num = 'TBA'
    else:
        context_length_num = 'TBA'
    
    # Parse frequency for display using duration_to_max_unit
    frequency_display = frequency_iso
    try:
        freq_parts, _ = parse_iso8601_duration(frequency_iso)
        frequency_display = duration_to_max_unit(freq_parts)
    except Exception as e:
        print(f"DEBUG: Could not parse frequency for display: {e}", file=sys.stderr)
    
    status_color = '#16a34a' if status == ChallengeStatus.ACTIVE.value else '#2563eb'
    
    # Get dates
    reg_start = challenge.get('registration_start', '')
    final_eval = challenge.get('end_time', '')
    
    dates_html = ""
    if reg_start:
        reg_start_iso = to_local(reg_start, "UTC").isoformat()
        dates_html += f"""<div><div id="reg-time-{challenge_id_full}" style="font-size: 0.85em; color: #4b5563;">
      📅 Registration opens: <span></span>
    </div>

    <script>
    if (!document.querySelector("#reg-time-{challenge_id_full} span").textContent) {{
      const iso{challenge_id_full} = "{reg_start_iso}";
      const date{challenge_id_full} = new Date(iso{challenge_id_full});

      const formatted{challenge_id_full} = date{challenge_id_full}.toLocaleString(undefined, {{
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }});

      document.querySelector("#reg-time-{challenge_id_full} span").textContent = formatted{challenge_id_full};
    }}
    </script>"""
    if final_eval:
        final_iso = str(to_local(final_eval, "UTC").isoformat())
        dates_html += f"""<div><div id="final-time-{challenge_id_full}" style="font-size: 0.85em; color: #4b5563;">
      ⏰ Final Evaluation: <span></span>
    </div>

    <script>
    if (!document.querySelector("#final-time-{challenge_id_full} span").textContent) {{
      const iso{challenge_id_full} = "{final_iso}";
      const date{challenge_id_full} = new Date(iso{challenge_id_full});

      const formatted{challenge_id_full} = date{challenge_id_full}.toLocaleString(undefined, {{
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }});

      document.querySelector("#final-time-{challenge_id_full} span").textContent = formatted{challenge_id_full};
    }}
    </script></div></div>"""

    # Countdown Closes in & Starts in
    time = None
    match status:
        # Time has to be in CET for JS countdown.
        case ChallengeStatus.REGISTRATION.value:
            time = to_local(challenge.get('registration_end', ''), "CET")
        case ChallengeStatus.ACTIVE.value:
            time = to_local(challenge.get('end_time', ''), "CET")
        case ChallengeStatus.ANNOUNCED.value:
            time = to_local(challenge.get('registration_start', ''), "CET")
        case _:
            pass
    
    markdown = f"""
    <div style='border: 2px solid {status_color}; padding: 15px; margin-bottom: 15px; border-radius: 8px; 
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);'>
        <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;'>
            <div style='font-size: 1.2em; font-weight: bold; color: {status_color};'>{desc}</div>
            <div style='background: {status_color}; color: white; padding: 4px 12px; border-radius: 12px; 
                        font-size: 0.85em; font-weight: bold;'>{status.upper()}</div>
        </div>
        <div style='color: #6b7280; font-size: 0.9em; margin-bottom: 8px;'>ID: {challenge_id}</div>
        <div style='display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;'>
            <div style='background: white; padding: 8px; border-radius: 5px; border: 1px solid #e5e7eb;'>
                <div style='font-size: 0.75em; color: #9ca3af;'>TIME SERIES</div>
                <div style='font-size: 1.1em; font-weight: bold; color: #1f2937;'>{n_series}</div>
            </div>
            <div style='background: white; padding: 8px; border-radius: 5px; border: 1px solid #e5e7eb;'>
                <div style='font-size: 0.75em; color: #9ca3af;'>MODELS</div>
                <div style='font-size: 1.1em; font-weight: bold; color: #1f2937;'>{model_count}</div>
            </div>
            <div style='background: white; padding: 8px; border-radius: 5px; border: 1px solid #e5e7eb;'>
                <div style='font-size: 0.75em; color: #9ca3af;'>HORIZON (STEPS x FREQ)</div>
                <div style='font-size: 1.1em; font-weight: bold; color: #1f2937;'>{forecast_horizon_num} x {frequency_display}</div>
            </div>
            <div style='background: white; padding: 8px; border-radius: 5px; border: 1px solid #e5e7eb;'>
                <div style='font-size: 0.75em; color: #9ca3af;'>CONTEXT LENGTH</div>
                <div style='font-size: 1.1em; font-weight: bold; color: #1f2937;'>{context_length_num}</div>
            </div>
        </div>
        <div style='margin-top: 10px; padding: 8px; background: rgba(255,255,255,0.7); border-radius: 5px;'>
            {dates_html}
        </div>
        <div class='ts-arena-countdown' data-challenge-time="{time}" data-reg-status="{status}" style='font-size: 0.9em; margin-top: 5px; padding: 5px; background: #f0f4ff; border-radius: 3px;'>{'Loading...'}</div>
    </div>"""
    return markdown
    