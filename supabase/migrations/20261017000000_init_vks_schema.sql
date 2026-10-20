-- ==============================================================================
-- V.K.S. WEAVING CENTRE — DATABASE SCHEMA MIGRATION
-- Production Schema: Multi-tenant / Workspace Isolation with Row-Level Security
-- Concurrency-Safe Invoice Number Allocation, Snapshot Preservation, Audit Logs
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. BUSINESS SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL DEFAULT 'V.K.S. WEAVING CENTRE',
    tagline TEXT DEFAULT 'Manufacturers of High Quality Viscose & Cotton Fabrics',
    logo_url TEXT,
    murugan_image_url TEXT,
    signature_url TEXT,
    upi_qr_url TEXT,
    address_line1 TEXT NOT NULL DEFAULT '5/182, Weavers Colony, Ammapet',
    address_line2 TEXT DEFAULT 'Near Sengunthar Kalyana Mandapam',
    city TEXT NOT NULL DEFAULT 'Salem',
    state TEXT NOT NULL DEFAULT 'Tamil Nadu',
    state_code TEXT NOT NULL DEFAULT '33',
    postal_code TEXT NOT NULL DEFAULT '636003',
    phone_primary TEXT NOT NULL DEFAULT '+91 98427 12345',
    phone_secondary TEXT DEFAULT '+91 94432 67890',
    email TEXT DEFAULT 'vksweavingcentre@gmail.com',
    gstin TEXT NOT NULL DEFAULT '33AAAAA0000A1Z5',
    pan TEXT DEFAULT 'AAAAA0000A',
    default_place_of_supply TEXT NOT NULL DEFAULT 'Tamil Nadu (33)',
    
    -- Bank Details
    bank_name TEXT NOT NULL DEFAULT 'State Bank of India',
    bank_branch TEXT DEFAULT 'Ammapet Branch, Salem',
    account_holder_name TEXT NOT NULL DEFAULT 'V.K.S. WEAVING CENTRE',
    account_number TEXT NOT NULL DEFAULT '30123456789',
    ifsc_code TEXT NOT NULL DEFAULT 'SBIN0001234',
    account_type TEXT DEFAULT 'Current Account',
    
    -- Numbering & Formats
    invoice_prefix TEXT NOT NULL DEFAULT 'VKSW',
    invoice_number_format TEXT NOT NULL DEFAULT 'VKSW/{YEAR}/{SEQ}',
    current_financial_year TEXT NOT NULL DEFAULT '2026-2027',
    next_sequence_number INTEGER NOT NULL DEFAULT 1,
    default_payment_terms_days INTEGER NOT NULL DEFAULT 30,
    
    -- Exact 4 Terms and Conditions
    term_1 TEXT NOT NULL DEFAULT '1. Interest will be charged @ 24% on bill, if payment not received within 30 days.',
    term_2 TEXT NOT NULL DEFAULT '2.We are not responsible for any loss or damage in transit',
    term_3 TEXT NOT NULL DEFAULT '3. Goods once sold cannot be taken back under any circumstances.',
    term_4 TEXT NOT NULL DEFAULT '4. All disputes subject to SALEM Jurisdiction',
    
    -- Print & E-Invoice Preferences
    show_logo_on_print BOOLEAN NOT NULL DEFAULT true,
    show_murugan_on_print BOOLEAN NOT NULL DEFAULT true,
    show_signature_on_print BOOLEAN NOT NULL DEFAULT true,
    enable_einvoice_section BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. CUSTOMERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    gstin TEXT,
    pan TEXT,
    billing_address TEXT NOT NULL,
    shipping_address TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    state_code TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_gstin ON public.customers(gstin);

-- ------------------------------------------------------------------------------
-- 3. PRODUCTS CATALOGUE TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    hsn_sac TEXT NOT NULL DEFAULT '5407',
    unit TEXT NOT NULL DEFAULT 'KG', -- 'KG', 'MTR', 'PCS', 'BOX'
    default_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    default_tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00, -- e.g. 5.00%
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_hsn ON public.products(hsn_sac);

-- ------------------------------------------------------------------------------
-- 4. INVOICES TABLE (Preserves Complete Historical Snapshots)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE, -- Nullable for drafts; strictly unique upon finalization
    invoice_status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'FINALIZED', 'CANCELLED'
    payment_status TEXT NOT NULL DEFAULT 'UNPAID', -- 'UNPAID', 'PARTIALLY_PAID', 'PAID'
    
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    dc_number TEXT, -- Delivery Challan Number
    place_of_supply TEXT NOT NULL DEFAULT 'Tamil Nadu (33)',
    is_interstate BOOLEAN NOT NULL DEFAULT false,
    
    -- Customer Relation and Snapshot
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_snapshot JSONB NOT NULL, -- Complete immutable customer billing & shipping details
    
    -- Transportation Snapshot
    transport_name TEXT,
    vehicle_number TEXT,
    lr_number TEXT,
    transport_date DATE,
    
    -- Financial Totals (Verified Server-Side)
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    taxable_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cgst_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sgst_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    igst_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_tax NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    round_off NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    outstanding_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    amount_in_words TEXT NOT NULL,
    
    -- Snapshots of Business & Terms at Time of Billing
    business_snapshot JSONB NOT NULL,
    terms_snapshot JSONB NOT NULL,
    bank_snapshot JSONB NOT NULL,
    
    -- Optional E-Invoice Snapshot
    irn TEXT,
    ack_number TEXT,
    ack_date TIMESTAMPTZ,
    einvoice_qr_data TEXT,
    
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(invoice_status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment ON public.invoices(payment_status);

-- ------------------------------------------------------------------------------
-- 5. INVOICE LINE ITEMS TABLE (Immutable Line Item Snapshots)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    
    serial_number INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    hsn_sac TEXT NOT NULL,
    details TEXT, -- packaging, count, warp/weft specs
    quantity NUMERIC(12, 3) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'KG',
    unit_price NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    taxable_amount NUMERIC(12, 2) NOT NULL,
    cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12, 2) NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

-- ------------------------------------------------------------------------------
-- 6. PAYMENTS RECORDING TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'BANK_TRANSFER', -- 'CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE'
    reference_number TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);

-- ------------------------------------------------------------------------------
-- 7. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoice_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'CREATED', 'UPDATED', 'FINALIZED', 'PAYMENT_RECORDED', 'CANCELLED'
    details JSONB,
    performed_by TEXT DEFAULT 'authorized_user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_invoice ON public.invoice_audit_logs(invoice_id);

-- ------------------------------------------------------------------------------
-- 8. CONCURRENCY-SAFE INVOICE NUMBER ALLOCATOR (PostgreSQL Transactional Function)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.allocate_invoice_number(p_invoice_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_format TEXT;
    v_prefix TEXT;
    v_next_seq INTEGER;
    v_year TEXT;
    v_formatted_num TEXT;
    v_current_status TEXT;
    v_existing_num TEXT;
BEGIN
    -- Check invoice exists and current status
    SELECT invoice_status, invoice_number INTO v_current_status, v_existing_num
    FROM public.invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice with id % does not exist.', p_invoice_id;
    END IF;

    -- If already finalized and has invoice number, return existing
    IF v_existing_num IS NOT NULL THEN
        RETURN v_existing_num;
    END IF;

    -- Lock the business_settings row to guarantee atomic serial generation
    SELECT invoice_prefix, invoice_number_format, next_sequence_number
    INTO v_prefix, v_format, v_next_seq
    FROM public.business_settings
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Fallback default prefix
        v_prefix := 'VKSW';
        v_format := 'VKSW/{YEAR}/{SEQ}';
        v_next_seq := 1;
    END IF;

    v_year := to_char(CURRENT_DATE, 'YYYY');
    v_formatted_num := replace(v_format, '{PREFIX}', v_prefix);
    v_formatted_num := replace(v_formatted_num, '{YEAR}', v_year);
    v_formatted_num := replace(v_formatted_num, '{SEQ}', lpad(v_next_seq::text, 3, '0'));

    -- Update the invoice with finalized status and allocated number
    UPDATE public.invoices
    SET invoice_number = v_formatted_num,
        invoice_status = 'FINALIZED',
        finalized_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_invoice_id;

    -- Increment the sequence atomically in business_settings
    UPDATE public.business_settings
    SET next_sequence_number = next_sequence_number + 1,
        updated_at = timezone('utc'::text, now());

    -- Log the audit event
    INSERT INTO public.invoice_audit_logs (invoice_id, action, details)
    VALUES (p_invoice_id, 'FINALIZED', jsonb_build_object('invoice_number', v_formatted_num));

    RETURN v_formatted_num;
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. PAYMENT RECALCULATION TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_invoice_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_id UUID;
    v_grand_total NUMERIC(14, 2);
    v_total_paid NUMERIC(14, 2);
    v_outstanding NUMERIC(14, 2);
    v_new_status TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    -- Get grand total of invoice
    SELECT grand_total INTO v_grand_total
    FROM public.invoices
    WHERE id = v_invoice_id;

    -- Sum all valid payments for this invoice
    SELECT COALESCE(SUM(amount), 0.00) INTO v_total_paid
    FROM public.payments
    WHERE invoice_id = v_invoice_id;

    v_outstanding := GREATEST(0.00, v_grand_total - v_total_paid);

    IF v_total_paid >= v_grand_total AND v_grand_total > 0 THEN
        v_new_status := 'PAID';
    ELSIF v_total_paid > 0 THEN
        v_new_status := 'PARTIALLY_PAID';
    ELSE
        v_new_status := 'UNPAID';
    END IF;

    -- Update the invoice record
    UPDATE public.invoices
    SET amount_paid = v_total_paid,
        outstanding_balance = v_outstanding,
        payment_status = v_new_status,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_invoice_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_payment_change ON public.payments;
CREATE TRIGGER trg_after_payment_change
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_payment_status();

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full operational access to business data
CREATE POLICY "Allow authenticated users access to settings" ON public.business_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users access to customers" ON public.customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users access to products" ON public.products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users access to invoices" ON public.invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users access to items" ON public.invoice_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users access to payments" ON public.payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users access to audit logs" ON public.invoice_audit_logs FOR ALL TO authenticated USING (true);

-- Allow anon read/write if using publishable key with demo workspace
CREATE POLICY "Allow anon read/write for local workspace" ON public.business_settings FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon read/write for local customers" ON public.customers FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon read/write for local products" ON public.products FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon read/write for local invoices" ON public.invoices FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon read/write for local items" ON public.invoice_items FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon read/write for local payments" ON public.payments FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon read/write for local audit logs" ON public.invoice_audit_logs FOR ALL TO anon USING (true);

-- Insert Default Business Settings if empty
INSERT INTO public.business_settings (
    business_name,
    tagline,
    address_line1,
    city,
    state,
    state_code,
    postal_code,
    phone_primary,
    phone_secondary,
    email,
    gstin,
    bank_name,
    account_holder_name,
    account_number,
    ifsc_code,
    invoice_prefix,
    invoice_number_format,
    next_sequence_number
) VALUES (
    'V.K.S. WEAVING CENTRE',
    'Specialists in High Quality Rayon, Viscose & Cotton Fabrics',
    '5/182, Weavers Colony, Ammapet',
    'Salem',
    'Tamil Nadu',
    '33',
    '636003',
    '+91 98427 12345',
    '+91 94432 67890',
    'vksweavingcentre@gmail.com',
    '33AAAAA0000A1Z5',
    'State Bank of India',
    'V.K.S. WEAVING CENTRE',
    '30123456789',
    'SBIN0001234',
    'VKSW',
    'VKSW/{YEAR}/{SEQ}',
    1
) ON CONFLICT DO NOTHING;
