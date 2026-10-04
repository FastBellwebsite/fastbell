const prisma = require('../utils/prisma');

const DELIVERY_STATUSES = [
  'PENDING',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];
const DELIVERABLE_ORDER_STATUS = 'PENDING';
const REQUIRED_PAYMENT_STATUS = 'SUCCESS';
const DELIVERY_TRANSITIONS = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const formatDelivery = (delivery) => ({
  id: delivery.id,
  orderId: delivery.orderId,
  status: delivery.status,
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
          userId: req.user.id,
        },
        include: {
          payment: true,
          delivery: true,
        },
      });

      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      if (order.status !== DELIVERABLE_ORDER_STATUS) {
        throw createHttpError(400, 'Order is not eligible for delivery');
      }

      if (!order.payment || order.payment.status !== REQUIRED_PAYMENT_STATUS) {
        throw createHttpError(400, 'Successful payment is required before delivery');
      }

      if (order.delivery) {
        return { delivery: order.delivery, wasExisting: true };
      }

      const delivery = await tx.delivery.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
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
          userId: req.user.id,
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
        userId: req.user.id,
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
        order: {
          userId: req.user.id,
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    const allowedNextStatuses = DELIVERY_TRANSITIONS[delivery.status] || [];
    if (!allowedNextStatuses.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery status transition',
      });
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: nextStatus },
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

module.exports = {
  createDelivery,
  getDeliveryById,
  getDeliveryByOrderId,
  updateDeliveryStatus,
};
