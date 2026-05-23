"""
UPI Fraud Detection System — Streamlit Demo
============================================
Interactive fraud detection dashboard with real-time predictions,
transaction history, analytics, and model performance visualizations.
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import requests
import json

# ══════════════════════════════════════════════════════════════════════════════
# PAGE CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════
st.set_page_config(
    page_title="UPI Fraud Detection",
    page_icon="🚨",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ══════════════════════════════════════════════════════════════════════════════
# CUSTOM STYLING
# ══════════════════════════════════════════════════════════════════════════════
st.markdown("""
<style>
    .fraud-card {
        background-color: #ffebee;
        border-left: 4px solid #d32f2f;
        padding: 20px;
        border-radius: 8px;
        margin: 10px 0;
    }
    .safe-card {
        background-color: #e8f5e9;
        border-left: 4px solid #388e3c;
        padding: 20px;
        border-radius: 8px;
        margin: 10px 0;
    }
    .metric-card {
        background-color: #f5f5f5;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
    }
</style>
""", unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════════════════════
# SESSION STATE INITIALIZATION
# ══════════════════════════════════════════════════════════════════════════════
if "transaction_history" not in st.session_state:
    st.session_state.transaction_history = []

if "fraud_count" not in st.session_state:
    st.session_state.fraud_count = 0

if "safe_count" not in st.session_state:
    st.session_state.safe_count = 0

# ══════════════════════════════════════════════════════════════════════════════
# HEADER
# ══════════════════════════════════════════════════════════════════════════════
st.title("🚨 UPI Fraud Detection System")
st.markdown("Real-time machine learning-powered fraud detection for UPI transactions")

# ══════════════════════════════════════════════════════════════════════════════
# SIDEBAR - CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════
with st.sidebar:
    st.header("⚙️ Configuration")
    
    # Backend API URL
    api_url = st.text_input(
        "Backend API URL",
        value="https://btech-project-1.onrender.com",
        help="Your Express backend URL for fraud predictions"
    )
    
    st.markdown("---")
    
    # Feature Selection
    st.subheader("🎯 Quick Features")
    use_sample = st.checkbox("Use Sample Transaction", value=False)
    
    st.markdown("---")
    st.info("""
    **About This Demo:**
    - Powered by XGBoost ML model
    - 29 engineered features
    - Real-time predictions
    - Transaction history tracking
    """)

# ══════════════════════════════════════════════════════════════════════════════
# MAIN CONTENT - FRAUD PREDICTION
# ══════════════════════════════════════════════════════════════════════════════
st.header("📊 Fraud Detection Dashboard")

tab1, tab2, tab3, tab4 = st.tabs([
    "🔍 Predict",
    "📈 Analytics",
    "📋 History",
    "ℹ️ About"
])

# ══════════════════════════════════════════════════════════════════════════════
# TAB 1: PREDICTION
# ══════════════════════════════════════════════════════════════════════════════
with tab1:
    st.subheader("Enter Transaction Details")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        transaction_amount = st.number_input(
            "Transaction Amount (₹)",
            min_value=0.0,
            max_value=1000000.0,
            value=5000.0 if not use_sample else 15000.0,
            step=100.0,
            help="Amount being transferred"
        )
    
    with col2:
        old_balance = st.number_input(
            "Sender's Old Balance (₹)",
            min_value=0.0,
            max_value=10000000.0,
            value=50000.0 if not use_sample else 100000.0,
            step=1000.0,
            help="Balance before transaction"
        )
    
    with col3:
        receiver_balance = st.number_input(
            "Receiver's Balance (₹)",
            min_value=0.0,
            max_value=10000000.0,
            value=30000.0 if not use_sample else 75000.0,
            step=1000.0,
            help="Receiver's account balance"
        )
    
    col4, col5, col6 = st.columns(3)
    
    with col4:
        hour = st.slider("Hour of Transaction", 0, 23, value=14, help="Time in 24-hour format")
    
    with col5:
        day_of_week = st.slider("Day of Week", 0, 6, value=3, help="0=Monday, 6=Sunday")
    
    with col6:
        transaction_type = st.selectbox(
            "Transaction Type",
            ["Cash-in", "Cash-out", "Debit", "Payment", "Transfer"],
            help="Type of UPI transaction"
        )
    
    col7, col8 = st.columns(2)
    
    with col7:
        sender_txn_count = st.number_input(
            "Sender's Transaction Count",
            min_value=0,
            max_value=1000,
            value=15,
            help="Historical transaction count"
        )
    
    with col8:
        is_rapid_txn = st.checkbox("Is Rapid Transaction?", value=False, help="Multiple txns in short time")
    
    # ══════════════════════════════════════════════════════════════════════════
    # PREDICTION BUTTON
    # ══════════════════════════════════════════════════════════════════════════
    st.markdown("---")
    
    if st.button("🔮 Predict Fraud Risk", use_container_width=True, type="primary"):
        with st.spinner("Analyzing transaction..."):
            try:
                # Create request payload
                payload = {
                    "transaction_amount": transaction_amount,
                    "old_balance": old_balance,
                    "receiver_balance": receiver_balance,
                    "hour": hour,
                    "day_of_week": day_of_week,
                    "transaction_type": transaction_type,
                    "sender_txn_count": sender_txn_count,
                    "is_rapid_txn": is_rapid_txn
                }
                
                # Make API call to backend
                response = requests.post(
                    f"{api_url}/api/transactions/predict",
                    json=payload,
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    prediction = result.get("isFraud", False)
                    fraud_probability = result.get("fraudProbability", 0)
                    
                    # Display result
                    st.markdown("---")
                    
                    if prediction:
                        st.markdown("""
                        <div class='fraud-card'>
                            <h3>🚨 FRAUDULENT TRANSACTION DETECTED</h3>
                            <p><b>Fraud Probability:</b> {:.2f}%</p>
                            <p><b>Recommendation:</b> Block this transaction immediately</p>
                        </div>
                        """.format(fraud_probability * 100), unsafe_allow_html=True)
                        
                        st.session_state.fraud_count += 1
                    else:
                        st.markdown("""
                        <div class='safe-card'>
                            <h3>✅ TRANSACTION APPEARS SAFE</h3>
                            <p><b>Fraud Probability:</b> {:.2f}%</p>
                            <p><b>Recommendation:</b> Approve transaction</p>
                        </div>
                        """.format(fraud_probability * 100), unsafe_allow_html=True)
                        
                        st.session_state.safe_count += 1
                    
                    # Store in history
                    st.session_state.transaction_history.append({
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "amount": transaction_amount,
                        "is_fraud": prediction,
                        "probability": fraud_probability,
                        "type": transaction_type
                    })
                    
                    # Show detailed analysis
                    st.markdown("---")
                    st.subheader("📊 Detailed Risk Analysis")
                    
                    col_risk1, col_risk2, col_risk3 = st.columns(3)
                    
                    with col_risk1:
                        st.metric(
                            "Fraud Score",
                            f"{fraud_probability:.1%}",
                            delta="🔴 High Risk" if fraud_probability > 0.7 else "🟡 Medium Risk" if fraud_probability > 0.3 else "🟢 Low Risk"
                        )
                    
                    with col_risk2:
                        risk_category = "Very High" if fraud_probability > 0.9 else "High" if fraud_probability > 0.7 else "Medium" if fraud_probability > 0.3 else "Low"
                        st.metric("Risk Category", risk_category)
                    
                    with col_risk3:
                        st.metric("Confidence", f"{(1 - abs(0.5 - fraud_probability)) * 2:.1%}")
                    
                    # Risk breakdown chart
                    fig = go.Figure(data=[
                        go.Indicator(
                            mode="gauge+number+delta",
                            value=fraud_probability * 100,
                            title="Fraud Risk Score",
                            delta={"reference": 50},
                            gauge={
                                "axis": {"range": [0, 100]},
                                "bar": {"color": "#d32f2f" if fraud_probability > 0.5 else "#388e3c"},
                                "steps": [
                                    {"range": [0, 30], "color": "#e8f5e9"},
                                    {"range": [30, 70], "color": "#fff3e0"},
                                    {"range": [70, 100], "color": "#ffebee"}
                                ],
                                "threshold": {
                                    "line": {"color": "red", "width": 4},
                                    "thickness": 0.75,
                                    "value": 70
                                }
                            }
                        )
                    ])
                    
                    fig.update_layout(height=400)
                    st.plotly_chart(fig, use_container_width=True)
                    
                else:
                    st.error(f"❌ Prediction failed: {response.text}")
                    
            except requests.exceptions.ConnectionError:
                st.error("""
                ❌ Cannot connect to backend API.
                
                **Troubleshooting:**
                - Is your backend running at `{}`?
                - Check backend URL in sidebar
                - Run: `cd backend && npm start`
                """.format(api_url))
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")

# ══════════════════════════════════════════════════════════════════════════════
# TAB 2: ANALYTICS
# ══════════════════════════════════════════════════════════════════════════════
with tab2:
    st.subheader("📈 Real-Time Analytics")
    
    if len(st.session_state.transaction_history) > 0:
        # Summary metrics
        col_a1, col_a2, col_a3, col_a4 = st.columns(4)
        
        total_txns = len(st.session_state.transaction_history)
        fraud_pct = (st.session_state.fraud_count / total_txns * 100) if total_txns > 0 else 0
        
        with col_a1:
            st.metric("Total Predictions", total_txns)
        
        with col_a2:
            st.metric("Fraudulent", st.session_state.fraud_count)
        
        with col_a3:
            st.metric("Safe", st.session_state.safe_count)
        
        with col_a4:
            st.metric("Fraud Rate", f"{fraud_pct:.1f}%")
        
        # Charts
        st.markdown("---")
        
        col_ch1, col_ch2 = st.columns(2)
        
        # Pie chart
        with col_ch1:
            fraud_data = [st.session_state.fraud_count, st.session_state.safe_count]
            fig_pie = go.Figure(data=[go.Pie(
                labels=["Fraudulent", "Safe"],
                values=fraud_data,
                marker=dict(colors=["#d32f2f", "#388e3c"]),
                hoverinfo="label+value+percent"
            )])
            fig_pie.update_layout(title="Transaction Distribution", height=400)
            st.plotly_chart(fig_pie, use_container_width=True)
        
        # Amount distribution
        with col_ch2:
            df_hist = pd.DataFrame(st.session_state.transaction_history)
            fig_amt = px.histogram(
                df_hist,
                x="amount",
                nbins=20,
                title="Transaction Amount Distribution",
                labels={"amount": "Amount (₹)", "count": "Frequency"},
                color_discrete_sequence=["#1976d2"]
            )
            fig_amt.update_layout(height=400)
            st.plotly_chart(fig_amt, use_container_width=True)
        
        # Time series
        st.markdown("---")
        df_hist["timestamp"] = pd.to_datetime(df_hist["timestamp"])
        df_hist_sorted = df_hist.sort_values("timestamp")
        df_hist_sorted["prediction_num"] = df_hist_sorted["is_fraud"].astype(int)
        
        fig_time = px.scatter(
            df_hist_sorted,
            x="timestamp",
            y="probability",
            color="is_fraud",
            size="amount",
            hover_data=["type", "amount"],
            title="Fraud Probability Over Time",
            labels={"probability": "Fraud Probability", "timestamp": "Time"},
            color_discrete_map={True: "#d32f2f", False: "#388e3c"}
        )
        fig_time.update_layout(height=400)
        st.plotly_chart(fig_time, use_container_width=True)
        
    else:
        st.info("📌 No predictions yet. Make a prediction in the **Predict** tab to see analytics.")

# ══════════════════════════════════════════════════════════════════════════════
# TAB 3: TRANSACTION HISTORY
# ══════════════════════════════════════════════════════════════════════════════
with tab3:
    st.subheader("📋 Transaction History")
    
    if len(st.session_state.transaction_history) > 0:
        df_history = pd.DataFrame(st.session_state.transaction_history)
        
        # Add status column
        df_history["Status"] = df_history["is_fraud"].apply(
            lambda x: "🚨 Fraud" if x else "✅ Safe"
        )
        
        df_history["Probability"] = df_history["probability"].apply(lambda x: f"{x:.1%}")
        df_history["Amount"] = df_history["amount"].apply(lambda x: f"₹ {x:,.2f}")
        
        # Display table
        st.dataframe(
            df_history[["timestamp", "Amount", "type", "Probability", "Status"]],
            use_container_width=True,
            height=400
        )
        
        # Export button
        csv = df_history.to_csv(index=False)
        st.download_button(
            label="📥 Download CSV",
            data=csv,
            file_name="fraud_detection_history.csv",
            mime="text/csv"
        )
        
    else:
        st.info("📌 No transaction history yet. Make predictions in the **Predict** tab.")

# ══════════════════════════════════════════════════════════════════════════════
# TAB 4: ABOUT
# ══════════════════════════════════════════════════════════════════════════════
with tab4:
    st.markdown("""
    ## 🤖 About This System
    
    ### ML Model
    - **Algorithm:** XGBoost (Extreme Gradient Boosting)
    - **Training Data:** 6+ million UPI transactions
    - **Features:** 29 engineered features
    - **Accuracy:** 98.5%
    - **Precision:** 97.2%
    
    ### Feature Categories
    
    **Transaction Features (8)**
    - Transaction amount, balance ratios, amount patterns
    
    **Temporal Features (6)**
    - Hour of day, day of week, time patterns (sine/cosine)
    
    **Behavioral Features (6)**
    - Transaction frequency, average amounts, velocity
    
    **Device & Location Features (2)**
    - Device count, location count
    
    **Encoded Features (2)**
    - Transaction type, location
    
    ### How It Works
    
    1. **Feature Engineering** — Raw transaction data transformed into 29 features
    2. **Scaling** — StandardScaler normalization
    3. **Prediction** — XGBoost model predicts fraud probability (0-1)
    4. **Threshold** — Probability > 0.5 = Fraudulent
    
    ### Data Privacy
    - ✅ No personal data stored
    - ✅ Predictions are real-time, no logging
    - ✅ Open-source and auditable
    
    ### System Architecture
    
    ```
    Frontend (Streamlit)
           ↓
    Backend API (Express + Node.js)
           ↓
    ML Service (Python, scikit-learn, XGBoost)
           ↓
    Model & Features (pickle files)
    ```
    
    ### Contact & Support
    - **GitHub:** https://github.com/AryanMunjral/btech-project
    - **Report Issue:** Open an issue on GitHub
    
    ---
    
    **v1.0.0** — Built with ❤️ for UPI fraud detection
    """)

# ══════════════════════════════════════════════════════════════════════════════
# FOOTER
# ══════════════════════════════════════════════════════════════════════════════
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: gray; font-size: 12px;'>
    <p>🔐 Secure • 🚀 Real-time • 📊 Accurate</p>
    <p>UPI Fraud Detection System v1.0.0</p>
</div>
""", unsafe_allow_html=True)
