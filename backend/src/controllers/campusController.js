const prisma = require('../utils/prisma');

const getAllCampuses = async (req, res, next) => {
  try {
    const campuses = await prisma.campus.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json({
      success: true,
      data: campuses,
    });
  } catch (error) {
    next(error);
  }
};

const getCampusById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campus = await prisma.campus.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: campus,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCampuses,
  getCampusById,
};
