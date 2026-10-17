const { verifyToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
<<<<<<< HEAD
        message: 'Authorization token required. Format: Bearer <token>',
=======
        message: 'Authorization token required. Format: Bearer <token>'
>>>>>>> origin/main
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
<<<<<<< HEAD
        message: 'Authentication token missing',
=======
        message: 'Authentication token missing'
>>>>>>> origin/main
      });
    }

    let decoded;
<<<<<<< HEAD
=======

>>>>>>> origin/main
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
<<<<<<< HEAD
        message: 'Invalid or expired token',
=======
        message: 'Invalid or expired token'
>>>>>>> origin/main
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
<<<<<<< HEAD
        message: 'Invalid token payload',
=======
        message: 'Invalid token payload'
>>>>>>> origin/main
      });
    }

    const user = await prisma.user.findUnique({
<<<<<<< HEAD
      where: { id: decoded.id },
=======
      where: {
        id: decoded.id
      },
>>>>>>> origin/main
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
<<<<<<< HEAD
        campusId: true,
        createdAt: true,
        updatedAt: true,
      },
=======
        role: true,
        isActive: true
      }
>>>>>>> origin/main
    });

    if (!user) {
      return res.status(401).json({
        success: false,
<<<<<<< HEAD
        message: 'User no longer exists',
=======
        message: 'User no longer exists'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended.'
>>>>>>> origin/main
      });
    }

    req.user = user;
<<<<<<< HEAD
=======

>>>>>>> origin/main
    next();
  } catch (error) {
    next(error);
  }
};

<<<<<<< HEAD
module.exports = authMiddleware;
=======
module.exports = authMiddleware;
>>>>>>> origin/main
