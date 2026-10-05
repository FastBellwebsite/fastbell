const prisma = require('../utils/prisma');

const getAllProducts = async (req, res, next) => {
  try {
    const { campusId, vendorId, category, search, isAvailable } = req.query;

    const where = {};

    // Availability filter - default to true
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true' || isAvailable === true;
    } else {
      where.isAvailable = true;
    }

    // Vendor filter
    if (vendorId && typeof vendorId === 'string' && vendorId.trim() !== '') {
      where.vendorId = vendorId.trim();
    }

    // Category filter
    if (category && typeof category === 'string' && category.trim() !== '') {
      where.category = category.trim();
    }

    // Campus filter (via vendor relation)
    if (campusId && typeof campusId === 'string' && campusId.trim() !== '') {
      where.vendor = {
        campusId: campusId.trim(),
      };
    }

    // Search filter across name and description
    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { description: { contains: term } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
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
        vendor: {
          select: {
            id: true,
            name: true,
            campusId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
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

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
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
        vendor: {
          select: {
            id: true,
            name: true,
            campusId: true,
            phone: true,
            email: true,
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
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
};
