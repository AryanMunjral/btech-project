/**
 * Check Transaction Page (v6.0) — Integrated with Hooks
 * =======================================================
 *
 * Uses useTransactions().createTransaction for the full
 * fraud detection workflow via the backend.
 *
 * Flow:
 *   1. User fills form
 *   2. createTransaction(payload) → backend pipeline
 *   3. Backend: stores → ML predict → status → alerts
 *   4. UI shows: verdict, prediction details, record, alerts
 */

import { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Ban,
  Bell,
  Send,
  RotateCcw,
} from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import Badge from '../components/Badge';
import { formatCurrency } from '../utils/formatters';

const initialForm = {
  amount: '',
  sender_upi: '',
  receiver_upi: '',
  transaction_type: 'P2P',
  sender_balance_before: '',
  receiver_balance_before: '',
};

function CheckTransaction() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const { createTransaction } = useTransactions({ autoFetch: false });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        amount: parseFloat(form.amount),
        sender_upi: form.sender_upi.trim(),
        receiver_upi: form.receiver_upi.trim(),
        transaction_type: form.transaction_type,
        sender_balance_before: parseFloat(form.sender_balance_before) || 0,
        receiver_balance_before: parseFloat(form.receiver_balance_before) || 0,
      };

      // Submit through the backend — full fraud detection workflow
      const data = await createTransaction(payload);
      setResult(data);
    } catch {
      // Error already handled by the hook (toast shown)
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Submit Transaction
        </h1>
        <p className="text-gray-500 mt-1">
          Enter transaction details — the system will run it through the ML
          fraud detection pipeline
        </p>
      </div>

      {/* ── Transaction Form ────────────────────────────── */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Sender UPI ID</label>
              <input
                type="text"
                name="sender_upi"
                placeholder="sender@paytm"
                className="input-field"
                value={form.sender_upi}
                onChange={handleChange}
                required
                pattern="^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$"
                title="UPI ID format: name@bank"
              />
            </div>
            <div>
              <label className="input-label">Receiver UPI ID</label>
              <input
                type="text"
                name="receiver_upi"
                placeholder="receiver@ybl"
                className="input-field"
                value={form.receiver_upi}
                onChange={handleChange}
                required
                pattern="^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$"
                title="UPI ID format: name@bank"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Amount (INR)</label>
              <input
                type="number"
                name="amount"
                placeholder="5000"
                className="input-field"
                value={form.amount}
                onChange={handleChange}
                min="1"
                max="10000000"
                required
              />
            </div>
            <div>
              <label className="input-label">Transaction Type</label>
              <select
                name="transaction_type"
                className="input-field"
                value={form.transaction_type}
                onChange={handleChange}
              >
                <option value="P2P">P2P (Person to Person)</option>
                <option value="P2M">P2M (Person to Merchant)</option>
                <option value="BILL">Bill Payment</option>
                <option value="RECHARGE">Recharge</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Sender Balance Before (INR)</label>
              <input
                type="number"
                name="sender_balance_before"
                placeholder="25000"
                className="input-field"
                value={form.sender_balance_before}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div>
              <label className="input-label">
                Receiver Balance Before (INR)
              </label>
              <input
                type="number"
                name="receiver_balance_before"
                placeholder="10000"
                className="input-field"
                value={form.receiver_balance_before}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Transaction
                </>
              )}
            </button>
            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Result ──────────────────────────────────────── */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Main Verdict */}
          <div
            className={`card border-2 ${
              result.prediction?.is_fraud
                ? 'border-danger-500 bg-danger-50'
                : 'border-success-500 bg-success-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.prediction?.is_fraud ? (
                result.prediction?.status === 'BLOCKED' ? (
                  <Ban className="h-8 w-8 text-danger-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-danger-600" />
                )
              ) : (
                <CheckCircle className="h-8 w-8 text-success-600" />
              )}
              <div className="flex-1">
                <h3
                  className={`text-lg font-bold ${
                    result.prediction?.is_fraud
                      ? 'text-danger-700'
                      : 'text-success-700'
                  }`}
                >
                  {result.prediction?.is_fraud
                    ? result.prediction?.status === 'BLOCKED'
                      ? 'Transaction BLOCKED — High Fraud Risk'
                      : 'Fraudulent Transaction Detected!'
                    : 'Transaction Processed Successfully'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {result.message}
                </p>
              </div>
            </div>
          </div>

          {/* Prediction Details */}
          <div className="card">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Prediction Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Fraud Probability</p>
                <p className="text-lg font-bold text-gray-900">
                  {((result.prediction?.fraud_probability || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Confidence</p>
                <p className="text-lg font-bold text-gray-900">
                  {((result.prediction?.confidence || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Risk Level</p>
                <Badge
                  variant={
                    result.prediction?.risk_level === 'HIGH'
                      ? 'danger'
                      : result.prediction?.risk_level === 'MEDIUM'
                      ? 'warning'
                      : 'success'
                  }
                >
                  {result.prediction?.risk_level}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Method</p>
                <p className="text-sm font-medium text-gray-700">
                  {result.prediction?.method === 'xgboost'
                    ? 'XGBoost ML'
                    : 'Rule-based'}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Record */}
          <div className="card">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Transaction Record
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Transaction ID</p>
                <p className="font-mono text-gray-700">
                  {result.transaction?.transactionId}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Badge
                  variant={
                    result.prediction?.status === 'BLOCKED'
                      ? 'critical'
                      : result.prediction?.status === 'FLAGGED'
                      ? 'warning'
                      : 'success'
                  }
                >
                  {result.prediction?.status}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(result.transaction?.amount || 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Balances Updated</p>
                <p className="font-medium text-gray-900">
                  {result.balance_updated ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Alerts Generated */}
          {result.alerts?.length > 0 && (
            <div className="card border-l-4 border-l-amber-500">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-4 w-4 text-amber-600" />
                <h4 className="text-sm font-semibold text-gray-900">
                  Alerts Generated ({result.alerts.length})
                </h4>
              </div>
              <div className="space-y-2">
                {result.alerts.map((alert, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <Badge
                      variant={
                        alert.severity === 'CRITICAL'
                          ? 'critical'
                          : alert.severity === 'HIGH'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <span>{alert.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CheckTransaction;
