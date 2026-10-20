const express = require('express');
const router = express.Router();
const fs = require('fs');
const prisma = require('../utils/prisma');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const {
  upload,
  validateImageContent,
  handleUploadErrors,
} = require('../middleware/uploadMiddleware');

// Helper to clean up file if ownership check fails
const cleanupFile = (file) => {
  if (file && file.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch {}
  }
};

/**
 * POST /api/uploads/product-image
 * Authenticated upload for vendor product images.
 * Validates role (VENDOR or ADMIN) and verifies product/store ownership if IDs provided.
 */
router.post(
  '/product-image',
  authMiddleware,
  requireRole('VENDOR', 'ADMIN'),
  handleUploadErrors(upload.single('image')),
  validateImageContent,
  async (req, res, next) => {
    try {
      const { productId, storeId } = req.body;
      const userRole = req.user.role;

      if (userRole === 'VENDOR') {
        const vendorProfile = await prisma.vendorProfile.findUnique({
          where: { userId: req.user.id },
          include: { stores: true },
        });

        if (!vendorProfile) {
          cleanupFile(req.file);
          return res.status(403).json({
            success: false,
            message: 'Vendor profile not found.',
          });
        }

        // If specific productId supplied, verify ownership
        if (productId) {
          const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { store: true },
          });

          if (!product) {
            cleanupFile(req.file);
            return res.status(404).json({
              success: false,
              message: 'Target product not found.',
            });
          }

          if (product.store.vendorId !== vendorProfile.id) {
            cleanupFile(req.file);
            return res.status(403).json({
              success: false,
              message: 'Access denied: You can only upload images for your own products.',
            });
          }
        }

        // If specific storeId supplied, verify store belongs to this vendor
        if (storeId) {
          const store = await prisma.store.findUnique({
            where: { id: storeId },
          });

          if (!store) {
            cleanupFile(req.file);
            return res.status(404).json({
              success: false,
              message: 'Target store not found.',
            });
          }

          if (store.vendorId !== vendorProfile.id) {
            cleanupFile(req.file);
            return res.status(403).json({
              success: false,
              message: 'Access denied: You can only upload images for your own stores.',
            });
          }
        }
      }

      const relativeUrl = `/uploads/${req.file.filename}`;

      return res.status(201).json({
        success: true,
        message: 'Product image uploaded successfully.',
        data: {
          imageUrl: relativeUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.verifiedMimeType,
        },
      });
    } catch (err) {
      cleanupFile(req.file);
      next(err);
    }
  }
);

/**
 * POST /api/uploads/store-image
 * Authenticated upload for store storefront images.
 * Validates role and store ownership if storeId is provided.
 */
router.post(
  '/store-image',
  authMiddleware,
  requireRole('VENDOR', 'ADMIN'),
  handleUploadErrors(upload.single('image')),
  validateImageContent,
  async (req, res, next) => {
    try {
      const { storeId } = req.body;
      const userRole = req.user.role;

      if (userRole === 'VENDOR' && storeId) {
        const vendorProfile = await prisma.vendorProfile.findUnique({
          where: { userId: req.user.id },
        });

        if (!vendorProfile) {
          cleanupFile(req.file);
          return res.status(403).json({
            success: false,
            message: 'Vendor profile not found.',
          });
        }

        const store = await prisma.store.findUnique({
          where: { id: storeId },
        });

        if (!store) {
          cleanupFile(req.file);
          return res.status(404).json({
            success: false,
            message: 'Target store not found.',
          });
        }

        if (store.vendorId !== vendorProfile.id) {
          cleanupFile(req.file);
          return res.status(403).json({
            success: false,
            message: 'Access denied: You can only upload images for your own stores.',
          });
        }
      }

      const relativeUrl = `/uploads/${req.file.filename}`;

      return res.status(201).json({
        success: true,
        message: 'Store image uploaded successfully.',
        data: {
          imageUrl: relativeUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.verifiedMimeType,
        },
      });
    } catch (err) {
      cleanupFile(req.file);
      next(err);
    }
  }
);

/**
 * POST /api/uploads
 * General authenticated image upload endpoint for FastBell
 */
router.post(
  '/',
  authMiddleware,
  requireRole('VENDOR', 'ADMIN'),
  handleUploadErrors(upload.single('image')),
  validateImageContent,
  async (req, res, next) => {
    try {
      const relativeUrl = `/uploads/${req.file.filename}`;
      return res.status(201).json({
        success: true,
        message: 'Image uploaded successfully.',
        data: {
          imageUrl: relativeUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.verifiedMimeType,
        },
      });
    } catch (err) {
      cleanupFile(req.file);
      next(err);
    }
  }
);

module.exports = router;
