const prisma = require('../utils/prisma');

const DELIVERY_STATUSES = [
  'UNASSIGNED',
  'ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];
const DELIVERABLE_ORDER_STATUSES = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'];
const DELIVERY_TRANSITIONS = {
  UNASSIGNED: ['ASSIGNED'],
  ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const formatDelivery = (delivery) => ({
  id: delivery.id,
  orderId: delivery.orderId,
  deliveryPartnerId: delivery.deliveryPartnerId,
  status: delivery.status,
  pickupTime: delivery.pickupTime,
  deliveredTime: delivery.deliveredTime,
  proofImageUrl: delivery.proofImageUrl,
  createdAt: delivery.createdAt,
  updatedAt: delivery.updatedAt,
});

const normalizeStatus = (status) => {
  if (!status || typeof status !== 'string' || status.trim() === '') {
    throw createHttpError(400, 'Delivery status is required');
  }

  const normalizedStatus = status.trim().toUpperCase();
  if (!DELIVERY_STATUSES.includes(normalizedStatus)) {
    throw createHttpError(400, 'Invalid delivery status');
  }

  return normalizedStatus;
};

const createDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId.trim(),
          studentId: req.user.id,
        },
        include: {
          payment: true,
          delivery: true,
        },
      });

      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      if (!DELIVERABLE_ORDER_STATUSES.includes(order.orderStatus)) {
        throw createHttpError(400, 'Order is not eligible for delivery');
      }

      if (order.delivery) {
        return { delivery: order.delivery, wasExisting: true };
      }

      const delivery = await tx.delivery.create({
        data: {
          orderId: order.id,
          status: 'UNASSIGNED',
        },
      });

      return { delivery, wasExisting: false };
    });

    return res.status(result.wasExisting ? 200 : 201).json({
      success: true,
      message: result.wasExisting ? 'Delivery already exists for this order' : 'Delivery created successfully',
      data: formatDelivery(result.delivery),
    });
  } catch (error) {
    next(error);
  }
};

const getDeliveryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const delivery = await prisma.delivery.findFirst({
      where: {
        id,
        order: {
          studentId: req.user.id,
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatDelivery(delivery),
    });
  } catch (error) {
    next(error);
  }
};

const getDeliveryByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        studentId: req.user.id,
      },
      include: {
        delivery: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (!order.delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatDelivery(order.delivery),
    });
  } catch (error) {
    next(error);
  }
};

const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const nextStatus = normalizeStatus(req.body.status);

    const delivery = await prisma.delivery.findFirst({
      where: {
        id,
      },
      include: {
        order: true,
      },
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    if (delivery.order.studentId !== req.user.id && delivery.deliveryPartnerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this delivery',
      });
    }

    if (req.user.role === 'DELIVERY_PARTNER') {
      const partnerProfile = await prisma.deliveryPartnerProfile.findUnique({
        where: { userId: req.user.id },
        select: { verificationStatus: true },
      });

      if (!partnerProfile || partnerProfile.verificationStatus !== 'APPROVED') {
        return res.status(403).json({
          success: false,
          message: 'Delivery partner account is not approved. Access to delivery orders is restricted.',
        });
      }
    }

    const allowedNextStatuses = DELIVERY_TRANSITIONS[delivery.status] || [];
    if (!allowedNextStatuses.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery status transition',
      });
    }

    const updateData = { status: nextStatus };
    if (nextStatus === 'PICKED_UP' && !delivery.pickupTime) {
      updateData.pickupTime = new Date();
    }
    if (nextStatus === 'DELIVERED' && !delivery.deliveredTime) {
      updateData.deliveredTime = new Date();
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id: delivery.id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery status updated successfully',
      data: formatDelivery(updatedDelivery),
    });
  } catch (error) {
    next(error);
  }
};


const getDeliveryPartners = async (req, res, next) => {
  try {
    const { status, campusId } = req.query;

    const where = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status.trim().toUpperCase())) {
      where.verificationStatus = status.trim().toUpperCase();
    }
    if (campusId) {
      where.campusId = campusId.trim();
    }

    const profiles = await prisma.deliveryPartnerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
        campus: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = profiles.map((p) => ({
      id: p.id,
      userId: p.user?.id,
      name: p.user?.name || 'Unknown',
      email: p.user?.email || '',
      phone: p.user?.phone || null,
      isActive: p.user?.isActive ?? true,
      campusId: p.campusId,
      campusName: p.campus?.name || p.campusId,
      collegeId: p.collegeId,
      vehicleType: p.vehicleType,
      vehicleNumber: p.vehicleNumber,
      serviceArea: p.serviceArea,
      baseAddress: p.baseAddress,
      availabilityStatus: p.availabilityStatus,
      verificationStatus: p.verificationStatus,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    next(error);
  }
};

const updateDeliveryPartnerVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification status is required.',
      });
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status. Status must be either APPROVED or REJECTED.',
      });
    }

    const existingProfile = await prisma.deliveryPartnerProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        campus: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner profile not found.',
      });
    }

    const updatedProfile = await prisma.deliveryPartnerProfile.update({
      where: { id: existingProfile.id },
      data: {
        verificationStatus: status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        campus: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Delivery partner verification status updated to ${status}.`,
      data: {
        id: updatedProfile.id,
        userId: updatedProfile.user?.id,
        name: updatedProfile.user?.name,
        email: updatedProfile.user?.email,
        phone: updatedProfile.user?.phone,
        isActive: updatedProfile.user?.isActive,
        campusId: updatedProfile.campusId,
        campusName: updatedProfile.campus?.name,
        collegeId: updatedProfile.collegeId,
        vehicleType: updatedProfile.vehicleType,
        vehicleNumber: updatedProfile.vehicleNumber,
        serviceArea: updatedProfile.serviceArea,
        baseAddress: updatedProfile.baseAddress,
        availabilityStatus: updatedProfile.availabilityStatus,
        verificationStatus: updatedProfile.verificationStatus,
        createdAt: updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDelivery,
  getDeliveryById,
  getDeliveryByOrderId,
  updateDeliveryStatus,
  getDeliveryPartners,
  updateDeliveryPartnerVerification,
};
