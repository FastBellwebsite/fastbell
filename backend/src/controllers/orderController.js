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
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const formatOrder = (order) => ({
  id: order.id,
  status: order.status,
  totalAmount: order.totalAmount.toFixed(2),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  items: order.items.map((item) => {
    const itemTotal = item.price.mul(item.quantity);

    return {
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
        category: item.product.category,
      },
      quantity: item.quantity,
      price: item.price.toFixed(2),
      itemTotal: itemTotal.toFixed(2),
    };
  }),
});

const createOrder = async (req, res, next) => {
  try {
    const order = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: { userId: req.user.id },
        include: {
          items: {
            include: {
              product: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw createHttpError(400, 'Cart is empty');
      }

      if (
        cart.items.some(
          (item) => !Number.isInteger(item.quantity) || item.quantity <= 0
        )
      ) {
        throw createHttpError(400, 'Cart contains invalid item quantity');
      }

      if (cart.items.some((item) => !item.product.isAvailable)) {
        throw createHttpError(400, 'One or more products are currently unavailable');
      }

      const totalAmount = cart.items.reduce((total, item) => {
        return total.plus(item.product.price.mul(item.quantity));
      }, new Prisma.Decimal(0));

      const createdOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          status: 'PENDING',
          totalAmount,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: orderInclude,
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
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
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
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

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
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

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
};
