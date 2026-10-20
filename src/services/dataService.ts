// ==============================================================================
// V.K.S. WEAVING CENTRE — UNIFIED DATA SERVICE
// Handles Supabase PostgreSQL persistence with reactive local caching fallback.
// Atomic invoice sequence allocation, immutable snapshots, and payments audit.
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import {
  BusinessSettings,
  Customer,
  Product,
  Invoice,
  Payment,
  InvoiceAuditLog,
  InvoiceItem,
  AuthUser,
  AuthSession,
} from '../types';
import { calculateInvoiceTotals } from '../utils/calculations';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const STORAGE_KEYS = {
  SETTINGS: 'vks_business_settings',
  CUSTOMERS: 'vks_customers',
  PRODUCTS: 'vks_products',
  INVOICES: 'vks_invoices',
  PAYMENTS: 'vks_payments',
  AUDIT_LOGS: 'vks_audit_logs',
  AUTH_SESSION: 'vks_auth_session',
};

// Initial default business settings
const DEFAULT_SETTINGS: BusinessSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  business_name: 'V.K.S. WEAVING CENTRE',
  tagline: 'Specialists in High Quality Rayon, Viscose & Cotton Fabrics',
  logo_url: '/vks-logo.png',
  murugan_image_url: '',
  signature_url: '', // Left blank by default per prompt: manual signing when no signature
  upi_qr_url: '',
  address_line1: '5/182, Weavers Colony, Ammapet',
  address_line2: 'Near Sengunthar Kalyana Mandapam',
  city: 'Salem',
  state: 'Tamil Nadu',
  state_code: '33',
  postal_code: '636003',
  phone_primary: '+91 98427 12345',
  phone_secondary: '+91 94432 67890',
  email: 'vksweavingcentre@gmail.com',
  gstin: '33AAACV1234F1Z9',
  pan: 'AAACV1234F',
  default_place_of_supply: 'Tamil Nadu (33)',
  
  // Banking
  bank_name: 'State Bank of India',
  bank_branch: 'Ammapet Branch, Salem',
  account_holder_name: 'V.K.S. WEAVING CENTRE',
  account_number: '30123456789',
  ifsc_code: 'SBIN0001234',
  account_type: 'Current Account',
  
  // Numbering
  invoice_prefix: 'VKSW',
  invoice_number_format: 'VKSW/{YEAR}/{SEQ}',
  current_financial_year: '2026-2027',
  next_sequence_number: 1,
  default_payment_terms_days: 30,
  
  // Exact 4 Terms and Conditions from Section 18
  term_1: '1. Interest will be charged @ 24% on bill, if payment not received within 30 days.',
  term_2: '2.We are not responsible for any loss or damage in transit',
  term_3: '3. Goods once sold cannot be taken back under any circumstances.',
  term_4: '4. All disputes subject to SALEM Jurisdiction',
  
  // Print options
  show_logo_on_print: true,
  show_murugan_on_print: true,
  show_signature_on_print: true,
  enable_einvoice_section: false,
};

// Initial default customers (empty for fresh custom entry)
const DEFAULT_CUSTOMERS: Customer[] = [];

// Initial default products (empty for fresh custom entry)
const DEFAULT_PRODUCTS: Product[] = [];

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

class DataService {
  // --------------------------------------------------------------------------
  // BUSINESS SETTINGS
  // --------------------------------------------------------------------------
  async getBusinessSettings(): Promise<BusinessSettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('business_settings')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          setToStorage(STORAGE_KEYS.SETTINGS, data);
          return data as BusinessSettings;
        }
      } catch (e) {
        // fallback
      }
    }
    return getFromStorage<BusinessSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  async updateBusinessSettings(updates: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const current = await this.getBusinessSettings();
    const updated: BusinessSettings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('business_settings')
          .upsert(updated)
          .select()
          .maybeSingle();
        if (!error && data) {
          setToStorage(STORAGE_KEYS.SETTINGS, data);
          return data as BusinessSettings;
        }
      } catch (e) {
        // fallback
      }
    }

    setToStorage(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --------------------------------------------------------------------------
  // CUSTOMERS
  // --------------------------------------------------------------------------
  async getCustomers(): Promise<Customer[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('customer_name', { ascending: true });
        if (!error && data) {
          setToStorage(STORAGE_KEYS.CUSTOMERS, data);
          return data as Customer[];
        }
      } catch (e) {
        // fallback
      }
    }
    return getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  }

  async createCustomer(payload: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const newCustomer: Customer = {
      is_active: true,
      ...payload,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .insert(newCustomer)
          .select()
          .maybeSingle();
        if (!error && data) {
          const list = await this.getCustomers();
          list.push(data);
          setToStorage(STORAGE_KEYS.CUSTOMERS, list);
          return data as Customer;
        }
      } catch (e) {
        // fallback
      }
    }

    const list = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    list.push(newCustomer);
    setToStorage(STORAGE_KEYS.CUSTOMERS, list);
    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const list = await this.getCustomers();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Customer ${id} not found`);

    const updated = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('customers').update(updated).eq('id', id);
      } catch (e) {
        // fallback
      }
    }

    setToStorage(STORAGE_KEYS.CUSTOMERS, list);
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const list = (await this.getCustomers()).filter((c) => c.id !== id);
    setToStorage(STORAGE_KEYS.CUSTOMERS, list);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('customers').delete().eq('id', id);
      } catch (e) {
        // fallback
      }
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------------------------------
  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data) {
          setToStorage(STORAGE_KEYS.PRODUCTS, data);
          return data as Product[];
        }
      } catch (e) {
        // fallback
      }
    }
    return getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  }

  async createProduct(payload: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const newProduct: Product = {
      is_active: true,
      ...payload,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert(newProduct)
          .select()
          .maybeSingle();
        if (!error && data) {
          const list = await this.getProducts();
          list.push(data);
          setToStorage(STORAGE_KEYS.PRODUCTS, list);
          return data as Product;
        }
      } catch (e) {
        // fallback
      }
    }

    const list = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    list.push(newProduct);
    setToStorage(STORAGE_KEYS.PRODUCTS, list);
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const list = await this.getProducts();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Product ${id} not found`);

    const updated = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').update(updated).eq('id', id);
      } catch (e) {
        // fallback
      }
    }

    setToStorage(STORAGE_KEYS.PRODUCTS, list);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const list = (await this.getProducts()).filter((p) => p.id !== id);
    setToStorage(STORAGE_KEYS.PRODUCTS, list);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        // fallback
      }
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // INVOICES & SNAPSHOTS
  // --------------------------------------------------------------------------
  async getInvoices(): Promise<Invoice[]> {
    let list: Invoice[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*, items:invoice_items(*)')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          list = data as Invoice[];
        }
      } catch (e) {
        // fallback
      }
    }

    // Merge with local storage to guarantee immediate consistency and persistence:
    // If local invoice is FINALIZED, it must NEVER be reverted to DRAFT by a stale remote record!
    const local = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const mergedMap = new Map<string, Invoice>();

    // 1. Seed with Supabase records
    list.forEach((i) => mergedMap.set(i.id, i));

    // 2. Intelligently merge local storage records
    local.forEach((localInv) => {
      const existing = mergedMap.get(localInv.id);
      if (!existing) {
        mergedMap.set(localInv.id, localInv);
      } else {
        // Critical: If local has been finalized with an allocated number, preserve it!
        if (localInv.invoice_status === 'FINALIZED' && existing.invoice_status !== 'FINALIZED') {
          mergedMap.set(localInv.id, {
            ...existing,
            ...localInv,
            invoice_status: 'FINALIZED',
            invoice_number: localInv.invoice_number || existing.invoice_number,
            finalized_at: localInv.finalized_at || existing.finalized_at,
          });
        } else if (new Date(localInv.updated_at || 0).getTime() >= new Date(existing.updated_at || 0).getTime()) {
          mergedMap.set(localInv.id, {
            ...existing,
            ...localInv,
          });
        }
      }
    });

    const result = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setToStorage(STORAGE_KEYS.INVOICES, result);
    return result;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const invoices = await this.getInvoices();
    const found = invoices.find((inv) => inv.id === id);
    if (found) return found;

    // Check directly in local storage fallback
    const local = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    return local.find((inv) => inv.id === id) || null;
  }

  /**
   * Safe Draft saving: preserves work in progress without allocating a final sequence number
   */
  async saveDraftInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const settings = await this.getBusinessSettings();
    const isInterstate = Boolean(invoiceData.is_interstate);
    const rawItems = invoiceData.items || [];
    const calculatedTotals = calculateInvoiceTotals(rawItems, isInterstate);

    const invoiceId = invoiceData.id || generateUUID();
    const now = new Date().toISOString();

    const draftInvoice: Invoice = {
      id: invoiceId,
      invoice_number: invoiceData.invoice_number || null,
      invoice_status: 'DRAFT',
      payment_status: 'UNPAID',
      invoice_date: invoiceData.invoice_date || now.split('T')[0],
      due_date: invoiceData.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      dc_number: invoiceData.dc_number || '',
      place_of_supply: invoiceData.place_of_supply || settings.default_place_of_supply,
      is_interstate: isInterstate,
      customer_id: invoiceData.customer_id,
      customer_snapshot: invoiceData.customer_snapshot || {
        customer_name: '',
        billing_address: '',
        shipping_address: '',
        city: '',
        state: '',
        state_code: '',
        postal_code: '',
        phone: '',
      },
      transport_name: invoiceData.transport_name || '',
      vehicle_number: invoiceData.vehicle_number || '',
      lr_number: invoiceData.lr_number || '',
      transport_date: invoiceData.transport_date || '',
      items: calculatedTotals.calculatedItems,
      subtotal: calculatedTotals.subtotal,
      discount_total: calculatedTotals.discount_total,
      taxable_amount: calculatedTotals.taxable_amount,
      cgst_total: calculatedTotals.cgst_total,
      sgst_total: calculatedTotals.sgst_total,
      igst_total: calculatedTotals.igst_total,
      total_tax: calculatedTotals.total_tax,
      round_off: calculatedTotals.round_off,
      grand_total: calculatedTotals.grand_total,
      amount_paid: 0,
      outstanding_balance: calculatedTotals.grand_total,
      amount_in_words: calculatedTotals.amount_in_words,
      business_snapshot: {
        business_name: settings.business_name,
        tagline: settings.tagline,
        logo_url: settings.logo_url,
        murugan_image_url: settings.murugan_image_url,
        signature_url: settings.signature_url,
        address_line1: settings.address_line1,
        address_line2: settings.address_line2,
        city: settings.city,
        state: settings.state,
        state_code: settings.state_code,
        postal_code: settings.postal_code,
        phone_primary: settings.phone_primary,
        phone_secondary: settings.phone_secondary,
        email: settings.email,
        gstin: settings.gstin,
        pan: settings.pan,
        place_of_supply: settings.default_place_of_supply,
      },
      terms_snapshot: {
        term_1: settings.term_1,
        term_2: settings.term_2,
        term_3: settings.term_3,
        term_4: settings.term_4,
      },
      bank_snapshot: {
        bank_name: settings.bank_name,
        bank_branch: settings.bank_branch,
        account_holder_name: settings.account_holder_name,
        account_number: settings.account_number,
        ifsc_code: settings.ifsc_code,
        account_type: settings.account_type,
      },
      irn: invoiceData.irn,
      ack_number: invoiceData.ack_number,
      ack_date: invoiceData.ack_date,
      einvoice_qr_data: invoiceData.einvoice_qr_data,
      created_at: invoiceData.created_at || now,
      updated_at: now,
    };

    // Save to local storage first
    const invoices = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const existingIndex = invoices.findIndex((i) => i.id === invoiceId);
    if (existingIndex >= 0) {
      invoices[existingIndex] = draftInvoice;
    } else {
      invoices.unshift(draftInvoice);
    }
    setToStorage(STORAGE_KEYS.INVOICES, invoices);

    // Save to Supabase if available
    if (isSupabaseConfigured && supabase) {
      try {
        const { items: _, ...invoiceRecord } = draftInvoice;
        // Cleanse date & UUID fields: replace empty strings with null to avoid Postgres type errors
        const cleanedRecord = {
          ...invoiceRecord,
          customer_id: invoiceRecord.customer_id || null,
          transport_date: invoiceRecord.transport_date || null,
          ack_date: invoiceRecord.ack_date || null,
          irn: invoiceRecord.irn || null,
          ack_number: invoiceRecord.ack_number || null,
          einvoice_qr_data: invoiceRecord.einvoice_qr_data || null,
        };
        await supabase.from('invoices').upsert(cleanedRecord);

        // Delete existing items first to avoid duplicate multiplication on subsequent draft saves
        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);

        // Upsert line items
        if (draftInvoice.items && draftInvoice.items.length > 0) {
          const itemsPayload = draftInvoice.items.map((it, idx) => ({
            id: generateUUID(),
            invoice_id: invoiceId,
            serial_number: idx + 1,
            item_name: it.item_name,
            hsn_sac: it.hsn_sac,
            details: it.details || '',
            quantity: it.quantity,
            unit: it.unit,
            unit_price: it.unit_price,
            discount_amount: it.discount_amount || 0,
            tax_rate: it.tax_rate,
            taxable_amount: it.taxable_amount,
            cgst_amount: it.cgst_amount,
            sgst_amount: it.sgst_amount,
            igst_amount: it.igst_amount,
            line_total: it.line_total,
          }));
          await supabase.from('invoice_items').insert(itemsPayload);
        }
      } catch (e) {
        console.warn('Supabase invoice draft error, local state preserved:', e);
      }
    }

    return draftInvoice;
  }

  /**
   * Generates a preview string of the next sequential invoice number based on business settings.
   */
  getPreviewInvoiceNumber(settings: BusinessSettings): string {
    const currentSeq = settings.next_sequence_number || 1;
    const year = new Date().getFullYear().toString();
    const seqPadded = String(currentSeq).padStart(3, '0');
    return settings.invoice_number_format
      .replace('{PREFIX}', settings.invoice_prefix)
      .replace('{YEAR}', year)
      .replace('{SEQ}', seqPadded);
  }

  /**
   * Finalize Invoice: Locks the invoice, allocates or assigns a unique invoice number,
   * freezes historical snapshots, and prevents overwriting.
   */
  async finalizeInvoice(invoiceId: string, customInvoiceNumber?: string): Promise<Invoice> {
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
    if (invoice.invoice_status === 'FINALIZED' && invoice.invoice_number) {
      return invoice; // already finalized with allocated number
    }

    const settings = await this.getBusinessSettings();
    let finalNumber = customInvoiceNumber?.trim();

    // If no manual/custom number was provided, use sequential auto-allocation
    if (!finalNumber) {
      // Call Supabase RPC if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: allocatedNumber, error } = await supabase.rpc(
            'allocate_invoice_number',
            { p_invoice_id: invoiceId }
          );
          if (!error && allocatedNumber) {
            const fresh = await this.getInvoiceById(invoiceId);
            if (fresh && fresh.invoice_number) {
              const localInvs = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
              const fIdx = localInvs.findIndex((i) => i.id === invoiceId);
              if (fIdx >= 0) localInvs[fIdx] = fresh;
              else localInvs.unshift(fresh);
              setToStorage(STORAGE_KEYS.INVOICES, localInvs);
              return fresh;
            }
          }
        } catch (e) {
          // fallback to sequential
        }
      }

      // Local sequential allocation
      finalNumber = this.getPreviewInvoiceNumber(settings);

      // Update settings sequence for the next invoice
      await this.updateBusinessSettings({
        next_sequence_number: (settings.next_sequence_number || 1) + 1,
      });
    }

    const finalized: Invoice = {
      ...invoice,
      invoice_number: finalNumber,
      invoice_status: 'FINALIZED',
      finalized_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const invoices = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const idx = invoices.findIndex((i) => i.id === invoiceId);
    if (idx >= 0) {
      invoices[idx] = finalized;
    } else {
      invoices.unshift(finalized);
    }
    setToStorage(STORAGE_KEYS.INVOICES, invoices);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('invoices').update({
          invoice_number: finalNumber,
          invoice_status: 'FINALIZED',
          finalized_at: finalized.finalized_at,
          updated_at: finalized.updated_at,
        }).eq('id', invoiceId);
      } catch (e) {
        console.warn('Supabase invoice finalization update error:', e);
      }
    }

    return finalized;
  }

  /**
   * Duplicates an existing invoice into a fresh DRAFT
   */
  async duplicateInvoice(invoiceId: string): Promise<Invoice> {
    const existing = await this.getInvoiceById(invoiceId);
    if (!existing) throw new Error('Invoice not found');

    const freshDraft = await this.saveDraftInvoice({
      ...existing,
      id: generateUUID(),
      invoice_number: null,
      invoice_status: 'DRAFT',
      payment_status: 'UNPAID',
      amount_paid: 0,
      outstanding_balance: existing.grand_total,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      finalized_at: undefined,
    });

    return freshDraft;
  }

  /**
   * Delete Invoice: deletes any invoice (Draft or Finalized per user authorization),
   * along with its associated items and payment references in local storage and Supabase.
   */
  async deleteInvoice(invoiceId: string): Promise<boolean> {
    const invoices = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []).filter((i) => i.id !== invoiceId);
    setToStorage(STORAGE_KEYS.INVOICES, invoices);

    // Also delete any associated payments from local storage
    const payments = getFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, []).filter((p) => p.invoice_id !== invoiceId);
    setToStorage(STORAGE_KEYS.PAYMENTS, payments);

    if (isSupabaseConfigured && supabase) {
      try {
        // Delete child line items, payments, and invoice
        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
        await supabase.from('payments').delete().eq('invoice_id', invoiceId);
        await supabase.from('invoices').delete().eq('id', invoiceId);
      } catch (e) {
        console.warn('Supabase delete invoice warning:', e);
      }
    }

    return true;
  }

  async deleteDraftInvoice(invoiceId: string): Promise<boolean> {
    return this.deleteInvoice(invoiceId);
  }

  // --------------------------------------------------------------------------
  // PAYMENTS
  // --------------------------------------------------------------------------
  async getPayments(invoiceId?: string): Promise<Payment[]> {
    let list: Payment[] = [];
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('payments').select('*').order('created_at', { ascending: false });
        if (invoiceId) {
          query = query.eq('invoice_id', invoiceId);
        }
        const { data, error } = await query;
        if (!error && data) {
          list = data as Payment[];
        }
      } catch (e) {
        // fallback
      }
    }

    // Merge with local storage
    const allLocal = getFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
    const localFiltered = invoiceId ? allLocal.filter((p) => p.invoice_id === invoiceId) : allLocal;

    const map = new Map<string, Payment>();
    list.forEach((p) => map.set(p.id, p));
    localFiltered.forEach((p) => {
      if (!map.has(p.id)) {
        map.set(p.id, p);
      }
    });

    return Array.from(map.values());
  }

  async recordPayment(payload: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const newPayment: Payment = {
      ...payload,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };

    // Recalculate invoice outstanding and payment status
    const invoice = await this.getInvoiceById(payload.invoice_id);
    if (!invoice) throw new Error(`Invoice ${payload.invoice_id} not found`);

    const existingPayments = await this.getPayments(payload.invoice_id);
    const updatedPayments = [newPayment, ...existingPayments];
    const totalPaid = updatedPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const outstanding = Math.max(0, invoice.grand_total - totalPaid);

    let paymentStatus: Invoice['payment_status'] = 'UNPAID';
    if (totalPaid >= invoice.grand_total && invoice.grand_total > 0) {
      paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    // Update invoice record
    const updatedInvoice: Invoice = {
      ...invoice,
      amount_paid: totalPaid,
      outstanding_balance: outstanding,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    const allInvoices = getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const idx = allInvoices.findIndex((i) => i.id === invoice.id);
    if (idx >= 0) {
      allInvoices[idx] = updatedInvoice;
      setToStorage(STORAGE_KEYS.INVOICES, allInvoices);
    }

    // Persist payment locally
    const allPayments = getFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
    allPayments.unshift(newPayment);
    setToStorage(STORAGE_KEYS.PAYMENTS, allPayments);

    // Persist to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        // Validate customer_id is a valid UUID before sending to postgres foreign key
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validCustomerId = payload.customer_id && uuidRegex.test(payload.customer_id)
          ? payload.customer_id
          : null;

        await supabase.from('payments').insert({
          ...newPayment,
          customer_id: validCustomerId,
        });
        await supabase.from('invoices').update({
          amount_paid: totalPaid,
          outstanding_balance: outstanding,
          payment_status: paymentStatus,
        }).eq('id', invoice.id);
      } catch (e) {
        // fallback
      }
    }

    return newPayment;
  }

  // --------------------------------------------------------------------------
  // MEDIA & STORAGE UPLOAD
  // --------------------------------------------------------------------------
  async uploadMediaFile(file: File, folder: 'logos' | 'signatures' | 'murugan' | 'qr'): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error } = await supabase.storage.from('vks-media').upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

        if (!error) {
          const { data } = supabase.storage.from('vks-media').getPublicUrl(fileName);
          return data.publicUrl;
        }
      } catch (e) {
        // fallback
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATION & SESSION MANAGEMENT
  // --------------------------------------------------------------------------
  getCurrentSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (!raw) return null;
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  async login(email: string, pass: string): Promise<AuthSession> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = pass.trim();

    // 1. Check Supabase auth_users
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('auth_users')
          .select('*')
          .eq('email', trimmedEmail)
          .maybeSingle();

        if (!error && data) {
          if (data.password === trimmedPass) {
            const session: AuthSession = {
              user: {
                id: data.id,
                email: data.email,
                full_name: data.full_name || 'Salem Admin',
                role: (data.role as any) || 'ADMIN',
              },
              token: `vks-token-${Date.now()}`,
              loginTime: new Date().toISOString(),
            };
            localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
            return session;
          } else {
            throw new Error('Incorrect password. Please verify and try again.');
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Incorrect password')) {
          throw err;
        }
        // Fallback to local credential verification if offline or network glitch
      }
    }

    // 2. Local verification (defaults to vks@admin.in / admin@vks or changed password)
    const localUsers = getFromStorage<Record<string, string>>('vks_local_passwords', {
      'vks@admin.in': 'admin@vks',
    });

    const expectedPass = localUsers[trimmedEmail] || (trimmedEmail === 'vks@admin.in' ? 'admin@vks' : null);

    if (!expectedPass || expectedPass !== trimmedPass) {
      throw new Error('Invalid email or password. Use ID: vks@admin.in, Pass: admin@vks');
    }

    const session: AuthSession = {
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        email: trimmedEmail,
        full_name: 'Salem Admin',
        role: 'ADMIN',
      },
      token: `vks-token-${Date.now()}`,
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    return session;
  }

  logout(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    } catch {
      // ignore
    }
  }

  async changePassword(email: string, currentPass: string, newPass: string): Promise<boolean> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCurrent = currentPass.trim();
    const trimmedNew = newPass.trim();

    if (!trimmedNew || trimmedNew.length < 4) {
      throw new Error('New password must be at least 4 characters long.');
    }

    // 1. Verify and update in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('auth_users')
          .select('*')
          .eq('email', trimmedEmail)
          .maybeSingle();

        if (!error && data) {
          if (data.password !== trimmedCurrent) {
            throw new Error('Current password does not match our records.');
          }

          const { error: updateError } = await supabase
            .from('auth_users')
            .update({
              password: trimmedNew,
              updated_at: new Date().toISOString(),
            })
            .eq('email', trimmedEmail);

          if (updateError) {
            throw new Error(`Failed to update password in database: ${updateError.message}`);
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Current password does not match')) {
          throw err;
        }
      }
    }

    // 2. Update local fallback cache
    const localUsers = getFromStorage<Record<string, string>>('vks_local_passwords', {
      'vks@admin.in': 'admin@vks',
    });

    if (localUsers[trimmedEmail] && localUsers[trimmedEmail] !== trimmedCurrent) {
      throw new Error('Current password does not match.');
    }

    localUsers[trimmedEmail] = trimmedNew;
    setToStorage('vks_local_passwords', localUsers);

    return true;
  }
}

export const dataService = new DataService();
