import React, { useState, useEffect } from 'react';
import {
  Customer,
  Product,
  Invoice,
  InvoiceItem,
  BusinessSettings,
  ProductUnit,
} from '../../types';
import { calculateInvoiceTotals, round2 } from '../../utils/calculations';
import {
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Eye,
  Building,
  Truck,
  FileSpreadsheet,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

interface InvoiceFormProps {
  initialInvoice?: Invoice | null;
  customers: Customer[];
  products: Product[];
  settings: BusinessSettings;
  onSaveDraft: (invoice: Partial<Invoice>, openPreview?: boolean) => Promise<Invoice>;
  onFinalize: (invoiceId: string) => Promise<Invoice>;
  onCancel: () => void;
  onPreview: (invoice: Invoice) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  initialInvoice,
  customers,
  products,
  settings,
  onSaveDraft,
  onFinalize,
  onCancel,
  onPreview,
}) => {
  const isEditing = Boolean(initialInvoice);
  const isFinalized = initialInvoice?.invoice_status === 'FINALIZED';

  // Invoice header state
  const [invoiceDate, setInvoiceDate] = useState(
    initialInvoice?.invoice_date || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    initialInvoice?.due_date ||
    new Date(Date.now() + (settings.default_payment_terms_days || 30) * 86400000)
      .toISOString()
      .split('T')[0]
  );
  const [dcNumber, setDcNumber] = useState(initialInvoice?.dc_number || '');
  const [placeOfSupply, setPlaceOfSupply] = useState(
    initialInvoice?.place_of_supply || settings.default_place_of_supply || 'Tamil Nadu (33)'
  );
  const [isInterstate, setIsInterstate] = useState(
    initialInvoice?.is_interstate || false
  );

  // Customer state
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialInvoice?.customer_id || ''
  );
  const [customerName, setCustomerName] = useState(
    initialInvoice?.customer_snapshot.customer_name || ''
  );
  const [contactPerson, setContactPerson] = useState(
    initialInvoice?.customer_snapshot.contact_person || ''
  );
  const [phone, setPhone] = useState(initialInvoice?.customer_snapshot.phone || '');
  const [email, setEmail] = useState(initialInvoice?.customer_snapshot.email || '');
  const [gstin, setGstin] = useState(initialInvoice?.customer_snapshot.gstin || '');
  const [billingAddress, setBillingAddress] = useState(
    initialInvoice?.customer_snapshot.billing_address || ''
  );
  const [city, setCity] = useState(initialInvoice?.customer_snapshot.city || '');
  const [state, setState] = useState(initialInvoice?.customer_snapshot.state || 'Tamil Nadu');
  const [stateCode, setStateCode] = useState(
    initialInvoice?.customer_snapshot.state_code || '33'
  );
  const [postalCode, setPostalCode] = useState(
    initialInvoice?.customer_snapshot.postal_code || ''
  );

  // Shipping details
  const [sameAsBilling, setSameAsBilling] = useState(
    !initialInvoice ||
    initialInvoice.customer_snapshot.shipping_address ===
    initialInvoice.customer_snapshot.billing_address
  );
  const [shippingName, setShippingName] = useState(
    initialInvoice?.customer_snapshot.shipping_name || ''
  );
  const [shippingAddress, setShippingAddress] = useState(
    initialInvoice?.customer_snapshot.shipping_address || ''
  );

  // Transport details
  const [transportName, setTransportName] = useState(
    initialInvoice?.transport_name || ''
  );
  const [vehicleNumber, setVehicleNumber] = useState(
    initialInvoice?.vehicle_number || ''
  );
  const [lrNumber, setLrNumber] = useState(initialInvoice?.lr_number || '');
  const [transportDate, setTransportDate] = useState(
    initialInvoice?.transport_date || ''
  );

  // Line items
  const [items, setItems] = useState<Array<Partial<InvoiceItem>>>(
    initialInvoice?.items && initialInvoice.items.length > 0
      ? initialInvoice.items
      : [
        {
          id: `item-${Date.now()}-1`,
          serial_number: 1,
          item_name: '',
          hsn_sac: '5407',
          details: '',
          quantity: 1,
          unit: 'KG',
          unit_price: 0,
          discount_amount: 0,
          tax_rate: 5,
        },
      ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-detect interstate whenever customer state or stateCode changes
  useEffect(() => {
    const isDifferentState =
      stateCode !== '' &&
      settings.state_code !== '' &&
      stateCode.trim() !== settings.state_code.trim();
    setIsInterstate(isDifferentState);
  }, [stateCode, settings.state_code]);

  // When customer dropdown changes, populate billing & shipping fields
  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setCustomerName(found.customer_name);
      setContactPerson(found.contact_person || '');
      setPhone(found.phone);
      setEmail(found.email || '');
      setGstin(found.gstin || '');
      setBillingAddress(found.billing_address);
      setCity(found.city);
      setState(found.state);
      setStateCode(found.state_code);
      setPostalCode(found.postal_code);

      if (found.shipping_address) {
        setShippingAddress(found.shipping_address);
        setSameAsBilling(found.shipping_address === found.billing_address);
      } else {
        setShippingAddress(found.billing_address);
        setSameAsBilling(true);
      }
    }
  };

  // Add Item Row
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        serial_number: prev.length + 1,
        item_name: '',
        hsn_sac: '5407',
        details: '',
        quantity: 1,
        unit: 'KG',
        unit_price: 0,
        discount_amount: 0,
        tax_rate: 5,
      },
    ]);
  };

  // Select Product from catalogue for row
  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        product_id: prod.id,
        item_name: prod.name,
        hsn_sac: prod.hsn_sac,
        details: prod.description || '',
        unit: prod.unit,
        unit_price: prod.default_rate,
        tax_rate: prod.default_tax_rate,
      };
      return copy;
    });
  };

  // Update item field
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  // Remove item row
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Live Calculations
  const totals = calculateInvoiceTotals(items, isInterstate);

  // Construct payload
  const buildInvoicePayload = (): Partial<Invoice> => {
    const finalShippingAddress = sameAsBilling ? billingAddress : shippingAddress;
    const finalShippingName = sameAsBilling ? customerName : (shippingName || customerName);

    return {
      id: initialInvoice?.id,
      invoice_date: invoiceDate,
      due_date: dueDate,
      dc_number: dcNumber,
      place_of_supply: placeOfSupply,
      is_interstate: isInterstate,
      customer_id: selectedCustomerId || undefined,
      customer_snapshot: {
        customer_id: selectedCustomerId || undefined,
        customer_name: customerName,
        contact_person: contactPerson,
        phone,
        email,
        gstin,
        billing_address: billingAddress,
        shipping_name: finalShippingName,
        shipping_address: finalShippingAddress,
        city,
        state,
        state_code: stateCode,
        postal_code: postalCode,
      },
      transport_name: transportName,
      vehicle_number: vehicleNumber,
      lr_number: lrNumber,
      transport_date: transportDate,
      items: totals.calculatedItems,
      subtotal: totals.subtotal,
      discount_total: totals.discount_total,
      taxable_amount: totals.taxable_amount,
      cgst_total: totals.cgst_total,
      sgst_total: totals.sgst_total,
      igst_total: totals.igst_total,
      total_tax: totals.total_tax,
      round_off: totals.round_off,
      grand_total: totals.grand_total,
      amount_in_words: totals.amount_in_words,
    };
  };

  // Handle Save Draft
  const handleSave = async (openPreview: boolean = true) => {
    try {
      setIsSaving(true);
      setErrorMsg('');
      if (!customerName.trim()) {
        setErrorMsg('Please specify Customer Name before saving.');
        setIsSaving(false);
        return;
      }

      const payload = buildInvoicePayload();
      const saved = await onSaveDraft(payload, openPreview);
      return saved;
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save draft invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Finalize
  const handleFinalizeClick = async () => {
    setErrorMsg('');
    if (!customerName.trim()) {
      setErrorMsg('Please specify Customer Name before finalizing invoice.');
      return;
    }

    if (!items || items.length === 0 || !items.some((i) => i.item_name.trim())) {
      setErrorMsg('Please add at least one line item with description and quantity.');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to FINALIZE this invoice?\n\nFinalized invoices receive an official immutable invoice number and cannot be deleted.'
      )
    ) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');

      // First save draft state quietly without opening draft preview modal
      const payload = buildInvoicePayload();
      const saved = await onSaveDraft(payload, false);
      if (saved && saved.id) {
        await onFinalize(saved.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error finalizing invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  // Live preview handler
  const handlePreviewClick = () => {
    const payload = buildInvoicePayload();
    // Build temporary complete invoice object for preview
    const previewInvoice: Invoice = {
      ...payload,
      id: payload.id || 'preview-temp',
      invoice_number: initialInvoice?.invoice_number || null,
      invoice_status: initialInvoice?.invoice_status || 'DRAFT',
      payment_status: initialInvoice?.payment_status || 'UNPAID',
      amount_paid: initialInvoice?.amount_paid || 0,
      outstanding_balance: totals.grand_total,
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
      created_at: initialInvoice?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Invoice;

    onPreview(previewInvoice);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="bg-white border border-[#E8DFDC] rounded-lg p-4 shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 rounded hover:bg-[#FAF6F5] text-[#6C5D64] hover:text-[#30252A] transition-colors"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-base font-bold text-[#30252A] font-serif">
              {isEditing
                ? `Edit ${initialInvoice?.invoice_number ? initialInvoice.invoice_number : 'Draft'}`
                : 'Create Commercial Invoice'}
            </h2>
            <span className="text-[11px] text-[#6C5D64]">
              {isInterstate ? 'Inter-state Supply (IGST 5%)' : 'Intra-state Supply (CGST 2.5% + SGST 2.5%)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreviewClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8DFDC] hover:bg-[#FAF6F5] text-[#30252A] rounded text-xs font-medium transition-all"
          >
            <Eye size={15} className="text-[#702C3B]" />
            <span>Grayscale A4 Preview</span>
          </button>

          {!isFinalized && (
            <>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#702C3B] text-[#702C3B] hover:bg-[#FAF6F5] rounded text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Save size={15} />
                <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <button
                type="button"
                onClick={handleFinalizeClick}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded text-xs font-semibold shadow-sm transition-all disabled:opacity-50 focus:ring-2 focus:ring-[#D4AE77]"
              >
                <CheckCircle size={15} className="text-[#D4AE77]" />
                <span>Finalize &amp; Allocate Bill No</span>
              </button>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#FCECEE] border border-[#F4BEC5] text-[#B82A3A] rounded text-xs flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: 1. Invoice Basics, 2. Customer, 3. Shipping & Transport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Invoice Information */}
        <div className="bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E8DFDC] text-[#702C3B]">
            <FileSpreadsheet size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#30252A]">
              1. Invoice Information
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                disabled
                value={
                  initialInvoice?.invoice_number ||
                  `[Auto: ${settings.invoice_prefix}/${new Date().getFullYear()}/00${settings.next_sequence_number}]`
                }
                className="w-full px-3 py-1.5 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-[#6C5D64] font-mono font-medium text-xs cursor-not-allowed"
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Allocated upon finalization via transactional counter
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Delivery Challan (DC) #
                </label>
                <input
                  type="text"
                  placeholder="e.g. DC-2026-44"
                  value={dcNumber}
                  onChange={(e) => setDcNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Place of Supply
                </label>
                <input
                  type="text"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#E8DFDC] flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#6C5D64]">Tax Treatment:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[10px] ${isInterstate
                    ? 'bg-[#FDF6EC] text-[#B8741A] border border-[#F7DEB8]'
                    : 'bg-[#EBF6F1] text-[#1E7B54] border border-[#C1E6D6]'
                  }`}
              >
                {isInterstate ? 'IGST Applicable' : 'CGST + SGST Applicable'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Bill To (Customer Selection & Details) */}
        <div className="bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8DFDC] text-[#702C3B]">
            <div className="flex items-center gap-2">
              <Building size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#30252A]">
                2. Billed To (Customer)
              </h3>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                Select Existing Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
              >
                <option value="">-- Choose Customer or Enter Below --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name} ({c.city}, {c.state_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                Customer Name / Business *
              </label>
              <input
                type="text"
                placeholder="e.g. Sri Murugan Textiles"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] font-medium focus:outline-none focus:border-[#702C3B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  placeholder="+91 98424 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  placeholder="33AAACM4321A1Z2"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] font-mono focus:outline-none focus:border-[#702C3B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                Billing Address
              </label>
              <textarea
                rows={2}
                placeholder="Street address, colony, landmark..."
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-[#30252A] focus:outline-none focus:border-[#702C3B]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">State Code</label>
                <input
                  type="text"
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Shipping & Transportation */}
        <div className="bg-white border border-[#E8DFDC] rounded-lg p-5 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E8DFDC] text-[#702C3B]">
            <Truck size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#30252A]">
              3. Ship To &amp; Transportation
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="sameAsBilling"
                checked={sameAsBilling}
                onChange={(e) => setSameAsBilling(e.target.checked)}
                className="w-4 h-4 text-[#702C3B] rounded border-[#E8DFDC]"
              />
              <label htmlFor="sameAsBilling" className="text-xs font-semibold text-[#30252A]">
                Shipping address same as billing
              </label>
            </div>

            {!sameAsBilling && (
              <div className="space-y-2 p-2.5 bg-[#FAF6F5] rounded border border-[#E8DFDC]">
                <div>
                  <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">
                    Shipping Recipient / Consignee
                  </label>
                  <input
                    type="text"
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    placeholder="Consignee or Godown Name"
                    className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">
                    Delivery / Godown Address
                  </label>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Specific delivery godown location..."
                    className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#E8DFDC] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C5D64] block">
                Transport Logistics:
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">
                    Transport Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ARC Parcel Service"
                    value={transportName}
                    onChange={(e) => setTransportName(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    placeholder="TN 30 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">
                    L.R. / Consignment #
                  </label>
                  <input
                    type="text"
                    placeholder="LR-88912"
                    value={lrNumber}
                    onChange={(e) => setLrNumber(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">
                    L.R. Date
                  </label>
                  <input
                    type="date"
                    value={transportDate}
                    onChange={(e) => setTransportDate(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Line Items Table per Section 8 & 19 */}
      <div className="bg-white border border-[#E8DFDC] rounded-lg shadow-subtle p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DFDC]">
          <div>
            <h3 className="text-sm font-bold text-[#30252A] font-serif">Invoice Line Items</h3>
            <p className="text-[11px] text-[#6C5D64]">
              Rate multiplied by Weight (KG) or Units, live recalculations and discounts
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F5] hover:bg-[#E8DFDC] text-[#702C3B] border border-[#702C3B] rounded text-xs font-semibold transition-all"
          >
            <Plus size={15} />
            <span>Add Row</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF6F5] text-[#6C5D64] border-b border-[#E8DFDC]">
                <th className="py-2 px-2 text-center w-10 text-[10px] uppercase font-bold">#</th>
                <th className="py-2 px-2 w-72 text-[10px] uppercase font-bold">Item Description</th>
                <th className="py-2 px-2 w-28 text-[10px] uppercase font-bold">HSN/SAC</th>
                <th className="py-2 px-2 w-28 text-[10px] uppercase font-bold text-right">Qty / Wt</th>
                <th className="py-2 px-2 w-24 text-[10px] uppercase font-bold text-center">Unit</th>
                <th className="py-2 px-2 w-32 text-[10px] uppercase font-bold text-right">Rate (₹)</th>
                <th className="py-2 px-2 w-24 text-[10px] uppercase font-bold text-center">Tax %</th>
                <th className="py-2 px-2 w-32 text-[10px] uppercase font-bold text-right">Amount (₹)</th>
                <th className="py-2 px-2 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFDC]">
              {items.map((it, idx) => {
                const calculatedRow = totals.calculatedItems[idx];
                return (
                  <tr key={it.id || idx} className="hover:bg-[#FAF6F5]/40 transition-colors">
                    {/* Serial Number */}
                    <td className="py-2 px-2 text-center font-medium text-[#6C5D64]">
                      {idx + 1}
                    </td>

                    {/* Item Description & Product Selector */}
                    <td className="py-2 px-2">
                      <div className="space-y-1">
                        <select
                          className="w-full text-[11px] px-1.5 py-0.5 bg-[#FAF6F5] border border-[#E8DFDC] rounded text-[#6C5D64]"
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          defaultValue=""
                        >
                          <option value="">-- Choose from Catalogue --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (₹{p.default_rate}/{p.unit})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={it.item_name || ''}
                          onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                          placeholder="e.g. Viscose Rayon Fabric"
                          className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs font-semibold text-[#30252A] focus:border-[#702C3B]"
                        />
                      </div>
                    </td>

                    {/* HSN/SAC */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={it.hsn_sac || ''}
                        onChange={(e) => handleItemChange(idx, 'hsn_sac', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs font-mono text-center focus:border-[#702C3B]"
                      />
                    </td>

                    {/* Quantity / Weight */}
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.quantity ?? 1}
                        onChange={(e) =>
                          handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs text-right font-mono tabular-nums focus:border-[#702C3B]"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-2">
                      <select
                        value={it.unit || 'KG'}
                        onChange={(e) =>
                          handleItemChange(idx, 'unit', e.target.value as ProductUnit)
                        }
                        className="w-full px-1.5 py-1 bg-white border border-[#E8DFDC] rounded text-xs text-center"
                      >
                        <option value="KG">KG</option>
                        <option value="MTR">MTR</option>
                        <option value="PCS">PCS</option>
                        <option value="BOX">BOX</option>
                        <option value="ROLL">ROLL</option>
                      </select>
                    </td>

                    {/* Unit Rate */}
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.unit_price ?? 0}
                        onChange={(e) =>
                          handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs text-right font-mono tabular-nums focus:border-[#702C3B]"
                      />
                    </td>

                    {/* Tax Rate % */}
                    <td className="py-2 px-2">
                      <select
                        value={it.tax_rate ?? 5}
                        onChange={(e) =>
                          handleItemChange(idx, 'tax_rate', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-1.5 py-1 bg-white border border-[#E8DFDC] rounded text-xs text-center font-mono"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </td>

                    {/* Calculated Line Total */}
                    <td className="py-2 px-2 text-right font-mono font-bold text-[#30252A] tabular-nums">
                      ₹{calculatedRow?.line_total.toFixed(2) || '0.00'}
                    </td>

                    {/* Delete action */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        title="Remove row"
                        className="text-[#6C5D64] hover:text-[#B82A3A] disabled:opacity-30 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Calculations Box */}
        <div className="pt-4 border-t border-[#E8DFDC] flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="max-w-md space-y-2 text-xs text-[#6C5D64]">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#30252A] block">
              Calculated Amount in Words:
            </span>
            <p className="p-2.5 bg-[#FAF6F5] rounded border border-[#E8DFDC] font-medium text-[#30252A] italic">
              {totals.amount_in_words}
            </p>
            <p className="text-[11px]">
              Note: Rounding policy rounds the final bill amount to the nearest whole Indian Rupee (Round Off: ₹{totals.round_off.toFixed(2)}).
            </p>
          </div>

          <div className="w-full md:w-80 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#E8DFDC]">
              <span className="text-[#6C5D64]">Items Subtotal:</span>
              <span className="font-mono tabular-nums font-semibold text-[#30252A]">
                ₹{totals.subtotal.toFixed(2)}
              </span>
            </div>

            {totals.discount_total > 0 && (
              <div className="flex justify-between py-1 border-b border-[#E8DFDC] text-[#B82A3A]">
                <span>Total Discount:</span>
                <span className="font-mono tabular-nums">-₹{totals.discount_total.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-[#E8DFDC]">
              <span className="text-[#6C5D64]">Taxable Amount:</span>
              <span className="font-mono tabular-nums font-semibold text-[#30252A]">
                ₹{totals.taxable_amount.toFixed(2)}
              </span>
            </div>

            {!isInterstate ? (
              <>
                <div className="flex justify-between py-1 border-b border-[#E8DFDC]">
                  <span className="text-[#6C5D64]">Central GST (CGST 2.5%):</span>
                  <span className="font-mono tabular-nums text-[#30252A]">
                    ₹{totals.cgst_total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E8DFDC]">
                  <span className="text-[#6C5D64]">State GST (SGST 2.5%):</span>
                  <span className="font-mono tabular-nums text-[#30252A]">
                    ₹{totals.sgst_total.toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between py-1 border-b border-[#E8DFDC]">
                <span className="text-[#6C5D64]">Integrated GST (IGST 5%):</span>
                <span className="font-mono tabular-nums text-[#30252A]">
                  ₹{totals.igst_total.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-[#E8DFDC]">
              <span className="text-[#6C5D64]">Round Off:</span>
              <span className="font-mono tabular-nums text-[#30252A]">
                {totals.round_off >= 0 ? `+₹${totals.round_off.toFixed(2)}` : `-₹${Math.abs(totals.round_off).toFixed(2)}`}
              </span>
            </div>

            <div className="flex justify-between py-2.5 px-3 bg-[#702C3B] text-white rounded font-bold text-sm shadow-sm">
              <span className="uppercase tracking-wider">Final Invoice Total:</span>
              <span className="font-mono tracking-tight tabular-nums">
                ₹{totals.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Bottom Action Controls */}
            <div className="pt-3 flex flex-col gap-2">
              {errorMsg && (
                <div className="p-2 bg-[#FCECEE] border border-[#F4BEC5] text-[#B82A3A] rounded text-[11px] flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handlePreviewClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8DFDC] hover:bg-[#FAF6F5] text-[#30252A] rounded text-xs font-medium transition-all"
                >
                  <Eye size={14} className="text-[#702C3B]" />
                  <span>Preview A4</span>
                </button>

                {!isFinalized && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSave(true)}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#702C3B] text-[#702C3B] hover:bg-[#FAF6F5] rounded text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      <Save size={14} />
                      <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFinalizeClick}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded text-xs font-semibold shadow-sm transition-all disabled:opacity-50 focus:ring-2 focus:ring-[#D4AE77]"
                    >
                      <CheckCircle size={14} className="text-[#D4AE77]" />
                      <span>Finalize &amp; Allocate Bill No</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
