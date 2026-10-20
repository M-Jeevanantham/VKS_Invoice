import React, { useState, useMemo } from 'react';
import { Invoice, Customer } from '../../types';
import {
  Search,
  Filter,
  RotateCcw,
  Eye,
  Edit,
  Copy,
  Printer,
  Download,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckCircle,
} from 'lucide-react';

interface InvoiceHistoryProps {
  invoices: Invoice[];
  customers: Customer[];
  onViewInvoice: (invoice: Invoice) => void;
  onEditDraft: (invoice: Invoice) => void;
  onFinalize?: (invoiceId: string) => Promise<Invoice>;
  onDuplicate: (invoiceId: string) => Promise<void>;
  onDeleteDraft?: (invoiceId: string) => Promise<void>;
  onDeleteInvoice?: (invoiceId: string) => Promise<void>;
  onPrint: (invoice: Invoice) => void;
  onDownloadPdf: (invoice: Invoice) => void;
}

export const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({
  invoices,
  customers,
  onViewInvoice,
  onEditDraft,
  onFinalize,
  onDuplicate,
  onDeleteDraft,
  onDeleteInvoice,
  onPrint,
  onDownloadPdf,
}) => {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'number'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Search term match (invoice number, customer name, GSTIN, DC number)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesNum = inv.invoice_number?.toLowerCase().includes(q);
        const matchesCust = inv.customer_snapshot.customer_name.toLowerCase().includes(q);
        const matchesGstin = inv.customer_snapshot.gstin?.toLowerCase().includes(q);
        const matchesDc = inv.dc_number?.toLowerCase().includes(q);
        if (!matchesNum && !matchesCust && !matchesGstin && !matchesDc) {
          return false;
        }
      }

      // 2. Customer filter
      if (customerFilter && inv.customer_id !== customerFilter) {
        return false;
      }

      // 3. Payment status filter
      if (paymentStatusFilter && inv.payment_status !== paymentStatusFilter) {
        return false;
      }

      // 4. Invoice status filter (DRAFT / FINALIZED)
      if (invoiceStatusFilter && inv.invoice_status !== invoiceStatusFilter) {
        return false;
      }

      // 5. Date range filter
      if (startDate && inv.invoice_date < startDate) {
        return false;
      }
      if (endDate && inv.invoice_date > endDate) {
        return false;
      }

      return true;
    });
  }, [
    invoices,
    searchTerm,
    customerFilter,
    paymentStatusFilter,
    invoiceStatusFilter,
    startDate,
    endDate,
  ]);

  // Sort logic
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      if (sortBy === 'date') {
        const cmp = a.invoice_date.localeCompare(b.invoice_date);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      if (sortBy === 'amount') {
        const diff = Number(a.grand_total) - Number(b.grand_total);
        return sortOrder === 'asc' ? diff : -diff;
      }
      if (sortBy === 'number') {
        const numA = a.invoice_number || '';
        const numB = b.invoice_number || '';
        const cmp = numA.localeCompare(numB);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
  }, [filteredInvoices, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / pageSize));
  const paginatedInvoices = sortedInvoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const resetFilters = () => {
    setSearchTerm('');
    setCustomerFilter('');
    setPaymentStatusFilter('');
    setInvoiceStatusFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#E8DFDC] rounded-lg p-4 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6C5D64]"
            />
            <input
              type="text"
              placeholder="Search by invoice #, customer, GSTIN, DC #..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-[#30252A] placeholder-[#6C5D64] focus:outline-none focus:border-[#702C3B]"
            />
          </div>

          {/* Customer Filter */}
          <div>
            <select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
            >
              <option value="">All Payment States</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          {/* Invoice Status Filter (Draft vs Finalized) */}
          <div>
            <select
              value={invoiceStatusFilter}
              onChange={(e) => {
                setInvoiceStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
            >
              <option value="">All Statuses (Draft &amp; Finalized)</option>
              <option value="FINALIZED">Finalized Invoices Only</option>
              <option value="DRAFT">Drafts Only</option>
            </select>
          </div>
        </div>

        {/* Date Filters & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E8DFDC] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#6C5D64] font-semibold text-[11px] flex items-center gap-1">
              <Calendar size={13} />
              Date Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-[11px]"
            />
            <span className="text-[#6C5D64] text-[11px]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-[11px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#6C5D64]">
              Found <strong className="text-[#30252A]">{sortedInvoices.length}</strong> records
            </span>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#FAF6F5] hover:bg-[#E8DFDC] text-[#6C5D64] text-[11px] font-medium transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Invoices Table */}
      <div className="bg-white border border-[#E8DFDC] rounded-lg shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF6F5] text-[#6C5D64] border-b border-[#E8DFDC]">
                <th
                  onClick={() => {
                    setSortBy('number');
                    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                  }}
                  className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider cursor-pointer hover:text-[#30252A]"
                >
                  <div className="flex items-center gap-1">
                    <span>Invoice #</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider">
                  Customer
                </th>
                <th
                  onClick={() => {
                    setSortBy('date');
                    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                  }}
                  className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider cursor-pointer hover:text-[#30252A]"
                >
                  <div className="flex items-center gap-1">
                    <span>Invoice Date</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider">
                  Due Date
                </th>
                <th
                  onClick={() => {
                    setSortBy('amount');
                    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                  }}
                  className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-right cursor-pointer hover:text-[#30252A]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Amount</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-right">
                  Paid
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-right">
                  Balance
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-center">
                  Payment
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-center">
                  Status
                </th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFDC]">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#6C5D64]">
                    No invoices matching the selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FAF6F5]/60 transition-colors">
                    {/* Invoice Number */}
                    <td className="py-2.5 px-3 font-mono font-bold text-[#30252A]">
                      {inv.invoice_number ? (
                        inv.invoice_number
                      ) : (
                        <span className="text-neutral-400 font-normal italic">Draft (Unallocated)</span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-2.5 px-3 font-medium text-[#30252A] max-w-[180px] truncate">
                      <div>{inv.customer_snapshot.customer_name || '—'}</div>
                      {inv.customer_snapshot.gstin && (
                        <span className="text-[10px] font-mono text-[#6C5D64]">
                          {inv.customer_snapshot.gstin}
                        </span>
                      )}
                    </td>

                    {/* Invoice Date */}
                    <td className="py-2.5 px-3 tabular-nums text-[#30252A]">
                      {inv.invoice_date}
                    </td>

                    {/* Due Date */}
                    <td className="py-2.5 px-3 tabular-nums text-[#6C5D64]">
                      {inv.due_date}
                    </td>

                    {/* Grand Total */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#30252A]">
                      ₹{Number(inv.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Amount Paid */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#1E7B54]">
                      ₹{Number(inv.amount_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Outstanding Balance */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#B8741A]">
                      ₹{Number(inv.outstanding_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Payment Status */}
                    <td className="py-2.5 px-3 text-center">
                      {inv.payment_status === 'PAID' ? (
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

                    {/* Invoice Status */}
                    <td className="py-2.5 px-3 text-center">
                      {inv.invoice_status === 'DRAFT' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F3EFEF] text-[#6C5D64] border border-[#E8DFDC]">
                          Draft
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EBF6F1] text-[#702C3B] border border-[#F195A5]">
                          Finalized
                        </span>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          title="View / Details"
                          className="p-1 rounded text-[#702C3B] hover:bg-[#FAF6F5] transition-colors"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => onPrint(inv)}
                          title="Print Grayscale A4"
                          className="p-1 rounded text-[#30252A] hover:bg-[#FAF6F5] transition-colors"
                        >
                          <Printer size={15} />
                        </button>

                        <button
                          onClick={() => onDownloadPdf(inv)}
                          title="Download PDF"
                          className="p-1 rounded text-[#30252A] hover:bg-[#FAF6F5] transition-colors"
                        >
                          <Download size={15} />
                        </button>

                        {inv.invoice_status === 'DRAFT' && (
                          <>
                            {onFinalize && (
                              <button
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to FINALIZE this invoice for ${inv.customer_snapshot.customer_name || 'Customer'}?\n\nAn official immutable bill number will be allocated immediately.`
                                    )
                                  ) {
                                    await onFinalize(inv.id);
                                  }
                                }}
                                title="Finalize & Allocate Official Bill No"
                                className="p-1 rounded text-[#702C3B] hover:bg-[#FAF6F5] transition-colors"
                              >
                                <CheckCircle size={15} className="text-[#702C3B]" />
                              </button>
                            )}
                            <button
                              onClick={() => onEditDraft(inv)}
                              title="Edit Draft"
                              className="p-1 rounded text-[#77592A] hover:bg-[#FAF6F5] transition-colors"
                            >
                              <Edit size={15} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => onDuplicate(inv.id)}
                          title="Duplicate into New Draft"
                          className="p-1 rounded text-[#6C5D64] hover:bg-[#FAF6F5] transition-colors"
                        >
                          <Copy size={15} />
                        </button>

                        {(onDeleteInvoice || onDeleteDraft) && (
                          <button
                            onClick={() => (onDeleteInvoice ? onDeleteInvoice(inv.id) : onDeleteDraft!(inv.id))}
                            title={inv.invoice_number ? `Delete ${inv.invoice_number}` : 'Delete Draft'}
                            className="p-1 rounded text-[#B82A3A] hover:bg-[#FAF6F5] transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#E8DFDC] bg-[#FAF6F5] flex items-center justify-between text-xs text-[#6C5D64]">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded bg-white border border-[#E8DFDC] disabled:opacity-40 hover:bg-[#FAF6F5]"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded bg-white border border-[#E8DFDC] disabled:opacity-40 hover:bg-[#FAF6F5]"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
