const { verifyToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required. Format: Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing'
      });
    }

    let decoded;

    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const userId = decoded?.id || decoded?.userId || decoded?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended.'
      });
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const normalizedUserRole = String(req.user.role || '').toUpperCase();
  const normalizedRoles = roles.map(r => String(r).toUpperCase());

  const roleMatches = normalizedRoles.some(r => {
    if (r === normalizedUserRole) return true;
    if (
      (r === 'DELIVERY' || r === 'DELIVERY_PARTNER') &&
      (normalizedUserRole === 'DELIVERY' || normalizedUserRole === 'DELIVERY_PARTNER')
    ) {
      return true;
    }
    return false;
  });

  if (!roleMatches) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: administrator privileges required.'
    });
  }

  next();
};

const requireAdmin = requireRole('ADMIN');

authMiddleware.requireRole = requireRole;
authMiddleware.requireAdmin = requireAdmin;

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.requireRole = requireRole;
module.exports.requireAdmin = requireAdmin;
