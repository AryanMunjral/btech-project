/**
 * TransactionTable (v4.0) — With status badges, risk levels, and probability
 * ============================================================================
 *
 * Updated to handle the v4.0 backend response shape:
 *   - transactionId (camelCase from Prisma)
 *   - senderUpi / receiverUpi (camelCase)
 *   - fraudProbability, riskLevel, status fields
 */

import { AlertTriangle, CheckCircle, Ban, Clock, XCircle } from 'lucide-react';
import Badge from './Badge';

// Status → badge config
const statusConfig = {
  COMPLETED: { variant: 'success', icon: CheckCircle, label: 'Completed' },
  FLAGGED: { variant: 'warning', icon: AlertTriangle, label: 'Flagged' },
  BLOCKED: { variant: 'critical', icon: Ban, label: 'Blocked' },
  FAILED: { variant: 'neutral', icon: XCircle, label: 'Failed' },
  PENDING: { variant: 'info', icon: Clock, label: 'Pending' },
};

const riskConfig = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'danger',
};

function TransactionTable({ transactions = [] }) {
  if (transactions.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Transaction
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sender
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Receiver
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fraud
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Risk
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((txn) => {
              // Handle both camelCase (Prisma) and snake_case (legacy) field names
              const txnId = txn.transactionId || txn.transaction_id || '';
              const senderUpi = txn.senderUpi || txn.sender_upi || '';
              const receiverUpi = txn.receiverUpi || txn.receiver_upi || '';
              const isFraud = txn.isFraud ?? txn.is_fraud ?? false;
              const probability = txn.fraudProbability ?? txn.fraud_probability ?? 0;
              const riskLevel = txn.riskLevel || txn.risk_level || 'LOW';
              const status = txn.status || (isFraud ? 'FLAGGED' : 'COMPLETED');
              const createdAt = txn.createdAt || txn.created_at;

              const statusCfg = statusConfig[status] || statusConfig.COMPLETED;

              return (
                <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                  {/* Transaction ID */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-gray-700">
                      {txnId.slice(0, 16)}...
                    </span>
                  </td>

                  {/* Sender */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {senderUpi}
                  </td>

                  {/* Receiver */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {receiverUpi}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    ₹{Number(txn.amount).toLocaleString('en-IN')}
                  </td>

                  {/* Fraud Probability */}
                  <td className="px-4 py-3">
                    {isFraud ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-danger-700">
                        <AlertTriangle className="h-3 w-3" />
                        {(probability * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600">
                        <CheckCircle className="h-3 w-3" />
                        {(probability * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>

                  {/* Risk Level */}
                  <td className="px-4 py-3">
                    <Badge variant={riskConfig[riskLevel] || 'neutral'}>
                      {riskLevel}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge variant={statusCfg.variant} icon={statusCfg.icon}>
                      {statusCfg.label}
                    </Badge>
                  </td>

                  {/* Timestamp */}
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {createdAt
                      ? new Date(createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransactionTable;
