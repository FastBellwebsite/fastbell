const prisma = require('../utils/prisma');

const formatAddress = (address) => ({
  ...address,
  line: address.addressLine,
});

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: addresses.map(formatAddress),
    });
  } catch (error) {
    next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const {
      label,
      addressLine,
      line,
      locality,
      hostelName,
      roomNumber,
      city,
      state,
      postalCode,
      landmark,
      latitude,
      longitude,
      isDefault,
    } = req.body;

    const finalAddressLine =
      typeof addressLine === 'string'
        ? addressLine.trim()
        : typeof line === 'string'
          ? line.trim()
          : '';

    if (!finalAddressLine) {
      return res.status(400).json({
        success: false,
        message: 'Address line is required',
      });
    }

    const finalCity =
      typeof city === 'string' && city.trim() !== ''
        ? city.trim()
        : 'Coimbatore';

    const finalState =
      typeof state === 'string' && state.trim() !== ''
        ? state.trim()
        : 'Tamil Nadu';

    const finalPostalCode =
      typeof postalCode === 'string' && postalCode.trim() !== ''
        ? postalCode.trim()
        : '641004';

    const latitudeValue =
      typeof latitude === 'number' && Number.isFinite(latitude)
        ? latitude
        : null;

    const longitudeValue =
      typeof longitude === 'number' && Number.isFinite(longitude)
        ? longitude
        : null;

    const defaultValue = isDefault === true;

    const newAddress = await prisma.$transaction(async (transaction) => {
      if (defaultValue) {
        await transaction.address.updateMany({
          where: {
            userId: req.user.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return transaction.address.create({
        data: {
          userId: req.user.id,
          label:
            typeof label === 'string' && label.trim() !== ''
              ? label.trim()
              : null,

          addressLine: finalAddressLine,

          locality:
            typeof locality === 'string' && locality.trim() !== ''
              ? locality.trim()
              : null,

          hostelName:
            typeof hostelName === 'string' && hostelName.trim() !== ''
              ? hostelName.trim()
              : null,

          roomNumber:
            typeof roomNumber === 'string' && roomNumber.trim() !== ''
              ? roomNumber.trim()
              : null,

          city: finalCity,
          state: finalState,
          postalCode: finalPostalCode,

          landmark:
            typeof landmark === 'string' && landmark.trim() !== ''
              ? landmark.trim()
              : null,

          latitude: latitudeValue,
          longitude: longitudeValue,

          isDefault: defaultValue,
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: formatAddress(newAddress),
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
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatAddress(address),
    });
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      label,
      addressLine,
      line,
      locality,
      hostelName,
      roomNumber,
      city,
      state,
      postalCode,
      landmark,
      latitude,
      longitude,
      isDefault,
    } = req.body;

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
      updateData.label =
        typeof label === 'string' && label.trim() !== ''
          ? label.trim()
          : null;
    }

    const finalAddressLine =
      addressLine !== undefined
        ? addressLine
        : line !== undefined
          ? line
          : undefined;

    if (finalAddressLine !== undefined) {
      if (
        typeof finalAddressLine !== 'string' ||
        finalAddressLine.trim() === ''
      ) {
        return res.status(400).json({
          success: false,
          message: 'Address line cannot be empty',
        });
      }

      updateData.addressLine = finalAddressLine.trim();
    }

    if (locality !== undefined) {
      updateData.locality =
        typeof locality === 'string' && locality.trim() !== ''
          ? locality.trim()
          : null;
    }

    if (hostelName !== undefined) {
      updateData.hostelName =
        typeof hostelName === 'string' && hostelName.trim() !== ''
          ? hostelName.trim()
          : null;
    }

    if (roomNumber !== undefined) {
      updateData.roomNumber =
        typeof roomNumber === 'string' && roomNumber.trim() !== ''
          ? roomNumber.trim()
          : null;
    }

    if (city !== undefined) {
      if (
        typeof city !== 'string' ||
        city.trim() === ''
      ) {
        return res.status(400).json({
          success: false,
          message: 'City cannot be empty',
        });
      }

      updateData.city = city.trim();
    }

    if (state !== undefined) {
      if (
        typeof state !== 'string' ||
        state.trim() === ''
      ) {
        return res.status(400).json({
          success: false,
          message: 'State cannot be empty',
        });
      }

      updateData.state = state.trim();
    }

    if (postalCode !== undefined) {
      if (
        typeof postalCode !== 'string' ||
        postalCode.trim() === ''
      ) {
        return res.status(400).json({
          success: false,
          message: 'Postal code cannot be empty',
        });
      }

      updateData.postalCode = postalCode.trim();
    }

    if (landmark !== undefined) {
      updateData.landmark =
        typeof landmark === 'string' && landmark.trim() !== ''
          ? landmark.trim()
          : null;
    }

    if (latitude !== undefined) {
      if (latitude === null) {
        updateData.latitude = null;
      } else if (
        typeof latitude === 'number' &&
        Number.isFinite(latitude)
      ) {
        updateData.latitude = latitude;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Latitude must be a valid number',
        });
      }
    }

    if (longitude !== undefined) {
      if (longitude === null) {
        updateData.longitude = null;
      } else if (
        typeof longitude === 'number' &&
        Number.isFinite(longitude)
      ) {
        updateData.longitude = longitude;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Longitude must be a valid number',
        });
      }
    }

    if (isDefault !== undefined) {
      if (typeof isDefault !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isDefault must be a boolean',
        });
      }

      updateData.isDefault = isDefault;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid update fields provided',
      });
    }

    const updatedAddress = await prisma.$transaction(async (transaction) => {
      if (updateData.isDefault === true) {
        await transaction.address.updateMany({
          where: {
            userId: req.user.id,
            id: { not: id },
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return transaction.address.update({
        where: { id },
        data: updateData,
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: formatAddress(updatedAddress),
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