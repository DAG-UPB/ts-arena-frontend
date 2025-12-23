import pandas as pd
import re
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

from utils.api_client import ChallengeStatus, DashboardAPIClient


def parse_iso8601_duration(duration):
    """
    Parse an ISO 8601 duration string (e.g., 'P3Y6M4DT12H30M5S')
    into a dictionary and total seconds.
    """
    # Regex pattern for ISO 8601 durations
    pattern = re.compile(
        r'^P'                                 # starts with 'P'
        r'(?:(?P<years>\d+)Y)?'               # years
        r'(?:(?P<months>\d+)M)?'              # months (in date part)
        r'(?:(?P<weeks>\d+)W)?'               # weeks
        r'(?:(?P<days>\d+)D)?'                # days
        r'(?:T'                               # start of time part
        r'(?:(?P<hours>\d+)H)?'               # hours
        r'(?:(?P<minutes>\d+)M)?'             # minutes
        r'(?:(?P<seconds>\d+)S)?'             # seconds
        r')?$'                                # end of string
    )

    match = pattern.match(duration)
    if not match:
        raise ValueError(f"Invalid ISO 8601 duration: {duration}")

    parts = {k: int(v) if v else 0 for k, v in match.groupdict().items()}

    # Approximate conversions
    SECONDS_IN = {
        'years':   365 * 24 * 3600,   # 1 year ≈ 365 days
        'months':  30 * 24 * 3600,    # 1 month ≈ 30 days
        'weeks':   7 * 24 * 3600,
        'days':    24 * 3600,
        'hours':   3600,
        'minutes': 60,
        'seconds': 1,
    }

    total_seconds = sum(parts[k] * SECONDS_IN[k] for k in parts)

    return parts, total_seconds

def seconds_to_hours(seconds):
    """
    Convert seconds to hours.
    
    Args:
        seconds: Number of seconds (int or float)
    
    Returns:
        float: Number of hours
    """
    return seconds / 3600

def duration_to_max_unit(parts_dict):
    """
    Convert a duration dictionary (from parse_iso8601_duration) to a single unit value.
    Returns the duration in the smallest unit specified in the original duration.
    
    For example:
    - 23 hours --> "23 Hours"
    - 1 day 2 hours --> "26 Hours" (hours is smaller unit)
    - 2 days --> "2 Days"
    - 1 week 3 days --> "10 Days" (days is smaller unit)
    - 7 days --> "1 Week" (only days specified, can be converted to weeks)
    - 168 hours --> "168 Hours" (keep as hours since that was the original unit)
    
    Args:
        parts_dict: Dictionary from parse_iso8601_duration with keys: years, months, weeks, days, hours, minutes, seconds
    
    Returns:
        str: Formatted string like "23 Hours" or "2 Days"
    """
    # Conversion factors to seconds
    SECONDS_IN = {
        'years':   365 * 24 * 3600,
        'months':  30 * 24 * 3600,
        'weeks':   7 * 24 * 3600,
        'days':    24 * 3600,
        'hours':   3600,
        'minutes': 60,
        'seconds': 1,
    }
    
    # Calculate total seconds
    total_seconds = sum(parts_dict.get(k, 0) * SECONDS_IN[k] for k in SECONDS_IN)
    
    if total_seconds == 0:
        return "0 Seconds"
    
    # Unit mappings (key, singular, plural, divisor)
    UNIT_MAP = [
        ('years', 'Year', 'Years', 365 * 24 * 3600),
        ('months', 'Month', 'Months', 30 * 24 * 3600),
        ('weeks', 'Week', 'Weeks', 7 * 24 * 3600),
        ('days', 'Day', 'Days', 24 * 3600),
        ('hours', 'Hour', 'Hours', 3600),
        ('minutes', 'Minute', 'Minutes', 60),
        ('seconds', 'Second', 'Seconds', 1),
    ]
    
    # Find the smallest unit that was actually used in the original duration
    target_unit = None
    for key, singular, plural, divisor in reversed(UNIT_MAP):  # Start from smallest
        if parts_dict.get(key, 0) > 0:
            target_unit = (key, singular, plural, divisor)
            break
    
    # If we found a target unit, convert to that unit
    if target_unit:
        key, singular, plural, divisor = target_unit
        value = total_seconds // divisor
        unit_name = singular if value == 1 else plural
        return f"{value} {unit_name}"
    
    # Fallback: use seconds
    return f"{total_seconds} Seconds"

def to_local(dt_val: Any, tz_name: str) -> Optional[datetime]:
    if dt_val is None:
        return None
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo("UTC")
    # Normalize input to aware datetime
    if isinstance(dt_val, pd.Timestamp):
        dt = dt_val.to_pydatetime()
    elif isinstance(dt_val, datetime):
        dt = dt_val
    else:
        try:
            ts = pd.to_datetime(dt_val, utc=True)
            dt = ts.to_pydatetime()
        except Exception:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    try:
        return dt.astimezone(tz)
    except Exception:
        return None

def get_active_challenges_list(api_client:DashboardAPIClient) -> List[Dict[str, Any]]:
    """Get list of active and completed challenges."""
    try:
        challenges = api_client.list_active_challenges()
        
        
        # If no challenges from API, return mock data
        if not challenges:
            print("No challenges from API, using mock data", file=sys.stderr)
            challenges = [
                {
                    'challenge_id': 'mock-001',
                    'status': ChallengeStatus.ACTIVE.value,
                    'description': 'Electricity Load Forecasting',
                    'n_time_series': 370,
                    'model_count': 5,
                    'horizon': 24,
                    'context_length': 168,
                    'granularity': 'hourly',
                    'registration_start': '2025-10-01T00:00:00Z',
                    'final_evaluation_at': '2025-12-31T23:59:59Z'
                },
                {
                    'challenge_id': 'mock-002',
                    'status': ChallengeStatus.ACTIVE.value,
                    'description': 'Weather Prediction Challenge',
                    'n_time_series': 50,
                    'model_count': 8,
                    'horizon': 48,
                    'context_length': 336,
                    'granularity': 'hourly',
                    'registration_start': '2025-09-15T00:00:00Z',
                    'final_evaluation_at': '2025-11-30T23:59:59Z'
                },
                {
                    'challenge_id': 'mock-003',
                    'status': ChallengeStatus.COMPLETED.value,
                    'description': 'Retail Sales Forecasting',
                    'n_time_series': 100,
                    'model_count': 12,
                    'horizon': 7,
                    'context_length': 56,
                    'granularity': 'daily',
                    'registration_start': '2025-08-01T00:00:00Z',
                    'final_evaluation_at': '2025-09-30T23:59:59Z'
                }
            ]
        
        return challenges
    except Exception as e:
        print(f"Error fetching challenges: {e}", file=sys.stderr)
        # Return mock data on error
        return [
            {
                'challenge_id': 'mock-001',
                'status': ChallengeStatus.ACTIVE.value,
                'description': 'Electricity Load Forecasting',
                'n_time_series': 370,
                'model_count': 5,
                'horizon': 24,
                'context_length': 168,
                'granularity': 'hourly',
                'registration_start': '2025-10-01T00:00:00Z',
                'final_evaluation_at': '2025-12-31T23:59:59Z'
            }
        ]