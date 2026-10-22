import React, { useState } from 'react';
import { Customer, Invoice } from '../../types';
import {
  Users,
  Plus,
  Search,
  Edit,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle,
  X,
  Check,
  Trash2,
} from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  invoices: Invoice[];
  onSaveCustomer: (customer: Partial<Customer>) => Promise<void>;
  onDeleteCustomer?: (id: string) => Promise<void>;
  onViewInvoice: (invoice: Invoice) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  invoices,
  onSaveCustomer,
  onDeleteCustomer,
  onViewInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(
    null
  );

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openAddModal = () => {
    setEditingCustomer(null);
    setCustomerName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setGstin('');
    setPan('');
    setBillingAddress('');
    setShippingAddress('');
    setCity('');
    setState('');
    setStateCode('');
    setPostalCode('');
    setNotes('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setCustomerName(c.customer_name);
    setContactPerson(c.contact_person || '');
    setPhone(c.phone);
    setEmail(c.email || '');
    setGstin(c.gstin || '');
    setPan(c.pan || '');
    setBillingAddress(c.billing_address);
    setShippingAddress(c.shipping_address || '');
    setCity(c.city);
    setState(c.state);
    setStateCode(c.state_code);
    setPostalCode(c.postal_code);
    setNotes(c.notes || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Customer / Business Name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Contact Phone number is required.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');
      await onSaveCustomer({
        id: editingCustomer?.id,
        customer_name: customerName.trim(),
        contact_person: contactPerson.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        gstin: gstin.trim().toUpperCase() || undefined,
        pan: pan.trim().toUpperCase() || undefined,
        billing_address: billingAddress.trim(),
        shipping_address: shippingAddress.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        state_code: stateCode.trim(),
        postal_code: postalCode.trim(),
        notes: notes.trim() || undefined,
        is_active: true,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save customer.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter customers by search
  const filteredCustomers = customers.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.customer_name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.gstin?.toLowerCase().includes(q)
    );
  });

  // Calculate customer statistics
  const getCustomerStats = (customerId: string) => {
    const custInvoices = invoices.filter(
      (i) => i.customer_id === customerId && i.invoice_status === 'FINALIZED'
    );
    const totalBilled = custInvoices.reduce((sum, i) => sum + Number(i.grand_total), 0);
    const totalOutstanding = custInvoices.reduce(
      (sum, i) => sum + Number(i.outstanding_balance),
      0
    );
    return {
      invoiceCount: custInvoices.length,
      totalBilled,
      totalOutstanding,
      custInvoices,
    };
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-white border border-[#E8DFDC] rounded-lg p-4 shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6C5D64]"
          />
          <input
            type="text"
            placeholder="Search customers, GSTIN, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF6F5] border border-[#E8DFDC] rounded text-[#30252A] placeholder-[#6C5D64] focus:outline-none focus:border-[#702C3B]"
          />
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded text-xs font-semibold shadow-sm transition-all focus:ring-2 focus:ring-[#D4AE77]"
        >
          <Plus size={15} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Customer Directory Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-[#E8DFDC] rounded-lg p-12 text-center shadow-subtle space-y-3">
          <Users size={36} className="mx-auto text-neutral-300" />
          <h3 className="font-bold text-sm text-[#30252A] font-serif">Customer Directory is Fresh &amp; Ready</h3>
          <p className="text-xs text-[#6C5D64] max-w-md mx-auto">
            All sample records have been removed. Add your official wholesale buyers, loom units, and textile traders.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded text-xs font-semibold shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>Add First Customer</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => {
            const stats = getCustomerStats(c.id);
            return (
              <div
                key={c.id}
                className="bg-white border border-[#E8DFDC] rounded-lg p-4 shadow-subtle flex flex-col justify-between space-y-3 hover:border-[#702C3B]/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-[#30252A] leading-tight">
                        {c.customer_name}
                      </h3>
                      {c.contact_person && (
                        <span className="text-[11px] text-[#6C5D64] block">
                          Attn: {c.contact_person}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1 rounded text-[#6C5D64] hover:text-[#702C3B] hover:bg-[#FAF6F5] transition-colors"
                        title="Edit Customer"
                      >
                        <Edit size={14} />
                      </button>
                      {onDeleteCustomer && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete customer "${c.customer_name}"?`)) {
                              onDeleteCustomer(c.id);
                            }
                          }}
                          className="p-1 rounded text-[#6C5D64] hover:text-[#B82A3A] hover:bg-[#FAF6F5] transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                <div className="mt-3 space-y-1 text-xs text-[#6C5D64]">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-[#702C3B]" />
                    <span>{c.phone}</span>
                  </div>
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-[#702C3B]" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-[#702C3B] flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {c.billing_address}
                      {c.city || c.postal_code ? ` (${[c.city, c.postal_code].filter(Boolean).join(' - ')})` : ''}
                    </span>
                  </div>
                  {c.gstin && (
                    <div className="pt-1 text-[11px] font-mono text-[#30252A]">
                      GSTIN: <strong>{c.gstin}</strong> (State: {c.state_code})
                    </div>
                  )}
                </div>
              </div>

              {/* Financial snapshot */}
              <div className="pt-3 border-t border-[#E8DFDC] bg-[#FAF6F5] -mx-4 -mb-4 p-3 rounded-b-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#6C5D64] uppercase font-semibold block">
                    Outstanding
                  </span>
                  <span className="font-mono font-bold text-[#B8741A] tabular-nums">
                    ₹{stats.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedCustomerForHistory(c)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#702C3B] hover:underline"
                >
                  <FileText size={13} />
                  <span>{stats.invoiceCount} Bills</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Customer Invoice History Drawer / Modal */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 z-50 bg-[#30252A]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dialog w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-[#E8DFDC]">
            <div className="p-4 border-b border-[#E8DFDC] bg-[#FAF6F5] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#30252A]">
                  Invoice History: {selectedCustomerForHistory.customer_name}
                </h3>
                <span className="text-xs text-[#6C5D64]">
                  GSTIN: {selectedCustomerForHistory.gstin || 'Unregistered'} • {selectedCustomerForHistory.city}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomerForHistory(null)}
                className="p-1 rounded text-[#6C5D64] hover:text-[#30252A]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {getCustomerStats(selectedCustomerForHistory.id).custInvoices.length === 0 ? (
                <p className="text-xs text-center py-8 text-[#6C5D64]">
                  No finalized invoices found for this customer.
                </p>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#FAF6F5] text-[#6C5D64] border-b border-[#E8DFDC]">
                      <th className="p-2 font-semibold uppercase text-[10px]">Invoice #</th>
                      <th className="p-2 font-semibold uppercase text-[10px]">Date</th>
                      <th className="p-2 font-semibold uppercase text-[10px] text-right">Amount</th>
                      <th className="p-2 font-semibold uppercase text-[10px] text-right">Balance</th>
                      <th className="p-2 font-semibold uppercase text-[10px] text-center">Status</th>
                      <th className="p-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFDC]">
                    {getCustomerStats(selectedCustomerForHistory.id).custInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#FAF6F5]/50">
                        <td className="p-2 font-mono font-bold text-[#30252A]">{inv.invoice_number}</td>
                        <td className="p-2 tabular-nums">{inv.invoice_date}</td>
                        <td className="p-2 text-right font-mono tabular-nums font-semibold">
                          ₹{Number(inv.grand_total).toFixed(2)}
                        </td>
                        <td className="p-2 text-right font-mono tabular-nums text-[#B8741A]">
                          ₹{Number(inv.outstanding_balance).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              inv.payment_status === 'PAID'
                                ? 'bg-[#EBF6F1] text-[#1E7B54]'
                                : 'bg-[#FCECEE] text-[#B82A3A]'
                            }`}
                          >
                            {inv.payment_status}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => {
                              setSelectedCustomerForHistory(null);
                              onViewInvoice(inv);
                            }}
                            className="text-[#702C3B] font-semibold hover:underline text-[11px]"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#30252A]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dialog w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-[#E8DFDC]">
            <div className="p-4 border-b border-[#E8DFDC] bg-[#FAF6F5] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#30252A] font-serif">
                {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-[#6C5D64] hover:text-[#30252A]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 p-5 overflow-y-auto space-y-3 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-[#FCECEE] border border-[#F4BEC5] text-[#B82A3A] rounded flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Murugan Textiles"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-medium focus:outline-none focus:border-[#702C3B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. P. Sengodan"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98424 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    GSTIN (15 Digits)
                  </label>
                  <input
                    type="text"
                    placeholder="33AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono uppercase focus:outline-none focus:border-[#702C3B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="accounts@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Billing Address *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Door No, Street, Colony..."
                  value={billingAddress}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBillingAddress(val);
                    if (!postalCode || postalCode === '636001') {
                      const pinMatch = val.match(/\b(6\d{5})\b/);
                      if (pinMatch) setPostalCode(pinMatch[1]);
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Shipping Address (if different)
                </label>
                <textarea
                  rows={2}
                  placeholder="Godown or delivery address..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Salem"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">PIN Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 637504"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Tamil Nadu"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#6C5D64] mb-1">State Code</label>
                  <input
                    type="text"
                    placeholder="33"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-[#E8DFDC] rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8DFDC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-[#E8DFDC] text-[#6C5D64] hover:bg-[#FAF6F5] rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded font-semibold transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
