const prisma = require('../utils/prisma');

const getAllVendors = async (req, res, next) => {
  try {
    const { campusId } = req.query;

    const where = {};
    if (campusId && typeof campusId === 'string' && campusId.trim() !== '') {
      where.campusId = campusId.trim();
    }

    const vendors = await prisma.vendor.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        phone: true,
        email: true,
        campusId: true,
        createdAt: true,
        updatedAt: true,
        campus: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    next(error);
  }
};

const getVendorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        phone: true,
        email: true,
        campusId: true,
        createdAt: true,
        updatedAt: true,
        campus: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        products: {
          where: { isAvailable: true },
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            category: true,
            isAvailable: true,
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
      data: vendor,
    });
  } catch (error) {
    next(error);
  }
};

const getVendorProducts = async (req, res, next) => {
  try {
    const { vendorId } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    const products = await prisma.product.findMany({
      where: {
        vendorId,
        isAvailable: true,
      },
      select: {
        id: true,
        vendorId: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        category: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVendors,
  getVendorById,
  getVendorProducts,
};
