const prisma = require('../utils/prisma');
const { Prisma } = require('@prisma/client');

const getOrCreateUserCart = async (userId) => {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
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
    const itemTotal = item.product.price.mul(item.quantity);
    subtotal = subtotal.plus(itemTotal);
    totalItems += item.quantity;

    return {
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        price: item.product.price.toFixed(2),
        imageUrl: item.product.imageUrl,
        category: item.product.category,
        isAvailable: item.product.isAvailable,
      },
      quantity: item.quantity,
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

    // Validate productId
    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    // Validate quantity: must be an integer > 0
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

    // Find product in DB (price is taken from DB only)
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

    const cart = await getOrCreateUserCart(req.user.id);

    // Atomically upsert cart item: increment quantity if exists, create if not
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

    // Validate quantity
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

    // Find item and verify ownership through cart -> user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    });

    if (!cartItem || cartItem.cart.userId !== req.user.id) {
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

    // Find item and verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    });

    if (!cartItem || cartItem.cart.userId !== req.user.id) {
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
      where: { userId: req.user.id },
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
