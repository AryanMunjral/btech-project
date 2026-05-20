/**
 * RecentTransactions — Compact card showing the latest 5 transactions.
 *
 * Used on the Dashboard for a quick at-a-glance view.
 * Links to the full Transactions page.
 *
 * Usage:
 *   <RecentTransactions transactions={[...]} />
 */

import { Link } from 'react-router-dom';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Ban,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

function RecentTransactions({ transactions = [] }) {
  if (transactions.length === 0) {
    return (
      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Recent Transactions
        </h3>
        <p className="text-sm text-gray-400 text-center py-8">
          No recent transactions
        </p>
      </div>
    );
  }

  return (
    <div className="card p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-base font-semibold text-gray-900">
          Recent Transactions
        </h3>
        <Link
          to="/transactions"
          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-50">
        {transactions.slice(0, 5).map((txn) => {
          const isFraud = txn.isFraud ?? txn.is_fraud ?? false;
          const status = txn.status || (isFraud ? 'FLAGGED' : 'COMPLETED');
          const senderUpi = txn.senderUpi || txn.sender_upi || '';
          const receiverUpi = txn.receiverUpi || txn.receiver_upi || '';
          const probability = txn.fraudProbability ?? txn.fraud_probability ?? 0;
          const createdAt = txn.createdAt || txn.created_at;

          return (
            <div
              key={txn.id}
              className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              {/* Status Icon */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  status === 'BLOCKED'
                    ? 'bg-red-100 text-red-600'
                    : status === 'FLAGGED'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-green-100 text-green-600'
                }`}
              >
                {status === 'BLOCKED' ? (
                  <Ban className="h-4 w-4" />
                ) : status === 'FLAGGED' ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {senderUpi}
                  </span>
                  <ArrowUpRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600 truncate">
                    {receiverUpi}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {createdAt
                    ? new Date(createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </p>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p
                  className={`text-sm font-semibold ${
                    isFraud ? 'text-danger-600' : 'text-gray-900'
                  }`}
                >
                  ₹{Number(txn.amount).toLocaleString('en-IN')}
                </p>
                {isFraud && (
                  <p className="text-xs text-danger-500">
                    {(probability * 100).toFixed(0)}% risk
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecentTransactions;
