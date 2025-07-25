const db = require('../db/database');

// GET all assets
exports.getAssets = (req, res) => {
  db.all('SELECT * FROM assets', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// CREATE new asset
exports.createAsset = (req, res) => {
  const { name, owner, status } = req.body;
  if (!name || !owner || !status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  db.run(
    'INSERT INTO assets (name, owner, status) VALUES (?, ?, ?)',
    [name, owner, status],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, name, owner, status });
    }
  );
};

// UPDATE asset by ID
exports.updateAsset = (req, res) => {
  const { id } = req.params;
  const { name, owner, status } = req.body;

  if (!name || !owner || !status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  db.run(
    'UPDATE assets SET name = ?, owner = ?, status = ? WHERE id = ?',
    [name, owner, status, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Asset not found.' });
      }

      res.json({ id: parseInt(id), name, owner, status });
    }
  );
};

// DELETE asset by ID
exports.deleteAsset = (req, res) => {
  db.run('DELETE FROM assets WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    res.status(204).send();
  });
};
