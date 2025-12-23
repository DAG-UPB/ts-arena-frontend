from components.challenges_tab_component import render_challenges_tab_component
from components.filter_component import render_filter_component, set_rankings_session_state
import streamlit as st
import pandas as pd
import sys
import os

from components.challenge_list_component import render_challenge_list_component

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from utils.api_client import ChallengeStatus, DashboardAPIClient

# Get API URL from environment variable
api_url = os.getenv('X_API_URL', '')
if api_url:
    os.environ['DASHBOARD_API_URL'] = api_url
    print(f"Loaded API URL from X_API_URL: {api_url}", file=sys.stderr)
else:
    print("Warning: X_API_URL environment variable not set, using default", file=sys.stderr)

# Get API key from environment variable
api_key = os.getenv('X_API_KEY', '')
if api_key:
    os.environ['DASHBOARD_API_KEY'] = api_key
    print(f"Loaded API key from X_API_KEY environment variable", file=sys.stderr)
else:
    print("Warning: X_API_KEY environment variable not set", file=sys.stderr)

# Initialize API client
api_client = DashboardAPIClient()

# Page config
st.set_page_config(
    page_title="TS-Arena Challenge Dashboard",
    page_icon="🏟️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS to make sidebar wider
st.markdown("""
    <style>
    [data-testid="stSidebar"] {
        min-width: 400px;
        max-width: 400px;
    }
    .challenge-list-container {
        max-height: 45vh;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 5px;
    }
    .upcoming-list-container {
        max-height: 45vh;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 5px;
    }
    /* Custom scrollbar styling */
    .challenge-list-container::-webkit-scrollbar,
    .upcoming-list-container::-webkit-scrollbar {
        width: 8px;
    }
    .challenge-list-container::-webkit-scrollbar-track,
    .upcoming-list-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }
    .challenge-list-container::-webkit-scrollbar-thumb,
    .upcoming-list-container::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
    }
    .challenge-list-container::-webkit-scrollbar-thumb:hover,
    .upcoming-list-container::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
    </style>
""", unsafe_allow_html=True)


# Main app
st.title("🏟️ TS-Arena – The Live-Forecasting Benchmark (Prototype)")

# Sidebar for challenge list
with st.sidebar:
    st.header("🗓️ Upcoming")
    upcoming_challenges = api_client.list_upcoming_challenges()
    # Show only newest 5 challenges to reduce loading time 
    show_first = 5
    challenges_display = upcoming_challenges[:show_first]
    render_challenge_list_component(challenges=challenges_display, api_client=api_client, challange_list_type="upcoming", show_first=5)

# Create tabs
tab1, tab2, tab3 = st.tabs(["Model Ranking", "Challenges", "Add Model"])

with tab1:
    with st.spinner("Loading model ranking..."):
        render_filter_component(api_client=api_client, filter_type="model_ranking")
        st.markdown("---")
        if st.session_state.get('filtered_rankings') is None:
            set_rankings_session_state(api_client=api_client)
            st.rerun()
        # Main content area
        st.header("🏆 Model Ranking")
        
        # Display rankings table from session state if available
        filtered_rankings = st.session_state.get('filtered_rankings', None)
        if filtered_rankings:
            df_rankings = pd.concat([pd.DataFrame(df) for df in filtered_rankings], ignore_index=True)
            tab_headers = list(df_rankings['time_ranges'].unique())
            tabs = st.tabs(tab_headers)
            for unique_timerange, tab in zip(tab_headers, tabs):
                filtered_by_time = df_rankings[df_rankings['time_ranges'] == unique_timerange].reset_index(drop=True)
                with tab:
                    st.dataframe(filtered_by_time, use_container_width=True)
        else:
            st.info("No models match the selected filters")

with tab2:
    render_challenges_tab_component(api_client=api_client)

with tab3:
    st.header("🚀 Join the TS-Arena Benchmark!")
    
    st.markdown("""
    Ready to test your forecasting models against the best? Participate actively in our benchmark challenges! 
    Simply send us an email and we'll provide you with an API key to get started.
    
    ### How it works:
    
    Email us with your organization name and we'll send you an API key. 
    With this key, you can register your own models and officially participate in active competitions 
    once your model is registered.
    """)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        <a href="mailto:DataAnalytics@wiwi.uni-paderborn.de?subject=TS-Arena API Key Request&body=Hello,%0D%0A%0D%0AI would like to participate in the TS-Arena benchmark.%0D%0A%0D%0AOrganization: [Please specify your organization]%0D%0A%0D%0ABest regards" 
           style="display: inline-block; padding: 10px 20px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            📧 Request API Key
        </a>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <a href="mailto:DataAnalytics@wiwi.uni-paderborn.de?subject=TS-Arena Questions&body=Hello,%0D%0A%0D%0AI have questions about participating in the TS-Arena benchmark.%0D%0A%0D%0ABest regards" 
           style="display: inline-block; padding: 10px 20px; background-color: #764ba2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            ❓ Ask Questions
        </a>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    st.markdown("""
    ### Bring the benchmark to life with your models!
    
    - 🔑 **Personal API Key** for model registration and submission
    - 📊 **Access to benchmark datasets** and challenge specifications
    - 🏆 **Rankings and leaderboards** showing your model's performance
    - 📈 **Detailed evaluation metrics** across multiple time series
    - 🤝 **Community support** from fellow forecasting researchers
    
    ### Requirements:
    
    - Valid organization or affiliation
    - Commitment to fair participation
    - Adherence to benchmark guidelines
    
    For more information, please contact us via email!

    ### Help Us Validate Your Model Implementation:
    Transparency is at the heart of our live benchmarking project. We have integrated a wide range of state-of-the-art time series forecasting models to provide the community with real-time performance insights.
    To ensure that every model is evaluated under optimal conditions, **we invite the original authors and maintainers to review our implementations.** If you are a developer of one of the featured models, we would value your feedback on:
    
    - Model configuration and hyperparameters.
    - Data preprocessing steps.
    - Implementation-specific nuances.
                
    Our goal is to represent your work as accurately as possible. Please visit our [GitHub Repository](https://github.com/DAG-UPB/ts-arena) to review the code or open an issue for any suggested improvements.
    """)
    # TODO: Change link to GitHub Repository
