const prisma = require('../utils/prisma');
const { Prisma } = require('@prisma/client');

const getOrCreateUserCart = async (userId) => {
  const cart = await prisma.cart.upsert({
    where: { studentId: userId },
    update: {},
    create: { studentId: userId },
  });

  return cart;
};

const getFormattedCart = async (cartId) => {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          category: true,
          isAvailable: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  let subtotal = new Prisma.Decimal(0);
  let totalItems = 0;

  const formattedItems = items.map((item) => {
    const itemTotal = item.unitPrice.mul(item.quantity);

    subtotal = subtotal.plus(itemTotal);
    totalItems += item.quantity;

    return {
      id: item.id,
      product: {
        id: item.product.id,
        storeId: item.product.storeId,
        name: item.product.name,
        description: item.product.description,
        price: item.unitPrice.toFixed(2),
        imageUrl: item.product.imageUrl,
        category: item.product.category,
        isAvailable: item.product.isAvailable,
      },
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      itemTotal: itemTotal.toFixed(2),
    };
  });

  return {
    cartId,
    items: formattedItems,
    totalItems,
    subtotal: subtotal.toFixed(2),
  };
};

const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateUserCart(req.user.id);
    const cartData = await getFormattedCart(cart.id);

    return res.status(200).json({
      success: true,
      data: cartData,
    });
  } catch (error) {
    next(error);
  }
};

const addItemToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    if (
      quantity === undefined ||
      quantity === null ||
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer',
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId.trim() },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (!product.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Product is currently unavailable',
      });
    }

    if (product.trackInventory && Number(product.stockQuantity ?? 0) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is currently out of stock',
      });
    }

    const cart = await getOrCreateUserCart(req.user.id);

    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        cartId: cart.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
      },
    });

    const updatedCart = await getFormattedCart(cart.id);

    return res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (
      quantity === undefined ||
      quantity === null ||
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than zero',
      });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    });

    if (!cartItem || cartItem.cart.studentId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
      });
    }

    await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    const updatedCart = await getFormattedCart(cartItem.cartId);

    return res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    });

    if (!cartItem || cartItem.cart.studentId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
      });
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    const updatedCart = await getFormattedCart(cartItem.cartId);

    return res.status(200).json({
      success: true,
      message: 'Cart item removed successfully',
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findFirst({
      where: { studentId: req.user.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
};
