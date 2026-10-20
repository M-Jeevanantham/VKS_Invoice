import React, { useState } from 'react';
import { Invoice, Payment, BusinessSettings } from '../../types';
import { InvoicePrint } from '../print/InvoicePrint';
import {
  X,
  Printer,
  Download,
  CreditCard,
  Edit,
  Copy,
  CheckCircle2,
  Calendar,
  Building,
  Truck,
  Eye,
  FileText,
  CheckCircle,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface InvoiceDetailsModalProps {
  invoice: Invoice;
  settings: BusinessSettings;
  payments: Payment[];
  onClose: () => void;
  onEditDraft: (invoice: Invoice) => void;
  onFinalize?: (invoiceId: string, customInvoiceNumber?: string) => Promise<Invoice>;
  onDeleteInvoice?: (invoiceId: string) => void;
  onDuplicate: (invoiceId: string) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
  onDownloadPdf: (invoice: Invoice) => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  invoice,
  settings,
  payments,
  onClose,
  onEditDraft,
  onFinalize,
  onDeleteInvoice,
  onDuplicate,
  onRecordPayment,
  onPrint,
  onDownloadPdf,
}) => {
  const [activeTab, setActiveTab] = useState<'app_view' | 'a4_preview'>('a4_preview');

  // Computed default auto sequential bill number
  const nextSeqPadded = String(settings.next_sequence_number || 1).padStart(3, '0');
  const defaultAutoNumber = settings.invoice_number_format
    .replace('{PREFIX}', settings.invoice_prefix)
    .replace('{YEAR}', new Date().getFullYear().toString())
    .replace('{SEQ}', nextSeqPadded);

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [invoiceNumberMode, setInvoiceNumberMode] = useState<'auto' | 'manual'>('auto');
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState(defaultAutoNumber);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState('');

  // Related payments for this invoice
  const invoicePayments = payments.filter((p) => p.invoice_id === invoice.id);

  const handleExecuteFinalize = async () => {
    if (!onFinalize) return;
    try {
      if (invoiceNumberMode === 'manual' && !customInvoiceNumber.trim()) {
        setFinalizeError('Please enter a manual invoice number, or select Auto-Generate.');
        return;
      }
      setIsFinalizing(true);
      setFinalizeError('');
      const customNum = invoiceNumberMode === 'manual' ? customInvoiceNumber.trim() : undefined;
      await onFinalize(invoice.id, customNum);
      setShowFinalizeModal(false);
    } catch (err: any) {
      setFinalizeError(err.message || 'Failed to finalize invoice.');
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#30252A]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-dialog w-full max-w-5xl my-6 flex flex-col max-h-[92vh] overflow-hidden border border-[#E8DFDC]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-[#E8DFDC] bg-[#FAF6F5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#702C3B] text-white flex items-center justify-center font-bold text-xs">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#30252A] font-serif">
                  {invoice.invoice_number || 'DRAFT INVOICE'}
                </h2>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    invoice.invoice_status === 'FINALIZED'
                      ? 'bg-[#EBF6F1] text-[#702C3B] border-[#F195A5]'
                      : 'bg-[#F3EFEF] text-[#6C5D64] border-[#E8DFDC]'
                  }`}
                >
                  {invoice.invoice_status}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    invoice.payment_status === 'PAID'
                      ? 'bg-[#EBF6F1] text-[#1E7B54] border-[#C1E6D6]'
                      : invoice.payment_status === 'PARTIALLY_PAID'
                      ? 'bg-[#FDF6EC] text-[#B8741A] border-[#F7DEB8]'
                      : 'bg-[#FCECEE] text-[#B82A3A] border-[#F4BEC5]'
                  }`}
                >
                  {invoice.payment_status}
                </span>
              </div>
              <p className="text-[11px] text-[#6C5D64]">
                Issued on {invoice.invoice_date} • Due on {invoice.due_date}
              </p>
            </div>
          </div>

          {/* View Mode Toggle: A4 Grayscale Print Preview vs Application Audit View */}
          <div className="flex items-center gap-2">
            <div className="flex rounded bg-[#E8DFDC] p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('a4_preview')}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  activeTab === 'a4_preview'
                    ? 'bg-white text-[#702C3B] font-semibold shadow-xs'
                    : 'text-[#6C5D64] hover:text-[#30252A]'
                }`}
              >
                A4 Print Layout
              </button>
              <button
                onClick={() => setActiveTab('app_view')}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  activeTab === 'app_view'
                    ? 'bg-white text-[#702C3B] font-semibold shadow-xs'
                    : 'text-[#6C5D64] hover:text-[#30252A]'
                }`}
              >
                Ledger Data
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6C5D64] hover:text-[#30252A] hover:bg-[#E8DFDC]/50 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="px-6 py-2.5 bg-white border-b border-[#E8DFDC] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(invoice)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded font-semibold shadow-sm transition-all focus:ring-2 focus:ring-[#D4AE77]"
            >
              <Printer size={14} />
              <span>Print A4 Invoice</span>
            </button>

            <button
              onClick={() => onDownloadPdf(invoice)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8DFDC] hover:bg-[#FAF6F5] text-[#30252A] rounded font-medium transition-all"
            >
              <Download size={14} className="text-[#702C3B]" />
              <span>Download PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {invoice.invoice_status === 'FINALIZED' && invoice.payment_status !== 'PAID' && (
              <button
                onClick={() => onRecordPayment(invoice)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EBF6F1] border border-[#C1E6D6] hover:bg-[#d8efe5] text-[#1E7B54] rounded font-semibold transition-all"
              >
                <CreditCard size={14} />
                <span>Record Payment</span>
              </button>
            )}

            {invoice.invoice_status === 'DRAFT' && (
              <>
                {onFinalize && (
                  <button
                    onClick={() => {
                      setFinalizeError('');
                      setShowFinalizeModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded font-semibold shadow-sm transition-all focus:ring-2 focus:ring-[#D4AE77]"
                  >
                    <CheckCircle size={14} className="text-[#D4AE77]" />
                    <span>Finalize &amp; Allocate Bill No</span>
                  </button>
                )}
                <button
                  onClick={() => onEditDraft(invoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F5] border border-[#E8DFDC] hover:bg-[#E8DFDC] text-[#702C3B] rounded font-semibold transition-all"
                >
                  <Edit size={14} />
                  <span>Edit Draft</span>
                </button>
              </>
            )}

            <button
              onClick={() => onDuplicate(invoice.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8DFDC] hover:bg-[#FAF6F5] text-[#6C5D64] rounded font-medium transition-all"
            >
              <Copy size={14} />
              <span>Duplicate Bill</span>
            </button>

            {onDeleteInvoice && (
              <button
                onClick={() => onDeleteInvoice(invoice.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#F4BEC5] hover:bg-[#FCECEE] text-[#B82A3A] rounded font-medium transition-all"
                title="Delete Invoice"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#FAF6F5]">
          {activeTab === 'a4_preview' ? (
            <div className="flex justify-center">
              <div className="shadow-lg rounded overflow-hidden">
                <InvoicePrint invoice={invoice} settings={settings} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Receiver & Supply cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-[#E8DFDC] text-xs space-y-2">
                  <div className="font-bold uppercase tracking-wider text-[#702C3B] flex items-center gap-1.5 border-b border-[#E8DFDC] pb-2">
                    <Building size={14} />
                    <span>Customer &amp; Billing Details</span>
                  </div>
                  <div>
                    <span className="font-bold text-sm text-[#30252A] block">
                      {invoice.customer_snapshot.customer_name}
                    </span>
                    {invoice.customer_snapshot.contact_person && (
                      <span className="text-[#6C5D64] block">
                        Attn: {invoice.customer_snapshot.contact_person}
                      </span>
                    )}
                    <p className="text-neutral-700 mt-1">
                      {invoice.customer_snapshot.billing_address}
                    </p>
                    <p className="text-neutral-700">
                      {invoice.customer_snapshot.city}, {invoice.customer_snapshot.state} -{' '}
                      {invoice.customer_snapshot.postal_code}
                    </p>
                    <div className="mt-2 pt-2 border-t border-[#E8DFDC] flex justify-between">
                      <span>Phone: {invoice.customer_snapshot.phone}</span>
                      <span className="font-mono font-semibold">
                        GSTIN: {invoice.customer_snapshot.gstin || 'URP'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-[#E8DFDC] text-xs space-y-2">
                  <div className="font-bold uppercase tracking-wider text-[#702C3B] flex items-center gap-1.5 border-b border-[#E8DFDC] pb-2">
                    <Truck size={14} />
                    <span>Shipping &amp; Logistics</span>
                  </div>
                  <div className="space-y-1 text-neutral-700">
                    <div>
                      <span className="text-[#6C5D64]">Shipped To: </span>
                      <span className="font-medium text-[#30252A]">
                        {invoice.customer_snapshot.shipping_address ||
                          invoice.customer_snapshot.billing_address}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6C5D64]">Transport Service: </span>
                      <span>{invoice.transport_name || 'Direct / Self'}</span>
                    </div>
                    <div>
                      <span className="text-[#6C5D64]">Vehicle Number: </span>
                      <span className="font-mono">{invoice.vehicle_number || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[#6C5D64]">L.R. / Consignment No: </span>
                      <span className="font-mono">{invoice.lr_number || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[#6C5D64]">Delivery Challan No: </span>
                      <span className="font-mono">{invoice.dc_number || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white rounded-lg border border-[#E8DFDC] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#FAF6F5] border-b border-[#E8DFDC] font-bold text-xs uppercase text-[#6C5D64]">
                  Invoice Line Items Snapshot
                </div>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#E8DFDC] text-[#6C5D64] bg-white">
                      <th className="p-2.5 text-center w-10 font-bold">#</th>
                      <th className="p-2.5 font-bold">Item Description</th>
                      <th className="p-2.5 text-center font-bold">HSN/SAC</th>
                      <th className="p-2.5 text-right font-bold">Quantity</th>
                      <th className="p-2.5 text-center font-bold">Unit</th>
                      <th className="p-2.5 text-right font-bold">Rate (₹)</th>
                      <th className="p-2.5 text-center font-bold">Tax %</th>
                      <th className="p-2.5 text-right font-bold">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFDC]">
                    {invoice.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="p-2.5 text-center text-[#6C5D64]">{idx + 1}</td>
                        <td className="p-2.5 font-medium text-[#30252A]">{it.item_name}</td>
                        <td className="p-2.5 text-center font-mono">{it.hsn_sac}</td>
                        <td className="p-2.5 text-right font-mono tabular-nums">{it.quantity}</td>
                        <td className="p-2.5 text-center">{it.unit}</td>
                        <td className="p-2.5 text-right font-mono tabular-nums">
                          ₹{Number(it.unit_price).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center font-mono">{it.tax_rate}%</td>
                        <td className="p-2.5 text-right font-mono tabular-nums font-bold text-[#30252A]">
                          ₹{Number(it.line_total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payment History for this Invoice */}
              <div className="bg-white rounded-lg border border-[#E8DFDC] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8DFDC] pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#702C3B]">
                    Recorded Payments
                  </h4>
                  <div className="text-xs text-[#6C5D64]">
                    Total Paid:{' '}
                    <strong className="text-[#1E7B54] font-mono">
                      ₹{Number(invoice.amount_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>{' '}
                    | Balance Due:{' '}
                    <strong className="text-[#B8741A] font-mono">
                      ₹{Number(invoice.outstanding_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                {invoicePayments.length === 0 ? (
                  <p className="text-xs text-[#6C5D64] py-2">
                    No payments recorded for this invoice yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {invoicePayments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded bg-[#FAF6F5] text-xs"
                      >
                        <div>
                          <span className="font-semibold text-[#30252A]">
                            {p.payment_method.replace('_', ' ')}
                          </span>{' '}
                          • <span className="text-[#6C5D64]">{p.payment_date}</span>
                          {p.reference_number && (
                            <span className="ml-2 font-mono text-[10px] text-neutral-500">
                              (Ref: {p.reference_number})
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-[#1E7B54]">
                          ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* FINALIZATION ALLOCATION MODAL (AUTO VS MANUAL BILL NUMBER)        */}
      {/* ================================================================= */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E8DFDC] max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="h-1.5 bg-[#702C3B]" />

            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 bg-[#FAF6F5] rounded-lg border border-[#E8DFDC] text-[#702C3B]">
                  <CheckCircle size={22} className="text-[#702C3B]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#30252A] font-serif">
                    Finalize Commercial Invoice
                  </h3>
                  <p className="text-xs text-[#6C5D64] mt-0.5">
                    Choose how the official bill / invoice number will be assigned:
                  </p>
                </div>
              </div>

              {finalizeError && (
                <div className="mb-4 p-2.5 bg-[#FCECEE] border border-[#F4BEC5] text-[#B82A3A] rounded text-xs flex items-center gap-1.5">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>{finalizeError}</span>
                </div>
              )}

              <div className="space-y-3 mb-5 text-xs">
                {/* Option 1: Auto-generate */}
                <label
                  onClick={() => setInvoiceNumberMode('auto')}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                    invoiceNumberMode === 'auto'
                      ? 'border-[#702C3B] bg-[#FAF6F5] shadow-xs'
                      : 'border-[#E8DFDC] hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="modal_details_invoice_mode"
                    checked={invoiceNumberMode === 'auto'}
                    onChange={() => setInvoiceNumberMode('auto')}
                    className="mt-0.5 accent-[#702C3B]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#30252A]">
                        Auto-Generate Sequential Number
                      </span>
                      <span className="font-mono text-[11px] font-bold text-[#702C3B] bg-white px-2 py-0.5 rounded border border-[#E8DFDC]">
                        {defaultAutoNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6C5D64] mt-1">
                      System automatically allocates the next sequential number and advances the counter.
                    </p>
                  </div>
                </label>

                {/* Option 2: Enter Manually */}
                <label
                  onClick={() => setInvoiceNumberMode('manual')}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                    invoiceNumberMode === 'manual'
                      ? 'border-[#702C3B] bg-[#FAF6F5] shadow-xs'
                      : 'border-[#E8DFDC] hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="modal_details_invoice_mode"
                    checked={invoiceNumberMode === 'manual'}
                    onChange={() => setInvoiceNumberMode('manual')}
                    className="mt-0.5 accent-[#702C3B]"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-[#30252A]">
                      Enter Manually (Custom Bill No)
                    </span>
                    <p className="text-[11px] text-[#6C5D64] mt-0.5">
                      Type your own existing bill number or custom format.
                    </p>

                    {invoiceNumberMode === 'manual' && (
                      <div className="mt-2.5">
                        <input
                          type="text"
                          autoFocus
                          value={customInvoiceNumber}
                          onChange={(e) => {
                            setCustomInvoiceNumber(e.target.value);
                            setFinalizeError('');
                          }}
                          placeholder={`e.g. ${defaultAutoNumber} or custom bill no`}
                          className="w-full px-3 py-2 bg-white border border-[#702C3B] rounded font-mono font-bold text-xs text-[#30252A] focus:outline-none focus:ring-1 focus:ring-[#D4AE77]"
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="p-2.5 bg-[#FAF6F5] rounded border border-[#E8DFDC] mb-5 text-[11px] text-[#6C5D64]">
                <strong>Notice:</strong> Once finalized, the invoice receives an immutable number and line items are locked.
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFinalizeModal(false);
                    setFinalizeError('');
                  }}
                  disabled={isFinalizing}
                  className="px-3.5 py-1.5 bg-white border border-[#E8DFDC] hover:bg-[#FAF6F5] text-[#30252A] rounded text-xs font-medium transition-all"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteFinalize}
                  disabled={isFinalizing}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <CheckCircle size={14} className="text-[#D4AE77]" />
                  <span>{isFinalizing ? 'Finalizing...' : 'Confirm & Finalize Invoice'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
