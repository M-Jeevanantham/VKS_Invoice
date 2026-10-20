// ==============================================================================
// V.K.S. WEAVING CENTRE — FINANCIAL CALCULATIONS ENGINE
// Decimal-safe monetary arithmetic, intra/inter-state GST, HSN groupings,
// round-off calculation, and Indian Rupees Words conversion.
// ==============================================================================

import { InvoiceItem, TaxSummaryEntry } from '../types';

/**
 * Decimal-safe rounding to 2 decimal places using epsilon technique
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates a single invoice line item:
 * - Gross amount = quantity * unit_price
 * - Taxable amount = max(0, gross - discount)
 * - Intra-state (CGST + SGST = total tax rate / 2 each)
 * - Inter-state (IGST = total tax rate, CGST = 0, SGST = 0)
 * - Line total = Taxable amount + CGST + SGST + IGST
 */
export function calculateLineItem(
  item: Omit<InvoiceItem, 'taxable_amount' | 'cgst_amount' | 'sgst_amount' | 'igst_amount' | 'line_total'>,
  isInterstate: boolean
): InvoiceItem {
  const quantity = Math.max(0, Number(item.quantity) || 0);
  const unitPrice = Math.max(0, Number(item.unit_price) || 0);
  const discount = Math.max(0, Number(item.discount_amount) || 0);
  const taxRate = Math.max(0, Number(item.tax_rate) || 0);

  const grossAmount = round2(quantity * unitPrice);
  const taxableAmount = round2(Math.max(0, grossAmount - discount));

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (taxRate > 0 && taxableAmount > 0) {
    if (isInterstate) {
      igstAmount = round2((taxableAmount * taxRate) / 100);
    } else {
      const halfRate = taxRate / 2;
      cgstAmount = round2((taxableAmount * halfRate) / 100);
      sgstAmount = round2((taxableAmount * halfRate) / 100);
    }
  }

  const lineTotal = round2(taxableAmount + cgstAmount + sgstAmount + igstAmount);

  return {
    ...item,
    quantity,
    unit_price: unitPrice,
    discount_amount: discount,
    tax_rate: taxRate,
    taxable_amount: taxableAmount,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    line_total: lineTotal,
  };
}

export interface InvoiceCalculatedTotals {
  subtotal: number;
  discount_total: number;
  taxable_amount: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  total_tax: number;
  round_off: number;
  grand_total: number;
  amount_in_words: string;
  calculatedItems: InvoiceItem[];
}

/**
 * Calculates complete invoice totals from items and interstate flag.
 * Recalculates every item on the server/trusted operation so client edits
 * can never tamper with tax or total accuracy.
 */
export function calculateInvoiceTotals(
  items: Array<Partial<InvoiceItem>>,
  isInterstate: boolean
): InvoiceCalculatedTotals {
  let subtotal = 0;
  let discount_total = 0;
  let taxable_amount = 0;
  let cgst_total = 0;
  let sgst_total = 0;
  let igst_total = 0;

  const calculatedItems: InvoiceItem[] = items.map((raw, idx) => {
    const itemToCalc = {
      id: raw.id || `item-${idx + 1}`,
      serial_number: idx + 1,
      item_name: raw.item_name || '',
      hsn_sac: raw.hsn_sac || '5407',
      details: raw.details || '',
      quantity: Number(raw.quantity) || 0,
      unit: raw.unit || 'KG',
      unit_price: Number(raw.unit_price) || 0,
      discount_amount: Number(raw.discount_amount) || 0,
      tax_rate: Number(raw.tax_rate) !== undefined ? Number(raw.tax_rate) : 5,
    };

    const calculated = calculateLineItem(itemToCalc, isInterstate);

    subtotal = round2(subtotal + (calculated.quantity * calculated.unit_price));
    discount_total = round2(discount_total + calculated.discount_amount);
    taxable_amount = round2(taxable_amount + calculated.taxable_amount);
    cgst_total = round2(cgst_total + calculated.cgst_amount);
    sgst_total = round2(sgst_total + calculated.sgst_amount);
    igst_total = round2(igst_total + calculated.igst_amount);

    return calculated;
  });

  const total_tax = round2(cgst_total + sgst_total + igst_total);
  const unroundedTotal = round2(taxable_amount + total_tax);

  // Standard Indian commercial invoicing round-off to nearest whole Rupee
  const roundedGrandTotal = Math.round(unroundedTotal);
  const round_off = round2(roundedGrandTotal - unroundedTotal);
  const grand_total = roundedGrandTotal;

  const amount_in_words = numberToIndianRupeesWords(grand_total);

  return {
    subtotal,
    discount_total,
    taxable_amount,
    cgst_total,
    sgst_total,
    igst_total,
    total_tax,
    round_off,
    grand_total,
    amount_in_words,
    calculatedItems,
  };
}

/**
 * Groups taxable amounts and tax values by HSN/SAC and Tax Rate.
 * Essential for GST Compliance and Section 9 requirement.
 */
export function generateTaxSummary(
  items: InvoiceItem[],
  isInterstate: boolean
): TaxSummaryEntry[] {
  const groups: { [key: string]: TaxSummaryEntry } = {};

  items.forEach((item) => {
    const key = `${item.hsn_sac}_${item.tax_rate}`;
    if (!groups[key]) {
      groups[key] = {
        hsn_sac: item.hsn_sac,
        tax_rate: item.tax_rate,
        taxable_amount: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
        total_tax: 0,
      };
    }

    groups[key].taxable_amount = round2(groups[key].taxable_amount + item.taxable_amount);
    groups[key].cgst_amount = round2(groups[key].cgst_amount + item.cgst_amount);
    groups[key].sgst_amount = round2(groups[key].sgst_amount + item.sgst_amount);
    groups[key].igst_amount = round2(groups[key].igst_amount + item.igst_amount);
    groups[key].total_tax = round2(
      groups[key].total_tax + (isInterstate ? item.igst_amount : (item.cgst_amount + item.sgst_amount))
    );
  });

  return Object.values(groups).sort((a, b) => a.hsn_sac.localeCompare(b.hsn_sac));
}

/**
 * Converts numbers into Indian Currency Words (e.g. "INR Thirteen Thousand One Hundred Twenty Five Only")
 */
export function numberToIndianRupeesWords(amount: number): string {
  if (amount === 0) return 'INR Zero Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tensDigits = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return singleDigits[n];
    const tens = Math.floor(n / 10);
    const unit = n % 10;
    return `${tensDigits[tens]}${unit !== 0 ? ' ' + singleDigits[unit] : ''}`.trim();
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let result = '';
    if (hundred > 0) {
      result += `${singleDigits[hundred]} Hundred`;
    }
    if (remainder > 0) {
      if (result) result += ' ';
      result += convertTwoDigits(remainder);
    }
    return result.trim();
  }

  const rounded = round2(amount);
  const integerPart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - integerPart) * 100);

  let num = integerPart;
  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  const thousands = Math.floor(num / 1000);
  const hundreds = num % 1000;

  const parts: string[] = [];

  if (crores > 0) {
    parts.push(`${convertTwoDigits(crores)} Crore`);
  }
  if (lakhs > 0) {
    parts.push(`${convertTwoDigits(lakhs)} Lakh`);
  }
  if (thousands > 0) {
    parts.push(`${convertTwoDigits(thousands)} Thousand`);
  }
  if (hundreds > 0) {
    parts.push(convertThreeDigits(hundreds));
  }

  let words = parts.join(' ').trim();
  if (!words) {
    words = 'Zero';
  }

  let result = `INR ${words}`;
  if (decimalPart > 0) {
    result += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }
  result += ' Only';

  return result;
}
