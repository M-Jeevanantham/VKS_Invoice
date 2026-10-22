import React, { useState } from 'react';
import { Product, ProductUnit } from '../../types';
import {
  Package,
  Plus,
  Search,
  Edit,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  Tag,
  Trash2,
} from 'lucide-react';

interface ProductListProps {
  products: Product[];
  onSaveProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hsnSac, setHsnSac] = useState('5407');
  const [unit, setUnit] = useState<ProductUnit>('KG');
  const [defaultRate, setDefaultRate] = useState<number>(500);
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(5);
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setHsnSac('5407');
    setUnit('KG');
    setDefaultRate(500);
    setDefaultTaxRate(5);
    setIsActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setHsnSac(p.hsn_sac);
    setUnit(p.unit);
    setDefaultRate(p.default_rate);
    setDefaultTaxRate(p.default_tax_rate);
    setIsActive(p.is_active ?? true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Product / Item Name is required.');
      return;
    }
    if (!hsnSac.trim()) {
      setErrorMsg('HSN / SAC Code is required.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');
      await onSaveProduct({
        id: editingProduct?.id,
        name: name.trim(),
        description: description.trim() || undefined,
        hsn_sac: hsnSac.trim(),
        unit,
        default_rate: Number(defaultRate) || 0,
        default_tax_rate: Number(defaultTaxRate) || 5,
        is_active: isActive,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.hsn_sac.includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

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
            placeholder="Search items, HSN code, fabrics..."
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
          <span>Add Catalogue Item</span>
        </button>
      </div>

      {/* Products Table or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-[#E8DFDC] rounded-lg p-12 text-center shadow-subtle space-y-3">
          <Package size={36} className="mx-auto text-neutral-300" />
          <h3 className="font-bold text-sm text-[#30252A] font-serif">Product Catalogue is Fresh &amp; Ready</h3>
          <p className="text-xs text-[#6C5D64] max-w-md mx-auto">
            All sample records have been removed. Add your yarn counts, fabrics, and woven textile catalogue items.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#702C3B] hover:bg-[#5C222E] text-white rounded text-xs font-semibold shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>Add First Catalogue Item</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#E8DFDC] rounded-lg shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F5] text-[#6C5D64] border-b border-[#E8DFDC]">
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider">
                    Product / Fabric Name
                  </th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-center">
                    HSN/SAC
                  </th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-center">
                    Standard Unit
                  </th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-right">
                    Default Rate (₹)
                  </th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-center">
                    GST Rate
                  </th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-center">
                    Status
                  </th>
                  <th className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFDC]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF6F5]/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#30252A]">{p.name}</div>
                      {p.description && (
                        <span className="text-[11px] text-[#6C5D64] line-clamp-1">
                          {p.description}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-[#30252A]">
                      {p.hsn_sac}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-[#FAF6F5] border border-[#E8DFDC] font-medium text-[11px]">
                        {p.unit}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#30252A]">
                      ₹{Number(p.default_rate).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-[#6C5D64]">
                      {p.default_tax_rate}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {p.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#1E7B54] font-medium">
                          <CheckCircle size={13} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#6C5D64] font-medium">
                          <XCircle size={13} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1 rounded text-[#702C3B] hover:bg-[#FAF6F5] transition-colors"
                          title="Edit Product"
                        >
                          <Edit size={15} />
                        </button>
                        {onDeleteProduct && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete product "${p.name}"?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1 rounded text-[#6C5D64] hover:text-[#B82A3A] hover:bg-[#FAF6F5] transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#30252A]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dialog w-full max-w-lg flex flex-col overflow-hidden border border-[#E8DFDC]">
            <div className="p-4 border-b border-[#E8DFDC] bg-[#FAF6F5] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#30252A] font-serif">
                {editingProduct ? 'Edit Catalogue Item' : 'New Catalogue Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-[#6C5D64] hover:text-[#30252A]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-[#FCECEE] border border-[#F4BEC5] text-[#B82A3A] rounded flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Product / Fabric Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Viscose Spun Yarn - 40s Count"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-medium focus:outline-none focus:border-[#702C3B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                  Description / Specification
                </label>
                <input
                  type="text"
                  placeholder="e.g. Warp cones, weave specification 30x30 / 68x64"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    HSN / SAC Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="5407"
                    value={hsnSac}
                    onChange={(e) => setHsnSac(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono focus:outline-none focus:border-[#702C3B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Default Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as ProductUnit)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs focus:outline-none focus:border-[#702C3B]"
                  >
                    <option value="KG">Kilograms (KG)</option>
                    <option value="MTR">Meters (MTR)</option>
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="BOX">Boxes (BOX)</option>
                    <option value="ROLL">Rolls (ROLL)</option>
                    <option value="ENDS">Ends / Warp Ends (ENDS)</option>
                    <option value="ENS">Ends / Warp Ends (ENS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Default Unit Rate (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={defaultRate}
                    onChange={(e) => setDefaultRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono tabular-nums focus:outline-none focus:border-[#702C3B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6C5D64] mb-1">
                    Default GST Rate (%)
                  </label>
                  <select
                    value={defaultTaxRate}
                    onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E8DFDC] rounded text-xs font-mono focus:outline-none focus:border-[#702C3B]"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Standard Textile)</option>
                    <option value={12}>12% (Packaging / Synthetic)</option>
                    <option value={18}>18%</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#702C3B] rounded border-[#E8DFDC]"
                />
                <label htmlFor="isActive" className="text-xs font-medium text-[#30252A]">
                  Active in catalogue for invoice selection
                </label>
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
                  {isSaving ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
