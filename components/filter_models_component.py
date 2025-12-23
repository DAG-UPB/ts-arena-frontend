import streamlit as st

def render_filter_models_component(series_options: list[dict], models: list[dict]):
    # Select series:
    if series_options:
        # Default to first two series only
        default_selection = [s['description'] for s in series_options[:2]]
        
        selected_series = st.multiselect(
            "Time Series Selection",
            options=[s['description'] for s in series_options],
            default=default_selection,
            help="Select which time series to display in the plot",
            key="series_select"
        )
        
        # Extract series IDs from selection
        selected_series_ids = [
            s['id'] for s in series_options 
            if s['description'] in selected_series
        ]
    else:
        selected_series_ids = None
    
    # Select models:
    if models:
        selected_readable_model_ids = [model["readable_id"] for model in models]
        max_value = [model["model_size"] for model in models if model["model_size"] is not None]
        max_value = max(max_value) if max_value else 0
        # Filter size
        selected_size = st.number_input(
            "Model Max Size",
            min_value=0,
            value=max_value,
            step=1,
            help="Filter models by size (in million)",
            key="model_size_filter"
        )
        # Nones are always displayed 
        deselected_sizes_ids = [model["readable_id"] for model in models if model["model_size"] is not None and model["model_size"] > selected_size]

        # Filter name
        selected_names = st.text_input(
            "Model Name Contains",
            value="",
            help="Filter models by name containing this text. Multiple names can be separated by commas.",
            key="model_name_filter"
        )
        if selected_names.strip(",").strip() == "":
            deselected_name_ids = []
        else:
            deselected_name_ids = selected_readable_model_ids.copy()
        for multiple in selected_names.split(","):
            multiple = multiple.strip()
            if multiple:
                deselected_name_ids = list(set([model["readable_id"] for model in models if multiple.lower() not in model["name"].lower() and multiple.lower() != model["readable_id"].lower()]) & set(deselected_name_ids))

        # Filter by architecture
        available_architectures = list(set(model["architecture"] for model in models if model["architecture"] is not None))
        select_architecture = st.multiselect(
            "Model Architecture",
            options=available_architectures,
            default=available_architectures,
            help="Filter by model architecture",
            key="model_architecture_filter"
        )
        deselected_architecture_ids = [
            model["readable_id"] for model in models 
            if model["architecture"] not in select_architecture
        ]

        # Combine filters
        selected_readable_model_ids = list(set(selected_readable_model_ids) - set(deselected_sizes_ids) - set(deselected_name_ids) - set(deselected_architecture_ids))
    else:
        selected_readable_model_ids = None
    return selected_series_ids, selected_readable_model_ids