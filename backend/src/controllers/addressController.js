const prisma = require('../utils/prisma');

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const { label, addressLine, city, state, postalCode } = req.body;

    if (!addressLine || typeof addressLine !== 'string' || addressLine.trim() === '') {
      return res.status(400).json({ success: false, message: 'Address line is required' });
    }

    if (!city || typeof city !== 'string' || city.trim() === '') {
      return res.status(400).json({ success: false, message: 'City is required' });
    }

    if (!state || typeof state !== 'string' || state.trim() === '') {
      return res.status(400).json({ success: false, message: 'State is required' });
    }

    if (!postalCode || typeof postalCode !== 'string' || postalCode.trim() === '') {
      return res.status(400).json({ success: false, message: 'Postal code is required' });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: req.user.id, // Strictly bind to authenticated user
        label: label && typeof label === 'string' ? label.trim() : null,
        addressLine: addressLine.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: newAddress,
    });
  } catch (error) {
    next(error);
  }
};

const getAddressById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address || address.userId !== req.user.id) {
      // Return 404 to avoid leaking existence of other users' addresses
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, addressLine, city, state, postalCode } = req.body;

    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress || existingAddress.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    const updateData = {};

    if (label !== undefined) {
      updateData.label = typeof label === 'string' ? label.trim() : null;
    }
    if (addressLine !== undefined) {
      if (typeof addressLine !== 'string' || addressLine.trim() === '') {
        return res.status(400).json({ success: false, message: 'Address line cannot be empty' });
      }
      updateData.addressLine = addressLine.trim();
    }
    if (city !== undefined) {
      if (typeof city !== 'string' || city.trim() === '') {
        return res.status(400).json({ success: false, message: 'City cannot be empty' });
      }
      updateData.city = city.trim();
    }
    if (state !== undefined) {
      if (typeof state !== 'string' || state.trim() === '') {
        return res.status(400).json({ success: false, message: 'State cannot be empty' });
      }
      updateData.state = state.trim();
    }
    if (postalCode !== undefined) {
      if (typeof postalCode !== 'string' || postalCode.trim() === '') {
        return res.status(400).json({ success: false, message: 'Postal code cannot be empty' });
      }
      updateData.postalCode = postalCode.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid update fields provided',
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress || existingAddress.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    await prisma.address.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAddresses,
  createAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
};
