const prisma = require('../utils/prisma');

const mapStore = (store) => ({
  id: store.id,
  vendorId: store.vendorId,
  campusId: store.campusId,
  name: store.name,
  categoryId: store.categoryId,
  category:
    store.category?.slug ||
    store.category?.name ||
    null,
  locationLabel: store.locationLabel,
  rating: store.rating,
  distanceFromCampus: store.distanceFromCampus,
  deliveryMinutes: store.deliveryMinutes,
  description: store.description,
  phone: store.phone,
  address: store.address,
  locality: store.locality,
  city: store.city,
  state: store.state,
  postalCode: store.postalCode,
  latitude: store.latitude,
  longitude: store.longitude,
  imageUrl: store.imageUrl,
  isOpen: store.isOpen,
  isActive: store.isActive,
  createdAt: store.createdAt,
  updatedAt: store.updatedAt,
});

const getAllVendors = async (req, res, next) => {
  try {
    const { campusId } = req.query;

    const where = {};

    if (
      campusId &&
      typeof campusId === 'string' &&
      campusId.trim() !== ''
    ) {
      where.campusId = campusId.trim();
    }

    const vendors = await prisma.vendorProfile.findMany({
      where,
      include: {
        user: true,
        campus: true,
        stores: {
          include: {
            category: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const data = vendors.map((vendor) => ({
      id: vendor.id,
      userId: vendor.userId,
      name: vendor.user?.name || null,
      email: vendor.user?.email || null,
      phone: vendor.user?.phone || null,
      campusId: vendor.campusId,
      verificationStatus: vendor.verificationStatus,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
      campus: vendor.campus
        ? {
            id: vendor.campus.id,
            name: vendor.campus.name,
            address: vendor.campus.address,
          }
        : null,
      stores: vendor.stores.map((store) => ({ ...mapStore(store),
          vendorId: vendor.userId || store.vendorId,
          vendorProfileId: store.vendorId, vendorId: vendor.userId || store.vendorId, vendorProfileId: store.vendorId })),
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getVendorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id },
      include: {
        user: true,
        campus: true,
        stores: {
          include: {
            category: true,
            products: {
              where: {
                isAvailable: true,
              },
              include: {
                category: true,
              },
              orderBy: {
                name: 'asc',
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: vendor.id,
        userId: vendor.userId,
        name: vendor.user?.name || null,
        email: vendor.user?.email || null,
        phone: vendor.user?.phone || null,
        campusId: vendor.campusId,
        verificationStatus: vendor.verificationStatus,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        campus: vendor.campus
          ? {
              id: vendor.campus.id,
              name: vendor.campus.name,
              address: vendor.campus.address,
            }
          : null,
        stores: vendor.stores.map((store) => ({
          ...mapStore(store),
          products: store.products.map((product) => ({
            id: product.id,
            storeId: product.storeId,
            vendorId: store.vendorId || vendor.id,
            campusId: store.campusId || null,
            categoryId: product.categoryId,
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
              : Number(product.stockQuantity ?? 0) <= 0
              ? 'OUT_OF_STOCK'
              : Number(product.stockQuantity ?? 0) <= (product.lowStockThreshold !== undefined ? product.lowStockThreshold : 5)
              ? 'LOW_STOCK'
              : 'IN_STOCK',
            category:
              product.category?.slug ||
              product.category?.name ||
              null,
            isAvailable: product.isAvailable,
            available: product.isAvailable,
          })),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getVendorProducts = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const { isAvailable } = req.query;

    const vendor = await prisma.vendorProfile.findFirst({
      where: {
        OR: [
          { id: vendorId },
          { userId: vendorId },
        ],
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    const where = {
      store: {
        vendorId: vendor.id,
      },
    };

    if (isAvailable !== undefined) {
      if (isAvailable !== 'all') {
        where.isAvailable = isAvailable === 'true' || isAvailable === true;
      }
    } else {
      where.isAvailable = true;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        store: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const data = products.map((product) => ({
      id: product.id,
      storeId: product.storeId,
      vendorId: product.store?.vendorId || vendorId,
      campusId: product.store?.campusId || null,
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
        : Number(product.stockQuantity ?? 0) <= 0
        ? 'OUT_OF_STOCK'
        : Number(product.stockQuantity ?? 0) <= (product.lowStockThreshold !== undefined ? product.lowStockThreshold : 5)
        ? 'LOW_STOCK'
        : 'IN_STOCK',
      categoryId: product.categoryId,
      category:
        product.category?.slug ||
        product.category?.name ||
        null,
      isAvailable: product.isAvailable,
      available: product.isAvailable,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getNearbyVendors = async (req, res, next) => {
  try {
    const { campusId, latitude, longitude, radiusKm = 6 } = req.query;

    const lat = Number(latitude);
    const lon = Number(longitude);
    const radius = Number(radiusKm);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude is required.',
      });
    }

    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        message: 'Valid longitude is required.',
      });
    }

    if (!Number.isFinite(radius) || radius <= 0 || radius > 100) {
      return res.status(400).json({
        success: false,
        message: 'Radius must be greater than 0 and at most 100 km.',
      });
    }

    const where = {
      isActive: true,
      isOpen: true,
      latitude: { not: null },
      longitude: { not: null },
      ...(campusId ? { campusId: String(campusId).trim() } : {}),
    };

    const stores = await prisma.store.findMany({
      where,
      include: {
        category: true,
        vendor: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const earthRadiusKm = 6371;

    const data = stores
      .map((store) => {
        const storeLat = Number(store.latitude);
        const storeLon = Number(store.longitude);

        const dLat = (storeLat - lat) * (Math.PI / 180);
        const dLon = (storeLon - lon) * (Math.PI / 180);

        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(lat * (Math.PI / 180)) *
            Math.cos(storeLat * (Math.PI / 180)) *
            Math.sin(dLon / 2) ** 2;

        const distanceKm =
          earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return {
          ...mapStore(store),
          vendorId: store.vendor?.userId || store.vendorId,
          vendorProfileId: store.vendorId,
          vendorName: store.vendor?.user?.name || null,
          distanceKm: Math.round(distanceKm * 100) / 100,
        };
      })
      .filter((store) => store.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      data,
      meta: {
        latitude: lat,
        longitude: lon,
        radiusKm: radius,
        count: data.length,
      },
    });
  } catch (error) {
    next(error);
  }
};


const updateStore = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { name, description, phone, imageUrl, isOpen, isActive } = req.body;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.',
      });
    }

    if (req.user.role === 'VENDOR') {
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!vendorProfile || store.vendorId !== vendorProfile.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only modify your own store.',
        });
      }
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Vendor or administrator privileges required.',
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (description !== undefined) updateData.description = description ? String(description).trim() : null;
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? String(imageUrl).trim() : null;
    if (isOpen !== undefined) updateData.isOpen = Boolean(isOpen);
    if (isActive !== undefined && req.user.role === 'ADMIN') updateData.isActive = Boolean(isActive);

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: updateData,
      include: { category: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Store updated successfully.',
      data: mapStore(updated),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateStore,
  getAllVendors,
  getVendorById,
  getVendorProducts,
  getNearbyVendors,
};