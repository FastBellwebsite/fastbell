const prisma = require('../utils/prisma');
const { hashPassword, comparePassword } = require('../utils/password');

const getCampusForUser = (user) => {
  const profile =
    user.studentProfile ||
    user.vendorProfile ||
    user.deliveryProfile;

  if (!profile || !profile.campus) {
    return null;
  }

  const campus = profile.campus;

  return {
    id: campus.id,
    name: campus.name,
    code: campus.code,
    address: campus.address,
    latitude: campus.latitude,
    longitude: campus.longitude,
    serviceRadiusKm: campus.serviceRadiusKm,
  };
};

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        studentProfile: {
          include: {
            campus: true,
          },
        },

        vendorProfile: {
          include: {
            campus: true,
          },
        },

        deliveryProfile: {
          include: {
            campus: true,
          },
        },

        addresses: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        campus: getCampusForUser(user),
        studentProfile: user.studentProfile,
        vendorProfile: user.vendorProfile,
        deliveryProfile: user.deliveryProfile,
        addresses: user.addresses,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, department, year } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty',
        });
      }

      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string' || phone.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Phone cannot be empty',
        });
      }

      const trimmedPhone = phone.trim();
      const phoneDigits = trimmedPhone.replace(/[\s\-\(\)\+]/g, '');
      if (phoneDigits.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 10-digit phone number',
        });
      }

      updateData.phone = trimmedPhone;
    }

    let studentProfileUpdated = false;
    if (req.user.role === 'STUDENT' && (department !== undefined || year !== undefined)) {
      const studentUpdate = {};
      if (department !== undefined) {
        studentUpdate.department = typeof department === 'string' ? department.trim() : null;
      }
      if (year !== undefined) {
        studentUpdate.year = typeof year === 'string' ? year.trim() : null;
      }
      if (Object.keys(studentUpdate).length > 0) {
        await prisma.studentProfile.updateMany({
          where: { userId: req.user.id },
          data: studentUpdate,
        });
        studentProfileUpdated = true;
      }
    }

    if (Object.keys(updateData).length === 0 && !studentProfileUpdated) {
      return res.status(400).json({
        success: false,
        message: 'No valid update fields provided (allowed: name, phone, department, year)',
      });
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        studentProfile: {
          include: {
            campus: true,
          },
        },

        vendorProfile: {
          include: {
            campus: true,
          },
        },

        deliveryProfile: {
          include: {
            campus: true,
          },
        },

        addresses: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        campus: getCampusForUser(updatedUser),
        studentProfile: updatedUser.studentProfile,
        vendorProfile: updatedUser.vendorProfile,
        deliveryProfile: updatedUser.deliveryProfile,
        addresses: updatedUser.addresses,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both currentPassword and newPassword are required',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await comparePassword(
      currentPassword,
      user.passwordHash
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};


const getUsers = async (req, res, next) => {
  try {
    const { role, search, status } = req.query;
    const where = {};

    if (role) {
      const normalizedRole = role.toUpperCase();
      if (['STUDENT', 'VENDOR', 'DELIVERY_PARTNER', 'ADMIN'].includes(normalizedRole)) {
        where.role = normalizedRole;
      } else if (normalizedRole === 'DELIVERY') {
        where.role = 'DELIVERY_PARTNER';
      }
    }

    if (status) {
      if (status.toLowerCase() === 'active') where.isActive = true;
      if (status.toLowerCase() === 'suspended') where.isActive = false;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { email: { contains: term } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: {
          select: { department: true, year: true, campusId: true },
        },
        vendorProfile: {
          select: { id: true, verificationStatus: true, campusId: true },
        },
        deliveryProfile: {
          select: { vehicleType: true, vehicleNumber: true, verificationStatus: true, campusId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role === 'DELIVERY_PARTNER' ? 'delivery' : u.role.toLowerCase(),
      rawRole: u.role,
      isActive: u.isActive,
      status: u.isActive ? 'Active' : 'Suspended',
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      studentProfile: u.studentProfile,
      vendorProfile: u.vendorProfile,
      deliveryProfile: u.deliveryProfile,
    }));

    const counts = {
      total: users.length,
      student: users.filter((u) => u.role === 'STUDENT').length,
      vendor: users.filter((u) => u.role === 'VENDOR').length,
      delivery: users.filter((u) => u.role === 'DELIVERY_PARTNER').length,
      admin: users.filter((u) => u.role === 'ADMIN').length,
    };

    return res.status(200).json({
      success: true,
      data: formatted,
      count: formatted.length,
      counts,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, status } = req.body;

    let newIsActive;
    if (typeof isActive === 'boolean') {
      newIsActive = isActive;
    } else if (typeof status === 'string') {
      if (status.toLowerCase() === 'active') newIsActive = true;
      else if (status.toLowerCase() === 'suspended') newIsActive = false;
      else {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value. Must be "Active" or "Suspended".',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'isActive (boolean) or status ("Active" | "Suspended") is required.',
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Guard: Prevent admin from suspending themselves
    if (req.user.id === targetUser.id && !newIsActive) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot suspend their own account.',
      });
    }

    // Guard: Prevent locking out the system if suspending the last active administrator
    if (targetUser.role === 'ADMIN' && !newIsActive) {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot suspend the only remaining active administrator account.',
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id: targetUser.id },
      data: { isActive: newIsActive },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `User account ${newIsActive ? 'activated' : 'suspended'} successfully.`,
      data: {
        ...updated,
        role: updated.role === 'DELIVERY_PARTNER' ? 'delivery' : updated.role.toLowerCase(),
        rawRole: updated.role,
        status: updated.isActive ? 'Active' : 'Suspended',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  updateUserStatus,
};
