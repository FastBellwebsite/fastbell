const prisma = require('../utils/prisma');

const mapProduct = (product) => {
  const store = product.store;
  const category = product.category;
  const stockQuantity = Number(product.stockQuantity ?? 0);
  const rawAvailable = Boolean(product.isAvailable);

  return {
    id: product.id,
    storeId: product.storeId,
    vendorId: store?.vendorId || null,
    campusId: store?.campusId || null,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    originalPrice:
      product.originalPrice !== null
        ? Number(product.originalPrice)
        : null,
    imageUrl: product.imageUrl,
    image: product.imageUrl,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold !== undefined ? product.lowStockThreshold : 5,
    trackInventory: product.trackInventory !== false,
    stockStatus: product.trackInventory === false
      ? 'SERVICE'
      : stockQuantity <= 0
      ? 'OUT_OF_STOCK'
      : stockQuantity <= (product.lowStockThreshold !== undefined ? product.lowStockThreshold : 5)
      ? 'LOW_STOCK'
      : 'IN_STOCK',
    categoryId: product.categoryId,
    category: category?.slug || category?.name || null,
    isAvailable: rawAvailable,
    available: rawAvailable,
    store: store
      ? {
          id: store.id,
          name: store.name,
          vendorId: store.vendorId,
          campusId: store.campusId,
          categoryId: store.categoryId,
          category:
            store.category?.slug ||
            store.category?.name ||
            null,
          locationLabel: store.locationLabel,
          rating: store.rating,
          distanceFromCampus: store.distanceFromCampus,
          deliveryMinutes: store.deliveryMinutes,
          imageUrl: store.imageUrl,
          isOpen: store.isOpen,
        }
      : null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const getAllProducts = async (req, res, next) => {
  try {
    const {
      campusId,
      vendorId,
      storeId,
      category,
      categoryId,
      search,
      isAvailable,
    } = req.query;

    const where = {};

    if (isAvailable === 'all') {
      // Return all products (used by admin and vendor management views)
    } else if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true' || isAvailable === true;
    } else {
      // Default to available products only for public catalog and student browsing
      where.isAvailable = true;
    }

    if (storeId && typeof storeId === 'string') {
      where.storeId = storeId.trim();
    }

    if (vendorId && typeof vendorId === 'string') {
      const vendorTrimmed = vendorId.trim();
      where.store = {
        ...(where.store || {}),
        OR: [
          { vendorId: vendorTrimmed },
          { vendor: { userId: vendorTrimmed } },
        ],
      };
    }

    if (campusId && typeof campusId === 'string') {
      where.store = {
        ...(where.store || {}),
        campusId: campusId.trim(),
      };
    }

    if (categoryId && typeof categoryId === 'string') {
      where.categoryId = categoryId.trim();
    }

    if (
      category &&
      typeof category === 'string' &&
      category.trim() !== ''
    ) {
      const categoryValue = category.trim();

      where.category = {
        OR: [
          { id: categoryValue },
          { slug: categoryValue },
          { name: categoryValue },
        ],
      };
    }

    if (
      search &&
      typeof search === 'string' &&
      search.trim() !== ''
    ) {
      const term = search.trim();

      where.OR = [
        {
          name: {
            contains: term,
          },
        },
        {
          description: {
            contains: term,
          },
        },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        store: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: products.map(mapProduct),
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        store: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: mapProduct(product),
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      price,
      originalPrice,
      categoryId,
      category,
      storeId,
      description,
      imageUrl,
      stockQuantity,
      lowStockThreshold,
      trackInventory,
      isAvailable,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required.',
      });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid positive price is required.',
      });
    }

    // Resolve target store
    let targetStoreId = storeId;
    const userRole = req.user.role;

    if (userRole === 'VENDOR') {
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: req.user.id },
        include: { stores: true },
      });

      if (!vendorProfile) {
        return res.status(403).json({
          success: false,
          message: 'Vendor profile not found.',
        });
      }

      if (!targetStoreId && vendorProfile.stores.length > 0) {
        targetStoreId = vendorProfile.stores[0].id;
      }

      if (!targetStoreId) {
        return res.status(400).json({
          success: false,
          message: 'A valid storeId is required for product creation.',
        });
      }

      const storeBelongsToVendor = vendorProfile.stores.some(
        (s) => s.id === targetStoreId
      );

      if (!storeBelongsToVendor) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only add products to your own store.',
        });
      }
    } else if (userRole === 'ADMIN') {
      if (!targetStoreId) {
        return res.status(400).json({
          success: false,
          message: 'storeId is required.',
        });
      }

      const existingStore = await prisma.store.findUnique({
        where: { id: targetStoreId },
      });

      if (!existingStore) {
        return res.status(404).json({
          success: false,
          message: 'Target store does not exist.',
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only vendors or administrators can create products.',
      });
    }

    // Resolve Category
    const catIdentifier = categoryId || category;
    let targetCategory = null;

    if (catIdentifier) {
      targetCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { id: String(catIdentifier) },
            { slug: String(catIdentifier) },
          ],
        },
      });
    }

    if (!targetCategory) {
      targetCategory = await prisma.category.findFirst({
        where: { isActive: true },
      });
    }

    if (!targetCategory) {
      return res.status(400).json({
        success: false,
        message: 'No valid category found.',
      });
    }

    const created = await prisma.product.create({
      data: {
        name: name.trim(),
        price: numericPrice,
        originalPrice:
          originalPrice !== undefined && originalPrice !== null
            ? Number(originalPrice)
            : null,
        description: description ? String(description).trim() : null,
        imageUrl: imageUrl || null,
        stockQuantity:
          stockQuantity != null ? Math.max(0, parseInt(stockQuantity, 10) || 0) : 50,
        lowStockThreshold:
          lowStockThreshold != null ? Math.max(0, parseInt(lowStockThreshold, 10) || 0) : 5,
        trackInventory:
          targetCategory?.slug === 'laundry' || targetCategory?.id === 'cat-laundry'
            ? false
            : trackInventory !== undefined ? Boolean(trackInventory) : true,
        isAvailable: isAvailable !== false,
        storeId: targetStoreId,
        categoryId: targetCategory.id,
      },
      include: {
        category: true,
        store: {
          include: {
            category: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: mapProduct(created),
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      originalPrice,
      categoryId,
      category,
      description,
      imageUrl,
      stockQuantity,
      lowStockThreshold,
      trackInventory,
      isAvailable,
    } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Authorization & Ownership Verification
    const userRole = req.user.role;
    if (userRole === 'VENDOR') {
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (
        !vendorProfile ||
        product.store.vendorId !== vendorProfile.id
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only modify your own store products.',
        });
      }
    } else if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Administrator or vendor privileges required.',
      });
    }

    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Product name cannot be empty.',
        });
      }
      updateData.name = name.trim();
    }

    if (price !== undefined) {
      const num = Number(price);
      if (!Number.isFinite(num) || num <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a valid positive number.',
        });
      }
      updateData.price = num;
    }

    if (originalPrice !== undefined) {
      updateData.originalPrice =
        originalPrice !== null ? Number(originalPrice) : null;
    }

    if (description !== undefined) {
      updateData.description =
        description !== null ? String(description).trim() : null;
    }

    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl || null;
    }

    if (stockQuantity !== undefined) {
      const qty = parseInt(stockQuantity, 10);
      updateData.stockQuantity = Number.isInteger(qty) && qty >= 0 ? qty : 0;
    }

    if (lowStockThreshold !== undefined) {
      const thresh = parseInt(lowStockThreshold, 10);
      updateData.lowStockThreshold = Number.isInteger(thresh) && thresh >= 0 ? thresh : 5;
    }

    if (trackInventory !== undefined) {
      updateData.trackInventory = Boolean(trackInventory);
    }

    // Availability respects vendor intent: only updated when explicitly provided
    if (isAvailable !== undefined) {
      updateData.isAvailable = Boolean(isAvailable);
    }

    const catIdentifier = categoryId || category;
    if (catIdentifier) {
      const targetCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { id: String(catIdentifier) },
            { slug: String(catIdentifier) },
          ],
        },
      });

      if (targetCategory) {
        updateData.categoryId = targetCategory.id;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        store: {
          include: {
            category: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: mapProduct(updated),
    });
  } catch (error) {
    next(error);
  }
};

const updateProductAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Ownership Verification
    const userRole = req.user.role;
    if (userRole === 'VENDOR') {
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (
        !vendorProfile ||
        product.store.vendorId !== vendorProfile.id
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only modify your own store products.',
        });
      }
    } else if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Administrator or vendor privileges required.',
      });
    }

    const nextState =
      isAvailable !== undefined
        ? Boolean(isAvailable)
        : !product.isAvailable;

    const updated = await prisma.product.update({
      where: { id },
      data: { isAvailable: nextState },
      include: {
        category: true,
        store: {
          include: {
            category: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Product availability updated to ${nextState ? 'available' : 'unavailable'}.`,
      data: mapProduct(updated),
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Ownership Verification
    const userRole = req.user.role;
    if (userRole === 'VENDOR') {
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (
        !vendorProfile ||
        product.store.vendorId !== vendorProfile.id
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only delete your own store products.',
        });
      }
    } else if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Administrator or vendor privileges required.',
      });
    }

    // Preserve Order History: Check if any OrderItem exists for this product
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    // Delete active cart references regardless
    await prisma.cartItem.deleteMany({
      where: { productId: id },
    });

    if (orderItemsCount > 0) {
      // Soft-deactivate to protect order history integrity
      const deactivated = await prisma.product.update({
        where: { id },
        data: { isAvailable: false },
        include: {
          category: true,
          store: {
            include: {
              category: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Product has order history and was deactivated instead of deleted.',
        data: {
          ...mapProduct(deactivated),
          deactivated: true,
        },
      });
    }

    // No historical orders, safe to hard delete
    await prisma.product.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
      data: {
        id,
        deleted: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductAvailability,
  deleteProduct,
};
