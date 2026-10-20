import React from 'react';
import { Invoice, Payment } from '../../types';
import { NavigationTab } from '../layout/Sidebar';
import {
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  Users,
  Package,
  History,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  payments: Payment[];
  onNavigate: (tab: NavigationTab) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  invoices,
  payments,
  onNavigate,
  onViewInvoice,
}) => {
  // 1. Metric: Total Invoices
  const totalInvoices = invoices.length;

  // 2. Metric: Invoices This Month
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const invoicesThisMonth = invoices.filter((i) => i.invoice_date.startsWith(currentMonthStr)).length;

  // 3. Metric: Total Billed (Finalized Invoices)
  const totalBilled = invoices
    .filter((i) => i.invoice_status === 'FINALIZED')
    .reduce((sum, i) => sum + Number(i.grand_total), 0);

  // 4. Metric: Outstanding Amount
  const totalOutstanding = invoices
    .filter((i) => i.invoice_status === 'FINALIZED')
    .reduce((sum, i) => sum + Number(i.outstanding_balance), 0);

  // Recent 5 Invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Recent 5 Payments
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 4 Summary Metric Tiles with Left 3px Accent Stripes per design.md */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Total Invoices */}
        <div className="bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#702C3B]" />
          <div className="flex items-center justify-between text-[#6C5D64] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Invoices</span>
            <FileText size={18} className="text-[#702C3B]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#30252A] tabular-nums font-mono">
              {totalInvoices}
            </div>
            <span className="text-[11px] text-[#6C5D64] mt-1 block">
              {invoices.filter((i) => i.invoice_status === 'FINALIZED').length} finalized,{' '}
              {invoices.filter((i) => i.invoice_status === 'DRAFT').length} drafts
            </span>
          </div>
        </div>

        {/* Tile 2: Invoices This Month */}
        <div className="bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#D4AE77]" />
          <div className="flex items-center justify-between text-[#6C5D64] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Invoices This Month</span>
            <Calendar size={18} className="text-[#D4AE77]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#30252A] tabular-nums font-mono">
              {invoicesThisMonth}
            </div>
            <span className="text-[11px] text-[#6C5D64] mt-1 block">
              Issued in {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Tile 3: Total Billed */}
        <div className="bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#702C3B]" />
          <div className="flex items-center justify-between text-[#6C5D64] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Billed</span>
            <TrendingUp size={18} className="text-[#1E7B54]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#30252A] tabular-nums font-mono">
              ₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-[#6C5D64] mt-1 block">
              Aggregate finalized sales turnover
            </span>
          </div>
        </div>

        {/* Tile 4: Outstanding Amount */}
        <div className="bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#B8741A]" />
          <div className="flex items-center justify-between text-[#6C5D64] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Outstanding Balance</span>
            <AlertCircle size={18} className="text-[#B8741A]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#B8741A] tabular-nums font-mono">
              ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-[#6C5D64] mt-1 block">
              Receivables due from client accounts
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="bg-white border border-[#E8DFDC] rounded-lg p-4 shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6C5D64]">
          Quick Workflows:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('create-invoice')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded text-xs font-semibold shadow-sm transition-all"
          >
            <PlusCircle size={15} />
            <span>Create New Invoice</span>
          </button>
          <button
            onClick={() => onNavigate('customers')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF6F5] text-[#30252A] border border-[#E8DFDC] rounded text-xs font-medium transition-all"
          >
            <Users size={15} className="text-[#702C3B]" />
            <span>Add Customer</span>
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF6F5] text-[#30252A] border border-[#E8DFDC] rounded text-xs font-medium transition-all"
          >
            <Package size={15} className="text-[#702C3B]" />
            <span>Add Product</span>
          </button>
          <button
            onClick={() => onNavigate('invoice-history')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF6F5] text-[#30252A] border border-[#E8DFDC] rounded text-xs font-medium transition-all"
          >
            <History size={15} className="text-[#702C3B]" />
            <span>View Invoice History</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Recent Invoices & Recent Payment Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Invoices (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E8DFDC] rounded-lg shadow-subtle p-5">
          <div className="flex items-center justify-between mb-4 border-b border-[#E8DFDC] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#30252A] font-serif">Recent Invoices</h3>
              <p className="text-[11px] text-[#6C5D64]">Latest billing records and state transitions</p>
            </div>
            <button
              onClick={() => onNavigate('invoice-history')}
              className="text-xs font-semibold text-[#702C3B] hover:underline flex items-center gap-1"
            >
              <span>All Invoices</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="text-center py-8 text-[#6C5D64] space-y-2">
              <FileText size={32} className="mx-auto text-neutral-300" />
              <p className="text-xs font-medium">No invoices created yet.</p>
              <button
                onClick={() => onNavigate('create-invoice')}
                className="px-3 py-1.5 bg-[#702C3B] text-white rounded text-xs font-semibold"
              >
                Create First Invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#FAF6F5] text-[#6C5D64] border-b border-[#E8DFDC]">
                    <th className="py-2 px-3 font-semibold uppercase text-[10px] tracking-wider">Invoice No</th>
                    <th className="py-2 px-3 font-semibold uppercase text-[10px] tracking-wider">Customer</th>
                    <th className="py-2 px-3 font-semibold uppercase text-[10px] tracking-wider text-right">Amount</th>
                    <th className="py-2 px-3 font-semibold uppercase text-[10px] tracking-wider text-center">Status</th>
                    <th className="py-2 px-3 font-semibold uppercase text-[10px] tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFDC]">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#FAF6F5]/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-[#30252A]">
                        {inv.invoice_number || (
                          <span className="text-neutral-400 italic">Draft</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#30252A] truncate max-w-[160px]">
                        {inv.customer_snapshot.customer_name || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#30252A]">
                        ₹{Number(inv.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {inv.invoice_status === 'DRAFT' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F3EFEF] text-[#6C5D64] border border-[#E8DFDC]">
                            Draft
                          </span>
                        ) : inv.payment_status === 'PAID' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EBF6F1] text-[#1E7B54] border border-[#C1E6D6]">
                            Paid
                          </span>
                        ) : inv.payment_status === 'PARTIALLY_PAID' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FDF6EC] text-[#B8741A] border border-[#F7DEB8]">
                            Partial
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FCECEE] text-[#B82A3A] border border-[#F4BEC5]">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="text-[#702C3B] hover:text-[#541626] font-semibold text-[11px] hover:underline"
                        >
                          View / Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Recent Payment Activity (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E8DFDC] rounded-lg shadow-subtle p-5">
          <div className="flex items-center justify-between mb-4 border-b border-[#E8DFDC] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#30252A] font-serif">Recent Payments</h3>
              <p className="text-[11px] text-[#6C5D64]">Remittances recorded against invoices</p>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-[#702C3B] hover:underline flex items-center gap-1"
            >
              <span>Ledger</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-[#6C5D64] space-y-2">
              <Clock size={32} className="mx-auto text-neutral-300" />
              <p className="text-xs font-medium">No payments recorded yet.</p>
              <p className="text-[11px] text-neutral-400">
                Record receipts from the Payments ledger or invoice view.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded border border-[#E8DFDC] bg-[#FAF6F5]/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EBF6F1] text-[#1E7B54] flex items-center justify-center">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#30252A]">
                        ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-[#6C5D64]">
                        {p.payment_method.replace('_', ' ')} • {p.payment_date}
                      </span>
                    </div>
                  </div>
                  {p.reference_number && (
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 border border-[#E8DFDC] rounded text-[#6C5D64]">
                      Ref: {p.reference_number}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
