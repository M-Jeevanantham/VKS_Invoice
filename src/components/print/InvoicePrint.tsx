import React from 'react';
import { Invoice, BusinessSettings } from '../../types';
import { generateTaxSummary } from '../../utils/calculations';

interface InvoicePrintProps {
  invoice: Invoice;
  settings?: BusinessSettings;
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({ invoice, settings }) => {
  const bSnap = invoice.business_snapshot;
  const cSnap = invoice.customer_snapshot;
  const tSnap = invoice.terms_snapshot;
  const bankSnap = invoice.bank_snapshot;

  const isInterstate = invoice.is_interstate;
  const taxSummary = generateTaxSummary(invoice.items, isInterstate);

  // Logo preference
  const showLogo = settings?.show_logo_on_print ?? true;
  const showMurugan = settings?.show_murugan_on_print ?? true;
  const logoUrl = bSnap.logo_url || '/vks-logo.png';
  const muruganUrl = bSnap.murugan_image_url || '';

  // Signature: only display if uploaded image exists. If not, strictly blank for manual signing.
  const signatureUrl = bSnap.signature_url || '';

  // Total Quantity calculation
  const totalQuantity = invoice.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  return (
    <div
      id="invoice-print-root"
      className="w-full bg-white text-black font-sans text-[11px] leading-normal selection:bg-neutral-200"
      style={{
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '8mm',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Outer Border wrapping traditional invoice layout */}
      <div className="border border-black w-full" style={{ boxSizing: 'border-box' }}>

        {/* ------------------------------------------------------------- */}
        {/* 1. TOP HEADER: Centered TAX INVOICE Header                    */}
        {/* ------------------------------------------------------------- */}
        <div className="border-b border-black text-center py-1 bg-neutral-100 font-bold tracking-wider text-xs uppercase">
          TAX INVOICE
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. BUSINESS BRANDING, LOGO, MURUGAN IMAGE & CONTACT           */}
        {/* ------------------------------------------------------------- */}
        <div className="border-b border-black pl-2 pr-3 py-2.5 flex items-center justify-between gap-3">
          {/* Left Column: Big VKS Logo with Lord Murugan positioned on top-left of VKS */}
          <div className="relative w-[280px] flex-shrink-0 flex items-center justify-start pt-2 pb-1">
            {/* Lord Murugan in marked top-left spot */}
            {showMurugan && muruganUrl && (
              <div className="absolute top-0 left-1 z-10 pointer-events-none">
                <img
                  src={muruganUrl}
                  alt="Lord Murugan"
                  className="h-18 w-auto max-w-[80px] object-contain filter grayscale"
                />
              </div>
            )}

            {/* BIG VKS Logo (Shifted a little left and enlarged) */}
            {showLogo && logoUrl ? (
              <img
                src={logoUrl}
                alt="VKS Logo"
                className="w-full h-auto max-h-36 object-contain filter grayscale"
              />
            ) : (
              <div className="w-56 h-24 border border-dashed border-neutral-400 flex items-center justify-center text-xs text-neutral-500 font-medium">
                V.K.S.
              </div>
            )}
          </div>

          {/* Right Column: Business Name and Details as a column */}
          <div className="flex-1 min-w-0 text-center px-2 flex flex-col items-center justify-center">
            <h1 className="text-[28px] font-black tracking-normal uppercase font-serif text-black leading-tight whitespace-nowrap">
              {bSnap.business_name || 'V.K.S. WEAVING CENTRE'}
            </h1>
            {bSnap.tagline && (
              <p className="text-xs text-neutral-800 italic font-semibold mt-1 leading-snug">
                {bSnap.tagline}
              </p>
            )}
            <p className="text-[10.5px] text-neutral-800 mt-1 leading-snug">
              {bSnap.address_line1}{bSnap.address_line2 ? `, ${bSnap.address_line2}` : ''}, {bSnap.city} - {bSnap.postal_code}, {bSnap.state}
            </p>
            <p className="text-[10.5px] text-neutral-800 mt-0.5 leading-snug">
              <span className="font-semibold">Phone:</span> {bSnap.phone_primary} {bSnap.phone_secondary ? ` / ${bSnap.phone_secondary}` : ''}
            </p>
            <div className="mt-2 mb-0.5 inline-flex items-center justify-center px-3 py-1 bg-neutral-100 border border-black font-bold text-[11px] tracking-wide rounded-sm">
              <span>GSTIN: {bSnap.gstin}</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. TWO-COLUMN: BILL TO / SHIP TO & INVOICE / TRANSPORT        */}
        {/* ------------------------------------------------------------- */}
        <table className="w-full border-b border-black border-collapse" style={{ borderBottom: '1px solid #000000', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              {/* Left Column: Details of Receiver (Billed To) */}
              <td className="p-3 align-top" style={{ width: '50%', borderRight: '1px solid #000000', verticalAlign: 'top' }}>
                <div
                  className="font-bold text-[10px] uppercase px-2 py-1 mb-2 w-full"
                  style={{ backgroundColor: '#f0f0f0', border: '1px solid #d4d4d4', letterSpacing: '0.05em' }}
                >
                  Details of Receiver | Billed To:
                </div>
                <p className="font-bold text-[12px] text-black uppercase" style={{ lineHeight: '1.3', marginBottom: '4px' }}>
                  {cSnap.customer_name || 'Cash Customer'}
                </p>
                {cSnap.contact_person && (
                  <p className="text-[10px] text-neutral-700" style={{ marginBottom: '2px' }}>Attn: {cSnap.contact_person}</p>
                )}
                <p className="text-[10px] whitespace-pre-line text-neutral-900" style={{ lineHeight: '1.4', marginBottom: '4px' }}>
                  {cSnap.billing_address}
                </p>
                <p className="text-[10px] text-neutral-900" style={{ lineHeight: '1.4', marginBottom: '6px' }}>
                  {cSnap.city}, {cSnap.state} - {cSnap.postal_code}
                </p>
                <p className="text-[10px]" style={{ marginBottom: '6px' }}>
                  <span className="font-semibold text-neutral-700">Phone:</span> {cSnap.phone}
                </p>
                <table className="w-full text-[10px]" style={{ borderCollapse: 'collapse', borderTop: '1px solid #e0e0e0', marginTop: '6px', paddingTop: '6px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', padding: '4px 2px 2px 0' }}><span className="font-semibold">GSTIN:</span> {cSnap.gstin || 'URP'}</td>
                      <td style={{ width: '50%', padding: '4px 0 2px 2px' }}><span className="font-semibold">State Code:</span> {cSnap.state_code || '33'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>

              {/* Right Column: Invoice Details & Transportation */}
              <td className="p-3 align-top" style={{ width: '50%', verticalAlign: 'top' }}>
                <div
                  className="font-bold text-[10px] uppercase px-2 py-1 mb-2 w-full"
                  style={{ backgroundColor: '#f0f0f0', border: '1px solid #d4d4d4', letterSpacing: '0.05em' }}
                >
                  Invoice Details :
                </div>
                <table className="w-full text-[10px]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', padding: '4px 4px 4px 0', verticalAlign: 'top', lineHeight: '1.4' }}>
                        <span className="font-semibold text-neutral-700">Invoice No:</span>{' '}
                        <span className="font-bold text-[11px] text-black">
                          {invoice.invoice_number}
                        </span>
                      </td>
                      <td style={{ width: '50%', padding: '4px 0 4px 4px', verticalAlign: 'top', lineHeight: '1.4' }}>
                        <span className="font-semibold text-neutral-700">Dated:</span>{' '}
                        <span className="font-bold text-black">{invoice.invoice_date}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ width: '50%', padding: '4px 4px 4px 0', verticalAlign: 'top', lineHeight: '1.4' }}>
                        <span className="font-semibold text-neutral-700">D.C. No:</span>{' '}
                        <span className="font-medium">{invoice.dc_number || '—'}</span>
                      </td>
                      <td style={{ width: '50%', padding: '4px 0 4px 4px', verticalAlign: 'top', lineHeight: '1.4' }}>
                        <span className="font-semibold text-neutral-700">Payment Due:</span>{' '}
                        <span className="font-medium">{invoice.due_date}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ padding: '4px 0', verticalAlign: 'top', lineHeight: '1.4' }}>
                        <span className="font-semibold text-neutral-700">Place of Supply:</span>{' '}
                        <span className="font-medium">{invoice.place_of_supply}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Transport details */}
                <table className="w-full text-[10px]" style={{ borderCollapse: 'collapse', borderTop: '1px solid #e0e0e0', marginTop: '6px', paddingTop: '6px', tableLayout: 'fixed' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', padding: '4px 4px 2px 0', verticalAlign: 'top', lineHeight: '1.4' }}>
                        <span className="font-semibold text-neutral-700">Transport:</span>{' '}
                        <span>{invoice.transport_name || 'Self / Local'}</span>
                      </td>
                      <td style={{ width: '50%', padding: '4px 0 2px 4px', verticalAlign: 'top', lineHeight: '1.4' }}>
                        <span className="font-semibold text-neutral-700">Vehicle No:</span>{' '}
                        <span>{invoice.vehicle_number || '—'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ width: '50%', padding: '2px 4px 2px 0', verticalAlign: 'top', lineHeight: '1.4' }}>
                        <span className="font-semibold text-neutral-700">L.R. No:</span>{' '}
                        <span>{invoice.lr_number || '—'}</span>
                      </td>
                      <td style={{ width: '50%', padding: '2px 0 2px 4px', verticalAlign: 'top', lineHeight: '1.4' }}>
                        <span className="font-semibold text-neutral-700">L.R. Date:</span>{' '}
                        <span>{invoice.transport_date || '—'}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Shipped To (if distinct from Billing) */}
        {cSnap.shipping_address && cSnap.shipping_address !== cSnap.billing_address && (
          <div className="border-b border-black px-2 py-1 bg-neutral-50 text-[10px] flex items-start gap-2">
            <span className="font-bold uppercase flex-shrink-0">Shipped To (Delivery Place):</span>
            <span>
              {cSnap.shipping_name ? `${cSnap.shipping_name}, ` : ''}
              {cSnap.shipping_address}
            </span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. FULL-WIDTH ITEM TABLE                                      */}
        {/* ------------------------------------------------------------- */}
        <div className="flex-1 w-full border-b border-black">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-neutral-100 border-b border-black text-black">
                <th className="border-r border-black py-1 px-1 w-8 text-center font-bold">S.No</th>
                <th className="border-r border-black py-1 px-2 text-left font-bold">Description of Goods</th>
                <th className="border-r border-black py-1 px-1 w-16 text-center font-bold">HSN/SAC</th>
                <th className="border-r border-black py-1 px-1 w-20 text-right font-bold">Qty / Wt</th>
                <th className="border-r border-black py-1 px-1 w-14 text-center font-bold">Unit</th>
                <th className="border-r border-black py-1 px-1 w-20 text-right font-bold">Rate (₹)</th>
                <th className="border-r border-black py-1 px-1 w-16 text-center font-bold">Tax %</th>
                <th className="py-1 px-2 w-24 text-right font-bold">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, idx) => (
                <tr key={it.id || idx} className="border-b border-neutral-300 align-top">
                  <td className="border-r border-black py-1.5 px-1 text-center font-medium">
                    {idx + 1}
                  </td>
                  <td className="border-r border-black py-1.5 px-2 font-semibold text-black">
                    {it.item_name}
                  </td>
                  <td className="border-r border-black py-1.5 px-1 text-center">
                    {it.hsn_sac}
                  </td>
                  <td className="border-r border-black py-1.5 px-1 text-right font-medium tabular-nums">
                    {Number(it.quantity).toFixed(2)}
                  </td>
                  <td className="border-r border-black py-1.5 px-1 text-center">
                    {it.unit}
                  </td>
                  <td className="border-r border-black py-1.5 px-1 text-right tabular-nums">
                    {Number(it.unit_price).toFixed(2)}
                  </td>
                  <td className="border-r border-black py-1.5 px-1 text-center tabular-nums">
                    {it.tax_rate}%
                  </td>
                  <td className="py-1.5 px-2 text-right font-semibold tabular-nums text-black">
                    {Number(it.line_total).toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Minimal spacer rows if items list is short to maintain invoice structure */}
              {invoice.items.length < 5 && (
                Array.from({ length: 5 - invoice.items.length }).map((_, i) => (
                  <tr key={`pad-${i}`} className="border-b border-neutral-200 h-6">
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td className="border-r border-black">&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))
              )}

              {/* Total Qty and Item Row */}
              <tr className="bg-neutral-100 font-bold border-t border-black text-black">
                <td colSpan={3} className="border-r border-black py-1 px-2 text-right uppercase">
                  Total Quantity:
                </td>
                <td className="border-r border-black py-1 px-1 text-right tabular-nums">
                  {totalQuantity.toFixed(2)}
                </td>
                <td colSpan={3} className="border-r border-black py-1 px-1 text-right uppercase">
                  Items Subtotal:
                </td>
                <td className="py-1 px-2 text-right tabular-nums text-black">
                  ₹{Number(invoice.subtotal).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 5. TAX SUMMARY (LEFT) & FINANCIAL TOTALS (RIGHT)              */}
        {/* ------------------------------------------------------------- */}
        <table className="w-full border-b border-black border-collapse">
          <tbody>
            <tr>
              {/* Tax Summary Table (Left 58%) */}
              <td className="border-r border-black p-2.5 w-[58%] align-top">
                <div className="font-bold text-[10px] uppercase tracking-wide bg-neutral-100 px-2 py-1 border border-black mb-1.5">
                  GST Tax Summary Breakdown:
                </div>
                <table className="w-full border border-black text-[9.5px] border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-black text-black">
                      <th className="border-r border-black py-1.5 px-1.5 text-center font-bold">HSN/SAC</th>
                      <th className="border-r border-black py-1.5 px-1.5 text-right font-bold">Taxable Val</th>
                      {!isInterstate ? (
                        <>
                          <th className="border-r border-black py-1.5 px-1 text-center font-bold">CGST %</th>
                          <th className="border-r border-black py-1.5 px-1.5 text-right font-bold">CGST Amt</th>
                          <th className="border-r border-black py-1.5 px-1 text-center font-bold">SGST %</th>
                          <th className="border-r border-black py-1.5 px-1.5 text-right font-bold">SGST Amt</th>
                        </>
                      ) : (
                        <>
                          <th className="border-r border-black py-1.5 px-1.5 text-center font-bold">IGST %</th>
                          <th className="border-r border-black py-1.5 px-1.5 text-right font-bold">IGST Amt</th>
                        </>
                      )}
                      <th className="py-1.5 px-1.5 text-right font-bold">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxSummary.map((ts, idx) => (
                      <tr key={idx} className="border-b border-neutral-300">
                        <td className="border-r border-black py-1.5 px-1.5 text-center font-medium font-mono">{ts.hsn_sac}</td>
                        <td className="border-r border-black py-1.5 px-1.5 text-right tabular-nums">{ts.taxable_amount.toFixed(2)}</td>
                        {!isInterstate ? (
                          <>
                            <td className="border-r border-black py-1.5 px-1 text-center tabular-nums">{(ts.tax_rate / 2).toFixed(1)}%</td>
                            <td className="border-r border-black py-1.5 px-1.5 text-right tabular-nums">{ts.cgst_amount.toFixed(2)}</td>
                            <td className="border-r border-black py-1.5 px-1 text-center tabular-nums">{(ts.tax_rate / 2).toFixed(1)}%</td>
                            <td className="border-r border-black py-1.5 px-1.5 text-right tabular-nums">{ts.sgst_amount.toFixed(2)}</td>
                          </>
                        ) : (
                          <>
                            <td className="border-r border-black py-1.5 px-1.5 text-center tabular-nums">{ts.tax_rate.toFixed(1)}%</td>
                            <td className="border-r border-black py-1.5 px-1.5 text-right tabular-nums">{ts.igst_amount.toFixed(2)}</td>
                          </>
                        )}
                        <td className="py-1.5 px-1.5 text-right font-medium tabular-nums">{ts.total_tax.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-neutral-100 font-bold border-t border-black text-black">
                      <td className="border-r border-black py-1.5 px-1.5 text-center uppercase">Total</td>
                      <td className="border-r border-black py-1.5 px-1.5 text-right tabular-nums">{invoice.taxable_amount.toFixed(2)}</td>
                      {!isInterstate ? (
                        <>
                          <td className="border-r border-black py-1.5 px-1 text-center">—</td>
                          <td className="border-r border-black py-1.5 px-1.5 text-right tabular-nums">{invoice.cgst_total.toFixed(2)}</td>
                          <td className="border-r border-black py-1.5 px-1 text-center">—</td>
                          <td className="border-r border-black py-1.5 px-1.5 text-right tabular-nums">{invoice.sgst_total.toFixed(2)}</td>
                        </>
                      ) : (
                        <>
                          <td className="border-r border-black py-1.5 px-1.5 text-center">—</td>
                          <td className="border-r border-black py-1.5 px-1.5 text-right tabular-nums">{invoice.igst_total.toFixed(2)}</td>
                        </>
                      )}
                      <td className="py-1.5 px-1.5 text-right tabular-nums">{invoice.total_tax.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Amount In Words on left bottom */}
                <div className="mt-3 pt-2 border-t border-black">
                  <span className="font-bold text-[9.5px] uppercase text-neutral-800">Invoice Amount in Words:</span>
                  <p className="font-bold text-[10.5px] text-black italic leading-tight mt-0.5">
                    {invoice.amount_in_words}
                  </p>
                </div>
              </td>

              {/* Totals & Calculations (Right 42%) */}
              <td className="p-2.5 w-[42%] align-top text-[10.5px]">
                <div className="space-y-1">
                  <div className="flex justify-between py-1 border-b border-neutral-300">
                    <span className="text-neutral-800 font-medium">Taxable Subtotal:</span>
                    <span className="font-bold tabular-nums text-black">₹{Number(invoice.taxable_amount).toFixed(2)}</span>
                  </div>

                  {!isInterstate ? (
                    <>
                      <div className="flex justify-between py-1 border-b border-neutral-300">
                        <span className="text-neutral-700">CGST Amount:</span>
                        <span className="tabular-nums font-medium">₹{Number(invoice.cgst_total).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-300">
                        <span className="text-neutral-700">SGST Amount:</span>
                        <span className="tabular-nums font-medium">₹{Number(invoice.sgst_total).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between py-1 border-b border-neutral-300">
                      <span className="text-neutral-700">IGST Amount:</span>
                      <span className="tabular-nums font-medium">₹{Number(invoice.igst_total).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-1 border-b border-neutral-300">
                    <span className="text-neutral-700">Total Tax Amount:</span>
                    <span className="font-bold tabular-nums text-black">₹{Number(invoice.total_tax).toFixed(2)}</span>
                  </div>

                  {invoice.discount_total > 0 && (
                    <div className="flex justify-between py-1 border-b border-neutral-300 text-neutral-700">
                      <span>Total Discount:</span>
                      <span className="tabular-nums text-red-700">- ₹{Number(invoice.discount_total).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-1 border-b border-neutral-300">
                    <span className="text-neutral-700">Round Off:</span>
                    <span className="tabular-nums font-medium">{invoice.round_off >= 0 ? `+₹${invoice.round_off.toFixed(2)}` : `-₹${Math.abs(invoice.round_off).toFixed(2)}`}</span>
                  </div>
                </div>

                {/* Grand Total Box */}
                <div className="mt-3 p-2 bg-neutral-100 border border-black flex justify-between items-center">
                  <span className="font-bold text-xs uppercase tracking-wider text-black">Grand Total:</span>
                  <span className="font-bold text-base tracking-tight tabular-nums text-black">
                    ₹{Number(invoice.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ------------------------------------------------------------- */}
        {/* ------------------------------------------------------------- */}
        {/* 6. TERMS & CONDITIONS (LEFT) AND BANK DETAILS (RIGHT)         */}
        {/* ------------------------------------------------------------- */}
        <table className="w-full border-b border-black border-collapse" style={{ tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              {/* Left Column: Terms & Conditions (50%) */}
              <td className="p-3 align-top border-r border-black" style={{ width: '50%', verticalAlign: 'top' }}>
                <div className="font-bold text-xs uppercase tracking-wider mb-1.5 text-black border-b border-neutral-300 pb-0.5">
                  Terms &amp; Conditions:
                </div>
                <ol className="text-[10px] leading-relaxed text-black font-normal space-y-1 list-none">
                  <li>{tSnap.term_1 || '1. Interest will be charged @ 24% on bill, if payment not received within 30 days.'}</li>
                  <li>{tSnap.term_2 || '2.We are not responsible for any loss or damage in transit'}</li>
                  <li>{tSnap.term_3 || '3. Goods once sold cannot be taken back under any circumstances.'}</li>
                  <li>{tSnap.term_4 || '4. All disputes subject to SALEM Jurisdiction'}</li>
                </ol>
              </td>

              {/* Right Column: Bank Remittance Details (50%) */}
              <td className="p-3 align-top bg-neutral-50" style={{ width: '50%', verticalAlign: 'top' }}>
                <div className="font-bold text-xs uppercase tracking-wider mb-1.5 text-black border-b border-neutral-300 pb-0.5">
                  Bank Remittance Details:
                </div>
                <div className="text-[11px] space-y-1 text-black">
                  <div>
                    <span className="text-neutral-700 font-semibold">Bank Name: </span>
                    <strong className="font-bold text-black text-[11.5px]">{bankSnap.bank_name || 'State Bank of India'}</strong>
                    {bankSnap.bank_branch && (
                      <span className="text-neutral-700"> ({bankSnap.bank_branch})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-neutral-700 font-semibold">Account Name: </span>
                    <strong className="font-bold text-black text-[11.5px]">{bankSnap.account_holder_name || 'V.K.S. WEAVING CENTRE'}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-700 font-semibold">A/C Number: </span>
                    <strong className="font-mono font-black text-xs tracking-wider text-black">{bankSnap.account_number}</strong>
                    {bankSnap.account_type && (
                      <span className="text-neutral-700 font-normal"> ({bankSnap.account_type})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-neutral-700 font-semibold">RTGS / NEFT / IFSC: </span>
                    <strong className="font-mono font-black text-xs tracking-wider text-black">{bankSnap.ifsc_code}</strong>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ------------------------------------------------------------- */}
        {/* 8. DUAL SIGNATURE & SEAL BOXES (CUSTOMER + AUTHORIZED)        */}
        {/* ------------------------------------------------------------- */}
        <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              {/* Customer Signature & Seal on Left */}
              <td style={{ width: '50%', borderRight: '1px solid #000000', padding: '12px', verticalAlign: 'top', textAlign: 'center' }}>
                <p className="font-bold text-[10px] uppercase tracking-wider text-black" style={{ marginBottom: '8px' }}>
                  Customer's Signature &amp; Seal / Acknowledgement
                </p>

                {/* Box for physical rubber stamp / seal & customer signature */}
                <div
                  className="w-full flex items-center justify-center rounded"
                  style={{ height: '64px', margin: '8px 0', border: '1px dashed #999999', backgroundColor: '#fcfcfc' }}
                >
                  <span className="text-[9px] text-neutral-500 italic">
                    (Affix Customer Rubber Stamp / Seal &amp; Sign)
                  </span>
                </div>

                <div className="w-60 mx-auto" style={{ borderTop: '1px solid #000000', paddingTop: '4px', marginTop: '12px' }}>
                  <span className="font-bold text-[9.5px] uppercase tracking-wide text-black block">
                    Customer's Authorized Signatory &amp; Seal
                  </span>
                </div>
              </td>

              {/* Authorized Signatory on Right */}
              <td style={{ width: '50%', padding: '12px', verticalAlign: 'top', textAlign: 'center' }}>
                <p className="font-bold text-[10px] uppercase tracking-wider text-black" style={{ marginBottom: '8px' }}>
                  For {bSnap.business_name || 'V.K.S. WEAVING CENTRE'}
                </p>

                {/* Signature Area */}
                <div className="w-full flex items-center justify-center" style={{ height: '64px', margin: '8px 0' }}>
                  {signatureUrl ? (
                    <img
                      src={signatureUrl}
                      alt="Authorized Signature"
                      className="max-h-14 max-w-[180px] object-contain filter grayscale"
                    />
                  ) : (
                    /* Pure blank signing space for physical manual pen signature */
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="text-[9px] text-neutral-400 italic">
                        (Authorized Signatory Manual Signature &amp; Stamp)
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-60 mx-auto" style={{ borderTop: '1px solid #000000', paddingTop: '4px', marginTop: '12px' }}>
                  <span className="font-bold text-[9.5px] uppercase tracking-wide text-black block">
                    Proprietor / Authorized Signatory
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ------------------------------------------------------------- */}
        {/* 8. OPTIONAL E-INVOICE SECTION (SECTION 22)                    */}
        {/* ------------------------------------------------------------- */}
        {invoice.irn && (
          <div className="border-t border-black p-1.5 bg-neutral-50 text-[9px] flex items-center justify-between">
            <div className="space-y-0.5">
              <p><span className="font-bold">IRN:</span> {invoice.irn}</p>
              <p><span className="font-bold">Ack No:</span> {invoice.ack_number || '—'} | <span className="font-bold">Ack Date:</span> {invoice.ack_date || '—'}</p>
            </div>
            {invoice.einvoice_qr_data && (
              <div className="text-right text-[8px] text-neutral-600">
                Official E-Invoice Recorded
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
