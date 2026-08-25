import React, { useRef, useState } from 'react';
import './App.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Archive, Box, CheckCircle2, Download, Edit3, FileJson, Layers3, Plus, Trash2, Upload, X } from 'lucide-react';

const statusOptions = ['In Use', 'Available', 'In Repair', 'Retired', 'Lost', 'Damaged', 'Pending'];

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
  const formRef = useRef(null);
  const inventoryRef = useRef(null);

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
      saveAssets(assets.map(asset => {
        if (asset.id !== form.id) return asset;
        const history = form.status !== asset.status
          ? [...(asset.history || []), { from: asset.status, to: form.status, at: new Date().toISOString() }]
          : asset.history || [];
        return { ...form, history };
      }));
      setForm({ id: null, name: '', owner: '', status: '' });
      setIsEditing(false);
    } else {
      const nextId = assets.reduce((highestId, asset) => Math.max(highestId, asset.id), 0) + 1;
      saveAssets([...assets, { ...form, id: nextId, history: [{ from: 'New', to: form.status, at: new Date().toISOString() }] }]);
      setForm({ id: null, name: '', owner: '', status: '' });
    }
  };

  const handleStatusChange = (asset, nextStatus) => {
    if (asset.status === nextStatus) return;
    saveAssets(assets.map(item => item.id === asset.id ? {
      ...item,
      status: nextStatus,
      history: [...(item.history || []), { from: item.status, to: nextStatus, at: new Date().toISOString() }],
    } : item));
  };

  const handleDelete = id => {
    saveAssets(assets.filter(asset => asset.id !== id));
  };

  const handleEdit = asset => {
    setForm(asset);
    setIsEditing(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      formRef.current?.querySelector('[name="name"]')?.focus();
    });
  };

  const sortedFilteredAssets = assets
    .filter(asset =>
      asset[searchField].toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!statusFilter || (statusFilter === 'attention'
        ? ['In Repair', 'Damaged', 'Lost'].includes(asset.status)
        : asset.status === statusFilter))
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

  const showStatus = filter => {
    setSearchTerm('');
    setStatusFilter(filter);
    requestAnimationFrame(() => inventoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <main className="app-shell">
      <header className="topbar"><div className="brand"><span className="brand-mark"><Layers3 size={20} /></span><span>Hermi<span className="brand-accent">Ela</span></span></div><div className="topbar-meta"><span className="status-dot" /> Local workspace <span className="avatar">IT</span></div></header>
      <div className="container">
      <section className="page-heading"><div><p className="eyebrow">CONTROL CENTER</p><h1>Equipment List</h1><p className="subtitle">A simple list showing every device, who owns it, and its current status.</p></div><button className="button button-primary" onClick={() => document.querySelector('[name="name"]').focus()}><Plus size={17} /> Add asset</button></section>
      <section className="metrics-grid"><button className="metric metric-blue" onClick={clearFilters}><Box size={19} /><div><span>Total assets</span><strong>{assets.length}</strong><small>Show all</small></div></button><button className="metric metric-green" onClick={() => showStatus('In Use')}><CheckCircle2 size={19} /><div><span>In use</span><strong>{assets.filter(asset => asset.status === 'In Use').length}</strong><small>View these assets</small></div></button><button className="metric metric-amber" onClick={() => showStatus('Available')}><Archive size={19} /><div><span>Available</span><strong>{assets.filter(asset => asset.status === 'Available').length}</strong><small>View these assets</small></div></button><button className="metric metric-coral" onClick={() => showStatus('attention')}><Box size={19} /><div><span>Attention</span><strong>{assets.filter(asset => ['In Repair', 'Damaged', 'Lost'].includes(asset.status)).length}</strong><small>View these assets</small></div></button></section>

      <section className="workspace-panel data-panel"><div className="panel-heading"><div><h2>Data protection</h2><p>Keep a portable copy of your inventory and restore it whenever you need.</p></div><FileJson className="data-panel-icon" size={25} /></div><div className="backup-grid"><div className="backup-card"><span className="backup-card-icon backup-download"><FileJson size={20} /></span><div><h3>Back up your data</h3><p>Download all asset records as a JSON file. Store it somewhere safe before switching devices.</p></div><button className="button button-primary" onClick={exportJSON}><Download size={16} /> Download backup</button></div><div className="backup-card"><span className="backup-card-icon backup-upload"><Upload size={20} /></span><div><h3>Restore from backup</h3><p>Choose your previous JSON backup to bring your asset records back into this browser.</p></div><label className="button button-outline file-button"><Upload size={16} /> Choose file<input type="file" accept="application/json" onChange={importJSON} /></label></div></div></section>

      <section className="workspace-panel" ref={formRef}><div className="panel-heading"><div><h2>{isEditing ? 'Update asset' : 'Register an asset'}</h2><p>{isEditing ? 'Change the details and save your update.' : 'Add a device to keep your inventory current.'}</p></div></div><div className="workflow-hint"><CheckCircle2 size={16} /> Change status directly in the inventory list as an asset moves through its lifecycle.</div><form onSubmit={handleSubmit}>
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
          {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
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
      <section className="workspace-panel inventory-panel" ref={inventoryRef}><div className="panel-heading"><div><h2>Inventory list</h2><p>Search, sort, and manage registered assets.</p></div><button className="button button-outline" onClick={generatePDF}><Download size={16} /> Export PDF</button></div><div className="toolbar">
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
          {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>
      {(searchTerm || statusFilter) && <div className="active-filter"><span>Showing {sortedFilteredAssets.length} of {assets.length} assets{statusFilter === 'attention' ? ' needing attention' : statusFilter ? ` with status ${statusFilter}` : ''}</span><button onClick={clearFilters}><X size={14} /> Clear filters</button></div>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Updates</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedFilteredAssets.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>
                No assets found.
              </td>
            </tr>
          ) : (
            sortedFilteredAssets.map(asset => (
              <tr key={asset.id}>
                <td>{asset.id}</td>
                <td>{asset.name}</td>
                <td>{asset.owner}</td>
                <td><select className="row-status" value={asset.status} aria-label={`Change status for ${asset.name}`} onChange={e => handleStatusChange(asset, e.target.value)}>{statusOptions.map(status => <option key={status} value={status}>{status}</option>)}</select></td>
                <td className="history-cell">{asset.history?.length || 0} change{(asset.history?.length || 0) === 1 ? '' : 's'}</td>
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
