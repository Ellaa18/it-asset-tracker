import React, { useEffect, useState } from 'react';
import './App.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Correct import

function App() {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', owner: '', status: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [sortField, setSortField] = useState('id');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/assets')
      .then(res => res.json())
      .then(setAssets)
      .catch(err => console.error(err));
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (isEditing) {
      fetch(`http://localhost:5000/assets/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
        .then(res => res.json())
        .then(updatedAsset => {
          setAssets(assets.map(asset => (asset.id === updatedAsset.id ? updatedAsset : asset)));
          setForm({ id: null, name: '', owner: '', status: '' });
          setIsEditing(false);
        });
    } else {
      fetch('http://localhost:5000/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
        .then(res => res.json())
        .then(data => {
          setAssets([...assets, data]);
          setForm({ id: null, name: '', owner: '', status: '' });
        });
    }
  };

  const handleDelete = id => {
    fetch(`http://localhost:5000/assets/${id}`, {
      method: 'DELETE',
    }).then(() => {
      setAssets(assets.filter(a => a.id !== id));
    });
  };

  const handleEdit = asset => {
    setForm(asset);
    setIsEditing(true);
  };

  const sortedFilteredAssets = assets
    .filter(asset =>
      asset[searchField].toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="container">
      <h1>IT Asset Tracker</h1>

      <form onSubmit={handleSubmit}>
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
        <button type="submit">{isEditing ? 'Update' : 'Add'} Asset</button>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setForm({ id: null, name: '', owner: '', status: '' });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Search & Sort Controls */}
      <div style={{ marginTop: '20px', marginBottom: '10px' }}>
        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          style={{ marginRight: '10px', padding: '8px' }}
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
          style={{ marginRight: '10px', padding: '8px', width: '40%' }}
        />

        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="id">Sort by ID</option>
          <option value="name">Sort by Name</option>
          <option value="owner">Sort by Owner</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      <button onClick={generatePDF} style={{ marginBottom: '10px' }}>
        Generate PDF
      </button>

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
                  <button onClick={() => handleEdit(asset)}>Edit</button>{' '}
                  <button onClick={() => handleDelete(asset.id)} className="delete-btn">
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
