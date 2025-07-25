const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

// GET all assets
router.get('/', assetController.getAssets);

// CREATE new asset
router.post('/', assetController.createAsset);

// UPDATE existing asset
router.put('/:id', assetController.updateAsset); // ✅ added update route

// DELETE asset
router.delete('/:id', assetController.deleteAsset);

module.exports = router;
