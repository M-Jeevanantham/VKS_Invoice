// ==============================================================================
// V.K.S. WEAVING CENTRE — DATA TYPES & DOMAIN MODELS
// ==============================================================================

export type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type PaymentMethod = 'BANK_TRANSFER' | 'CASH' | 'UPI' | 'CHEQUE';
export type ProductUnit = 'KG' | 'MTR' | 'PCS' | 'BOX' | 'ROLL' | 'ENS' | 'ENDS';

export interface BusinessSettings {
  id: string;
  business_name: string;
  tagline: string;
  logo_url?: string;
  murugan_image_url?: string;
  signature_url?: string;
  upi_qr_url?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  state_code: string;
  postal_code: string;
  phone_primary: string;
  phone_secondary?: string;
  email: string;
  gstin: string;
  pan?: string;
  default_place_of_supply: string;
  
  // Banking
  bank_name: string;
  bank_branch: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  
  // Numbering
  invoice_prefix: string;
  invoice_number_format: string; // e.g. VKSW/{YEAR}/{SEQ}
  current_financial_year: string;
  next_sequence_number: number;
  default_payment_terms_days: number;
  
  // Exact 4 Terms and Conditions
  term_1: string;
  term_2: string;
  term_3: string;
  term_4: string;
  
  // Print options
  show_logo_on_print: boolean;
  show_murugan_on_print: boolean;
  show_signature_on_print: boolean;
  enable_einvoice_section: boolean;
  
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  customer_name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  gstin?: string;
  pan?: string;
  billing_address: string;
  shipping_address?: string;
  city: string;
  state: string;
  state_code: string;
  postal_code: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  hsn_sac: string;
  unit: ProductUnit;
  default_rate: number;
  default_tax_rate: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id?: string;
  product_id?: string;
  serial_number: number;
  item_name: string;
  hsn_sac: string;
  details?: string; // packaging/counts/lot info
  quantity: number;
  unit: ProductUnit;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  line_total: number;
}

export interface CustomerSnapshot {
  customer_id?: string;
  customer_name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  gstin?: string;
  pan?: string;
  billing_address: string;
  shipping_name?: string;
  shipping_address: string;
  city: string;
  state: string;
  state_code: string;
  postal_code: string;
}

export interface TermsSnapshot {
  term_1: string;
  term_2: string;
  term_3: string;
  term_4: string;
}

export interface BankSnapshot {
  bank_name: string;
  bank_branch: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
}

export interface BusinessSnapshot {
  business_name: string;
  tagline?: string;
  logo_url?: string;
  murugan_image_url?: string;
  signature_url?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  state_code: string;
  postal_code: string;
  phone_primary: string;
  phone_secondary?: string;
  email: string;
  gstin: string;
  pan?: string;
  place_of_supply: string;
}

export interface TaxSummaryEntry {
  hsn_sac: string;
  tax_rate: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax: number;
}

export interface Invoice {
  id: string;
  invoice_number: string | null;
  invoice_status: InvoiceStatus;
  payment_status: PaymentStatus;
  
  invoice_date: string;
  due_date: string;
  dc_number?: string;
  place_of_supply: string;
  is_interstate: boolean;
  
  customer_id?: string;
  customer_snapshot: CustomerSnapshot;
  
  transport_name?: string;
  vehicle_number?: string;
  lr_number?: string;
  transport_date?: string;
  eway_bill_number?: string;
  
  items: InvoiceItem[];
  
  // Financial Calculations
  subtotal: number;
  discount_total: number;
  taxable_amount: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  total_tax: number;
  round_off: number;
  grand_total: number;
  amount_paid: number;
  outstanding_balance: number;
  amount_in_words: string;
  
  // Preserved Snapshots
  business_snapshot: BusinessSnapshot;
  terms_snapshot: TermsSnapshot;
  bank_snapshot: BankSnapshot;
  
  // Optional E-Invoice
  irn?: string;
  ack_number?: string;
  ack_date?: string;
  einvoice_qr_data?: string;
  
  finalized_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  customer_id?: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  created_at?: string;
}

export interface InvoiceAuditLog {
  id: string;
  invoice_id: string;
  action: string;
  details?: Record<string, any>;
  performed_by: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'OPERATOR';
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  loginTime: string;
}
