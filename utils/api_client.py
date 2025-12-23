import os
import sys
from enum import Enum
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import pandas as pd
import requests

class ChallengeStatus(Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    REGISTRATION = "registration"
    ANNOUNCED = "announced"


class DashboardAPIClient:
    """API Client für dashboard-api."""

    def __init__(self):
        self._api_url = os.getenv("DASHBOARD_API_URL")
        self.api_key = os.getenv("DASHBOARD_API_KEY")
        
        # Remove trailing slash
        if self._api_url.endswith("/"):
            self._api_url = self._api_url[:-1]
        
        print(f"DEBUG: API URL: {self._api_url}", file=sys.stderr)
        print(f"DEBUG: API Key configured: {'Yes' if self.api_key else 'No'}", file=sys.stderr)
        
        self.headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
        self.timeout = 30  # seconds
    
    @property
    def api_url(self) -> str:
        """Property for compatibility with caching functions."""
        return self._api_url
    
    @property
    def database_url(self) -> str:
        """Backward compatibility property for cache keys."""
        return self._api_url

    def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """Make GET request to API."""
        url = f"{self._api_url}{endpoint}"
        try:
            print(f"DEBUG: GET {url} with params: {params}", file=sys.stderr)
            response = requests.get(url, headers=self.headers, params=params, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"ERROR: API request failed: {e}", file=sys.stderr)
            raise

    # Challenges
    def list_challenges(self) -> List[Dict[str, Any]]:
        """List all challenges including aggregates (models/forecasts)."""
        print("DEBUG: Calling list_challenges", file=sys.stderr)
        try:
            data = self._get("/api/v1/challenges")
            print(f"DEBUG: list_challenges found {len(data)} challenges.", file=sys.stderr)
            if data:
                print("DEBUG: Challenges retrieved:", file=sys.stderr)
                for r in data:
                    print(f"  - ID: {r.get('challenge_id', 'N/A')}, Status: {r.get('status', 'N/A')}, Desc: {r.get('description', 'N/A')}", file=sys.stderr)
            return data
        except Exception as e:
            print(f"ERROR: in list_challenges: {e}", file=sys.stderr)
            return []

    def list_completed_challenges_in_range(self, since: datetime) -> List[Dict[str, Any]]:
        """List completed challenges whose end_time >= since."""
        params = {
            "status": ChallengeStatus.COMPLETED.value,
            "from": since.isoformat()
        }
        try:
            return self._get("/api/v1/challenges", params=params)
        except Exception as e:
            print(f"ERROR: in list_completed_challenges_in_range: {e}", file=sys.stderr)
            return []
        
    def list_active_challenges(self) -> List[Dict[str, Any]]:
        """Active challenges with status 'registration' and 'announced'."""
        print("DEBUG: Calling list_active_challenges", file=sys.stderr)
        try:
            params = {"status": f"{ChallengeStatus.ACTIVE.value}"}
            data = self._get("/api/v1/challenges", params=params)
            print(f"DEBUG: list_active_challenges found {len(data)} challenges.", file=sys.stderr)
            if data:
                print("DEBUG: Active challenges retrieved:", file=sys.stderr)
                for r in data:
                    print(f"  - ID: {r.get('challenge_id', 'N/A')}, Status: {r.get('status', 'N/A')}, Desc: {r.get('description', 'N/A')}", file=sys.stderr)
            return data
        except Exception as e:
            print(f"ERROR: in list_active_challenges: {e}", file=sys.stderr)
            return []

    def list_upcoming_challenges(self) -> List[Dict[str, Any]]:
        """Upcoming challenges with status 'registration' and 'announced'."""
        print("DEBUG: Calling list_upcoming_challenges", file=sys.stderr)
        try:
            params = {"status": f"{ChallengeStatus.REGISTRATION.value},{ChallengeStatus.ANNOUNCED.value}"}
            data = self._get("/api/v1/challenges", params=params)
            print(f"DEBUG: list_upcoming_challenges found {len(data)} challenges.", file=sys.stderr)
            if data:
                print("DEBUG: Upcoming challenges retrieved:", file=sys.stderr)
                for r in data:
                    print(f"  - ID: {r.get('challenge_id', 'N/A')}, Status: {r.get('status', 'N/A')}, Desc: {r.get('description', 'N/A')}", file=sys.stderr)
            return data
        except Exception as e:
            print(f"ERROR: in list_upcoming_challenges: {e}", file=sys.stderr)
            return []

    def get_challenge_meta(self, challenge_id: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a challenge."""
        try:
            return self._get(f"/api/v1/challenges/{challenge_id}")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                return None
            raise
        except Exception as e:
            print(f"ERROR: in get_challenge_meta: {e}", file=sys.stderr)
            return None

    def get_challenge_series(self, challenge_id: str) -> List[Dict[str, Any]]:
        """Time series for a challenge."""
        try:
            return self._get(f"/api/v1/challenges/{challenge_id}/series")
        except Exception as e:
            print(f"ERROR: in get_challenge_series: {e}", file=sys.stderr)
            return []
        
    def get_filtered_challenges(
            self, 
            status: Optional[str|List[str]]=None, 
            from_date: Optional[str]=None,
            to_date: Optional[str]=None, 
            frequency: Optional[str|List[str]]=None, 
            domain:  Optional[str|List[str]]=None,
            category: Optional[str|List[str]]=None,
            horizon: Optional[str|List[str]]=None,
        ) -> List[Dict[str, Any]]:
        """Get challenges filtered by various criteria."""
        try:
            str_status = ",".join(status) if isinstance(status, list) else status
            str_frequency = ",".join(frequency) if isinstance(frequency, list) else frequency
            str_domain = ",".join(domain) if isinstance(domain, list) else domain
            str_category = ",".join(category) if isinstance(category, list) else category
            str_horizon = ",".join(horizon) if isinstance(horizon, list) else horizon
            params = {
                "status": str_status,
                "from": from_date,
                "to": to_date,
                "frequency": str_frequency,
                "domain": str_domain,
                "category": str_category,
                "horizon": str_horizon
            }
            return self._get("/api/v1/challenges", params=params)
        except Exception as e:
            print(f"ERROR: in get_filtered_challenges: {e}", file=sys.stderr)
            return []

    def get_challenge_data_for_series(
        self, challenge_id: int, series_id: int, start_time, end_time
    ) -> pd.DataFrame:
        """Get all relevant data for a series in a challenge for plotting."""
        try:
            # Handle both datetime objects and string timestamps
            if isinstance(start_time, str):
                start_time_str = start_time
            elif hasattr(start_time, 'isoformat'):
                start_time_str = start_time.isoformat()
            else:
                start_time_str = str(start_time)
            
            if isinstance(end_time, str):
                end_time_str = end_time
            elif hasattr(end_time, 'isoformat'):
                end_time_str = end_time.isoformat()
            else:
                end_time_str = str(end_time)
            
            params = {
                "start_time": start_time_str,
                "end_time": end_time_str
            }
            data = self._get(f"/api/v1/challenges/{challenge_id}/series/{series_id}/data", params=params)
            
            # Convert to DataFrame
            if "data" in data and data["data"]:
                df = pd.DataFrame(data["data"])
                df["ts"] = pd.to_datetime(df["ts"], utc=False)
                return df
            else:
                return pd.DataFrame(columns=["ts", "value"])
        except Exception as e:
            print(f"ERROR: in get_challenge_data_for_series: {e}", file=sys.stderr)
            return pd.DataFrame(columns=["ts", "value"])

    def get_series_forecasts(self, challenge_id: str, series_id: int) -> Dict[str, Dict[str, pd.DataFrame|str]]:
        """Return, per forecast (model/version), the data points as a DataFrame."""
        try:
            data = self._get(f"/api/v1/challenges/{challenge_id}/series/{series_id}/forecasts")
            
            # Convert to Dict[str, DataFrame]
            result = {}
            if "forecasts" in data:
                for model_readable_id, forecast_data in data["forecasts"].items():
                    if forecast_data:
                        df = pd.DataFrame(forecast_data["data"])
                        df["ts"] = pd.to_datetime(df["ts"], utc=False)
                        result[model_readable_id] = {"data": df, "label": forecast_data.get("label", ""), "current_mase": forecast_data.get("current_mase", "")}
            return result
        except Exception as e:
            print(f"ERROR: in get_series_forecasts: {e}", file=sys.stderr)
            return {}

    def list_models_for_challenge(self, challenge_id: str) -> List[str]:
        """List all unique models for a given challenge."""
        try:
            return self._get(f"/api/v1/challenges/{challenge_id}/models")
        except Exception as e:
            print(f"ERROR: in list_models_for_challenge: {e}", file=sys.stderr)
            return []

    @staticmethod
    def granularity_to_timedelta(granularity: Optional[str]) -> timedelta:
        """Convert granularity string to timedelta."""
        g = (granularity or "hour").lower()
        if "15" in g:
            return timedelta(minutes=15)
        if g.startswith("h"):
            return timedelta(hours=1)
        if g.startswith("d"):
            return timedelta(days=1)
        return timedelta(hours=1)

    def get_global_rankings(self) -> Tuple[Dict[str, List[Dict[str, Any]]], Dict[str, Optional[datetime]]]:
        """Compute global model rankings.

        Returns a tuple (results, ranges) where `results` maps a range label to a list of
        dict rows (model_name, n_completed, avg_mase) and `ranges` maps the
        same labels to the lower-bound datetime.
        """
        try:
            data = self._get("/api/v1/models/rankings")
            
            # Reconstruct ranges from response
            now = datetime.utcnow()
            ranges: Dict[str, Optional[datetime]] = {
                "Last 7 days": now - timedelta(days=7),
                "Last 30 days": now - timedelta(days=30),
                "Last 90 days": now - timedelta(days=90),
                "Last 365 days": now - timedelta(days=365),
            }
            
            results = data.get("ranges", {})
            return results, ranges
        except Exception as e:
            print(f"ERROR: in get_global_rankings: {e}", file=sys.stderr)
            return {}, {}

    def get_filter_options(self) -> Dict[str, List[str]]:
        """Get available filter options for rankings.

        GET /api/v1/models/rankings-filters (without parameters)
        Returns dict with keys: domains, categories, subcategories, frequencies, horizons, time_ranges
        """
        try:
            # Call the endpoint without any parameters to get filter options
            data = self._get("/api/v1/models/ranking-filters")
            print(f"DEBUG: get_filter_options raw response: {data}", file=sys.stderr)
            print(f"DEBUG: Response type: {type(data)}", file=sys.stderr)
            
            # Validate that we got the expected structure
            if isinstance(data, dict):
                expected_keys = ["domains", "categories", "frequencies", "horizons", "time_ranges"]
                for key in expected_keys:
                    if key in data:
                        print(f"DEBUG: {key} = {data[key]}", file=sys.stderr)
                    else:
                        print(f"WARNING: Missing key '{key}' in API response", file=sys.stderr)
                
                return data
            else:
                print(f"ERROR: Unexpected data format from filter-rankings: {type(data)}", file=sys.stderr)
                return {
                    "domains": [],
                    "categories": [],
                    "frequencies": [],
                    "horizons": [],
                    "time_ranges": []
                }
        except Exception as e:
            print(f"ERROR: in get_filter_options: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            return {
                "domains": [],
                "categories": [],
                "frequencies": [],
                "horizons": [],
                "time_ranges": []
            }

    def get_filtered_rankings(
        self,
        domains: Optional[List[str]] = None,
        categories: Optional[List[str]] = None,
        frequencies: Optional[List[str]] = None,
        horizons: Optional[List[str]] = None,
        time_range: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get filtered model rankings."""
        try:
            params = {}
            if domains:
                params["domain"] = ",".join(domains)
            if categories:
                params["category"] = ",".join(categories)
            if frequencies:
                params["frequency"] = ",".join(frequencies)
            if horizons:
                params["horizon"] = ",".join(horizons)
            if time_range:
                params["time_range"] = time_range
            
            data = self._get("/api/v1/models/rankings", params=params)
            return data.get("rankings", [])
        except Exception as e:
            print(f"ERROR: in get_filtered_rankings: {e}", file=sys.stderr)
            return []

def hash_func_dashboard_api_client(obj: DashboardAPIClient) -> int:
    return 1