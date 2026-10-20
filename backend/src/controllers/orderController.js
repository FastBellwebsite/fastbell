const { Prisma } = require('@prisma/client');
const prisma = require('../utils/prisma');

const orderInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
  store: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
      campusId: true,
    },
  },
  student: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  deliveryAddress: true,
  delivery: true,
  payment: true,
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `FB-${timestamp}-${random}`;
};

const ensureApprovedDeliveryPartner = async (userId, db = prisma) => {
  const partnerProfile = await db.deliveryPartnerProfile.findUnique({
    where: { userId },
    select: { campusId: true, verificationStatus: true },
  });

  if (!partnerProfile || partnerProfile.verificationStatus !== 'APPROVED') {
    throw createHttpError(
      403,
      'Delivery partner account is not approved. Access to delivery orders is restricted.'
    );
  }

  return partnerProfile;
};

const formatAddress = (address) => {
  if (!address) return null;

  return {
    id: address.id,
    label: address.label,
    line: address.addressLine,
    locality: address.locality,
    hostelName: address.hostelName,
    roomNumber: address.roomNumber,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    landmark: address.landmark,
    latitude: address.latitude,
    longitude: address.longitude,
    isDefault: address.isDefault,
  };
};

const formatOrder = (order) => ({
  id: order.id,
  orderNumber: order.orderNumber,
  studentId: order.studentId,
  storeId: order.storeId,
  campusId: order.store?.campusId || null,
  status: order.orderStatus,
  cancellationWindowMinutes: CANCELLATION_WINDOW_MINUTES,
  cancellationRemainingSeconds: (() => {
    if (order.orderStatus !== 'PLACED') return 0;
    const createdAtMs = new Date(order.createdAt).getTime();
    const elapsedMs = Date.now() - createdAtMs;
    return Math.max(0, Math.floor((CANCELLATION_WINDOW_MS - elapsedMs) / 1000));
  })(),
  canCancel: (() => {
    if (order.orderStatus !== 'PLACED') return false;
    const createdAtMs = new Date(order.createdAt).getTime();
    return (Date.now() - createdAtMs) <= CANCELLATION_WINDOW_MS;
  })(),

  subtotal: order.subtotal.toFixed(2),
  deliveryFee: order.deliveryFee.toFixed(2),
  discount: order.discount.toFixed(2),
  totalAmount: order.totalAmount.toFixed(2),

  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,

  createdAt: order.createdAt,
  updatedAt: order.updatedAt,

  student: order.student
    ? {
        id: order.student.id,
        name: order.student.name,
        email: order.student.email,
        phone: order.student.phone,
      }
    : null,
  customer: order.student
    ? {
        id: order.student.id,
        name: order.student.name,
        email: order.student.email,
        phone: order.student.phone,
      }
    : null,

  store: order.store
    ? {
        id: order.store.id,
        name: order.store.name,
        imageUrl: order.store.imageUrl,
        campusId: order.store.campusId || null,
      }
    : null,

  deliveryAddress: formatAddress(order.deliveryAddress),

  payment: order.payment
    ? {
        id: order.payment.id,
        method: order.payment.method,
        status: order.payment.status,
        amount: order.payment.amount.toFixed(2),
        transactionReference: order.payment.transactionReference,
        createdAt: order.payment.createdAt,
        updatedAt: order.payment.updatedAt,
      }
    : null,

  delivery: order.delivery
    ? {
        id: order.delivery.id,
        deliveryPartnerId: order.delivery.deliveryPartnerId,
        status: order.delivery.status,
        pickupTime: order.delivery.pickupTime,
        deliveredTime: order.delivery.deliveredTime,
        proofImageUrl: order.delivery.proofImageUrl,
        createdAt: order.delivery.createdAt,
        updatedAt: order.delivery.updatedAt,
      }
    : null,

  items: order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    product: item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
          category: item.product.category,
        }
      : null,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice.toFixed(2),
    totalPrice: item.totalPrice.toFixed(2),
  })),
});

const createOrder = async (req, res, next) => {
  try {
    const {
      deliveryAddressId,
      paymentMethod,
      deliveryFee = 0,
      discount = 0,
    } = req.body;

    if (
      !deliveryAddressId ||
      typeof deliveryAddressId !== 'string' ||
      deliveryAddressId.trim() === ''
    ) {
      throw createHttpError(400, 'Delivery address is required');
    }

    if (
      !paymentMethod ||
      typeof paymentMethod !== 'string' ||
      paymentMethod.trim() === ''
    ) {
      throw createHttpError(400, 'Payment method is required');
    }

    const normalizedPaymentMethod = paymentMethod.trim().toUpperCase();

    const allowedPaymentMethods = ['UPI', 'CARD', 'CASH', 'CASH_ON_DELIVERY'];

    if (!allowedPaymentMethods.includes(normalizedPaymentMethod)) {
      throw createHttpError(400, 'Unsupported payment method');
    }

    const deliveryFeeValue = Number(deliveryFee);
    const discountValue = Number(discount);

    if (
      !Number.isFinite(deliveryFeeValue) ||
      deliveryFeeValue < 0
    ) {
      throw createHttpError(400, 'Invalid delivery fee');
    }

    if (
      !Number.isFinite(discountValue) ||
      discountValue < 0
    ) {
      throw createHttpError(400, 'Invalid discount');
    }

    const order = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: {
          studentId: req.user.id,
        },
        include: {
          items: {
            include: {
              product: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw createHttpError(400, 'Cart is empty');
      }

      if (
        cart.items.some(
          (item) =>
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0
        )
      ) {
        throw createHttpError(
          400,
          'Cart contains invalid item quantity'
        );
      }

      if (
        cart.items.some(
          (item) => !item.product || !item.product.isAvailable
        )
      ) {
        throw createHttpError(
          400,
          'One or more products are currently unavailable'
        );
      }

      // Mandatory Concurrency Safety: Atomic conditional deduction within transaction
      for (const item of cart.items) {
        if (item.product && item.product.trackInventory) {
          const updateResult = await tx.product.updateMany({
            where: {
              id: item.productId,
              trackInventory: true,
              stockQuantity: { gte: item.quantity },
            },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });

          if (updateResult.count !== 1) {
            throw createHttpError(
              400,
              `Insufficient stock for "${item.product.name}". Requested ${item.quantity}, but sufficient inventory is not available.`
            );
          }
        }
      }

      const address = await tx.address.findFirst({
        where: {
          id: deliveryAddressId.trim(),
          userId: req.user.id,
        },
      });

      if (!address) {
        throw createHttpError(
          404,
          'Delivery address not found'
        );
      }

      const storeIds = [
        ...new Set(cart.items.map((item) => item.product.storeId)),
      ];

      if (storeIds.length !== 1) {
        throw createHttpError(
          400,
          'An order can contain products from only one store'
        );
      }

      const storeId = storeIds[0];

      const subtotal = cart.items.reduce(
        (total, item) =>
          total.plus(
            new Prisma.Decimal(item.unitPrice).mul(item.quantity)
          ),
        new Prisma.Decimal(0)
      );

      const deliveryFeeDecimal = new Prisma.Decimal(
        deliveryFeeValue.toFixed(2)
      );

      const discountDecimal = new Prisma.Decimal(
        discountValue.toFixed(2)
      );

      const totalAmount = subtotal
        .plus(deliveryFeeDecimal)
        .minus(discountDecimal);

      if (totalAmount.lessThan(0)) {
        throw createHttpError(
          400,
          'Order total cannot be negative'
        );
      }

      const createdOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          studentId: req.user.id,
          storeId,
          deliveryAddressId: address.id,

          subtotal,
          deliveryFee: deliveryFeeDecimal,
          discount: discountDecimal,
          totalAmount,

          paymentMethod: normalizedPaymentMethod,
          paymentStatus: 'PENDING',
          orderStatus: 'PLACED',

          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: new Prisma.Decimal(item.unitPrice).mul(
                item.quantity
              ),
            })),
          },

          delivery: {
            create: {
              status: 'UNASSIGNED',
            },
          },

          payment: {
            create: {
              method: normalizedPaymentMethod,
              status: 'PENDING',
              amount: totalAmount,
            },
          },
        },

        include: orderInclude,
      });

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return createdOrder;
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: formatOrder(order),
    });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    let whereClause = {};

    if (req.user.role === 'VENDOR') {
      const vendorStores = await prisma.store.findMany({
        where: {
          OR: [
            { vendor: { userId: req.user.id } },
            { vendorId: req.user.id },
          ],
        },
        select: { id: true },
      });
      const storeIds = vendorStores.map((s) => s.id);
      whereClause = {
        storeId: { in: storeIds },
      };
    } else if (req.user.role === 'ADMIN') {
      whereClause = {};
    } else if (req.user.role === 'DELIVERY_PARTNER') {
      const partnerProfile = await ensureApprovedDeliveryPartner(req.user.id);
      const campusId = partnerProfile.campusId || 'sns';

      whereClause = {
        store: { campusId },
        OR: [
          {
            orderStatus: 'READY_FOR_PICKUP',
            OR: [
              { delivery: null },
              { delivery: { deliveryPartnerId: null } },
            ],
          },
          {
            delivery: {
              deliveryPartnerId: req.user.id,
            },
          },
        ],
      };
    } else {
      whereClause = {
        studentId: req.user.id,
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: orderInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: orders.map(formatOrder),
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let whereClause = {
      OR: [
        { id },
        { orderNumber: id },
      ],
    };

    if (req.user.role === 'VENDOR') {
      const vendorStores = await prisma.store.findMany({
        where: {
          OR: [
            { vendor: { userId: req.user.id } },
            { vendorId: req.user.id },
          ],
        },
        select: { id: true },
      });
      const storeIds = vendorStores.map((s) => s.id);
      whereClause.storeId = { in: storeIds };
    } else if (req.user.role === 'ADMIN') {
      // Admin has unrestricted access to order details
    } else if (req.user.role === 'DELIVERY_PARTNER') {
      const partnerProfile = await ensureApprovedDeliveryPartner(req.user.id);
      const campusId = partnerProfile.campusId || 'sns';
      whereClause.store = { campusId };
      whereClause.AND = [
        {
          OR: [
            {
              orderStatus: 'READY_FOR_PICKUP',
              OR: [
                { delivery: null },
                { delivery: { deliveryPartnerId: null } },
              ],
            },
            {
              delivery: {
                deliveryPartnerId: req.user.id,
              },
            },
          ],
        },
      ];
    } else {
      whereClause.studentId = req.user.id;
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
      include: orderInclude,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatOrder(order),
    });
  } catch (error) {
    next(error);
  }
};



// Configurable cancellation window (default 5 minutes)
const CANCELLATION_WINDOW_MINUTES = parseInt(process.env.ORDER_CANCELLATION_WINDOW_MINUTES, 10) || 5;
const CANCELLATION_WINDOW_MS = CANCELLATION_WINDOW_MINUTES * 60 * 1000;

const getCancellationEligibility = (order, user) => {
  const isOwner = order.studentId === user.id;
  const isAdmin = user.role === 'ADMIN';
  const isStoreVendor =
    user.role === 'VENDOR' &&
    (order.store?.vendor?.userId === user.id || order.store?.vendorId === user.id);

  if (!isOwner && !isAdmin && !isStoreVendor) {
    return {
      eligible: false,
      statusCode: 403,
      reason: 'Unauthorized: This order belongs to another student.',
    };
  }

  if (order.orderStatus === 'CANCELLED') {
    return {
      eligible: false,
      statusCode: 409,
      reason: 'Order has already been cancelled.',
    };
  }

  if (order.orderStatus === 'DELIVERED') {
    return {
      eligible: false,
      statusCode: 400,
      reason: 'Delivered orders cannot be cancelled.',
    };
  }

  if (user.role === 'STUDENT') {
    if (order.orderStatus !== 'PLACED') {
      return {
        eligible: false,
        statusCode: 400,
        reason: `Order is no longer eligible for cancellation. Current status is ${order.orderStatus}.`,
      };
    }

    const createdAtMs = new Date(order.createdAt).getTime();
    const elapsedMs = Date.now() - createdAtMs;

    if (elapsedMs > CANCELLATION_WINDOW_MS) {
      return {
        eligible: false,
        statusCode: 400,
        reason: `Cancellation window has expired. Orders can only be cancelled within ${CANCELLATION_WINDOW_MINUTES} minutes of placement.`,
      };
    }

    const remainingSeconds = Math.max(0, Math.floor((CANCELLATION_WINDOW_MS - elapsedMs) / 1000));
    return {
      eligible: true,
      remainingSeconds,
    };
  }

  if (isStoreVendor) {
    if (!['PLACED', 'ACCEPTED'].includes(order.orderStatus)) {
      return {
        eligible: false,
        statusCode: 400,
        reason: `Vendors can only cancel orders before kitchen preparation begins (current: ${order.orderStatus}).`,
      };
    }
    return { eligible: true };
  }

  if (isAdmin) {
    return { eligible: true };
  }

  return {
    eligible: false,
    statusCode: 403,
    reason: 'Unauthorized role for cancellation.',
  };
};

const executeOrderCancellation = async (tx, order, user, reason) => {
  const eligibility = getCancellationEligibility(order, user);
  if (!eligibility.eligible) {
    throw createHttpError(eligibility.statusCode, eligibility.reason);
  }

  const eligibleStatuses = user.role === 'STUDENT' ? ['PLACED'] : ['PLACED', 'ACCEPTED'];
  const claimResult = await tx.order.updateMany({
    where: {
      id: order.id,
      orderStatus: { in: eligibleStatuses },
    },
    data: {
      orderStatus: 'CANCELLED',
      stockRestored: true,
    },
  });

  if (claimResult.count === 0) {
    const refreshed = await tx.order.findUnique({ where: { id: order.id } });
    if (!refreshed) throw createHttpError(404, 'Order not found');
    if (refreshed.orderStatus === 'CANCELLED') {
      throw createHttpError(409, 'Order has already been cancelled.');
    }
    throw createHttpError(
      409,
      `Conflict: Order status changed concurrently to ${refreshed.orderStatus} and is no longer eligible for cancellation.`
    );
  }

  const orderWithItems = await tx.order.findUnique({
    where: { id: order.id },
    include: {
      items: {
        include: { product: true },
      },
      payment: true,
    },
  });

  if (orderWithItems && orderWithItems.items) {
    for (const item of orderWithItems.items) {
      if (item.product && item.product.trackInventory) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });
      }
    }
  }

  const isPaid = orderWithItems?.payment?.status === 'PAID' || order.paymentStatus === 'PAID';
  if (isPaid) {
    if (orderWithItems?.payment) {
      await tx.payment.update({
        where: { id: orderWithItems.payment.id },
        data: { status: 'REFUNDED' },
      });
    }
    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'REFUNDED' },
    });
  }

  const cancelledOrder = await tx.order.findUnique({
    where: { id: order.id },
    include: orderInclude,
  });

  return cancelledOrder;
};

const ORDER_TRANSITION_RULES = {
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['PICKED_UP'],
  PICKED_UP: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const VENDOR_ALLOWED_STATUSES = ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'];
const STUDENT_ALLOWED_STATUSES = ['CANCELLED'];
const DELIVERY_ALLOWED_STATUSES = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, deliveryPartnerId, currentStatus } = req.body;

    if (!status || typeof status !== 'string' || status.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Order status is required',
      });
    }

    const nextStatus = status.trim().toUpperCase();
    const VALID_STATUSES = [
      'PLACED',
      'ACCEPTED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ];

    if (!VALID_STATUSES.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status: ${status}`,
      });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          OR: [{ id }, { orderNumber: id }],
        },
        include: {
          store: {
            include: { vendor: true },
          },
          delivery: true,
        },
      });

      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      if (currentStatus && order.orderStatus !== currentStatus.trim().toUpperCase()) {
        throw createHttpError(
          409,
          `Conflict: Order status has already changed from ${currentStatus} to ${order.orderStatus}. Please refresh.`
        );
      }

      if (req.user.role === 'VENDOR') {
        const isStoreOwner =
          order.store &&
          (order.store.vendor?.userId === req.user.id ||
            order.store.vendorId === req.user.id);

        if (!isStoreOwner) {
          throw createHttpError(403, 'Unauthorized: You do not manage the store for this order.');
        }

        if (!VENDOR_ALLOWED_STATUSES.includes(nextStatus)) {
          throw createHttpError(
            403,
            `Vendors are not authorized to transition orders to ${nextStatus}.`
          );
        }
      } else if (req.user.role === 'STUDENT') {
        if (order.studentId !== req.user.id) {
          throw createHttpError(403, 'Unauthorized: This order belongs to another student.');
        }

        if (!STUDENT_ALLOWED_STATUSES.includes(nextStatus)) {
          throw createHttpError(
            403,
            `Students can only cancel placed orders; cannot set status to ${nextStatus}.`
          );
        }
      } else if (req.user.role === 'DELIVERY_PARTNER') {
        await ensureApprovedDeliveryPartner(req.user.id, tx);

        const isAssigned =
          order.delivery && order.delivery.deliveryPartnerId === req.user.id;

        if (!isAssigned && req.user.role !== 'ADMIN') {
          throw createHttpError(
            403,
            'Unauthorized: You are not assigned to deliver this order.'
          );
        }

        if (!DELIVERY_ALLOWED_STATUSES.includes(nextStatus)) {
          throw createHttpError(
            403,
            `Delivery partners cannot transition orders to ${nextStatus}.`
          );
        }
      } else if (req.user.role !== 'ADMIN') {
        throw createHttpError(403, 'Unauthorized role for updating order status.');
      }

      const allowedNext = ORDER_TRANSITION_RULES[order.orderStatus] || [];
      if (!allowedNext.includes(nextStatus)) {
        throw createHttpError(
          400,
          `Invalid status transition from ${order.orderStatus} to ${nextStatus}.`
        );
      }

      if (nextStatus === 'CANCELLED') {
        return await executeOrderCancellation(tx, order, req.user, req.body.reason);
      }

      if (order.delivery) {
        if (nextStatus === 'PICKED_UP') {
          await tx.delivery.update({
            where: { id: order.delivery.id },
            data: {
              status: 'PICKED_UP',
              pickupTime: new Date(),
              deliveryPartnerId: deliveryPartnerId || order.delivery.deliveryPartnerId,
            },
          });
        } else if (nextStatus === 'OUT_FOR_DELIVERY') {
          await tx.delivery.update({
            where: { id: order.delivery.id },
            data: { status: 'OUT_FOR_DELIVERY' },
          });
        } else if (nextStatus === 'DELIVERED') {
          await tx.delivery.update({
            where: { id: order.delivery.id },
            data: {
              status: 'DELIVERED',
              deliveredTime: new Date(),
            },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: nextStatus,
        },
        include: orderInclude,
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${nextStatus}`,
      data: formatOrder(updatedOrder),
    });
  } catch (error) {
    next(error);
  }
};

const claimOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== 'DELIVERY_PARTNER') {
      return res.status(403).json({
        success: false,
        message: 'Only delivery partners can claim orders for delivery.',
      });
    }

    const partnerProfile = await ensureApprovedDeliveryPartner(req.user.id);

    const partnerCampusId = partnerProfile.campusId || 'sns';

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          OR: [{ id }, { orderNumber: id }],
        },
        include: {
          delivery: true,
          store: true,
        },
      });

      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      if (order.store?.campusId && order.store.campusId !== partnerCampusId) {
        throw createHttpError(403, 'Order belongs to a different campus.');
      }

      if (order.orderStatus !== 'READY_FOR_PICKUP') {
        throw createHttpError(
          400,
          `Cannot claim order: Order status is ${order.orderStatus}, but must be READY_FOR_PICKUP.`
        );
      }

      // Atomically lock and verify that the order is still in READY_FOR_PICKUP status against concurrent cancellation
      const orderLockCheck = await tx.order.updateMany({
        where: {
          id: order.id,
          orderStatus: 'READY_FOR_PICKUP',
        },
        data: {
          updatedAt: new Date(),
        },
      });

      if (orderLockCheck.count === 0) {
        throw createHttpError(
          409,
          'Cannot claim order: Order status is no longer READY_FOR_PICKUP.'
        );
      }

      // Check if already claimed by this partner
      if (order.delivery && order.delivery.deliveryPartnerId === req.user.id) {
        const fullOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: orderInclude,
        });
        return {
          order: fullOrder,
          alreadyClaimedByMe: true,
        };
      }

      // Check if already claimed by someone else
      if (order.delivery && order.delivery.deliveryPartnerId && order.delivery.deliveryPartnerId !== req.user.id) {
        throw createHttpError(409, 'This order has already been claimed by another delivery partner.');
      }

      // Atomically update delivery or create if missing
      if (order.delivery) {
        const updateResult = await tx.delivery.updateMany({
          where: {
            id: order.delivery.id,
            deliveryPartnerId: null,
            status: 'UNASSIGNED',
          },
          data: {
            deliveryPartnerId: req.user.id,
            status: 'ASSIGNED',
          },
        });

        if (updateResult.count === 0) {
          throw createHttpError(409, 'This order has already been claimed by another delivery partner.');
        }
      } else {
        try {
          await tx.delivery.create({
            data: {
              orderId: order.id,
              deliveryPartnerId: req.user.id,
              status: 'ASSIGNED',
            },
          });
        } catch (createErr) {
          if (createErr.code === 'P2002' || (createErr.message && createErr.message.includes('Unique constraint'))) {
            throw createHttpError(409, 'This order has already been claimed by another delivery partner.');
          }
          throw createErr;
        }
      }

      const updatedOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: orderInclude,
      });

      return { order: updatedOrder, alreadyClaimedByMe: false };
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyClaimedByMe
        ? 'Order already assigned to you'
        : 'Order successfully claimed for delivery',
      data: formatOrder(result.order),
    });
  } catch (error) {
    next(error);
  }
};


const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const cancelledOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          OR: [{ id }, { orderNumber: id }],
        },
        include: {
          store: {
            include: { vendor: true },
          },
          delivery: true,
          payment: true,
          items: {
            include: { product: true },
          },
        },
      });

      if (!order) {
        throw createHttpError(404, 'Order not found');
      }

      return executeOrderCancellation(tx, order, req.user, reason);
    });

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: formatOrder(cancelledOrder),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getCancellationEligibility,
  CANCELLATION_WINDOW_MINUTES,
  getOrders,
  getOrderById,
  claimOrder,
};
