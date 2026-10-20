const express = require('express');
const router = express.Router();

const prisma = require('../utils/prisma');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_MAP = {
  student: 'STUDENT',
  vendor: 'VENDOR',
  delivery: 'DELIVERY_PARTNER',
  admin: 'ADMIN'
};

const buildUserResponse = (user) => {
  const base = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role === 'DELIVERY_PARTNER' ? 'delivery' : user.role.toLowerCase(),
    status: user.isActive ? 'Active' : 'Suspended'
  };

  if (user.role === 'STUDENT') {
    const profile = user.studentProfile;
    const defaultAddress =
      user.addresses?.find((item) => item.isDefault) ||
      user.addresses?.[0];

    return {
      ...base,
      campusId: profile?.campusId || null,
      department: profile?.department || undefined,
      year: profile?.year || undefined,
      addresses: user.addresses || [],
      location:
        defaultAddress?.latitude != null &&
        defaultAddress?.longitude != null
          ? {
              latitude: defaultAddress.latitude,
              longitude: defaultAddress.longitude,
              address: defaultAddress.addressLine || undefined,
              locality: defaultAddress.locality || undefined,
              city: defaultAddress.city || undefined,
              state: defaultAddress.state || undefined,
              postalCode: defaultAddress.postalCode || undefined
            }
          : undefined
    };
  }

  if (user.role === 'VENDOR') {
    const profile = user.vendorProfile;
    const store = profile?.stores?.[0];
    const storeIds = profile?.stores?.map((s) => s.id) || [];

    return {
      ...base,
      campusId: profile?.campusId || null,
      storeId: store?.id || null,
      storeIds,
      vendorProfileId: profile?.id || null,
      storeName: store?.name || undefined,
      businessName: store?.name || undefined,
      category: store?.category?.slug || undefined,
      description: store?.description || undefined,
      location: store
        ? {
            latitude: store.latitude,
            longitude: store.longitude,
            address: store.address || undefined,
            locality: store.locality || undefined,
            city: store.city || undefined,
            state: store.state || undefined,
            postalCode: store.postalCode || undefined
          }
        : undefined
    };
  }

  if (user.role === 'DELIVERY_PARTNER') {
    const profile = user.deliveryProfile;

    return {
      ...base,
      campusId: profile?.campusId || null,
      serviceArea: profile?.serviceArea || undefined,
      vehicleType: profile?.vehicleType || undefined,
      vehicleNumber: profile?.vehicleNumber || undefined,
      availabilityStatus: profile?.availabilityStatus
        ? profile.availabilityStatus.charAt(0) +
          profile.availabilityStatus.slice(1).toLowerCase()
        : 'Offline',
      location:
        profile?.currentLatitude != null &&
        profile?.currentLongitude != null
          ? {
              latitude: profile.currentLatitude,
              longitude: profile.currentLongitude,
              address: profile.baseAddress || undefined,
              locality: profile.serviceArea || undefined
            }
          : undefined
    };
  }

  return {
    ...base,
    permissions: []
  };
};

const userInclude = {
  studentProfile: true,
  vendorProfile: {
    include: {
      stores: {
        include: {
          category: true,
          products: {
            include: {
              category: true
            },
            take: 1
          }
        }
      }
    }
  },
  deliveryProfile: true,
  addresses: true
};

const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      campusId,
      department,
      year,
      address,
      locality,
      city,
      state,
      postalCode,
      landmark,
      storeName,
      category,
      description,
      locationLabel,
      deliveryMinutes,
      imageUrl,
      vehicleType,
      vehicleNumber,
      serviceArea,
      studentId,
      latitude,
      longitude
    } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid name is required.'
      });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required.'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedRole = ROLE_MAP[(role || 'student').toLowerCase()];

    if (!normalizedRole) {
      return res.status(400).json({
        success: false,
        message: 'Valid role is required.'
      });
    }

    if (normalizedRole === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be created through public registration.'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please sign in.'
      });
    }

    const campus = await prisma.campus.findUnique({
      where: {
        id: campusId || 'sns'
      }
    });

    if (!campus || !campus.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Selected campus is unavailable.'
      });
    }

    const parsedLatitude =
      latitude !== undefined &&
      latitude !== null &&
      latitude !== ''
        ? Number(latitude)
        : null;

    const parsedLongitude =
      longitude !== undefined &&
      longitude !== null &&
      longitude !== ''
        ? Number(longitude)
        : null;

    if (
      (parsedLatitude !== null && !Number.isFinite(parsedLatitude)) ||
      (parsedLongitude !== null && !Number.isFinite(parsedLongitude))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location coordinates.'
      });
    }

    if (
      (parsedLatitude !== null &&
        (parsedLatitude < -90 || parsedLatitude > 90)) ||
      (parsedLongitude !== null &&
        (parsedLongitude < -180 || parsedLongitude > 180))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are out of range.'
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
          passwordHash,
          role: normalizedRole
        }
      });

      if (normalizedRole === 'STUDENT') {
        await tx.studentProfile.create({
          data: {
            userId: createdUser.id,
            campusId: campus.id,
            department: department?.trim() || null,
            year: year?.trim() || null
          }
        });

        if (address?.trim()) {
          await tx.address.create({
            data: {
              userId: createdUser.id,
              label: 'Primary Delivery',
              addressLine: address.trim(),
              locality: locality?.trim() || null,
              city: city?.trim() || 'Coimbatore',
              state: state?.trim() || 'Tamil Nadu',
              postalCode: postalCode?.trim() || null,
              landmark: landmark?.trim() || null,
              latitude: parsedLatitude,
              longitude: parsedLongitude,
              isDefault: true
            }
          });
        }
      }

      if (normalizedRole === 'VENDOR') {
        if (!storeName?.trim()) {
          throw new Error('Store name is required for vendor registration.');
        }

        if (!category?.trim()) {
          throw new Error('Store category is required for vendor registration.');
        }

        const categoryRecord = await tx.category.findFirst({
          where: {
            OR: [
              { id: category.trim() },
              { slug: category.trim().toLowerCase() }
            ],
            isActive: true
          }
        });

        if (!categoryRecord) {
          throw new Error('Invalid store category.');
        }

        const vendorProfile = await tx.vendorProfile.create({
          data: {
            userId: createdUser.id,
            campusId: campus.id,
            verificationStatus: 'PENDING'
          }
        });

        await tx.store.create({
          data: {
            vendorId: vendorProfile.id,
            campusId: campus.id,
            name: storeName.trim(),
            categoryId: categoryRecord.id,
            description: description?.trim() || null,
      locationLabel: locationLabel?.trim() || null,
      deliveryMinutes: deliveryMinutes ? Number(deliveryMinutes) : 15,
      imageUrl: imageUrl?.trim() || null,
            address: address?.trim() || null,
            locality: locality?.trim() || null,
            city: city?.trim() || 'Coimbatore',
            state: state?.trim() || 'Tamil Nadu',
            postalCode: postalCode?.trim() || null,
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            isOpen: true,
            isActive: true
          }
        });
      }

      if (normalizedRole === 'DELIVERY_PARTNER') {
        await tx.deliveryPartnerProfile.create({
          data: {
            userId: createdUser.id,
            campusId: campus.id,
            collegeId: studentId?.trim() || null,
            vehicleType: vehicleType?.trim() || null,
            vehicleNumber: vehicleNumber?.trim() || null,
            serviceArea: serviceArea?.trim() || null,
            baseAddress: address?.trim() || null,
            availabilityStatus: 'OFFLINE',
            currentLatitude: parsedLatitude,
            currentLongitude: parsedLongitude,
            verificationStatus: 'PENDING'
          }
        });
      }

      return tx.user.findUnique({
        where: {
          id: createdUser.id
        },
        include: userInclude
      });
    });

    const token = generateToken({
      id: user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: buildUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required.'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      },
      include: userInclude
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended.'
      });
    }

    if (role && ROLE_MAP[role.toLowerCase()]) {
      const requestedRole = ROLE_MAP[role.toLowerCase()];

      if (user.role !== requestedRole) {
        return res.status(403).json({
          success: false,
          message: `This account is registered as a ${user.role.toLowerCase()}. Please sign in through the correct portal.`
        });
      }
    }

    const passwordMatches = await comparePassword(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken({
      id: user.id
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: buildUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id
      },
      include: userInclude
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    return res.status(200).json({
      success: true,
      user: buildUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
