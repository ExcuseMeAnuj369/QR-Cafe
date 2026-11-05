import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { cn, formatCurrency } from '../../utils/cn';
import { Search, Plus, Edit2, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import type { MenuItem } from '../../types';

export function LiveMenu() {
  const { menu, setMenu, addToast, pushNotification } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<{
    name: string;
    category: string;
    price: number;
    stock: number;
    prep_minutes: number;
    station: string;
    is_veg: boolean;
  }>({
    name: '',
    category: 'Main',
    price: 250,
    stock: 20,
    prep_minutes: 15,
    station: 'Grill',
    is_veg: true,
  });

  const categories = ['all', ...Array.from(new Set(menu.map(m => m.category)))];

  const filtered = menu.filter(m => {
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.station.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(m => m.id));
    }
  };

  const handleBulkAvailability = (available: boolean) => {
    if (selectedIds.length === 0) return;
    setMenu(prev => prev.map(m => selectedIds.includes(m.id) ? { ...m, available, sold_out: !available } : m));
    addToast('success', `${selectedIds.length} items updated to ${available ? 'Available' : 'Unavailable'}`);
    pushNotification('sold_out_toggle', { count: selectedIds.length, available }, 'manager');
    setSelectedIds([]);
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const saveEdit = (id: string) => {
    setMenu(prev => prev.map(m => m.id === id ? { ...m, ...editForm } as MenuItem : m));
    setEditingId(null);
    addToast('success', 'Menu item updated');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    const item: MenuItem = {
      id: `m-${Date.now()}`,
      name: newItem.name,
      category: newItem.category,
      price: newItem.price,
      stock: newItem.stock,
      low_stock_threshold: 5,
      sold_out: newItem.stock === 0,
      available: newItem.stock > 0,
      prep_minutes: newItem.prep_minutes,
      station: newItem.station,
      spice_options: true,
      addons: [],
      allergens: [],
      is_veg: newItem.is_veg,
      is_jain: false,
    };
    setMenu(prev => [...prev, item]);
    pushNotification('menu_item_added', { name: item.name, price: item.price }, 'manager');
    addToast('success', `Added new menu item: ${item.name}`);
    setShowAddModal(false);
    setNewItem({ name: '', category: 'Main', price: 250, stock: 20, prep_minutes: 15, station: 'Grill', is_veg: true });
  };

  return (
    <div className="p-5 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-muted tracking-widest uppercase mb-1">Kitchen Desk</p>
          <h1 className="text-2xl font-bold tracking-tight">Live Menu & Ingredients</h1>
          <p className="text-sm text-muted mt-1">Manage preparation details, availability, and stock. Price is read-only for Kitchen.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-11 px-4 rounded-xl bg-accent text-black text-sm font-bold flex items-center gap-2 btn-press"
        >
          <Plus size={16} /> Add Menu Item
        </button>
      </div>

      {/* Controls & Bulk Actions */}
      <div className="card p-4 mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all min-h-[36px]',
                  categoryFilter === cat ? 'bg-accent text-black' : 'bg-surface2 text-muted hover:text-ink'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items or station..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface2 border border-line text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-accent/30 text-sm">
            <span className="font-semibold text-accent">{selectedIds.length} items selected</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAvailability(true)}
                className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold"
              >
                Mark All Available
              </button>
              <button
                onClick={() => handleBulkAvailability(false)}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold"
              >
                Mark All Sold-Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden border border-line">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface2 text-xs uppercase text-muted font-semibold border-b border-line">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-line"
                  />
                </th>
                <th className="p-3.5">Item Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Station</th>
                <th className="p-3.5">Price (Read-only)</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Prep Time</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map(item => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className={cn('hover:bg-surface2/50 transition-colors', item.sold_out && 'opacity-60')}>
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-line"
                      />
                    </td>
                    <td className="p-3.5 font-medium">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="h-9 px-2 rounded-lg bg-surface border border-line text-sm w-full"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={item.is_veg ? 'text-green-500' : 'text-red-500'}>
                            {item.is_veg ? '🟢' : '🔴'}
                          </span>
                          <span>{item.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-muted">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.category || ''}
                          onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                          className="h-9 px-2 rounded-lg bg-surface border border-line text-sm w-28"
                        />
                      ) : (
                        item.category
                      )}
                    </td>
                    <td className="p-3.5 text-muted">
                      {isEditing ? (
                        <select
                          value={editForm.station || ''}
                          onChange={e => setEditForm(prev => ({ ...prev, station: e.target.value }))}
                          className="h-9 px-2 rounded-lg bg-surface border border-line text-sm"
                        >
                          <option value="Grill">Grill</option>
                          <option value="Tandoor">Tandoor</option>
                          <option value="Fry">Fry</option>
                          <option value="Bar">Bar</option>
                          <option value="Dessert">Dessert</option>
                        </select>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-surface2 text-xs font-mono">{item.station}</span>
                      )}
                    </td>
                    <td className="p-3.5 font-semibold text-accent tabular">
                      {formatCurrency(item.price)}
                      <span className="text-[10px] text-muted ml-1.5">(Read-only)</span>
                    </td>
                    <td className="p-3.5">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.stock ?? 0}
                          onChange={e => setEditForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                          className="h-9 px-2 rounded-lg bg-surface border border-line text-sm w-20 text-center"
                        />
                      ) : (
                        <span className={cn('tabular font-semibold', item.stock <= 5 ? 'text-amber-400' : 'text-ink')}>
                          {item.stock} plates
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-muted">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.prep_minutes ?? 15}
                          onChange={e => setEditForm(prev => ({ ...prev, prep_minutes: parseInt(e.target.value) || 1 }))}
                          className="h-9 px-2 rounded-lg bg-surface border border-line text-sm w-20 text-center"
                        />
                      ) : (
                        `${item.prep_minutes} min`
                      )}
                    </td>
                    <td className="p-3.5">
                      {item.sold_out ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-bold border border-red-500/20">
                          Sold Out
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-bold border border-green-500/20">
                          Available
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => saveEdit(item.id)} className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-surface2 text-muted hover:text-ink">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(item)} className="p-2 rounded-lg hover:bg-surface2 text-muted hover:text-ink transition-colors">
                          <Edit2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="modal-enter bg-surface border border-line rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Add New Menu Item</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted font-semibold uppercase mb-1 block">Item Name</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
                  placeholder="e.g. Garlic Butter Naan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted font-semibold uppercase mb-1 block">Category</label>
                  <input
                    type="text"
                    required
                    value={newItem.category}
                    onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted font-semibold uppercase mb-1 block">Station</label>
                  <select
                    value={newItem.station}
                    onChange={e => setNewItem(prev => ({ ...prev, station: e.target.value }))}
                    className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm focus:border-accent focus:outline-none"
                  >
                    <option value="Grill">Grill</option>
                    <option value="Tandoor">Tandoor</option>
                    <option value="Fry">Fry</option>
                    <option value="Bar">Bar</option>
                    <option value="Dessert">Dessert</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted font-semibold uppercase mb-1 block">Price (₹)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newItem.price}
                    onChange={e => setNewItem(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm tabular focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted font-semibold uppercase mb-1 block">Initial Stock</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newItem.stock}
                    onChange={e => setNewItem(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm tabular focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted font-semibold uppercase mb-1 block">Prep (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={newItem.prep_minutes}
                    onChange={e => setNewItem(prev => ({ ...prev, prep_minutes: parseInt(e.target.value) || 1 }))}
                    className="w-full h-11 px-3 rounded-xl bg-surface2 border border-line text-sm tabular focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.is_veg}
                    onChange={e => setNewItem(prev => ({ ...prev, is_veg: e.target.checked }))}
                    className="rounded border-line w-4 h-4 text-accent"
                  />
                  <span>Vegetarian Dish</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11 rounded-xl border border-line text-sm font-medium btn-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-accent text-black font-bold text-sm btn-press"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
