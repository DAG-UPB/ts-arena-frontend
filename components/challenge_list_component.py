import streamlit as st
import streamlit.components.v1 as components
import sys

from components.challange_card_component import render_challenge_card


def get_time_js_script()->str:
    return """<script>
        (function(){
            function updateCountdowns(){
                var els = document.querySelectorAll('.ts-arena-countdown');
                if(!els) return "Problem";
                els.forEach(function(el){
                    var status = el.getAttribute('data-reg-status');
                    if (!status) return;
                    var ds = el.getAttribute('data-challenge-time');
                    if (!ds) return;
                    var targetDate = new Date(ds);
                    if(isNaN(targetDate.getTime())) return;
                    var now = new Date();
                    const cetString = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
                    now = new Date(cetString);
                    var diff = Math.floor((targetDate - now) / 1000);
                    var display_time = '';
                    console.log('MADE IT TO DIFF')
                    if(diff > 0){
                        var days = Math.floor(diff / (24*3600));
                        diff = diff % (24*3600);
                        var hours = Math.floor(diff / 3600);
                        diff = diff % 3600;
                        var minutes = Math.floor(diff / 60);
                        if(days > 0) display_time = days + 'd ' + hours + 'h ' + minutes + 'm';
                        else if(hours > 0) display_time = hours + 'h ' + minutes + 'm';
                        else display_time = minutes + 'm';
                    }
                    var diplay_text = 'TBD';
                    if (status == 'registration') {
                        if (diff <= 0) {
                            diplay_text = 'Registration closed';
                        } else {
                            diplay_text = 'Registration closes in: ' + display_time;
                        }
                    }
                    if (status == 'announced') {
                        if (diff <= 0) {
                            diplay_text = 'Registration open now!';
                        } else {
                            diplay_text = 'Registration opens in: ' + display_time;
                        }
                    }
                    if (status == 'active') {
                        if (diff <= 0) {
                            diplay_text = 'Challenge ended';
                        } else {
                            diplay_text = 'Results in: ' + display_time;
                        }
                    }
                    el.innerHTML = '\u23F1 <strong style="color: #667eea;">' + diplay_text + '</strong>';
                    
                });
            }
            updateCountdowns();
            setInterval(updateCountdowns, 3000);
        })();
        </script>
    """  

def render_challenge_list_component(challenges, api_client, challange_list_type: str = "ongoing", show_first: int = 5):
    # Create scrollable container for active challenges
    challenge_container = st.container(height="stretch")
    with challenge_container:
        try:
            if challenges:
                cards = []
                for challenge in challenges:
                    cards.append(render_challenge_card(challenge, api_client=api_client))
                components.html("<div class='ts-arena-upcoming-container' style='font-family: Arial, sans-serif;'>"+"".join(cards)+get_time_js_script()+"</div>", height=700, scrolling=True)
                return 
        except Exception as e:
            st.write(e)
            print(f"Error loading {challange_list_type} challenges: {e}", file=sys.stderr)
        if challange_list_type == "ongoing":
            st.write("No active challenges")
        else:
            st.write("No upcoming challenges")
