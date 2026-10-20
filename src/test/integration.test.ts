import { describe, it, expect, beforeEach } from 'vitest';
import { dataService } from '../services/dataService';

describe('VKS Billing Integration & Workflow Tests', { timeout: 15000 }, () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('preserves exact four Terms & Conditions from master specification', async () => {
    const settings = await dataService.getBusinessSettings();
    expect(settings.term_1).toBe(
      '1. Interest will be charged @ 24% on bill, if payment not received within 30 days.'
    );
    expect(settings.term_2).toBe(
      '2.We are not responsible for any loss or damage in transit'
    );
    expect(settings.term_3).toBe(
      '3. Goods once sold cannot be taken back under any circumstances.'
    );
    expect(settings.term_4).toBe(
      '4. All disputes subject to SALEM Jurisdiction'
    );
  });

  it('saves draft invoice and preserves historical customer and terms snapshots', async () => {
    const draft = await dataService.saveDraftInvoice({
      customer_id: '00000000-0000-0000-0001-000000000001',
      customer_snapshot: {
        customer_name: 'Sri Murugan Textiles',
        phone: '+91 98424 55678',
        billing_address: '42, Cauvery Road',
        shipping_address: 'Godown 4',
        city: 'Erode',
        state: 'Tamil Nadu',
        state_code: '33',
        postal_code: '638001',
      },
      items: [
        {
          id: 'item-1',
          serial_number: 1,
          item_name: 'Viscose Spun Yarn - 40s Count',
          hsn_sac: '5407',
          quantity: 10,
          unit: 'KG',
          unit_price: 650,
          discount_amount: 0,
          tax_rate: 5,
        },
        {
          id: 'item-2',
          serial_number: 2,
          item_name: 'Cotton Combed Yarn - 60s Count',
          hsn_sac: '5205',
          quantity: 5,
          unit: 'KG',
          unit_price: 1200,
          discount_amount: 0,
          tax_rate: 5,
        },
      ] as any,
      is_interstate: false,
    });

    expect(draft.id).toBeDefined();
    expect(draft.invoice_status).toBe('DRAFT');
    expect(draft.invoice_number).toBeNull();
    expect(draft.grand_total).toBe(13125);
    expect(draft.customer_snapshot.customer_name).toBe('Sri Murugan Textiles');
    expect(draft.terms_snapshot.term_4).toBe('4. All disputes subject to SALEM Jurisdiction');
  });

  it('finalizes invoice, allocates unique invoice number, and locks sequence', async () => {
    const draft = await dataService.saveDraftInvoice({
      customer_id: '00000000-0000-0000-0001-000000000001',
      customer_snapshot: {
        customer_name: 'Lakshmi Weaving Mills',
        phone: '+91 98427 00000',
        billing_address: 'Salem',
        shipping_address: 'Salem',
        city: 'Salem',
        state: 'Tamil Nadu',
        state_code: '33',
        postal_code: '636001',
      },
      items: [
        {
          item_name: 'Viscose Grey Fabric',
          hsn_sac: '5407',
          quantity: 100,
          unit: 'MTR',
          unit_price: 70,
          discount_amount: 0,
          tax_rate: 5,
        },
      ] as any,
      is_interstate: false,
    });

    const finalized = await dataService.finalizeInvoice(draft.id);
    expect(finalized.invoice_status).toBe('FINALIZED');
    expect(finalized.invoice_number).toMatch(/VKSW\/\d{4}\/\d{3}/);

    // Finalized invoices cannot be deleted
    await expect(dataService.deleteDraftInvoice(finalized.id)).rejects.toThrow(
      /Finalized invoices cannot be deleted/
    );
  });

  it('records payment, reduces outstanding balance, and updates payment status', async () => {
    const draft = await dataService.saveDraftInvoice({
      customer_id: '00000000-0000-0000-0001-000000000001',
      customer_snapshot: {
        customer_name: 'Royal Textiles',
        phone: '+91 98424 11111',
        billing_address: 'Erode',
        shipping_address: 'Erode',
        city: 'Erode',
        state: 'Tamil Nadu',
        state_code: '33',
        postal_code: '638001',
      },
      items: [
        {
          item_name: 'Rayon Fabric',
          hsn_sac: '5407',
          quantity: 10,
          unit: 'KG',
          unit_price: 1000,
          discount_amount: 0,
          tax_rate: 5, // 10,000 + 500 tax = 10,500
        },
      ] as any,
      is_interstate: false,
    });

    const finalized = await dataService.finalizeInvoice(draft.id);
    expect(finalized.grand_total).toBe(10500);
    expect(finalized.outstanding_balance).toBe(10500);
    expect(finalized.payment_status).toBe('UNPAID');

    // Record partial payment of 5,000
    await dataService.recordPayment({
      invoice_id: finalized.id,
      customer_id: finalized.customer_id,
      payment_date: '2026-10-17',
      amount: 5000,
      payment_method: 'BANK_TRANSFER',
      reference_number: 'UTR12345',
    });

    const updated = await dataService.getInvoiceById(finalized.id);
    expect(updated?.amount_paid).toBe(5000);
    expect(updated?.outstanding_balance).toBe(5500);
    expect(updated?.payment_status).toBe('PARTIALLY_PAID');

    // Pay remaining 5,500
    await dataService.recordPayment({
      invoice_id: finalized.id,
      customer_id: finalized.customer_id,
      payment_date: '2026-10-17',
      amount: 5500,
      payment_method: 'UPI',
      reference_number: 'UPI998877',
    });

    const fullyPaid = await dataService.getInvoiceById(finalized.id);
    expect(fullyPaid?.amount_paid).toBe(10500);
    expect(fullyPaid?.outstanding_balance).toBe(0);
    expect(fullyPaid?.payment_status).toBe('PAID');
  });

  it('duplicates finalized invoice into fresh editable draft with new ID and null number', async () => {
    const draft = await dataService.saveDraftInvoice({
      customer_snapshot: {
        customer_name: 'Original Client',
        phone: '123',
        billing_address: 'Addr',
        shipping_address: 'Addr',
        city: 'Salem',
        state: 'Tamil Nadu',
        state_code: '33',
        postal_code: '636001',
      },
      items: [
        {
          item_name: 'Yarn',
          hsn_sac: '5407',
          quantity: 20,
          unit: 'KG',
          unit_price: 500,
          discount_amount: 0,
          tax_rate: 5,
        },
      ] as any,
      is_interstate: false,
    });

    const finalized = await dataService.finalizeInvoice(draft.id);
    const copy = await dataService.duplicateInvoice(finalized.id);

    expect(copy.id).not.toBe(finalized.id);
    expect(copy.invoice_status).toBe('DRAFT');
    expect(copy.invoice_number).toBeNull();
    expect(copy.customer_snapshot.customer_name).toBe('Original Client');
    expect(copy.grand_total).toBe(finalized.grand_total);
  });

  it('starts with fresh empty customer and product directories and supports CRUD', async () => {
    // 1. Should be completely empty initially
    const initialCusts = await dataService.getCustomers();
    const initialProds = await dataService.getProducts();
    expect(initialCusts).toEqual([]);
    expect(initialProds).toEqual([]);

    // 2. Create customer
    const newCust = await dataService.createCustomer({
      customer_name: 'Meenakshi Handlooms',
      phone: '+91 94433 11223',
      billing_address: '15, Weavers Colony',
      shipping_address: '15, Weavers Colony',
      city: 'Salem',
      state: 'Tamil Nadu',
      state_code: '33',
      postal_code: '636005',
    });
    expect(newCust.id).toBeDefined();
    expect(newCust.customer_name).toBe('Meenakshi Handlooms');

    const updatedCusts = await dataService.getCustomers();
    expect(updatedCusts.length).toBe(1);
    expect(updatedCusts[0].customer_name).toBe('Meenakshi Handlooms');

    // 3. Create product
    const newProd = await dataService.createProduct({
      name: '100% Viscose 30s Warp Yarn',
      hsn_sac: '5407',
      unit: 'KG',
      default_rate: 480,
      default_tax_rate: 5,
      is_active: true,
    });
    expect(newProd.id).toBeDefined();
    expect(newProd.name).toBe('100% Viscose 30s Warp Yarn');

    const updatedProds = await dataService.getProducts();
    expect(updatedProds.length).toBe(1);
    expect(updatedProds[0].name).toBe('100% Viscose 30s Warp Yarn');

    // 4. Delete customer and product
    await dataService.deleteCustomer(newCust.id);
    await dataService.deleteProduct(newProd.id);

    const clearedCusts = await dataService.getCustomers();
    const clearedProds = await dataService.getProducts();
    expect(clearedCusts).toEqual([]);
    expect(clearedProds).toEqual([]);
  });

  it('authenticates admin credentials, manages sessions, and supports password updates', async () => {
    // 1. Initial state: no session
    expect(dataService.getCurrentSession()).toBeNull();

    // 2. Invalid password rejected
    await expect(dataService.login('vks@admin.in', 'wrong_pass')).rejects.toThrow();

    // 3. Valid login with master credentials
    const session = await dataService.login('vks@admin.in', 'admin@vks');
    expect(session).toBeDefined();
    expect(session.user.email).toBe('vks@admin.in');
    expect(session.token).toMatch(/^vks-token-/);
    expect(dataService.getCurrentSession()).not.toBeNull();

    // 4. Change password
    const updated = await dataService.changePassword('vks@admin.in', 'admin@vks', 'newPass@2026');
    expect(updated).toBe(true);

    // 5. Old password no longer works
    await expect(dataService.login('vks@admin.in', 'admin@vks')).rejects.toThrow();

    // 6. New password works
    const newSession = await dataService.login('vks@admin.in', 'newPass@2026');
    expect(newSession.user.email).toBe('vks@admin.in');

    // 7. Reset password back to admin@vks for master configuration
    await dataService.changePassword('vks@admin.in', 'newPass@2026', 'admin@vks');

    // 8. Logout
    dataService.logout();
    expect(dataService.getCurrentSession()).toBeNull();
  });
});
