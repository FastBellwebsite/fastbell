const prisma = require('../utils/prisma');

const SUPPORTED_PAYMENT_METHODS = ['UPI', 'CARD', 'NET_BANKING', 'WALLET'];
const PAYABLE_ORDER_STATUS = 'PENDING';
const PAYMENT_CURRENCY = 'INR';

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const formatPayment = (payment) => ({
  id: payment.id,
  orderId: payment.orderId,
  amount: payment.amount.toFixed(2),
  currency: payment.currency,
  status: payment.status,
  paymentMethod: payment.paymentMethod,
  transactionId: payment.transactionId,
  gatewayReference: payment.gatewayReference,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const validatePaymentMethod = (paymentMethod) => {
  if (!paymentMethod || typeof paymentMethod !== 'string' || paymentMethod.trim() === '') {
    throw createHttpError(400, 'Payment method is required');
  }

  const normalizedMethod = paymentMethod.trim().toUpperCase();
  if (!SUPPORTED_PAYMENT_METHODS.includes(normalizedMethod)) {
    throw createHttpError(400, 'Unsupported payment method');
  }

  return normalizedMethod;
};

const createPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod } = req.body;

    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const normalizedPaymentMethod = validatePaymentMethod(paymentMethod);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId.trim(),
          userId: req.user.id,
        },
        include: {
          payment: true,
        },
      });

      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      if (order.status !== PAYABLE_ORDER_STATUS) {
        throw createHttpError(400, 'Order is not eligible for payment');
      }

      if (order.payment) {
        if (order.payment.status === 'PENDING') {
          return { payment: order.payment, wasExisting: true };
        }

        if (order.payment.status === 'SUCCESS') {
          throw createHttpError(409, 'Order has already been paid');
        }

        throw createHttpError(409, 'Payment already exists for this order');
      }

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          currency: PAYMENT_CURRENCY,
          status: 'PENDING',
          paymentMethod: normalizedPaymentMethod,
        },
      });

      return { payment, wasExisting: false };
    });

    return res.status(result.wasExisting ? 200 : 201).json({
      success: true,
      message: result.wasExisting ? 'Payment already exists for this order' : 'Payment created successfully',
      data: formatPayment(result.payment),
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        order: {
          userId: req.user.id,
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatPayment(payment),
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id,
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (!order.payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatPayment(order.payment),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getPaymentById,
  getPaymentByOrderId,
};
