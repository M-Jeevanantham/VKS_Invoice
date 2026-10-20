import { describe, it, expect } from 'vitest';
import {
  calculateLineItem,
  calculateInvoiceTotals,
  generateTaxSummary,
  numberToIndianRupeesWords,
  round2,
} from '../utils/calculations';

describe('Financial Calculations Engine', () => {
  it('correctly calculates line items for weight in KG and unit price', () => {
    // Item A: 10 KG * 650 = 6,500 at 5% intra-state
    const itemA = calculateLineItem(
      {
        id: '1',
        serial_number: 1,
        item_name: 'Viscose Spun Yarn - 40s Count',
        hsn_sac: '5407',
        quantity: 10,
        unit: 'KG',
        unit_price: 650,
        discount_amount: 0,
        tax_rate: 5,
      },
      false
    );

    expect(itemA.taxable_amount).toBe(6500);
    expect(itemA.cgst_amount).toBe(162.5);
    expect(itemA.sgst_amount).toBe(162.5);
    expect(itemA.igst_amount).toBe(0);
    expect(itemA.line_total).toBe(6825);
  });

  it('matches the exact master prompt calculation test', () => {
    // From Prompt Section 25:
    // Item A: 10 KG * 650 = 6,500
    // Item B: 5 KG * 1,200 = 6,000
    // Subtotal = 12,500
    // Intra-state supply at 5% total GST:
    // CGST at 2.5% = 312.50
    // SGST at 2.5% = 312.50
    // Total including tax = 13,125
    const items = [
      {
        id: '1',
        item_name: 'Item A',
        hsn_sac: '5407',
        quantity: 10,
        unit: 'KG' as const,
        unit_price: 650,
        discount_amount: 0,
        tax_rate: 5,
      },
      {
        id: '2',
        item_name: 'Item B',
        hsn_sac: '5407',
        quantity: 5,
        unit: 'KG' as const,
        unit_price: 1200,
        discount_amount: 0,
        tax_rate: 5,
      },
    ];

    const result = calculateInvoiceTotals(items, false);

    expect(result.subtotal).toBe(12500);
    expect(result.taxable_amount).toBe(12500);
    expect(result.cgst_total).toBe(312.5);
    expect(result.sgst_total).toBe(312.5);
    expect(result.igst_total).toBe(0);
    expect(result.total_tax).toBe(625);
    expect(result.grand_total).toBe(13125);
    expect(result.amount_in_words).toBe('INR Thirteen Thousand One Hundred Twenty Five Only');
  });

  it('correctly applies IGST for interstate transactions', () => {
    const items = [
      {
        id: '1',
        item_name: 'Cotton Fabric Roll',
        hsn_sac: '5208',
        quantity: 100,
        unit: 'MTR' as const,
        unit_price: 150,
        discount_amount: 500, // 15,000 - 500 = 14,500 taxable
        tax_rate: 5,
      },
    ];

    const result = calculateInvoiceTotals(items, true); // isInterstate = true

    expect(result.subtotal).toBe(15000);
    expect(result.discount_total).toBe(500);
    expect(result.taxable_amount).toBe(14500);
    expect(result.cgst_total).toBe(0);
    expect(result.sgst_total).toBe(0);
    expect(result.igst_total).toBe(725);
    expect(result.total_tax).toBe(725);
    expect(result.grand_total).toBe(15225);
  });

  it('groups taxes by HSN/SAC code correctly', () => {
    const calculatedItems = [
      calculateLineItem(
        {
          id: '1',
          serial_number: 1,
          item_name: 'Viscose Grey Fabric',
          hsn_sac: '5407',
          quantity: 10,
          unit: 'KG',
          unit_price: 500,
          discount_amount: 0,
          tax_rate: 5,
        },
        false
      ),
      calculateLineItem(
        {
          id: '2',
          serial_number: 2,
          item_name: 'Rayon Twill Fabric',
          hsn_sac: '5407',
          quantity: 20,
          unit: 'KG',
          unit_price: 500,
          discount_amount: 0,
          tax_rate: 5,
        },
        false
      ),
      calculateLineItem(
        {
          id: '3',
          serial_number: 3,
          item_name: 'Packaging Box',
          hsn_sac: '4819',
          quantity: 5,
          unit: 'BOX',
          unit_price: 200,
          discount_amount: 0,
          tax_rate: 12,
        },
        false
      ),
    ];

    const taxSummary = generateTaxSummary(calculatedItems, false);
    expect(taxSummary).toHaveLength(2);

    const hsn4819 = taxSummary.find((s) => s.hsn_sac === '4819');
    expect(hsn4819?.taxable_amount).toBe(1000);
    expect(hsn4819?.total_tax).toBe(120);

    const hsn5407 = taxSummary.find((s) => s.hsn_sac === '5407');
    expect(hsn5407?.taxable_amount).toBe(15000);
    expect(hsn5407?.cgst_amount).toBe(375);
    expect(hsn5407?.sgst_amount).toBe(375);
    expect(hsn5407?.total_tax).toBe(750);
  });

  it('formats Indian numbering into words accurately', () => {
    expect(numberToIndianRupeesWords(13125)).toBe(
      'INR Thirteen Thousand One Hundred Twenty Five Only'
    );
    expect(numberToIndianRupeesWords(2500000)).toBe('INR Twenty Five Lakh Only');
    expect(numberToIndianRupeesWords(1000500.5)).toBe(
      'INR Ten Lakh Five Hundred and Fifty Paise Only'
    );
  });
});
