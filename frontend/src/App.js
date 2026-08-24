import React, { useState } from 'react';
import './App.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Archive, Box, CheckCircle2, Download, Edit3, FileJson, Layers3, Plus, Trash2, Upload, X } from 'lucide-react';

function App() {
  const [assets, setAssets] = useState(() => {
    const savedAssets = localStorage.getItem('it-assets');
    try {
      return savedAssets ? JSON.parse(savedAssets) : [];
    } catch (error) {
      localStorage.removeItem('it-assets');
      return [];
    }
  });
  const [form, setForm] = useState({ id: null, name: '', owner: '', status: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [sortField, setSortField] = useState('id');
  const [statusFilter, setStatusFilter] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [notice, setNotice] = useState('');

  const saveAssets = nextAssets => {
    setAssets(nextAssets);
    localStorage.setItem('it-assets', JSON.stringify(nextAssets));
    setNotice('Saved just now');
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (isEditing) {
      saveAssets(assets.map(asset => (asset.id === form.id ? form : asset)));
      setForm({ id: null, name: '', owner: '', status: '' });
      setIsEditing(false);
    } else {
      const nextId = assets.reduce((highestId, asset) => Math.max(highestId, asset.id), 0) + 1;
      saveAssets([...assets, { ...form, id: nextId }]);
      setForm({ id: null, name: '', owner: '', status: '' });
    }
  };

  const handleDelete = id => {
    saveAssets(assets.filter(asset => asset.id !== id));
  };

  const handleEdit = asset => {
    setForm(asset);
    setIsEditing(true);
  };

  const sortedFilteredAssets = assets
    .filter(asset =>
      asset[searchField].toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!statusFilter || asset.status === statusFilter)
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
      }
      return aValue - bValue;
    });

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('IT Asset Report', 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['ID', 'Name', 'Owner', 'Status']],
      body: sortedFilteredAssets.map(asset => [
        asset.id,
        asset.name,
        asset.owner,
        asset.status,
      ]),
    });
    doc.save('it-assets.pdf');
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(assets, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'orbitops-assets.json';
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice('Backup downloaded');
  };

  const importJSON = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = loadEvent => {
      try {
        const importedAssets = JSON.parse(loadEvent.target.result);
        if (!Array.isArray(importedAssets) || importedAssets.some(asset => !asset.name || !asset.owner || !asset.status)) throw new Error('Invalid format');
        saveAssets(importedAssets.map(asset => ({ ...asset, id: Number(asset.id) })));
        setNotice(`${importedAssets.length} assets imported`);
      } catch (error) {
        setNotice('Import failed: choose a valid OrbitOps JSON backup');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSearchField('name');
  };

  return (
    <main className="app-shell">
      <header className="topbar"><div className="brand"><span className="brand-mark"><Layers3 size={20} /></span><span>Hermi<span className="brand-accent">Ela</span></span></div><div className="topbar-meta"><span className="status-dot" /> Local workspace <span className="avatar">IT</span></div></header>
      <div className="container">
      <section className="page-heading"><div><p className="eyebrow">OPERATIONS CONSOLE</p><h1>Asset inventory</h1><p className="subtitle">A clear view of every device, owner, and current state.</p></div><button className="button button-primary" onClick={() => document.querySelector('[name="name"]').focus()}><Plus size={17} /> Add asset</button></section>
      <section className="metrics-grid"><button className="metric metric-blue" onClick={clearFilters}><Box size={19} /><div><span>Total assets</span><strong>{assets.length}</strong><small>Show all</small></div></button><button className="metric metric-green" onClick={() => setStatusFilter('In Use')}><CheckCircle2 size={19} /><div><span>In use</span><strong>{assets.filter(asset => asset.status === 'In Use').length}</strong><small>Filter inventory</small></div></button><button className="metric metric-amber" onClick={() => setStatusFilter('Available')}><Archive size={19} /><div><span>Available</span><strong>{assets.filter(asset => asset.status === 'Available').length}</strong><small>Ready to assign</small></div></button><button className="metric metric-coral" onClick={() => setStatusFilter('In Repair')}><Box size={19} /><div><span>Attention</span><strong>{assets.filter(asset => ['In Repair', 'Damaged', 'Lost'].includes(asset.status)).length}</strong><small>Show repairs</small></div></button></section>

      <section className="workspace-panel"><div className="panel-heading"><div><h2>{isEditing ? 'Update asset' : 'Register an asset'}</h2><p>{isEditing ? 'Change the details and save your update.' : 'Add a device to keep your inventory current.'}</p></div></div><form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Asset Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="owner"
          placeholder="Owner"
          value={form.owner}
          onChange={handleChange}
          required
        />
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          required
        >
          <option value="">Select Status</option>
          <option value="In Use">In Use</option>
          <option value="Available">Available</option>
          <option value="In Repair">In Repair</option>
          <option value="Retired">Retired</option>
          <option value="Lost">Lost</option>
          <option value="Damaged">Damaged</option>
          <option value="Pending">Pending</option>
        </select>
        <button className="button button-primary" type="submit">{isEditing ? <><CheckCircle2 size={16} /> Save changes</> : <><Plus size={16} /> Add asset</>}</button>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setForm({ id: null, name: '', owner: '', status: '' });
            }}
          >
            <X size={16} /> Cancel
          </button>
        )}
      </form></section>

      {/* Search & Sort Controls */}
      <section className="workspace-panel inventory-panel"><div className="panel-heading"><div><h2>Inventory list</h2><p>Search, sort, and manage registered assets.</p></div><div className="panel-actions"><button className="button button-outline" onClick={exportJSON}><FileJson size={16} /> Backup</button><label className="button button-outline file-button"><Upload size={16} /> Import<input type="file" accept="application/json" onChange={importJSON} /></label><button className="button button-outline" onClick={generatePDF}><Download size={16} /> Export PDF</button></div></div><div className="toolbar">
        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          className="compact-select"
        >
          <option value="name">Search by Name</option>
          <option value="owner">Search by Owner</option>
          <option value="status">Search by Status</option>
        </select>

        <input
          type="text"
          placeholder={`Search ${searchField}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          className="compact-select"
        >
          <option value="id">Sort by ID</option>
          <option value="name">Sort by Name</option>
          <option value="owner">Sort by Owner</option>
          <option value="status">Sort by Status</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="compact-select"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="In Use">In Use</option>
          <option value="Available">Available</option>
          <option value="In Repair">In Repair</option>
          <option value="Retired">Retired</option>
          <option value="Lost">Lost</option>
          <option value="Damaged">Damaged</option>
          <option value="Pending">Pending</option>
        </select>
      </div>
      {(searchTerm || statusFilter) && <div className="active-filter"><span>Showing {sortedFilteredAssets.length} of {assets.length} assets</span><button onClick={clearFilters}><X size={14} /> Clear filters</button></div>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedFilteredAssets.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>
                No assets found.
              </td>
            </tr>
          ) : (
            sortedFilteredAssets.map(asset => (
              <tr key={asset.id}>
                <td>{asset.id}</td>
                <td>{asset.name}</td>
                <td>{asset.owner}</td>
                <td>{asset.status}</td>
                <td>
                  <button className="icon-button" title="Edit asset" aria-label={`Edit ${asset.name}`} onClick={() => handleEdit(asset)}><Edit3 size={16} /></button>{' '}
                  <button className="icon-button icon-danger" title="Delete asset" aria-label={`Delete ${asset.name}`} onClick={() => handleDelete(asset.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table></section>
      {notice && <p className="save-notice" role="status">{notice}</p>}
    </div></main>
  );
}

export default App;
