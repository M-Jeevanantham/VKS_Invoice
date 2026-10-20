import React, { useState } from 'react';
import { Payment, Invoice, PaymentMethod } from '../../types';
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  FileText,
  AlertCircle,
  X,
  Building,
} from 'lucide-react';

interface PaymentTrackerProps {
  payments: Payment[];
  invoices: Invoice[];
  onRecordPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<void>;
  onViewInvoice: (invoice: Invoice) => void;
  preselectedInvoice?: Invoice | null;
  onClearPreselected?: () => void;
}

export const PaymentTracker: React.FC<PaymentTrackerProps> = ({
  payments,
  invoices,
  onRecordPayment,
  onViewInvoice,
  preselectedInvoice,
  onClearPreselected,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(Boolean(preselectedInvoice));

  // Form state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(
    preselectedInvoice?.id || ''
  );
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [amount, setAmount] = useState<number>(
    preselectedInvoice ? preselectedInvoice.outstanding_balance : 0
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Eligible invoices for payments: Finalized and with outstanding balance > 0
  const eligibleInvoices = invoices.filter(
    (i) => i.invoice_status === 'FINALIZED' && i.outstanding_balance > 0
  );

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const found = invoices.find((i) => i.id === invId);
    if (found) {
      setAmount(found.outstanding_balance);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      setErrorMsg('Please select an invoice to apply this payment to.');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    const targetInvoice = invoices.find((i) => i.id === selectedInvoiceId);
    if (!targetInvoice) {
      setErrorMsg('Selected invoice not found.');
      return;
    }

    if (amount > targetInvoice.outstanding_balance) {
      if (
        !window.confirm(
          `Amount (₹${amount}) exceeds outstanding balance (₹${targetInvoice.outstanding_balance}). Proceed?`
        )
      ) {
        return;
      }
    }

    try {
      setIsSaving(true);
      setErrorMsg('');
      await onRecordPayment({
        invoice_id: selectedInvoiceId,
        customer_id: targetInvoice.customer_id,
        payment_date: paymentDate,
        amount: Number(amount),
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setIsModalOpen(false);
      if (onClearPreselected) onClearPreselected();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record payment.');
    } finally {
      setIsSaving(false);
    }
  };

  // Find invoice details for a payment row
  const getInvoiceDetails = (invoiceId: string) => {
    return invoices.find((i) => i.id === invoiceId);
  };

  const filteredPayments = payments.filter((p) => {
    const q = searchTerm.toLowerCase();
    const inv = getInvoiceDetails(p.invoice_id);
    return (
      inv?.invoice_number?.toLowerCase().includes(q) ||
      inv?.customer_snapshot.customer_name.toLowerCase().includes(q) ||
      p.reference_number?.toLowerCase().includes(q) ||
      p.payment_method.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-white border border-[#E8DFDC] rounded-lg p-4 shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6C5D64]"
          />
          <input
            type="text"
            placeholder="Search payments, invoice #, ref #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF6F5] border border-[#E8DFDC] rounded text-[#30252A] placeholder-[#6C5D64] focus:outline-none focus:border-[#702C3B]"
          />
        </div>

        <button
          onClick={() => {
            setSelectedInvoiceId('');
            setAmount(0);
            setReferenceNumber('');
            setNotes('');
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded text-xs font-semibold shadow-sm transition-all focus:ring-2 focus:ring-[#D4AE77]"
        >
          <Plus size={15} />
          <span>Record Remittance</span>
        </button>
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-white border border-[#E8DFDC] rounded-lg shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF6F5] text-[#6C5D64] border-b border-[#E8DFDC]">
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider">
                  Payment Date
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider">
                  Invoice Number
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider">
                  Customer
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider">
                  Method
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider">
                  Reference #
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-right">
                  Amount Received
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-right">
                  Remaining Balance
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFDC]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6C5D64]">
                    No payments found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const inv = getInvoiceDetails(p.invoice_id);
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF6F5]/50 transition-colors">
                      <td className="py-2.5 px-3 tabular-nums text-[#30252A] font-medium">
                        {p.payment_date}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#702C3B]">
                        {inv?.invoice_number || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#30252A]">
                        {inv?.customer_snapshot.customer_name || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#FAF6F5] border border-[#E8DFDC] font-medium text-[11px]">
                          {p.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#6C5D64]">
                        {p.reference_number || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#1E7B54]">
                        ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#B8741A]">
                        ₹{Number(inv?.outstanding_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {inv && (
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="text-[#702C3B] hover:text-[#541626] font-semibold text-[11px] hover:underline"
                          >
                            View Bill
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#30252A]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dialog w-full max-w-lg flex flex-col overflow-hidden border border-[#E8DFDC]">
            <div className="p-4 border-b border-[#E8DFDC] bg-[#FAF6F5] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#30252A] font-serif">
                Record Payment / Remittance
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onClearPreselected) onClearPreselected();
                }}
                className="p-1 rounded text-[#6C5D64] hover:text-[#30252A]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-[#FCECEE] border border-[#F4BEC5] text-[#B82A3A] rounded flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Target Commercial Invoice *
                </label>
                <select
                  required
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono focus:outline-none focus:border-[#702C3B]"
                >
                  <option value="">-- Choose Invoice to Credit --</option>
                  {eligibleInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} • {inv.customer_snapshot.customer_name} (Balance: ₹{inv.outstanding_balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Amount Received (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono tabular-nums font-bold text-[#1E7B54] focus:outline-none focus:border-[#702C3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Reference / UTR / Cheque #
                  </label>
                  <input
                    type="text"
                    placeholder="UTR-20261017-001"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono focus:outline-none focus:border-[#702C3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Accounting Notes / Remark
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional remittance note..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                />
              </div>

              <div className="pt-3 border-t border-[#E8DFDC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (onClearPreselected) onClearPreselected();
                  }}
                  className="px-3 py-1.5 bg-white border border-[#E8DFDC] text-[#6C5D64] hover:bg-[#FAF6F5] rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded font-semibold transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
