<<<<<<< HEAD
=======
const express = require('express');
const router = express.Router();

>>>>>>> origin/main
const prisma = require('../utils/prisma');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

<<<<<<< HEAD
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, campusId } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'A valid email is required' });
    }

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters long',
      });
    }

    if (!campusId || typeof campusId !== 'string' || campusId.trim() === '') {
      return res.status(400).json({ success: false, message: 'Campus ID is required' });
    }

    // Check if campus exists
    const campus = await prisma.campus.findUnique({
      where: { id: campusId.trim() },
    });

    if (!campus) {
      return res.status(400).json({ success: false, message: 'Specified campus does not exist' });
=======
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

    return {
      ...base,
      campusId: profile?.campusId || null,
      department: profile?.department || undefined,
      year: profile?.year || undefined,
      addresses: user.addresses || []
    };
  }

  if (user.role === 'VENDOR') {
    const profile = user.vendorProfile;
    const store = profile?.store;

    return {
      ...base,
      campusId: profile?.campusId || null,
      storeId: store?.id || null,
      storeName: store?.name || undefined,
      businessName: store?.name || undefined,
      category: store?.products?.[0]?.category?.slug || undefined,
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
          : profile?.baseAddress
          ? {
              latitude: 11.1271,
              longitude: 76.9966,
              address: profile.baseAddress,
              locality: profile.serviceArea || undefined,
              city: 'Coimbatore',
              state: 'Tamil Nadu',
              postalCode: '641049'
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
      store: {
        include: {
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
      vehicleType,
      vehicleNumber,
      serviceArea,
      studentId
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
>>>>>>> origin/main
    }

    const normalizedEmail = email.trim().toLowerCase();

<<<<<<< HEAD
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        passwordHash,
        campusId: campus.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        campusId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = generateToken({ id: newUser.id });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: newUser,
=======
    const normalizedRole = ROLE_MAP[role?.toLowerCase()];

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
              latitude: 11.1271,
              longitude: 76.9966,
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
            description: description?.trim() || null,
            address: address?.trim() || null,
            locality: locality?.trim() || null,
            city: city?.trim() || 'Coimbatore',
            state: state?.trim() || 'Tamil Nadu',
            postalCode: postalCode?.trim() || null,
            latitude: 11.1271,
            longitude: 76.9966,
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
            currentLatitude: 11.1271,
            currentLongitude: 76.9966,
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
>>>>>>> origin/main
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
<<<<<<< HEAD
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
=======
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
>>>>>>> origin/main
    });

    if (!user) {
      return res.status(401).json({
        success: false,
<<<<<<< HEAD
        message: 'Invalid email or password',
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken({ id: user.id });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        campusId: user.campusId,
      },
=======
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
>>>>>>> origin/main
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
<<<<<<< HEAD
    // req.user is set by authMiddleware
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        campusId: req.user.campusId,
      },
=======
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
>>>>>>> origin/main
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
<<<<<<< HEAD
  getMe,
=======
  getMe
>>>>>>> origin/main
};
