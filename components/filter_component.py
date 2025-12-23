from typing import List, Optional
import streamlit as st
import pandas as pd
import sys

from utils.api_client import ChallengeStatus, DashboardAPIClient

# Cached function to set rankings in session state
def set_rankings_session_state(
    api_client: DashboardAPIClient,
    selected_domains: Optional[List[str]] = None,
    selected_categories: Optional[List[str]] = None,
    selected_frequencies: Optional[List[str]] = None,
    selected_horizons: Optional[List[str]] = None
):
    if 'filtered_rankings' not in st.session_state:
        st.session_state['filtered_rankings'] = None

    filter_options = api_client.get_filter_options()
    filtered_rankings = []
    for time_range in filter_options.get("time_ranges", ['All']):
        loop_dict = api_client.get_filtered_rankings(
            domains=selected_domains if selected_domains else None,
            categories=selected_categories if selected_categories else None,
            frequencies=selected_frequencies if selected_frequencies else None,
            horizons=selected_horizons if selected_horizons else None,
            time_range=time_range
        )
        loop_dict = [{**item, "time_ranges": time_range} for item in loop_dict]
        filtered_rankings.append(loop_dict)
    st.session_state['filtered_rankings'] = filtered_rankings


def set_challenges_session_state(
    api_client: DashboardAPIClient,
    selected_domains: Optional[List[str]] = None,
    selected_categories: Optional[List[str]] = None,
    selected_frequencies: Optional[List[str]] = None,
    selected_horizons: Optional[List[str]] = None,
    selected_from_date: Optional[str] = None,
    selected_to_date: Optional[str] = None,
    selected_statuses: Optional[List[str]] = None
):
    filtered_rankings = api_client.get_filtered_challenges(
        domain=selected_domains if selected_domains else None,
        category=selected_categories if selected_categories else None,
        frequency=selected_frequencies if selected_frequencies else None,
        horizon=selected_horizons if selected_horizons else None,
        from_date=selected_from_date if selected_from_date else None,
        to_date=selected_to_date if selected_to_date else None,
        status=selected_statuses if selected_statuses else None
    )
    if filtered_rankings:
        st.session_state["filtered_challenges"] = filtered_rankings
    else:
        st.session_state["filtered_challenges"] = []
        st.info("No challenges match the selected filters")

def render_filter_component(api_client: DashboardAPIClient, filter_type: str = "model_ranking"):
    """
    Render the filter component in the Streamlit app.

    Args:
        api_client: Instance of DashboardAPIClient to fetch filter options and rankings.
    """

    # Add filter section right after the header
    if filter_type == "model_ranking":
        st.markdown("### 🔍 Filter Model Rankings")
    elif filter_type == "active_challenges":
        st.markdown("### 🔍 Filter Active Challenges")

    # Get filter options from API
    filter_options = api_client.get_filter_options()

    # Create columns for filters
    col1, col2, col3 = st.columns(3)
    col5, col6, col7, col8 = st.columns(4)

    with col1:
        selected_domains = st.multiselect(
            "Domain",
            options=filter_options.get("domains", []),
            help="Filter by domain",
            key=f"domain_filter_{filter_type}"
        )

    with col2:
        selected_categories = st.multiselect(
            "Category",
            options=filter_options.get("categories", []),
            help="Filter by category",
            key=f"category_filter_{filter_type}"
        )

    with col3:
        selected_frequencies = st.multiselect(
            "Frequency",
            options=filter_options.get("frequencies", []),
            help="Filter by time series frequency",
            key=f"frequency_filter_{filter_type}"
        )

    with col5:
        selected_horizons = st.multiselect(
            "Horizon",
            options=filter_options.get("horizons", []),
            help="Filter by forecast horizon",
            key=f"horizon_filter_{filter_type}"
        )

    # Active Challenges specific filters
    selected_statuses = None
    selected_from_date = None
    selected_to_date = None
    if filter_type == "active_challenges":
        with col6:
            selected_from_date = st.date_input(
                "End Date From",
                value="today",
                help="Filter by Date",
                key=f"from_date_filter_{filter_type}"
            )
            selected_from_date = selected_from_date.strftime(
                "%Y-%m-%dT00:00:00.000Z")
        with col7:
            selected_to_date = st.date_input(
                "End Date To",
                value='today',
                help="Filter by Date",
                key=f"to_date_filter_{filter_type}"
            )
            selected_to_date = selected_to_date.strftime(
                "%Y-%m-%dT23:59:59.999Z")
        with col8:
            selected_statuses = st.multiselect(
                "Status",
                options=[ChallengeStatus.ACTIVE.value,
                         ChallengeStatus.COMPLETED.value],
                default=[ChallengeStatus.ACTIVE.value],
                help="Filter by challenge status",
                key=f"status_filter_{filter_type}"
            )
        # TODO: Filter for registration start and end date

    # Apply filters button
    if st.button("🔍 Apply Filters", type="primary", key=f"apply_filters_button_{filter_type}"):
        try:
            if filter_type == "model_ranking":
                set_rankings_session_state(
                    api_client,
                    selected_domains=selected_domains,
                    selected_categories=selected_categories,
                    selected_frequencies=selected_frequencies,
                    selected_horizons=selected_horizons
                )

            elif filter_type == "active_challenges":
                set_challenges_session_state(
                    api_client,
                    selected_domains=selected_domains,
                    selected_categories=selected_categories,
                    selected_frequencies=selected_frequencies,
                    selected_horizons=selected_horizons,
                    selected_from_date=selected_from_date,
                    selected_to_date=selected_to_date,
                    selected_statuses=selected_statuses
                )
        except Exception as e:
            st.error(f"Error applying filters: {str(e)}")
