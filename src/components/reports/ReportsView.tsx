import React, { useState, useMemo } from 'react';
import { Invoice, Payment, Customer } from '../../types';
import { generateTaxSummary } from '../../utils/calculations';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  CreditCard,
  Building,
  FileSpreadsheet,
} from 'lucide-react';

interface ReportsViewProps {
  invoices: Invoice[];
  payments: Payment[];
  customers: Customer[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  payments,
  customers,
}) => {
  const [reportType, setReportType] = useState<
    'sales' | 'customer_summary' | 'tax_summary' | 'receivables'
  >('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter finalized invoices by date
  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      if (i.invoice_status !== 'FINALIZED') return false;
      if (startDate && i.invoice_date < startDate) return false;
      if (endDate && i.invoice_date > endDate) return false;
      return true;
    });
  }, [invoices, startDate, endDate]);

  // Aggregate metrics
  const totalSales = filteredInvoices.reduce((sum, i) => sum + Number(i.grand_total), 0);
  const totalTaxCollected = filteredInvoices.reduce((sum, i) => sum + Number(i.total_tax), 0);
  const totalOutstanding = filteredInvoices.reduce(
    (sum, i) => sum + Number(i.outstanding_balance),
    0
  );

  // Customer-wise aggregated sales
  const customerSales = useMemo(() => {
    const map: Record<
      string,
      { name: string; count: number; total: number; paid: number; outstanding: number }
    > = {};

    filteredInvoices.forEach((i) => {
      const name = i.customer_snapshot.customer_name || 'Cash Customer';
      if (!map[name]) {
        map[name] = { name, count: 0, total: 0, paid: 0, outstanding: 0 };
      }
      map[name].count += 1;
      map[name].total += Number(i.grand_total);
      map[name].paid += Number(i.amount_paid || 0);
      map[name].outstanding += Number(i.outstanding_balance || 0);
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredInvoices]);

  // Tax summary grouped by HSN code across all filtered invoices
  const aggregateTaxSummary = useMemo(() => {
    const allItems = filteredInvoices.flatMap((i) => i.items);
    return generateTaxSummary(allItems, false);
  }, [filteredInvoices]);

  // CSV Export with formula injection prevention (=, +, -, @ escaped)
  const exportCsv = () => {
    let rows: string[][] = [];
    let filename = `vks_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;

    const sanitizeCell = (val: string | number) => {
      let str = String(val ?? '');
      // Prevent spreadsheet formula injection by prefixing with a quote
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    if (reportType === 'sales') {
      rows.push([
        'Invoice Number',
        'Date',
        'Customer Name',
        'GSTIN',
        'Place of Supply',
        'Taxable Amount',
        'CGST',
        'SGST',
        'IGST',
        'Total Tax',
        'Grand Total',
        'Payment Status',
      ]);
      filteredInvoices.forEach((i) => {
        rows.push([
          i.invoice_number || '',
          i.invoice_date,
          i.customer_snapshot.customer_name,
          i.customer_snapshot.gstin || '',
          i.place_of_supply,
          Number(i.taxable_amount).toFixed(2),
          Number(i.cgst_total).toFixed(2),
          Number(i.sgst_total).toFixed(2),
          Number(i.igst_total).toFixed(2),
          Number(i.total_tax).toFixed(2),
          Number(i.grand_total).toFixed(2),
          i.payment_status,
        ]);
      });
    } else if (reportType === 'customer_summary') {
      rows.push(['Customer Name', 'Invoices Count', 'Total Billed', 'Amount Paid', 'Outstanding']);
      customerSales.forEach((c) => {
        rows.push([
          c.name,
          String(c.count),
          c.total.toFixed(2),
          c.paid.toFixed(2),
          c.outstanding.toFixed(2),
        ]);
      });
    } else if (reportType === 'tax_summary') {
      rows.push(['HSN/SAC', 'Tax Rate %', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total Tax']);
      aggregateTaxSummary.forEach((t) => {
        rows.push([
          t.hsn_sac,
          `${t.tax_rate}%`,
          t.taxable_amount.toFixed(2),
          t.cgst_amount.toFixed(2),
          t.sgst_amount.toFixed(2),
          t.igst_amount.toFixed(2),
          t.total_tax.toFixed(2),
        ]);
      });
    } else if (reportType === 'receivables') {
      rows.push(['Invoice Number', 'Customer Name', 'Due Date', 'Grand Total', 'Paid', 'Outstanding']);
      filteredInvoices
        .filter((i) => i.outstanding_balance > 0)
        .forEach((i) => {
          rows.push([
            i.invoice_number || '',
            i.customer_snapshot.customer_name,
            i.due_date,
            Number(i.grand_total).toFixed(2),
            Number(i.amount_paid || 0).toFixed(2),
            Number(i.outstanding_balance).toFixed(2),
          ]);
        });
    }

    const csvContent = rows.map((r) => r.map(sanitizeCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Export Bar */}
      <div className="bg-white border border-[#E8DFDC] rounded-lg p-4 shadow-subtle flex flex-wrap items-center justify-between gap-3">
        {/* Report Types Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setReportType('sales')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              reportType === 'sales'
                ? 'bg-[#702C3B] text-white shadow-xs'
                : 'bg-[#FAF6F5] text-[#30252A] hover:bg-[#E8DFDC]'
            }`}
          >
            Sales Register
          </button>
          <button
            onClick={() => setReportType('customer_summary')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              reportType === 'customer_summary'
                ? 'bg-[#702C3B] text-white shadow-xs'
                : 'bg-[#FAF6F5] text-[#30252A] hover:bg-[#E8DFDC]'
            }`}
          >
            Customer Summary
          </button>
          <button
            onClick={() => setReportType('tax_summary')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              reportType === 'tax_summary'
                ? 'bg-[#702C3B] text-white shadow-xs'
                : 'bg-[#FAF6F5] text-[#30252A] hover:bg-[#E8DFDC]'
            }`}
          >
            GST Tax Report
          </button>
          <button
            onClick={() => setReportType('receivables')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              reportType === 'receivables'
                ? 'bg-[#702C3B] text-white shadow-xs'
                : 'bg-[#FAF6F5] text-[#30252A] hover:bg-[#E8DFDC]'
            }`}
          >
            Outstanding Receivables
          </button>
        </div>

        {/* Date Filters & CSV Export */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-[#6C5D64]" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-xs"
            />
            <span className="text-[#6C5D64]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-xs"
            />
          </div>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F5] hover:bg-[#E8DFDC] text-[#702C3B] border border-[#702C3B] rounded text-xs font-semibold transition-all"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Header Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8DFDC] rounded-lg p-4 shadow-subtle">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6C5D64] block">
            Filtered Sales Turnover
          </span>
          <div className="text-xl font-bold font-mono text-[#30252A] mt-1 tabular-nums">
            ₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#6C5D64] mt-0.5 block">
            Across {filteredInvoices.length} finalized invoices
          </span>
        </div>

        <div className="bg-white border border-[#E8DFDC] rounded-lg p-4 shadow-subtle">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6C5D64] block">
            GST Tax Amount
          </span>
          <div className="text-xl font-bold font-mono text-[#1E7B54] mt-1 tabular-nums">
            ₹{totalTaxCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#6C5D64] mt-0.5 block">
            Total CGST, SGST &amp; IGST
          </span>
        </div>

        <div className="bg-white border border-[#E8DFDC] rounded-lg p-4 shadow-subtle">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6C5D64] block">
            Current Outstanding Balance
          </span>
          <div className="text-xl font-bold font-mono text-[#B8741A] mt-1 tabular-nums">
            ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#6C5D64] mt-0.5 block">
            Pending receivable collection
          </span>
        </div>
      </div>

      {/* Report Data Table */}
      <div className="bg-white border border-[#E8DFDC] rounded-lg shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'sales' && (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F5] text-[#6C5D64] border-b border-[#E8DFDC]">
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Invoice #</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Date</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Customer</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Taxable</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">CGST</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">SGST</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">IGST</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Grand Total</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFDC]">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FAF6F5]/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#702C3B]">
                      {inv.invoice_number}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">{inv.invoice_date}</td>
                    <td className="py-2.5 px-3 font-medium text-[#30252A]">
                      {inv.customer_snapshot.customer_name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      ₹{Number(inv.taxable_amount).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      ₹{Number(inv.cgst_total).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      ₹{Number(inv.sgst_total).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      ₹{Number(inv.igst_total).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#30252A]">
                      ₹{Number(inv.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EBF6F1] text-[#1E7B54]">
                        {inv.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'customer_summary' && (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F5] text-[#6C5D64] border-b border-[#E8DFDC]">
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Customer Name</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-center">Total Bills</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Total Billed</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Amount Paid</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFDC]">
                {customerSales.map((c, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF6F5]/50">
                    <td className="py-2.5 px-3 font-bold text-[#30252A]">{c.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{c.count}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#30252A]">
                      ₹{c.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#1E7B54]">
                      ₹{c.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#B8741A]">
                      ₹{c.outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'tax_summary' && (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F5] text-[#6C5D64] border-b border-[#E8DFDC]">
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">HSN/SAC Code</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-center">GST Rate %</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Taxable Turnover</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">CGST</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">SGST</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">IGST</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Total Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFDC]">
                {aggregateTaxSummary.map((t, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF6F5]/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#30252A]">{t.hsn_sac}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{t.tax_rate}%</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                      ₹{t.taxable_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      ₹{t.cgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      ₹{t.sgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      ₹{t.igst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#1E7B54]">
                      ₹{t.total_tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'receivables' && (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F5] text-[#6C5D64] border-b border-[#E8DFDC]">
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Invoice #</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Customer</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Due Date</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Total Billed</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Paid</th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFDC]">
                {filteredInvoices
                  .filter((i) => i.outstanding_balance > 0)
                  .map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#FAF6F5]/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#702C3B]">
                        {inv.invoice_number}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#30252A]">
                        {inv.customer_snapshot.customer_name}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-[#B82A3A] font-medium">
                        {inv.due_date}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        ₹{Number(inv.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#1E7B54]">
                        ₹{Number(inv.amount_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#B8741A]">
                        ₹{Number(inv.outstanding_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
